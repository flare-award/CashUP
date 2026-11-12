import React, { useRef, useState } from 'react';
import { ArrowUpCircle, FlipVertical } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  computeUpgradeChance,
  getArtifactTierName,
  runUpgradeAttempt,
  UpgradeSectorMode,
} from './upgradeLogic';

const PRESET_MULTS = [1.5, 2, 3, 5, 10, 20];

export const UpgradeGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(50);
  const [targetMult, setTargetMult] = useState<number>(2);
  const [sectorMode, setSectorMode] = useState<UpgradeSectorMode>('start');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [pointerDeg, setPointerDeg] = useState<number>(0);
  const [animDuration, setAnimDuration] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    payout: number;
    rollPct: string;
  } | null>(null);

  const balance = activeProfile?.balance ?? 0;
  const chance = computeUpgradeChance(targetMult);
  const chancePct = (chance * 100).toFixed(2);
  const tier = getArtifactTierName(targetMult);

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * chance;
  const arcRotation = sectorMode === 'start' ? -90 : -90 + (1 - chance) * 360;

  const handleUpgrade = () => {
    if (lockRef.current || isUpgrading) return;

    const result = runUpgradeAttempt(wager, targetMult, sectorMode);
    const outcome = result.won ? 'win' : 'loss';

    const started = startPrecomputedRound({
      gameId: 'upgrade',
      gameName: 'Апгрейд',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.won ? result.targetMultiplier : null,
        outcome,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsUpgrading(true);
    setLastResult(null);
    playSound('upgradeCharge');

    const dur = scaleDuration(2200);
    setAnimDuration(dur);

    // Advance clockwise by 5 full turns onto exact result.angleDeg
    const baseTurns = Math.floor(pointerDeg / 360) + 5;
    const nextAngle = baseTurns * 360 + result.angleDeg;
    setPointerDeg(nextAngle);

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.won ? result.targetMultiplier : null,
        outcome,
        summary: result.summary,
      });
      setLastResult({
        won: result.won,
        payout: result.payout,
        rollPct: (result.roll * 100).toFixed(2),
      });
      setIsUpgrading(false);
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
      {/* Reactor Chamber */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '26px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span className="badge badgeNeutral">{tier.fromName}</span>
          <span>→</span>
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              color: tier.accentColor,
              border: `1px solid ${tier.accentColor}`,
            }}
          >
            {tier.toName}
          </span>
        </div>

        {/* Circular Precision Ring */}
        <div style={{ position: 'relative', width: 268, height: 268 }}>
          <svg
            viewBox="0 0 268 268"
            width="268"
            height="268"
            role="img"
            aria-label={`Кольцо улучшения, шанс успеха ${chancePct}%`}
          >
            {/* Background track */}
            <circle
              cx="134"
              cy="134"
              r={radius}
              fill="none"
              stroke="var(--bg-surface-subtle)"
              strokeWidth="16"
            />
            <circle
              cx="134"
              cy="134"
              r={radius}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="16"
              opacity="0.35"
            />

            {/* Winning Sector Arc */}
            <circle
              cx="134"
              cy="134"
              r={radius}
              fill="none"
              stroke={tier.accentColor}
              strokeWidth="16"
              strokeDasharray={`${arcLength} ${circumference}`}
              transform={`rotate(${arcRotation} 134 134)`}
              style={{ transition: 'stroke-dasharray 200ms ease, transform 200ms ease' }}
            />

            {/* Rotating Pointer */}
            <g
              style={{
                transform: `rotate(${pointerDeg}deg)`,
                transformOrigin: '134px 134px',
                transition:
                  animDuration > 0
                    ? `transform ${animDuration}ms cubic-bezier(0.12, 0.88, 0.2, 1)`
                    : 'none',
              }}
            >
              <polygon points="134,14 127,32 141,32" fill="#f8fafc" />
              <circle cx="134" cy="30" r="3.5" fill="#f59e0b" />
            </g>

            {/* Inner Artifact Prism */}
            <circle
              cx="134"
              cy="134"
              r="72"
              fill="var(--bg-elevated)"
              stroke={
                lastResult
                  ? lastResult.won
                    ? '#10b981'
                    : '#ef4444'
                  : 'var(--border-subtle)'
              }
              strokeWidth="2"
            />
            <polygon
              points="134,88 164,134 134,180 104,134"
              fill={tier.accentColor}
              opacity="0.18"
            />
          </svg>

          {/* Center Readout */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span className="mono" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
              {chancePct}%
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Множитель x{targetMult}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btnSecondary btnSm"
          disabled={isUpgrading}
          onClick={() => {
            playSound('click');
            setSectorMode((m) => (m === 'start' ? 'end' : 'start'));
          }}
        >
          <FlipVertical size={14} /> Инвертировать сектор (
          {sectorMode === 'start' ? 'Начало круга' : 'Конец круга'})
        </button>

        <div
          aria-live="polite"
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.88rem',
          }}
        >
          {isUpgrading ? (
            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
              Выполняется синтез улучшения…
            </span>
          ) : lastResult ? (
            <span
              style={{
                fontWeight: 700,
                color: lastResult.won ? 'var(--accent-primary)' : 'var(--color-danger)',
              }}
            >
              {lastResult.won
                ? `Улучшение успешно! +${formatAmount(lastResult.payout)} (точка ${lastResult.rollPct}%)`
                : `Неудача прокачки (точка ${lastResult.rollPct}%)`}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              Настройте целевой множитель и запустите попытку улучшения
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
          gap: 18,
        }}
      >
        <BetControls
          wager={wager}
          onChange={setWager}
          disabled={isUpgrading}
          label="Стоимость попытки (вирт.)"
        />

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              marginBottom: 8,
            }}
          >
            <label htmlFor="upgrade-mult-slider" style={{ color: 'var(--text-secondary)' }}>
              Целевой множитель
            </label>
            <strong className="mono" style={{ color: 'var(--accent-primary)' }}>
              x{targetMult}
            </strong>
          </div>

          <input
            id="upgrade-mult-slider"
            type="range"
            min={1.2}
            max={25}
            step={0.1}
            disabled={isUpgrading}
            value={targetMult}
            onChange={(e) => setTargetMult(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
              marginTop: 10,
            }}
          >
            {PRESET_MULTS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={isUpgrading}
                onClick={() => {
                  playSound('click');
                  setTargetMult(m);
                }}
                className="mono"
                style={{
                  padding: '7px 4px',
                  borderRadius: 7,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor:
                    targetMult === m
                      ? 'var(--accent-primary)'
                      : 'var(--bg-surface-subtle)',
                  color: targetMult === m ? '#04130d' : 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                x{m}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Потенциальный предмет:
          </span>
          <strong className="mono" style={{ fontSize: '1.05rem', color: 'var(--accent-gold)' }}>
            {formatAmount(roundCurrency(wager * targetMult))}
          </strong>
        </div>

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={isUpgrading || wager <= 0 || wager > balance}
          onClick={handleUpgrade}
        >
          <ArrowUpCircle size={18} />{' '}
          {isUpgrading ? 'Прокачка…' : `Улучшить до x${targetMult}`}
        </button>
      </div>
    </div>
  );
};
