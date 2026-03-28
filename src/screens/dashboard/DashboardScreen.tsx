import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Header } from '@/components/ui/Header';
import { DashboardFilters } from '@/components/dashboard';
import { CustomWidgetCard } from '@/components/dashboard/CustomWidgetCard';
import { WidgetBuilderModal } from '@/components/dashboard/WidgetBuilderModal';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import type { CustomWidget } from '@/types/dashboard.types';

export function DashboardScreen() {
  const { isLoading } = useDashboardStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | undefined>();

  const {
    widgets,
    addWidget,
    removeWidget,
    reorderWidgets,
    getChartData,
    getKpiData,
    refresh: refreshWidgets,
  } = useCustomWidgets();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWidgets();
    setRefreshing(false);
  };

  const handleSaveWidget = (widget: CustomWidget) => {
    addWidget(widget);
    setShowWidgetBuilder(false);
    setEditingWidget(undefined);
  };

  const handleEditWidget = (widget: CustomWidget) => {
    setEditingWidget(widget);
    setShowWidgetBuilder(true);
  };

  const handleDeleteWidget = (id: string) => {
    Alert.alert(
      'Excluir GrÃ¡fico',
      'Tem certeza que deseja excluir este grÃ¡fico personalizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => removeWidget(id) },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowWidgetBuilder(false);
    setEditingWidget(undefined);
  };

  const handleDragEnd = ({ data }: { data: CustomWidget[] }) => {
    reorderWidgets(data.map((w) => w.id));
  };

  const handleResizeWidget = (widget: CustomWidget) => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const current = widget.height || 'medium';
    const next = sizes[(sizes.indexOf(current) + 1) % sizes.length];
    addWidget({ ...widget, height: next });
  };

  const handleResizeWidthWidget = (widget: CustomWidget) => {
    const widths: Array<'third' | 'half' | 'full'> = ['third', 'half', 'full'];
    const current = widget.width || 'full';
    const next = widths[(widths.indexOf(current) + 1) % widths.length];
    addWidget({ ...widget, width: next });
  };

  const renderWidget = ({ item, drag, isActive }: RenderItemParams<CustomWidget>) => (
    <ScaleDecorator>
      <CustomWidgetCard
        widget={item}
        data={getChartData(item)}
        kpiData={getKpiData(item)}
        onEdit={() => handleEditWidget(item)}
        onDelete={() => handleDeleteWidget(item.id)}
        onDrag={drag}
        onResize={() => handleResizeWidget(item)}
        isDragging={isActive}
      />
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950" edges={['top']}>
      <Header title="Dashboard" showBack />

      <DraggableFlatList
        data={widgets}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        renderItem={renderWidget}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View className="p-4 gap-4">
            <DashboardFilters />
            {isLoading && !refreshing && (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-neutral-500 dark:text-neutral-400 mt-2">Carregando...</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16 gap-3">
              <Text style={{ fontSize: 48 }}>📊</Text>
              <Text className="text-neutral-700 dark:text-neutral-300 font-bold text-lg text-center">
                Nenhum gráfico criado ainda
              </Text>
              <Text className="text-neutral-500 dark:text-neutral-400 text-sm text-center px-8">
                Toque no botão + para criar seu primeiro gráfico personalizado
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 16 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowWidgetBuilder(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <Text className="text-white text-3xl font-bold">+</Text>
      </TouchableOpacity>

      <WidgetBuilderModal
        visible={showWidgetBuilder}
        onClose={handleCloseModal}
        onSave={handleSaveWidget}
        editingWidget={editingWidget}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

