/**
 * HistoryScreen — session fight record.
 *
 * Shows stats (win rate, current streak, best streak) and a chronological
 * list of all completed sessions, newest first.
 *
 * Each session is rendered as a horizontal progress bar:
 *   - Won: full-width white bar (20:00)
 *   - Gave-in: partial amber bar proportional to elapsed time
 *   - Milestone ticks cut through the fill at 4/8/12/16 min positions
 *
 * Data reloads on every focus via useFocusEffect (same pattern as HomeScreen).
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../constants/colors';
import { SESSION_DURATION_MS } from '../constants/timing';
import { getSessions, Session } from '../storage/sessions';
import { getCurrentStreak, getBestStreak, calculateWinRate } from '../services/StreakService';

// Milestone positions as % of bar width (4/8/12/16 out of 20 min)
const MILESTONE_POSITIONS = [20, 40, 60, 80];

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  if (sessionDay.getTime() === today.getTime()) return `Today ${timeStr}`;
  if (sessionDay.getTime() === yesterday.getTime()) return `Yesterday ${timeStr}`;
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ` ${timeStr}`
  );
}

function SessionRow({ session }: { session: Session }) {
  const isWon = session.result === 'won';
  const fillPercent = isWon
    ? 100
    : Math.min(100, (session.duration / SESSION_DURATION_MS) * 100);

  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{formatDate(session.startTime)}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${fillPercent}%` as `${number}%`,
              backgroundColor: isWon ? COLORS.WIN : COLORS.AMBER,
            },
          ]}
        />
        {MILESTONE_POSITIONS.map((pos) => (
          <View
            key={pos}
            style={[styles.milestoneTick, { left: `${pos}%` as `${number}%` }]}
          />
        ))}
      </View>
      <Text style={styles.rowDuration}>{formatDuration(session.duration)}</Text>
    </View>
  );
}

interface Stats {
  winRate: number;
  streak: number;
  best: number;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>({ winRate: 0, streak: 0, best: 0 });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        const all = await getSessions();
        if (!mounted) return;
        const completed = all.filter((s): s is Session => s.result !== undefined);
        setStats({
          winRate: calculateWinRate(completed),
          streak: getCurrentStreak(completed),
          best: getBestStreak(completed),
        });
        setSessions([...completed].reverse());
      };
      load();
      return () => { mounted = false; };
    }, [])
  );

  const renderSession = useCallback<ListRenderItem<Session>>(
    ({ item }) => <SessionRow session={item} />,
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>HISTORY</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.winRate}%</Text>
          <Text style={styles.statLabel}>WIN RATE</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.streak}</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.best}</Text>
          <Text style={styles.statLabel}>BEST</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={renderSession}
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyTitle}>No battles yet.</Text>
            <Text style={styles.emptySubtitle}>
              Tap the craving button to start.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  statLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginHorizontal: 0,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  rowDate: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    width: 104,
  },
  barContainer: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.DIVIDER,
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
  },
  milestoneTick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 4,
    backgroundColor: COLORS.BACKGROUND,
  },
  rowDuration: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    width: 40,
    textAlign: 'right',
  },
});
