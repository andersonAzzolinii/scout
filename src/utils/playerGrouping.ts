/**
 * Utility functions for grouping and organizing players
 */

export interface PlayerWithPosition {
  player_id: string;
  player_name?: string | null;
  player_number?: number | null;
  photo_uri?: string | null;
  position_name?: string | null;
  position_abbreviation?: string | null;
  position_id?: string | null;
}

export interface GroupedPlayers<T extends PlayerWithPosition> {
  positionName: string;
  positionAbbreviation: string;
  players: T[];
}

/**
 * Groups players by their functional position
 * Players without position are grouped under "Sem Posição"
 */
export function groupPlayersByPosition<T extends PlayerWithPosition>(
  players: T[]
): GroupedPlayers<T>[] {
  // Create a map to group players by position
  const positionMap = new Map<string, GroupedPlayers<T>>();

  players.forEach(player => {
    const positionKey = player.position_name || 'Sem Posição';
    const abbreviation = player.position_abbreviation || '---';

    if (!positionMap.has(positionKey)) {
      positionMap.set(positionKey, {
        positionName: positionKey,
        positionAbbreviation: abbreviation,
        players: []
      });
    }

    positionMap.get(positionKey)!.players.push(player);
  });

  // Convert map to array and sort
  // Known positions first (with order), then "Sem Posição" last
  const groups = Array.from(positionMap.values());
  
  return groups.sort((a, b) => {
    // "Sem Posição" always goes last
    if (a.positionName === 'Sem Posição') return 1;
    if (b.positionName === 'Sem Posição') return -1;
    
    // Default futsal position order
    const positionOrder = ['Goleiro', 'Fixo', 'Ala', 'Pivô'];
    const aIndex = positionOrder.indexOf(a.positionName);
    const bIndex = positionOrder.indexOf(b.positionName);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Alphabetical for unknown positions
    return a.positionName.localeCompare(b.positionName);
  });
}

/**
 * Sorts players within each group by player number
 */
export function sortPlayersInGroups<T extends PlayerWithPosition>(
  groups: GroupedPlayers<T>[]
): GroupedPlayers<T>[] {
  return groups.map(group => ({
    ...group,
    players: [...group.players].sort((a, b) => 
      (a.player_number || 999) - (b.player_number || 999)
    )
  }));
}

/**
 * Combines grouping and sorting in a single operation
 */
export function groupAndSortPlayersByPosition<T extends PlayerWithPosition>(
  players: T[]
): GroupedPlayers<T>[] {
  const grouped = groupPlayersByPosition(players);
  return sortPlayersInGroups(grouped);
}
