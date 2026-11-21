import { Card, createDeck } from '../../core/cards';
import { roundCurrency } from '../../core/currency';

export type BaccaratSide = 'player' | 'banker' | 'tie';

export function baccaratCardValue(card: Card): number {
  if (card.rank === 'A') return 1;
  if (card.rank === '10' || card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    return 0;
  }
  return Number(card.rank);
}

export function baccaratHandScore(cards: readonly Card[]): number {
  const sum = cards.reduce((acc, c) => acc + baccaratCardValue(c), 0);
  return sum % 10;
}

export function shouldBankerDrawThird(
  bankerScore: number,
  playerThirdCard: Card | null
): boolean {
  if (playerThirdCard === null) {
    return bankerScore <= 5;
  }
  const v = baccaratCardValue(playerThirdCard);
  if (bankerScore <= 2) return true;
  if (bankerScore === 3) return v !== 8;
  if (bankerScore === 4) return v >= 2 && v <= 7;
  if (bankerScore === 5) return v >= 4 && v <= 7;
  if (bankerScore === 6) return v === 6 || v === 7;
  return false;
}

export interface BaccaratDealOutcome {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  winner: BaccaratSide;
  payout: number;
  multiplier: number | null;
  roundOutcome: 'win' | 'loss' | 'push';
  summary: string;
}

export function dealBaccaratRound(
  betSide: BaccaratSide,
  wager: number,
  customShoe?: Card[]
): BaccaratDealOutcome {
  const shoe = customShoe ? [...customShoe] : createDeck(6);
  const p1 = shoe.shift()!;
  const b1 = shoe.shift()!;
  const p2 = shoe.shift()!;
  const b2 = shoe.shift()!;

  const playerCards: Card[] = [p1, p2];
  const bankerCards: Card[] = [b1, b2];

  let pScore = baccaratHandScore(playerCards);
  let bScore = baccaratHandScore(bankerCards);

  const isNatural = pScore >= 8 || bScore >= 8;

  if (!isNatural) {
    let playerThird: Card | null = null;
    if (pScore <= 5) {
      playerThird = shoe.shift()!;
      playerCards.push(playerThird);
      pScore = baccaratHandScore(playerCards);
    }
    if (shouldBankerDrawThird(bScore, playerThird)) {
      const bankerThird = shoe.shift()!;
      bankerCards.push(bankerThird);
      bScore = baccaratHandScore(bankerCards);
    }
  }

  const winner: BaccaratSide =
    pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';

  let payout = 0;
  let multiplier: number | null = null;
  let roundOutcome: 'win' | 'loss' | 'push' = 'loss';

  if (betSide === winner) {
    const mult = betSide === 'player' ? 2 : betSide === 'banker' ? 1.95 : 9;
    payout = roundCurrency(wager * mult);
    multiplier = mult;
    roundOutcome = 'win';
  } else if (winner === 'tie' && (betSide === 'player' || betSide === 'banker')) {
    // Standard Punto Banco rule: Player & Banker bets push on Tie
    payout = wager;
    multiplier = 1;
    roundOutcome = 'push';
  }

  const winnerRu =
    winner === 'player' ? 'Player (Игрок)' : winner === 'banker' ? 'Banker (Банкир)' : 'Tie (Ничья)';

  return {
    playerCards,
    bankerCards,
    playerScore: pScore,
    bankerScore: bScore,
    winner,
    payout,
    multiplier,
    roundOutcome,
    summary: `Игрок ${pScore} : ${bScore} Банкир · Исход: ${winnerRu}`,
  };
}
