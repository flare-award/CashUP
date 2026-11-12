import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useCashUp } from '../../state/CashUpContext';
import { BetControls } from '../../components/ui/BetControls';
import {
  drawRandomSlotSymbol,
  SLOT_SYMBOLS,
  SlotReelMode,
  SlotSpinOutcome,
  SlotSymbolId,
  spinSlots,
  SYMBOL_MAP,
} from './slotsLogic';
import styles from './SlotsGame.module.css';

export const SlotSymbolSvg: React.FC<{ id: SlotSymbolId; size?: number }> = ({
  id,
  size = 46,
}) => {
  switch (id) {
    case 'seven':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Семёрка">
          <path
            d="M14 14H50L28 54H18L38 22H14V14Z"
            fill="#ef4444"
            stroke="#fde047"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Алмаз">
          <polygon points="20,14 44,14 54,28 32,54 10,28" fill="#38bdf8" />
          <polygon points="20,14 44,14 38,28 26,28" fill="#bae6fd" />
          <polygon points="26,28 38,28 32,54" fill="#0284c7" />
        </svg>
      );
    case 'coin':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Золотая монета">
          <circle cx="32" cy="32" r="21" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#fef3c7" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="32,21 39,32 32,43 25,32" fill="#fef3c7" />
        </svg>
      );
    case 'clover':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Клевер">
          <circle cx="24" cy="24" r="10" fill="#10b981" />
          <circle cx="40" cy="24" r="10" fill="#10b981" />
          <circle cx="24" cy="38" r="10" fill="#10b981" />
          <circle cx="40" cy="38" r="10" fill="#10b981" />
          <path d="M32 38L28 54H36L32 38Z" fill="#059669" />
          <circle cx="32" cy="31" r="4.5" fill="#a7f3d0" />
        </svg>
      );
    case 'bell':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Колокольчик">
          <path
            d="M32 12C22 12 18 22 18 33L13 44H51L46 33C46 22 42 12 32 12Z"
            fill="#eab308"
          />
          <circle cx="32" cy="48" r="5" fill="#ca8a04" />
        </svg>
      );
    case 'strawberry':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Клубника">
          <path
            d="M32 52C20 46 15 34 18 24C21 17 43 17 46 24C49 34 44 46 32 52Z"
            fill="#f43f5e"
          />
          <path d="M22 19L32 12L42 19L32 23Z" fill="#22c55e" />
          <circle cx="27" cy="31" r="1.6" fill="#fef08a" />
          <circle cx="37" cy="31" r="1.6" fill="#fef08a" />
          <circle cx="32" cy="39" r="1.6" fill="#fef08a" />
        </svg>
      );
    case 'cherry':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Вишня">
          <path d="M24 38C25 24 34 16 42 13" fill="none" stroke="#22c55e" strokeWidth="3" />
          <path d="M42 40C42 26 40 18 42 13" fill="none" stroke="#22c55e" strokeWidth="3" />
          <circle cx="22" cy="42" r="10" fill="#dc2626" />
          <circle cx="42" cy="44" r="10" fill="#ef4444" />
        </svg>
      );
    case 'lemon':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Лимон">
          <ellipse
            cx="32"
            cy="32"
            rx="20"
            ry="14"
            transform="rotate(-24 32 32)"
            fill="#facc15"
          />
          <circle cx="24" cy="28" r="2" fill="#fef9c3" />
        </svg>
      );
  }
};

interface ReelState {
  strip: SlotSymbolId[];
  offsetPx: number;
  durationMs: number;
}

function makeRestingStrip(center: SlotSymbolId): ReelState {
  return {
    strip: [drawRandomSlotSymbol(), center, drawRandomSlotSymbol()],
    offsetPx: 0,
    durationMs: 0,
  };
}

export const SlotsGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [mode, setMode] = useState<SlotReelMode>(3);
  const [wager, setWager] = useState<number>(0.25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const spinLockRef = useRef(false);

  const [reelsState, setReelsState] = useState<ReelState[]>(() => [
    makeRestingStrip('seven'),
    makeRestingStrip('clover'),
    makeRestingStrip('seven'),
  ]);

  const [lastOutcome, setLastOutcome] = useState<SlotSpinOutcome | null>(null);
  const [spinHistory, setSpinHistory] = useState<
    Array<{ id: string; symbols: SlotSymbolId[]; payout: number; label: string }>
  >([]);

  useEffect(() => {
    if (isSpinning) return;
    setLastOutcome(null);
    setReelsState(
      Array.from({ length: mode }, (_, idx) =>
        makeRestingStrip(idx % 2 === 0 ? 'seven' : 'clover')
      )
    );
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSpin = (viaLever = false) => {
    if (spinLockRef.current || isSpinning) return;

    // 1. Pre-determine result via Web Crypto RNG BEFORE animation starts
    const outcome = spinSlots(mode, wager);
    const roundOutcomeType = outcome.payout > 0 ? 'win' : 'loss';
    const summary = `${mode} бар. · ${outcome.comboLabel}`;

    const started = startPrecomputedRound({
      gameId: 'slots',
      gameName: 'Однорукий бандит',
      wager,
      precomputed: {
        payout: outcome.payout,
        multiplier: outcome.multiplier > 0 ? outcome.multiplier : null,
        outcome: roundOutcomeType,
        summary,
      },
    });

    if (!started.ok) return;

    spinLockRef.current = true;
    setIsSpinning(true);
    setLastOutcome(null);
    playSound('reelSpin');

    if (viaLever || scaleDuration(300) > 0) {
      setLeverPulled(true);
      window.setTimeout(() => setLeverPulled(false), 340);
    }

    const baseDuration = scaleDuration(1150);
    const stagger = scaleDuration(340);

    if (baseDuration === 0) {
      // Instant mode when animations are disabled
      const settledStrips = outcome.reels.map((sym) => makeRestingStrip(sym));
      setReelsState(settledStrips);
      finishRound({
        roundId: started.roundId,
        payout: outcome.payout,
        multiplier: outcome.multiplier > 0 ? outcome.multiplier : null,
        outcome: roundOutcomeType,
        summary,
      });
      setLastOutcome(outcome);
      setSpinHistory((prev) =>
        [
          {
            id: started.roundId,
            symbols: outcome.reels,
            payout: outcome.payout,
            label: outcome.comboLabel,
          },
          ...prev,
        ].slice(0, 6)
      );
      setIsSpinning(false);
      spinLockRef.current = false;
      return;
    }

    // Build rolling strips starting with current 3 visible symbols
    const prepared = reelsState.map((prevReel, idx) => {
      const currentTriplet = prevReel.strip.slice(0, 3);
      const middleFillerCount = 10 + idx * 3;
      const filler = Array.from({ length: middleFillerCount }, () =>
        drawRandomSlotSymbol()
      );
      const targetTriplet: SlotSymbolId[] = [
        drawRandomSlotSymbol(),
        outcome.reels[idx]!,
        drawRandomSlotSymbol(),
      ];
      const fullStrip = [...currentTriplet, ...filler, ...targetTriplet];
      const targetOffset = -((fullStrip.length - 3) * 80);
      const reelDur = baseDuration + idx * stagger;

      return {
        fullStrip,
        targetTriplet,
        targetOffset,
        reelDur,
      };
    });

    // Step 1: Set extended strip at offset 0 without transition
    setReelsState(
      prepared.map((p) => ({
        strip: p.fullStrip,
        offsetPx: 0,
        durationMs: 0,
      }))
    );

    // Step 2: Trigger staggered smooth scroll on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReelsState(
          prepared.map((p) => ({
            strip: p.fullStrip,
            offsetPx: p.targetOffset,
            durationMs: p.reelDur,
          }))
        );
      });
    });

    // Play individual reel stop clicks
    prepared.forEach((p) => {
      window.setTimeout(() => {
        playSound('reelStop');
      }, p.reelDur);
    });

    const totalMs = prepared[prepared.length - 1]!.reelDur + 80;
    window.setTimeout(() => {
      // Lock strips cleanly to resting 3-symbol window
      setReelsState(
        prepared.map((p) => ({
          strip: p.targetTriplet,
          offsetPx: 0,
          durationMs: 0,
        }))
      );
      finishRound({
        roundId: started.roundId,
        payout: outcome.payout,
        multiplier: outcome.multiplier > 0 ? outcome.multiplier : null,
        outcome: roundOutcomeType,
        summary,
      });
      setLastOutcome(outcome);
      setSpinHistory((prev) =>
        [
          {
            id: started.roundId,
            symbols: outcome.reels,
            payout: outcome.payout,
            label: outcome.comboLabel,
          },
          ...prev,
        ].slice(0, 6)
      );
      setIsSpinning(false);
      spinLockRef.current = false;
    }, totalMs);
  };

  const balance = activeProfile?.balance ?? 0;
  const isWinState = !isSpinning && lastOutcome !== null && lastOutcome.payout > 0;
  const isLossState = !isSpinning && lastOutcome !== null && lastOutcome.payout === 0;

  return (
    <div className={styles.layout}>
      <div className={styles.machineOuter}>
        <div className={`${styles.cabinet} ${isWinState ? styles.cabinetWin : ''}`}>
          <div className={styles.marquee}>
            <div>
              <div className={styles.marqueeTitle}>CashUP Clover Slots</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Ставка: <strong className="mono">{formatAmount(wager)}</strong>
              </div>
            </div>

            <div className={styles.modeTabs} role="tablist" aria-label="Режим барабанов">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 3}
                disabled={isSpinning}
                className={`${styles.modeTab} ${mode === 3 ? styles.modeTabActive : ''}`}
                onClick={() => {
                  playSound('click');
                  setMode(3);
                }}
              >
                3 барабана
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 5}
                disabled={isSpinning}
                className={`${styles.modeTab} ${mode === 5 ? styles.modeTabActive : ''}`}
                onClick={() => {
                  playSound('click');
                  setMode(5);
                }}
              >
                5 барабанов
              </button>
            </div>
          </div>

          <div className={styles.windowFrame}>
            <div className={styles.paylineMarker} aria-hidden="true" />
            <div
              className={`${styles.reelsGrid} ${
                mode === 3 ? styles.reels3 : styles.reels5
              }`}
            >
              {reelsState.map((reel, rIdx) => {
                const isWinningReel =
                  isWinState && lastOutcome?.winningIndices.includes(rIdx);
                return (
                  <div
                    key={rIdx}
                    className={`${styles.reelViewport} ${
                      isWinningReel ? styles.reelHighlight : ''
                    }`}
                  >
                    <div
                      className={styles.reelStrip}
                      style={{
                        transform: `translateY(${reel.offsetPx}px)`,
                        transition:
                          reel.durationMs > 0
                            ? `transform ${reel.durationMs}ms cubic-bezier(0.14, 0.9, 0.24, 1)`
                            : 'none',
                      }}
                    >
                      {reel.strip.map((sym, sIdx) => (
                        <div key={`${sIdx}-${sym}`} className={styles.symbolCell}>
                          <SlotSymbolSvg id={sym} size={mode === 5 ? 40 : 48} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`${styles.statusReadout} ${
              isWinState ? styles.statusWin : isLossState ? styles.statusLoss : ''
            }`}
            aria-live="polite"
          >
            <span>
              {isSpinning
                ? 'Барабаны вращаются…'
                : lastOutcome
                  ? lastOutcome.comboLabel
                  : 'Запустите барабаны кнопкой или рычагом справа'}
            </span>
            {lastOutcome && !isSpinning && (
              <strong className="mono">
                {lastOutcome.payout > 0 ? `+${formatAmount(lastOutcome.payout)}` : '0'}
              </strong>
            )}
          </div>
        </div>

        {/* Interactive Visual Slot Lever */}
        <div className={styles.leverAssembly}>
          <button
            type="button"
            className={styles.leverBase}
            disabled={isSpinning || wager <= 0 || wager > balance}
            onClick={() => triggerSpin(true)}
            aria-label="Потянуть рычаг слот-автомата"
            title="Потянуть рычаг для запуска"
          >
            <div
              className={`${styles.leverArm} ${leverPulled ? styles.leverPulled : ''}`}
            >
              <div className={styles.leverKnob} />
            </div>
          </button>
          <span className={styles.leverHint}>Рычаг</span>
        </div>
      </div>

      {/* Controls & Paytable */}
      <div className={styles.sidePanel}>
        <div className={styles.cardBox}>
          <BetControls wager={wager} onChange={setWager} disabled={isSpinning} />
          <button
            type="button"
            className="btn btnPrimary btnLg"
            style={{ width: '100%', marginTop: 14 }}
            disabled={isSpinning || wager <= 0 || wager > balance}
            onClick={() => triggerSpin(false)}
          >
            <Play size={17} /> {isSpinning ? 'Крутим…' : 'Крутить барабаны'}
          </button>
        </div>

        <div className={styles.cardBox}>
          <h3 style={{ marginBottom: 10 }}>
            Таблица выплат ({mode === 3 ? '3 в ряд' : '3 / 4 / 5 в ряд'})
          </h3>
          {SLOT_SYMBOLS.map((s) => (
            <div key={s.id} className={styles.payRow}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <SlotSymbolSvg id={s.id} size={22} />
                <span>{s.nameRu}</span>
              </span>
              <span className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {mode === 3 ? `x${s.pay3}` : `x${s.pay3} / x${s.pay4} / x${s.pay5}`}
              </span>
            </div>
          ))}
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Символ «Клевер» заменяет парные символы в комбинациях.
          </div>
        </div>

        {spinHistory.length > 0 && (
          <div className={styles.cardBox}>
            <h3 style={{ marginBottom: 10 }}>Последние спины</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {spinHistory.map((sp) => (
                <div
                  key={sp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {sp.symbols.map((sym, i) => (
                      <SlotSymbolSvg key={i} id={sym} size={18} />
                    ))}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color:
                        sp.payout > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {sp.payout > 0 ? `+${formatAmount(sp.payout)}` : SYMBOL_MAP[sp.symbols[0]!].nameRu}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
