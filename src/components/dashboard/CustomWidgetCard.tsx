import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { CustomWidget, WidgetChartData } from '@/types/dashboard.types';
import { DashboardBarChart } from './DashboardBarChart';
import { DashboardLineChart } from './DashboardLineChart';
import { DashboardPieChart } from './DashboardPieChart';

interface Props {
  widget: CustomWidget;
  data: WidgetChartData;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomWidgetCard({ widget, data, onEdit, onDelete }: Props) {
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

  const renderChart = () => {
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
          height={220}
          showLegend={widget.showLegend}
        />
      );
    }
    
    if (widget.type === 'line') {
      // Convert to TimeSeriesGroup format
      const timeSeriesData: import('@/types/dashboard.types').TimeSeriesGroup[] = data.series.map(serie => ({
        label: serie.eventName,
        color: serie.color,
        data: data.labels.map((label, index) => ({
          date: label,
          value: serie.values[index],
        })),
      }));
      
      return (
        <DashboardLineChart
          title=""
          data={timeSeriesData}
          height={220}
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
          height={220}
        />
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{widget.title}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: colors.primary }]}>✏️ Editar</Text>
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
          {widget.selectedEventIds.length} evento(s) • {widget.comparedEntityIds.length} {
            widget.comparisonMode === 'players' ? 'jogador(es)' : 
            widget.comparisonMode === 'teams' ? 'time(s)' : 'categoria(s)'
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
