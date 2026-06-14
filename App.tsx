/**
 * App.tsx — entry point, first-run routing, and navigation root.
 *
 * Reads preferences on mount. Renders:
 *   null             — AsyncStorage read in progress (~50ms black screen)
 *   OnboardingScreen — first launch (onboardingComplete: false or no preferences)
 *   NavigationContainer — onboarding complete; hosts tab navigator + Battle modal
 *
 * Navigation structure:
 *   RootStack (NativeStackNavigator)
 *   ├── Tabs (BottomTabNavigator) — Home + History tabs
 *   └── Battle (fullScreenModal) — modal over both tabs; exit via goBack()
 *
 * Orphaned session recovery: any unfinished session is silently deleted before
 * routing into the navigator. Runs in the same init block as the prefs read.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from './src/constants/colors';
import BattleScreen from './src/screens/BattleScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { cancelSession, getActiveSession } from './src/services/SessionService';
import * as SystemUI from 'expo-system-ui';
import { getPreferences } from './src/storage/preferences';

type AppState = 'loading' | 'onboarding' | 'home';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.BACKGROUND },
        tabBarStyle: {
          backgroundColor: COLORS.BACKGROUND,
          borderTopColor: COLORS.DIVIDER,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.AMBER,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'HOME' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'HISTORY' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLORS.BACKGROUND);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // Orphaned session recovery: if a session was left unfinished (app was
        // killed mid-session), silently delete the record — a crash or OS kill
        // is not a voluntary give-in. No history entry, no streak impact.
        const orphan = await getActiveSession();
        if (orphan) {
          await cancelSession(orphan.id);
        }

        const prefs = await getPreferences();
        if (prefs?.onboardingComplete) {
          setAppState('home');
        } else {
          setAppState('onboarding');
        }
      } catch {
        // AsyncStorage failure (low storage, corrupted state, OS error) — default
        // to onboarding so the app is always usable rather than stuck on black screen.
        setAppState('onboarding');
      }
    }
    init();
  }, []);

  if (appState === 'loading') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.background} />
      </GestureHandlerRootView>
    );
  }

  if (appState === 'onboarding') {
    // SafeAreaProvider required here — OnboardingScreen uses SafeAreaView
    // but is outside NavigationContainer (which provides its own provider).
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <OnboardingScreen onComplete={() => setAppState('home')} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // NavigationContainer includes SafeAreaProviderCompat internally —
  // no separate SafeAreaProvider wrapper needed for this branch.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.BACKGROUND },
          }}
        >
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="Battle"
            component={BattleScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});
