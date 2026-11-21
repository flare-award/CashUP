import { roundCurrency } from '../../core/currency';
import { randomInt } from '../../core/rng';

export type SicBoBetKind =
  | { type: 'small' }
  | { type: 'big' }
  | { type: 'even' }
  | { type: 'odd' }
  | { type: 'any-triple' }
  | { type: 'exact-triple'; face: number }
  | { type: 'single-number'; face: number };

export interface SicBoRollOutcome {
  dice: [number, number, number];
  sum: number;
  isTriple: boolean;
  won: boolean;
  multiplier: number;
  payout: number;
  summary: string;
}

export function evaluateSicBoRoll(
  dice: [number, number, number],
  bet: SicBoBetKind,
  wager: number
): SicBoRollOutcome {
  const [d1, d2, d3] = dice;
  const sum = d1 + d2 + d3;
  const isTriple = d1 === d2 && d2 === d3;

  let mult = 0;
  let betName = '';

  switch (bet.type) {
    case 'small':
      betName = 'Малые (4–10)';
      if (!isTriple && sum >= 4 && sum <= 10) mult = 2.0;
      break;
    case 'big':
      betName = 'Большие (11–17)';
      if (!isTriple && sum >= 11 && sum <= 17) mult = 2.0;
      break;
    case 'even':
      betName = 'Чёт (без тройни)';
      if (!isTriple && sum % 2 === 0) mult = 2.0;
      break;
    case 'odd':
      betName = 'Нечет (без тройни)';
      if (!isTriple && sum % 2 === 1) mult = 2.0;
      break;
    case 'any-triple':
      betName = 'Любая тройня';
      if (isTriple) mult = 31.0;
      break;
    case 'exact-triple':
      betName = `Точная тройня ${bet.face}-${bet.face}-${bet.face}`;
      if (isTriple && d1 === bet.face) mult = 180.0;
      break;
    case 'single-number': {
      betName = `Число ${bet.face} на костях`;
      const matches = dice.filter((v) => v === bet.face).length;
      if (matches === 1) mult = 2.0;
      else if (matches === 2) mult = 3.0;
      else if (matches === 3) mult = 12.0;
      break;
    }
  }

  const payout = roundCurrency(wager * mult);
  return {
    dice,
    sum,
    isTriple,
    won: mult > 0,
    multiplier: mult,
    payout,
    summary: `Сик Бо: [${d1}, ${d2}, ${d3}] = ${sum}${isTriple ? ' (Тройня!)' : ''} · ${betName}`,
  };
}

export function rollSicBoRound(bet: SicBoBetKind, wager: number): SicBoRollOutcome {
  const dice: [number, number, number] = [
    randomInt(1, 6),
    randomInt(1, 6),
    randomInt(1, 6),
  ];
  return evaluateSicBoRoll(dice, bet, wager);
}
