import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { CustomWidget, WidgetType, ComparisonMode } from '@/types/dashboard.types';
import { 
  getAvailableEvents, 
  getAvailablePlayers, 
  getAvailableTeams 
} from '@/database/repositories/statsRepository';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
  editingWidget?: CustomWidget;
}

interface EventOption {
  id: string;
  name: string;
  icon: string;
}

interface EntityOption {
  id: string;
  name: string;
  label: string;
}

export function WidgetBuilderModal({ visible, onClose, onSave, editingWidget }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const colors = {
    background: isDark ? '#0a0a0a' : '#fafafa',
    card: isDark ? '#171717' : '#ffffff',
    text: isDark ? '#f5f5f5' : '#171717',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    border: isDark ? '#404040' : '#e5e5e5',
    primary: '#3b82f6',
  };
  
  // Form state
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<WidgetType>('bar');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('players');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [showValues, setShowValues] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Available options
  const [events, setEvents] = useState<EventOption[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);

  // Load initial data
  useEffect(() => {
    if (visible) {
      loadEvents();
      loadEntities(comparisonMode);
      
      if (editingWidget) {
        setTitle(editingWidget.title);
        setChartType(editingWidget.type);
        setComparisonMode(editingWidget.comparisonMode);
        setSelectedEventIds(editingWidget.selectedEventIds);
        setSelectedEntityIds(editingWidget.comparedEntityIds);
        setShowValues(editingWidget.showValues);
        setShowLegend(editingWidget.showLegend);
      } else {
        resetForm();
      }
    }
  }, [visible, editingWidget, comparisonMode]);

  const loadEvents = () => {
    const availableEvents = getAvailableEvents();
    setEvents(availableEvents.map(e => ({ id: e.id, name: e.name, icon: e.icon })));
  };

  const loadEntities = (mode: ComparisonMode) => {
    if (mode === 'players') {
      const players = getAvailablePlayers();
      setEntities(players.map(p => ({ 
        id: p.id, 
        name: p.name,
        label: `#${p.number} ${p.name}` 
      })));
    } else if (mode === 'teams') {
      const teams = getAvailableTeams();
      setEntities(teams.map(t => ({ 
        id: t.id, 
        name: t.name,
        label: t.name 
      })));
    } else {
      setEntities([]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setChartType('bar');
    setComparisonMode('players');
    setSelectedEventIds([]);
    setSelectedEntityIds([]);
    setShowValues(true);
    setShowLegend(true);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleEntity = (entityId: string) => {
    setSelectedEntityIds(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Digite um título para o gráfico');
      return;
    }

    if (selectedEventIds.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um evento');
      return;
    }

    if (comparisonMode !== 'events' && selectedEntityIds.length === 0) {
      Alert.alert('Erro', `Selecione pelo menos um(a) ${comparisonMode === 'players' ? 'jogador' : 'time'}`);
      return;
    }

    const widget: CustomWidget = {
      id: editingWidget?.id || Date.now().toString(),
      title: title.trim(),
      type: chartType,
      selectedEventIds,
      comparisonMode,
      comparedEntityIds: comparisonMode === 'events' ? [] : selectedEntityIds,
      showValues,
      showLegend,
      createdAt: editingWidget?.createdAt || new Date().toISOString(),
    };

    onSave(widget);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editingWidget ? 'Editar Gráfico' : 'Novo Gráfico'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Título do Gráfico</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Gols vs Assistências - Top 5"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border 
              }]}
            />
          </View>

          {/* Chart Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Tipo de Gráfico</Text>
            <View style={styles.buttonGroup}>
              {(['bar', 'line', 'pie'] as WidgetType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setChartType(type)}
                  style={[
                    styles.button,
                    { borderColor: colors.border },
                    chartType === type && { 
                      backgroundColor: colors.primary,
                      borderColor: colors.primary 
                    },
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: chartType === type ? '#fff' : colors.text }
                  ]}>
                    {type === 'bar' ? '📊 Barras' : type === 'line' ? '📈 Linhas' : '🥧 Pizza'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Comparison Mode */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Comparar</Text>
            <View style={styles.buttonGroup}>
              {(['players', 'teams', 'events'] as ComparisonMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setComparisonMode(mode);
                    setSelectedEntityIds([]);
                    loadEntities(mode);
                  }}
                  style={[
                    styles.button,
                    { borderColor: colors.border },
                    comparisonMode === mode && { 
                      backgroundColor: colors.primary,
                      borderColor: colors.primary 
                    },
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: comparisonMode === mode ? '#fff' : colors.text }
                  ]}>
                    {mode === 'players' ? '👤 Jogadores' : 
                     mode === 'teams' ? '👥 Times' : '📊 Eventos'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Event Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Selecione os Eventos ({selectedEventIds.length}/{events.length})
            </Text>
            <View style={styles.chipContainer}>
              {events.map((event) => (
                <Pressable
                  key={event.id}
                  onPress={() => toggleEvent(event.id)}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    selectedEventIds.includes(event.id) && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    { color: selectedEventIds.includes(event.id) ? '#fff' : colors.text }
                  ]}>
                    {event.icon} {event.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Entity Selection (if not comparing events) */}
          {comparisonMode !== 'events' && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Selecione {comparisonMode === 'players' ? 'Jogadores' : 'Times'} ({selectedEntityIds.length}/{entities.length})
              </Text>
              <View style={styles.chipContainer}>
                {entities.map((entity) => (
                  <Pressable
                    key={entity.id}
                    onPress={() => toggleEntity(entity.id)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      selectedEntityIds.includes(entity.id) && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: selectedEntityIds.includes(entity.id) ? '#fff' : colors.text }
                    ]}>
                      {entity.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Display Options */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Opções de Exibição</Text>
            <Pressable
              onPress={() => setShowValues(!showValues)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, showValues && { backgroundColor: colors.primary }]}>
                {showValues && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Mostrar valores nos gráficos
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowLegend(!showLegend)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, showLegend && { backgroundColor: colors.primary }]}>
                {showLegend && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Mostrar legenda
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={onClose}
            style={[styles.footerButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={[styles.footerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.footerButtonText, { color: '#fff' }]}>
              {editingWidget ? 'Atualizar' : 'Criar Gráfico'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
