import { CurrencyCode } from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  nameRu: string;
  position: 'prefix' | 'suffix';
  /** Units of this currency per 1.00 USD */
  rateFromUsd: number;
  /** Convenient increment step in this currency for quick + button */
  quickStepDisplay: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    nameRu: 'Доллар США',
    position: 'prefix',
    rateFromUsd: 1,
    quickStepDisplay: 0.5,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    nameRu: 'Российский рубль',
    position: 'suffix',
    rateFromUsd: 96,
    quickStepDisplay: 50,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    nameRu: 'Евро',
    position: 'suffix',
    rateFromUsd: 0.92,
    quickStepDisplay: 0.5,
  },
  KZT: {
    code: 'KZT',
    symbol: '₸',
    nameRu: 'Казахстанский тенге',
    position: 'suffix',
    rateFromUsd: 495,
    quickStepDisplay: 250,
  },
  MDL: {
    code: 'MDL',
    symbol: 'L',
    nameRu: 'Молдавский лей',
    position: 'suffix',
    rateFromUsd: 17.8,
    quickStepDisplay: 10,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    nameRu: 'Китайский юань',
    position: 'prefix',
    rateFromUsd: 7.25,
    quickStepDisplay: 5,
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = [
  CURRENCIES.USD,
  CURRENCIES.RUB,
  CURRENCIES.EUR,
  CURRENCIES.KZT,
  CURRENCIES.MDL,
  CURRENCIES.CNY,
];

/**
 * Rounds internal base-USD value to 6 decimal places so conversions to/from
 * any display currency remain lossless without IEEE-754 drift.
 */
export function roundCurrency(usdAmount: number): number {
  if (!Number.isFinite(usdAmount)) return 0;
  return Math.round((usdAmount + Number.EPSILON) * 1_000_000) / 1_000_000;
}

/**
 * Rounds a converted display currency value to 2 decimal places.
 */
export function roundDisplayAmount(displayAmount: number): number {
  if (!Number.isFinite(displayAmount)) return 0;
  return Math.round((displayAmount + Number.EPSILON) * 100) / 100;
}

/**
 * Converts an internal base-USD amount into the target currency.
 */
export function convertFromUsd(usdAmount: number, currency: CurrencyCode = 'USD'): number {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  return roundDisplayAmount(usdAmount * cfg.rateFromUsd);
}

/**
 * Converts an amount entered in `currency` back into internal base-USD.
 */
export function convertToUsd(displayAmount: number, currency: CurrencyCode = 'USD'): number {
  if (!Number.isFinite(displayAmount)) return 0;
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  return roundCurrency(displayAmount / cfg.rateFromUsd);
}

/**
 * Converts an amount directly between two currencies.
 */
export function convertBetweenCurrencies(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return roundDisplayAmount(amount);
  return convertFromUsd(convertToUsd(amount, from), to);
}

/**
 * Formats an already-converted display numeric value using Russian locale separators.
 */
export function formatNumber(displayAmount: number): string {
  const safe = roundDisplayAmount(displayAmount);
  const abs = Math.abs(safe);
  const hasDecimals = Math.round(abs * 100) % 100 !== 0;

  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return safe < 0 ? `-${formatted}` : formatted;
}

/**
 * Formats an internal base-USD amount into just the converted number string (no symbol).
 */
export function formatDisplayNumber(usdAmount: number, currency: CurrencyCode = 'USD'): string {
  return formatNumber(convertFromUsd(usdAmount, currency));
}

/**
 * Formats an internal base-USD amount into the target currency with symbol.
 */
export function formatCurrency(usdAmount: number, currency: CurrencyCode = 'USD'): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  const converted = convertFromUsd(usdAmount, currency);
  const sign = converted < 0 ? '−' : '';
  const absStr = formatNumber(Math.abs(converted));

  if (cfg.position === 'prefix') {
    return `${sign}${cfg.symbol}${absStr}`;
  }
  return `${sign}${absStr}\u00A0${cfg.symbol}`;
}

export function formatSignedCurrency(usdAmount: number, currency: CurrencyCode = 'USD'): string {
  const converted = convertFromUsd(usdAmount, currency);
  if (converted > 0) {
    return `+${formatCurrency(usdAmount, currency)}`;
  }
  if (converted < 0) {
    return formatCurrency(usdAmount, currency);
  }
  return formatCurrency(0, currency);
}

export function formatExchangeRateHint(currency: CurrencyCode): string {
  if (currency === 'USD') {
    return 'Базовая валюта ($1 = $1)';
  }
  const cfg = CURRENCIES[currency];
  const rateStr = formatNumber(cfg.rateFromUsd);
  return cfg.position === 'prefix'
    ? `$1 = ${cfg.symbol}${rateStr}`
    : `$1 = ${rateStr}\u00A0${cfg.symbol}`;
}
