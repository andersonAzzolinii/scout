import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import type { Position } from '@/types';
import { generateId } from '@/utils';

interface PositionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  squadId: string;
  squadName: string;
  positions: Position[];
  onCreatePosition: (position: Omit<Position, 'created_at' | 'squad_name' | 'sport_type'>) => void;
  onUpdatePosition: (id: string, name: string, abbreviation: string) => void;
  onDeletePosition: (id: string) => void;
}

export function PositionManagerModal({
  visible,
  onClose,
  squadId,
  squadName,
  positions,
  onCreatePosition,
  onUpdatePosition,
  onDeletePosition,
}: PositionManagerModalProps) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setName('');
      setAbbreviation('');
      setEditingId(null);
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Digite um nome para a posição');
      return;
    }

    const abbr = abbreviation.trim() || name.trim().substring(0, 3).toUpperCase();

    if (editingId) {
      onUpdatePosition(editingId, name.trim(), abbr);
      setEditingId(null);
    } else {
      onCreatePosition({
        id: generateId(),
        squad_id: squadId,
        name: name.trim(),
        abbreviation: abbr,
        order_index: positions.length,
      });
    }
    setName('');
    setAbbreviation('');
  };

  const handleEdit = (pos: Position) => {
    setName(pos.name);
    setAbbreviation(pos.abbreviation);
    setEditingId(pos.id);
  };

  const handleDelete = (pos: Position) => {
    Alert.alert('Excluir posição?', `"${pos.name}" será removida e jogadores vinculados ficarão sem posição.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDeletePosition(pos.id) },
    ]);
  };

  const handleCancel = () => {
    setName('');
    setAbbreviation('');
    setEditingId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">Posições</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{squadName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-5 pb-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Goleiro, Pivô, Ala..."
                  placeholderTextColor="#9ca3af"
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm"
                />
              </View>
              <View style={{ width: 80 }}>
                <TextInput
                  value={abbreviation}
                  onChangeText={(t) => setAbbreviation(t.toUpperCase())}
                  placeholder="GOL"
                  placeholderTextColor="#9ca3af"
                  maxLength={5}
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-3 text-gray-900 dark:text-white text-sm text-center"
                />
              </View>
            </View>
            <View className="flex-row gap-2 mt-2">
              <View className="flex-1">
                <Button
                  title={editingId ? 'Salvar' : 'Adicionar'}
                  onPress={handleSave}
                  size="sm"
                />
              </View>
              {editingId && (
                <TouchableOpacity
                  onPress={handleCancel}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl items-center justify-center"
                >
                  <Text className="text-sm text-gray-600 dark:text-gray-300 font-medium">Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={positions}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
            ListEmptyComponent={
              <View className="items-center py-8">
                <Icon name="format-list-bulleted" size={40} color="#9ca3af" />
                <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">Nenhuma posição cadastrada</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item, index }) => (
              <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">{item.abbreviation || (index + 1)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{item.abbreviation}</Text>
                </View>
                <TouchableOpacity onPress={() => handleEdit(item)} className="p-2 mr-1">
                  <Icon name="pencil-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
                  <Icon name="delete-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
