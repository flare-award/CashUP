import { cryptoShuffle } from '../../core/rng';

export type TowerDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface TowerDifficultyConfig {
  id: TowerDifficulty;
  label: string;
  cols: number;
  safePerRow: number;
}

export const TOWER_FLOORS = 8;

export const TOWER_DIFFICULTIES: Record<TowerDifficulty, TowerDifficultyConfig> = {
  easy: { id: 'easy', label: 'Лёгкий (3 из 4)', cols: 4, safePerRow: 3 },
  medium: { id: 'medium', label: 'Средний (2 из 3)', cols: 3, safePerRow: 2 },
  hard: { id: 'hard', label: 'Сложный (1 из 2)', cols: 2, safePerRow: 1 },
  extreme: { id: 'extreme', label: 'Экстрим (1 из 3)', cols: 3, safePerRow: 1 },
};

export function computeTowerMultiplier(
  difficulty: TowerDifficulty,
  clearedFloors: number
): number {
  if (clearedFloors <= 0) return 1;
  const cfg = TOWER_DIFFICULTIES[difficulty];
  const probPerFloor = cfg.safePerRow / cfg.cols;
  const raw = 0.96 / Math.pow(probPerFloor, clearedFloors);
  return Math.round(raw * 100) / 100;
}

/**
 * Generates pre-determined safe column indices for each of the 8 floors using Web Crypto API.
 */
export function generateTowerMap(difficulty: TowerDifficulty): number[][] {
  const cfg = TOWER_DIFFICULTIES[difficulty];
  const baseIndices = Array.from({ length: cfg.cols }, (_, i) => i);
  return Array.from({ length: TOWER_FLOORS }, () =>
    cryptoShuffle(baseIndices).slice(0, cfg.safePerRow)
  );
}
