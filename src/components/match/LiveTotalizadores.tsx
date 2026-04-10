import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { MatchEvent } from '@/types';
import { useMatchStore } from '@/store/useMatchStore';
import { generateId } from '@/utils';

interface LiveTotalizadoresProps {
  events: MatchEvent[];
  teamName: string;
  opponentName: string;
  isCollapsible?: boolean;
  matchId?: string;
  teamId?: string;
  currentMinute?: number;
  currentSecond?: number;
  currentPeriod?: 1 | 2;
  onManualEventAdded?: () => void;
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
  matchId,
  teamId,
  currentMinute = 0,
  currentSecond = 0,
  currentPeriod = 1,
  onManualEventAdded,
}: LiveTotalizadoresProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { addLiveEvent, addOpponentEvent, deleteEvent } = useMatchStore();

  // Handler para adicionar evento manual (incrementar)
  const handleIncrement = (totalizerId: string, isOpponent: boolean) => {
    if (!matchId || !teamId) {
      Alert.alert('Erro', 'Informações da partida não disponíveis');
      return;
    }

    const eventId = generateId();
    const eventName = getEventNameFromId(totalizerId);
    const eventIcon = getEventIconFromId(totalizerId);

    if (isOpponent) {
      addOpponentEvent({
        id: eventId,
        match_id: matchId,
        team_id: teamId,
        player_id: null,
        event_id: totalizerId,
        event_name: eventName,
        minute: currentMinute,
        second: currentSecond,
        period: currentPeriod,
        x: null,
        y: null,
        is_opponent_event: true,
        created_at: new Date().toISOString(),
      });
    } else {
      addLiveEvent({
        id: eventId,
        match_id: matchId,
        team_id: teamId,
        player_id: null, // Evento sem jogador específico (manual)
        event_id: totalizerId,
        minute: currentMinute,
        second: currentSecond,
        period: currentPeriod,
        x: null,
        y: null,
        created_at: new Date().toISOString(),
        event_name: eventName,
        event_icon: eventIcon,
        event_type: 'team',
        is_positive: true,
      });
    }

    onManualEventAdded?.();
  };

  // Handler para remover evento (decrementar)
  const handleDecrement = (totalizerId: string, isOpponent: boolean) => {
    // Encontrar o último evento deste tipo
    const matchingEvents = events
      .filter(e => {
        const isCorrectType = 
          e.event_name === getEventNameFromId(totalizerId) || 
          e.event_id?.includes(totalizerId);
        const isCorrectTeam = isOpponent ? e.is_opponent_event : !e.is_opponent_event;
        return isCorrectType && isCorrectTeam;
      })
      .sort((a, b) => {
        // Ordenar por período, depois minuto, depois segundo
        if (a.period !== b.period) return b.period - a.period;
        if (a.minute !== b.minute) return b.minute - a.minute;
        return b.second - a.second;
      });

    if (matchingEvents.length > 0) {
      const lastEvent = matchingEvents[0];
      Alert.alert(
        'Remover evento',
        `Remover último "${getEventNameFromId(totalizerId)}" ${isOpponent ? 'do adversário' : 'do time'}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Remover', 
            style: 'destructive', 
            onPress: () => {
              deleteEvent(lastEvent.id);
              onManualEventAdded?.();
            }
          },
        ]
      );
    } else {
      Alert.alert('Aviso', 'Nenhum evento deste tipo para remover');
    }
  };

  // Função auxiliar para obter nome do evento
  const getEventNameFromId = (id: string): string => {
    const names: Record<string, string> = {
      gols: 'Gol',
      finalizacoes: 'Finalização',
      faltas: 'Falta',
      amarelos: 'Cartão Amarelo',
      vermelhos: 'Cartão Vermelho',
      escanteios: 'Escanteio',
    };
    return names[id] || id;
  };

  // Função auxiliar para obter ícone do evento
  const getEventIconFromId = (id: string): string => {
    const icons: Record<string, string> = {
      gols: 'soccer',
      finalizacoes: 'target',
      faltas: 'hand-back-right',
      amarelos: 'card',
      vermelhos: 'card',
      escanteios: 'flag-variant',
    };
    return icons[id] || 'help-circle';
  };

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
              className={`py-3 ${
                index < totalizadores.length - 1 ? 'border-b border-slate-700/50' : ''
              }`}
            >
              {/* Team Name Header Row */}
              <View className="flex-row items-center mb-2">
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

              {/* Counter Row */}
              <View className="flex-row items-center">
                {/* Team Side */}
                <View className="flex-1 flex-row items-center justify-center gap-2">
                  {/* Botão Decrementar Time */}
                  {matchId && teamId && (
                    <TouchableOpacity
                      onPress={() => handleDecrement(tot.id, false)}
                      disabled={tot.teamCount === 0}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ 
                        backgroundColor: tot.teamCount === 0 ? '#1e293b' : `${tot.color}15`,
                        opacity: tot.teamCount === 0 ? 0.3 : 1,
                      }}
                    >
                      <Icon name="minus" size={16} color={tot.teamCount === 0 ? '#475569' : tot.color} />
                    </TouchableOpacity>
                  )}
                  
                  <Text className="text-white text-xl font-bold min-w-[32px] text-center">
                    {tot.teamCount}
                  </Text>

                  {/* Botão Incrementar Time */}
                  {matchId && teamId && (
                    <TouchableOpacity
                      onPress={() => handleIncrement(tot.id, false)}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${tot.color}15` }}
                    >
                      <Icon name="plus" size={16} color={tot.color} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Icon and Label (Center) */}
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

                {/* Opponent Side */}
                <View className="flex-1 flex-row items-center justify-center gap-2">
                  {/* Botão Decrementar Adversário */}
                  {matchId && teamId && (
                    <TouchableOpacity
                      onPress={() => handleDecrement(tot.id, true)}
                      disabled={tot.opponentCount === 0}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ 
                        backgroundColor: tot.opponentCount === 0 ? '#1e293b' : `${tot.color}15`,
                        opacity: tot.opponentCount === 0 ? 0.3 : 1,
                      }}
                    >
                      <Icon name="minus" size={16} color={tot.opponentCount === 0 ? '#475569' : tot.color} />
                    </TouchableOpacity>
                  )}

                  <Text className="text-white text-xl font-bold min-w-[32px] text-center">
                    {tot.opponentCount}
                  </Text>

                  {/* Botão Incrementar Adversário */}
                  {matchId && teamId && (
                    <TouchableOpacity
                      onPress={() => handleIncrement(tot.id, true)}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${tot.color}15` }}
                    >
                      <Icon name="plus" size={16} color={tot.color} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
