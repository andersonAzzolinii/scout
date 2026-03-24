import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Card } from '../ui/Card';

interface DashboardPieChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
    legendFontColor?: string;
  }>;
  height?: number;
}

const screenWidth = Dimensions.get('window').width;

export function DashboardPieChart({
  title,
  data,
  height = 220,
}: DashboardPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <Text className="text-lg font-semibold mb-2 dark:text-neutral-100">{title}</Text>
        <View className="h-40 items-center justify-center">
          <Text className="text-neutral-500 dark:text-neutral-400">Sem dados disponíveis</Text>
        </View>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    population: item.value,
    color: item.color,
    legendFontColor: item.legendFontColor || '#7F7F7F',
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <Card className="p-4">
      <Text className="text-lg font-semibold mb-4 dark:text-neutral-100">{title}</Text>
      
      <PieChart
        data={chartData}
        width={screenWidth - 48}
        height={height}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
  },
});
