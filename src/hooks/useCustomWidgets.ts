import { useState, useEffect, useCallback } from 'react';
import { CustomWidget, WidgetChartData, KpiData } from '@/types/dashboard.types';
import { 
  saveCustomWidget, 
  getCustomWidgets, 
  deleteCustomWidget,
  getWidgetData,
  getKpiValue,
  reorderCustomWidgets,
} from '@/database/repositories/statsRepository';
import { useDashboardStore } from '@/store/useDashboardStore';

export function useCustomWidgets() {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = useDashboardStore((state) => state.filters);

  const loadWidgets = useCallback(() => {
    try {
      const loadedWidgets = getCustomWidgets();
      setWidgets(loadedWidgets);
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const addWidget = useCallback((widget: CustomWidget) => {
    saveCustomWidget(widget);
    loadWidgets();
  }, [loadWidgets]);

  const removeWidget = useCallback((id: string) => {
    deleteCustomWidget(id);
    loadWidgets();
  }, [loadWidgets]);

  const getChartData = useCallback((widget: CustomWidget): WidgetChartData => {
    if (widget.type === 'kpi') return { labels: [], series: [] };
    return getWidgetData(widget, filters);
  }, [filters]);

  const getKpiData = useCallback((widget: CustomWidget): KpiData | null => {
    if (widget.type !== 'kpi') return null;
    return getKpiValue(widget, filters);
  }, [filters]);

  const reorderWidgets = useCallback((orderedIds: string[]) => {
    reorderCustomWidgets(orderedIds);
    setWidgets((prev) => {
      const map = new Map(prev.map((w) => [w.id, w]));
      return orderedIds.map((id, idx) => ({ ...map.get(id)!, order: idx })).filter(Boolean);
    });
  }, []);

  return {
    widgets,
    loading,
    addWidget,
    removeWidget,
    reorderWidgets,
    getChartData,
    getKpiData,
    refresh: loadWidgets,
  };
}
