import { getDatabase } from '../db';
import type { Match, MatchPlayer } from '@/types';

// ─── Matches ─────────────────────────────────────────────────────────────────

export function getMatches(): Match[] {
  const db = getDatabase();
  return db.getAllSync<Match>(
    `SELECT m.*,
       t.name AS team_name,
       sp.name AS profile_name
     FROM matches m
     JOIN teams t ON m.team_id = t.id
     JOIN scout_profiles sp ON m.profile_id = sp.id
     ORDER BY m.date DESC`
  );
}

export function getMatchById(id: string): Match | null {
  const db = getDatabase();
  return (
    db.getFirstSync<Match>(
      `SELECT m.*,
         t.name AS team_name,
         sp.name AS profile_name
       FROM matches m
       JOIN teams t ON m.team_id = t.id
       JOIN scout_profiles sp ON m.profile_id = sp.id
       WHERE m.id = ?`,
      [id]
    ) ?? null
  );
}

export function createMatch(match: Omit<Match, 'created_at' | 'team_name' | 'profile_name'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO matches (id, team_id, opponent_name, profile_id, date, location, is_home)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [match.id, match.team_id, match.opponent_name, match.profile_id, match.date, match.location, match.is_home ? 1 : 0]
  );
}

export function deleteMatch(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM matches WHERE id = ?`, [id]);
}

// ─── Match Players ───────────────────────────────────────────────────────────

export function getMatchPlayers(matchId: string): MatchPlayer[] {
  const db = getDatabase();
  return db.getAllSync<MatchPlayer>(
    `SELECT mp.*, p.name AS player_name, p.number AS player_number, p.photo_uri
     FROM match_players mp
     JOIN players p ON mp.player_id = p.id
     WHERE mp.match_id = ?`,
    [matchId]
  );
}

export function addMatchPlayer(mp: MatchPlayer): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO match_players (id, match_id, player_id, team_id, is_starting)
     VALUES (?, ?, ?, ?, ?)`,
    [mp.id, mp.match_id, mp.player_id, mp.team_id, mp.is_starting ? 1 : 0]
  );
}

export function updateMatchPlayerStarting(id: string, isStarting: boolean): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE match_players SET is_starting = ? WHERE id = ?`,
    [isStarting ? 1 : 0, id]
  );
}

export function removeMatchPlayer(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM match_players WHERE id = ?`, [id]);
}

export function updateMatchPlayerPosition(matchId: string, playerId: string, position: number | null): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE match_players 
     SET tactical_position = ? 
     WHERE match_id = ? AND player_id = ?`,
    [position, matchId, playerId]
  );
}

// ─── Match Timer ─────────────────────────────────────────────────────────────

export function updateMatchTimer(matchId: string, elapsedSeconds: number, isRunning: boolean, period: number): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE matches 
     SET elapsed_seconds = ?, is_timer_running = ?, current_period = ? 
     WHERE id = ?`,
    [elapsedSeconds, isRunning ? 1 : 0, period, matchId]
  );
}
