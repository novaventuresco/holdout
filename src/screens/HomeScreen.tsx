/**
 * HomeScreen — idle state.
 *
 * Shows the app name, single amber CTA, and current streak.
 * Bottom tab navigation (HOME / HISTORY) is provided by the TabNavigator in App.tsx.
 *
 * useFocusEffect handles two deferred fixes from the pre-navigation build:
 *   F1 — starting guard resets every time this screen gains focus
 *   F2 — streak reloads every time this screen gains focus (e.g. return from Battle)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ThemePackPaywall from '../components/ThemePackPaywall';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { COLORS } from '../constants/colors';
import { HOME_TAGLINES, HOME_WIN_MESSAGES, HOME_GAVE_IN_MESSAGES } from '../constants/coach';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { getSessions } from '../storage/sessions';
import { getCurrentStreak } from '../services/StreakService';
import { getPreferences, savePreferences, type Preferences, type VisualTheme } from '../storage/preferences';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// DEV: set true to bypass all lock checks during development. Must be false before production build.
const DEV_UNLOCK_ALL_THEMES = false;

const FREE_THEMES: VisualTheme[] = ['fire', 'void', 'ember'];
const PREMIUM_THEMES: VisualTheme[] = ['glacier', 'abyss', 'solar', 'aurora', 'dusk', 'nebula'];

// Returns true if the theme is available to this user.
function isUnlocked(id: VisualTheme, prefs: Preferences | null): boolean {
  if (DEV_UNLOCK_ALL_THEMES) return true;
  if (FREE_THEMES.includes(id)) return true;
  return prefs?.unlockedThemes?.includes(id) ?? false;
}

// All 9 themes — 3×3 grid. Free: fire/void/ember. Premium: glacier/abyss/solar/aurora/dusk/nebula.
const THEMES: { id: VisualTheme; label: string; outer: string; inner: string }[] = [
  { id: 'fire',    label: 'FIRE',    outer: '#F5A623', inner: '#FFFFFF' },
  { id: 'void',    label: 'VOID',    outer: '#160440', inner: '#FFFFFF' },
  { id: 'ember',   label: 'EMBER',   outer: '#1A1A1A', inner: '#F5A623' },
  { id: 'glacier', label: 'GLACIER', outer: '#A8DFFF', inner: '#F5A030' },
  { id: 'abyss',   label: 'ABYSS',   outer: '#000814', inner: '#00FFD0' },
  { id: 'solar',   label: 'SOLAR',   outer: '#FFE566', inner: '#7280FF' },
  { id: 'aurora',  label: 'AURORA',  outer: '#00E676', inner: '#E8F5FF' },
  { id: 'dusk',    label: 'DUSK',    outer: '#FF4081', inner: '#FFD740' },
  { id: 'nebula',  label: 'NEBULA',  outer: '#9C27B0', inner: '#40C4FF' },
];

const THEME_ROWS = [THEMES.slice(0, 3), THEMES.slice(3, 6), THEMES.slice(6)];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const [streak, setStreak] = useState(0);
  const [starting, setStarting] = useState(false);
  const [theme, setTheme] = useState<VisualTheme>('fire');
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [tagline, setTagline] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<VisualTheme | null>(null);
  const prefsRef = useRef<Preferences | null>(null);

  // F1 + F2: Reset starting guard and reload streak + theme on every focus.
  // Covers initial mount and every return from BattleScreen.
  // Also reads lastSessionResult from prefs to show context-aware tagline (won/gaveIn/default),
  // then clears it so it only appears once on the immediate return.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setStarting(false);
      getSessions().then((sessions) => {
        if (!mounted) return;
        setStreak(getCurrentStreak(sessions));
      });
      getPreferences().then((p) => {
        if (!mounted) return;
        setPrefs(p);
        prefsRef.current = p;
        setTheme(p?.visualTheme ?? 'fire');

        const result = p?.lastSessionResult;
        if (result === 'won') {
          setTagline(HOME_WIN_MESSAGES[Math.floor(Math.random() * HOME_WIN_MESSAGES.length)]);
        } else if (result === 'gaveIn') {
          setTagline(HOME_GAVE_IN_MESSAGES[Math.floor(Math.random() * HOME_GAVE_IN_MESSAGES.length)]);
        } else {
          setTagline(HOME_TAGLINES[Math.floor(Math.random() * HOME_TAGLINES.length)]);
        }

        // Clear so the post-session message shows exactly once
        if (result && p) {
          savePreferences({ ...p, lastSessionResult: undefined }); // fire-and-forget
        }
      });
      return () => { mounted = false; };
    }, [])
  );

  function handleUnlock() {
    const p = prefsRef.current;
    const updated: Preferences = {
      ...(p ?? { onboardingComplete: true }),
      unlockedThemes: PREMIUM_THEMES,
      ...(pendingTheme ? { visualTheme: pendingTheme } : {}),
    };
    savePreferences(updated);
    setPrefs(updated);
    prefsRef.current = updated;
    if (pendingTheme) setTheme(pendingTheme);
    setPendingTheme(null);
    setShowPaywall(false);
  }

  async function handleThemeSelect(t: VisualTheme) {
    if (!isUnlocked(t, prefs)) { setPendingTheme(t); setShowPaywall(true); return; }
    setTheme(t);
    // prefs may be null during the brief window before getPreferences() resolves.
    // Fall back to a fresh read so the selection is always persisted.
    const p = prefs ?? await getPreferences();
    if (p) {
      savePreferences({ ...p, visualTheme: t });
    } else {
      // AsyncStorage unavailable — save minimal prefs so selection is not silently dropped.
      savePreferences({ onboardingComplete: true, visualTheme: t });
    }
  }

  function handleStart() {
    if (starting) return;
    setStarting(true);
    navigation.navigate('Battle');
  }

  function handleSettings() {
    navigation.navigate('Settings');
  }

  return (
    <SafeAreaView style={styles.container}>
      {showPaywall && (
        <ThemePackPaywall
          onUnlock={handleUnlock}
          onClose={() => { setShowPaywall(false); setPendingTheme(null); }}
        />
      )}
      <View style={styles.header}>
        <Text style={styles.appName}>CRAVING HOLDOUT</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
          activeOpacity={0.7}
          accessibilityLabel="About"
          accessibilityRole="button"
        >
          <Ionicons name="information-circle-outline" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>
      <Text style={styles.tagline}>{tagline}</Text>

      <View style={styles.centerContent}>
        <View style={styles.themePicker}>
          {THEME_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.themeRow}>
              {row.map((t) => {
                const unlocked = isUnlocked(t.id, prefs);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.themeOption}
                    onPress={() => handleThemeSelect(t.id)}
                    activeOpacity={unlocked ? 0.75 : 1}
                    accessibilityLabel={`${t.label} visual theme${unlocked ? '' : ', locked'}`}
                    accessibilityRole="button"
                  >
                    <View style={[styles.themeSwatch, { backgroundColor: t.outer, borderColor: theme === t.id ? COLORS.AMBER : '#2A2A2A', borderWidth: theme === t.id ? 2 : 1, opacity: unlocked ? 1 : 0.45 }]}>
                      <View style={[styles.themeSwatchInner, { backgroundColor: t.inner }]} />
                      {!unlocked && (
                        <View style={styles.lockOverlay}>
                          <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.9)" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeLabel, theme === t.id && styles.themeLabelActive, !unlocked && styles.themeLabelLocked]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, starting && styles.ctaButtonDisabled]}
          onPress={handleStart}
          activeOpacity={0.85}
          disabled={starting}
          accessibilityLabel="Start a craving session"
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>I'M HAVING A CRAVING</Text>
        </TouchableOpacity>

        <View style={styles.streakContainer}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>STREAK</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  appName: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 32,
  },
  tagline: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 4,
  },
  ctaButton: {
    backgroundColor: COLORS.AMBER,
    borderRadius: 10,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: COLORS.TEXT_ON_AMBER,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  streakContainer: {
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 68,
  },
  streakLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  themePicker: {
    gap: 16,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  themeOption: {
    alignItems: 'center',
    gap: 8,
  },
  themeSwatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  themeLabelActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  themeLabelLocked: {
    opacity: 0.35,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
});
