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
  BackHandler,
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
import * as fieldRepo from '@/database/repositories/fieldRepository';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';

type Route = RouteProp<RootStackParamList, 'LiveScout'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface BenchPlayerCardProps {
  playerName: string | null;
  playerNumber: number | null;
  photoUri: string | null;
  benchStartTs?: number;
  pausedElapsed?: number;
  isTimerRunning: boolean;
  onPress: () => void;
  isSelected?: boolean;
  expanded?: boolean;
}

function BenchPlayerCard({ playerName, playerNumber, photoUri, benchStartTs, pausedElapsed, isTimerRunning, onPress, isSelected, expanded }: BenchPlayerCardProps) {
  const isOnBench = !!benchStartTs;
  
  // Se timer pausado e tem elapsed definido, usar o elapsed pausado; senão calcular normalmente
  let benchTime = 0;
  if (isOnBench) {
    if (!isTimerRunning && pausedElapsed !== undefined) {
      // Timer pausado - usar elapsed armazenado (congelado)
      benchTime = pausedElapsed;
    } else if (isTimerRunning) {
      // Timer rodando - calcular desde timestamp
      benchTime = Math.floor((Date.now() - benchStartTs!) / 1000);
    } else {
      // Timer pausado mas sem elapsed definido - manter em 0
      benchTime = 0;
    }
  }
  
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
    deleteEvent,
    undoLastEvent,
    setTimer,
    saveBenchElapsed,
    clearBenchElapsed,
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
  // elapsed seconds when timer was paused for each bench player
  const benchPausedElapsed = useRef<Record<string, number>>({});
  // wall-clock timestamps (ms) when each player entered the field
  const fieldStartTimestamps = useRef<Record<string, number>>({});
  // elapsed seconds when timer was paused for each field player
  const fieldPausedElapsed = useRef<Record<string, number>>({});
  // elapsed acumulado quando mudou de período (para manter tempo contínuo)
  const fieldPeriodChangeElapsed = useRef<Record<string, number>>({});
  // elapsed do 1º tempo para calcular duração total da partida
  const firstHalfElapsed = useRef<number>(0);
  // tick to force re-render every second while players are on bench
  const [, setTick] = useState(0);
  // tick to force re-render when field timestamps change
  const [, setFieldTick] = useState(0);
  
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

    // Restore bench timers — resume from the paused elapsed if the screen was previously left
    benchRepo.getActiveBenchPlayers(match.id).forEach((p) => {
      const pausedSec = live.benchPausedElapsed[p.player_id] ?? 0;
      benchStartTimestamps.current[p.player_id] = Date.now() - pausedSec * 1000;
    });

    // Restore field timers - usar paused_elapsed se existir, senão calcular do timestamp
    fieldRepo.getActiveFieldPlayers(match.id).forEach((p) => {
      if (p.start_timestamp) {
        // Se tem elapsed pausado, usar ele; senão calcular
        const elapsed = p.paused_elapsed_seconds !== null && p.paused_elapsed_seconds !== undefined
          ? p.paused_elapsed_seconds
          : Math.floor((Date.now() - p.start_timestamp) / 1000);
        
        
        // Ajustar ref para refletir o elapsed correto
        fieldStartTimestamps.current[p.player_id] = Date.now() - elapsed * 1000;
        
        // Se estava pausado, armazenar no ref de pause
        if (p.paused_elapsed_seconds !== null && p.paused_elapsed_seconds !== undefined) {
          fieldPausedElapsed.current[p.player_id] = p.paused_elapsed_seconds;
        }
      }
    });

    const cats = profileRepo.getCategoriesByProfile(match.profile_id);
    const evts = profileRepo.getEventsByProfile(match.profile_id);
    setCategories(cats);
    setEvents(evts);
  }, [matchId, startLiveSession]);

  // On unmount: save each active bench player's elapsed so it can be restored next visit
  useEffect(() => {
    return () => {
      const saved: Record<string, number> = {};
      Object.entries(benchStartTimestamps.current).forEach(([id, ts]) => {
        saved[id] = Math.floor((Date.now() - ts) / 1000);
      });
      if (Object.keys(saved).length > 0) saveBenchElapsed(saved);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Filtrar eventos baseado na posição do jogador selecionado
  // Se for goleiro (posição 1), mostrar apenas eventos da categoria GOLEIRO
  const filteredEvents = useMemo(() => {
    if (!live.selectedPlayerId) return events;
    
    // Encontrar a posição do jogador selecionado
    const selectedPlayerPosition = positionedPlayers.find(
      p => p.player.player_id === live.selectedPlayerId
    )?.position;
    
    // Se for posição 1 (goleiro), filtrar apenas eventos da categoria GOLEIRO
    if (selectedPlayerPosition === 1) {
      return events.filter(event => event.category_id === 'goleiro');
    }
    
    // Para outras posições, mostrar todos os eventos
    return events;
  }, [events, live.selectedPlayerId, positionedPlayers]);

  // Independent interval to keep bench timers ticking
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close events modal on hardware back button
  useEffect(() => {
    if (!showEventsModal) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowEventsModal(false);
      return true;
    });
    return () => subscription.remove();
  }, [showEventsModal]);

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

  // Auto-close events modal if period becomes 0
  useEffect(() => {
    if (showEventsModal && period === 0) {
      setShowEventsModal(false);
      setShowSwapPanel(false);
    }
  }, [period, showEventsModal]);

  // Quando a partida inicia (period: 0→1) ou retoma o 2º tempo, iniciar field periods
  // dos jogadores posicionados que ainda não têm period ativo
  useEffect(() => {
    if (period === 0 || !match) return;
    // Só inicia ao começar a rodar
    if (!isRunning) return;
    const minute = Math.floor(elapsed / 60);
    const second = elapsed % 60;
    positionedPlayers.forEach(({ player }) => {
      if (!fieldRepo.isPlayerOnField(match.id, player.player_id)) {
        // Todos os jogadores começam do zero no novo período
        fieldStartTimestamps.current[player.player_id] = Date.now();
        fieldRepo.startFieldPeriod(match.id, player.player_id, minute, second, period);
        setFieldTick(t => t + 1);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, isRunning]);

  // Quando o timer pausa/retoma, ajustar timestamps dos field players E bench players
  useEffect(() => {
    if (!match) return;
    
    
    if (!isRunning) {
      
      // FIELD: calcular elapsed e armazenar no banco
      Object.keys(fieldStartTimestamps.current).forEach((playerId) => {
        const oldTimestamp = fieldStartTimestamps.current[playerId];
        const elapsed = Math.floor((Date.now() - oldTimestamp) / 1000);
        fieldPausedElapsed.current[playerId] = elapsed;
        
        // NÃO ajustar timestamp aqui - manter o original e usar fieldPausedElapsed para display
        
        // Armazenar elapsed no banco (não modifica timestamp)
        fieldRepo.updateActiveFieldPausedElapsed(match.id, playerId, elapsed);
      });
      
      // BENCH: calcular elapsed e armazenar
      Object.keys(benchStartTimestamps.current).forEach((playerId) => {
        const oldTimestamp = benchStartTimestamps.current[playerId];
        const elapsed = Math.floor((Date.now() - oldTimestamp) / 1000);
        benchPausedElapsed.current[playerId] = elapsed;
        
        // NÃO ajustar timestamp aqui - manter o original
      });
      
      setFieldTick(t => t + 1);
      setTick(t => t + 1);
    } else {
      
      // FIELD: ajustar timestamps para continuar de onde parou
      Object.keys(fieldPausedElapsed.current).forEach((playerId) => {
        const pausedElapsed = fieldPausedElapsed.current[playerId];
        const resumedTimestamp = Date.now() - pausedElapsed * 1000;
        fieldStartTimestamps.current[playerId] = resumedTimestamp;
        
        // Limpar pause no banco
        fieldRepo.updateActiveFieldPausedElapsed(match.id, playerId, null);
      });
      
      // BENCH: ajustar timestamps para continuar de onde parou
      Object.keys(benchPausedElapsed.current).forEach((playerId) => {
        const pausedElapsed = benchPausedElapsed.current[playerId];
        const resumedTimestamp = Date.now() - pausedElapsed * 1000;
        benchStartTimestamps.current[playerId] = resumedTimestamp;
      });
      
      // Limpar o registro de pause local
      fieldPausedElapsed.current = {};
      benchPausedElapsed.current = {};
      setFieldTick(t => t + 1);
      setTick(t => t + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handlePositionPress = (position: number, screenX: number, screenY: number) => {
    // Check if position already has a player - if yes, allow changing
    const existingPlayer = positionedPlayers.find((p) => p.position === position);
    
    if (existingPlayer) {
      // Remove player from position
      setPositionedPlayers(positionedPlayers.filter((p) => p.position !== position));
      // Clear position in database
      if (match) {
        matchRepo.updateMatchPlayerPosition(match.id, existingPlayer.player.player_id, null);
        // Limpar elapsed acumulado se existir
        delete fieldPeriodChangeElapsed.current[existingPlayer.player.player_id];
      }
      return;
    }

    // If has selected player from bench, position directly
    if (selectedPlayerFromBench) {
      // Se o jogador estava no banco, finalizar o período (apenas se a partida já começou)
      if (match && period > 0) {
        const isOnBench = benchRepo.isPlayerOnBench(match.id, selectedPlayerFromBench.player_id);
        if (isOnBench) {
          const minute = Math.floor(elapsed / 60);
          const second = elapsed % 60;
          benchRepo.endBenchPeriod(match.id, selectedPlayerFromBench.player_id, minute, second);
          delete benchStartTimestamps.current[selectedPlayerFromBench.player_id];
          delete benchPausedElapsed.current[selectedPlayerFromBench.player_id];
          clearBenchElapsed(selectedPlayerFromBench.player_id);
        }
      }
      
      setPositionedPlayers([...positionedPlayers, { 
        player: selectedPlayerFromBench, 
        position 
      }]);
      // Save position to database
      if (match) {
        matchRepo.updateMatchPlayerPosition(match.id, selectedPlayerFromBench.player_id, position);
        // Iniciar período em quadra se a partida já começou
        if (period > 0) {
          const minute = Math.floor(elapsed / 60);
          const second = elapsed % 60;
          fieldRepo.startFieldPeriod(match.id, selectedPlayerFromBench.player_id, minute, second, period);
          
          // Se timer pausado, congelar; senão usar timestamp normal
          if (!isRunning) {
            const frozenTimestamp = Date.now();
            fieldStartTimestamps.current[selectedPlayerFromBench.player_id] = frozenTimestamp;
            fieldPausedElapsed.current[selectedPlayerFromBench.player_id] = 0;
            fieldRepo.updateActiveFieldPausedElapsed(match.id, selectedPlayerFromBench.player_id, 0);
            console.log(`[POSITION] Timer pausado - jogador posicionado CONGELADO em 0s`);
          } else {
            fieldStartTimestamps.current[selectedPlayerFromBench.player_id] = Date.now();
          }
          setFieldTick(t => t + 1);
        }
      }
      return;
    }

    // Open player selection popover
    if (availablePlayers.length === 0) return;
    setSelectedPositionSlot({ position, screenX, screenY });
  };

  const handlePlayerSelect = (player: typeof matchPlayers[0]) => {
    if (!selectedPositionSlot || !match) return;
    
    // Se o jogador estava no banco, finalizar o período (apenas se a partida já começou)
    if (period > 0) {
      const isOnBench = benchRepo.isPlayerOnBench(match.id, player.player_id);
      if (isOnBench) {
        const minute = Math.floor(elapsed / 60);
        const second = elapsed % 60;
        benchRepo.endBenchPeriod(match.id, player.player_id, minute, second);
        delete benchStartTimestamps.current[player.player_id];
        delete benchPausedElapsed.current[player.player_id];
        clearBenchElapsed(player.player_id);
      }
    }
    
    setPositionedPlayers([...positionedPlayers, { 
      player, 
      position: selectedPositionSlot.position
    }]);
    // Save position to database
    matchRepo.updateMatchPlayerPosition(match.id, player.player_id, selectedPositionSlot.position);
    // Iniciar período em quadra se a partida já começou
    if (period > 0) {
      const minute = Math.floor(elapsed / 60);
      const second = elapsed % 60;
      fieldRepo.startFieldPeriod(match.id, player.player_id, minute, second, period);
      
      // Se timer pausado, congelar; senão usar timestamp normal
      if (!isRunning) {
        const frozenTimestamp = Date.now();
        fieldStartTimestamps.current[player.player_id] = frozenTimestamp;
        fieldPausedElapsed.current[player.player_id] = 0;
        fieldRepo.updateActiveFieldPausedElapsed(match.id, player.player_id, 0);
        console.log(`[POSITION SELECT] Timer pausado - jogador posicionado CONGELADO em 0s`);
      } else {
        fieldStartTimestamps.current[player.player_id] = Date.now();
      }
      setFieldTick(t => t + 1);
    }
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
    // Bloquear registro de eventos antes de iniciar a partida
    if (period === 0) {
      Alert.alert(
        'Partida Não Iniciada',
        'Inicie o cronômetro para começar a registrar eventos.',
        [{ text: 'OK' }]
      );
      return;
    }

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
    benchRepo.startBenchPeriod(match.id, live.selectedPlayerId, minute, second, period);
    
    // Registrar timestamp de wall-clock
    // Se timer pausado, já congelar o timestamp e marcar elapsed como 0
    const elapsedToFreeze = 0;
    if (!isRunning) {
      const frozenTimestamp = Date.now() - elapsedToFreeze * 1000;
      benchStartTimestamps.current[live.selectedPlayerId] = frozenTimestamp;
      benchPausedElapsed.current[live.selectedPlayerId] = elapsedToFreeze;
      console.log(`[SEND TO BENCH] Timer pausado - jogador ${live.selectedPlayerId.slice(0,8)} inicia no banco CONGELADO em ${elapsedToFreeze}s`);
    } else {
      benchStartTimestamps.current[live.selectedPlayerId] = Date.now();
    }

    // Finalizar período em quadra
    fieldRepo.endFieldPeriod(match.id, live.selectedPlayerId, minute, second);
    delete fieldStartTimestamps.current[live.selectedPlayerId];
    delete fieldPeriodChangeElapsed.current[live.selectedPlayerId];
    setFieldTick(t => t + 1);
    setTick(t => t + 1);
    
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
    benchRepo.startBenchPeriod(match.id, live.selectedPlayerId, minute, second, period);
    
    // Se timer pausado, congelar timestamp do jogador que vai para o banco
    const elapsedToFreeze = 0;
    if (!isRunning) {
      // Timestamp congelado: calcula um timestamp que sempre resulta em elapsed=0
      const frozenTimestamp = Date.now() - elapsedToFreeze * 1000;
      benchStartTimestamps.current[live.selectedPlayerId] = frozenTimestamp;
      benchPausedElapsed.current[live.selectedPlayerId] = elapsedToFreeze;
    } else {
      benchStartTimestamps.current[live.selectedPlayerId] = Date.now();
    }
    
    // Finalizar período em quadra do jogador que sai
    fieldRepo.endFieldPeriod(match.id, live.selectedPlayerId, minute, second);
    delete fieldStartTimestamps.current[live.selectedPlayerId];
    delete fieldPeriodChangeElapsed.current[live.selectedPlayerId];
    setFieldTick(t => t + 1);

    // Jogador que entra: encerra timer do banco (se ativo) e ocupa a posição
    const isOnBench = benchRepo.isPlayerOnBench(match.id, incomingPlayer.player_id);
    if (isOnBench) {
      benchRepo.endBenchPeriod(match.id, incomingPlayer.player_id, minute, second);
      delete benchStartTimestamps.current[incomingPlayer.player_id];
      delete benchPausedElapsed.current[incomingPlayer.player_id];
      clearBenchElapsed(incomingPlayer.player_id);
    }
    
    // Iniciar período em quadra do jogador que entra
    fieldRepo.startFieldPeriod(match.id, incomingPlayer.player_id, minute, second, period);
    
    // Se timer pausado, congelar timestamp do jogador que entra em quadra
    const fieldElapsedToFreeze = 0;
    if (!isRunning) {
      const frozenTimestamp = Date.now() - fieldElapsedToFreeze * 1000;
      fieldStartTimestamps.current[incomingPlayer.player_id] = frozenTimestamp;
      fieldPausedElapsed.current[incomingPlayer.player_id] = fieldElapsedToFreeze;
      // Armazenar no BD também
      fieldRepo.updateActiveFieldPausedElapsed(match.id, incomingPlayer.player_id, fieldElapsedToFreeze);
      console.log(`[SWAP] Timer pausado - jogador ${incomingPlayer.player_id.slice(0,8)} entra em quadra CONGELADO em ${fieldElapsedToFreeze}s`);
    } else {
      fieldStartTimestamps.current[incomingPlayer.player_id] = Date.now();
    }
    
    setFieldTick(t => t + 1);
    setTick(t => t + 1);
    
    console.log('[SWAP] Estado final após swap:');
    console.log('  - benchStartTimestamps:', benchStartTimestamps.current);
    console.log('  - benchPausedElapsed:', benchPausedElapsed.current);
    console.log('  - fieldStartTimestamps:', fieldStartTimestamps.current);
    console.log('  - fieldPausedElapsed:', fieldPausedElapsed.current);
    console.log('  - isRunning:', isRunning);

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
    
    // Limpar elapsed acumulado se existir
    delete fieldPeriodChangeElapsed.current[live.selectedPlayerId];
    
    setShowEventsModal(false);
  };

  const handleEventPress = (scoutEvent: ScoutEvent) => {
    if (!live.selectedPlayerId || !match) {
      Alert.alert('Selecione um jogador', 'Toque em um jogador antes de registrar um evento.');
      return;
    }

    // Validação: não permitir eventos antes de iniciar
    if (period === 0) {
      Alert.alert(
        'Partida Não Iniciada',
        'Inicie o cronômetro para começar a registrar eventos.',
        [{ text: 'OK' }]
      );
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
      period,
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
    <View className="flex-1 bg-gray-950" style={{ 
      paddingTop: insets.top,
      borderWidth: !isRunning && period > 0 ? 3 : 0,
      borderColor: 'rgba(251,191,36,0.4)',
    }}>
      {/* ─── Top bar ─────────────────────────────────────────────────────────── */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8 }}>
        {/* Match Info and Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {match.team_name} vs {match.opponent_name}
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
              Jogadores: {positionedPlayers.length}/5
            </Text>
          </View>

          {/* Timer Controls */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {/* Play/Pause Timer */}
            <TouchableOpacity
              onPress={() => {
                if (period === 0) {
                  if (positionedPlayers.length === 0) {
                    Alert.alert(
                      'Posicione os Jogadores',
                      'É necessário posicionar pelo menos um jogador na quadra antes de iniciar a partida.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  toggleTimer();
                } else {
                  toggleTimer();
                }
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: period === 0 ? '#14532d' : isRunning ? '#92400e' : '#14532d',
                borderWidth: 2,
                borderColor: period === 0 ? '#22c55e' : isRunning ? '#f59e0b' : '#22c55e',
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
                minWidth: 130,
              }}
            >
              <Icon
                name={period === 0 ? 'play-circle' : isRunning ? 'pause-circle' : 'play-circle'}
                size={20}
                color={period === 0 ? '#22c55e' : isRunning ? '#f59e0b' : '#22c55e'}
              />
              <Text style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                {formatTime(elapsed)}
              </Text>
            </TouchableOpacity>

            {/* Period badge */}
            <View style={{
              backgroundColor: period === 0 ? '#374151' : period === 1 ? '#1e3a5f' : '#1a3a2a',
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
              borderWidth: 1,
              borderColor: period === 0 ? '#4b5563' : period === 1 ? '#3b82f6' : '#22c55e',
            }}>
              <Text style={{ color: period === 0 ? '#9ca3af' : period === 1 ? '#60a5fa' : '#4ade80', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>
                {period === 1 ? '1ºT' : period === 2 ? '2ºT' : 'FIM'}
              </Text>
            </View>

            {/* Half-time / Full-time button */}
            {period !== 0 && (
              <TouchableOpacity
                onPress={() => {
                  if (period === 1) {
                    // INTERVALO: encerrar períodos do 1º tempo, salvar elapsed acumulado
                    Alert.alert('Intervalo', 'Encerrar o 1º tempo?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Confirmar', 
                        onPress: () => {
                          if (!match) return;
                          const minute = Math.floor(elapsed / 60);
                          const second = elapsed % 60;
                          
                          // Encerrar períodos no banco
                          Object.keys(benchStartTimestamps.current).forEach((playerId) => {
                            benchRepo.endBenchPeriod(match.id, playerId, minute, second);
                            delete benchStartTimestamps.current[playerId];
                            delete benchPausedElapsed.current[playerId];
                          });
                          
                          // Encerrar períodos em quadra - 2º tempo começará do zero
                          Object.keys(fieldStartTimestamps.current).forEach((playerId) => {
                            console.log(`[INTERVALO] Player ${playerId.slice(0,8)} - Finalizando 1º tempo`);
                            fieldRepo.endFieldPeriod(match.id, playerId, minute, second);
                            delete fieldStartTimestamps.current[playerId];
                          });
                          
                          firstHalfElapsed.current = elapsed;
                          matchRepo.updateMatchFirstHalf(match.id, elapsed);
                          markHalfTime();
                        } 
                      },
                    ]);
                  } else {
                    // FIM DO JOGO: encerrar tudo
                    Alert.alert('Encerrar Partida', 'Confirmar o fim do jogo?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Confirmar', 
                        onPress: () => {
                          if (!match) return;
                          const minute = Math.floor(elapsed / 60);
                          const second = elapsed % 60;
                          // Encerrar períodos no banco
                          Object.keys(benchStartTimestamps.current).forEach((playerId) => {
                            benchRepo.endBenchPeriod(match.id, playerId, minute, second);
                            delete benchStartTimestamps.current[playerId];
                            delete benchPausedElapsed.current[playerId];
                          });
                          // Encerrar períodos em quadra
                          Object.keys(fieldStartTimestamps.current).forEach((playerId) => {
                            fieldRepo.endFieldPeriod(match.id, playerId, minute, second);
                            delete fieldStartTimestamps.current[playerId];
                            delete fieldPeriodChangeElapsed.current[playerId];
                          });
                          markFullTime();
                          const totalDuration = firstHalfElapsed.current + elapsed;
                          matchRepo.updateMatchTotalDuration(match.id, totalDuration);
                          matchRepo.updateMatchHalfDurations(match.id, firstHalfElapsed.current, elapsed);
                        } 
                      },
                    ]);
                  }
                }}
                style={{
                  backgroundColor: period === 1 ? '#292014' : '#2a1515',
                  borderWidth: 2,
                  borderColor: period === 1 ? '#f59e0b' : '#ef4444',
                  borderRadius: 10, paddingHorizontal: 10,
                  paddingVertical: 8,
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 4,
                }}
              >
                <Icon
                  name={period === 1 ? 'whistle-outline' : 'flag-checkered'}
                  size={20}
                  color={period === 1 ? '#f59e0b' : '#ef4444'}
                />
                <Text style={{ color: period === 1 ? '#f59e0b' : '#ef4444', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
                  {period === 1 ? 'INTERVALO' : 'FIM'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Warnings */}
        {period === 0 && (
          <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '600' }}>
            ⚠️ Posicione os jogadores antes de iniciar
          </Text>
        )}
        {selectedPlayerFromBench && (
          <Text style={{ color: '#818cf8', fontSize: 11, marginTop: 4 }}>
            #{selectedPlayerFromBench.player_number} - Toque em uma posição na quadra
          </Text>
        )}
      </View>

      {/* ─── Player Info Strip (visible when event panels are open) ─────────── */}
      {showEventsModal && live.selectedPlayerId && period > 0 && (() => {
        const sel = positionedPlayers.find(p => p.player.player_id === live.selectedPlayerId)?.player;
        if (!sel) return null;
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1f2937' }}>
            <PlayerAvatar photoUri={sel.photo_uri} playerNumber={sel.player_number ?? 0} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{sel.player_name ?? 'Sem nome'}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 11 }}>#{sel.player_number}</Text>
            </View>
            {/* Close panels */}
            <TouchableOpacity onPress={() => setShowEventsModal(false)} style={{ backgroundColor: '#1f2937', borderRadius: 8, padding: 9, borderWidth: 1, borderColor: '#374151' }}>
              <Icon name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <View className="flex-1 flex-row">

        {/* Left: Bench Players (hidden when event panels open) */}
        {availablePlayers.length > 0 && !showEventsModal && (
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
                  playerName={player.player_name ?? null}
                  playerNumber={player.player_number ?? null}
                  photoUri={player.photo_uri ?? null}
                  benchStartTs={benchStartTimestamps.current[player.player_id]}
                  pausedElapsed={benchPausedElapsed.current[player.player_id]}
                  isTimerRunning={isRunning}
                  onPress={() => {}}
                  isSelected={false}
                  expanded={true}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Left: Negative Events Panel */}
        {showEventsModal && live.selectedPlayerId && period > 0 && (
          <View style={{ width: 140, backgroundColor: '#0a0d14', borderRightWidth: 1, borderRightColor: '#1f2937' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: isRunning ? 'rgba(239,68,68,0.07)' : 'rgba(251,191,36,0.10)' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isRunning ? '#ef4444' : '#fbbf24' }} />
              <Text style={{ color: isRunning ? '#f87171' : '#fbbf24', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>Erros</Text>
              {!isRunning && (
                <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Icon name="pause" size={9} color="#fbbf24" />
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((category) => {
                const catEvents = filteredEvents.filter(e => e.category_id === category.id && !e.is_positive);
                if (catEvents.length === 0) return null;
                return (
                  <View key={category.id}>
                    <Text style={{ color: '#4b5563', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
                      {category.name}
                    </Text>
                    {catEvents.map((evt) => (
                      <TouchableOpacity
                        key={evt.id}
                        onPress={() => handleEventPress(evt)}
                        activeOpacity={0.55}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#0f172a', backgroundColor: 'rgba(239,68,68,0.04)' }}
                      >
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', flexShrink: 0 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' }} />
                        </View>
                        <Text style={{ color: '#d1d5db', fontSize: 11, lineHeight: 15, flex: 1 }} numberOfLines={2}>
                          {evt.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Center: Court */}
        <View className="flex-1 justify-center items-center">
          <FutsalCourt
            width={Math.min(
              (screenWidth - (showEventsModal && live.selectedPlayerId ? 280 : (availablePlayers.length > 0 ? 120 : 0))) * 0.96,
              (screenHeight - insets.top - 130) * (2 / 3)
            )}
            onPositionPress={handlePositionPress}
            positionedPlayers={positionedPlayers}
            onPlayerPress={handlePlayerPress}
            selectedPlayerId={live.selectedPlayerId}
            getPlayerEvents={getPlayerEvents}
            getFieldStartTs={(playerId) => {
              // Não contar tempo se a partida ainda não começou
              if (period === 0) return undefined;
              
              // Se pausado, usar o timestamp ajustado; senão usar o real
              if (!isRunning && fieldPausedElapsed.current[playerId] !== undefined) {
                return Date.now() - fieldPausedElapsed.current[playerId] * 1000;
              }
              return fieldStartTimestamps.current[playerId];
            }}
            isTimerRunning={isRunning}
          />
        </View>

        {/* Right: Positive Events Panel */}
        {showEventsModal && live.selectedPlayerId && period > 0 && (
          <View style={{ width: 140, backgroundColor: '#0a0d14', borderLeftWidth: 1, borderLeftColor: '#1f2937' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: isRunning ? 'rgba(34,197,94,0.07)' : 'rgba(251,191,36,0.10)' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isRunning ? '#22c55e' : '#fbbf24' }} />
              <Text style={{ color: isRunning ? '#4ade80' : '#fbbf24', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>Acertos</Text>
              {!isRunning && (
                <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Icon name="pause" size={9} color="#fbbf24" />
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((category) => {
                const catEvents = filteredEvents.filter(e => e.category_id === category.id && e.is_positive);
                if (catEvents.length === 0) return null;
                return (
                  <View key={category.id}>
                    <Text style={{ color: '#4b5563', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
                      {category.name}
                    </Text>
                    {catEvents.map((evt) => (
                      <TouchableOpacity
                        key={evt.id}
                        onPress={() => handleEventPress(evt)}
                        activeOpacity={0.55}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#0f172a', backgroundColor: 'rgba(34,197,94,0.04)' }}
                      >
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', flexShrink: 0 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
                        </View>
                        <Text style={{ color: '#d1d5db', fontSize: 11, lineHeight: 15, flex: 1 }} numberOfLines={2}>
                          {evt.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          </View>
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
              <View className="flex-row gap-3 items-center">
                {availablePlayers.map((player) => (
                  <BenchPlayerCard
                    key={player.player_id}
                    playerName={player.player_name ?? null}
                    playerNumber={player.player_number ?? null}
                    photoUri={player.photo_uri ?? null}
                    benchStartTs={benchStartTimestamps.current[player.player_id]}
                    pausedElapsed={benchPausedElapsed.current[player.player_id]}
                    isTimerRunning={isRunning}
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

      </View>

      {/* ─── Bottom Action Bar ─────────────────────────────────────────────────── */}
      {showEventsModal && live.selectedPlayerId && !showSwapPanel && period > 0 && (() => {
        const selId = live.selectedPlayerId;
        const selPlayer = positionedPlayers.find(p => p.player.player_id === selId)?.player;
        const benchPeriods = match && selPlayer ? benchRepo.getPlayerBenchPeriods(match.id, selPlayer.player_id) : [];
        const fieldPeriods = match && selPlayer ? fieldRepo.getPlayerFieldPeriods(match.id, selPlayer.player_id) : [];
        const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
        return (
        <View style={{ backgroundColor: '#0b1120', borderTopWidth: 1, borderTopColor: '#1f2937' }}>
          {/* Indicador de tempo pausado */}
          {!isRunning && (
            <View style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderBottomWidth: 1, borderBottomColor: '#fbbf24', paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="pause-circle" size={16} color="#fbbf24" />
              <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>CRONÔMETRO PAUSADO</Text>
            </View>
          )}
          {/* Player events list with delete */}
          {(() => {
            const playerEvts = live.events.filter(e => e.player_id === selId).slice().reverse();
            if (playerEvts.length === 0) return null;
            return (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: '#1f2937' }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Eventos:</Text>
                {playerEvts.map((evt) => (
                  <View key={evt.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: evt.is_positive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 8, paddingLeft: 9, paddingRight: 3, paddingVertical: 8, borderWidth: 1, borderColor: evt.is_positive ? '#22c55e' : '#ef4444' }}>
                    <View style={{ backgroundColor: evt.period === 2 ? '#1e3a5f' : '#1a1a2e', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                      <Text style={{ color: evt.period === 2 ? '#60a5fa' : '#a78bfa', fontSize: 9, fontWeight: '800' }}>{evt.period === 2 ? '2T' : '1T'}</Text>
                    </View>
                    <Icon name={evt.event_icon as any} size={16} color={evt.is_positive ? '#22c55e' : '#ef4444'} />
                    <Text style={{ color: '#d1d5db', fontSize: 12, maxWidth: 80 }} numberOfLines={1}>{evt.event_name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}> {String(evt.minute).padStart(2,'0')}:{String(evt.second).padStart(2,'0')}</Text>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Apagar evento', `Remover "${evt.event_name}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Apagar', style: 'destructive', onPress: () => deleteEvent(evt.id) },
                      ])}
                      style={{ padding: 5 }}
                    >
                      <Icon name="close-circle" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            );
          })()}
          {/* Field history */}
          {fieldPeriods.length > 0 && (() => {
            let totalSec = 0;
            const chips = [...fieldPeriods].sort((a, b) => a.period - b.period).map((p, idx) => {
                  const isActive = p.end_minute === null;
                  
                  // Calcular duração respeitando pausas
                  let durSec = 0;
                  if (isActive) {
                    // Período ativo
                    if (p.paused_elapsed_seconds !== null && p.paused_elapsed_seconds !== undefined) {
                      // Timer está pausado - usar elapsed armazenado no banco
                      durSec = p.paused_elapsed_seconds;
                    } else if (selPlayer && fieldStartTimestamps.current[selPlayer.player_id]) {
                      // Timer rodando - usar ref ajustado (já corrigido para excluir tempo pausado)
                      durSec = Math.floor((Date.now() - fieldStartTimestamps.current[selPlayer.player_id]) / 1000);
                    }
                  } else {
                    // Período finalizado
                    if (p.start_timestamp && p.end_timestamp) {
                      durSec = Math.floor((p.end_timestamp - p.start_timestamp) / 1000);
                    } else {
                      const endSec = p.end_minute! * 60 + p.end_second!;
                      durSec = endSec - (p.start_minute * 60 + p.start_second);
                    }
                  }
                  
                  totalSec += durSec;
                  
                  // Cores por período
                  const periodColor = p.period === 1 ? '#3b82f6' : '#22c55e';
                  const periodBg = p.period === 1 ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)';
                  
                  return (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isActive ? 'rgba(21,128,61,0.15)' : 'rgba(55,65,81,0.4)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: isActive ? '#15803d' : '#374151' }}>
                      {/* Badge do período */}
                      <View style={{ backgroundColor: periodBg, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: periodColor, fontSize: 8, fontWeight: '800', letterSpacing: 0.3 }}>
                          {p.period === 1 ? '1ºT' : '2ºT'}
                        </Text>
                      </View>
                      <Icon name="run-fast" size={11} color={isActive ? '#4ade80' : '#6b7280'} />
                      <Text style={{ color: isActive ? '#4ade80' : '#9ca3af', fontSize: 10, fontFamily: 'monospace', fontWeight: '700' }}>{fmt(durSec)}</Text>
                      {isActive && <Icon name="dots-horizontal" size={12} color="#4ade80" />}
                    </View>
                  );
                });
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 }}>
                <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 6 }}>Quadra:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, alignItems: 'center', flexDirection: 'row' }}>
                  {chips}
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(21,128,61,0.12)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: '#15803d', marginLeft: 6 }}>
                  <Icon name="sigma" size={11} color="#4ade80" />
                  <Text style={{ color: '#4ade80', fontSize: 10, fontFamily: 'monospace', fontWeight: '800' }}>{fmt(totalSec)}</Text>
                </View>
              </View>
            );
          })()}
          {/* Bench history */}
          {benchPeriods.length > 0 && (() => {
            let totalSec = 0;
            const chips = [...benchPeriods].sort((a, b) => a.period - b.period).map((p, idx) => {
                  const isActive = p.end_minute === null;
                  
                  // Calcular duração
                  let durSec = 0;
                  if (isActive) {
                    // Período ativo no banco
                    if (selPlayer && benchPausedElapsed.current[selPlayer.player_id] !== undefined) {
                      // Timer pausado - usar ref de elapsed pausado
                      durSec = benchPausedElapsed.current[selPlayer.player_id];
                    } else if (selPlayer && benchStartTimestamps.current[selPlayer.player_id]) {
                      // Timer rodando - usar ref ajustado (já corrigido para excluir tempo pausado)
                      durSec = Math.floor((Date.now() - benchStartTimestamps.current[selPlayer.player_id]) / 1000);
                    } else if (p.start_timestamp) {
                      durSec = Math.floor((Date.now() - p.start_timestamp) / 1000);
                    }
                  } else {
                    // Período finalizado
                    if (p.start_timestamp && p.end_timestamp) {
                      durSec = Math.floor((p.end_timestamp - p.start_timestamp) / 1000);
                    } else {
                      const endSec = p.end_minute! * 60 + p.end_second!;
                      durSec = endSec - (p.start_minute * 60 + p.start_second);
                    }
                  }
                  
                  totalSec += durSec;
                  
                  // Cores por período
                  const periodColor = p.period === 1 ? '#3b82f6' : '#22c55e';
                  const periodBg = p.period === 1 ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)';
                  
                  return (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isActive ? 'rgba(245,158,11,0.1)' : 'rgba(55,65,81,0.4)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: isActive ? '#f59e0b' : '#374151' }}>
                      {/* Badge do período */}
                      <View style={{ backgroundColor: periodBg, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: periodColor, fontSize: 8, fontWeight: '800', letterSpacing: 0.3 }}>
                          {p.period === 1 ? '1ºT' : '2ºT'}
                        </Text>
                      </View>
                      <Icon name="seat-outline" size={11} color={isActive ? '#fbbf24' : '#6b7280'} />
                      <Text style={{ color: isActive ? '#fbbf24' : '#9ca3af', fontSize: 10, fontFamily: 'monospace', fontWeight: '700' }}>{fmt(durSec)}</Text>
                      {isActive && <Icon name="dots-horizontal" size={12} color="#fbbf24" />}
                    </View>
                  );
                });
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 }}>
                <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 6 }}>Banco:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, alignItems: 'center', flexDirection: 'row' }}>
                  {chips}
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: '#6366f1', marginLeft: 6 }}>
                  <Icon name="sigma" size={11} color="#818cf8" />
                  <Text style={{ color: '#818cf8', fontSize: 10, fontFamily: 'monospace', fontWeight: '800' }}>{fmt(totalSec)}</Text>
                </View>
              </View>
            );
          })()}
          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: insets.bottom + 10 }}>
          <TouchableOpacity
            onPress={() => setShowSwapPanel(true)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: '#3b82f6', elevation: 4 }}
          >
            <Icon name="swap-horizontal" size={24} color="#60a5fa" />
            <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '700' }}>Trocar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRemovePlayer}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2a1515', borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: '#ef4444', elevation: 4 }}
          >
            <Icon name="account-remove-outline" size={24} color="#f87171" />
            <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '700' }}>Remover</Text>
          </TouchableOpacity>
          </View>
        </View>
        );
      })()}

      {/* ─── Swap Panel Overlay ───────────────────────────────────────────────── */}
      {showEventsModal && showSwapPanel && live.selectedPlayerId && period > 0 && (() => {
        const benchPlayers = matchPlayers.filter(
          mp => !positionedPlayers.some(pp => pp.player.player_id === mp.player_id)
            && mp.player_id !== live.selectedPlayerId
        );
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.97)', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: insets.bottom + 16, zIndex: 50, borderTopWidth: 1, borderTopColor: !isRunning ? '#fbbf24' : '#374151' }}>
            {/* Indicador de tempo pausado */}
            {!isRunning && (
              <View style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                <Icon name="pause-circle" size={14} color="#fbbf24" />
                <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '700' }}>TEMPO PAUSADO</Text>
              </View>
            )}
            <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
              Escolha quem entra
            </Text>
            {benchPlayers.length === 0 ? (
              <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 13 }}>Nenhum reserva disponível</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {benchPlayers.map(player => {
                    const benchTs = benchStartTimestamps.current[player.player_id];
                    const pausedEl = benchPausedElapsed.current[player.player_id];
                    return (
                      <BenchPlayerCard
                        key={player.player_id}
                        playerName={player.player_name ?? null}
                        playerNumber={player.player_number ?? null}
                        photoUri={player.photo_uri ?? null}
                        benchStartTs={benchTs}
                        pausedElapsed={pausedEl}
                        isTimerRunning={isRunning}
                        onPress={() => handleSwapPlayer(player)}
                      />
                    );
                  })}
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setShowSwapPanel(false)}
              style={{ marginTop: 12, alignSelf: 'stretch', backgroundColor: '#374151', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600' }}>Cancelar troca</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
    </View>
  );
}
