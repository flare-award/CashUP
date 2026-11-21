import React, { useEffect, useState } from 'react';
import { Lightbulb, Play, RefreshCw } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  dealVideoPokerInitial,
  evaluateJacksOrBetter,
  suggestBestHolds,
  VIDEO_POKER_PAYTABLE,
} from './videoPokerLogic';

interface SavedVideoPokerState {
  wager: number;
  hand: Card[];
  drawPool: Card[];
  held: boolean[]; // length 5
  drawn: boolean;
}

export const VideoPokerGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [vp, setVp] = useState<SavedVideoPokerState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('video-poker');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedVideoPokerState;
      setRoundId(saved.roundId);
      setVp(st);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isHoldingPhase = Boolean(roundId && vp && !vp.drawn);
  const currentEval = vp ? evaluateJacksOrBetter(vp.hand) : null;

  const handleDeal = () => {
    if (isHoldingPhase) return;
    const { initialHand, drawPool } = dealVideoPokerInitial();
    const initial: SavedVideoPokerState = {
      wager,
      hand: initialHand,
      drawPool,
      held: [false, false, false, false, false],
      drawn: false,
    };

    const started = startInteractiveRound({
      gameId: 'video-poker',
      gameName: 'Видеопокер',
      wager,
      interactiveState: initial,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    setRoundId(started.roundId);
    setVp(initial);
  };

  const toggleHold = (idx: number) => {
    if (!roundId || !vp || vp.drawn) return;
    playSound('click');
    const nextHeld = vp.held.map((h, i) => (i === idx ? !h : h));
    const nextState: SavedVideoPokerState = { ...vp, held: nextHeld };
    setVp(nextState);
    saveInteractiveRoundState(roundId, nextState);
  };

  const handleAutoHint = () => {
    if (!roundId || !vp || vp.drawn) return;
    playSound('select');
    const recommended = suggestBestHolds(vp.hand);
    const nextState: SavedVideoPokerState = { ...vp, held: recommended };
    setVp(nextState);
    saveInteractiveRoundState(roundId, nextState);
  };

  const handleDraw = () => {
    if (!roundId || !vp || vp.drawn) return;

    let poolIdx = 0;
    const finalHand = vp.hand.map((card, idx) => {
      if (vp.held[idx]) return card;
      const replacement = vp.drawPool[poolIdx]!;
      poolIdx += 1;
      return replacement;
    });

    const evalRes = evaluateJacksOrBetter(finalHand);
    const payout = roundCurrency(vp.wager * evalRes.multiplier);
    const outcome =
      evalRes.multiplier > 1
        ? 'win'
        : evalRes.multiplier === 1
          ? 'push'
          : 'loss';

    playSound('cardFlip');
    finishRound({
      roundId,
      payout,
      multiplier: evalRes.multiplier > 0 ? evalRes.multiplier : null,
      outcome,
      summary: `Видеопокер · ${evalRes.nameRu}${
        evalRes.multiplier > 0 ? ` (x${evalRes.multiplier})` : ''
      }`,
    });

    setVp({
      ...vp,
      hand: finalHand,
      drawn: true,
    });
    setRoundId(null);
  };

  const activeWager = vp ? vp.wager : wager;
  const heldCount = vp ? vp.held.filter(Boolean).length : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Video Poker Cabinet */}
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
        {/* Step Indicator Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span className={`badge ${isHoldingPhase ? 'badgeGold' : 'badgeEmerald'}`}>
            {!vp
              ? 'Готов к раздаче'
              : isHoldingPhase
                ? 'Шаг 1 из 2 · Выберите какие карты оставить'
                : 'Шаг 2 из 2 · Раздача завершена'}
          </span>

          {isHoldingPhase && (
            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={handleAutoHint}
            >
              <Lightbulb size={14} /> Подсказать выбор
            </button>
          )}
        </div>

        {/* Live Paytable */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: 6,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {VIDEO_POKER_PAYTABLE.map((row) => {
            const matched = currentEval?.rankId === row.id;
            return (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  borderRadius: 7,
                  fontSize: '0.78rem',
                  fontWeight: matched ? 800 : 600,
                  backgroundColor: matched
                    ? 'var(--accent-primary-soft)'
                    : 'transparent',
                  border: `1px solid ${
                    matched ? 'var(--accent-primary)' : 'transparent'
                  }`,
                }}
              >
                <span>{row.nameRu}</span>
                <span className="mono" style={{ color: 'var(--accent-gold)' }}>
                  x{row.multiplier} ({formatAmount(roundCurrency(activeWager * row.multiplier))})
                </span>
              </div>
            );
          })}
        </div>

        {/* 5 Cards Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '18px 10px',
            borderRadius: 14,
            background: 'radial-gradient(circle, #112e22 0%, #091812 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          {[0, 1, 2, 3, 4].map((idx) => {
            const card = vp?.hand[idx] ?? null;
            const isHeld = vp?.held[idx] ?? false;
            const isWinningCard =
              Boolean(vp?.drawn && card && currentEval?.winningCardIds.includes(card.id));

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Top Pill: shows HOLD during step 1, or Held vs New Card on step 2 */}
                {vp ? (
                  isHoldingPhase ? (
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 999,
                        backgroundColor: isHeld ? '#f59e0b' : 'rgba(148, 163, 184, 0.18)',
                        color: isHeld ? '#0f172a' : '#cbd5e1',
                      }}
                    >
                      {isHeld ? 'ОСТАВЛЕНО' : 'НА ОБМЕН'}
                    </span>
                  ) : (
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 999,
                        backgroundColor: isWinningCard
                          ? '#10b981'
                          : isHeld
                            ? 'rgba(148, 163, 184, 0.22)'
                            : 'rgba(59, 130, 246, 0.28)',
                        color: isWinningCard ? '#022c22' : '#e2e8f0',
                      }}
                    >
                      {isWinningCard
                        ? 'В КОМБИНАЦИИ'
                        : isHeld
                          ? 'ОСТАВЛЕНА'
                          : 'НОВАЯ КАРТА'}
                    </span>
                  )
                ) : (
                  <span style={{ height: 20 }} />
                )}

                <button
                  type="button"
                  disabled={!isHoldingPhase}
                  onClick={() => toggleHold(idx)}
                  aria-label={`Карта ${idx + 1}${isHeld ? ' (оставлена)' : ''}`}
                  style={{
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: isHoldingPhase ? 'pointer' : 'default',
                    transform:
                      (isHoldingPhase && isHeld) || isWinningCard
                        ? 'translateY(-6px)'
                        : 'none',
                    transition: 'transform 140ms ease',
                  }}
                >
                  <PlayingCard
                    card={card}
                    faceDown={!vp}
                    size="md"
                    highlighted={(isHoldingPhase && isHeld) || isWinningCard}
                  />
                </button>

                {isHoldingPhase && (
                  <button
                    type="button"
                    onClick={() => toggleHold(idx)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 7,
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      backgroundColor: isHeld ? '#f59e0b' : 'rgba(30, 41, 59, 0.9)',
                      color: isHeld ? '#0f172a' : '#e2e8f0',
                      border: `1px solid ${isHeld ? '#fef08a' : '#475569'}`,
                    }}
                  >
                    {isHeld ? 'Оставлено ✓' : 'Оставить'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Result / Action Banner right under the cards */}
        <div
          role="status"
          style={{
            padding: '11px 14px',
            borderRadius: 10,
            backgroundColor:
              vp?.drawn && currentEval && currentEval.multiplier > 0
                ? 'var(--accent-primary-soft)'
                : 'var(--bg-surface-subtle)',
            border: `1px solid ${
              vp?.drawn && currentEval && currentEval.multiplier > 0
                ? 'var(--accent-primary)'
                : 'var(--border-subtle)'
            }`,
            textAlign: 'center',
            fontSize: '0.86rem',
            fontWeight: 700,
            color:
              vp?.drawn && currentEval && currentEval.multiplier > 0
                ? 'var(--accent-primary)'
                : 'var(--text-primary)',
          }}
        >
          {!vp
            ? 'Нажмите «Раздать 5 карт», чтобы начать новый раунд.'
            : isHoldingPhase
              ? `Выбрано оставить: ${heldCount} из 5 карт (${5 - heldCount} заменятся). Когда готовы — нажмите жёлтую кнопку обмена!`
              : currentEval && currentEval.multiplier > 0
                ? `Раунд завершён! Итог: ${currentEval.nameRu} — выплата ${formatAmount(
                    roundCurrency(vp.wager * currentEval.multiplier)
                  )} (x${currentEval.multiplier}). Для новой игры сдайте новые 5 карт.`
                : 'Раунд завершён — выигрышной комбинации нет. Сдайте новые 5 карт для следующего раунда.'}
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
        <BetControls wager={wager} onChange={setWager} disabled={isHoldingPhase} />

        {!isHoldingPhase ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={wager <= 0 || wager > balance}
            onClick={handleDeal}
          >
            <Play size={17} /> {vp ? 'Новая раздача (5 новых карт)' : 'Раздать 5 карт'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btnGold btnLg"
            onClick={handleDraw}
          >
            <RefreshCw size={17} />{' '}
            {heldCount === 5
              ? 'Зафиксировать все 5 карт'
              : `Заменить остальные карты (${5 - heldCount} шт.)`}
          </button>
        )}
      </div>
    </div>
  );
};
