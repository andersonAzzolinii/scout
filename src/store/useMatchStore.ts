import { create } from 'zustand';
import type { Match, MatchPlayer, MatchEvent, LiveMatchState } from '@/types';
import * as matchRepo from '@/database/repositories/matchRepository';
import * as eventRepo from '@/database/repositories/eventRepository';

interface MatchStore {
  matches: Match[];
  live: LiveMatchState;
  // Matches
  loadMatches: () => void;
  createMatch: (match: Omit<Match, 'created_at' | 'team_a_name' | 'team_b_name' | 'profile_name'>) => void;
  deleteMatch: (id: string) => void;
  // Match Players
  loadMatchPlayers: (matchId: string) => void;
  addMatchPlayer: (mp: MatchPlayer) => void;
  removeMatchPlayer: (id: string) => void;
  // Live Session
  startLiveSession: (match: Match) => void;
  endLiveSession: () => void;
  setSelectedPlayer: (playerId: string, teamId: string) => void;
  addLiveEvent: (event: MatchEvent) => void;
  undoLastEvent: () => void;
  setTimer: (elapsedSeconds: number, isRunning: boolean) => void;
  loadLiveEvents: (matchId: string) => void;
}

const defaultLive: LiveMatchState = {
  match: null,
  players: [],
  events: [],
  selectedPlayerId: null,
  selectedTeamId: null,
  elapsedSeconds: 0,
  isRunning: false,
};

export const useMatchStore = create<MatchStore>((set, get) => ({
  matches: [],
  live: defaultLive,

  loadMatches: () => {
    const matches = matchRepo.getMatches();
    set({ matches });
  },
  createMatch: (match) => {
    matchRepo.createMatch(match);
    const matches = matchRepo.getMatches();
    set({ matches });
  },
  deleteMatch: (id) => {
    matchRepo.deleteMatch(id);
    set((state) => ({ matches: state.matches.filter((m) => m.id !== id) }));
  },

  loadMatchPlayers: (matchId) => {
    const players = matchRepo.getMatchPlayers(matchId);
    set((state) => ({ live: { ...state.live, players } }));
  },
  addMatchPlayer: (mp) => {
    matchRepo.addMatchPlayer(mp);
    const players = matchRepo.getMatchPlayers(mp.match_id);
    set((state) => ({ live: { ...state.live, players } }));
  },
  removeMatchPlayer: (id) => {
    matchRepo.removeMatchPlayer(id);
    set((state) => ({
      live: {
        ...state.live,
        players: state.live.players.filter((p) => p.id !== id),
      },
    }));
  },

  startLiveSession: (match) => {
    const events = eventRepo.getMatchEvents(match.id);
    const players = matchRepo.getMatchPlayers(match.id);
    set({
      live: {
        ...defaultLive,
        match,
        events,
        players,
      },
    });
  },
  endLiveSession: () => {
    set({ live: defaultLive });
  },
  setSelectedPlayer: (playerId, teamId) => {
    set((state) => ({
      live: { ...state.live, selectedPlayerId: playerId, selectedTeamId: teamId },
    }));
  },
  addLiveEvent: (event) => {
    eventRepo.insertMatchEvent(event);
    set((state) => ({
      live: {
        ...state.live,
        events: [...state.live.events, event],
      },
    }));
  },
  undoLastEvent: () => {
    const { live } = get();
    if (live.events.length === 0) return;
    const last = live.events[live.events.length - 1];
    eventRepo.deleteMatchEvent(last.id);
    set((state) => ({
      live: {
        ...state.live,
        events: state.live.events.slice(0, -1),
      },
    }));
  },
  setTimer: (elapsedSeconds, isRunning) => {
    set((state) => ({ live: { ...state.live, elapsedSeconds, isRunning } }));
  },
  loadLiveEvents: (matchId) => {
    const events = eventRepo.getMatchEvents(matchId);
    set((state) => ({ live: { ...state.live, events } }));
  },
}));
