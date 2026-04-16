// ─── Event Types ─────────────────────────────────────────────────────────────
export type EventType = 'count' | 'position' | 'relation';

// ─── Sport Types ─────────────────────────────────────────────────────────────
export type SportType = 'futsal' | 'society' | 'campo' | 'all';

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
  sport_type: SportType;
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

// ─── Squads ──────────────────────────────────────────────────────────────────
export interface Squad {
  id: string;
  team_id: string;
  sport_type: SportType;
  name: string;
  created_at: string;
  // Joined fields (optional)
  team_name?: string;
}

// ─── Positions ────────────────────────────────────────────────────────────────
export interface Position {
  id: string;
  squad_id: string;
  name: string;
  abbreviation: string;
  order_index: number;
  created_at: string;
  // Joined fields (optional)
  squad_name?: string;
  sport_type?: SportType;
}

// ─── Players ─────────────────────────────────────────────────────────────────
export interface Player {
  id: string;
  team_id: string;
  squad_id?: string | null;
  position_id?: string | null;
  name: string;
  number: number;
  height?: number | null;
  weight?: number | null;
  photo_uri?: string | null;
  created_at: string;
  // Joined fields (optional)
  squad_name?: string;
  sport_type?: SportType;
  position_name?: string;
  position_abbreviation?: string;
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export interface Match {
  id: string;
  team_id: string;
  squad_id?: string | null;
  opponent_name: string;
  profile_id: string;
  date: string;
  location: string;
  is_home: boolean;
  home_score?: number;
  away_score?: number;
  elapsed_seconds?: number;
  is_timer_running?: number;
  current_period?: number;
  total_duration_seconds?: number | null;
  first_half_seconds?: number | null;
  second_half_seconds?: number | null;
  created_at: string;
  // Joined fields (optional)
  team_name?: string;
  squad_name?: string;
  sport_type?: SportType;
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
  position_name?: string | null;
  position_abbreviation?: string | null;
}

// ─── Match Events ─────────────────────────────────────────────────────────────
export type FieldZone = 'DEFENSIVE' | 'MIDFIELD' | 'OFFENSIVE';

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string | null; // NULL for opponent events
  event_id: string;
  minute: number;
  second: number;
  period?: number;
  x: number | null;
  y: number | null;
  zone?: FieldZone | null;  // Computed field from y coordinate
  is_opponent_event?: boolean;
  created_at: string;
  // Joined fields (optional)
  player_name?: string;
  player_number?: number;
  event_name?: string;
  event_icon?: string;
  event_type?: EventType;
  is_positive?: boolean;
  category_id?: string;
  team_name?: string;
}

// ─── Field Periods ───────────────────────────────────────────────────────────
export interface FieldPeriod {
  id: string;
  match_id: string;
  player_id: string;
  start_minute: number;
  start_second: number;
  end_minute: number | null;
  end_second: number | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  paused_elapsed_seconds?: number | null;
  period: number;
  created_at: string;
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
  end_timestamp: number | null;  period: number;  created_at: string;
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
  period: 0 | 1 | 2;
  /** Accumulated bench seconds per player, saved when screen is left */
  benchPausedElapsed: Record<string, number>;
  homeScore: number;
  awayScore: number;
}

// ─── Futsal-specific types ───────────────────────────────────────────────────
export * from './futsal.types';
