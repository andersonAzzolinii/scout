import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ScoutCategory, ScoutEvent, MatchEvent } from '@/types';

interface EventPanelProps {
  type: 'negative' | 'positive';
  categories: ScoutCategory[];
  events: ScoutEvent[];
  liveEvents: MatchEvent[];
  isRunning: boolean;
  showStatsMode: boolean;
  selectedPlayerId?: string | null;
  matchFinished?: boolean;
  onEventPress: (scoutEvent: ScoutEvent) => void;
}

export function EventPanel({
  type,
  categories,
  events,
  liveEvents,
  isRunning,
  showStatsMode,
  selectedPlayerId,
  matchFinished = false,
  onEventPress,
}: EventPanelProps) {
  const isPositive = type === 'positive';
  const title = isPositive ? 'Acertos' : 'Erros';
  const titleColor = isRunning ? (isPositive ? '#4ade80' : '#f87171') : '#fbbf24';
  const bgColor = isRunning 
    ? (isPositive ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)')
    : 'rgba(251,191,36,0.10)';
  const dotColor = isRunning ? (isPositive ? '#22c55e' : '#ef4444') : '#fbbf24';

  return (
    <View style={{ width: 140, backgroundColor: '#0a0d14', borderRightWidth: isPositive ? 0 : 1, borderLeftWidth: isPositive ? 1 : 0, borderColor: '#1f2937' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: bgColor }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
        <Text style={{ color: titleColor, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>{title}</Text>
        {!isRunning && (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Icon name="pause" size={9} color="#fbbf24" />
          </View>
        )}
      </View>

      {/* Events List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map((category) => {
          const catEvents = events.filter(e => e.category_id === category.id && e.is_positive === isPositive);
          if (catEvents.length === 0) return null;

          return (
            <View key={category.id}>
              <Text style={{ color: '#4b5563', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
                {category.name}
              </Text>
              {catEvents.map((evt) => {
                const playerCount = showStatsMode 
                  ? 0 
                  : liveEvents.filter(e => e.event_id === evt.id && e.player_id === selectedPlayerId && !e.is_opponent_event).length;
                const opponentCount = liveEvents.filter(e => e.event_id === evt.id && e.is_opponent_event).length;

                return (
                  <TouchableOpacity
                    key={evt.id}
                    onPress={() => onEventPress(evt)}
                    disabled={matchFinished}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#1f2937',
                      opacity: matchFinished ? 0.35 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name={evt.icon as any} size={18} color={evt.is_positive ? '#4ade80' : '#f87171'} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#d1d5db', fontSize: 11, fontWeight: '600' }} numberOfLines={2}>
                        {evt.name}
                      </Text>
                    </View>
                    {showStatsMode ? (
                      <View style={{ 
                        backgroundColor: opponentCount > 0 ? 'rgba(251,146,60,0.15)' : 'rgba(75,85,99,0.1)', 
                        borderRadius: 6, 
                        paddingHorizontal: 6, 
                        paddingVertical: 3,
                        minWidth: 24,
                        alignItems: 'center'
                      }}>
                        <Text style={{ 
                          color: opponentCount > 0 ? '#fb923c' : '#6b7280', 
                          fontSize: 11, 
                          fontWeight: '800',
                          fontFamily: 'monospace'
                        }}>
                          {opponentCount}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ 
                        backgroundColor: playerCount > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(75,85,99,0.1)', 
                        borderRadius: 6, 
                        paddingHorizontal: 6, 
                        paddingVertical: 3,
                        minWidth: 24,
                        alignItems: 'center'
                      }}>
                        <Text style={{ 
                          color: playerCount > 0 ? '#818cf8' : '#6b7280', 
                          fontSize: 11, 
                          fontWeight: '800',
                          fontFamily: 'monospace'
                        }}>
                          {playerCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
