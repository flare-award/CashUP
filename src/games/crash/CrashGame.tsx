import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import { generateCrashPoint, multiplierAtSeconds } from './crashLogic';

export const CrashGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(30);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(true);
  const [autoTarget, setAutoTarget] = useState<number>(2.0);

  const [phase, setPhase] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [currentMult, setCurrentMult] = useState<number>(1.0);
  const [cashedOutMult, setCashedOutMult] = useState<number | null>(null);
  const [crashPointDisplay, setCrashPointDisplay] = useState<number | null>(null);
  const [historyPoints, setHistoryPoints] = useState<number[]>([
    1.84, 3.42, 1.12, 6.5, 1.98, 2.31,
  ]);

  const roundRef = useRef<{
    roundId: string;
    wager: number;
    crashPoint: number;
    settled: boolean;
    autoEnabled: boolean;
    autoVal: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Safely reconcile any interrupted interactive crash round on mount
  useEffect(() => {
    const saved = getInteractiveRound('crash');
    if (saved) {
      const st = (saved.interactiveState ?? {}) as {
        crashPoint?: number;
        autoTarget?: number;
      };
      const cp = st.crashPoint ?? 1.0;
      const target = st.autoTarget ?? 2.0;
      const won = cp >= target;
      const payout = won ? roundCurrency(saved.wager * target) : 0;
      finishRound({
        roundId: saved.roundId,
        payout,
        multiplier: won ? target : null,
        outcome: won ? 'win' : 'loss',
        summary: `Crash (авторасчёт) · Пик x${cp.toFixed(2)}`,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const balance = activeProfile?.balance ?? 0;

  const executeCashout = (multToClaim: number) => {
    const active = roundRef.current;
    if (!active || active.settled) return;
    active.settled = true;

    const cleanMult = Math.min(multToClaim, active.crashPoint);
    const payout = roundCurrency(active.wager * cleanMult);
    setCashedOutMult(cleanMult);

    finishRound({
      roundId: active.roundId,
      payout,
      multiplier: cleanMult,
      outcome: 'win',
      summary: `Орбита · Зафиксирован x${cleanMult.toFixed(2)} (пик x${active.crashPoint.toFixed(2)})`,
    });
  };

  const handleLaunch = () => {
    if (phase === 'flying') return;
    const crashPoint = generateCrashPoint();
    const safeAuto = Math.max(1.1, roundCurrency(autoTarget));

    const started = startInteractiveRound({
      gameId: 'crash',
      gameName: 'Crash: Орбита',
      wager,
      interactiveState: {
        crashPoint,
        autoTarget: autoCashoutEnabled ? safeAuto : 9999,
      },
    });

    if (!started.ok) return;

    roundRef.current = {
      roundId: started.roundId,
      wager,
      crashPoint,
      settled: false,
      autoEnabled: autoCashoutEnabled,
      autoVal: safeAuto,
    };

    setCashedOutMult(null);
    setCrashPointDisplay(null);
    setCurrentMult(1.0);
    playSound('upgradeCharge');

    // Instant resolution when animations are disabled
    if (scaleDuration(1000) === 0) {
      const target = autoCashoutEnabled ? safeAuto : 2.0;
      if (crashPoint >= target) {
        executeCashout(target);
      } else {
        roundRef.current.settled = true;
        finishRound({
          roundId: started.roundId,
          payout: 0,
          multiplier: null,
          outcome: 'loss',
          summary: `Орбита · Срыв сигнала на x${crashPoint.toFixed(2)}`,
        });
      }
      setCurrentMult(crashPoint);
      setCrashPointDisplay(crashPoint);
      setHistoryPoints((prev) => [crashPoint, ...prev].slice(0, 10));
      setPhase('crashed');
      return;
    }

    setPhase('flying');
    const startTs = performance.now();

    const step = (now: number) => {
      const active = roundRef.current;
      if (!active) return;

      const sec = (now - startTs) / 1000;
      const m = multiplierAtSeconds(sec);

      if (
        !active.settled &&
        active.autoEnabled &&
        m >= active.autoVal &&
        active.crashPoint >= active.autoVal
      ) {
        executeCashout(active.autoVal);
      }

      if (m >= active.crashPoint) {
        setCurrentMult(active.crashPoint);
        setCrashPointDisplay(active.crashPoint);
        setPhase('crashed');
        setHistoryPoints((prev) => [active.crashPoint, ...prev].slice(0, 10));

        if (!active.settled) {
          active.settled = true;
          finishRound({
            roundId: active.roundId,
            payout: 0,
            multiplier: null,
            outcome: 'loss',
            summary: `Орбита · Срыв сигнала на x${active.crashPoint.toFixed(2)}`,
          });
        }
        return;
      }

      setCurrentMult(m);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  // Normalized curve path up to currentMult
  const normProgress = Math.min(1, Math.log(Math.max(1, currentMult)) / Math.log(12));
  const endX = 50 + normProgress * 490;
  const endY = 230 - normProgress * 185;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Telemetry Graph */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: 14,
            backgroundColor: '#090d14',
            border: '1px solid #1e293b',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 580 260"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label="График орбитального множителя"
          >
            {/* Grid lines */}
            {[60, 115, 170, 230].map((y) => (
              <line
                key={y}
                x1="48"
                y1={y}
                x2="550"
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4 4"
              />
            ))}

            <path
              d={`M 50 230 Q ${(50 + endX) * 0.58} 228 ${endX} ${endY}`}
              fill="none"
              stroke={phase === 'crashed' && !cashedOutMult ? '#ef4444' : '#10b981'}
              strokeWidth="4"
              strokeLinecap="round"
            />

            <circle
              cx={endX}
              cy={endY}
              r="6.5"
              fill={phase === 'crashed' && !cashedOutMult ? '#ef4444' : '#f59e0b'}
            />
          </svg>

          {/* Center Big Multiplier Readout */}
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
            <div
              className="mono"
              style={{
                fontSize: '2.7rem',
                fontWeight: 800,
                color:
                  phase === 'crashed' && !cashedOutMult
                    ? '#ef4444'
                    : cashedOutMult
                      ? '#34d399'
                      : '#f8fafc',
              }}
            >
              x{currentMult.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.86rem', color: '#94a3b8', fontWeight: 600 }}>
              {phase === 'crashed'
                ? cashedOutMult
                  ? `Успешно зафиксировано на x${cashedOutMult.toFixed(2)} (пик x${crashPointDisplay?.toFixed(2)})`
                  : `Сигнал прерван на x${crashPointDisplay?.toFixed(2)}`
                : cashedOutMult
                  ? `Выигрыш зафиксирован на x${cashedOutMult.toFixed(2)}!`
                  : phase === 'flying'
                    ? 'Траектория растёт — заберите до обрыва!'
                    : 'Готовность к запуску орбитального импульса'}
            </div>
          </div>
        </div>

        {/* History Strip */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {historyPoints.map((pt, idx) => (
            <span
              key={idx}
              className="mono"
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 700,
                backgroundColor:
                  pt >= 2 ? 'var(--accent-primary-soft)' : 'var(--bg-surface-subtle)',
                color: pt >= 2 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              x{pt.toFixed(2)}
            </span>
          ))}
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
        <BetControls
          wager={wager}
          onChange={setWager}
          disabled={phase === 'flying'}
        />

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Авто-вывод по множителю</span>
            <input
              type="checkbox"
              checked={autoCashoutEnabled}
              disabled={phase === 'flying'}
              onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: 'var(--accent-primary)' }}
            />
          </label>

          {autoCashoutEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Цель x
              </span>
              <input
                type="number"
                min={1.1}
                max={100}
                step={0.1}
                disabled={phase === 'flying'}
                value={autoTarget}
                onChange={(e) =>
                  setAutoTarget(Math.max(1.1, parseFloat(e.target.value) || 1.1))
                }
                className="inputField mono"
              />
            </div>
          )}
        </div>

        {phase === 'flying' && !cashedOutMult ? (
          <button
            type="button"
            className="btn btnGold btnLg"
            onClick={() => executeCashout(currentMult)}
          >
            <CheckCircle2 size={18} /> Забрать{' '}
            {formatAmount(roundCurrency(wager * currentMult))} (x
            {currentMult.toFixed(2)})
          </button>
        ) : (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={phase === 'flying' || wager <= 0 || wager > balance}
            onClick={handleLaunch}
          >
            <Rocket size={18} />{' '}
            {phase === 'flying' ? 'Ожидание завершения…' : 'Запустить импульс'}
          </button>
        )}
      </div>
    </div>
  );
};
