/**
 * Event categories and definitions for dashboard
 */

export interface EventDefinition {
  id: string;
  name: string;
  sentiment: '+' | '-' | '0'; // positivo, negativo, neutro
}

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
  events: EventDefinition[];
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'passes',
    name: 'PASSE',
    icon: '📤',
    events: [
      { id: 'passe_certo', name: 'Passe certo', sentiment: '+' },
      { id: 'passe_errado', name: 'Passe errado', sentiment: '-' },
      { id: 'passe_interceptado', name: 'Passe interceptado', sentiment: '-' },
      { id: 'passe_longo_certo', name: 'Passe longo certo', sentiment: '+' },
      { id: 'passe_longo_errado', name: 'Passe longo errado', sentiment: '-' },
      { id: 'passe_sob_pressao_certo', name: 'Passe sob pressão certo', sentiment: '+' },
      { id: 'passe_chave', name: 'Passe-chave', sentiment: '+' },
      { id: 'assistencia', name: 'Assistência', sentiment: '+' },
      { id: 'pre_assistencia', name: 'Pré-assistência', sentiment: '+' },
    ],
  },
  {
    id: 'finalizacao',
    name: 'FINALIZAÇÃO',
    icon: '⚽',
    events: [
      { id: 'finalizacao_no_gol', name: 'Finalização no gol', sentiment: '+' },
      { id: 'finalizacao_fora', name: 'Finalização para fora', sentiment: '-' },
      { id: 'finalizacao_bloqueada', name: 'Finalização bloqueada', sentiment: '-' },
      { id: 'gol', name: 'Gol', sentiment: '+' },
      { id: 'gol_bola_parada', name: 'Gol de bola parada', sentiment: '+' },
      { id: 'gol_tiro_livre', name: 'Gol de tiro livre direto', sentiment: '+' },
      { id: 'gol_10m', name: 'Gol de 10 metros', sentiment: '+' },
      { id: 'gol_contra_ataque', name: 'Gol em contra-ataque', sentiment: '+' },
    ],
  },
  {
    id: 'criacao',
    name: 'CRIAÇÃO DE JOGADA',
    icon: '🧠',
    events: [
      { id: 'chance_criada', name: 'Chance criada', sentiment: '+' },
      { id: 'grande_chance_criada', name: 'Grande chance criada', sentiment: '+' },
      { id: 'toque_ultimo_terco', name: 'Toque no último terço', sentiment: '+' },
      { id: 'acao_ofensiva', name: 'Ação ofensiva', sentiment: '+' },
    ],
  },
  {
    id: 'drible',
    name: 'DRIBLE E CONDUÇÃO',
    icon: '🏃',
    events: [
      { id: 'drible_certo', name: 'Drible certo', sentiment: '+' },
      { id: 'drible_errado', name: 'Drible errado', sentiment: '-' },
      { id: 'conducao_progressiva', name: 'Condução progressiva', sentiment: '+' },
      { id: 'perda_bola_conducao', name: 'Perda de bola em condução', sentiment: '-' },
      { id: 'falta_sofrida', name: 'Falta sofrida', sentiment: '+' },
    ],
  },
  {
    id: 'defesa',
    name: 'DEFESA',
    icon: '🛡️',
    events: [
      { id: 'desarme_com_posse', name: 'Desarme com posse', sentiment: '+' },
      { id: 'interceptacao', name: 'Interceptação', sentiment: '+' },
      { id: 'bloqueio_chute', name: 'Bloqueio de chute', sentiment: '+' },
      { id: 'bloqueio_passe', name: 'Bloqueio de passe', sentiment: '+' },
      { id: 'corte', name: 'Corte', sentiment: '+' },
      { id: 'rebatida', name: 'Rebatida', sentiment: '+' },
      { id: 'recuperacao_bola', name: 'Recuperação de bola', sentiment: '+' },
      { id: 'roubada_ataque', name: 'Bola roubada no ataque', sentiment: '+' },
      { id: 'erro_defensivo', name: 'Erro defensivo', sentiment: '-' },
      { id: 'erro_gerou_finalizacao', name: 'Erro que gerou finalização', sentiment: '-' },
      { id: 'erro_gerou_gol', name: 'Erro que gerou gol', sentiment: '-' },
    ],
  },
  {
    id: 'transicao',
    name: 'TRANSIÇÃO',
    icon: '⚡',
    events: [
      { id: 'contra_ataque_iniciado', name: 'Contra-ataque iniciado', sentiment: '+' },
      { id: 'contra_ataque_finalizado', name: 'Contra-ataque finalizado', sentiment: '+' },
      { id: 'contra_ataque_gol', name: 'Contra-ataque convertido em gol', sentiment: '+' },
      { id: 'perda_bola_transicao', name: 'Perda de bola em transição', sentiment: '-' },
    ],
  },
  {
    id: 'posse',
    name: 'POSSE DE BOLA',
    icon: '🔄',
    events: [
      { id: 'perda_posse', name: 'Perda de posse', sentiment: '-' },
      { id: 'recuperacao_posse', name: 'Recuperação de posse', sentiment: '+' },
    ],
  },
  {
    id: 'duelos',
    name: 'DUELO',
    icon: '⚔️',
    events: [
      { id: 'duelo_ganho', name: 'Duelo ganho', sentiment: '+' },
      { id: 'duelo_perdido', name: 'Duelo perdido', sentiment: '-' },
      { id: 'duelo_ofensivo_ganho', name: 'Duelo ofensivo ganho', sentiment: '+' },
      { id: 'duelo_defensivo_ganho', name: 'Duelo defensivo ganho', sentiment: '+' },
    ],
  },
  {
    id: 'disciplina',
    name: 'DISCIPLINA',
    icon: '🚫',
    events: [
      { id: 'falta_cometida', name: 'Falta cometida', sentiment: '-' },
      { id: 'falta_sofrida_disc', name: 'Falta sofrida', sentiment: '+' },
      { id: 'cartao_amarelo', name: 'Cartão amarelo', sentiment: '-' },
      { id: 'cartao_vermelho', name: 'Cartão vermelho', sentiment: '-' },
      { id: 'penalti_cometido', name: 'Pênalti cometido', sentiment: '-' },
      { id: 'penalti_sofrido', name: 'Pênalti sofrido', sentiment: '+' },
    ],
  },
  {
    id: 'bola_parada',
    name: 'BOLA PARADA',
    icon: '📍',
    events: [
      { id: 'escanteio_certo', name: 'Escanteio certo', sentiment: '+' },
      { id: 'escanteio_errado', name: 'Escanteio errado', sentiment: '-' },
      { id: 'falta_certa', name: 'Falta certa', sentiment: '+' },
      { id: 'falta_errada', name: 'Falta desperdiçada', sentiment: '-' },
    ],
  },
  {
    id: 'pressao',
    name: 'PRESSÃO',
    icon: '⚡',
    events: [
      { id: 'pressao_realizada', name: 'Pressão realizada', sentiment: '+' },
      { id: 'pressao_bem_sucedida', name: 'Pressão bem-sucedida', sentiment: '+' },
      { id: 'pressao_gerou_erro', name: 'Pressão que gerou erro adversário', sentiment: '+' },
      { id: 'pressao_quebrada', name: 'Pressão quebrada pelo adversário', sentiment: '-' },
    ],
  },
  {
    id: 'goleiro',
    name: 'GOLEIRO',
    icon: '🧤',
    events: [
      { id: 'defesa', name: 'Defesa', sentiment: '+' },
      { id: 'defesa_dificil', name: 'Defesa difícil', sentiment: '+' },
      { id: 'gol_sofrido', name: 'Gol sofrido', sentiment: '-' },
      { id: 'saida_goleiro', name: 'Saída do gol', sentiment: '+' },
      { id: 'saida_errada', name: 'Saída errada', sentiment: '-' },
      { id: 'um_contra_um_vencido', name: '1x1 vencido', sentiment: '+' },
      { id: 'reposicao_certa', name: 'Reposição de bola certa', sentiment: '+' },
      { id: 'reposicao_errada', name: 'Reposição errada', sentiment: '-' },
      { id: 'assistencia_goleiro', name: 'Assistência (goleiro)', sentiment: '+' },
    ],
  },
];

/**
 * Get sentiment color for event badges
 */
export function getSentimentColor(sentiment: '+' | '-' | '0'): string {
  switch (sentiment) {
    case '+':
      return '#10b981'; // green
    case '-':
      return '#ef4444'; // red
    case '0':
      return '#6b7280'; // gray
  }
}

/**
 * Get sentiment label
 */
export function getSentimentLabel(sentiment: '+' | '-' | '0'): string {
  switch (sentiment) {
    case '+':
      return 'Positivo';
    case '-':
      return 'Negativo';
    case '0':
      return 'Neutro';
  }
}

/**
 * Get all events as a flat array
 */
export function getAllEvents(): EventDefinition[] {
  return EVENT_CATEGORIES.flatMap(category => category.events);
}

/**
 * Get event by ID
 */
export function getEventById(id: string): EventDefinition | undefined {
  return getAllEvents().find(event => event.id === id);
}

/**
 * Get category for an event
 */
export function getCategoryForEvent(eventId: string): EventCategory | undefined {
  return EVENT_CATEGORIES.find(category => 
    category.events.some(event => event.id === eventId)
  );
}
