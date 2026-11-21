import { randomInt } from '../../core/rng';

export type CoinSide = 'heads' | 'tails';

export const MAX_COIN_STREAK = 10;

export function computeCoinStreakMultiplier(streak: number): number {
  if (streak <= 0) return 1;
  return Math.round(0.98 * Math.pow(2, streak) * 100) / 100;
}

export function generateCoinSequence(length = MAX_COIN_STREAK): CoinSide[] {
  return Array.from({ length }, () => (randomInt(0, 1) === 0 ? 'heads' : 'tails'));
}

export function coinSideLabelRu(side: CoinSide): string {
  return side === 'heads' ? 'Орёл' : 'Решка';
}
