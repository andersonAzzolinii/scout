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
  addOpponentEvent: (event: MatchEvent) => void;
  deleteEvent: (id: string) => void;
  undoLastEvent: () => void;
  setTimer: (elapsedSeconds: number, isRunning: boolean) => void;
  setPeriod: (period: 0 | 1 | 2) => void;
  saveBenchElapsed: (byPlayerId: Record<string, number>) => void;
  clearBenchElapsed: (playerId: string) => void;
  loadLiveEvents: (matchId: string) => void;
  // Score Management
  setScore: (homeScore: number, awayScore: number) => void;
  incrementScore: (team: 'home' | 'away') => void;
  decrementScore: (team: 'home' | 'away') => void;
}

const defaultLive: LiveMatchState = {
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
    const { live } = get();
    const events = eventRepo.getMatchEvents(match.id);
    const players = matchRepo.getMatchPlayers(match.id);
    
    // Carregar estado do timer do banco de dados
    const elapsedSeconds = match.elapsed_seconds ?? 0;
    const isRunning = match.is_timer_running === 1;
    const period = (match.current_period ?? 1) as 0 | 1 | 2;
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;
    
    if (live.match?.id === match.id) {
      // Same match — refresh data
      set((state) => ({ 
        live: { 
          ...state.live, 
          match, 
          events, 
          players,
          elapsedSeconds,
          isRunning,
          period,
          homeScore,
          awayScore
        } 
      }));
    } else {
      // New match — load from database
      set({ 
        live: { 
          ...defaultLive, 
          match, 
          events, 
          players,
          elapsedSeconds,
          isRunning,
          period,
          homeScore,
          awayScore
        } 
      });
    }
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
    const { live } = get();
    eventRepo.insertMatchEvent(event);
    
    // Auto-increment score if event is a goal
    if (event.event_name === 'Gol' || event.event_id?.includes('gol')) {
      const isHome = live.match?.is_home ?? true;
      const team = isHome ? 'home' : 'away';
      
      if (live.match) {
        matchRepo.incrementScore(live.match.id, team);
        set((state) => ({
          live: {
            ...state.live,
            events: [...state.live.events, event],
            homeScore: team === 'home' ? state.live.homeScore + 1 : state.live.homeScore,
            awayScore: team === 'away' ? state.live.awayScore + 1 : state.live.awayScore,
          },
        }));
      } else {
        set((state) => ({
          live: { ...state.live, events: [...state.live.events, event] },
        }));
      }
    } else {
      set((state) => ({
        live: {
          ...state.live,
          events: [...state.live.events, event],
        },
      }));
    }
  },
  addOpponentEvent: (event) => {
    const { live } = get();
    const opponentEvent = { ...event, is_opponent_event: true, player_id: null };
    eventRepo.insertMatchEvent(opponentEvent);
    
    // Auto-increment opponent score if event is a goal
    if (event.event_name === 'Gol' || event.event_id?.includes('gol')) {
      const isHome = live.match?.is_home ?? true;
      const team = isHome ? 'away' : 'home'; // Opponent score is opposite
      
      if (live.match) {
        matchRepo.incrementScore(live.match.id, team);
        set((state) => ({
          live: {
            ...state.live,
            events: [...state.live.events, opponentEvent],
            homeScore: team === 'home' ? state.live.homeScore + 1 : state.live.homeScore,
            awayScore: team === 'away' ? state.live.awayScore + 1 : state.live.awayScore,
          },
        }));
      } else {
        set((state) => ({
          live: { ...state.live, events: [...state.live.events, opponentEvent] },
        }));
      }
    } else {
      set((state) => ({
        live: {
          ...state.live,
          events: [...state.live.events, opponentEvent],
        },
      }));
    }
  },
  deleteEvent: (id) => {
    const { live } = get();
    const eventToDelete = live.events.find((e) => e.id === id);
    
    if (!eventToDelete) return;
    
    // If deleting a goal, decrement score
    if (eventToDelete.event_name === 'Gol' || eventToDelete.event_id?.includes('gol')) {
      const isHome = live.match?.is_home ?? true;
      let team: 'home' | 'away';
      
      if (eventToDelete.is_opponent_event) {
        // Opponent goal: decrement opponent score
        team = isHome ? 'away' : 'home';
      } else {
        // User team goal: decrement user team score
        team = isHome ? 'home' : 'away';
      }
      
      if (live.match) {
        matchRepo.decrementScore(live.match.id, team);
      }
      
      eventRepo.deleteMatchEvent(id);
      set((state) => ({
        live: {
          ...state.live,
          events: state.live.events.filter((e) => e.id !== id),
          homeScore: team === 'home' ? Math.max(0, state.live.homeScore - 1) : state.live.homeScore,
          awayScore: team === 'away' ? Math.max(0, state.live.awayScore - 1) : state.live.awayScore,
        },
      }));
    } else {
      eventRepo.deleteMatchEvent(id);
      set((state) => ({
        live: {
          ...state.live,
          events: state.live.events.filter((e) => e.id !== id),
        },
      }));
    }
  },
  undoLastEvent: () => {
    const { live } = get();
    if (live.events.length === 0) return;
    const last = live.events[live.events.length - 1];
    
    // If undoing a goal, decrement score
    if (last.event_name === 'Gol' || last.event_id?.includes('gol')) {
      const isHome = live.match?.is_home ?? true;
      let team: 'home' | 'away';
      
      if (last.is_opponent_event) {
        // Opponent goal: decrement opponent score
        team = isHome ? 'away' : 'home';
      } else {
        // User team goal: decrement user team score
        team = isHome ? 'home' : 'away';
      }
      
      if (live.match) {
        matchRepo.decrementScore(live.match.id, team);
      }
      
      eventRepo.deleteMatchEvent(last.id);
      set((state) => ({
        live: {
          ...state.live,
          events: state.live.events.slice(0, -1),
          homeScore: team === 'home' ? Math.max(0, state.live.homeScore - 1) : state.live.homeScore,
          awayScore: team === 'away' ? Math.max(0, state.live.awayScore - 1) : state.live.awayScore,
        },
      }));
    } else {
      eventRepo.deleteMatchEvent(last.id);
      set((state) => ({
        live: {
          ...state.live,
          events: state.live.events.slice(0, -1),
        },
      }));
    }
  },
  setTimer: (elapsedSeconds, isRunning) => {
    set((state) => {
      const { live } = state;
      if (live.match) {
        // Persistir no banco de dados
        matchRepo.updateMatchTimer(live.match.id, elapsedSeconds, isRunning, live.period);
      }
      return { live: { ...live, elapsedSeconds, isRunning } };
    });
  },
  setPeriod: (period) => {
    set((state) => {
      const { live } = state;
      if (live.match) {
        // Persistir no banco de dados
        matchRepo.updateMatchTimer(live.match.id, live.elapsedSeconds, live.isRunning, period);
      }
      return { live: { ...live, period } };
    });
  },
  saveBenchElapsed: (byPlayerId) => {
    set((state) => ({
      live: {
        ...state.live,
        benchPausedElapsed: { ...state.live.benchPausedElapsed, ...byPlayerId },
      },
    }));
  },
  clearBenchElapsed: (playerId) => {
    set((state) => {
      const next = { ...state.live.benchPausedElapsed };
      delete next[playerId];
      return { live: { ...state.live, benchPausedElapsed: next } };
    });
  },
  loadLiveEvents: (matchId) => {
    const events = eventRepo.getMatchEvents(matchId);
    set((state) => ({ live: { ...state.live, events } }));
  },
  
  // Score Management
  setScore: (homeScore, awayScore) => {
    const { live } = get();
    if (live.match) {
      matchRepo.updateScore(live.match.id, homeScore, awayScore);
      set((state) => ({
        live: { ...state.live, homeScore, awayScore },
      }));
    }
  },
  incrementScore: (team) => {
    const { live } = get();
    if (live.match) {
      matchRepo.incrementScore(live.match.id, team);
      set((state) => ({
        live: {
          ...state.live,
          homeScore: team === 'home' ? state.live.homeScore + 1 : state.live.homeScore,
          awayScore: team === 'away' ? state.live.awayScore + 1 : state.live.awayScore,
        },
      }));
    }
  },
  decrementScore: (team) => {
    const { live } = get();
    if (live.match) {
      matchRepo.decrementScore(live.match.id, team);
      set((state) => ({
        live: {
          ...state.live,
          homeScore: team === 'home' ? Math.max(0, state.live.homeScore - 1) : state.live.homeScore,
          awayScore: team === 'away' ? Math.max(0, state.live.awayScore - 1) : state.live.awayScore,
        },
      }));
    }
  },
}));
