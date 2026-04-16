import React from 'react';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { COURT_COLORS, ZONE_COLORS, FIELD_ZONES } from '@/constants/campo.constants';

interface CourtSVGProps {
  width: number;
  height: number;
  showZones?: boolean;
}

/**
 * SVG representation of a campo field (grass field - 11 players)
 */
export function CourtSVG({ width, height, showZones = true }: CourtSVGProps) {
  const { background, lines, lineWidth } = COURT_COLORS;

  return (
    <Svg width={width} height={height} viewBox="0 0 400 600">
      {/* Background - verde gramado */}
      <Rect x="0" y="0" width="400" height="600" fill={background} />

      {/* Field zones - horizontal thirds */}
      {showZones && (
        <>
          {/* Offensive third (top) */}
          <Rect
            x="30"
            y="30"
            width="340"
            height="170"
            fill={ZONE_COLORS.OFFENSIVE.fill}
          />
          
          {/* Midfield third */}
          <Rect
            x="30"
            y="200"
            width="340"
            height="200"
            fill={ZONE_COLORS.MIDFIELD.fill}
          />
          
          {/* Defensive third (bottom) */}
          <Rect
            x="30"
            y="400"
            width="340"
            height="170"
            fill={ZONE_COLORS.DEFENSIVE.fill}
          />
          
          {/* Zone dividing lines */}
          <Line
            x1="30"
            y1="200"
            x2="370"
            y2="200"
            stroke={ZONE_COLORS.OFFENSIVE.stroke}
            strokeWidth="1.5"
            strokeDasharray="8,4"
          />
          <Line
            x1="30"
            y1="400"
            x2="370"
            y2="400"
            stroke={ZONE_COLORS.DEFENSIVE.stroke}
            strokeWidth="1.5"
            strokeDasharray="8,4"
          />
        </>
      )}

      {/* Outer boundary */}
      <Rect
        x="30"
        y="30"
        width="340"
        height="540"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Center line */}
      <Line x1="30" y1="300" x2="370" y2="300" stroke={lines} strokeWidth={lineWidth} />

      {/* Center circle */}
      <Circle cx="200" cy="300" r="70" fill="none" stroke={lines} strokeWidth={lineWidth} />

      {/* Center point */}
      <Circle cx="200" cy="300" r="3" fill={lines} />

      {/* Top penalty area (grande) */}
      <Rect
        x="80"
        y="30"
        width="240"
        height="110"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top small area */}
      <Rect
        x="140"
        y="30"
        width="120"
        height="45"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top goal */}
      <Rect
        x="160"
        y="15"
        width="80"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top penalty mark */}
      <Circle cx="200" cy="100" r="2.5" fill={lines} />

      {/* Top penalty arc */}
      <Path
        d="M 130 140 A 70 70 0 0 0 270 140"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom penalty area */}
      <Rect
        x="80"
        y="460"
        width="240"
        height="110"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom small area */}
      <Rect
        x="140"
        y="525"
        width="120"
        height="45"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom goal */}
      <Rect
        x="160"
        y="570"
        width="80"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom penalty mark */}
      <Circle cx="200" cy="500" r="2.5" fill={lines} />

      {/* Bottom penalty arc */}
      <Path
        d="M 130 460 A 70 70 0 0 1 270 460"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Corner arcs */}
      <Path
        d="M 30 48 A 18 18 0 0 1 48 30"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 352 30 A 18 18 0 0 1 370 48"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 48 570 A 18 18 0 0 1 30 552"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 370 552 A 18 18 0 0 1 352 570"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
    </Svg>
  );
}
