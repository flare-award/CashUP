import { Card } from '../../core/cards';
import { roundCurrency } from '../../core/currency';

export function cardBjValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') return 10;
  return Number(card.rank);
}

export interface HandScore {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isNaturalBlackjack: boolean;
}

export function scoreBlackjackHand(
  cards: readonly Card[],
  fromSplit = false
): HandScore {
  let total = 0;
  let aces = 0;

  for (const c of cards) {
    total += cardBjValue(c);
    if (c.rank === 'A') aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  const isSoft = aces > 0 && total <= 21;
  const isBust = total > 21;
  const isNaturalBlackjack = !fromSplit && cards.length === 2 && total === 21;

  return { total, isSoft, isBust, isNaturalBlackjack };
}

export function canSplitHand(cards: readonly Card[]): boolean {
  if (cards.length !== 2) return false;
  return cardBjValue(cards[0]!) === cardBjValue(cards[1]!);
}

export interface PlayerBjHand {
  cards: Card[];
  wager: number;
  stood: boolean;
  doubled: boolean;
  fromSplit: boolean;
  outcomeText?: string;
  payout?: number;
}

/**
 * Runs standard dealer rule: dealer hits while total < 17, stands on all 17s.
 */
export function playOutDealerHand(dealerCards: readonly Card[], shoe: readonly Card[]): {
  finalDealerCards: Card[];
  remainingShoe: Card[];
} {
  const hand = [...dealerCards];
  const deck = [...shoe];
  while (scoreBlackjackHand(hand).total < 17 && deck.length > 0) {
    hand.push(deck.shift()!);
  }
  return { finalDealerCards: hand, remainingShoe: deck };
}

export function settleBlackjackHands(
  playerHands: readonly PlayerBjHand[],
  dealerCards: readonly Card[]
): {
  settledHands: PlayerBjHand[];
  totalWager: number;
  totalPayout: number;
} {
  const dealerScore = scoreBlackjackHand(dealerCards);
  let totalWager = 0;
  let totalPayout = 0;

  const settledHands = playerHands.map((ph) => {
    const pScore = scoreBlackjackHand(ph.cards, ph.fromSplit);
    totalWager = roundCurrency(totalWager + ph.wager);

    let payout = 0;
    let outcomeText = '';

    if (pScore.isBust) {
      payout = 0;
      outcomeText = `Перебор (${pScore.total})`;
    } else if (pScore.isNaturalBlackjack && !dealerScore.isNaturalBlackjack) {
      payout = roundCurrency(ph.wager * 2.5);
      outcomeText = 'Блэкджек 3:2!';
    } else if (dealerScore.isNaturalBlackjack && !pScore.isNaturalBlackjack) {
      payout = 0;
      outcomeText = 'Блэкджек у дилера';
    } else if (dealerScore.isBust) {
      payout = roundCurrency(ph.wager * 2);
      outcomeText = `Победа (${pScore.total}, у дилера перебор)`;
    } else if (pScore.total > dealerScore.total) {
      payout = roundCurrency(ph.wager * 2);
      outcomeText = `Победа (${pScore.total} > ${dealerScore.total})`;
    } else if (pScore.total === dealerScore.total) {
      payout = ph.wager;
      outcomeText = `Ничья / Push (${pScore.total})`;
    } else {
      payout = 0;
      outcomeText = `Поражение (${pScore.total} < ${dealerScore.total})`;
    }

    totalPayout = roundCurrency(totalPayout + payout);
    return {
      ...ph,
      payout,
      outcomeText,
    };
  });

  return {
    settledHands,
    totalWager,
    totalPayout,
  };
}
