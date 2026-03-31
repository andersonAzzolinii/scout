import React from 'react';
import Svg, { Rect, Circle, Line, Path, Ellipse } from 'react-native-svg';
import { COURT_COLORS } from '@/constants/society.constants';

interface CourtSVGProps {
  width: number;
  height: number;
}

/**
 * SVG representation of a society field (synthetic turf)
 */
export function CourtSVG({ width, height }: CourtSVGProps) {
  const { background, lines, lineWidth } = COURT_COLORS;

  return (
    <Svg width={width} height={height} viewBox="0 0 400 600">
      {/* Background - verde sintético */}
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
      <Circle cx="200" cy="300" r="60" fill="none" stroke={lines} strokeWidth={lineWidth} />

      {/* Center point */}
      <Circle cx="200" cy="300" r="3" fill={lines} />

      {/* Top penalty area (maior que futsal) */}
      <Rect
        x="100"
        y="30"
        width="200"
        height="90"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top small area */}
      <Rect
        x="150"
        y="30"
        width="100"
        height="40"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top goal */}
      <Rect
        x="165"
        y="15"
        width="70"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Top penalty mark */}
      <Circle cx="200" cy="95" r="2.5" fill={lines} />

      {/* Top penalty arc */}
      <Path
        d="M 140 120 A 60 60 0 0 0 260 120"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom penalty area */}
      <Rect
        x="100"
        y="480"
        width="200"
        height="90"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom small area */}
      <Rect
        x="150"
        y="530"
        width="100"
        height="40"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom goal */}
      <Rect
        x="165"
        y="570"
        width="70"
        height="15"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Bottom penalty mark */}
      <Circle cx="200" cy="505" r="2.5" fill={lines} />

      {/* Bottom penalty arc */}
      <Path
        d="M 140 480 A 60 60 0 0 1 260 480"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />

      {/* Corner arcs (maiores) */}
      <Path
        d="M 30 45 A 15 15 0 0 1 45 30"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 355 30 A 15 15 0 0 1 370 45"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 45 570 A 15 15 0 0 1 30 555"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
      <Path
        d="M 370 555 A 15 15 0 0 1 355 570"
        fill="none"
        stroke={lines}
        strokeWidth={lineWidth}
      />
    </Svg>
  );
}
