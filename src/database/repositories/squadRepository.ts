import { getDatabase } from '../db';
import type { Squad, SportType } from '@/types';

// ─── Squads ──────────────────────────────────────────────────────────────────

export function getSquads(): Squad[] {
  const db = getDatabase();
  return db.getAllSync<Squad>(
    `SELECT s.*, t.name as team_name 
     FROM squads s 
     LEFT JOIN teams t ON s.team_id = t.id 
     ORDER BY t.name ASC, s.sport_type ASC`
  );
}

export function getSquadsByTeam(teamId: string): Squad[] {
  const db = getDatabase();
  return db.getAllSync<Squad>(
    `SELECT s.*, t.name as team_name 
     FROM squads s 
     LEFT JOIN teams t ON s.team_id = t.id 
     WHERE s.team_id = ? 
     ORDER BY s.sport_type ASC`,
    [teamId]
  );
}

export function getSquadById(id: string): Squad | null {
  const db = getDatabase();
  return db.getFirstSync<Squad>(
    `SELECT s.*, t.name as team_name 
     FROM squads s 
     LEFT JOIN teams t ON s.team_id = t.id 
     WHERE s.id = ?`,
    [id]
  ) ?? null;
}

export function getSquadBySportType(teamId: string, sportType: SportType): Squad | null {
  const db = getDatabase();
  return db.getFirstSync<Squad>(
    `SELECT s.*, t.name as team_name 
     FROM squads s 
     LEFT JOIN teams t ON s.team_id = t.id 
     WHERE s.team_id = ? AND s.sport_type = ?`,
    [teamId, sportType]
  ) ?? null;
}

export function createSquad(squad: Omit<Squad, 'created_at' | 'team_name'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO squads (id, team_id, sport_type, name) VALUES (?, ?, ?, ?)`,
    [squad.id, squad.team_id, squad.sport_type, squad.name]
  );
}

export function updateSquad(id: string, name: string, sportType: SportType): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE squads SET name = ?, sport_type = ? WHERE id = ?`,
    [name, sportType, id]
  );
}

export function deleteSquad(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM squads WHERE id = ?`, [id]);
}

// ─── Squad Statistics ────────────────────────────────────────────────────────

export function getSquadWithStats(squadId: string): (Squad & { player_count: number; match_count: number }) | null {
  const db = getDatabase();
  return db.getFirstSync<Squad & { player_count: number; match_count: number }>(
    `SELECT 
      s.*,
      t.name as team_name,
      (SELECT COUNT(*) FROM players WHERE squad_id = s.id) as player_count,
      (SELECT COUNT(*) FROM matches WHERE squad_id = s.id) as match_count
     FROM squads s
     LEFT JOIN teams t ON s.team_id = t.id
     WHERE s.id = ?`,
    [squadId]
  ) ?? null;
}

export function getSquadsByTeamWithStats(teamId: string): (Squad & { player_count: number; match_count: number })[] {
  const db = getDatabase();
  return db.getAllSync<Squad & { player_count: number; match_count: number }>(
    `SELECT 
      s.*,
      t.name as team_name,
      (SELECT COUNT(*) FROM players WHERE squad_id = s.id) as player_count,
      (SELECT COUNT(*) FROM matches WHERE squad_id = s.id) as match_count
     FROM squads s
     LEFT JOIN teams t ON s.team_id = t.id
     WHERE s.team_id = ?
     ORDER BY s.sport_type ASC`,
    [teamId]
  );
}
