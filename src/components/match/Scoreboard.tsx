import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMatchStore } from '@/store/useMatchStore';

interface ScoreboardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isHome: boolean;
  matchTimer?: string;
  period?: 0 | 1 | 2;
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  isHome,
  matchTimer,
  period,
}: ScoreboardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHomeScore, setEditHomeScore] = useState(homeScore.toString());
  const [editAwayScore, setEditAwayScore] = useState(awayScore.toString());
  const { setScore } = useMatchStore();

  const handleSaveScore = () => {
    const newHome = parseInt(editHomeScore) || 0;
    const newAway = parseInt(editAwayScore) || 0;
    setScore(newHome, newAway);
    setShowEditModal(false);
  };

  const getPeriodLabel = () => {
    if (period === 0) return 'Encerrado';
    if (period === 1) return '1º Tempo';
    if (period === 2) return '2º Tempo';
    return '';
  };

  return (
    <View className="bg-slate-800 rounded-lg px-3 py-2 mx-4 mt-2 border border-slate-700">
      {/* Compact Score Display */}
      <View className="flex-row items-center justify-between">
        {/* Home Team */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text 
              className="text-white text-sm font-bold flex-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {homeTeam}
            </Text>
            {isHome && (
              <View className="bg-green-600 rounded px-1.5 py-0.5 ml-1">
                <Text className="text-white text-xs font-semibold">CASA</Text>
              </View>
            )}
          </View>
        </View>

        {/* Score with Timer */}
        <View className="mx-3 items-center">
          <View className="flex-row items-center bg-slate-900 rounded-lg px-3 py-1">
            <Text className="text-green-400 text-xl font-bold">{homeScore}</Text>
            <Text className="text-slate-500 text-lg font-bold mx-2">×</Text>
            <Text className="text-orange-400 text-xl font-bold">{awayScore}</Text>
          </View>
          {matchTimer && (
            <View className="flex-row items-center mt-1">
              <Icon name="clock-outline" size={12} color="#64748b" />
              <Text className="text-slate-500 text-xs ml-1">
                {matchTimer}
              </Text>
              {period !== undefined && period > 0 && (
                <Text className="text-slate-600 text-xs ml-1">• {period}T</Text>
              )}
            </View>
          )}
        </View>

        {/* Away Team */}
        <View className="flex-1">
          <View className="flex-row items-center justify-end">
            {!isHome && (
              <View className="bg-blue-600 rounded px-1.5 py-0.5 mr-1">
                <Text className="text-white text-xs font-semibold">FORA</Text>
              </View>
            )}
            <Text 
              className="text-white text-sm font-bold flex-1 text-right"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {awayTeam}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={() => {
            setEditHomeScore(homeScore.toString());
            setEditAwayScore(awayScore.toString());
            setShowEditModal(true);
          }}
          className="ml-2 bg-slate-700 rounded-lg px-2 py-1.5"
        >
          <Icon name="pencil" size={14} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Edit Score Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <Text className="text-white text-xl font-bold text-center mb-4">
              Ajustar Placar
            </Text>

            {/* Home Score Input */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm mb-2 font-semibold">
                {homeTeam}
              </Text>
              <TextInput
                value={editHomeScore}
                onChangeText={setEditHomeScore}
                keyboardType="numeric"
                className="bg-slate-700 text-white text-2xl text-center rounded-lg px-4 py-3 font-bold border border-slate-600"
              />
            </View>

            {/* Away Score Input */}
            <View className="mb-6">
              <Text className="text-slate-300 text-sm mb-2 font-semibold">
                {awayTeam}
              </Text>
              <TextInput
                value={editAwayScore}
                onChangeText={setEditAwayScore}
                keyboardType="numeric"
                className="bg-slate-700 text-white text-2xl text-center rounded-lg px-4 py-3 font-bold border border-slate-600"
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="flex-1 bg-slate-700 rounded-lg py-3"
              >
                <Text className="text-slate-300 text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveScore}
                className="flex-1 bg-indigo-600 rounded-lg py-3"
              >
                <Text className="text-white text-center font-bold">
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
