import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'preferences';

export type VisualTheme = 'fire' | 'void' | 'ember' | 'glacier' | 'abyss' | 'solar' | 'aurora' | 'dusk' | 'nebula';

export interface Preferences {
  onboardingComplete: boolean;
  visualTheme?: VisualTheme;
  seenPassiveInstruction?: boolean;
  seenActiveInstruction?: boolean;
  // Set by BattleScreen on session end (won/gaveIn). Read once by HomeScreen on return,
  // then cleared. Go Back and early-win paths do not set this — they show default taglines.
  lastSessionResult?: 'won' | 'gaveIn';
  // Populated by IAP in Phase 3 (P3-07). Reserved here so the data model is ready.
  unlockedThemes?: VisualTheme[];
}

export async function getPreferences(): Promise<Preferences | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Preferences;
  } catch {
    return null;
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[preferences] savePreferences failed:', e);
  }
}
