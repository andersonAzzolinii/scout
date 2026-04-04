import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BenchPlayerCard } from './BenchPanel';
import type { MatchEvent } from '@/types';

interface SwapPanelPlayer {
  player_id: string;
  player_name?: string | null;
  player_number?: number | null;
  photo_uri?: string | null;
}

interface SwapPanelProps<T extends SwapPanelPlayer = SwapPanelPlayer> {
  players: T[];
  isTimerRunning: boolean;
  bottomInset: number;
  onSwap: (player: T) => void;
  onCancel: () => void;
  // Bench timer mode (Futsal/Society)
  getBenchStartTs?: (playerId: string) => number | undefined;
  getPausedElapsed?: (playerId: string) => number | undefined;
  // Events mode (Campo)
  getPlayerEvents?: (playerId: string) => MatchEvent[];
}

export function SwapPanel<T extends SwapPanelPlayer>({
  players,
  isTimerRunning,
  bottomInset,
  onSwap,
  onCancel,
  getBenchStartTs,
  getPausedElapsed,
  getPlayerEvents,
}: SwapPanelProps<T>) {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.97)', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: bottomInset + 16, zIndex: 50, borderTopWidth: 1, borderTopColor: !isTimerRunning ? '#fbbf24' : '#374151' }}>
      {/* Indicador de tempo pausado */}
      {!isTimerRunning && (
        <View style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
          <Icon name="pause-circle" size={14} color="#fbbf24" />
          <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '700' }}>TEMPO PAUSADO</Text>
        </View>
      )}
      <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
        Escolha quem entra
      </Text>
      {players.length === 0 ? (
        <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 13 }}>Nenhum reserva disponível</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {players.map(player => {
              const benchTs = getBenchStartTs?.(player.player_id);
              const pausedEl = getPausedElapsed?.(player.player_id);
              const hasBenchTimer = !!benchTs;
              let timeSec = 0;
              if (hasBenchTimer) {
                if (!isTimerRunning && pausedEl !== undefined) {
                  timeSec = pausedEl;
                } else if (isTimerRunning) {
                  timeSec = Math.floor((Date.now() - benchTs!) / 1000);
                }
              }
              const mm = Math.floor(timeSec / 60);
              const ss = timeSec % 60;

              return (
                <View key={player.player_id} style={{ alignItems: 'center' }}>
                  <BenchPlayerCard
                    playerName={player.player_name ?? null}
                    playerNumber={player.player_number ?? null}
                    photoUri={player.photo_uri ?? null}
                    onPress={() => onSwap(player)}
                    benchStartTs={benchTs}
                    pausedElapsed={pausedEl}
                    isTimerRunning={isTimerRunning}
                    playerEvents={getPlayerEvents?.(player.player_id)}
                  />
                  {/* Timer abaixo do card */}
                  {hasBenchTimer && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      marginTop: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: isTimerRunning ? 'rgba(217, 140, 50, 0.18)' : 'rgba(200, 130, 50, 0.10)',
                      borderWidth: 1,
                      borderColor: isTimerRunning ? 'rgba(230, 160, 70, 0.4)' : 'rgba(200, 130, 50, 0.25)',
                    }}>
                      <Icon name="clock-outline" size={10} color="#e0a56e" />
                      <Text style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        color: '#e0a56e',
                        letterSpacing: 0.5,
                      }}>
                        {mm}:{ss.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      <TouchableOpacity
        onPress={onCancel}
        style={{ marginTop: 12, alignSelf: 'stretch', backgroundColor: '#374151', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600' }}>Cancelar troca</Text>
      </TouchableOpacity>
    </View>
  );
}
