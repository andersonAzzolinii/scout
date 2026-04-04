import { create } from 'zustand';
import type { Team, Player, Squad, Position } from '@/types';
import * as teamRepo from '@/database/repositories/teamRepository';
import * as squadRepo from '@/database/repositories/squadRepository';
import * as positionRepo from '@/database/repositories/positionRepository';

interface TeamStore {
  teams: Team[];
  players: Player[];
  squads: Squad[];
  positions: Position[];
  loadTeams: () => void;
  createTeam: (team: Team) => void;
  updateTeam: (id: string, name: string, photoUri?: string | null, venue?: string | null) => void;
  deleteTeam: (id: string) => void;
  loadPlayers: (teamId: string) => void;
  loadPlayersBySquad: (squadId: string) => void;
  createPlayer: (player: Omit<Player, 'created_at'>) => void;
  updatePlayer: (id: string, name: string, number: number, photoUri?: string | null, squadId?: string | null, positionId?: string | null, height?: number | null, weight?: number | null) => void;
  deletePlayer: (id: string) => void;
  loadSquads: (teamId?: string) => void;
  loadSquadsWithStats: (teamId: string) => void;
  createSquad: (squad: Omit<Squad, 'created_at' | 'team_name'>) => void;
  updateSquad: (id: string, name: string, sportType: string) => void;
  deleteSquad: (id: string) => void;
  loadPositions: (squadId: string) => void;
  createPosition: (position: Omit<Position, 'created_at' | 'squad_name' | 'sport_type'>) => void;
  updatePosition: (id: string, name: string, abbreviation: string) => void;
  deletePosition: (id: string) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  players: [],
  squads: [],
  positions: [],

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
  updatePlayer: (id, name, number, photoUri, squadId, positionId, height, weight) => {
    teamRepo.updatePlayer(id, name, number, photoUri, squadId, positionId, height, weight);
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, name, number, photo_uri: photoUri, squad_id: squadId, position_id: positionId, height, weight } : p
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
  loadPositions: (squadId) => {
    const positions = positionRepo.getPositionsBySquad(squadId);
    set({ positions });
  },
  createPosition: (position) => {
    positionRepo.createPosition(position);
    const positions = positionRepo.getPositionsBySquad(position.squad_id);
    set({ positions });
  },
  updatePosition: (id, name, abbreviation) => {
    positionRepo.updatePosition(id, name, abbreviation);
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, name, abbreviation } : p
      ),
    }));
  },
  deletePosition: (id) => {
    positionRepo.deletePosition(id);
    set((state) => ({ positions: state.positions.filter((p) => p.id !== id) }));
  },
}));
