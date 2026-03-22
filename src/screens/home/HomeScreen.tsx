import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMatchStore } from '@/store/useMatchStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useProfileStore } from '@/store/useProfileStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { matches, loadMatches } = useMatchStore();
  const { teams, loadTeams } = useTeamStore();
  const { profiles, loadProfiles } = useProfileStore();

  useEffect(() => {
    loadMatches();
    loadTeams();
    loadProfiles();
  }, []);

  const recentMatches = matches.slice(0, 3);

  const quickActions = [
    {
      icon: 'plus-circle-outline',
      label: 'Nova Partida',
      color: '#6366f1',
      onPress: () => navigation.navigate('MatchSetup', {}),
    },
    {
      icon: 'account-group-outline',
      label: 'Novo Time',
      color: '#10b981',
      onPress: () => navigation.navigate('Main', { screen: 'Teams', params: { openModal: true } }),
    },
    {
      icon: 'tune-variant',
      label: 'Novo Perfil',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Main', { screen: 'Profiles', params: { openModal: true } }),
    },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 pb-4 flex-row items-end justify-between"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Scout Futsal
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {matches.length} partidas • {teams.length} times • {profiles.length} perfis
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Ações rápidas
        </Text>
        <View className="flex-row gap-3 mb-6">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 items-center border border-gray-100 dark:border-gray-700"
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: action.color + '20' }}
              >
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Matches */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
            Partidas recentes
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>

        {recentMatches.length === 0 ? (
          <Card className="items-center py-8">
            <Icon name="calendar-remove-outline" size={40} color="#6b7280" />
            <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
              Nenhuma partida ainda.{'\n'}Crie a primeira!
            </Text>
            <Button
              title="Nova Partida"
              onPress={() => navigation.navigate('MatchSetup', {})}
              className="mt-4"
              size="sm"
            />
          </Card>
        ) : (
          recentMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              onPress={() => navigation.navigate('MatchReport', { matchId: match.id })}
            >
              <Card className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(match.date)} • {match.location || 'Sem local'}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('LiveScout', { matchId: match.id })
                    }
                    className="flex-row items-center gap-1 bg-primary-600 px-3 py-1 rounded-full"
                  >
                    <Icon name="play" size={12} color="#fff" />
                    <Text className="text-white text-xs font-semibold">Scout</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  {match.team_name ?? '—'} vs {match.opponent_name ?? '—'}
                </Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Perfil: {match.profile_name ?? '—'}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
