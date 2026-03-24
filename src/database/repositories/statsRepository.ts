import { getDatabase } from '../db';
import type {
  DashboardFilters,
  PlayerStats,
  TeamStats,
  MatchStats,
  EventStatBreakdown,
  TimeSeriesData,
  TimeSeriesGroup,
  ComparisonData,
  HeatmapData,
} from '@/types/dashboard.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWhereClause(filters: DashboardFilters): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  // Date filters
  if (filters.dateFrom) {
    conditions.push('m.date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push('m.date <= ?');
    params.push(filters.dateTo);
  }

  // Entity filters
  if (filters.teamIds.length > 0) {
    conditions.push(`m.team_id IN (${filters.teamIds.map(() => '?').join(',')})`);
    params.push(...filters.teamIds);
  }
  if (filters.matchIds.length > 0) {
    conditions.push(`m.id IN (${filters.matchIds.map(() => '?').join(',')})`);
    params.push(...filters.matchIds);
  }
  if (filters.profileIds.length > 0) {
    conditions.push(`m.profile_id IN (${filters.profileIds.map(() => '?').join(',')})`);
    params.push(...filters.profileIds);
  }

  // Match context filters
  if (filters.isHomeOnly !== null) {
    conditions.push('m.is_home = ?');
    params.push(filters.isHomeOnly ? 1 : 0);
  }
  if (filters.opponentNames.length > 0) {
    conditions.push(`m.opponent_name IN (${filters.opponentNames.map(() => '?').join(',')})`);
    params.push(...filters.opponentNames);
  }
  if (filters.locations.length > 0) {
    conditions.push(`m.location IN (${filters.locations.map(() => '?').join(',')})`);
    params.push(...filters.locations);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

function buildEventWhereClause(filters: DashboardFilters, alias = 'me'): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  // Player filters
  if (filters.playerIds.length > 0) {
    conditions.push(`${alias}.player_id IN (${filters.playerIds.map(() => '?').join(',')})`);
    params.push(...filters.playerIds);
  }

  // Event filters
  if (filters.eventIds.length > 0) {
    conditions.push(`${alias}.event_id IN (${filters.eventIds.map(() => '?').join(',')})`);
    params.push(...filters.eventIds);
  }

  // Category filters  
  if (filters.categoryIds.length > 0) {
    conditions.push(`sc.id IN (${filters.categoryIds.map(() => '?').join(',')})`);
    params.push(...filters.categoryIds);
  }

  return { clause: conditions.join(' AND '), params };
}

// ─── Player Statistics ───────────────────────────────────────────────────────

export function getPlayerStatistics(filters: DashboardFilters): PlayerStats[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      p.id AS playerId,
      p.name AS playerName,
      p.number AS playerNumber,
      p.photo_uri AS photoUri,
      t.id AS teamId,
      t.name AS teamName,
      COUNT(DISTINCT mp.match_id) AS matchesPlayed,
      SUM(CASE WHEN mp.is_starting = 1 THEN 1 ELSE 0 END) AS matchesStarting,
      COUNT(DISTINCT me.id) AS totalEvents,
      SUM(CASE WHEN se.is_positive = 1 THEN 1 ELSE 0 END) AS positiveEvents,
      SUM(CASE WHEN se.is_positive = 0 THEN 1 ELSE 0 END) AS negativeEvents
    FROM players p
    INNER JOIN teams t ON p.team_id = t.id
    INNER JOIN match_players mp ON p.id = mp.player_id
    INNER JOIN matches m ON mp.match_id = m.id
    LEFT JOIN match_events me ON me.player_id = p.id AND me.match_id = m.id
    LEFT JOIN scout_events se ON me.event_id = se.id
    LEFT JOIN scout_categories sc ON se.category_id = sc.id
    ${matchWhere}
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY p.id, p.name, p.number, p.photo_uri, t.id, t.name
    HAVING COUNT(DISTINCT mp.match_id) > 0
    ORDER BY totalEvents DESC
  `;

  const rows = db.getAllSync<any>(query, [...matchParams, ...eventParams]);

  return rows.map((row) => {
    const matchesPlayed = row.matchesPlayed || 0;
    const totalEvents = row.totalEvents || 0;
    const positiveEvents = row.positiveEvents || 0;
    const negativeEvents = row.negativeEvents || 0;

    return {
      playerId: row.playerId,
      playerName: row.playerName,
      playerNumber: row.playerNumber,
      photoUri: row.photoUri,
      teamId: row.teamId,
      teamName: row.teamName,
      matchesPlayed,
      matchesStarting: row.matchesStarting || 0,
      totalMinutes: 0, // TODO: Implement time tracking
      averageMinutes: 0,
      totalEvents,
      positiveEvents,
      negativeEvents,
      eventBreakdown: getPlayerEventBreakdown(row.playerId, filters),
      positiveRate: totalEvents > 0 ? (positiveEvents / totalEvents) * 100 : 0,
      eventsPerMatch: matchesPlayed > 0 ? totalEvents / matchesPlayed : 0,
      eventsPerMinute: 0, // TODO: Implement time tracking
    };
  });
}

function getPlayerEventBreakdown(playerId: string, filters: DashboardFilters): EventStatBreakdown[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      se.id AS eventId,
      se.name AS eventName,
      se.icon AS eventIcon,
      se.is_positive AS isPositive,
      sc.name AS categoryName,
      COUNT(*) AS count,
      COUNT(DISTINCT me.match_id) AS matchCount
    FROM match_events me
    INNER JOIN scout_events se ON me.event_id = se.id
    INNER JOIN scout_categories sc ON se.category_id = sc.id
    INNER JOIN matches m ON me.match_id = m.id
    WHERE me.player_id = ?
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY se.id, se.name, se.icon, se.is_positive, sc.name
    ORDER BY count DESC
  `;

  const rows = db.getAllSync<any>(query, [playerId, ...matchParams, ...eventParams]);

  return rows.map((row) => ({
    eventId: row.eventId,
    eventName: row.eventName,
    eventIcon: row.eventIcon,
    categoryName: row.categoryName,
    count: row.count,
    isPositive: row.isPositive === 1,
    averagePerMatch: row.matchCount > 0 ? row.count / row.matchCount : 0,
  }));
}

// ─── Team Statistics ─────────────────────────────────────────────────────────

export function getTeamStatistics(filters: DashboardFilters): TeamStats[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      t.id AS teamId,
      t.name AS teamName,
      COUNT(DISTINCT m.id) AS matchesPlayed,
      SUM(CASE WHEN m.is_home = 1 THEN 1 ELSE 0 END) AS matchesHome,
      SUM(CASE WHEN m.is_home = 0 THEN 1 ELSE 0 END) AS matchesAway,
      COUNT(DISTINCT p.id) AS totalPlayers,
      COUNT(DISTINCT me.id) AS totalEvents,
      SUM(CASE WHEN se.is_positive = 1 THEN 1 ELSE 0 END) AS positiveEvents,
      SUM(CASE WHEN se.is_positive = 0 THEN 1 ELSE 0 END) AS negativeEvents
    FROM teams t
    INNER JOIN matches m ON t.id = m.team_id
    LEFT JOIN players p ON p.team_id = t.id
    LEFT JOIN match_events me ON me.team_id = t.id AND me.match_id = m.id
    LEFT JOIN scout_events se ON me.event_id = se.id
    LEFT JOIN scout_categories sc ON se.category_id = sc.id
    ${matchWhere}
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY t.id, t.name
    HAVING COUNT(DISTINCT m.id) > 0
    ORDER BY totalEvents DESC
  `;

  const rows = db.getAllSync<any>(query, [...matchParams, ...eventParams]);

  return rows.map((row) => {
    const matchesPlayed = row.matchesPlayed || 0;
    const totalEvents = row.totalEvents || 0;
    const positiveEvents = row.positiveEvents || 0;
    const negativeEvents = row.negativeEvents || 0;

    return {
      teamId: row.teamId,
      teamName: row.teamName,
      photoUri: null,
      matchesPlayed,
      matchesHome: row.matchesHome || 0,
      matchesAway: row.matchesAway || 0,
      totalPlayers: row.totalPlayers || 0,
      averagePlayersPerMatch: 0, // TODO: Calculate from match_players
      totalEvents,
      positiveEvents,
      negativeEvents,
      eventBreakdown: getTeamEventBreakdown(row.teamId, filters),
      positiveRate: totalEvents > 0 ? (positiveEvents / totalEvents) * 100 : 0,
      eventsPerMatch: matchesPlayed > 0 ? totalEvents / matchesPlayed : 0,
      topPlayers: getTopPlayersForTeam(row.teamId, filters, 5),
    };
  });
}

function getTeamEventBreakdown(teamId: string, filters: DashboardFilters): EventStatBreakdown[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      se.id AS eventId,
      se.name AS eventName,
      se.icon AS eventIcon,
      se.is_positive AS isPositive,
      sc.name AS categoryName,
      COUNT(*) AS count,
      COUNT(DISTINCT me.match_id) AS matchCount
    FROM match_events me
    INNER JOIN scout_events se ON me.event_id = se.id
    INNER JOIN scout_categories sc ON se.category_id = sc.id
    INNER JOIN matches m ON me.match_id = m.id
    WHERE me.team_id = ?
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY se.id, se.name, se.icon, se.is_positive, sc.name
    ORDER BY count DESC
  `;

  const rows = db.getAllSync<any>(query, [teamId, ...matchParams, ...eventParams]);

  return rows.map((row) => ({
    eventId: row.eventId,
    eventName: row.eventName,
    eventIcon: row.eventIcon,
    categoryName: row.categoryName,
    count: row.count,
    isPositive: row.isPositive === 1,
    averagePerMatch: row.matchCount > 0 ? row.count / row.matchCount : 0,
  }));
}

function getTopPlayersForTeam(
  teamId: string,
  filters: DashboardFilters,
  limit: number
): Array<{ playerId: string; playerName: string; totalEvents: number; positiveRate: number }> {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  const query = `
    SELECT 
      p.id AS playerId,
      p.name AS playerName,
      COUNT(me.id) AS totalEvents,
      SUM(CASE WHEN se.is_positive = 1 THEN 1 ELSE 0 END) AS positiveEvents
    FROM players p
    INNER JOIN match_events me ON me.player_id = p.id
    INNER JOIN scout_events se ON me.event_id = se.id
    INNER JOIN matches m ON me.match_id = m.id
    WHERE p.team_id = ?
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    GROUP BY p.id, p.name
    ORDER BY totalEvents DESC
    LIMIT ?
  `;

  const rows = db.getAllSync<any>(query, [teamId, ...matchParams, limit]);

  return rows.map((row) => ({
    playerId: row.playerId,
    playerName: row.playerName,
    totalEvents: row.totalEvents || 0,
    positiveRate: row.totalEvents > 0 ? ((row.positiveEvents || 0) / row.totalEvents) * 100 : 0,
  }));
}

// ─── Match Statistics ────────────────────────────────────────────────────────

export function getMatchStatistics(filters: DashboardFilters): MatchStats[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      m.id AS matchId,
      m.date,
      m.team_id AS teamId,
      t.name AS teamName,
      m.opponent_name AS opponentName,
      m.location,
      m.is_home AS isHome,
      m.profile_id AS profileId,
      sp.name AS profileName,
      COUNT(DISTINCT me.id) AS totalEvents,
      SUM(CASE WHEN se.is_positive = 1 THEN 1 ELSE 0 END) AS positiveEvents,
      SUM(CASE WHEN se.is_positive = 0 THEN 1 ELSE 0 END) AS negativeEvents,
      COUNT(DISTINCT mp.player_id) AS playersUsed,
      SUM(CASE WHEN mp.is_starting = 1 THEN 1 ELSE 0 END) AS playersStarting
    FROM matches m
    INNER JOIN teams t ON m.team_id = t.id
    INNER JOIN scout_profiles sp ON m.profile_id = sp.id
    LEFT JOIN match_players mp ON mp.match_id = m.id
    LEFT JOIN match_events me ON me.match_id = m.id
    LEFT JOIN scout_events se ON me.event_id = se.id
    LEFT JOIN scout_categories sc ON se.category_id = sc.id
    ${matchWhere}
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY m.id
    ORDER BY m.date DESC
  `;

  const rows = db.getAllSync<any>(query, [...matchParams, ...eventParams]);

  return rows.map((row) => {
    const totalEvents = row.totalEvents || 0;
    const positiveEvents = row.positiveEvents || 0;
    const negativeEvents = row.negativeEvents || 0;
    const playersUsed = row.playersUsed || 0;

    return {
      matchId: row.matchId,
      date: row.date,
      teamId: row.teamId,
      teamName: row.teamName,
      opponentName: row.opponentName,
      location: row.location,
      isHome: row.isHome === 1,
      profileId: row.profileId,
      profileName: row.profileName,
      totalEvents,
      positiveEvents,
      negativeEvents,
      playersUsed,
      playersStarting: row.playersStarting || 0,
      eventBreakdown: getMatchEventBreakdown(row.matchId, filters),
      positiveRate: totalEvents > 0 ? (positiveEvents / totalEvents) * 100 : 0,
      eventsPerPlayer: playersUsed > 0 ? totalEvents / playersUsed : 0,
    };
  });
}

function getMatchEventBreakdown(matchId: string, filters: DashboardFilters): EventStatBreakdown[] {
  const db = getDatabase();
  const { clause: eventWhere, params: eventParams } = buildEventWhereClause(filters);

  const query = `
    SELECT 
      se.id AS eventId,
      se.name AS eventName,
      se.icon AS eventIcon,
      se.is_positive AS isPositive,
      sc.name AS categoryName,
      COUNT(*) AS count
    FROM match_events me
    INNER JOIN scout_events se ON me.event_id = se.id
    INNER JOIN scout_categories sc ON se.category_id = sc.id
    WHERE me.match_id = ?
    ${eventWhere ? `AND ${eventWhere}` : ''}
    GROUP BY se.id, se.name, se.icon, se.is_positive, sc.name
    ORDER BY count DESC
  `;

  const rows = db.getAllSync<any>(query, [matchId, ...eventParams]);

  return rows.map((row) => ({
    eventId: row.eventId,
    eventName: row.eventName,
    eventIcon: row.eventIcon,
    categoryName: row.categoryName,
    count: row.count,
    isPositive: row.isPositive === 1,
    averagePerMatch: row.count, // For single match
  }));
}

// ─── Time Series ─────────────────────────────────────────────────────────────

export function getEventTimeSeries(filters: DashboardFilters, eventId: string): TimeSeriesGroup[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  const query = `
    SELECT 
      m.date,
      me.team_id,
      t.name AS teamName,
      COUNT(me.id) AS count
    FROM match_events me
    INNER JOIN matches m ON me.match_id = m.id
    INNER JOIN teams t ON me.team_id = t.id
    WHERE me.event_id = ?
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    GROUP BY m.date, me.team_id, t.name
    ORDER BY m.date ASC
  `;

  const rows = db.getAllSync<any>(query, [eventId, ...matchParams]);

  // Group by team
  const teamGroups = new Map<string, TimeSeriesData[]>();

  rows.forEach((row) => {
    if (!teamGroups.has(row.teamName)) {
      teamGroups.set(row.teamName, []);
    }
    teamGroups.get(row.teamName)!.push({
      date: row.date,
      value: row.count,
    });
  });

  return Array.from(teamGroups.entries()).map(([teamName, data]) => ({
    label: teamName,
    data,
  }));
}

// ─── Comparison Data ─────────────────────────────────────────────────────────

export function getPlayerEventComparison(filters: DashboardFilters, playerIds: string[]): ComparisonData {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  // Get all unique events first
  const eventsQuery = `
    SELECT DISTINCT se.id, se.name
    FROM scout_events se
    INNER JOIN match_events me ON me.event_id = se.id
    INNER JOIN matches m ON me.match_id = m.id
    WHERE me.player_id IN (${playerIds.map(() => '?').join(',')})
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    ORDER BY se.name
  `;

  const events = db.getAllSync<{ id: string; name: string }>(eventsQuery, [...playerIds, ...matchParams]);

  // Get counts for each player-event combination
  const datasets = playerIds.map((playerId) => {
    const player = db.getFirstSync<{ name: string }>(`SELECT name FROM players WHERE id = ?`, [playerId]);
    const playerName = player?.name || 'Unknown';

    const data = events.map((event) => {
      const countQuery = `
        SELECT COUNT(*) AS count
        FROM match_events me
        INNER JOIN matches m ON me.match_id = m.id
        WHERE me.player_id = ? AND me.event_id = ?
        ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
      `;
      const result = db.getFirstSync<{ count: number }>(countQuery, [playerId, event.id, ...matchParams]);
      return result?.count || 0;
    });

    return {
      label: playerName,
      data,
    };
  });

  return {
    labels: events.map((e) => e.name),
    datasets,
  };
}

// ─── Heatmap Data ────────────────────────────────────────────────────────────

export function getPositionHeatmap(filters: DashboardFilters, playerId?: string): HeatmapData[] {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  const query = `
    SELECT 
      CAST(me.x AS INTEGER) AS x,
      CAST(me.y AS INTEGER) AS y,
      COUNT(*) AS count
    FROM match_events me
    INNER JOIN matches m ON me.match_id = m.id
    WHERE me.x IS NOT NULL AND me.y IS NOT NULL
    ${playerId ? 'AND me.player_id = ?' : ''}
    ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    GROUP BY CAST(me.x AS INTEGER), CAST(me.y AS INTEGER)
  `;

  const params = playerId ? [playerId, ...matchParams] : matchParams;
  const rows = db.getAllSync<any>(query, params);

  return rows.map((row) => ({
    x: row.x.toString(),
    y: row.y.toString(),
    value: row.count,
  }));
}

// ─── Aggregated Metrics ──────────────────────────────────────────────────────

export function getAggregatedMetrics(filters: DashboardFilters) {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  const query = `
    SELECT 
      COUNT(DISTINCT m.id) AS totalMatches,
      COUNT(DISTINCT t.id) AS totalTeams,
      COUNT(DISTINCT p.id) AS totalPlayers,
      COUNT(DISTINCT me.id) AS totalEvents,
      SUM(CASE WHEN se.is_positive = 1 THEN 1 ELSE 0 END) AS positiveEvents,
      SUM(CASE WHEN se.is_positive = 0 THEN 1 ELSE 0 END) AS negativeEvents,
      COUNT(DISTINCT se.id) AS uniqueEvents
    FROM matches m
    LEFT JOIN teams t ON m.team_id = t.id
    LEFT JOIN match_players mp ON mp.match_id = m.id
    LEFT JOIN players p ON mp.player_id = p.id
    LEFT JOIN match_events me ON me.match_id = m.id
    LEFT JOIN scout_events se ON me.event_id = se.id
    ${matchWhere}
  `;

  return db.getFirstSync<any>(query, matchParams) || {};
}

// ─── Available Filter Options ────────────────────────────────────────────────

export function getAvailableTeams(): Array<{ id: string; name: string }> {
  const db = getDatabase();
  return db.getAllSync(`SELECT id, name FROM teams ORDER BY name`);
}

export function getAvailablePlayers(teamId?: string): Array<{ id: string; name: string; number: number; teamId: string }> {
  const db = getDatabase();
  if (teamId) {
    return db.getAllSync(
      `SELECT id, name, number, team_id AS teamId FROM players WHERE team_id = ? ORDER BY number`,
      [teamId]
    );
  }
  return db.getAllSync(`SELECT id, name, number, team_id AS teamId FROM players ORDER BY name`);
}

export function getAvailableProfiles(): Array<{ id: string; name: string }> {
  const db = getDatabase();
  return db.getAllSync(`SELECT id, name FROM scout_profiles ORDER BY name`);
}

export function getAvailableCategories(profileId?: string): Array<{ id: string; name: string; profileId: string }> {
  const db = getDatabase();
  if (profileId) {
    return db.getAllSync(
      `SELECT id, name, profile_id AS profileId FROM scout_categories WHERE profile_id = ? ORDER BY order_index`,
      [profileId]
    );
  }
  return db.getAllSync(`SELECT id, name, profile_id AS profileId FROM scout_categories ORDER BY name`);
}

export function getAvailableEvents(categoryId?: string): Array<{ id: string; name: string; icon: string; categoryId: string }> {
  const db = getDatabase();
  if (categoryId) {
    return db.getAllSync(
      `SELECT id, name, icon, category_id AS categoryId FROM scout_events WHERE category_id = ? ORDER BY name`,
      [categoryId]
    );
  }
  return db.getAllSync(`SELECT id, name, icon, category_id AS categoryId FROM scout_events ORDER BY name`);
}

export function getAvailableOpponents(): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ opponent_name: string }>(
    `SELECT DISTINCT opponent_name FROM matches WHERE opponent_name != '' ORDER BY opponent_name`
  );
  return rows.map((r) => r.opponent_name);
}

export function getAvailableLocations(): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ location: string }>(
    `SELECT DISTINCT location FROM matches WHERE location != '' ORDER BY location`
  );
  return rows.map((r) => r.location);
}

export function getDateRange(): { minDate: string | null; maxDate: string | null } {
  const db = getDatabase();
  const result = db.getFirstSync<{ minDate: string; maxDate: string }>(
    `SELECT MIN(date) AS minDate, MAX(date) AS maxDate FROM matches`
  );
  return {
    minDate: result?.minDate || null,
    maxDate: result?.maxDate || null,
  };
}

// ─── Custom Widget Data ──────────────────────────────────────────────────────

export function getWidgetData(
  widget: import('@/types/dashboard.types').CustomWidget,
  filters: DashboardFilters
): import('@/types/dashboard.types').WidgetChartData {
  const db = getDatabase();
  const { clause: matchWhere, params: matchParams } = buildWhereClause(filters);

  if (widget.comparisonMode === 'players') {
    return getPlayerWidgetData(widget, matchWhere, matchParams, db);
  } else if (widget.comparisonMode === 'teams') {
    return getTeamWidgetData(widget, matchWhere, matchParams, db);
  } else {
    return getEventWidgetData(widget, matchWhere, matchParams, db);
  }
}

function getPlayerWidgetData(
  widget: import('@/types/dashboard.types').CustomWidget,
  matchWhere: string,
  matchParams: any[],
  db: any
): import('@/types/dashboard.types').WidgetChartData {
  // Get player names for labels
  const labels = widget.comparedEntityIds.map((playerId) => {
    const player = db.getFirstSync(
      `SELECT name, number FROM players WHERE id = ?`,
      [playerId]
    ) as { name: string; number: number } | null;
    return player ? `#${player.number} ${player.name.split(' ')[0]}` : 'Unknown';
  });

  // Build series for each selected event
  const series: import('@/types/dashboard.types').WidgetSeries[] = widget.selectedEventIds.map((eventId) => {
    const event = db.getFirstSync(
      `SELECT name, icon FROM scout_events WHERE id = ?`,
      [eventId]
    ) as { name: string; icon: string } | null;

    const values = widget.comparedEntityIds.map((playerId) => {
      const query = `
        SELECT COUNT(*) AS count
        FROM match_events me
        INNER JOIN matches m ON me.match_id = m.id
        WHERE me.player_id = ? AND me.event_id = ?
        ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
      `;
      const result = db.getFirstSync(query, [playerId, eventId, ...matchParams]) as { count: number } | null;
      return result?.count || 0;
    });

    return {
      eventId,
      eventName: event?.name || 'Unknown',
      eventIcon: event?.icon || '⚽',
      color: generateEventColor(eventId),
      values,
    };
  });

  return { labels, series };
}

function getTeamWidgetData(
  widget: import('@/types/dashboard.types').CustomWidget,
  matchWhere: string,
  matchParams: any[],
  db: any
): import('@/types/dashboard.types').WidgetChartData {
  const labels = widget.comparedEntityIds.map((teamId) => {
    const team = db.getFirstSync(
      `SELECT name FROM teams WHERE id = ?`,
      [teamId]
    ) as { name: string } | null;
    return team?.name || 'Unknown';
  });

  const series: import('@/types/dashboard.types').WidgetSeries[] = widget.selectedEventIds.map((eventId) => {
    const event = db.getFirstSync(
      `SELECT name, icon FROM scout_events WHERE id = ?`,
      [eventId]
    ) as { name: string; icon: string } | null;

    const values = widget.comparedEntityIds.map((teamId) => {
      const query = `
        SELECT COUNT(*) AS count
        FROM match_events me
        INNER JOIN matches m ON me.match_id = m.id
        WHERE me.team_id = ? AND me.event_id = ?
        ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
      `;
      const result = db.getFirstSync(query, [teamId, eventId, ...matchParams]) as { count: number } | null;
      return result?.count || 0;
    });

    return {
      eventId,
      eventName: event?.name || 'Unknown',
      eventIcon: event?.icon || '⚽',
      color: generateEventColor(eventId),
      values,
    };
  });

  return { labels, series };
}

function getEventWidgetData(
  widget: import('@/types/dashboard.types').CustomWidget,
  matchWhere: string,
  matchParams: any[],
  db: any
): import('@/types/dashboard.types').WidgetChartData {
  // In 'events' mode, we compare the selected events (not entities)
  const labels = widget.selectedEventIds.map((eventId) => {
    const event = db.getFirstSync(
      `SELECT name FROM scout_events WHERE id = ?`,
      [eventId]
    ) as { name: string } | null;
    return event?.name || 'Unknown';
  });

  const values = widget.selectedEventIds.map((eventId) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM match_events me
      INNER JOIN matches m ON me.match_id = m.id
      WHERE me.event_id = ?
      ${matchWhere ? `AND ${matchWhere.replace('WHERE', '')}` : ''}
    `;
    const result = db.getFirstSync(query, [eventId, ...matchParams]) as { count: number } | null;
    return result?.count || 0;
  });

  const series: import('@/types/dashboard.types').WidgetSeries = {
    eventId: 'comparison',
    eventName: 'Eventos',
    eventIcon: '📊',
    color: '#3b82f6',
    values,
  };

  return { labels, series: [series] };
}

function generateEventColor(eventId: string): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  ];
  const hash = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// ─── Widget CRUD ─────────────────────────────────────────────────────────────

export function saveCustomWidget(widget: import('@/types/dashboard.types').CustomWidget): void {
  const db = getDatabase();
  
  db.execSync(`
    CREATE TABLE IF NOT EXISTS custom_widgets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      selected_event_ids TEXT NOT NULL,
      comparison_mode TEXT NOT NULL,
      compared_entity_ids TEXT NOT NULL,
      show_values INTEGER NOT NULL DEFAULT 1,
      show_legend INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  db.runSync(
    `INSERT OR REPLACE INTO custom_widgets 
     (id, title, type, selected_event_ids, comparison_mode, compared_entity_ids, show_values, show_legend, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      widget.id,
      widget.title,
      widget.type,
      JSON.stringify(widget.selectedEventIds),
      widget.comparisonMode,
      JSON.stringify(widget.comparedEntityIds),
      widget.showValues ? 1 : 0,
      widget.showLegend ? 1 : 0,
      widget.createdAt,
    ]
  );
}

export function getCustomWidgets(): import('@/types/dashboard.types').CustomWidget[] {
  const db = getDatabase();
  
  try {
    const rows = db.getAllSync<any>(`SELECT * FROM custom_widgets ORDER BY created_at DESC`);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      selectedEventIds: JSON.parse(row.selected_event_ids),
      comparisonMode: row.comparison_mode,
      comparedEntityIds: JSON.parse(row.compared_entity_ids),
      showValues: row.show_values === 1,
      showLegend: row.show_legend === 1,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export function deleteCustomWidget(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM custom_widgets WHERE id = ?`, [id]);
}
