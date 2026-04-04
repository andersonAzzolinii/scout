import { useState, useRef, useCallback, useEffect } from 'react';
import { useMatchStore } from '@/store/useMatchStore';

/**
 * Custom hook for managing match timer.
 *
 * Uses Date.now() for elapsed calculation so the match clock stays perfectly
 * in sync with wall-clock based field/bench timers (no setInterval drift).
 */
export function useMatchTimer() {
  const { live, setTimer, setPeriod: storePeriod } = useMatchStore();
  const [isRunning, setIsRunning] = useState(live.isRunning);
  const [elapsed, setElapsed] = useState(live.elapsedSeconds);
  const [period, setPeriod] = useState<0 | 1 | 2>(live.period);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentMatchIdRef = useRef(live.match?.id);

  // Wall-clock anchor: Date.now() when the current running session started
  const startTimeRef = useRef<number | null>(null);
  // Seconds accumulated from previous running sessions within this period
  const baseElapsedRef = useRef<number>(live.elapsedSeconds);

  /** Calculate current elapsed from wall-clock */
  const calcElapsed = useCallback(() => {
    if (startTimeRef.current === null) return baseElapsedRef.current;
    return baseElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  /** Start the interval that ticks UI every second */
  const startTicking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = calcElapsed();
      setElapsed(now);
      setTimer(now, true);
    }, 1000);
  }, [calcElapsed, setTimer]);

  /** Stop the interval */
  const stopTicking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Sincronizar estado local com o store quando a partida mudar
   */
  useEffect(() => {
    if (live.match?.id !== currentMatchIdRef.current) {
      currentMatchIdRef.current = live.match?.id;
      setElapsed(live.elapsedSeconds);
      setPeriod(live.period);
      setIsRunning(live.isRunning);
      baseElapsedRef.current = live.elapsedSeconds;
      stopTicking();

      if (live.isRunning) {
        startTimeRef.current = Date.now();
        startTicking();
      } else {
        startTimeRef.current = null;
      }
    }
  }, [live.match?.id, live.elapsedSeconds, live.period, live.isRunning, stopTicking, startTicking]);

  /**
   * On mount: if the timer was running, anchor to Date.now() and start ticking.
   */
  useEffect(() => {
    if (live.isRunning && !timerRef.current) {
      baseElapsedRef.current = live.elapsedSeconds;
      startTimeRef.current = Date.now();
      startTicking();
    }
    return () => stopTicking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Toggle timer start/stop
   */
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      // Pause: snapshot the current wall-clock elapsed
      const currentElapsed = calcElapsed();
      stopTicking();
      startTimeRef.current = null;
      baseElapsedRef.current = currentElapsed;
      setElapsed(currentElapsed);
      setIsRunning(false);
      setTimer(currentElapsed, false);
    } else {
      // Resume / Start
      if (period === 0) {
        // First start → period 1
        setPeriod(1);
        storePeriod(1);
        baseElapsedRef.current = 0;
        setElapsed(0);
        setTimer(0, true, 1);
      } else {
        // Resume from pause
        // baseElapsedRef already holds the correct value from the pause
        setElapsed(baseElapsedRef.current);
        setTimer(baseElapsedRef.current, true);
      }

      startTimeRef.current = Date.now();
      startTicking();
      setIsRunning(true);
    }
  }, [isRunning, period, calcElapsed, stopTicking, startTicking, setTimer, storePeriod]);

  /**
   * Marcar intervalo (fim do 1º tempo) — pausa e avança para período 2
   */
  const markHalfTime = useCallback(() => {
    stopTicking();
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    setIsRunning(false);
    setElapsed(0);
    setPeriod(2);
    storePeriod(2);
    setTimer(0, false);
  }, [stopTicking, setTimer, storePeriod]);

  /**
   * Encerrar partida
   */
  const markFullTime = useCallback(() => {
    stopTicking();
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    setIsRunning(false);
    setElapsed(0);
    setPeriod(0);
    storePeriod(0);
    setTimer(0, false);
  }, [stopTicking, setTimer, storePeriod]);

  /**
   * Reset timer
   */
  const resetTimer = useCallback(() => {
    stopTicking();
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    setIsRunning(false);
    setElapsed(0);
    setPeriod(1);
    storePeriod(1);
    setTimer(0, false);
  }, [stopTicking, setTimer, storePeriod]);

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
