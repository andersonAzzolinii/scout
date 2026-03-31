import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { MainTabNavigator } from './MainTabNavigator';
import type { MainTabParamList } from './MainTabNavigator';

// ─── Screen imports ───────────────────────────────────────────────────────────
import { MatchSetupScreen } from '@/screens/matches/MatchSetupScreen';
import { LiveScoutRouter } from '@/screens/matches/LiveScoutRouter';
import { MatchReportScreen } from '@/screens/matches/MatchReportScreen';
import { ProfileDetailScreen } from '@/screens/profiles/ProfileDetailScreen';
import { EventFormScreen } from '@/screens/profiles/EventFormScreen';
import { TeamDetailScreen } from '@/screens/teams/TeamDetailScreen';
import { PlayerFormScreen } from '@/screens/teams/PlayerFormScreen';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  MatchSetup: { matchId?: string };
  LiveScout: { matchId: string };
  MatchReport: { matchId: string };
  ProfileDetail: { profileId: string };
  EventForm: { profileId: string; categoryId: string; eventId?: string };
  TeamDetail: { teamId: string };
  PlayerForm: { teamId: string; playerId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: '#6366f1',
          background: isDark ? '#030712' : '#f9fafb',
          card: isDark ? '#111827' : '#ffffff',
          text: isDark ? '#f9fafb' : '#111827',
          border: isDark ? '#1f2937' : '#e5e7eb',
          notification: '#6366f1',
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="MatchSetup"
          component={MatchSetupScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="LiveScout"
          component={LiveScoutRouter}
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="MatchReport" component={MatchReportScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
        <Stack.Screen
          name="EventForm"
          component={EventFormScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
        <Stack.Screen
          name="PlayerForm"
          component={PlayerFormScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
