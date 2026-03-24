import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import * as statsRepo from '@/database/repositories/statsRepository';
import type { PlayerStats } from '@/types/dashboard.types';

export function usePlayerStatistics() {
  const { filters, setIsLoading } = useDashboardStore();
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Run in a microtask to avoid blocking UI
      await new Promise((resolve) => setTimeout(resolve, 0));
      
      const data = statsRepo.getPlayerStatistics(filters);
      setStats(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading player statistics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setIsLoading]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    error,
    refresh,
    isLoading: useDashboardStore((state) => state.isLoading),
  };
}

export function useTopPlayers(limit: number = 10) {
  const { stats, error, refresh, isLoading } = usePlayerStatistics();

  const topPlayers = stats
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, limit);

  return {
    topPlayers,
    error,
    refresh,
    isLoading,
  };
}

export function usePlayerComparison(playerIds: string[]) {
  const { filters, setIsLoading } = useDashboardStore();
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadComparison = useCallback(async () => {
    if (playerIds.length === 0) {
      setComparisonData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await new Promise((resolve) => setTimeout(resolve, 0));
      
      const data = statsRepo.getPlayerEventComparison(filters, playerIds);
      setComparisonData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading player comparison:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, playerIds, setIsLoading]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  return {
    comparisonData,
    error,
    refresh: loadComparison,
    isLoading: useDashboardStore((state) => state.isLoading),
  };
}
