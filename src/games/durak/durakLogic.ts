import {
  Card,
  CardRank,
  CardSuit,
  rankToValue,
  SUITS,
  suitNameRu,
} from '../../core/cards';
import { NPC_ROSTER } from '../../core/npc';
import { cryptoShuffle } from '../../core/rng';
import { AvatarId } from '../../types';

export type DurakPlayerCount = 2 | 3 | 4;

export const DURAK_PAYOUT_MULTIPLIERS: Record<DurakPlayerCount, number> = {
  2: 1.95,
  3: 2.85,
  4: 3.8,
};

const DURAK_RANKS: readonly CardRank[] = [
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

export interface DurakTablePair {
  attack: Card;
  defense: Card | null;
}

export interface DurakSeat {
  seatIndex: number;
  isHuman: boolean;
  nickname: string;
  avatarId: AvatarId;
  hand: Card[];
}

export interface DurakState {
  playerCount: DurakPlayerCount;
  wager: number;
  deck: Card[]; // index 0 = top of deck; last element = face-up trump card at bottom!
  trumpCard: Card;
  trumpSuit: CardSuit;
  discardCount: number;
  seats: DurakSeat[];
  attackerSeat: number;
  defenderSeat: number;
  tablePairs: DurakTablePair[];
  phase: 'playing' | 'finished';
  winnerSeat: number | null; // -1 for draw/push
  statusText: string;
}

const DURAK_BOTS = [
  NPC_ROSTER.find((n) => n.id === 'npc-luckyfox') ?? NPC_ROSTER[0]!,
  NPC_ROSTER.find((n) => n.id === 'npc-viktorshark') ?? NPC_ROSTER[1]!,
  NPC_ROSTER.find((n) => n.id === 'npc-artyomblaze') ?? NPC_ROSTER[2]!,
];

export function createDurakDeck36(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of DURAK_RANKS) {
      cards.push({
        id: `d36-${rank}-${suit}`,
        suit,
        rank,
        numericValue: rankToValue(rank),
      });
    }
  }
  return cryptoShuffle(cards);
}

export function sortDurakHand(hand: Card[], trumpSuit: CardSuit): Card[] {
  return [...hand].sort((a, b) => {
    const aTrump = a.suit === trumpSuit ? 1 : 0;
    const bTrump = b.suit === trumpSuit ? 1 : 0;
    if (aTrump !== bTrump) return aTrump - bTrump;
    if (a.numericValue !== b.numericValue) return a.numericValue - b.numericValue;
    return a.suit.localeCompare(b.suit);
  });
}

export function canBeatDurakCard(
  attackCard: Card,
  defenseCard: Card,
  trumpSuit: CardSuit
): boolean {
  if (defenseCard.suit === attackCard.suit) {
    return defenseCard.numericValue > attackCard.numericValue;
  }
  return defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit;
}

export function getTableRanks(tablePairs: DurakTablePair[]): Set<CardRank> {
  const ranks = new Set<CardRank>();
  for (const pair of tablePairs) {
    ranks.add(pair.attack.rank);
    if (pair.defense) ranks.add(pair.defense.rank);
  }
  return ranks;
}

export function canAttackWithCard(
  card: Card,
  tablePairs: DurakTablePair[],
  defenderHandSize: number
): boolean {
  if (tablePairs.length >= 6) return false;
  const uncoveredCount = tablePairs.filter((p) => !p.defense).length;
  if (uncoveredCount >= defenderHandSize) return false;
  if (tablePairs.length === 0) return true;
  const ranks = getTableRanks(tablePairs);
  return ranks.has(card.rank);
}

export function createDurakMatch(
  playerCount: DurakPlayerCount,
  wager: number,
  humanNickname: string,
  humanAvatar: AvatarId
): DurakState {
  const deck = createDurakDeck36();
  const seats: DurakSeat[] = [
    {
      seatIndex: 0,
      isHuman: true,
      nickname: humanNickname,
      avatarId: humanAvatar,
      hand: [],
    },
  ];

  for (let i = 1; i < playerCount; i += 1) {
    const bot = DURAK_BOTS[(i - 1) % DURAK_BOTS.length]!;
    seats.push({
      seatIndex: i,
      isHuman: false,
      nickname: bot.nickname,
      avatarId: bot.avatarId,
      hand: [],
    });
  }

  // Deal 6 cards each
  let cursor = 0;
  for (let round = 0; round < 6; round += 1) {
    for (let s = 0; s < playerCount; s += 1) {
      seats[s]!.hand.push(deck[cursor]!);
      cursor += 1;
    }
  }

  const remainingDeck = deck.slice(cursor);
  const trumpCard = remainingDeck[remainingDeck.length - 1]!;
  const trumpSuit = trumpCard.suit;

  for (const s of seats) {
    s.hand = sortDurakHand(s.hand, trumpSuit);
  }

  // Player with lowest trump goes first
  let firstAttacker = 0;
  let lowestTrumpVal = 999;
  for (const s of seats) {
    for (const c of s.hand) {
      if (c.suit === trumpSuit && c.numericValue < lowestTrumpVal) {
        lowestTrumpVal = c.numericValue;
        firstAttacker = s.seatIndex;
      }
    }
  }

  const firstDefender = (firstAttacker + 1) % playerCount;
  const attackerName = seats[firstAttacker]!.isHuman
    ? 'Ваш ход (Атака)'
    : `Атакует ${seats[firstAttacker]!.nickname}`;

  return {
    playerCount,
    wager,
    deck: remainingDeck,
    trumpCard,
    trumpSuit,
    discardCount: 0,
    seats,
    attackerSeat: firstAttacker,
    defenderSeat: firstDefender,
    tablePairs: [],
    phase: 'playing',
    winnerSeat: null,
    statusText: `Козырь — ${suitNameRu(trumpSuit)}. ${attackerName}.`,
  };
}

/**
 * Determines whose immediate decision is needed right now:
 * - 'defender': there is an uncovered attack card on the table
 * - 'attacker': table is empty OR all cards on table are covered
 */
export function getActiveDurakRole(state: DurakState): {
  role: 'attacker' | 'defender';
  seatIndex: number;
} {
  const hasUncovered = state.tablePairs.some((p) => p.defense === null);
  if (hasUncovered) {
    return { role: 'defender', seatIndex: state.defenderSeat };
  }
  return { role: 'attacker', seatIndex: state.attackerSeat };
}

function replenishHandsAndCheckWinner(
  state: DurakState,
  defenderTookCards: boolean
): DurakState {
  const deck = [...state.deck];
  const seats = state.seats.map((s) => ({ ...s, hand: [...s.hand] }));
  const n = state.playerCount;

  // Draw order: main attacker, other non-defender seats clockwise, defender LAST
  const drawOrder: number[] = [state.attackerSeat];
  for (let step = 1; step < n; step += 1) {
    const idx = (state.attackerSeat + step) % n;
    if (idx !== state.defenderSeat) {
      drawOrder.push(idx);
    }
  }
  drawOrder.push(state.defenderSeat);

  for (const sIdx of drawOrder) {
    const seat = seats[sIdx]!;
    while (seat.hand.length < 6 && deck.length > 0) {
      seat.hand.push(deck.shift()!);
    }
    seat.hand = sortDurakHand(seat.hand, state.trumpSuit);
  }

  // Check if deck is exhausted and anyone has 0 cards
  if (deck.length === 0) {
    const emptySeats = seats.filter((s) => s.hand.length === 0);
    if (emptySeats.length > 0) {
      const humanEmpty = emptySeats.some((s) => s.isHuman);
      if (humanEmpty && emptySeats.length > 1 && n === 2) {
        return {
          ...state,
          deck,
          seats,
          tablePairs: [],
          phase: 'finished',
          winnerSeat: -1,
          statusText: 'Ничья! Оба игрока вышли без карт одновременно.',
        };
      }
      if (humanEmpty) {
        return {
          ...state,
          deck,
          seats,
          tablePairs: [],
          phase: 'finished',
          winnerSeat: 0,
          statusText: 'Победа! Вы первым сбросили все карты и забрали банк!',
        };
      }
      const winningBot = emptySeats[0]!;
      return {
        ...state,
        deck,
        seats,
        tablePairs: [],
        phase: 'finished',
        winnerSeat: winningBot.seatIndex,
        statusText: `${winningBot.nickname} первым вышел из карт и забрал банк.`,
      };
    }
  }

  // Advance turn
  const nextAttacker = defenderTookCards
    ? (state.defenderSeat + 1) % n
    : state.defenderSeat;
  const nextDefender = (nextAttacker + 1) % n;

  const actor = seats[nextAttacker]!;
  const statusPrefix = defenderTookCards
    ? `${
        seats[state.defenderSeat]!.isHuman
          ? 'Вы забрали карты'
          : `${seats[state.defenderSeat]!.nickname} забирает карты`
      }. `
    : 'Бито! ';

  return {
    ...state,
    deck,
    seats,
    tablePairs: [],
    attackerSeat: nextAttacker,
    defenderSeat: nextDefender,
    statusText: `${statusPrefix}${
      actor.isHuman ? 'Ваш ход в атаку!' : `Атакует ${actor.nickname}.`
    }`,
  };
}

export function playAttackCard(
  state: DurakState,
  seatIndex: number,
  cardId: string
): DurakState {
  if (state.phase !== 'playing') return state;
  const seat = state.seats[seatIndex]!;
  const defender = state.seats[state.defenderSeat]!;
  const card = seat.hand.find((c) => c.id === cardId);
  if (!card) return state;
  if (!canAttackWithCard(card, state.tablePairs, defender.hand.length)) {
    return state;
  }

  const nextSeats = state.seats.map((s) =>
    s.seatIndex === seatIndex
      ? { ...s, hand: s.hand.filter((c) => c.id !== cardId) }
      : s
  );
  const nextPairs: DurakTablePair[] = [
    ...state.tablePairs,
    { attack: card, defense: null },
  ];

  // Immediate win check if deck is empty and attacker just played their very last card!
  if (state.deck.length === 0 && nextSeats[seatIndex]!.hand.length === 0) {
    const won = seatIndex === 0;
    return {
      ...state,
      seats: nextSeats,
      tablePairs: nextPairs,
      phase: 'finished',
      winnerSeat: seatIndex,
      statusText: won
        ? 'Победа! Вы выложили последнюю карту и выиграли партию!'
        : `${seat.nickname} выложил последнюю карту и выиграл партию.`,
    };
  }

  const defLabel = defender.isHuman ? 'Вам защищаться!' : `Защищается ${defender.nickname}.`;
  return {
    ...state,
    seats: nextSeats,
    tablePairs: nextPairs,
    statusText: `${
      seat.isHuman ? 'Вы сходили' : `${seat.nickname} ходит`
    } ${card.rank} (${suitNameRu(card.suit)}). ${defLabel}`,
  };
}

export function playDefenseCard(
  state: DurakState,
  pairIndex: number,
  cardId: string
): DurakState {
  if (state.phase !== 'playing') return state;
  const defender = state.seats[state.defenderSeat]!;
  const pair = state.tablePairs[pairIndex];
  if (!pair || pair.defense !== null) return state;

  const card = defender.hand.find((c) => c.id === cardId);
  if (!card || !canBeatDurakCard(pair.attack, card, state.trumpSuit)) {
    return state;
  }

  const nextSeats = state.seats.map((s) =>
    s.seatIndex === state.defenderSeat
      ? { ...s, hand: s.hand.filter((c) => c.id !== cardId) }
      : s
  );

  const nextPairs = state.tablePairs.map((p, idx) =>
    idx === pairIndex ? { ...p, defense: card } : p
  );

  const nextDefenderHand = nextSeats[state.defenderSeat]!.hand;

  // If defender covered everything and now has 0 cards left (or 6 pairs reached), auto-finish bout!
  const allCovered = nextPairs.every((p) => p.defense !== null);
  if (allCovered && (nextDefenderHand.length === 0 || nextPairs.length >= 6)) {
    return replenishHandsAndCheckWinner(
      {
        ...state,
        seats: nextSeats,
        tablePairs: nextPairs,
        discardCount: state.discardCount + nextPairs.length * 2,
      },
      false
    );
  }

  const attacker = nextSeats[state.attackerSeat]!;
  return {
    ...state,
    seats: nextSeats,
    tablePairs: nextPairs,
    statusText: `${
      defender.isHuman ? 'Вы отбились' : `${defender.nickname} бьёт`
    } картой ${card.rank} (${suitNameRu(card.suit)}). ${
      attacker.isHuman
        ? 'Подкиньте карту того же достоинства или нажмите «Бито».'
        : `Ход за ${attacker.nickname}…`
    }`,
  };
}

export function declareBito(state: DurakState): DurakState {
  if (state.phase !== 'playing' || state.tablePairs.length === 0) return state;
  if (state.tablePairs.some((p) => p.defense === null)) return state;

  return replenishHandsAndCheckWinner(
    {
      ...state,
      discardCount: state.discardCount + state.tablePairs.length * 2,
    },
    false
  );
}

export function defenderTakeTable(state: DurakState): DurakState {
  if (state.phase !== 'playing' || state.tablePairs.length === 0) return state;

  const collected: Card[] = [];
  for (const p of state.tablePairs) {
    collected.push(p.attack);
    if (p.defense) collected.push(p.defense);
  }

  const nextSeats = state.seats.map((s) =>
    s.seatIndex === state.defenderSeat
      ? {
          ...s,
          hand: sortDurakHand([...s.hand, ...collected], state.trumpSuit),
        }
      : s
  );

  return replenishHandsAndCheckWinner(
    {
      ...state,
      seats: nextSeats,
    },
    true
  );
}

/**
 * Fair Bot AI: uses ONLY its own hand, visible table cards, trumpSuit, and remaining deck size.
 */
export function stepDurakBotTurn(state: DurakState): DurakState {
  if (state.phase !== 'playing') return state;
  const active = getActiveDurakRole(state);
  const bot = state.seats[active.seatIndex]!;
  if (bot.isHuman) return state;

  if (active.role === 'attacker') {
    const defender = state.seats[state.defenderSeat]!;
    const sorted = sortDurakHand(bot.hand, state.trumpSuit);

    if (state.tablePairs.length === 0) {
      // Must lead 1 card (lowest non-trump, or lowest trump if only trumps)
      const lead = sorted[0];
      if (!lead) return state;
      return playAttackCard(state, bot.seatIndex, lead.id);
    }

    // Tossing in: only toss non-trumps while deck has cards, or low trumps when deck is empty
    const candidates = sorted.filter((c) => {
      if (!canAttackWithCard(c, state.tablePairs, defender.hand.length)) return false;
      if (c.suit === state.trumpSuit && state.deck.length > 2) return false;
      if (c.suit === state.trumpSuit && c.numericValue > 11 && state.deck.length > 0) {
        return false;
      }
      return true;
    });

    if (candidates.length > 0) {
      return playAttackCard(state, bot.seatIndex, candidates[0]!.id);
    }

    return declareBito(state);
  }

  // Bot is Defending: find first uncovered pair
  const uncoveredIdx = state.tablePairs.findIndex((p) => p.defense === null);
  if (uncoveredIdx < 0) return state;
  const attackCard = state.tablePairs[uncoveredIdx]!.attack;

  const validDefenses = sortDurakHand(
    bot.hand.filter((c) => canBeatDurakCard(attackCard, c, state.trumpSuit)),
    state.trumpSuit
  );

  if (validDefenses.length === 0) {
    return defenderTakeTable(state);
  }

  const cheapest = validDefenses[0]!;
  // Avoid burning Ace/King of trumps early on a small card when hand is small and deck is large
  if (
    cheapest.suit === state.trumpSuit &&
    attackCard.suit !== state.trumpSuit &&
    cheapest.numericValue >= 13 &&
    state.deck.length > 10 &&
    state.tablePairs.length === 1 &&
    bot.hand.length <= 4
  ) {
    return defenderTakeTable(state);
  }

  return playDefenseCard(state, uncoveredIdx, cheapest.id);
}
