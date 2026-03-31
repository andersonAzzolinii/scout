import React from 'react';
import { useMatchStore } from '@/store/useMatchStore';
import { LiveScoutFutsalScreen } from './LiveScoutFutsalScreen';
import { LiveScoutSocietyScreen } from './LiveScoutSocietyScreen';
import { LiveScoutCampoScreen } from './LiveScoutCampoScreen';

/**
 * Router que seleciona o componente apropriado baseado na modalidade da partida
 */
export function LiveScoutRouter() {
  const live = useMatchStore((state) => state.live);
  const sportType = live.match?.sport_type;

  switch (sportType) {
    case 'futsal':
      return <LiveScoutFutsalScreen />;
    case 'society':
      return <LiveScoutSocietyScreen />;
    case 'campo':
      return <LiveScoutCampoScreen />;
    default:
      // Fallback para futsal se não houver modalidade definida
      return <LiveScoutFutsalScreen />;
  }
}
