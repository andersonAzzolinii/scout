import React from 'react';
import { View, Text } from 'react-native';
import { FutsalCourt } from './futsal';
import { SocietyCourt } from './society';
import { CampoCourt } from './campo';
import type { SportType } from '@/types';
import type { PlayerPosition } from '@/types/futsal.types';
import type { MatchEvent } from '@/types';

interface CourtRendererProps {
  sportType: SportType;
  width: number;
  positionedPlayers?: PlayerPosition[];
  onPositionPress?: (position: number, ref: React.RefObject<View | null>) => void;
  onPlayerPress?: (player: PlayerPosition['player']) => void;
  onPlayerLongPress?: (player: PlayerPosition['player']) => void;
  selectedPlayerId?: string | null;
  selectedPlayerIdForSwap?: string | null;
  getPlayerEvents?: (playerId: string) => MatchEvent[];
  getFieldStartTs?: (playerId: string) => number | undefined;
  isTimerRunning?: boolean;
  showEventsModal?: boolean;
}

/**
 * Court renderer that dynamically selects the appropriate court component
 * based on the sport type (futsal, society, campo)
 */
export function CourtRenderer({
  sportType,
  width,
  positionedPlayers = [],
  onPositionPress,
  onPlayerPress,
  onPlayerLongPress,
  selectedPlayerId,
  selectedPlayerIdForSwap,
  getPlayerEvents,
  getFieldStartTs,
  isTimerRunning,
  showEventsModal = false,
}: CourtRendererProps) {
  // Props comuns para todos os tipos de quadra
  const commonProps = {
    width,
    positionedPlayers,
    onPositionPress,
    onPlayerPress,
    onPlayerLongPress,
    selectedPlayerId,
    selectedPlayerIdForSwap,
    getPlayerEvents,
    getFieldStartTs,
    isTimerRunning,
    showEventsModal,
  };

  switch (sportType) {
    case 'futsal':
      return <FutsalCourt {...commonProps} />;
    
    case 'society':
      return <SocietyCourt {...commonProps} />;
    
    case 'campo':
      return <CampoCourt {...commonProps} />;
    
    case 'all':
      // Para perfis universais, usar futsal como padrão
      return <FutsalCourt {...commonProps} />;
    
    default:
      return (
        <View style={{ width, height: width * 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937' }}>
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>
            Modalidade não suportada
          </Text>
        </View>
      );
  }
}
