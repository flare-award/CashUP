import React, { useEffect, useState } from 'react';
import { CopyPlus, Hand, Play, Plus, Zap } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card, createDeck } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  canSplitHand,
  PlayerBjHand,
  playOutDealerHand,
  scoreBlackjackHand,
  settleBlackjackHands,
} from './blackjackLogic';

interface SavedBlackjackState {
  phase: 'player_turn' | 'finished';
  shoe: Card[];
  dealerCards: Card[];
  playerHands: PlayerBjHand[];
  activeHandIndex: number;
  baseWager: number;
}

export const BlackjackGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    increaseRoundWager,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
  } = useCashUp();

  const [wager, setWager] = useState<number>(50);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [table, setTable] = useState<SavedBlackjackState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  // Resume active round if user refreshed page
  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('blackjack');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedBlackjackState;
      setRoundId(saved.roundId);
      setTable(st);
      setWager(st.baseWager);
    }
  }, [roundId, getInteractiveRound]);

  const concludeTable = (
    rid: string,
    hands: PlayerBjHand[],
    dealerCards: Card[],
    shoe: Card[],
    baseWager: number
  ) => {
    const allBusted = hands.every(
      (h) => scoreBlackjackHand(h.cards, h.fromSplit).isBust
    );
    const { finalDealerCards } = allBusted
      ? { finalDealerCards: [...dealerCards] }
      : playOutDealerHand(dealerCards, shoe);

    playSound('cardFlip');
    const settled = settleBlackjackHands(hands, finalDealerCards);

    const outcome =
      settled.totalPayout > settled.totalWager
        ? 'win'
        : settled.totalPayout === settled.totalWager && settled.totalPayout > 0
          ? 'push'
          : 'loss';

    const mult =
      settled.totalPayout > 0 && settled.totalWager > 0
        ? roundCurrency(settled.totalPayout / settled.totalWager)
        : null;

    const summary = settled.settledHands.map((h) => h.outcomeText).join(' | ');

    finishRound({
      roundId: rid,
      payout: settled.totalPayout,
      multiplier: mult,
      outcome,
      summary: summary || 'Раунд завершён',
    });

    setTable({
      phase: 'finished',
      shoe: [],
      dealerCards: finalDealerCards,
      playerHands: settled.settledHands,
      activeHandIndex: 0,
      baseWager,
    });
    setRoundId(null);
  };

  const handleDeal = () => {
    if (roundId && table?.phase === 'player_turn') return;

    const shoe = createDeck(6);
    const p1 = shoe.shift()!;
    const d1 = shoe.shift()!;
    const p2 = shoe.shift()!;
    const d2 = shoe.shift()!;

    const initialHand: PlayerBjHand = {
      cards: [p1, p2],
      wager,
      stood: false,
      doubled: false,
      fromSplit: false,
    };

    const initialState: SavedBlackjackState = {
      phase: 'player_turn',
      shoe,
      dealerCards: [d1, d2],
      playerHands: [initialHand],
      activeHandIndex: 0,
      baseWager: wager,
    };

    const started = startInteractiveRound({
      gameId: 'blackjack',
      gameName: 'Блэкджек',
      wager,
      interactiveState: initialState,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    const pScore = scoreBlackjackHand(initialHand.cards);
    const dScore = scoreBlackjackHand([d1, d2]);

    // Immediate resolution on Natural Blackjack (21 on initial 2 cards)
    if (pScore.isNaturalBlackjack || dScore.isNaturalBlackjack) {
      concludeTable(started.roundId, [initialHand], [d1, d2], shoe, wager);
      return;
    }

    setRoundId(started.roundId);
    setTable(initialState);
  };

  const advanceHandOrDealer = (rid: string, nextState: SavedBlackjackState) => {
    const nextIdx = nextState.playerHands.findIndex((h) => {
      const sc = scoreBlackjackHand(h.cards, h.fromSplit);
      return !h.stood && !sc.isBust && sc.total < 21;
    });

    if (nextIdx === -1) {
      concludeTable(
        rid,
        nextState.playerHands,
        nextState.dealerCards,
        nextState.shoe,
        nextState.baseWager
      );
      return;
    }

    const updated: SavedBlackjackState = {
      ...nextState,
      activeHandIndex: nextIdx,
    };
    setTable(updated);
    saveInteractiveRoundState(rid, updated);
  };

  const handleHit = () => {
    if (!roundId || !table || table.phase !== 'player_turn') return;
    const shoe = [...table.shoe];
    const drawn = shoe.shift();
    if (!drawn) return;

    playSound('cardDeal');
    const idx = table.activeHandIndex;
    const hands = table.playerHands.map((h, i) =>
      i === idx ? { ...h, cards: [...h.cards, drawn] } : h
    );

    advanceHandOrDealer(roundId, {
      ...table,
      shoe,
      playerHands: hands,
    });
  };

  const handleStand = () => {
    if (!roundId || !table || table.phase !== 'player_turn') return;
    playSound('click');
    const idx = table.activeHandIndex;
    const hands = table.playerHands.map((h, i) =>
      i === idx ? { ...h, stood: true } : h
    );
    advanceHandOrDealer(roundId, {
      ...table,
      playerHands: hands,
    });
  };

  const handleDoubleDown = () => {
    if (!roundId || !table || table.phase !== 'player_turn') return;
    const idx = table.activeHandIndex;
    const currentHand = table.playerHands[idx]!;
    if (currentHand.cards.length !== 2) return;

    const addon = increaseRoundWager(roundId, currentHand.wager, 'Double Down в Блэкджеке');
    if (!addon.ok) return;

    const shoe = [...table.shoe];
    const drawn = shoe.shift();
    if (!drawn) return;

    playSound('cardDeal');
    const hands = table.playerHands.map((h, i) =>
      i === idx
        ? {
            ...h,
            cards: [...h.cards, drawn],
            wager: roundCurrency(h.wager * 2),
            stood: true,
            doubled: true,
          }
        : h
    );

    advanceHandOrDealer(roundId, {
      ...table,
      shoe,
      playerHands: hands,
    });
  };

  const handleSplit = () => {
    if (!roundId || !table || table.phase !== 'player_turn') return;
    if (table.playerHands.length !== 1) return;
    const hand0 = table.playerHands[0]!;
    if (!canSplitHand(hand0.cards)) return;

    const addon = increaseRoundWager(roundId, hand0.wager, 'Split руки в Блэкджеке');
    if (!addon.ok) return;

    const shoe = [...table.shoe];
    const draw1 = shoe.shift()!;
    const draw2 = shoe.shift()!;

    playSound('cardDeal');
    const splitHands: PlayerBjHand[] = [
      {
        cards: [hand0.cards[0]!, draw1],
        wager: hand0.wager,
        stood: false,
        doubled: false,
        fromSplit: true,
      },
      {
        cards: [hand0.cards[1]!, draw2],
        wager: hand0.wager,
        stood: false,
        doubled: false,
        fromSplit: true,
      },
    ];

    advanceHandOrDealer(roundId, {
      ...table,
      shoe,
      playerHands: splitHands,
      activeHandIndex: 0,
    });
  };

  const isPlaying = Boolean(roundId && table?.phase === 'player_turn');
  const activeHand = isPlaying && table ? table.playerHands[table.activeHandIndex] : null;
  const canDouble = Boolean(
    activeHand && activeHand.cards.length === 2 && balance >= activeHand.wager
  );
  const canSplit = Boolean(
    isPlaying &&
      table &&
      table.playerHands.length === 1 &&
      canSplitHand(table.playerHands[0]!.cards) &&
      balance >= table.playerHands[0]!.wager
  );

  const dealerVisibleScore = table
    ? table.phase === 'finished'
      ? scoreBlackjackHand(table.dealerCards).total
      : scoreBlackjackHand([table.dealerCards[0]!]).total
    : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 330px',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <style>{`
        @media (max-width: 980px) {
          .bj-grid-override { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Felt Table */}
      <div
        className="bj-grid-override"
        style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '1fr 330px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--felt-bg)',
            border: '1px solid var(--felt-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '26px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            minHeight: 430,
            justifyContent: 'space-between',
          }}
        >
          {/* Dealer Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.9rem' }}>
                Дилер (стоит на 17)
              </span>
              {table && (
                <span className="badge badgeNeutral mono">
                  Очки: {dealerVisibleScore}
                  {table.phase === 'player_turn' ? ' + ?' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', minHeight: 120 }}>
              {table ? (
                table.dealerCards.map((c, idx) => (
                  <PlayingCard
                    key={`${c.id}-${idx}`}
                    card={table.phase === 'player_turn' && idx === 1 ? null : c}
                    faceDown={table.phase === 'player_turn' && idx === 1}
                    size="md"
                  />
                ))
              ) : (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
          </div>

          {/* Player Hands Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                table && table.playerHands.length > 1 ? '1fr 1fr' : '1fr',
              gap: 16,
            }}
          >
            {(table?.playerHands ?? []).map((ph, idx) => {
              const sc = scoreBlackjackHand(ph.cards, ph.fromSplit);
              const isCurrent = isPlaying && table?.activeHandIndex === idx;

              return (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: 'rgba(11, 16, 24, 0.56)',
                    border: `2px solid ${
                      isCurrent ? '#10b981' : 'rgba(255, 255, 255, 0.12)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
                      {table && table.playerHands.length > 1 ? `Рука ${idx + 1}` : 'Ваши карты'}
                    </span>
                    <span
                      className={`badge mono ${
                        sc.isBust ? 'badgeDanger' : 'badgeEmerald'
                      }`}
                    >
                      {sc.total}
                      {sc.isSoft && sc.total < 21 ? ' (мягк.)' : ''}
                    </span>
                    <span className="badge badgeGold mono">
                      Ставка: {formatAmount(ph.wager)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {ph.cards.map((c, cIdx) => (
                      <PlayingCard
                        key={`${c.id}-${cIdx}`}
                        card={c}
                        size="md"
                        highlighted={Boolean(ph.payout && ph.payout > ph.wager)}
                      />
                    ))}
                  </div>

                  {ph.outcomeText && (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color:
                          (ph.payout ?? 0) > ph.wager
                            ? '#34d399'
                            : (ph.payout ?? 0) === ph.wager
                              ? '#fde68a'
                              : '#f87171',
                      }}
                    >
                      {ph.outcomeText}
                      {(ph.payout ?? 0) > 0 ? ` · +${formatAmount(ph.payout ?? 0)}` : ''}
                    </div>
                  )}
                </div>
              );
            })}

            {!table && (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '18px 0' }}>
                Установите виртуальную ставку и нажмите «Раздать карты»
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <BetControls wager={wager} onChange={setWager} disabled={isPlaying} />

          {!isPlaying ? (
            <button
              type="button"
              className="btn btnPrimary btnLg"
              disabled={wager <= 0 || wager > balance}
              onClick={handleDeal}
            >
              <Play size={17} /> Раздать карты
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className="btn btnPrimary btnLg"
                onClick={handleHit}
              >
                <Plus size={17} /> Ещё (Hit)
              </button>
              <button
                type="button"
                className="btn btnSecondary btnLg"
                onClick={handleStand}
              >
                <Hand size={17} /> Хватит (Stand)
              </button>
              <button
                type="button"
                className="btn btnGold"
                disabled={!canDouble}
                onClick={handleDoubleDown}
              >
                <Zap size={16} /> Удвоить (2×)
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                disabled={!canSplit}
                onClick={handleSplit}
              >
                <CopyPlus size={16} /> Сплит (Split)
              </button>
            </div>
          )}

          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              paddingTop: 6,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            Натуральный Блэкджек (21 с раздачи) оплачивается 3 к 2 (x2.5). Обычная победа — 1 к 1 (x2.0). Равные очки — возврат ставки.
          </div>
        </div>
      </div>
    </div>
  );
};
