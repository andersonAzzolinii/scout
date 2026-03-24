import { useState, useEffect, useCallback } from 'react';
import { CustomWidget, WidgetChartData } from '@/types/dashboard.types';
import { 
  saveCustomWidget, 
  getCustomWidgets, 
  deleteCustomWidget,
  getWidgetData 
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
    return getWidgetData(widget, filters);
  }, [filters]);

  return {
    widgets,
    loading,
    addWidget,
    removeWidget,
    getChartData,
    refresh: loadWidgets,
  };
}
