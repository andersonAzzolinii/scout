import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BenchPlayerCard } from './BenchPanel';
import { groupAndSortPlayersByPosition, type PlayerWithPosition } from '@/utils/playerGrouping';

interface PlayerSelectorProps<T extends {
  player_id: string;
  player_name?: string | null;
  player_number?: number | null;
  photo_uri?: string | null;
}> {
  visible: boolean;
  targetRef: React.RefObject<View | null> | null;
  players: T[];
  onPlayerSelect: (player: T) => void;
  onClose: () => void;
  title?: string;
}

export function PlayerSelector<T extends {
  player_id: string;
  player_name?: string | null;
  player_number?: number | null;
  photo_uri?: string | null;
  position_name?: string | null;
  position_abbreviation?: string | null;
}>({
  visible,
  targetRef,
  players,
  onPlayerSelect,
  onClose,
  title = 'Selecione um jogador:'
}: PlayerSelectorProps<T>) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Agrupar jogadores por posição
  const groupedPlayers = useMemo(
    () => groupAndSortPlayersByPosition(players as PlayerWithPosition[]),
    [players]
  );
  
  // Medir a posição do elemento de referência
  useEffect(() => {
    if (visible && targetRef?.current) {
      targetRef.current.measure((fx, fy, width, height, px, py) => {
        setTargetPosition({
          x: px + width / 2, // Centro do elemento
          y: py + height / 2, // Centro do elemento
          width,
          height,
        });
      });
    }
  }, [visible, targetRef]);
  
  const { x, y } = targetPosition;
  
  const popoverWidth = screenWidth - 40;
  const popoverMaxHeight = 240;
  const arrowSize = 16;
  
  // Determinar se vai aparecer acima ou abaixo do ponto clicado
  const spaceBelow = screenHeight - y;
  const spaceAbove = y;
  const showBelow = spaceBelow > popoverMaxHeight + 40 || spaceBelow > spaceAbove;
  
  // Calcular posição horizontal (centralizado no ponto x)
  let popoverX = x - popoverWidth / 2;
  if (popoverX < 20) popoverX = 20;
  if (popoverX + popoverWidth > screenWidth - 20) {
    popoverX = screenWidth - popoverWidth - 20;
  }
  
  // Calcular posição vertical (com margem de 10px)
  const popoverY = showBelow ? y + arrowSize + 18 : y - popoverMaxHeight - arrowSize - 18;
  
  // Posição da seta (sempre aponta para x, y)
  const arrowX = Math.max(arrowSize, Math.min(x - popoverX, popoverWidth - arrowSize));
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.container,
            {
              left: popoverX,
              top: popoverY,
              width: popoverWidth,
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Sombra do triângulo para destaque */}
          <View
            style={[
              styles.arrow,
              styles.arrowShadow,
              showBelow ? styles.arrowTopShadow : styles.arrowBottomShadow,
              {
                left: arrowX - arrowSize - 2,
                [showBelow ? 'top' : 'bottom']: -arrowSize,
              }
            ]}
          />
          
          {/* Triângulo apontando para o elemento */}
          <View
            style={[
              styles.arrow,
              showBelow ? styles.arrowTop : styles.arrowBottom,
              {
                left: arrowX - arrowSize,
                [showBelow ? 'top' : 'bottom']: -arrowSize + 1,
              }
            ]}
          />
          
          {/* Conteúdo do seletor */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {groupedPlayers.map((group, groupIndex) => (
                <View key={group.positionName} style={{ marginBottom: 16 }}>
                  {/* Position header with horizontal lines */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                    paddingHorizontal: 4,
                  }}>
                    <View style={{
                      height: 1,
                      flex: 1,
                      backgroundColor: '#818cf8',
                      marginRight: 8,
                    }} />
                    <Text style={{
                      color: '#c7d2fe',
                      fontSize: 9,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>
                      {group.positionName}
                    </Text>
                    <View style={{
                      height: 1,
                      flex: 1,
                      backgroundColor: '#818cf8',
                      marginLeft: 8,
                    }} />
                  </View>

                  {/* Players in this position */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {group.players.map((player) => (
                      <BenchPlayerCard
                        key={player.player_id}
                        playerName={player.player_name ?? null}
                        playerNumber={player.player_number ?? null}
                        photoUri={player.photo_uri ?? null}
                        onPress={() => onPlayerSelect(player as T)}
                      />
                    ))}
                  </View>
                </View>
              ))}
              
              {/* Botão Cancelar - footer da lista */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.cancelButton, { marginTop: 27 }]}
              >
                <View style={styles.cancelIconContainer}>
                  <Icon name="close-circle" size={32} color="#ef4444" />
                </View>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowShadow: {
    borderLeftWidth: 18,
    borderRightWidth: 18,
  },
  arrowTop: {
    borderBottomWidth: 16,
    borderBottomColor: '#6366f1',
  },
  arrowBottom: {
    borderTopWidth: 16,
    borderTopColor: '#6366f1',
  },
  arrowTopShadow: {
    borderBottomWidth: 18,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  arrowBottomShadow: {
    borderTopWidth: 18,
    borderTopColor: 'rgba(99, 102, 241, 0.3)',
  },
  content: {
    padding: 12,
    paddingBottom: 8,
  },
  title: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    width: 85,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cancelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
