import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProfileStore } from '@/store/useProfileStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { ScoutCategory, ScoutEvent } from '@/types';
import { EventCatalogModal } from '@/components/profiles/EventCatalogModal';
import type { EventDefinition } from '@/constants/eventCategories';

type Route = RouteProp<RootStackParamList, 'ProfileDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { profileId } = route.params;
  const { profiles, categories, events, loadCategories, loadEventsByProfile, createCategory, deleteCategory, createEvent } = useProfileStore();

  const profile = profiles.find((p) => p.id === profileId);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    loadCategories(profileId);
    loadEventsByProfile(profileId);
  }, [profileId]);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    createCategory({
      id: generateId(),
      profile_id: profileId,
      name: newCatName.trim(),
      order_index: categories.length,
    });
    setNewCatName('');
    setShowCatModal(false);
  };

  const handleAddFromCatalog = (selectedEvents: Array<{ categoryId: string; categoryName: string; event: EventDefinition }>) => {
    // Agrupar eventos por categoria
    const categoriesMap = new Map<string, { id: string; name: string; events: Array<EventDefinition> }>();
    
    selectedEvents.forEach(({ categoryId, categoryName, event }) => {
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, { id: categoryId, name: categoryName, events: [] });
      }
      categoriesMap.get(categoryId)!.events.push(event);
    });

    // Criar categorias e eventos
    categoriesMap.forEach(({ id: catalogCategoryId, name: categoryName, events }) => {
      // Verificar se categoria já existe (usando o ID do catálogo)
      let category = categories.find(c => c.id === catalogCategoryId);
      
      if (!category) {
        // Criar nova categoria usando o ID do catálogo
        createCategory({
          id: catalogCategoryId,  // Usar ID do catálogo em vez de gerar UUID
          profile_id: profileId,
          name: categoryName,
          order_index: categories.length,
        });
        category = { id: catalogCategoryId, profile_id: profileId, name: categoryName, order_index: categories.length };
      }

      // Criar eventos
      events.forEach(event => {
        createEvent({
          id: generateId(),
          category_id: catalogCategoryId,  // Usar ID do catálogo
          name: event.name,
          icon: event.sentiment === '+' ? 'check-circle' : event.sentiment === '-' ? 'close-circle' : 'circle',
          event_type: 'count',
          is_positive: event.sentiment === '+' ? 1 : 0,
        });
      });
    });

    // Recarregar dados
    setTimeout(() => {
      loadCategories(profileId);
      loadEventsByProfile(profileId);
    }, 100);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title={profile?.name ?? 'Perfil'}
        showBack
      />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => setShowCatalog(true)}
            className="flex-1 bg-blue-500 rounded-xl p-4 flex-row items-center justify-center gap-2"
          >
            <Icon name="database-plus" size={20} color="#fff" />
            <Text className="text-white font-semibold text-base">
              Adicionar do Catálogo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowCatModal(true)}
            className="bg-amber-500 rounded-xl p-4 flex-row items-center justify-center gap-2"
            style={{ minWidth: 100 }}
          >
            <Icon name="folder-plus" size={20} color="#fff" />
            <Text className="text-white font-semibold text-base">
              Nova Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <View className="flex-row items-start gap-3">
            <Icon name="information" size={24} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Como funciona?
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                Use o catálogo para adicionar eventos pré-definidos do sistema, ou crie suas próprias categorias e eventos personalizados.
              </Text>
            </View>
          </View>
        </Card>

        {/* Categories List */}
        {categories.length === 0 ? (
          <Card>
            <View className="items-center py-12">
              <Icon name="folder-plus-outline" size={48} color="#6b7280" />
              <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center font-semibold text-base">
                Nenhuma categoria ainda
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 mt-1 text-center text-sm">
                Adicione eventos do catálogo ou crie suas próprias categorias
              </Text>
            </View>
          </Card>
        ) : (
          categories.map((cat) => {
            const catEvents = events.filter((e) => e.category_id === cat.id);
            return (
              <Card key={cat.id} className="mb-4">
                <View className="flex-row items-center mb-3">
                  <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white">
                    {cat.name}
                  </Text>
                  <Badge label={`${catEvents.length} eventos`} variant="primary" />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EventForm', {
                        profileId,
                        categoryId: cat.id,
                      })
                    }
                    className="ml-3 p-1"
                  >
                    <Icon name="plus" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Excluir categoria?', `"${cat.name}" e todos seus eventos serão removidos.`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Excluir', style: 'destructive', onPress: () => deleteCategory(cat.id) },
                      ])
                    }
                    className="ml-1 p-1"
                  >
                    <Icon name="trash-can-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                {catEvents.length === 0 ? (
                  <Text className="text-xs text-gray-400 italic mb-2">Sem eventos — toque em + para adicionar.</Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {catEvents.map((ev) => (
                      <TouchableOpacity
                        key={ev.id}
                        onPress={() =>
                          navigation.navigate('EventForm', {
                            profileId,
                            categoryId: cat.id,
                            eventId: ev.id,
                          })
                        }
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                          ev.is_positive
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <Icon name={ev.icon || 'circle'} size={14} color={ev.is_positive ? '#22c55e' : '#ef4444'} />
                        <Text className={`text-xs font-medium ${ev.is_positive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {ev.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card>
            );
          })
        )}
        <View className="h-10" />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showCatModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nova Categoria</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base mb-4"
              placeholder="Ex: Ataque, Defesa, Posse de bola..."
              placeholderTextColor="#6b7280"
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button title="Cancelar" variant="ghost" onPress={() => setShowCatModal(false)} className="flex-1" />
              <Button title="Salvar" onPress={handleAddCategory} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Catalog Modal */}
      <EventCatalogModal
        visible={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSave={handleAddFromCatalog}
      />
    </View>
  );
}
