import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Switch,
  useColorScheme,
} from 'react-native';
import { CustomWidget, WidgetType, ComparisonMode, AggregationMode } from '@/types/dashboard.types';
import {
  getAvailablePlayers,
  getAvailableTeams,
  getAvailableCategories,
  getAvailableEvents,
  getAvailableMatches,
} from '@/database/repositories/statsRepository';

// Dropdown
interface DropOption { value: string; label: string; }
interface DropdownProps {
  value: string;
  options: DropOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  colors: Record<string, string>;
}
function DropdownField({ value, options, onChange, placeholder = 'Todos', colors }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={[dd.trigger, { backgroundColor: colors.input, borderColor: open ? colors.primary : colors.border }]}
      >
        <Text style={{ flex: 1, color: selected ? colors.text : colors.placeholder }} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{open ? '\u25b2' : '\u25bc'}</Text>
      </Pressable>
      {open && (
        <View style={[dd.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView nestedScrollEnabled bounces={false} style={{ maxHeight: 180 }}>
            <Pressable
              onPress={() => { onChange(''); setOpen(false); }}
              style={[dd.option, !value && { backgroundColor: colors.primaryBg }]}
            >
              <Text style={{ color: !value ? colors.primary : colors.textSecondary }}>{placeholder}</Text>
              {!value && <Text style={{ color: colors.primary, fontSize: 12 }}>{'\u2713'}</Text>}
            </Pressable>
            {options.map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                style={[dd.option, value === opt.value && { backgroundColor: colors.primaryBg }]}
              >
                <Text style={{ flex: 1, color: value === opt.value ? colors.primary : colors.text }} numberOfLines={1}>
                  {opt.label}
                </Text>
                {value === opt.value && <Text style={{ color: colors.primary, fontSize: 12 }}>{'\u2713'}</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
const dd = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8, borderWidth: 1 },
  list: { borderRadius: 8, borderWidth: 1, marginTop: 4, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  option: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

// Config
const CHART_TYPES: Array<{ value: WidgetType; label: string; icon: string }> = [
  { value: 'bar', label: 'Barras', icon: '\ud83d\udcca' },
  { value: 'pie', label: 'Pizza / Donut', icon: '\ud83e\udd67' },
  { value: 'kpi', label: 'Totalizador', icon: '#' },
];
const GROUP_BY_OPTIONS: DropOption[] = [
  { value: 'players', label: 'Jogador' },
  { value: 'matches', label: 'Partida' },
  { value: 'categories', label: 'Categoria' },
  { value: 'events', label: 'Evento' },
  { value: 'teams', label: 'Time' },
];
const AGGREGATION_OPTIONS: DropOption[] = [
  { value: 'count', label: 'Contagem' },
  { value: 'pct', label: 'Percentual (%)' },
  { value: 'avg', label: 'Media / Partida' },
];

// Modal
interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
  editingWidget?: CustomWidget;
}

export function WidgetBuilderModal({ visible, onClose, onSave, editingWidget }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#000000' : '#f2f2f7',
    card: isDark ? '#1c1c1e' : '#ffffff',
    input: isDark ? '#2c2c2e' : '#f0f0f0',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#8e8e93' : '#6c6c70',
    placeholder: isDark ? '#48484a' : '#aeaeb2',
    border: isDark ? '#38383a' : '#d1d1d6',
    primary: '#30d158',
    primaryBg: isDark ? '#0a2e14' : '#e8f8ed',
  };

  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<WidgetType>('bar');
  const [groupBy, setGroupBy] = useState<ComparisonMode>('players');
  const [aggregation, setAggregation] = useState<AggregationMode>('count');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterPlayerId, setFilterPlayerId] = useState('');
  const [filterMatchId, setFilterMatchId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterEventId, setFilterEventId] = useState('');
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [onlyNegative, setOnlyNegative] = useState(false);

  const [teams, setTeams] = useState<DropOption[]>([]);
  const [players, setPlayers] = useState<DropOption[]>([]);
  const [matches, setMatches] = useState<DropOption[]>([]);
  const [categories, setCategories] = useState<DropOption[]>([]);
  const [events, setEvents] = useState<DropOption[]>([]);

  useEffect(() => {
    if (!visible) return;
    const ts = getAvailableTeams();
    setTeams(ts.map((t: any) => ({ value: t.id, label: t.name })));
    const ps = getAvailablePlayers();
    setPlayers(ps.map((p: any) => ({ value: p.id, label: p.name })));
    const ms = getAvailableMatches();
    setMatches(ms.map((m: any) => ({ value: m.id, label: m.label })));
    const cs = getAvailableCategories();
    setCategories(cs.map((c: any) => ({ value: c.id, label: c.name })));
    if (editingWidget) {
      setTitle(editingWidget.title);
      setChartType(editingWidget.type);
      setGroupBy((editingWidget.groupBy || editingWidget.comparisonMode || 'players') as ComparisonMode);
      setAggregation((editingWidget.aggregation || 'count') as AggregationMode);
      setFilterTeamId(editingWidget.filterTeamId || '');
      setFilterPlayerId(editingWidget.filterPlayerId || '');
      setFilterMatchId(editingWidget.filterMatchId || '');
      const cat = editingWidget.filterCategoryId || '';
      setFilterCategoryId(cat);
      const ev = editingWidget.filterEventId || editingWidget.kpiEventId || '';
      setFilterEventId(ev);
      setOnlyPositive(editingWidget.onlyPositive || false);
      setOnlyNegative(editingWidget.onlyNegative || false);
      loadEvents(cat);
    } else {
      resetForm();
      loadEvents('');
    }
  }, [visible, editingWidget]);

  const loadEvents = (categoryId: string) => {
    const evs = getAvailableEvents(categoryId || undefined);
    setEvents(evs.map((e: any) => ({ value: e.id, label: e.name })));
  };

  const resetForm = () => {
    setTitle('');
    setChartType('bar');
    setGroupBy('players');
    setAggregation('count');
    setFilterTeamId('');
    setFilterPlayerId('');
    setFilterMatchId('');
    setFilterCategoryId('');
    setFilterEventId('');
    setOnlyPositive(false);
    setOnlyNegative(false);
  };

  const handleCategoryChange = (catId: string) => {
    setFilterCategoryId(catId);
    setFilterEventId('');
    loadEvents(catId);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (chartType === 'kpi' && !filterEventId) return;
    const widget: CustomWidget = {
      id: editingWidget?.id || Date.now().toString(),
      title: title.trim(),
      type: chartType,
      groupBy: chartType === 'kpi' ? 'players' : groupBy,
      aggregation,
      filterTeamId: filterTeamId || undefined,
      filterPlayerId: filterPlayerId || undefined,
      filterMatchId: filterMatchId || undefined,
      filterCategoryId: filterCategoryId || undefined,
      filterEventId: filterEventId || undefined,
      onlyPositive,
      onlyNegative,
      comparisonMode: chartType === 'kpi' ? 'players' : groupBy,
      selectedEventIds: filterEventId ? [filterEventId] : [],
      comparedEntityIds: filterPlayerId ? [filterPlayerId] : filterTeamId ? [filterTeamId] : [],
      showValues: true,
      showLegend: true,
      kpiEventId: chartType === 'kpi' ? filterEventId : undefined,
      kpiCalcMode: chartType === 'kpi' ? (aggregation as any) : undefined,
      height: editingWidget?.height || 'medium',
      order: editingWidget?.order,
      createdAt: editingWidget?.createdAt || new Date().toISOString(),
    };
    onSave(widget);
    onClose();
  };

  const canSave = title.trim().length > 0 && (chartType !== 'kpi' || !!filterEventId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {editingWidget ? 'Editar Grafico' : 'Novo Grafico'}
          </Text>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={{ fontSize: 22, color: colors.textSecondary }}>{'\u2715'}</Text>
          </Pressable>
        </View>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.text }]}>Titulo</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Gols por Jogador"
              placeholderTextColor={colors.placeholder}
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            />
          </View>

          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.text }]}>Tipo de Visualizacao</Text>
            <View style={s.typeRow}>
              {CHART_TYPES.map(ct => {
                const active = chartType === ct.value;
                return (
                  <Pressable
                    key={ct.value}
                    onPress={() => setChartType(ct.value)}
                    style={[
                      s.typeCard,
                      { backgroundColor: active ? colors.primaryBg : colors.card, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[s.typeIcon, ct.value === 'kpi' && { fontWeight: '900' }]}>
                      {ct.icon}
                    </Text>
                    <Text style={[s.typeLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                      {ct.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {chartType !== 'kpi' && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.text }]}>Agrupar por (Eixo X)</Text>
              <DropdownField
                value={groupBy}
                options={GROUP_BY_OPTIONS}
                onChange={v => setGroupBy((v || 'players') as ComparisonMode)}
                placeholder="Selecione..."
                colors={colors}
              />
            </View>
          )}

          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.text }]}>Agregacao (Eixo Y)</Text>
            <DropdownField
              value={aggregation}
              options={AGGREGATION_OPTIONS}
              onChange={v => setAggregation((v || 'count') as AggregationMode)}
              placeholder="Contagem"
              colors={colors}
            />
          </View>

          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.text }]}>Filtros (opcional)</Text>
            <View style={[s.filterBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.filterRow}>
                <View style={s.filterCol}>
                  <Text style={[s.filterLabel, { color: colors.textSecondary }]}>Time</Text>
                  <DropdownField value={filterTeamId} options={teams} onChange={setFilterTeamId} placeholder="Todos" colors={colors} />
                </View>
                <View style={s.filterCol}>
                  <Text style={[s.filterLabel, { color: colors.textSecondary }]}>Jogador</Text>
                  <DropdownField value={filterPlayerId} options={players} onChange={setFilterPlayerId} placeholder="Todos" colors={colors} />
                </View>
              </View>
              <View style={[s.filterRow, { marginTop: 12 }]}>
                <View style={s.filterCol}>
                  <Text style={[s.filterLabel, { color: colors.textSecondary }]}>Partida</Text>
                  <DropdownField value={filterMatchId} options={matches} onChange={setFilterMatchId} placeholder="Todas" colors={colors} />
                </View>
                <View style={s.filterCol}>
                  <Text style={[s.filterLabel, { color: colors.textSecondary }]}>Categoria</Text>
                  <DropdownField value={filterCategoryId} options={categories} onChange={handleCategoryChange} placeholder="Todas" colors={colors} />
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={[s.filterLabel, { color: colors.textSecondary }]}>
                  {chartType === 'kpi' ? 'Evento Especifico *' : 'Evento Especifico'}
                </Text>
                <DropdownField value={filterEventId} options={events} onChange={setFilterEventId} placeholder="Todos" colors={colors} />
              </View>
              <View style={[s.toggleRow, { borderTopColor: colors.border }]}>
                <View style={s.toggleItem}>
                  <Switch
                    value={onlyPositive}
                    onValueChange={v => { setOnlyPositive(v); if (v) setOnlyNegative(false); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                  <Text style={[s.toggleLabel, { color: colors.text }]}>So positivas</Text>
                </View>
                <View style={s.toggleItem}>
                  <Switch
                    value={onlyNegative}
                    onValueChange={v => { setOnlyNegative(v); if (v) setOnlyPositive(false); }}
                    trackColor={{ false: colors.border, true: '#ef4444' }}
                    thumbColor="#ffffff"
                  />
                  <Text style={[s.toggleLabel, { color: colors.text }]}>So negativas</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Pressable onPress={onClose} style={[s.footerBtn, { backgroundColor: colors.input }]}>
            <Text style={[s.footerBtnText, { color: colors.text }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={[s.footerBtnPrimary, { backgroundColor: canSave ? colors.primary : colors.border }]}
          >
            <Text style={[s.footerBtnText, { color: canSave ? '#000000' : colors.textSecondary, fontWeight: '700' }]}>
              {editingWidget ? 'Atualizar' : 'Salvar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  typeIcon: { fontSize: 28 },
  typeLabel: { fontSize: 12, fontWeight: '600' },
  filterBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  toggleRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  footerBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  footerBtnPrimary: { flex: 1.5, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  footerBtnText: { fontSize: 15, fontWeight: '600' },
});