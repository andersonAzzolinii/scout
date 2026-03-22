import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTeamStore } from '@/store/useTeamStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'TeamDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TeamDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { teamId } = route.params;
  const { teams, players, loadPlayers, deletePlayer } = useTeamStore();

  const team = teams.find((t) => t.id === teamId);

  useEffect(() => { loadPlayers(teamId); }, [teamId]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title={team?.name ?? 'Time'}
        showBack
        right={
          <Button
            title="+ Jogador"
            size="sm"
            onPress={() => navigation.navigate('PlayerForm', { teamId })}
          />
        }
      />
      {players.length === 0 ? (
        <EmptyState icon="account-plus-outline" title="Nenhum jogador" description="Adicione jogadores ao time.">
          <Button title="Adicionar Jogador" onPress={() => navigation.navigate('PlayerForm', { teamId })} />
        </EmptyState>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-3 overflow-hidden">
                  {item.photo_uri ? (
                    <Image 
                      source={{ uri: item.photo_uri }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-base font-bold text-gray-700 dark:text-gray-300">
                      {item.number}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">{item.name}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Camisa #{item.number}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PlayerForm', { teamId, playerId: item.id })}
                  className="p-2 mr-1"
                >
                  <Icon name="pencil-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert('Excluir jogador?', item.name, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => deletePlayer(item.id) },
                  ])}
                  className="p-2"
                >
                  <Icon name="delete-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
