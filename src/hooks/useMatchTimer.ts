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
  const currentMatchIdRef = useRef(live.match?.id);
  const pausedElapsedRef = useRef<number | null>(null); // Captura elapsed no momento do pause para evitar race conditions

  /**
   * Sincronizar estado local com o store quando a partida mudar
   */
  useEffect(() => {
    if (live.match?.id !== currentMatchIdRef.current) {
      console.log(`[SYNC] Nova partida detectada - resetando timer. ID: ${live.match?.id}`);
      // Nova partida - sincronizar estados
      currentMatchIdRef.current = live.match?.id;
      setElapsed(live.elapsedSeconds);
      setPeriod(live.period);
      setIsRunning(live.isRunning);
      
      // Limpar timer anterior
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Se o timer estava rodando, reiniciar
      if (live.isRunning) {
        timerRef.current = setInterval(() => {
          setElapsed((e) => {
            const next = e + 1;
            setTimer(next, true);
            return next;
          });
        }, 1000);
      }
    }
    // Apenas sincronizar quando o ID da partida mudar, não quando período/elapsed mudarem
  }, [live.match?.id, setTimer]);

  /**
   * On mount: if the timer was running when the screen was left, restart the interval
   * so the counter resumes seamlessly.
   */
  useEffect(() => {
    if (live.isRunning && !timerRef.current) {
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
      // Captura elapsed IMEDIATAMENTE para evitar race conditions
      pausedElapsedRef.current = elapsed;
      console.log(`[TOGGLE] Pausando timer - elapsed: ${elapsed}s, period: ${period}`);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
      setTimer(pausedElapsedRef.current, false);
    } else {
      // Se period é 0 (antes de iniciar), mudar para 1 (primeiro tempo)
      if (period === 0) {
        console.log(`[TOGGLE] Iniciando partida - period 0 → 1`);
        setPeriod(1);
        storePeriod(1);
        setElapsed(0);
        setTimer(0, true, 1);
      } else {
        // Retomando após pause - usar elapsed da ref se foi capturado no pause
        const resumeElapsed = pausedElapsedRef.current !== null ? pausedElapsedRef.current : elapsed;
        console.log(`[TOGGLE] Retomando timer - elapsed: ${resumeElapsed}s (ref: ${pausedElapsedRef.current}, state: ${elapsed}), period: ${period}`);
        setElapsed(resumeElapsed); // Força o elapsed correto
        setTimer(resumeElapsed, true);
        pausedElapsedRef.current = null; // Limpa ref após usar
      }
      
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          setTimer(next, true);
          return next;
        });
      }, 1000);
      setIsRunning(true);
    }
  }, [isRunning, elapsed, period, setTimer, storePeriod]);

  /**
   * Marcar intervalo (fim do 1º tempo) — pausa e avança para período 2
   */
  const markHalfTime = useCallback(() => {
    console.log(`[MARK HALFTIME] Finalizando 1º tempo com ${elapsed}s - resetando para 0 no 2º tempo`);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setElapsed(0); // Reseta para 0 ao iniciar o 2º tempo
    pausedElapsedRef.current = 0; // Garante que ref também está zerada
    setPeriod(2);
    storePeriod(2);
    setTimer(0, false); // Timer começa de 0 no 2º tempo
    console.log(`[MARK HALFTIME] 2º tempo pronto para iniciar do 0`);
  }, [elapsed, setTimer, storePeriod]);

  /**
   * Encerrar partida
   */
  const markFullTime = useCallback(() => {
    // Captura elapsed IMEDIATAMENTE para evitar race conditions
    pausedElapsedRef.current = elapsed;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setPeriod(0);
    storePeriod(0);
    setTimer(pausedElapsedRef.current, false);
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
