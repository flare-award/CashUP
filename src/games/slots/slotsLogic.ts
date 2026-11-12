import { roundCurrency } from '../../core/currency';
import { pickWeighted } from '../../core/rng';

export type SlotSymbolId =
  | 'seven'
  | 'diamond'
  | 'coin'
  | 'clover'
  | 'bell'
  | 'strawberry'
  | 'cherry'
  | 'lemon';

export type SlotReelMode = 3 | 5;

export interface SlotSymbolConfig {
  id: SlotSymbolId;
  nameRu: string;
  weight: number;
  pay3: number;
  pay4: number;
  pay5: number;
}

export const SLOT_SYMBOLS: readonly SlotSymbolConfig[] = [
  { id: 'seven', nameRu: 'Семёрка', weight: 5, pay3: 35, pay4: 80, pay5: 250 },
  { id: 'diamond', nameRu: 'Алмаз', weight: 7, pay3: 22, pay4: 50, pay5: 140 },
  { id: 'coin', nameRu: 'Золотая монета', weight: 10, pay3: 14, pay4: 32, pay5: 85 },
  { id: 'clover', nameRu: 'Клевер', weight: 11, pay3: 10, pay4: 24, pay5: 60 },
  { id: 'bell', nameRu: 'Колокольчик', weight: 14, pay3: 7, pay4: 16, pay5: 40 },
  { id: 'strawberry', nameRu: 'Клубника', weight: 17, pay3: 5, pay4: 11, pay5: 25 },
  { id: 'cherry', nameRu: 'Вишня', weight: 18, pay3: 4, pay4: 8, pay5: 18 },
  { id: 'lemon', nameRu: 'Лимон', weight: 18, pay3: 3, pay4: 6, pay5: 14 },
];

export const SYMBOL_MAP: Record<SlotSymbolId, SlotSymbolConfig> = Object.fromEntries(
  SLOT_SYMBOLS.map((s) => [s.id, s])
) as Record<SlotSymbolId, SlotSymbolConfig>;

export function drawRandomSlotSymbol(): SlotSymbolId {
  return pickWeighted(SLOT_SYMBOLS.map((s) => ({ item: s.id, weight: s.weight })));
}

export interface SlotSpinOutcome {
  reels: SlotSymbolId[];
  multiplier: number;
  payout: number;
  comboLabel: string;
  winningIndices: number[];
}

/**
 * Generates pre-determined slot spin outcome via Web Crypto RNG before animation begins.
 */
export function spinSlots(mode: SlotReelMode, wager: number): SlotSpinOutcome {
  const reels: SlotSymbolId[] = Array.from({ length: mode }, () => drawRandomSlotSymbol());
  return evaluateSlotReels(reels, wager);
}

export function evaluateSlotReels(
  reels: readonly SlotSymbolId[],
  wager: number
): SlotSpinOutcome {
  const mode = reels.length as SlotReelMode;

  if (mode === 3) {
    const [a, b, c] = reels as [SlotSymbolId, SlotSymbolId, SlotSymbolId];
    if (a === b && b === c) {
      const sym = SYMBOL_MAP[a];
      const mult = sym.pay3;
      return {
        reels: [...reels],
        multiplier: mult,
        payout: roundCurrency(wager * mult),
        comboLabel: `Три «${sym.nameRu}» (x${mult})`,
        winningIndices: [0, 1, 2],
      };
    }

    // Clover acts as Wild for pairs in 3-reel mode
    if (a === 'clover' && b === c) {
      const sym = SYMBOL_MAP[b];
      const mult = Math.max(2.5, roundCurrency(sym.pay3 * 0.5));
      return {
        reels: [...reels],
        multiplier: mult,
        payout: roundCurrency(wager * mult),
        comboLabel: `Клевер + пара «${sym.nameRu}» (x${mult})`,
        winningIndices: [0, 1, 2],
      };
    }
    if (c === 'clover' && a === b) {
      const sym = SYMBOL_MAP[a];
      const mult = Math.max(2.5, roundCurrency(sym.pay3 * 0.5));
      return {
        reels: [...reels],
        multiplier: mult,
        payout: roundCurrency(wager * mult),
        comboLabel: `Пара «${sym.nameRu}» + Клевер (x${mult})`,
        winningIndices: [0, 1, 2],
      };
    }

    // Two adjacent cherries or sevens consolation
    if ((a === 'cherry' && b === 'cherry') || (b === 'cherry' && c === 'cherry')) {
      const idxs = a === 'cherry' && b === 'cherry' ? [0, 1] : [1, 2];
      return {
        reels: [...reels],
        multiplier: 1.8,
        payout: roundCurrency(wager * 1.8),
        comboLabel: 'Две Вишни подряд (x1.8)',
        winningIndices: idxs,
      };
    }

    if (a === b || b === c) {
      const matched = a === b ? a : b;
      if (matched === 'seven' || matched === 'diamond' || matched === 'coin') {
        const idxs = a === b ? [0, 1] : [1, 2];
        return {
          reels: [...reels],
          multiplier: 2,
          payout: roundCurrency(wager * 2),
          comboLabel: `Два символа «${SYMBOL_MAP[matched].nameRu}» (x2)`,
          winningIndices: idxs,
        };
      }
    }

    return {
      reels: [...reels],
      multiplier: 0,
      payout: 0,
      comboLabel: 'Нет выигрышной линии',
      winningIndices: [],
    };
  }

  // 5-Reel evaluation: longest contiguous run OR left-to-right with Clover Wilds
  let bestMult = 0;
  let bestLabel = 'Нет выигрышной линии';
  let bestIndices: number[] = [];

  for (const candidate of SLOT_SYMBOLS) {
    let runStart = -1;
    let runLen = 0;
    let bestSymRun = 0;
    let bestSymStart = 0;

    for (let i = 0; i < reels.length; i += 1) {
      const r = reels[i]!;
      const matches = r === candidate.id || (r === 'clover' && candidate.id !== 'seven');
      if (matches) {
        if (runLen === 0) runStart = i;
        runLen += 1;
        if (runLen > bestSymRun) {
          bestSymRun = runLen;
          bestSymStart = runStart;
        }
      } else {
        runLen = 0;
      }
    }

    let m = 0;
    if (bestSymRun === 5) m = candidate.pay5;
    else if (bestSymRun === 4) m = candidate.pay4;
    else if (bestSymRun === 3) m = candidate.pay3;

    if (m > bestMult) {
      bestMult = m;
      bestLabel = `${bestSymRun}× «${candidate.nameRu}» (x${m})`;
      bestIndices = Array.from({ length: bestSymRun }, (_, k) => bestSymStart + k);
    }
  }

  // Consolation: 3+ cherries or coins anywhere on 5 reels
  if (bestMult === 0) {
    const cherryIndices = reels
      .map((s, idx) => (s === 'cherry' ? idx : -1))
      .filter((i) => i >= 0);
    if (cherryIndices.length >= 3) {
      bestMult = 2.2;
      bestLabel = `${cherryIndices.length}× Скаттер Вишня (x2.2)`;
      bestIndices = cherryIndices;
    }
  }

  return {
    reels: [...reels],
    multiplier: bestMult,
    payout: roundCurrency(wager * bestMult),
    comboLabel: bestLabel,
    winningIndices: bestIndices,
  };
}
