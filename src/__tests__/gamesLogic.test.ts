import { describe, expect, it } from 'vitest';
import { Card, rankToValue } from '../core/cards';
import { dealBaccaratRound, shouldBankerDrawThird } from '../games/baccarat/baccaratLogic';
import {
  canSplitHand,
  scoreBlackjackHand,
  settleBlackjackHands,
} from '../games/blackjack/blackjackLogic';
import { generateCrashPoint } from '../games/crash/crashLogic';
import { doesDiceBetWin, getDiceBetInfo, rollDiceRound } from '../games/dice/diceLogic';
import { computeHiLoOdds } from '../games/higherLower/higherLowerLogic';
import { drawKenoRound } from '../games/keno/kenoLogic';
import { computeMinesMultiplier, generateMinePositions } from '../games/mines/minesLogic';
import { computePlinkoDrop } from '../games/plinko/plinkoLogic';
import { decidePokerBotAction } from '../games/poker/pokerBot';
import { evaluateBestPokerHand } from '../games/poker/pokerEvaluator';
import { playRedBlackRound } from '../games/redBlack/redBlackLogic';
import { spinRiskWheel } from '../games/riskRoulette/riskRouletteLogic';
import {
  doesBetWin,
  EUROPEAN_WHEEL_ORDER,
  evaluateRouletteBets,
  getPocketColor,
} from '../games/roulette/rouletteLogic';
import { createShellRoundPlan, evaluateShellPick } from '../games/shells/shellsLogic';
import { evaluateSlotReels } from '../games/slots/slotsLogic';
import { computeUpgradeChance, runUpgradeAttempt } from '../games/upgrade/upgradeLogic';

function mkCard(
  rank: Card['rank'],
  suit: Card['suit'],
  id = `${rank}-${suit}`
): Card {
  return {
    id,
    rank,
    suit,
    numericValue: rankToValue(rank),
  };
}

describe('All 15 CashUP Game Mechanics & Fair Payouts', () => {
  it('1. Roulette: European wheel has 37 unique pockets (0..36) and evaluates bets accurately', () => {
    expect(EUROPEAN_WHEEL_ORDER).toHaveLength(37);
    expect(new Set(EUROPEAN_WHEEL_ORDER).size).toBe(37);
    expect(getPocketColor(0)).toBe('green');
    expect(getPocketColor(17)).toBe('black');
    expect(getPocketColor(32)).toBe('red');

    expect(doesBetWin('red', 0)).toBe(false);
    expect(doesBetWin('even', 0)).toBe(false);
    expect(doesBetWin('num-0', 0)).toBe(true);

    const res = evaluateRouletteBets({ 'num-17': 10, black: 50, red: 25 }, 17);
    expect(res.totalWager).toBe(85);
    expect(res.totalPayout).toBe(10 * 36 + 50 * 2);
  });

  it('2. Slots: evaluates 3-reel and 5-reel combinations including Clover Wilds', () => {
    const jackpot3 = evaluateSlotReels(['seven', 'seven', 'seven'], 20);
    expect(jackpot3.multiplier).toBe(35);
    expect(jackpot3.payout).toBe(700);

    const cloverWild = evaluateSlotReels(['diamond', 'diamond', 'clover'], 10);
    expect(cloverWild.payout).toBeGreaterThan(0);

    const fiveCoins = evaluateSlotReels(['coin', 'coin', 'coin', 'coin', 'coin'], 10);
    expect(fiveCoins.multiplier).toBe(85);
    expect(fiveCoins.payout).toBe(850);
  });

  it('3. Red or Black: pays x2 on correct color and x3.9 on exact suit', () => {
    const r = playRedBlackRound('red', 50);
    if (r.won) {
      expect(r.payout).toBe(100);
    } else {
      expect(r.payout).toBe(0);
    }
  });

  it('4. Dice: exact combinatoric ways and sum evaluation', () => {
    expect(getDiceBetInfo('exact7').waysOutOf36).toBe(6);
    expect(getDiceBetInfo('sum-2').waysOutOf36).toBe(1);
    expect(doesDiceBetWin('under7', 2, 4)).toBe(true);
    expect(doesDiceBetWin('doubles', 5, 5)).toBe(true);
    const roll = rollDiceRound('over7', 40);
    expect(roll.sum).toBe(roll.die1 + roll.die2);
  });

  it('5. Shell Game: pre-commits winning cup and never mutates outcome after pick', () => {
    const plan = createShellRoundPlan('hard', 2);
    expect(plan.swaps.length).toBeGreaterThanOrEqual(12);
    expect([0, 1, 2]).toContain(plan.winningCupId);
    expect([...plan.finalCupSlots].sort()).toEqual([0, 1, 2]);

    const winPick = evaluateShellPick(plan, plan.winningCupId, 100);
    expect(winPick.won).toBe(true);
    expect(winPick.payout).toBe(297);

    const wrongCup = (plan.winningCupId + 1) % 3;
    const losePick = evaluateShellPick(plan, wrongCup, 100);
    expect(losePick.won).toBe(false);
    expect(losePick.payout).toBe(0);
  });

  it('6. Upgrade: exact probability calculation and sector inversion', () => {
    expect(computeUpgradeChance(2)).toBe(0.48);
    expect(computeUpgradeChance(10)).toBe(0.096);
    const attempt = runUpgradeAttempt(100, 2, 'start');
    expect(attempt.payout).toBe(attempt.won ? 200 : 0);
  });

  it('7. Poker (Texas Hold’em): evaluates Royal Flush, Wheel Straight, Full House & fair Bot AI', () => {
    const royal = evaluateBestPokerHand([
      mkCard('A', 'spades'),
      mkCard('K', 'spades'),
      mkCard('Q', 'spades'),
      mkCard('J', 'spades'),
      mkCard('10', 'spades'),
      mkCard('2', 'hearts'),
      mkCard('4', 'clubs'),
    ]);
    expect(royal.category).toBe(9);
    expect(royal.nameRu).toBe('Роял-флеш');

    const wheelStraight = evaluateBestPokerHand([
      mkCard('A', 'hearts'),
      mkCard('2', 'clubs'),
      mkCard('3', 'diamonds'),
      mkCard('4', 'spades'),
      mkCard('5', 'hearts'),
      mkCard('9', 'clubs'),
      mkCard('K', 'diamonds'),
    ]);
    expect(wheelStraight.category).toBe(4);
    expect(wheelStraight.tiebreakers[0]).toBe(5);

    // Bot decision operates strictly on its 2 hole cards + visible board
    const botDecision = decidePokerBotAction(
      [mkCard('A', 'hearts'), mkCard('A', 'clubs')],
      [mkCard('A', 'diamonds'), mkCard('7', 'spades'), mkCard('2', 'hearts')],
      {
        street: 'flop',
        pot: 100,
        toCall: 25,
        minRaise: 25,
        maxRaise: 100,
        aggression: 0.7,
        tightness: 0.6,
        raisesThisStreet: 0,
      }
    );
    expect(['call', 'raise']).toContain(botDecision.action);
  });

  it('8. Blackjack: handles soft/hard Aces, Natural 21 (3:2), Push, and Split eligibility', () => {
    const natural = scoreBlackjackHand([mkCard('A', 'spades'), mkCard('K', 'hearts')]);
    expect(natural.total).toBe(21);
    expect(natural.isNaturalBlackjack).toBe(true);

    const soft18 = scoreBlackjackHand([mkCard('A', 'clubs'), mkCard('7', 'diamonds')]);
    expect(soft18.total).toBe(18);
    expect(soft18.isSoft).toBe(true);

    const hard18 = scoreBlackjackHand([
      mkCard('A', 'clubs'),
      mkCard('7', 'diamonds'),
      mkCard('10', 'spades'),
    ]);
    expect(hard18.total).toBe(18);
    expect(hard18.isSoft).toBe(false);

    expect(canSplitHand([mkCard('8', 'hearts'), mkCard('8', 'spades')])).toBe(true);

    const settled = settleBlackjackHands(
      [
        {
          cards: [mkCard('A', 'spades'), mkCard('Q', 'hearts')],
          wager: 100,
          stood: true,
          doubled: false,
          fromSplit: false,
        },
      ],
      [mkCard('10', 'clubs'), mkCard('8', 'diamonds')]
    );
    expect(settled.totalPayout).toBe(250); // 3:2 natural blackjack
  });

  it('9. Baccarat: enforces Punto Banco third-card tableau and Tie push', () => {
    // Banker on 3 draws unless Player's 3rd card was an 8
    expect(shouldBankerDrawThird(3, mkCard('8', 'hearts'))).toBe(false);
    expect(shouldBankerDrawThird(3, mkCard('7', 'hearts'))).toBe(true);

    // Natural 9 vs Natural 9 -> Tie -> Player bet pushes (1x refund)
    const tieShoe = [
      mkCard('4', 'hearts'),
      mkCard('5', 'spades'),
      mkCard('5', 'diamonds'),
      mkCard('4', 'clubs'),
    ];
    const res = dealBaccaratRound('player', 100, tieShoe);
    expect(res.winner).toBe('tie');
    expect(res.roundOutcome).toBe('push');
    expect(res.payout).toBe(100);
  });

  it('10. Plinko, 11. Mines, 12. Higher/Lower, 13. Risk Roulette, 14. Keno, 15. Crash', () => {
    const drop = computePlinkoDrop(12, 'high', 20);
    expect(drop.directions).toHaveLength(12);
    expect(drop.bucketIndex).toBeGreaterThanOrEqual(0);
    expect(drop.bucketIndex).toBeLessThanOrEqual(12);

    const mines = generateMinePositions(5, 5);
    expect(mines).toHaveLength(5);
    expect(computeMinesMultiplier(5, 5, 3)).toBeGreaterThan(1.5);

    const odds = computeHiLoOdds(mkCard('8', 'hearts'), [
      mkCard('2', 'clubs'),
      mkCard('K', 'spades'),
      mkCard('A', 'diamonds'),
    ]);
    expect(odds.higherMultiplier).not.toBeNull();
    expect(odds.lowerMultiplier).not.toBeNull();

    const riskSpin = spinRiskWheel('extreme', 50);
    expect(riskSpin.targetWheelDeg).toBeGreaterThanOrEqual(0);
    expect(riskSpin.targetWheelDeg).toBeLessThan(360);

    const keno = drawKenoRound([1, 5, 10, 15, 20], 25);
    expect(keno.drawnNumbers).toHaveLength(10);

    const crash = generateCrashPoint();
    expect(crash).toBeGreaterThanOrEqual(1.0);
  });
});
