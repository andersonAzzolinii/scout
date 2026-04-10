/**
 * Configuration for match statistics metrics
 * Defines how events are mapped to statistical categories
 */

export interface StatsMetric {
  key: string;
  label: string;
  icon: string;
  /** Keywords to match in event names (case-insensitive) */
  keywords: string[];
  /** Optional color for UI display */
  color?: string;
}

/**
 * Default statistics metrics for football/futsal matches
 * Each metric defines which event names should be counted
 */
export const STATS_METRICS: StatsMetric[] = [
  {
    key: 'shots',
    label: 'Finalizações',
    icon: 'soccer',
    keywords: ['finaliza', 'chute', 'gol'],
    color: '#3b82f6'
  },
  {
    key: 'shots_on_goal',
    label: 'Fin. ao Gol',
    icon: 'soccer',
    keywords: ['gol', 'no gol', 'ao gol'],
    color: '#22c55e'
  },
  {
    key: 'corners',
    label: 'Escanteios',
    icon: 'flag',
    keywords: ['escanteio'],
    color: '#f59e0b'
  },
  {
    key: 'fouls',
    label: 'Faltas',
    icon: 'whistle',
    keywords: ['falta'],
    color: '#ef4444'
  },
  {
    key: 'yellow_cards',
    label: 'Cartões Amarelos',
    icon: 'card',
    keywords: ['amarelo'],
    color: '#fbbf24'
  },
  {
    key: 'red_cards',
    label: 'Cartões Vermelhos',
    icon: 'card',
    keywords: ['vermelho'],
    color: '#dc2626'
  }
];

/**
 * Helper function to check if an event matches a metric
 * @param eventName Event name to check
 * @param metric Metric configuration
 * @returns true if the event matches any keyword in the metric
 */
export function eventMatchesMetric(eventName: string | undefined | null, metric: StatsMetric): boolean {
  if (!eventName) return false;
  const lowerName = eventName.toLowerCase();
  return metric.keywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
}

/**
 * Helper function to find which metric an event belongs to
 * @param eventName Event name to check
 * @returns The matching metric or undefined
 */
export function findMetricForEvent(eventName: string | undefined | null): StatsMetric | undefined {
  if (!eventName) return undefined;
  return STATS_METRICS.find(metric => eventMatchesMetric(eventName, metric));
}

/**
 * Get count of events matching a specific metric
 * @param events Array of events to count
 * @param metric Metric to match against
 * @param isOpponent Filter by opponent events (default: false)
 * @returns Count of matching events
 */
export function countEventsForMetric(
  events: Array<{ event_name?: string | null; is_opponent_event?: boolean }>,
  metric: StatsMetric,
  isOpponent: boolean = false
): number {
  return events.filter(e => 
    e.is_opponent_event === isOpponent && 
    eventMatchesMetric(e.event_name, metric)
  ).length;
}
