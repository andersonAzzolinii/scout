import React from 'react';
import { View, Text, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PlayerAvatarProps {
  photoUri?: string | null;
  playerNumber: number;
  size?: number;
  forceJersey?: boolean; // Force showing jersey instead of photo
}

/**
 * Reusable component to display player avatar
 * Shows photo if available, otherwise shows jersey icon with number
 */
export function PlayerAvatar({ 
  photoUri, 
  playerNumber, 
  size = 80,
  forceJersey = false 
}: PlayerAvatarProps) {
  // Show photo only if not forcing jersey and photo exists
  if (photoUri && !forceJersey) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  }

  // Jersey icon with number
  const numDigits = playerNumber.toString().length;
  
  // Adjust fontSize based on number of digits
  const getFontSize = () => {
    if (playerNumber === 0) return size * 0.4; // Larger for "+"
    if (numDigits <= 2) return size * 0.25;
    if (numDigits === 3) return size * 0.2;
    if (numDigits === 4) return size * 0.16;
    return size * 0.13; // 5+ digits
  };

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Icon name="tshirt-crew" size={size} color={playerNumber === 0 ? "#EF4444" : "#3B82F6"} />
      <Text
        style={{
          position: 'absolute',
          color: '#ffffff',
          fontSize: getFontSize(),
          fontWeight: 'bold',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {playerNumber === 0 ? '+' : playerNumber}
      </Text>
    </View>
  );
}
