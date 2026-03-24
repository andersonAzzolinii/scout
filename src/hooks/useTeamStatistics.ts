import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import * as statsRepo from '@/database/repositories/statsRepository';
import type { TeamStats } from '@/types/dashboard.types';

export function useTeamStatistics() {
  const { filters, setIsLoading } = useDashboardStore();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await new Promise((resolve) => setTimeout(resolve, 0));
      
      const data = statsRepo.getTeamStatistics(filters);
      setStats(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading team statistics:', err);
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

export function useTopTeams(limit: number = 5) {
  const { stats, error, refresh, isLoading } = useTeamStatistics();

  const topTeams = stats
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, limit);

  return {
    topTeams,
    error,
    refresh,
    isLoading,
  };
}
