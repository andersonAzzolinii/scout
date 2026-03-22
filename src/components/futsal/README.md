# Futsal Components Architecture

## 📁 Estrutura Modular

A funcionalidade da quadra de futsal foi refatorada em uma arquitetura modular com separação clara de responsabilidades:

```
src/
├── components/
│   └── futsal/
│       ├── FutsalCourt.tsx      # Componente principal (orquestrador)
│       ├── CourtSVG.tsx         # Renderização SVG da quadra
│       ├── PositionButton.tsx   # Botão individual de posição
│       └── index.ts             # Barrel export
├── hooks/
│   ├── useFutsalPositions.ts    # Lógica de posicionamento e coordenadas
│   ├── useMatchTimer.ts         # Gerenciamento do cronômetro
│   ├── useBenchPanel.ts         # Animação do painel de reservas
│   └── index.ts                 # Barrel export
├── constants/
│   └── futsal.constants.ts      # Constantes (posições, cores, dimensões)
└── types/
    └── futsal.types.ts          # Interfaces e tipos TypeScript
```

## 🎯 Componentes

### **FutsalCourt** (Principal)
Componente orquestrador que une todos os sub-componentes.

```tsx
import { FutsalCourt } from '@/components/futsal';

<FutsalCourt
  width={400}
  positionedPlayers={players}
  onPositionPress={handlePress}
/>
```

### **CourtSVG**
Renderiza apenas o SVG da quadra (sem lógica de negócio).

### **PositionButton**
Botão individual de posição com estilo e interação isolados.

## 🪝 Hooks Customizados

### **useFutsalPositions**
```tsx
const {
  getScreenCoords,           // Converter % para coordenadas
  getPlayerAtPosition,       // Obter jogador em uma posição
  isPositionOccupied,        // Verificar se posição está ocupada
  availablePositions,        // Posições disponíveis
  getPositionCoords,         // Coordenadas de uma posição
} = useFutsalPositions({ courtWidth, courtHeight, positionedPlayers });
```

### **useMatchTimer**
```tsx
const { 
  isRunning, 
  elapsed, 
  toggleTimer, 
  resetTimer 
} = useMatchTimer();
```

### **useBenchPanel**
```tsx
const {
  isExpanded,
  heightAnim,
  overlayOpacityAnim,
  expand,
  collapse,
  toggle,
  panResponder,
} = useBenchPanel();
```

## 📐 Sistema de Coordenadas

As posições são definidas como **porcentagens** para responsividade total:

```tsx
FIXED_POSITIONS = {
  1: { xPercent: 50, yPercent: 90.83, label: 'GOL' },  // Goleiro
  2: { xPercent: 50, yPercent: 70.83, label: 'FIX' },  // Fixo
  3: { xPercent: 22.5, yPercent: 50, label: 'ALA' },   // Ala Esquerda
  4: { xPercent: 77.5, yPercent: 50, label: 'ALA' },   // Ala Direita
  5: { xPercent: 50, yPercent: 28.33, label: 'PIV' },  // Pivô
}
```

## 🎨 Constantes

Todas as constantes estão centralizadas em `futsal.constants.ts`:

- **SVG_WIDTH / SVG_HEIGHT**: Dimensões do viewBox
- **COURT_COLORS**: Cores da quadra
- **FIXED_POSITIONS**: Posições táticas
- **POSITION_BUTTON**: Estilo dos botões
- **BENCH_PANEL**: Dimensões do painel

## ✨ Vantagens da Nova Arquitetura

### ✅ **Separação de Responsabilidades**
- Cada componente tem uma única responsabilidade
- Facilita testes unitários
- Reduz acoplamento

### ✅ **Reutilização**
- Hooks podem ser usados em outros contextos
- Componentes visuais isolados
- Constantes compartilhadas

### ✅ **Manutenibilidade**
- Código organizado e documentado
- Fácil de encontrar e modificar
- TypeScript para segurança de tipos

### ✅ **Performance**
- Hooks com memoização
- Re-renders otimizados
- Cálculos eficientes

### ✅ **Escalabilidade**
- Estrutura pronta para novos recursos
- Fácil adicionar novos componentes
- Padrão consistente

## 🔄 Migração

O arquivo antigo `components/FutsalCourt.tsx` foi mantido para compatibilidade:

```tsx
// Importação antiga (ainda funciona)
import { FutsalCourt } from '@/components/FutsalCourt';

// Importação nova (recomendada)
import { FutsalCourt } from '@/components/futsal';
```

## 📝 Próximos Passos

1. ✅ Separar painel de reservas em componente próprio
2. ✅ Criar hook para gestão de substituições
3. ✅ Adicionar testes unitários
4. ✅ Documentar fluxos de interação
5. ✅ Otimizar animações
