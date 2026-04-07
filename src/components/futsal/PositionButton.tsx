import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { POSITION_BUTTON } from '@/constants/futsal.constants';
import type { PlayerPosition } from '@/types/futsal.types';
import type { MatchEvent } from '@/types';

interface PositionButtonProps {
  position: number;
  screenX: number;
  screenY: number;
  player?: PlayerPosition['player'];
  onPress: (position: number, ref: React.RefObject<View | null>) => void;
  onPlayerPress?: (player: PlayerPosition['player']) => void;
  onPlayerLongPress?: (player: PlayerPosition['player']) => void;
  isSelected?: boolean;
  isSelectedForSwap?: boolean;
  playerEvents?: MatchEvent[];
  fieldStartTs?: number;
  isTimerRunning?: boolean;
}

/**
 * Individual position button on the futsal court
 */
export function PositionButton({
  position,
  screenX,
  screenY,
  player,
  onPress,
  onPlayerPress,
  onPlayerLongPress,
  isSelected = false,
  isSelectedForSwap = false,
  playerEvents = [],
  fieldStartTs,
  isTimerRunning = false,
}: PositionButtonProps) {
  const buttonRef = useRef<View>(null);
  const isOccupied = !!player;
  const { width: screenWidth } = useWindowDimensions();
  // Scale up on larger screens (min 45 on ~390px phone, grows proportionally)
  const baseSize = POSITION_BUTTON.size;
  const scaleFactor = Math.max(1, Math.min(screenWidth / 390, 1.6));
  const currentSize = Math.round(baseSize * scaleFactor);
  const halfSize = currentSize / 2;

  // Freeze elapsed when timer pauses; resume live calc when running
  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(null);
  useEffect(() => {
    if (!isTimerRunning && fieldStartTs) {
      setFrozenElapsed(Math.floor((Date.now() - fieldStartTs) / 1000));
    } else if (isTimerRunning) {
      setFrozenElapsed(null);
    }
  }, [isTimerRunning, fieldStartTs]);

  // Tick to re-render timer every second (only when running)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fieldStartTs || !isTimerRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [fieldStartTs, isTimerRunning]);

  const fieldElapsed = !isTimerRunning && frozenElapsed !== null
    ? frozenElapsed
    : fieldStartTs ? Math.floor((Date.now() - fieldStartTs) / 1000) : 0;
  const fieldMinutes = Math.floor(fieldElapsed / 60);
  const fieldSeconds = fieldElapsed % 60;

  const filteredEvents = playerEvents;

  // Group events by type
  const eventGroups = React.useMemo(() => {
    const groups = new Map<string, { icon: string; count: number; isPositive: boolean; name: string }>();
    
    filteredEvents.forEach(event => {
      const key = event.event_id;
      const existing = groups.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, {
          icon: event.event_icon || 'circle',
          count: 1,
          isPositive: event.is_positive || false,
          name: event.event_name || '',
        });
      }
    });
    
    return Array.from(groups.values());
  }, [filteredEvents]);
  const negativeEventsCount = eventGroups
    .filter(group => !group.isPositive)
    .reduce((sum, group) => sum + group.count, 0);
  const positiveEventsCount = eventGroups
    .filter(group => group.isPositive)
    .reduce((sum, group) => sum + group.count, 0);

  // Count cards
  const yellowCards = filteredEvents.filter(e => {
    return e.event_id === 'cartao_amarelo' || e.event_name?.toLowerCase().includes('amarelo');
  }).length;
  const redCards = filteredEvents.filter(e => {
    return e.event_id === 'cartao_vermelho' || e.event_name?.toLowerCase().includes('vermelho');
  }).length;

  // Debug log apenas quando houver cartões
  React.useEffect(() => {
    if ((yellowCards > 0 || redCards > 0) && player) {
      console.log(`[CARDS] ${player.player_name}: ${yellowCards} amarelo(s), ${redCards} vermelho(s)`);
    }
  }, [yellowCards, redCards, player]);

  const handlePress = () => {
    if (isOccupied && onPlayerPress && player) {
      onPlayerPress(player);
    } else {
      onPress(position, buttonRef);
    }
  };

  const handleLongPress = () => {
    if (isOccupied && onPlayerLongPress && player) {
      onPlayerLongPress(player);
    }
  };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[
          styles.button,
          {
            left: screenX - halfSize,
            top: screenY - halfSize,
            width: currentSize,
            height: currentSize,
          },
        ]}
      >
        {isOccupied && player ? (
          <View style={styles.avatarContainer}>
            <View style={{ width: currentSize, height: currentSize, alignItems: 'center', justifyContent: 'center' }}>
              <PlayerAvatar
                photoUri={player.photo_uri}
                playerNumber={player.player_number ?? 0}
                size={currentSize}
                isSelected={isSelected}
                isSelectedForSwap={isSelectedForSwap}
              />
              {negativeEventsCount > 0 && (
                <View style={{ position: 'absolute', top: -4, left: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#ffffff' }}>
                  <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '700' }}>{negativeEventsCount}</Text>
                </View>
              )}
              {positiveEventsCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#ffffff' }}>
                  <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '700' }}>{positiveEventsCount}</Text>
                </View>
              )}
            </View>
            {fieldStartTs != null && (
              <View style={{ backgroundColor: '#15803d', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 3 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' }}>
                  {fieldMinutes}:{fieldSeconds.toString().padStart(2, '0')}
                </Text>
              </View>
            )}
            {/* Card badges */}
            {(yellowCards > 0 || redCards > 0) && (
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 3, alignItems: 'center' }}>
                {yellowCards > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <View style={{ width: 12, height: 16, backgroundColor: '#eab308', borderRadius: 2, borderWidth: 1, borderColor: '#fbbf24', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2, elevation: 3 }} />
                    {yellowCards > 1 && (
                      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' }}>×{yellowCards}</Text>
                    )}
                  </View>
                )}
                {redCards > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <View style={{ width: 12, height: 16, backgroundColor: '#ef4444', borderRadius: 2, borderWidth: 1, borderColor: '#f87171', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2, elevation: 3 }} />
                    {redCards > 1 && (
                      <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' }}>×{redCards}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
            <Text style={styles.playerName} numberOfLines={1}>
              {player.player_name ?? 'Sem nome'}
            </Text>
          </View>
        ) : (
          <PlayerAvatar
            photoUri={null}
            playerNumber={0}
            size={currentSize}
            forceJersey={true}
            isSelected={isSelected}
          />
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 3,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventBadgesContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  eventBadgeCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
