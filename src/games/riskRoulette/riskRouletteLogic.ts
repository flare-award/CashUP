import { roundCurrency } from '../../core/currency';
import { randomFloat, randomInt } from '../../core/rng';

export type RiskPresetId = 'moderate' | 'high' | 'extreme';

export interface RiskSector {
  index: number;
  label: string;
  symbolName: string;
  multiplier: number;
  color: string;
}

export const RISK_WHEEL_PRESETS: Record<
  RiskPresetId,
  { title: string; subtitle: string; sectors: readonly Omit<RiskSector, 'index'>[] }
> = {
  moderate: {
    title: 'Сбалансированный контур',
    subtitle: '7 призовых секторов из 12 · макс. x5.0',
    sectors: [
      { label: 'x0', symbolName: 'Пустой контур', multiplier: 0, color: '#1e293b' },
      { label: 'x1.4', symbolName: 'Малый щит', multiplier: 1.4, color: '#0284c7' },
      { label: 'x0', symbolName: 'Пустой контур', multiplier: 0, color: '#1e293b' },
      { label: 'x2.0', symbolName: 'Изумрудный импульс', multiplier: 2.0, color: '#10b981' },
      { label: 'x1.2', symbolName: 'Стабилизатор', multiplier: 1.2, color: '#3b82f6' },
      { label: 'x0', symbolName: 'Пустой контур', multiplier: 0, color: '#1e293b' },
      { label: 'x5.0', symbolName: 'Золотое ядро', multiplier: 5.0, color: '#f59e0b' },
      { label: 'x0', symbolName: 'Пустой контур', multiplier: 0, color: '#1e293b' },
      { label: 'x1.5', symbolName: 'Кварцевый сектор', multiplier: 1.5, color: '#0284c7' },
      { label: 'x2.0', symbolName: 'Изумрудный импульс', multiplier: 2.0, color: '#10b981' },
      { label: 'x0', symbolName: 'Пустой контур', multiplier: 0, color: '#1e293b' },
      { label: 'x1.4', symbolName: 'Малый щит', multiplier: 1.4, color: '#3b82f6' },
    ],
  },
  high: {
    title: 'Высокое напряжение',
    subtitle: '4 призовых сектора из 12 · макс. x12.0',
    sectors: [
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#273449' },
      { label: 'x2.5', symbolName: 'Резонанс', multiplier: 2.5, color: '#10b981' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#273449' },
      { label: 'x4.0', symbolName: 'Призма энергии', multiplier: 4.0, color: '#3b82f6' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#273449' },
      { label: 'x12', symbolName: 'Сверхновая', multiplier: 12.0, color: '#f59e0b' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#1e293b' },
      { label: 'x2.5', symbolName: 'Резонанс', multiplier: 2.5, color: '#10b981' },
      { label: 'x0', symbolName: 'Тишина', multiplier: 0, color: '#273449' },
    ],
  },
  extreme: {
    title: 'Экстремальный пик',
    subtitle: '2 редких сектора из 12 · макс. x25.0',
    sectors: [
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#263244' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#1e293b' },
      { label: 'x8.0', symbolName: 'Квантовый луч', multiplier: 8.0, color: '#a855f7' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#263244' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#263244' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#263244' },
      { label: 'x25', symbolName: 'Абсолютный Зенит', multiplier: 25.0, color: '#f59e0b' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#1e293b' },
      { label: 'x0', symbolName: 'Блокировка', multiplier: 0, color: '#263244' },
    ],
  },
};

export interface RiskSpinOutcome {
  sector: RiskSector;
  targetWheelDeg: number;
  payout: number;
  won: boolean;
  summary: string;
}

export function spinRiskWheel(preset: RiskPresetId, wager: number): RiskSpinOutcome {
  const list = RISK_WHEEL_PRESETS[preset].sectors;
  const count = list.length; // 12
  const idx = randomInt(0, count - 1);
  const chosen = list[idx]!;
  const slice = 360 / count; // 30 deg

  // Sector `idx` is drawn centered at `idx * slice` deg clockwise from top (12 o'clock).
  // To align sector `idx` under the top pointer (0 deg), wheel rotation modulo 360 = (360 - idx * slice) % 360
  const jitter = (randomFloat() - 0.5) * (slice * 0.55);
  const targetMod = (((360 - idx * slice + jitter) % 360) + 360) % 360;

  const payout = roundCurrency(wager * chosen.multiplier);
  const won = payout > 0;

  return {
    sector: { ...chosen, index: idx },
    targetWheelDeg: targetMod,
    payout,
    won,
    summary: `${RISK_WHEEL_PRESETS[preset].title} · Сектор «${chosen.symbolName}» (${chosen.label})`,
  };
}
