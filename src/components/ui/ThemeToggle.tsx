import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useTheme } from '@/theme/ThemeProvider';

export function ThemeToggle() {
  const { isDark } = useTheme();
  const { theme, setTheme } = useThemeStore();

  const handlePress = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const icons: Record<string, string> = {
    dark: 'moon-waning-crescent',
    light: 'white-balance-sunny',
    system: 'theme-light-dark',
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
    >
      <Icon name={icons[theme]} size={20} color={isDark ? '#f9fafb' : '#374151'} />
    </TouchableOpacity>
  );
}
