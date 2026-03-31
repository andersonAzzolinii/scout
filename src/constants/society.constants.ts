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
  background: '#2b5a2b',  // Verde mais escuro para Society
  lines: '#ffffff',
  lineWidth: 2.5,
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
