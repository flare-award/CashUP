import { Card } from '../../core/cards';

export type HiLoGuess = 'higher' | 'lower';

export interface HiLoOdds {
  higherMultiplier: number | null;
  lowerMultiplier: number | null;
  higherChancePct: number;
  lowerChancePct: number;
}

export function computeHiLoOdds(
  currentCard: Card,
  remainingDeck: readonly Card[]
): HiLoOdds {
  const higherCount = remainingDeck.filter(
    (c) => c.numericValue > currentCard.numericValue
  ).length;
  const lowerCount = remainingDeck.filter(
    (c) => c.numericValue < currentCard.numericValue
  ).length;
  const decisiveTotal = higherCount + lowerCount;

  if (decisiveTotal === 0) {
    return {
      higherMultiplier: null,
      lowerMultiplier: null,
      higherChancePct: 0,
      lowerChancePct: 0,
    };
  }

  const pHigher = higherCount / decisiveTotal;
  const pLower = lowerCount / decisiveTotal;

  const higherMultiplier =
    higherCount > 0
      ? Math.max(1.05, Math.min(12.5, Math.round((0.97 / pHigher) * 100) / 100))
      : null;
  const lowerMultiplier =
    lowerCount > 0
      ? Math.max(1.05, Math.min(12.5, Math.round((0.97 / pLower) * 100) / 100))
      : null;

  return {
    higherMultiplier,
    lowerMultiplier,
    higherChancePct: Math.round(pHigher * 1000) / 10,
    lowerChancePct: Math.round(pLower * 1000) / 10,
  };
}
