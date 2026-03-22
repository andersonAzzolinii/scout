import React from 'react';
import { View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat';
}

const cardStyle = tva({
  base: 'rounded-2xl',
  variants: {
    variant: {
      default:
        'bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-100 dark:border-gray-700',
      flat: 'bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-100 dark:border-gray-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  return (
    <View className={cardStyle({ variant, class: className })}>{children}</View>
  );
}
