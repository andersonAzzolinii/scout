import { getDatabase } from '../db';
import type { Position } from '@/types';

export function getPositionsBySquad(squadId: string): Position[] {
  const db = getDatabase();
  return db.getAllSync<Position>(
    `SELECT p.*, s.name as squad_name, s.sport_type
     FROM positions p
     LEFT JOIN squads s ON p.squad_id = s.id
     WHERE p.squad_id = ?
     ORDER BY p.order_index ASC`,
    [squadId]
  );
}

export function getPositionById(id: string): Position | null {
  const db = getDatabase();
  return db.getFirstSync<Position>(
    `SELECT p.*, s.name as squad_name, s.sport_type
     FROM positions p
     LEFT JOIN squads s ON p.squad_id = s.id
     WHERE p.id = ?`,
    [id]
  ) ?? null;
}

export function createPosition(position: Omit<Position, 'created_at' | 'squad_name' | 'sport_type'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO positions (id, squad_id, name, abbreviation, order_index) VALUES (?, ?, ?, ?, ?)`,
    [position.id, position.squad_id, position.name, position.abbreviation, position.order_index]
  );
}

export function updatePosition(id: string, name: string, abbreviation: string): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE positions SET name = ?, abbreviation = ? WHERE id = ?`,
    [name, abbreviation, id]
  );
}

export function deletePosition(id: string): void {
  const db = getDatabase();
  // Remove position reference from players
  db.runSync(`UPDATE players SET position_id = NULL WHERE position_id = ?`, [id]);
  db.runSync(`DELETE FROM positions WHERE id = ?`, [id]);
}

export function getPositionCountBySquad(squadId: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM positions WHERE squad_id = ?`,
    [squadId]
  );
  return result?.count ?? 0;
}
