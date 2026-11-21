import React, { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import {
  createShellRoundPlan,
  evaluateShellPick,
  SHELL_DIFFICULTIES,
  ShellDifficulty,
  ShellRoundPlan,
} from './shellsLogic';

type ShellPhase = 'idle' | 'preview' | 'covering' | 'shuffling' | 'choose' | 'result';

interface SavedShellState {
  plan: ShellRoundPlan;
  difficulty: ShellDifficulty;
}

export const ShellsGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [difficulty, setDifficulty] = useState<ShellDifficulty>('easy');
  const [streakLevel, setStreakLevel] = useState<number>(0);

  const [phase, setPhase] = useState<ShellPhase>('idle');
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ShellRoundPlan | null>(null);
  const [cupSlots, setCupSlots] = useState<[number, number, number]>([0, 1, 2]);
  const [swapStepMs, setSwapStepMs] = useState<number>(300);
  const [liftedCups, setLiftedCups] = useState<number[]>([]);
  const [arcCup, setArcCup] = useState<{ up: number; down: number } | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{
    won: boolean;
    payout: number;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Resume active round if user reloaded page during selection
  useEffect(() => {
    if (activeRoundId) return;
    const saved = getInteractiveRound('shells');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedShellState;
      setActiveRoundId(saved.roundId);
      setWager(saved.wager);
      setDifficulty(st.difficulty);
      setPlan(st.plan);
      setCupSlots(st.plan.finalCupSlots);
      setLiftedCups([]);
      setPhase('choose');
    }
  }, [activeRoundId, getInteractiveRound]);

  const balance = activeProfile?.balance ?? 0;

  const startRound = () => {
    if (phase !== 'idle' && phase !== 'result') return;
    clearTimers();

    const nextPlan = createShellRoundPlan(difficulty, streakLevel);
    const savedState: SavedShellState = {
      plan: nextPlan,
      difficulty,
    };

    const started = startInteractiveRound({
      gameId: 'shells',
      gameName: 'Напёрстки',
      wager,
      interactiveState: savedState,
    });

    if (!started.ok) return;

    setActiveRoundId(started.roundId);
    setPlan(nextPlan);
    setLastOutcome(null);
    setCupSlots([0, 1, 2]);

    const previewMs = scaleDuration(800);
    const coverMs = scaleDuration(420);
    const stepMs =
      scaleDuration(nextPlan.swapDurationMs) > 0
        ? Math.max(130, scaleDuration(nextPlan.swapDurationMs))
        : 0;

    if (stepMs === 0) {
      // Animations off: jump directly to choose phase after setting slots
      setCupSlots(nextPlan.finalCupSlots);
      setLiftedCups([]);
      setPhase('choose');
      return;
    }

    // Phase 1: Lift winning cup to clearly show the golden ball
    setPhase('preview');
    setLiftedCups([nextPlan.winningCupId]);
    playSound('select');

    // Phase 2: Lower cup to cover the ball
    const tCover = window.setTimeout(() => {
      setPhase('covering');
      setLiftedCups([]);
    }, previewMs);
    timersRef.current.push(tCover);

    // Phase 3: Smooth sequential swaps
    const shuffleStart = previewMs + coverMs;
    const currentSlots: [number, number, number] = [0, 1, 2];

    nextPlan.swaps.forEach((pair, idx) => {
      const tSwap = window.setTimeout(() => {
        setPhase('shuffling');
        setSwapStepMs(stepMs);
        playSound('cupSwap');

        const [slotA, slotB] = pair;
        const cupAtA = currentSlots.indexOf(slotA);
        const cupAtB = currentSlots.indexOf(slotB);
        currentSlots[cupAtA] = slotB;
        currentSlots[cupAtB] = slotA;

        setArcCup({ up: cupAtA, down: cupAtB });
        setCupSlots([currentSlots[0], currentSlots[1], currentSlots[2]]);
      }, shuffleStart + idx * stepMs);
      timersRef.current.push(tSwap);
    });

    // Phase 4: Ready to choose
    const tChoose = window.setTimeout(() => {
      setArcCup(null);
      setPhase('choose');
    }, shuffleStart + nextPlan.swaps.length * stepMs + 80);
    timersRef.current.push(tChoose);
  };

  const handleChooseCup = (cupId: number) => {
    if (phase !== 'choose' || !plan || !activeRoundId) return;

    const evalRes = evaluateShellPick(plan, cupId, wager);
    const toLift = evalRes.won ? [cupId] : [cupId, plan.winningCupId];
    setLiftedCups(toLift);
    setPhase('result');

    if (evalRes.won) {
      setStreakLevel((prev) => prev + 1);
    } else {
      setStreakLevel(0);
    }

    const chosenSlot = cupSlots[cupId]! + 1;
    const ballSlot = cupSlots[plan.winningCupId]! + 1;

    finishRound({
      roundId: activeRoundId,
      payout: evalRes.payout,
      multiplier: evalRes.won ? evalRes.multiplier : null,
      outcome: evalRes.won ? 'win' : 'loss',
      summary: `Ур. ${plan.level} · Выбран стакан #${chosenSlot} (шарик под #${ballSlot})`,
    });

    setLastOutcome({ won: evalRes.won, payout: evalRes.payout });
    setActiveRoundId(null);
  };

  const isBusy =
    phase === 'preview' ||
    phase === 'covering' ||
    phase === 'shuffling' ||
    phase === 'choose';

  const slotOffsets = [-115, 0, 115];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Tabletop Stage */}
      <div
        style={{
          backgroundColor: 'var(--felt-bg)',
          border: '1px solid var(--felt-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 380,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span className="badge badgeEmerald">
            Интенсивность: Уровень {streakLevel + 1}
          </span>
          <span className="badge badgeGold">
            Множитель x{SHELL_DIFFICULTIES[difficulty].multiplier}
          </span>
        </div>

        {/* 3 Cups Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 360,
            height: 190,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2].map((cupId) => {
            const slot = cupSlots[cupId]!;
            const x = slotOffsets[slot]!;
            const isLifted = liftedCups.includes(cupId);
            const yArc =
              phase === 'shuffling' && arcCup
                ? arcCup.up === cupId
                  ? -18
                  : arcCup.down === cupId
                    ? 12
                    : 0
                : 0;
            const yLift = isLifted ? -54 : 0;
            const hasBall = plan?.winningCupId === cupId;
            const showBall = hasBall && (phase === 'preview' || phase === 'result');
            const selectable = phase === 'choose';

            return (
              <div
                key={cupId}
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: '50%',
                  width: 92,
                  marginLeft: -46,
                  transform: `translate3d(${x}px, ${yArc}px, 0)`,
                  transition: `transform ${swapStepMs}ms cubic-bezier(0.32, 0.08, 0.24, 1)`,
                  zIndex: arcCup?.up === cupId ? 4 : 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Golden Ball on table under this cup */}
                {showBall && (
                  <div
                    aria-label="Золотой шарик"
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at 35% 30%, #fef08a, #f59e0b 65%, #b45309)',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.55)',
                    }}
                  />
                )}

                <button
                  type="button"
                  disabled={!selectable}
                  onClick={() => handleChooseCup(cupId)}
                  aria-label={`Выбрать стаканчик на позиции ${slot + 1}`}
                  style={{
                    transform: `translateY(${yLift}px)`,
                    transition: 'transform 280ms var(--ease-out)',
                    cursor: selectable ? 'pointer' : 'default',
                    opacity: 1,
                    padding: 0,
                  }}
                >
                  <svg width="86" height="104" viewBox="0 0 86 104" aria-hidden="true">
                    <defs>
                      <linearGradient id={`cupGrad-${cupId}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#132920" />
                        <stop offset="45%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#064e3b" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M20 12 H66 L78 92 Q43 100 8 92 Z"
                      fill={`url(#cupGrad-${cupId})`}
                      stroke={selectable ? '#fde047' : '#34d399'}
                      strokeWidth={selectable ? '2.5' : '1.6'}
                    />
                    <ellipse cx="43" cy="12" rx="23" ry="5" fill="#34d399" />
                    <path
                      d="M12 78 Q43 85 74 78"
                      fill="none"
                      stroke="#fde68a"
                      strokeWidth="2.5"
                      opacity="0.7"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Phase Instruction */}
        <div
          aria-live="polite"
          style={{
            textAlign: 'center',
            padding: '10px 18px',
            borderRadius: 10,
            backgroundColor: 'rgba(11, 14, 20, 0.68)',
            color: '#f8fafc',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {phase === 'idle' && 'Нажмите «Начать раунд», чтобы увидеть шарик'}
          {phase === 'preview' && 'Запомните стаканчик с золотым шариком!'}
          {(phase === 'covering' || phase === 'shuffling') &&
            'Внимательно следите за перемешиванием…'}
          {phase === 'choose' && 'Перемешивание завершено! Выберите стаканчик'}
          {phase === 'result' &&
            lastOutcome &&
            (lastOutcome.won
              ? `Точно! Выигрыш +${formatAmount(lastOutcome.payout)} (сложность повышена)`
              : 'Промах! Шарик оказался под другим стаканчиком')}
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
            Режим скорости перемешивания
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['easy', 'medium', 'hard'] as const).map((d) => {
              const cfg = SHELL_DIFFICULTIES[d];
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    playSound('click');
                    setDifficulty(d);
                    setStreakLevel(0);
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 10,
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{cfg.label}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                    x{cfg.multiplier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls wager={wager} onChange={setWager} disabled={isBusy} />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={isBusy || wager <= 0 || wager > balance}
          onClick={startRound}
        >
          <Eye size={18} />{' '}
          {phase === 'choose'
            ? 'Выберите стаканчик на столе'
            : isBusy
              ? 'Идёт перемешивание…'
              : 'Начать раунд'}
        </button>
      </div>
    </div>
  );
};
