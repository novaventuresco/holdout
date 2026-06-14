/**
 * OnboardingScreen — shown once on first launch only.
 *
 * Single screen explaining the science and mechanic before the user's first session.
 * `savePreferences` is called on CTA tap with `onboardingComplete: true`.
 *
 * Props:
 *   onComplete — called after preferences are saved; App.tsx re-renders to HomeScreen
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/colors';
import { savePreferences } from '../storage/preferences';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    if (saving) return;
    setSaving(true);
    try {
      await savePreferences({ onboardingComplete: true });
      onComplete();
    } catch {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.heading}>Ride the wave.</Text>
        <Text style={styles.body}>
          Cravings are finite. They reach a peak and break on their own within 20 minutes, if you don't act on them. Every minute you hold your ground, the pull gets weaker.
          {'\n\n'}
          This app occupies the same part of your brain the craving depends on. You don't have to fight the feeling, you just have to stay balanced until it passes.
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, saving && styles.ctaButtonDisabled]}
          onPress={handleComplete}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.ctaText}>LET'S GO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  heading: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  body: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 48,
  },
  ctaButton: {
    backgroundColor: COLORS.AMBER,
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
