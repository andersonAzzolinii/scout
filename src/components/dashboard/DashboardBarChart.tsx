import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Card } from '../ui/Card';
import type { ComparisonData } from '@/types/dashboard.types';

interface DashboardBarChartProps {
  title: string;
  data: ComparisonData;
  height?: number;
  showLegend?: boolean;
  yAxisSuffix?: string;
  yAxisLabel?: string;
}

const screenWidth = Dimensions.get('window').width;

export function DashboardBarChart({
  title,
  data,
  height = 220,
  showLegend = true,
  yAxisSuffix = '',
  yAxisLabel = '',
}: DashboardBarChartProps) {
  if (!data || data.labels.length === 0) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2 dark:text-neutral-100">{title}</Text>
        <View className="h-40 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">Sem dados disponíveis</Text>
        </View>
      </Card>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      data: dataset.data,
      color: (opacity = 1) => dataset.color || `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
    })),
    legend: showLegend ? data.datasets.map((d) => d.label) : undefined,
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
    propsForLabels: {
      fontSize: 12,
    },
    barPercentage: 0.7,
  };

  return (
    <Card className="p-4">
      <Text className="text-lg font-semibold mb-4 dark:text-neutral-100">{title}</Text>
      
      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={height}
        yAxisLabel={yAxisLabel}
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />

      {showLegend && data.datasets.length > 1 && (
        <View className="flex-row flex-wrap mt-4 gap-3">
          {data.datasets.map((dataset, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: dataset.color || '#3b82f6',
                }}
              />
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">{dataset.label}</Text>
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
