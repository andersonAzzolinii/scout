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
  getAvailablePlayers, 
  getAvailableTeams 
} from '@/database/repositories/statsRepository';
import { 
  EVENT_CATEGORIES, 
  getSentimentColor,
  type EventCategory 
} from '@/constants/eventCategories';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
  editingWidget?: CustomWidget;
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
  const [entities, setEntities] = useState<EntityOption[]>([]);
  
  // Category expansion state
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    if (visible) {
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

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllInCategory = (category: EventCategory) => {
    const categoryEventIds = category.events.map(e => e.id);
    const allSelected = categoryEventIds.every(id => selectedEventIds.includes(id));
    
    if (allSelected) {
      // Deselect all from this category
      setSelectedEventIds(prev => prev.filter(id => !categoryEventIds.includes(id)));
    } else {
      // Select all from this category
      const newIds = [...selectedEventIds];
      categoryEventIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      setSelectedEventIds(newIds);
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
    setExpandedCategories([]);
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
              Selecione os Eventos ({selectedEventIds.length})
            </Text>
            
            {EVENT_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              const eventsInCategory = category.events.length;
              const selectedInCategory = category.events.filter(e => 
                selectedEventIds.includes(e.id)
              ).length;
              const allSelected = selectedInCategory === eventsInCategory;
              
              return (
                <View key={category.id} style={styles.categoryContainer}>
                  {/* Category Header */}
                  <Pressable
                    onPress={() => toggleCategory(category.id)}
                    style={[styles.categoryHeader, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    }]}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {category.name}
                      </Text>
                      <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                        ({selectedInCategory}/{eventsInCategory})
                      </Text>
                    </View>
                    
                    <View style={styles.categoryHeaderRight}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          selectAllInCategory(category);
                        }}
                        style={[styles.selectAllBtn, { 
                          backgroundColor: allSelected ? colors.primary : 'transparent',
                          borderColor: colors.border 
                        }]}
                      >
                        <Text style={[styles.selectAllText, { 
                          color: allSelected ? '#fff' : colors.textSecondary 
                        }]}>
                          {allSelected ? '✓ Todos' : 'Todos'}
                        </Text>
                      </Pressable>
                      
                      <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    </View>
                  </Pressable>
                  
                  {/* Category Events */}
                  {isExpanded && (
                    <View style={styles.eventList}>
                      {category.events.map((event) => {
                        const isSelected = selectedEventIds.includes(event.id);
                        const sentimentColor = getSentimentColor(event.sentiment);
                        
                        return (
                          <Pressable
                            key={event.id}
                            onPress={() => toggleEvent(event.id)}
                            style={[
                              styles.eventItem,
                              { 
                                backgroundColor: colors.card,
                                borderColor: isSelected ? sentimentColor : colors.border 
                              },
                              isSelected && { 
                                borderWidth: 2,
                                backgroundColor: `${sentimentColor}15` 
                              }
                            ]}
                          >
                            <View style={styles.eventItemLeft}>
                              <View style={[
                                styles.sentimentBadge,
                                { backgroundColor: sentimentColor }
                              ]}>
                                <Text style={styles.sentimentText}>{event.sentiment}</Text>
                              </View>
                              <Text style={[styles.eventName, { color: colors.text }]}>
                                {event.name}
                              </Text>
                            </View>
                            
                            {isSelected && (
                              <Text style={styles.checkIcon}>✓</Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
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
  categoryContainer: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 13,
  },
  selectAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    marginLeft: 4,
  },
  eventList: {
    marginTop: 8,
    gap: 6,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 12,
  },
  eventItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sentimentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentimentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 14,
    flex: 1,
  },
  checkIcon: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
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
