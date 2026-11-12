import { cryptoShuffle } from './rng';

export type CardSuit = 'hearts' | 'diamonds' | 'spades' | 'clubs';
export type CardRank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface Card {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  numericValue: number; // 2..14 (Ace = 14)
}

export const SUITS: readonly CardSuit[] = ['hearts', 'diamonds', 'spades', 'clubs'];
export const RANKS: readonly CardRank[] = [
  '2',
  '3',
  '4',
  '5',
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

export function rankToValue(rank: CardRank): number {
  switch (rank) {
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    case '5':
      return 5;
    case '6':
      return 6;
    case '7':
      return 7;
    case '8':
      return 8;
    case '9':
      return 9;
    case '10':
      return 10;
    case 'J':
      return 11;
    case 'Q':
      return 12;
    case 'K':
      return 13;
    case 'A':
      return 14;
  }
}

export function isRedSuit(suit: CardSuit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function suitNameRu(suit: CardSuit): string {
  switch (suit) {
    case 'hearts':
      return 'Черви';
    case 'diamonds':
      return 'Бубны';
    case 'spades':
      return 'Пики';
    case 'clubs':
      return 'Трефы';
  }
}

export function formatCardRu(card: Card): string {
  return `${card.rank} (${suitNameRu(card.suit)})`;
}

export function createDeck(deckCount = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < deckCount; d += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          id: `${d}-${rank}-${suit}`,
          suit,
          rank,
          numericValue: rankToValue(rank),
        });
      }
    }
  }
  return cryptoShuffle(cards);
}
