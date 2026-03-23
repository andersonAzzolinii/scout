import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import * as benchRepo from '@/database/repositories/benchRepository';

type Route = RouteProp<RootStackParamList, 'LiveScout'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface BenchPlayerCardProps {
  playerName: string | null;
  playerNumber: number | null;
  photoUri: string | null;
  benchStartTs?: number;
  onPress: () => void;
  isSelected?: boolean;
  expanded?: boolean;
}

function BenchPlayerCard({ playerName, playerNumber, photoUri, benchStartTs, onPress, isSelected, expanded }: BenchPlayerCardProps) {
  const isOnBench = !!benchStartTs;
  const benchTime = isOnBench ? Math.floor((Date.now() - benchStartTs!) / 1000) : 0;
  const minutes = Math.floor(benchTime / 60);
  const seconds = benchTime % 60;

  return (
    <View className="items-center">
      <TouchableOpacity
        onPress={onPress}
        style={{
          borderRadius: 10,
          padding: 8,
          alignItems: 'center',
          backgroundColor: 'rgba(55,65,81,0.5)',
          width: expanded ? 100 : 110,
          borderWidth: 2,
          borderColor: isSelected ? '#818cf8' : 'transparent',
        }}
      >
        <PlayerAvatar
          photoUri={photoUri}
          playerNumber={playerNumber ?? 0}
          size={64}
        />
        <Text className="text-white text-xs mt-1 font-medium" numberOfLines={1}>
          {(playerName ?? 'Sem nome').split(' ')[0]}
        </Text>
        <View style={{ marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: isOnBench ? '#d97706' : 'transparent', minWidth: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: isOnBench ? '#ffffff' : 'transparent' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

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
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showSwapPanel, setShowSwapPanel] = useState(false);
  // wall-clock timestamps (ms) when each player entered the bench
  const benchStartTimestamps = useRef<Record<string, number>>({});
  // tick to force re-render every second while players are on bench
  const [, setTick] = useState(0);
  
  // Animation for events modal
  const modalScaleAnim = React.useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = React.useRef(new Animated.Value(0)).current;

  // Custom hooks for timer and bench panel
  const { isRunning, elapsed, period, toggleTimer, markHalfTime, markFullTime } = useMatchTimer();
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

  // Load positioned players from database
  useEffect(() => {
    if (!match) return;
    
    const players = matchRepo.getMatchPlayers(matchId);
    const positioned = players
      .filter(p => p.tactical_position != null)
      .map(p => ({
        player: p,
        position: p.tactical_position!
      }));
    
    setPositionedPlayers(positioned);
  }, [matchId, match]);

  // Filtrar jogadores disponíveis (não posicionados)
  const availablePlayers = useMemo(
    () => matchPlayers.filter(
      (mp) => !positionedPlayers.some((pp) => pp.player.player_id === mp.player_id)
    ),
    [matchPlayers, positionedPlayers]
  );

  // Independent interval to keep bench timers ticking
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Animate events modal
  useEffect(() => {
    if (showEventsModal) {
      Animated.parallel([
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    }
  }, [showEventsModal]);

  const handlePositionPress = (position: number, screenX: number, screenY: number) => {
    // Check if position already has a player - if yes, allow changing
    const existingPlayer = positionedPlayers.find((p) => p.position === position);
    
    if (existingPlayer) {
      // Remove player from position
      setPositionedPlayers(positionedPlayers.filter((p) => p.position !== position));
      // Clear position in database
      if (match) {
        matchRepo.updateMatchPlayerPosition(match.id, existingPlayer.player.player_id, null);
      }
      return;
    }

    // If has selected player from bench, position directly
    if (selectedPlayerFromBench) {
      // Se o jogador estava no banco, finalizar o período
      if (match) {
        const isOnBench = benchRepo.isPlayerOnBench(match.id, selectedPlayerFromBench.player_id);
        if (isOnBench) {
          const minute = Math.floor(elapsed / 60);
          const second = elapsed % 60;
          benchRepo.endBenchPeriod(match.id, selectedPlayerFromBench.player_id, minute, second);
          delete benchStartTimestamps.current[selectedPlayerFromBench.player_id];
        }
      }
      
      setPositionedPlayers([...positionedPlayers, { 
        player: selectedPlayerFromBench, 
        position 
      }]);
      // Save position to database
      if (match) {
        matchRepo.updateMatchPlayerPosition(match.id, selectedPlayerFromBench.player_id, position);
      }
      setSelectedPlayerFromBench(null);
      return;
    }

    // Open player selection popover
    if (availablePlayers.length === 0) return;
    setSelectedPositionSlot({ position, screenX, screenY });
  };

  const handlePlayerSelect = (player: typeof matchPlayers[0]) => {
    if (!selectedPositionSlot || !match) return;
    
    // Se o jogador estava no banco, finalizar o período
    const isOnBench = benchRepo.isPlayerOnBench(match.id, player.player_id);
    if (isOnBench) {
      const minute = Math.floor(elapsed / 60);
      const second = elapsed % 60;
      benchRepo.endBenchPeriod(match.id, player.player_id, minute, second);
      delete benchStartTimestamps.current[player.player_id];
    }
    
    setPositionedPlayers([...positionedPlayers, { 
      player, 
      position: selectedPositionSlot.position
    }]);
    // Save position to database
    matchRepo.updateMatchPlayerPosition(match.id, player.player_id, selectedPositionSlot.position);
    setSelectedPositionSlot(null);
  };

  const handleBenchPlayerClick = (player: typeof matchPlayers[0]) => {
    if (positionedPlayers.length >= 5) return;
    
    // Se selecionar novamente o mesmo jogador, cancelar seleção
    if (selectedPlayerFromBench?.player_id === player.player_id) {
      setSelectedPlayerFromBench(null);
      return;
    }
    
    setSelectedPlayerFromBench(player);
  };

  const handlePlayerPress = (player:typeof matchPlayers[0]) => {
    setSelectedPlayer(player.player_id, player.team_id);
    setShowSwapPanel(false);
    setShowEventsModal(true);
  };

  const getPlayerEvents = (playerId: string) => {
    return live.events.filter(e => e.player_id === playerId);
  };

  const handleSendToBench = () => {
    if (!live.selectedPlayerId || !match) return;
    
    const minute = Math.floor(elapsed / 60);
    const second = elapsed % 60;
    
    // Remove jogador da posição
    const updatedPositions = positionedPlayers.filter(
      p => p.player.player_id !== live.selectedPlayerId
    );
    setPositionedPlayers(updatedPositions);
    
    // Limpar posição no banco
    matchRepo.updateMatchPlayerPosition(match.id, live.selectedPlayerId, null);
    
    // Iniciar período no banco
    benchRepo.startBenchPeriod(match.id, live.selectedPlayerId, minute, second);
    // Registrar timestamp de wall-clock
    benchStartTimestamps.current[live.selectedPlayerId] = Date.now();
    
    setShowEventsModal(false);
  };

  const handleSwapPlayer = (incomingPlayer: typeof matchPlayers[0]) => {
    if (!live.selectedPlayerId || !match) return;

    const minute = Math.floor(elapsed / 60);
    const second = elapsed % 60;

    // Jogador que sai: remove da posição e inicia timer no banco
    const outgoing = positionedPlayers.find(p => p.player.player_id === live.selectedPlayerId);
    const outgoingPosition = outgoing?.position ?? null;

    const updatedPositions = positionedPlayers.filter(
      p => p.player.player_id !== live.selectedPlayerId
    );
    matchRepo.updateMatchPlayerPosition(match.id, live.selectedPlayerId, null);
    benchRepo.startBenchPeriod(match.id, live.selectedPlayerId, minute, second);
    benchStartTimestamps.current[live.selectedPlayerId] = Date.now();

    // Jogador que entra: encerra timer do banco (se ativo) e ocupa a posição
    const isOnBench = benchRepo.isPlayerOnBench(match.id, incomingPlayer.player_id);
    if (isOnBench) {
      benchRepo.endBenchPeriod(match.id, incomingPlayer.player_id, minute, second);
      delete benchStartTimestamps.current[incomingPlayer.player_id];
    }

    const newPositions = outgoingPosition != null
      ? [...updatedPositions, { player: incomingPlayer, position: outgoingPosition }]
      : updatedPositions;

    setPositionedPlayers(newPositions);
    if (outgoingPosition != null) {
      matchRepo.updateMatchPlayerPosition(match.id, incomingPlayer.player_id, outgoingPosition);
    }

    setShowSwapPanel(false);
    setShowEventsModal(false);
  };

  const handleRemovePlayer = () => {
    if (!live.selectedPlayerId || !match) return;
    
    // Remove jogador da posição (sem iniciar contador)
    const updatedPositions = positionedPlayers.filter(
      p => p.player.player_id !== live.selectedPlayerId
    );
    setPositionedPlayers(updatedPositions);
    
    // Limpar posição no banco
    matchRepo.updateMatchPlayerPosition(match.id, live.selectedPlayerId, null);
    
    setShowEventsModal(false);
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
    setShowEventsModal(false);
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
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
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
        <View className="flex-1 items-center justify-center flex-row gap-2">
          <TouchableOpacity
            onPress={period === 0 ? undefined : toggleTimer}
            disabled={period === 0}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: period === 0 ? '#1f2937' : isRunning ? '#92400e' : '#14532d',
              borderWidth: 2,
              borderColor: period === 0 ? '#374151' : isRunning ? '#f59e0b' : '#22c55e',
              borderRadius: 14, paddingHorizontal: 18,
              height: 48,
            }}
          >
            <Icon
              name={period === 0 ? 'flag-checkered' : isRunning ? 'pause-circle' : 'play-circle'}
              size={22}
              color={period === 0 ? '#6b7280' : isRunning ? '#f59e0b' : '#22c55e'}
            />
            <Text style={{ color: period === 0 ? '#6b7280' : '#ffffff', fontFamily: 'monospace', fontSize: 18, fontWeight: '800', letterSpacing: 1 }}>
              {formatTime(elapsed)}
            </Text>
          </TouchableOpacity>

          {/* Period badge */}
          <View style={{
            backgroundColor: period === 0 ? '#374151' : period === 1 ? '#1e3a5f' : '#1a3a2a',
            borderRadius: 8, paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: period === 0 ? '#4b5563' : period === 1 ? '#3b82f6' : '#22c55e',
            height: 48, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: period === 0 ? '#9ca3af' : period === 1 ? '#60a5fa' : '#4ade80', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>
              {period === 1 ? '1ºT' : period === 2 ? '2ºT' : 'FIM'}
            </Text>
          </View>

          {/* Half-time / Full-time button */}
          {period !== 0 && (
            <TouchableOpacity
              onPress={() => {
                const stopAllBenchTimers = () => {
                  if (!match) return;
                  const minute = Math.floor(elapsed / 60);
                  const second = elapsed % 60;
                  Object.keys(benchStartTimestamps.current).forEach((playerId) => {
                    benchRepo.endBenchPeriod(match.id, playerId, minute, second);
                    delete benchStartTimestamps.current[playerId];
                  });
                };
                if (period === 1) {
                  Alert.alert('Intervalo', 'Encerrar o 1º tempo?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => { stopAllBenchTimers(); markHalfTime(); } },
                  ]);
                } else {
                  Alert.alert('Encerrar Partida', 'Confirmar o fim do jogo?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => { stopAllBenchTimers(); markFullTime(); } },
                  ]);
                }
              }}
              style={{
                backgroundColor: period === 1 ? '#292014' : '#2a1515',
                borderWidth: 2,
                borderColor: period === 1 ? '#f59e0b' : '#ef4444',
                borderRadius: 12, paddingHorizontal: 14,
                alignItems: 'center', justifyContent: 'center', gap: 3,
                height: 48,
              }}
            >
              <Icon
                name={period === 1 ? 'whistle-outline' : 'flag-checkered'}
                size={26}
                color={period === 1 ? '#f59e0b' : '#ef4444'}
              />
              <Text style={{ color: period === 1 ? '#f59e0b' : '#ef4444', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }}>
                {period === 1 ? 'INTERVALO' : 'FIM'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Undo */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Desfazer', 'Remover o último evento?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: undoLastEvent },
            ]);
          }}
          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151' }}
        >
          <Icon name="undo" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <View className="flex-1 flex-row">

        {/* Left: Bench Players */}
        {availablePlayers.length > 0 && (
          <View style={{ width: 112, borderRightWidth: 1, borderRightColor: '#1f2937', backgroundColor: '#0b1120' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 }}>
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                RESERVAS
              </Text>
              {(() => {
                const playersOnBench = availablePlayers.filter(p =>
                  match && benchRepo.isPlayerOnBench(match.id, p.player_id)
                ).length;
                return playersOnBench > 0 ? (
                  <View style={{ backgroundColor: '#d97706', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{playersOnBench} fora</Text>
                  </View>
                ) : null;
              })()}
            </View>
            {selectedPlayerFromBench && (
              <View style={{ paddingHorizontal: 6, paddingBottom: 4 }}>
                <Text style={{ color: '#818cf8', fontSize: 9 }}>Toque na quadra para posicionar</Text>
                <TouchableOpacity
                  onPress={() => setSelectedPlayerFromBench(null)}
                  style={{ marginTop: 2, backgroundColor: '#374151', borderRadius: 4, paddingVertical: 2, alignItems: 'center' }}
                >
                  <Text style={{ color: '#d1d5db', fontSize: 9 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 6, gap: 6 }}>
              {availablePlayers.map((player) => (
                <BenchPlayerCard
                  key={player.player_id}
                  playerName={player.player_name}
                  playerNumber={player.player_number}
                  photoUri={player.photo_uri}
                  benchStartTs={benchStartTimestamps.current[player.player_id]}
                  onPress={() => handleBenchPlayerClick(player)}
                  isSelected={selectedPlayerFromBench?.player_id === player.player_id}
                  expanded={true}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Right: Court */}
        <View className="flex-1 justify-center items-center">
          <FutsalCourt
            width={Math.min(
              (screenWidth - (availablePlayers.length > 0 ? 120 : 0)) * 0.92,
              (screenHeight - insets.top - 80) * (2 / 3)
            )}
            onPositionPress={handlePositionPress}
            positionedPlayers={positionedPlayers}
            onPlayerPress={handlePlayerPress}
            selectedPlayerId={live.selectedPlayerId}
            getPlayerEvents={getPlayerEvents}
          />
        </View>

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
              <View className="flex-row gap-3 items-center">
                {availablePlayers.map((player) => (
                  <BenchPlayerCard
                    key={player.player_id}
                    playerName={player.player_name}
                    playerNumber={player.player_number}
                    photoUri={player.photo_uri}
                    benchStartTs={benchStartTimestamps.current[player.player_id]}
                    onPress={() => handlePlayerSelect(player)}
                  />
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

        {/* Events Modal */}
        {showEventsModal && live.selectedPlayerId && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100,
            }}
          >
            <Pressable 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => setShowEventsModal(false)}
            />

            {/* Bench History (absolute top-left) */}
            {(() => {
              const selId = live.selectedPlayerId;
              if (!match || !selId) return null;
              const periods = benchRepo.getPlayerBenchPeriods(match.id, selId);
              if (periods.length === 0) return null;
              const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
              return (
                <View
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 110,
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderRadius: 10,
                    padding: 10,
                    minWidth: 160,
                    borderWidth: 1,
                    borderColor: '#374151',
                  }}
                >
                  <Text style={{ color: '#9ca3af', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    Histórico no Banco
                  </Text>
                  {periods.map((period, idx) => {
                    const durationSec = period.start_timestamp
                      ? period.end_timestamp
                        ? Math.floor((period.end_timestamp - period.start_timestamp) / 1000)
                        : Math.floor((Date.now() - period.start_timestamp) / 1000)
                      : period.end_minute !== null && period.end_second !== null
                        ? (period.end_minute * 60 + period.end_second) - (period.start_minute * 60 + period.start_second)
                        : null;
                    return (
                      <View key={idx} style={{ marginBottom: idx < periods.length - 1 ? 6 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Icon name="arrow-down-circle-outline" size={13} color="#f59e0b" />
                          <Text style={{ color: '#d1d5db', fontSize: 12 }}>Saiu {fmt(period.start_minute * 60 + period.start_second)}</Text>
                        </View>
                        {period.end_minute !== null ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Icon name="arrow-up-circle-outline" size={13} color="#22c55e" />
                            <Text style={{ color: '#d1d5db', fontSize: 12 }}>Voltou {fmt(period.end_minute * 60 + period.end_second!)}</Text>
                          </View>
                        ) : null}
                        {durationSec !== null && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Icon name="timer-outline" size={13} color={period.end_minute !== null ? '#6b7280' : '#f59e0b'} />
                            <Text style={{ color: period.end_minute !== null ? '#9ca3af' : '#fbbf24', fontSize: 12, fontFamily: 'monospace', fontWeight: '700' }}>
                              {fmt(durationSec)} fora
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })()}

            {/* Player Avatar (Center) */}
            <Animated.View
              style={{
                transform: [{ scale: modalScaleAnim }],
                opacity: modalOpacityAnim,
                alignItems: 'center',
              }}
            >
              {(() => {
                const selectedPlayer = positionedPlayers.find(
                  p => p.player.player_id === live.selectedPlayerId
                )?.player;
                
                if (!selectedPlayer) return null;
                
                const playerEvents = live.events
                  .filter(e => e.player_id === selectedPlayer.player_id)
                  .slice(-5)
                  .reverse();
                
                return (
                  <View className="items-center mb-8">
                    <View style={{ position: 'relative' }}>
                      <View 
                        style={{
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 20,
                          elevation: 20,
                        }}
                      >
                        <PlayerAvatar 
                          photoUri={selectedPlayer.photo_uri}
                          playerNumber={selectedPlayer.player_number ?? 0}
                          size={230}
                        />
                      </View>
                    </View>
                    <Text className="text-white text-3xl font-bold mt-4">
                      {selectedPlayer.player_name ?? 'Sem nome'}
                    </Text>
                    <Text className="text-gray-400 text-base">
                      #{selectedPlayer.player_number}
                    </Text>
                    {/* Swap button */}
                    <TouchableOpacity
                      onPress={() => setShowSwapPanel(true)}
                      style={{
                        marginTop: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: '#ffffff',
                        borderRadius: 99,
                        paddingHorizontal: 28,
                        paddingVertical: 14,
                        elevation: 4,
                      }}
                    >
                      <Icon name="swap-horizontal" size={26} color="#1f2937" />
                      <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 20 }}>Trocar jogador</Text>
                    </TouchableOpacity>

                    {/* Swap Panel */}
                    {showSwapPanel && (() => {
                      const benchPlayers = matchPlayers.filter(
                        mp => !positionedPlayers.some(pp => pp.player.player_id === mp.player_id)
                          && mp.player_id !== live.selectedPlayerId
                      );
                      return (
                        <View style={{ marginTop: 12, backgroundColor: 'rgba(17,24,39,0.95)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#374151', width: screenWidth * 0.9 }}>
                          <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
                            Escolha quem entra
                          </Text>
                          {benchPlayers.length === 0 ? (
                            <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 13 }}>Nenhum reserva disponível</Text>
                          ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                {benchPlayers.map(player => (
                                  <BenchPlayerCard
                                    key={player.player_id}
                                    playerName={player.player_name}
                                    playerNumber={player.player_number}
                                    photoUri={player.photo_uri}
                                    benchStartTs={benchStartTimestamps.current[player.player_id]}
                                    onPress={() => handleSwapPlayer(player)}
                                  />
                                ))}
                              </View>
                            </ScrollView>
                          )}
                          <TouchableOpacity onPress={() => setShowSwapPanel(false)} style={{ marginTop: 12, alignSelf: 'stretch', backgroundColor: '#374151', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                            <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600' }}>Cancelar troca</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                    
                    {/* Recent Events */}}
                    {playerEvents.length > 0 && (
                      <View className="mt-4 w-full px-4">
                        <Text className="text-gray-400 text-sm uppercase tracking-wide mb-2 text-center">
                          Últimos Eventos ({playerEvents.length})
                        </Text>
                        <View className="flex-row flex-wrap justify-center gap-2">
                          {playerEvents.map((event, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: event.is_positive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderWidth: 1,
                                borderColor: event.is_positive ? '#22C55E' : '#EF4444',
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Icon name={event.event_icon as any} size={14} color={event.is_positive ? '#22C55E' : '#EF4444'} />
                              <Text className="text-white text-xs">
                                {event.event_name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Events Grid */}
              <View style={{ width: screenWidth * 0.9, alignSelf: 'center' }}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: screenHeight * 0.5 }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {categories.map((category) => {
                    const categoryEvents = events.filter(e => e.category_id === category.id);
                    if (categoryEvents.length === 0) return null;
                    
                    return (
                      <View key={category.id} className="mb-6">
                        <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider text-center">
                          {category.name}
                        </Text>
                        <View className="flex-row flex-wrap justify-center gap-3">
                          {[...categoryEvents].sort((a, b) => (b.is_positive ? 1 : 0) - (a.is_positive ? 1 : 0)).map((event) => (
                            <TouchableOpacity
                              key={event.id}
                              onPress={() => handleEventPress(event)}
                              style={{
                                width: 90,
                                height: 90,
                                backgroundColor: event.is_positive ? '#16a34a' : '#dc2626',
                                borderRadius: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                              }}
                            >
                              <Icon 
                                name={event.icon as any} 
                                size={32} 
                                color="#ffffff" 
                              />
                              <Text 
                                className="text-white text-sm font-medium mt-2 text-center"
                                numberOfLines={2}
                                style={{ lineHeight: 16 }}
                              >
                                {event.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-4">
                  <TouchableOpacity
                    onPress={handleSendToBench}
                    className="flex-1 bg-amber-600 rounded-lg"
                    style={{
                      paddingVertical: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Icon name="seat-outline" size={22} color="#ffffff" />
                      <Text className="text-white text-xl text-center font-medium">
                        Enviar para Reserva
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRemovePlayer}
                    className="bg-red-600 rounded-lg"
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 40,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Icon name="close-circle-outline" size={32} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setShowEventsModal(false)}
                  className="bg-gray-700 rounded-full py-3 mt-3"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text className="text-white text-base text-center font-medium">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}
