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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 6,
        alignItems: 'center',
        backgroundColor: isSelected 
          ? 'rgba(99, 102, 241, 0.25)' 
          : 'rgba(30, 41, 59, 0.9)',
        width: expanded ? 80 : 85,
        borderWidth: 2,
        borderColor: isSelected ? '#6366f1' : 'rgba(71, 85, 105, 0.6)',
        shadowColor: isSelected ? '#6366f1' : '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isSelected ? 0.4 : 0.25,
        shadowRadius: isSelected ? 8 : 6,
        elevation: isSelected ? 8 : 4,
        marginBottom: 4,
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <View style={{
          position: 'absolute',
          top: -1.5,
          left: -1.5,
          right: -1.5,
          bottom: -1.5,
          borderRadius: 13.5,
          borderWidth: 1.5,
          borderColor: 'rgba(99, 102, 241, 0.5)',
          zIndex: -1
        }} />
      )}

      {/* Avatar com badges */}
      <View style={{ position: 'relative', marginBottom: 5 }}>
        {/* Glow effect quando selecionado */}
        {isSelected && (
          <View style={{
            position: 'absolute',
            top: -3,
            left: -3,
            right: -3,
            bottom: -3,
            borderRadius: 26,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            zIndex: -1
          }} />
        )}
        
        {/* Ring decorativo */}
        <View style={{
          position: 'absolute',
          top: -3,
          left: -3,
          right: -3,
          bottom: -3,
          borderRadius: 25,
          borderWidth: 1.5,
          borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(71, 85, 105, 0.3)',
          zIndex: -1
        }} />
        
        <PlayerAvatar
          photoUri={photoUri}
          playerNumber={playerNumber ?? 0}
          size={48}
        />
        
        {/* Badges de eventos (modo Campo) - Redesenhados */}
        {hasEventsMode && negativeCount > 0 && (
          <View style={{ 
            position: 'absolute', 
            top: -5, 
            left: -5, 
            minWidth: 18, 
            height: 18, 
            borderRadius: 9, 
            backgroundColor: '#ef4444',
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingHorizontal: 3,
            borderWidth: 2,
            borderColor: '#1e293b',
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
            elevation: 6,
          }}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.2 }}>{negativeCount}</Text>
          </View>
        )}
        {hasEventsMode && positiveCount > 0 && (
          <View style={{ 
            position: 'absolute', 
            top: -5, 
            right: -5, 
            minWidth: 18, 
            height: 18, 
            borderRadius: 9, 
            backgroundColor: '#10b981',
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingHorizontal: 3,
            borderWidth: 2,
            borderColor: '#1e293b',
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
            elevation: 6,
          }}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.2 }}>{positiveCount}</Text>
          </View>
        )}
      </View>

      {/* Nome do jogador */}
      <Text 
        style={{ 
          color: isSelected ? '#e0e7ff' : '#e2e8f0', 
          fontSize: 9.5, 
          fontWeight: '700', 
          letterSpacing: 0.3,
          textAlign: 'center',
          marginBottom: 4,
          textShadowColor: 'rgba(0, 0, 0, 0.4)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        }} 
        numberOfLines={1}
      >
        {hasEventsMode 
          ? (playerName ?? 'Sem nome')
          : (playerName ?? 'Sem nome').split(' ')[0]
        }
      </Text>

      {/* Cartões (modo Campo) - Redesenhados */}
      {hasEventsMode && (yellowCards > 0 || redCards > 0) && (
        <View style={{ 
          flexDirection: 'row', 
          gap: 4, 
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'rgba(71, 85, 105, 0.5)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 2,
        }}>
          {yellowCards > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View style={{ 
                width: 11, 
                height: 14, 
                backgroundColor: '#fbbf24', 
                borderRadius: 2, 
                shadowColor: '#fbbf24',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
                elevation: 2,
                borderWidth: 0.5,
                borderColor: '#fcd34d'
              }} />
              {yellowCards > 1 && (
                <Text style={{ 
                  color: '#fbbf24', 
                  fontSize: 9, 
                  fontWeight: '900',
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1,
                }}>
                  ×{yellowCards}
                </Text>
              )}
            </View>
          )}
          {redCards > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View style={{ 
                width: 11, 
                height: 14, 
                backgroundColor: '#ef4444', 
                borderRadius: 2,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
                elevation: 2,
                borderWidth: 0.5,
                borderColor: '#f87171'
              }} />
              {redCards > 1 && (
                <Text style={{ 
                  color: '#ef4444', 
                  fontSize: 9, 
                  fontWeight: '900',
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1,
                }}>
                  ×{redCards}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Timer de banco (modo Futsal/Society) - Redesenhado */}
      {!hasEventsMode && isOnBench && (
        <View style={{ 
          paddingHorizontal: 6, 
          paddingVertical: 3, 
          borderRadius: 8, 
          backgroundColor: 'rgba(234, 88, 12, 0.25)',
          borderWidth: 1.5,
          borderColor: '#ea580c',
          shadowColor: '#ea580c',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 4,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2
          }}>
            <Icon name="clock-outline" size={9} color="#fb923c" />
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'monospace', 
              fontWeight: '900', 
              color: '#fb923c',
              letterSpacing: 0.8,
              textShadowColor: 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 1,
            }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
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
  onClose?: () => void;
  // Para modo com eventos (Campo)
  getPlayerEvents?: (playerId: string) => MatchEvent[];
  // Para modo com timer de banco (Futsal/Society)
  getBenchStartTs?: (playerId: string) => number | undefined;
  getPausedElapsed?: (playerId: string) => number | undefined;
  isTimerRunning?: boolean;
  // Layout
  orientation?: 'vertical' | 'horizontal';
}

export function BenchPanel({
  availablePlayers,
  selectedPlayerFromBench,
  showEventsModal,
  onPlayerClick,
  onCancelSelection,
  onClose,
  getPlayerEvents,
  getBenchStartTs,
  getPausedElapsed,
  isTimerRunning = false,
  orientation = 'vertical',
}: BenchPanelProps) {
  // Não renderizar se lista vazia ou se o modal de eventos estiver aberto
  if (availablePlayers.length === 0 || showEventsModal) {
    return null;
  }

  // Layout horizontal (embaixo da quadra)
  if (orientation === 'horizontal') {
    return (
      <View style={{ 
        backgroundColor: 'rgba(10, 13, 20, 0.98)',
        borderTopWidth: 2,
        borderTopColor: 'rgba(99, 102, 241, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
      }}>
        {/* Header com gradiente */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingHorizontal: 14, 
          paddingTop: 8, 
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(71, 85, 105, 0.3)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(99, 102, 241, 0.4)'
            }}>
              <Icon name="account-multiple" size={16} color="#818cf8" />
            </View>
            <View>
              <Text style={{ 
                color: '#e2e8f0', 
                fontSize: 12, 
                fontWeight: '800', 
                letterSpacing: 0.6,
                textTransform: 'uppercase'
              }}>
                Reservas
              </Text>
              <Text style={{ 
                color: '#64748b', 
                fontSize: 9, 
                fontWeight: '600',
                marginTop: 1
              }}>
                {availablePlayers.length} {availablePlayers.length === 1 ? 'jogador' : 'jogadores'}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {selectedPlayerFromBench && (
              <TouchableOpacity
                onPress={onCancelSelection}
                activeOpacity={0.7}
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                  borderRadius: 8, 
                  paddingHorizontal: 10, 
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Icon name="close-circle" size={13} color="#f87171" />
                <Text style={{ color: '#fca5a5', fontSize: 10, fontWeight: '700' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            )}
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{ 
                  padding: 5,
                  backgroundColor: 'rgba(71, 85, 105, 0.3)',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(100, 116, 139, 0.5)'
                }}
              >
                <Icon name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Indicador de jogador selecionado */}
        {selectedPlayerFromBench && (
          <View style={{ 
            paddingHorizontal: 14, 
            paddingVertical: 5,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(99, 102, 241, 0.2)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
          }}>
            <Icon name="information" size={13} color="#818cf8" />
            <Text style={{ 
              color: '#c7d2fe', 
              fontSize: 9.5,
              fontWeight: '600',
              flex: 1
            }}>
              #{selectedPlayerFromBench.player_number} {selectedPlayerFromBench.player_name}
            </Text>
            <View style={{
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 5
            }}>
              <Text style={{ color: '#a5b4fc', fontSize: 8, fontWeight: '700' }}>
                Toque na quadra
              </Text>
            </View>
          </View>
        )}

        {/* Lista de jogadores com scroll horizontal */}
        <View style={{
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          paddingVertical: 2,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ 
              paddingHorizontal: 14, 
              paddingVertical: 8, 
              gap: 12
            }}
            style={{
              backgroundColor: 'transparent'
            }}
          >
            {availablePlayers.map((player, index) => (
              <View key={player.player_id}>
                <BenchPlayerCard
                  playerName={player.player_name}
                  playerNumber={player.player_number}
                  photoUri={player.photo_uri}
                  onPress={() => onPlayerClick(player)}
                  isSelected={selectedPlayerFromBench?.player_id === player.player_id}
                  expanded={false}
                  playerEvents={getPlayerEvents?.(player.player_id)}
                  benchStartTs={getBenchStartTs?.(player.player_id)}
                  pausedElapsed={getPausedElapsed?.(player.player_id)}
                  isTimerRunning={isTimerRunning}
                />
                {/* Separador entre cards */}
                {index < availablePlayers.length - 1 && (
                  <View style={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    width: 1,
                    height: 60,
                    backgroundColor: 'rgba(71, 85, 105, 0.25)',
                    transform: [{ translateY: -30 }]
                  }} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Layout vertical (lateral - legado)
  return (
    <View style={{ 
      width: 120, 
      backgroundColor: 'rgba(10, 13, 20, 0.95)',
      borderRightWidth: 2,
      borderRightColor: 'rgba(99, 102, 241, 0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 10, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(71, 85, 105, 0.3)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)'
      }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: 'rgba(99, 102, 241, 0.4)',
          marginBottom: 6
        }}>
          <Icon name="account-multiple" size={18} color="#818cf8" />
        </View>
        <Text style={{ 
          color: '#e2e8f0', 
          fontSize: 11, 
          fontWeight: '800', 
          letterSpacing: 0.5,
          textTransform: 'uppercase'
        }}>
          Reservas
        </Text>
        <Text style={{ 
          color: '#64748b', 
          fontSize: 9, 
          fontWeight: '600',
          marginTop: 2
        }}>
          {availablePlayers.length} {availablePlayers.length === 1 ? 'jogador' : 'jogadores'}
        </Text>
      </View>
      
      {selectedPlayerFromBench && (
        <View style={{ 
          paddingHorizontal: 8, 
          paddingVertical: 8,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(99, 102, 241, 0.2)'
        }}>
          <Text style={{ color: '#c7d2fe', fontSize: 9, fontWeight: '600', textAlign: 'center' }}>
            Toque na quadra
          </Text>
          <TouchableOpacity
            onPress={onCancelSelection}
            activeOpacity={0.7}
            style={{ 
              marginTop: 6, 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              borderRadius: 8, 
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Icon name="close" size={12} color="#f87171" />
            <Text style={{ color: '#fca5a5', fontSize: 9, fontWeight: '700' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 8, gap: 10 }}
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
      >
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
