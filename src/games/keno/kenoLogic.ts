import { roundCurrency } from '../../core/currency';
import { cryptoShuffle } from '../../core/rng';

/**
 * Payout multipliers indexed by [pickedCount (1..10)][hitsCount (0..pickedCount)]
 * calibrated for a 40-ball Keno board (10 balls drawn).
 */
export const KENO_PAYTABLE: Record<number, readonly number[]> = {
  1: [0, 3.8],
  2: [0, 1.7, 9.0],
  3: [0, 1.0, 2.8, 26],
  4: [0, 0.5, 2.2, 8.0, 65],
  5: [0, 0.4, 1.5, 4.2, 18, 120],
  6: [0, 0, 1.1, 3.0, 11, 45, 220],
  7: [0, 0, 0.8, 2.2, 7.0, 24, 95, 320],
  8: [0, 0, 0.5, 1.8, 4.5, 14, 52, 160, 420],
  9: [0, 0, 0.5, 1.4, 3.2, 9.0, 30, 90, 240, 500],
  10: [0, 0, 0.4, 1.2, 2.5, 6.5, 18, 60, 150, 350, 600],
};

export interface KenoDrawResult {
  drawnNumbers: number[];
  hits: number[];
  multiplier: number;
  payout: number;
  summary: string;
}

export function drawKenoRound(
  selectedNumbers: readonly number[],
  wager: number
): KenoDrawResult {
  const pool = Array.from({ length: 40 }, (_, i) => i + 1);
  const drawnNumbers = cryptoShuffle(pool).slice(0, 10);
  const selectedSet = new Set(selectedNumbers);
  const hits = drawnNumbers.filter((n) => selectedSet.has(n));

  const pickCount = Math.max(1, Math.min(10, selectedNumbers.length));
  const row = KENO_PAYTABLE[pickCount] ?? [0];
  const multiplier = row[hits.length] ?? 0;
  const payout = roundCurrency(wager * multiplier);

  return {
    drawnNumbers,
    hits,
    multiplier,
    payout,
    summary: `Кено · Совпадений ${hits.length} из ${pickCount} (x${multiplier})`,
  };
}
