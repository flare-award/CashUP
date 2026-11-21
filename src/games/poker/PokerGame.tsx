import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Play, RotateCcw, Users } from 'lucide-react';
import { AvatarIcon } from '../../components/ui/AvatarIcon';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card, createDeck } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { NPC_ROSTER } from '../../core/npc';
import { randomInt } from '../../core/rng';
import { useCashUp } from '../../state/CashUpContext';
import { AvatarId } from '../../types';
import { decidePokerBotAction, PokerStreet } from './pokerBot';
import { evaluateBestPokerHand } from './pokerEvaluator';
import styles from './PokerGame.module.css';

export type PokerTableSize = 6 | 8;

interface PokerBotSeat {
  id: string;
  seatNumber: number; // 1..7
  nickname: string;
  avatarId: AvatarId;
  styleLabel: string;
  aggression: number;
  tightness: number;
  stack: number; // persistent chip stack at table
  holeCards: [Card, Card];
  folded: boolean;
  allIn: boolean;
  streetBet: number;
  totalCommitted: number;
  lastActionLabel: string;
}

interface PokerHandState {
  tableSize: PokerTableSize;
  bigBlind: number;
  dealerSeat: number; // 0 = Human, 1..tableSize-1 = Bots
  sbSeat: number;
  bbSeat: number;
  street: PokerStreet;
  pot: number;
  currentStreetBet: number;
  playerStreetBet: number;
  playerTotalCommitted: number;
  playerAllIn: boolean;
  raisesThisStreet: number;
  playerHole: [Card, Card];
  fullCommunity: Card[]; // 5 cards pre-shuffled; ONLY visibleSlice exposed to UI & Bots!
  bots: PokerBotSeat[];
  winnerIds: string[];
  resultBanner: string | null;
}

const FULL_RING_REGULARS = [
  NPC_ROSTER.find((n) => n.id === 'npc-viktorshark')!,
  NPC_ROSTER.find((n) => n.id === 'npc-volkov')!,
  NPC_ROSTER.find((n) => n.id === 'npc-mira')!,
  NPC_ROSTER.find((n) => n.id === 'npc-nightowl')!,
  NPC_ROSTER.find((n) => n.id === 'npc-luckyfox')!,
  NPC_ROSTER.find((n) => n.id === 'npc-silverrook')!,
  NPC_ROSTER.find((n) => n.id === 'npc-artyomblaze')!,
];

const STREET_LABELS: Record<PokerStreet, string> = {
  preflop: 'Префлоп · Торги',
  flop: 'Флоп (3 общие карты)',
  turn: 'Тёрн (4 общие карты)',
  river: 'Ривер (5 общих карт)',
  showdown: 'Вскрытие карт (Showdown)',
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

/**
 * Vector Casino Chip Stack graphic for seats and center pot.
 */
const ChipStackSvg: React.FC<{
  layers?: number;
  accent?: 'gold' | 'emerald' | 'crimson' | 'royal';
  size?: number;
}> = ({ layers = 4, accent = 'gold', size = 26 }) => {
  const palette = {
    gold: ['#f59e0b', '#fef08a'],
    emerald: ['#10b981', '#a7f3d0'],
    crimson: ['#ef4444', '#fecaca'],
    royal: ['#3b82f6', '#bfdbfe'],
  }[accent];

  const clamped = Math.max(2, Math.min(6, layers));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {Array.from({ length: clamped }).map((_, idx) => {
        const cy = 24 - idx * 3.6;
        return (
          <g key={idx}>
            <ellipse
              cx="16"
              cy={cy + 1.8}
              rx="11"
              ry="4.4"
              fill="#0f172a"
              opacity="0.55"
            />
            <ellipse
              cx="16"
              cy={cy}
              rx="11"
              ry="4.4"
              fill={palette[0]}
              stroke={palette[1]}
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          </g>
        );
      })}
    </svg>
  );
};

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

  const [tableSize, setTableSize] = useState<PokerTableSize>(8);
  const [bigBlind, setBigBlind] = useState<number>(0.4);
  const [dealerCursor, setDealerCursor] = useState<number>(0);
  const [botStacks, setBotStacks] = useState<Record<string, number>>({});

  const [roundId, setRoundId] = useState<string | null>(null);
  const [hand, setHand] = useState<PokerHandState | null>(null);
  const [raiseExtra, setRaiseExtra] = useState<number>(0.4);

  const balance = activeProfile?.balance ?? 0;

  // Initialize or replenish persistent bot chip stacks when table/blind changes out of hand
  const getOrInitBotStack = (botId: string, bb: number): number => {
    const existing = botStacks[botId];
    if (existing !== undefined && existing >= bb * 3) {
      return existing;
    }
    const mult = 25 + ((botId.length * 7) % 35); // 25x..60x BB stacks!
    return roundCurrency(bb * mult);
  };

  // Restore saved hand if user refreshed mid-hand
  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('poker');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as PokerHandState;
      setRoundId(saved.roundId);
      setHand(st);
      if (st.tableSize) setTableSize(st.tableSize);
      if (st.bigBlind) {
        setBigBlind(st.bigBlind);
        setRaiseExtra(st.bigBlind);
      }
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

  const activeRegulars = useMemo(
    () => FULL_RING_REGULARS.slice(0, (hand?.tableSize ?? tableSize) - 1),
    [hand?.tableSize, tableSize]
  );

  const startNewHand = () => {
    if (roundId && hand && hand.street !== 'showdown') return;

    const totalSeats = tableSize;
    const dSeat = dealerCursor % totalSeats;
    const sbSeat = (dSeat + 1) % totalSeats;
    const bbSeat = (dSeat + 2) % totalSeats;

    const smallBlind = Math.max(0.05, roundCurrency(bigBlind * 0.5));
    const tableAnte = Math.max(0.02, roundCurrency(bigBlind * 0.25));

    // Determine player's initial mandatory blind + ante commitment
    const playerBlindPart =
      bbSeat === 0 ? bigBlind : sbSeat === 0 ? smallBlind : 0;
    const playerInitialCommit = Math.min(
      balance,
      roundCurrency(tableAnte + playerBlindPart)
    );

    if (playerInitialCommit <= 0 || playerInitialCommit > balance) return;

    const deck = createDeck(1);
    const playerHole: [Card, Card] = [deck[0]!, deck[1]!];

    let initialPot = playerInitialCommit;
    const bots: PokerBotSeat[] = FULL_RING_REGULARS.slice(0, totalSeats - 1).map(
      (npc, idx) => {
        const seatNum = idx + 1;
        const freshStack = getOrInitBotStack(npc.id, bigBlind);
        const blindPart =
          seatNum === bbSeat ? bigBlind : seatNum === sbSeat ? smallBlind : 0;
        const commit = Math.min(freshStack, roundCurrency(tableAnte + blindPart));
        const remStack = roundCurrency(freshStack - commit);
        initialPot = roundCurrency(initialPot + commit);

        const posLabel =
          seatNum === bbSeat
            ? `BB ${formatAmount(bigBlind)}`
            : seatNum === sbSeat
              ? `SB ${formatAmount(smallBlind)}`
              : `Анте ${formatAmount(tableAnte)}`;

        return {
          id: npc.id,
          seatNumber: seatNum,
          nickname: npc.nickname,
          avatarId: npc.avatarId,
          styleLabel: npc.styleLabel,
          aggression: npc.aggression,
          tightness: npc.tightness,
          stack: remStack,
          holeCards: [deck[2 + idx * 2]!, deck[3 + idx * 2]!],
          folded: false,
          allIn: remStack <= 0.001,
          streetBet: blindPart,
          totalCommitted: commit,
          lastActionLabel: posLabel,
        };
      }
    );

    const fullCommunity = deck.slice(2 + bots.length * 2, 7 + bots.length * 2);

    const initialHand: PokerHandState = {
      tableSize: totalSeats,
      bigBlind,
      dealerSeat: dSeat,
      sbSeat,
      bbSeat,
      street: 'preflop',
      pot: roundCurrency(initialPot),
      currentStreetBet: bigBlind,
      playerStreetBet: playerBlindPart,
      playerTotalCommitted: playerInitialCommit,
      playerAllIn: balance - playerInitialCommit <= 0.001,
      raisesThisStreet: 0,
      playerHole,
      fullCommunity,
      bots,
      winnerIds: [],
      resultBanner: null,
    };

    const started = startInteractiveRound({
      gameId: 'poker',
      gameName: 'Покер',
      wager: playerInitialCommit,
      interactiveState: initialHand,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    setDealerCursor((c) => (c + 1) % totalSeats);
    setRoundId(started.roundId);
    setHand(initialHand);
    setRaiseExtra(bigBlind);
  };

  const persistBotStacksAfterHand = (
    botsAtEnd: PokerBotSeat[],
    winnerIds: string[],
    potShare: number
  ) => {
    setBotStacks((prev) => {
      const next = { ...prev };
      for (const b of botsAtEnd) {
        let endStack = b.stack;
        if (winnerIds.includes(b.id)) {
          endStack = roundCurrency(endStack + potShare);
        }
        // Rebuy if busted below 3 BB
        if (endStack < bigBlind * 3) {
          endStack = roundCurrency(bigBlind * randomInt(30, 55));
        }
        next[b.id] = endStack;
      }
      return next;
    });
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

    const share = roundCurrency(stateAtEnd.pot / winners.length);
    const payout = playerWon ? share : 0;

    persistBotStacksAfterHand(stateAtEnd.bots, winnerIds, share);

    const winningHandName = winners[0]!.eval.nameRu;
    const winnerNames = winners.map((w) => w.name).join(', ');
    const banner = playerWon
      ? winners.length > 1
        ? `Раздел банка (${winningHandName}): Вы получаете ${formatAmount(payout)}`
        : `Победа! Вы забрали банк ${formatAmount(payout)} с комбинацией «${winningHandName}»!`
      : `Банк ${formatAmount(stateAtEnd.pot)} забирает ${winnerNames} — «${winningHandName}»`;

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
      summary: `Покер (${stateAtEnd.tableSize}-Max) · ${
        playerWon
          ? `Победа (${winningHandName})`
          : `Победил ${winnerNames} (${winningHandName})`
      }`,
    });

    setHand(finalState);
    setRoundId(null);
  };

  const advanceStreetOrShowdown = (rid: string, cur: PokerHandState) => {
    const activeBots = cur.bots.filter((b) => !b.folded);
    if (activeBots.length === 0) {
      // All bots folded -> Player sweeps the entire pot!
      const payout = cur.pot;
      persistBotStacksAfterHand(cur.bots, ['player'], payout);
      const banner = `Все соперники сбросили карты! Вы забираете весь банк ${formatAmount(payout)} без вскрытия.`;
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
        summary: `Покер (${cur.tableSize}-Max) · Победа фолдом всего стола`,
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
      lastActionLabel: b.folded ? 'Фолд' : b.allIn ? 'ОЛЛ-ИН' : 'В банке',
    }));

    const nextHand: PokerHandState = {
      ...cur,
      street: nextStreet,
      currentStreetBet: 0,
      playerStreetBet: 0,
      raisesThisStreet: 0,
      bots: resetBots,
    };

    // If player is All-In (or all remaining active bots are All-In), run out all community cards to Showdown!
    const nonAllInBots = resetBots.filter((b) => !b.folded && !b.allIn);
    if (
      cur.playerAllIn ||
      (activeProfile?.balance ?? 0) < 0.01 ||
      nonAllInBots.length === 0
    ) {
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
    const playerRemBalance = activeProfile?.balance ?? 0;

    const updatedBots = afterPlayer.bots.map((bot) => {
      if (bot.folded || bot.allIn) return bot;
      const toCall = Math.max(0, roundCurrency(currentStreetBet - bot.streetBet));

      if (playerJustMatchedRaise && toCall === 0) {
        return bot;
      }

      const decision = decidePokerBotAction(bot.holeCards, visibleComm, {
        street: afterPlayer.street,
        pot,
        toCall,
        minRaise: afterPlayer.bigBlind,
        maxRaise: Math.max(afterPlayer.bigBlind, afterPlayer.bigBlind * 4),
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
        const pay = Math.min(bot.stack, decision.amount);
        pot = roundCurrency(pot + pay);
        const remStack = roundCurrency(bot.stack - pay);
        const wentAllIn = remStack <= 0.001;
        return {
          ...bot,
          stack: remStack,
          allIn: wentAllIn,
          streetBet: roundCurrency(bot.streetBet + pay),
          totalCommitted: roundCurrency(bot.totalCommitted + pay),
          lastActionLabel: wentAllIn
            ? `ОЛЛ-ИН ${formatAmount(pay)}`
            : `Колл ${formatAmount(pay)}`,
        };
      }

      // Bot raises if allowed and player still has chips behind
      if (
        !afterPlayer.playerAllIn &&
        raisesThisStreet < 1 &&
        playerRemBalance >= decision.raiseExtra &&
        bot.stack > toCall + afterPlayer.bigBlind * 0.5
      ) {
        const maxBotExtra = roundCurrency(bot.stack - toCall);
        const cappedExtra = Math.min(
          decision.raiseExtra,
          playerRemBalance,
          maxBotExtra
        );
        const totalAdded = roundCurrency(toCall + cappedExtra);
        pot = roundCurrency(pot + totalAdded);
        currentStreetBet = roundCurrency(currentStreetBet + cappedExtra);
        raisesThisStreet += 1;
        const remStack = roundCurrency(bot.stack - totalAdded);
        const wentAllIn = remStack <= 0.001;
        return {
          ...bot,
          stack: remStack,
          allIn: wentAllIn,
          streetBet: currentStreetBet,
          totalCommitted: roundCurrency(bot.totalCommitted + totalAdded),
          lastActionLabel: wentAllIn
            ? 'ОЛЛ-ИН!'
            : `Рейз +${formatAmount(cappedExtra)}`,
        };
      }

      // Fallback to Call
      const pay = Math.min(bot.stack, decision.callPart);
      pot = roundCurrency(pot + pay);
      const remStack = roundCurrency(bot.stack - pay);
      return {
        ...bot,
        stack: remStack,
        allIn: remStack <= 0.001,
        streetBet: roundCurrency(bot.streetBet + pay),
        totalCommitted: roundCurrency(bot.totalCommitted + pay),
        lastActionLabel: pay > 0 ? `Колл ${formatAmount(pay)}` : 'Чек',
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

    const playerOwes = roundCurrency(currentStreetBet - postBotsState.playerStreetBet);
    if (playerOwes > 0 && !postBotsState.playerAllIn && (activeProfile?.balance ?? 0) > 0.005) {
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
    persistBotStacksAfterHand(hand.bots, [activeBot.id], hand.pot);
    const finalState: PokerHandState = {
      ...hand,
      street: 'showdown',
      winnerIds: [activeBot.id],
      resultBanner: `Вы сбросили карты (Фолд). Банк ${formatAmount(hand.pot)} забирает ${activeBot.nickname}.`,
    };
    finishRound({
      roundId,
      payout: 0,
      multiplier: null,
      outcome: 'loss',
      summary: `Покер (${hand.tableSize}-Max) · Фолд игрока`,
    });
    setHand(finalState);
    setRoundId(null);
  };

  const handleCheckOrCall = () => {
    if (!roundId || !hand || hand.street === 'showdown') return;
    const toCall = Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet));

    let nextCommitted = hand.playerTotalCommitted;
    let nextPot = hand.pot;
    let wentAllIn = hand.playerAllIn;

    if (toCall > 0) {
      const actualCall = Math.min(toCall, balance);
      if (actualCall > 0) {
        const res = increaseRoundWager(roundId, actualCall, 'Колл в покере');
        if (!res.ok) return;
        nextCommitted = res.totalWager;
        nextPot = roundCurrency(hand.pot + actualCall);
        if (actualCall >= balance - 0.001) wentAllIn = true;
      }
    }

    playSound('click');
    const updated: PokerHandState = {
      ...hand,
      pot: nextPot,
      playerStreetBet: roundCurrency(hand.playerStreetBet + Math.min(toCall, balance)),
      playerTotalCommitted: nextCommitted,
      playerAllIn: wentAllIn,
    };

    runBotsTurn(roundId, updated, toCall > 0);
  };

  const executeRaiseOrAllIn = (desiredExtra: number, isAllInPush = false) => {
    if (!roundId || !hand || hand.street === 'showdown') return;
    const toCall = Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet));

    // Cap extra raise by maximum opponent stack so chips are always contested fairly
    const maxBotCover = Math.max(
      ...hand.bots
        .filter((b) => !b.folded)
        .map((b) => Math.max(0, b.stack - Math.max(0, hand.currentStreetBet - b.streetBet))),
      hand.bigBlind
    );

    const maxAffordableExtra = Math.max(0, roundCurrency(balance - toCall));
    const cleanExtra = roundCurrency(
      Math.min(maxAffordableExtra, maxBotCover, Math.max(0.05, desiredExtra))
    );

    if (cleanExtra <= 0) {
      handleCheckOrCall();
      return;
    }

    const totalNeeded = roundCurrency(toCall + cleanExtra);
    const res = increaseRoundWager(
      roundId,
      totalNeeded,
      isAllInPush ? 'Олл-ин в покере' : 'Рейз в покере'
    );
    if (!res.ok) return;

    playSound('select');
    const newStreetBet = roundCurrency(hand.currentStreetBet + cleanExtra);
    const playerNowAllIn = isAllInPush || totalNeeded >= balance - 0.001;

    const updated: PokerHandState = {
      ...hand,
      pot: roundCurrency(hand.pot + totalNeeded),
      currentStreetBet: newStreetBet,
      playerStreetBet: newStreetBet,
      playerTotalCommitted: res.totalWager,
      playerAllIn: playerNowAllIn,
      raisesThisStreet: hand.raisesThisStreet + 1,
    };

    runBotsTurn(roundId, updated, false);
  };

  const isPlaying = Boolean(roundId && hand && hand.street !== 'showdown');
  const toCall = hand
    ? Math.max(0, roundCurrency(hand.currentStreetBet - hand.playerStreetBet))
    : 0;
  const maxRaiseCap = useMemo(() => {
    if (!hand) return balance;
    const maxBot = Math.max(
      ...hand.bots.filter((b) => !b.folded).map((b) => b.stack),
      hand.bigBlind
    );
    return Math.max(0, roundCurrency(Math.min(balance - toCall, maxBot)));
  }, [hand, balance, toCall]);

  const canRaise =
    isPlaying &&
    hand !== null &&
    !hand.playerAllIn &&
    hand.raisesThisStreet < 3 &&
    maxRaiseCap >= Math.min(hand.bigBlind * 0.5, 0.1) &&
    balance > toCall + 0.02;

  const previewBots: PokerBotSeat[] =
    hand?.bots ??
    activeRegulars.map((npc, idx) => ({
      id: npc.id,
      seatNumber: idx + 1,
      nickname: npc.nickname,
      avatarId: npc.avatarId,
      styleLabel: npc.styleLabel,
      aggression: npc.aggression,
      tightness: npc.tightness,
      stack: getOrInitBotStack(npc.id, bigBlind),
      holeCards: [] as unknown as [Card, Card],
      folded: false,
      allIn: false,
      streetBet: 0,
      totalCommitted: 0,
      lastActionLabel: 'Готов к раздаче',
    }));

  const potLayers = hand ? Math.min(6, 2 + Math.floor(hand.pot / Math.max(0.2, hand.bigBlind * 2))) : 3;

  return (
    <div className={styles.wrapper}>
      {/* Table Mode & Info Strip */}
      <div className={styles.topControlStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badgeEmerald">
            <Users size={13} /> Большой кэш-стол ({hand?.tableSize ?? tableSize} игроков)
          </span>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Блайнды: {formatAmount(roundCurrency((hand?.bigBlind ?? bigBlind) * 0.5))} /{' '}
            {formatAmount(hand?.bigBlind ?? bigBlind)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {([6, 8] as PokerTableSize[]).map((sz) => {
            const active = (hand?.tableSize ?? tableSize) === sz;
            return (
              <button
                key={sz}
                type="button"
                disabled={isPlaying}
                onClick={() => {
                  playSound('click');
                  setTableSize(sz);
                  setHand(null);
                }}
                className={`btn btnSm ${active ? 'btnPrimary' : 'btnSecondary'}`}
              >
                Стол на {sz} игроков
              </button>
            );
          })}
          {!isPlaying && (
            <button
              type="button"
              className="btn btnGhost btnSm"
              onClick={() => {
                playSound('click');
                setBotStacks({});
                setHand(null);
              }}
              title="Обновить стеки фишек за столом"
            >
              <RotateCcw size={14} /> Обновить стол
            </button>
          )}
        </div>
      </div>

      {/* Big Oval Mahogany & Emerald Felt Table */}
      <div className={styles.ovalArena}>
        {/* Opponents Seated Around the Top/Sides of the Oval Table */}
        <div className={styles.opponentsRing}>
          {previewBots.map((bot) => {
            const showCards = hand?.street === 'showdown' && !bot.folded;
            const isWinner = hand?.winnerIds.includes(bot.id) ?? false;
            const isDealer = hand?.dealerSeat === bot.seatNumber;
            const isSb = hand?.sbSeat === bot.seatNumber;
            const isBb = hand?.bbSeat === bot.seatNumber;

            const botHandName =
              showCards && hand
                ? evaluateBestPokerHand([...bot.holeCards, ...hand.fullCommunity]).nameRu
                : null;

            return (
              <div
                key={bot.id}
                className={`${styles.seatCard} ${bot.folded ? styles.seatFolded : ''} ${
                  bot.allIn && !bot.folded ? styles.seatAllIn : ''
                } ${isWinner ? styles.seatWinner : ''}`}
              >
                <div className={styles.seatTopRow}>
                  <div className={styles.seatIdentity}>
                    <AvatarIcon avatarId={bot.avatarId} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.seatName}>{bot.nickname}</div>
                      <div className={styles.seatStyle}>{bot.styleLabel}</div>
                    </div>
                  </div>

                  <div className={styles.posPills}>
                    {isDealer && <span className={styles.dealerBtn} title="Дилер">D</span>}
                    {isSb && <span className={styles.blindBadge}>SB</span>}
                    {isBb && <span className={styles.blindBadge}>BB</span>}
                  </div>
                </div>

                <div className={styles.seatMidRow}>
                  <div className={styles.miniCards}>
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
                      <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                        За столом
                      </span>
                    )}
                  </div>

                  <div className={styles.stackBlock} title="Стек фишек игрока">
                    <ChipStackSvg
                      size={22}
                      layers={Math.min(5, Math.max(2, Math.round(bot.stack / Math.max(0.4, bigBlind * 10))))}
                      accent={bot.aggression > 0.68 ? 'crimson' : 'gold'}
                    />
                    <span className={styles.stackAmount}>{formatAmount(bot.stack)}</span>
                  </div>
                </div>

                <div className={styles.seatBottomRow}>
                  <span
                    className={`${styles.actionPill} ${
                      bot.folded
                        ? styles.actionPillFold
                        : bot.allIn
                          ? styles.actionPillAllIn
                          : ''
                    }`}
                  >
                    {bot.lastActionLabel}
                  </span>
                  {botHandName && (
                    <span className="badge badgeGold" style={{ fontSize: '0.67rem' }}>
                      {botHandName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Felt: Pot Chip Pile & 5 Community Cards */}
        <div className={styles.centerFelt}>
          <div className={styles.potBanner}>
            <span className={styles.streetTag}>
              {hand ? STREET_LABELS[hand.street] : 'Ожидание раздачи · Texas Hold’em'}
            </span>
            <div className={styles.potChipBox}>
              <ChipStackSvg size={28} layers={potLayers} accent="gold" />
              <span>БАНК: {formatAmount(hand?.pot ?? 0)}</span>
            </div>
          </div>

          <div className={styles.boardRow}>
            {[0, 1, 2, 3, 4].map((idx) => {
              const card = visibleCommunity[idx];
              return card ? (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  highlighted={Boolean(
                    hand?.street === 'showdown' &&
                      playerCurrentHandEval?.bestFiveIds.includes(card.id)
                  )}
                />
              ) : (
                <div key={idx} className={styles.emptyCardSlot} aria-hidden="true" />
              );
            })}
          </div>

          {hand?.resultBanner && (
            <div
              role="status"
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                backgroundColor: hand.winnerIds.includes('player')
                  ? 'rgba(16, 185, 129, 0.28)'
                  : 'rgba(15, 23, 42, 0.88)',
                border: `1.5px solid ${
                  hand.winnerIds.includes('player') ? '#10b981' : '#475569'
                }`,
                color: '#f8fafc',
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              {hand.resultBanner}
            </div>
          )}
        </div>

        {/* Bottom Hero Station: Your Cards, Your Chip Stack & Betting Controls */}
        <div className={styles.heroSeat}>
          <div className={styles.heroLeft}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.98rem', color: '#f8fafc' }}>
                  {activeProfile?.nickname ?? 'Игрок'} (Вы)
                </strong>
                {hand?.dealerSeat === 0 && (
                  <span className={styles.dealerBtn} title="Вы на баттоне дилера">D</span>
                )}
                {hand?.sbSeat === 0 && <span className={styles.blindBadge}>SB</span>}
                {hand?.bbSeat === 0 && <span className={styles.blindBadge}>BB</span>}
              </div>

              <div className={styles.stackBlock} style={{ width: 'fit-content' }}>
                <ChipStackSvg size={24} layers={5} accent="emerald" />
                <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>Ваш стек:</span>
                <strong className={styles.stackAmount}>{formatAmount(balance)}</strong>
              </div>

              {hand && (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Фишек в банке от вас:{' '}
                  <strong className="mono" style={{ color: '#f8fafc' }}>
                    {formatAmount(hand.playerTotalCommitted)}
                  </strong>
                </div>
              )}

              {playerCurrentHandEval && (
                <div>
                  <span className="badge badgeEmerald">
                    Комбинация: {playerCurrentHandEval.nameRu}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.heroControls}>
            {isPlaying && hand ? (
              <>
                <div className={styles.mainActionRow}>
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
                    onClick={() => executeRaiseOrAllIn(raiseExtra, false)}
                  >
                    Рейз +{formatAmount(Math.min(raiseExtra, maxRaiseCap || raiseExtra))}
                  </button>

                  <button
                    type="button"
                    className={`btn ${styles.allInBtn}`}
                    disabled={balance <= 0.01}
                    onClick={() => executeRaiseOrAllIn(maxRaiseCap, true)}
                  >
                    <Flame size={15} /> ОЛЛ-ИН ({formatAmount(Math.min(balance, roundCurrency(toCall + maxRaiseCap)))})
                  </button>
                </div>

                {canRaise && (
                  <div className={styles.chipSizingRow}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Фишки рейза:
                    </span>
                    {[
                      { label: '1 ББ', val: hand.bigBlind },
                      { label: '2 ББ', val: roundCurrency(hand.bigBlind * 2) },
                      { label: '1/2 Банка', val: roundCurrency(Math.max(hand.bigBlind, hand.pot * 0.5)) },
                      { label: 'Банк', val: roundCurrency(Math.max(hand.bigBlind, hand.pot)) },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        className={styles.pokerChipBtn}
                        onClick={() => {
                          playSound('click');
                          setRaiseExtra(Math.min(chip.val, maxRaiseCap));
                        }}
                      >
                        {chip.label} ({formatAmount(Math.min(chip.val, maxRaiseCap))})
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  gap: 14,
                  width: '100%',
                }}
              >
                <div style={{ minWidth: 240, flex: 1, maxWidth: 360 }}>
                  <BetControls
                    wager={bigBlind}
                    onChange={(v) => {
                      setBigBlind(v);
                      setRaiseExtra(v);
                    }}
                    label="Размер Большого Блайнда (BB)"
                  />
                </div>
                <button
                  type="button"
                  className="btn btnPrimary btnLg"
                  disabled={bigBlind <= 0 || bigBlind * 1.25 > balance}
                  onClick={startNewHand}
                >
                  <Play size={17} /> Раздать карты и фишки
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
