import { useState, useRef, useCallback, useEffect } from 'react';
import { useMatchStore } from '@/store/useMatchStore';

/**
 * Custom hook for managing match timer
 */
export function useMatchTimer() {
  const { setTimer } = useMatchStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // 1 = 1º tempo, 2 = 2º tempo, 0 = encerrado
  const [period, setPeriod] = useState<0 | 1 | 2>(1);
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
   * Marcar intervalo (fim do 1º tempo) — pausa e avança para período 2
   */
  const markHalfTime = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setPeriod(2);
  }, []);

  /**
   * Encerrar partida
   */
  const markFullTime = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setPeriod(0);
  }, []);

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
    period,
    toggleTimer,
    resetTimer,
    markHalfTime,
    markFullTime,
  };
}
