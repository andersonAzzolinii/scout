import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import type { PlayerStats } from '@/types/dashboard.types';

interface PlayerStatsTableProps {
  stats: PlayerStats[];
  maxRows?: number;
}

export function PlayerStatsTable({ stats, maxRows }: PlayerStatsTableProps) {
  const displayStats = maxRows ? stats.slice(0, maxRows) : stats;

  if (stats.length === 0) {
    return (
      <Card className="p-4">
        <View className="h-40 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">
            Nenhum dado de jogador disponível
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Text className="text-lg font-semibold mb-4 dark:text-neutral-100">
        Estatísticas de Jogadores
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-t-lg">
            <View className="w-12 p-2 justify-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">#</Text>
            </View>
            <View className="w-40 p-2 justify-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Jogador</Text>
            </View>
            <View className="w-24 p-2 justify-center items-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Partidas</Text>
            </View>
            <View className="w-24 p-2 justify-center items-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Eventos</Text>
            </View>
            <View className="w-24 p-2 justify-center items-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Positivos</Text>
            </View>
            <View className="w-24 p-2 justify-center items-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Taxa</Text>
            </View>
            <View className="w-28 p-2 justify-center items-center">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Por Partida</Text>
            </View>
          </View>

          {/* Rows */}
          {displayStats.map((player, index) => (
            <View
              key={player.playerId}
              className={`flex-row border-b border-neutral-200 dark:border-neutral-700 ${
                index % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-850'
              }`}
            >
              <View className="w-12 p-2 justify-center">
                <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                  {player.playerNumber}
                </Text>
              </View>
              <View className="w-40 p-2 justify-center">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                  {player.playerName}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                  {player.teamName}
                </Text>
              </View>
              <View className="w-24 p-2 justify-center items-center">
                <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                  {player.matchesPlayed}
                </Text>
              </View>
              <View className="w-24 p-2 justify-center items-center">
                <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {player.totalEvents}
                </Text>
              </View>
              <View className="w-24 p-2 justify-center items-center">
                <Text className="text-sm text-green-600 dark:text-green-400">
                  {player.positiveEvents}
                </Text>
              </View>
              <View className="w-24 p-2 justify-center items-center">
                <Text className={`text-sm font-medium ${
                  player.positiveRate >= 70 ? 'text-green-600 dark:text-green-400' :
                  player.positiveRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {player.positiveRate.toFixed(1)}%
                </Text>
              </View>
              <View className="w-28 p-2 justify-center items-center">
                <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                  {player.eventsPerMatch.toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {maxRows && stats.length > maxRows && (
        <View className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
            Mostrando {maxRows} de {stats.length} jogadores
          </Text>
        </View>
      )}
    </Card>
  );
}
