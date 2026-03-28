import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { EVENT_CATEGORIES, getSentimentColor, type EventDefinition } from '@/constants/eventCategories';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedEvents: Array<{ categoryId: string; categoryName: string; event: EventDefinition }>) => void;
  onRemove?: (eventNames: string[]) => void; // Callback para remover eventos desmarcados
  existingEventNames?: string[]; // Nomes dos eventos já cadastrados no perfil
}

export function EventCatalogModal({ visible, onClose, onSave, onRemove, existingEventNames = [] }: Props) {
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

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  // Inicializar eventos já existentes quando o modal abrir
  useEffect(() => {
    if (visible) {
      const existingSet = new Set<string>();
      EVENT_CATEGORIES.forEach(category => {
        category.events.forEach(event => {
          if (existingEventNames.includes(event.name)) {
            existingSet.add(event.id);
          }
        });
      });
      setSelectedEvents(existingSet);
    }
  }, [visible, existingEventNames]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const selectAllInCategory = (categoryId: string) => {
    const category = EVENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const categoryEventIds = category.events.map(e => e.id);
    const allSelected = categoryEventIds.every(id => selectedEvents.has(id));

    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        categoryEventIds.forEach(id => newSet.delete(id));
      } else {
        categoryEventIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const toAdd: Array<{ categoryId: string; categoryName: string; event: EventDefinition }> = [];
    const toRemove: string[] = [];
    
    EVENT_CATEGORIES.forEach(category => {
      category.events.forEach(event => {
        const isSelected = selectedEvents.has(event.id);
        const wasExisting = existingEventNames.includes(event.name);
        
        // Adicionar: evento selecionado que não existia antes
        if (isSelected && !wasExisting) {
          toAdd.push({ categoryId: category.id, categoryName: category.name, event });
        }
        
        // Remover: evento que existia mas foi desmarcado
        if (!isSelected && wasExisting) {
          toRemove.push(event.name);
        }
      });
    });

    // Executar adições
    if (toAdd.length > 0) {
      onSave(toAdd);
    }
    
    // Executar remoções
    if (toRemove.length > 0 && onRemove) {
      onRemove(toRemove);
    }
    
    setExpandedCategories([]);
    onClose();
  };

  const handleCancel = () => {
    setExpandedCategories([]);
    onClose();
  };

  // Calcular quantos eventos novos serão adicionados (não incluindo já existentes)
  const newEventsCount = Array.from(selectedEvents).filter(eventId => {
    const event = EVENT_CATEGORIES.flatMap(c => c.events).find(e => e.id === eventId);
    return event && !existingEventNames.includes(event.name);
  }).length;

  const existingSelectedCount = Array.from(selectedEvents).filter(eventId => {
    const event = EVENT_CATEGORIES.flatMap(c => c.events).find(e => e.id === eventId);
    return event && existingEventNames.includes(event.name);
  }).length;

  // Calcular quantos eventos existentes foram desmarcados (serão removidos)
  const toRemoveCount = existingEventNames.filter(eventName => {
    const event = EVENT_CATEGORIES.flatMap(c => c.events).find(e => e.name === eventName);
    return event && !selectedEvents.has(event.id);
  }).length;

  const hasChanges = newEventsCount > 0 || toRemoveCount > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Icon name="database-plus" size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Catálogo de Eventos
            </Text>
          </View>
          <Pressable onPress={handleCancel} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        {/* Selection Counter */}
        <View style={[styles.counterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Icon name="check-circle" size={20} color={colors.primary} />
          <Text style={[styles.counterText, { color: colors.text }]}>
            {selectedEvents.size} selecionado(s)
            {existingSelectedCount > 0 && (
              <Text style={{ color: colors.textSecondary }}>
                {' '}• {existingSelectedCount} já adicionado(s)
              </Text>
            )}
            {newEventsCount > 0 && (
              <Text style={{ color: '#10b981', fontWeight: '600' }}>
                {' '}• {newEventsCount} novo(s)
              </Text>
            )}
            {toRemoveCount > 0 && (
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                {' '}• {toRemoveCount} a remover
              </Text>
            )}
          </Text>
        </View>

        {/* Categories List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {EVENT_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const eventsInCategory = category.events.length;
            const selectedInCategory = category.events.filter(e =>
              selectedEvents.has(e.id)
            ).length;
            const allSelected = selectedInCategory === eventsInCategory;

            return (
              <View key={category.id} style={styles.categoryContainer}>
                {/* Category Header */}
                <Pressable
                  onPress={() => toggleCategory(category.id)}
                  style={[
                    styles.categoryHeader,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.name}
                    </Text>
                    <View style={[
                      styles.categoryBadge, 
                      { 
                        backgroundColor: selectedInCategory > 0 ? `${colors.primary}20` : colors.border,
                        borderColor: selectedInCategory > 0 ? colors.primary : 'transparent',
                      }
                    ]}>
                      <Text style={[
                        styles.categoryBadgeText, 
                        { color: selectedInCategory > 0 ? colors.primary : colors.textSecondary }
                      ]}>
                        {selectedInCategory}/{eventsInCategory}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryHeaderRight}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        selectAllInCategory(category.id);
                      }}
                      style={[
                        styles.selectAllBtn,
                        {
                          backgroundColor: allSelected ? colors.primary : 'transparent',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectAllText,
                          { color: allSelected ? '#fff' : colors.textSecondary },
                        ]}
                      >
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
                      const isSelected = selectedEvents.has(event.id);
                      const sentimentColor = getSentimentColor(event.sentiment);

                      return (
                        <Pressable
                          key={event.id}
                          onPress={() => toggleEvent(event.id)}
                          style={[
                            styles.eventItem,
                            {
                              backgroundColor: colors.card,
                              borderColor: isSelected ? sentimentColor : colors.border,
                            },
                            isSelected && {
                              borderWidth: 2,
                              backgroundColor: `${sentimentColor}15`,
                            },
                          ]}
                        >
                          <View style={styles.eventItemLeft}>
                            <View
                              style={[
                                styles.sentimentBadge,
                                { backgroundColor: sentimentColor },
                              ]}
                            >
                              <Text style={styles.sentimentText}>{event.sentiment}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.eventName, { color: colors.text }]}>
                                {event.name}
                              </Text>
                              {existingEventNames.includes(event.name) && (
                                <Text style={[styles.alreadyAddedText, { color: colors.textSecondary }]}>
                                  Já adicionado
                                </Text>
                              )}
                            </View>
                          </View>

                          {isSelected && (
                            <Icon name="check-circle" size={20} color={sentimentColor} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            onPress={handleCancel}
            style={[styles.footerButton, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges}
            style={[
              styles.footerButton,
              {
                backgroundColor: !hasChanges ? colors.border : colors.primary,
              },
            ]}
          >
            <Text style={[styles.footerButtonText, { color: '#fff' }]}>
              {!hasChanges 
                ? 'Nenhuma alteração' 
                : `Salvar (${newEventsCount > 0 ? `+${newEventsCount}` : ''}${newEventsCount > 0 && toRemoveCount > 0 ? ' ' : ''}${toRemoveCount > 0 ? `-${toRemoveCount}` : ''})`
              }
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  counterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  counterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  alreadyAddedText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
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
