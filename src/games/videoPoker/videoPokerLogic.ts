import { Card, createDeck } from '../../core/cards';

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
}

export function evaluateJacksOrBetter(cards: Card[]): VideoPokerEvaluation {
  if (cards.length !== 5) {
    return { rankId: 'none', nameRu: 'Нет комбинации', multiplier: 0 };
  }

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
    return { rankId: 'royal-flush', nameRu: 'Роял-флеш', multiplier: 800 };
  }
  if (isFlush && isStraight) {
    return { rankId: 'straight-flush', nameRu: 'Стрит-флеш', multiplier: 50 };
  }

  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const freq = Array.from(counts.values()).sort((a, b) => b - a);

  if (freq[0] === 4) {
    return { rankId: 'four-of-a-kind', nameRu: 'Каре', multiplier: 25 };
  }
  if (freq[0] === 3 && freq[1] === 2) {
    return { rankId: 'full-house', nameRu: 'Фулл-хаус', multiplier: 9 };
  }
  if (isFlush) {
    return { rankId: 'flush', nameRu: 'Флеш', multiplier: 6 };
  }
  if (isStraight) {
    return { rankId: 'straight', nameRu: 'Стрит', multiplier: 4 };
  }
  if (freq[0] === 3) {
    return { rankId: 'three-of-a-kind', nameRu: 'Тройка (Сет)', multiplier: 3 };
  }
  if (freq[0] === 2 && freq[1] === 2) {
    return { rankId: 'two-pair', nameRu: 'Две пары', multiplier: 2 };
  }
  if (freq[0] === 2) {
    // Check if the pair is Jacks (11) or higher
    for (const [val, cnt] of counts.entries()) {
      if (cnt === 2 && val >= 11) {
        return {
          rankId: 'jacks-or-better',
          nameRu: 'Пара Валетов и выше',
          multiplier: 1,
        };
      }
    }
  }

  return { rankId: 'none', nameRu: 'Старшая карта (без выплаты)', multiplier: 0 };
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
