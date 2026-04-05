/**
 * Tests for database repositories — validates SQL query construction and data flow.
 * Since we can't run actual SQLite in Jest, we mock getDatabase() and verify calls.
 */

// ─── Mock the database module ────────────────────────────────────────────────
const mockGetAllSync = jest.fn().mockReturnValue([]);
const mockGetFirstSync = jest.fn().mockReturnValue(null);
const mockRunSync = jest.fn();

jest.mock('@/database/db', () => ({
  getDatabase: () => ({
    getAllSync: mockGetAllSync,
    getFirstSync: mockGetFirstSync,
    runSync: mockRunSync,
  }),
}));

import * as eventRepo from '@/database/repositories/eventRepository';
import * as matchRepo from '@/database/repositories/matchRepository';
import { IDS, mockMatch, mockMatchPlayers, createMockMatchEvent } from '../mocks/mockData';

describe('Database Repositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Event Repository ─────────────────────────────────────────────────
  describe('eventRepository', () => {
    describe('getMatchEvents', () => {
      it('should query events by match ID with proper JOINs', () => {
        eventRepo.getMatchEvents(IDS.match);

        expect(mockGetAllSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockGetAllSync.mock.calls[0];
        expect(sql).toContain('match_events');
        expect(sql).toContain('JOIN players');
        expect(sql).toContain('JOIN scout_events');
        expect(sql).toContain('WHERE me.match_id = ?');
        expect(sql).toContain('ORDER BY');
        expect(params).toEqual([IDS.match]);
      });

      it('should return empty array when no events', () => {
        mockGetAllSync.mockReturnValue([]);
        const result = eventRepo.getMatchEvents(IDS.match);
        expect(result).toEqual([]);
      });
    });

    describe('insertMatchEvent', () => {
      it('should insert event with all required fields', () => {
        const event = createMockMatchEvent({
          id: 'test-insert',
          player_id: IDS.player2,
          event_id: IDS.event1,
          minute: 5,
          second: 30,
          period: 1,
        });

        eventRepo.insertMatchEvent(event);

        expect(mockRunSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockRunSync.mock.calls[0];
        expect(sql).toContain('INSERT INTO match_events');
        expect(params).toContain('test-insert');
        expect(params).toContain(IDS.match);
        expect(params).toContain(IDS.player2);
        expect(params).toContain(IDS.event1);
        expect(params).toContain(5);
        expect(params).toContain(30);
      });

      it('should default period to 1 when not provided', () => {
        const event = createMockMatchEvent({ id: 'no-period' });
        // period in createMockMatchEvent defaults to 1
        eventRepo.insertMatchEvent(event);

        const [, params] = mockRunSync.mock.calls[0];
        // period is at index 7 in the params array
        expect(params[7]).toBe(1);
      });
    });

    describe('deleteMatchEvent', () => {
      it('should delete by event ID', () => {
        eventRepo.deleteMatchEvent('evt-to-delete');

        expect(mockRunSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockRunSync.mock.calls[0];
        expect(sql).toContain('DELETE FROM match_events');
        expect(params).toEqual(['evt-to-delete']);
      });
    });
  });

  // ─── Match Repository ─────────────────────────────────────────────────
  describe('matchRepository', () => {
    describe('getMatches', () => {
      it('should query all matches with JOINs and ORDER BY date DESC', () => {
        matchRepo.getMatches();

        expect(mockGetAllSync).toHaveBeenCalledTimes(1);
        const [sql] = mockGetAllSync.mock.calls[0];
        expect(sql).toContain('matches');
        expect(sql).toContain('JOIN teams');
        expect(sql).toContain('JOIN scout_profiles');
        expect(sql).toContain('ORDER BY m.date DESC');
      });
    });

    describe('getMatchById', () => {
      it('should query single match by ID', () => {
        matchRepo.getMatchById(IDS.match);

        expect(mockGetFirstSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockGetFirstSync.mock.calls[0];
        expect(sql).toContain('WHERE m.id = ?');
        expect(params).toEqual([IDS.match]);
      });

      it('should return null when match not found', () => {
        mockGetFirstSync.mockReturnValue(null);
        const result = matchRepo.getMatchById('nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('createMatch', () => {
      it('should insert match with all fields', () => {
        matchRepo.createMatch(mockMatch);

        expect(mockRunSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockRunSync.mock.calls[0];
        expect(sql).toContain('INSERT INTO matches');
        expect(params).toContain(IDS.match);
        expect(params).toContain(IDS.team);
        expect(params).toContain('Águias FC');
      });
    });

    describe('deleteMatch', () => {
      it('should delete by match ID', () => {
        matchRepo.deleteMatch(IDS.match);

        expect(mockRunSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockRunSync.mock.calls[0];
        expect(sql).toContain('DELETE FROM matches');
        expect(params).toEqual([IDS.match]);
      });
    });

    describe('getMatchPlayers', () => {
      it('should query match players with player JOINs', () => {
        matchRepo.getMatchPlayers(IDS.match);

        expect(mockGetAllSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockGetAllSync.mock.calls[0];
        expect(sql).toContain('match_players');
        expect(sql).toContain('JOIN players');
        expect(params).toEqual([IDS.match]);
      });
    });

    describe('addMatchPlayer', () => {
      it('should insert a match player', () => {
        const mp = mockMatchPlayers[0];
        matchRepo.addMatchPlayer(mp);

        expect(mockRunSync).toHaveBeenCalledTimes(1);
        const [sql, params] = mockRunSync.mock.calls[0];
        expect(sql).toContain('INSERT INTO match_players');
        expect(params).toContain(mp.id);
        expect(params).toContain(mp.match_id);
        expect(params).toContain(mp.player_id);
      });
    });
  });
});
