import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, useColorScheme } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from '../ui/Card';
import type { TimeSeriesGroup } from '@/types/dashboard.types';

interface DashboardLineChartProps {
  title: string;
  data: TimeSeriesGroup[];
  height?: number;
  showLegend?: boolean;
  yAxisSuffix?: string;
  bezier?: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;       // x-axis label (event or date)
  entries: Array<{ group: string; value: number; color: string }>;
}

const screenWidth = Dimensions.get('window').width;

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

export function DashboardLineChart({
  title,
  data,
  height = 240,
  showLegend = true,
  yAxisSuffix = '',
  bezier = true,
}: DashboardLineChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, label: '', entries: [] });

  const bg = isDark ? '#111827' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const subColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (!data || data.length === 0 || data[0].data.length === 0) {
    return (
      <Card className="p-4">
        {title ? <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: textColor }}>{title}</Text> : null}
        <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: subColor }}>Sem dados disponíveis</Text>
        </View>
      </Card>
    );
  }

  // Build ordered x-axis keys
  const allKeys = [...new Set(data.flatMap((g) => g.data.map((d) => d.date)))];
  // Preserve insertion order (already ordered by series structure)
  const xKeys = allKeys;

  const xLabels = xKeys.map((key) => {
    const d = new Date(key);
    if (!isNaN(d.getTime())) return `${d.getDate()}/${d.getMonth() + 1}`;
    return key.length > 7 ? key.substring(0, 7) : key;
  });

  const datasets = data.map((group, gi) => {
    const map = new Map(group.data.map((d) => [d.date, d.value]));
    const color = group.color || COLORS[gi % COLORS.length];
    return {
      data: xKeys.map((k) => map.get(k) ?? 0),
      color: (opacity = 1) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${opacity})`;
      },
      strokeWidth: 2.5,
    };
  });

  const chartData = {
    labels: xLabels,
    datasets,
  };

  const chartConfig = {
    backgroundColor: bg,
    backgroundGradientFrom: bg,
    backgroundGradientTo: bg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99,102,241,${opacity})`,
    labelColor: () => subColor,
    fillShadowGradientOpacity: 0,
    strokeWidth: 2,
    propsForDots: { r: '5', strokeWidth: '2', stroke: bg },
    propsForBackgroundLines: { stroke: gridColor, strokeDasharray: '4 4' },
    propsForLabels: { fontSize: 10 },
  };

  const handleDataPointClick = ({ index, x, y, value }: any) => {
    const xLabel = xLabels[index] ?? '';
    // Match by value at index — more reliable than reference equality
    const groupIndex = datasets.findIndex((d) => d.data[index] === value);
    const gi = groupIndex >= 0 ? groupIndex : 0;
    const group = data[gi];
    const color = group?.color || COLORS[gi % COLORS.length];
    const entries = [{
      group: group?.label ?? '',
      value: typeof value === 'number' ? value : 0,
      color,
    }];
    setTooltip({ visible: true, x, y, label: xLabel, entries });
  };

  return (
    <Card className="p-4">
      {title ? (
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: textColor }}>{title}</Text>
      ) : null}

      <View style={{ position: 'relative' }}>
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={height}
          yAxisSuffix={yAxisSuffix}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier={bezier}
          fromZero
          onDataPointClick={handleDataPointClick}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
        />

        {/* Tooltip overlay */}
        {tooltip.visible && (
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                left: Math.min(Math.max(tooltip.x - 80, 4), screenWidth - 220),
                top: Math.max(tooltip.y - 140, 4),
              },
            ]}
          >
            {/* Header: valor em destaque + fechar */}
            {tooltip.entries.map((entry, i) => (
              <View key={i}>
                {/* Quem (grupo/linha) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <View style={[styles.tooltipDot, { backgroundColor: entry.color }]} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }} numberOfLines={1}>
                      {entry.group}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setTooltip((t) => ({ ...t, visible: false }))}>
                    <Text style={{ color: subColor, fontSize: 14, paddingLeft: 8 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                {/* Separador */}
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#374151' : '#e5e7eb', marginBottom: 8 }} />
                {/* X: evento */}
                <View style={styles.tooltipRow}>
                  <Text style={{ fontSize: 11, color: subColor, flex: 1 }}>Evento (X)</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                    {tooltip.label}
                  </Text>
                </View>
                {/* Y: valor */}
                <View style={[styles.tooltipRow, { marginTop: 4 }]}>
                  <Text style={{ fontSize: 11, color: subColor, flex: 1 }}>Valor (Y)</Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: entry.color }}>
                    {entry.value}{yAxisSuffix}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Legend */}
      {showLegend && data.length > 0 && (
        <View style={styles.legendContainer}>
          {data.map((group, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: group.color || COLORS[i % COLORS.length] }]} />
              <Text style={{ fontSize: 12, color: textColor }} numberOfLines={1}>{group.label}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginLeft: -12,
  },
  tooltip: {
    position: 'absolute',
    minWidth: 160,
    maxWidth: 220,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#374151',
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

