import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export type PlinkoRisk = 'low' | 'medium' | 'high';
export type PlinkoRowCount = 8 | 10 | 12 | 14 | 16;

export const PLINKO_MULTIPLIERS: Record<
  PlinkoRisk,
  Record<PlinkoRowCount, readonly number[]>
> = {
  low: {
    8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    12: [10, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10],
    14: [7.1, 4.0, 1.9, 1.4, 1.3, 1.1, 1.0, 0.5, 1.0, 1.1, 1.3, 1.4, 1.9, 4.0, 7.1],
    16: [
      16, 9.0, 2.0, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2.0,
      9.0, 16,
    ],
  },
  medium: {
    8: [13, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13],
    10: [22, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22],
    12: [33, 11, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11, 33],
    14: [58, 15, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15, 58],
    16: [
      110, 41, 10, 5.0, 3.0, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3.0, 5.0, 10, 41,
      110,
    ],
  },
  high: {
    8: [29, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29],
    10: [76, 10, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10, 76],
    12: [170, 24, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24, 170],
    14: [
      420, 56, 18, 5.0, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5.0, 18, 56, 420,
    ],
    16: [
      500, 130, 26, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26,
      130, 500,
    ],
  },
};

export interface PlinkoDropOutcome {
  directions: Array<0 | 1>; // 0 = left, 1 = right for each row
  bucketIndex: number;
  multiplier: number;
  payout: number;
}

export function computePlinkoDrop(
  rows: PlinkoRowCount,
  risk: PlinkoRisk,
  wager: number
): PlinkoDropOutcome {
  const directions: Array<0 | 1> = Array.from({ length: rows }, () =>
    randomInt(0, 1) as 0 | 1
  );
  const bucketIndex = directions.reduce<number>((sum, bit) => sum + bit, 0);
  const table = PLINKO_MULTIPLIERS[risk][rows];
  const multiplier = table[bucketIndex] ?? 1;
  const payout = roundCurrency(wager * multiplier);

  return {
    directions,
    bucketIndex,
    multiplier,
    payout,
  };
}
