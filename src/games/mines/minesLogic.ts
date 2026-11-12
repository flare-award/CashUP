import { cryptoShuffle } from '../../core/rng';

export type MinesGridSize = 4 | 5 | 6;

export function generateMinePositions(
  gridSize: MinesGridSize,
  mineCount: number
): number[] {
  const totalCells = gridSize * gridSize;
  const clampedMines = Math.max(1, Math.min(totalCells - 1, Math.floor(mineCount)));
  const allIndices = Array.from({ length: totalCells }, (_, idx) => idx);
  return cryptoShuffle(allIndices)
    .slice(0, clampedMines)
    .sort((a, b) => a - b);
}

/**
 * Exact combinatoric multiplier with 3% house edge:
 * 0.97 * C(totalCells, safeOpened) / C(totalCells - mineCount, safeOpened)
 */
export function computeMinesMultiplier(
  gridSize: MinesGridSize,
  mineCount: number,
  safeOpened: number
): number {
  if (safeOpened <= 0) return 1;
  const total = gridSize * gridSize;
  const safeTotal = total - mineCount;
  if (safeOpened > safeTotal) return 1;

  let prob = 1;
  for (let i = 0; i < safeOpened; i += 1) {
    prob *= (safeTotal - i) / (total - i);
  }

  const raw = 0.97 / prob;
  return Math.max(1.01, Math.round(raw * 100) / 100);
}
