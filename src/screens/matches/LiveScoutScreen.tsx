import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FutsalCourt } from '@/components/futsal';
import { Popover } from '@/components/ui/Popover';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { useMatchStore } from '@/store/useMatchStore';
import { useMatchTimer, useBenchPanel } from '@/hooks';
import { generateId, formatTime } from '@/utils';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { ScoutCategory, ScoutEvent, MatchEvent, PlayerPosition } from '@/types';
import * as matchRepo from '@/database/repositories/matchRepository';
import * as profileRepo from '@/database/repositories/profileRepository';

type Route = RouteProp<RootStackParamList, 'LiveScout'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LiveScoutScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { matchId } = route.params;
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const {
    live,
    startLiveSession,
    endLiveSession,
    setSelectedPlayer,
    addLiveEvent,
    undoLastEvent,
    setTimer,
  } = useMatchStore();

  const [categories, setCategories] = useState<ScoutCategory[]>([]);
  const [events, setEvents] = useState<ScoutEvent[]>([]);
  const [selectedPositionSlot, setSelectedPositionSlot] = useState<{
    position: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [positionedPlayers, setPositionedPlayers] = useState<PlayerPosition[]>([]);
  const [selectedPlayerFromBench, setSelectedPlayerFromBench] = useState<typeof matchPlayers[0] | null>(null);

  // Custom hooks for timer and bench panel
  const { isRunning, elapsed, toggleTimer } = useMatchTimer();
  const {
    isExpanded: isBenchExpanded,
    heightAnim: benchHeightAnim,
    overlayOpacityAnim,
    expand: expandBench,
    collapse: collapseBench,
    panResponder,
  } = useBenchPanel();
  // Load match data
  useEffect(() => {
    const match = matchRepo.getMatchById(matchId);
    if (!match) return;
    startLiveSession(match);

    const cats = profileRepo.getCategoriesByProfile(match.profile_id);
    const evts = profileRepo.getEventsByProfile(match.profile_id);
    setCategories(cats);
    setEvents(evts);
  }, [matchId, startLiveSession]);

  const match = live.match;
  const matchPlayers = live.players;

  // Filtrar jogadores disponíveis (não posicionados)
  const availablePlayers = matchPlayers.filter(
    (mp) => !positionedPlayers.some((pp) => pp.player.player_id === mp.player_id)
  );

  const handlePositionPress = (position: number, screenX: number, screenY: number) => {
    // Check if position already has a player - if yes, allow changing
    const existingPlayer = positionedPlayers.find((p) => p.position === position);
    
    if (existingPlayer) {
      // Remove player from position
      setPositionedPlayers(positionedPlayers.filter((p) => p.position !== position));
      return;
    }

    // If has selected player from bench, position directly
    if (selectedPlayerFromBench) {
      setPositionedPlayers([...positionedPlayers, { 
        player: selectedPlayerFromBench, 
        position 
      }]);
      setSelectedPlayerFromBench(null);
      return;
    }

    // Open player selection popover
    setSelectedPositionSlot({ position, screenX, screenY });
  };

  const handlePlayerSelect = (player: typeof matchPlayers[0]) => {
    if (!selectedPositionSlot) return;
    
    setPositionedPlayers([...positionedPlayers, { 
      player, 
      position: selectedPositionSlot.position
    }]);
    setSelectedPositionSlot(null);
  };

  const handleBenchPlayerClick = (player: typeof matchPlayers[0]) => {
    if (positionedPlayers.length >= 5) return;
    setSelectedPlayerFromBench(player);
  };

  const handleEventPress = (scoutEvent: ScoutEvent) => {
    if (!live.selectedPlayerId || !match) {
      Alert.alert('Selecione um jogador', 'Toque em um jogador antes de registrar um evento.');
      return;
    }

    const minute = Math.floor(elapsed / 60);
    const second = elapsed % 60;

    const newEvent: MatchEvent = {
      id: generateId(),
      match_id: match.id,
      team_id: match.team_id,
      player_id: live.selectedPlayerId,
      event_id: scoutEvent.id,
      minute,
      second,
      x: null,
      y: null,
      created_at: new Date().toISOString(),
      event_name: scoutEvent.name,
      event_icon: scoutEvent.icon,
      event_type: scoutEvent.event_type,
      is_positive: scoutEvent.is_positive,
    };

    addLiveEvent(newEvent);
  };

  if (!match) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <Text className="text-white">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-950" style={{ paddingTop: insets.top }}>
      {/* ─── Top bar ─────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-3 py-1.5 border-b border-gray-800">
        {/* <TouchableOpacity
          onPress={() => {
            Alert.alert('Sair do Scout?', 'O progresso não será perdido.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sair',
                onPress: () => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  navigation.goBack();
                },
              },
            ]);
          }}
          className="mr-2"
        >
          <Icon name="close" size={20} color="#9ca3af" />
        </TouchableOpacity> */}

        <View className="flex-1">
          <Text className="text-white font-bold text-xs" numberOfLines={1}>
            {match.team_name} vs {match.opponent_name}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            Jogadores: {positionedPlayers.length}/5
          </Text>
          {selectedPlayerFromBench && (
            <Text className="text-primary-400 text-xs">
              #{selectedPlayerFromBench.player_number} - Toque em uma posição na quadra
            </Text>
          )}
        </View>

        {/* Timer */}
        <TouchableOpacity
          onPress={toggleTimer}
          className="flex-row items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-lg mr-2"
        >
          <Icon name={isRunning ? 'pause' : 'play'} size={12} color={isRunning ? '#f59e0b' : '#22c55e'} />
          <Text className="text-white font-mono text-xs font-bold">{formatTime(elapsed)}</Text>
        </TouchableOpacity>

        {/* Undo */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Desfazer', 'Remover o último evento?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: undoLastEvent },
            ]);
          }}
          className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
        >
          <Icon name="undo" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <View className="flex-1">
        
        {/* Overlay */}
        {isBenchExpanded && (
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            onPress={collapseBench}
          >
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: '#000',
                opacity: overlayOpacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.7],
                }),
              }}
            />
          </Pressable>
        )}
        
        {/* Court */}
        <View className="flex-1 justify-center items-center">
          <FutsalCourt
            width={Math.min(screenWidth * 0.85, (screenHeight - insets.top - 150) * (2/3))}
            onPositionPress={handlePositionPress}
            positionedPlayers={positionedPlayers}
          />
        </View>

        {/* Banco de Reservas */}
        {availablePlayers.length > 0 && (
          <Animated.View 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              backgroundColor: '#111827',
              borderTopWidth: 1,
              borderTopColor: '#1f2937',
              height: benchHeightAnim,
            }}
            {...panResponder.panHandlers}
          >
            {/* Drag Handle */}
            <TouchableOpacity
              onPress={() => isBenchExpanded ? collapseBench() : expandBench()}
              className="items-center py-2"
              activeOpacity={0.7}
            >
              <View className="w-12 h-1 bg-gray-600 rounded-full" />
            </TouchableOpacity>

            <View className="px-3 pb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400 text-xs">
                  Banco de Reservas ({availablePlayers.length})
                  {selectedPlayerFromBench && (
                    <Text className="text-primary-500"> • Toque na quadra para posicionar</Text>
                  )}
                </Text>
                {selectedPlayerFromBench && (
                  <TouchableOpacity
                    onPress={() => setSelectedPlayerFromBench(null)}
                    className="bg-gray-700 px-3 py-1 rounded"
                  >
                    <Text className="text-gray-300 text-xs">Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView 
                horizontal={!isBenchExpanded}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: isBenchExpanded ? 150 : 0 }}
              >
                <View className={isBenchExpanded ? "flex-row flex-wrap gap-3" : "flex-row gap-3"}>
                  {availablePlayers.map((player) => (
                    <TouchableOpacity
                      key={player.player_id}
                      onPress={() => handleBenchPlayerClick(player)}
                      className={`rounded-lg p-2 items-center bg-gray-700/50 ${
                        isBenchExpanded ? 'w-[100px]' : 'min-w-[95px]'
                      } ${
                        selectedPlayerFromBench?.player_id === player.player_id
                          ? 'border-2 border-primary-500'
                          : 'border-2 border-transparent'
                      }`}
                    >
                      <PlayerAvatar 
                        photoUri={player.photo_uri}
                        playerNumber={player.player_number ?? 0}
                        size={72}
                      />
                      <Text className="text-white text-sm mt-2 font-medium" numberOfLines={1}>
                        {(player.player_name ?? 'Sem nome').split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Player Selection Popover */}
        {selectedPositionSlot && availablePlayers.length > 0 && !selectedPlayerFromBench && (
          <Popover
            visible={true}
            x={selectedPositionSlot.screenX}
            y={selectedPositionSlot.screenY}
            onClose={() => setSelectedPositionSlot(null)}
          >
            <Text className="text-gray-400 text-xs mb-2 px-3 pt-2">Selecione um jogador:</Text>
            <ScrollView 
              horizontal
              className="px-3 pb-2"
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-3">
                {availablePlayers.map((player) => (
                  <TouchableOpacity
                    key={player.player_id}
                    onPress={() => handlePlayerSelect(player)}
                    className="bg-gray-700/50 rounded-lg p-2 items-center justify-center min-w-[100px]"
                  >
                    <PlayerAvatar 
                      photoUri={player.photo_uri}
                      playerNumber={player.player_number ?? 0}
                      size={72}
                    />
                    <Text className="text-white text-sm mt-2 font-medium" numberOfLines={1}>
                      {(player.player_name ?? 'Sem nome').split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setSelectedPositionSlot(null)}
                  className="bg-gray-700 rounded-lg px-5 py-5 items-center justify-center min-w-[100px]"
                >
                  <Text className="text-gray-300 text-sm">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Popover>
        )}
      </View>
    </View>
  );
}
