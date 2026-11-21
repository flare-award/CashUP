import { cryptoShuffle, randomFloat } from '../../core/rng';

export type ScratchThemeId = 'clover' | 'vault' | 'royal';

export interface ScratchPrizeSymbol {
  id: string;
  label: string;
  multiplier: number;
  probability: number;
  color: string;
}

export interface ScratchThemeConfig {
  id: ScratchThemeId;
  title: string;
  subtitle: string;
  foilGradient: string;
  maxMult: number;
  symbols: readonly ScratchPrizeSymbol[];
}

export const SCRATCH_THEMES: Record<ScratchThemeId, ScratchThemeConfig> = {
  clover: {
    id: 'clover',
    title: 'Изумрудный Клевер',
    subtitle: 'Высокая частота выигрышных билетов · макс. x50',
    foilGradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
    maxMult: 50,
    symbols: [
      { id: 'jackpot', label: 'x50', multiplier: 50, probability: 0.004, color: '#fde047' },
      { id: 'crown', label: 'x15', multiplier: 15, probability: 0.012, color: '#f59e0b' },
      { id: 'gem', label: 'x5', multiplier: 5, probability: 0.042, color: '#34d399' },
      { id: 'coin', label: 'x2', multiplier: 2, probability: 0.145, color: '#60a5fa' },
      { id: 'leaf', label: 'x1.2', multiplier: 1.2, probability: 0.22, color: '#a7f3d0' },
    ],
  },
  vault: {
    id: 'vault',
    title: 'Золотой Сейф',
    subtitle: 'Классический баланс риска и крупных слитков · макс. x150',
    foilGradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #92400e 100%)',
    maxMult: 150,
    symbols: [
      { id: 'jackpot', label: 'x150', multiplier: 150, probability: 0.0016, color: '#fde047' },
      { id: 'crown', label: 'x25', multiplier: 25, probability: 0.008, color: '#f59e0b' },
      { id: 'gem', label: 'x8', multiplier: 8, probability: 0.032, color: '#34d399' },
      { id: 'coin', label: 'x2.5', multiplier: 2.5, probability: 0.11, color: '#60a5fa' },
      { id: 'leaf', label: 'x1.5', multiplier: 1.5, probability: 0.13, color: '#cbd5e1' },
    ],
  },
  royal: {
    id: 'royal',
    title: 'Королевский Бриллиант',
    subtitle: 'Охота за редкими множителями · макс. x500',
    foilGradient: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #4c1d95 100%)',
    maxMult: 500,
    symbols: [
      { id: 'jackpot', label: 'x500', multiplier: 500, probability: 0.0005, color: '#fde047' },
      { id: 'crown', label: 'x50', multiplier: 50, probability: 0.004, color: '#f59e0b' },
      { id: 'gem', label: 'x12', multiplier: 12, probability: 0.022, color: '#c084fc' },
      { id: 'coin', label: 'x3', multiplier: 3, probability: 0.085, color: '#60a5fa' },
      { id: 'leaf', label: 'x1.5', multiplier: 1.5, probability: 0.12, color: '#cbd5e1' },
    ],
  },
};

export interface GeneratedScratchTicket {
  themeId: ScratchThemeId;
  cells: ScratchPrizeSymbol[]; // length 9
  winningSymbol: ScratchPrizeSymbol | null;
  multiplier: number;
}

const FILLER_POOL: readonly ScratchPrizeSymbol[] = [
  { id: 'blankA', label: 'x50', multiplier: 50, probability: 0, color: '#94a3b8' },
  { id: 'blankB', label: 'x15', multiplier: 15, probability: 0, color: '#94a3b8' },
  { id: 'blankC', label: 'x5', multiplier: 5, probability: 0, color: '#94a3b8' },
  { id: 'blankD', label: 'x2', multiplier: 2, probability: 0, color: '#94a3b8' },
  { id: 'blankE', label: 'x1.5', multiplier: 1.5, probability: 0, color: '#94a3b8' },
];

export function generateScratchTicket(themeId: ScratchThemeId): GeneratedScratchTicket {
  const cfg = SCRATCH_THEMES[themeId];
  const r = randomFloat();
  let acc = 0;
  let winner: ScratchPrizeSymbol | null = null;

  for (const sym of cfg.symbols) {
    acc += sym.probability;
    if (r < acc) {
      winner = sym;
      break;
    }
  }

  // Build 9 cells so ONLY `winner` (if any) appears 3 times, and every other symbol appears <= 2 times!
  const otherSymbols = cfg.symbols.filter((s) => s.id !== winner?.id);
  const pairPool: ScratchPrizeSymbol[] = [];
  for (const sym of otherSymbols.length >= 4 ? otherSymbols : [...otherSymbols, ...FILLER_POOL]) {
    pairPool.push(sym, sym);
  }

  let cells: ScratchPrizeSymbol[];
  if (winner) {
    const sixDecoys = cryptoShuffle(pairPool).slice(0, 6);
    // Double check no decoy appears 3 times (impossible since each sym was pushed at most twice!)
    cells = cryptoShuffle([winner, winner, winner, ...sixDecoys]);
  } else {
    // Need 9 cells with max 2 per symbol -> use 5 distinct symbols (10 items) and take 9!
    const fiveDistinct = [...cfg.symbols];
    const tenPool: ScratchPrizeSymbol[] = [];
    for (const s of fiveDistinct) {
      tenPool.push(s, s);
    }
    cells = cryptoShuffle(tenPool).slice(0, 9);
  }

  return {
    themeId,
    cells,
    winningSymbol: winner,
    multiplier: winner ? winner.multiplier : 0,
  };
}
