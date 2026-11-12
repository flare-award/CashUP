import { describe, expect, it } from 'vitest';
import {
  convertBetweenCurrencies,
  convertFromUsd,
  convertToUsd,
  CURRENCIES,
  formatCurrency,
  formatSignedCurrency,
  roundCurrency,
} from '../core/currency';
import {
  cryptoShuffle,
  generateProfileId,
  pickWeighted,
  randomFloat,
  randomInt,
} from '../core/rng';
import { CurrencyCode } from '../types';

describe('Web Crypto Fair RNG', () => {
  it('generates integers strictly within inclusive bounds', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 300; i += 1) {
      const n = randomInt(0, 5);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(5);
      expect(Number.isInteger(n)).toBe(true);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });

  it('generates uniform floats in [0, 1)', () => {
    for (let i = 0; i < 200; i += 1) {
      const f = randomFloat();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('shuffles arrays without mutating input or losing elements', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = cryptoShuffle(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });

  it('picks weighted items accurately and generates valid profile IDs', () => {
    const item = pickWeighted([
      { item: 'alpha', weight: 0 },
      { item: 'emerald', weight: 10 },
    ]);
    expect(item).toBe('emerald');
    expect(generateProfileId()).toMatch(/^CUP-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});

describe('Balanced Multi-Currency Exchange Conversion ($10 USD Base)', () => {
  it('converts $10 USD starter balance accurately into every supported currency', () => {
    const starterUsd = 10;

    expect(convertFromUsd(starterUsd, 'USD')).toBe(10);
    expect(convertFromUsd(starterUsd, 'RUB')).toBe(960);
    expect(convertFromUsd(starterUsd, 'EUR')).toBe(9.2);
    expect(convertFromUsd(starterUsd, 'KZT')).toBe(4950);
    expect(convertFromUsd(starterUsd, 'MDL')).toBe(178);
    expect(convertFromUsd(starterUsd, 'CNY')).toBe(72.5);

    expect(formatCurrency(starterUsd, 'USD')).toBe('$10');
    expect(formatCurrency(starterUsd, 'RUB')).toContain('960');
    expect(formatCurrency(starterUsd, 'RUB')).toContain(CURRENCIES.RUB.symbol);
  });

  it('maintains identical purchasing power and lossless round-trip across currency switches', () => {
    const codes: CurrencyCode[] = ['USD', 'RUB', 'EUR', 'KZT', 'MDL', 'CNY'];
    const baseUsd = 10;

    for (const code of codes) {
      const displayed = convertFromUsd(baseUsd, code);
      const backToUsd = convertToUsd(displayed, code);
      expect(Math.abs(backToUsd - baseUsd)).toBeLessThan(0.01);
    }

    // Typing 500 KZT in KZT mode round-trips back to exact 500 KZT
    const kztInUsd = convertToUsd(500, 'KZT');
    expect(convertFromUsd(kztInUsd, 'KZT')).toBe(500);

    // Chained conversions equal direct conversion
    expect(convertBetweenCurrencies(960, 'RUB', 'USD')).toBe(10);
    expect(convertBetweenCurrencies(10, 'USD', 'EUR')).toBe(9.2);
  });

  it('rounds floating-point drift and formats signed deltas', () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(formatSignedCurrency(2.5, 'RUB')).toContain('+');
    expect(formatSignedCurrency(-1.5, 'USD')).toContain('−$1,50');
  });
});
