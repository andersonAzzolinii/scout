import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '@/screens/home/HomeScreen';
// import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { MatchesListScreen } from '@/screens/matches/MatchesListScreen';
import { TeamsListScreen } from '@/screens/teams/TeamsListScreen';
import { ProfilesListScreen } from '@/screens/profiles/ProfilesListScreen';

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Matches: undefined;
  Teams: { openModal?: boolean } | undefined;
  Profiles: { openModal?: boolean } | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  console.log('MainTabNavigator rendering - isDark:', isDark);
  console.log('Safe area insets:', insets);

  const bg = '#f8f9fa'; // Force light background for testing
  const activeTint = '#6366f1';
  const inactiveTint = '#6b7280';
  const border = '#e5e7eb';

  console.log('Tab bar config:', { bg, border, activeTint });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: { 
          fontSize: 12, 
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-line" color={color} size={size} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Matches"
        component={MatchesListScreen}
        options={{
          tabBarLabel: 'Partidas',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsListScreen}
        options={{
          tabBarLabel: 'Times',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profiles"
        component={ProfilesListScreen}
        options={{
          tabBarLabel: 'Perfis',
          tabBarIcon: ({ color, size }) => (
            <Icon name="tune-variant" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
