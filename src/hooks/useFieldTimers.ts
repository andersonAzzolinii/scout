import { useRef, useState, useEffect } from 'react';
import * as fieldRepo from '@/database/repositories/fieldRepository';

export interface UseFieldTimersParams {
  matchId: string;
  isRunning: boolean;
  period: number;
  elapsed: number;
}

export interface UseFieldTimersReturn {
  fieldStartTimestamps: React.MutableRefObject<Record<string, number>>;
  fieldPausedElapsed: React.MutableRefObject<Record<string, number>>;
  fieldPeriodChangeElapsed: React.MutableRefObject<Record<string, number>>;
  fieldTick: number;
  setFieldTick: React.Dispatch<React.SetStateAction<number>>;
  startFieldTimer: (playerId: string, minute: number, second: number, period: number) => void;
  endFieldTimer: (playerId: string, minute: number, second: number) => void;
  pauseAllFieldTimers: () => void;
  resumeAllFieldTimers: () => void;
  getFieldElapsed: (playerId: string) => number;
}

/**
 * Hook para gerenciar timers de jogadores em campo
 */
export function useFieldTimers({ matchId, isRunning, period, elapsed }: UseFieldTimersParams): UseFieldTimersReturn {
  const fieldStartTimestamps = useRef<Record<string, number>>({});
  const fieldPausedElapsed = useRef<Record<string, number>>({});
  const fieldPeriodChangeElapsed = useRef<Record<string, number>>({});
  const [fieldTick, setFieldTick] = useState(0);

  // Restaurar timers ao montar
  useEffect(() => {
    fieldRepo.getActiveFieldPlayers(matchId).forEach((p) => {
      if (p.start_timestamp) {
        const elapsed = p.paused_elapsed_seconds !== null && p.paused_elapsed_seconds !== undefined
          ? p.paused_elapsed_seconds
          : Math.floor((Date.now() - p.start_timestamp) / 1000);
        
        fieldStartTimestamps.current[p.player_id] = Date.now() - elapsed * 1000;
        
        if (p.paused_elapsed_seconds !== null && p.paused_elapsed_seconds !== undefined) {
          fieldPausedElapsed.current[p.player_id] = p.paused_elapsed_seconds;
        }
      }
    });
  }, [matchId]);

  // Pausar/retomar timers quando o timer global muda
  useEffect(() => {
    if (!isRunning) {
      pauseAllFieldTimers();
    } else {
      resumeAllFieldTimers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const startFieldTimer = (playerId: string, minute: number, second: number, period: number) => {
    if (!isRunning) {
      const frozenTimestamp = Date.now();
      fieldStartTimestamps.current[playerId] = frozenTimestamp;
      fieldPausedElapsed.current[playerId] = 0;
      fieldRepo.updateActiveFieldPausedElapsed(matchId, playerId, 0);
    } else {
      fieldStartTimestamps.current[playerId] = Date.now();
    }
    fieldRepo.startFieldPeriod(matchId, playerId, minute, second, period);
    setFieldTick(t => t + 1);
  };

  const endFieldTimer = (playerId: string, minute: number, second: number) => {
    fieldRepo.endFieldPeriod(matchId, playerId, minute, second);
    delete fieldStartTimestamps.current[playerId];
    delete fieldPausedElapsed.current[playerId];
    delete fieldPeriodChangeElapsed.current[playerId];
    setFieldTick(t => t + 1);
  };

  const pauseAllFieldTimers = () => {
    Object.keys(fieldStartTimestamps.current).forEach((playerId) => {
      if (fieldPausedElapsed.current[playerId] === undefined) {
        const elapsedSec = Math.max(0, Math.floor((Date.now() - (fieldStartTimestamps.current[playerId] ?? Date.now())) / 1000));
        fieldPausedElapsed.current[playerId] = elapsedSec;
        fieldRepo.updateActiveFieldPausedElapsed(matchId, playerId, elapsedSec);
      }
    });
    setFieldTick(t => t + 1);
  };

  const resumeAllFieldTimers = () => {
    Object.keys(fieldPausedElapsed.current).forEach((playerId) => {
      const pausedElapsed = fieldPausedElapsed.current[playerId];
      fieldStartTimestamps.current[playerId] = Date.now() - pausedElapsed * 1000;
      fieldRepo.updateActiveFieldPausedElapsed(matchId, playerId, null);
    });
    fieldPausedElapsed.current = {};
    setFieldTick(t => t + 1);
  };

  const getFieldElapsed = (playerId: string): number => {
    if (period === 0) return 0;
    if (!isRunning && fieldPausedElapsed.current[playerId] !== undefined) {
      return fieldPausedElapsed.current[playerId];
    }
    const startTs = fieldStartTimestamps.current[playerId];
    if (!startTs) return 0;
    return Math.floor((Date.now() - startTs) / 1000);
  };

  return {
    fieldStartTimestamps,
    fieldPausedElapsed,
    fieldPeriodChangeElapsed,
    fieldTick,
    setFieldTick,
    startFieldTimer,
    endFieldTimer,
    pauseAllFieldTimers,
    resumeAllFieldTimers,
    getFieldElapsed,
  };
}
