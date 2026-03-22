import type { PositionCoordinates } from '@/types/futsal.types';

/**
 * SVG viewBox dimensions
 */
export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 600;
export const SVG_ASPECT_RATIO = 2 / 3; // vertical rectangle (2:3)

/**
 * Court visual constants
 */
export const COURT_COLORS = {
  background: '#2b2b2b',
  lines: '#ffffff',
  lineWidth: 2.5,
} as const;

/**
 * Fixed tactical positions on the court (percentage-based for responsiveness)
 */
export const FIXED_POSITIONS: Record<number, PositionCoordinates> = {
  1: { xPercent: 50, yPercent: 90.83, label: 'GOL' },    // Goleiro (quase dentro da goleira)
  2: { xPercent: 50, yPercent: 70.83, label: 'FIX' },    // Fixo (centralizado)
  3: { xPercent: 22.5, yPercent: 50, label: 'ALA' },     // Ala esquerda
  4: { xPercent: 77.5, yPercent: 50, label: 'ALA' },     // Ala direita
  5: { xPercent: 50, yPercent: 28.33, label: 'PIV' },    // Pivô (mais à frente)
} as const;

/**
 * Position button styling
 */
export const POSITION_BUTTON = {
  size: 50,
  radius: 25,
  colors: {
    empty: 'rgba(239, 68, 68, 0.85)',      // red
    occupied: 'rgba(59, 130, 246, 0.95)',  // blue
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
 * Bench panel dimensions
 */
export const BENCH_PANEL = {
  collapsedHeight: 110,
  expandedHeight: 220,
  animationDuration: 200,
  overlayOpacity: 0.7,
} as const;
