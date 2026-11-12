import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Play } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card, createDeck, formatCardRu } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import { computeHiLoOdds, HiLoGuess } from './higherLowerLogic';

interface SavedHiLoState {
  currentCard: Card;
  deck: Card[];
  historyTrail: Card[];
  streak: number;
  accumulatedMult: number;
  wager: number;
  finished: boolean;
  statusMessage: string;
}

export const HigherLowerGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
  } = useCashUp();

  const [wager, setWager] = useState<number>(30);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [session, setSession] = useState<SavedHiLoState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('higher-lower');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedHiLoState;
      setRoundId(saved.roundId);
      setSession(st);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && session && !session.finished);

  const odds = useMemo(() => {
    if (!session) return null;
    return computeHiLoOdds(session.currentCard, session.deck);
  }, [session]);

  const startNewRound = () => {
    if (isPlaying) return;
    const deck = createDeck(1);
    const first = deck.shift()!;

    const initial: SavedHiLoState = {
      currentCard: first,
      deck,
      historyTrail: [first],
      streak: 0,
      accumulatedMult: 1,
      wager,
      finished: false,
      statusMessage: `Стартовая карта: ${formatCardRu(first)}. Угадайте следующую!`,
    };

    const started = startInteractiveRound({
      gameId: 'higher-lower',
      gameName: 'Higher or Lower',
      wager,
      interactiveState: initial,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    setRoundId(started.roundId);
    setSession(initial);
  };

  const handleCashout = (overrideState?: SavedHiLoState) => {
    const cur = overrideState ?? session;
    if (!roundId || !cur || cur.finished || cur.streak === 0) return;

    const payout = roundCurrency(cur.wager * cur.accumulatedMult);
    finishRound({
      roundId,
      payout,
      multiplier: cur.accumulatedMult,
      outcome: 'win',
      summary: `Серия ${cur.streak} угаданных карт (x${cur.accumulatedMult})`,
    });

    setSession({
      ...cur,
      finished: true,
      statusMessage: `Вы забрали выигрыш ${formatAmount(payout)} (серия ${cur.streak})!`,
    });
    setRoundId(null);
  };

  const handleGuess = (guess: HiLoGuess) => {
    if (!roundId || !session || session.finished || !odds) return;
    const stepMult =
      guess === 'higher' ? odds.higherMultiplier : odds.lowerMultiplier;
    if (!stepMult) return;

    const nextDeck = [...session.deck];
    const nextCard = nextDeck.shift();
    if (!nextCard) {
      handleCashout();
      return;
    }

    playSound('cardFlip');

    if (nextCard.numericValue === session.currentCard.numericValue) {
      // Equal rank -> neutral push step, streak & multiplier continue!
      const tiedState: SavedHiLoState = {
        ...session,
        currentCard: nextCard,
        deck: nextDeck,
        historyTrail: [nextCard, ...session.historyTrail].slice(0, 8),
        statusMessage: `Равный ранг (${formatCardRu(nextCard)})! Серия и множитель сохранены.`,
      };
      setSession(tiedState);
      saveInteractiveRoundState(roundId, tiedState);
      return;
    }

    const correct =
      guess === 'higher'
        ? nextCard.numericValue > session.currentCard.numericValue
        : nextCard.numericValue < session.currentCard.numericValue;

    if (!correct) {
      const lostState: SavedHiLoState = {
        ...session,
        currentCard: nextCard,
        deck: nextDeck,
        historyTrail: [nextCard, ...session.historyTrail].slice(0, 8),
        finished: true,
        statusMessage: `Открыта ${formatCardRu(nextCard)} — серия прервана.`,
      };
      finishRound({
        roundId,
        payout: 0,
        multiplier: null,
        outcome: 'loss',
        summary: `Ошибка на шаге ${session.streak + 1}: выпала ${formatCardRu(nextCard)}`,
      });
      setSession(lostState);
      setRoundId(null);
      return;
    }

    const nextMult = Math.round(session.accumulatedMult * stepMult * 100) / 100;
    const nextStreak = session.streak + 1;
    const wonStepState: SavedHiLoState = {
      ...session,
      currentCard: nextCard,
      deck: nextDeck,
      historyTrail: [nextCard, ...session.historyTrail].slice(0, 8),
      streak: nextStreak,
      accumulatedMult: nextMult,
      statusMessage: `Верно! Выпала ${formatCardRu(nextCard)} · Серия: ${nextStreak} (x${nextMult})`,
    };

    if (nextDeck.length < 2) {
      handleCashout(wonStepState);
      return;
    }

    setSession(wonStepState);
    saveInteractiveRoundState(roundId, wonStepState);
  };

  const cashoutAmount = session
    ? roundCurrency(session.wager * session.accumulatedMult)
    : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Card Stage */}
      <div
        style={{
          backgroundColor: 'var(--felt-bg)',
          border: '1px solid var(--felt-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 26,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          minHeight: 400,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badgeEmerald mono">
            Серия верных ответов: {session?.streak ?? 0}
          </span>
          <span className="badge badgeGold mono">
            Накопленный x{(session?.accumulatedMult ?? 1).toFixed(2)}
          </span>
          {session && (
            <span className="badge badgeNeutral mono">
              В колоде: {session.deck.length} карт
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <PlayingCard
            card={session?.currentCard ?? null}
            faceDown={!session}
            size="lg"
            highlighted={Boolean(session && session.streak > 0 && !session.finished)}
          />
        </div>

        <div
          aria-live="polite"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(11, 14, 20, 0.72)',
            color: '#f8fafc',
            fontSize: '0.88rem',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {session
            ? session.statusMessage
            : 'Нажмите «Начать серию», чтобы открыть первую карту из колоды (2 — младшая, Туз — старшая)'}
        </div>

        {session && session.historyTrail.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {session.historyTrail.map((c, idx) => (
              <PlayingCard key={`${c.id}-${idx}`} card={c} size="sm" />
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
        <BetControls wager={wager} onChange={setWager} disabled={isPlaying} />

        {!isPlaying ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={wager <= 0 || wager > balance}
            onClick={startNewRound}
          >
            <Play size={17} /> Начать серию
          </button>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className="btn btnPrimary btnLg"
                disabled={!odds?.higherMultiplier}
                onClick={() => handleGuess('higher')}
                style={{ flexDirection: 'column', gap: 3, padding: '14px 10px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUp size={18} /> Выше
                </span>
                <span className="mono" style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                  {odds?.higherMultiplier
                    ? `x${odds.higherMultiplier} (${odds.higherChancePct}%)`
                    : 'Недоступно (Туз)'}
                </span>
              </button>

              <button
                type="button"
                className="btn btnSecondary btnLg"
                disabled={!odds?.lowerMultiplier}
                onClick={() => handleGuess('lower')}
                style={{ flexDirection: 'column', gap: 3, padding: '14px 10px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDown size={18} /> Ниже
                </span>
                <span
                  className="mono"
                  style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}
                >
                  {odds?.lowerMultiplier
                    ? `x${odds.lowerMultiplier} (${odds.lowerChancePct}%)`
                    : 'Недоступно (2)'}
                </span>
              </button>
            </div>

            <button
              type="button"
              className="btn btnGold btnLg"
              disabled={(session?.streak ?? 0) === 0}
              onClick={() => handleCashout()}
            >
              <CheckCircle2 size={18} />{' '}
              {(session?.streak ?? 0) === 0
                ? 'Угадайте хотя бы 1 карту для вывода'
                : `Забрать ${formatAmount(cashoutAmount)} (x${session?.accumulatedMult})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
