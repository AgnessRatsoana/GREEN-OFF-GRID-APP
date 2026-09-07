import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { ThemeMode } from '../theme';

interface ThemeStore {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'theme-mode-storage';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'light',

  toggleTheme: () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    set({ mode: next });
    void AsyncStorage.setItem(STORAGE_KEY, next);
  },

  setTheme: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ mode: stored });
      }
    } catch {
      // Default to light if storage is unavailable.
    }
  },
}));
