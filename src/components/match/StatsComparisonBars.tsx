import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { STATS_METRICS, eventMatchesMetric } from '@/constants/stats.constants';
import type { MatchEvent, ScoutCategory } from '@/types';
import { generateId } from '@/utils';

interface StatsComparisonBarsProps {
  events: MatchEvent[];
  categories: ScoutCategory[];
  selectedPeriod: 'all' | 1 | 2;
  onPeriodChange: (period: 'all' | 1 | 2) => void;
  isRunning: boolean;
  matchFinished: boolean;
  bottomInset: number;
  matchId: string;
  teamId: string;
  currentMinute: number;
  currentSecond: number;
  currentPeriod: 0 | 1 | 2;
  onOpponentEventAdd: (event: MatchEvent) => void;
  onOpponentEventRemove: (eventName: string) => void;
}

export function StatsComparisonBars({
  events,
  categories,
  selectedPeriod,
  onPeriodChange,
  isRunning,
  matchFinished,
  bottomInset,
  matchId,
  teamId,
  currentMinute,
  currentSecond,
  currentPeriod,
  onOpponentEventAdd,
  onOpponentEventRemove,
}: StatsComparisonBarsProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate stats for each metric
  const calculateStats = () => {
    const stats: any = {};
    
    // Find goalkeeper category to exclude from stats
    const goleiroCategory = categories.find(c => c.name.toUpperCase() === 'GOLEIRO');
    const goleiroCategoryId = goleiroCategory?.id;
    
    // Filter events by selected period and exclude goalkeeper events
    const filteredEvents = (selectedPeriod === 'all' 
      ? events 
      : events.filter(e => e.period === selectedPeriod)
    ).filter(e => !goleiroCategoryId || e.category_id !== goleiroCategoryId);
    
    STATS_METRICS.forEach(metric => {
      // Count my team events
      const myCount = filteredEvents.filter(e => 
        !e.is_opponent_event && eventMatchesMetric(e.event_name, metric)
      ).length;

      // Count opponent events
      const oppCount = filteredEvents.filter(e => 
        e.is_opponent_event && eventMatchesMetric(e.event_name, metric)
      ).length;

      stats[metric.key] = { my: myCount, opponent: oppCount };
    });

    return stats;
  };

  const stats = calculateStats();

  const renderStatBar = (metric: typeof STATS_METRICS[0]) => {
    const myValue = stats[metric.key].my;
    const oppValue = stats[metric.key].opponent;
    const total = myValue + oppValue;

    return (
      <View key={metric.key} style={{ marginBottom: 14 }}>
        {/* Values and label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, position: 'relative' }}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'left' }}>
            {myValue}
          </Text>
          {/* Label absolutamente centralizado */}
          <Text style={{ 
            position: 'absolute', left: 0, right: 0, 
            color: '#94a3b8', fontSize: 11, fontWeight: '600', 
            textTransform: 'uppercase', textAlign: 'center' 
          }}>
            {metric.label}
          </Text>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'right' }}>
              {oppValue}
            </Text>
            {/* Edit buttons for opponent */}
            <TouchableOpacity
              onPress={() => {
                if (oppValue === 0) return;
                onOpponentEventRemove(metric.keywords[0]);
              }}
              style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 4, 
                width: 22, 
                height: 22, 
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#374151'
              }}
              disabled={oppValue === 0}
            >
              <Icon name="minus" size={12} color={oppValue === 0 ? '#4b5563' : '#fb923c'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Encontrar o evento que corresponde a essa métrica
                const event = events.find(e => eventMatchesMetric(e.event_name, metric));
                if (event) {
                  const newEvent: MatchEvent = {
                    id: generateId(),
                    match_id: matchId,
                    team_id: teamId,
                    player_id: null,
                    event_id: event.event_id,
                    minute: currentMinute,
                    second: currentSecond,
                    period: currentPeriod,
                    x: null,
                    y: null,
                    created_at: new Date().toISOString(),
                    event_name: event.event_name,
                    event_icon: event.event_icon,
                    event_type: event.event_type,
                    is_positive: event.is_positive,
                    is_opponent_event: true,
                  };
                  onOpponentEventAdd(newEvent);
                }
              }}
              style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 4, 
                width: 22, 
                height: 22, 
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#374151'
              }}
            >
              <Icon name="plus" size={12} color="#fb923c" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bar - duas divs com gap de 2px, cada uma cresce para fora */}
        <View style={{ height: 6, flexDirection: 'row', gap: 4 }}>
          <View style={{ flex: 1, alignItems: 'flex-end', backgroundColor: '#1f2937', borderRadius: 3 }}>
            <View style={{ 
              width: total > 0 ? `${(myValue / total) * 100}%` : '0%',
              height: '100%', 
              backgroundColor: myValue > oppValue ? '#dc2626' : '#ffffff',
              borderRadius: 3
            }} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start', backgroundColor: '#1f2937', borderRadius: 3 }}>
            <View style={{ 
              width: total > 0 ? `${(oppValue / total) * 100}%` : '0%',
              height: '100%', 
              backgroundColor: oppValue > myValue ? '#dc2626' : '#ffffff',
              borderRadius: 3
            }} />
          </View>
        </View>
      </View>
    );
  };

  // Check if there are events in both periods
  const hasFirstHalf = events.some(e => e.period === 1);
  const hasSecondHalf = events.some(e => e.period === 2);
  const showPeriodFilter = hasFirstHalf && hasSecondHalf;

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, backgroundColor: 'rgba(11, 17, 32, 0.98)', borderTopWidth: 1, borderTopColor: '#1f2937', paddingBottom: bottomInset + 10 }}>
      {!isRunning && (
        <View style={{ backgroundColor: matchFinished ? 'rgba(107,114,128,0.15)' : 'rgba(251,191,36,0.15)', borderBottomWidth: 1, borderBottomColor: matchFinished ? '#6b7280' : '#fbbf24', paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name={matchFinished ? "flag-checkered" : "pause-circle"} size={16} color={matchFinished ? '#9ca3af' : '#fbbf24'} />
          <Text style={{ color: matchFinished ? '#9ca3af' : '#fbbf24', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{matchFinished ? 'PARTIDA ENCERRADA' : 'CRONÔMETRO PAUSADO'}</Text>
        </View>
      )}
      
      {/* Period Filter Tabs */}
      {showPeriodFilter && (
        <View style={{ 
          flexDirection: 'row', 
          paddingHorizontal: 16, 
          paddingTop: 12,
          paddingBottom: 8,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#1f2937'
        }}>
          <TouchableOpacity
            onPress={() => onPeriodChange('all')}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: selectedPeriod === 'all' ? '#3b82f6' : '#1f2937',
              borderWidth: 1,
              borderColor: selectedPeriod === 'all' ? '#60a5fa' : '#374151'
            }}
          >
            <Text style={{ 
              color: selectedPeriod === 'all' ? '#ffffff' : '#9ca3af', 
              fontSize: 11, 
              fontWeight: '700',
              textAlign: 'center'
            }}>
              GERAL
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onPeriodChange(1)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: selectedPeriod === 1 ? '#3b82f6' : '#1f2937',
              borderWidth: 1,
              borderColor: selectedPeriod === 1 ? '#60a5fa' : '#374151'
            }}
          >
            <Text style={{ 
              color: selectedPeriod === 1 ? '#ffffff' : '#9ca3af', 
              fontSize: 11, 
              fontWeight: '700',
              textAlign: 'center'
            }}>
              1º TEMPO
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onPeriodChange(2)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: selectedPeriod === 2 ? '#3b82f6' : '#1f2937',
              borderWidth: 1,
              borderColor: selectedPeriod === 2 ? '#60a5fa' : '#374151'
            }}
          >
            <Text style={{ 
              color: selectedPeriod === 2 ? '#ffffff' : '#9ca3af', 
              fontSize: 11, 
              fontWeight: '700',
              textAlign: 'center'
            }}>
              2º TEMPO
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView 
        style={{ maxHeight: 280 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        {STATS_METRICS.map(metric => renderStatBar(metric))}
      </ScrollView>
    </View>
  );
}
