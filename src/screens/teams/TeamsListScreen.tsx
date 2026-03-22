import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Alert, TextInput, Modal, Image, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTeamStore } from '@/store/useTeamStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Team } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TeamsListScreen() {
  const navigation = useNavigation<Nav>();
  const { teams, loadTeams, createTeam, deleteTeam, updateTeam } = useTeamStore();
  const route = useRoute<RouteProp<MainTabParamList, 'Teams'>>();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  useEffect(() => { loadTeams(); }, []);

  useEffect(() => {
    if (route.params?.openModal) {
      setEditTeam(null);
      setNewName('');
      setPhotoBase64(null);
      setShowModal(true);
      navigation.setParams({ openModal: false } as any);
    }
  }, [route.params?.openModal]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPhotoBase64(`data:image/jpeg;base64,${base64}`);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPhotoBase64(`data:image/jpeg;base64,${base64}`);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset && asset.uri) {
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setPhotoBase64(`data:image/jpeg;base64,${base64}`);
        } catch (error) {
          console.error('Erro ao converter imagem:', error);
          Alert.alert('Erro', 'Não foi possível processar a imagem.');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      Alert.alert('Erro', 'Não foi possível abrir o seletor de arquivos.');
    }
  };

  const handlePhotoPress = () => {
    Alert.alert('Foto do Time', 'Escolha uma opção', [
      { text: 'Câmera', onPress: takePhoto },
      { text: 'Galeria (Álbuns)', onPress: pickImage },
      { text: 'Arquivos (Downloads)', onPress: pickFile },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    if (editTeam) {
      updateTeam(editTeam.id, newName.trim(), photoBase64);
    } else {
      createTeam({ 
        id: generateId(), 
        name: newName.trim(), 
        created_at: new Date().toISOString(),
        photo_uri: photoBase64 
      });
    }
    setShowModal(false);
    setNewName('');
    setPhotoBase64(null);
    setEditTeam(null);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title="Times"
        right={
          <Button
            title="Novo"
            size="sm"
            onPress={() => { setEditTeam(null); setNewName(''); setPhotoBase64(null); setShowModal(true); }}
          />
        }
      />

      {teams.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="Nenhum time"
          description="Crie um time para adicionar jogadores."
        >
          <Button title="Criar Time" onPress={() => setShowModal(true)} />
        </EmptyState>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('TeamDetail', { teamId: item.id })}>
              <Card>
                <View className="flex-row items-center">
                  {item.photo_uri ? (
                    <Image 
                      source={{ uri: item.photo_uri }} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                      <Icon name="shield-outline" size={20} color="#6366f1" />
                    </View>
                  )}
                  <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { 
                      setEditTeam(item); 
                      setNewName(item.name); 
                      setPhotoBase64(item.photo_uri || null); 
                      setShowModal(true); 
                    }}
                    className="p-2 mr-1"
                  >
                    <Icon name="pencil-outline" size={18} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Excluir time?', item.name, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Excluir', style: 'destructive', onPress: () => deleteTeam(item.id) },
                      ])
                    }
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

      {/* Create / Edit modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-h-[85%]">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              {editTeam ? 'Editar Time' : 'Novo Time'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Section */}
              <View className="items-center mb-6">
                <TouchableOpacity
                  onPress={handlePhotoPress}
                  className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center overflow-hidden"
                >
                  {photoBase64 || editTeam?.photo_uri ? (
                    <Image
                      source={{ uri: photoBase64 || editTeam?.photo_uri || '' }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Icon name="camera" size={48} color="#6b7280" />
                  )}
                </TouchableOpacity>
                {(photoBase64 || editTeam?.photo_uri) && (
                  <TouchableOpacity
                    onPress={() => setPhotoBase64(null)}
                    className="mt-3"
                  >
                    <Text className="text-red-500 text-sm">Remover foto</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Name Input */}
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base mb-4"
                placeholder="Nome do time"
                placeholderTextColor="#6b7280"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </ScrollView>

            <View className="flex-row gap-3 mt-2">
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => { 
                  setShowModal(false); 
                  setEditTeam(null); 
                  setNewName('');
                  setPhotoBase64(null);
                }}
                className="flex-1"
              />
              <Button title="Salvar" onPress={handleSave} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
