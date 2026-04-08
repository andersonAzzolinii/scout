import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMatchStore } from '@/store/useMatchStore';
import type { ScoutEvent, ScoutCategory } from '@/types';

interface OpponentEventSelectorProps {
  matchId: string;
  teamId: string;
  events: ScoutEvent[]; // Events from the match profile
  categories: ScoutCategory[]; // Categories from the match profile
  currentMinute: number;
  currentSecond: number;
  currentPeriod: 1 | 2;
  onEventRecorded?: () => void;
}

export function OpponentEventSelector({
  matchId,
  teamId,
  events,
  categories,
  currentMinute,
  currentSecond,
  currentPeriod,
  onEventRecorded,
}: OpponentEventSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addOpponentEvent } = useMatchStore();

  // Group events by category using the profile's categories and events
  const categorizedEvents = useMemo(() => {
    const grouped = new Map<string, ScoutEvent[]>();
    
    categories.forEach(category => {
      const categoryEvents = events.filter(event => event.category_id === category.id);
      if (categoryEvents.length > 0) {
        grouped.set(category.id, categoryEvents);
      }
    });

    // Add uncategorized events (events without a category_id match)
    const categorizedIds = new Set(categories.map(c => c.id));
    const uncategorized = events.filter(e => !e.category_id || !categorizedIds.has(e.category_id));
    if (uncategorized.length > 0) {
      grouped.set('outros', uncategorized);
    }

    return grouped;
  }, [events, categories]);

  const handleEventPress = (event: ScoutEvent) => {
    // Validations
    if (!matchId || !teamId) {
      console.error('[OpponentEventSelector] Missing matchId or teamId');
      return;
    }

    const eventId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[OpponentEventSelector] Recording opponent event:', {
      event_name: event.name,
      event_id: event.id,
      match_id: matchId,
      team_id: teamId,
      player_id: null,
    });

    try {
      addOpponentEvent({
        id: eventId,
        match_id: matchId,
        team_id: teamId,
        player_id: null, // No specific player for opponent (NULL instead of empty string)
        event_id: event.id,
        event_name: event.name,
        minute: currentMinute,
        second: currentSecond,
        period: currentPeriod,
        x: null,
        y: null,
        is_opponent_event: true,
        created_at: new Date().toISOString(),
      });

      onEventRecorded?.();
    } catch (error) {
      console.error('[OpponentEventSelector] Error recording opponent event:', error);
      Alert.alert(
        'Erro ao registrar evento',
        'Não foi possível registrar o evento do adversário. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="bg-orange-600 px-4 py-3 border-b border-orange-700">
        <View className="flex-row items-center">
          <Icon name="account-multiple" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">
            Eventos do Adversário
          </Text>
        </View>
        <Text className="text-orange-100 text-xs mt-1">
          Selecione o evento para o time adversário
        </Text>
      </View>

      {/* Category Selection */}
      <ScrollView className="flex-1">
        <View className="px-4 py-3">
          <Text className="text-slate-400 text-xs font-semibold mb-3">
            EVENTOS DO PERFIL
          </Text>

          {categories.map(category => {
            const events = categorizedEvents.get(category.id);
            if (!events || events.length === 0) return null;

            const isExpanded = selectedCategory === category.id;

            return (
              <View key={category.id} className="mb-3">
                {/* Category Header */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory(isExpanded ? null : category.id)}
                  className="bg-slate-800 rounded-lg px-4 py-3 flex-row items-center justify-between border border-slate-700"
                >
                  <View className="flex-row items-center">
                    <Text className="text-white text-base font-bold">
                      {category.name}
                    </Text>
                    <View className="bg-slate-700 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-slate-300 text-xs font-semibold">
                        {events.length}
                      </Text>
                    </View>
                  </View>
                  <Icon 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color="#94a3b8" 
                  />
                </TouchableOpacity>

                {/* Events List */}
                {isExpanded && (
                  <View className="mt-2 pl-4">
                    {events.map((event: ScoutEvent) => {
                      const eventColor = event.is_positive ? '#10b981' : '#ef4444'; // green for positive, red for negative
                      return (
                        <TouchableOpacity
                          key={event.id}
                          onPress={() => handleEventPress(event)}
                          className="bg-slate-800/50 rounded-lg px-4 py-3 mb-2 flex-row items-center justify-between border border-slate-700/50"
                          style={{
                            borderLeftWidth: 3,
                            borderLeftColor: eventColor,
                          }}
                        >
                          <View className="flex-row items-center flex-1">
                            <Text className="text-2xl mr-2">{event.icon}</Text>
                            <Text className="text-white text-sm font-medium flex-1">
                              {event.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
