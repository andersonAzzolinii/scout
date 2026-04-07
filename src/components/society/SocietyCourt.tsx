import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CourtSVG } from './CourtSVG';
import { PositionButton } from '../futsal/PositionButton';
import { useFutsalPositions } from '@/hooks/useFutsalPositions';
import { SVG_ASPECT_RATIO, FIXED_POSITIONS } from '@/constants/society.constants';
import type { PlayerPosition } from '@/types/futsal.types';
import type { MatchEvent } from '@/types';

interface SocietyCourtProps {
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
 * Main society court component with SVG rendering and position buttons (7 players)
 */
export function SocietyCourt({
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
}: SocietyCourtProps) {
  const height = useMemo(() => width / SVG_ASPECT_RATIO, [width]);

  const { getScreenCoords, getPlayerAtPosition } = useFutsalPositions({
    courtWidth: width,
    courtHeight: height,
    positionedPlayers,
  });

  const positions = [1, 2, 3, 4, 5, 6, 7] as const;

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* Court SVG */}
      <CourtSVG width={width} height={height} />

      {/* Position buttons overlay */}
      {positions.map((position) => {
        const pos = FIXED_POSITIONS[position];
        const { screenX, screenY } = getScreenCoords(pos.xPercent, pos.yPercent);
        const player = getPlayerAtPosition(position);

        return (
          <PositionButton
            key={position}
            position={position}
            screenX={screenX}
            screenY={screenY}
            player={player?.player}
            onPress={onPositionPress || (() => {})}
            onPlayerPress={onPlayerPress}
            onPlayerLongPress={onPlayerLongPress}
            isSelected={showEventsModal && player?.player?.player_id === selectedPlayerId}
            isSelectedForSwap={player?.player?.player_id === selectedPlayerIdForSwap}
            playerEvents={player?.player ? getPlayerEvents?.(player.player.player_id) || [] : []}
            fieldStartTs={player?.player ? getFieldStartTs?.(player.player.player_id) : undefined}
            isTimerRunning={isTimerRunning}
          />
        );
      })}
    </View>
  );
}
