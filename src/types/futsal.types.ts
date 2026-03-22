/**
 * Futsal-specific types and interfaces
 */

export interface PlayerPosition {
  player: any;
  position: number; // 1-5
}

export interface PositionCoordinates {
  xPercent: number;
  yPercent: number;
  label: string;
}

export interface ScreenCoordinates {
  screenX: number;
  screenY: number;
}

export interface PositionSlot {
  position: number;
  screenX: number;
  screenY: number;
}

export type PositionNumber = 1 | 2 | 3 | 4 | 5;

export enum PositionLabel {
  GOLEIRO = 'GOL',
  FIXO = 'FIX',
  ALA = 'ALA',
  PIVO = 'PIV',
}
