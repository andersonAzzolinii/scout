import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useProfileStore } from '@/store/useProfileStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { EventType } from '@/types';

type Route = RouteProp<RootStackParamList, 'EventForm'>;

// Commonly used MaterialCommunityIcons for sports events
const ICON_OPTIONS = [
  'soccer', 'hand-pointing-up', 'run', 'flag', 'close-circle',
  'check-circle', 'star', 'alert', 'bullseye', 'target',
  'football', 'foul', 'whistle', 'arrow-up-bold', 'arrow-down-bold',
  'account-arrow-right', 'shield-check', 'shield-remove',
  'swap-horizontal', 'timer-outline',
];

const EVENT_TYPES: { value: EventType; label: string; desc: string }[] = [
  { value: 'count', label: 'Contador', desc: 'Simples contagem (ex: finalização)' },
  { value: 'position', label: 'Posição', desc: 'Evento com local na quadra (ex: gol)' },
  { value: 'relation', label: 'Relação', desc: 'Envolve outro jogador (ex: assistência)' },
];

export function EventFormScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { categoryId, eventId, profileId } = route.params;
  const { events, createEvent, updateEvent, deleteEvent } = useProfileStore();

  const existing = eventId ? events.find((e) => e.id === eventId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? 'soccer');
  const [eventType, setEventType] = useState<EventType>(existing?.event_type ?? 'count');
  const [isPositive, setIsPositive] = useState(existing?.is_positive ?? true);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      id: existing?.id ?? generateId(),
      category_id: categoryId,
      name: name.trim(),
      icon,
      event_type: eventType,
      is_positive: isPositive,
    };
    if (existing) {
      updateEvent(payload);
    } else {
      createEvent(payload);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Excluir evento?', `"${name}" será removido permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteEvent(existing!.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header title={existing ? 'Editar Evento' : 'Novo Evento'} showBack />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <Card className="mb-4">
          <Input
            label="Nome do evento"
            value={name}
            onChangeText={setName}
            placeholder="Ex: Gol, Finalização, Falta..."
            error={errors.name}
          />

          {/* Positive toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Evento positivo
              </Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                Verde = positivo, Vermelho = negativo
              </Text>
            </View>
            <Switch
              value={isPositive}
              onValueChange={setIsPositive}
              trackColor={{ false: '#ef4444', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Event type */}
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tipo de evento</Text>
          {EVENT_TYPES.map((et) => (
            <TouchableOpacity
              key={et.value}
              onPress={() => setEventType(et.value)}
              className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                eventType === et.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  eventType === et.value ? 'border-primary-500 bg-primary-500' : 'border-gray-400'
                }`}
              >
                {eventType === et.value && <Icon name="check" size={12} color="#fff" />}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{et.label}</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">{et.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Icon picker */}
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ícone</Text>
          <View className="flex-row flex-wrap gap-3">
            {ICON_OPTIONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                onPress={() => setIcon(ic)}
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                  icon === ic
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <Icon name={ic} size={22} color={icon === ic ? '#6366f1' : '#6b7280'} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button title={existing ? 'Salvar Alterações' : 'Criar Evento'} onPress={handleSave} />
        {existing && (
          <Button
            title="Excluir Evento"
            variant="danger"
            onPress={handleDelete}
            className="mt-3 mb-8"
          />
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
