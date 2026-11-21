import { Card, CardSuit, createDeck } from '../../core/cards';

export type VideoPokerRankId =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'jacks-or-better'
  | 'none';

export interface VideoPokerPayRow {
  id: Exclude<VideoPokerRankId, 'none'>;
  nameRu: string;
  multiplier: number;
}

export const VIDEO_POKER_PAYTABLE: readonly VideoPokerPayRow[] = [
  { id: 'royal-flush', nameRu: 'Роял-флеш', multiplier: 800 },
  { id: 'straight-flush', nameRu: 'Стрит-флеш', multiplier: 50 },
  { id: 'four-of-a-kind', nameRu: 'Каре', multiplier: 25 },
  { id: 'full-house', nameRu: 'Фулл-хаус', multiplier: 9 },
  { id: 'flush', nameRu: 'Флеш', multiplier: 6 },
  { id: 'straight', nameRu: 'Стрит', multiplier: 4 },
  { id: 'three-of-a-kind', nameRu: 'Тройка (Сет)', multiplier: 3 },
  { id: 'two-pair', nameRu: 'Две пары', multiplier: 2 },
  { id: 'jacks-or-better', nameRu: 'Пара Валетов и выше', multiplier: 1 },
];

export interface VideoPokerEvaluation {
  rankId: VideoPokerRankId;
  nameRu: string;
  multiplier: number;
  winningCardIds: string[];
}

export function evaluateJacksOrBetter(cards: Card[]): VideoPokerEvaluation {
  if (cards.length !== 5) {
    return {
      rankId: 'none',
      nameRu: 'Нет комбинации',
      multiplier: 0,
      winningCardIds: [],
    };
  }

  const allIds = cards.map((c) => c.id);
  const values = cards.map((c) => c.numericValue).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const uniqueVals = Array.from(new Set(values));
  let isStraight = false;
  if (uniqueVals.length === 5) {
    if (values[4]! - values[0]! === 4) {
      isStraight = true;
    } else if (
      values[0] === 2 &&
      values[1] === 3 &&
      values[2] === 4 &&
      values[3] === 5 &&
      values[4] === 14
    ) {
      isStraight = true; // Wheel A-2-3-4-5
    }
  }

  const isRoyal =
    isFlush &&
    values[0] === 10 &&
    values[1] === 11 &&
    values[2] === 12 &&
    values[3] === 13 &&
    values[4] === 14;

  if (isRoyal) {
    return {
      rankId: 'royal-flush',
      nameRu: 'Роял-флеш',
      multiplier: 800,
      winningCardIds: allIds,
    };
  }
  if (isFlush && isStraight) {
    return {
      rankId: 'straight-flush',
      nameRu: 'Стрит-флеш',
      multiplier: 50,
      winningCardIds: allIds,
    };
  }

  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const freq = Array.from(counts.values()).sort((a, b) => b - a);

  if (freq[0] === 4) {
    let quadVal = 0;
    for (const [val, cnt] of counts.entries()) {
      if (cnt === 4) quadVal = val;
    }
    return {
      rankId: 'four-of-a-kind',
      nameRu: 'Каре',
      multiplier: 25,
      winningCardIds: cards.filter((c) => c.numericValue === quadVal).map((c) => c.id),
    };
  }
  if (freq[0] === 3 && freq[1] === 2) {
    return {
      rankId: 'full-house',
      nameRu: 'Фулл-хаус',
      multiplier: 9,
      winningCardIds: allIds,
    };
  }
  if (isFlush) {
    return {
      rankId: 'flush',
      nameRu: 'Флеш',
      multiplier: 6,
      winningCardIds: allIds,
    };
  }
  if (isStraight) {
    return {
      rankId: 'straight',
      nameRu: 'Стрит',
      multiplier: 4,
      winningCardIds: allIds,
    };
  }
  if (freq[0] === 3) {
    let tripVal = 0;
    for (const [val, cnt] of counts.entries()) {
      if (cnt === 3) tripVal = val;
    }
    return {
      rankId: 'three-of-a-kind',
      nameRu: 'Тройка (Сет)',
      multiplier: 3,
      winningCardIds: cards.filter((c) => c.numericValue === tripVal).map((c) => c.id),
    };
  }
  if (freq[0] === 2 && freq[1] === 2) {
    const pairVals = new Set<number>();
    for (const [val, cnt] of counts.entries()) {
      if (cnt === 2) pairVals.add(val);
    }
    return {
      rankId: 'two-pair',
      nameRu: 'Две пары',
      multiplier: 2,
      winningCardIds: cards
        .filter((c) => pairVals.has(c.numericValue))
        .map((c) => c.id),
    };
  }
  if (freq[0] === 2) {
    for (const [val, cnt] of counts.entries()) {
      if (cnt === 2 && val >= 11) {
        return {
          rankId: 'jacks-or-better',
          nameRu: 'Пара Валетов и выше',
          multiplier: 1,
          winningCardIds: cards.filter((c) => c.numericValue === val).map((c) => c.id),
        };
      }
    }
  }

  return {
    rankId: 'none',
    nameRu: 'Нет выигрышной комбинации',
    multiplier: 0,
    winningCardIds: [],
  };
}

/**
 * Suggests optimal beginner holds for a 5-card Jacks-or-Better initial hand.
 */
export function suggestBestHolds(cards: Card[]): boolean[] {
  if (cards.length !== 5) return [false, false, false, false, false];
  const evalNow = evaluateJacksOrBetter(cards);

  // 1. If already a 5-card made hand (Straight, Flush, Full House, Straight Flush, Royal) -> hold all 5!
  if (
    evalNow.rankId === 'royal-flush' ||
    evalNow.rankId === 'straight-flush' ||
    evalNow.rankId === 'full-house' ||
    evalNow.rankId === 'flush' ||
    evalNow.rankId === 'straight'
  ) {
    return [true, true, true, true, true];
  }

  // 2. If Four of a Kind, Three of a Kind, Two Pair, or High Pair -> hold the matching cards!
  if (evalNow.winningCardIds.length > 0) {
    return cards.map((c) => evalNow.winningCardIds.includes(c.id));
  }

  // 3. Check for any low pair (2..10) -> hold the low pair to draw for Three of a Kind / Two Pair / Full House!
  const valCounts = new Map<number, number>();
  for (const c of cards) {
    valCounts.set(c.numericValue, (valCounts.get(c.numericValue) ?? 0) + 1);
  }
  for (const [val, cnt] of valCounts.entries()) {
    if (cnt === 2) {
      return cards.map((c) => c.numericValue === val);
    }
  }

  // 4. Check for 4-card Flush draw
  const suitCounts = new Map<CardSuit, number>();
  for (const c of cards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  for (const [suit, cnt] of suitCounts.entries()) {
    if (cnt === 4) {
      return cards.map((c) => c.suit === suit);
    }
  }

  // 5. Otherwise hold high cards (J, Q, K, A)
  const highMask = cards.map((c) => c.numericValue >= 11);
  if (highMask.some(Boolean)) {
    return highMask;
  }

  return [false, false, false, false, false];
}

export function dealVideoPokerInitial(): {
  initialHand: Card[];
  drawPool: Card[];
} {
  const deck = createDeck(1);
  return {
    initialHand: deck.slice(0, 5),
    drawPool: deck.slice(5, 10),
  };
}
