import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const containerStyle = tva({
  base: 'flex-1 items-center justify-center px-8 py-16',
});

const iconWrapperStyle = tva({
  base: 'w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4',
});

export function EmptyState({ icon = 'inbox-outline', title, description, children }: EmptyStateProps) {
  return (
    <View className={containerStyle({})}>
      <View className={iconWrapperStyle({})}>
        <Icon name={icon as any} size={40} color="#6b7280" />
      </View>
      <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center mb-2">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
