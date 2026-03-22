import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTeamStore } from '@/store/useTeamStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'PlayerForm'>;

export function PlayerFormScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { teamId, playerId } = route.params;
  const { players, createPlayer, updatePlayer } = useTeamStore();

  const existing = playerId ? players.find((p) => p.id === playerId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [number, setNumber] = useState(String(existing?.number ?? ''));
  const [photoBase64, setPhotoBase64] = useState<string | null>(existing?.photo_uri ?? null);
  const [errors, setErrors] = useState<{ name?: string; number?: string }>({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPhotoBase64(`data:image/jpeg;base64,${base64}`);
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        Alert.alert('Erro', 'Não foi possível processar a imagem.');
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPhotoBase64(`data:image/jpeg;base64,${base64}`);
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        Alert.alert('Erro', 'Não foi possível processar a imagem.');
      }
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!number.trim() || isNaN(Number(number))) e.number = 'Número inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (existing) {
      updatePlayer(existing.id, name.trim(), Number(number), photoBase64);
    } else {
      createPlayer({ 
        id: generateId(), 
        team_id: teamId, 
        name: name.trim(), 
        number: Number(number),
        photo_uri: photoBase64 
      });
    }
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header title={existing ? 'Editar Jogador' : 'Novo Jogador'} showBack />
      <ScrollView className="flex-1 p-4">
        <Card>
          {/* Foto do Jogador */}
          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Foto do Jogador', 'Escolha uma opção', [
                  { text: 'Tirar Foto', onPress: takePhoto },
                  { text: 'Escolher da Galeria', onPress: pickImage },
                  { text: 'Cancelar', style: 'cancel' },
                ]);
              }}
              className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center overflow-hidden"
            >
              {photoBase64 ? (
                <Image 
                  source={{ uri: photoBase64 }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Icon name="camera-plus" size={32} color="#9ca3af" />
              )}
            </TouchableOpacity>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Toque para {photoBase64 ? 'alterar' : 'adicionar'} foto
            </Text>
            {photoBase64 && (
              <TouchableOpacity
                onPress={() => setPhotoBase64(null)}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg"
              >
                <Text className="text-xs text-red-600 dark:text-red-400 font-medium">Remover Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Nome do jogador"
            error={errors.name}
          />
          <Input
            label="Número"
            value={number}
            onChangeText={setNumber}
            placeholder="Ex: 10"
            keyboardType="number-pad"
            error={errors.number}
          />
          <Button title={existing ? 'Salvar Alterações' : 'Adicionar Jogador'} onPress={handleSave} />
        </Card>
      </ScrollView>
    </View>
  );
}
