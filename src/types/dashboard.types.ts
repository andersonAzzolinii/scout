// ─── Dashboard Types ─────────────────────────────────────────────────────────

export type StatisticPeriod = 'all' | 'last7' | 'last30' | 'last90' | 'custom';
export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'heatmap';
export type AggregationType = 'sum' | 'avg' | 'max' | 'min' | 'count';
export type GroupBy = 'player' | 'team' | 'event' | 'match' | 'date' | 'category';

// ─── Dashboard Filters ───────────────────────────────────────────────────────

export interface DashboardFilters {
  // Date filters
  dateFrom: string | null;
  dateTo: string | null;
  period: StatisticPeriod;
  
  // Entity filters
  teamIds: string[];
  playerIds: string[];
  matchIds: string[];
  profileIds: string[];
  categoryIds: string[];
  eventIds: string[];
  
  // Match context filters
  isHomeOnly: boolean | null;
  opponentNames: string[];
  locations: string[];
  
  // Aggregation preferences
  groupBy: GroupBy;
  aggregationType: AggregationType;
}

// ─── Player Statistics ───────────────────────────────────────────────────────

export interface PlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  teamId: string;
  teamName: string;
  photoUri?: string | null;
  
  // General stats
  matchesPlayed: number;
  matchesStarting: number;
  totalMinutes: number;
  averageMinutes: number;
  
  // Event statistics
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  eventBreakdown: EventStatBreakdown[];
  
  // Performance metrics
  positiveRate: number; // percentage
  eventsPerMatch: number;
  eventsPerMinute: number;
}

export interface EventStatBreakdown {
  eventId: string;
  eventName: string;
  eventIcon: string;
  categoryName: string;
  count: number;
  isPositive: boolean;
  averagePerMatch: number;
  trend?: number; // percentage change from previous period
}

// ─── Team Statistics ─────────────────────────────────────────────────────────

export interface TeamStats {
  teamId: string;
  teamName: string;
  photoUri?: string | null;
  
  // Match stats
  matchesPlayed: number;
  matchesHome: number;
  matchesAway: number;
  
  // Player stats
  totalPlayers: number;
  averagePlayersPerMatch: number;
  
  // Event statistics
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  eventBreakdown: EventStatBreakdown[];
  
  // Performance metrics
  positiveRate: number;
  eventsPerMatch: number;
  
  // Top performers
  topPlayers: Array<{
    playerId: string;
    playerName: string;
    totalEvents: number;
    positiveRate: number;
  }>;
}

// ─── Match Statistics ────────────────────────────────────────────────────────

export interface MatchStats {
  matchId: string;
  date: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  location: string;
  isHome: boolean;
  profileId: string;
  profileName: string;
  
  // Event stats
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  
  // Player participation
  playersUsed: number;
  playersStarting: number;
  
  // Event breakdown
  eventBreakdown: EventStatBreakdown[];
  
  // Performance
  positiveRate: number;
  eventsPerPlayer: number;
}

// ─── Comparison Data ─────────────────────────────────────────────────────────

export interface ComparisonData {
  labels: string[];
  datasets: ComparisonDataset[];
}

export interface ComparisonDataset {
  label: string;
  data: number[];
  color?: string;
  metadata?: Record<string, any>;
}

// ─── Time Series Data ────────────────────────────────────────────────────────

export interface TimeSeriesData {
  date: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeriesGroup {
  label: string;
  data: TimeSeriesData[];
  color?: string;
}

// ─── Heatmap Data ────────────────────────────────────────────────────────────

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
  metadata?: Record<string, any>;
}

// ─── Dashboard Metric Card ───────────────────────────────────────────────────

export interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number; // percentage
  trendLabel?: string;
  icon?: string;
  color?: string;
}

// ─── Dashboard Widget (Customizable Charts) ──────────────────────────────────

export type WidgetType = 'bar' | 'line' | 'pie' | 'kpi';
export type ComparisonMode = 'players' | 'teams' | 'events' | 'matches' | 'categories';
export type KpiCalcMode = 'total' | 'pct' | 'avg';
export type AggregationMode = 'count' | 'pct' | 'avg';

export interface CustomWidget {
  id: string;
  title: string;
  type: WidgetType;

  // V2 fields (new builder)
  groupBy?: ComparisonMode;
  aggregation?: AggregationMode;
  filterTeamId?: string;
  filterPlayerId?: string;
  filterMatchId?: string;
  filterCategoryId?: string;
  filterEventId?: string;
  onlyPositive?: boolean;
  onlyNegative?: boolean;

  // V1 legacy fields (kept for backward compat)
  selectedEventIds: string[];
  comparisonMode: ComparisonMode;
  comparedEntityIds: string[];
  showValues: boolean;
  showLegend: boolean;
  kpiEventId?: string;
  kpiCalcMode?: KpiCalcMode;

  // Layout
  height?: 'small' | 'medium' | 'large';
  width?: 'third' | 'half' | 'full';
  order?: number;

  // Metadata
  createdAt: string;
}

export interface KpiData {
  value: number;
  formatted: string;
  unit: string;
  eventName: string;
  eventIcon: string;
  calcModeLabel: string;
}

export interface WidgetChartData {
  labels: string[]; // Entity names (player names, team names, etc)
  series: WidgetSeries[];
}

export interface WidgetSeries {
  eventId: string;
  eventName: string;
  eventIcon: string;
  color: string;
  values: number[]; // Values for each entity
}

// ─── Export Types ────────────────────────────────────────────────────────────

export interface DashboardExportData {
  filters: DashboardFilters;
  generatedAt: string;
  playerStats: PlayerStats[];
  teamStats: TeamStats[];
  matchStats: MatchStats[];
}
