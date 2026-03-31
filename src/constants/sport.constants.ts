import { SportType } from '../types';

// ─── Sport Types ─────────────────────────────────────────────────────────────
export const SPORT_TYPES: Record<SportType, { label: string; icon: string; description: string }> = {
  futsal: {
    label: 'Futsal',
    icon: 'soccer',
    description: 'Quadra indoor - 5 jogadores',
  },
  society: {
    label: 'Society',
    icon: 'stadium-variant',
    description: 'Campo sintético - 7 jogadores',
  },
  campo: {
    label: 'Campo',
    icon: 'stadium',
    description: 'Campo gramado - 11 jogadores',
  },
  all: {
    label: 'Universal',
    icon: 'earth',
    description: 'Compatível com todas modalidades',
  },
};

// ─── Sport-Specific Configurations ──────────────────────────────────────────
export const SPORT_CONFIGS = {
  futsal: {
    playersPerTeam: 5,
    maxSubstitutes: 7,
    courtType: 'indoor',
    defaultDuration: 40, // minutos (2x 20min)
    hasOffside: false,
  },
  society: {
    playersPerTeam: 7,
    maxSubstitutes: 5,
    courtType: 'synthetic',
    defaultDuration: 50, // minutos (2x 25min)
    hasOffside: true,
  },
  campo: {
    playersPerTeam: 11,
    maxSubstitutes: 7,
    courtType: 'grass',
    defaultDuration: 90, // minutos (2x 45min)
    hasOffside: true,
  },
} as const;

// ─── Event Suggestions by Sport Type ────────────────────────────────────────
export const SPORT_EVENT_SUGGESTIONS = {
  futsal: [
    'Gol',
    'Assistência',
    'Finalização',
    'Defesa do goleiro',
    'Tiro de 7 metros',
    'Falta cometida',
    'Falta sofrida',
    'Cartão amarelo',
    'Cartão vermelho',
    'Passe errado',
    'Desarme',
    'Interceptação',
    'Pedido de tempo',
    'Rodízio defensivo',
  ],
  society: [
    'Gol',
    'Assistência',
    'Finalização',
    'Defesa do goleiro',
    'Pênalti',
    'Escanteio',
    'Lateral',
    'Falta cometida',
    'Falta sofrida',
    'Cartão amarelo',
    'Cartão vermelho',
    'Impedimento',
    'Desarme',
    'Cruzamento',
  ],
  campo: [
    'Gol',
    'Assistência',
    'Finalização',
    'Finalização na trave',
    'Defesa do goleiro',
    'Pênalti',
    'Escanteio',
    'Lateral',
    'Tiro livre direto',
    'Tiro livre indireto',
    'Falta cometida',
    'Falta sofrida',
    'Cartão amarelo',
    'Cartão vermelho',
    'Impedimento',
    'Desarme',
    'Cruzamento',
    'Cabeceio',
    'Drible',
  ],
  all: [
    'Gol',
    'Assistência',
    'Finalização',
    'Defesa do goleiro',
    'Falta cometida',
    'Falta sofrida',
    'Cartão amarelo',
    'Cartão vermelho',
    'Passe errado',
    'Desarme',
  ],
};

export const getSportTypeLabel = (sportType: SportType): string => {
  return SPORT_TYPES[sportType].label;
};

export const getSportTypeIcon = (sportType: SportType): string => {
  return SPORT_TYPES[sportType].icon;
};

export const getSportConfig = (sportType: Exclude<SportType, 'all'>) => {
  return SPORT_CONFIGS[sportType];
};
