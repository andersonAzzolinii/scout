import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CourtSVG } from './CourtSVG';
import { PositionButton } from './PositionButton';
import { useFutsalPositions } from '@/hooks/useFutsalPositions';
import { SVG_ASPECT_RATIO, FIXED_POSITIONS } from '@/constants/futsal.constants';
import type { PlayerPosition } from '@/types/futsal.types';

interface FutsalCourtProps {
  width: number;
  positionedPlayers?: PlayerPosition[];
  onPositionPress?: (position: number, screenX: number, screenY: number) => void;
}

/**
 * Main futsal court component with SVG rendering and position buttons
 */
export function FutsalCourt({
  width,
  positionedPlayers = [],
  onPositionPress,
}: FutsalCourtProps) {
  const height = useMemo(() => width / SVG_ASPECT_RATIO, [width]);

  const { getScreenCoords, getPlayerAtPosition } = useFutsalPositions({
    courtWidth: width,
    courtHeight: height,
    positionedPlayers,
  });

  const positions = [1, 2, 3, 4, 5] as const;

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
          />
        );
      })}
    </View>
  );
}
