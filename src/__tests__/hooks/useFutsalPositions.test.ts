/**
 * Tests for futsal positions logic — coordinate calculations and position management.
 * Tests the pure calculation logic without requiring React Native runtime.
 */
import { SVG_WIDTH, SVG_HEIGHT, FIXED_POSITIONS } from '@/constants/futsal.constants';
import type { PlayerPosition } from '@/types/futsal.types';
import { mockMatchPlayers } from '../mocks/mockData';

// Re-implement hook logic as pure functions for unit testing
function getScreenCoords(
  xPercent: number, yPercent: number,
  courtWidth: number, courtHeight: number
) {
  const svgX = (xPercent / 100) * SVG_WIDTH;
  const svgY = (yPercent / 100) * SVG_HEIGHT;
  const screenX = (svgX / SVG_WIDTH) * courtWidth;
  const screenY = (svgY / SVG_HEIGHT) * courtHeight;
  return { screenX, screenY };
}

function getPlayerAtPosition(positionedPlayers: PlayerPosition[], position: number) {
  return positionedPlayers.find((p) => p.position === position);
}

function isPositionOccupied(positionedPlayers: PlayerPosition[], position: number) {
  return positionedPlayers.some((p) => p.position === position);
}

function getAvailablePositions(positionedPlayers: PlayerPosition[]) {
  return [1, 2, 3, 4, 5].filter((pos) => !isPositionOccupied(positionedPlayers, pos));
}

function getPositionCoords(position: number, courtWidth: number, courtHeight: number) {
  const pos = FIXED_POSITIONS[position];
  return getScreenCoords(pos.xPercent, pos.yPercent, courtWidth, courtHeight);
}

describe('Futsal Positions Logic', () => {
  const courtWidth = 400;
  const courtHeight = 600;

  const positionedPlayers: PlayerPosition[] = [
    { player: mockMatchPlayers[0], position: 1 },
    { player: mockMatchPlayers[1], position: 2 },
    { player: mockMatchPlayers[2], position: 3 },
  ];

  describe('getScreenCoords', () => {
    it('should convert percentage coords to screen coords', () => {
      const coords = getScreenCoords(50, 50, courtWidth, courtHeight);
      expect(coords.screenX).toBeCloseTo(200, 1);
      expect(coords.screenY).toBeCloseTo(300, 1);
    });

    it('should handle edge coords (0,0)', () => {
      const coords = getScreenCoords(0, 0, courtWidth, courtHeight);
      expect(coords.screenX).toBe(0);
      expect(coords.screenY).toBe(0);
    });

    it('should handle edge coords (100,100)', () => {
      const coords = getScreenCoords(100, 100, courtWidth, courtHeight);
      expect(coords.screenX).toBeCloseTo(courtWidth, 1);
      expect(coords.screenY).toBeCloseTo(courtHeight, 1);
    });

    it('should scale correctly for different court sizes', () => {
      const small = getScreenCoords(50, 50, 200, 300);
      const large = getScreenCoords(50, 50, 800, 1200);
      expect(large.screenX).toBe(small.screenX * 4);
      expect(large.screenY).toBe(small.screenY * 4);
    });
  });

  describe('getPlayerAtPosition', () => {
    it('should get player at occupied position', () => {
      const player = getPlayerAtPosition(positionedPlayers, 1);
      expect(player).toBeDefined();
      expect(player?.player.id).toBe(mockMatchPlayers[0].id);
    });

    it('should return undefined for empty position', () => {
      const player = getPlayerAtPosition(positionedPlayers, 5);
      expect(player).toBeUndefined();
    });
  });

  describe('isPositionOccupied', () => {
    it('should return true for occupied positions', () => {
      expect(isPositionOccupied(positionedPlayers, 1)).toBe(true);
      expect(isPositionOccupied(positionedPlayers, 2)).toBe(true);
      expect(isPositionOccupied(positionedPlayers, 3)).toBe(true);
    });

    it('should return false for empty positions', () => {
      expect(isPositionOccupied(positionedPlayers, 4)).toBe(false);
      expect(isPositionOccupied(positionedPlayers, 5)).toBe(false);
    });
  });

  describe('getAvailablePositions', () => {
    it('should list unoccupied positions', () => {
      expect(getAvailablePositions(positionedPlayers)).toEqual([4, 5]);
    });

    it('should return empty when all 5 are occupied', () => {
      const allOccupied: PlayerPosition[] = mockMatchPlayers.slice(0, 5).map((p, i) => ({
        player: p,
        position: i + 1,
      }));
      expect(getAvailablePositions(allOccupied)).toHaveLength(0);
    });

    it('should return all 5 when none are occupied', () => {
      expect(getAvailablePositions([])).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('getPositionCoords', () => {
    it('should return valid screen coordinates for all 5 positions', () => {
      for (let pos = 1; pos <= 5; pos++) {
        const coords = getPositionCoords(pos, courtWidth, courtHeight);
        expect(coords.screenX).toBeGreaterThanOrEqual(0);
        expect(coords.screenX).toBeLessThanOrEqual(courtWidth);
        expect(coords.screenY).toBeGreaterThanOrEqual(0);
        expect(coords.screenY).toBeLessThanOrEqual(courtHeight);
      }
    });

    it('GOL should be near the bottom of the court', () => {
      const gol = getPositionCoords(1, courtWidth, courtHeight);
      expect(gol.screenY).toBeGreaterThan(courtHeight * 0.7);
    });

    it('PIV should be near the top of the court', () => {
      const piv = getPositionCoords(5, courtWidth, courtHeight);
      expect(piv.screenY).toBeLessThan(courtHeight * 0.3);
    });

    it('GOL should be centered horizontally', () => {
      const gol = getPositionCoords(1, courtWidth, courtHeight);
      expect(gol.screenX).toBeCloseTo(courtWidth / 2, 0);
    });

    it('ALA positions should be symmetrical', () => {
      const alaLeft = getPositionCoords(3, courtWidth, courtHeight);
      const alaRight = getPositionCoords(4, courtWidth, courtHeight);
      const center = courtWidth / 2;
      expect(center - alaLeft.screenX).toBeCloseTo(alaRight.screenX - center, 1);
    });
  });
});
