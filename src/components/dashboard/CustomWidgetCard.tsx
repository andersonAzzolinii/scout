import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { CustomWidget, WidgetChartData, KpiData } from '@/types/dashboard.types';
import { DashboardBarChart } from './DashboardBarChart';
import { DashboardLineChart } from './DashboardLineChart';
import { DashboardPieChart } from './DashboardPieChart';

interface Props {
  widget: CustomWidget;
  data: WidgetChartData;
  kpiData?: KpiData | null;
  onEdit: () => void;
  onDelete: () => void;
  onDrag?: () => void;
  onResize?: () => void;
  onResizeWidth?: () => void;
  isDragging?: boolean;
}

export function CustomWidgetCard({ widget, data, kpiData, onEdit, onDelete, onDrag, onResize, onResizeWidth, isDragging }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;
  
  const colors = {
    card: isDark ? '#171717' : '#ffffff',
    text: isDark ? '#f5f5f5' : '#171717',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    primary: '#3b82f6',
    destructive: '#ef4444',
  };

  const chartHeight = widget.height === 'small' ? 160 : widget.height === 'large' ? 340 : 220;
  const kpiPadding = widget.height === 'small' ? 16 : widget.height === 'large' ? 48 : 28;

  const renderChart = () => {
    if (widget.type === 'kpi') {
      return (
        <View style={{ alignItems: 'center', paddingVertical: kpiPadding, paddingHorizontal: 16 }}>
          {kpiData ? (
            <>
              <Text style={{ fontSize: 44 }}>{kpiData.eventIcon}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 14 }}>
                <Text style={{ fontSize: 60, fontWeight: '900', color: colors.primary, lineHeight: 64 }}>
                  {kpiData.formatted}
                </Text>
                {kpiData.unit ? (
                  <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 10 }}>
                    {kpiData.unit}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 }}>
                {kpiData.eventName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
                {kpiData.calcModeLabel}
              </Text>
            </>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Sem dados</Text>
          )}
        </View>
      );
    }
    if (widget.type === 'bar') {
      // Convert to ComparisonData format
      const chartData: import('@/types/dashboard.types').ComparisonData = {
        labels: data.labels,
        datasets: data.series.map(serie => ({
          label: serie.eventName,
          data: serie.values,
          color: serie.color,
        })),
      };
      return (
        <DashboardBarChart
          title=""
          data={chartData}
          height={chartHeight}
          showLegend={widget.showLegend}
        />
      );
    }
    
    if (widget.type === 'line') {
      // Each line = entity (player/team), x-axis = events
      // Transpose: data.labels = entity names, data.series = events
      const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];
      const timeSeriesData: import('@/types/dashboard.types').TimeSeriesGroup[] = data.labels.map((entityName, entityIndex) => ({
        label: entityName,
        color: COLORS[entityIndex % COLORS.length],
        data: data.series.map((serie) => ({
          date: serie.eventName,
          value: serie.values[entityIndex] ?? 0,
        })),
      }));

      return (
        <DashboardLineChart
          title=""
          data={timeSeriesData}
          height={chartHeight}
          showLegend={widget.showLegend}
        />
      );
    }
    
    if (widget.type === 'pie') {
      // For pie chart, we need to aggregate all series
      const aggregatedData = data.labels.map((label, index) => ({
        name: label,
        value: data.series.reduce((sum, serie) => sum + serie.values[index], 0),
        color: data.series[0]?.color || '#3b82f6',
      }));
      
      return (
        <DashboardPieChart
          title=""
          data={aggregatedData}
          height={chartHeight}
        />
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, opacity: isDragging ? 0.85 : 1, transform: [{ scale: isDragging ? 1.02 : 1 }] }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Drag handle */}
        {onDrag && (
          <Pressable onPressIn={onDrag} style={styles.dragHandle} hitSlop={8}>
            <Text style={{ fontSize: 20, color: colors.textSecondary, letterSpacing: -2 }}>⠿</Text>
          </Pressable>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{widget.title}</Text>
        <View style={styles.actions}>
          {onResizeWidth && (
            <Pressable onPress={onResizeWidth} style={styles.actionButton}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                {widget.width === 'third' ? '⬌' : widget.width === 'half' ? '⬌⬌' : '⬌⬌⬌'}
              </Text>
            </Pressable>
          )}
          {onResize && (
            <Pressable onPress={onResize} style={styles.actionButton}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                {widget.height === 'small' ? '⊡' : widget.height === 'large' ? '⊟' : '⊞'}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: colors.primary }]}>✏️</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: colors.destructive }]}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {widget.type === 'kpi'
            ? `KPI • ${widget.kpiCalcMode === 'total' ? 'Total' : widget.kpiCalcMode === 'pct' ? '% do Total' : 'Média/Partida'}`
            : `${widget.selectedEventIds.length} evento(s) • ${widget.comparedEntityIds.length} ${
                widget.comparisonMode === 'players' ? 'jogador(es)' : 
                widget.comparisonMode === 'teams' ? 'time(s)' : 'categoria(s)'
              }`
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dragHandle: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
  },
});
