import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Squad } from '@/types';
import { getSportTypeIcon, getSportTypeLabel } from '@/constants/sport.constants';

interface SquadSelectorProps {
  squads: Squad[];
  selected: string | null;
  onSelect: (squadId: string) => void;
  label?: string;
  emptyMessage?: string;
}

export function SquadSelector({ 
  squads, 
  selected, 
  onSelect, 
  label = 'Elenco', 
  emptyMessage = 'Nenhum elenco cadastrado' 
}: SquadSelectorProps) {
  if (squads.length === 0) {
    return (
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 italic">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</Text>
      {squads.map((squad) => {
        const isSelected = selected === squad.id;
        const iconName = getSportTypeIcon(squad.sport_type);
        const sportLabel = getSportTypeLabel(squad.sport_type);
        
        return (
          <TouchableOpacity
            key={squad.id}
            onPress={() => onSelect(squad.id)}
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
            <Icon name={iconName as any} size={18} color="#6366f1" className="mr-2" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {squad.name}
              </Text>
              <Text className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                {sportLabel}
              </Text>
              {squad.team_name && (
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {squad.team_name}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
