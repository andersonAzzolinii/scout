import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { MatchEvent } from '@/types';

interface LiveTotalizadoresProps {
  events: MatchEvent[];
  teamName: string;
  opponentName: string;
  isCollapsible?: boolean;
}

interface Totalizer {
  id: string;
  name: string;
  icon: string;
  teamCount: number;
  opponentCount: number;
  color: string;
}

export function LiveTotalizadores({
  events,
  teamName,
  opponentName,
  isCollapsible = true,
}: LiveTotalizadoresProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalizadores = useMemo<Totalizer[]>(() => {
    const teamEvents = events.filter(e => !e.is_opponent_event);
    const opponentEvents = events.filter(e => e.is_opponent_event);

    const countByType = (eventList: MatchEvent[], matcher: (e: MatchEvent) => boolean) =>
      eventList.filter(matcher).length;

    return [
      {
        id: 'gols',
        name: 'Gols',
        icon: 'soccer',
        teamCount: countByType(teamEvents, e => e.event_name === 'Gol' || e.event_id?.includes('gol')),
        opponentCount: countByType(opponentEvents, e => e.event_name === 'Gol' || e.event_id?.includes('gol')),
        color: '#22c55e',
      },
      {
        id: 'finalizacoes',
        name: 'Finalizações',
        icon: 'target',
        teamCount: countByType(teamEvents, e => 
          (e.event_id?.includes('finalizacao') || e.event_name?.toLowerCase().includes('finalização')) ?? false
        ),
        opponentCount: countByType(opponentEvents, e => 
          (e.event_id?.includes('finalizacao') || e.event_name?.toLowerCase().includes('finalização')) ?? false
        ),
        color: '#3b82f6',
      },
      {
        id: 'faltas',
        name: 'Faltas',
        icon: 'hand-back-right',
        teamCount: countByType(teamEvents, e => 
          (e.event_id?.includes('falta') || e.event_name?.toLowerCase().includes('falta')) ?? false
        ),
        opponentCount: countByType(opponentEvents, e => 
          (e.event_id?.includes('falta') || e.event_name?.toLowerCase().includes('falta')) ?? false
        ),
        color: '#f59e0b',
      },
      {
        id: 'amarelos',
        name: 'Amarelos',
        icon: 'card',
        teamCount: countByType(teamEvents, e => 
          (e.event_id?.includes('amarelo') || e.event_name?.toLowerCase().includes('amarelo')) ?? false
        ),
        opponentCount: countByType(opponentEvents, e => 
          (e.event_id?.includes('amarelo') || e.event_name?.toLowerCase().includes('amarelo')) ?? false
        ),
        color: '#eab308',
      },
      {
        id: 'vermelhos',
        name: 'Vermelhos',
        icon: 'card',
        teamCount: countByType(teamEvents, e => 
          (e.event_id?.includes('vermelho') || e.event_name?.toLowerCase().includes('vermelho')) ?? false
        ),
        opponentCount: countByType(opponentEvents, e => 
          (e.event_id?.includes('vermelho') || e.event_name?.toLowerCase().includes('vermelho')) ?? false
        ),
        color: '#ef4444',
      },
      {
        id: 'escanteios',
        name: 'Escanteios',
        icon: 'flag-variant',
        teamCount: countByType(teamEvents, e => 
          (e.event_id?.includes('escanteio') || e.event_name?.toLowerCase().includes('escanteio')) ?? false
        ),
        opponentCount: countByType(opponentEvents, e => 
          (e.event_id?.includes('escanteio') || e.event_name?.toLowerCase().includes('escanteio')) ?? false
        ),
        color: '#8b5cf6',
      },
    ];
  }, [events]);

  const hasAnyEvents = totalizadores.some(t => t.teamCount > 0 || t.opponentCount > 0);

  if (!hasAnyEvents && isExpanded) {
    return null; // Hide panel when no events recorded
  }

  return (
    <View className="bg-slate-800/95 rounded-xl mx-4 mt-3 shadow-lg border border-slate-700">
      {/* Header */}
      {isCollapsible ? (
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700"
        >
          <View className="flex-row items-center">
            <Icon name="chart-bar" size={20} color="#94a3b8" />
            <Text className="text-slate-200 text-base font-bold ml-2">
              Totalizadores
            </Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#94a3b8" 
          />
        </TouchableOpacity>
      ) : (
        <View className="px-4 py-3 border-b border-slate-700">
          <View className="flex-row items-center">
            <Icon name="chart-bar" size={20} color="#94a3b8" />
            <Text className="text-slate-200 text-base font-bold ml-2">
              Totalizadores
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {isExpanded && (
        <View className="px-4 py-3">
          {/* Team Headers */}
          <View className="flex-row items-center mb-3">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs font-semibold text-center">
                {teamName}
              </Text>
            </View>
            <View className="w-24" />
            <View className="flex-1">
              <Text className="text-slate-400 text-xs font-semibold text-center">
                {opponentName}
              </Text>
            </View>
          </View>

          {/* Totalizadores List */}
          {totalizadores.map((tot, index) => (
            <View
              key={tot.id}
              className={`flex-row items-center py-2 ${
                index < totalizadores.length - 1 ? 'border-b border-slate-700/50' : ''
              }`}
            >
              {/* Team Count */}
              <View className="flex-1 flex-row items-center justify-end pr-3">
                <Text className="text-white text-lg font-bold">
                  {tot.teamCount}
                </Text>
              </View>

              {/* Icon and Label */}
              <View className="w-24 items-center">
                <View 
                  className="rounded-full p-2 mb-1"
                  style={{ backgroundColor: `${tot.color}20` }}
                >
                  <Icon name={tot.icon as any} size={18} color={tot.color} />
                </View>
                <Text className="text-slate-300 text-xs font-semibold text-center">
                  {tot.name}
                </Text>
              </View>

              {/* Opponent Count */}
              <View className="flex-1 flex-row items-center justify-start pl-3">
                <Text className="text-white text-lg font-bold">
                  {tot.opponentCount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
