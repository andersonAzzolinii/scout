import React, { useState } from 'react';
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
}

export function EventCatalogModal({ visible, onClose, onSave }: Props) {
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
    const result: Array<{ categoryId: string; categoryName: string; event: EventDefinition }> = [];
    
    EVENT_CATEGORIES.forEach(category => {
      category.events.forEach(event => {
        if (selectedEvents.has(event.id)) {
          result.push({ categoryId: category.id, categoryName: category.name, event });
        }
      });
    });

    onSave(result);
    setSelectedEvents(new Set());
    setExpandedCategories([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedEvents(new Set());
    setExpandedCategories([]);
    onClose();
  };

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
            {selectedEvents.size} evento(s) selecionado(s)
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
                            <Text style={[styles.eventName, { color: colors.text }]}>
                              {event.name}
                            </Text>
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
            disabled={selectedEvents.size === 0}
            style={[
              styles.footerButton,
              {
                backgroundColor: selectedEvents.size === 0 ? colors.border : colors.primary,
              },
            ]}
          >
            <Text style={[styles.footerButtonText, { color: '#fff' }]}>
              Adicionar {selectedEvents.size > 0 ? `(${selectedEvents.size})` : ''}
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
