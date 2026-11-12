import { describe, expect, it } from 'vitest';
import {
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

describe('Virtual Currency Formatting (No Exchange Conversion)', () => {
  it('preserves exact numeric value across RUB, MDL, USD, EUR, KZT, CNY', () => {
    const codes: CurrencyCode[] = ['RUB', 'MDL', 'USD', 'EUR', 'KZT', 'CNY'];
    const balance = 1000;

    for (const code of codes) {
      const formatted = formatCurrency(balance, code);
      expect(formatted).toContain(CURRENCIES[code].symbol);
      // Numeric digits must still represent 1 000 (not converted)
      const digitsOnly = formatted.replace(/[^\d]/g, '');
      expect(digitsOnly).toBe('1000');
    }
  });

  it('rounds floating-point drift and formats signed deltas', () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(formatSignedCurrency(250, 'RUB')).toContain('+');
    expect(formatSignedCurrency(-100, 'USD')).toContain('−$100');
  });
});
