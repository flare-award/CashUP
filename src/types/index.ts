export type CurrencyCode = 'RUB' | 'MDL' | 'USD' | 'EUR' | 'KZT' | 'CNY';

export type ThemeMode = 'dark' | 'light';

export type AnimationIntensity = 'full' | 'balanced' | 'minimal';

export type AvatarId =
  | 'emerald-diamond'
  | 'royal-crown'
  | 'crimson-spade'
  | 'cyber-fox'
  | 'golden-dice'
  | 'sapphire-shield'
  | 'violet-prism'
  | 'onyx-knight'
  | 'amber-phoenix'
  | 'mint-clover'
  | 'arctic-wolf'
  | 'solar-star';

export type GameId =
  | 'roulette'
  | 'slots'
  | 'red-black'
  | 'dice'
  | 'shells'
  | 'upgrade'
  | 'poker'
  | 'blackjack'
  | 'baccarat'
  | 'plinko'
  | 'mines'
  | 'higher-lower'
  | 'risk-roulette'
  | 'keno'
  | 'crash';

export type GameCategory =
  | 'roulette-wheels'
  | 'slots'
  | 'cards'
  | 'arcade-risk'
  | 'dice-numbers';

export type LedgerEntryType =
  | 'starter_bonus'
  | 'wager_debit'
  | 'wager_addon'
  | 'round_payout'
  | 'round_refund'
  | 'emergency_refill';

export interface BalanceLedgerEntry {
  id: string;
  timestamp: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  gameId?: GameId;
  roundId?: string;
  description: string;
}

export type RoundOutcomeType = 'win' | 'loss' | 'push';

export interface GameHistoryEntry {
  id: string;
  gameId: GameId;
  gameName: string;
  timestamp: string;
  wager: number;
  payout: number;
  netChange: number;
  balanceAfter: number;
  multiplier: number | null;
  outcome: RoundOutcomeType;
  summary: string;
}

export interface PrecomputedResolution {
  payout: number;
  multiplier: number | null;
  outcome: RoundOutcomeType;
  summary: string;
}

export interface PendingRound {
  roundId: string;
  gameId: GameId;
  gameName: string;
  wager: number;
  createdAt: string;
  mode: 'precomputed' | 'interactive';
  precomputed?: PrecomputedResolution;
  interactiveState?: unknown;
}

export interface PerGameStats {
  rounds: number;
  wins: number;
  losses: number;
  pushes: number;
  wagered: number;
  won: number;
  biggestWin: number;
  lastPlayedAt: string;
}

export interface ProfileStats {
  totalRounds: number;
  wins: number;
  losses: number;
  pushes: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  currentWinStreak: number;
  longestWinStreak: number;
  currentLossStreak: number;
  longestLossStreak: number;
  perGame: Record<string, PerGameStats>;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: AvatarId;
  createdAt: string;
  balance: number;
  starterBonusClaimed: boolean;
  favoriteGames: GameId[];
  recentGames: GameId[];
  stats: ProfileStats;
  history: GameHistoryEntry[];
  ledger: BalanceLedgerEntry[];
  pendingRounds: Record<string, PendingRound>;
  settledRoundIds: string[];
}

export interface AppSettings {
  theme: ThemeMode;
  currency: CurrencyCode;
  soundEnabled: boolean;
  soundVolume: number;
  animationsEnabled: boolean;
  animationIntensity: AnimationIntensity;
  notificationsEnabled: boolean;
  roundNotifications: boolean;
  npcFeedEnabled: boolean;
}

export interface NpcProfile {
  id: string;
  nickname: string;
  avatarId: AvatarId;
  styleLabel: string;
  favoriteGames: GameId[];
  aggression: number;
  tightness: number;
}

export interface NpcActivityItem {
  id: string;
  npcId: string;
  nickname: string;
  avatarId: AvatarId;
  styleLabel: string;
  gameId: GameId;
  gameName: string;
  actionType: 'win' | 'multiplier' | 'played';
  amount?: number;
  multiplier?: number;
  timestamp: string;
}

export interface LastUiState {
  lastRoute: string;
  catalogCategory: string;
  catalogSort: string;
}

export interface CashUpSaveData {
  app: 'CashUP';
  saveVersion: number;
  exportedAt: string;
  activeProfileId: string | null;
  profiles: UserProfile[];
  settings: AppSettings;
  npcHistory: NpcActivityItem[];
  uiState: LastUiState;
}

export type RoundLifecycleStatus = 'idle' | 'started' | 'animating' | 'result' | 'completed';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  durationMs?: number;
}
