import { useRef, useState, useEffect } from 'react';
import * as benchRepo from '@/database/repositories/benchRepository';

export interface UseBenchTimersParams {
  matchId: string;
  isRunning: boolean;
  saveBenchElapsed: (saved: Record<string, number>) => void;
  clearBenchElapsed: (playerId: string) => void;
  benchPausedElapsedFromStore: Record<string, number>;
}

export interface UseBenchTimersReturn {
  benchStartTimestamps: React.MutableRefObject<Record<string, number>>;
  benchPausedElapsed: React.MutableRefObject<Record<string, number>>;
  benchTick: number;
  setBenchTick: React.Dispatch<React.SetStateAction<number>>;
  startBenchTimer: (playerId: string, minute: number, second: number, period: number) => void;
  endBenchTimer: (playerId: string, minute: number, second: number) => void;
  pauseAllBenchTimers: () => void;
  resumeAllBenchTimers: () => void;
  getBenchElapsed: (playerId: string) => number;
  saveAllBenchElapsed: () => void;
}

/**
 * Hook para gerenciar timers de jogadores no banco
 */
export function useBenchTimers({
  matchId,
  isRunning,
  saveBenchElapsed,
  clearBenchElapsed,
  benchPausedElapsedFromStore
}: UseBenchTimersParams): UseBenchTimersReturn {
  const benchStartTimestamps = useRef<Record<string, number>>({});
  const benchPausedElapsed = useRef<Record<string, number>>({});
  const [benchTick, setBenchTick] = useState(0);

  // Restaurar timers ao montar
  useEffect(() => {
    benchRepo.getActiveBenchPlayers(matchId).forEach((p) => {
      const pausedSec = benchPausedElapsedFromStore[p.player_id] ?? 0;
      benchStartTimestamps.current[p.player_id] = Date.now() - pausedSec * 1000;
    });
  }, [matchId, benchPausedElapsedFromStore]);

  // Salvar elapsed ao desmontar
  useEffect(() => {
    return () => {
      saveAllBenchElapsed();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick interval para atualizar visualização
  useEffect(() => {
    const interval = setInterval(() => setBenchTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Pausar/retomar timers quando o timer global muda
  useEffect(() => {
    if (!isRunning) {
      pauseAllBenchTimers();
    } else {
      resumeAllBenchTimers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const startBenchTimer = (playerId: string, minute: number, second: number, period: number) => {
    const elapsedToFreeze = 0;
    if (!isRunning) {
      const frozenTimestamp = Date.now() - elapsedToFreeze * 1000;
      benchStartTimestamps.current[playerId] = frozenTimestamp;
      benchPausedElapsed.current[playerId] = elapsedToFreeze;
    } else {
      benchStartTimestamps.current[playerId] = Date.now();
    }
    benchRepo.startBenchPeriod(matchId, playerId, minute, second, period);
    setBenchTick(t => t + 1);
  };

  const endBenchTimer = (playerId: string, minute: number, second: number) => {
    benchRepo.endBenchPeriod(matchId, playerId, minute, second);
    delete benchStartTimestamps.current[playerId];
    delete benchPausedElapsed.current[playerId];
    clearBenchElapsed(playerId);
    setBenchTick(t => t + 1);
  };

  const pauseAllBenchTimers = () => {
    Object.keys(benchStartTimestamps.current).forEach((playerId) => {
      const oldTimestamp = benchStartTimestamps.current[playerId];
      const elapsed = Math.floor((Date.now() - oldTimestamp) / 1000);
      benchPausedElapsed.current[playerId] = elapsed;
    });
    setBenchTick(t => t + 1);
  };

  const resumeAllBenchTimers = () => {
    Object.keys(benchPausedElapsed.current).forEach((playerId) => {
      const pausedElapsed = benchPausedElapsed.current[playerId];
      const resumedTimestamp = Date.now() - pausedElapsed * 1000;
      benchStartTimestamps.current[playerId] = resumedTimestamp;
    });
    benchPausedElapsed.current = {};
    setBenchTick(t => t + 1);
  };

  const getBenchElapsed = (playerId: string): number => {
    if (benchPausedElapsed.current[playerId] !== undefined) {
      return benchPausedElapsed.current[playerId];
    }
    const startTs = benchStartTimestamps.current[playerId];
    if (!startTs) return 0;
    return Math.floor((Date.now() - startTs) / 1000);
  };

  const saveAllBenchElapsed = () => {
    const saved: Record<string, number> = {};
    Object.entries(benchStartTimestamps.current).forEach(([id, ts]) => {
      saved[id] = Math.floor((Date.now() - ts) / 1000);
    });
    if (Object.keys(saved).length > 0) saveBenchElapsed(saved);
  };

  return {
    benchStartTimestamps,
    benchPausedElapsed,
    benchTick,
    setBenchTick,
    startBenchTimer,
    endBenchTimer,
    pauseAllBenchTimers,
    resumeAllBenchTimers,
    getBenchElapsed,
    saveAllBenchElapsed,
  };
}
