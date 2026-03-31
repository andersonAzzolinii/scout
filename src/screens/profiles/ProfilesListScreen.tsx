import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportTypeSelector } from '@/components/ui/SportTypeSelector';
import { useProfileStore } from '@/store/useProfileStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { ScoutProfile, SportType } from '@/types';
import { getSportTypeIcon, getSportTypeLabel } from '@/constants/sport.constants';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Default user ID (single-user app) ────────────────────────────────────────
const DEFAULT_USER_ID = 'default-user';

export function ProfilesListScreen() {
  const navigation = useNavigation<Nav>();
  const { profiles, loadProfiles, createProfile, deleteProfile, updateProfile } = useProfileStore();
  const route = useRoute<RouteProp<MainTabParamList, 'Profiles'>>();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [sportType, setSportType] = useState<SportType>('futsal');
  const [editProfile, setEditProfile] = useState<ScoutProfile | null>(null);

  useEffect(() => { loadProfiles(); }, []);

  useEffect(() => {
    if (route.params?.openModal) {
      setEditProfile(null);
      setNewName('');
      setSportType('futsal');
      setShowModal(true);
      navigation.setParams({ openModal: false } as any);
    }
  }, [route.params?.openModal]);

  const handleSave = () => {
    if (!newName.trim()) return;
    if (editProfile) {
      updateProfile(editProfile.id, newName.trim(), sportType);
    } else {
      createProfile({ 
        id: generateId(), 
        user_id: DEFAULT_USER_ID, 
        name: newName.trim(),
        sport_type: sportType
      });
    }
    setShowModal(false);
    setNewName('');
    setSportType('futsal');
    setEditProfile(null);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title="Perfis de Scout"
        right={
          <Button 
            title="Novo" 
            size="sm" 
            onPress={() => { 
              setEditProfile(null); 
              setNewName(''); 
              setSportType('futsal');
              setShowModal(true); 
            }} 
          />
        }
      />
      {profiles.length === 0 ? (
        <EmptyState icon="tune-variant" title="Nenhum perfil" description="Crie um perfil para definir categorias e eventos de scout.">
          <Button title="Criar Perfil" onPress={() => {
            setEditProfile(null);
            setNewName('');
            setSportType('futsal');
            setShowModal(true);
          }} />
        </EmptyState>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('ProfileDetail', { profileId: item.id })}>
              <Card>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                    <Icon name={getSportTypeIcon(item.sport_type) as any} size={20} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {getSportTypeLabel(item.sport_type)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { 
                      setEditProfile(item); 
                      setNewName(item.name); 
                      setSportType(item.sport_type);
                      setShowModal(true); 
                    }}
                    className="p-2 mr-1"
                  >
                    <Icon name="pencil-outline" size={18} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Excluir perfil?', `"${item.name}" e todos os seus eventos serão removidos.`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => deleteProfile(item.id) },
                    ])}
                    className="p-2"
                  >
                    <Icon name="delete-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                  <Icon name="chevron-right" size={18} color="#9ca3af" />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}
            className="w-full"
          >
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-auto">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {editProfile ? 'Editar Perfil' : 'Novo Perfil de Scout'}
              </Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base mb-4"
                placeholder="Nome do perfil (ex: Scout Completo)"
                placeholderTextColor="#6b7280"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <SportTypeSelector 
                selected={sportType}
                onSelect={setSportType}
                showAll={true}
              />
              <View className="flex-row gap-3 mt-2">
                <Button 
                  title="Cancelar" 
                  variant="ghost" 
                  onPress={() => { 
                    setShowModal(false); 
                    setEditProfile(null);
                    setSportType('futsal');
                  }} 
                  className="flex-1" 
                />
                <Button title="Salvar" onPress={handleSave} className="flex-1" />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
