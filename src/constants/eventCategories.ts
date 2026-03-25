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
    name: 'PASSES',
    icon: '📤',
    events: [
      { id: 'passes_certos', name: 'Passes certos', sentiment: '+' },
      { id: 'passes_errados', name: 'Passes errados', sentiment: '-' },
      { id: 'total_passes', name: 'Total de passes', sentiment: '0' },
      { id: 'passes_interceptados', name: 'Passes interceptados', sentiment: '-' },
      { id: 'passes_longos_certos', name: 'Passes longos certos', sentiment: '+' },
      { id: 'passes_longos_errados', name: 'Passes longos errados', sentiment: '-' },
      { id: 'passes_sob_pressao_certos', name: 'Passes sob pressão certos', sentiment: '+' },
      { id: 'passes_chave', name: 'Passes-chave', sentiment: '+' },
      { id: 'assistencias', name: 'Assistências', sentiment: '+' },
      { id: 'pre_assistencias', name: 'Pré-assistências', sentiment: '+' },
    ],
  },
  {
    id: 'finalizacao',
    name: 'FINALIZAÇÃO',
    icon: '⚽',
    events: [
      { id: 'finalizacoes_totais', name: 'Finalizações totais', sentiment: '0' },
      { id: 'finalizacoes_no_gol', name: 'Finalizações no gol', sentiment: '+' },
      { id: 'finalizacoes_fora', name: 'Finalizações para fora', sentiment: '-' },
      { id: 'finalizacoes_bloqueadas', name: 'Finalizações bloqueadas', sentiment: '-' },
      { id: 'gols', name: 'Gols', sentiment: '+' },
      { id: 'gols_bola_parada', name: 'Gols de bola parada', sentiment: '+' },
      { id: 'gols_tiro_livre', name: 'Gols de tiro livre direto', sentiment: '+' },
      { id: 'gols_10m', name: 'Gols de 10 metros', sentiment: '+' },
      { id: 'gols_contra_ataque', name: 'Gols em contra-ataque', sentiment: '+' },
    ],
  },
  {
    id: 'criacao',
    name: 'CRIAÇÃO DE JOGADAS',
    icon: '🧠',
    events: [
      { id: 'chances_criadas', name: 'Chances criadas', sentiment: '+' },
      { id: 'grandes_chances_criadas', name: 'Grandes chances criadas', sentiment: '+' },
      { id: 'toques_na_bola', name: 'Toques na bola', sentiment: '0' },
      { id: 'toques_ultimo_terco', name: 'Toques no último terço', sentiment: '+' },
      { id: 'acoes_ofensivas', name: 'Ações ofensivas', sentiment: '+' },
    ],
  },
  {
    id: 'drible',
    name: 'DRIBLE E CONDUÇÃO',
    icon: '🏃',
    events: [
      { id: 'dribles_certos', name: 'Dribles certos', sentiment: '+' },
      { id: 'dribles_errados', name: 'Dribles errados', sentiment: '-' },
      { id: 'tentativas_drible', name: 'Tentativas de drible', sentiment: '0' },
      { id: 'conducoes_progressivas', name: 'Conduções progressivas', sentiment: '+' },
      { id: 'perda_bola_conducao', name: 'Perda de bola em condução', sentiment: '-' },
      { id: 'faltas_sofridas', name: 'Faltas sofridas', sentiment: '+' },
    ],
  },
  {
    id: 'defesa',
    name: 'DEFESA (REFINADO 🔥)',
    icon: '🛡️',
    events: [
      { id: 'desarme_com_posse', name: 'Desarme com posse', sentiment: '+' },
      { id: 'desarme_sem_posse', name: 'Desarme sem posse', sentiment: '0' },
      { id: 'tentativas_desarme', name: 'Tentativas de desarme', sentiment: '0' },
      { id: 'interceptacoes', name: 'Interceptações', sentiment: '+' },
      { id: 'bloqueios_chute', name: 'Bloqueios de chute', sentiment: '+' },
      { id: 'bloqueios_passe', name: 'Bloqueios de passe', sentiment: '+' },
      { id: 'cortes', name: 'Cortes', sentiment: '+' },
      { id: 'rebatidas', name: 'Rebatidas', sentiment: '+' },
      { id: 'recuperacoes_bola', name: 'Recuperações de bola', sentiment: '+' },
      { id: 'roubadas_ataque', name: 'Bolas roubadas no ataque', sentiment: '+' },
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
      { id: 'contra_ataques_iniciados', name: 'Contra-ataques iniciados', sentiment: '+' },
      { id: 'contra_ataques_finalizados', name: 'Contra-ataques finalizados', sentiment: '+' },
      { id: 'contra_ataques_gol', name: 'Contra-ataques convertidos em gol', sentiment: '+' },
      { id: 'perda_bola_transicao', name: 'Perda de bola em transição', sentiment: '-' },
    ],
  },
  {
    id: 'posse',
    name: 'POSSE DE BOLA',
    icon: '🔄',
    events: [
      { id: 'tempo_posse', name: 'Tempo de posse', sentiment: '0' },
      { id: 'perdas_posse', name: 'Perdas de posse', sentiment: '-' },
      { id: 'recuperacoes_posse', name: 'Recuperações de posse', sentiment: '+' },
    ],
  },
  {
    id: 'duelos',
    name: 'DUELOS',
    icon: '⚔️',
    events: [
      { id: 'duelos_ganhos', name: 'Duelos ganhos', sentiment: '+' },
      { id: 'duelos_perdidos', name: 'Duelos perdidos', sentiment: '-' },
      { id: 'duelos_ofensivos_ganhos', name: 'Duelos ofensivos ganhos', sentiment: '+' },
      { id: 'duelos_defensivos_ganhos', name: 'Duelos defensivos ganhos', sentiment: '+' },
    ],
  },
  {
    id: 'disciplina',
    name: 'DISCIPLINA',
    icon: '🚫',
    events: [
      { id: 'faltas_cometidas', name: 'Faltas cometidas', sentiment: '-' },
      { id: 'faltas_sofridas_disc', name: 'Faltas sofridas', sentiment: '+' },
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
      { id: 'escanteios_cobrados', name: 'Escanteios cobrados', sentiment: '0' },
      { id: 'escanteios_certos', name: 'Escanteios certos', sentiment: '+' },
      { id: 'escanteios_errados', name: 'Escanteios errados', sentiment: '-' },
      { id: 'faltas_cobradas', name: 'Faltas cobradas', sentiment: '0' },
      { id: 'faltas_certas', name: 'Faltas certas', sentiment: '+' },
      { id: 'faltas_erradas', name: 'Faltas desperdiçadas', sentiment: '-' },
    ],
  },
  {
    id: 'pressao',
    name: 'PRESSÃO',
    icon: '⚡',
    events: [
      { id: 'pressoes', name: 'Pressões realizadas', sentiment: '+' },
      { id: 'pressoes_bem_sucedidas', name: 'Pressões bem-sucedidas', sentiment: '+' },
      { id: 'pressao_gerou_erro', name: 'Pressão que gerou erro adversário', sentiment: '+' },
      { id: 'pressao_quebrada', name: 'Pressão quebrada pelo adversário', sentiment: '-' },
    ],
  },
  {
    id: 'goleiro',
    name: 'GOLEIRO',
    icon: '🧤',
    events: [
      { id: 'defesas', name: 'Defesas', sentiment: '+' },
      { id: 'defesas_dificeis', name: 'Defesas difíceis', sentiment: '+' },
      { id: 'gols_sofridos', name: 'Gols sofridos', sentiment: '-' },
      { id: 'chutes_sofridos', name: 'Chutes no gol enfrentados', sentiment: '0' },
      { id: 'saidas_goleiro', name: 'Saídas do gol', sentiment: '+' },
      { id: 'saidas_erradas', name: 'Saídas erradas', sentiment: '-' },
      { id: 'um_contra_um_vencido', name: '1x1 vencidos', sentiment: '+' },
      { id: 'reposicao_certa', name: 'Reposição de bola certa', sentiment: '+' },
      { id: 'reposicao_errada', name: 'Reposição errada', sentiment: '-' },
      { id: 'assistencias_goleiro', name: 'Assistências (goleiro)', sentiment: '+' },
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
