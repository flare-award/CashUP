import { Card } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { randomFloat } from '../../core/rng';
import { evaluateBestPokerHand } from './pokerEvaluator';

export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface BotDecisionContext {
  street: PokerStreet;
  pot: number;
  toCall: number;
  minRaise: number;
  maxRaise: number;
  aggression: number; // 0..1
  tightness: number; // 0..1
  raisesThisStreet: number;
}

export type BotActionResult =
  | { action: 'fold' }
  | { action: 'check' }
  | { action: 'call'; amount: number }
  | { action: 'raise'; callPart: number; raiseExtra: number };

/**
 * Estimates hand strength in [0, 1] strictly from the bot's own 2 hole cards
 * and currently visible community cards. Never inspects opponent cards or future deck!
 */
export function estimateBotHandStrength(
  holeCards: readonly [Card, Card],
  visibleCommunity: readonly Card[]
): number {
  const [c1, c2] = holeCards;
  const high = Math.max(c1.numericValue, c2.numericValue);
  const low = Math.min(c1.numericValue, c2.numericValue);
  const isPair = c1.numericValue === c2.numericValue;
  const isSuited = c1.suit === c2.suit;
  const gap = high - low;

  if (visibleCommunity.length < 3) {
    // Preflop Chen-inspired normalized heuristic
    let score = high / 14;
    if (isPair) {
      score = Math.min(0.98, 0.52 + (high / 14) * 0.46);
    } else {
      score = (high * 0.65 + low * 0.35) / 14;
      if (isSuited) score += 0.07;
      if (gap === 1) score += 0.05;
      else if (gap === 2) score += 0.02;
      else if (gap >= 5) score -= 0.06;
    }
    return Math.max(0.08, Math.min(0.98, score));
  }

  // Postflop: evaluate actual made hand + draw bonus
  const allVisible = [...holeCards, ...visibleCommunity];
  const evaluated = evaluateBestPokerHand(allVisible);

  // Check how much the hole cards contribute vs board-only
  let baseStrength = 0.22;
  switch (evaluated.category) {
    case 9:
    case 8:
    case 7:
      baseStrength = 0.98;
      break;
    case 6:
      baseStrength = 0.93;
      break;
    case 5:
      baseStrength = 0.86;
      break;
    case 4:
      baseStrength = 0.8;
      break;
    case 3:
      baseStrength = 0.72;
      break;
    case 2:
      baseStrength = 0.6;
      break;
    case 1:
      baseStrength = 0.42 + ((evaluated.tiebreakers[0] ?? 8) / 14) * 0.14;
      break;
    default:
      baseStrength = 0.18 + (high / 14) * 0.16;
  }

  // Flush draw or straight draw potential on flop/turn
  if (visibleCommunity.length < 5 && evaluated.category < 4) {
    const suitCounts = new Map<string, number>();
    for (const c of allVisible) {
      suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
    }
    if (Array.from(suitCounts.values()).some((cnt) => cnt === 4)) {
      baseStrength = Math.min(0.85, baseStrength + 0.14);
    }
  }

  return Math.max(0.05, Math.min(0.99, baseStrength));
}

export function decidePokerBotAction(
  holeCards: readonly [Card, Card],
  visibleCommunity: readonly Card[],
  ctx: BotDecisionContext
): BotActionResult {
  const strength = estimateBotHandStrength(holeCards, visibleCommunity);
  const noise = (randomFloat() - 0.5) * 0.14;
  const effectiveStrength = Math.max(0, Math.min(1, strength + noise));

  const potOdds = ctx.toCall > 0 ? ctx.toCall / (ctx.pot + ctx.toCall) : 0;
  const foldThreshold = 0.18 + ctx.tightness * 0.24 + potOdds * 0.45;
  const raiseThreshold = 0.72 - ctx.aggression * 0.22;

  if (ctx.toCall === 0) {
    if (
      ctx.raisesThisStreet < 2 &&
      ctx.maxRaise >= ctx.minRaise &&
      (effectiveStrength >= raiseThreshold || randomFloat() < ctx.aggression * 0.12)
    ) {
      const sizing = roundCurrency(
        Math.min(
          ctx.maxRaise,
          Math.max(ctx.minRaise, Math.round(ctx.pot * (0.45 + ctx.aggression * 0.35)))
        )
      );
      return { action: 'raise', callPart: 0, raiseExtra: sizing };
    }
    return { action: 'check' };
  }

  // Facing a bet (toCall > 0)
  if (effectiveStrength < foldThreshold && randomFloat() > ctx.aggression * 0.14) {
    return { action: 'fold' };
  }

  if (
    ctx.raisesThisStreet < 2 &&
    ctx.maxRaise >= ctx.minRaise &&
    effectiveStrength >= raiseThreshold + 0.08
  ) {
    const extra = roundCurrency(
      Math.min(ctx.maxRaise, Math.max(ctx.minRaise, Math.round(ctx.pot * 0.5)))
    );
    return { action: 'raise', callPart: ctx.toCall, raiseExtra: extra };
  }

  return { action: 'call', amount: ctx.toCall };
}
