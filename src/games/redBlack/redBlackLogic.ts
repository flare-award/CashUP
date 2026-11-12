import { Card, CardSuit, createDeck, formatCardRu, isRedSuit, suitNameRu } from '../../core/cards';
import { roundCurrency } from '../../core/currency';

export type RedBlackChoice = 'red' | 'black' | CardSuit;

export function getRedBlackMultiplier(choice: RedBlackChoice): number {
  if (choice === 'red' || choice === 'black') return 2;
  return 3.9;
}

export function getChoiceLabelRu(choice: RedBlackChoice): string {
  if (choice === 'red') return 'Красное';
  if (choice === 'black') return 'Чёрное';
  return `Масть ${suitNameRu(choice)}`;
}

export interface RedBlackResult {
  card: Card;
  won: boolean;
  multiplier: number;
  payout: number;
  summary: string;
}

export function playRedBlackRound(choice: RedBlackChoice, wager: number): RedBlackResult {
  const card = createDeck(1)[0]!;
  const red = isRedSuit(card.suit);
  const won =
    choice === 'red'
      ? red
      : choice === 'black'
        ? !red
        : card.suit === choice;

  const mult = won ? getRedBlackMultiplier(choice) : 0;
  const payout = roundCurrency(wager * mult);

  return {
    card,
    won,
    multiplier: mult,
    payout,
    summary: `Карта ${formatCardRu(card)} · Выбор: ${getChoiceLabelRu(choice)}`,
  };
}
