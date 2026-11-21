import { roundCurrency } from '../../core/currency';
import { randomFloat } from '../../core/rng';

export type UpgradeSectorMode = 'start' | 'end';

export function computeUpgradeChance(targetMultiplier: number): number {
  const clamped = Math.max(1.2, Math.min(25, targetMultiplier));
  const raw = 0.96 / clamped;
  return Math.min(0.82, Math.max(0.03, Math.round(raw * 10000) / 10000));
}

export function getArtifactTierName(multiplier: number): {
  fromName: string;
  toName: string;
  accentColor: string;
} {
  if (multiplier < 2) {
    return {
      fromName: 'Базовый чип I',
      toName: 'Кварцевый чип II',
      accentColor: '#38bdf8',
    };
  }
  if (multiplier < 4) {
    return {
      fromName: 'Кварцевый чип II',
      toName: 'Изумрудный модуль III',
      accentColor: '#10b981',
    };
  }
  if (multiplier < 9) {
    return {
      fromName: 'Изумрудный модуль III',
      toName: 'Золотое ядро IV',
      accentColor: '#f59e0b',
    };
  }
  return {
    fromName: 'Золотое ядро IV',
    toName: 'Астральная призма V',
    accentColor: '#a855f7',
  };
}

export interface UpgradeResult {
  roll: number; // [0, 1)
  chance: number;
  won: boolean;
  targetMultiplier: number;
  payout: number;
  angleDeg: number;
  summary: string;
}

export function runUpgradeAttempt(
  wager: number,
  targetMultiplier: number,
  sectorMode: UpgradeSectorMode
): UpgradeResult {
  const cleanMult = Math.round(Math.max(1.2, Math.min(25, targetMultiplier)) * 100) / 100;
  const chance = computeUpgradeChance(cleanMult);
  const roll = randomFloat();

  const won = sectorMode === 'start' ? roll < chance : roll >= 1 - chance;
  const payout = won ? roundCurrency(wager * cleanMult) : 0;
  const tier = getArtifactTierName(cleanMult);

  return {
    roll,
    chance,
    won,
    targetMultiplier: cleanMult,
    payout,
    angleDeg: roll * 360,
    summary: `${tier.toName} · Целевой x${cleanMult} (${(chance * 100).toFixed(1)}%) — ${
      won ? 'Успех' : 'Срыв прокачки'
    }`,
  };
}
