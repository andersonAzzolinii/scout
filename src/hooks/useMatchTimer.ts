import { useState, useRef, useCallback, useEffect } from 'react';
import { useMatchStore } from '@/store/useMatchStore';

/**
 * Custom hook for managing match timer
 */
export function useMatchTimer() {
  const { live, setTimer, setPeriod: storePeriod } = useMatchStore();
  const [isRunning, setIsRunning] = useState(live.isRunning);
  const [elapsed, setElapsed] = useState(live.elapsedSeconds);
  const [period, setPeriod] = useState<0 | 1 | 2>(live.period);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * On mount: if the timer was running when the screen was left, restart the interval
   * so the counter resumes seamlessly.
   */
  useEffect(() => {
    if (live.isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          setTimer(next, true);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // Intentionally runs only on mount — live values are captured as initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setTimer(elapsed, false);
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
  }, [isRunning, elapsed, setTimer]);

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
    storePeriod(2);
    setTimer(elapsed, false);
  }, [elapsed, setTimer, storePeriod]);

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
    storePeriod(0);
    setTimer(elapsed, false);
  }, [elapsed, setTimer, storePeriod]);

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
    setPeriod(1);
    storePeriod(1);
    setTimer(0, false);
  }, [setTimer, storePeriod]);

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
