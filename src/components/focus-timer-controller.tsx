import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveFocusSession } from '@/lib/study-state';
import type { FocusSessionRecord } from '@/types/study-state';

export type SessionPhase = 'study' | 'break';

export type SessionMode = {
  description: string;
  id: 'pomodoro' | 'deep';
  name: string;
  studyMinutes: number;
  breakMinutes: number;
};

export const sessionModes: SessionMode[] = [
  {
    breakMinutes: 5,
    description: 'Good for quick reviews, cards, and short quizzes.',
    id: 'pomodoro',
    name: 'Pomodoro',
    studyMinutes: 25,
  },
  {
    breakMinutes: 10,
    description: 'Good for reading, notes, and harder problem sets.',
    id: 'deep',
    name: 'Deep study',
    studyMinutes: 50,
  },
];

type FocusTimerContextValue = {
  accentColor: string;
  completeCurrentPhase: (autoAdvance?: boolean) => void;
  endSession: () => void;
  isRunning: boolean;
  lastCompletedSession: FocusSessionRecord | null;
  phase: SessionPhase;
  phaseLabel: string;
  progress: number;
  remainingSeconds: number;
  resetSession: () => void;
  selectedMode: SessionMode;
  selectMode: (mode: SessionMode) => void;
  sessionNote: string;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  startSession: (mode?: SessionMode, note?: string) => void;
  totalSeconds: number;
};

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

function secondsFor(mode: SessionMode, phase: SessionPhase) {
  return (phase === 'study' ? mode.studyMinutes : mode.breakMinutes) * 60;
}

export function formatTimerTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [selectedMode, setSelectedMode] = useState<SessionMode>(sessionModes[0]);
  const [phase, setPhase] = useState<SessionPhase>('study');
  const [remainingSeconds, setRemainingSeconds] = useState(secondsFor(sessionModes[0], 'study'));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [lastCompletedSession, setLastCompletedSession] = useState<FocusSessionRecord | null>(null);
  const totalSeconds = useMemo(() => secondsFor(selectedMode, phase), [phase, selectedMode]);
  const progress = totalSeconds === 0 ? 0 : 1 - remainingSeconds / totalSeconds;
  const phaseLabel = phase === 'study' ? 'Focus time' : 'Break time';
  const accentColor = phase === 'study' ? theme.brandPink : theme.brandMint;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (remainingSeconds > 0 || !isRunning) return;

    completeCurrentPhase(true);
  }, [isRunning, remainingSeconds]);

  function selectMode(mode: SessionMode) {
    setSelectedMode(mode);
    setPhase('study');
    setRemainingSeconds(secondsFor(mode, 'study'));
    setIsRunning(false);
  }

  function startSession(mode = selectedMode, note?: string) {
    if (note !== undefined) setSessionNote(note);
    setSelectedMode(mode);
    setPhase('study');
    setRemainingSeconds(secondsFor(mode, 'study'));
    setIsRunning(true);
  }

  function resetSession() {
    setIsRunning(false);
    setPhase('study');
    setRemainingSeconds(secondsFor(selectedMode, 'study'));
  }

  function endSession() {
    setIsRunning(false);
    setPhase('study');
    setRemainingSeconds(secondsFor(selectedMode, 'study'));
  }

  function completeCurrentPhase(autoAdvance = false) {
    const completedMinutes = phase === 'study' ? selectedMode.studyMinutes : selectedMode.breakMinutes;
    const completedSession: FocusSessionRecord = {
      completedAt: new Date().toISOString(),
      id: Date.now(),
      minutes: completedMinutes,
      mode: selectedMode.name,
      note: sessionNote.trim() || undefined,
      phase,
    };

    saveFocusSession(completedSession);
    setLastCompletedSession(completedSession);

    if (phase === 'study') {
      setPhase('break');
      setRemainingSeconds(secondsFor(selectedMode, 'break'));
      setIsRunning(autoAdvance);
      return;
    }

    setPhase('study');
    setRemainingSeconds(secondsFor(selectedMode, 'study'));
    setIsRunning(false);
  }

  const value = useMemo(
    () => ({
      accentColor,
      completeCurrentPhase,
      endSession,
      isRunning,
      lastCompletedSession,
      phase,
      phaseLabel,
      progress,
      remainingSeconds,
      resetSession,
      selectedMode,
      selectMode,
      sessionNote,
      setIsRunning,
      startSession,
      totalSeconds,
    }),
    [
      accentColor,
      isRunning,
      lastCompletedSession,
      phase,
      phaseLabel,
      progress,
      remainingSeconds,
      selectedMode,
      sessionNote,
      totalSeconds,
    ]
  );

  return (
    <FocusTimerContext.Provider value={value}>
      {children}
      <FloatingFocusTimer />
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const value = useContext(FocusTimerContext);

  if (!value) {
    throw new Error('useFocusTimer must be used inside FocusTimerProvider');
  }

  return value;
}

function FloatingFocusTimer() {
    const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const {
    accentColor,
    endSession,
    isRunning,
    phaseLabel,
    remainingSeconds,
    selectedMode,
    setIsRunning,
  } = useFocusTimer();

  if (!isRunning || pathname === '/study') return null;

  return (
    <Pressable
      onPress={() => router.push('/study')}
      style={({ pressed }) => [styles.floatingTimer, pressed && styles.pressed]}>
      <ThemedView
        style={[
          styles.floatingTimerInner,
          {
            backgroundColor: theme.card,
            borderColor: theme.hairline,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
          },
        ]}>
        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
        <View style={styles.timerCopy}>
          <ThemedText type="smallBold">{formatTimerTime(remainingSeconds)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selectedMode.name} - {phaseLabel}
          </ThemedText>
        </View>
        <View style={[styles.timerActions, { borderColor: theme.hairline }]}>
          <Pressable
            accessibilityLabel={isRunning ? 'Pause timer' : 'Resume timer'}
            onPress={(event) => {
              event.stopPropagation?.();
              setIsRunning((current) => !current);
            }}
            style={({ pressed }) => [styles.timerActionButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">{isRunning ? 'Pause' : 'Run'}</ThemedText>
          </Pressable>
          <Pressable
            accessibilityLabel="End timer"
            onPress={(event) => {
              event.stopPropagation?.();
              endSession();
            }}
            style={({ pressed }) => [styles.timerActionButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">End</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingTimer: {
    bottom: BottomTabInset + 76,
    left: Spacing.three,
    position: 'absolute',
    zIndex: 50,
  },
  floatingTimerInner: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    maxWidth: 340,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
  statusDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  timerCopy: {
    gap: Spacing.half,
  },
  timerActions: {
    borderLeftWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    marginLeft: Spacing.one,
    paddingLeft: Spacing.two,
  },
  timerActionButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
