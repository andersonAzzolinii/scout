import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { createButton } from '@gluestack-ui/core/button/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

// Filtered wrapper components to avoid unknown-prop warnings on native elements
const ButtonRoot = React.forwardRef<any, any>(
  ({ states, dataSet, role, ...rest }, ref) => (
    <Pressable ref={ref} dataSet={dataSet} accessibilityRole="button" {...rest} />
  )
);

const ButtonTextEl = React.forwardRef<any, any>(
  ({ states, dataSet, ...rest }, ref) => <Text ref={ref} {...rest} />
);

const UIButton = createButton({
  Root: ButtonRoot,
  Text: ButtonTextEl,
  Group: View,
  Spinner: React.forwardRef<any, any>(({ states, dataSet, tabIndex, ...rest }, ref) => (
    <ActivityIndicator ref={ref} size="small" {...rest} />
  )),
  Icon: View,
});

const buttonStyle = tva({
  base: 'flex-row items-center justify-center gap-2',
  variants: {
    variant: {
      primary:
        'bg-primary-600 data-[active=true]:bg-primary-700',
      secondary:
        'bg-gray-700 data-[active=true]:bg-gray-600',
      danger:
        'bg-red-600 data-[active=true]:bg-red-700',
      ghost:
        'bg-transparent border border-gray-600 data-[active=true]:bg-gray-800',
    },
    size: {
      sm: 'px-3 py-1.5 rounded-lg',
      md: 'px-5 py-2.5 rounded-xl',
      lg: 'px-6 py-3.5 rounded-xl',
    },
    isDisabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const buttonTextStyle = tva({
  base: '',
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-gray-100',
      danger: 'text-white',
      ghost: 'text-gray-300',
    },
    size: {
      sm: 'text-sm font-medium',
      md: 'text-base font-semibold',
      lg: 'text-lg font-semibold',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <UIButton
      onPress={onPress}
      isDisabled={isDisabled}
      className={buttonStyle({ variant, size, isDisabled, class: className })}
    >
      {loading && <UIButton.Spinner color="#fff" />}
      <UIButton.Text className={buttonTextStyle({ variant, size })}>
        {title}
      </UIButton.Text>
    </UIButton>
  );
}
