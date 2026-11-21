import { NPC_ROSTER } from '../../core/npc';
import { randomFloat, randomInt } from '../../core/rng';
import { AvatarId } from '../../types';

export type RussianRouletteMode = 'duel' | 'alternating' | 'circle5';

export interface RRModeConfig {
  id: RussianRouletteMode;
  title: string;
  subtitle: string;
  seatCount: number;
  winMultiplier: number;
}

export const RR_MODES: Record<RussianRouletteMode, RRModeConfig> = {
  duel: {
    id: 'duel',
    title: 'Классическая дуэль',
    subtitle: '1 на 1 с ботом · выбор «В себя» или «В соперника»',
    seatCount: 2,
    winMultiplier: 2.0,
  },
  alternating: {
    id: 'alternating',
    title: 'Поочерёдная',
    subtitle: '1 на 1 · строго по очереди только в себя без выбора цели',
    seatCount: 2,
    winMultiplier: 2.0,
  },
  circle5: {
    id: 'circle5',
    title: 'Круговой стол',
    subtitle: '5 игроков за столом · холостой в себя оставляет пистолет ещё на раз',
    seatCount: 5,
    winMultiplier: 5.0,
  },
};

export interface RRSeat {
  seatIndex: number;
  isHuman: boolean;
  nickname: string;
  avatarId: AvatarId;
  alive: boolean;
}

export interface RRGameState {
  mode: RussianRouletteMode;
  wager: number;
  phase: 'need_spin' | 'turn' | 'finished';
  seats: RRSeat[];
  currentTurnSeat: number;
  chamberIndex: number; // 0..5 (how many pulls already used in current cylinder)
  bulletChamber: number; // 0..5 secret chamber index generated via Web Crypto API
  extraTurnGrantedCount: number; // tracks self-shot streak in current turn
  revolverAngleDeg: number;
  lastShotSummary: string;
  log: string[];
  winnerSeat: number | null;
}

const BOT_POOL = [
  NPC_ROSTER.find((n) => n.id === 'npc-volkov') ?? NPC_ROSTER[0]!,
  NPC_ROSTER.find((n) => n.id === 'npc-viktorshark') ?? NPC_ROSTER[1]!,
  NPC_ROSTER.find((n) => n.id === 'npc-nightowl') ?? NPC_ROSTER[2]!,
  NPC_ROSTER.find((n) => n.id === 'npc-artyomblaze') ?? NPC_ROSTER[3]!,
];

/**
 * Angle in degrees from table center (where 0 deg = right, 90 deg = bottom/player, -90/270 = top)
 * so the revolver barrel points directly at a given seat!
 */
export function getSeatAngleDeg(seatIndex: number, seatCount: number): number {
  if (seatCount === 2) {
    // Seat 0 = Human (bottom = 90°), Seat 1 = Bot (top = 270°)
    return seatIndex === 0 ? 90 : 270;
  }
  // 5 seats arranged clockwise starting from bottom (90°): 90, 162, 234, 306, 18
  return (90 + seatIndex * (360 / seatCount)) % 360;
}

export function createRussianRouletteMatch(
  mode: RussianRouletteMode,
  wager: number,
  humanNickname: string,
  humanAvatar: AvatarId
): RRGameState {
  const cfg = RR_MODES[mode];
  const seats: RRSeat[] = [
    {
      seatIndex: 0,
      isHuman: true,
      nickname: humanNickname,
      avatarId: humanAvatar,
      alive: true,
    },
  ];

  for (let i = 1; i < cfg.seatCount; i += 1) {
    const bot = BOT_POOL[(i - 1) % BOT_POOL.length]!;
    seats.push({
      seatIndex: i,
      isHuman: false,
      nickname: bot.nickname,
      avatarId: bot.avatarId,
      alive: true,
    });
  }

  return {
    mode,
    wager,
    phase: 'need_spin',
    seats,
    currentTurnSeat: 0,
    chamberIndex: 0,
    bulletChamber: randomInt(0, 5),
    extraTurnGrantedCount: 0,
    revolverAngleDeg: 0,
    lastShotSummary: 'Раскрутите револьвер в центре стола, чтобы определить первого стрелка.',
    log: [`Банк сформирован (${cfg.seatCount} уч.). Ожидание раскрутки револьвера.`],
    winnerSeat: null,
  };
}

export function spinRevolverForFirstTurn(state: RRGameState): {
  nextState: RRGameState;
  chosenSeat: number;
  targetAngleDeg: number;
} {
  const aliveSeats = state.seats.filter((s) => s.alive);
  const picked = aliveSeats[randomInt(0, aliveSeats.length - 1)]!;
  const bulletChamber = randomInt(0, 5);
  const seatAngle = getSeatAngleDeg(picked.seatIndex, state.seats.length);
  const baseSpins = (Math.floor(state.revolverAngleDeg / 360) + 5) * 360;
  const targetAngleDeg = baseSpins + seatAngle;

  const msg = `Револьвер указал на ${
    picked.isHuman ? `${picked.nickname} (Вы)` : picked.nickname
  } — первый ход!`;

  return {
    chosenSeat: picked.seatIndex,
    targetAngleDeg,
    nextState: {
      ...state,
      phase: 'turn',
      currentTurnSeat: picked.seatIndex,
      chamberIndex: 0,
      bulletChamber,
      extraTurnGrantedCount: 0,
      revolverAngleDeg: targetAngleDeg,
      lastShotSummary: msg,
      log: [msg, ...state.log].slice(0, 12),
    },
  };
}

export function getNextAliveSeat(seats: RRSeat[], afterSeat: number): number {
  const n = seats.length;
  for (let step = 1; step <= n; step += 1) {
    const idx = (afterSeat + step) % n;
    if (seats[idx]?.alive) return idx;
  }
  return afterSeat;
}

/**
 * Fair Bot AI: ONLY sees public chamberIndex (0..5), mode, and alive seats — NEVER bulletChamber!
 */
export function chooseRussianRouletteBotTarget(state: RRGameState): number {
  const shooter = state.currentTurnSeat;
  if (state.mode === 'alternating') {
    return shooter;
  }

  const remainingChambers = Math.max(1, 6 - state.chamberIndex);
  const liveRisk = 1 / remainingChambers;

  // Never shoot self if 1 chamber left or high risk (>= 50%)
  if (remainingChambers > 2 && liveRisk <= 0.26) {
    // 58% chance to test luck on self when 4-6 chambers remain to keep the gun
    if (randomFloat() < 0.58) {
      return shooter;
    }
  }

  const opponents = state.seats.filter((s) => s.alive && s.seatIndex !== shooter);
  if (opponents.length === 0) return shooter;
  return opponents[randomInt(0, opponents.length - 1)]!.seatIndex;
}

export interface RRShotStepResult {
  nextState: RRGameState;
  firedLive: boolean;
  eliminatedSeat: number | null;
  targetAngleDeg: number;
}

export function resolveRevolverTriggerPull(
  state: RRGameState,
  targetSeat: number
): RRShotStepResult {
  const shooter = state.seats[state.currentTurnSeat]!;
  // Enforce mode constraint: alternating only allows shooting self
  const effectiveTargetSeat =
    state.mode === 'alternating' ? shooter.seatIndex : targetSeat;
  const target = state.seats[effectiveTargetSeat]!;

  const seatAngle = getSeatAngleDeg(effectiveTargetSeat, state.seats.length);
  const currentBase = Math.floor(state.revolverAngleDeg / 360) * 360;
  let targetAngleDeg = currentBase + seatAngle;
  if (targetAngleDeg < state.revolverAngleDeg - 180) {
    targetAngleDeg += 360;
  }

  const firedLive = state.chamberIndex === state.bulletChamber;
  const shooterLabel = shooter.isHuman ? `${shooter.nickname} (Вы)` : shooter.nickname;
  const targetLabel =
    effectiveTargetSeat === shooter.seatIndex
      ? 'в себя'
      : target.isHuman
        ? `в ${target.nickname} (Вас)`
        : `в ${target.nickname}`;

  if (!firedLive) {
    // Blank click!
    const nextChamber = state.chamberIndex + 1;
    const keepsTurn =
      effectiveTargetSeat === shooter.seatIndex &&
      (state.mode === 'duel' || state.mode === 'circle5');

    const nextTurn = keepsTurn
      ? shooter.seatIndex
      : getNextAliveSeat(state.seats, shooter.seatIndex);

    const summary = keepsTurn
      ? `${shooterLabel} стреляет ${targetLabel} — холостой щелчок! Револьвер остаётся ещё на ход.`
      : `${shooterLabel} стреляет ${targetLabel} — холостой щелчок. Ход переходит дальше.`;

    return {
      firedLive: false,
      eliminatedSeat: null,
      targetAngleDeg,
      nextState: {
        ...state,
        chamberIndex: nextChamber,
        currentTurnSeat: nextTurn,
        extraTurnGrantedCount: keepsTurn ? state.extraTurnGrantedCount + 1 : 0,
        revolverAngleDeg: targetAngleDeg,
        lastShotSummary: summary,
        log: [summary, ...state.log].slice(0, 12),
      },
    };
  }

  // Live cartridge fired!
  const updatedSeats = state.seats.map((s) =>
    s.seatIndex === effectiveTargetSeat ? { ...s, alive: false } : s
  );
  const aliveRemaining = updatedSeats.filter((s) => s.alive);

  // If Human died, match finishes immediately as loss for human!
  const humanSeat = updatedSeats[0]!;
  if (!humanSeat.alive) {
    const survivingWinner = aliveRemaining[0] ?? shooter;
    const summary = `${shooterLabel} стреляет ${targetLabel} — ВЫСТРЕЛ! Вы выбыли из игры.`;
    return {
      firedLive: true,
      eliminatedSeat: effectiveTargetSeat,
      targetAngleDeg,
      nextState: {
        ...state,
        phase: 'finished',
        seats: updatedSeats,
        revolverAngleDeg: targetAngleDeg,
        winnerSeat: survivingWinner.seatIndex,
        lastShotSummary: summary,
        log: [summary, ...state.log].slice(0, 12),
      },
    };
  }

  // If only 1 survivor left -> Winner!
  if (aliveRemaining.length === 1) {
    const winner = aliveRemaining[0]!;
    const summary = `${shooterLabel} стреляет ${targetLabel} — ВЫСТРЕЛ! Вы победили и забрали весь банк!`;
    return {
      firedLive: true,
      eliminatedSeat: effectiveTargetSeat,
      targetAngleDeg,
      nextState: {
        ...state,
        phase: 'finished',
        seats: updatedSeats,
        revolverAngleDeg: targetAngleDeg,
        winnerSeat: winner.seatIndex,
        lastShotSummary: summary,
        log: [summary, ...state.log].slice(0, 12),
      },
    };
  }

  // Circle of 5: a bot was eliminated, 2+ players remain -> reload 1 fresh round into 6 chambers!
  const nextTurn = getNextAliveSeat(updatedSeats, shooter.seatIndex);
  const nextActor = updatedSeats[nextTurn]!;
  const summary = `${shooterLabel} стреляет ${targetLabel} — ВЫСТРЕЛ! ${target.nickname} выбывает. Барабан перезаряжен (осталось ${aliveRemaining.length}), ход у ${
    nextActor.isHuman ? 'Вас' : nextActor.nickname
  }.`;

  return {
    firedLive: true,
    eliminatedSeat: effectiveTargetSeat,
    targetAngleDeg,
    nextState: {
      ...state,
      seats: updatedSeats,
      currentTurnSeat: nextTurn,
      chamberIndex: 0,
      bulletChamber: randomInt(0, 5),
      extraTurnGrantedCount: 0,
      revolverAngleDeg: targetAngleDeg,
      lastShotSummary: summary,
      log: [summary, ...state.log].slice(0, 12),
    },
  };
}
