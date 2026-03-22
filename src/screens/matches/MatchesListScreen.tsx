import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMatchStore } from '@/store/useMatchStore';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MatchesListScreen() {
  const navigation = useNavigation<Nav>();
  const { matches, loadMatches, deleteMatch } = useMatchStore();

  useEffect(() => { loadMatches(); }, []);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title="Partidas"
        right={
          <Button
            title="Nova"
            onPress={() => navigation.navigate('MatchSetup', {})}
            size="sm"
          />
        }
      />
      {matches.length === 0 ? (
        <EmptyState
          icon="calendar-remove-outline"
          title="Nenhuma partida"
          description="Crie uma partida para começar a fazer scout."
        >
          <Button
            title="Criar Partida"
            onPress={() => navigation.navigate('MatchSetup', {})}
          />
        </EmptyState>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatDate(item.date)} • {item.location || 'Sem local'}
                  </Text>
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    {item.team_name ?? '?'} vs {item.opponent_name ?? '?'}
                  </Text>
                  <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Perfil: {item.profile_name ?? '—'}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => navigation.navigate('LiveScout', { matchId: item.id })}
                    className="w-9 h-9 rounded-full bg-primary-600 items-center justify-center"
                  >
                    <Icon name="play" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('MatchReport', { matchId: item.id })}
                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
                  >
                    <Icon name="chart-bar" size={16} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteMatch(item.id)}
                    className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center"
                  >
                    <Icon name="delete-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
