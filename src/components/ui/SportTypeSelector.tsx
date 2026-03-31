import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { SportType } from '@/types';
import { SPORT_TYPES } from '@/constants/sport.constants';

interface SportTypeSelectorProps {
  selected: SportType | null;
  onSelect: (sportType: SportType) => void;
  showAll?: boolean;
  label?: string;
}

export function SportTypeSelector({ selected, onSelect, showAll = true, label = 'Modalidade' }: SportTypeSelectorProps) {
  const sportTypes: SportType[] = showAll 
    ? ['futsal', 'society', 'campo', 'all']
    : ['futsal', 'society', 'campo'];

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</Text>
      {sportTypes.map((sportType) => {
        const config = SPORT_TYPES[sportType];
        const isSelected = selected === sportType;
        
        return (
          <TouchableOpacity
            key={sportType}
            onPress={() => onSelect(sportType)}
            className={`flex-row items-center p-3 rounded-xl mb-2 border ${
              isSelected
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-400'
              }`}
            >
              {isSelected && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Icon name={config.icon as any} size={18} color="#6366f1" className="mr-2" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {config.label}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {config.description}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
