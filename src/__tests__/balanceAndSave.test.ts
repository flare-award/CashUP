import { describe, expect, it } from 'vitest';
import {
  addWagerToRound,
  beginGameRound,
  claimEmergencyVirtualRefill,
  createNewProfile,
  EMERGENCY_REFILL_AMOUNT,
  reconcilePendingRoundsOnLoad,
  settleGameRound,
  STARTER_BALANCE,
  validateWager,
} from '../core/balance';
import { convertToUsd } from '../core/currency';
import {
  buildSaveFilename,
  createInitialSaveData,
  CURRENT_SAVE_VERSION,
  parseAndValidateSaveJson,
  serializeSaveData,
} from '../core/saveSchema';

describe('Centralized Balance ($10 USD Base), Transactions & Idempotency', () => {
  it('issues $10.00 starter balance exactly once on profile creation', () => {
    const p = createNewProfile('Alex', 'emerald-diamond');
    expect(p.balance).toBe(10);
    expect(p.balance).toBe(STARTER_BALANCE);
    expect(p.starterBonusClaimed).toBe(true);
    expect(p.ledger).toHaveLength(1);
    expect(p.ledger[0]?.type).toBe('starter_bonus');
  });

  it('rejects negative, zero, NaN, and over-balance wagers', () => {
    const p = createNewProfile('Tester', 'royal-crown');
    expect(validateWager(p, 0).ok).toBe(false);
    expect(validateWager(p, -2).ok).toBe(false);
    expect(validateWager(p, Number.NaN).ok).toBe(false);
    expect(validateWager(p, Number.POSITIVE_INFINITY).ok).toBe(false);
    expect(validateWager(p, 10.5).ok).toBe(false);
    expect(validateWager(p, 2.5).ok).toBe(true);
  });

  it('prevents double debit and double payout on the same roundId', () => {
    const p0 = createNewProfile('Guard', 'cyber-fox');
    const started = beginGameRound(p0, {
      roundId: 'rnd-unique-1',
      gameId: 'roulette',
      gameName: 'Европейская рулетка',
      wager: 1,
      mode: 'precomputed',
      precomputed: {
        payout: 2,
        multiplier: 2,
        outcome: 'win',
        summary: 'Выпало 17',
      },
    });
    expect(started.ok).toBe(true);
    expect(started.profile.balance).toBe(9);

    // Attempt duplicate start with same roundId
    const dupStart = beginGameRound(started.profile, {
      roundId: 'rnd-unique-1',
      gameId: 'roulette',
      gameName: 'Европейская рулетка',
      wager: 1,
      mode: 'precomputed',
    });
    expect(dupStart.ok).toBe(false);
    expect(dupStart.profile.balance).toBe(9);

    // Settle round once
    const settled = settleGameRound(started.profile, {
      roundId: 'rnd-unique-1',
      payout: 2,
      multiplier: 2,
      outcome: 'win',
      summary: 'Выпало 17',
    });
    expect(settled.ok).toBe(true);
    expect(settled.profile.balance).toBe(11);
    expect(settled.profile.stats.totalRounds).toBe(1);
    expect(settled.profile.stats.wins).toBe(1);

    // Attempt duplicate payout for already settled round
    const dupSettle = settleGameRound(settled.profile, {
      roundId: 'rnd-unique-1',
      payout: 2,
      multiplier: 2,
      outcome: 'win',
      summary: 'Выпало 17',
    });
    expect(dupSettle.ok).toBe(false);
    expect(dupSettle.alreadySettled).toBe(true);
    expect(dupSettle.profile.balance).toBe(11);
    expect(dupSettle.profile.stats.totalRounds).toBe(1);
  });

  it('reconciles interrupted precomputed rounds on reload without losing winnings', () => {
    const p0 = createNewProfile('ReloadUser', 'golden-dice');
    const started = beginGameRound(p0, {
      roundId: 'rnd-mid-anim',
      gameId: 'slots',
      gameName: 'Однорукий бандит',
      wager: 0.5,
      mode: 'precomputed',
      precomputed: {
        payout: 3.5,
        multiplier: 7,
        outcome: 'win',
        summary: 'Три Колокольчика (x7)',
      },
    });
    expect(started.profile.balance).toBe(9.5);

    // Simulate browser reload mid-animation
    const reconciled = reconcilePendingRoundsOnLoad(started.profile);
    expect(reconciled.settledCount).toBe(1);
    expect(reconciled.profile.balance).toBe(13);
    expect(reconciled.profile.stats.totalRounds).toBe(1);

    // Second reload must not re-credit
    const secondReload = reconcilePendingRoundsOnLoad(reconciled.profile);
    expect(secondReload.settledCount).toBe(0);
    expect(secondReload.profile.balance).toBe(13);
  });

  it('supports addon wagers (Double Down / Raise) and refill only below minimum threshold', () => {
    let p = createNewProfile('HighRoller', 'sapphire-shield');
    expect(claimEmergencyVirtualRefill(p).ok).toBe(false);

    const r1 = beginGameRound(p, {
      roundId: 'bj-1',
      gameId: 'blackjack',
      gameName: 'Блэкджек',
      wager: 5,
      mode: 'interactive',
      interactiveState: { step: 1 },
    });
    const addon = addWagerToRound(r1.profile, 'bj-1', 5, 'Double Down');
    expect(addon.ok).toBe(true);
    expect(addon.totalWager).toBe(10);
    expect(addon.profile.balance).toBe(0);

    // Cannot claim refill while round is still active
    expect(claimEmergencyVirtualRefill(addon.profile).ok).toBe(false);

    // Lose the round -> balance 0, no active rounds -> refill succeeds
    const lost = settleGameRound(addon.profile, {
      roundId: 'bj-1',
      payout: 0,
      multiplier: null,
      outcome: 'loss',
      summary: 'Перебор',
    });
    p = lost.profile;
    expect(p.balance).toBe(0);

    const refilled = claimEmergencyVirtualRefill(p);
    expect(refilled.ok).toBe(true);
    expect(refilled.profile.balance).toBe(EMERGENCY_REFILL_AMOUNT);
  });
});

describe('JSON Save Export, Import, Validation & Migration', () => {
  it('builds proper save filename and round-trips full multi-profile state', () => {
    const filename = buildSaveFilename(new Date('2026-11-12T10:00:00Z'));
    expect(filename).toBe('CashUP_Save_2026-11-12.json');

    const base = createInitialSaveData();
    const p1 = createNewProfile('Alpha', 'emerald-diamond', []);
    const p2 = createNewProfile('Bravo', 'royal-crown', [p1.id]);

    const saveObj = {
      ...base,
      activeProfileId: p2.id,
      profiles: [p1, p2],
      settings: {
        ...base.settings,
        theme: 'light' as const,
        currency: 'EUR' as const,
      },
    };

    const json = serializeSaveData(saveObj);
    const parsed = parseAndValidateSaveJson(json);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.saveVersion).toBe(CURRENT_SAVE_VERSION);
      expect(parsed.data.profiles).toHaveLength(2);
      expect(parsed.data.activeProfileId).toBe(p2.id);
      expect(parsed.data.settings.theme).toBe('light');
      expect(parsed.data.settings.currency).toBe('EUR');
    }
  });

  it('migrates legacy v1 save format to v3 USD base automatically', () => {
    const legacyV1 = JSON.stringify({
      app: 'CashUP',
      saveVersion: 1,
      createdAt: '2026-01-10T12:00:00.000Z',
      profiles: [
        {
          id: 'CUP-OLD1-0001',
          nickname: 'LegacyPlayer',
          avatarId: 'mint-clover',
          balance: 960,
        },
      ],
    });

    const res = parseAndValidateSaveJson(legacyV1);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.preview.migratedFromVersion).toBe(1);
      expect(res.data.saveVersion).toBe(CURRENT_SAVE_VERSION);
      expect(res.data.profiles[0]?.balance).toBe(convertToUsd(960, 'RUB'));
    }
  });

  it('rejects malformed JSON, negative balances, and alien files cleanly', () => {
    expect(parseAndValidateSaveJson('{broken json').ok).toBe(false);
    expect(
      parseAndValidateSaveJson(JSON.stringify({ app: 'OtherApp', saveVersion: 3 })).ok
    ).toBe(false);

    const negativeBalanceSave = JSON.stringify({
      app: 'CashUP',
      saveVersion: CURRENT_SAVE_VERSION,
      exportedAt: '2026-11-12T12:00:00.000Z',
      activeProfileId: 'CUP-BAD1-0001',
      profiles: [
        {
          ...createNewProfile('Hacker', 'cyber-fox'),
          id: 'CUP-BAD1-0001',
          balance: -500,
        },
      ],
      settings: createInitialSaveData().settings,
    });
    expect(parseAndValidateSaveJson(negativeBalanceSave).ok).toBe(false);
  });
});
