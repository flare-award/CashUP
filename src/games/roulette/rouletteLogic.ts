import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export const EUROPEAN_WHEEL_ORDER: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteColor = 'green' | 'red' | 'black';

export function getPocketColor(num: number): RouletteColor {
  if (num === 0) return 'green';
  return RED_NUMBERS.has(num) ? 'red' : 'black';
}

export function getPocketColorRu(num: number): string {
  const c = getPocketColor(num);
  if (c === 'green') return 'Зеро (Зелёное)';
  return c === 'red' ? 'Красное' : 'Чёрное';
}

export type RouletteBetKey =
  | `num-${number}`
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low' // 1-18
  | 'high' // 19-36
  | 'dozen-1' // 1-12
  | 'dozen-2' // 13-24
  | 'dozen-3' // 25-36
  | 'col-1'
  | 'col-2'
  | 'col-3';

export type RouletteBetMap = Partial<Record<RouletteBetKey, number>>;

export function getBetMultiplier(key: RouletteBetKey): number {
  if (key.startsWith('num-')) return 36;
  if (key.startsWith('dozen-') || key.startsWith('col-')) return 3;
  return 2;
}

export function getBetLabelRu(key: RouletteBetKey): string {
  if (key.startsWith('num-')) return `Число ${key.slice(4)}`;
  switch (key) {
    case 'red':
      return 'Красное';
    case 'black':
      return 'Чёрное';
    case 'even':
      return 'Чётное';
    case 'odd':
      return 'Нечётное';
    case 'low':
      return '1–18';
    case 'high':
      return '19–36';
    case 'dozen-1':
      return '1-я дюжина (1–12)';
    case 'dozen-2':
      return '2-я дюжина (13–24)';
    case 'dozen-3':
      return '3-я дюжина (25–36)';
    case 'col-1':
      return '1-я колонна';
    case 'col-2':
      return '2-я колонна';
    case 'col-3':
      return '3-я колонна';
    default:
      return key;
  }
}

export function doesBetWin(key: RouletteBetKey, winningNumber: number): boolean {
  if (key.startsWith('num-')) {
    return Number(key.slice(4)) === winningNumber;
  }
  if (winningNumber === 0) return false;

  switch (key) {
    case 'red':
      return RED_NUMBERS.has(winningNumber);
    case 'black':
      return !RED_NUMBERS.has(winningNumber);
    case 'even':
      return winningNumber % 2 === 0;
    case 'odd':
      return winningNumber % 2 === 1;
    case 'low':
      return winningNumber >= 1 && winningNumber <= 18;
    case 'high':
      return winningNumber >= 19 && winningNumber <= 36;
    case 'dozen-1':
      return winningNumber >= 1 && winningNumber <= 12;
    case 'dozen-2':
      return winningNumber >= 13 && winningNumber <= 24;
    case 'dozen-3':
      return winningNumber >= 25 && winningNumber <= 36;
    case 'col-1':
      return winningNumber % 3 === 1;
    case 'col-2':
      return winningNumber % 3 === 2;
    case 'col-3':
      return winningNumber % 3 === 0;
    default:
      return false;
  }
}

export function computeTotalRouletteWager(bets: RouletteBetMap): number {
  return roundCurrency(
    Object.values(bets).reduce<number>((sum, val) => sum + (val && val > 0 ? val : 0), 0)
  );
}

/**
 * Computes maximum possible payout across all 37 pockets so the user sees potential win before spinning.
 */
export function computePotentialMaxPayout(bets: RouletteBetMap): number {
  const entries = Object.entries(bets).filter(([, v]) => (v ?? 0) > 0) as Array<
    [RouletteBetKey, number]
  >;
  if (entries.length === 0) return 0;

  let best = 0;
  for (let n = 0; n <= 36; n += 1) {
    let pocketPayout = 0;
    for (const [k, amt] of entries) {
      if (doesBetWin(k, n)) {
        pocketPayout += amt * getBetMultiplier(k);
      }
    }
    if (pocketPayout > best) best = pocketPayout;
  }
  return roundCurrency(best);
}

export function spinRouletteWheel(): number {
  return randomInt(0, 36);
}

export interface RouletteResolution {
  winningNumber: number;
  color: RouletteColor;
  totalWager: number;
  totalPayout: number;
  winningBets: string[];
}

export function evaluateRouletteBets(
  bets: RouletteBetMap,
  winningNumber: number
): RouletteResolution {
  const totalWager = computeTotalRouletteWager(bets);
  let totalPayout = 0;
  const winningBets: string[] = [];

  for (const [rawKey, amount] of Object.entries(bets)) {
    if (!amount || amount <= 0) continue;
    const key = rawKey as RouletteBetKey;
    if (doesBetWin(key, winningNumber)) {
      totalPayout += amount * getBetMultiplier(key);
      winningBets.push(getBetLabelRu(key));
    }
  }

  return {
    winningNumber,
    color: getPocketColor(winningNumber),
    totalWager,
    totalPayout: roundCurrency(totalPayout),
    winningBets,
  };
}
