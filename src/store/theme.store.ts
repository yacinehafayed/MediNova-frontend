import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleTheme: async () => {
    const newIsDark = !get().isDark;
    set({ isDark: newIsDark });
    await AsyncStorage.setItem('theme_mode', newIsDark ? 'dark' : 'light');
  },
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved === 'dark') set({ isDark: true });
    } catch (e) { console.error(e); }
  },
}));