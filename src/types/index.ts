// ─── Event Types ─────────────────────────────────────────────────────────────
export type EventType = 'count' | 'position' | 'relation';

// ─── Users ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// ─── Scout Profiles ──────────────────────────────────────────────────────────
export interface ScoutProfile {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// ─── Scout Categories ────────────────────────────────────────────────────────
export interface ScoutCategory {
  id: string;
  profile_id: string;
  name: string;
  order_index: number;
}

// ─── Scout Events ─────────────────────────────────────────────────────────────
export interface ScoutEvent {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  event_type: EventType;
  is_positive: boolean;
  created_at: string;
}

// ─── Teams ───────────────────────────────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  photo_uri?: string | null;
  venue?: string | null;
  created_at: string;
}

// ─── Players ─────────────────────────────────────────────────────────────────
export interface Player {
  id: string;
  team_id: string;
  name: string;
  number: number;
  photo_uri?: string | null;
  created_at: string;
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export interface Match {
  id: string;
  team_id: string;
  opponent_name: string;
  profile_id: string;
  date: string;
  location: string;
  is_home: boolean;
  created_at: string;
  // Joined fields (optional)
  team_name?: string;
  profile_name?: string;
}

// ─── Match Players ───────────────────────────────────────────────────────────
export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  is_starting: boolean;
  tactical_position?: number | null;
  // Joined fields (optional)
  player_name?: string;
  player_number?: number;
  photo_uri?: string | null;
}

// ─── Match Events ─────────────────────────────────────────────────────────────
export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  event_id: string;
  minute: number;
  second: number;
  x: number | null;
  y: number | null;
  created_at: string;
  // Joined fields (optional)
  player_name?: string;
  player_number?: number;
  event_name?: string;
  event_icon?: string;
  event_type?: EventType;
  is_positive?: boolean;
  team_name?: string;
}

// ─── Bench Periods ───────────────────────────────────────────────────────────
export interface BenchPeriod {
  id: string;
  match_id: string;
  player_id: string;
  start_minute: number;
  start_second: number;
  end_minute: number | null;
  end_second: number | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  created_at: string;
}

// ─── Event Relations ─────────────────────────────────────────────────────────
export interface EventRelation {
  id: string;
  event_id: string;
  related_player_id: string;
  relation_type: string;
  // Joined fields (optional)
  related_player_name?: string;
  related_player_number?: number;
}

// ─── UI / App State ──────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light' | 'system';

export interface LiveMatchState {
  match: Match | null;
  players: MatchPlayer[];
  events: MatchEvent[];
  selectedPlayerId: string | null;
  selectedTeamId: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
}

// ─── Futsal-specific types ───────────────────────────────────────────────────
export * from './futsal.types';
