import React, { useRef, useState } from 'react';
import { Disc } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import {
  RISK_WHEEL_PRESETS,
  RiskPresetId,
  RiskSector,
  spinRiskWheel,
} from './riskRouletteLogic';

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polar(cx, cy, rOut, startDeg);
  const p2 = polar(cx, cy, rOut, endDeg);
  const p3 = polar(cx, cy, rIn, endDeg);
  const p4 = polar(cx, cy, rIn, startDeg);
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 0 0 ${p4.x} ${p4.y} Z`;
}

export const RiskRouletteGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(40);
  const [preset, setPreset] = useState<RiskPresetId>('moderate');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [animDuration, setAnimDuration] = useState<number>(0);
  const [lastHit, setLastHit] = useState<{
    sector: RiskSector;
    payout: number;
  } | null>(null);

  const balance = activeProfile?.balance ?? 0;
  const presetCfg = RISK_WHEEL_PRESETS[preset];
  const sliceDeg = 360 / presetCfg.sectors.length;

  const handleSpin = () => {
    if (lockRef.current || isSpinning) return;

    const outcome = spinRiskWheel(preset, wager);
    const roundOutcome = outcome.won ? 'win' : 'loss';

    const started = startPrecomputedRound({
      gameId: 'risk-roulette',
      gameName: 'Риск-рулетка',
      wager,
      precomputed: {
        payout: outcome.payout,
        multiplier: outcome.won ? outcome.sector.multiplier : null,
        outcome: roundOutcome,
        summary: outcome.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsSpinning(true);
    setLastHit(null);

    const dur = scaleDuration(2900);
    setAnimDuration(dur);

    const baseTurns = Math.floor(wheelAngle / 360) + 6;
    const nextAngle = baseTurns * 360 + outcome.targetWheelDeg;
    setWheelAngle(nextAngle);

    if (dur > 0) {
      playSound('rouletteTick');
      window.setTimeout(() => playSound('rouletteTick'), Math.round(dur * 0.25));
      window.setTimeout(() => playSound('rouletteTick'), Math.round(dur * 0.55));
      window.setTimeout(() => playSound('rouletteTick'), Math.round(dur * 0.8));
    }

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: outcome.payout,
        multiplier: outcome.won ? outcome.sector.multiplier : null,
        outcome: roundOutcome,
        summary: outcome.summary,
      });
      setLastHit({ sector: outcome.sector, payout: outcome.payout });
      setIsSpinning(false);
      lockRef.current = false;
    }, dur);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Wheel Stage */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.02rem' }}>{presetCfg.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {presetCfg.subtitle}
          </div>
        </div>

        <div style={{ position: 'relative', width: 296, height: 296 }}>
          <svg
            viewBox="0 0 300 300"
            width="296"
            height="296"
            role="img"
            aria-label="Колесо Риск-рулетки"
          >
            <circle cx="150" cy="150" r="142" fill="#0b1018" stroke="#334155" strokeWidth="3" />

            <g
              style={{
                transform: `rotate(${wheelAngle}deg)`,
                transformOrigin: '150px 150px',
                transition:
                  animDuration > 0
                    ? `transform ${animDuration}ms cubic-bezier(0.11, 0.89, 0.19, 1)`
                    : 'none',
              }}
            >
              {presetCfg.sectors.map((sec, idx) => {
                const start = idx * sliceDeg - sliceDeg / 2;
                const end = start + sliceDeg;
                const labelPt = polar(150, 150, 98, idx * sliceDeg);
                return (
                  <g key={idx}>
                    <path
                      d={sectorPath(150, 150, 134, 46, start, end)}
                      fill={sec.color}
                      stroke="#0b1018"
                      strokeWidth="2"
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      fill={sec.multiplier >= 5 ? '#0b0e14' : '#f8fafc'}
                      fontSize="11.5"
                      fontWeight="800"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${idx * sliceDeg}, ${labelPt.x}, ${labelPt.y})`}
                    >
                      {sec.label}
                    </text>
                  </g>
                );
              })}

              <circle cx="150" cy="150" r="44" fill="#111824" stroke="#f59e0b" strokeWidth="2.5" />
              <polygon points="150,126 170,150 150,174 130,150" fill="#10b981" opacity="0.8" />
            </g>

            {/* Fixed Top Pointer */}
            <polygon
              points="150,24 140,6 160,6"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div
          aria-live="polite"
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {isSpinning ? (
            <span style={{ color: 'var(--accent-gold)' }}>Вращение контура…</span>
          ) : lastHit ? (
            <span
              style={{
                color:
                  lastHit.payout > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Сектор «{lastHit.sector.symbolName}» ({lastHit.sector.label}) ·{' '}
              {lastHit.payout > 0 ? `+${formatAmount(lastHit.payout)}` : 'Без выплаты'}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
              Безопасное игровое колесо повышенной волатильности
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Режим риска колеса
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(
              [
                { id: 'moderate', name: 'Сбалансированный (до x5.0)' },
                { id: 'high', name: 'Высокий риск (до x12.0)' },
                { id: 'extreme', name: 'Экстрим (до x25.0)' },
              ] as const
            ).map((item) => {
              const active = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => {
                    playSound('click');
                    setPreset(item.id);
                    setLastHit(null);
                  }}
                  style={{
                    padding: '11px 13px',
                    borderRadius: 10,
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        <BetControls wager={wager} onChange={setWager} disabled={isSpinning} />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={isSpinning || wager <= 0 || wager > balance}
          onClick={handleSpin}
        >
          <Disc size={18} /> {isSpinning ? 'Крутится…' : 'Запустить Риск-рулетку'}
        </button>
      </div>
    </div>
  );
};
