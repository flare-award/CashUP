import React, { useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { AvatarIcon } from '../../components/ui/AvatarIcon';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card, createDeck } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { NPC_ROSTER } from '../../core/npc';
import { useCashUp } from '../../state/CashUpContext';
import { AvatarId } from '../../types';
import { decidePokerBotAction, PokerStreet } from './pokerBot';
import { evaluateBestPokerHand } from './pokerEvaluator';
import styles from './PokerGame.module.css';

interface PokerBotSeat {
  id: string;
  nickname: string;
  avatarId: AvatarId;
  styleLabel: string;
  aggression: number;
  tightness: number;
  holeCards: [Card, Card];
  folded: boolean;
  streetBet: number;
  lastActionLabel: string;
}

interface PokerHandState {
  street: PokerStreet;
  ante: number;
  pot: number;
  currentStreetBet: number;
  playerStreetBet: number;
  playerTotalCommitted: number;
  raisesThisStreet: number;
  playerHole: [Card, Card];
  fullCommunity: Card[]; // 5 cards pre-shuffled; ONLY visibleSlice is exposed to UI & Bots!
  bots: PokerBotSeat[];
  winnerIds: string[];
  resultBanner: string | null;
}

const POKER_BOT_PROFILES = [
  NPC_ROSTER.find((n) => n.id === 'npc-viktorshark')!,
  NPC_ROSTER.find((n) => n.id === 'npc-mira')!,
  NPC_ROSTER.find((n) => n.id === 'npc-artyomblaze')!,
];

const STREET_LABELS: Record<PokerStreet, string> = {
  preflop: 'Префлоп',
  flop: 'Флоп (3 карты)',
  turn: 'Тёрн (4 карты)',
  river: 'Ривер (5 карт)',
  showdown: 'Вскрытие карт',
};

function getVisibleCommunityCount(street: PokerStreet): number {
  switch (street) {
    case 'preflop':
      return 0;
    case 'flop':
      return 3;
    case 'turn':
      return 4;
    case 'river':
    case 'showdown':
      return 5;
  }
}

export const PokerGame: React.FC = () => {
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

  const [ante, setAnte] = useState<number>(0.5);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [hand, setHand] = useState<PokerHandState | null>(null);
  const [raiseExtra, setRaiseExtra] = useState<number>(0.5);

  const balance = activeProfile?.balance ?? 0;

  // Restore saved hand if user refreshed mid-hand
  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('poker');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as PokerHandState;
      setRoundId(saved.roundId);
      setHand(st);
      setAnte(st.ante);
      setRaiseExtra(st.ante);
    }
  }, [roundId, getInteractiveRound]);

  const visibleCommunity = useMemo(() => {
    if (!hand) return [];
    return hand.fullCommunity.slice(0, getVisibleCommunityCount(hand.street));
  }, [hand]);

  const playerCurrentHandEval = useMemo(() => {
    if (!hand) return null;
    const cards = [...hand.playerHole, ...visibleCommunity];
    if (cards.length < 5) return null;
    return evaluateBestPokerHand(cards);
  }, [hand, visibleCommunity]);

  const startNewHand = () => {
    if (roundId && hand && hand.street !== 'showdown') return;

    const deck = createDeck(1);
    const playerHole: [Card, Card] = [deck[0]!, deck[1]!];
    const bots: PokerBotSeat[] = POKER_BOT_PROFILES.map((npc, idx) => ({
      id: npc.id,
      nickname: npc.nickname,
      avatarId: npc.avatarId,
      styleLabel: npc.styleLabel,
      aggression: npc.aggression,
      tightness: npc.tightness,
      holeCards: [deck[2 + idx * 2]!, deck[3 + idx * 2]!],
      folded: false,
      streetBet: ante,
      lastActionLabel: `Блайнд ${formatAmount(ante)}`,
    }));
    const fullCommunity = deck.slice(8, 13);

    const initialPot = roundCurrency(ante * (1 + bots.length));
    const initialHand: PokerHandState = {
      street: 'preflop',
      ante,
      pot: initialPot,
      currentStreetBet: ante,
      playerStreetBet: ante,
      playerTotalCommitted: ante,
      raisesThisStreet: 0,
      playerHole,
      fullCommunity,
      bots,
      winnerIds: [],
      resultBanner: null,
    };

    const started = startInteractiveRound({
      gameId: 'poker',
      gameName: 'Техасский Холдем',
      wager: ante,
      interactiveState: initialHand,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    setRoundId(started.roundId);
    setHand(initialHand);
    setRaiseExtra(ante);
  };

  const resolveShowdown = (rid: string, stateAtEnd: PokerHandState) => {
    const board = stateAtEnd.fullCommunity;
    const activeBots = stateAtEnd.bots.filter((b) => !b.folded);

    const contenders: Array<{
      id: string;
      name: string;
      eval: ReturnType<typeof evaluateBestPokerHand>;
    }> = [
      {
        id: 'player',
        name: activeProfile?.nickname ?? 'Вы',
        eval: evaluateBestPokerHand([...stateAtEnd.playerHole, ...board]),
      },
      ...activeBots.map((b) => ({
        id: b.id,
        name: b.nickname,
        eval: evaluateBestPokerHand([...b.holeCards, ...board]),
      })),
    ];

    const topScore = Math.max(...contenders.map((c) => c.eval.score));
    const winners = contenders.filter((c) => c.eval.score === topScore);
    const winnerIds = winners.map((w) => w.id);
    const playerWon = winnerIds.includes('player');

    const payout = playerWon
      ? roundCurrency(stateAtEnd.pot / winners.length)
      : 0;

    const winningHandName = winners[0]!.eval.nameRu;
    const winnerNames = winners.map((w) => w.name).join(', ');
    const banner = playerWon
      ? winners.length > 1
        ? `Раздел банка (${winningHandName}): +${formatAmount(payout)}`
        : `Вы выиграли банк ${formatAmount(payout)} с комбинацией «${winningHandName}»!`
      : `Победил ${winnerNames} с комбинацией «${winningHandName}»`;

    const finalState: PokerHandState = {
      ...stateAtEnd,
      street: 'showdown',
      winnerIds,
      resultBanner: banner,
    };

    const outcome =
      payout > stateAtEnd.playerTotalCommitted
        ? 'win'
        : payout === stateAtEnd.playerTotalCommitted && payout > 0
          ? 'push'
          : 'loss';

    const mult =
      payout > 0 && stateAtEnd.playerTotalCommitted > 0
        ? roundCurrency(payout / stateAtEnd.playerTotalCommitted)
        : null;

    finishRound({
      roundId: rid,
      payout,
      multiplier: mult,
      outcome,
      summary: `Hold'em · ${
        playerWon ? `Победа (${winningHandName})` : `Победил ${winnerNames} (${winningHandName})`
      }`,
    });

    setHand(finalState);
    setRoundId(null);
  };

  const advanceStreetOrShowdown = (rid: string, cur: PokerHandState) => {
    const activeBots = cur.bots.filter((b) => !b.folded);
    if (activeBots.length === 0) {
      // All bots folded -> Player wins pot uncontested!
      const payout = cur.pot;
      const banner = `Все соперники сбросили карты! Вы забрали банк ${formatAmount(payout)}.`;
      const finalState: PokerHandState = {
        ...cur,
        street: 'showdown',
        winnerIds: ['player'],
        resultBanner: banner,
      };
      finishRound({
        roundId: rid,
        payout,
        multiplier: roundCurrency(payout / cur.playerTotalCommitted),
        outcome: 'win',
        summary: 'Hold’em · Победа без вскрытия (фолд соперников)',
      });
      setHand(finalState);
      setRoundId(null);
      return;
    }

    const nextStreetMap: Record<PokerStreet, PokerStreet> = {
      preflop: 'flop',
      flop: 'turn',
      turn: 'river',
      river: 'showdown',
      showdown: 'showdown',
    };
    const nextStreet = nextStreetMap[cur.street];

    if (nextStreet === 'showdown') {
      playSound('cardFlip');
      resolveShowdown(rid, cur);
      return;
    }

    playSound('cardDeal');
    const resetBots = cur.bots.map((b) => ({
      ...b,
      streetBet: 0,
      lastActionLabel: b.folded ? 'Фолд' : 'В игре',
    }));

    const nextHand: PokerHandState = {
      ...cur,
      street: nextStreet,
      currentStreetBet: 0,
      playerStreetBet: 0,
      raisesThisStreet: 0,
      bots: resetBots,
    };

    // If player has 0 remaining balance (all-in), automatically run out streets to showdown!
    if ((activeProfile?.balance ?? 0) < 0.01) {
      resolveShowdown(rid, nextHand);
      return;
    }

    setHand(nextHand);
    saveInteractiveRoundState(rid, nextHand);
  };

  const runBotsTurn = (
    rid: string,
    afterPlayer: PokerHandState,
    playerJustMatchedRaise: boolean
  ) => {
    let pot = afterPlayer.pot;
    let currentStreetBet = afterPlayer.currentStreetBet;
    let raisesThisStreet = afterPlayer.raisesThisStreet;
    const visibleComm = afterPlayer.fullCommunity.slice(
      0,
      getVisibleCommunityCount(afterPlayer.street)
    );

    const updatedBots = afterPlayer.bots.map((bot) => {
      if (bot.folded) return bot;
      const toCall = Math.max(0, roundCurrency(currentStreetBet - bot.streetBet));

      // If player only called an existing bot raise and bot already matched currentStreetBet, bot stands pat
      if (playerJustMatchedRaise && toCall === 0) {
        return bot;
      }

      const decision = decidePokerBotAction(bot.holeCards, visibleComm, {
        street: afterPlayer.street,
        pot,
        toCall,
        minRaise: afterPlayer.ante,
        maxRaise: Math.max(afterPlayer.ante, afterPlayer.ante * 3),
        aggression: bot.aggression,
        tightness: bot.tightness,
        raisesThisStreet,
      });

      if (decision.action === 'fold') {
        return {
          ...bot,
          folded: true,
          lastActionLabel: 'Фолд',
        };
      }

      if (decision.action === 'check') {
        return {
          ...bot,
          lastActionLabel: 'Чек',
        };
      }

      if (decision.action === 'call') {
        pot = roundCurrency(pot + decision.amount);
        return {
          ...bot,
          streetBet: roundCurrency(bot.streetBet + decision.amount),
          lastActionLabel: `Колл ${formatAmount(decision.amount)}`,
        };
      }

      // Bot raises (only if player actually has balance to respond and raises < 1 from bots)
      const playerRemBalance = activeProfile?.balance ?? 0;
      if (raisesThisStreet < 1 && playerRemBalance >= decision.raiseExtra) {
        const cappedExtra = Math.min(decision.raiseExtra, playerRemBalance);
        const totalAdded = roundCurrency(decision.callPart + cappedExtra);
        pot = roundCurrency(pot + totalAdded);
        currentStreetBet = roundCurrency(currentStreetBet + cappedExtra);
        raisesThisStreet += 1;
        return {
          ...bot,
          streetBet: currentStreetBet,
          lastActionLabel: `Рейз +${formatAmount(cappedExtra)}`,
        };
      }

      // Otherwise treat as Call
      pot = roundCurrency(pot + decision.callPart);
      return {
        ...bot,
        streetBet: roundCurrency(bot.streetBet + decision.callPart),
        lastActionLabel:
          decision.callPart > 0 ? `Колл ${formatAmount(decision.callPart)}` : 'Чек',
      };
    });

    const postBotsState: PokerHandState = {
      ...afterPlayer,
      pot,
      currentStreetBet,
      raisesThisStreet,
      bots: updatedBots,
    };

    const activeBotsLeft = updatedBots.filter((b) => !b.folded);
    if (activeBotsLeft.length === 0) {
      advanceStreetOrShowdown(rid, postBotsState);
      return;
    }

    // Check if a bot raised above player's current street bet -> return action to player!
    const playerOwes = roundCurrency(currentStreetBet - postBotsState.playerStreetBet);
    if (playerOwes > 0) {
      setHand(postBotsState);
      saveInteractiveRoundState(rid, postBotsState);
      return;
    }

    advanceStreetOrShowdown(rid, postBotsState);
  };

  const handleFold = () => {
    if (!roundId || !hand || hand.street === 'showdown') return;
    playSound('loss');
    const activeBot = hand.bots.find((b) => !b.folded) ?? hand.bots[0]!;
    const finalState: PokerHandState = {
      ...hand,
      street: 'showdown',
      winnerIds: [activeBot.id],
      resultBanner: `Вы сбросили карты (Фолд). Банк забирает ${activeBot.nickname}.`,
    };
    finishRound({
      roundId,
      payout: 0,
      multiplier: null,
      outcome: 'loss',
      summary: 'Hold’em · Фолд игрока',
    });
    setHand(finalState);
    setRoundId(null);
  };

  const handleCheckOrCall = () => {
    if (!roundId || !hand || hand.street === 'showdown') return;
    const toCall = Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet));

    let nextCommitted = hand.playerTotalCommitted;
    let nextPot = hand.pot;

    if (toCall > 0) {
      const actualCall = Math.min(toCall, balance);
      if (actualCall > 0) {
        const res = increaseRoundWager(roundId, actualCall, 'Колл в покере');
        if (!res.ok) return;
        nextCommitted = res.totalWager;
        nextPot = roundCurrency(hand.pot + actualCall);
      }
    }

    playSound('click');
    const updated: PokerHandState = {
      ...hand,
      pot: nextPot,
      playerStreetBet: hand.currentStreetBet,
      playerTotalCommitted: nextCommitted,
    };

    runBotsTurn(roundId, updated, toCall > 0);
  };

  const handleRaise = () => {
    if (!roundId || !hand || hand.street === 'showdown') return;
    const toCall = Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet));
    const cleanExtra = Math.max(1, roundCurrency(raiseExtra));
    const totalNeeded = roundCurrency(toCall + cleanExtra);

    const res = increaseRoundWager(roundId, totalNeeded, 'Рейз в покере');
    if (!res.ok) return;

    playSound('click');
    const newStreetBet = roundCurrency(hand.currentStreetBet + cleanExtra);
    const updated: PokerHandState = {
      ...hand,
      pot: roundCurrency(hand.pot + totalNeeded),
      currentStreetBet: newStreetBet,
      playerStreetBet: newStreetBet,
      playerTotalCommitted: res.totalWager,
      raisesThisStreet: hand.raisesThisStreet + 1,
    };

    runBotsTurn(roundId, updated, false);
  };

  const isPlaying = Boolean(roundId && hand && hand.street !== 'showdown');
  const toCall = hand
    ? Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet))
    : 0;
  const canRaise =
    isPlaying &&
    hand !== null &&
    hand.raisesThisStreet < 2 &&
    balance >= roundCurrency(toCall + Math.max(5, raiseExtra));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={styles.tableFelt}>
        {/* Top Row: 3 NPC Opponents */}
        <div className={styles.botsRow}>
          {(hand?.bots ??
            POKER_BOT_PROFILES.map((npc) => ({
              id: npc.id,
              nickname: npc.nickname,
              avatarId: npc.avatarId,
              styleLabel: npc.styleLabel,
              aggression: npc.aggression,
              tightness: npc.tightness,
              holeCards: [] as unknown as [Card, Card],
              folded: false,
              streetBet: 0,
              lastActionLabel: 'Готов к раздаче',
            }))
          ).map((bot) => {
            const showCards = hand?.street === 'showdown' && !bot.folded;
            const isWinner = hand?.winnerIds.includes(bot.id) ?? false;
            const botHandName =
              showCards && hand
                ? evaluateBestPokerHand([...bot.holeCards, ...hand.fullCommunity]).nameRu
                : null;

            return (
              <div
                key={bot.id}
                className={`${styles.botSeat} ${bot.folded ? styles.botFolded : ''} ${
                  isWinner ? styles.botWinner : ''
                }`}
              >
                <div className={styles.botHeader}>
                  <div className={styles.botIdentity}>
                    <AvatarIcon avatarId={bot.avatarId} size={34} />
                    <div>
                      <div className={styles.botName}>{bot.nickname}</div>
                      <div className={styles.botStyle}>{bot.styleLabel}</div>
                    </div>
                  </div>
                  <span className={styles.actionTag}>{bot.lastActionLabel}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div className={styles.botCards}>
                    {hand ? (
                      <>
                        <PlayingCard
                          card={showCards ? bot.holeCards[0] : null}
                          faceDown={!showCards}
                          size="sm"
                        />
                        <PlayingCard
                          card={showCards ? bot.holeCards[1] : null}
                          faceDown={!showCards}
                          size="sm"
                        />
                      </>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Ожидание новой раздачи
                      </span>
                    )}
                  </div>
                  {botHandName && (
                    <span className="badge badgeGold">{botHandName}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Community Board & Pot */}
        <div className={styles.communityCenter}>
          <div className={styles.potRow}>
            <span className={styles.streetBadge}>
              {hand ? STREET_LABELS[hand.street] : 'Стол Texas Hold’em (4-Max)'}
            </span>
            <span className={styles.potBadge}>
              Банк: {formatAmount(hand?.pot ?? 0)}
            </span>
          </div>

          <div className={styles.boardCards}>
            {[0, 1, 2, 3, 4].map((idx) => {
              const card = visibleCommunity[idx];
              return card ? (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  highlighted={
                    Boolean(
                      hand?.street === 'showdown' &&
                        playerCurrentHandEval?.bestFiveIds.includes(card.id)
                    )
                  }
                />
              ) : (
                <div key={idx} className={styles.emptySlot} aria-hidden="true" />
              );
            })}
          </div>

          {hand?.resultBanner && (
            <div
              role="status"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: hand.winnerIds.includes('player')
                  ? 'rgba(16, 185, 129, 0.24)'
                  : 'rgba(15, 23, 42, 0.82)',
                border: `1px solid ${
                  hand.winnerIds.includes('player') ? '#10b981' : '#475569'
                }`,
                color: '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {hand.resultBanner}
            </div>
          )}
        </div>

        {/* Bottom: Player Seat & Controls */}
        <div className={styles.playerArea}>
          <div className={styles.playerHandBlock}>
            <div style={{ display: 'flex', gap: 8 }}>
              <PlayingCard
                card={hand?.playerHole[0] ?? null}
                faceDown={!hand}
                size="md"
                highlighted={Boolean(hand?.winnerIds.includes('player'))}
              />
              <PlayingCard
                card={hand?.playerHole[1] ?? null}
                faceDown={!hand}
                size="md"
                highlighted={Boolean(hand?.winnerIds.includes('player'))}
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                {activeProfile?.nickname ?? 'Игрок'} (Вы)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                Вложено в раздачу:{' '}
                <strong className="mono" style={{ color: '#e2e8f0' }}>
                  {formatAmount(hand?.playerTotalCommitted ?? 0)}
                </strong>
              </div>
              {playerCurrentHandEval && (
                <div style={{ marginTop: 6 }}>
                  <span className="badge badgeEmerald">
                    Комбинация: {playerCurrentHandEval.nameRu}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionControls}>
            {isPlaying ? (
              <>
                <div className={styles.actionBtns}>
                  <button
                    type="button"
                    className="btn btnDanger"
                    onClick={handleFold}
                  >
                    Фолд
                  </button>

                  <button
                    type="button"
                    className="btn btnSecondary"
                    onClick={handleCheckOrCall}
                  >
                    {toCall > 0
                      ? `Колл ${formatAmount(Math.min(toCall, balance))}`
                      : 'Чек'}
                  </button>

                  <button
                    type="button"
                    className="btn btnPrimary"
                    disabled={!canRaise}
                    onClick={handleRaise}
                  >
                    Рейз +{formatAmount(raiseExtra)}
                  </button>
                </div>

                <div className={styles.raiseRow}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Размер рейза:
                  </span>
                  {[ante, ante * 2, ante * 4].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btnSecondary btnSm mono"
                      onClick={() => setRaiseExtra(preset)}
                    >
                      +{formatAmount(preset)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  gap: 14,
                }}
              >
                <div style={{ minWidth: 250, flex: 1 }}>
                  <BetControls
                    wager={ante}
                    onChange={(v) => {
                      setAnte(v);
                      setRaiseExtra(v);
                    }}
                    label="Начальная ставка / Блайнд"
                  />
                </div>
                <button
                  type="button"
                  className="btn btnPrimary btnLg"
                  disabled={ante <= 0 || ante > balance}
                  onClick={startNewHand}
                >
                  <Play size={17} /> Раздать карты
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
