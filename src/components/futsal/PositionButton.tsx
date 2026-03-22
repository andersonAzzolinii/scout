import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
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
  const { size, sizeOccupied, radius, colors, shadow } = POSITION_BUTTON;
  const currentSize = isOccupied ? sizeOccupied : size;
  const halfSize = currentSize / 2;

  return (
    <TouchableOpacity
      onPress={(e) => {
        const { pageX, pageY } = e.nativeEvent;
        onPress(position, pageX, pageY);
      }}
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
      {isOccupied ? (
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
      ) : (
        <PlayerAvatar 
          photoUri={null}
          playerNumber={0}
          size={currentSize}
          forceJersey={true}
        />
      )}
    </TouchableOpacity>
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
});
