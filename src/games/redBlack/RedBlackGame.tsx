import React, { useRef, useState } from 'react';
import { Card, isRedSuit } from '../../core/cards';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard, SuitSvg } from '../../components/ui/PlayingCard';
import { useCashUp } from '../../state/CashUpContext';
import {
  getChoiceLabelRu,
  getRedBlackMultiplier,
  playRedBlackRound,
  RedBlackChoice,
} from './redBlackLogic';

export const RedBlackGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [choice, setChoice] = useState<RedBlackChoice>('red');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [faceDown, setFaceDown] = useState<boolean>(true);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [lastStatus, setLastStatus] = useState<{
    won: boolean;
    payout: number;
    summary: string;
  } | null>(null);
  const [recentCards, setRecentCards] = useState<Card[]>([]);

  const balance = activeProfile?.balance ?? 0;

  const handleDeal = () => {
    if (lockRef.current || isFlipping) return;

    const result = playRedBlackRound(choice, wager);
    const outcome = result.won ? 'win' : 'loss';

    const started = startPrecomputedRound({
      gameId: 'red-black',
      gameName: 'Красное или чёрное',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsFlipping(true);
    setLastStatus(null);

    const prepMs = scaleDuration(180);
    const flipMs = scaleDuration(520);

    setFaceDown(true);
    playSound('cardDeal');

    window.setTimeout(() => {
      setCurrentCard(result.card);
      setFaceDown(false);
      playSound('cardFlip');
    }, prepMs);

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome,
        summary: result.summary,
      });
      setLastStatus({
        won: result.won,
        payout: result.payout,
        summary: result.summary,
      });
      setRecentCards((prev) => [result.card, ...prev].slice(0, 10));
      setIsFlipping(false);
      lockRef.current = false;
    }, prepMs + flipMs);
  };

  const resetToBack = () => {
    if (isFlipping) return;
    playSound('click');
    setFaceDown(true);
    setLastStatus(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Card Table Stage */}
      <div
        style={{
          backgroundColor: 'var(--felt-bg)',
          border: '1px solid var(--felt-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          minHeight: 390,
          justifyContent: 'center',
        }}
      >
        <PlayingCard
          card={currentCard}
          faceDown={faceDown}
          size="lg"
          highlighted={Boolean(lastStatus?.won && !faceDown)}
        />

        <div
          aria-live="polite"
          style={{
            textAlign: 'center',
            minHeight: 54,
          }}
        >
          {isFlipping ? (
            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
              Открываем карту…
            </span>
          ) : lastStatus ? (
            <div>
              <div
                style={{
                  fontSize: '1.08rem',
                  fontWeight: 700,
                  color: lastStatus.won ? 'var(--accent-primary)' : 'var(--color-danger)',
                }}
              >
                {lastStatus.won
                  ? `Победа! +${formatAmount(lastStatus.payout)}`
                  : 'Не угадали в этом раунде'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                {lastStatus.summary}
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Выберите Красное или Чёрное и переверните закрытую карту
            </span>
          )}
        </div>

        {recentCards.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {recentCards.map((c, idx) => (
              <span
                key={`${c.id}-${idx}`}
                className="mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: '#ffffff',
                  color: isRedSuit(c.suit) ? '#dc2626' : '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {c.rank}
                <SuitSvg suit={c.suit} size={11} />
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
          gap: 18,
        }}
      >
        <div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Основной выбор (шанс 50% · выплата x2.0)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              disabled={isFlipping}
              onClick={() => {
                playSound('click');
                setChoice('red');
              }}
              style={{
                padding: '14px 12px',
                borderRadius: 12,
                backgroundColor:
                  choice === 'red' ? '#dc2626' : 'rgba(220, 38, 38, 0.14)',
                color: choice === 'red' ? '#ffffff' : '#f87171',
                border: `2px solid ${choice === 'red' ? '#fca5a5' : 'rgba(220, 38, 38, 0.35)'}`,
                fontWeight: 700,
                fontSize: '0.96rem',
              }}
            >
              Красное · x2
            </button>

            <button
              type="button"
              disabled={isFlipping}
              onClick={() => {
                playSound('click');
                setChoice('black');
              }}
              style={{
                padding: '14px 12px',
                borderRadius: 12,
                backgroundColor: choice === 'black' ? '#1e293b' : 'var(--bg-surface-subtle)',
                color: choice === 'black' ? '#ffffff' : 'var(--text-primary)',
                border: `2px solid ${choice === 'black' ? '#94a3b8' : 'var(--border-strong)'}`,
                fontWeight: 700,
                fontSize: '0.96rem',
              }}
            >
              Чёрное · x2
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Точная масть (опционально · шанс 25% · выплата x3.9)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(['hearts', 'diamonds', 'spades', 'clubs'] as const).map((s) => {
              const active = choice === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isFlipping}
                  onClick={() => {
                    playSound('click');
                    setChoice(s);
                  }}
                  style={{
                    padding: '9px 6px',
                    borderRadius: 10,
                    backgroundColor: active ? 'var(--accent-primary-soft)' : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <SuitSvg suit={s} size={18} />
                  <span>x3.9</span>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls wager={wager} onChange={setWager} disabled={isFlipping} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <span>Выбор: {getChoiceLabelRu(choice)}</span>
          <strong className="mono" style={{ color: 'var(--accent-primary)' }}>
            Потенциал: {formatAmount(wager * getRedBlackMultiplier(choice))}
          </strong>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btnPrimary btnLg"
            style={{ flex: 1 }}
            disabled={isFlipping || wager <= 0 || wager > balance}
            onClick={handleDeal}
          >
            {isFlipping ? 'Переворачиваем…' : 'Перевернуть карту'}
          </button>
          {!faceDown && !isFlipping && (
            <button
              type="button"
              className="btn btnSecondary btnLg"
              onClick={resetToBack}
              title="Закрыть карту"
            >
              Скрыть
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
