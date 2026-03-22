import { create } from 'zustand';
import type { Team, Player } from '@/types';
import * as teamRepo from '@/database/repositories/teamRepository';

interface TeamStore {
  teams: Team[];
  players: Player[];
  loadTeams: () => void;
  createTeam: (team: Team) => void;
  updateTeam: (id: string, name: string, photoUri?: string | null) => void;
  deleteTeam: (id: string) => void;
  loadPlayers: (teamId: string) => void;
  createPlayer: (player: Omit<Player, 'created_at'>) => void;
  updatePlayer: (id: string, name: string, number: number, photoUri?: string | null) => void;
  deletePlayer: (id: string) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  players: [],

  loadTeams: () => {
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  createTeam: (team) => {
    teamRepo.createTeam(team);
    const teams = teamRepo.getTeams();
    set({ teams });
  },
  updateTeam: (id, name, photoUri) => {
    teamRepo.updateTeam(id, name, photoUri);
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
  createPlayer: (player) => {
    teamRepo.createPlayer(player);
    const players = teamRepo.getPlayersByTeam(player.team_id);
    set({ players });
  },
  updatePlayer: (id, name, number, photoUri) => {
    teamRepo.updatePlayer(id, name, number, photoUri);
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, name, number, photo_uri: photoUri } : p
      ),
    }));
  },
  deletePlayer: (id) => {
    teamRepo.deletePlayer(id);
    set((state) => ({ players: state.players.filter((p) => p.id !== id) }));
  },
}));
