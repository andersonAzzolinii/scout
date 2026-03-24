import { getDatabase } from '../db';
import type { BenchPeriod } from '@/types';

/**
 * Inicia um novo período no banco de reservas
 */
export function startBenchPeriod(
  matchId: string,
  playerId: string,
  minute: number,
  second: number
): BenchPeriod {
  const db = getDatabase();
  const id = `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const now = Date.now();
  db.runSync(
    `INSERT INTO bench_periods (id, match_id, player_id, start_minute, start_second, start_timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, matchId, playerId, minute, second, now]
  );

  return {
    id,
    match_id: matchId,
    player_id: playerId,
    start_minute: minute,
    start_second: second,
    end_minute: null,
    end_second: null,
    start_timestamp: now,
    end_timestamp: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Finaliza o período atual no banco (quando jogador volta para quadra)
 */
export function endBenchPeriod(
  matchId: string,
  playerId: string,
  minute: number,
  second: number
): void {
  const db = getDatabase();
  
  db.runSync(
    `UPDATE bench_periods 
     SET end_minute = ?, end_second = ?, end_timestamp = ?
     WHERE match_id = ? AND player_id = ? AND end_minute IS NULL`,
    [minute, second, Date.now(), matchId, playerId]
  );
}

/**
 * Obtém todos os períodos no banco de um jogador em uma partida
 */
export function getPlayerBenchPeriods(
  matchId: string,
  playerId: string
): BenchPeriod[] {
  const db = getDatabase();
  
  return db.getAllSync<BenchPeriod>(
    `SELECT * FROM bench_periods 
     WHERE match_id = ? AND player_id = ?
     ORDER BY start_minute ASC, start_second ASC`,
    [matchId, playerId]
  );
}

/**
 * Calcula o tempo total no banco (em segundos)
 */
export function getTotalBenchTime(
  matchId: string,
  playerId: string,
  currentMinute?: number,
  currentSecond?: number
): number {
  const periods = getPlayerBenchPeriods(matchId, playerId);
  let totalSeconds = 0;

  periods.forEach(period => {
    const startTime = period.start_minute * 60 + period.start_second;
    let endTime: number;

    if (period.end_minute !== null && period.end_second !== null) {
      // Período finalizado
      endTime = period.end_minute * 60 + period.end_second;
    } else if (currentMinute !== undefined && currentSecond !== undefined) {
      // Período em andamento - usar tempo atual
      endTime = currentMinute * 60 + currentSecond;
    } else {
      // Período em andamento mas sem tempo atual
      return;
    }

    totalSeconds += (endTime - startTime);
  });

  return totalSeconds;
}

/**
 * Verifica se jogador está atualmente no banco
 */
export function isPlayerOnBench(matchId: string, playerId: string): boolean {
  const db = getDatabase();
  
  const result = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM bench_periods 
     WHERE match_id = ? AND player_id = ? AND end_minute IS NULL`,
    [matchId, playerId]
  );

  return (result?.count ?? 0) > 0;
}

/**
 * Retorna os jogadores atualmente no banco com seus timestamps de entrada (wall-clock)
 */
export function getActiveBenchPlayers(
  matchId: string
): { player_id: string; start_timestamp: number }[] {
  const db = getDatabase();
  return db.getAllSync<{ player_id: string; start_timestamp: number }>(
    `SELECT player_id, start_timestamp FROM bench_periods
     WHERE match_id = ? AND end_minute IS NULL`,
    [matchId]
  );
}
