/**
 * Player Grouping Utility Tests
 * 
 * Tests for grouping and sorting players by functional position
 */
import {
  groupPlayersByPosition,
  sortPlayersInGroups,
  groupAndSortPlayersByPosition,
  type PlayerWithPosition,
  type GroupedPlayers
} from '@/utils/playerGrouping';

describe('Player Grouping Utilities', () => {
  // Mock players with different positions
  const mockPlayers: PlayerWithPosition[] = [
    {
      player_id: 'p1',
      player_name: 'Lucas Silva',
      player_number: 1,
      photo_uri: null,
      position_name: 'Goleiro',
      position_abbreviation: 'GOL',
      position_id: 'pos1'
    },
    {
      player_id: 'p2',
      player_name: 'Pedro Santos',
      player_number: 5,
      photo_uri: null,
      position_name: 'Fixo',
      position_abbreviation: 'FIX',
      position_id: 'pos2'
    },
    {
      player_id: 'p3',
      player_name: 'Carlos Oliveira',
      player_number: 7,
      photo_uri: null,
      position_name: 'Ala',
      position_abbreviation: 'ALA',
      position_id: 'pos3'
    },
    {
      player_id: 'p4',
      player_name: 'Bruno Costa',
      player_number: 11,
      photo_uri: null,
      position_name: 'Ala',
      position_abbreviation: 'ALA',
      position_id: 'pos3'
    },
    {
      player_id: 'p5',
      player_name: 'Rafael Lima',
      player_number: 9,
      photo_uri: null,
      position_name: 'Pivô',
      position_abbreviation: 'PIV',
      position_id: 'pos4'
    },
    {
      player_id: 'p6',
      player_name: 'Diego Ferreira',
      player_number: 10,
      photo_uri: null,
      position_name: null,
      position_abbreviation: null,
      position_id: null
    },
  ];

  describe('groupPlayersByPosition', () => {
    it('should group players by position correctly', () => {
      const groups = groupPlayersByPosition(mockPlayers);
      
      expect(groups.length).toBe(5); // GOL, FIX, ALA, PIV, Sem Posição
      
      const goleiroGroup = groups.find(g => g.positionName === 'Goleiro');
      const alaGroup = groups.find(g => g.positionName === 'Ala');
      const semPosicaoGroup = groups.find(g => g.positionName === 'Sem Posição');
      
      expect(goleiroGroup?.players.length).toBe(1);
      expect(alaGroup?.players.length).toBe(2); // 2 alas
      expect(semPosicaoGroup?.players.length).toBe(1);
    });

    it('should assign correct abbreviations to groups', () => {
      const groups = groupPlayersByPosition(mockPlayers);
      
      const goleiroGroup = groups.find(g => g.positionName === 'Goleiro');
      const fixoGroup = groups.find(g => g.positionName === 'Fixo');
      const semPosicaoGroup = groups.find(g => g.positionName === 'Sem Posição');
      
      expect(goleiroGroup?.positionAbbreviation).toBe('GOL');
      expect(fixoGroup?.positionAbbreviation).toBe('FIX');
      expect(semPosicaoGroup?.positionAbbreviation).toBe('---');
    });

    it('should sort groups in futsal position order', () => {
      const groups = groupPlayersByPosition(mockPlayers);
      
      expect(groups[0].positionName).toBe('Goleiro');
      expect(groups[1].positionName).toBe('Fixo');
      expect(groups[2].positionName).toBe('Ala');
      expect(groups[3].positionName).toBe('Pivô');
      expect(groups[4].positionName).toBe('Sem Posição'); // Always last
    });

    it('should handle empty player list', () => {
      const groups = groupPlayersByPosition([]);
      
      expect(groups).toEqual([]);
    });

    it('should handle all players without position', () => {
      const playersNoPos: PlayerWithPosition[] = [
        {
          player_id: 'p1',
          player_name: 'Player 1',
          player_number: 1,
          photo_uri: null,
          position_name: null,
          position_abbreviation: null,
          position_id: null
        },
        {
          player_id: 'p2',
          player_name: 'Player 2',
          player_number: 2,
          photo_uri: null,
          position_name: null,
          position_abbreviation: null,
          position_id: null
        }
      ];
      
      const groups = groupPlayersByPosition(playersNoPos);
      
      expect(groups.length).toBe(1);
      expect(groups[0].positionName).toBe('Sem Posição');
      expect(groups[0].players.length).toBe(2);
    });

    it('should handle custom positions alphabetically', () => {
      const customPlayers: PlayerWithPosition[] = [
        {
          player_id: 'p1',
          player_name: 'Player 1',
          player_number: 1,
          photo_uri: null,
          position_name: 'Zagueiro',
          position_abbreviation: 'ZAG',
          position_id: 'pos1'
        },
        {
          player_id: 'p2',
          player_name: 'Player 2',
          player_number: 2,
          photo_uri: null,
          position_name: 'Atacante',
          position_abbreviation: 'ATA',
          position_id: 'pos2'
        }
      ];
      
      const groups = groupPlayersByPosition(customPlayers);
      
      // Should be alphabetical for unknown positions
      expect(groups[0].positionName).toBe('Atacante');
      expect(groups[1].positionName).toBe('Zagueiro');
    });
  });

  describe('sortPlayersInGroups', () => {
    it('should sort players by number within each group', () => {
      const unsortedGroups: GroupedPlayers<PlayerWithPosition>[] = [
        {
          positionName: 'Ala',
          positionAbbreviation: 'ALA',
          players: [
            {
              player_id: 'p4',
              player_name: 'Bruno Costa',
              player_number: 11,
              photo_uri: null,
              position_name: 'Ala',
              position_abbreviation: 'ALA',
              position_id: 'pos3'
            },
            {
              player_id: 'p3',
              player_name: 'Carlos Oliveira',
              player_number: 7,
              photo_uri: null,
              position_name: 'Ala',
              position_abbreviation: 'ALA',
              position_id: 'pos3'
            }
          ]
        }
      ];
      
      const sorted = sortPlayersInGroups(unsortedGroups);
      
      expect(sorted[0].players[0].player_number).toBe(7);
      expect(sorted[0].players[1].player_number).toBe(11);
    });

    it('should handle players without numbers', () => {
      const groups: GroupedPlayers<PlayerWithPosition>[] = [
        {
          positionName: 'Test',
          positionAbbreviation: 'TST',
          players: [
            {
              player_id: 'p1',
              player_name: 'Player 1',
              player_number: 5,
              photo_uri: null,
              position_name: 'Test',
              position_abbreviation: 'TST',
              position_id: 'pos1'
            },
            {
              player_id: 'p2',
              player_name: 'Player 2',
              player_number: null,
              photo_uri: null,
              position_name: 'Test',
              position_abbreviation: 'TST',
              position_id: 'pos1'
            }
          ]
        }
      ];
      
      const sorted = sortPlayersInGroups(groups);
      
      // Player with number should come first
      expect(sorted[0].players[0].player_number).toBe(5);
      expect(sorted[0].players[1].player_number).toBeNull();
    });
  });

  describe('groupAndSortPlayersByPosition', () => {
    it('should group and sort in one operation', () => {
      const result = groupAndSortPlayersByPosition(mockPlayers);
      
      // Verify grouping
      expect(result.length).toBe(5);
      expect(result[0].positionName).toBe('Goleiro');
      expect(result[4].positionName).toBe('Sem Posição');
      
      // Verify sorting within Ala group
      const alaGroup = result.find(g => g.positionName === 'Ala');
      expect(alaGroup?.players[0].player_number).toBe(7);
      expect(alaGroup?.players[1].player_number).toBe(11);
    });

    it('should maintain player data integrity', () => {
      const result = groupAndSortPlayersByPosition(mockPlayers);
      
      // Find all players across all groups
      const allPlayers = result.flatMap(g => g.players);
      
      // Should have same number of players
      expect(allPlayers.length).toBe(mockPlayers.length);
      
      // All original players should be present
      mockPlayers.forEach(original => {
        const found = allPlayers.find(p => p.player_id === original.player_id);
        expect(found).toBeDefined();
        expect(found?.player_name).toBe(original.player_name);
        expect(found?.player_number).toBe(original.player_number);
      });
    });

    it('should handle real-world scenario: bench players during match', () => {
      const benchPlayers: PlayerWithPosition[] = [
        {
          player_id: 'b1',
          player_name: 'Sub Goleiro',
          player_number: 12,
          photo_uri: null,
          position_name: 'Goleiro',
          position_abbreviation: 'GOL',
          position_id: 'pos1'
        },
        {
          player_id: 'b2',
          player_name: 'Sub Ala 1',
          player_number: 14,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos3'
        },
        {
          player_id: 'b3',
          player_name: 'Sub Ala 2',
          player_number: 13,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos3'
        },
        {
          player_id: 'b4',
          player_name: 'Jogador Novo',
          player_number: 20,
          photo_uri: null,
          position_name: null,
          position_abbreviation: null,
          position_id: null
        }
      ];
      
      const grouped = groupAndSortPlayersByPosition(benchPlayers);
      
      // Should have 3 groups: GOL, ALA, Sem Posição
      expect(grouped.length).toBe(3);
      expect(grouped[0].positionName).toBe('Goleiro');
      expect(grouped[1].positionName).toBe('Ala');
      expect(grouped[2].positionName).toBe('Sem Posição');
      
      // Alas should be sorted by number
      const alaGroup = grouped[1];
      expect(alaGroup.players[0].player_number).toBe(13);
      expect(alaGroup.players[1].player_number).toBe(14);
    });
  });

  describe('Edge Cases', () => {
    it('should handle players with same number in same position', () => {
      const duplicateNumbers: PlayerWithPosition[] = [
        {
          player_id: 'p1',
          player_name: 'Player 1',
          player_number: 10,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos1'
        },
        {
          player_id: 'p2',
          player_name: 'Player 2',
          player_number: 10,
          photo_uri: null,
          position_name: 'Ala',
          position_abbreviation: 'ALA',
          position_id: 'pos1'
        }
      ];
      
      const groups = groupAndSortPlayersByPosition(duplicateNumbers);
      
      expect(groups.length).toBe(1);
      expect(groups[0].players.length).toBe(2);
      // Both have same number, order is stable
      expect(groups[0].players[0].player_number).toBe(10);
      expect(groups[0].players[1].player_number).toBe(10);
    });

    it('should preserve player object references', () => {
      const player1 = mockPlayers[0];
      const groups = groupPlayersByPosition(mockPlayers);
      
      const foundPlayer = groups
        .flatMap(g => g.players)
        .find(p => p.player_id === player1.player_id);
      
      // Should be the same reference
      expect(foundPlayer).toBe(player1);
    });
  });
});
