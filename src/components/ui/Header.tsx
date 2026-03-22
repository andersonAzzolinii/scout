import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

// Filtered wrapper to avoid passing GlueStack-internal props to native Pressable
const PressableEl = React.forwardRef<any, any>(({ states, dataSet, ...rest }, ref) => (
  <Pressable ref={ref} {...(dataSet ? { dataSet } : {})} {...rest} />
));

const UIPressable = createPressable({ Root: PressableEl });

const backButtonStyle = tva({
  base: 'w-9 h-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 data-[active=true]:bg-gray-200 dark:data-[active=true]:bg-gray-700',
});

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, showBack = false, right }: HeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 flex-row items-center justify-between"
      style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
    >
      <View className="flex-row items-center flex-1 gap-3">
        {showBack && (
          <UIPressable
            onPress={() => navigation.goBack()}
            className={backButtonStyle({})}
            accessibilityLabel="Voltar"
          >
            <Icon name="arrow-left" size={20} color="#6366f1" />
          </UIPressable>
        )}
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right ? <View className="ml-3">{right}</View> : null}
    </View>
  );
}
