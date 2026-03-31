import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SquadFormModal } from '@/components/ui/SquadFormModal';
import { useTeamStore } from '@/store/useTeamStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Squad } from '@/types';
import { getSportTypeIcon, getSportTypeLabel } from '@/constants/sport.constants';

type Route = RouteProp<RootStackParamList, 'TeamDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TeamDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { teamId } = route.params;
  const { teams, players, squads, loadPlayers, loadSquadsWithStats, deletePlayer, createSquad, updateSquad, deleteSquad } = useTeamStore();

  const team = teams.find((t) => t.id === teamId);

  const [showSquadModal, setShowSquadModal] = useState(false);
  const [editSquad, setEditSquad] = useState<Squad | null>(null);
  const [viewMode, setViewMode] = useState<'squads' | 'players'>('squads');
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());

  useEffect(() => { 
    loadPlayers(teamId); 
    loadSquadsWithStats(teamId);
  }, [teamId]);

  const toggleSquad = (squadId: string) => {
    setExpandedSquads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(squadId)) {
        newSet.delete(squadId);
      } else {
        newSet.add(squadId);
      }
      return newSet;
    });
  };

  // Agrupar jogadores por squad
  const playersBySquad = players.reduce((acc, player) => {
    const key = player.squad_id || 'no-squad';
    if (!acc[key]) acc[key] = [];
    acc[key].push(player);
    return acc;
  }, {} as Record<string, typeof players>);

  const handleSaveSquad = (squad: Omit<Squad, 'created_at' | 'team_name'>) => {
    if (editSquad) {
      updateSquad(squad.id, squad.name, squad.sport_type);
    } else {
      createSquad(squad);
    }
    loadSquadsWithStats(teamId);
    setEditSquad(null);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header
        title={team?.name ?? 'Time'}
        showBack
        right={
          <Button
            title={viewMode === 'squads' ? '+ Elenco' : '+ Jogador'}
            size="sm"
            onPress={() => {
              if (viewMode === 'squads') {
                setEditSquad(null);
                setShowSquadModal(true);
              } else {
                navigation.navigate('PlayerForm', { teamId });
              }
            }}
          />
        }
      />

      {/* Toggle entre Squads e Players */}
      <View className="flex-row bg-gray-100 dark:bg-gray-900 p-1 mx-4 mt-3 rounded-xl">
        <TouchableOpacity
          onPress={() => setViewMode('squads')}
          className={`flex-1 py-2 rounded-lg ${
            viewMode === 'squads' ? 'bg-white dark:bg-gray-800' : ''
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              viewMode === 'squads'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Elencos ({squads.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('players')}
          className={`flex-1 py-2 rounded-lg ${
            viewMode === 'players' ? 'bg-white dark:bg-gray-800' : ''
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              viewMode === 'players'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Jogadores ({players.length})
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'squads' ? (
        squads.length === 0 ? (
          <EmptyState
            icon="account-group"
            title="Nenhum elenco"
            description="Crie elencos para diferentes modalidades (Futsal, Society, Campo)."
          >
            <Button
              title="Criar Elenco"
              onPress={() => {
                setEditSquad(null);
                setShowSquadModal(true);
              }}
            />
          </EmptyState>
        ) : (
          <FlatList
            data={squads}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <Card>
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                    <Icon name={getSportTypeIcon(item.sport_type) as any} size={24} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {getSportTypeLabel(item.sport_type)} · {(item as any).player_count || 0} jogadores · {(item as any).match_count || 0} partidas
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditSquad(item);
                      setShowSquadModal(true);
                    }}
                    className="p-2 mr-1"
                  >
                    <Icon name="pencil-outline" size={18} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Excluir elenco?', item.name, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () => {
                            deleteSquad(item.id);
                            loadSquadsWithStats(teamId);
                          },
                        },
                      ])
                    }
                    className="p-2"
                  >
                    <Icon name="delete-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          />
        )
      ) : players.length === 0 ? (
        <EmptyState
          icon="account-plus-outline"
          title="Nenhum jogador"
          description="Adicione jogadores ao time."
        >
          <Button title="Adicionar Jogador" onPress={() => navigation.navigate('PlayerForm', { teamId })} />
        </EmptyState>
      ) : (
        <FlatList
          data={[
            ...squads.map(s => ({ type: 'squad' as const, squad: s })),
            ...(playersBySquad['no-squad']?.length > 0 ? [{ type: 'no-squad' as const }] : [])
          ]}
          keyExtractor={(item) => item.type === 'squad' ? item.squad.id : 'no-squad'}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => {
            if (item.type === 'squad') {
              const squad = item.squad;
              const squadPlayers = playersBySquad[squad.id] || [];
              const isExpanded = expandedSquads.has(squad.id);

              return (
                <View>
                  <TouchableOpacity onPress={() => toggleSquad(squad.id)}>
                    <Card className="mb-2">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                          <Icon name={getSportTypeIcon(squad.sport_type) as any} size={22} color="#6366f1" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            {getSportTypeLabel(squad.sport_type)}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {squadPlayers.length} {squadPlayers.length === 1 ? 'jogador' : 'jogadores'}
                          </Text>
                        </View>
                        <Icon 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={24} 
                          color="#6b7280" 
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>

                  {isExpanded && squadPlayers.map((player) => (
                    <Card key={player.id} className="ml-4 mb-2">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-3 overflow-hidden">
                          {player.photo_uri ? (
                            <Image source={{ uri: player.photo_uri }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{player.number}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-gray-900 dark:text-white">{player.name}</Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Camisa #{player.number}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('PlayerForm', { teamId, playerId: player.id })}
                          className="p-2 mr-1"
                        >
                          <Icon name="pencil-outline" size={16} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Excluir jogador?', player.name, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Excluir', style: 'destructive', onPress: () => deletePlayer(player.id) },
                            ])
                          }
                          className="p-2"
                        >
                          <Icon name="delete-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  ))}
                </View>
              );
            } else {
              // Jogadores sem squad
              const noSquadPlayers = playersBySquad['no-squad'];
              const isExpanded = expandedSquads.has('no-squad');

              return (
                <View>
                  <TouchableOpacity onPress={() => toggleSquad('no-squad')}>
                    <Card className="mb-2 border border-orange-200 dark:border-orange-800">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 items-center justify-center mr-3">
                          <Icon name="help-circle-outline" size={20} color="#f97316" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            Sem Elenco
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {noSquadPlayers.length} {noSquadPlayers.length === 1 ? 'jogador' : 'jogadores'}
                          </Text>
                        </View>
                        <Icon 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={24} 
                          color="#f97316" 
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>

                  {isExpanded && noSquadPlayers.map((player) => (
                    <Card key={player.id} className="ml-4 mb-2">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-3 overflow-hidden">
                          {player.photo_uri ? (
                            <Image source={{ uri: player.photo_uri }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{player.number}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-gray-900 dark:text-white">{player.name}</Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Camisa #{player.number}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('PlayerForm', { teamId, playerId: player.id })}
                          className="p-2 mr-1"
                        >
                          <Icon name="pencil-outline" size={16} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Excluir jogador?', player.name, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Excluir', style: 'destructive', onPress: () => deletePlayer(player.id) },
                            ])
                          }
                          className="p-2"
                        >
                          <Icon name="delete-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  ))}
                </View>
              );
            }
          }}
        />
      )}

      <SquadFormModal
        visible={showSquadModal}
        onClose={() => {
          setShowSquadModal(false);
          setEditSquad(null);
        }}
        onSave={handleSaveSquad}
        teamId={teamId}
        teamName={team?.name ?? ''}
        editSquad={editSquad}
      />
    </View>
  );
}
