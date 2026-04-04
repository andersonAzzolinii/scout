import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';

interface PlayerAvatarProps {
  photoUri?: string | null;
  playerNumber: number;
  size?: number;
  forceJersey?: boolean; // Force showing circle button instead of photo
  isSelected?: boolean; // Highlight when selected
}

/**
 * Reusable component to display player avatar
 * Shows photo if available, otherwise shows circular button with number
 */
export function PlayerAvatar({ 
  photoUri, 
  playerNumber, 
  size = 80,
  forceJersey = false,
  isSelected = false
}: PlayerAvatarProps) {
  // Pulsating animation for selected state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      // Start pulsating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
    }
  }, [isSelected, pulseAnim]);

  // Show photo only if not forcing circle and photo exists
  if (photoUri && !forceJersey) {
    return (
      <View style={{ position: 'relative' }}>
        {/* Pulsating outer ring when selected */}
        {isSelected && (
          <Animated.View
            style={{
              position: 'absolute',
              width: size + 16,
              height: size + 16,
              left: -8,
              top: -8,
              borderRadius: (size + 16) / 2,
              borderWidth: 3,
              borderColor: '#f97316',
              opacity: 0.6,
              transform: [{ scale: pulseAnim }],
            }}
          />
        )}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: isSelected ? '#f97316' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.8 : 0.3,
            shadowRadius: isSelected ? 10 : 4,
            elevation: isSelected ? 10 : 4,
          }}
        >
          <Image
            source={{ uri: photoUri }}
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: size / 2,
            }}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  // Circular button with number
  const numDigits = playerNumber.toString().length;
  
  // Adjust fontSize based on number of digits
  const getFontSize = () => {
    if (playerNumber === 0) return size * 0.35; // Larger for "+"
    if (numDigits <= 2) return size * 0.4;
    if (numDigits === 3) return size * 0.32;
    if (numDigits === 4) return size * 0.26;
    return size * 0.22; // 5+ digits
  };

  // Colors based on selection state
  const backgroundColor = isSelected 
    ? '#fb923c'  // orange-400 when selected
    : playerNumber === 0 
      ? 'rgba(31, 41, 55, 0.8)'  // gray-800 for empty position
      : 'rgba(31, 41, 55, 0.9)';  // gray-800 for occupied position

  return (
    <View style={{ position: 'relative' }}>
      {/* Pulsating outer ring when selected */}
      {isSelected && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 16,
            height: size + 16,
            left: -8,
            top: -8,
            borderRadius: (size + 16) / 2,
            borderWidth: 3,
            borderColor: '#f97316',
            opacity: 0.6,
            transform: [{ scale: pulseAnim }],
          }}
        />
      )}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: isSelected ? '#f97316' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.6 : 0.3,
          shadowRadius: isSelected ? 8 : 4,
          elevation: isSelected ? 8 : 4,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: getFontSize(),
            fontWeight: '800',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {playerNumber === 0 ? '+' : playerNumber}
        </Text>
      </View>
    </View>
  );
}
