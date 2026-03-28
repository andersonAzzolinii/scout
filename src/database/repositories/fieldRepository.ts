import { getDatabase } from '../db';
import type { FieldPeriod } from '@/types';

/**
 * Inicia um novo período em quadra
 */
export function startFieldPeriod(
  matchId: string,
  playerId: string,
  minute: number,
  second: number
): FieldPeriod {
  const db = getDatabase();
  const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  db.runSync(
    `INSERT INTO field_periods (id, match_id, player_id, start_minute, start_second, start_timestamp)
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
 * Finaliza o período em quadra atual
 */
export function endFieldPeriod(
  matchId: string,
  playerId: string,
  minute: number,
  second: number
): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE field_periods
     SET end_minute = ?, end_second = ?, end_timestamp = ?
     WHERE match_id = ? AND player_id = ? AND end_minute IS NULL`,
    [minute, second, Date.now(), matchId, playerId]
  );
}

/**
 * Obtém todos os períodos em quadra de um jogador em uma partida
 */
export function getPlayerFieldPeriods(
  matchId: string,
  playerId: string
): FieldPeriod[] {
  const db = getDatabase();
  return db.getAllSync<FieldPeriod>(
    `SELECT * FROM field_periods
     WHERE match_id = ? AND player_id = ?
     ORDER BY start_minute ASC, start_second ASC`,
    [matchId, playerId]
  );
}

/**
 * Retorna jogadores atualmente em quadra com seus timestamps de entrada e elapsed pausado
 */
export function getActiveFieldPlayers(
  matchId: string
): { player_id: string; start_timestamp: number; paused_elapsed_seconds: number | null }[] {
  const db = getDatabase();
  return db.getAllSync<{ player_id: string; start_timestamp: number; paused_elapsed_seconds: number | null }>(
    `SELECT player_id, start_timestamp, paused_elapsed_seconds FROM field_periods
     WHERE match_id = ? AND end_minute IS NULL`,
    [matchId]
  );
}

/**
 * Verifica se jogador está atualmente em quadra
 */
export function isPlayerOnField(matchId: string, playerId: string): boolean {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM field_periods
     WHERE match_id = ? AND player_id = ? AND end_minute IS NULL`,
    [matchId, playerId]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Atualiza o paused_elapsed_seconds de um período ativo em quadra
 */
export function updateActiveFieldPausedElapsed(
  matchId: string,
  playerId: string,
  pausedElapsed: number | null
): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE field_periods
     SET paused_elapsed_seconds = ?
     WHERE match_id = ? AND player_id = ? AND end_minute IS NULL`,
    [pausedElapsed, matchId, playerId]
  );
}

/**
 * Calcula o tempo total em quadra (em segundos)
 */
export function getTotalFieldTime(
  matchId: string,
  playerId: string,
  currentMinute?: number,
  currentSecond?: number
): number {
  const periods = getPlayerFieldPeriods(matchId, playerId);
  let totalSeconds = 0;

  periods.forEach(period => {
    const startTime = period.start_minute * 60 + period.start_second;
    let endTime: number;

    if (period.end_minute !== null && period.end_second !== null) {
      endTime = period.end_minute * 60 + period.end_second;
    } else if (currentMinute !== undefined && currentSecond !== undefined) {
      endTime = currentMinute * 60 + currentSecond;
    } else {
      return;
    }

    totalSeconds += (endTime - startTime);
  });

  return totalSeconds;
}
