import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import * as statsRepo from '@/database/repositories/statsRepository';
import type { MetricCard } from '@/types/dashboard.types';

export function useDashboardMetrics() {
  const { filters, setIsLoading } = useDashboardStore();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await new Promise((resolve) => setTimeout(resolve, 0));
      
      const data = statsRepo.getAggregatedMetrics(filters);
      
      const totalEvents = data.totalEvents || 0;
      const positiveEvents = data.positiveEvents || 0;
      const negativeEvents = data.negativeEvents || 0;
      const totalMatches = data.totalMatches || 0;

      const metricCards: MetricCard[] = [
        {
          id: 'total-matches',
          title: 'Total de Partidas',
          value: totalMatches,
          icon: '⚽',
          color: '#3b82f6',
        },
        {
          id: 'total-players',
          title: 'Total de Jogadores',
          value: data.totalPlayers || 0,
          icon: '👥',
          color: '#8b5cf6',
        },
        {
          id: 'total-events',
          title: 'Total de Eventos',
          value: totalEvents,
          icon: '📊',
          color: '#10b981',
        },
        {
          id: 'positive-rate',
          title: 'Taxa de Acertos',
          value: totalEvents > 0 ? `${((positiveEvents / totalEvents) * 100).toFixed(1)}%` : '0%',
          subtitle: `${positiveEvents} positivos de ${totalEvents}`,
          icon: '✅',
          color: '#22c55e',
        },
        {
          id: 'events-per-match',
          title: 'Eventos por Partida',
          value: totalMatches > 0 ? (totalEvents / totalMatches).toFixed(1) : '0',
          icon: '📈',
          color: '#f59e0b',
        },
        {
          id: 'unique-events',
          title: 'Tipos de Eventos',
          value: data.uniqueEvents || 0,
          icon: '🎯',
          color: '#ec4899',
        },
      ];

      setMetrics(metricCards);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setIsLoading]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    error,
    refresh: loadMetrics,
    isLoading: useDashboardStore((state) => state.isLoading),
  };
}
