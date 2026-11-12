/**
 * Cryptographically strong random number generator powered by Web Crypto API.
 * Uses rejection sampling to guarantee uniform distributions without modulo bias.
 */

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is required for CashUP fair RNG.');
}

/**
 * Uniform random unsigned 32-bit integer in [0, 0xFFFFFFFF].
 */
export function randomUint32(): number {
  const buf = new Uint32Array(1);
  getCrypto().getRandomValues(buf);
  return buf[0]!;
}

/**
 * Uniform random float in [0, 1) with full 53-bit IEEE-754 mantissa precision.
 */
export function randomFloat(): number {
  const buf = new Uint32Array(2);
  getCrypto().getRandomValues(buf);
  const high = buf[0]! >>> 5; // 27 bits
  const low = buf[1]! >>> 6; // 26 bits
  return (high * 67108864 + low) / 9007199254740992; // 2^26 and 2^53
}

/**
 * Unbiased integer in [min, max] inclusive using rejection sampling.
 */
export function randomInt(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) {
    throw new Error(`Invalid randomInt range: [${min}, ${max}]`);
  }
  const range = high - low + 1;
  if (range === 1) return low;
  if (range > 0x100000000) {
    return low + Math.floor(randomFloat() * range);
  }

  const maxUnbiased = Math.floor(0x100000000 / range) * range - 1;
  let sample = randomUint32();
  while (sample > maxUnbiased) {
    sample = randomUint32();
  }
  return low + (sample % range);
}

/**
 * Returns true with exact probability p in [0, 1].
 */
export function randomChance(probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return randomFloat() < probability;
}

/**
 * Unbiased Fisher-Yates shuffle returning a new array.
 */
export function cryptoShuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Picks one item from a weighted list using Web Crypto float.
 */
export function pickWeighted<T>(entries: readonly { item: T; weight: number }[]): T {
  const valid = entries.filter((e) => e.weight > 0);
  if (valid.length === 0) {
    throw new Error('pickWeighted requires at least one entry with positive weight');
  }
  const totalWeight = valid.reduce((acc, cur) => acc + cur.weight, 0);
  let target = randomFloat() * totalWeight;
  for (let i = 0; i < valid.length; i += 1) {
    target -= valid[i]!.weight;
    if (target <= 0) {
      return valid[i]!.item;
    }
  }
  return valid[valid.length - 1]!.item;
}

/**
 * Generates a unique hexadecimal identifier with optional prefix.
 */
export function generateId(prefix = 'id'): string {
  const bytes = new Uint8Array(8);
  getCrypto().getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${hex}`;
}

/**
 * Generates a human-friendly unique local profile ID like CUP-7A4F-92B1.
 */
export function generateProfileId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (len: number) =>
    Array.from({ length: len }, () => alphabet[randomInt(0, alphabet.length - 1)]).join('');
  return `CUP-${part(4)}-${part(4)}`;
}
