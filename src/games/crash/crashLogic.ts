import { randomFloat } from '../../core/rng';

/**
 * Cryptographically generates a fair orbital crash multiplier before round launch.
 */
export function generateCrashPoint(): number {
  const u = randomFloat();
  if (u < 0.03) {
    return 1.0;
  }
  const raw = 0.97 / (1 - u);
  const clamped = Math.min(200, Math.max(1.01, Math.floor(raw * 100) / 100));
  return clamped;
}

export function multiplierAtSeconds(sec: number): number {
  return Math.round(Math.exp(0.14 * sec) * 100) / 100;
}
