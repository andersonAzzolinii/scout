import { create } from 'zustand';
import type { DashboardFilters, StatisticPeriod, GroupBy, AggregationType } from '@/types/dashboard.types';

interface DashboardState {
  // Filters
  filters: DashboardFilters;
  
  // UI State
  isLoading: boolean;
  activeTab: 'overview' | 'players' | 'teams' | 'matches' | 'comparison';
  selectedView: 'cards' | 'charts' | 'table';
  
  // Actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setPeriod: (period: StatisticPeriod) => void;
  setDateRange: (dateFrom: string | null, dateTo: string | null) => void;
  setTeamIds: (teamIds: string[]) => void;
  setPlayerIds: (playerIds: string[]) => void;
  setMatchIds: (matchIds: string[]) => void;
  setProfileIds: (profileIds: string[]) => void;
  setCategoryIds: (categoryIds: string[]) => void;
  setEventIds: (eventIds: string[]) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setAggregationType: (type: AggregationType) => void;
  setIsHomeOnly: (isHomeOnly: boolean | null) => void;
  setOpponentNames: (names: string[]) => void;
  setLocations: (locations: string[]) => void;
  
  // UI Actions
  setIsLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'overview' | 'players' | 'teams' | 'matches' | 'comparison') => void;
  setSelectedView: (view: 'cards' | 'charts' | 'table') => void;
}

const getDefaultFilters = (): DashboardFilters => ({
  dateFrom: null,
  dateTo: null,
  period: 'all',
  teamIds: [],
  playerIds: [],
  matchIds: [],
  profileIds: [],
  categoryIds: [],
  eventIds: [],
  isHomeOnly: null,
  opponentNames: [],
  locations: [],
  groupBy: 'player',
  aggregationType: 'sum',
});

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  filters: getDefaultFilters(),
  isLoading: false,
  activeTab: 'overview',
  selectedView: 'cards',

  // Filter actions
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({
      filters: getDefaultFilters(),
    }),

  setPeriod: (period) =>
    set((state) => {
      const now = new Date();
      let dateFrom: string | null = null;
      let dateTo: string | null = now.toISOString().split('T')[0];

      switch (period) {
        case 'last7':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last30':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last90':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'all':
          dateFrom = null;
          dateTo = null;
          break;
        case 'custom':
          // Keep existing dates
          return {
            filters: { ...state.filters, period },
          };
      }

      return {
        filters: { ...state.filters, period, dateFrom, dateTo },
      };
    }),

  setDateRange: (dateFrom, dateTo) =>
    set((state) => ({
      filters: { ...state.filters, dateFrom, dateTo, period: 'custom' },
    })),

  setTeamIds: (teamIds) =>
    set((state) => ({
      filters: { ...state.filters, teamIds },
    })),

  setPlayerIds: (playerIds) =>
    set((state) => ({
      filters: { ...state.filters, playerIds },
    })),

  setMatchIds: (matchIds) =>
    set((state) => ({
      filters: { ...state.filters, matchIds },
    })),

  setProfileIds: (profileIds) =>
    set((state) => ({
      filters: { ...state.filters, profileIds },
    })),

  setCategoryIds: (categoryIds) =>
    set((state) => ({
      filters: { ...state.filters, categoryIds },
    })),

  setEventIds: (eventIds) =>
    set((state) => ({
      filters: { ...state.filters, eventIds },
    })),

  setGroupBy: (groupBy) =>
    set((state) => ({
      filters: { ...state.filters, groupBy },
    })),

  setAggregationType: (aggregationType) =>
    set((state) => ({
      filters: { ...state.filters, aggregationType },
    })),

  setIsHomeOnly: (isHomeOnly) =>
    set((state) => ({
      filters: { ...state.filters, isHomeOnly },
    })),

  setOpponentNames: (opponentNames) =>
    set((state) => ({
      filters: { ...state.filters, opponentNames },
    })),

  setLocations: (locations) =>
    set((state) => ({
      filters: { ...state.filters, locations },
    })),

  // UI actions
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setSelectedView: (selectedView) => set({ selectedView }),
}));
