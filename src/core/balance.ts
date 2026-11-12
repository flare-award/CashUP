import {
  AvatarId,
  BalanceLedgerEntry,
  GameHistoryEntry,
  GameId,
  PendingRound,
  PerGameStats,
  PrecomputedResolution,
  ProfileStats,
  RoundOutcomeType,
  UserProfile,
} from '../types';
import { roundCurrency } from './currency';
import { generateId, generateProfileId } from './rng';

export const STARTER_BALANCE = 1000;
export const EMERGENCY_REFILL_AMOUNT = 250;
const MAX_HISTORY_ITEMS = 500;
const MAX_LEDGER_ITEMS = 500;
const MAX_SETTLED_IDS = 600;

export function createEmptyStats(): ProfileStats {
  return {
    totalRounds: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLossStreak: 0,
    longestLossStreak: 0,
    perGame: {},
  };
}

export function createNewProfile(
  nickname: string,
  avatarId: AvatarId,
  existingIds: readonly string[] = [],
  nowIso: string = new Date().toISOString()
): UserProfile {
  const cleanName = nickname.trim().slice(0, 28) || 'Игрок';
  let id = generateProfileId();
  while (existingIds.includes(id)) {
    id = generateProfileId();
  }

  const starterEntry: BalanceLedgerEntry = {
    id: generateId('ldg'),
    timestamp: nowIso,
    type: 'starter_bonus',
    amount: STARTER_BALANCE,
    balanceAfter: STARTER_BALANCE,
    description: 'Единоразовый стартовый виртуальный баланс',
  };

  return {
    id,
    nickname: cleanName,
    avatarId,
    createdAt: nowIso,
    balance: STARTER_BALANCE,
    starterBonusClaimed: true,
    favoriteGames: ['roulette', 'slots', 'blackjack'],
    recentGames: [],
    stats: createEmptyStats(),
    history: [],
    ledger: [starterEntry],
    pendingRounds: {},
    settledRoundIds: [],
  };
}

export interface WagerValidationResult {
  ok: boolean;
  amount: number;
  error?: string;
}

export function validateWager(profile: UserProfile, rawWager: number): WagerValidationResult {
  if (typeof rawWager !== 'number' || !Number.isFinite(rawWager)) {
    return { ok: false, amount: 0, error: 'Некорректная сумма виртуальной ставки.' };
  }
  const amount = roundCurrency(rawWager);
  if (amount <= 0) {
    return { ok: false, amount: 0, error: 'Ставка должна быть больше нуля.' };
  }
  if (amount > profile.balance) {
    return { ok: false, amount, error: 'Недостаточно виртуальных средств на балансе.' };
  }
  return { ok: true, amount };
}

export interface BeginRoundParams {
  roundId?: string;
  gameId: GameId;
  gameName: string;
  wager: number;
  mode: 'precomputed' | 'interactive';
  precomputed?: PrecomputedResolution;
  interactiveState?: unknown;
  nowIso?: string;
}

export interface BeginRoundResult {
  ok: boolean;
  roundId: string;
  profile: UserProfile;
  error?: string;
}

export function beginGameRound(profile: UserProfile, params: BeginRoundParams): BeginRoundResult {
  const roundId = params.roundId ?? generateId('rnd');
  const nowIso = params.nowIso ?? new Date().toISOString();

  if (profile.pendingRounds[roundId] || profile.settledRoundIds.includes(roundId)) {
    return {
      ok: false,
      roundId,
      profile,
      error: 'Этот раунд уже зарегистрирован.',
    };
  }

  const validation = validateWager(profile, params.wager);
  if (!validation.ok) {
    return {
      ok: false,
      roundId,
      profile,
      error: validation.error,
    };
  }

  const wager = validation.amount;
  const newBalance = Math.max(0, roundCurrency(profile.balance - wager));

  const debitEntry: BalanceLedgerEntry = {
    id: generateId('ldg'),
    timestamp: nowIso,
    type: 'wager_debit',
    amount: -wager,
    balanceAfter: newBalance,
    gameId: params.gameId,
    roundId,
    description: `Ставка в игре «${params.gameName}»`,
  };

  const pendingRound: PendingRound = {
    roundId,
    gameId: params.gameId,
    gameName: params.gameName,
    wager,
    createdAt: nowIso,
    mode: params.mode,
    precomputed: params.precomputed,
    interactiveState: params.interactiveState,
  };

  const recentGames: GameId[] = [
    params.gameId,
    ...profile.recentGames.filter((g) => g !== params.gameId),
  ].slice(0, 10);

  return {
    ok: true,
    roundId,
    profile: {
      ...profile,
      balance: newBalance,
      recentGames,
      ledger: [debitEntry, ...profile.ledger].slice(0, MAX_LEDGER_ITEMS),
      pendingRounds: {
        ...profile.pendingRounds,
        [roundId]: pendingRound,
      },
    },
  };
}

export interface AddWagerResult {
  ok: boolean;
  profile: UserProfile;
  totalWager: number;
  error?: string;
}

export function addWagerToRound(
  profile: UserProfile,
  roundId: string,
  extraWager: number,
  reason: string,
  nowIso: string = new Date().toISOString()
): AddWagerResult {
  const pending = profile.pendingRounds[roundId];
  if (!pending) {
    return { ok: false, profile, totalWager: 0, error: 'Активный раунд не найден.' };
  }
  if (profile.settledRoundIds.includes(roundId)) {
    return { ok: false, profile, totalWager: pending.wager, error: 'Раунд уже завершён.' };
  }

  const validation = validateWager(profile, extraWager);
  if (!validation.ok) {
    return { ok: false, profile, totalWager: pending.wager, error: validation.error };
  }

  const delta = validation.amount;
  const newBalance = Math.max(0, roundCurrency(profile.balance - delta));
  const updatedWager = roundCurrency(pending.wager + delta);

  const addonEntry: BalanceLedgerEntry = {
    id: generateId('ldg'),
    timestamp: nowIso,
    type: 'wager_addon',
    amount: -delta,
    balanceAfter: newBalance,
    gameId: pending.gameId,
    roundId,
    description: `${reason} («${pending.gameName}»)`,
  };

  return {
    ok: true,
    totalWager: updatedWager,
    profile: {
      ...profile,
      balance: newBalance,
      ledger: [addonEntry, ...profile.ledger].slice(0, MAX_LEDGER_ITEMS),
      pendingRounds: {
        ...profile.pendingRounds,
        [roundId]: {
          ...pending,
          wager: updatedWager,
        },
      },
    },
  };
}

export function updateInteractiveRoundState(
  profile: UserProfile,
  roundId: string,
  interactiveState: unknown
): UserProfile {
  const pending = profile.pendingRounds[roundId];
  if (!pending) return profile;
  return {
    ...profile,
    pendingRounds: {
      ...profile.pendingRounds,
      [roundId]: {
        ...pending,
        interactiveState,
      },
    },
  };
}

export interface SettleRoundParams {
  roundId: string;
  payout: number;
  multiplier: number | null;
  outcome: RoundOutcomeType;
  summary: string;
  nowIso?: string;
}

export interface SettleRoundResult {
  ok: boolean;
  alreadySettled?: boolean;
  profile: UserProfile;
  entry?: GameHistoryEntry;
  error?: string;
}

export function settleGameRound(
  profile: UserProfile,
  params: SettleRoundParams
): SettleRoundResult {
  const { roundId } = params;
  const nowIso = params.nowIso ?? new Date().toISOString();

  if (profile.settledRoundIds.includes(roundId)) {
    return {
      ok: false,
      alreadySettled: true,
      profile,
      error: 'Раунд уже был рассчитан ранее.',
    };
  }

  const pending = profile.pendingRounds[roundId];
  if (!pending) {
    return {
      ok: false,
      profile,
      error: 'Не найден активный раунд для расчёта.',
    };
  }

  const safePayout = Number.isFinite(params.payout)
    ? Math.max(0, roundCurrency(params.payout))
    : 0;
  const newBalance = roundCurrency(profile.balance + safePayout);
  const netChange = roundCurrency(safePayout - pending.wager);

  let nextLedger = profile.ledger;
  if (safePayout > 0) {
    const isRefund = params.outcome === 'push' && safePayout === pending.wager;
    const creditEntry: BalanceLedgerEntry = {
      id: generateId('ldg'),
      timestamp: nowIso,
      type: isRefund ? 'round_refund' : 'round_payout',
      amount: safePayout,
      balanceAfter: newBalance,
      gameId: pending.gameId,
      roundId,
      description: isRefund
        ? `Возврат ставки в «${pending.gameName}»`
        : `Выигрыш в «${pending.gameName}»`,
    };
    nextLedger = [creditEntry, ...profile.ledger].slice(0, MAX_LEDGER_ITEMS);
  }

  const historyEntry: GameHistoryEntry = {
    id: roundId,
    gameId: pending.gameId,
    gameName: pending.gameName,
    timestamp: nowIso,
    wager: pending.wager,
    payout: safePayout,
    netChange,
    balanceAfter: newBalance,
    multiplier:
      params.multiplier !== null && Number.isFinite(params.multiplier)
        ? Math.round(params.multiplier * 100) / 100
        : null,
    outcome: params.outcome,
    summary: params.summary,
  };

  const nextPending = { ...profile.pendingRounds };
  delete nextPending[roundId];

  const nextStats = computeUpdatedStats(profile.stats, pending, historyEntry, nowIso);

  return {
    ok: true,
    entry: historyEntry,
    profile: {
      ...profile,
      balance: newBalance,
      ledger: nextLedger,
      history: [historyEntry, ...profile.history].slice(0, MAX_HISTORY_ITEMS),
      stats: nextStats,
      pendingRounds: nextPending,
      settledRoundIds: [roundId, ...profile.settledRoundIds].slice(0, MAX_SETTLED_IDS),
    },
  };
}

function computeUpdatedStats(
  stats: ProfileStats,
  pending: PendingRound,
  entry: GameHistoryEntry,
  nowIso: string
): ProfileStats {
  const isWin = entry.outcome === 'win';
  const isLoss = entry.outcome === 'loss';
  const isPush = entry.outcome === 'push';

  const currentWinStreak = isWin
    ? stats.currentWinStreak + 1
    : isPush
      ? stats.currentWinStreak
      : 0;
  const currentLossStreak = isLoss
    ? stats.currentLossStreak + 1
    : isPush
      ? stats.currentLossStreak
      : 0;

  const prevGame: PerGameStats = stats.perGame[pending.gameId] ?? {
    rounds: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    wagered: 0,
    won: 0,
    biggestWin: 0,
    lastPlayedAt: nowIso,
  };

  const nextGame: PerGameStats = {
    rounds: prevGame.rounds + 1,
    wins: prevGame.wins + (isWin ? 1 : 0),
    losses: prevGame.losses + (isLoss ? 1 : 0),
    pushes: prevGame.pushes + (isPush ? 1 : 0),
    wagered: roundCurrency(prevGame.wagered + pending.wager),
    won: roundCurrency(prevGame.won + entry.payout),
    biggestWin: Math.max(prevGame.biggestWin, isWin ? entry.payout : 0),
    lastPlayedAt: nowIso,
  };

  return {
    totalRounds: stats.totalRounds + 1,
    wins: stats.wins + (isWin ? 1 : 0),
    losses: stats.losses + (isLoss ? 1 : 0),
    pushes: stats.pushes + (isPush ? 1 : 0),
    totalWagered: roundCurrency(stats.totalWagered + pending.wager),
    totalWon: roundCurrency(stats.totalWon + entry.payout),
    biggestWin: Math.max(stats.biggestWin, isWin ? entry.payout : 0),
    currentWinStreak,
    longestWinStreak: Math.max(stats.longestWinStreak, currentWinStreak),
    currentLossStreak,
    longestLossStreak: Math.max(stats.longestLossStreak, currentLossStreak),
    perGame: {
      ...stats.perGame,
      [pending.gameId]: nextGame,
    },
  };
}

/**
 * Reconciles interrupted rounds when the app reloads after being closed mid-animation.
 * - Precomputed rounds settle their exact pre-determined result once.
 * - Interactive rounds with valid saved state stay active so the player can resume.
 * - Interactive rounds missing state safely refund their wager once.
 */
export function reconcilePendingRoundsOnLoad(
  profile: UserProfile,
  nowIso: string = new Date().toISOString()
): { profile: UserProfile; settledCount: number } {
  let current = profile;
  let settledCount = 0;

  for (const round of Object.values(profile.pendingRounds)) {
    if (round.mode === 'precomputed' && round.precomputed) {
      const res = settleGameRound(current, {
        roundId: round.roundId,
        payout: round.precomputed.payout,
        multiplier: round.precomputed.multiplier,
        outcome: round.precomputed.outcome,
        summary: `${round.precomputed.summary} (авторасчёт после перезагрузки)`,
        nowIso,
      });
      if (res.ok) {
        current = res.profile;
        settledCount += 1;
      }
    } else if (round.mode === 'interactive' && round.interactiveState === undefined) {
      const res = settleGameRound(current, {
        roundId: round.roundId,
        payout: round.wager,
        multiplier: 1,
        outcome: 'push',
        summary: 'Возврат ставки незавершённого раунда',
        nowIso,
      });
      if (res.ok) {
        current = res.profile;
        settledCount += 1;
      }
    }
  }

  return { profile: current, settledCount };
}

export function claimEmergencyVirtualRefill(
  profile: UserProfile,
  nowIso: string = new Date().toISOString()
): { ok: boolean; profile: UserProfile; error?: string } {
  if (Object.keys(profile.pendingRounds).length > 0) {
    return {
      ok: false,
      profile,
      error: 'Завершите активный раунд перед пополнением.',
    };
  }
  if (profile.balance >= 1) {
    return {
      ok: false,
      profile,
      error: 'Резервное пополнение доступно только при балансе меньше 1 виртуальной единицы.',
    };
  }

  const nextBalance = roundCurrency(profile.balance + EMERGENCY_REFILL_AMOUNT);
  const entry: BalanceLedgerEntry = {
    id: generateId('ldg'),
    timestamp: nowIso,
    type: 'emergency_refill',
    amount: EMERGENCY_REFILL_AMOUNT,
    balanceAfter: nextBalance,
    description: 'Резервное восстановление виртуального баланса',
  };

  return {
    ok: true,
    profile: {
      ...profile,
      balance: nextBalance,
      ledger: [entry, ...profile.ledger].slice(0, MAX_LEDGER_ITEMS),
    },
  };
}
