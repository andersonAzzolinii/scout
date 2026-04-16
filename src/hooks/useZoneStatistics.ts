import { useMemo } from 'react';
import type { MatchEvent, FieldZone } from '@/types';
import { getZoneFromYPercent } from '@/constants/society.constants'; // Works for both society and campo

export interface ZoneStatistics {
  total: number;
  byZone: {
    DEFENSIVE: number;
    MIDFIELD: number;
    OFFENSIVE: number;
    UNKNOWN: number; // Events without zone (legacy or futsal)
  };
  percentages: {
    DEFENSIVE: number;
    MIDFIELD: number;
    OFFENSIVE: number;
    UNKNOWN: number;
  };
}

export interface EventZoneBreakdown {
  eventId: string;
  eventName?: string;
  zones: {
    DEFENSIVE: number;
    MIDFIELD: number;
    OFFENSIVE: number;
  };
}

/**
 * Hook para calcular estatísticas de eventos por zona do campo
 */
export function useZoneStatistics(events: MatchEvent[]) {
  return useMemo(() => {
    // Calcular distribuição geral de todos os eventos
    const overall: ZoneStatistics = {
      total: events.length,
      byZone: {
        DEFENSIVE: 0,
        MIDFIELD: 0,
        OFFENSIVE: 0,
        UNKNOWN: 0,
      },
      percentages: {
        DEFENSIVE: 0,
        MIDFIELD: 0,
        OFFENSIVE: 0,
        UNKNOWN: 0,
      },
    };

    // Contar eventos por zona
    events.forEach((event) => {
      const zone = getZoneFromYPercent(event.y);
      if (zone) {
        overall.byZone[zone]++;
      } else {
        overall.byZone.UNKNOWN++;
      }
    });

    // Calcular percentagens
    if (overall.total > 0) {
      overall.percentages.DEFENSIVE = (overall.byZone.DEFENSIVE / overall.total) * 100;
      overall.percentages.MIDFIELD = (overall.byZone.MIDFIELD / overall.total) * 100;
      overall.percentages.OFFENSIVE = (overall.byZone.OFFENSIVE / overall.total) * 100;
      overall.percentages.UNKNOWN = (overall.byZone.UNKNOWN / overall.total) * 100;
    }

    // Calcular breakdown por tipo de evento
    const byEventType = new Map<string, EventZoneBreakdown>();

    events.forEach((event) => {
      const zone = getZoneFromYPercent(event.y);
      if (!zone) return; // Skip events without zone

      if (!byEventType.has(event.event_id)) {
        byEventType.set(event.event_id, {
          eventId: event.event_id,
          eventName: event.event_name,
          zones: {
            DEFENSIVE: 0,
            MIDFIELD: 0,
            OFFENSIVE: 0,
          },
        });
      }

      const breakdown = byEventType.get(event.event_id)!;
      breakdown.zones[zone]++;
    });

    // Calcular estatísticas por jogador
    const byPlayer = new Map<string, ZoneStatistics>();

    events.forEach((event) => {
      if (!event.player_id) return; // Skip opponent events or events without player

      if (!byPlayer.has(event.player_id)) {
        byPlayer.set(event.player_id, {
          total: 0,
          byZone: {
            DEFENSIVE: 0,
            MIDFIELD: 0,
            OFFENSIVE: 0,
            UNKNOWN: 0,
          },
          percentages: {
            DEFENSIVE: 0,
            MIDFIELD: 0,
            OFFENSIVE: 0,
            UNKNOWN: 0,
          },
        });
      }

      const playerStats = byPlayer.get(event.player_id)!;
      playerStats.total++;

      const zone = getZoneFromYPercent(event.y);
      if (zone) {
        playerStats.byZone[zone]++;
      } else {
        playerStats.byZone.UNKNOWN++;
      }
    });

    // Calcular percentagens por jogador
    byPlayer.forEach((stats) => {
      if (stats.total > 0) {
        stats.percentages.DEFENSIVE = (stats.byZone.DEFENSIVE / stats.total) * 100;
        stats.percentages.MIDFIELD = (stats.byZone.MIDFIELD / stats.total) * 100;
        stats.percentages.OFFENSIVE = (stats.byZone.OFFENSIVE / stats.total) * 100;
        stats.percentages.UNKNOWN = (stats.byZone.UNKNOWN / stats.total) * 100;
      }
    });

    return {
      overall,
      byEventType: Array.from(byEventType.values()),
      byPlayer: Object.fromEntries(byPlayer),
      getPlayerZoneStats: (playerId: string): ZoneStatistics | undefined => {
        return byPlayer.get(playerId);
      },
      getEventZoneBreakdown: (eventId: string): EventZoneBreakdown | undefined => {
        return byEventType.get(eventId);
      },
    };
  }, [events]);
}
