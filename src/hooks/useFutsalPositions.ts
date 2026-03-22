import { useCallback, useMemo } from 'react';
import { SVG_WIDTH, SVG_HEIGHT, FIXED_POSITIONS } from '@/constants/futsal.constants';
import type { PlayerPosition, ScreenCoordinates } from '@/types/futsal.types';

interface UseFutsalPositionsProps {
  courtWidth: number;
  courtHeight: number;
  positionedPlayers: PlayerPosition[];
}

/**
 * Custom hook for managing futsal court positions and coordinate calculations
 */
export function useFutsalPositions({
  courtWidth,
  courtHeight,
  positionedPlayers,
}: UseFutsalPositionsProps) {
  
  /**
   * Convert percentage-based coordinates to screen coordinates
   */
  const getScreenCoords = useCallback(
    (xPercent: number, yPercent: number): ScreenCoordinates => {
      const svgX = (xPercent / 100) * SVG_WIDTH;
      const svgY = (yPercent / 100) * SVG_HEIGHT;
      const screenX = (svgX / SVG_WIDTH) * courtWidth;
      const screenY = (svgY / SVG_HEIGHT) * courtHeight;
      return { screenX, screenY };
    },
    [courtWidth, courtHeight]
  );

  /**
   * Get player at a specific position
   */
  const getPlayerAtPosition = useCallback(
    (position: number) => {
      return positionedPlayers.find((p) => p.position === position);
    },
    [positionedPlayers]
  );

  /**
   * Check if position is occupied
   */
  const isPositionOccupied = useCallback(
    (position: number) => {
      return positionedPlayers.some((p) => p.position === position);
    },
    [positionedPlayers]
  );

  /**
   * Get all available positions (not occupied)
   */
  const availablePositions = useMemo(() => {
    return [1, 2, 3, 4, 5].filter((pos) => !isPositionOccupied(pos));
  }, [isPositionOccupied]);

  /**
   * Get screen coordinates for a position number
   */
  const getPositionCoords = useCallback(
    (position: number): ScreenCoordinates => {
      const pos = FIXED_POSITIONS[position];
      return getScreenCoords(pos.xPercent, pos.yPercent);
    },
    [getScreenCoords]
  );

  return {
    getScreenCoords,
    getPlayerAtPosition,
    isPositionOccupied,
    availablePositions,
    getPositionCoords,
  };
}
