import { CurrencyCode, GameId, NpcActivityItem, NpcProfile } from '../types';
import { formatCurrency, roundCurrency } from './currency';
import { generateId, randomInt } from './rng';

export const NPC_ROSTER: readonly NpcProfile[] = [
  {
    id: 'npc-luckyfox',
    nickname: 'LuckyFox',
    avatarId: 'cyber-fox',
    styleLabel: 'Тактик',
    favoriteGames: ['blackjack', 'roulette', 'poker', 'durak', 'video-poker'],
    aggression: 0.58,
    tightness: 0.62,
  },
  {
    id: 'npc-mira',
    nickname: 'Mira',
    avatarId: 'violet-prism',
    styleLabel: 'Сбалансированный стиль',
    favoriteGames: ['roulette', 'baccarat', 'slots', 'wheel-of-fortune', 'scratch-cards'],
    aggression: 0.45,
    tightness: 0.55,
  },
  {
    id: 'npc-nightowl',
    nickname: 'NightOwl',
    avatarId: 'sapphire-shield',
    styleLabel: 'Охотник за множителями',
    favoriteGames: ['upgrade', 'mines', 'plinko', 'crash', 'towers', 'russian-roulette'],
    aggression: 0.76,
    tightness: 0.38,
  },
  {
    id: 'npc-viktorshark',
    nickname: 'ViktorShark',
    avatarId: 'onyx-knight',
    styleLabel: 'Тайтово-агрессивный',
    favoriteGames: ['poker', 'blackjack', 'higher-lower', 'russian-roulette', 'durak'],
    aggression: 0.72,
    tightness: 0.74,
  },
  {
    id: 'npc-astranova',
    nickname: 'AstraNova',
    avatarId: 'solar-star',
    styleLabel: 'Динамичный риск',
    favoriteGames: ['plinko', 'risk-roulette', 'slots', 'coin-flip', 'wheel-of-fortune'],
    aggression: 0.68,
    tightness: 0.44,
  },
  {
    id: 'npc-kiravega',
    nickname: 'KiraVega',
    avatarId: 'emerald-diamond',
    styleLabel: 'Серийная стратегия',
    favoriteGames: ['mines', 'shells', 'dice', 'towers', 'coin-flip'],
    aggression: 0.52,
    tightness: 0.6,
  },
  {
    id: 'npc-artyomblaze',
    nickname: 'ArtyomBlaze',
    avatarId: 'amber-phoenix',
    styleLabel: 'Лузово-активный',
    favoriteGames: ['poker', 'slots', 'red-black', 'russian-roulette', 'sic-bo', 'durak'],
    aggression: 0.82,
    tightness: 0.31,
  },
  {
    id: 'npc-silverrook',
    nickname: 'SilverRook',
    avatarId: 'royal-crown',
    styleLabel: 'Математический расчёт',
    favoriteGames: ['baccarat', 'keno', 'dice', 'sic-bo', 'video-poker'],
    aggression: 0.4,
    tightness: 0.78,
  },
  {
    id: 'npc-volkov',
    nickname: 'Volkov',
    avatarId: 'arctic-wolf',
    styleLabel: 'Хладнокровный дуэлянт',
    favoriteGames: ['russian-roulette', 'durak', 'poker', 'blackjack'],
    aggression: 0.66,
    tightness: 0.68,
  },
  {
    id: 'npc-cloverqueen',
    nickname: 'CloverQueen',
    avatarId: 'mint-clover',
    styleLabel: 'Ловец джекпотов',
    favoriteGames: ['scratch-cards', 'wheel-of-fortune', 'slots', 'keno'],
    aggression: 0.61,
    tightness: 0.49,
  },
];

export const GAME_NOMINATIVE_MAP: Record<GameId, string> = {
  roulette: 'Рулетка',
  slots: 'Слоты',
  'red-black': 'Красное / Чёрное',
  dice: 'Кости',
  shells: 'Напёрстки',
  upgrade: 'Апгрейд',
  poker: 'Холдем',
  blackjack: 'Блэкджек',
  baccarat: 'Баккара',
  plinko: 'Plinko',
  mines: 'Мины',
  'higher-lower': 'Higher / Lower',
  'risk-roulette': 'Риск-рулетка',
  keno: 'Кено',
  crash: 'Crash',
  'russian-roulette': 'Русская рулетка',
  durak: 'Дурак',
  towers: 'Башня',
  'coin-flip': 'Орёл или Решка',
  'wheel-of-fortune': 'Колесо Фортуны',
  'sic-bo': 'Сик Бо',
  'video-poker': 'Видеопокер',
  'scratch-cards': 'Золотой Скретч',
};

const GAME_SHORT_MAP: Record<GameId, string> = {
  roulette: 'Рулетке',
  slots: 'Слотах',
  'red-black': 'Красном или чёрном',
  dice: 'Костях',
  shells: 'Напёрстках',
  upgrade: 'Апгрейде',
  poker: 'Покере',
  blackjack: 'Блэкджеке',
  baccarat: 'Баккаре',
  plinko: 'Plinko',
  mines: 'Минах',
  'higher-lower': 'Higher or Lower',
  'risk-roulette': 'Риск-рулетке',
  keno: 'Кено',
  crash: 'Crash',
  'russian-roulette': 'Русской рулетке',
  durak: 'Дураке',
  towers: 'Башне',
  'coin-flip': 'Орле или Решке',
  'wheel-of-fortune': 'Колесе Фортуны',
  'sic-bo': 'Сик Бо',
  'video-poker': 'Видеопокере',
  'scratch-cards': 'Золотом Скретче',
};

export function generateNpcActivity(now: Date = new Date()): NpcActivityItem {
  const npc = NPC_ROSTER[randomInt(0, NPC_ROSTER.length - 1)]!;
  const gameId = npc.favoriteGames[randomInt(0, npc.favoriteGames.length - 1)]!;

  const baseWagers = [0.4, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0];
  const multOptions = [1.95, 2.0, 2.5, 2.85, 3.5, 4.2, 5.0, 7.5, 10.0, 15.0, 25.0];
  const wager = baseWagers[randomInt(0, baseWagers.length - 1)]!;
  const multiplier = multOptions[randomInt(0, multOptions.length - 1)]!;
  const amount = roundCurrency(wager * multiplier);

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
    multiplier,
    timestamp: now.toISOString(),
  };
}

export function generateInitialNpcFeed(count = 10): NpcActivityItem[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, idx) =>
    generateNpcActivity(new Date(now - idx * 35_000))
  );
}

export function formatNpcEventText(item: NpcActivityItem, currency: CurrencyCode): string {
  if (item.actionType === 'win' && item.amount !== undefined) {
    const multSuffix = item.multiplier ? ` (x${item.multiplier})` : '';
    return `выиграл ${formatCurrency(item.amount, currency)}${multSuffix} в ${item.gameName}`;
  }
  if (item.actionType === 'multiplier' && item.multiplier !== undefined) {
    return `поймал множитель x${item.multiplier} в ${item.gameName}`;
  }
  return `сыграл раунд в ${item.gameName}`;
}
