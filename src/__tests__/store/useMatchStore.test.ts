/**
 * Tests for useMatchStore — the core scout session store.
 * Validates event recording, undo, timer, period management, and bench elapsed.
 */
import { useMatchStore } from '@/store/useMatchStore';
import {
  IDS,
  mockMatch,
  mockMatchPlayers,
  createMockMatchEvent,
  createMatchEventsTimeline,
} from '../mocks/mockData';

// ─── Mock repositories ──────────────────────────────────────────────────────
jest.mock('@/database/repositories/matchRepository', () => ({
  getMatches: jest.fn().mockReturnValue([]),
  createMatch: jest.fn(),
  deleteMatch: jest.fn(),
  getMatchPlayers: jest.fn().mockReturnValue([]),
  addMatchPlayer: jest.fn(),
  removeMatchPlayer: jest.fn(),
  updateMatchTimer: jest.fn(),
}));

jest.mock('@/database/repositories/eventRepository', () => ({
  getMatchEvents: jest.fn().mockReturnValue([]),
  insertMatchEvent: jest.fn(),
  deleteMatchEvent: jest.fn(),
}));

const matchRepo = require('@/database/repositories/matchRepository');
const eventRepo = require('@/database/repositories/eventRepository');

describe('useMatchStore', () => {
  beforeEach(() => {
    // Reset store to default state
    useMatchStore.setState({
      matches: [],
      live: {
        match: null,
        players: [],
        events: [],
        selectedPlayerId: null,
        selectedTeamId: null,
        elapsedSeconds: 0,
        isRunning: false,
        period: 1,
        benchPausedElapsed: {},
      },
    });
    jest.clearAllMocks();
  });

  // ─── Match CRUD ─────────────────────────────────────────────────────────
  describe('Match CRUD', () => {
    it('loadMatches should populate matches from repository', () => {
      const mockMatches = [mockMatch];
      matchRepo.getMatches.mockReturnValue(mockMatches);

      useMatchStore.getState().loadMatches();

      expect(matchRepo.getMatches).toHaveBeenCalled();
      expect(useMatchStore.getState().matches).toEqual(mockMatches);
    });

    it('createMatch should call repo and reload matches', () => {
      matchRepo.getMatches.mockReturnValue([mockMatch]);

      useMatchStore.getState().createMatch(mockMatch);

      expect(matchRepo.createMatch).toHaveBeenCalledWith(mockMatch);
      expect(useMatchStore.getState().matches).toHaveLength(1);
    });

    it('deleteMatch should remove match from state', () => {
      useMatchStore.setState({ matches: [mockMatch] });

      useMatchStore.getState().deleteMatch(mockMatch.id);

      expect(matchRepo.deleteMatch).toHaveBeenCalledWith(mockMatch.id);
      expect(useMatchStore.getState().matches).toHaveLength(0);
    });
  });

  // ─── Live Session ───────────────────────────────────────────────────────
  describe('Live Session', () => {
    it('startLiveSession should set match, load events and players', () => {
      const events = createMatchEventsTimeline();
      eventRepo.getMatchEvents.mockReturnValue(events);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);

      useMatchStore.getState().startLiveSession(mockMatch);

      const { live } = useMatchStore.getState();
      expect(live.match).toEqual(mockMatch);
      expect(live.events).toEqual(events);
      expect(live.players).toEqual(mockMatchPlayers);
      expect(live.period).toBe(1);
    });

    it('startLiveSession should restore timer state from match', () => {
      const runningMatch = { ...mockMatch, elapsed_seconds: 120, is_timer_running: 1, current_period: 2 };
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue([]);

      useMatchStore.getState().startLiveSession(runningMatch);

      const { live } = useMatchStore.getState();
      expect(live.elapsedSeconds).toBe(120);
      expect(live.isRunning).toBe(true);
      expect(live.period).toBe(2);
    });

    it('endLiveSession should reset to defaults', () => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      useMatchStore.getState().startLiveSession(mockMatch);

      useMatchStore.getState().endLiveSession();

      const { live } = useMatchStore.getState();
      expect(live.match).toBeNull();
      expect(live.players).toHaveLength(0);
      expect(live.events).toHaveLength(0);
    });

    it('setSelectedPlayer should update player and team IDs', () => {
      useMatchStore.getState().setSelectedPlayer(IDS.player2, IDS.team);

      const { live } = useMatchStore.getState();
      expect(live.selectedPlayerId).toBe(IDS.player2);
      expect(live.selectedTeamId).toBe(IDS.team);
    });
  });

  // ─── Event Recording (Scout Core) ──────────────────────────────────────
  describe('Event Recording', () => {
    it('addLiveEvent should persist event and append to live.events', () => {
      const event = createMockMatchEvent({
        id: 'evt-test-1',
        player_id: IDS.player2,
        event_name: 'Passe certo',
        minute: 5,
        second: 30,
        period: 1,
      });

      useMatchStore.getState().addLiveEvent(event);

      expect(eventRepo.insertMatchEvent).toHaveBeenCalledWith(event);
      expect(useMatchStore.getState().live.events).toHaveLength(1);
      expect(useMatchStore.getState().live.events[0]).toEqual(event);
    });

    it('should record multiple events in sequence', () => {
      const evt1 = createMockMatchEvent({ id: 'e1', minute: 1, second: 0, event_name: 'Passe certo' });
      const evt2 = createMockMatchEvent({ id: 'e2', minute: 3, second: 12, event_name: 'Gol' });
      const evt3 = createMockMatchEvent({ id: 'e3', minute: 5, second: 45, event_name: 'Passe errado' });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().addLiveEvent(evt3);

      expect(useMatchStore.getState().live.events).toHaveLength(3);
      expect(eventRepo.insertMatchEvent).toHaveBeenCalledTimes(3);
    });

    it('should record events for different players', () => {
      const evt1 = createMockMatchEvent({ id: 'e1', player_id: IDS.player2, event_name: 'Passe certo' });
      const evt2 = createMockMatchEvent({ id: 'e2', player_id: IDS.player5, event_name: 'Gol' });
      const evt3 = createMockMatchEvent({ id: 'e3', player_id: IDS.player1, event_name: 'Defesa' });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().addLiveEvent(evt3);

      const events = useMatchStore.getState().live.events;
      expect(events[0].player_id).toBe(IDS.player2);
      expect(events[1].player_id).toBe(IDS.player5);
      expect(events[2].player_id).toBe(IDS.player1);
    });

    it('should record events across periods', () => {
      const evt1 = createMockMatchEvent({ id: 'e1', period: 1, minute: 19, second: 0 });
      const evt2 = createMockMatchEvent({ id: 'e2', period: 2, minute: 2, second: 0 });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);

      const events = useMatchStore.getState().live.events;
      expect(events[0].period).toBe(1);
      expect(events[1].period).toBe(2);
    });

    it('deleteEvent should remove specific event from live state', () => {
      const evt1 = createMockMatchEvent({ id: 'e1', event_name: 'Passe certo' });
      const evt2 = createMockMatchEvent({ id: 'e2', event_name: 'Gol' });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().deleteEvent('e1');

      expect(eventRepo.deleteMatchEvent).toHaveBeenCalledWith('e1');
      expect(useMatchStore.getState().live.events).toHaveLength(1);
      expect(useMatchStore.getState().live.events[0].id).toBe('e2');
    });

    it('undoLastEvent should remove the most recent event', () => {
      const evt1 = createMockMatchEvent({ id: 'e1', event_name: 'Passe certo' });
      const evt2 = createMockMatchEvent({ id: 'e2', event_name: 'Gol' });
      const evt3 = createMockMatchEvent({ id: 'e3', event_name: 'Defesa' });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().addLiveEvent(evt3);

      useMatchStore.getState().undoLastEvent();

      expect(eventRepo.deleteMatchEvent).toHaveBeenCalledWith('e3');
      expect(useMatchStore.getState().live.events).toHaveLength(2);
      expect(useMatchStore.getState().live.events.map((e) => e.id)).toEqual(['e1', 'e2']);
    });

    it('undoLastEvent should do nothing when events are empty', () => {
      useMatchStore.getState().undoLastEvent();

      expect(eventRepo.deleteMatchEvent).not.toHaveBeenCalled();
      expect(useMatchStore.getState().live.events).toHaveLength(0);
    });

    it('should handle rapid event recording (burst mode)', () => {
      for (let i = 0; i < 20; i++) {
        useMatchStore.getState().addLiveEvent(
          createMockMatchEvent({ id: `burst-${i}`, minute: i, second: 0 })
        );
      }

      expect(useMatchStore.getState().live.events).toHaveLength(20);
      expect(eventRepo.insertMatchEvent).toHaveBeenCalledTimes(20);
    });
  });

  // ─── Timer Management ─────────────────────────────────────────────────
  describe('Timer Management', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue([]);
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('setTimer should update elapsed and running state', () => {
      useMatchStore.getState().setTimer(120, true);

      const { live } = useMatchStore.getState();
      expect(live.elapsedSeconds).toBe(120);
      expect(live.isRunning).toBe(true);
    });

    it('setTimer should persist to database when match is active', () => {
      useMatchStore.getState().setTimer(60, true);

      expect(matchRepo.updateMatchTimer).toHaveBeenCalledWith(
        IDS.match, 60, true, 1
      );
    });

    it('setPeriod should update period and persist', () => {
      useMatchStore.getState().setPeriod(2);

      const { live } = useMatchStore.getState();
      expect(live.period).toBe(2);
      expect(matchRepo.updateMatchTimer).toHaveBeenCalledWith(
        IDS.match, 0, false, 2
      );
    });

    it('should transition periods: 0 → 1 → 2 → 0', () => {
      useMatchStore.getState().setPeriod(0);
      expect(useMatchStore.getState().live.period).toBe(0);

      useMatchStore.getState().setPeriod(1);
      expect(useMatchStore.getState().live.period).toBe(1);

      useMatchStore.getState().setPeriod(2);
      expect(useMatchStore.getState().live.period).toBe(2);

      useMatchStore.getState().setPeriod(0);
      expect(useMatchStore.getState().live.period).toBe(0);
    });
  });

  // ─── Bench Elapsed Management ──────────────────────────────────────────
  describe('Bench Elapsed Management', () => {
    it('saveBenchElapsed should accumulate elapsed per player', () => {
      useMatchStore.getState().saveBenchElapsed({
        [IDS.player6]: 300,
      });

      expect(useMatchStore.getState().live.benchPausedElapsed[IDS.player6]).toBe(300);
    });

    it('saveBenchElapsed should merge with existing values', () => {
      useMatchStore.getState().saveBenchElapsed({ [IDS.player6]: 300 });
      useMatchStore.getState().saveBenchElapsed({ [IDS.player5]: 200 });

      const bench = useMatchStore.getState().live.benchPausedElapsed;
      expect(bench[IDS.player6]).toBe(300);
      expect(bench[IDS.player5]).toBe(200);
    });

    it('saveBenchElapsed should overwrite existing value for same player', () => {
      useMatchStore.getState().saveBenchElapsed({ [IDS.player6]: 300 });
      useMatchStore.getState().saveBenchElapsed({ [IDS.player6]: 450 });

      expect(useMatchStore.getState().live.benchPausedElapsed[IDS.player6]).toBe(450);
    });

    it('clearBenchElapsed should remove specific player entry', () => {
      useMatchStore.getState().saveBenchElapsed({
        [IDS.player5]: 200,
        [IDS.player6]: 300,
      });

      useMatchStore.getState().clearBenchElapsed(IDS.player6);

      const bench = useMatchStore.getState().live.benchPausedElapsed;
      expect(bench[IDS.player6]).toBeUndefined();
      expect(bench[IDS.player5]).toBe(200);
    });
  });

  // ─── Match Players ─────────────────────────────────────────────────────
  describe('Match Players', () => {
    it('loadMatchPlayers should fetch and set players', () => {
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);

      useMatchStore.getState().loadMatchPlayers(IDS.match);

      expect(matchRepo.getMatchPlayers).toHaveBeenCalledWith(IDS.match);
      expect(useMatchStore.getState().live.players).toEqual(mockMatchPlayers);
    });

    it('addMatchPlayer should persist and reload players', () => {
      const newPlayer = mockMatchPlayers[0];
      matchRepo.getMatchPlayers.mockReturnValue([newPlayer]);

      useMatchStore.getState().addMatchPlayer(newPlayer);

      expect(matchRepo.addMatchPlayer).toHaveBeenCalledWith(newPlayer);
      expect(useMatchStore.getState().live.players).toHaveLength(1);
    });

    it('removeMatchPlayer should remove from state', () => {
      useMatchStore.setState((s) => ({
        live: { ...s.live, players: mockMatchPlayers },
      }));

      useMatchStore.getState().removeMatchPlayer('mp-1');

      expect(matchRepo.removeMatchPlayer).toHaveBeenCalledWith('mp-1');
      expect(useMatchStore.getState().live.players.find((p) => p.id === 'mp-1')).toBeUndefined();
    });
  });

  // ─── Load Live Events ─────────────────────────────────────────────────
  describe('loadLiveEvents', () => {
    it('should refresh events from repository', () => {
      const events = createMatchEventsTimeline();
      eventRepo.getMatchEvents.mockReturnValue(events);

      useMatchStore.getState().loadLiveEvents(IDS.match);

      expect(eventRepo.getMatchEvents).toHaveBeenCalledWith(IDS.match);
      expect(useMatchStore.getState().live.events).toEqual(events);
    });
  });
});
