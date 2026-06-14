/**
 * BattleScreen — 20-minute craving battle.
 *
 * Owns all session timing. Orchestrates BattleVisual (SKSL shader), coach lines,
 * win/gave-in state machine, and AppState background handling.
 *
 * UI:
 *   - Progress bar (bottom): amber fill grows left→right over 20 minutes, with
 *     milestone dots at 4/8/12/16 min that light up amber when each is reached.
 *   - Support button (bottom-left, shield icon): on-demand coach line + shockwave pulse.
 *   - Gave In button (bottom-right, X icon): two-stage confirmation with amber breathe glow.
 *   - Coach lines also fire automatically at 4/8/12/16 min (silent, no overlay).
 *   - Milestone dots, coach, and shockwave all fire from checkMilestoneSchedule —
 *     guaranteed to coincide (passedCount SharedValue set from JS, read on UI thread).
 *   - Mode toggle pill (top-center): PASSIVE | ACTIVE tap toggle, visible during running.
 *     Passive = default; center grows naturally over 20 min.
 *     Active = fixed-size center controlled by gyroscope (SpatialBalance physics).
 *
 * Architecture constraints (see patterns.md):
 *   - sessionProgress SharedValue owned here, passed to BattleVisual as prop
 *   - All timing logic lives here — BattleVisual is a pure display component
 *   - 250ms interval writes elapsed progress directly to sessionProgress.value
 *   - Interval reads screenStateRef (not screenState) to avoid stale closures
 *   - onWinAnimationComplete wrapped in useCallback([]) — required for animation stability
 *   - cancelAnimation(sessionProgress) called in useEffect cleanup
 *   - orbX/orbY/centerBoost owned here; SpatialBalance writes them, BattleVisual reads them
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';
import BattleVisual from '../animations/BattleVisual';
import {
  COACH_LINE_DISPLAY_MS,
  GAVE_IN_DRAIN_MS,
  MILESTONE_SCHEDULE,
  SESSION_DURATION_MS,
} from '../constants/timing';
import {
  getCoachMessageForElapsed,
  getEarlyWinMessage,
  getRecommitmentMessage,
  getStartMessage,
  getWinLingersMessage,
  getWinMessage,
} from '../services/CoachService';
import { ACTIVE_INSTRUCTION, PASSIVE_INSTRUCTION } from '../constants/coach';
import {
  abandonSession,
  cancelSession,
  completeSession,
  recordMilestone,
  startSession,
} from '../services/SessionService';
import { getPreferences, savePreferences, Preferences } from '../storage/preferences';

import SpatialBalance from '../components/SpatialBalance';

type BattleNavigation = NativeStackNavigationProp<RootStackParamList, 'Battle'>;
type BattleRoute = RouteProp<RootStackParamList, 'Battle'>;

const MILESTONES = [
  { pct: 0.2, label: '4m' },
  { pct: 0.4, label: '8m' },
  { pct: 0.6, label: '12m' },
  { pct: 0.8, label: '16m' },
] as const;

type ScreenState =
  | 'initializing'    // prefs + startSession running; black screen
  | 'running'         // interval ticking, visual advancing
  | 'won'             // 20 min reached; waiting on win animation
  | 'wonComplete'     // win animation done; DONE / GO AGAIN buttons shown
  | 'gaveIn'          // drain animation running
  | 'gaveInComplete'  // drain done, return button shown
  | 'resumePrompt';   // returned from background after 20+ min; user chooses outcome

export default function BattleScreen() {
  const navigation = useNavigation<BattleNavigation>();
  const route = useRoute<BattleRoute>();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [screenState, setScreenState] = useState<ScreenState>('initializing');
  const [coachLine, setCoachLine] = useState('');
  const [coachKey, setCoachKey] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [confirmingGaveIn, setConfirmingGaveIn] = useState(false);
  const [confirmingEarlyWin, setConfirmingEarlyWin] = useState(false);
  const [confirmingGoBack, setConfirmingGoBack] = useState(false);
  const [theme, setTheme] = useState(0);
  const [activeMode, setActiveMode] = useState(false); // false = passive (default)
  const [orbSizeLabel, setOrbSizeLabel] = useState<'S' | 'M'>('M'); // S = small, M = medium
  const [gravityHigh, setGravityHigh] = useState(false); // false = regular (R), true = strong (S)

  // SharedValues — owned by BattleScreen
  const sessionProgress = useSharedValue(0);  // time-based 0→1 over 20 min
  const orbX = useSharedValue(0);             // pixels from screen centre; written by SpatialBalance
  const orbY = useSharedValue(0);             // pixels from screen centre; written by SpatialBalance
  const centerBoost = useSharedValue(0);      // 0→1; written by SpatialBalance, read by BattleVisual
  const orbFixed = useSharedValue(0);         // 1.0 = active (constant radius), 0.0 = passive — SharedValue so BattleVisual useDerivedValue tracks it reactively
  const orbSize = useSharedValue(1);          // 1.0 = medium, 0.0 = small — only used in active mode
  const edgeContact = useSharedValue(0);      // 0→1 written by SpatialBalance; drives background pressure in BattleVisual
  const coachOpacity = useSharedValue(0);
  const supportGlow = useSharedValue(0);      // brief flash on SUPPORT ME tap
  const confirmGlow = useSharedValue(0);      // slow pulse while gave-in confirmation is active
  const earlyWinGlow = useSharedValue(0);     // slow teal pulse while craving-gone confirmation is active
  const confirmGoBackGlow = useSharedValue(0); // slow white pulse while go-back confirmation is active
  const passedCount = useSharedValue(0);      // how many milestones have fired (0–4)

  // Shared time clock — passed to BattleVisual so the shader has a continuous time source.
  // Throttled to ~30fps to avoid unnecessary GPU submits on the complex SKSL shader.
  // Session-relative: starts at 0 each session, grows to ~400 over 20 min (20*60*1000/3000).
  // _frameTimeStart records the first frame's timestamp; subsequent frames subtract it so
  // time never wraps mid-session regardless of device uptime. The previous % 1000 formula
  // wrapped every 50 min of device uptime, causing all 13 sin() oscillators and the FBM
  // noise coordinate to simultaneously jump — visible as a background/orb flash.
  // useFrameCallback lifecycle: Reanimated 4 automatically deactivates frame callbacks when
  // the host component unmounts (tied to the component's worklet runtime). The return value
  // (FrameCallbackRegistration) does not need to be captured for setActive(false) on unmount.
  const time = useSharedValue(0);
  const _lastFrameTs = useSharedValue(0);
  const _frameTimeStart = useSharedValue(0); // set on first frame; sentinel 0 is impossible as a real timestamp
  useFrameCallback((frameInfo) => {
    'worklet';
    if (frameInfo.timestamp - _lastFrameTs.value < 33) return;
    _lastFrameTs.value = frameInfo.timestamp;
    if (_frameTimeStart.value === 0) {
      _frameTimeStart.value = frameInfo.timestamp;
    }
    time.value = (frameInfo.timestamp - _frameTimeStart.value) / 3000;
  });

  // Progress bar: grows from zero to full-width as session progresses (fill-up toward goal)
  const progressBarStyle = useAnimatedStyle(() => ({
    width: screenWidth * sessionProgress.value,
  }));

  // Milestone dot scale SharedValues — each pops when its threshold is crossed
  const dot0Scale = useSharedValue(1);
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  // Trigger a one-shot scale pulse the moment each milestone is reached.
  // Keyed on passedCount (set from checkMilestoneSchedule) so dot pop,
  // coach line, and shockwave all fire from the same event.
  useAnimatedReaction(
    () => passedCount.value >= 1,
    (isLit, wasLit) => { if (isLit && !wasLit) dot0Scale.value = withSequence(withTiming(1.8, { duration: 100 }), withTiming(1.0, { duration: 300 })); },
  );
  useAnimatedReaction(
    () => passedCount.value >= 2,
    (isLit, wasLit) => { if (isLit && !wasLit) dot1Scale.value = withSequence(withTiming(1.8, { duration: 100 }), withTiming(1.0, { duration: 300 })); },
  );
  useAnimatedReaction(
    () => passedCount.value >= 3,
    (isLit, wasLit) => { if (isLit && !wasLit) dot2Scale.value = withSequence(withTiming(1.8, { duration: 100 }), withTiming(1.0, { duration: 300 })); },
  );
  useAnimatedReaction(
    () => passedCount.value >= 4,
    (isLit, wasLit) => { if (isLit && !wasLit) dot3Scale.value = withSequence(withTiming(1.8, { duration: 100 }), withTiming(1.0, { duration: 300 })); },
  );

  // Dot animated styles — amber glow when lit, scale pulse on transition.
  // Reads passedCount (not sessionProgress) so dots are always in sync with coach + pulse.
  const dot0Style = useAnimatedStyle(() => {
    const lit = passedCount.value >= 1;
    return {
      backgroundColor: lit ? COLORS.AMBER : 'rgba(255,255,255,0.2)',
      opacity: lit ? 1.0 : 0.5,
      shadowColor: COLORS.AMBER,
      shadowRadius: lit ? 6 : 0,
      shadowOpacity: lit ? 0.85 : 0,
      shadowOffset: { width: 0, height: 0 },
      transform: [{ scale: dot0Scale.value }],
    };
  });
  const dot1Style = useAnimatedStyle(() => {
    const lit = passedCount.value >= 2;
    return {
      backgroundColor: lit ? COLORS.AMBER : 'rgba(255,255,255,0.2)',
      opacity: lit ? 1.0 : 0.5,
      shadowColor: COLORS.AMBER,
      shadowRadius: lit ? 6 : 0,
      shadowOpacity: lit ? 0.85 : 0,
      shadowOffset: { width: 0, height: 0 },
      transform: [{ scale: dot1Scale.value }],
    };
  });
  const dot2Style = useAnimatedStyle(() => {
    const lit = passedCount.value >= 3;
    return {
      backgroundColor: lit ? COLORS.AMBER : 'rgba(255,255,255,0.2)',
      opacity: lit ? 1.0 : 0.5,
      shadowColor: COLORS.AMBER,
      shadowRadius: lit ? 6 : 0,
      shadowOpacity: lit ? 0.85 : 0,
      shadowOffset: { width: 0, height: 0 },
      transform: [{ scale: dot2Scale.value }],
    };
  });
  const dot3Style = useAnimatedStyle(() => {
    const lit = passedCount.value >= 4;
    return {
      backgroundColor: lit ? COLORS.AMBER : 'rgba(255,255,255,0.2)',
      opacity: lit ? 1.0 : 0.5,
      shadowColor: COLORS.AMBER,
      shadowRadius: lit ? 6 : 0,
      shadowOpacity: lit ? 0.85 : 0,
      shadowOffset: { width: 0, height: 0 },
      transform: [{ scale: dot3Scale.value }],
    };
  });
  const dotStyles = [dot0Style, dot1Style, dot2Style, dot3Style];

  // Refs — stable values readable from interval and AppState callbacks
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(0);
  const screenStateRef = useRef<ScreenState>('initializing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const computedScheduleRef = useRef<number[]>([]);
  const milestoneIndexRef = useRef<number>(0);
  const backgroundEnteredAt = useRef<number | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const earlyWinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmGoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wonLingersTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outcomeFiredRef = useRef(false); // shared guard — any terminal outcome (DONE / GO AGAIN / GAVE IN from resumePrompt)
                                         // fires at most once; prevents cross-button double-fire in wonComplete + resumePrompt
  const isEarlyWinRef = useRef(false);  // set by handleEarlyWin; skips wonComplete/GO AGAIN on animation complete
  const activeModeRef = useRef(false); // mirrors activeMode for interval closures (avoids stale capture)
  const prefsRef = useRef<Preferences | null>(null); // loaded in init(); read by handleModeToggle for first-use instruction checks
  const supportMeTapCountRef = useRef(0); // counts SUPPORT ME taps this session; routes first vs. repeat coach tier
  // Cumulative elapsed from any prior GO AGAIN sessions. Passed as priorElapsedMs route param
  // when GO AGAIN fires; read here so completeSession/abandonSession record total held time.
  // Captured once at mount — correct because navigation.replace always mounts a fresh instance.
  // Do not re-read route.params after mount: params are stable for the screen's lifetime.
  const priorElapsedMsRef = useRef<number>(Math.max(0, route.params?.priorElapsedMs ?? 0));
  const edgeStuckSinceRef = useRef<number | null>(null); // timestamp when orb first entered stuck-at-edge zone
  const lastEdgeInstructionAt = useRef<number>(0);       // cooldown: timestamp of last edge re-instruction

  // Sync state → refs so interval closures always read current values
  useEffect(() => {
    screenStateRef.current = screenState;
  }, [screenState]);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Coach line: fade in whenever coachKey changes (not coachLine text —
  // avoids the case where the same string is set twice, which wouldn't re-trigger
  // a state change and thus wouldn't replay the fade animation).
  useEffect(() => {
    if (!coachLine) return;
    coachOpacity.value = 0;
    coachOpacity.value = withTiming(1, { duration: 300 });
    const timer = setTimeout(() => {
      coachOpacity.value = withTiming(0, { duration: 500 });
    }, COACH_LINE_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [coachKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const coachLineStyle = useAnimatedStyle(() => ({ opacity: coachOpacity.value }));

  // Support button: brief amber glow flash on each tap
  const supportGlowStyle = useAnimatedStyle(() => ({
    shadowColor: COLORS.AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10 * supportGlow.value,
    shadowOpacity: 0.9 * supportGlow.value,
  }));

  // Gave-in button: slow amber breathe while awaiting confirmation
  const confirmGlowStyle = useAnimatedStyle(() => ({
    shadowColor: COLORS.AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12 * confirmGlow.value,
    shadowOpacity: 0.85 * confirmGlow.value,
  }));

  // Craving-gone button: slow teal breathe while awaiting confirmation
  const earlyWinGlowStyle = useAnimatedStyle(() => ({
    shadowColor: 'rgb(0, 200, 180)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12 * earlyWinGlow.value,
    shadowOpacity: 0.85 * earlyWinGlow.value,
  }));

  // Go Back button: slow white breathe while awaiting confirmation
  const confirmGoBackGlowStyle = useAnimatedStyle(() => ({
    shadowColor: COLORS.TEXT_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12 * confirmGoBackGlow.value,
    shadowOpacity: 0.6 * confirmGoBackGlow.value,
  }));

  // Start/stop the craving-gone confirmation breathe animation
  useEffect(() => {
    if (confirmingEarlyWin) {
      earlyWinGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 700 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(earlyWinGlow);
      earlyWinGlow.value = withTiming(0, { duration: 200 });
    }
  }, [confirmingEarlyWin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop the go-back confirmation breathe animation
  useEffect(() => {
    if (confirmingGoBack) {
      confirmGoBackGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 700 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(confirmGoBackGlow);
      confirmGoBackGlow.value = withTiming(0, { duration: 200 });
    }
  }, [confirmingGoBack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop the confirmation breathe animation
  useEffect(() => {
    if (confirmingGaveIn) {
      confirmGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 700 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(confirmGlow);
      confirmGlow.value = withTiming(0, { duration: 200 });
    }
  }, [confirmingGaveIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Timer helpers ---

  function stopInterval() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // --- Terminal state handlers ---

  function handleWon() {
    stopInterval();
    setScreenState('won');
    screenStateRef.current = 'won';
    setCoachLine(getWinMessage());
    setCoachKey((k) => k + 1);
    // Session is NOT recorded here. Deferred to the user's explicit choice:
    //   DONE → completeSession (handleDone)
    //   GO AGAIN → cancelSession + fresh screen (handleGoAgain)
    // This way history and HomeScreen reflect one outcome for the whole experience.
  }

  function handleGaveIn() {
    stopInterval();
    setScreenState('gaveIn');
    screenStateRef.current = 'gaveIn';
    if (sessionIdRef.current) {
      abandonSession(sessionIdRef.current, priorElapsedMsRef.current); // fire-and-forget
    }
    if (prefsRef.current) {
      const updated = { ...prefsRef.current, lastSessionResult: 'gaveIn' as const };
      savePreferences(updated); // fire-and-forget
      prefsRef.current = updated;
    }
    sessionProgress.value = withTiming(0, { duration: GAVE_IN_DRAIN_MS }, () => {
      runOnJS(setScreenState)('gaveInComplete');
    });
  }

  function handleResumeGaveIn() {
    if (outcomeFiredRef.current) return;
    outcomeFiredRef.current = true;
    handleGaveIn();
  }

  // Required: useCallback([]) ensures stable reference across renders.
  // BattleVisual captures this in a useAnimatedReaction worklet — an unstable
  // reference interrupts the win animation sequence mid-flight.
  const handleWinComplete = useCallback(() => {
    // Early win (Craving Gone): craving is already gone — no need to offer GO AGAIN.
    // Navigate back directly so the win message shows on HomeScreen.
    if (isEarlyWinRef.current) {
      navigation.goBack();
      return;
    }
    setScreenState('wonComplete');
    screenStateRef.current = 'wonComplete';
    // Win coach line was set at T=0 with a 7s display timer. Win animation is 5s;
    // wonComplete fires at ~T=5000ms. Delay 2000ms so the lingering line fires at T≈7000ms.
    // Sequence at T≈7000ms: (1) win line's fade timer fires → coachOpacity withTiming(0) starts;
    // (2) winLingers setTimeout fires → setCoachKey triggers coachKey useEffect;
    // (3) useEffect runs: coachOpacity.value = 0 overrides the in-progress withTiming(0)
    //     within one frame; clearTimeout on the already-fired 7s timer is a no-op.
    // The override (direct value write) is the actual cancellation mechanism, not clearTimeout.
    wonLingersTimerRef.current = setTimeout(() => {
      setCoachLine(getWinLingersMessage());
      setCoachKey((k) => k + 1);
    }, 2000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = useCallback(() => {
    if (outcomeFiredRef.current) return; // shared guard — DONE / GO AGAIN / GAVE IN from resumePrompt fire at most once
    outcomeFiredRef.current = true;
    // Record the session as won now that the user has confirmed they're finished.
    if (sessionIdRef.current) {
      completeSession(sessionIdRef.current, priorElapsedMsRef.current); // fire-and-forget
      sessionIdRef.current = null; // null after finalizing — defensive consistency with Go Back pattern
    }
    // Prefs save is intentionally outside the sessionId guard — HomeScreen reads
    // lastSessionResult on focus, so it should update even in the unlikely case
    // where sessionIdRef.current is null (init() failure). No session record would
    // exist, but the win message is harmless. Both saves succeed or fail independently.
    if (prefsRef.current) {
      const updated = { ...prefsRef.current, lastSessionResult: 'won' as const };
      savePreferences(updated); // fire-and-forget
      prefsRef.current = updated;
    }
    navigation.goBack();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoAgain = useCallback(() => {
    if (outcomeFiredRef.current) return; // shared guard — DONE / GO AGAIN / GAVE IN from resumePrompt fire at most once
    outcomeFiredRef.current = true;
    // Cancel the first session record — not yet won. The fresh screen records its own outcome.
    // Null the ref first so the unmount path doesn't race with cancelSession.
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    // cancelSession → deleteSession sets _cache synchronously before the AsyncStorage write,
    // so the fresh screen's getActiveSession() will not find this record even if init() runs
    // before the AsyncStorage write completes. Race safety depends on this cache contract in sessions.ts.
    if (id) cancelSession(id); // fire-and-forget; removes the pending session from storage
    // Pass cumulative elapsed (all prior GO AGAIN sessions + this full 20-min session).
    // Chains correctly: if already a GO AGAIN session, priorElapsedMsRef already carries
    // previous sessions, so the total grows with each additional round.
    navigation.replace('Battle', {
      priorElapsedMs: priorElapsedMsRef.current + SESSION_DURATION_MS,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Recommitment schedule (silent — coach line + pulse, no overlay) ---

  function checkMilestoneSchedule(elapsed: number) {
    const idx = milestoneIndexRef.current;
    if (idx >= computedScheduleRef.current.length) return;
    if (elapsed < computedScheduleRef.current[idx]) return;

    const minuteMark = MILESTONE_SCHEDULE[idx].minute;
    milestoneIndexRef.current = idx + 1;

    // Sync milestone dot — set passedCount so UI-thread dot animation fires
    // at the exact same moment as the coach line and shockwave pulse.
    passedCount.value = milestoneIndexRef.current;

    setCoachLine(getRecommitmentMessage(minuteMark));
    setCoachKey((k) => k + 1);
    setPulseCount((n) => n + 1);

    if (sessionIdRef.current) {
      recordMilestone(sessionIdRef.current); // fire-and-forget
    }

    // Milestone orb reward (P2-10) — passive mode only.
    // In active mode, SpatialBalance writes centerBoost every 33ms (physics loop), which
    // would overwrite the spike within one tick. Active mode already gets dynamic centerBoost
    // from sanctuary centering — passive mode gets an equivalent burst at each milestone.
    // activeModeRef used (not activeMode) — this runs inside an interval closure.
    if (!activeModeRef.current) {
      // 600ms ease-in so the expansion feels like a pulse, not a flash.
      // 9400ms decay gives the living-color shader cycle (warm→cool→gold) several
      // full cycles to be perceived before centerBoost returns to baseline.
      // Total: 10s. centerBoost stays above 0.5 for ~5s — well within visible range.
      centerBoost.value = withSequence(
        withTiming(1.0, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(0.0, { duration: 9400 }),
      );
    }
  }

  // --- Button handlers ---

  function handleCoachTap() {
    const elapsed = Date.now() - sessionStartRef.current;
    const isRepeat = supportMeTapCountRef.current > 0;
    supportMeTapCountRef.current += 1;
    setCoachLine(getCoachMessageForElapsed(elapsed, isRepeat));
    setCoachKey((k) => k + 1);
    setPulseCount((n) => n + 1);
    // Brief amber glow flash on the button
    supportGlow.value = 0;
    supportGlow.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 600 }),
    );
  }

  function handleGaveInTap() {
    // Cancel any other active confirmation before starting this one
    if (confirmingEarlyWin) {
      if (earlyWinTimerRef.current !== null) { clearTimeout(earlyWinTimerRef.current); earlyWinTimerRef.current = null; }
      setConfirmingEarlyWin(false);
    }
    if (confirmingGoBack) {
      if (confirmGoBackTimerRef.current !== null) { clearTimeout(confirmGoBackTimerRef.current); confirmGoBackTimerRef.current = null; }
      setConfirmingGoBack(false);
    }
    if (!confirmingGaveIn) {
      if (confirmTimerRef.current !== null) { clearTimeout(confirmTimerRef.current); confirmTimerRef.current = null; }
      setConfirmingGaveIn(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmingGaveIn(false);
      }, 3000);
    } else {
      if (confirmTimerRef.current !== null) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      setConfirmingGaveIn(false);
      handleGaveIn();
    }
  }

  function handleEarlyWin() {
    stopInterval();
    isEarlyWinRef.current = true;
    setScreenState('won');
    screenStateRef.current = 'won';
    // Animate amber to full retreat before the white flash sequence starts.
    // WIN_HOLD_CLEAR_MS = 2000ms — this 800ms animation finishes well before the flash.
    // CONSTRAINT: this 800ms duration must stay below WIN_HOLD_CLEAR_MS. If that
    // constant is ever tuned down, reduce this duration to match.
    // completeSession is called immediately so it records the true elapsed duration.
    sessionProgress.value = withTiming(1.0, { duration: 800, easing: Easing.out(Easing.quad) });
    setCoachLine(getEarlyWinMessage());
    setCoachKey((k) => k + 1);
    if (sessionIdRef.current) {
      completeSession(sessionIdRef.current, priorElapsedMsRef.current); // fire-and-forget
    }
    if (prefsRef.current) {
      const updated = { ...prefsRef.current, lastSessionResult: 'won' as const };
      savePreferences(updated); // fire-and-forget
      prefsRef.current = updated;
    }
  }

  function handleEarlyWinTap() {
    // Cancel any other active confirmation before starting this one
    if (confirmingGaveIn) {
      if (confirmTimerRef.current !== null) { clearTimeout(confirmTimerRef.current); confirmTimerRef.current = null; }
      setConfirmingGaveIn(false);
    }
    if (confirmingGoBack) {
      if (confirmGoBackTimerRef.current !== null) { clearTimeout(confirmGoBackTimerRef.current); confirmGoBackTimerRef.current = null; }
      setConfirmingGoBack(false);
    }
    if (!confirmingEarlyWin) {
      if (earlyWinTimerRef.current !== null) { clearTimeout(earlyWinTimerRef.current); earlyWinTimerRef.current = null; }
      setConfirmingEarlyWin(true);
      earlyWinTimerRef.current = setTimeout(() => {
        setConfirmingEarlyWin(false);
      }, 3000);
    } else {
      if (earlyWinTimerRef.current !== null) {
        clearTimeout(earlyWinTimerRef.current);
        earlyWinTimerRef.current = null;
      }
      setConfirmingEarlyWin(false);
      handleEarlyWin();
    }
  }

  function handleGoBackTap() {
    // Cancel any other active confirmation before starting this one
    if (confirmingGaveIn) {
      if (confirmTimerRef.current !== null) { clearTimeout(confirmTimerRef.current); confirmTimerRef.current = null; }
      setConfirmingGaveIn(false);
    }
    if (confirmingEarlyWin) {
      if (earlyWinTimerRef.current !== null) { clearTimeout(earlyWinTimerRef.current); earlyWinTimerRef.current = null; }
      setConfirmingEarlyWin(false);
    }
    if (!confirmingGoBack) {
      if (confirmGoBackTimerRef.current !== null) { clearTimeout(confirmGoBackTimerRef.current); confirmGoBackTimerRef.current = null; }
      setConfirmingGoBack(true);
      confirmGoBackTimerRef.current = setTimeout(() => {
        setConfirmingGoBack(false);
      }, 3000);
    } else {
      if (confirmGoBackTimerRef.current !== null) {
        clearTimeout(confirmGoBackTimerRef.current);
        confirmGoBackTimerRef.current = null;
      }
      setConfirmingGoBack(false);
      if (sessionIdRef.current) {
        cancelSession(sessionIdRef.current); // fire-and-forget
        sessionIdRef.current = null;
      }
      navigation.goBack();
    }
  }

  // --- Mode toggle ---

  function handleModeToggle() {
    // Read activeMode directly — safe in a button handler (not a timer callback).
    // Side effects must NOT go inside a setState updater: React may call updaters
    // multiple times in StrictMode, restarting animations mid-flight.
    if (activeMode) {
      // Switching to passive: snap orb and boost to zero immediately (R-04).
      // withTiming would be cancelled by the next physics tick before unmount (~33ms window).
      orbX.value = 0;
      orbY.value = 0;
      cancelAnimation(centerBoost);
      centerBoost.value = 0;
      edgeContact.value = 0;
      orbFixed.value = 0; // switch shader back to progress-driven radius
      edgeStuckSinceRef.current = null;
    } else {
      orbFixed.value = 1; // switch shader to constant radius before SpatialBalance mounts
      // P2-06: Show active mode instruction on first ever ACTIVE toggle.
      if (!prefsRef.current?.seenActiveInstruction) {
        setCoachLine(ACTIVE_INSTRUCTION);
        setCoachKey((k) => k + 1);
        const updated: Preferences = {
          ...(prefsRef.current ?? { onboardingComplete: true }),
          seenActiveInstruction: true,
        };
        savePreferences(updated); // fire-and-forget
        prefsRef.current = updated;
      }
    }
    setActiveMode(!activeMode);
  }

  // --- Orb size toggle ---

  function handleOrbSizeToggle() {
    const next = orbSizeLabel === 'M' ? 'S' : 'M';
    setOrbSizeLabel(next);
    orbSize.value = next === 'M' ? 1 : 0;
  }

  function handleGravityToggle() {
    setGravityHigh(v => !v);
  }

  // --- Interval ---

  function startInterval() {
    stopInterval();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - sessionStartRef.current;
      sessionProgress.value = Math.min(elapsed / SESSION_DURATION_MS, 1.0);

      if (elapsed >= SESSION_DURATION_MS) {
        stopInterval();
        handleWon();
        return;
      }

      if (screenStateRef.current === 'running') {
        checkMilestoneSchedule(elapsed);

        // Edge-stuck re-instruction: active mode only.
        // If the orb stays near the edge (edgeContact >= 0.7) for 10+ seconds while the
        // app is in the foreground, re-show ACTIVE_INSTRUCTION. 60s cooldown prevents
        // repeated firing if the user remains stuck. backgroundEnteredAt === null means
        // foreground — covers both backgrounding and screen auto-lock (iOS sends
        // 'inactive' before 'background', which sets backgroundEnteredAt in both cases).
        if (activeModeRef.current) {
          const isStuck = edgeContact.value >= 0.7 && backgroundEnteredAt.current === null;
          if (isStuck) {
            const now = Date.now();
            if (edgeStuckSinceRef.current === null) edgeStuckSinceRef.current = now;
            const stuckMs = now - edgeStuckSinceRef.current;
            const cooldownOk = now - lastEdgeInstructionAt.current >= 60_000;
            if (stuckMs >= 10_000 && cooldownOk) {
              setCoachLine(ACTIVE_INSTRUCTION);
              setCoachKey((k) => k + 1);
              edgeStuckSinceRef.current = null;
              lastEdgeInstructionAt.current = now;
            }
          } else {
            edgeStuckSinceRef.current = null;
          }
        } else {
          edgeStuckSinceRef.current = null;
        }
      }
    }, 250);
  }

  // --- AppState background/foreground handling ---

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
    // FRAGILITY NOTE: handleAppStateChange is captured once at mount (empty deps).
    // It is safe because it reads only refs (screenStateRef, backgroundEnteredAt).
    // If a future edit adds a useState read inside handleAppStateChange without a
    // corresponding ref, the closure will silently read stale state. Always use a
    // ref for any value that handleAppStateChange must read as current.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAppStateChange(nextState: AppStateStatus) {
    const state = screenStateRef.current;

    if (nextState === 'background' || nextState === 'inactive') {
      if (state === 'initializing' || state === 'won' || state === 'wonComplete' || state === 'gaveIn' || state === 'gaveInComplete' || state === 'resumePrompt') {
        return;
      }
      backgroundEnteredAt.current = Date.now();
      edgeStuckSinceRef.current = null;
      stopInterval();
      return;
    }

    if (nextState === 'active') {
      if (backgroundEnteredAt.current === null) return;
      if (state === 'initializing') return;
      backgroundEnteredAt.current = null;

      const elapsed = Date.now() - sessionStartRef.current;

      if (elapsed >= SESSION_DURATION_MS) {
        // Must set 0.999 BEFORE any assignment that could reach 1.0 — BattleVisual's
        // useAnimatedReaction fires the instant value crosses >= 1.0 on the UI thread.
        // Setting Math.min(elapsed/SESSION_DURATION_MS, 1.0) first would trigger the
        // win animation before 0.999 could be written. No path from resumePrompt
        // sets value back to 1.0 — DONE and GO AGAIN resolve without a win animation.
        sessionProgress.value = 0.999;
        setScreenState('resumePrompt');
        screenStateRef.current = 'resumePrompt';
        return;
      }

      sessionProgress.value = elapsed / SESSION_DURATION_MS;

      // Fast-forward milestone index past any milestones crossed while backgrounded.
      // Firing them one-per-tick on resume would flood the coach pill with stale messages.
      // Instead: skip silently, fire just the most recent one as a single orientation line.
      const schedule = computedScheduleRef.current;
      let idx = milestoneIndexRef.current;
      let lastCrossedIdx = -1;
      while (idx < schedule.length && elapsed >= schedule[idx]) {
        lastCrossedIdx = idx;
        idx++;
      }
      if (idx > milestoneIndexRef.current) {
        milestoneIndexRef.current = idx;
        passedCount.value = idx; // light dots immediately — no animation needed
        if (lastCrossedIdx >= 0) {
          const minuteMark = MILESTONE_SCHEDULE[lastCrossedIdx].minute;
          setCoachLine(getRecommitmentMessage(minuteMark));
          setCoachKey((k) => k + 1);
          // No pulse/shockwave — orientation only, not a milestone event
        }
      }

      startInterval();
    }
  }

  // --- Mount: init session ---

  useEffect(() => {
    let mounted = true;

    async function init() {
      const prefs = await getPreferences();
      if (!mounted) return;

      prefsRef.current = prefs;

      // DEV RESET — uncomment to re-trigger first-use instructions, then comment back out:
      // await savePreferences({ ...prefs!, seenPassiveInstruction: false, seenActiveInstruction: false });

      const themeMap: Record<string, number> = { fire: 0, void: 1, ember: 2, glacier: 3, abyss: 4, solar: 5, aurora: 6, dusk: 7, nebula: 8 };
      const resolvedTheme = themeMap[prefs?.visualTheme ?? 'fire'] ?? 0;

      const sessionId = await startSession();
      if (!mounted) return;

      sessionIdRef.current = sessionId;
      sessionStartRef.current = Date.now();

      // Compute milestone trigger times with per-session variance (applied once).
      // Scale proportionally to SESSION_DURATION_MS so shortened recording sessions
      // still fire milestones at the correct visual positions (4/8/12/16 out of 20 min).
      const FULL_SESSION_MS = 20 * 60_000;
      MILESTONE_SCHEDULE.forEach(({ minute, varianceSec }) => {
        const base = (minute / 20) * SESSION_DURATION_MS;
        const offset = (Math.random() * 2 - 1) * varianceSec * (SESSION_DURATION_MS / FULL_SESSION_MS) * 1_000;
        computedScheduleRef.current.push(base + offset);
      });

      // P2-06: First session ever → show passive instruction instead of start pool message.
      // Replaces the start coach line on the very first session; subsequent sessions use the pool.
      if (!prefs?.seenPassiveInstruction) {
        setCoachLine(PASSIVE_INSTRUCTION);
        const updated: Preferences = {
          ...(prefs ?? { onboardingComplete: true }),
          seenPassiveInstruction: true,
        };
        savePreferences(updated); // fire-and-forget
        prefsRef.current = updated;
      } else {
        setCoachLine(getStartMessage());
      }

      // F4 fix: setTheme batched with setScreenState in the same synchronous block — React 18
      // merges these into one render so BattleVisual mounts with the correct theme from frame 1.
      setTheme(resolvedTheme);
      setCoachKey((k) => k + 1);  // must increment so coachKey effect re-runs and fades the message in
      setScreenState('running');
      screenStateRef.current = 'running';
      startInterval();
    }

    init();

    return () => {
      mounted = false;
      stopInterval();
      cancelAnimation(sessionProgress);
      cancelAnimation(orbX);
      cancelAnimation(orbY);
      cancelAnimation(centerBoost);
      cancelAnimation(orbFixed);
      cancelAnimation(orbSize);
      cancelAnimation(edgeContact);
      cancelAnimation(coachOpacity);
      cancelAnimation(supportGlow);
      cancelAnimation(confirmGlow);
      cancelAnimation(earlyWinGlow);
      cancelAnimation(confirmGoBackGlow);
      cancelAnimation(dot0Scale);
      cancelAnimation(dot1Scale);
      cancelAnimation(dot2Scale);
      cancelAnimation(dot3Scale);
      if (confirmTimerRef.current !== null) clearTimeout(confirmTimerRef.current);
      if (earlyWinTimerRef.current !== null) clearTimeout(earlyWinTimerRef.current);
      if (confirmGoBackTimerRef.current !== null) clearTimeout(confirmGoBackTimerRef.current);
      if (wonLingersTimerRef.current !== null) clearTimeout(wonLingersTimerRef.current);
      edgeStuckSinceRef.current = null;
      computedScheduleRef.current = [];
      milestoneIndexRef.current = 0;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Render ---

  const showVisual = screenState !== 'initializing' && screenState !== 'gaveInComplete';
  const showGaveIn = screenState === 'gaveIn' || screenState === 'gaveInComplete';
  const showRunningUI = screenState === 'running';
  const showWonCompleteUI = screenState === 'wonComplete';

  return (
    <View style={styles.container}>
      {showVisual && (
        <BattleVisual
          time={time}
          sessionProgress={sessionProgress}
          pulseCount={pulseCount}
          onWinAnimationComplete={handleWinComplete}
          theme={theme}
          orbX={orbX}
          orbY={orbY}
          orbFixed={orbFixed}
          centerBoost={centerBoost}
          orbSize={orbSize}
          edgeContact={edgeContact}
        />
      )}

      {/* Progress bar — grows from zero to full-width as session advances toward the win */}
      {showVisual && !showGaveIn && screenState !== 'won' && screenState !== 'wonComplete' && screenState !== 'resumePrompt' && (
        <View
          style={[styles.progressContainer, { bottom: Math.max(insets.bottom, 12) }]}
          pointerEvents="none"
        >
          {/* Track */}
          <View style={styles.progressTrack} />
          {/* Amber fill — grows left to right */}
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
          {/* Milestone dots + labels — dots light up amber as progress passes each one */}
          {MILESTONES.map(({ pct, label }, i) => (
            <React.Fragment key={pct}>
              <Text style={[styles.milestoneLabel, { left: screenWidth * pct - 12 }]}>
                {label}
              </Text>
              <Animated.View
                style={[styles.milestoneDot, { left: screenWidth * pct - 3.5 }, dotStyles[i]]}
              />
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Coach line — bottom overlay with dark pill for contrast, non-interactive */}
      <Animated.View style={[styles.coachContainer, { bottom: insets.bottom + 86 }, coachLineStyle]} pointerEvents="none">
        {!!coachLine && (
          <View style={styles.coachPill}>
            <Text style={styles.coachText}>{coachLine}</Text>
          </View>
        )}
      </Animated.View>

      {/* Mode toggle pill — PASSIVE | ACTIVE tap toggle; visible only during running */}
      {showRunningUI && (
        <TouchableOpacity
          style={[styles.modePill, { top: insets.top + 14 }]}
          onPress={handleModeToggle}
          accessibilityLabel={activeMode ? 'Switch to passive mode' : 'Switch to active mode'}
          accessibilityRole="button"
        >
          <Text style={[styles.modePillText, !activeMode && styles.modePillTextActive]}>
            PASSIVE
          </Text>
          <View style={styles.modePillDivider} />
          <Text style={[styles.modePillText, activeMode && styles.modePillTextActive]}>
            ACTIVE
          </Text>
        </TouchableOpacity>
      )}

      {/* Go Back — top-right; two-stage confirm → silent cancel (P2-04) */}
      {showRunningUI && (
        <View style={[styles.goBackWrapper, { top: insets.top + 12 }]}>
          <Animated.View
            style={[
              styles.topIconButton,
              confirmingGoBack && styles.goBackButtonConfirm,
              confirmGoBackGlowStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.iconButtonInner}
              onPress={handleGoBackTap}
              accessibilityLabel={confirmingGoBack ? 'Confirm leave session' : 'Leave session — no record saved'}
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={confirmingGoBack ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </Animated.View>
          {confirmingGoBack && (
            <Text style={styles.goBackConfirmLabel}>Leave?</Text>
          )}
        </View>
      )}

      {/* Active mode settings — ORB size (S/M) + PULL strength (R/S) in one compact pill */}
      {showRunningUI && activeMode && (
        <View style={[styles.activeSettings, { top: insets.top + 58 }]}>
          {/* ORB group — label + S/M options */}
          <TouchableOpacity
            style={styles.settingGroup}
            onPress={handleOrbSizeToggle}
            accessibilityLabel={orbSizeLabel === 'M' ? 'Switch to small orb' : 'Switch to medium orb'}
            accessibilityRole="button"
          >
            <Text style={styles.settingLabel}>ORB</Text>
            <Text style={[styles.settingText, orbSizeLabel === 'S' && styles.settingActive]}>S</Text>
            <View style={styles.settingInnerDivider} />
            <Text style={[styles.settingText, orbSizeLabel === 'M' && styles.settingActive]}>M</Text>
          </TouchableOpacity>
          {/* Group separator */}
          <View style={styles.settingGroupDivider} />
          {/* PULL group — label + LO/HI options */}
          <TouchableOpacity
            style={styles.settingGroup}
            onPress={handleGravityToggle}
            accessibilityLabel={gravityHigh ? 'Switch to low pull' : 'Switch to high pull'}
            accessibilityRole="button"
          >
            <Text style={styles.settingLabel}>PULL</Text>
            <Text style={[styles.settingText, !gravityHigh && styles.settingActive]}>LO</Text>
            <View style={styles.settingInnerDivider} />
            <Text style={[styles.settingText, gravityHigh && styles.settingActive]}>HI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SpatialBalance — physics-only, renders null. Mounts when active mode is on.
          Gyroscope → orbX/orbY → BattleVisual orbOffset uniform. */}
      {showRunningUI && activeMode && (
        <SpatialBalance
          sessionProgress={sessionProgress}
          orbX={orbX}
          orbY={orbY}
          centerBoost={centerBoost}
          edgeContact={edgeContact}
          gravityHigh={gravityHigh}
        />
      )}

      {/* Running controls: support (left) + craving gone (center) + gave-in (right) */}
      {showRunningUI && (
        <>
          {/* SUPPORT ME — bottom-left */}
          <Animated.View style={[styles.iconButton, styles.iconButtonLeft, { bottom: Math.max(insets.bottom, 16) + 16 }, supportGlowStyle]}>
            <TouchableOpacity
              style={styles.iconButtonInner}
              onPress={handleCoachTap}
              accessibilityLabel="Ask coach for a calibration line"
              accessibilityRole="button"
            >
              <Ionicons name="shield-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </Animated.View>

          {/* CRAVING GONE — bottom-center, two-stage confirm */}
          <View style={[styles.iconButtonCenterWrapper, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
            {confirmingEarlyWin && (
              <Text style={styles.earlyWinConfirmLabel}>Craving Gone?</Text>
            )}
            <Animated.View
              style={[
                styles.iconButton,
                confirmingEarlyWin && styles.earlyWinButtonConfirm,
                earlyWinGlowStyle,
              ]}
            >
              <TouchableOpacity
                style={styles.iconButtonInner}
                onPress={handleEarlyWinTap}
                accessibilityLabel={confirmingEarlyWin ? 'Confirm craving gone — record early win' : 'Craving gone — end session as win'}
                accessibilityRole="button"
              >
                <Ionicons
                  name="checkmark-outline"
                  size={24}
                  color={confirmingEarlyWin ? 'rgb(0, 200, 180)' : COLORS.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* GAVE IN — bottom-right, two-stage confirm */}
          <View style={[styles.iconButtonRightWrapper, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
            {confirmingGaveIn && (
              <Text style={styles.confirmLabel}>Gave in?</Text>
            )}
            <Animated.View
              style={[
                styles.iconButton,
                confirmingGaveIn && styles.iconButtonConfirm,
                confirmGlowStyle,
              ]}
            >
              <TouchableOpacity
                style={styles.iconButtonInner}
                onPress={handleGaveInTap}
                accessibilityLabel={confirmingGaveIn ? 'Confirm gave in' : 'Gave in'}
                accessibilityRole="button"
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={confirmingGaveIn ? COLORS.AMBER : COLORS.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </>
      )}

      {/* Won — coach line from handleWon() already contains the win message ("You held it.").
          No separate overlay text — one message, not two. BattleVisual runs its own
          white-flash sequence then calls handleWinComplete → wonComplete state. */}

      {/* Won complete — DONE returns home; GO AGAIN starts a fresh session.
          Coach pill delivers a lingering-normalisation line 2s after this mounts. */}
      {showWonCompleteUI && (
        <View style={[styles.wonCompleteContainer, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
          <TouchableOpacity
            onPress={handleDone}
            style={styles.wonDoneButton}
            accessibilityLabel="Done — return to home"
            accessibilityRole="button"
          >
            <Text style={styles.wonDoneText}>DONE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoAgain}
            style={styles.wonGoAgainButton}
            accessibilityLabel="Go again — start a new session"
            accessibilityRole="button"
          >
            <Text style={styles.wonGoAgainText}>GO AGAIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gave-in overlay */}
      {showGaveIn && (
        <View style={styles.overlay} pointerEvents={screenState === 'gaveInComplete' ? 'auto' : 'none'}>
          <Text style={styles.overlayText}>Session ended.</Text>
          {screenState === 'gaveInComplete' && (
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Return to home"
              accessibilityRole="button"
            >
              <Text style={styles.returnText}>RETURN</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Resume prompt — shown when returning from 20+ min background; user declares outcome.
          Three choices collapse the "did you hold out?" + "need another session?" into one screen. */}
      {screenState === 'resumePrompt' && (
        <View style={styles.overlay} pointerEvents="auto">
          <Text style={styles.overlayText}>You were away.</Text>
          <Text style={styles.resumeSubtext}>Did you hold out?</Text>
          <View style={styles.resumeActions}>
            <View style={styles.resumeHeldRow}>
              <TouchableOpacity
                style={styles.resumeHeldOutButton}
                onPress={handleDone}
                accessibilityLabel="Held out — done for now"
                accessibilityRole="button"
              >
                <Text style={styles.resumeHeldOutText}>HELD OUT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wonGoAgainButton}
                onPress={handleGoAgain}
                accessibilityLabel="Held out — go again"
                accessibilityRole="button"
              >
                <Text style={styles.wonGoAgainText}>GO AGAIN</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.wonDoneButton}
              onPress={handleResumeGaveIn}
              accessibilityLabel="Gave in while away"
              accessibilityRole="button"
            >
              <Text style={styles.wonDoneText}>GAVE IN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  // Progress bar — container is tall enough for label + dot + track
  progressContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
    overflow: 'visible',
  },
  // Track: the full-width dim line at the bottom of the container
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  // Amber fill: grows from left as session progresses
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: COLORS.AMBER,
    opacity: 0.85,
    shadowColor: COLORS.AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.7,
  },
  // Milestone dot — centered on the 3px track (track bottom: 0, dot height: 7, so bottom: -2)
  milestoneDot: {
    position: 'absolute',
    bottom: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  // Milestone label — tiny time label above the dot
  milestoneLabel: {
    position: 'absolute',
    bottom: 8,
    width: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Coach line — dark pill ensures readability against both dark bg and bright center
  coachContainer: {
    position: 'absolute',
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  coachPill: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  coachText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // Mode toggle pill — PASSIVE | ACTIVE; top-center
  modePill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  modePillText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  modePillTextActive: {
    color: 'rgba(100,220,210,0.95)',  // teal highlight for active side
  },
  modePillDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },

  // Combined active-mode settings pill — ORB (S/M) + PULL (R/S)
  activeSettings: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 0,
  },
  settingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 4,
  },
  settingLabel: {
    color: 'rgba(255,255,255,0.22)',  // dimmer than inactive options — clearly a descriptor, not a toggle
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginRight: 5,
  },
  settingText: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  settingActive: {
    color: 'rgba(100,220,210,0.90)',
  },
  settingInnerDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  settingGroupDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.30)',
    marginHorizontal: 8,
  },

  // Icon-only circular buttons — visible against both dark and bright center
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLeft: {
    position: 'absolute',
    left: 28,
  },
  iconButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonRightWrapper: {
    position: 'absolute',
    right: 28,
    alignItems: 'center',
    gap: 8,
  },
  confirmLabel: {
    color: COLORS.AMBER,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  iconButtonConfirm: {
    borderColor: 'rgba(245,166,35,0.4)',
  },

  // Go Back — absolute top-right; column layout (label above button like gave-in)
  goBackWrapper: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 6,
  },
  // Go Back button — 44×44 circle matching top-corner visual style
  topIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // White border when go-back confirmation is active
  goBackButtonConfirm: {
    borderColor: 'rgba(255,255,255,0.35)',
  },
  // "Leave?" label above button during go-back confirmation
  goBackConfirmLabel: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  // Craving Gone — bottom-center; full-width wrapper centers the column
  iconButtonCenterWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  // Teal border when craving-gone confirmation is active
  earlyWinButtonConfirm: {
    borderColor: 'rgba(0, 200, 180, 0.4)',
  },
  // "Craving Gone?" label above button during confirmation
  earlyWinConfirmLabel: {
    color: 'rgb(0, 200, 180)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Won complete — DONE + GO AGAIN buttons
  wonCompleteContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  wonDoneButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wonDoneText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  wonGoAgainButton: {
    backgroundColor: COLORS.AMBER,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wonGoAgainText: {
    color: COLORS.TEXT_ON_AMBER,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Resume prompt — "You were away. Did you hold out?" overlay
  resumeSubtext: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginTop: -24, // tighten gap with overlayText above
  },
  resumeActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  resumeHeldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeHeldOutButton: {
    borderWidth: 1,
    borderColor: COLORS.TEXT_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeHeldOutText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Terminal overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  returnButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    minHeight: 44,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
