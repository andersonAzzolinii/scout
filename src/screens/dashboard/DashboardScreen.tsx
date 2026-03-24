import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import {
  DashboardFilters,
  MetricCard,
  DashboardBarChart,
  DashboardLineChart,
  DashboardPieChart,
  PlayerStatsTable,
} from '@/components/dashboard';
import { CustomWidgetCard } from '@/components/dashboard/CustomWidgetCard';
import { WidgetBuilderModal } from '@/components/dashboard/WidgetBuilderModal';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { usePlayerStatistics } from '@/hooks/usePlayerStatistics';
import { useTeamStatistics } from '@/hooks/useTeamStatistics';
import { useMatchStatistics } from '@/hooks/useMatchStatistics';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import type { ComparisonData, CustomWidget } from '@/types/dashboard.types';

export function DashboardScreen() {
  const { activeTab, setActiveTab, isLoading } = useDashboardStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | undefined>();

  const { metrics, refresh: refreshMetrics } = useDashboardMetrics();
  const { stats: playerStats, refresh: refreshPlayers } = usePlayerStatistics();
  const { stats: teamStats, refresh: refreshTeams } = useTeamStatistics();
  const { stats: matchStats, refresh: refreshMatches } = useMatchStatistics();
  
  const { 
    widgets, 
    addWidget, 
    removeWidget, 
    getChartData,
    refresh: refreshWidgets 
  } = useCustomWidgets();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshMetrics(),
      refreshPlayers(),
      refreshTeams(),
      refreshMatches(),
      refreshWidgets(),
    ]);
    setRefreshing(false);
  };

  const handleSaveWidget = (widget: CustomWidget) => {
    addWidget(widget);
    setShowWidgetBuilder(false);
    setEditingWidget(undefined);
  };

  const handleEditWidget = (widget: CustomWidget) => {
    setEditingWidget(widget);
    setShowWidgetBuilder(true);
  };

  const handleDeleteWidget = (id: string) => {
    Alert.alert(
      'Excluir Gráfico',
      'Tem certeza que deseja excluir este gráfico personalizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => removeWidget(id),
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowWidgetBuilder(false);
    setEditingWidget(undefined);
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'players', label: 'Jogadores', icon: '👤' },
    { id: 'teams', label: 'Times', icon: '🏆' },
    { id: 'matches', label: 'Partidas', icon: '⚽' },
  ] as const;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950" edges={['top']}>
      <Header title="Dashboard" showBack />

      {/* Tab Navigation */}
      <View className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4"
        >
          <View className="flex-row gap-2 py-3">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-500'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text
                  className={`font-medium ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4 gap-4">
          {/* Filters */}
          <DashboardFilters />

          {/* Custom Widgets Section (Only in Overview) */}
          {activeTab === 'overview' && widgets.length > 0 && !isLoading && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 px-1">
                📊 Meus Gráficos Personalizados
              </Text>
              {widgets.map((widget) => (
                <CustomWidgetCard
                  key={widget.id}
                  widget={widget}
                  data={getChartData(widget)}
                  onEdit={() => handleEditWidget(widget)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                />
              ))}
            </View>
          )}

          {/* Loading State */}
          {isLoading && !refreshing && (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-neutral-500 dark:text-neutral-400 mt-2">
                Carregando estatísticas...
              </Text>
            </View>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && !isLoading && (
            <OverviewTab
              metrics={metrics}
              playerStats={playerStats}
              teamStats={teamStats}
              matchStats={matchStats}
            />
          )}

          {/* Players Tab */}
          {activeTab === 'players' && !isLoading && (
            <PlayersTab playerStats={playerStats} />
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && !isLoading && (
            <TeamsTab teamStats={teamStats} />
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && !isLoading && (
            <MatchesTab matchStats={matchStats} />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - Add Custom Widget */}
      {activeTab === 'overview' && (
        <TouchableOpacity
          onPress={() => setShowWidgetBuilder(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Text className="text-white text-3xl font-bold">+</Text>
        </TouchableOpacity>
      )}

      {/* Widget Builder Modal */}
      <WidgetBuilderModal
        visible={showWidgetBuilder}
        onClose={handleCloseModal}
        onSave={handleSaveWidget}
        editingWidget={editingWidget}
      />
    </SafeAreaView>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ metrics, playerStats, teamStats, matchStats }: any) {
  // Prepare top players chart data
  const topPlayersData: ComparisonData = {
    labels: playerStats.slice(0, 10).map((p: any) => p.playerName.split(' ')[0]),
    datasets: [
      {
        label: 'Eventos',
        data: playerStats.slice(0, 10).map((p: any) => p.totalEvents),
        color: '#3b82f6',
      },
    ],
  };

  // Prepare events distribution (positive vs negative)
  const totalPositive = playerStats.reduce((sum: number, p: any) => sum + p.positiveEvents, 0);
  const totalNegative = playerStats.reduce((sum: number, p: any) => sum + p.negativeEvents, 0);

  const eventsDistribution = [
    { name: 'Positivos', value: totalPositive, color: '#22c55e' },
    { name: 'Negativos', value: totalNegative, color: '#ef4444' },
  ];

  return (
    <View className="gap-4">
      {/* Metric Cards */}
      <View className="flex-row flex-wrap gap-3">
        {metrics.slice(0, 4).map((metric: any) => (
          <View key={metric.id} className="w-[48%]">
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>

      {/* Top Players Chart */}
      {playerStats.length > 0 && (
        <DashboardBarChart
          title="Top 10 Jogadores - Total de Eventos"
          data={topPlayersData}
          height={250}
          showLegend={false}
        />
      )}

      {/* Events Distribution */}
      {(totalPositive > 0 || totalNegative > 0) && (
        <DashboardPieChart
          title="Distribuição de Eventos"
          data={eventsDistribution}
          height={220}
        />
      )}

      {/* Additional Metrics */}
      <View className="flex-row gap-3">
        {metrics.slice(4).map((metric: any) => (
          <View key={metric.id} className="flex-1">
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Players Tab ─────────────────────────────────────────────────────────────

function PlayersTab({ playerStats }: any) {
  // Top scorers
  const topScorers = [...playerStats]
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, 10);

  const topScorersData: ComparisonData = {
    labels: topScorers.map((p) => p.playerName.split(' ')[0]),
    datasets: [
      {
        label: 'Total',
        data: topScorers.map((p) => p.totalEvents),
        color: '#3b82f6',
      },
      {
        label: 'Positivos',
        data: topScorers.map((p) => p.positiveEvents),
        color: '#22c55e',
      },
    ],
  };

  // Best positive rate (min 5 events)
  const bestRate = [...playerStats]
    .filter((p) => p.totalEvents >= 5)
    .sort((a, b) => b.positiveRate - a.positiveRate)
    .slice(0, 10);

  const bestRateData: ComparisonData = {
    labels: bestRate.map((p) => p.playerName.split(' ')[0]),
    datasets: [
      {
        label: 'Taxa de Acerto (%)',
        data: bestRate.map((p) => p.positiveRate),
        color: '#10b981',
      },
    ],
  };

  return (
    <View className="gap-4">
      {/* Summary Cards */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '1',
              title: 'Total Jogadores',
              value: playerStats.length,
              icon: '👤',
              color: '#8b5cf6',
            }}
          />
        </View>
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '2',
              title: 'Média Eventos',
              value:
                playerStats.length > 0
                  ? (
                      playerStats.reduce((sum: number, p: any) => sum + p.totalEvents, 0) /
                      playerStats.length
                    ).toFixed(1)
                  : '0',
              icon: '📊',
              color: '#3b82f6',
            }}
          />
        </View>
      </View>

      {/* Top Scorers */}
      <DashboardBarChart
        title="Top 10 - Mais Eventos"
        data={topScorersData}
        height={250}
        showLegend
      />

      {/* Best Positive Rate */}
      {bestRate.length > 0 && (
        <DashboardBarChart
          title="Top 10 - Melhor Taxa de Acerto"
          data={bestRateData}
          height={250}
          showLegend={false}
          yAxisSuffix="%"
        />
      )}

      {/* Detailed Table */}
      <PlayerStatsTable stats={playerStats} maxRows={20} />
    </View>
  );
}

// ─── Teams Tab ───────────────────────────────────────────────────────────────

function TeamsTab({ teamStats }: any) {
  const teamsData: ComparisonData = {
    labels: teamStats.map((t: any) => t.teamName),
    datasets: [
      {
        label: 'Eventos Totais',
        data: teamStats.map((t: any) => t.totalEvents),
        color: '#3b82f6',
      },
    ],
  };

  const teamsRateData: ComparisonData = {
    labels: teamStats.map((t: any) => t.teamName),
    datasets: [
      {
        label: 'Taxa de Acerto (%)',
        data: teamStats.map((t: any) => t.positiveRate),
        color: '#10b981',
      },
    ],
  };

  return (
    <View className="gap-4">
      {/* Summary */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '1',
              title: 'Total Times',
              value: teamStats.length,
              icon: '🏆',
              color: '#f59e0b',
            }}
          />
        </View>
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '2',
              title: 'Partidas',
              value: teamStats.reduce((sum: number, t: any) => sum + t.matchesPlayed, 0),
              icon: '⚽',
              color: '#3b82f6',
            }}
          />
        </View>
      </View>

      {/* Total Events by Team */}
      <DashboardBarChart
        title="Eventos por Time"
        data={teamsData}
        height={250}
        showLegend={false}
      />

      {/* Positive Rate by Team */}
      <DashboardBarChart
        title="Taxa de Acerto por Time"
        data={teamsRateData}
        height={250}
        showLegend={false}
        yAxisSuffix="%"
      />

      {/* Team Details */}
      {teamStats.map((team: any) => (
        <View key={team.teamId} className="bg-white dark:bg-neutral-900 rounded-xl p-4">
          <Text className="text-lg font-bold mb-3 dark:text-neutral-100">
            {team.teamName}
          </Text>
          
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {team.matchesPlayed} partidas
              </Text>
            </View>
            <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-green-700 dark:text-green-300">
                {team.totalEvents} eventos
              </Text>
            </View>
            <View className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {team.positiveRate.toFixed(1)}% acertos
              </Text>
            </View>
          </View>

          {/* Top Players */}
          {team.topPlayers.length > 0 && (
            <>
              <Text className="text-sm font-semibold mb-2 dark:text-neutral-300">
                Top Jogadores:
              </Text>
              {team.topPlayers.map((player: any, idx: number) => (
                <View
                  key={player.playerId}
                  className="flex-row items-center justify-between py-2 border-t border-neutral-200 dark:border-neutral-700"
                >
                  <Text className="text-sm dark:text-neutral-300">
                    {idx + 1}. {player.playerName}
                  </Text>
                  <Text className="text-sm font-medium dark:text-neutral-100">
                    {player.totalEvents} eventos
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Matches Tab ─────────────────────────────────────────────────────────────

function MatchesTab({ matchStats }: any) {
  // Events over time
  const matchesOverTime = matchStats
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-15); // Last 15 matches

  const matchesTimeData = {
    labels: matchesOverTime.map((m: any) => {
      const date = new Date(m.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: matchesOverTime.map((m: any) => m.totalEvents),
        color: () => '#3b82f6',
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View className="gap-4">
      {/* Summary */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '1',
              title: 'Total Partidas',
              value: matchStats.length,
              icon: '⚽',
              color: '#3b82f6',
            }}
          />
        </View>
        <View className="flex-1">
          <MetricCard
            metric={{
              id: '2',
              title: 'Média Eventos',
              value:
                matchStats.length > 0
                  ? (
                      matchStats.reduce((sum: number, m: any) => sum + m.totalEvents, 0) /
                      matchStats.length
                    ).toFixed(1)
                  : '0',
              icon: '📊',
              color: '#10b981',
            }}
          />
        </View>
      </View>

      {/* Events Over Time */}
      {matchesOverTime.length > 0 && (
        <View className="bg-white dark:bg-neutral-900 rounded-xl p-4">
          <Text className="text-lg font-semibold mb-4 dark:text-neutral-100">
            Evolução de Eventos (Últimas 15 Partidas)
          </Text>
          {/* Simple line representation - could use LineChart here */}
          <View className="h-40 border-l border-b border-neutral-300 dark:border-neutral-700 justify-end">
            <View className="flex-row items-end justify-between h-full px-2">
              {matchesOverTime.map((match: any, idx: number) => {
                const maxEvents = Math.max(...matchesOverTime.map((m: any) => m.totalEvents));
                const height = maxEvents > 0 ? (match.totalEvents / maxEvents) * 100 : 0;
                return (
                  <View key={idx} className="flex-1 items-center justify-end">
                    <View
                      className="w-4 bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Match List */}
      <Text className="text-lg font-bold dark:text-neutral-100">
        Histórico de Partidas
      </Text>
      {matchStats.map((match: any) => (
        <View
          key={match.matchId}
          className="bg-white dark:bg-neutral-900 rounded-xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold dark:text-neutral-100">
              {match.teamName} vs {match.opponentName}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {new Date(match.date).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              {match.location} • {match.isHome ? 'Casa' : 'Fora'}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {match.totalEvents} eventos
              </Text>
            </View>
            <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-green-700 dark:text-green-300">
                {match.positiveEvents} positivos
              </Text>
            </View>
            <View className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {match.playersUsed} jogadores
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
