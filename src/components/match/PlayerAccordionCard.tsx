import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { type FieldZone } from '@/types';
import {
  computeGroupTotal,
  computeGroupSuccess,
  computeGroupSuccessRate,
  type EventDefinition,
  type EventMetricGroup,
} from '@/constants/eventCategories';

export type PlayerData = {
  name: string;
  number: number;
  counts: Record<string, number>;
  lastTimes: Record<string, { minute: number; second: number }>;
  fieldSeconds: number;
  benchSeconds: number;
  positive: number;
  negative: number;
};

export type ZoneStatistics = {
  total: number;
  byZone: Record<FieldZone | 'UNKNOWN', number>;
  percentages: Record<FieldZone | 'UNKNOWN', number>;
};

type Props = {
  playerId: string;
  player: PlayerData;
  relevantGroups: EventMetricGroup[];
  headerEvents: EventDefinition[];
  formatSeconds: (s: number) => string;
  onLayout: (e: LayoutChangeEvent) => void;
  zoneStats?: ZoneStatistics | null;
  showZones?: boolean;
};

export function PlayerAccordionCard({ 
  playerId, 
  player, 
  relevantGroups, 
  headerEvents, 
  formatSeconds, 
  onLayout,
  zoneStats,
  showZones = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const groupsWithData = relevantGroups.filter(g => computeGroupTotal(g, player.counts) > 0);
  const badges = headerEvents.filter(e => (player.counts[e.id] ?? 0) > 0);

  return (
    <View key={playerId} onLayout={onLayout}>
      <Card className="mb-4">
        {/* Header row — always visible, tap to toggle */}
        <Pressable
          onPress={() => setExpanded(v => !v)}
          className="flex-row items-center"
          style={{ paddingBottom: expanded ? 12 : 0 }}
        >
          {/* Number avatar */}
          <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 items-center justify-center mr-3">
            <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
              {player.number}
            </Text>
          </View>

          {/* Name + badges */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {player.name}
            </Text>
            {badges.length > 0 && (
              <View className="flex-row gap-2 mt-1 flex-wrap">
                {badges.map(e => (
                  <View key={e.id} className="flex-row items-center gap-0.5">
                    <Icon name={e.headerIcon as any} size={12} color={e.headerColor} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: e.headerColor }}>
                      {player.counts[e.id]}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Field / bench time + chevron */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Icon name="run" size={13} color="#3b82f6" />
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {player.fieldSeconds > 0 ? formatSeconds(player.fieldSeconds) : '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="seat" size={13} color="#f59e0b" />
              <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {player.benchSeconds > 0 ? formatSeconds(player.benchSeconds) : '—'}
              </Text>
            </View>
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#9ca3af"
            />
          </View>
        </Pressable>

        {/* Expandable content */}
        {expanded && groupsWithData.length > 0 && (
          <>
            <View className="flex-row px-1 mb-1 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Text className="flex-1 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Grupo</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16 text-right">Acertou</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16 text-right">Errou</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide w-14 text-right">Último</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide w-14 text-right">Taxa</Text>
            </View>
            {groupsWithData.map(group => {
              const total = computeGroupTotal(group, player.counts);
              const rate = computeGroupSuccessRate(group, player.counts);
              const rateColor = rate === null ? '#6b7280' : rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
              const rateBg = rate === null ? 'transparent' : rate >= 70 ? 'rgba(34,197,94,0.1)' : rate >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
              const success = group.successIds ? computeGroupSuccess(group, player.counts) : null;
              const errado = success !== null ? total - success : null;
              const lastTime = group.eventIds.reduce<{ minute: number; second: number } | null>((best, id) => {
                const t = player.lastTimes[id];
                if (!t) return best;
                if (!best || t.minute * 60 + t.second > best.minute * 60 + best.second) return t;
                return best;
              }, null);
              return (
                <View
                  key={group.id}
                  className="flex-row items-center py-1.5 border-b border-gray-50 dark:border-gray-800"
                >
                  <Text className="flex-1 text-xs text-gray-700 dark:text-gray-300">{group.name}</Text>
                  <Text className="text-xs font-bold text-green-500 w-16 text-right">
                    {success !== null ? success : total}
                  </Text>
                  <Text className="text-xs font-bold text-red-500 w-16 text-right">
                    {errado !== null ? errado : '—'}
                  </Text>
                  <Text className="text-xs font-mono text-gray-400 dark:text-gray-500 w-14 text-right">
                    {lastTime
                      ? `${String(lastTime.minute).padStart(2, '0')}:${String(lastTime.second).padStart(2, '0')}`
                      : '—'}
                  </Text>
                  <View className="w-14 items-end">
                    {rate !== null ? (
                      <View style={{ backgroundColor: rateBg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: rateColor }}>{rate}%</Text>
                      </View>
                    ) : (
                      <Text className="text-xs text-gray-400">—</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Zone distribution for this player */}
            {showZones && zoneStats && zoneStats.total > 0 && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(156,163,175,0.15)' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Distribuição por Terço
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['DEFENSIVE', 'MIDFIELD', 'OFFENSIVE'] as const).map(zone => {
                    const count = zoneStats.byZone[zone];
                    const percentage = zoneStats.percentages[zone];
                    const zoneLabel = zone === 'DEFENSIVE' ? 'Def' : zone === 'MIDFIELD' ? 'Meio' : 'Atq';
                    const zoneColor = zone === 'DEFENSIVE' ? '#ef4444' : zone === 'MIDFIELD' ? '#f59e0b' : '#22c55e';
                    const zoneColorLight = zone === 'DEFENSIVE' ? 'rgba(239,68,68,0.12)' : zone === 'MIDFIELD' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)';
                    
                    return (
                      <View key={zone} style={{ flex: 1, backgroundColor: zoneColorLight, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: zoneColor, lineHeight: 20 }}>
                          {count}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: zoneColor, marginTop: 2 }}>
                          {zoneLabel}
                        </Text>
                        <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>
                          {percentage.toFixed(0)}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </Card>
    </View>
  );
}
