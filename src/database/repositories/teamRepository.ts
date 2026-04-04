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
    `SELECT p.*, s.name as squad_name, s.sport_type,
            pos.name as position_name, pos.abbreviation as position_abbreviation
     FROM players p
     LEFT JOIN squads s ON p.squad_id = s.id
     LEFT JOIN positions pos ON p.position_id = pos.id
     WHERE p.team_id = ? 
     ORDER BY p.number ASC`,
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
    `INSERT INTO players (id, team_id, squad_id, position_id, name, number, height, weight, photo_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [player.id, player.team_id, player.squad_id ?? null, player.position_id ?? null, player.name, player.number, player.height ?? null, player.weight ?? null, player.photo_uri ?? null]
  );
}

export function updatePlayer(id: string, name: string, number: number, photoUri?: string | null, squadId?: string | null, positionId?: string | null, height?: number | null, weight?: number | null): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE players SET name = ?, number = ?, photo_uri = ?, squad_id = ?, position_id = ?, height = ?, weight = ? WHERE id = ?`,
    [name, number, photoUri ?? null, squadId ?? null, positionId ?? null, height ?? null, weight ?? null, id]
  );
}

export function deletePlayer(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM players WHERE id = ?`, [id]);
}

// ─── Squad-specific queries ──────────────────────────────────────────────────

export function getPlayersBySquad(squadId: string): Player[] {
  const db = getDatabase();
  return db.getAllSync<Player>(
    `SELECT p.*, s.name as squad_name, s.sport_type,
            pos.name as position_name, pos.abbreviation as position_abbreviation
     FROM players p
     LEFT JOIN squads s ON p.squad_id = s.id
     LEFT JOIN positions pos ON p.position_id = pos.id
     WHERE p.squad_id = ? 
     ORDER BY p.number ASC`,
    [squadId]
  );
}
