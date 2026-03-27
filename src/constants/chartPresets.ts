/**
 * Pre-built chart presets for each event category.
 *
 * Each preset defines:
 * - which events to fetch (eventIds)
 * - how to compute a single meaningful metric from those raw counts (compute)
 * - axis/label metadata
 *
 * `compute(counts)` receives a Record<eventId, number> and returns
 * the final value to display for one entity (player / team / match).
 * Returns null when there is not enough data (e.g. denominator = 0).
 */

export type GroupByMode = 'player' | 'team' | 'match';
export type PresetChartType = 'bar' | 'pie';

export interface ChartPreset {
  id: string;
  title: string;
  /** Short description shown in the card subtitle */
  description: string;
  /** Human-readable explanation of what the metric means */
  metricDescription: string;
  categoryId: string;
  /** Event IDs from eventCategories.ts that feed into compute() */
  eventIds: string[];
  /**
   * Pure function: given raw counts for each eventId,
   * return the single computed value to display.
   * Return null to exclude the entity from the chart (no data).
   */
  compute: (counts: Record<string, number>) => number | null;
  chartType: PresetChartType;
  defaultGroupBy: GroupByMode;
  /** Suffix appended to axis values (e.g. '%', 'g') */
  yAxisSuffix: string;
  /** Short label for the Y axis */
  yAxisLabel: string;
  /** Color of the bar/slice */
  color: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const pct = (num: number, den: number): number | null =>
  den === 0 ? null : Math.round((num / den) * 100);

const ratio = (num: number, den: number): number | null =>
  den === 0 ? null : Math.round((num / den) * 100) / 100;

const sum = (...vals: number[]) => vals.reduce((a, b) => a + b, 0);

export const CHART_PRESETS: ChartPreset[] = [

  // ═══════════════════════════════════════════════════════════════
  // PASSES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'passes_acerto',
    title: '% Acerto de Passes',
    description: 'Passes certos ÷ total de passes',
    metricDescription: 'Percentual de passes que chegaram ao destino',
    categoryId: 'passes',
    eventIds: ['passes_certos', 'passes_errados'],
    compute: (c) => pct(c.passes_certos ?? 0, sum(c.passes_certos ?? 0, c.passes_errados ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#3b82f6',
  },
  {
    id: 'passes_longos_acerto',
    title: '% Acerto Passes Longos',
    description: 'Passes longos certos ÷ total de passes longos',
    metricDescription: 'Eficiência nos passes de longa distância',
    categoryId: 'passes',
    eventIds: ['passes_longos_certos', 'passes_longos_errados'],
    compute: (c) => pct(c.passes_longos_certos ?? 0, sum(c.passes_longos_certos ?? 0, c.passes_longos_errados ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#06b6d4',
  },
  {
    id: 'passes_decisivos_total',
    title: 'Passes Decisivos',
    description: 'Assistências + pré-assistências + passes-chave',
    metricDescription: 'Total de passes que criaram ou prepararam chances de gol',
    categoryId: 'passes',
    eventIds: ['assistencias', 'pre_assistencias', 'passes_chave'],
    compute: (c) => {
      const total = sum(c.assistencias ?? 0, c.pre_assistencias ?? 0, c.passes_chave ?? 0);
      return total > 0 ? total : null;
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '',
    yAxisLabel: 'Qtd',
    color: '#10b981',
  },

  // ═══════════════════════════════════════════════════════════════
  // FINALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'finalizacao_acerto',
    title: '% Finalizações no Gol',
    description: 'Finalizações no gol ÷ finalizações totais',
    metricDescription: 'Percentual de chutes que foram em direção ao gol',
    categoryId: 'finalizacao',
    eventIds: ['finalizacoes_no_gol', 'finalizacoes_fora', 'finalizacoes_bloqueadas'],
    compute: (c) => {
      const total = sum(c.finalizacoes_no_gol ?? 0, c.finalizacoes_fora ?? 0, c.finalizacoes_bloqueadas ?? 0);
      return pct(c.finalizacoes_no_gol ?? 0, total);
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#f59e0b',
  },
  {
    id: 'finalizacao_conversao',
    title: '% Conversão em Gol',
    description: 'Gols ÷ finalizações totais',
    metricDescription: 'De cada 100 chutes, quantos viraram gol',
    categoryId: 'finalizacao',
    eventIds: ['gols', 'finalizacoes_no_gol', 'finalizacoes_fora', 'finalizacoes_bloqueadas'],
    compute: (c) => {
      const total = sum(c.finalizacoes_no_gol ?? 0, c.finalizacoes_fora ?? 0, c.finalizacoes_bloqueadas ?? 0);
      return pct(c.gols ?? 0, total);
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#10b981',
  },
  {
    id: 'finalizacao_gols_total',
    title: 'Total de Gols',
    description: 'Soma de todos os tipos de gol',
    metricDescription: 'Gols normais + bola parada + tiro livre + 10m + contra-ataque',
    categoryId: 'finalizacao',
    eventIds: ['gols', 'gols_bola_parada', 'gols_tiro_livre', 'gols_10m', 'gols_contra_ataque'],
    compute: (c) => {
      const total = sum(c.gols ?? 0, c.gols_bola_parada ?? 0, c.gols_tiro_livre ?? 0, c.gols_10m ?? 0, c.gols_contra_ataque ?? 0);
      return total > 0 ? total : null;
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '',
    yAxisLabel: 'Gols',
    color: '#ef4444',
  },

  // ═══════════════════════════════════════════════════════════════
  // CRIAÇÃO DE JOGADAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'criacao_grandes_chances_pct',
    title: '% Grandes Chances do Total',
    description: 'Grandes chances ÷ chances criadas',
    metricDescription: 'Proporção de chances criadas que foram de alta qualidade',
    categoryId: 'criacao',
    eventIds: ['chances_criadas', 'grandes_chances_criadas'],
    compute: (c) => pct(c.grandes_chances_criadas ?? 0, c.chances_criadas ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#8b5cf6',
  },
  {
    id: 'criacao_toques_ultimo_terco_pct',
    title: '% Toques no Último Terço',
    description: 'Toques no último terço ÷ toques na bola',
    metricDescription: 'Quanto tempo o jogador atua próximo da área adversária',
    categoryId: 'criacao',
    eventIds: ['toques_na_bola', 'toques_ultimo_terco'],
    compute: (c) => pct(c.toques_ultimo_terco ?? 0, c.toques_na_bola ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#ec4899',
  },

  // ═══════════════════════════════════════════════════════════════
  // DRIBLE E CONDUÇÃO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'drible_acerto',
    title: '% Acerto de Dribles',
    description: 'Dribles certos ÷ tentativas de drible',
    metricDescription: 'Percentual de dribles bem-sucedidos',
    categoryId: 'drible',
    eventIds: ['dribles_certos', 'dribles_errados'],
    compute: (c) => pct(c.dribles_certos ?? 0, sum(c.dribles_certos ?? 0, c.dribles_errados ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#f97316',
  },
  {
    id: 'drible_perda_por_conducao',
    title: 'Ratio Condução x Perda',
    description: 'Conduções progressivas ÷ perdas em condução',
    metricDescription: 'Para cada perda, quantas conduções progressivas o jogador fez',
    categoryId: 'drible',
    eventIds: ['conducoes_progressivas', 'perda_bola_conducao'],
    compute: (c) => ratio(c.conducoes_progressivas ?? 0, c.perda_bola_conducao ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: 'x',
    yAxisLabel: 'Ratio',
    color: '#14b8a6',
  },

  // ═══════════════════════════════════════════════════════════════
  // DEFESA
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'defesa_desarme_acerto',
    title: '% Desarmes com Posse',
    description: 'Desarmes com posse ÷ tentativas de desarme',
    metricDescription: 'Percentual de desarmes que resultaram em recuperação da bola',
    categoryId: 'defesa',
    eventIds: ['desarme_com_posse', 'desarme_sem_posse'],
    compute: (c) => {
      const total = sum(c.desarme_com_posse ?? 0, c.desarme_sem_posse ?? 0);
      return pct(c.desarme_com_posse ?? 0, total);
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#3b82f6',
  },
  {
    id: 'defesa_acoes_total',
    title: 'Total de Ações Defensivas',
    description: 'Desarmes + interceptações + cortes + rebatidas + recuperações',
    metricDescription: 'Volume de ações defensivas realizadas',
    categoryId: 'defesa',
    eventIds: ['desarme_com_posse', 'interceptacoes', 'cortes', 'rebatidas', 'recuperacoes_bola'],
    compute: (c) => {
      const total = sum(c.desarme_com_posse ?? 0, c.interceptacoes ?? 0, c.cortes ?? 0, c.rebatidas ?? 0, c.recuperacoes_bola ?? 0);
      return total > 0 ? total : null;
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '',
    yAxisLabel: 'Ações',
    color: '#10b981',
  },
  {
    id: 'defesa_erro_gol_pct',
    title: '% Erros Que Geraram Gol',
    description: 'Erros que geraram gol ÷ total de erros defensivos',
    metricDescription: 'Gravidade dos erros defensivos cometidos',
    categoryId: 'defesa',
    eventIds: ['erro_defensivo', 'erro_gerou_finalizacao', 'erro_gerou_gol'],
    compute: (c) => {
      const total = sum(c.erro_defensivo ?? 0, c.erro_gerou_finalizacao ?? 0, c.erro_gerou_gol ?? 0);
      return pct(c.erro_gerou_gol ?? 0, total);
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#ef4444',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRANSIÇÃO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'transicao_finalizacao_pct',
    title: '% Contra-Ataques Finalizados',
    description: 'Contra-ataques finalizados ÷ iniciados',
    metricDescription: 'Aproveitamento dos contra-ataques iniciados',
    categoryId: 'transicao',
    eventIds: ['contra_ataques_iniciados', 'contra_ataques_finalizados'],
    compute: (c) => pct(c.contra_ataques_finalizados ?? 0, c.contra_ataques_iniciados ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#f59e0b',
  },
  {
    id: 'transicao_conversao_gol_pct',
    title: '% Contra-Ataques em Gol',
    description: 'Gols em contra-ataque ÷ contra-ataques finalizados',
    metricDescription: 'Taxa de conversão dos contra-ataques em gol',
    categoryId: 'transicao',
    eventIds: ['contra_ataques_finalizados', 'contra_ataques_gol'],
    compute: (c) => pct(c.contra_ataques_gol ?? 0, c.contra_ataques_finalizados ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#10b981',
  },

  // ═══════════════════════════════════════════════════════════════
  // POSSE DE BOLA
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'posse_recuperacao_pct',
    title: '% Recuperações vs Perdas',
    description: 'Recuperações ÷ (recuperações + perdas)',
    metricDescription: 'Qual a proporção entre recuperar e perder a posse',
    categoryId: 'posse',
    eventIds: ['recuperacoes_posse', 'perdas_posse'],
    compute: (c) => pct(c.recuperacoes_posse ?? 0, sum(c.recuperacoes_posse ?? 0, c.perdas_posse ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#6366f1',
  },

  // ═══════════════════════════════════════════════════════════════
  // DUELOS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'duelos_acerto',
    title: '% Duelos Ganhos',
    description: 'Duelos ganhos ÷ total de duelos',
    metricDescription: 'Taxa de sucesso nos duelos disputados',
    categoryId: 'duelos',
    eventIds: ['duelos_ganhos', 'duelos_perdidos'],
    compute: (c) => pct(c.duelos_ganhos ?? 0, sum(c.duelos_ganhos ?? 0, c.duelos_perdidos ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#f97316',
  },
  {
    id: 'duelos_ofensivo_pct',
    title: '% Duelos Ofensivos Ganhos',
    description: 'Duelos ofensivos ganhos ÷ total de duelos ganhos',
    metricDescription: 'Qual parte dos duelos ganhos foi no setor ofensivo',
    categoryId: 'duelos',
    eventIds: ['duelos_ofensivos_ganhos', 'duelos_defensivos_ganhos'],
    compute: (c) => pct(c.duelos_ofensivos_ganhos ?? 0, sum(c.duelos_ofensivos_ganhos ?? 0, c.duelos_defensivos_ganhos ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#ec4899',
  },

  // ═══════════════════════════════════════════════════════════════
  // DISCIPLINA
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'disciplina_faltas_cometidas',
    title: 'Faltas Cometidas por Jogador',
    description: 'Total de faltas cometidas',
    metricDescription: 'Ranking de faltas — quem comete mais infrações',
    categoryId: 'disciplina',
    eventIds: ['faltas_cometidas'],
    compute: (c) => (c.faltas_cometidas ?? 0) > 0 ? c.faltas_cometidas : null,
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '',
    yAxisLabel: 'Faltas',
    color: '#ef4444',
  },
  {
    id: 'disciplina_cartoes_total',
    title: 'Índice de Cartões',
    description: 'Amarelos + vermelhos (vermelho = 2 pts)',
    metricDescription: 'Índice disciplinar ponderado — vermelho vale 2x amarelo',
    categoryId: 'disciplina',
    eventIds: ['cartao_amarelo', 'cartao_vermelho'],
    compute: (c) => {
      const idx = (c.cartao_amarelo ?? 0) + (c.cartao_vermelho ?? 0) * 2;
      return idx > 0 ? idx : null;
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '',
    yAxisLabel: 'Pts',
    color: '#f59e0b',
  },
  {
    id: 'disciplina_penalti_pct',
    title: '% Pênaltis Favoráveis',
    description: 'Pênaltis sofridos ÷ (sofridos + cometidos)',
    metricDescription: 'Quanto dos pênaltis envolvendo o jogador foram a favor',
    categoryId: 'disciplina',
    eventIds: ['penalti_sofrido', 'penalti_cometido'],
    compute: (c) => pct(c.penalti_sofrido ?? 0, sum(c.penalti_sofrido ?? 0, c.penalti_cometido ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#8b5cf6',
  },

  // ═══════════════════════════════════════════════════════════════
  // BOLA PARADA
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'bola_parada_escanteios_pct',
    title: '% Escanteios Certos',
    description: 'Escanteios certos ÷ escanteios cobrados',
    metricDescription: 'Qualidade nas cobranças de escanteio',
    categoryId: 'bola_parada',
    eventIds: ['escanteios_certos', 'escanteios_errados'],
    compute: (c) => pct(c.escanteios_certos ?? 0, sum(c.escanteios_certos ?? 0, c.escanteios_errados ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#06b6d4',
  },
  {
    id: 'bola_parada_faltas_pct',
    title: '% Faltas Certas',
    description: 'Faltas certas ÷ faltas cobradas',
    metricDescription: 'Aproveitamento nas cobranças de falta',
    categoryId: 'bola_parada',
    eventIds: ['faltas_certas', 'faltas_erradas'],
    compute: (c) => pct(c.faltas_certas ?? 0, sum(c.faltas_certas ?? 0, c.faltas_erradas ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#14b8a6',
  },

  // ═══════════════════════════════════════════════════════════════
  // PRESSÃO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pressao_acerto',
    title: '% Pressões Bem-Sucedidas',
    description: 'Pressões bem-sucedidas ÷ pressões realizadas',
    metricDescription: 'Eficiência da pressão aplicada',
    categoryId: 'pressao',
    eventIds: ['pressoes', 'pressoes_bem_sucedidas'],
    compute: (c) => pct(c.pressoes_bem_sucedidas ?? 0, c.pressoes ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#f59e0b',
  },
  {
    id: 'pressao_erro_adversario_pct',
    title: '% Pressões que Geraram Erro',
    description: 'Erros gerados ÷ pressões bem-sucedidas',
    metricDescription: 'Quanto das pressões bem-sucedidas forçaram erro do adversário',
    categoryId: 'pressao',
    eventIds: ['pressoes_bem_sucedidas', 'pressao_gerou_erro'],
    compute: (c) => pct(c.pressao_gerou_erro ?? 0, c.pressoes_bem_sucedidas ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#ef4444',
  },

  // ═══════════════════════════════════════════════════════════════
  // GOLEIRO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'goleiro_defesa_pct',
    title: '% Defesas (Aproveitamento)',
    description: 'Defesas ÷ chutes no gol enfrentados',
    metricDescription: 'Percentual de chutes defendidos — principal métrica do goleiro',
    categoryId: 'goleiro',
    eventIds: ['defesas', 'chutes_sofridos', 'gols_sofridos'],
    compute: (c) => pct(c.defesas ?? 0, c.chutes_sofridos ?? 0),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#3b82f6',
  },
  {
    id: 'goleiro_saida_acerto',
    title: '% Acerto nas Saídas',
    description: 'Saídas corretas ÷ total de saídas',
    metricDescription: 'Qualidade nas decisões de sair do gol',
    categoryId: 'goleiro',
    eventIds: ['saidas_goleiro', 'saidas_erradas'],
    compute: (c) => {
      const total = sum(c.saidas_goleiro ?? 0, c.saidas_erradas ?? 0);
      return pct(c.saidas_goleiro ?? 0, total);
    },
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#10b981',
  },
  {
    id: 'goleiro_reposicao_acerto',
    title: '% Acerto na Reposição',
    description: 'Reposições certas ÷ total de reposições',
    metricDescription: 'Eficiência na distribuição após defesas',
    categoryId: 'goleiro',
    eventIds: ['reposicao_certa', 'reposicao_errada'],
    compute: (c) => pct(c.reposicao_certa ?? 0, sum(c.reposicao_certa ?? 0, c.reposicao_errada ?? 0)),
    chartType: 'bar',
    defaultGroupBy: 'player',
    yAxisSuffix: '%',
    yAxisLabel: '%',
    color: '#8b5cf6',
  },
];

export function getPresetsForCategory(categoryId: string): ChartPreset[] {
  return CHART_PRESETS.filter((p) => p.categoryId === categoryId);
}
