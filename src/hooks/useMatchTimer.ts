import { useState, useRef, useCallback, useEffect } from 'react';
import { useMatchStore } from '@/store/useMatchStore';

/**
 * Custom hook for managing match timer
 */
export function useMatchTimer() {
  const { setTimer } = useMatchStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Toggle timer start/stop
   */
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          setTimer(next, true);
          return next;
        });
      }, 1000);
      setIsRunning(true);
    }
  }, [isRunning, setTimer]);

  /**
   * Reset timer
   */
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setElapsed(0);
    setTimer(0, false);
  }, [setTimer]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    elapsed,
    toggleTimer,
    resetTimer,
  };
}
