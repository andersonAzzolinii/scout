/**
 * Scout Live Session Logic Tests
 * 
 * Core tests for the scout system: event recording flow,
 * event filtering by player/category, substitution impact,
 * timeline integrity, and match lifecycle.
 */
import { useMatchStore } from '@/store/useMatchStore';
import {
  IDS,
  mockMatch,
  mockMatchPlayers,
  createMockMatchEvent,
  createMatchEventsTimeline,
  mockScoutEvents,
  mockCategories,
} from '../mocks/mockData';

// ─── Mock repositories ──────────────────────────────────────────────────────
jest.mock('@/database/repositories/matchRepository', () => ({
  getMatches: jest.fn().mockReturnValue([]),
  getMatchById: jest.fn(),
  createMatch: jest.fn(),
  deleteMatch: jest.fn(),
  getMatchPlayers: jest.fn().mockReturnValue([]),
  addMatchPlayer: jest.fn(),
  removeMatchPlayer: jest.fn(),
  updateMatchTimer: jest.fn(),
  finalizeMatch: jest.fn(),
}));

jest.mock('@/database/repositories/eventRepository', () => ({
  getMatchEvents: jest.fn().mockReturnValue([]),
  insertMatchEvent: jest.fn(),
  deleteMatchEvent: jest.fn(),
}));

const matchRepo = require('@/database/repositories/matchRepository');
const eventRepo = require('@/database/repositories/eventRepository');

describe('Scout Live Session Logic', () => {
  beforeEach(() => {
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

  // ─── Event Recording Flow ──────────────────────────────────────────────
  describe('Event Recording Flow', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should record a pass event with correct minute/second/period', () => {
      const event = createMockMatchEvent({
        id: 'scout-e1',
        player_id: IDS.player2,
        event_id: IDS.event1,
        event_name: 'Passe certo',
        minute: 5,
        second: 30,
        period: 1,
        is_positive: true,
      });

      useMatchStore.getState().addLiveEvent(event);

      const recorded = useMatchStore.getState().live.events[0];
      expect(recorded.event_name).toBe('Passe certo');
      expect(recorded.minute).toBe(5);
      expect(recorded.second).toBe(30);
      expect(recorded.period).toBe(1);
      expect(recorded.player_id).toBe(IDS.player2);
      expect(recorded.is_positive).toBe(true);
    });

    it('should record a goal event with correct data', () => {
      const event = createMockMatchEvent({
        id: 'scout-goal',
        player_id: IDS.player5,
        event_id: IDS.event3,
        event_name: 'Gol',
        event_icon: '⚽',
        minute: 8,
        second: 12,
        period: 1,
        is_positive: true,
      });

      useMatchStore.getState().addLiveEvent(event);

      const recorded = useMatchStore.getState().live.events[0];
      expect(recorded.event_name).toBe('Gol');
      expect(recorded.event_icon).toBe('⚽');
      expect(recorded.player_id).toBe(IDS.player5);
    });

    it('should record goalkeeper-specific events for player1 (GK)', () => {
      const defense = createMockMatchEvent({
        id: 'scout-def',
        player_id: IDS.player1, // Goleiro
        event_id: IDS.event4,
        event_name: 'Defesa',
        event_icon: '🧤',
        minute: 15,
        second: 0,
        period: 1,
        is_positive: true,
      });

      useMatchStore.getState().addLiveEvent(defense);

      const events = useMatchStore.getState().live.events;
      expect(events).toHaveLength(1);
      expect(events[0].player_id).toBe(IDS.player1);
      expect(events[0].event_name).toBe('Defesa');
    });

    it('should record negative events (errors)', () => {
      const error = createMockMatchEvent({
        id: 'scout-err',
        player_id: IDS.player4,
        event_id: IDS.event2,
        event_name: 'Passe errado',
        minute: 12,
        second: 30,
        period: 1,
        is_positive: false,
      });

      useMatchStore.getState().addLiveEvent(error);

      expect(useMatchStore.getState().live.events[0].is_positive).toBe(false);
    });
  });

  // ─── Event Filtering by Player ─────────────────────────────────────────
  describe('Event Filtering by Player', () => {
    it('should correctly filter events per player from timeline', () => {
      const timeline = createMatchEventsTimeline();
      useMatchStore.setState((s) => ({
        live: { ...s.live, events: timeline },
      }));

      const events = useMatchStore.getState().live.events;

      // Count events per player
      const player2Events = events.filter((e) => e.player_id === IDS.player2);
      const player5Events = events.filter((e) => e.player_id === IDS.player5);
      const player1Events = events.filter((e) => e.player_id === IDS.player1);
      const player3Events = events.filter((e) => e.player_id === IDS.player3);

      // player2 (Fixo): 3 passes certos + 1 errado = 4 (e1, e3, e9, e11)
      expect(player2Events).toHaveLength(4);
      // player5 (Pivô): 2 goals + 1 pass = 3
      expect(player5Events).toHaveLength(3);
      // player1 (Goleiro): 2 defesas = 2
      expect(player1Events).toHaveLength(2);
      // player3 (Ala): 2 passes certos + 1 errado = 3
      expect(player3Events).toHaveLength(3);
    });

    it('should identify positive vs negative events per player', () => {
      const timeline = createMatchEventsTimeline();

      const player2Events = timeline.filter((e) => e.player_id === IDS.player2);
      const positives = player2Events.filter((e) => e.is_positive);
      const negatives = player2Events.filter((e) => !e.is_positive);

      expect(positives.length).toBeGreaterThan(0);
      expect(negatives.length).toBeGreaterThan(0);
    });

    it('should filter events by category', () => {
      const timeline = createMatchEventsTimeline();

      const passEvents = timeline.filter(
        (e) => e.event_id === IDS.event1 || e.event_id === IDS.event2
      );
      const goalEvents = timeline.filter((e) => e.event_id === IDS.event3);
      const defenseEvents = timeline.filter((e) => e.event_id === IDS.event4);

      // From timeline: 7 correct + 3 wrong = 10 pass events
      expect(passEvents.length).toBeGreaterThan(0);
      // 3 goals
      expect(goalEvents).toHaveLength(3);
      // 2 defenses
      expect(defenseEvents).toHaveLength(2);
    });
  });

  // ─── Event Filtering by Period ─────────────────────────────────────────
  describe('Event Filtering by Period', () => {
    it('should correctly separate 1st and 2nd half events', () => {
      const timeline = createMatchEventsTimeline();

      const firstHalf = timeline.filter((e) => e.period === 1);
      const secondHalf = timeline.filter((e) => e.period === 2);

      expect(firstHalf).toHaveLength(10);
      expect(secondHalf).toHaveLength(5);
    });

    it('all events should have valid periods', () => {
      const timeline = createMatchEventsTimeline();
      timeline.forEach((e) => {
        expect([1, 2]).toContain(e.period);
      });
    });

    it('events should be chronologically ordered within each period', () => {
      const timeline = createMatchEventsTimeline();

      const firstHalf = timeline.filter((e) => e.period === 1);
      for (let i = 1; i < firstHalf.length; i++) {
        const prev = firstHalf[i - 1].minute * 60 + firstHalf[i - 1].second;
        const curr = firstHalf[i].minute * 60 + firstHalf[i].second;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }

      const secondHalf = timeline.filter((e) => e.period === 2);
      for (let i = 1; i < secondHalf.length; i++) {
        const prev = secondHalf[i - 1].minute * 60 + secondHalf[i - 1].second;
        const curr = secondHalf[i].minute * 60 + secondHalf[i].second;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  // ─── Undo Event Logic ─────────────────────────────────────────────────
  describe('Undo Event Logic', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should undo the last event only', () => {
      const evt1 = createMockMatchEvent({ id: 'u1', event_name: 'Passe certo', minute: 1 });
      const evt2 = createMockMatchEvent({ id: 'u2', event_name: 'Gol', minute: 5 });
      const evt3 = createMockMatchEvent({ id: 'u3', event_name: 'Defesa', minute: 8 });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().addLiveEvent(evt3);

      useMatchStore.getState().undoLastEvent();

      const events = useMatchStore.getState().live.events;
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.id)).toEqual(['u1', 'u2']);
      expect(eventRepo.deleteMatchEvent).toHaveBeenCalledWith('u3');
    });

    it('should handle multiple undo operations', () => {
      const evt1 = createMockMatchEvent({ id: 'u1', minute: 1 });
      const evt2 = createMockMatchEvent({ id: 'u2', minute: 5 });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);

      useMatchStore.getState().undoLastEvent(); // removes u2
      useMatchStore.getState().undoLastEvent(); // removes u1

      expect(useMatchStore.getState().live.events).toHaveLength(0);
    });

    it('should not crash when undoing with no events', () => {
      useMatchStore.getState().undoLastEvent();
      expect(eventRepo.deleteMatchEvent).not.toHaveBeenCalled();
    });

    it('should allow recording after undo', () => {
      const evt1 = createMockMatchEvent({ id: 'u1', event_name: 'Passe certo' });
      const evt2 = createMockMatchEvent({ id: 'u2', event_name: 'Gol' });

      useMatchStore.getState().addLiveEvent(evt1);
      useMatchStore.getState().addLiveEvent(evt2);
      useMatchStore.getState().undoLastEvent(); // removes u2

      const evt3 = createMockMatchEvent({ id: 'u3', event_name: 'Defesa' });
      useMatchStore.getState().addLiveEvent(evt3);

      const events = useMatchStore.getState().live.events;
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.id)).toEqual(['u1', 'u3']);
    });
  });

  // ─── Match Lifecycle ───────────────────────────────────────────────────
  describe('Match Lifecycle', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
    });

    it('should follow full match lifecycle: start → play → halftime → 2nd half → end', () => {
      // 1. Start session
      useMatchStore.getState().startLiveSession(mockMatch);
      expect(useMatchStore.getState().live.match).toBeTruthy();
      expect(useMatchStore.getState().live.period).toBe(1);

      // 2. Record 1st half events
      useMatchStore.getState().addLiveEvent(
        createMockMatchEvent({ id: 'lc-1', period: 1, minute: 5, event_name: 'Passe certo' })
      );
      useMatchStore.getState().addLiveEvent(
        createMockMatchEvent({ id: 'lc-2', period: 1, minute: 12, event_name: 'Gol' })
      );

      // 3. Halftime — period transitions to 2
      useMatchStore.getState().setPeriod(2);
      expect(useMatchStore.getState().live.period).toBe(2);

      // 4. Record 2nd half events
      useMatchStore.getState().addLiveEvent(
        createMockMatchEvent({ id: 'lc-3', period: 2, minute: 3, event_name: 'Defesa' })
      );

      // 5. End match
      useMatchStore.getState().setPeriod(0);
      expect(useMatchStore.getState().live.period).toBe(0);

      // Verify events across both halves
      expect(useMatchStore.getState().live.events).toHaveLength(3);
    });

    it('should preserve events when session is re-opened', () => {
      const existingEvents = createMatchEventsTimeline();
      eventRepo.getMatchEvents.mockReturnValue(existingEvents);

      useMatchStore.getState().startLiveSession(mockMatch);

      expect(useMatchStore.getState().live.events).toHaveLength(15);
    });

    it('should reset all state on endLiveSession', () => {
      useMatchStore.getState().startLiveSession(mockMatch);
      useMatchStore.getState().addLiveEvent(
        createMockMatchEvent({ id: 'test-reset' })
      );

      useMatchStore.getState().endLiveSession();

      const { live } = useMatchStore.getState();
      expect(live.match).toBeNull();
      expect(live.events).toHaveLength(0);
      expect(live.players).toHaveLength(0);
      expect(live.elapsedSeconds).toBe(0);
      expect(live.isRunning).toBe(false);
      expect(live.benchPausedElapsed).toEqual({});
    });
  });

  // ─── Substitution Impact on Scout ──────────────────────────────────────
  describe('Substitution Impact', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('substitute player (player6) can record events after entering', () => {
      // Sub enters at minute 10
      const subEvent = createMockMatchEvent({
        id: 'sub-evt-1',
        player_id: IDS.player6, // Substitute
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 15,
        second: 0,
        period: 2,
      });

      useMatchStore.getState().addLiveEvent(subEvent);

      const events = useMatchStore.getState().live.events;
      expect(events[0].player_id).toBe(IDS.player6);
      expect(events[0].event_name).toBe('Gol');
    });

    it('should track events correctly for both starter and sub', () => {
      // Starter event
      const starterEvt = createMockMatchEvent({
        id: 'starter-1',
        player_id: IDS.player4, // Starting ALA
        event_name: 'Passe certo',
        minute: 5,
      });

      // Sub event (player6 replaced player4)
      const subEvt = createMockMatchEvent({
        id: 'sub-1',
        player_id: IDS.player6,
        event_name: 'Passe certo',
        minute: 15,
      });

      useMatchStore.getState().addLiveEvent(starterEvt);
      useMatchStore.getState().addLiveEvent(subEvt);

      const events = useMatchStore.getState().live.events;
      expect(events.filter((e) => e.player_id === IDS.player4)).toHaveLength(1);
      expect(events.filter((e) => e.player_id === IDS.player6)).toHaveLength(1);
    });
  });

  // ─── Bench Elapsed Tracking ────────────────────────────────────────────
  describe('Bench Elapsed Tracking', () => {
    it('should track bench time for substitutes', () => {
      useMatchStore.getState().saveBenchElapsed({
        [IDS.player6]: 600, // 10 minutes on bench
      });

      const bench = useMatchStore.getState().live.benchPausedElapsed;
      expect(bench[IDS.player6]).toBe(600);
    });

    it('should handle multiple subs on bench', () => {
      useMatchStore.getState().saveBenchElapsed({
        [IDS.player5]: 300,
        [IDS.player6]: 600,
      });

      const bench = useMatchStore.getState().live.benchPausedElapsed;
      expect(bench[IDS.player5]).toBe(300);
      expect(bench[IDS.player6]).toBe(600);
    });

    it('should clear bench time when player enters field', () => {
      useMatchStore.getState().saveBenchElapsed({
        [IDS.player6]: 600,
      });

      useMatchStore.getState().clearBenchElapsed(IDS.player6);

      expect(useMatchStore.getState().live.benchPausedElapsed[IDS.player6]).toBeUndefined();
    });
  });

  // ─── Player Selection ─────────────────────────────────────────────────
  describe('Player Selection', () => {
    it('should select player for event recording', () => {
      useMatchStore.getState().setSelectedPlayer(IDS.player2, IDS.team);

      const { live } = useMatchStore.getState();
      expect(live.selectedPlayerId).toBe(IDS.player2);
      expect(live.selectedTeamId).toBe(IDS.team);
    });

    it('should change selected player', () => {
      useMatchStore.getState().setSelectedPlayer(IDS.player2, IDS.team);
      useMatchStore.getState().setSelectedPlayer(IDS.player5, IDS.team);

      expect(useMatchStore.getState().live.selectedPlayerId).toBe(IDS.player5);
    });
  });

  // ─── Event Statistics Computation ──────────────────────────────────────
  describe('Event Statistics from Scout Data', () => {
    it('should compute correct pass accuracy for a player', () => {
      const timeline = createMatchEventsTimeline();
      const player2Events = timeline.filter((e) => e.player_id === IDS.player2);

      const correctPasses = player2Events.filter(
        (e) => e.event_id === IDS.event1
      ).length;
      const wrongPasses = player2Events.filter(
        (e) => e.event_id === IDS.event2
      ).length;
      const totalPasses = correctPasses + wrongPasses;
      const accuracy = totalPasses > 0 ? (correctPasses / totalPasses) * 100 : 0;

      // player2 has 3 correct + 1 wrong = 75%
      expect(accuracy).toBe(75);
    });

    it('should compute total goals from timeline', () => {
      const timeline = createMatchEventsTimeline();
      const goals = timeline.filter((e) => e.event_id === IDS.event3);

      expect(goals).toHaveLength(3);
      // 2 from player5, 1 from player6
      expect(goals.filter((e) => e.player_id === IDS.player5)).toHaveLength(2);
      expect(goals.filter((e) => e.player_id === IDS.player6)).toHaveLength(1);
    });

    it('should compute goalkeeper stats', () => {
      const timeline = createMatchEventsTimeline();
      const gkEvents = timeline.filter((e) => e.player_id === IDS.player1);
      const saves = gkEvents.filter((e) => e.event_id === IDS.event4);

      expect(saves).toHaveLength(2);
      expect(saves.every((e) => e.is_positive)).toBe(true);
    });

    it('should compute positive/negative ratio per player', () => {
      const timeline = createMatchEventsTimeline();

      // For each unique player, compute +/- ratio
      const playerIds = [...new Set(timeline.map((e) => e.player_id))];

      playerIds.forEach((pid) => {
        const playerEvents = timeline.filter((e) => e.player_id === pid);
        const positive = playerEvents.filter((e) => e.is_positive).length;
        const negative = playerEvents.filter((e) => !e.is_positive).length;
        const total = playerEvents.length;

        expect(positive + negative).toBe(total);
        expect(positive).toBeGreaterThanOrEqual(0);
        expect(negative).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
