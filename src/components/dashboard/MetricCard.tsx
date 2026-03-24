import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import type { MetricCard as MetricCardType } from '@/types/dashboard.types';

interface MetricCardProps {
  metric: MetricCardType;
  onPress?: () => void;
}

export function MetricCard({ metric, onPress }: MetricCardProps) {
  const TrendIcon = () => {
    if (!metric.trend) return null;
    
    const isPositive = metric.trend > 0;
    return (
      <View className="flex-row items-center gap-1">
        <Text className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '↑' : '↓'}
        </Text>
        <Text className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {Math.abs(metric.trend).toFixed(1)}%
        </Text>
      </View>
    );
  };

  const content = (
    <Card className="p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            {metric.title}
          </Text>
          <Text className="text-2xl font-bold dark:text-neutral-100 mb-1">
            {metric.value}
          </Text>
          {metric.subtitle && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">
              {metric.subtitle}
            </Text>
          )}
          {metric.trendLabel && (
            <View className="flex-row items-center gap-2 mt-2">
              <TrendIcon />
              {metric.trendLabel && (
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {metric.trendLabel}
                </Text>
              )}
            </View>
          )}
        </View>
        
        {metric.icon && (
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: metric.color ? `${metric.color}20` : '#3b82f620' }}
          >
            <Text className="text-2xl">{metric.icon}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
