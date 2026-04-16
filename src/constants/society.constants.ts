import type { PositionCoordinates } from '@/types/futsal.types';

/**
 * SVG viewBox dimensions for Society field (7 players)
 */
export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 600;
export const SVG_ASPECT_RATIO = 2 / 3;

/**
 * Court visual constants
 */
export const COURT_COLORS = {
  background: '#0d1f0d',  // Verde escuro profundo para Society
  lines: '#344d34',       // cinza esverdeado escuro
  lineWidth: 1.8,         // mais fino/sutil
} as const;

/**
 * Fixed tactical positions for Society (7 players - 1-3-3 formation)
 */
export const FIXED_POSITIONS: Record<number, PositionCoordinates> = {
  1: { xPercent: 50, yPercent: 85, label: 'GOL' },       // Goleiro
  2: { xPercent: 30, yPercent: 65, label: 'ZAG' },       // Zagueiro esquerdo
  3: { xPercent: 50, yPercent: 70, label: 'ZAG' },       // Zagueiro central (líbero)
  4: { xPercent: 70, yPercent: 65, label: 'ZAG' },       // Zagueiro direito
  5: { xPercent: 20, yPercent: 40, label: 'ATA' },       // Atacante esquerdo
  6: { xPercent: 50, yPercent: 35, label: 'ATA' },       // Atacante centro
  7: { xPercent: 80, yPercent: 40, label: 'ATA' },       // Atacante direito
} as const;

/**
 * Position button styling (same as futsal)
 */
export const POSITION_BUTTON = {
  size: 45,
  sizeOccupied: 123,
  radius: 22,
  colors: {
    empty: 'rgba(239, 68, 68, 0.85)',
    occupied: 'rgba(59, 130, 246, 0.95)',
    border: '#fff',
  },
  shadow: {
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.3,
    radius: 3,
    elevation: 5,
  },
} as const;

/**
 * Field zones - horizontal thirds (defensive, midfield, offensive)
 */
export type FieldZone = 'DEFENSIVE' | 'MIDFIELD' | 'OFFENSIVE';

export const FIELD_ZONES = {
  DEFENSIVE: {
    yMin: 66.67,
    yMax: 100,
    yCenter: 83.33,
    label: 'Terço Defensivo',
    shortLabel: 'Def',
  },
  MIDFIELD: {
    yMin: 33.33,
    yMax: 66.67,
    yCenter: 50,
    label: 'Meio-Campo',
    shortLabel: 'Meio',
  },
  OFFENSIVE: {
    yMin: 0,
    yMax: 33.33,
    yCenter: 16.67,
    label: 'Terço Ofensivo',
    shortLabel: 'Atq',
  },
} as const;

/**
 * Zone visual colors
 */
export const ZONE_COLORS = {
  DEFENSIVE: {
    fill: 'rgba(239, 68, 68, 0.15)',    // vermelho claro
    stroke: 'rgba(239, 68, 68, 0.4)',
    button: '#ef4444',
  },
  MIDFIELD: {
    fill: 'rgba(251, 191, 36, 0.15)',   // amarelo claro
    stroke: 'rgba(251, 191, 36, 0.4)',
    button: '#fbbf24',
  },
  OFFENSIVE: {
    fill: 'rgba(34, 197, 94, 0.15)',    // verde claro
    stroke: 'rgba(34, 197, 94, 0.4)',
    button: '#22c55e',
  },
} as const;

/**
 * Helper function to determine zone from Y coordinate percentage
 */
export function getZoneFromYPercent(y: number | null): FieldZone | null {
  if (y === null) return null;
  
  if (y >= FIELD_ZONES.DEFENSIVE.yMin) return 'DEFENSIVE';
  if (y >= FIELD_ZONES.MIDFIELD.yMin) return 'MIDFIELD';
  return 'OFFENSIVE';
}

/**
 * Get Y coordinate for zone center
 */
export function getYPercentFromZone(zone: FieldZone): number {
  return FIELD_ZONES[zone].yCenter;
}
