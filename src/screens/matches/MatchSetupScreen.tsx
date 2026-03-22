import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTeamStore } from '@/store/useTeamStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useMatchStore } from '@/store/useMatchStore';
import { generateId } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Team, ScoutProfile, MatchPlayer } from '@/types';
import * as teamRepo from '@/database/repositories/teamRepository';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MatchSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { teams, loadTeams } = useTeamStore();
  const { profiles, loadProfiles } = useProfileStore();
  const { createMatch, addMatchPlayer } = useMatchStore();

  const [team, setTeam] = useState<Team | null>(null);
  const [opponent, setOpponent] = useState('');
  const [profile, setProfile] = useState<ScoutProfile | null>(null);
  const [location, setLocation] = useState('');
  const [isHome, setIsHome] = useState(true);

  useEffect(() => { loadTeams(); loadProfiles(); }, []);

  const players = team ? teamRepo.getPlayersByTeam(team.id) : [];

  const handleCreate = () => {
    if (!team || !opponent.trim() || !profile) {
      Alert.alert('Campos obrigatórios', 'Selecione seu time, nome do adversário e perfil de scout.');
      return;
    }

    const matchId = generateId();
    createMatch({
      id: matchId,
      team_id: team.id,
      opponent_name: opponent.trim(),
      profile_id: profile.id,
      date: new Date().toISOString(),
      location: isHome ? (team.venue ?? location) : location,
      is_home: isHome,
    });

    // Add all players as non-starting (will be positioned in LiveScout)
    [...players].forEach((p) => {
      addMatchPlayer({
        id: generateId(),
        match_id: matchId,
        player_id: p.id,
        team_id: team.id,
        is_starting: false,
      });
    });

    navigation.replace('LiveScout', { matchId });
  };

  const SelectorList = ({
    items,
    selected,
    onSelect,
    label,
  }: {
    items: Array<{ id: string; name: string }>;
    selected: string | null;
    onSelect: (id: string) => void;
    label: string;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</Text>
      {items.length === 0 ? (
        <Text className="text-xs text-gray-400 dark:text-gray-500 italic">Nenhum item cadastrado.</Text>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            className={`flex-row items-center p-3 rounded-xl mb-2 border ${
              selected === item.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                selected === item.id ? 'border-primary-500 bg-primary-500' : 'border-gray-400'
              }`}
            >
              {selected === item.id && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {item.name}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Header title="Nova Partida" showBack subtitle="Configure os dados da partida" />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <Card className="mb-4">
          <SelectorList
            label="Seu Time"
            items={teams}
            selected={team?.id ?? null}
            onSelect={(id) => setTeam(teams.find((t) => t.id === id) ?? null)}
          />
          <Input
            label="Nome do Adversário"
            value={opponent}
            onChangeText={setOpponent}
            placeholder="Ex: FC Barcelona"
          />
          <SelectorList
            label="Perfil de Scout"
            items={profiles}
            selected={profile?.id ?? null}
            onSelect={(id) => setProfile(profiles.find((p) => p.id === id) ?? null)}
          />
          {/* Home / Away toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Mando de campo</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                {isHome ? `Casa${team?.venue ? ` — ${team.venue}` : ''}` : 'Fora de casa'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-400">{isHome ? '🏠 Casa' : '✈️ Fora'}</Text>
              <Switch
                value={isHome}
                onValueChange={setIsHome}
                trackColor={{ false: '#6b7280', true: '#22c55e' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Location override when away, or show venue when home */}
          {!isHome && (
            <Input
              label="Local da partida"
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Ginásio do Adversário"
            />
          )}
        </Card>

        {/* Botão de iniciar */}
        {team && profile && opponent.trim() && (
          <Button
            title="Iniciar Scout"
            onPress={handleCreate}
            className="mt-4"
          />
        )}
      </ScrollView>
    </View>
  );
}
