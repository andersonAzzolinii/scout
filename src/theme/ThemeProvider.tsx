import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

interface ThemeContextValue {
  isDark: boolean;
  colorScheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: true, colorScheme: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { theme, loadTheme } = useThemeStore();

  useEffect(() => {
    loadTheme();
  }, []);

  const resolvedScheme: 'dark' | 'light' =
    theme === 'system'
      ? (systemColorScheme ?? 'dark')
      : theme;

  const isDark = resolvedScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ isDark, colorScheme: resolvedScheme }}>
      {/* NativeWind v4 uses className="dark" on root view to enable dark mode */}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
