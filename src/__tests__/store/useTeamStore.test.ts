/**
 * Tests for useTeamStore — teams, players, squads, and positions management.
 */
import { useTeamStore } from '@/store/useTeamStore';
import {
  IDS,
  mockTeam,
  mockPlayers,
  mockSquad,
  mockSquadSociety,
  mockPositions,
} from '../mocks/mockData';

// ─── Mock repositories ──────────────────────────────────────────────────────
jest.mock('@/database/repositories/teamRepository', () => ({
  getTeams: jest.fn().mockReturnValue([]),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  getPlayersByTeam: jest.fn().mockReturnValue([]),
  getPlayersBySquad: jest.fn().mockReturnValue([]),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
}));

jest.mock('@/database/repositories/squadRepository', () => ({
  getSquads: jest.fn().mockReturnValue([]),
  getSquadsByTeam: jest.fn().mockReturnValue([]),
  getSquadsByTeamWithStats: jest.fn().mockReturnValue([]),
  createSquad: jest.fn(),
  updateSquad: jest.fn(),
  deleteSquad: jest.fn(),
}));

jest.mock('@/database/repositories/positionRepository', () => ({
  getPositionsBySquad: jest.fn().mockReturnValue([]),
  createPosition: jest.fn(),
  updatePosition: jest.fn(),
  deletePosition: jest.fn(),
}));

const teamRepo = require('@/database/repositories/teamRepository');
const squadRepo = require('@/database/repositories/squadRepository');
const positionRepo = require('@/database/repositories/positionRepository');

describe('useTeamStore', () => {
  beforeEach(() => {
    useTeamStore.setState({
      teams: [],
      players: [],
      squads: [],
      positions: [],
    });
    jest.clearAllMocks();
  });

  // ─── Teams ──────────────────────────────────────────────────────────────
  describe('Teams', () => {
    it('loadTeams should populate from repository', () => {
      teamRepo.getTeams.mockReturnValue([mockTeam]);
      useTeamStore.getState().loadTeams();
      expect(useTeamStore.getState().teams).toEqual([mockTeam]);
    });

    it('createTeam should persist and reload', () => {
      teamRepo.getTeams.mockReturnValue([mockTeam]);
      useTeamStore.getState().createTeam(mockTeam);
      expect(teamRepo.createTeam).toHaveBeenCalledWith(mockTeam);
      expect(useTeamStore.getState().teams).toHaveLength(1);
    });

    it('updateTeam should persist and reload', () => {
      teamRepo.getTeams.mockReturnValue([{ ...mockTeam, name: 'Updated FC' }]);
      useTeamStore.getState().updateTeam(IDS.team, 'Updated FC', null, null);
      expect(teamRepo.updateTeam).toHaveBeenCalledWith(IDS.team, 'Updated FC', null, null);
    });

    it('deleteTeam should persist and reload', () => {
      teamRepo.getTeams.mockReturnValue([]);
      useTeamStore.getState().deleteTeam(IDS.team);
      expect(teamRepo.deleteTeam).toHaveBeenCalledWith(IDS.team);
      expect(useTeamStore.getState().teams).toHaveLength(0);
    });
  });

  // ─── Players ────────────────────────────────────────────────────────────
  describe('Players', () => {
    it('loadPlayers should fetch by team', () => {
      teamRepo.getPlayersByTeam.mockReturnValue(mockPlayers);
      useTeamStore.getState().loadPlayers(IDS.team);
      expect(teamRepo.getPlayersByTeam).toHaveBeenCalledWith(IDS.team);
      expect(useTeamStore.getState().players).toEqual(mockPlayers);
    });

    it('loadPlayersBySquad should fetch by squad', () => {
      teamRepo.getPlayersBySquad.mockReturnValue(mockPlayers.slice(0, 3));
      useTeamStore.getState().loadPlayersBySquad(IDS.squad);
      expect(teamRepo.getPlayersBySquad).toHaveBeenCalledWith(IDS.squad);
      expect(useTeamStore.getState().players).toHaveLength(3);
    });

    it('createPlayer should persist and reload by team', () => {
      teamRepo.getPlayersByTeam.mockReturnValue(mockPlayers);
      useTeamStore.getState().createPlayer(mockPlayers[0]);
      expect(teamRepo.createPlayer).toHaveBeenCalledWith(mockPlayers[0]);
    });

    it('updatePlayer should update locally with position, height, weight', () => {
      useTeamStore.setState({ players: mockPlayers });

      useTeamStore.getState().updatePlayer(
        IDS.player1, 'Lucas Updated', 99, null, IDS.squad, IDS.position1, 190, 85
      );

      expect(teamRepo.updatePlayer).toHaveBeenCalledWith(
        IDS.player1, 'Lucas Updated', 99, null, IDS.squad, IDS.position1, 190, 85
      );
      const updated = useTeamStore.getState().players.find((p) => p.id === IDS.player1);
      expect(updated?.name).toBe('Lucas Updated');
      expect(updated?.number).toBe(99);
      expect(updated?.height).toBe(190);
      expect(updated?.weight).toBe(85);
    });

    it('deletePlayer should remove from local state', () => {
      useTeamStore.setState({ players: mockPlayers });
      useTeamStore.getState().deletePlayer(IDS.player1);
      expect(teamRepo.deletePlayer).toHaveBeenCalledWith(IDS.player1);
      expect(useTeamStore.getState().players.find((p) => p.id === IDS.player1)).toBeUndefined();
    });
  });

  // ─── Squads ─────────────────────────────────────────────────────────────
  describe('Squads', () => {
    it('loadSquads with teamId should fetch by team', () => {
      squadRepo.getSquadsByTeam.mockReturnValue([mockSquad]);
      useTeamStore.getState().loadSquads(IDS.team);
      expect(squadRepo.getSquadsByTeam).toHaveBeenCalledWith(IDS.team);
      expect(useTeamStore.getState().squads).toEqual([mockSquad]);
    });

    it('loadSquads without teamId should fetch all', () => {
      squadRepo.getSquads.mockReturnValue([mockSquad, mockSquadSociety]);
      useTeamStore.getState().loadSquads();
      expect(squadRepo.getSquads).toHaveBeenCalled();
      expect(useTeamStore.getState().squads).toHaveLength(2);
    });

    it('createSquad should persist and reload', () => {
      squadRepo.getSquadsByTeam.mockReturnValue([mockSquad]);
      useTeamStore.getState().createSquad(mockSquad);
      expect(squadRepo.createSquad).toHaveBeenCalledWith(mockSquad);
    });

    it('updateSquad should update local state', () => {
      useTeamStore.setState({ squads: [mockSquad] });
      useTeamStore.getState().updateSquad(IDS.squad, 'New Name', 'society');
      const updated = useTeamStore.getState().squads.find((s) => s.id === IDS.squad);
      expect(updated?.name).toBe('New Name');
      expect(updated?.sport_type).toBe('society');
    });

    it('deleteSquad should remove from local state', () => {
      useTeamStore.setState({ squads: [mockSquad, mockSquadSociety] });
      useTeamStore.getState().deleteSquad(IDS.squad);
      expect(useTeamStore.getState().squads).toHaveLength(1);
      expect(useTeamStore.getState().squads[0].id).toBe(IDS.squad2);
    });
  });

  // ─── Positions ──────────────────────────────────────────────────────────
  describe('Positions', () => {
    it('loadPositions should fetch by squad', () => {
      positionRepo.getPositionsBySquad.mockReturnValue(mockPositions);
      useTeamStore.getState().loadPositions(IDS.squad);
      expect(positionRepo.getPositionsBySquad).toHaveBeenCalledWith(IDS.squad);
      expect(useTeamStore.getState().positions).toEqual(mockPositions);
    });

    it('createPosition should persist and reload', () => {
      positionRepo.getPositionsBySquad.mockReturnValue(mockPositions);
      useTeamStore.getState().createPosition(mockPositions[0]);
      expect(positionRepo.createPosition).toHaveBeenCalledWith(mockPositions[0]);
    });

    it('updatePosition should update local state', () => {
      useTeamStore.setState({ positions: mockPositions });
      useTeamStore.getState().updatePosition(IDS.position1, 'Goleiro (reserva)', 'GR');
      const updated = useTeamStore.getState().positions.find((p) => p.id === IDS.position1);
      expect(updated?.name).toBe('Goleiro (reserva)');
      expect(updated?.abbreviation).toBe('GR');
    });

    it('deletePosition should remove from local state', () => {
      useTeamStore.setState({ positions: mockPositions });
      useTeamStore.getState().deletePosition(IDS.position1);
      expect(positionRepo.deletePosition).toHaveBeenCalledWith(IDS.position1);
      expect(useTeamStore.getState().positions.find((p) => p.id === IDS.position1)).toBeUndefined();
    });
  });
});
