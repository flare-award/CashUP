import { GameId } from '../types';

export type PopularityTier = 'top3' | 'top5' | 'rising' | 'regular';

export interface GamePopularityStats {
  gameId: GameId;
  rank: number; // 1..N (1 = most popular today)
  yesterdayRank: number;
  rankDelta: number; // positive = moved up since yesterday, negative = moved down
  popularityPercent: number; // 42..99
  onlinePlayers: number;
  roundsToday: number;
  tier: PopularityTier;
}

export interface ClubDailyReport {
  dateKey: string;
  totalOnline: number;
  totalRoundsToday: number;
  rankings: GamePopularityStats[];
  byGameId: Record<GameId, GamePopularityStats>;
}

interface GameAnchorConfig {
  gameId: GameId;
  base: number; // intrinsic long-term popularity anchor
  waveAmp: number; // how strongly daily trends swing this game
}

/**
 * Anchors ensure core flagship games naturally stay competitive near the top
 * while multi-day smooth waves gradually shift positions day after day.
 */
const GAME_ANCHORS: readonly GameAnchorConfig[] = [
  { gameId: 'poker', base: 89.5, waveAmp: 9.5 },
  { gameId: 'russian-roulette', base: 87.5, waveAmp: 10.5 },
  { gameId: 'roulette', base: 85.0, waveAmp: 9.0 },
  { gameId: 'durak', base: 84.0, waveAmp: 10.0 },
  { gameId: 'blackjack', base: 81.5, waveAmp: 9.5 },
  { gameId: 'slots', base: 80.5, waveAmp: 11.0 },
  { gameId: 'mines', base: 76.5, waveAmp: 13.0 },
  { gameId: 'crash', base: 75.5, waveAmp: 13.5 },
  { gameId: 'plinko', base: 74.0, waveAmp: 12.5 },
  { gameId: 'towers', base: 71.5, waveAmp: 13.0 },
  { gameId: 'wheel-of-fortune', base: 70.0, waveAmp: 12.0 },
  { gameId: 'coin-flip', base: 68.0, waveAmp: 11.5 },
  { gameId: 'upgrade', base: 67.0, waveAmp: 12.0 },
  { gameId: 'video-poker', base: 65.5, waveAmp: 11.0 },
  { gameId: 'scratch-cards', base: 64.0, waveAmp: 11.5 },
  { gameId: 'dice', base: 62.5, waveAmp: 10.5 },
  { gameId: 'shells', base: 61.0, waveAmp: 10.5 },
  { gameId: 'sic-bo', base: 59.5, waveAmp: 10.5 },
  { gameId: 'baccarat', base: 58.5, waveAmp: 10.0 },
  { gameId: 'higher-lower', base: 57.0, waveAmp: 10.5 },
  { gameId: 'keno', base: 55.5, waveAmp: 10.0 },
  { gameId: 'red-black', base: 54.0, waveAmp: 9.5 },
  { gameId: 'risk-roulette', base: 52.5, waveAmp: 10.0 },
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function computeRawScoreForDay(cfg: GameAnchorConfig, dayNumber: number): number {
  const h1 = hashString(`${cfg.gameId}-p1`);
  const h2 = hashString(`${cfg.gameId}-p2`);
  const h3 = hashString(`${cfg.gameId}-p3`);

  const phi1 = ((h1 % 1000) / 1000) * Math.PI * 2;
  const phi2 = ((h2 % 1000) / 1000) * Math.PI * 2;
  const phi3 = ((h3 % 1000) / 1000) * Math.PI * 2;

  // Multi-day smooth harmonic waves (periods ~17d, ~7.3d, ~3.6d)
  // Guarantees gradual day-to-day evolution without chaotic jumps
  const slowWave = Math.sin((2 * Math.PI * dayNumber) / 17.0 + phi1) * 0.55;
  const medWave = Math.sin((2 * Math.PI * dayNumber) / 7.3 + phi2) * 0.3;
  const gentleWave = Math.sin((2 * Math.PI * dayNumber) / 3.6 + phi3) * 0.15;

  return cfg.base + cfg.waveAmp * (slowWave + medWave + gentleWave);
}

export function getUtcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
}

export function computeClubPopularity(
  date: Date = new Date(),
  livePulseTick = 0
): ClubDailyReport {
  const dayNumber = getUtcDayNumber(date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;

  // Yesterday's ranks for exact smooth delta arrows
  const yesterdaySorted = [...GAME_ANCHORS]
    .map((cfg) => ({
      gameId: cfg.gameId,
      score: computeRawScoreForDay(cfg, dayNumber - 1),
    }))
    .sort((a, b) => b.score - a.score);

  const yesterdayRankMap = new Map<GameId, number>();
  yesterdaySorted.forEach((item, idx) => {
    yesterdayRankMap.set(item.gameId, idx + 1);
  });

  // Today's scores & ranks
  const todaySorted = [...GAME_ANCHORS]
    .map((cfg) => ({
      cfg,
      score: computeRawScoreForDay(cfg, dayNumber),
    }))
    .sort((a, b) => b.score - a.score);

  const maxScore = todaySorted[0]?.score ?? 95;
  const minScore = todaySorted[todaySorted.length - 1]?.score ?? 45;
  const span = Math.max(10, maxScore - minScore);

  let totalOnline = 0;
  let totalRoundsToday = 0;

  const rankings: GamePopularityStats[] = todaySorted.map(({ cfg, score }, idx) => {
    const rank = idx + 1;
    const yesterdayRank = yesterdayRankMap.get(cfg.gameId) ?? rank;
    const rankDelta = yesterdayRank - rank;

    const norm = (score - minScore) / span; // 0..1
    const popularityPercent = Math.min(99, Math.max(44, Math.round(48 + norm * 50)));

    // Subtle deterministic breathing pulse (+/- 2 players) so online counters feel alive
    const seed = hashString(`${cfg.gameId}-${dayNumber}`);
    const microJitter =
      livePulseTick > 0
        ? Math.round(Math.sin(livePulseTick * 0.9 + (seed % 17)) * 2)
        : 0;

    const baseOnline = Math.round(28 + Math.pow(norm, 1.45) * 310 + (seed % 11));
    const onlinePlayers = Math.max(18, baseOnline + microJitter);

    const roundsToday = Math.round(
      420 + Math.pow(norm, 1.55) * 5400 + ((seed >> 3) % 190)
    );

    totalOnline += onlinePlayers;
    totalRoundsToday += roundsToday;

    let tier: PopularityTier = 'regular';
    if (rank <= 3) {
      tier = 'top3';
    } else if (rank <= 5) {
      tier = 'top5';
    } else if (rankDelta >= 2) {
      tier = 'rising';
    }

    return {
      gameId: cfg.gameId,
      rank,
      yesterdayRank,
      rankDelta,
      popularityPercent,
      onlinePlayers,
      roundsToday,
      tier,
    };
  });

  const byGameId = {} as Record<GameId, GamePopularityStats>;
  for (const r of rankings) {
    byGameId[r.gameId] = r;
  }

  return {
    dateKey,
    totalOnline,
    totalRoundsToday,
    rankings,
    byGameId,
  };
}
