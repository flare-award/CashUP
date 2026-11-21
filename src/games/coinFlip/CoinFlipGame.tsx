import React, { useEffect, useState } from 'react';
import { CheckCircle2, Coins, Play } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  CoinSide,
  coinSideLabelRu,
  computeCoinStreakMultiplier,
  generateCoinSequence,
  MAX_COIN_STREAK,
} from './coinFlipLogic';

interface SavedCoinState {
  wager: number;
  sequence: CoinSide[];
  streak: number;
  history: CoinSide[];
  lastFace: CoinSide;
  finished: boolean;
}

export const CoinFlipGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [coinState, setCoinState] = useState<SavedCoinState | null>(null);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [rotDeg, setRotDeg] = useState<number>(0);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('coin-flip');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedCoinState;
      setRoundId(saved.roundId);
      setCoinState(st);
      setWager(st.wager);
      setRotDeg(st.lastFace === 'heads' ? 0 : 180);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && coinState && !coinState.finished);

  const handleStart = () => {
    if (isPlaying || flipping) return;
    const sequence = generateCoinSequence(MAX_COIN_STREAK);
    const initial: SavedCoinState = {
      wager,
      sequence,
      streak: 0,
      history: [],
      lastFace: 'heads',
      finished: false,
    };

    const started = startInteractiveRound({
      gameId: 'coin-flip',
      gameName: 'Орёл или Решка',
      wager,
      interactiveState: initial,
    });

    if (!started.ok) return;

    playSound('select');
    setRoundId(started.roundId);
    setCoinState(initial);
  };

  const handleCashout = (overrideState?: SavedCoinState) => {
    const cur = overrideState ?? coinState;
    if (!roundId || !cur || cur.finished || cur.streak === 0 || flipping) return;

    const mult = computeCoinStreakMultiplier(cur.streak);
    const payout = roundCurrency(cur.wager * mult);

    finishRound({
      roundId,
      payout,
      multiplier: mult,
      outcome: 'win',
      summary: `Орёл или Решка · Серия ${cur.streak} угадываний (x${mult})`,
    });

    setCoinState({ ...cur, finished: true });
    setRoundId(null);
  };

  const handleGuess = (guess: CoinSide) => {
    if (!roundId || !coinState || coinState.finished || flipping) return;

    const actual = coinState.sequence[coinState.streak]!;
    const dur = scaleDuration(680);
    setFlipping(true);
    playSound('coinFlip');

    const baseTurns = (Math.floor(rotDeg / 360) + 4) * 360;
    const nextRot = baseTurns + (actual === 'heads' ? 0 : 180);
    setRotDeg(nextRot);

    window.setTimeout(() => {
      const wonStep = guess === actual;
      if (!wonStep) {
        const lost: SavedCoinState = {
          ...coinState,
          history: [...coinState.history, actual],
          lastFace: actual,
          finished: true,
        };
        finishRound({
          roundId,
          payout: 0,
          multiplier: null,
          outcome: 'loss',
          summary: `Орёл или Решка · Выпала сторона «${coinSideLabelRu(actual)}» (серия прервана на шаге ${coinState.streak + 1})`,
        });
        setCoinState(lost);
        setRoundId(null);
        setFlipping(false);
        return;
      }

      playSound('win');
      const nextStreak = coinState.streak + 1;
      const updated: SavedCoinState = {
        ...coinState,
        streak: nextStreak,
        history: [...coinState.history, actual],
        lastFace: actual,
      };

      setFlipping(false);
      if (nextStreak >= MAX_COIN_STREAK) {
        setCoinState(updated);
        handleCashout(updated);
        return;
      }

      setCoinState(updated);
      saveInteractiveRoundState(roundId, updated);
    }, dur);
  };

  const streak = coinState?.streak ?? 0;
  const currentMult = streak > 0 ? computeCoinStreakMultiplier(streak) : 1;
  const nextMult = computeCoinStreakMultiplier(streak + 1);
  const potentialWin = roundCurrency((coinState?.wager ?? wager) * currentMult);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* 3D Coin Stage */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 400,
          }}
        >
          <span className="badge badgeEmerald mono">Серия: {streak}</span>
          <span className="badge badgeGold mono">След. бросок: x{nextMult}</span>
        </div>

        {/* 3D Flipping Coin */}
        <div style={{ perspective: 900, width: 176, height: 176 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotDeg}deg)`,
              transition: flipping
                ? `transform ${scaleDuration(680)}ms cubic-bezier(0.2, 0.85, 0.25, 1)`
                : 'none',
            }}
          >
            {/* Front: HEADS (Орёл / Корона) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 32% 30%, #fde047, #f59e0b 65%, #b45309)',
                border: '5px solid #fef08a',
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="78" height="78" viewBox="0 0 64 64" aria-hidden="true">
                <path
                  d="M10 46L16 20L28 32L32 16L36 32L48 20L54 46H10Z"
                  fill="#451a03"
                />
                <rect x="12" y="49" width="40" height="5" rx="2.5" fill="#451a03" />
              </svg>
              <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#451a03' }}>
                ОРЁЛ
              </span>
            </div>

            {/* Back: TAILS (Решка / Изумрудный кристалл) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 32% 30%, #6ee7b7, #10b981 65%, #065f46)',
                border: '5px solid #a7f3d0',
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="76" height="76" viewBox="0 0 64 64" aria-hidden="true">
                <polygon points="32,10 52,32 32,54 12,32" fill="#022c22" />
                <polygon points="32,18 44,32 32,46 20,32" fill="#a7f3d0" />
              </svg>
              <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#022c22' }}>
                РЕШКА
              </span>
            </div>
          </div>
        </div>

        {/* Side Choice Buttons when playing */}
        {isPlaying && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 360 }}>
            <button
              type="button"
              className="btn btnGold btnLg"
              disabled={flipping}
              onClick={() => handleGuess('heads')}
            >
              Орёл
            </button>
            <button
              type="button"
              className="btn btnPrimary btnLg"
              disabled={flipping}
              onClick={() => handleGuess('tails')}
            >
              Решка
            </button>
          </div>
        )}

        {/* History pills of current round */}
        {coinState && coinState.history.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {coinState.history.map((side, i) => (
              <span
                key={i}
                className={`badge ${side === 'heads' ? 'badgeGold' : 'badgeEmerald'}`}
              >
                #{i + 1}: {coinSideLabelRu(side)}
              </span>
            ))}
          </div>
        )}
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
        <BetControls wager={wager} onChange={setWager} disabled={isPlaying || flipping} />

        {!isPlaying ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={flipping || wager <= 0 || wager > balance}
            onClick={handleStart}
          >
            <Play size={17} /> Начать серию бросков
          </button>
        ) : (
          <button
            type="button"
            className="btn btnGold btnLg"
            disabled={streak === 0 || flipping}
            onClick={() => handleCashout()}
          >
            <CheckCircle2 size={18} />{' '}
            {streak === 0
              ? 'Выберите Орёл или Решку'
              : `Забрать ${formatAmount(potentialWin)} (x${currentMult})`}
          </button>
        )}

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            fontSize: '0.81rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Coins size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
          <span>
            Забрать выигрыш можно сразу после 1-го верного броска (x1.96) или копить серию до 10 бросков подряд (x1003.52).
          </span>
        </div>
      </div>
    </div>
  );
};
