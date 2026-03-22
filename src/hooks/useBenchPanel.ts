import { useRef, useState, useCallback } from 'react';
import { Animated, PanResponder } from 'react-native';
import { BENCH_PANEL } from '@/constants/futsal.constants';

/**
 * Custom hook for managing expandable bench panel
 */
export function useBenchPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(BENCH_PANEL.collapsedHeight)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;

  /**
   * Expand bench panel
   */
  const expand = useCallback(() => {
    setIsExpanded(true);
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: BENCH_PANEL.expandedHeight,
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: BENCH_PANEL.animationDuration,
        useNativeDriver: false,
      }),
    ]).start();
  }, [heightAnim, overlayOpacityAnim]);

  /**
   * Collapse bench panel
   */
  const collapse = useCallback(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: BENCH_PANEL.collapsedHeight,
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: BENCH_PANEL.animationDuration,
        useNativeDriver: false,
      }),
    ]).start(() => setIsExpanded(false));
  }, [heightAnim, overlayOpacityAnim]);

  /**
   * Toggle bench panel expansion
   */
  const toggle = useCallback(() => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, collapse, expand]);

  /**
   * Pan responder for drag gestures
   */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < -10 && !isExpanded) {
          expand();
        } else if (gestureState.dy > 10 && isExpanded) {
          collapse();
        }
      },
    })
  ).current;

  return {
    isExpanded,
    heightAnim,
    overlayOpacityAnim,
    expand,
    collapse,
    toggle,
    panResponder,
  };
}
