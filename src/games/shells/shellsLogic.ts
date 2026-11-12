import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export type ShellDifficulty = 'easy' | 'medium' | 'hard';

export interface ShellDifficultyConfig {
  id: ShellDifficulty;
  label: string;
  baseSwaps: number;
  baseSwapMs: number;
  multiplier: number;
}

export const SHELL_DIFFICULTIES: Record<ShellDifficulty, ShellDifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Стандарт',
    baseSwaps: 5,
    baseSwapMs: 360,
    multiplier: 2.85,
  },
  medium: {
    id: 'medium',
    label: 'Быстрый',
    baseSwaps: 8,
    baseSwapMs: 260,
    multiplier: 2.92,
  },
  hard: {
    id: 'hard',
    label: 'Мастер',
    baseSwaps: 12,
    baseSwapMs: 195,
    multiplier: 2.97,
  },
};

export interface ShellRoundPlan {
  winningCupId: number; // 0, 1, or 2 (identity of the cup holding the ball)
  swaps: Array<[number, number]>; // pairs of visual slot positions [slotA, slotB]
  finalCupSlots: [number, number, number]; // cupSlots[cupId] = final visual slot 0..2
  swapDurationMs: number;
  multiplier: number;
  level: number;
}

/**
 * Generates the entire honest shuffle sequence and winning cup ID BEFORE animation starts.
 */
export function createShellRoundPlan(
  difficulty: ShellDifficulty,
  streakLevel: number
): ShellRoundPlan {
  const cfg = SHELL_DIFFICULTIES[difficulty];
  const bonusSwaps = Math.min(6, streakLevel * 2);
  const totalSwaps = cfg.baseSwaps + bonusSwaps;
  const swapDurationMs = Math.max(145, Math.round(cfg.baseSwapMs - streakLevel * 18));

  const winningCupId = randomInt(0, 2);
  // cupSlots[cupId] = current visual slot (0=left, 1=center, 2=right)
  const cupSlots: [number, number, number] = [0, 1, 2];
  const swaps: Array<[number, number]> = [];

  let prevPairKey = '';
  for (let i = 0; i < totalSwaps; i += 1) {
    const pairs: Array<[number, number]> = [
      [0, 1],
      [1, 2],
      [0, 2],
    ];
    const candidates = pairs.filter((p) => `${p[0]}-${p[1]}` !== prevPairKey);
    const chosen = candidates[randomInt(0, candidates.length - 1)]!;
    prevPairKey = `${chosen[0]}-${chosen[1]}`;
    swaps.push(chosen);

    const [slotA, slotB] = chosen;
    const cupAtA = cupSlots.indexOf(slotA);
    const cupAtB = cupSlots.indexOf(slotB);
    cupSlots[cupAtA] = slotB;
    cupSlots[cupAtB] = slotA;
  }

  return {
    winningCupId,
    swaps,
    finalCupSlots: cupSlots,
    swapDurationMs,
    multiplier: cfg.multiplier,
    level: streakLevel + 1,
  };
}

export function evaluateShellPick(
  plan: ShellRoundPlan,
  pickedCupId: number,
  wager: number
): { won: boolean; payout: number; multiplier: number } {
  const won = pickedCupId === plan.winningCupId;
  const multiplier = won ? plan.multiplier : 0;
  const payout = roundCurrency(wager * multiplier);
  return { won, payout, multiplier };
}
