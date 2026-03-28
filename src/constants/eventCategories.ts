/**
 * Event categories and definitions for dashboard
 */

export interface EventDefinition {
  id: string;
  name: string;
  sentiment: '+' | '-' | '0'; // positivo, negativo, neutro
  /** Show a badge with count in the player card header */
  showInHeader?: boolean;
  /** MaterialCommunityIcons icon name for the header badge */
  headerIcon?: string;
  /** Color for the header badge (hex) */
  headerColor?: string;
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
      { id: 'assistencia', name: 'Assistência', sentiment: '+', showInHeader: true, headerIcon: 'shoe-cleat', headerColor: '#6366f1' },
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
      { id: 'gol', name: 'Gol', sentiment: '+', showInHeader: true, headerIcon: 'soccer', headerColor: '#22c55e' },
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
      { id: 'desarme_sem_posse', name: 'Desarme sem posse', sentiment: '-' },
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
      { id: 'cartao_amarelo', name: 'Cartão amarelo', sentiment: '-', showInHeader: true, headerIcon: 'card', headerColor: '#eab308' },
      { id: 'cartao_vermelho', name: 'Cartão vermelho', sentiment: '-', showInHeader: true, headerIcon: 'card', headerColor: '#ef4444' },
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

// ─── Event Metric Groups ──────────────────────────────────────────────────────

/**
 * Declarative pairing of related events for aggregate metrics.
 *
 * total       = sum of all eventIds counts
 * successRate = sum(successIds) / total × 100  (null when total = 0 or no successIds)
 */
export interface EventMetricGroup {
  id: string;
  name: string;
  categoryId: string;
  /** All event IDs that contribute to the total (denominator) */
  eventIds: string[];
  /** Subset that counts as "success" (numerator for %). Omit if no rate applies. */
  successIds?: string[];
  /** Show this group in the match summary card */
  showInMatchSummary?: boolean;
  /** MaterialCommunityIcons icon for the success count */
  successIcon?: string;
  /** MaterialCommunityIcons icon for the fail count */
  failIcon?: string;
}

export const EVENT_METRIC_GROUPS: EventMetricGroup[] = [

  // ── PASSE ────────────────────────────────────────────────────────────────
  {
    id: 'passes',
    name: 'Passes',
    categoryId: 'passes',
    eventIds: ['passe_certo', 'passe_errado', 'passe_interceptado'],
    successIds: ['passe_certo'],
  },
  {
    id: 'passes_longos',
    name: 'Passes Longos',
    categoryId: 'passes',
    eventIds: ['passe_longo_certo', 'passe_longo_errado'],
    successIds: ['passe_longo_certo'],
  },
  {
    id: 'passes_decisivos',
    name: 'Passes Decisivos',
    categoryId: 'passes',
    eventIds: ['passe_chave', 'assistencia', 'pre_assistencia'],
  },
  {
    id: 'passes_sob_pressao',
    name: 'Passes sob Pressão',
    categoryId: 'passes',
    eventIds: ['passe_sob_pressao_certo'],
  },

  // ── FINALIZAÇÃO ───────────────────────────────────────────────────────────
  {
    id: 'finalizacoes',
    name: 'Finalizações',
    categoryId: 'finalizacao',
    eventIds: [
      'finalizacao_no_gol', 'finalizacao_fora',
      'gol', 'gol_bola_parada', 'gol_tiro_livre', 'gol_10m', 'gol_contra_ataque',
    ],
    successIds: [
      'finalizacao_no_gol',
      'gol', 'gol_bola_parada', 'gol_tiro_livre', 'gol_10m', 'gol_contra_ataque',
    ],
    successIcon: 'target',
    failIcon: 'arrow-top-right',
  },

  // ── DRIBLE E CONDUÇÃO ─────────────────────────────────────────────────────
  {
    id: 'dribles',
    name: 'Dribles',
    categoryId: 'drible',
    eventIds: ['drible_certo', 'drible_errado'],
    successIds: ['drible_certo'],
  },
  {
    id: 'conducoes',
    name: 'Conduções',
    categoryId: 'drible',
    eventIds: ['conducao_progressiva', 'perda_bola_conducao'],
    successIds: ['conducao_progressiva'],
  },
  {
    id: 'faltas_sofridas_drible',
    name: 'Faltas Sofridas',
    categoryId: 'drible',
    eventIds: ['falta_sofrida'],
  },

  // ── DEFESA ────────────────────────────────────────────────────────────────
  {
    id: 'acoes_defensivas',
    name: 'Ações Defensivas',
    categoryId: 'defesa',
    eventIds: [
      'desarme_com_posse', 'desarme_sem_posse', 'interceptacao', 'bloqueio_chute', 'bloqueio_passe',
      'corte', 'rebatida', 'recuperacao_bola', 'roubada_ataque',
    ],
    successIds: ['desarme_com_posse', 'interceptacao', 'bloqueio_chute', 'bloqueio_passe', 'corte', 'rebatida', 'recuperacao_bola', 'roubada_ataque'],
  },
  {
    id: 'erros_defensivos',
    name: 'Erros Defensivos',
    categoryId: 'defesa',
    eventIds: ['erro_defensivo', 'erro_gerou_finalizacao', 'erro_gerou_gol'],
  },

  // ── TRANSIÇÃO ─────────────────────────────────────────────────────────────
  {
    id: 'contra_ataques',
    name: 'Contra-ataques',
    categoryId: 'transicao',
    eventIds: ['contra_ataque_iniciado', 'contra_ataque_finalizado', 'contra_ataque_gol'],
    successIds: ['contra_ataque_finalizado', 'contra_ataque_gol'],
  },
  {
    id: 'perdas_transicao',
    name: 'Perdas em Transição',
    categoryId: 'transicao',
    eventIds: ['perda_bola_transicao'],
  },

  // ── POSSE DE BOLA ─────────────────────────────────────────────────────────
  {
    id: 'disputas_posse',
    name: 'Disputas de Posse',
    categoryId: 'posse',
    eventIds: ['recuperacao_posse', 'perda_posse'],
    successIds: ['recuperacao_posse'],
  },

  // ── DUELO ─────────────────────────────────────────────────────────────────
  {
    id: 'duelos',
    name: 'Duelos',
    categoryId: 'duelos',
    eventIds: ['duelo_ganho', 'duelo_perdido'],
    successIds: ['duelo_ganho'],
  },
  {
    id: 'duelos_especificos',
    name: 'Duelos Específicos',
    categoryId: 'duelos',
    eventIds: ['duelo_ofensivo_ganho', 'duelo_defensivo_ganho'],
  },

  // ── CRIAÇÃO DE JOGADA ─────────────────────────────────────────────────────
  {
    id: 'criacao_chances',
    name: 'Criação de Chances',
    categoryId: 'criacao',
    eventIds: ['chance_criada', 'grande_chance_criada'],
  },
  {
    id: 'criacao_acoes_ofensivas',
    name: 'Ações Ofensivas',
    categoryId: 'criacao',
    eventIds: ['toque_ultimo_terco', 'acao_ofensiva'],
  },

  // ── DISCIPLINA ────────────────────────────────────────────────────────────
  {
    id: 'faltas',
    name: 'Faltas',
    categoryId: 'disciplina',
    eventIds: ['falta_cometida', 'falta_sofrida_disc'],
    successIds: ['falta_sofrida_disc'],
  },
  {
    id: 'cartoes',
    name: 'Cartões',
    categoryId: 'disciplina',
    eventIds: ['cartao_amarelo', 'cartao_vermelho'],
  },
  {
    id: 'penaltis',
    name: 'Pênaltis',
    categoryId: 'disciplina',
    eventIds: ['penalti_cometido', 'penalti_sofrido'],
    successIds: ['penalti_sofrido'],
  },

  // ── BOLA PARADA ───────────────────────────────────────────────────────────
  {
    id: 'escanteios',
    name: 'Escanteios',
    categoryId: 'bola_parada',
    eventIds: ['escanteio_certo', 'escanteio_errado'],
    successIds: ['escanteio_certo'],
  },
  {
    id: 'faltas_ofensivas',
    name: 'Faltas Ofensivas',
    categoryId: 'bola_parada',
    eventIds: ['falta_certa', 'falta_errada'],
    successIds: ['falta_certa'],
  },

  // ── PRESSÃO ───────────────────────────────────────────────────────────────
  {
    id: 'pressoes',
    name: 'Pressões',
    categoryId: 'pressao',
    eventIds: ['pressao_realizada', 'pressao_bem_sucedida', 'pressao_gerou_erro', 'pressao_quebrada'],
    successIds: ['pressao_bem_sucedida', 'pressao_gerou_erro'],
  },

  // ── GOLEIRO ───────────────────────────────────────────────────────────────
  {
    id: 'defesas_goleiro',
    name: 'Defesas',
    categoryId: 'goleiro',
    eventIds: ['defesa', 'defesa_dificil', 'gol_sofrido'],
    successIds: ['defesa', 'defesa_dificil'],
  },
  {
    id: 'saidas_goleiro',
    name: 'Saídas',
    categoryId: 'goleiro',
    eventIds: ['saida_goleiro', 'saida_errada'],
    successIds: ['saida_goleiro'],
  },
  {
    id: 'reposicoes_goleiro',
    name: 'Reposições',
    categoryId: 'goleiro',
    eventIds: ['reposicao_certa', 'reposicao_errada'],
    successIds: ['reposicao_certa'],
  },
  {
    id: 'um_contra_um_goleiro',
    name: '1x1 Goleiro',
    categoryId: 'goleiro',
    eventIds: ['um_contra_um_vencido'],
  },
  {
    id: 'assistencias_goleiro',
    name: 'Assistências (Goleiro)',
    categoryId: 'goleiro',
    eventIds: ['assistencia_goleiro'],
  },
];

// ─── Group utility functions ───────────────────────────────────────────────────

/** Sum of all event counts in the group (denominator). */
export function computeGroupTotal(
  group: EventMetricGroup,
  counts: Record<string, number>
): number {
  return group.eventIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
}

/** Sum of success event counts in the group (numerator). */
export function computeGroupSuccess(
  group: EventMetricGroup,
  counts: Record<string, number>
): number {
  if (!group.successIds) return 0;
  return group.successIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
}

/**
 * Returns success % (0–100, rounded) or null when:
 * - the group has no successIds, or
 * - the total is 0 (avoid division by zero)
 */
export function computeGroupSuccessRate(
  group: EventMetricGroup,
  counts: Record<string, number>
): number | null {
  if (!group.successIds || group.successIds.length === 0) return null;
  const total = computeGroupTotal(group, counts);
  if (total === 0) return null;
  const success = computeGroupSuccess(group, counts);
  return Math.round((success / total) * 100);
}

/** All groups belonging to a category. */
export function getGroupsForCategory(categoryId: string): EventMetricGroup[] {
  return EVENT_METRIC_GROUPS.filter(g => g.categoryId === categoryId);
}

/** First group that contains the given eventId (may belong to multiple). */
export function getGroupForEvent(eventId: string): EventMetricGroup | undefined {
  return EVENT_METRIC_GROUPS.find(g => g.eventIds.includes(eventId));
}

/** All groups that contain the given eventId. */
export function getGroupsForEvent(eventId: string): EventMetricGroup[] {
  return EVENT_METRIC_GROUPS.filter(g => g.eventIds.includes(eventId));
}

export function getGroupById(id: string): EventMetricGroup | undefined {
  return EVENT_METRIC_GROUPS.find(g => g.id === id);
}

/** Groups flagged to appear in the match summary card. */
export function getSummaryGroups(): EventMetricGroup[] {
  return EVENT_METRIC_GROUPS.filter(g => g.showInMatchSummary);
}

// ─── Summary Totalizers ───────────────────────────────────────────────────────

/**
 * A totalizer aggregates arbitrary event IDs into a single displayed number.
 * Configure SUMMARY_TOTALIZERS to control what appears in the match summary.
 */
export interface SummaryTotalizer {
  id: string;
  /** Display label */
  name: string;
  /** All event IDs that contribute to the total */
  eventIds: string[];
  /** Subset counted as "success" for % (omit if no rate) */
  successIds?: string[];
  /** MaterialCommunityIcons icon */
  icon?: string;
  /** Accent color (hex) */
  color?: string;
}

export const SUMMARY_TOTALIZERS: SummaryTotalizer[] = [
  {
    id: 'total_finalizacoes',
    name: 'Finalizações',
    eventIds: [
      'finalizacao_no_gol', 'finalizacao_fora', 'finalizacao_bloqueada',
    ],
    successIds: [
      'finalizacao_no_gol',
    ],
    icon: 'target',
  },
  {
    id: 'total_passes',
    name: 'Passes',
    eventIds: ['passe_certo', 'passe_errado', 'passe_interceptado', 'passe_longo_certo', 'passe_longo_errado', 'passe_sob_pressao_certo'],
    successIds: ['passe_certo', 'passe_longo_certo', 'passe_sob_pressao_certo'],
    icon: 'arrow-top-right',
  },
  {
    id: 'total_dribles',
    name: 'Dribles',
    eventIds: ['drible_certo', 'drible_errado'],
    successIds: ['drible_certo'],
    icon: 'run-fast',
  },
  {
    id: 'total_duelos',
    name: 'Duelos',
    eventIds: ['duelo_ganho', 'duelo_perdido', 'duelo_ofensivo_ganho', 'duelo_defensivo_ganho'],
    successIds: ['duelo_ganho', 'duelo_ofensivo_ganho', 'duelo_defensivo_ganho'],
    icon: 'sword-cross',
  },
  {
    id: 'total_defesas',
    name: 'Defesas',
    eventIds: ['defesa', 'defesa_dificil', 'gol_sofrido'],
    successIds: ['defesa', 'defesa_dificil'],
    icon: 'shield-half-full',
  },
];

/** Sum of all eventIds for a totalizer. */
export function computeTotalizerTotal(
  t: SummaryTotalizer,
  counts: Record<string, number>
): number {
  return t.eventIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
}

/** Sum of successIds for a totalizer. */
export function computeTotalizerSuccess(
  t: SummaryTotalizer,
  counts: Record<string, number>
): number {
  if (!t.successIds) return 0;
  return t.successIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
}

/**
 * Returns success % (0–100, rounded) or null when no successIds or total = 0.
 */
export function computeTotalizerRate(
  t: SummaryTotalizer,
  counts: Record<string, number>
): number | null {
  if (!t.successIds?.length) return null;
  const total = computeTotalizerTotal(t, counts);
  if (total === 0) return null;
  return Math.round((computeTotalizerSuccess(t, counts) / total) * 100);
}
