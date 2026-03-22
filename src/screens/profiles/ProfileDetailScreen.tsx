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
import type { ScoutCategory } from '@/types';

type Route = RouteProp<RootStackParamList, 'ProfileDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { profileId } = route.params;
  const { profiles, categories, events, loadCategories, loadEventsByProfile, createCategory, deleteCategory } = useProfileStore();

  const profile = profiles.find((p) => p.id === profileId);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title={profile?.name ?? 'Perfil'}
        showBack
        right={
          <Button title="+ Categoria" size="sm" onPress={() => setShowCatModal(true)} />
        }
      />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View className="items-center py-12">
            <Icon name="folder-plus-outline" size={48} color="#6b7280" />
            <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
              Nenhuma categoria.{'\n'}Adicione categorias como "Ataque", "Defesa", etc.
            </Text>
          </View>
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
    </View>
  );
}
