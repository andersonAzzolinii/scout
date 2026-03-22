import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { MatchEvent, Match } from '@/types';
import * as matchRepo from '@/database/repositories/matchRepository';
import * as eventRepo from '@/database/repositories/eventRepository';

type Route = RouteProp<RootStackParamList, 'MatchReport'>;

export function MatchReportScreen() {
  const route = useRoute<Route>();
  const { matchId } = route.params;
  const { width } = useWindowDimensions();

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);

  useEffect(() => {
    setMatch(matchRepo.getMatchById(matchId));
    setEvents(eventRepo.getMatchEvents(matchId));
  }, [matchId]);

  if (!match) return null;

  const positiveCount = events.filter((e) => e.is_positive).length;
  const negativeCount = events.filter((e) => !e.is_positive).length;

  // Group events by player
  const byPlayer: Record<string, { name: string; number: number; pos: number; neg: number }> = {};
  events.forEach((ev) => {
    if (!byPlayer[ev.player_id]) {
      byPlayer[ev.player_id] = {
        name: ev.player_name ?? '?',
        number: ev.player_number ?? 0,
        pos: 0,
        neg: 0,
      };
    }
    if (ev.is_positive) byPlayer[ev.player_id].pos++;
    else byPlayer[ev.player_id].neg++;
  });

  const playerStats = Object.entries(byPlayer).sort(
    ([, a], [, b]) => b.pos + b.neg - (a.pos + a.neg)
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title="Relatório"
        subtitle={`${match.team_a_name} vs ${match.team_b_name}`}
        showBack
      />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1 items-center">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">{events.length}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total eventos</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-3xl font-bold text-green-500">{positiveCount}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Positivos</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-3xl font-bold text-red-500">{negativeCount}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Negativos</Text>
          </Card>
        </View>

        {/* Player stats */}
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Estatísticas por Jogador
          </Text>
          {playerStats.length === 0 ? (
            <Text className="text-gray-400 text-sm text-center py-3">Sem dados</Text>
          ) : (
            playerStats.map(([id, stat]) => (
              <View key={id} className="flex-row items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-3">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {stat.number}
                  </Text>
                </View>
                <Text className="flex-1 text-sm text-gray-800 dark:text-gray-200">{stat.name}</Text>
                <View className="flex-row gap-3">
                  <View className="flex-row items-center gap-1">
                    <Icon name="check-circle" size={14} color="#22c55e" />
                    <Text className="text-sm font-bold text-green-500">{stat.pos}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Icon name="close-circle" size={14} color="#ef4444" />
                    <Text className="text-sm font-bold text-red-500">{stat.neg}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Timeline */}
        <Card className="mb-8">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Linha do Tempo
          </Text>
          {events.length === 0 ? (
            <Text className="text-gray-400 text-sm text-center py-3">Sem eventos registrados</Text>
          ) : (
            events.map((ev) => (
              <View key={ev.id} className="flex-row items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-xs font-mono text-gray-400 w-12">
                  {String(ev.minute).padStart(2, '0')}:{String(ev.second).padStart(2, '0')}
                </Text>
                <Icon
                  name={ev.event_icon || 'circle'}
                  size={16}
                  color={ev.is_positive ? '#22c55e' : '#ef4444'}
                />
                <View className="flex-1">
                  <Text className="text-sm text-gray-800 dark:text-gray-200">
                    {ev.event_name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    #{ev.player_number} {ev.player_name}
                  </Text>
                </View>
                {ev.x != null && (
                  <Icon name="map-marker" size={14} color="#6366f1" />
                )}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
