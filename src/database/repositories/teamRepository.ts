import { getDatabase } from '../db';
import type { Team, Player } from '@/types';

// ─── Teams ───────────────────────────────────────────────────────────────────

export function getTeams(): Team[] {
  const db = getDatabase();
  return db.getAllSync<Team>(
    `SELECT * FROM teams ORDER BY name ASC`
  );
}

export function getTeamById(id: string): Team | null {
  const db = getDatabase();
  return db.getFirstSync<Team>(`SELECT * FROM teams WHERE id = ?`, [id]) ?? null;
}

export function createTeam(team: Team): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO teams (id, name, photo_uri, venue) VALUES (?, ?, ?, ?)`,
    [team.id, team.name, team.photo_uri ?? null, team.venue ?? null]
  );
}

export function updateTeam(id: string, name: string, photoUri?: string | null, venue?: string | null): void {
  const db = getDatabase();
  db.runSync(`UPDATE teams SET name = ?, photo_uri = ?, venue = ? WHERE id = ?`, [name, photoUri ?? null, venue ?? null, id]);
}

export function deleteTeam(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM teams WHERE id = ?`, [id]);
}

// ─── Players ─────────────────────────────────────────────────────────────────

export function getPlayersByTeam(teamId: string): Player[] {
  const db = getDatabase();
  return db.getAllSync<Player>(
    `SELECT * FROM players WHERE team_id = ? ORDER BY number ASC`,
    [teamId]
  );
}

export function getPlayerById(id: string): Player | null {
  const db = getDatabase();
  return db.getFirstSync<Player>(`SELECT * FROM players WHERE id = ?`, [id]) ?? null;
}

export function createPlayer(player: Omit<Player, 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO players (id, team_id, name, number, photo_uri) VALUES (?, ?, ?, ?, ?)`,
    [player.id, player.team_id, player.name, player.number, player.photo_uri ?? null]
  );
}

export function updatePlayer(id: string, name: string, number: number, photoUri?: string | null): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE players SET name = ?, number = ?, photo_uri = ? WHERE id = ?`,
    [name, number, photoUri ?? null, id]
  );
}

export function deletePlayer(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM players WHERE id = ?`, [id]);
}
