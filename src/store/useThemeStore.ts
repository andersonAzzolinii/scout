import { create } from 'zustand';
import type { ThemeMode } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeStore {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem('app_theme', theme);
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('app_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      set({ theme: saved });
    }
  },
}));
