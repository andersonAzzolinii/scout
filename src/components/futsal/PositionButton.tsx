import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
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
  onPress: (position: number, screenX: number, screenY: number) => void;
  onPlayerPress?: (player: PlayerPosition['player']) => void;
  isSelected?: boolean;
  playerEvents?: MatchEvent[];
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
  isSelected = false,
  playerEvents = [],
}: PositionButtonProps) {
  const isOccupied = !!player;
  const { size, sizeOccupied, radius, colors, shadow } = POSITION_BUTTON;
  const currentSize = isOccupied ? sizeOccupied : size;
  const halfSize = currentSize / 2;
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Filter events for goalkeeper position (position 1)
  const filteredEvents = React.useMemo(() => {
    // If position is 1 (goalkeeper), filter to show only goalkeeper events
    if (position === 1) {
      return playerEvents.filter(event => event.category_id === 'goleiro');
    }
    
    // For all other positions, show all events
    return playerEvents;
  }, [position, playerEvents]);

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

  React.useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isSelected ? 1.08 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const handlePress = (e: any) => {
    const { pageX, pageY } = e.nativeEvent;
    
    if (isOccupied && onPlayerPress && player) {
      onPlayerPress(player);
    } else {
      onPress(position, pageX, pageY);
    }
  };

  return (
    <>
      {/* Glow effect overlay quando selecionado */}
      {isSelected && (
        <View
          style={{
            position: 'absolute',
            left: screenX - halfSize - 15,
            top: screenY - halfSize - 15,
            width: currentSize + 30,
            height: currentSize + 30,
            borderRadius: (currentSize + 30) / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            shadowColor: '#e5e7eb',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 18,
            elevation: 10,
          }}
        />
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            left: screenX - halfSize,
            top: screenY - halfSize,
            width: currentSize,
            height: currentSize,
            transform: [{ scale: scaleAnim }],
            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            borderRadius: currentSize / 2,
            borderWidth: isSelected ? 3 : 0,
            borderColor: '#f3f4f6',
            shadowColor: isSelected ? '#e5e7eb' : 'transparent',
            shadowOffset: { width: 0, height: isSelected ? 6 : 0 },
            shadowOpacity: isSelected ? 0.7 : 0,
            shadowRadius: isSelected ? 12 : 0,
            elevation: isSelected ? 12 : 0,
          },
        ]}
      >
      {isOccupied ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Negative events — left column */}
          <View style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-end', marginRight: 4, minWidth: 36 }}>
            {eventGroups.filter(g => !g.isPositive).map((group, idx) => (
              <View
                key={idx}
                style={[styles.eventBadge, { backgroundColor: '#dc2626' }]}
              >
                <Icon name={group.icon as any} size={12} color="#ffffff" />
                <Text style={styles.eventBadgeCount}>{group.count}</Text>
              </View>
            ))}
          </View>

          {/* Player avatar + name */}
          <View style={styles.avatarContainer}>
            <PlayerAvatar 
              photoUri={player.photo_uri}
              playerNumber={player.player_number ?? 0}
              size={144}
            />
            <Text style={styles.playerName} numberOfLines={1}>
              {(player.player_name ?? 'Sem nome').split(' ')[0]}
            </Text>
          </View>

          {/* Positive events — right column */}
          <View style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-start', marginLeft: 4, minWidth: 36 }}>
            {eventGroups.filter(g => g.isPositive).map((group, idx) => (
              <View
                key={idx}
                style={[styles.eventBadge, { backgroundColor: '#16a34a' }]}
              >
                <Icon name={group.icon as any} size={12} color="#ffffff" />
                <Text style={styles.eventBadgeCount}>{group.count}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <PlayerAvatar 
          photoUri={null}
          playerNumber={0}
          size={currentSize}
          forceJersey={true}
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
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
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
