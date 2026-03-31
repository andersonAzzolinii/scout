import { create } from 'zustand';
import type { Team, Player, Squad } from '@/types';
import * as teamRepo from '@/database/repositories/teamRepository';
import * as squadRepo from '@/database/repositories/squadRepository';

interface TeamStore {
  teams: Team[];
  players: Player[];
  squads: Squad[];
  loadTeams: () => void;
  createTeam: (team: Team) => void;
  updateTeam: (id: string, name: string, photoUri?: string | null, venue?: string | null) => void;
  deleteTeam: (id: string) => void;
  loadPlayers: (teamId: string) => void;
  loadPlayersBySquad: (squadId: string) => void;
  createPlayer: (player: Omit<Player, 'created_at'>) => void;
  updatePlayer: (id: string, name: string, number: number, photoUri?: string | null, squadId?: string | null) => void;
  deletePlayer: (id: string) => void;
  loadSquads: (teamId?: string) => void;
  loadSquadsWithStats: (teamId: string) => void;
  createSquad: (squad: Omit<Squad, 'created_at' | 'team_name'>) => void;
  updateSquad: (id: string, name: string, sportType: string) => void;
  deleteSquad: (id: string) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  players: [],
  squads: [],

  loadTeams: () => {
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  createTeam: (team) => {
    teamRepo.createTeam(team);
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  updateTeam: (id, name, photoUri, venue) => {
    teamRepo.updateTeam(id, name, photoUri, venue);
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  deleteTeam: (id) => {
    teamRepo.deleteTeam(id);
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  loadPlayers: (teamId) => {
    const players = teamRepo.getPlayersByTeam(teamId);
    set({ players });
  },
  loadPlayersBySquad: (squadId) => {
    const players = teamRepo.getPlayersBySquad(squadId);
    set({ players });
  },
  createPlayer: (player) => {
    teamRepo.createPlayer(player);
    const players = teamRepo.getPlayersByTeam(player.team_id);
    set({ players });
  },
  updatePlayer: (id, name, number, photoUri, squadId) => {
    teamRepo.updatePlayer(id, name, number, photoUri, squadId);
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, name, number, photo_uri: photoUri, squad_id: squadId } : p
      ),
    }));
  },
  deletePlayer: (id) => {
    teamRepo.deletePlayer(id);
    set((state) => ({ players: state.players.filter((p) => p.id !== id) }));
  },
  loadSquads: (teamId) => {
    const squads = teamId ? squadRepo.getSquadsByTeam(teamId) : squadRepo.getSquads();
    set({ squads });
  },
  loadSquadsWithStats: (teamId) => {
    const squads = squadRepo.getSquadsByTeamWithStats(teamId);
    set({ squads });
  },
  createSquad: (squad) => {
    squadRepo.createSquad(squad);
    const squads = squadRepo.getSquadsByTeam(squad.team_id);
    set({ squads });
  },
  updateSquad: (id, name, sportType) => {
    squadRepo.updateSquad(id, name, sportType as any);
    set((state) => ({
      squads: state.squads.map((s) =>
        s.id === id ? { ...s, name, sport_type: sportType as any } : s
      ),
    }));
  },
  deleteSquad: (id) => {
    squadRepo.deleteSquad(id);
    set((state) => ({ squads: state.squads.filter((s) => s.id !== id) }));
  },
}));
