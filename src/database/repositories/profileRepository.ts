import { getDatabase } from '../db';
import type { ScoutProfile, ScoutCategory, ScoutEvent } from '@/types';

// ─── Profiles ────────────────────────────────────────────────────────────────

export function getProfiles(): ScoutProfile[] {
  const db = getDatabase();
  return db.getAllSync<ScoutProfile>(
    `SELECT * FROM scout_profiles ORDER BY created_at DESC`
  );
}

export function getProfileById(id: string): ScoutProfile | null {
  const db = getDatabase();
  return db.getFirstSync<ScoutProfile>(
    `SELECT * FROM scout_profiles WHERE id = ?`,
    [id]
  ) ?? null;
}

export function createProfile(profile: Omit<ScoutProfile, 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO scout_profiles (id, user_id, name, sport_type) VALUES (?, ?, ?, ?)`,
    [profile.id, profile.user_id, profile.name, profile.sport_type]
  );
}

export function updateProfile(id: string, name: string, sportType?: string): void {
  const db = getDatabase();
  if (sportType) {
    db.runSync(`UPDATE scout_profiles SET name = ?, sport_type = ? WHERE id = ?`, [name, sportType, id]);
  } else {
    db.runSync(`UPDATE scout_profiles SET name = ? WHERE id = ?`, [name, id]);
  }
}

export function deleteProfile(id: string): void {
  const db = getDatabase();
  // Primeiro, deletar todos os eventos das categorias do perfil
  db.runSync(
    `DELETE FROM scout_events WHERE category_id IN (SELECT id FROM scout_categories WHERE profile_id = ?)`,
    [id]
  );
  // Depois, deletar todas as categorias do perfil
  db.runSync(`DELETE FROM scout_categories WHERE profile_id = ?`, [id]);
  // Por último, deletar o perfil
  db.runSync(`DELETE FROM scout_profiles WHERE id = ?`, [id]);
}

export function getProfilesBySportType(sportType: string): ScoutProfile[] {
  const db = getDatabase();
  return db.getAllSync<ScoutProfile>(
    `SELECT * FROM scout_profiles 
     WHERE sport_type = ? OR sport_type = 'all'
     ORDER BY created_at DESC`,
    [sportType]
  );
}

export function getProfilesByUserId(userId: string): ScoutProfile[] {
  const db = getDatabase();
  return db.getAllSync<ScoutProfile>(
    `SELECT * FROM scout_profiles WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function getCategoriesByProfile(profileId: string): ScoutCategory[] {
  const db = getDatabase();
  return db.getAllSync<ScoutCategory>(
    `SELECT * FROM scout_categories WHERE profile_id = ? ORDER BY order_index ASC`,
    [profileId]
  );
}

export function createCategory(category: ScoutCategory): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO scout_categories (id, profile_id, name, order_index) VALUES (?, ?, ?, ?)`,
    [category.id, category.profile_id, category.name, category.order_index]
  );
}

export function updateCategory(id: string, name: string, orderIndex: number): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE scout_categories SET name = ?, order_index = ? WHERE id = ?`,
    [name, orderIndex, id]
  );
}

export function deleteCategory(id: string): void {
  const db = getDatabase();
  // Primeiro, deletar todos os eventos da categoria
  db.runSync(`DELETE FROM scout_events WHERE category_id = ?`, [id]);
  // Depois, deletar a categoria
  db.runSync(`DELETE FROM scout_categories WHERE id = ?`, [id]);
}

// ─── Scout Events ─────────────────────────────────────────────────────────────

export function getEventsByCategory(categoryId: string): ScoutEvent[] {
  const db = getDatabase();
  return db.getAllSync<ScoutEvent>(
    `SELECT * FROM scout_events WHERE category_id = ?`,
    [categoryId]
  );
}

export function getEventsByProfile(profileId: string): ScoutEvent[] {
  const db = getDatabase();
  return db.getAllSync<ScoutEvent>(
    `SELECT se.* FROM scout_events se
     JOIN scout_categories sc ON se.category_id = sc.id
     WHERE sc.profile_id = ?`,
    [profileId]
  );
}

export function createScoutEvent(event: Omit<ScoutEvent, 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO scout_events (id, category_id, name, icon, event_type, is_positive)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.category_id,
      event.name,
      event.icon,
      event.event_type,
      event.is_positive ? 1 : 0,
    ]
  );
}

export function updateScoutEvent(event: Omit<ScoutEvent, 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE scout_events SET name = ?, icon = ?, event_type = ?, is_positive = ? WHERE id = ?`,
    [event.name, event.icon, event.event_type, event.is_positive ? 1 : 0, event.id]
  );
}

export function deleteScoutEvent(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM scout_events WHERE id = ?`, [id]);
}
