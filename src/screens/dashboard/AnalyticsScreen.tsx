import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { DashboardBarChart } from '@/components/dashboard';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import {
  getPresetsForCategory,
  type ChartPreset,
  type GroupByMode,
} from '@/constants/chartPresets';
import { useEventAnalytics } from '@/hooks/useEventAnalytics';

const GROUP_BY_OPTIONS: { value: GroupByMode; label: string; icon: string }[] = [
  { value: 'player', label: 'Jogadores', icon: '👤' },
  { value: 'team', label: 'Times', icon: '🏆' },
  { value: 'match', label: 'Partidas', icon: '⚽' },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(EVENT_CATEGORIES[0].id);
  const [groupBy, setGroupBy] = useState<GroupByMode>('player');

  const presets = getPresetsForCategory(selectedCategoryId);
  const selectedCategory = EVENT_CATEGORIES.find((c) => c.id === selectedCategoryId)!;

  return (
    <View className="gap-4">
      {/* Category Selector */}
      <View>
        <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 px-1">
          Categoria
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {EVENT_CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? '#2563eb' : 'transparent',
                    borderColor: isSelected ? '#2563eb' : '#374151',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                  <Text
                    style={{
                      color: isSelected ? '#fff' : '#9ca3af',
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }}
                    numberOfLines={1}
                  >
                    {cat.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* GroupBy Toggle */}
      <View>
        <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 px-1">
          Agrupar por
        </Text>
        <View className="flex-row gap-2">
          {GROUP_BY_OPTIONS.map((opt) => {
            const isSelected = opt.value === groupBy;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setGroupBy(opt.value)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  backgroundColor: isSelected ? '#1e3a5f' : 'transparent',
                  borderColor: isSelected ? '#3b82f6' : '#374151',
                }}
              >
                <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                <Text
                  style={{
                    color: isSelected ? '#60a5fa' : '#9ca3af',
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#111827',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: '#1f2937',
        }}
      >
        <Text style={{ fontSize: 24 }}>{selectedCategory.icon}</Text>
        <View>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
            {selectedCategory.name}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 11 }}>
            {presets.length} {presets.length === 1 ? 'gráfico disponível' : 'gráficos disponíveis'}
          </Text>
        </View>
      </View>

      {/* Preset Charts */}
      {presets.length === 0 ? (
        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📊</Text>
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
            Nenhum gráfico definido para esta categoria ainda.
          </Text>
        </View>
      ) : (
        presets.map((preset) => (
          <PresetChartCard key={preset.id} preset={preset} groupBy={groupBy} />
        ))
      )}
    </View>
  );
}

// ─── Preset Chart Card ────────────────────────────────────────────────────────

function PresetChartCard({
  preset,
  groupBy,
}: {
  preset: ChartPreset;
  groupBy: GroupByMode;
}) {
  const { data, hasData } = useEventAnalytics(preset, groupBy);

  return (
    <View
      style={{
        backgroundColor: '#111827',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
      }}
    >
      {/* Card header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 2 }}>
            {preset.title}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 11 }}>{preset.metricDescription}</Text>
        </View>
        <View
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: '#9ca3af', fontSize: 10, fontWeight: '700' }}>
            {preset.yAxisSuffix === '%' ? 'Proporção' : 'Volume'}
          </Text>
        </View>
      </View>

      {/* Chart or empty state */}
      {!hasData ? (
        <View style={{ padding: 16, paddingTop: 8, alignItems: 'center' }}>
          <Text style={{ color: '#4b5563', fontSize: 12 }}>
            Sem dados registrados para este grupo
          </Text>
        </View>
      ) : (
        <DashboardBarChart
          title=""
          data={data}
          height={200}
          showLegend={false}
          yAxisSuffix={preset.yAxisSuffix}
          yAxisLabel={preset.yAxisLabel}
        />
      )}
    </View>
  );
}
