import { CashUpSaveData } from '../types';
import {
  createInitialSaveData,
  parseAndValidateSaveJson,
  serializeSaveData,
} from './saveSchema';

export const STORAGE_KEY = 'cashup.local.save.v2';

export interface LoadedStorageResult {
  data: CashUpSaveData;
  reconciledRounds: number;
}

export function loadStateFromStorage(): LoadedStorageResult {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { data: createInitialSaveData(), reconciledRounds: 0 };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { data: createInitialSaveData(), reconciledRounds: 0 };
    }

    const parsedBefore = JSON.parse(raw) as {
      profiles?: Array<{ pendingRounds?: Record<string, { mode?: string }> }>;
    };
    const pendingPrecomputedCount = (parsedBefore.profiles ?? []).reduce((sum, p) => {
      const rounds = Object.values(p.pendingRounds ?? {});
      return sum + rounds.filter((r) => r.mode === 'precomputed').length;
    }, 0);

    const validated = parseAndValidateSaveJson(raw);
    if (!validated.ok) {
      return { data: createInitialSaveData(), reconciledRounds: 0 };
    }

    if (pendingPrecomputedCount > 0) {
      saveStateToStorage(validated.data);
    }

    return {
      data: validated.data,
      reconciledRounds: pendingPrecomputedCount,
    };
  } catch {
    return { data: createInitialSaveData(), reconciledRounds: 0 };
  }
}

export function saveStateToStorage(state: CashUpSaveData): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const serialized = serializeSaveData(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage removal errors in restricted environments
  }
}
