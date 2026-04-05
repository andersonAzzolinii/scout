/**
 * Mock data generators and fixtures for tests.
 * Provides realistic scout match data for comprehensive testing.
 */
import type { 
  Team, Player, Squad, Position, Match, MatchPlayer, MatchEvent,
  ScoutProfile, ScoutCategory, ScoutEvent, LiveMatchState,
  BenchPeriod, FieldPeriod
} from '@/types';

// ─── IDs ────────────────────────────────────────────────────────────────────
export const IDS = {
  team:       'team-001',
  squad:      'squad-futsal-001',
  squad2:     'squad-society-001',
  profile:    'profile-001',
  match:      'match-001',
  match2:     'match-002',
  category1:  'cat-passe',
  category2:  'cat-finalizacao',
  category3:  'cat-goleiro',
  event1:     'evt-passe-certo',
  event2:     'evt-passe-errado', 
  event3:     'evt-gol',
  event4:     'evt-defesa',
  player1:    'player-001',
  player2:    'player-002',
  player3:    'player-003',
  player4:    'player-004',
  player5:    'player-005',
  player6:    'player-006',
  position1:  'pos-goleiro',
  position2:  'pos-fixo',
  position3:  'pos-ala',
  position4:  'pos-pivo',
};

// ─── Teams ──────────────────────────────────────────────────────────────────
export const mockTeam: Team = {
  id: IDS.team,
  name: 'Falcões FC',
  photo_uri: null,
  venue: 'Ginásio Central',
  created_at: '2024-01-15T10:00:00.000Z',
};

// ─── Squads ─────────────────────────────────────────────────────────────────
export const mockSquad: Squad = {
  id: IDS.squad,
  team_id: IDS.team,
  sport_type: 'futsal',
  name: 'Falcões - Futsal',
  created_at: '2024-01-15T10:00:00.000Z',
  team_name: 'Falcões FC',
};

export const mockSquadSociety: Squad = {
  id: IDS.squad2,
  team_id: IDS.team,
  sport_type: 'society',
  name: 'Falcões - Society',
  created_at: '2024-01-15T10:00:00.000Z',
  team_name: 'Falcões FC',
};

// ─── Positions ──────────────────────────────────────────────────────────────
export const mockPositions: Position[] = [
  { id: IDS.position1, squad_id: IDS.squad, name: 'Goleiro', abbreviation: 'GOL', order_index: 0, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.position2, squad_id: IDS.squad, name: 'Fixo', abbreviation: 'FIX', order_index: 1, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.position3, squad_id: IDS.squad, name: 'Ala', abbreviation: 'ALA', order_index: 2, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.position4, squad_id: IDS.squad, name: 'Pivô', abbreviation: 'PIV', order_index: 3, created_at: '2024-01-15T10:00:00.000Z' },
];

// ─── Players ────────────────────────────────────────────────────────────────
export const mockPlayers: Player[] = [
  { id: IDS.player1, team_id: IDS.team, squad_id: IDS.squad, position_id: IDS.position1, name: 'Lucas Silva', number: 1, height: 185, weight: 82, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z', position_name: 'Goleiro', position_abbreviation: 'GOL' },
  { id: IDS.player2, team_id: IDS.team, squad_id: IDS.squad, position_id: IDS.position2, name: 'Pedro Santos', number: 5, height: 175, weight: 70, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z', position_name: 'Fixo', position_abbreviation: 'FIX' },
  { id: IDS.player3, team_id: IDS.team, squad_id: IDS.squad, position_id: IDS.position3, name: 'Carlos Oliveira', number: 7, height: 170, weight: 68, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z', position_name: 'Ala', position_abbreviation: 'ALA' },
  { id: IDS.player4, team_id: IDS.team, squad_id: IDS.squad, position_id: IDS.position3, name: 'Bruno Costa', number: 11, height: 172, weight: 71, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z', position_name: 'Ala', position_abbreviation: 'ALA' },
  { id: IDS.player5, team_id: IDS.team, squad_id: IDS.squad, position_id: IDS.position4, name: 'Rafael Lima', number: 9, height: 178, weight: 75, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z', position_name: 'Pivô', position_abbreviation: 'PIV' },
  { id: IDS.player6, team_id: IDS.team, squad_id: IDS.squad, position_id: null, name: 'Diego Ferreira', number: 10, height: null, weight: null, photo_uri: null, created_at: '2024-01-15T10:00:00.000Z' },
];

// ─── Scout Profile ──────────────────────────────────────────────────────────
export const mockProfile: ScoutProfile = {
  id: IDS.profile,
  user_id: 'user-001',
  name: 'Futsal Completo',
  sport_type: 'futsal',
  created_at: '2024-01-15T10:00:00.000Z',
};

// ─── Scout Categories ───────────────────────────────────────────────────────
export const mockCategories: ScoutCategory[] = [
  { id: IDS.category1, profile_id: IDS.profile, name: 'PASSE', order_index: 0 },
  { id: IDS.category2, profile_id: IDS.profile, name: 'FINALIZAÇÃO', order_index: 1 },
  { id: IDS.category3, profile_id: IDS.profile, name: 'GOLEIRO', order_index: 2 },
];

// ─── Scout Events ───────────────────────────────────────────────────────────
export const mockScoutEvents: ScoutEvent[] = [
  { id: IDS.event1, category_id: IDS.category1, name: 'Passe certo', icon: '✅', event_type: 'count', is_positive: true, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.event2, category_id: IDS.category1, name: 'Passe errado', icon: '❌', event_type: 'count', is_positive: false, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.event3, category_id: IDS.category2, name: 'Gol', icon: '⚽', event_type: 'count', is_positive: true, created_at: '2024-01-15T10:00:00.000Z' },
  { id: IDS.event4, category_id: IDS.category3, name: 'Defesa', icon: '🧤', event_type: 'count', is_positive: true, created_at: '2024-01-15T10:00:00.000Z' },
];

// ─── Match ──────────────────────────────────────────────────────────────────
export const mockMatch: Match = {
  id: IDS.match,
  team_id: IDS.team,
  squad_id: IDS.squad,
  opponent_name: 'Águias FC',
  profile_id: IDS.profile,
  date: '2024-03-20',
  location: 'Ginásio Central',
  is_home: true,
  elapsed_seconds: 0,
  is_timer_running: 0,
  current_period: 1,
  total_duration_seconds: null,
  first_half_seconds: null,
  second_half_seconds: null,
  created_at: '2024-03-20T14:00:00.000Z',
  team_name: 'Falcões FC',
  sport_type: 'futsal',
  profile_name: 'Futsal Completo',
};

// ─── Match Players ──────────────────────────────────────────────────────────
export const mockMatchPlayers: MatchPlayer[] = [
  { id: 'mp-1', match_id: IDS.match, player_id: IDS.player1, team_id: IDS.team, is_starting: true, tactical_position: 1, player_name: 'Lucas Silva', player_number: 1 },
  { id: 'mp-2', match_id: IDS.match, player_id: IDS.player2, team_id: IDS.team, is_starting: true, tactical_position: 2, player_name: 'Pedro Santos', player_number: 5 },
  { id: 'mp-3', match_id: IDS.match, player_id: IDS.player3, team_id: IDS.team, is_starting: true, tactical_position: 3, player_name: 'Carlos Oliveira', player_number: 7 },
  { id: 'mp-4', match_id: IDS.match, player_id: IDS.player4, team_id: IDS.team, is_starting: true, tactical_position: 4, player_name: 'Bruno Costa', player_number: 11 },
  { id: 'mp-5', match_id: IDS.match, player_id: IDS.player5, team_id: IDS.team, is_starting: true, tactical_position: 5, player_name: 'Rafael Lima', player_number: 9 },
  { id: 'mp-6', match_id: IDS.match, player_id: IDS.player6, team_id: IDS.team, is_starting: false, tactical_position: null, player_name: 'Diego Ferreira', player_number: 10 },
];

// ─── Match Events (scout data) ─────────────────────────────────────────────
export function createMockMatchEvent(overrides: Partial<MatchEvent> = {}): MatchEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    match_id: IDS.match,
    team_id: IDS.team,
    player_id: IDS.player2,
    event_id: IDS.event1,
    minute: 5,
    second: 30,
    period: 1,
    x: null,
    y: null,
    created_at: new Date().toISOString(),
    event_name: 'Passe certo',
    event_icon: '✅',
    event_type: 'count',
    is_positive: true,
    ...overrides,
  };
}

/**
 * Creates a full realistic match events timeline.
 * Simulates a 1st half of futsal with passes, shots, and goals.
 */
export function createMatchEventsTimeline(): MatchEvent[] {
  return [
    // 1st half events
    createMockMatchEvent({ id: 'e1',  player_id: IDS.player2, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 2, second: 15, period: 1 }),
    createMockMatchEvent({ id: 'e2',  player_id: IDS.player3, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 3, second: 0, period: 1 }),
    createMockMatchEvent({ id: 'e3',  player_id: IDS.player2, event_id: IDS.event2, event_name: 'Passe errado', is_positive: false, minute: 5, second: 45, period: 1 }),
    createMockMatchEvent({ id: 'e4',  player_id: IDS.player5, event_id: IDS.event3, event_name: 'Gol', event_icon: '⚽', is_positive: true, minute: 8, second: 12, period: 1 }),
    createMockMatchEvent({ id: 'e5',  player_id: IDS.player3, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 10, second: 0, period: 1 }),
    createMockMatchEvent({ id: 'e6',  player_id: IDS.player4, event_id: IDS.event2, event_name: 'Passe errado', is_positive: false, minute: 12, second: 30, period: 1 }),
    createMockMatchEvent({ id: 'e7',  player_id: IDS.player1, event_id: IDS.event4, event_name: 'Defesa', event_icon: '🧤', is_positive: true, minute: 15, second: 0, period: 1 }),
    createMockMatchEvent({ id: 'e8',  player_id: IDS.player5, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 17, second: 20, period: 1 }),
    createMockMatchEvent({ id: 'e9',  player_id: IDS.player2, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 18, second: 55, period: 1 }),
    createMockMatchEvent({ id: 'e10', player_id: IDS.player5, event_id: IDS.event3, event_name: 'Gol', event_icon: '⚽', is_positive: true, minute: 19, second: 30, period: 1 }),
    // 2nd half events
    createMockMatchEvent({ id: 'e11', player_id: IDS.player2, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 1, second: 0, period: 2 }),
    createMockMatchEvent({ id: 'e12', player_id: IDS.player3, event_id: IDS.event2, event_name: 'Passe errado', is_positive: false, minute: 4, second: 15, period: 2 }),
    createMockMatchEvent({ id: 'e13', player_id: IDS.player1, event_id: IDS.event4, event_name: 'Defesa', event_icon: '🧤', is_positive: true, minute: 7, second: 45, period: 2 }),
    createMockMatchEvent({ id: 'e14', player_id: IDS.player4, event_id: IDS.event1, event_name: 'Passe certo', is_positive: true, minute: 10, second: 10, period: 2 }),
    createMockMatchEvent({ id: 'e15', player_id: IDS.player6, event_id: IDS.event3, event_name: 'Gol', event_icon: '⚽', is_positive: true, minute: 15, second: 0, period: 2 }),
  ];
}

// ─── Bench / Field Periods ──────────────────────────────────────────────────
export const mockBenchPeriods: BenchPeriod[] = [
  {
    id: 'bp-1', match_id: IDS.match, player_id: IDS.player6,
    start_minute: 0, start_second: 0, end_minute: 10, end_second: 0,
    start_timestamp: Date.now() - 600000, end_timestamp: Date.now(),
    period: 1, created_at: '2024-03-20T14:00:00.000Z',
  },
];

export const mockFieldPeriods: FieldPeriod[] = [
  {
    id: 'fp-1', match_id: IDS.match, player_id: IDS.player2,
    start_minute: 0, start_second: 0, end_minute: null, end_second: null,
    start_timestamp: Date.now() - 1200000, end_timestamp: null,
    period: 1, created_at: '2024-03-20T14:00:00.000Z',
  },
];

// ─── Live Match State ───────────────────────────────────────────────────────
export const mockLiveState: LiveMatchState = {
  match: mockMatch,
  players: mockMatchPlayers,
  events: createMatchEventsTimeline(),
  selectedPlayerId: null,
  selectedTeamId: null,
  elapsedSeconds: 0,
  isRunning: false,
  period: 1,
  benchPausedElapsed: {},
};
