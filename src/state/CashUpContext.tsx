import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addWagerToRound,
  beginGameRound,
  claimEmergencyVirtualRefill,
  createNewProfile,
  EMERGENCY_REFILL_AMOUNT,
  settleGameRound,
  updateInteractiveRoundState,
} from '../core/balance';
import { formatCurrency } from '../core/currency';
import { generateInitialNpcFeed, generateNpcActivity } from '../core/npc';
import { generateId } from '../core/rng';
import {
  createInitialSaveData,
  downloadSaveFile,
  parseAndValidateSaveJson,
  SaveValidationResult,
} from '../core/saveSchema';
import { SoundEffectName, soundEngine } from '../core/sound';
import { clearStorage, loadStateFromStorage, saveStateToStorage } from '../core/storage';
import {
  AppSettings,
  AvatarId,
  CashUpSaveData,
  CurrencyCode,
  GameHistoryEntry,
  GameId,
  LastUiState,
  PendingRound,
  PrecomputedResolution,
  RoundOutcomeType,
  ToastMessage,
  UserProfile,
} from '../types';

export interface StartPrecomputedInput {
  gameId: GameId;
  gameName: string;
  wager: number;
  precomputed: PrecomputedResolution;
}

export interface StartInteractiveInput {
  gameId: GameId;
  gameName: string;
  wager: number;
  interactiveState: unknown;
}

export interface FinishRoundInput {
  roundId: string;
  payout: number;
  multiplier: number | null;
  outcome: RoundOutcomeType;
  summary: string;
  silent?: boolean;
}

export interface BalanceChangeSignal {
  id: string;
  delta: number;
  timestamp: number;
}

export interface CashUpContextValue {
  state: CashUpSaveData;
  activeProfile: UserProfile | null;
  settings: AppSettings;
  toasts: ToastMessage[];
  lastBalanceSignal: BalanceChangeSignal | null;
  prefersReducedMotion: boolean;

  // Profile actions
  createProfile: (
    nickname: string,
    avatarId: AvatarId,
    initialCurrency?: CurrencyCode
  ) => UserProfile;
  switchProfile: (profileId: string) => void;
  updateProfile: (profileId: string, nickname: string, avatarId: AvatarId) => void;
  deleteProfile: (profileId: string) => void;
  toggleFavoriteGame: (gameId: GameId) => void;

  // Settings & UI state
  updateSettings: (patch: Partial<AppSettings>, silent?: boolean) => void;
  updateUiState: (patch: Partial<LastUiState>) => void;

  // Centralized Balance & Game Round API
  startPrecomputedRound: (
    input: StartPrecomputedInput
  ) => { ok: boolean; roundId: string; error?: string };
  startInteractiveRound: (
    input: StartInteractiveInput
  ) => { ok: boolean; roundId: string; error?: string };
  increaseRoundWager: (
    roundId: string,
    extraWager: number,
    reason: string
  ) => { ok: boolean; totalWager: number; error?: string };
  saveInteractiveRoundState: (roundId: string, interactiveState: unknown) => void;
  getInteractiveRound: (gameId: GameId) => PendingRound | null;
  finishRound: (
    input: FinishRoundInput
  ) => { ok: boolean; entry?: GameHistoryEntry; error?: string };
  claimEmergencyRefill: () => { ok: boolean; error?: string };

  // Save / Import / Export / Reset
  exportSave: (prefix?: string) => string;
  validateImportText: (rawJson: string) => SaveValidationResult;
  applyImportedSave: (data: CashUpSaveData) => void;
  resetAllProgress: () => void;

  // Feedback utilities
  notify: (toast: Omit<ToastMessage, 'id'>, force?: boolean) => void;
  dismissToast: (id: string) => void;
  playSound: (effect: SoundEffectName) => void;
  formatAmount: (amount: number) => string;
  scaleDuration: (baseMs: number) => number;
}

const CashUpContext = createContext<CashUpContextValue | null>(null);

export const CashUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLoad = useMemo(() => {
    const loaded = loadStateFromStorage();
    if (loaded.data.npcHistory.length === 0) {
      loaded.data = {
        ...loaded.data,
        npcHistory: generateInitialNpcFeed(8),
      };
    }
    return loaded;
  }, []);

  const [state, setState] = useState<CashUpSaveData>(initialLoad.data);
  const stateRef = useRef<CashUpSaveData>(initialLoad.data);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastBalanceSignal, setLastBalanceSignal] = useState<BalanceChangeSignal | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const commitState = useCallback((next: CashUpSaveData) => {
    stateRef.current = next;
    setState(next);
    saveStateToStorage(next);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<ToastMessage, 'id'>, force = false) => {
      if (!force && !stateRef.current.settings.notificationsEnabled) {
        return;
      }
      const id = generateId('tst');
      const duration = toast.durationMs ?? 3800;
      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
      if (duration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  // Notify if interrupted rounds were automatically reconciled on reload
  const notifiedReconcileRef = useRef(false);
  useEffect(() => {
    if (!notifiedReconcileRef.current && initialLoad.reconciledRounds > 0) {
      notifiedReconcileRef.current = true;
      notify(
        {
          type: 'info',
          title: 'Незавершённые раунды рассчитаны',
          description: `Автоматически завершено раундов после перезагрузки: ${initialLoad.reconciledRounds}.`,
        },
        true
      );
    }
  }, [initialLoad.reconciledRounds, notify]);

  // Listen to OS prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync theme, motion attributes, and sound engine configuration
  useEffect(() => {
    const { theme, animationsEnabled, animationIntensity, soundEnabled, soundVolume } =
      state.settings;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      const effectiveMotion =
        !animationsEnabled || prefersReducedMotion ? 'none' : animationIntensity;
      document.documentElement.setAttribute('data-motion', effectiveMotion);
    }
    soundEngine.configure(soundEnabled, soundVolume);
  }, [state.settings, prefersReducedMotion]);

  // Local NPC simulated activity ticker
  useEffect(() => {
    if (!state.settings.npcFeedEnabled) return;
    const interval = window.setInterval(() => {
      const cur = stateRef.current;
      if (!cur.settings.npcFeedEnabled) return;
      const item = generateNpcActivity();
      const next: CashUpSaveData = {
        ...cur,
        npcHistory: [item, ...cur.npcHistory].slice(0, 18),
      };
      commitState(next);
    }, 14_000);
    return () => window.clearInterval(interval);
  }, [state.settings.npcFeedEnabled, commitState]);

  const activeProfile = useMemo(() => {
    if (!state.activeProfileId) return state.profiles[0] ?? null;
    return (
      state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0] ?? null
    );
  }, [state.profiles, state.activeProfileId]);

  const getActiveProfileFromRef = (): UserProfile | null => {
    const cur = stateRef.current;
    if (!cur.activeProfileId) return cur.profiles[0] ?? null;
    return cur.profiles.find((p) => p.id === cur.activeProfileId) ?? cur.profiles[0] ?? null;
  };

  const replaceProfileInState = useCallback(
    (updatedProfile: UserProfile) => {
      const cur = stateRef.current;
      const next: CashUpSaveData = {
        ...cur,
        activeProfileId: updatedProfile.id,
        profiles: cur.profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)),
      };
      commitState(next);
    },
    [commitState]
  );

  const emitBalanceDelta = useCallback((delta: number) => {
    if (delta === 0) return;
    setLastBalanceSignal({
      id: generateId('sig'),
      delta,
      timestamp: Date.now(),
    });
  }, []);

  const createProfile = useCallback(
    (
      nickname: string,
      avatarId: AvatarId,
      initialCurrency?: CurrencyCode
    ): UserProfile => {
      const cur = stateRef.current;
      const existingIds = cur.profiles.map((p) => p.id);
      const profile = createNewProfile(nickname, avatarId, existingIds);
      const effectiveCurrency = initialCurrency ?? cur.settings.currency;
      const next: CashUpSaveData = {
        ...cur,
        activeProfileId: profile.id,
        profiles: [...cur.profiles, profile],
        settings: {
          ...cur.settings,
          currency: effectiveCurrency,
        },
      };
      commitState(next);
      soundEngine.play('select');
      notify({
        type: 'success',
        title: `Профиль «${profile.nickname}» создан`,
        description: `Начислен стартовый баланс: ${formatCurrency(
          profile.balance,
          effectiveCurrency
        )}.`,
      });
      return profile;
    },
    [commitState, notify]
  );

  const switchProfile = useCallback(
    (profileId: string) => {
      const cur = stateRef.current;
      const target = cur.profiles.find((p) => p.id === profileId);
      if (!target || cur.activeProfileId === profileId) return;
      commitState({
        ...cur,
        activeProfileId: profileId,
      });
      soundEngine.play('click');
      notify({
        type: 'info',
        title: `Активный профиль: ${target.nickname}`,
        description: `Текущий баланс: ${formatCurrency(
          target.balance,
          cur.settings.currency
        )}`,
      });
    },
    [commitState, notify]
  );

  const updateProfile = useCallback(
    (profileId: string, nickname: string, avatarId: AvatarId) => {
      const cur = stateRef.current;
      const cleanName = nickname.trim().slice(0, 28);
      if (!cleanName) return;
      const nextProfiles = cur.profiles.map((p) =>
        p.id === profileId ? { ...p, nickname: cleanName, avatarId } : p
      );
      commitState({ ...cur, profiles: nextProfiles });
      soundEngine.play('click');
      notify({
        type: 'success',
        title: 'Профиль обновлён',
        description: `Изменения профиля «${cleanName}» сохранены.`,
      });
    },
    [commitState, notify]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      const cur = stateRef.current;
      const target = cur.profiles.find((p) => p.id === profileId);
      if (!target) return;
      const remaining = cur.profiles.filter((p) => p.id !== profileId);
      const nextActiveId =
        cur.activeProfileId === profileId ? (remaining[0]?.id ?? null) : cur.activeProfileId;
      commitState({
        ...cur,
        activeProfileId: nextActiveId,
        profiles: remaining,
      });
      notify({
        type: 'warning',
        title: `Профиль «${target.nickname}» удалён`,
      });
    },
    [commitState, notify]
  );

  const toggleFavoriteGame = useCallback(
    (gameId: GameId) => {
      const prof = getActiveProfileFromRef();
      if (!prof) return;
      const isFav = prof.favoriteGames.includes(gameId);
      const nextFavs = isFav
        ? prof.favoriteGames.filter((id) => id !== gameId)
        : [gameId, ...prof.favoriteGames];
      replaceProfileInState({ ...prof, favoriteGames: nextFavs });
      soundEngine.play('click');
    },
    [replaceProfileInState]
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>, silent = false) => {
      const cur = stateRef.current;
      const nextSettings: AppSettings = { ...cur.settings, ...patch };
      commitState({
        ...cur,
        settings: nextSettings,
      });
      if (!silent) {
        notify({
          type: 'info',
          title: 'Настройки обновлены',
          durationMs: 2400,
        });
      }
    },
    [commitState, notify]
  );

  const updateUiState = useCallback(
    (patch: Partial<LastUiState>) => {
      const cur = stateRef.current;
      const nextUi = { ...cur.uiState, ...patch };
      if (
        nextUi.lastRoute === cur.uiState.lastRoute &&
        nextUi.catalogCategory === cur.uiState.catalogCategory &&
        nextUi.catalogSort === cur.uiState.catalogSort
      ) {
        return;
      }
      commitState({
        ...cur,
        uiState: nextUi,
      });
    },
    [commitState]
  );

  const startPrecomputedRound = useCallback(
    (input: StartPrecomputedInput): { ok: boolean; roundId: string; error?: string } => {
      const prof = getActiveProfileFromRef();
      if (!prof) {
        return { ok: false, roundId: '', error: 'Сначала создайте профиль игрока.' };
      }
      const res = beginGameRound(prof, {
        gameId: input.gameId,
        gameName: input.gameName,
        wager: input.wager,
        mode: 'precomputed',
        precomputed: input.precomputed,
      });
      if (!res.ok) {
        notify({
          type: 'error',
          title: 'Ставка отклонена',
          description: res.error ?? 'Проверьте сумму ставки и баланс.',
        });
        return { ok: false, roundId: res.roundId, error: res.error };
      }
      replaceProfileInState(res.profile);
      emitBalanceDelta(-input.wager);
      return { ok: true, roundId: res.roundId };
    },
    [replaceProfileInState, emitBalanceDelta, notify]
  );

  const startInteractiveRound = useCallback(
    (input: StartInteractiveInput): { ok: boolean; roundId: string; error?: string } => {
      const prof = getActiveProfileFromRef();
      if (!prof) {
        return { ok: false, roundId: '', error: 'Сначала создайте профиль игрока.' };
      }
      const res = beginGameRound(prof, {
        gameId: input.gameId,
        gameName: input.gameName,
        wager: input.wager,
        mode: 'interactive',
        interactiveState: input.interactiveState,
      });
      if (!res.ok) {
        notify({
          type: 'error',
          title: 'Ставка отклонена',
          description: res.error ?? 'Проверьте сумму ставки и баланс.',
        });
        return { ok: false, roundId: res.roundId, error: res.error };
      }
      replaceProfileInState(res.profile);
      emitBalanceDelta(-input.wager);
      return { ok: true, roundId: res.roundId };
    },
    [replaceProfileInState, emitBalanceDelta, notify]
  );

  const increaseRoundWager = useCallback(
    (
      roundId: string,
      extraWager: number,
      reason: string
    ): { ok: boolean; totalWager: number; error?: string } => {
      const prof = getActiveProfileFromRef();
      if (!prof) {
        return { ok: false, totalWager: 0, error: 'Профиль не активен.' };
      }
      const res = addWagerToRound(prof, roundId, extraWager, reason);
      if (!res.ok) {
        notify({
          type: 'error',
          title: 'Недостаточно средств',
          description: res.error,
        });
        return { ok: false, totalWager: res.totalWager, error: res.error };
      }
      replaceProfileInState(res.profile);
      emitBalanceDelta(-extraWager);
      return { ok: true, totalWager: res.totalWager };
    },
    [replaceProfileInState, emitBalanceDelta, notify]
  );

  const saveInteractiveRoundState = useCallback(
    (roundId: string, interactiveState: unknown) => {
      const prof = getActiveProfileFromRef();
      if (!prof) return;
      const updated = updateInteractiveRoundState(prof, roundId, interactiveState);
      replaceProfileInState(updated);
    },
    [replaceProfileInState]
  );

  const getInteractiveRound = useCallback(
    (gameId: GameId): PendingRound | null => {
      if (!activeProfile) return null;
      const found = Object.values(activeProfile.pendingRounds).find(
        (r) => r.gameId === gameId && r.mode === 'interactive'
      );
      return found ?? null;
    },
    [activeProfile]
  );

  const finishRound = useCallback(
    (input: FinishRoundInput): { ok: boolean; entry?: GameHistoryEntry; error?: string } => {
      const prof = getActiveProfileFromRef();
      if (!prof) {
        return { ok: false, error: 'Профиль не найден.' };
      }
      const res = settleGameRound(prof, {
        roundId: input.roundId,
        payout: input.payout,
        multiplier: input.multiplier,
        outcome: input.outcome,
        summary: input.summary,
      });

      if (!res.ok) {
        return { ok: false, error: res.error };
      }

      replaceProfileInState(res.profile);

      if (res.entry && res.entry.payout > 0) {
        emitBalanceDelta(res.entry.payout);
      }

      if (input.outcome === 'win') {
        soundEngine.play(res.entry && res.entry.multiplier && res.entry.multiplier >= 4 ? 'combo' : 'win');
      } else if (input.outcome === 'loss') {
        soundEngine.play('loss');
      } else {
        soundEngine.play('roundEnd');
      }

      const curSettings = stateRef.current.settings;
      if (!input.silent && curSettings.roundNotifications && res.entry) {
        if (input.outcome === 'win') {
          notify({
            type: 'success',
            title: `Выигрыш: ${formatCurrency(res.entry.payout, curSettings.currency)}`,
            description: `${res.entry.gameName} · ${res.entry.summary}`,
            durationMs: 3200,
          });
        } else if (input.outcome === 'push') {
          notify({
            type: 'info',
            title: `Возврат ставки: ${formatCurrency(res.entry.payout, curSettings.currency)}`,
            description: `${res.entry.gameName} · ${res.entry.summary}`,
            durationMs: 2800,
          });
        }
      }

      return { ok: true, entry: res.entry };
    },
    [replaceProfileInState, emitBalanceDelta, notify]
  );

  const claimEmergencyRefill = useCallback((): { ok: boolean; error?: string } => {
    const prof = getActiveProfileFromRef();
    if (!prof) return { ok: false, error: 'Профиль не найден.' };
    const res = claimEmergencyVirtualRefill(prof);
    if (!res.ok) {
      notify({
        type: 'warning',
        title: 'Пополнение недоступно',
        description: res.error,
      });
      return { ok: false, error: res.error };
    }
    replaceProfileInState(res.profile);
    emitBalanceDelta(EMERGENCY_REFILL_AMOUNT);
    soundEngine.play('win');
    notify({
      type: 'success',
      title: 'Баланс пополнен',
      description: `Счёт пополнен на ${formatCurrency(
        EMERGENCY_REFILL_AMOUNT,
        stateRef.current.settings.currency
      )}.`,
    });
    return { ok: true };
  }, [replaceProfileInState, emitBalanceDelta, notify]);

  const exportSave = useCallback(
    (prefix = 'CashUP_Save'): string => {
      const filename = downloadSaveFile(stateRef.current, { prefix });
      soundEngine.play('select');
      notify(
        {
          type: 'success',
          title: 'Сохранение успешно экспортировано',
          description: `Файл ${filename} сохранён на ваше устройство.`,
        },
        true
      );
      return filename;
    },
    [notify]
  );

  const validateImportText = useCallback((rawJson: string): SaveValidationResult => {
    return parseAndValidateSaveJson(rawJson);
  }, []);

  const applyImportedSave = useCallback(
    (data: CashUpSaveData) => {
      const next: CashUpSaveData = {
        ...data,
        npcHistory:
          data.npcHistory.length > 0 ? data.npcHistory : generateInitialNpcFeed(8),
      };
      commitState(next);
      soundEngine.play('win');
      notify(
        {
          type: 'success',
          title: 'Сохранение успешно импортировано',
          description: `Восстановлено профилей: ${next.profiles.length}. Прогресс готов к продолжению.`,
        },
        true
      );
    },
    [commitState, notify]
  );

  const resetAllProgress = useCallback(() => {
    clearStorage();
    const fresh: CashUpSaveData = {
      ...createInitialSaveData(),
      npcHistory: generateInitialNpcFeed(8),
    };
    commitState(fresh);
    soundEngine.play('roundEnd');
    notify(
      {
        type: 'warning',
        title: 'Весь прогресс сброшен',
        description: 'Создайте новый профиль или загрузите JSON-сохранение.',
      },
      true
    );
  }, [commitState, notify]);

  const playSound = useCallback((effect: SoundEffectName) => {
    soundEngine.play(effect);
  }, []);

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, state.settings.currency),
    [state.settings.currency]
  );

  const scaleDuration = useCallback(
    (baseMs: number): number => {
      if (!state.settings.animationsEnabled || prefersReducedMotion) {
        return 0;
      }
      if (state.settings.animationIntensity === 'minimal') {
        return Math.max(80, Math.round(baseMs * 0.4));
      }
      if (state.settings.animationIntensity === 'balanced') {
        return Math.max(120, Math.round(baseMs * 0.72));
      }
      return baseMs;
    },
    [
      state.settings.animationsEnabled,
      state.settings.animationIntensity,
      prefersReducedMotion,
    ]
  );

  const value = useMemo<CashUpContextValue>(
    () => ({
      state,
      activeProfile,
      settings: state.settings,
      toasts,
      lastBalanceSignal,
      prefersReducedMotion,
      createProfile,
      switchProfile,
      updateProfile,
      deleteProfile,
      toggleFavoriteGame,
      updateSettings,
      updateUiState,
      startPrecomputedRound,
      startInteractiveRound,
      increaseRoundWager,
      saveInteractiveRoundState,
      getInteractiveRound,
      finishRound,
      claimEmergencyRefill,
      exportSave,
      validateImportText,
      applyImportedSave,
      resetAllProgress,
      notify,
      dismissToast,
      playSound,
      formatAmount,
      scaleDuration,
    }),
    [
      state,
      activeProfile,
      toasts,
      lastBalanceSignal,
      prefersReducedMotion,
      createProfile,
      switchProfile,
      updateProfile,
      deleteProfile,
      toggleFavoriteGame,
      updateSettings,
      updateUiState,
      startPrecomputedRound,
      startInteractiveRound,
      increaseRoundWager,
      saveInteractiveRoundState,
      getInteractiveRound,
      finishRound,
      claimEmergencyRefill,
      exportSave,
      validateImportText,
      applyImportedSave,
      resetAllProgress,
      notify,
      dismissToast,
      playSound,
      formatAmount,
      scaleDuration,
    ]
  );

  return <CashUpContext.Provider value={value}>{children}</CashUpContext.Provider>;
};

export function useCashUp(): CashUpContextValue {
  const ctx = useContext(CashUpContext);
  if (!ctx) {
    throw new Error('useCashUp must be used inside <CashUpProvider>');
  }
  return ctx;
}
