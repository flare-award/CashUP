import { z } from 'zod';
import {
  AppSettings,
  AvatarId,
  CashUpSaveData,
  GameId,
  LastUiState,
  UserProfile,
} from '../types';
import { createEmptyStats, reconcilePendingRoundsOnLoad } from './balance';
import { convertToUsd, roundCurrency } from './currency';

export const CURRENT_SAVE_VERSION = 3;

export const AVATAR_IDS: readonly AvatarId[] = [
  'emerald-diamond',
  'royal-crown',
  'crimson-spade',
  'cyber-fox',
  'golden-dice',
  'sapphire-shield',
  'violet-prism',
  'onyx-knight',
  'amber-phoenix',
  'mint-clover',
  'arctic-wolf',
  'solar-star',
] as const;

export const GAME_IDS: readonly GameId[] = [
  'roulette',
  'slots',
  'red-black',
  'dice',
  'shells',
  'upgrade',
  'poker',
  'blackjack',
  'baccarat',
  'plinko',
  'mines',
  'higher-lower',
  'risk-roulette',
  'keno',
  'crash',
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  currency: 'USD',
  soundEnabled: true,
  soundVolume: 0.35,
  animationsEnabled: true,
  animationIntensity: 'full',
  notificationsEnabled: true,
  roundNotifications: true,
  npcFeedEnabled: true,
};

export const DEFAULT_UI_STATE: LastUiState = {
  lastRoute: '/',
  catalogCategory: 'all',
  catalogSort: 'popular',
};

const nonNegativeFinite = z
  .number()
  .finite()
  .min(0, 'Значение не может быть отрицательным');

const signedFinite = z.number().finite();

const avatarSchema = z.enum([
  'emerald-diamond',
  'royal-crown',
  'crimson-spade',
  'cyber-fox',
  'golden-dice',
  'sapphire-shield',
  'violet-prism',
  'onyx-knight',
  'amber-phoenix',
  'mint-clover',
  'arctic-wolf',
  'solar-star',
]);

const gameIdSchema = z.enum([
  'roulette',
  'slots',
  'red-black',
  'dice',
  'shells',
  'upgrade',
  'poker',
  'blackjack',
  'baccarat',
  'plinko',
  'mines',
  'higher-lower',
  'risk-roulette',
  'keno',
  'crash',
]);

const currencySchema = z.enum(['RUB', 'MDL', 'USD', 'EUR', 'KZT', 'CNY']);

const ledgerEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  type: z.enum([
    'starter_bonus',
    'wager_debit',
    'wager_addon',
    'round_payout',
    'round_refund',
    'emergency_refill',
  ]),
  amount: signedFinite,
  balanceAfter: nonNegativeFinite,
  gameId: gameIdSchema.optional(),
  roundId: z.string().optional(),
  description: z.string(),
});

const historyEntrySchema = z.object({
  id: z.string().min(1),
  gameId: gameIdSchema,
  gameName: z.string().min(1),
  timestamp: z.string().min(1),
  wager: nonNegativeFinite,
  payout: nonNegativeFinite,
  netChange: signedFinite,
  balanceAfter: nonNegativeFinite,
  multiplier: z.number().finite().min(0).nullable(),
  outcome: z.enum(['win', 'loss', 'push']),
  summary: z.string(),
});

const pendingRoundSchema = z.object({
  roundId: z.string().min(1),
  gameId: gameIdSchema,
  gameName: z.string().min(1),
  wager: nonNegativeFinite,
  createdAt: z.string().min(1),
  mode: z.enum(['precomputed', 'interactive']),
  precomputed: z
    .object({
      payout: nonNegativeFinite,
      multiplier: z.number().finite().min(0).nullable(),
      outcome: z.enum(['win', 'loss', 'push']),
      summary: z.string(),
    })
    .optional(),
  interactiveState: z.unknown().optional(),
});

const perGameStatsSchema = z.object({
  rounds: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  pushes: z.number().int().min(0).default(0),
  wagered: nonNegativeFinite,
  won: nonNegativeFinite,
  biggestWin: nonNegativeFinite.default(0),
  lastPlayedAt: z.string(),
});

const profileStatsSchema = z.object({
  totalRounds: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  pushes: z.number().int().min(0).default(0),
  totalWagered: nonNegativeFinite,
  totalWon: nonNegativeFinite,
  biggestWin: nonNegativeFinite,
  currentWinStreak: z.number().int().min(0),
  longestWinStreak: z.number().int().min(0),
  currentLossStreak: z.number().int().min(0),
  longestLossStreak: z.number().int().min(0),
  perGame: z.record(z.string(), perGameStatsSchema).default({}),
});

const userProfileSchemaV2 = z.object({
  id: z.string().min(1),
  nickname: z.string().trim().min(1, 'Никнейм не может быть пустым').max(40),
  avatarId: avatarSchema,
  createdAt: z.string().min(1),
  balance: nonNegativeFinite,
  starterBonusClaimed: z.boolean(),
  favoriteGames: z.array(gameIdSchema).default([]),
  recentGames: z.array(gameIdSchema).default([]),
  stats: profileStatsSchema,
  history: z.array(historyEntrySchema).default([]),
  ledger: z.array(ledgerEntrySchema).default([]),
  pendingRounds: z.record(z.string(), pendingRoundSchema).default({}),
  settledRoundIds: z.array(z.string()).default([]),
});

const settingsSchema = z.object({
  theme: z.enum(['dark', 'light']),
  currency: currencySchema,
  soundEnabled: z.boolean(),
  soundVolume: z.number().finite().min(0).max(1),
  animationsEnabled: z.boolean(),
  animationIntensity: z.enum(['full', 'balanced', 'minimal']),
  notificationsEnabled: z.boolean(),
  roundNotifications: z.boolean().default(true),
  npcFeedEnabled: z.boolean().default(true),
});

const npcActivitySchema = z.object({
  id: z.string().min(1),
  npcId: z.string().min(1),
  nickname: z.string().min(1),
  avatarId: avatarSchema,
  styleLabel: z.string(),
  gameId: gameIdSchema,
  gameName: z.string(),
  actionType: z.enum(['win', 'multiplier', 'played']),
  amount: nonNegativeFinite.optional(),
  multiplier: nonNegativeFinite.optional(),
  timestamp: z.string().min(1),
});

const uiStateSchema = z.object({
  lastRoute: z.string().default('/'),
  catalogCategory: z.string().default('all'),
  catalogSort: z.string().default('popular'),
});

const saveFileSchemaV3 = z.object({
  app: z.literal('CashUP'),
  saveVersion: z.literal(3),
  exportedAt: z.string().min(1),
  activeProfileId: z.string().nullable(),
  profiles: z.array(userProfileSchemaV2),
  settings: settingsSchema,
  npcHistory: z.array(npcActivitySchema).default([]),
  uiState: uiStateSchema.default(DEFAULT_UI_STATE),
});

const saveFileSchemaV2 = z.object({
  app: z.literal('CashUP'),
  saveVersion: z.literal(2),
  exportedAt: z.string().min(1),
  activeProfileId: z.string().nullable(),
  profiles: z.array(userProfileSchemaV2),
  settings: settingsSchema,
  npcHistory: z.array(npcActivitySchema).default([]),
  uiState: uiStateSchema.default(DEFAULT_UI_STATE),
});

/**
 * Legacy v1 schema support for automatic forward migration to v2.
 */
const saveFileSchemaV1 = z.object({
  app: z.literal('CashUP').default('CashUP'),
  saveVersion: z.literal(1),
  exportedAt: z.string().optional(),
  createdAt: z.string().optional(),
  activeProfileId: z.string().nullable().optional(),
  profiles: z.array(
    z.object({
      id: z.string().min(1),
      nickname: z.string().trim().min(1).max(40),
      avatarId: avatarSchema.catch('emerald-diamond'),
      createdAt: z.string().default(() => new Date().toISOString()),
      balance: nonNegativeFinite,
      starterBonusClaimed: z.boolean().default(true),
      favoriteGames: z.array(gameIdSchema).default([]),
      recentGames: z.array(gameIdSchema).default([]),
      stats: profileStatsSchema.optional(),
      history: z.array(historyEntrySchema).default([]),
      ledger: z.array(ledgerEntrySchema).default([]),
    })
  ),
  settings: settingsSchema.partial().optional(),
});

export interface SavePreviewInfo {
  saveVersion: number;
  migratedFromVersion: number | null;
  exportedAt: string;
  profileCount: number;
  activeNickname: string | null;
  totalRounds: number;
  profilesSummary: Array<{
    id: string;
    nickname: string;
    balance: number;
    rounds: number;
  }>;
}

export type SaveValidationResult =
  | {
      ok: true;
      data: CashUpSaveData;
      preview: SavePreviewInfo;
    }
  | {
      ok: false;
      error: string;
    };

function sanitizeProfiles(profiles: UserProfile[]): UserProfile[] {
  const seenIds = new Set<string>();
  for (const p of profiles) {
    if (seenIds.has(p.id)) {
      throw new Error(`Дублирующийся ID профиля в сохранении: ${p.id}`);
    }
    seenIds.add(p.id);
  }

  return profiles.map((raw) => {
    const cleanBalance = roundCurrency(raw.balance);
    const reconciled = reconcilePendingRoundsOnLoad({
      ...raw,
      balance: cleanBalance,
    });
    return reconciled.profile;
  });
}

function migrateLegacyRubProfileToUsd(raw: UserProfile): UserProfile {
  const scale = (n: number) => convertToUsd(n, 'RUB');
  const perGame: UserProfile['stats']['perGame'] = {};
  for (const [gid, gStats] of Object.entries(raw.stats.perGame)) {
    if (gStats) {
      perGame[gid as GameId] = {
        ...gStats,
        wagered: scale(gStats.wagered),
        won: scale(gStats.won),
        biggestWin: scale(gStats.biggestWin),
      };
    }
  }
  return {
    ...raw,
    balance: scale(raw.balance),
    stats: {
      ...raw.stats,
      totalWagered: scale(raw.stats.totalWagered),
      totalWon: scale(raw.stats.totalWon),
      biggestWin: scale(raw.stats.biggestWin),
      perGame,
    },
    history: raw.history.map((h) => ({
      ...h,
      wager: scale(h.wager),
      payout: scale(h.payout),
      netChange: scale(h.netChange),
      balanceAfter: scale(h.balanceAfter),
    })),
    ledger: raw.ledger.map((l) => ({
      ...l,
      amount: scale(l.amount),
      balanceAfter: scale(l.balanceAfter),
    })),
    pendingRounds: {},
  };
}

/**
 * Parses, validates, and (if v1/v2) migrates raw JSON string into a verified CashUpSaveData object.
 */
export function parseAndValidateSaveJson(rawText: string): SaveValidationResult {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return { ok: false, error: 'Файл сохранения пуст.' };
  }

  let rawObj: unknown;
  try {
    rawObj = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: 'Файл повреждён или не является корректным JSON-документом.',
    };
  }

  if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
    return {
      ok: false,
      error: 'Неверная корневая структура файла сохранения CashUP.',
    };
  }

  const record = rawObj as Record<string, unknown>;
  if (record.app !== 'CashUP') {
    return {
      ok: false,
      error: 'Этот JSON-файл не принадлежит приложению CashUP.',
    };
  }

  const version = record.saveVersion;
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return {
      ok: false,
      error: 'В файле сохранения отсутствует корректный номер версии формата.',
    };
  }

  let migratedFromVersion: number | null = null;
  let candidateV3: unknown = rawObj;

  if (version === 1) {
    const parsedV1 = saveFileSchemaV1.safeParse(rawObj);
    if (!parsedV1.success) {
      const firstIssue = parsedV1.error.issues[0];
      return {
        ok: false,
        error: `Ошибка структуры сохранения v1 (${firstIssue?.path.join('.') || 'корень'}): ${
          firstIssue?.message ?? 'некорректные данные'
        }`,
      };
    }
    const v1 = parsedV1.data;
    migratedFromVersion = 1;
    candidateV3 = {
      app: 'CashUP',
      saveVersion: CURRENT_SAVE_VERSION,
      exportedAt: v1.exportedAt ?? v1.createdAt ?? new Date().toISOString(),
      activeProfileId: v1.activeProfileId ?? v1.profiles[0]?.id ?? null,
      profiles: v1.profiles.map((p) =>
        migrateLegacyRubProfileToUsd({
          ...p,
          stats: p.stats ?? createEmptyStats(),
          pendingRounds: {},
          settledRoundIds: [],
        })
      ),
      settings: {
        ...DEFAULT_SETTINGS,
        ...(v1.settings ?? {}),
      },
      npcHistory: [],
      uiState: DEFAULT_UI_STATE,
    };
  } else if (version === 2) {
    const parsedLegacyV2 = saveFileSchemaV2.safeParse(rawObj);
    if (!parsedLegacyV2.success) {
      const firstIssue = parsedLegacyV2.error.issues[0];
      return {
        ok: false,
        error: `Ошибка структуры сохранения v2 (${firstIssue?.path.join('.') || 'корень'}): ${
          firstIssue?.message ?? 'некорректные данные'
        }`,
      };
    }
    const v2 = parsedLegacyV2.data;
    migratedFromVersion = 2;
    candidateV3 = {
      ...v2,
      saveVersion: CURRENT_SAVE_VERSION,
      profiles: v2.profiles.map((p) => migrateLegacyRubProfileToUsd(p)),
      npcHistory: [],
    };
  } else if (version !== CURRENT_SAVE_VERSION) {
    return {
      ok: false,
      error: `Неподдерживаемая версия сохранения (v${version}). Поддерживаются версии v1–v${CURRENT_SAVE_VERSION}.`,
    };
  }

  const parsedV3 = saveFileSchemaV3.safeParse(candidateV3);
  if (!parsedV3.success) {
    const firstIssue = parsedV3.error.issues[0];
    const pathLabel = firstIssue?.path.length ? firstIssue.path.join('.') : 'корень';
    return {
      ok: false,
      error: `Ошибка проверки данных (${pathLabel}): ${firstIssue?.message ?? 'неверный формат'}`,
    };
  }

  try {
    const sanitizedProfiles = sanitizeProfiles(parsedV3.data.profiles);
    const validActiveId =
      parsedV3.data.activeProfileId &&
      sanitizedProfiles.some((p) => p.id === parsedV3.data.activeProfileId)
        ? parsedV3.data.activeProfileId
        : (sanitizedProfiles[0]?.id ?? null);

    const finalData: CashUpSaveData = {
      ...parsedV3.data,
      activeProfileId: validActiveId,
      profiles: sanitizedProfiles,
    };

    const activeProfile = sanitizedProfiles.find((p) => p.id === validActiveId) ?? null;
    const totalRounds = sanitizedProfiles.reduce((acc, p) => acc + p.stats.totalRounds, 0);

    return {
      ok: true,
      data: finalData,
      preview: {
        saveVersion: finalData.saveVersion,
        migratedFromVersion,
        exportedAt: finalData.exportedAt,
        profileCount: sanitizedProfiles.length,
        activeNickname: activeProfile?.nickname ?? null,
        totalRounds,
        profilesSummary: sanitizedProfiles.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          balance: p.balance,
          rounds: p.stats.totalRounds,
        })),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Ошибка проверки целостности профилей.',
    };
  }
}

export function createInitialSaveData(): CashUpSaveData {
  return {
    app: 'CashUP',
    saveVersion: CURRENT_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    activeProfileId: null,
    profiles: [],
    settings: { ...DEFAULT_SETTINGS },
    npcHistory: [],
    uiState: { ...DEFAULT_UI_STATE },
  };
}

export function serializeSaveData(state: CashUpSaveData, now: Date = new Date()): string {
  const payload: CashUpSaveData = {
    ...state,
    app: 'CashUP',
    saveVersion: CURRENT_SAVE_VERSION,
    exportedAt: now.toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export function buildSaveFilename(now: Date = new Date(), prefix = 'CashUP_Save'): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${prefix}_${yyyy}-${mm}-${dd}.json`;
}

export function downloadSaveFile(
  state: CashUpSaveData,
  options?: { prefix?: string; now?: Date }
): string {
  const now = options?.now ?? new Date();
  const json = serializeSaveData(state, now);
  const filename = buildSaveFilename(now, options?.prefix ?? 'CashUP_Save');

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}
