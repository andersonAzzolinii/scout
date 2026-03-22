import React from 'react';
import { View, Text } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const badgeStyle = tva({
  base: 'rounded-full',
  variants: {
    variant: {
      primary: 'bg-primary-100 dark:bg-primary-900',
      success: 'bg-green-100 dark:bg-green-900',
      danger: 'bg-red-100 dark:bg-red-900',
      warning: 'bg-yellow-100 dark:bg-yellow-900',
      neutral: 'bg-gray-100 dark:bg-gray-700',
    },
    size: {
      sm: 'px-2 py-0.5',
      md: 'px-3 py-1',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'sm',
  },
});

const badgeTextStyle = tva({
  base: 'font-semibold',
  variants: {
    variant: {
      primary: 'text-primary-700 dark:text-primary-300',
      success: 'text-green-700 dark:text-green-300',
      danger: 'text-red-700 dark:text-red-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
      neutral: 'text-gray-600 dark:text-gray-300',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'sm',
  },
});

export function Badge({ label, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  return (
    <View className={badgeStyle({ variant, size, class: className })}>
      <Text className={badgeTextStyle({ variant, size })}>{label}</Text>
    </View>
  );
}
