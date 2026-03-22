import React from 'react';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { COURT_COLORS } from '@/constants/futsal.constants';

interface CourtSVGProps {
  width: number;
  height: number;
}

/**
 * SVG representation of a futsal court
 */
export function CourtSVG({ width, height }: CourtSVGProps) {
  const { background, lines, lineWidth } = COURT_COLORS;

  return (
    <Svg width={width} height={height} viewBox="0 0 400 600">
      {/* Background */}
      <Rect x="0" y="0" width="400" height="600" fill={background} />

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
      <Circle cx="200" cy="300" r="50" fill="none" stroke={lines} strokeWidth={lineWidth} />

      {/* Center point */}
      <Circle cx="200" cy="300" r="3" fill={lines} />

      {/* Top penalty area */}
      <Path
        d="M 120 30 L 120 80 A 80 80 0 0 0 280 80 L 280 30"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top goal */}
      <Rect
        x="170"
        y="15"
        width="60"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top penalty mark */}
      <Circle cx="200" cy="85" r="2.5" fill={lines} />

      {/* Bottom penalty area */}
      <Path
        d="M 120 570 L 120 520 A 80 80 0 0 1 280 520 L 280 570"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom goal */}
      <Rect
        x="170"
        y="570"
        width="60"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom penalty mark */}
      <Circle cx="200" cy="515" r="2.5" fill={lines} />

      {/* Corner arcs */}
      <Path
        d="M 30 40 A 10 10 0 0 1 40 30"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 360 30 A 10 10 0 0 1 370 40"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 40 570 A 10 10 0 0 1 30 560"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 370 560 A 10 10 0 0 1 360 570"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
    </Svg>
  );
}
