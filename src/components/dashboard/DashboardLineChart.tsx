import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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

const screenWidth = Dimensions.get('window').width;

export function DashboardLineChart({
  title,
  data,
  height = 220,
  showLegend = true,
  yAxisSuffix = '',
  bezier = true,
}: DashboardLineChartProps) {
  if (!data || data.length === 0 || data[0].data.length === 0) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2 dark:text-neutral-100">{title}</Text>
        <View className="h-40 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">Sem dados disponíveis</Text>
        </View>
      </Card>
    );
  }

  // Extract unique dates for labels
  const allDates = [...new Set(data.flatMap((group) => group.data.map((d) => d.date)))].sort();
  const labels = allDates.map((date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const chartData = {
    labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
    datasets: data.map((group) => {
      const dataMap = new Map(group.data.map((d) => [d.date, d.value]));
      return {
        data: allDates.map((date) => dataMap.get(date) || 0),
        color: (opacity = 1) => group.color || `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      };
    }),
    legend: showLegend ? data.map((g) => g.label) : undefined,
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <Card className="p-4">
      <Text className="text-lg font-semibold mb-4 dark:text-neutral-100">{title}</Text>
      
      <LineChart
        data={chartData}
        width={screenWidth - 48}
        height={height}
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        style={styles.chart}
        bezier={bezier}
        fromZero
      />

      {showLegend && data.length > 1 && (
        <View className="flex-row flex-wrap mt-4 gap-3">
          {data.map((group, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: group.color || '#3b82f6',
                }}
              />
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">{group.label}</Text>
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
  },
});
