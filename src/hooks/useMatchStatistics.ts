import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import * as statsRepo from '@/database/repositories/statsRepository';
import type { MatchStats } from '@/types/dashboard.types';

export function useMatchStatistics() {
  const { filters, setIsLoading } = useDashboardStore();
  const [stats, setStats] = useState<MatchStats[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await new Promise((resolve) => setTimeout(resolve, 0));
      
      const data = statsRepo.getMatchStatistics(filters);
      setStats(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading match statistics:', err);
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

export function useRecentMatches(limit: number = 5) {
  const { stats, error, refresh, isLoading } = useMatchStatistics();

  const recentMatches = stats
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return {
    recentMatches,
    error,
    refresh,
    isLoading,
  };
}
