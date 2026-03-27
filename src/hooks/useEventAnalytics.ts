import { useMemo } from 'react';
import { usePlayerStatistics } from './usePlayerStatistics';
import { useTeamStatistics } from './useTeamStatistics';
import { useMatchStatistics } from './useMatchStatistics';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import type { ChartPreset, GroupByMode } from '@/constants/chartPresets';
import type { ComparisonData } from '@/types/dashboard.types';

/**
 * Transforms existing statistics data into a single computed metric per entity.
 *
 * For each entity (player / team / match) it:
 *   1. Collects raw counts for every eventId in the preset
 *   2. Calls preset.compute(counts) → single number (e.g. 73 for "73%")
 *   3. Returns ComparisonData with ONE dataset and one value per label
 *
 * Entities where compute() returns null are excluded (not enough data).
 */
export function useEventAnalytics(preset: ChartPreset, groupBy: GroupByMode): {
  data: ComparisonData;
  hasData: boolean;
} {
  const { stats: playerStats } = usePlayerStatistics();
  const { stats: teamStats } = useTeamStatistics();
  const { stats: matchStats } = useMatchStatistics();

  // Build a name→id map so we can match DB event names back to static IDs
  const nameToId = useMemo(() => {
    const map = new Map<string, string>();
    EVENT_CATEGORIES.forEach((cat) => {
      cat.events.forEach((ev) => map.set(ev.name.toLowerCase(), ev.id));
    });
    return map;
  }, []);

  // Build a per-entity Record<eventId, count> from the eventBreakdown array
  const buildCounts = (breakdown: Array<{ eventName: string; count: number }>): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const { eventName, count } of breakdown) {
      const id = nameToId.get(eventName.toLowerCase());
      if (id) counts[id] = (counts[id] ?? 0) + count;
    }
    return counts;
  };

  const data = useMemo((): ComparisonData => {
    type Row = { label: string; value: number };
    const rows: Row[] = [];

    if (groupBy === 'player') {
      for (const p of playerStats) {
        const counts = buildCounts(p.eventBreakdown);
        const value = preset.compute(counts);
        if (value !== null) {
          rows.push({
            label: `#${p.playerNumber} ${p.playerName.split(' ')[0]}`,
            value,
          });
        }
      }
    } else if (groupBy === 'team') {
      for (const t of teamStats) {
        const counts = buildCounts(t.eventBreakdown);
        const value = preset.compute(counts);
        if (value !== null) rows.push({ label: t.teamName, value });
      }
    } else {
      for (const m of matchStats) {
        const counts = buildCounts(m.eventBreakdown);
        const value = preset.compute(counts);
        if (value !== null) {
          const date = new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const name = m.opponentName.length > 10 ? `${m.opponentName.slice(0, 10)}…` : m.opponentName;
          rows.push({ label: `${name} (${date})`, value });
        }
      }
    }

    // Sort descending by value so best performers appear first
    rows.sort((a, b) => b.value - a.value);

    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: preset.title,
          data: rows.map((r) => r.value),
          color: preset.color,
        },
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, playerStats, teamStats, matchStats, preset]);

  const hasData = data.labels.length > 0 && data.datasets[0].data.some((v) => v > 0);

  return { data, hasData };
}
