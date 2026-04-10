import React from 'react';
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
  const { addOpponentEvent } = useMatchStore();

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
          Toque no evento para registrar
        </Text>
      </View>

      {/* Events Grid */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row flex-wrap gap-3">
          {events.map((event) => {
            const eventColor = event.is_positive ? '#10b981' : '#ef4444';
            const eventBgColor = event.is_positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            
            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.7}
                className="rounded-xl p-4 border-2 items-center justify-center"
                style={{
                  backgroundColor: eventBgColor,
                  borderColor: eventColor,
                  width: '47%',
                  minHeight: 100,
                }}
              >
                <View
                  className="rounded-full p-3 mb-2"
                  style={{ backgroundColor: `${eventColor}30` }}
                >
                  <Text style={{ fontSize: 28 }}>{event.icon}</Text>
                </View>
                <Text
                  className="text-white text-sm font-bold text-center"
                  numberOfLines={2}
                >
                  {event.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {events.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon name="information-outline" size={48} color="#64748b" />
            <Text className="text-slate-400 text-base mt-3 text-center">
              Nenhum evento disponível{'\n'}no perfil desta partida
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
