import { getDatabase } from '../db';
import type { MatchEvent, EventRelation } from '@/types';

// ─── Match Events ─────────────────────────────────────────────────────────────

export function getMatchEvents(matchId: string): MatchEvent[] {
  const db = getDatabase();
  return db.getAllSync<MatchEvent>(
    `SELECT me.*,
       p.name AS player_name,
       p.number AS player_number,
       se.name AS event_name,
       se.icon AS event_icon,
       se.event_type,
       se.is_positive,
       se.category_id,
       t.name AS team_name
     FROM match_events me
     LEFT JOIN players p ON me.player_id = p.id
     JOIN scout_events se ON me.event_id = se.id
     JOIN teams t ON me.team_id = t.id
     WHERE me.match_id = ?
     ORDER BY me.period ASC, me.minute ASC, me.second ASC`,
    // Note: period column added via migration; defaults to 1 for old rows
    [matchId]
  );
}

export function insertMatchEvent(event: Omit<MatchEvent, 'created_at' | 'player_name' | 'player_number' | 'event_name' | 'event_icon' | 'event_type' | 'is_positive' | 'team_name'>): void {
  const db = getDatabase();
  
  // Validate foreign keys before insert
  const match = db.getFirstSync<{ id: string }>(`SELECT id FROM matches WHERE id = ?`, [event.match_id]);
  if (!match) {
    throw new Error(`Match with id ${event.match_id} does not exist`);
  }
  
  const team = db.getFirstSync<{ id: string }>(`SELECT id FROM teams WHERE id = ?`, [event.team_id]);
  if (!team) {
    throw new Error(`Team with id ${event.team_id} does not exist`);
  }
  
  // For opponent events, player_id can be null
  if (event.player_id && !event.is_opponent_event) {
    const player = db.getFirstSync<{ id: string }>(`SELECT id FROM players WHERE id = ?`, [event.player_id]);
    if (!player) {
      throw new Error(`Player with id ${event.player_id} does not exist`);
    }
  }
  
  db.runSync(
    `INSERT INTO match_events (id, match_id, team_id, player_id, event_id, minute, second, period, x, y, zone, is_opponent_event)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.match_id,
      event.team_id,
      event.player_id || null, // Allow null for opponent events
      event.event_id,
      event.minute,
      event.second,
      event.period ?? 1,
      event.x ?? null,
      event.y ?? null,
      event.zone ?? null,
      event.is_opponent_event ? 1 : 0,
    ]
  );
}

export function deleteMatchEvent(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM match_events WHERE id = ?`, [id]);
}

export function getEventCountsByMatch(matchId: string): Array<{
  event_id: string;
  event_name: string;
  player_id: string;
  player_name: string;
  team_id: string;
  count: number;
  is_positive: number;
  is_opponent_event: number;
}> {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT me.event_id, se.name AS event_name,
       me.player_id, COALESCE(p.name, 'Adversário') AS player_name,
       me.team_id, COUNT(*) AS count,
       se.is_positive, me.is_opponent_event
     FROM match_events me
     JOIN scout_events se ON me.event_id = se.id
     LEFT JOIN players p ON me.player_id = p.id
     WHERE me.match_id = ?
     GROUP BY me.event_id, me.player_id, me.is_opponent_event`,
    [matchId]
  );
}

// ─── Event Relations ─────────────────────────────────────────────────────────

export function getEventRelations(matchEventId: string): EventRelation[] {
  const db = getDatabase();
  return db.getAllSync<EventRelation>(
    `SELECT er.*, p.name AS related_player_name, p.number AS related_player_number
     FROM event_relations er
     JOIN players p ON er.related_player_id = p.id
     WHERE er.event_id = ?`,
    [matchEventId]
  );
}

export function insertEventRelation(relation: EventRelation): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO event_relations (id, event_id, related_player_id, relation_type)
     VALUES (?, ?, ?, ?)`,
    [relation.id, relation.event_id, relation.related_player_id, relation.relation_type]
  );
}
