import { CurrencyCode, GameId, NpcActivityItem, NpcProfile } from '../types';
import { formatCurrency } from './currency';
import { generateId, randomFloat, randomInt } from './rng';

export const NPC_ROSTER: readonly NpcProfile[] = [
  {
    id: 'npc-luckyfox',
    nickname: 'LuckyFox',
    avatarId: 'cyber-fox',
    styleLabel: 'Тактик',
    favoriteGames: ['blackjack', 'roulette', 'poker'],
    aggression: 0.58,
    tightness: 0.62,
  },
  {
    id: 'npc-mira',
    nickname: 'Mira',
    avatarId: 'violet-prism',
    styleLabel: 'Сбалансированный стиль',
    favoriteGames: ['roulette', 'baccarat', 'slots'],
    aggression: 0.45,
    tightness: 0.55,
  },
  {
    id: 'npc-nightowl',
    nickname: 'NightOwl',
    avatarId: 'sapphire-shield',
    styleLabel: 'Охотник за множителями',
    favoriteGames: ['upgrade', 'mines', 'plinko', 'crash'],
    aggression: 0.76,
    tightness: 0.38,
  },
  {
    id: 'npc-viktorshark',
    nickname: 'ViktorShark',
    avatarId: 'onyx-knight',
    styleLabel: 'Тайтово-агрессивный',
    favoriteGames: ['poker', 'blackjack', 'higher-lower'],
    aggression: 0.72,
    tightness: 0.74,
  },
  {
    id: 'npc-astranova',
    nickname: 'AstraNova',
    avatarId: 'solar-star',
    styleLabel: 'Динамичный риск',
    favoriteGames: ['plinko', 'risk-roulette', 'slots'],
    aggression: 0.68,
    tightness: 0.44,
  },
  {
    id: 'npc-kiravega',
    nickname: 'KiraVega',
    avatarId: 'emerald-diamond',
    styleLabel: 'Серийная стратегия',
    favoriteGames: ['mines', 'shells', 'dice'],
    aggression: 0.52,
    tightness: 0.6,
  },
  {
    id: 'npc-artyomblaze',
    nickname: 'ArtyomBlaze',
    avatarId: 'amber-phoenix',
    styleLabel: 'Лузово-активный',
    favoriteGames: ['poker', 'slots', 'red-black'],
    aggression: 0.82,
    tightness: 0.31,
  },
  {
    id: 'npc-silverrook',
    nickname: 'SilverRook',
    avatarId: 'royal-crown',
    styleLabel: 'Математический расчёт',
    favoriteGames: ['baccarat', 'keno', 'dice'],
    aggression: 0.4,
    tightness: 0.78,
  },
];

const GAME_TITLES_MAP: Record<GameId, string> = {
  roulette: 'Европейскую рулетку',
  slots: 'Однорукого бандита',
  'red-black': 'Красное или чёрное',
  dice: 'Кости',
  shells: 'Напёрстки',
  upgrade: 'Апгрейд',
  poker: 'Техасский Холдем',
  blackjack: 'Блэкджек',
  baccarat: 'Баккара',
  plinko: 'Plinko',
  mines: 'Мины',
  'higher-lower': 'Higher or Lower',
  'risk-roulette': 'Риск-рулетку',
  keno: 'Кено',
  crash: 'Crash: Орбита',
};

const GAME_SHORT_MAP: Record<GameId, string> = {
  roulette: 'Рулетке',
  slots: 'Слотах',
  'red-black': 'Красном или чёрном',
  dice: 'Костях',
  shells: 'Напёрстках',
  upgrade: 'Upgrade',
  poker: 'Покере',
  blackjack: 'Blackjack',
  baccarat: 'Baccarat',
  plinko: 'Plinko',
  mines: 'Минах',
  'higher-lower': 'Higher or Lower',
  'risk-roulette': 'Риск-рулетке',
  keno: 'Кено',
  crash: 'Crash',
};

export function generateNpcActivity(now: Date = new Date()): NpcActivityItem {
  const npc = NPC_ROSTER[randomInt(0, NPC_ROSTER.length - 1)]!;
  const gameId = npc.favoriteGames[randomInt(0, npc.favoriteGames.length - 1)]!;
  const roll = randomFloat();

  if (roll < 0.42) {
    const baseAmounts = [150, 240, 380, 500, 750, 1200, 1850, 2500, 3400];
    const amount = baseAmounts[randomInt(0, baseAmounts.length - 1)]!;
    return {
      id: generateId('npc'),
      npcId: npc.id,
      nickname: npc.nickname,
      avatarId: npc.avatarId,
      styleLabel: npc.styleLabel,
      gameId,
      gameName: GAME_SHORT_MAP[gameId],
      actionType: 'win',
      amount,
      timestamp: now.toISOString(),
    };
  }

  if (roll < 0.76) {
    const mults = [1.8, 2.0, 2.5, 3.2, 4.5, 6.0, 8.5, 12.0];
    const multiplier = mults[randomInt(0, mults.length - 1)]!;
    return {
      id: generateId('npc'),
      npcId: npc.id,
      nickname: npc.nickname,
      avatarId: npc.avatarId,
      styleLabel: npc.styleLabel,
      gameId,
      gameName: GAME_SHORT_MAP[gameId],
      actionType: 'multiplier',
      multiplier,
      timestamp: now.toISOString(),
    };
  }

  return {
    id: generateId('npc'),
    npcId: npc.id,
    nickname: npc.nickname,
    avatarId: npc.avatarId,
    styleLabel: npc.styleLabel,
    gameId,
    gameName: GAME_TITLES_MAP[gameId],
    actionType: 'played',
    timestamp: now.toISOString(),
  };
}

export function generateInitialNpcFeed(count = 7): NpcActivityItem[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, idx) =>
    generateNpcActivity(new Date(now - idx * 42_000))
  );
}

export function formatNpcEventText(item: NpcActivityItem, currency: CurrencyCode): string {
  if (item.actionType === 'win' && item.amount !== undefined) {
    return `выиграл виртуальные ${formatCurrency(item.amount, currency)} в ${item.gameName}`;
  }
  if (item.actionType === 'multiplier' && item.multiplier !== undefined) {
    return `получил множитель x${item.multiplier} в ${item.gameName}`;
  }
  return `сыграл раунд в ${item.gameName}`;
}
