import React, { useRef, useState } from 'react';
import { Play, Shuffle, Trash2 } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { cryptoShuffle } from '../../core/rng';
import { useCashUp } from '../../state/CashUpContext';
import { drawKenoRound, KENO_PAYTABLE } from './kenoLogic';

export const KenoGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.25);
  const [selected, setSelected] = useState<number[]>([3, 7, 14, 21, 33]);
  const [revealedDrawn, setRevealedDrawn] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const balance = activeProfile?.balance ?? 0;

  const toggleNumber = (n: number) => {
    if (isDrawing) return;
    playSound('click');
    setRevealedDrawn([]);
    setLastSummary(null);
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 10) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const handleQuickPick = () => {
    if (isDrawing) return;
    playSound('select');
    setRevealedDrawn([]);
    setLastSummary(null);
    const count = selected.length >= 1 ? selected.length : 5;
    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    setSelected(
      cryptoShuffle(pool)
        .slice(0, count)
        .sort((a, b) => a - b)
    );
  };

  const handlePlay = () => {
    if (lockRef.current || isDrawing || selected.length === 0) return;

    const result = drawKenoRound(selected, wager);
    const outcome =
      result.payout > wager
        ? 'win'
        : result.payout === wager && result.payout > 0
          ? 'push'
          : 'loss';

    const started = startPrecomputedRound({
      gameId: 'keno',
      gameName: 'Кено',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.multiplier > 0 ? result.multiplier : null,
        outcome,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsDrawing(true);
    setRevealedDrawn([]);
    setLastSummary(null);

    const stepMs = scaleDuration(110);
    if (stepMs === 0) {
      setRevealedDrawn(result.drawnNumbers);
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.multiplier > 0 ? result.multiplier : null,
        outcome,
        summary: result.summary,
      });
      setLastSummary(result.summary);
      setIsDrawing(false);
      lockRef.current = false;
      return;
    }

    result.drawnNumbers.forEach((ball, idx) => {
      window.setTimeout(() => {
        playSound(selected.includes(ball) ? 'plinkoPeg' : 'click');
        setRevealedDrawn((prev) => [...prev, ball]);
      }, (idx + 1) * stepMs);
    });

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.multiplier > 0 ? result.multiplier : null,
        outcome,
        summary: result.summary,
      });
      setLastSummary(result.summary);
      setIsDrawing(false);
      lockRef.current = false;
    }, result.drawnNumbers.length * stepMs + 140);
  };

  const activePayRow =
    selected.length > 0 ? (KENO_PAYTABLE[selected.length] ?? []) : [];
  const currentHits = revealedDrawn.filter((n) => selected.includes(n)).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* 40-Ball Grid */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Выбрано чисел: <strong>{selected.length}</strong> / 10
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              disabled={isDrawing}
              onClick={handleQuickPick}
            >
              <Shuffle size={14} /> Автовыбор
            </button>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              disabled={isDrawing || selected.length === 0}
              onClick={() => {
                setSelected([]);
                setRevealedDrawn([]);
              }}
            >
              <Trash2 size={14} /> Очистить
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 8,
          }}
        >
          {Array.from({ length: 40 }, (_, i) => {
            const num = i + 1;
            const isPicked = selected.includes(num);
            const isDrawn = revealedDrawn.includes(num);
            const isHit = isPicked && isDrawn;

            let bg = 'var(--bg-surface-subtle)';
            let border = 'var(--border-subtle)';
            let color = 'var(--text-primary)';

            if (isHit) {
              bg = '#10b981';
              border = '#6ee7b7';
              color = '#04130d';
            } else if (isPicked) {
              bg = 'rgba(59, 130, 246, 0.24)';
              border = '#3b82f6';
            } else if (isDrawn) {
              bg = 'rgba(245, 158, 11, 0.2)';
              border = '#f59e0b';
            }

            return (
              <button
                key={num}
                type="button"
                disabled={isDrawing}
                onClick={() => toggleNumber(num)}
                className="mono"
                style={{
                  height: 44,
                  borderRadius: 9,
                  backgroundColor: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                {num}
              </button>
            );
          })}
        </div>

        {activePayRow.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingTop: 6,
            }}
          >
            {activePayRow.map((mult, hitsIdx) => {
              const activeHit =
                revealedDrawn.length === 10 && currentHits === hitsIdx;
              return (
                <div
                  key={hitsIdx}
                  style={{
                    flex: 1,
                    minWidth: 54,
                    padding: '6px 4px',
                    borderRadius: 8,
                    textAlign: 'center',
                    backgroundColor: activeHit
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1px solid ${
                      activeHit ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {hitsIdx}×
                  </div>
                  <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    x{mult}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lastSummary && (
          <div
            role="status"
            style={{
              textAlign: 'center',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
            }}
          >
            {lastSummary}
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
        <BetControls wager={wager} onChange={setWager} disabled={isDrawing} />
        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={
            isDrawing || selected.length === 0 || wager <= 0 || wager > balance
          }
          onClick={handlePlay}
        >
          <Play size={17} />{' '}
          {isDrawing
            ? 'Розыгрыш шаров…'
            : selected.length === 0
              ? 'Выберите от 1 до 10 чисел'
              : `Запустить тираж (${formatAmount(wager)})`}
        </button>
      </div>
    </div>
  );
};
