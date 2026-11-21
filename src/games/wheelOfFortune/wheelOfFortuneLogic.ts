import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export type FortuneSymbol = 1 | 2 | 5 | 10 | 20 | 40;

export interface FortuneSymbolInfo {
  symbol: FortuneSymbol;
  payoutMult: number;
  count: number;
  color: string;
  textColor: string;
  label: string;
}

export const FORTUNE_SYMBOLS: Record<FortuneSymbol, FortuneSymbolInfo> = {
  1: {
    symbol: 1,
    payoutMult: 2,
    count: 21,
    color: '#eab308',
    textColor: '#0f172a',
    label: 'Сектор 1 (x2)',
  },
  2: {
    symbol: 2,
    payoutMult: 3,
    count: 12,
    color: '#3b82f6',
    textColor: '#f8fafc',
    label: 'Сектор 2 (x3)',
  },
  5: {
    symbol: 5,
    payoutMult: 6,
    count: 6,
    color: '#a855f7',
    textColor: '#f8fafc',
    label: 'Сектор 5 (x6)',
  },
  10: {
    symbol: 10,
    payoutMult: 11,
    count: 3,
    color: '#10b981',
    textColor: '#042f2e',
    label: 'Сектор 10 (x11)',
  },
  20: {
    symbol: 20,
    payoutMult: 21,
    count: 2,
    color: '#f97316',
    textColor: '#0f172a',
    label: 'Сектор 20 (x21)',
  },
  40: {
    symbol: 40,
    payoutMult: 41,
    count: 1,
    color: '#ef4444',
    textColor: '#fef08a',
    label: 'Джекпот 40 (x41)',
  },
};

// Balanced interleaved 45-sector ring (21x1, 12x2, 6x5, 3x10, 2x20, 1x40)
export const FORTUNE_WHEEL_RING: readonly FortuneSymbol[] = [
  40, 1, 2, 1, 5, 1, 2, 1, 10, 1,
  2, 1, 5, 2, 1, 20, 1, 2, 1, 5,
  1, 2, 1, 10, 2, 1, 5, 1, 2, 1,
  20, 2, 1, 5, 1, 2, 1, 10, 1, 2,
  1, 5, 2, 1, 1,
];

export interface FortuneSpinResult {
  pocketIndex: number;
  winningSymbol: FortuneSymbol;
  targetWheelDeg: number;
  payout: number;
  won: boolean;
  effectiveMultiplier: number | null;
  summary: string;
}

export function spinWheelOfFortune(
  selectedSymbols: FortuneSymbol[],
  totalWager: number
): FortuneSpinResult {
  const pocketIndex = randomInt(0, FORTUNE_WHEEL_RING.length - 1);
  const winningSymbol = FORTUNE_WHEEL_RING[pocketIndex]!;
  const sliceDeg = 360 / FORTUNE_WHEEL_RING.length;
  const targetWheelDeg = (360 - pocketIndex * sliceDeg) % 360;

  const uniqueSelected = Array.from(new Set(selectedSymbols));
  const stakePerSymbol =
    uniqueSelected.length > 0 ? totalWager / uniqueSelected.length : 0;

  const hit = uniqueSelected.includes(winningSymbol);
  const rawPayout = hit
    ? stakePerSymbol * FORTUNE_SYMBOLS[winningSymbol].payoutMult
    : 0;
  const payout = roundCurrency(rawPayout);
  const effectiveMultiplier =
    payout > 0 && totalWager > 0 ? roundCurrency(payout / totalWager) : null;

  return {
    pocketIndex,
    winningSymbol,
    targetWheelDeg,
    payout,
    won: payout > 0,
    effectiveMultiplier,
    summary: `Колесо Фортуны · Выпал сектор «${winningSymbol}» (${
      hit ? `x${FORTUNE_SYMBOLS[winningSymbol].payoutMult}` : 'мимо'
    })`,
  };
}
