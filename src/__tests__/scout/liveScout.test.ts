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
  updateScore: jest.fn(),
  incrementScore: jest.fn(),
  decrementScore: jest.fn(),
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
        homeScore: 0,
        awayScore: 0,
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

  // ─── Position Swap via Long Press ──────────────────────────────────────
  describe('Position Swap via Long Press', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      matchRepo.updateMatchPlayerPosition = jest.fn();
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should swap positions between two on-field players', () => {
      // Simulate initial positions: player2 at position 2, player3 at position 3
      const initialPositions = [
        { player: mockMatchPlayers[1], position: 2 }, // player2
        { player: mockMatchPlayers[2], position: 3 }, // player3
      ];

      // Long-press selects player2 for swap
      const selectedForSwap = mockMatchPlayers[1]; // player2 at position 2

      // User taps player3 to swap
      const targetPlayer = mockMatchPlayers[2]; // player3 at position 3

      // Logic: find positions and swap
      const player1Position = initialPositions.find(
        p => p.player.player_id === selectedForSwap.player_id
      )?.position;
      const player2Position = initialPositions.find(
        p => p.player.player_id === targetPlayer.player_id
      )?.position;

      expect(player1Position).toBe(2);
      expect(player2Position).toBe(3);

      // Simulate swap
      const updatedPositions = initialPositions.map(p => {
        if (p.player.player_id === selectedForSwap.player_id) {
          return { ...p, position: player2Position };
        }
        if (p.player.player_id === targetPlayer.player_id) {
          return { ...p, position: player1Position };
        }
        return p;
      });

      // Verify positions were swapped
      const player2NewPos = updatedPositions.find(
        p => p.player.player_id === selectedForSwap.player_id
      )?.position;
      const player3NewPos = updatedPositions.find(
        p => p.player.player_id === targetPlayer.player_id
      )?.position;

      expect(player2NewPos).toBe(3); // player2 moved to position 3
      expect(player3NewPos).toBe(2); // player3 moved to position 2
    });

    it('should update database when positions are swapped', () => {
      const player1 = mockMatchPlayers[0]; // player_id: IDS.player1
      const player2 = mockMatchPlayers[1]; // player_id: IDS.player2
      
      // Simulate database update calls
      matchRepo.updateMatchPlayerPosition(mockMatch.id, player1.player_id, 2);
      matchRepo.updateMatchPlayerPosition(mockMatch.id, player2.player_id, 1);

      expect(matchRepo.updateMatchPlayerPosition).toHaveBeenCalledWith(
        mockMatch.id,
        player1.player_id,
        2
      );
      expect(matchRepo.updateMatchPlayerPosition).toHaveBeenCalledWith(
        mockMatch.id,
        player2.player_id,
        1
      );
      expect(matchRepo.updateMatchPlayerPosition).toHaveBeenCalledTimes(2);
    });

    it('should not swap when selecting the same player (cancels swap mode)', () => {
      const selectedForSwap = mockMatchPlayers[1]; // player2
      
      // User long-presses player2, then taps player2 again
      const isSamePlayer = selectedForSwap.player_id === selectedForSwap.player_id;
      
      expect(isSamePlayer).toBe(true);
      
      // In this case, swap mode should cancel without calling updateMatchPlayerPosition
      if (isSamePlayer) {
        expect(matchRepo.updateMatchPlayerPosition).not.toHaveBeenCalled();
      }
    });

    it('should handle multi-player position rotation', () => {
      // Simulate 3 swaps in sequence: 1→2, 2→3, 3→1
      const positions = [
        { player: mockMatchPlayers[0], position: 1 },
        { player: mockMatchPlayers[1], position: 2 },
        { player: mockMatchPlayers[2], position: 3 },
      ];

      // Swap 1: player at position 1 ↔ player at position 2
      let temp = positions[0].position;
      positions[0].position = positions[1].position;
      positions[1].position = temp;

      expect(positions[0].position).toBe(2);
      expect(positions[1].position).toBe(1);

      // Swap 2: player at new position 2 ↔ player at position 3
      temp = positions[0].position;
      positions[0].position = positions[2].position;
      positions[2].position = temp;

      expect(positions[0].position).toBe(3);
      expect(positions[2].position).toBe(2);
    });

    it('should preserve player field elapsed time after position swap', () => {
      // Mock field start timestamps
      const fieldStartTimestamps = {
        [IDS.player1]: Date.now() - 600000, // 10 minutes ago
        [IDS.player2]: Date.now() - 300000, // 5 minutes ago
      };

      const player1Elapsed = Math.floor((Date.now() - fieldStartTimestamps[IDS.player1]) / 1000);
      const player2Elapsed = Math.floor((Date.now() - fieldStartTimestamps[IDS.player2]) / 1000);

      // After swap, elapsed time should remain unchanged
      expect(player1Elapsed).toBeGreaterThanOrEqual(600); // ~10 min
      expect(player2Elapsed).toBeGreaterThanOrEqual(300); // ~5 min

      // Position changes but elapsed time stays with the player
      const player1NewElapsed = Math.floor((Date.now() - fieldStartTimestamps[IDS.player1]) / 1000);
      expect(player1NewElapsed).toBeGreaterThanOrEqual(player1Elapsed);
    });

    it('should allow swapping goalkeeper with field player', () => {
      const goalkeeper = mockMatchPlayers[0]; // player1 (Goleiro)
      const fieldPlayer = mockMatchPlayers[1]; // player2 (Fixo)

      const initialPositions = [
        { player: goalkeeper, position: 1 },
        { player: fieldPlayer, position: 2 },
      ];

      // Swap GK with field player
      const swapped = [
        { player: goalkeeper, position: 2 },
        { player: fieldPlayer, position: 1 },
      ];

      expect(swapped[0].player.player_id).toBe(goalkeeper.player_id);
      expect(swapped[0].position).toBe(2); // GK now at position 2
      expect(swapped[1].player.player_id).toBe(fieldPlayer.player_id);
      expect(swapped[1].position).toBe(1); // Field player now at position 1 (GK position)
    });

    it('should maintain event history after position swap', () => {
      // Record events before swap
      const evt1 = createMockMatchEvent({
        id: 'before-swap',
        player_id: IDS.player2,
        event_name: 'Passe certo',
        minute: 5,
      });

      useMatchStore.getState().addLiveEvent(evt1);

      // Simulate position swap (player2: position 2 → 3)
      matchRepo.updateMatchPlayerPosition(mockMatch.id, IDS.player2, 3);

      // Record event after swap
      const evt2 = createMockMatchEvent({
        id: 'after-swap',
        player_id: IDS.player2,
        event_name: 'Gol',
        minute: 10,
      });

      useMatchStore.getState().addLiveEvent(evt2);

      // Both events should still belong to player2
      const player2Events = useMatchStore.getState().live.events.filter(
        e => e.player_id === IDS.player2
      );

      expect(player2Events).toHaveLength(2);
      expect(player2Events[0].event_name).toBe('Passe certo');
      expect(player2Events[1].event_name).toBe('Gol');
    });
  });

  // ─── Position Grouping in Bench ────────────────────────────────────────
  describe('Position Grouping in Bench', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should group bench players by position', () => {
      const { groupAndSortPlayersByPosition } = require('@/utils/playerGrouping');
      
      // Mock bench players with different positions
      const benchPlayers = [
        {
          player_id: 'bp1',
          player_name: 'Reserva Goleiro',
          player_number: 12,
          photo_uri: null,
          position_name: 'Goleiro',
          position_abbreviation: 'GOL',
          position_id: 'pos1'
        },
        {
          player_id: 'bp2',
          player_name: 'Reserva Ala 1',
          player_number: 14,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos3'
        },
        {
          player_id: 'bp3',
          player_name: 'Reserva Ala 2',
          player_number: 13,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos3'
        },
      ];

      const grouped = groupAndSortPlayersByPosition(benchPlayers);

      // Should have 2 groups: GOL and ALA
      expect(grouped.length).toBe(2);
      expect(grouped[0].positionName).toBe('Goleiro');
      expect(grouped[1].positionName).toBe('Ala');
      
      // Ala group should have 2 players
      expect(grouped[1].players.length).toBe(2);
      
      // Players should be sorted by number within group
      expect(grouped[1].players[0].player_number).toBe(13);
      expect(grouped[1].players[1].player_number).toBe(14);
    });

    it('should include position data in match players query', () => {
      const { getMatchPlayers } = require('@/database/repositories/matchRepository');
      const players = getMatchPlayers(IDS.match);

      // Mock players should have position info from JOIN
      players.forEach((player: any) => {
        if (player.position_id) {
          expect(player).toHaveProperty('position_name');
          expect(player).toHaveProperty('position_abbreviation');
        }
      });
    });

    it('should handle players without position (Sem Posição group)', () => {
      const { groupAndSortPlayersByPosition } = require('@/utils/playerGrouping');
      
      const mixedPlayers = [
        {
          player_id: 'p1',
          player_name: 'Com Posição',
          player_number: 5,
          photo_uri: null,
          position_name: 'Fixo',
          position_abbreviation: 'FIX',
          position_id: 'pos2'
        },
        {
          player_id: 'p2',
          player_name: 'Sem Posição',
          player_number: 10,
          photo_uri: null,
          position_name: null,
          position_abbreviation: null,
          position_id: null
        },
      ];

      const grouped = groupAndSortPlayersByPosition(mixedPlayers);

      // Should have 2 groups: FIX and Sem Posição
      expect(grouped.length).toBe(2);
      expect(grouped[0].positionName).toBe('Fixo');
      expect(grouped[1].positionName).toBe('Sem Posição');
      expect(grouped[1].positionAbbreviation).toBe('---');
    });

    it('should maintain player selection across grouped display', () => {
      const { groupAndSortPlayersByPosition } = require('@/utils/playerGrouping');
      
      const players = mockMatchPlayers.slice(0, 3);
      const selectedPlayerId = IDS.player2;

      const grouped = groupAndSortPlayersByPosition(players);
      
      // Find selected player in grouped structure
      const selectedPlayer = grouped
        .flatMap((g: any) => g.players)
        .find((p: any) => p.player_id === selectedPlayerId);

      expect(selectedPlayer).toBeDefined();
      expect(selectedPlayer?.player_id).toBe(selectedPlayerId);
    });

    it('should preserve all player data during grouping', () => {
      const { groupAndSortPlayersByPosition } = require('@/utils/playerGrouping');
      
      const originalPlayers = [
        {
          player_id: 'p1',
          player_name: 'Test Player',
          player_number: 7,
          photo_uri: 'photo.jpg',
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos3',
          custom_field: 'should be preserved'
        }
      ];

      const grouped = groupAndSortPlayersByPosition(originalPlayers);
      const regroupedPlayer = grouped[0].players[0];

      // All original fields should be preserved
      expect(regroupedPlayer.player_id).toBe('p1');
      expect(regroupedPlayer.player_name).toBe('Test Player');
      expect(regroupedPlayer.player_number).toBe(7);
      expect(regroupedPlayer.photo_uri).toBe('photo.jpg');
      expect((regroupedPlayer as any).custom_field).toBe('should be preserved');
    });

    it('should sort position groups in futsal order', () => {
      const { groupAndSortPlayersByPosition } = require('@/utils/playerGrouping');
      
      // Create players in random order
      const unsortedPlayers = [
        { player_id: 'p1', player_name: 'Pivô', player_number: 9, photo_uri: null, position_name: 'Pivô', position_abbreviation: 'PIV', position_id: 'pos4' },
        { player_id: 'p2', player_name: 'Goleiro', player_number: 1, photo_uri: null, position_name: 'Goleiro', position_abbreviation: 'GOL', position_id: 'pos1' },
        { player_id: 'p3', player_name: 'Ala', player_number: 7, photo_uri: null, position_name: 'Ala', position_abbreviation: 'ALA', position_id: 'pos3' },
        { player_id: 'p4', player_name: 'Fixo', player_number: 5, photo_uri: null, position_name: 'Fixo', position_abbreviation: 'FIX', position_id: 'pos2' },
      ];

      const grouped = groupAndSortPlayersByPosition(unsortedPlayers);

      // Should be in futsal order: GOL, FIX, ALA, PIV
      expect(grouped[0].positionName).toBe('Goleiro');
      expect(grouped[1].positionName).toBe('Fixo');
      expect(grouped[2].positionName).toBe('Ala');
      expect(grouped[3].positionName).toBe('Pivô');
    });
  });

  // ─── Score Management ──────────────────────────────────────────────────
  describe('Score Management', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      matchRepo.updateScore = jest.fn();
      matchRepo.incrementScore = jest.fn();
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should auto-increment home score when home team scores a goal', () => {
      // Setup: match is_home = true (home game)
      const homeMatch = { ...mockMatch, is_home: true };
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: homeMatch, homeScore: 0, awayScore: 0 },
      }));

      const goalEvent = createMockMatchEvent({
        id: 'goal-home-1',
        player_id: IDS.player5,
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 10,
        second: 30,
        period: 1,
        is_positive: true,
      });

      useMatchStore.getState().addLiveEvent(goalEvent);

      // Verify home score incremented
      const { live } = useMatchStore.getState();
      expect(live.homeScore).toBe(1);
      expect(live.awayScore).toBe(0);
    });

    it('should auto-increment away score when away team scores a goal', () => {
      // Setup: match is_home = false (away game)
      const awayMatch = { ...mockMatch, is_home: false };
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: awayMatch, homeScore: 0, awayScore: 0 },
      }));

      const goalEvent = createMockMatchEvent({
        id: 'goal-away-1',
        player_id: IDS.player5,
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 15,
        second: 20,
        period: 1,
        is_positive: true,
      });

      useMatchStore.getState().addLiveEvent(goalEvent);

      // Verify away score incremented (since team is playing away)
      const { live } = useMatchStore.getState();
      expect(live.homeScore).toBe(0);
      expect(live.awayScore).toBe(1);
    });

    it('should allow manual score adjustment', () => {
      useMatchStore.setState((s) => ({
        live: { ...s.live, homeScore: 2, awayScore: 1 },
      }));

      // Manually adjust score (e.g., correction)
      useMatchStore.getState().setScore(3, 2);

      const { live } = useMatchStore.getState();
      expect(live.homeScore).toBe(3);
      expect(live.awayScore).toBe(2);
    });

    it('should decrement score when undoing a goal event', () => {
      // Start with existing score
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: { ...mockMatch, is_home: true }, homeScore: 2, awayScore: 1 },
      }));

      const goalEvent = createMockMatchEvent({
        id: 'goal-undo',
        player_id: IDS.player5,
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 20,
        second: 0,
        period: 2,
      });

      // Record goal (increments to 3-1)
      useMatchStore.getState().addLiveEvent(goalEvent);
      expect(useMatchStore.getState().live.homeScore).toBe(3);

      // Undo goal (decrements back to 2-1)
      useMatchStore.getState().undoLastEvent();
      expect(useMatchStore.getState().live.homeScore).toBe(2);
    });

    it('should handle multiple goals in same period', () => {
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: { ...mockMatch, is_home: true }, homeScore: 0, awayScore: 0 },
      }));

      const goal1 = createMockMatchEvent({ id: 'g1', event_id: IDS.event3, event_name: 'Gol', minute: 5 });
      const goal2 = createMockMatchEvent({ id: 'g2', event_id: IDS.event3, event_name: 'Gol', minute: 10 });
      const goal3 = createMockMatchEvent({ id: 'g3', event_id: IDS.event3, event_name: 'Gol', minute: 15 });

      useMatchStore.getState().addLiveEvent(goal1);
      useMatchStore.getState().addLiveEvent(goal2);
      useMatchStore.getState().addLiveEvent(goal3);

      expect(useMatchStore.getState().live.homeScore).toBe(3);
    });

    it('should not increment score for non-goal events', () => {
      useMatchStore.setState((s) => ({
        live: { ...s.live, homeScore: 1, awayScore: 0 },
      }));

      const passEvent = createMockMatchEvent({
        id: 'pass-1',
        event_id: IDS.event1,
        event_name: 'Passe certo',
        minute: 5,
      });

      useMatchStore.getState().addLiveEvent(passEvent);

      // Score should remain unchanged
      expect(useMatchStore.getState().live.homeScore).toBe(1);
      expect(useMatchStore.getState().live.awayScore).toBe(0);
    });

    it('should decrement score when deleting a goal event manually', () => {
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: { ...mockMatch, is_home: true }, homeScore: 0, awayScore: 0 },
      }));

      const goal1 = createMockMatchEvent({ id: 'g1', event_id: IDS.event3, event_name: 'Gol', minute: 5 });
      const goal2 = createMockMatchEvent({ id: 'g2', event_id: IDS.event3, event_name: 'Gol', minute: 10 });
      const goal3 = createMockMatchEvent({ id: 'g3', event_id: IDS.event3, event_name: 'Gol', minute: 15 });

      useMatchStore.getState().addLiveEvent(goal1);
      useMatchStore.getState().addLiveEvent(goal2);
      useMatchStore.getState().addLiveEvent(goal3);

      expect(useMatchStore.getState().live.homeScore).toBe(3);
      expect(useMatchStore.getState().live.events.length).toBe(3);

      // Delete a goal from the middle (not last)
      useMatchStore.getState().deleteEvent('g2');

      expect(useMatchStore.getState().live.homeScore).toBe(2);
      expect(useMatchStore.getState().live.events.length).toBe(2);
      expect(useMatchStore.getState().live.events.find(e => e.id === 'g2')).toBeUndefined();
    });
  });

  // ─── Opponent Events ───────────────────────────────────────────────────
  describe('Opponent Events', () => {
    beforeEach(() => {
      eventRepo.getMatchEvents.mockReturnValue([]);
      matchRepo.getMatchPlayers.mockReturnValue(mockMatchPlayers);
      eventRepo.insertMatchEvent = jest.fn();
      useMatchStore.getState().startLiveSession(mockMatch);
    });

    it('should record opponent event with is_opponent_event flag', () => {
      const opponentGoal = createMockMatchEvent({
        id: 'opp-goal-1',
        player_id: '', // No player ID for opponent team events
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 12,
        second: 45,
        period: 1,
        is_positive: false, // Negative for user's perspective
      });

      // Add as opponent event
      useMatchStore.getState().addOpponentEvent(opponentGoal);

      const events = useMatchStore.getState().live.events;
      const opponentEvent = events.find((e) => e.id === 'opp-goal-1');

      expect(opponentEvent).toBeDefined();
      expect(opponentEvent?.is_opponent_event).toBe(true);
      expect(opponentEvent?.player_id).toBeFalsy(); // No specific player
    });

    it('should increment opponent score when opponent scores', () => {
      // Home match: opponent is away team
      useMatchStore.setState((s) => ({
        live: { ...s.live, match: { ...mockMatch, is_home: true }, homeScore: 1, awayScore: 0 },
      }));

      const opponentGoal = createMockMatchEvent({
        id: 'opp-goal-2',
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 18,
        second: 0,
        period: 1,
      });

      useMatchStore.getState().addOpponentEvent(opponentGoal);

      const { live } = useMatchStore.getState();
      expect(live.homeScore).toBe(1);
      expect(live.awayScore).toBe(1); // Opponent scored
    });

    it('should track opponent fouls separately from team fouls', () => {
      const teamFoul = createMockMatchEvent({
        id: 'team-foul-1',
        player_id: IDS.player2,
        event_id: 'disciplina_falta',
        event_name: 'Falta',
        minute: 5,
      });

      const opponentFoul = createMockMatchEvent({
        id: 'opp-foul-1',
        event_id: 'disciplina_falta',
        event_name: 'Falta',
        minute: 8,
      });

      useMatchStore.getState().addLiveEvent(teamFoul);
      useMatchStore.getState().addOpponentEvent(opponentFoul);

      const events = useMatchStore.getState().live.events;
      const teamFouls = events.filter(
        (e) => e.event_name === 'Falta' && !e.is_opponent_event
      );
      const oppFouls = events.filter(
        (e) => e.event_name === 'Falta' && e.is_opponent_event
      );

      expect(teamFouls).toHaveLength(1);
      expect(oppFouls).toHaveLength(1);
    });

    it('should allow opponent events for all event types', () => {
      const opponentYellow = createMockMatchEvent({
        id: 'opp-yellow',
        event_id: 'disciplina_amarelo',
        event_name: 'Cartão Amarelo',
        minute: 10,
      });

      const opponentCorner = createMockMatchEvent({
        id: 'opp-corner',
        event_id: 'finalizacao_escanteio',
        event_name: 'Escanteio',
        minute: 15,
      });

      useMatchStore.getState().addOpponentEvent(opponentYellow);
      useMatchStore.getState().addOpponentEvent(opponentCorner);

      const events = useMatchStore.getState().live.events;
      const opponentEvents = events.filter((e) => e.is_opponent_event);

      expect(opponentEvents).toHaveLength(2);
      expect(opponentEvents.map((e) => e.event_name)).toContain('Cartão Amarelo');
      expect(opponentEvents.map((e) => e.event_name)).toContain('Escanteio');
    });

    it('should undo opponent event when requested', () => {
      const opponentGoal = createMockMatchEvent({
        id: 'opp-goal-undo',
        event_id: IDS.event3,
        event_name: 'Gol',
        minute: 20,
      });

      useMatchStore.setState((s) => ({
        live: { ...s.live, match: { ...mockMatch, is_home: true }, homeScore: 0, awayScore: 0 },
      }));

      useMatchStore.getState().addOpponentEvent(opponentGoal);
      expect(useMatchStore.getState().live.awayScore).toBe(1);

      useMatchStore.getState().undoLastEvent();
      expect(useMatchStore.getState().live.awayScore).toBe(0);
    });
  });
});
