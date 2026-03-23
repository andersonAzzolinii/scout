import React from 'react';
import { View, Modal, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';

interface PopoverProps {
  visible: boolean;
  x: number; // Screen coordinate
  y: number; // Screen coordinate
  onClose: () => void;
  children: React.ReactNode;
}

export function Popover({ visible, x, y, onClose, children }: PopoverProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Ajustar posição para não sair da tela
  const popoverWidth = screenWidth - 20;
  const popoverMaxHeight = 220;
  
  let adjustedX = x - popoverWidth / 2; // Centralizar horizontalmente
  let adjustedY = y + 20; // Um pouco abaixo do ponto clicado
  
  // Garantir que não saia pela direita
  if (adjustedX + popoverWidth > screenWidth - 10) {
    adjustedX = screenWidth - popoverWidth - 10;
  }
  
  // Garantir que não saia pela esquerda
  if (adjustedX < 10) {
    adjustedX = 10;
  }
  
  // Se não couber embaixo, mostrar em cima
  if (adjustedY + popoverMaxHeight > screenHeight - 10) {
    adjustedY = y - popoverMaxHeight - 20;
  }
  
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
            styles.popover,
            {
              left: adjustedX,
              top: adjustedY,
              width: popoverWidth,
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popover: {
    position: 'absolute',
    backgroundColor: '#1f2937', // gray-800
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 220,
  },
});
