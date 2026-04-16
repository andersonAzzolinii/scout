import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { PlayerAccordionCard, type PlayerData } from '@/components/match/PlayerAccordionCard';
import { useZoneStatistics } from '@/hooks';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { MatchEvent, Match, ScoutEvent } from '@/types';
import * as matchRepo from '@/database/repositories/matchRepository';
import * as eventRepo from '@/database/repositories/eventRepository';
import * as profileRepo from '@/database/repositories/profileRepository';
import * as fieldRepo from '@/database/repositories/fieldRepository';
import * as benchRepo from '@/database/repositories/benchRepository';
import {
  EVENT_CATEGORIES,
  EVENT_METRIC_GROUPS,
  SUMMARY_TOTALIZERS,
  computeGroupTotal,
  computeGroupSuccess,
  computeGroupSuccessRate,
  computeTotalizerTotal,
  computeTotalizerSuccess,
  computeTotalizerRate,
  getSummaryGroups,
  type EventDefinition,
  type EventMetricGroup,
} from '@/constants/eventCategories';

type Route = RouteProp<RootStackParamList, 'MatchReport'>;
type PeriodFilter = 'both' | 1 | 2;

type TimedPeriod = {
  start_minute: number;
  start_second: number;
  end_minute: number | null;
  end_second: number | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  period: number;
};

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function sumPeriodsByFilter(periods: TimedPeriod[], periodFilter: PeriodFilter): number {
  return periods
    .filter(period => periodFilter === 'both' || period.period === periodFilter)
    .reduce((sum, period) => {
      if (period.start_timestamp != null && period.end_timestamp != null) {
        return sum + Math.max(0, Math.floor((period.end_timestamp - period.start_timestamp) / 1000));
      }
      if (period.end_minute != null && period.end_second != null) {
        const start = period.start_minute * 60 + period.start_second;
        const end = period.end_minute * 60 + period.end_second;
        return sum + Math.max(0, end - start);
      }
      return sum;
    }, 0);
}

export function MatchReportScreen() {
  const route = useRoute<Route>();
  const { matchId } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const playerYOffsets = useRef<Record<string, number>>({});

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [profileEvents, setProfileEvents] = useState<ScoutEvent[]>([]);
  const [substitutions, setSubstitutions] = useState<Array<{
    id: string;
    minute: number;
    second: number;
    period: number;
    playerOutName: string;
    playerOutNumber: number;
    playerInName: string;
    playerInNumber: number;
  }>>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('both');
  const [showSubstitutions, setShowSubstitutions] = useState(true);

  useEffect(() => {
    const m = matchRepo.getMatchById(matchId);
    setMatch(m);
    setEvents(eventRepo.getMatchEvents(matchId));
    if (m?.profile_id) {
      setProfileEvents(profileRepo.getEventsByProfile(m.profile_id));
    }

    // Buscar substituições
    const subs = matchRepo.getMatchSubstitutions(matchId);
    const matchPlayers = matchRepo.getMatchPlayers(matchId);
    const subsWithNames = subs.map(sub => {
      const playerOut = matchPlayers.find(p => p.player_id === sub.player_out_id);
      const playerIn = matchPlayers.find(p => p.player_id === sub.player_in_id);
      return {
        id: sub.id,
        minute: sub.minute,
        second: sub.second,
        period: sub.period,
        playerOutName: playerOut?.player_name ?? 'Desconhecido',
        playerOutNumber: playerOut?.player_number ?? 0,
        playerInName: playerIn?.player_name ?? 'Desconhecido',
        playerInNumber: playerIn?.player_number ?? 0,
      };
    });
    setSubstitutions(subsWithNames);
  }, [matchId]);

  // All events flagged showInHeader
  const headerEvents = useMemo<EventDefinition[]>(
    () => EVENT_CATEGORIES.flatMap(c => c.events).filter(e => e.showInHeader),
    []
  );

  // name → static eventId bridge
  const nameToStaticId = useMemo(() => {
    const map = new Map<string, string>();
    EVENT_CATEGORIES.forEach(cat =>
      cat.events.forEach(ev => map.set(ev.name.toLowerCase(), ev.id))
    );
    return map;
  }, []);

  // Static IDs active in this profile
  const profileStaticIds = useMemo(() => {
    const set = new Set<string>();
    profileEvents.forEach(pe => {
      const id = nameToStaticId.get(pe.name.toLowerCase());
      if (id) set.add(id);
    });
    return set;
  }, [profileEvents, nameToStaticId]);

  // Metric groups with at least one event from this profile
  const relevantGroups = useMemo(
    () => EVENT_METRIC_GROUPS.filter(g => g.eventIds.some(id => profileStaticIds.has(id))),
    [profileStaticIds]
  );

  const filteredEvents = useMemo(
    () => events.filter(ev => periodFilter === 'both' || ev.period === periodFilter),
    [events, periodFilter]
  );

  // Build per-player data including field/bench time
  const players = useMemo((): [string, PlayerData][] => {
    const result: Record<string, PlayerData> = {};

    filteredEvents.forEach(ev => {
      if (!result[ev.player_id]) {
        const fieldPeriods = fieldRepo.getPlayerFieldPeriods(matchId, ev.player_id);
        const benchPeriods = benchRepo.getPlayerBenchPeriods(matchId, ev.player_id);
        result[ev.player_id] = {
          name: ev.player_name ?? '?',
          number: ev.player_number ?? 0,
          counts: {},
          lastTimes: {},
          fieldSeconds: sumPeriodsByFilter(fieldPeriods, periodFilter),
          benchSeconds: sumPeriodsByFilter(benchPeriods, periodFilter),
          positive: 0,
          negative: 0,
        };
      }
      const staticId = nameToStaticId.get((ev.event_name ?? '').toLowerCase());
      if (staticId) {
        result[ev.player_id].counts[staticId] = (result[ev.player_id].counts[staticId] ?? 0) + 1;
        const evSecs = ev.minute * 60 + (ev.second ?? 0);
        const prev = result[ev.player_id].lastTimes[staticId];
        if (!prev || evSecs > prev.minute * 60 + prev.second) {
          result[ev.player_id].lastTimes[staticId] = { minute: ev.minute, second: ev.second ?? 0 };
        }
      }
      if (ev.is_positive) result[ev.player_id].positive++;
      else result[ev.player_id].negative++;
    });

    return Object.entries(result).sort(([, a], [, b]) => b.fieldSeconds - a.fieldSeconds);
  }, [filteredEvents, matchId, nameToStaticId, periodFilter]);

  // Aggregate counts across all match events (for summary card)
  const totalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(ev => {
      const id = nameToStaticId.get((ev.event_name ?? '').toLowerCase());
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    });
    return counts;
  }, [filteredEvents, nameToStaticId]);

  // Zone statistics (only for society and campo)
  const zoneStats = useZoneStatistics(filteredEvents);
  const showZoneStats = match?.sport_type === 'society' || match?.sport_type === 'campo';

  // Summary groups driven entirely from eventCategories.ts
  const summaryGroups = useMemo(
    () => getSummaryGroups().filter(g => g.eventIds.some(id => profileStaticIds.has(id))),
    [profileStaticIds]
  );

  // Best player per metric group (groups with successIds only)
  const groupLeaders = useMemo(() => {
    type Leader = {
      group: EventMetricGroup;
      playerId: string;
      playerName: string;
      playerNumber: number;
      success: number;
      total: number;
      rate: number;
    };
    const leaders: Leader[] = [];
    relevantGroups.forEach(group => {
      if (!group.successIds || group.successIds.length === 0) return;
      let best: Leader | null = null;
      players.forEach(([playerId, player]) => {
        const total = group.eventIds.reduce((s, id) => s + (player.counts[id] ?? 0), 0);
        if (total === 0) return;
        const success = group.successIds!.reduce((s, id) => s + (player.counts[id] ?? 0), 0);
        const rate = Math.round((success / total) * 100);
        if (!best || success > best.success || (success === best.success && rate > best.rate)) {
          best = { group, playerId, playerName: player.name, playerNumber: player.number, success, total, rate };
        }
      });
      if (best) leaders.push(best);
    });
    return leaders;
  }, [relevantGroups, players]);

  // Totalizers: only those with at least one active event and total > 0
  const activeTotalizers = useMemo(
    () => SUMMARY_TOTALIZERS.filter(
      t => t.eventIds.some(id => profileStaticIds.has(id)) && computeTotalizerTotal(t, totalCounts) > 0
    ),
    [profileStaticIds, totalCounts]
  );

  // Events grouped by metric group for the summary card
  const summaryEventGroups = useMemo(() => {
    const all = EVENT_CATEGORIES.flatMap(c => c.events);
    const activeWithCount = all.filter(ev => profileStaticIds.has(ev.id) && (totalCounts[ev.id] ?? 0) > 0);
    const placed = new Set<string>();
    const result: {
      groupId: string;
      groupName: string;
      rate: number | null;
      items: { def: EventDefinition; count: number }[];
    }[] = [];

    EVENT_METRIC_GROUPS.forEach(g => {
      const items = activeWithCount
        .filter(ev => g.eventIds.includes(ev.id))
        .map(ev => ({ def: ev, count: totalCounts[ev.id] }));
      if (items.length === 0) return;
      const rate = g.successIds ? computeGroupSuccessRate(g, totalCounts) : null;
      result.push({ groupId: g.id, groupName: g.name, rate, items });
      items.forEach(i => placed.add(i.def.id));
    });

    // Events not belonging to any metric group
    const ungrouped = activeWithCount.filter(ev => !placed.has(ev.id));
    if (ungrouped.length > 0) {
      result.push({
        groupId: '__ungrouped__',
        groupName: '',
        rate: null,
        items: ungrouped.map(ev => ({ def: ev, count: totalCounts[ev.id] })),
      });
    }

    return result;
  }, [profileStaticIds, totalCounts]);

  if (!match) return null;

  const totalDuration = match.total_duration_seconds;
  const firstHalf = match.first_half_seconds;
  const secondHalf = match.second_half_seconds;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title="Relatório"
        subtitle={`${match.team_name} vs ${match.opponent_name}`}
        showBack
      />
      <ScrollView ref={scrollViewRef} className="flex-1 p-4" showsVerticalScrollIndicator={false}>

        <Card className="mb-4">
          <View className="flex-row gap-2">
            {[
              { value: 'both' as const, label: 'Ambos' },
              { value: 1 as const, label: '1º tempo' },
              { value: 2 as const, label: '2º tempo' },
            ].map(tab => {
              const active = periodFilter === tab.value;
              return (
                <Pressable
                  key={String(tab.value)}
                  onPress={() => setPeriodFilter(tab.value)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{
                    backgroundColor: active ? '#111827' : '#f3f4f6',
                    borderWidth: 1,
                    borderColor: active ? '#111827' : '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#ffffff' : '#6b7280' }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Match summary */}
        <Card className="mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="flex-row items-center gap-1">
              <Icon name="clock-outline" size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                1T: {firstHalf != null && firstHalf > 0 ? formatSeconds(firstHalf) : '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="clock-outline" size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                2T: {secondHalf != null && secondHalf > 0 ? formatSeconds(secondHalf) : '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="timer-outline" size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Total: {totalDuration != null && totalDuration > 0 ? formatSeconds(totalDuration) : '—'}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3 mb-2">
            {summaryGroups.map(group => {
              const total = computeGroupTotal(group, totalCounts);
              const success = group.successIds ? computeGroupSuccess(group, totalCounts) : null;
              const fail = success !== null ? total - success : null;
              const rate = computeGroupSuccessRate(group, totalCounts);
              return (
                <View key={group.id} className="flex-1 items-center py-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
                  <Text className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{total}</Text>
                  <Text className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{group.name}</Text>
                  <View className="flex-row gap-2 mt-1">
                    {success !== null && group.successIcon && (
                      <View className="flex-row items-center gap-0.5">
                        <Icon name={group.successIcon as any} size={10} color="#22c55e" />
                        <Text className="text-xs font-semibold text-green-500">{success}</Text>
                      </View>
                    )}
                    {fail !== null && group.failIcon && (
                      <View className="flex-row items-center gap-0.5">
                        <Icon name={group.failIcon as any} size={10} color="#ef4444" />
                        <Text className="text-xs font-semibold text-red-500">{fail}</Text>
                      </View>
                    )}
                    {rate !== null && (
                      <View style={{ backgroundColor: rate >= 50 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: rate >= 50 ? '#22c55e' : '#ef4444' }}>{rate}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          {/* {activeTotalizers.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {activeTotalizers.map(t => {
                const total = computeTotalizerTotal(t, totalCounts);
                const success = t.successIds ? computeTotalizerSuccess(t, totalCounts) : null;
                const rate = computeTotalizerRate(t, totalCounts);
                const rateColor = rate === null ? (t.color ?? '#9ca3af') : rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
                const rateBg   = rate === null ? 'transparent' : rate >= 70 ? 'rgba(34,197,94,0.1)' : rate >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                const accent = t.color ?? '#9ca3af';
                return (
                  <View
                    key={t.id}
                    style={{
                      flexGrow: 1,
                      borderRadius: 12,
                      padding: 5,
                      alignItems: 'center',
                      borderTopWidth: 3,
                      borderTopColor: accent,
                      borderLeftWidth: 1,
                      borderRightWidth: 1,
                      borderBottomWidth: 1,
                      borderLeftColor: '#e5e7eb',
                      borderRightColor: '#e5e7eb',
                      borderBottomColor: '#e5e7eb',
                    }}
                  >
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#000000', lineHeight: 28 }}>{total}</Text>
                    <Text style={{ fontSize: 11, color: '#000000', marginTop: 1, textAlign: 'center' }}>{t.name}</Text>
                    {success !== null && rate !== null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Text style={{ fontSize: 10, color: '#000000' }}>{success}/{total}</Text>
                        <View style={{ backgroundColor: rateBg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: rateColor }}>{rate}%</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )} */}
          {summaryEventGroups.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(156,163,175,0.2)', gap: 10 }}>
              {summaryEventGroups.map(({ groupId, groupName, rate, items }) => {
                const rateColor = rate === null ? '#6b7280' : rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
                const rateBg   = rate === null ? 'transparent' : rate >= 70 ? 'rgba(34,197,94,0.1)' : rate >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                return (
                  <View key={groupId}>
                    {groupName !== '' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>
                          {groupName}
                        </Text>
                        {rate !== null && (
                          <View style={{ backgroundColor: rateBg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: rateColor }}>{rate}%</Text>
                          </View>
                        )}
                      </View>
                    )}
                    {items.map(({ def, count }, idx) => {
                      const accent = def.headerColor ?? (
                        def.sentiment === '+' ? '#22c55e' :
                        def.sentiment === '-' ? '#ef4444' :
                        '#9ca3af'
                      );
                      const isLast = idx === items.length - 1;
                      return (
                        <View
                          key={def.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 5,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: 'rgba(156,163,175,0.12)',
                            gap: 6,
                          }}
                        >
                          {def.headerIcon ? (
                            <Icon name={def.headerIcon as any} size={12} color={accent} />
                          ) : (
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db' }} />
                          )}
                          <Text style={{ flex: 1, fontSize: 13, color: '#6b7280' }}>{def.name}</Text>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: accent }}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Zone Distribution (Society & Campo only) */}
        {showZoneStats && zoneStats.overall.total > 0 && (
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Distribuição por Terço de Campo
            </Text>
            <View style={{ gap: 10 }}>
              {(['DEFENSIVE', 'MIDFIELD', 'OFFENSIVE'] as const).map(zone => {
                const count = zoneStats.overall.byZone[zone];
                const percentage = zoneStats.overall.percentages[zone];
                const zoneLabel = zone === 'DEFENSIVE' ? 'Defensivo' : zone === 'MIDFIELD' ? 'Meio' : 'Ofensivo';
                const zoneColor = zone === 'DEFENSIVE' ? '#ef4444' : zone === 'MIDFIELD' ? '#f59e0b' : '#22c55e';
                const zoneColorLight = zone === 'DEFENSIVE' ? 'rgba(239,68,68,0.1)' : zone === 'MIDFIELD' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';
                
                return (
                  <View key={zone}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: zoneColor }} />
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' }}>
                        {zoneLabel}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
                        {count}
                      </Text>
                      <View style={{ backgroundColor: zoneColorLight, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, minWidth: 50, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: zoneColor }}>
                          {percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={{ height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <View 
                        style={{ 
                          height: '100%', 
                          width: `${percentage}%`, 
                          backgroundColor: zoneColor,
                          borderRadius: 3,
                        }} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            {zoneStats.overall.byZone.UNKNOWN > 0 && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(156,163,175,0.2)' }}>
                <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                  {zoneStats.overall.byZone.UNKNOWN} evento(s) sem zona registrada
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Group Leaders */}
        {groupLeaders.length > 0 && (
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Destaque por Grupo
            </Text>
            {groupLeaders.map(({ group, playerName, playerNumber, success, total, rate }, idx) => {
              const rateColor = rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
              const rateBg = rate >= 70 ? 'rgba(34,197,94,0.1)' : rate >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
              const isLast = idx === groupLeaders.length - 1;
              return (
                <View
                  key={group.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 7,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: 'rgba(156,163,175,0.12)',
                  }}
                >
                  {/* col 1 — player number */}
                  <View style={{ width: 32, alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#374151', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#e5e7eb' }}>#{playerNumber}</Text>
                    </View>
                  </View>
                  {/* col 2 — player name */}
                  <Text style={{ width: 90, fontSize: 12, color: '#374151', marginLeft: 6 }} numberOfLines={1}>
                    {playerName}
                  </Text>
                  {/* col 3 — group name */}
                  <Text style={{ flex: 1, fontSize: 12, color: '#6b7280', marginLeft: 6 }} numberOfLines={1}>
                    {group.name}
                  </Text>
                  {/* col 4 — success/total */}
                  <Text style={{ width: 40, fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
                    {success}/{total}
                  </Text>
                  {/* col 5 — rate */}
                  <View style={{ width: 46, alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: rateBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: rateColor }}>{rate}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Per-player cards */}
        {players.length > 0 ? (
          players.map(([playerId, player]) => {
            const playerZoneStats = zoneStats.getPlayerZoneStats(playerId);
            return (
              <PlayerAccordionCard
                key={playerId}
                playerId={playerId}
                player={player}
                relevantGroups={relevantGroups}
                headerEvents={headerEvents}
                formatSeconds={formatSeconds}
                onLayout={e => { playerYOffsets.current[playerId] = e.nativeEvent.layout.y; }}
                zoneStats={playerZoneStats}
                showZones={showZoneStats}
              />
            );
          })
        ) : (
          <Card className="mb-4">
            <Text className="text-sm text-gray-400 text-center py-2">Sem dados para o filtro selecionado</Text>
          </Card>
        )}

        {/* Timeline */}
        <Card className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Linha do Tempo
            </Text>
            <Pressable
              onPress={() => setShowSubstitutions(!showSubstitutions)}
              className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: showSubstitutions ? 'rgba(59,130,246,0.1)' : 'rgba(156,163,175,0.1)',
              }}
            >
              <Icon 
                name="swap-horizontal" 
                size={14} 
                color={showSubstitutions ? '#3b82f6' : '#9ca3af'} 
              />
              <Text 
                className="text-xs font-semibold"
                style={{ color: showSubstitutions ? '#3b82f6' : '#9ca3af' }}
              >
                Substituições
              </Text>
            </Pressable>
          </View>
          {(() => {
            // Filtrar substituições pelo período
            const filteredSubs = showSubstitutions 
              ? substitutions.filter(sub => periodFilter === 'both' || sub.period === periodFilter)
              : [];

            // Combinar eventos e substituições
            type TimelineItem = 
              | { type: 'event'; data: MatchEvent; period: number }
              | { type: 'substitution'; data: typeof filteredSubs[0]; period: number }
              | { type: 'halftime'; data: { minute: number; second: number }; period: 1.5 };

            const timeline: TimelineItem[] = [
              ...filteredEvents.map(ev => ({ type: 'event' as const, data: ev, period: ev.period ?? 1 })),
              ...filteredSubs.map(sub => ({ type: 'substitution' as const, data: sub, period: sub.period })),
            ];

            // Adicionar marcador de início do segundo tempo se houver eventos/subs no 2º tempo
            const hasSecondHalfItems = 
              filteredEvents.some(ev => ev.period === 2) || 
              filteredSubs.some(sub => sub.period === 2);

            if (hasSecondHalfItems && (periodFilter === 'both' || periodFilter === 2)) {
              timeline.push({
                type: 'halftime',
                data: { minute: 0, second: 0 },
                period: 1.5, // Período intermediário para ordenar entre 1º e 2º tempo
              });
            }

            timeline.sort((a, b) => {
              // Primeiro ordenar por período
              if (a.period !== b.period) {
                return a.period - b.period;
              }
              // Depois por tempo dentro do período
              const aTime = a.data.minute * 60 + a.data.second;
              const bTime = b.data.minute * 60 + b.data.second;
              return aTime - bTime;
            });

            if (timeline.length === 0) {
              return <Text className="text-gray-400 text-sm text-center py-3">Sem eventos registrados</Text>;
            }

            return timeline.map((item, idx) => {
              if (item.type === 'event') {
                const ev = item.data;
                const staticId = nameToStaticId.get((ev.event_name ?? '').toLowerCase());
                const headerDef = staticId ? headerEvents.find(e => e.id === staticId) : undefined;
                return (
                  <Pressable
                    key={`event-${ev.id}`}
                    onPress={() => {
                      const y = playerYOffsets.current[ev.player_id];
                      if (y != null) scrollViewRef.current?.scrollTo({ y, animated: true });
                    }}
                    className="flex-row items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <Text className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12">
                      {String(ev.minute).padStart(2, '0')}:{String(ev.second).padStart(2, '0')}
                    </Text>
                    <View
                      style={{
                        backgroundColor: (ev.period ?? 1) === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)',
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: (ev.period ?? 1) === 1 ? '#3b82f6' : '#22c55e' }}>
                        {(ev.period ?? 1) === 1 ? '1T' : '2T'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: ev.is_positive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                      }}
                    >
                      <Icon
                        name={ev.is_positive ? 'plus' : 'minus'}
                        size={11}
                        color={ev.is_positive ? '#22c55e' : '#ef4444'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={headerDef ? 'text-sm font-bold text-gray-800 dark:text-gray-200' : 'text-sm text-gray-800 dark:text-gray-200'}
                      >
                        {ev.event_name}
                      </Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-500">
                        #{ev.player_number} {ev.player_name}
                      </Text>
                    </View>
                  </Pressable>
                );
              } else if (item.type === 'substitution') {
                // Substituição
                const sub = item.data;
                return (
                  <View
                    key={`sub-${sub.id}`}
                    className="flex-row items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700"
                    style={{ backgroundColor: 'rgba(59,130,246,0.05)' }}
                  >
                    <Text className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12">
                      {String(sub.minute).padStart(2, '0')}:{String(sub.second).padStart(2, '0')}
                    </Text>
                    <View
                      style={{
                        backgroundColor: sub.period === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)',
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: sub.period === 1 ? '#3b82f6' : '#22c55e' }}>
                        {sub.period === 1 ? '1T' : '2T'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: 'rgba(59,130,246,0.15)',
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                      }}
                    >
                      <Icon name="swap-horizontal" size={11} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Substituição
                      </Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <Icon name="arrow-up" size={10} color="#22c55e" />
                          <Text className="text-xs text-gray-600 dark:text-gray-400">
                            #{sub.playerInNumber} {sub.playerInName.split(' ')[0]}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-400">•</Text>
                        <View className="flex-row items-center gap-1">
                          <Icon name="arrow-down" size={10} color="#ef4444" />
                          <Text className="text-xs text-gray-600 dark:text-gray-400">
                            #{sub.playerOutNumber} {sub.playerOutName.split(' ')[0]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              } else {
                // Início do segundo tempo
                const firstHalfSeconds = match?.first_half_seconds ?? 0;
                return (
                  <View
                    key="halftime"
                    className="flex-row items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700"
                    style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}
                  >
                    <View style={{ width: 12 }} />
                    <View
                      style={{
                        backgroundColor: 'rgba(245,158,11,0.2)',
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                      }}
                    >
                      <Icon name="whistle-outline" size={11} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        Início do 2º Tempo
                      </Text>
                    </View>
                  </View>
                );
              }
            });
          })()}
        </Card>
      </ScrollView>
    </View>
  );
}
