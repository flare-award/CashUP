import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export type DiceBetType =
  | 'under7'
  | 'exact7'
  | 'over7'
  | 'even'
  | 'odd'
  | 'doubles'
  | `sum-${number}`;

export interface DiceBetInfo {
  key: DiceBetType;
  label: string;
  waysOutOf36: number;
  probabilityPct: number;
  multiplier: number;
}

const SUM_WAYS: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

const SUM_MULTIPLIERS: Record<number, number> = {
  2: 34,
  3: 17,
  4: 11.4,
  5: 8.5,
  6: 6.8,
  7: 5.7,
  8: 6.8,
  9: 8.5,
  10: 11.4,
  11: 17,
  12: 34,
};

export function getDiceBetInfo(bet: DiceBetType): DiceBetInfo {
  if (bet.startsWith('sum-')) {
    const target = Number(bet.slice(4));
    const ways = SUM_WAYS[target] ?? 1;
    return {
      key: bet,
      label: `Точная сумма ${target}`,
      waysOutOf36: ways,
      probabilityPct: Math.round((ways / 36) * 10000) / 100,
      multiplier: SUM_MULTIPLIERS[target] ?? 5,
    };
  }

  switch (bet) {
    case 'under7':
      return {
        key: bet,
        label: 'Меньше 7 (2–6)',
        waysOutOf36: 15,
        probabilityPct: 41.67,
        multiplier: 2.3,
      };
    case 'exact7':
      return {
        key: bet,
        label: 'Ровно 7',
        waysOutOf36: 6,
        probabilityPct: 16.67,
        multiplier: 5.7,
      };
    case 'over7':
      return {
        key: bet,
        label: 'Больше 7 (8–12)',
        waysOutOf36: 15,
        probabilityPct: 41.67,
        multiplier: 2.3,
      };
    case 'even':
      return {
        key: bet,
        label: 'Чётная сумма',
        waysOutOf36: 18,
        probabilityPct: 50.0,
        multiplier: 1.95,
      };
    case 'odd':
      return {
        key: bet,
        label: 'Нечётная сумма',
        waysOutOf36: 18,
        probabilityPct: 50.0,
        multiplier: 1.95,
      };
    case 'doubles':
    default:
      return {
        key: bet,
        label: 'Дубль (парные кости)',
        waysOutOf36: 6,
        probabilityPct: 16.67,
        multiplier: 5.7,
      };
  }
}

export function doesDiceBetWin(bet: DiceBetType, die1: number, die2: number): boolean {
  const sum = die1 + die2;
  if (bet.startsWith('sum-')) {
    return sum === Number(bet.slice(4));
  }
  switch (bet) {
    case 'under7':
      return sum < 7;
    case 'exact7':
      return sum === 7;
    case 'over7':
      return sum > 7;
    case 'even':
      return sum % 2 === 0;
    case 'odd':
      return sum % 2 === 1;
    case 'doubles':
    default:
      return die1 === die2;
  }
}

export interface DiceRollResult {
  die1: number;
  die2: number;
  sum: number;
  won: boolean;
  multiplier: number;
  payout: number;
  summary: string;
}

export function rollDiceRound(bet: DiceBetType, wager: number): DiceRollResult {
  const die1 = randomInt(1, 6);
  const die2 = randomInt(1, 6);
  const sum = die1 + die2;
  const info = getDiceBetInfo(bet);
  const won = doesDiceBetWin(bet, die1, die2);
  const multiplier = won ? info.multiplier : 0;
  const payout = roundCurrency(wager * multiplier);

  return {
    die1,
    die2,
    sum,
    won,
    multiplier,
    payout,
    summary: `Кубики ${die1} + ${die2} = ${sum} · ${info.label}`,
  };
}
