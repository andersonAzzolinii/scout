import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { SportTypeSelector } from '@/components/ui/SportTypeSelector';
import type { SportType, Squad } from '@/types';
import { generateId } from '@/utils';
import { getSportTypeIcon, getSportTypeLabel } from '@/constants/sport.constants';

interface SquadFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (squad: Omit<Squad, 'created_at' | 'team_name'>) => void;
  teamId: string;
  teamName: string;
  editSquad?: Squad | null;
}

export function SquadFormModal({ visible, onClose, onSave, teamId, teamName, editSquad }: SquadFormModalProps) {
  const [name, setName] = useState(editSquad?.name ?? '');
  const [sportType, setSportType] = useState<SportType>(editSquad?.sport_type ?? 'futsal');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Digite um nome para o elenco');
      return;
    }

    if (editSquad) {
      onSave({ ...editSquad, name: name.trim(), sport_type: sportType });
    } else {
      onSave({
        id: generateId(),
        team_id: teamId,
        sport_type: sportType,
        name: name.trim(),
      });
    }

    setName('');
    setSportType('futsal');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setSportType('futsal');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          className="w-full"
        >
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-auto">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                <Icon name="account-group" size={20} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {editSquad ? 'Editar Elenco' : 'Novo Elenco'}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">{teamName}</Text>
              </View>
            </View>

            <TextInput
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base mb-4"
              placeholder="Nome do elenco (ex: Sub-20 Futsal)"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <SportTypeSelector selected={sportType} onSelect={setSportType} showAll={false} />

            <View className="flex-row gap-3 mt-2">
              <Button title="Cancelar" variant="ghost" onPress={handleClose} className="flex-1" />
              <Button title="Salvar" onPress={handleSave} className="flex-1" />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
