import { CurrencyCode } from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  nameRu: string;
  position: 'prefix' | 'suffix';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  RUB: {
    code: 'RUB',
    symbol: '₽',
    nameRu: 'Российский рубль',
    position: 'suffix',
  },
  MDL: {
    code: 'MDL',
    symbol: 'L',
    nameRu: 'Молдавский лей',
    position: 'suffix',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    nameRu: 'Американский доллар',
    position: 'prefix',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    nameRu: 'Евро',
    position: 'suffix',
  },
  KZT: {
    code: 'KZT',
    symbol: '₸',
    nameRu: 'Казахстанский тенге',
    position: 'suffix',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    nameRu: 'Китайский юань',
    position: 'prefix',
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = [
  CURRENCIES.RUB,
  CURRENCIES.MDL,
  CURRENCIES.USD,
  CURRENCIES.EUR,
  CURRENCIES.KZT,
  CURRENCIES.CNY,
];

/**
 * Rounds virtual currency value cleanly to 2 decimal places, eliminating IEEE-754 drift.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a virtual amount with proper thousand separators (non-breaking space)
 * and currency symbol WITHOUT changing the underlying numeric value.
 */
export function formatNumber(amount: number): string {
  const safe = roundCurrency(amount);
  const abs = Math.abs(safe);
  const hasDecimals = Math.round(abs * 100) % 100 !== 0;

  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return safe < 0 ? `-${formatted}` : formatted;
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'RUB'): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.RUB;
  const safe = roundCurrency(amount);
  const sign = safe < 0 ? '−' : '';
  const absStr = formatNumber(Math.abs(safe));

  if (cfg.position === 'prefix') {
    return `${sign}${cfg.symbol}${absStr}`;
  }
  return `${sign}${absStr}\u00A0${cfg.symbol}`;
}

export function formatSignedCurrency(amount: number, currency: CurrencyCode = 'RUB'): string {
  const safe = roundCurrency(amount);
  if (safe > 0) {
    return `+${formatCurrency(safe, currency)}`;
  }
  if (safe < 0) {
    return formatCurrency(safe, currency);
  }
  return formatCurrency(0, currency);
}
