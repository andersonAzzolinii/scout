import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import type { MatchEvent } from '@/types';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface BenchPlayerCardProps {
  playerName: string | null | undefined;
  playerNumber: number | null | undefined;
  photoUri: string | null | undefined;
  onPress: () => void;
  isSelected?: boolean;
  expanded?: boolean;
  // Para modo com eventos (Campo)
  playerEvents?: MatchEvent[];
  // Para modo com timer de banco (Futsal/Society)
  benchStartTs?: number;
  pausedElapsed?: number;
  isTimerRunning?: boolean;
}

export function BenchPlayerCard({ 
  playerName, 
  playerNumber, 
  photoUri, 
  onPress, 
  isSelected, 
  expanded,
  playerEvents = [],
  benchStartTs,
  pausedElapsed,
  isTimerRunning = false,
}: BenchPlayerCardProps) {
  // Modo com eventos (usado em Campo)
  const hasEventsMode = playerEvents.length > 0 || (playerEvents && !benchStartTs);
  
  // Calcular eventos
  const negativeCount = playerEvents.filter(e => !e.is_positive).length;
  const positiveCount = playerEvents.filter(e => e.is_positive).length;
  const yellowCards = playerEvents.filter(e => e.event_id === 'cartao_amarelo' || e.event_name?.toLowerCase().includes('amarelo')).length;
  const redCards = playerEvents.filter(e => e.event_id === 'cartao_vermelho' || e.event_name?.toLowerCase().includes('vermelho')).length;

  // Calcular tempo de banco (usado em Futsal/Society)
  const isOnBench = !!benchStartTs;
  let benchTime = 0;
  if (isOnBench) {
    if (!isTimerRunning && pausedElapsed !== undefined) {
      benchTime = pausedElapsed;
    } else if (isTimerRunning) {
      benchTime = Math.floor((Date.now() - benchStartTs!) / 1000);
    }
  }
  const minutes = Math.floor(benchTime / 60);
  const seconds = benchTime % 60;

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          borderRadius: 10,
          padding: 8,
          alignItems: 'center',
          backgroundColor: 'rgba(55,65,81,0.5)',
          width: expanded ? 100 : 110,
          borderWidth: 2,
          borderColor: isSelected ? '#818cf8' : 'transparent',
        }}
      >
        <View style={{ position: 'relative' }}>
          <PlayerAvatar
            photoUri={photoUri}
            playerNumber={playerNumber ?? 0}
            size={64}
          />
          {/* Badges de eventos (modo Campo) */}
          {hasEventsMode && negativeCount > 0 && (
            <View style={{ position: 'absolute', top: -4, left: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{negativeCount}</Text>
            </View>
          )}
          {hasEventsMode && positiveCount > 0 && (
            <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{positiveCount}</Text>
            </View>
          )}
        </View>

        {/* Cartões (modo Campo) */}
        {hasEventsMode && (yellowCards > 0 || redCards > 0) && (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, alignItems: 'center' }}>
            {yellowCards > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <View style={{ width: 10, height: 14, backgroundColor: '#eab308', borderRadius: 2, borderWidth: 1, borderColor: '#fbbf24' }} />
                {yellowCards > 1 && <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '800' }}>×{yellowCards}</Text>}
              </View>
            )}
            {redCards > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <View style={{ width: 10, height: 14, backgroundColor: '#ef4444', borderRadius: 2, borderWidth: 1, borderColor: '#f87171' }} />
                {redCards > 1 && <Text style={{ color: '#f87171', fontSize: 9, fontWeight: '800' }}>×{redCards}</Text>}
              </View>
            )}
          </View>
        )}

        {/* Nome do jogador */}
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 4 }} numberOfLines={1}>
          {hasEventsMode 
            ? (playerName ?? 'Sem nome')
            : (playerName ?? 'Sem nome').split(' ')[0]
          }
        </Text>

        {/* Timer de banco (modo Futsal/Society) */}
        {!hasEventsMode && (
          <View style={{ marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: isOnBench ? '#d97706' : 'transparent', minWidth: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: isOnBench ? '#ffffff' : 'transparent' }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface BenchPanelProps {
  availablePlayers: Array<{
    player_id: string;
    player_name?: string | null;
    player_number?: number | null;
    photo_uri?: string | null;
  }>;
  selectedPlayerFromBench: {
    player_id: string;
    player_name?: string | null;
    player_number?: number | null;
  } | null;
  showEventsModal: boolean;
  onPlayerClick: (player: any) => void;
  onCancelSelection: () => void;
  // Para modo com eventos (Campo)
  getPlayerEvents?: (playerId: string) => MatchEvent[];
  // Para modo com timer de banco (Futsal/Society)
  getBenchStartTs?: (playerId: string) => number | undefined;
  getPausedElapsed?: (playerId: string) => number | undefined;
  isTimerRunning?: boolean;
}

export function BenchPanel({
  availablePlayers,
  selectedPlayerFromBench,
  showEventsModal,
  onPlayerClick,
  onCancelSelection,
  getPlayerEvents,
  getBenchStartTs,
  getPausedElapsed,
  isTimerRunning = false,
}: BenchPanelProps) {
  // Não renderizar se lista vazia ou se o modal de eventos estiver aberto
  if (availablePlayers.length === 0 || showEventsModal) {
    return null;
  }

  return (
    <View style={{ width: 112, borderRightWidth: 1, borderRightColor: '#1f2937', backgroundColor: '#0b1120' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
          RESERVAS
        </Text>
      </View>
      
      {selectedPlayerFromBench && (
        <View style={{ paddingHorizontal: 6, paddingBottom: 4 }}>
          <Text style={{ color: '#818cf8', fontSize: 9 }}>Toque na quadra para posicionar</Text>
          <TouchableOpacity
            onPress={onCancelSelection}
            style={{ marginTop: 2, backgroundColor: '#374151', borderRadius: 4, paddingVertical: 2, alignItems: 'center' }}
          >
            <Text style={{ color: '#d1d5db', fontSize: 9 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 6, gap: 6 }}>
        {availablePlayers.map((player) => (
          <BenchPlayerCard
            key={player.player_id}
            playerName={player.player_name}
            playerNumber={player.player_number}
            photoUri={player.photo_uri}
            onPress={() => onPlayerClick(player)}
            isSelected={selectedPlayerFromBench?.player_id === player.player_id}
            expanded={true}
            playerEvents={getPlayerEvents?.(player.player_id)}
            benchStartTs={getBenchStartTs?.(player.player_id)}
            pausedElapsed={getPausedElapsed?.(player.player_id)}
            isTimerRunning={isTimerRunning}
          />
        ))}
      </ScrollView>
    </View>
  );
}
