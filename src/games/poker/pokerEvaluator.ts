import { Card } from '../../core/cards';

export type PokerHandCategory =
  | 9 // Royal Flush
  | 8 // Straight Flush
  | 7 // Four of a Kind
  | 6 // Full House
  | 5 // Flush
  | 4 // Straight
  | 3 // Three of a Kind
  | 2 // Two Pair
  | 1 // One Pair
  | 0; // High Card

export interface EvaluatedPokerHand {
  category: PokerHandCategory;
  nameRu: string;
  tiebreakers: number[];
  score: number;
  bestFiveIds: string[];
}

export const HAND_CATEGORY_NAMES: Record<PokerHandCategory, string> = {
  9: 'Роял-флеш',
  8: 'Стрит-флеш',
  7: 'Каре',
  6: 'Фулл-хаус',
  5: 'Флеш',
  4: 'Стрит',
  3: 'Сет (Тройка)',
  2: 'Две пары',
  1: 'Пара',
  0: 'Старшая карта',
};

function encodeScore(category: PokerHandCategory, tiebreakers: number[]): number {
  let score = category;
  for (let i = 0; i < 5; i += 1) {
    score = score * 16 + (tiebreakers[i] ?? 0);
  }
  return score;
}

function findStraightHigh(uniqueSortedDesc: number[]): number | null {
  const vals = [...uniqueSortedDesc];
  if (vals.includes(14)) {
    vals.push(1); // Ace-low wheel A-2-3-4-5
  }
  for (let i = 0; i <= vals.length - 5; i += 1) {
    if (
      vals[i]! - vals[i + 1]! === 1 &&
      vals[i + 1]! - vals[i + 2]! === 1 &&
      vals[i + 2]! - vals[i + 3]! === 1 &&
      vals[i + 3]! - vals[i + 4]! === 1
    ) {
      return vals[i]!;
    }
  }
  return null;
}

/**
 * Evaluates an exact 5-card poker combination.
 */
export function evaluateFiveCards(five: readonly Card[]): EvaluatedPokerHand {
  const sorted = [...five].sort((a, b) => b.numericValue - a.numericValue);
  const values = sorted.map((c) => c.numericValue);
  const uniqueVals = Array.from(new Set(values));
  const isFlush = five.every((c) => c.suit === five[0]!.suit);
  const straightHigh = uniqueVals.length === 5 ? findStraightHigh(uniqueVals) : null;

  const ids = sorted.map((c) => c.id);

  if (isFlush && straightHigh !== null) {
    const cat: PokerHandCategory = straightHigh === 14 ? 9 : 8;
    const tb = [straightHigh, 0, 0, 0, 0];
    return {
      category: cat,
      nameRu: HAND_CATEGORY_NAMES[cat],
      tiebreakers: tb,
      score: encodeScore(cat, tb),
      bestFiveIds: ids,
    };
  }

  // Group counts by rank value
  const countMap = new Map<number, number>();
  for (const v of values) {
    countMap.set(v, (countMap.get(v) ?? 0) + 1);
  }

  // Sort groups by count DESC, then rank value DESC
  const groups = Array.from(countMap.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (groups[0]![1] === 4) {
    const tb = [groups[0]![0], groups[1]![0], 0, 0, 0];
    return {
      category: 7,
      nameRu: HAND_CATEGORY_NAMES[7],
      tiebreakers: tb,
      score: encodeScore(7, tb),
      bestFiveIds: ids,
    };
  }

  if (groups[0]![1] === 3 && groups[1]![1] === 2) {
    const tb = [groups[0]![0], groups[1]![0], 0, 0, 0];
    return {
      category: 6,
      nameRu: HAND_CATEGORY_NAMES[6],
      tiebreakers: tb,
      score: encodeScore(6, tb),
      bestFiveIds: ids,
    };
  }

  if (isFlush) {
    return {
      category: 5,
      nameRu: HAND_CATEGORY_NAMES[5],
      tiebreakers: values,
      score: encodeScore(5, values),
      bestFiveIds: ids,
    };
  }

  if (straightHigh !== null) {
    const tb = [straightHigh, 0, 0, 0, 0];
    return {
      category: 4,
      nameRu: HAND_CATEGORY_NAMES[4],
      tiebreakers: tb,
      score: encodeScore(4, tb),
      bestFiveIds: ids,
    };
  }

  if (groups[0]![1] === 3) {
    const tb = [groups[0]![0], groups[1]![0], groups[2]![0], 0, 0];
    return {
      category: 3,
      nameRu: HAND_CATEGORY_NAMES[3],
      tiebreakers: tb,
      score: encodeScore(3, tb),
      bestFiveIds: ids,
    };
  }

  if (groups[0]![1] === 2 && groups[1]![1] === 2) {
    const tb = [groups[0]![0], groups[1]![0], groups[2]![0], 0, 0];
    return {
      category: 2,
      nameRu: HAND_CATEGORY_NAMES[2],
      tiebreakers: tb,
      score: encodeScore(2, tb),
      bestFiveIds: ids,
    };
  }

  if (groups[0]![1] === 2) {
    const tb = [groups[0]![0], groups[1]![0], groups[2]![0], groups[3]![0], 0];
    return {
      category: 1,
      nameRu: HAND_CATEGORY_NAMES[1],
      tiebreakers: tb,
      score: encodeScore(1, tb),
      bestFiveIds: ids,
    };
  }

  return {
    category: 0,
    nameRu: HAND_CATEGORY_NAMES[0],
    tiebreakers: values,
    score: encodeScore(0, values),
    bestFiveIds: ids,
  };
}

/**
 * Evaluates best 5-card Texas Hold'em hand out of 5..7 available cards.
 */
export function evaluateBestPokerHand(cards: readonly Card[]): EvaluatedPokerHand {
  if (cards.length < 5) {
    throw new Error('At least 5 cards are required to evaluate a poker hand');
  }
  if (cards.length === 5) {
    return evaluateFiveCards(cards);
  }

  let best: EvaluatedPokerHand | null = null;
  const n = cards.length;

  for (let a = 0; a < n - 4; a += 1) {
    for (let b = a + 1; b < n - 3; b += 1) {
      for (let c = b + 1; c < n - 2; c += 1) {
        for (let d = c + 1; d < n - 1; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            const candidate = evaluateFiveCards([
              cards[a]!,
              cards[b]!,
              cards[c]!,
              cards[d]!,
              cards[e]!,
            ]);
            if (!best || candidate.score > best.score) {
              best = candidate;
            }
          }
        }
      }
    }
  }

  return best!;
}
