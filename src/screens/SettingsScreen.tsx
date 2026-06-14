/**
 * SettingsScreen — science info panel + further reading links.
 *
 * Pushed from HomeScreen via navigation.navigate('Settings').
 * Not a tab — uses NativeStack push navigation (back chevron top-left).
 *
 * Theme selection lives on HomeScreen (quick-access picker before a session).
 * IAP unlock wiring is reserved for Phase 3 (P3-07).
 */

import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';

type SettingsNavigation = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigation>();

  function openURL(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ABOUT</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>

        <Text style={styles.scienceParagraph}>
          Habit-driven urges are not about willpower. They are dopamine-driven signals — automatic responses to conditioned cues. The brain fires the wanting signal when a familiar situation appears. The rational mind is not the problem. The pattern is.
        </Text>

        <Text style={styles.scienceParagraph}>
          The signal peaks quickly — usually within the first few minutes — then collapses on its own within 15 to 20 minutes when it isn't reinforced by action. Each time you hold through it without acting, the signal weakens. Not permanently, not all at once, but measurably. The pattern gets a little less automatic.
        </Text>

        <Text style={styles.scienceParagraph}>
          Twenty minutes is not arbitrary. It is the documented hold window from behavioral research — long enough to outlast the signal, short enough to be achievable. The session is that window, made visible.
        </Text>

        {/* Further Reading */}
        <Text style={styles.sectionLabel}>FURTHER READING</Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openURL('https://novaventuresco.github.io/holdout/how-long-do-cravings-last/')}
          activeOpacity={0.6}
          accessibilityRole="link"
        >
          <Text style={styles.linkLabel}>How long do cravings last?</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openURL('https://novaventuresco.github.io/holdout/urge-surfing/')}
          activeOpacity={0.6}
          accessibilityRole="link"
        >
          <Text style={styles.linkLabel}>What is urge surfing?</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        {/* Privacy */}
        <View style={styles.furtherReadingPad} />

        <TouchableOpacity
          style={styles.privacyRow}
          onPress={() => openURL('https://novaventuresco.github.io/holdout/privacy/')}
          activeOpacity={0.6}
          accessibilityRole="link"
        >
          <Text style={styles.privacyLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 36,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  scienceParagraph: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
  },
  linkLabel: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  privacyLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
  },
  furtherReadingPad: {
    height: 24,
  },
  bottomPad: {
    height: 40,
  },
});
