import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { POSITION_BUTTON } from '@/constants/futsal.constants';
import type { PlayerPosition } from '@/types/futsal.types';

interface PositionButtonProps {
  position: number;
  screenX: number;
  screenY: number;
  player?: PlayerPosition['player'];
  onPress: (position: number, screenX: number, screenY: number) => void;
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
}: PositionButtonProps) {
  const isOccupied = !!player;
  const { size, radius, colors, shadow } = POSITION_BUTTON;

  return (
    <TouchableOpacity
      onPress={(e) => {
        const { pageX, pageY } = e.nativeEvent;
        onPress(position, pageX, pageY);
      }}
      style={[
        styles.button,
        {
          left: screenX - radius,
          top: screenY - radius,
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: isOccupied ? colors.occupied : colors.empty,
          borderColor: colors.border,
          shadowColor: shadow.color,
          shadowOffset: shadow.offset,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          elevation: shadow.elevation,
        },
      ]}
    >
      {isOccupied ? (
        <Text style={styles.playerNumber}>
          {player.player_number ?? '?'}
        </Text>
      ) : (
        <Text style={styles.plusSign}>+</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plusSign: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
