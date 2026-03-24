import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Card } from '../ui/Card';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import type { StatisticPeriod } from '@/types/dashboard.types';

export function DashboardFilters() {
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'period' | 'teams' | 'players' | 'events' | null>(null);

  const {
    filters,
    setPeriod,
    setTeamIds,
    setPlayerIds,
    setEventIds,
    resetFilters,
  } = useDashboardStore();

  const {
    availableTeams,
    availablePlayers,
    availableEvents,
    dateRange,
  } = useDashboardFilters();

  const periodOptions: { value: StatisticPeriod; label: string }[] = [
    { value: 'all', label: 'Todos os Períodos' },
    { value: 'last7', label: 'Últimos 7 dias' },
    { value: 'last30', label: 'Últimos 30 dias' },
    { value: 'last90', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const currentPeriodLabel = periodOptions.find((p) => p.value === filters.period)?.label || 'Período';

  const activeFiltersCount = 
    filters.teamIds.length + 
    filters.playerIds.length + 
    filters.eventIds.length +
    (filters.period !== 'all' ? 1 : 0);

  const toggleTeam = (teamId: string) => {
    const newIds = filters.teamIds.includes(teamId)
      ? filters.teamIds.filter((id) => id !== teamId)
      : [...filters.teamIds, teamId];
    setTeamIds(newIds);
  };

  const togglePlayer = (playerId: string) => {
    const newIds = filters.playerIds.includes(playerId)
      ? filters.playerIds.filter((id) => id !== playerId)
      : [...filters.playerIds, playerId];
    setPlayerIds(newIds);
  };

  const toggleEvent = (eventId: string) => {
    const newIds = filters.eventIds.includes(eventId)
      ? filters.eventIds.filter((id) => id !== eventId)
      : [...filters.eventIds, eventId];
    setEventIds(newIds);
  };

  return (
    <>
      <Card className="p-3 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center gap-2">
            {/* Period Filter */}
            <TouchableOpacity
              onPress={() => {
                setActiveSection('period');
                setShowModal(true);
              }}
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                filters.period !== 'all'
                  ? 'bg-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filters.period !== 'all'
                  ? 'text-white'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                📅 {currentPeriodLabel}
              </Text>
            </TouchableOpacity>

            {/* Team Filter */}
            <TouchableOpacity
              onPress={() => {
                setActiveSection('teams');
                setShowModal(true);
              }}
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                filters.teamIds.length > 0
                  ? 'bg-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filters.teamIds.length > 0
                  ? 'text-white'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                🏆 Times {filters.teamIds.length > 0 && `(${filters.teamIds.length})`}
              </Text>
            </TouchableOpacity>

            {/* Player Filter */}
            <TouchableOpacity
              onPress={() => {
                setActiveSection('players');
                setShowModal(true);
              }}
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                filters.playerIds.length > 0
                  ? 'bg-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filters.playerIds.length > 0
                  ? 'text-white'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                👤 Jogadores {filters.playerIds.length > 0 && `(${filters.playerIds.length})`}
              </Text>
            </TouchableOpacity>

            {/* Events Filter */}
            <TouchableOpacity
              onPress={() => {
                setActiveSection('events');
                setShowModal(true);
              }}
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                filters.eventIds.length > 0
                  ? 'bg-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filters.eventIds.length > 0
                  ? 'text-white'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                📊 Eventos {filters.eventIds.length > 0 && `(${filters.eventIds.length})`}
              </Text>
            </TouchableOpacity>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                onPress={resetFilters}
                className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900"
              >
                <Text className="text-sm font-medium text-red-600 dark:text-red-300">
                  ✕ Limpar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Card>

      {/* Filter Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[70%]">
            <View className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex-row items-center justify-between">
              <Text className="text-lg font-bold dark:text-neutral-100">
                {activeSection === 'period' && 'Período'}
                {activeSection === 'teams' && 'Selecionar Times'}
                {activeSection === 'players' && 'Selecionar Jogadores'}
                {activeSection === 'events' && 'Selecionar Eventos'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text className="text-2xl text-neutral-500">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4">
              {/* Period Options */}
              {activeSection === 'period' && (
                <View className="gap-2">
                  {periodOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setPeriod(option.value);
                        setShowModal(false);
                      }}
                      className={`p-4 rounded-lg ${
                        filters.period === option.value
                          ? 'bg-blue-500'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      <Text className={`font-medium ${
                        filters.period === option.value
                          ? 'text-white'
                          : 'dark:text-neutral-100'
                      }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Team Options */}
              {activeSection === 'teams' && (
                <View className="gap-2">
                  {availableTeams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      onPress={() => toggleTeam(team.id)}
                      className={`p-4 rounded-lg flex-row items-center justify-between ${
                        filters.teamIds.includes(team.id)
                          ? 'bg-blue-500'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      <Text className={`font-medium ${
                        filters.teamIds.includes(team.id)
                          ? 'text-white'
                          : 'dark:text-neutral-100'
                      }`}>
                        {team.name}
                      </Text>
                      {filters.teamIds.includes(team.id) && (
                        <Text className="text-white text-lg">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Player Options */}
              {activeSection === 'players' && (
                <View className="gap-2">
                  {availablePlayers.map((player) => (
                    <TouchableOpacity
                      key={player.id}
                      onPress={() => togglePlayer(player.id)}
                      className={`p-4 rounded-lg flex-row items-center justify-between ${
                        filters.playerIds.includes(player.id)
                          ? 'bg-blue-500'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-600 items-center justify-center">
                          <Text className="text-sm font-bold">{player.number}</Text>
                        </View>
                        <Text className={`font-medium ${
                          filters.playerIds.includes(player.id)
                            ? 'text-white'
                            : 'dark:text-neutral-100'
                        }`}>
                          {player.name}
                        </Text>
                      </View>
                      {filters.playerIds.includes(player.id) && (
                        <Text className="text-white text-lg">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Event Options */}
              {activeSection === 'events' && (
                <View className="gap-2">
                  {availableEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => toggleEvent(event.id)}
                      className={`p-4 rounded-lg flex-row items-center justify-between ${
                        filters.eventIds.includes(event.id)
                          ? 'bg-blue-500'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <Text className="text-xl">{event.icon}</Text>
                        <Text className={`font-medium ${
                          filters.eventIds.includes(event.id)
                            ? 'text-white'
                            : 'dark:text-neutral-100'
                        }`}>
                          {event.name}
                        </Text>
                      </View>
                      {filters.eventIds.includes(event.id) && (
                        <Text className="text-white text-lg">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
