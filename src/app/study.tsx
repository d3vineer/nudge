import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SessionMode = {
  id: 'pomodoro' | 'deep';
  name: string;
  studyMinutes: number;
  breakMinutes: number;
  description: string;
};

type SessionPhase = 'study' | 'break';

type SessionLog = {
  id: number;
  mode: string;
  phase: SessionPhase;
  minutes: number;
  completedAt: string;
};

const sessionModes: SessionMode[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    studyMinutes: 25,
    breakMinutes: 5,
    description: 'Best for active recall, flashcards, and short quiz bursts.',
  },
  {
    id: 'deep',
    name: 'Deep study',
    studyMinutes: 50,
    breakMinutes: 10,
    description: 'Best for reading dense chapters, note synthesis, and problem sets.',
  },
];

const sessionPlan = ['Review Biology cards', 'Read calculus proof notes', 'Quiz history sources'];

function secondsFor(mode: SessionMode, phase: SessionPhase) {
  return (phase === 'study' ? mode.studyMinutes : mode.breakMinutes) * 60;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatCompletedAt() {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

export default function StudySessionScreen() {
  const theme = useTheme();
  const [selectedMode, setSelectedMode] = useState<SessionMode>(sessionModes[0]);
  const [phase, setPhase] = useState<SessionPhase>('study');
  const [remainingSeconds, setRemainingSeconds] = useState(secondsFor(sessionModes[0], 'study'));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionLog, setSessionLog] = useState<SessionLog[]>([]);

  const totalSeconds = useMemo(
    () => secondsFor(selectedMode, phase),
    [phase, selectedMode]
  );
  const progress = totalSeconds === 0 ? 0 : 1 - remainingSeconds / totalSeconds;
  const phaseLabel = phase === 'study' ? 'Focus block' : 'Recovery break';
  const nextPhaseLabel = phase === 'study' ? 'break' : 'next study block';

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (remainingSeconds > 0 || !isRunning) {
      return;
    }

    completeCurrentPhase(true);
  }, [isRunning, remainingSeconds]);

  function selectMode(mode: SessionMode) {
    setSelectedMode(mode);
    setPhase('study');
    setRemainingSeconds(secondsFor(mode, 'study'));
    setIsRunning(false);
  }

  function startSession(mode = selectedMode) {
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

  function completeCurrentPhase(autoAdvance = false) {
    const completedMinutes =
      phase === 'study' ? selectedMode.studyMinutes : selectedMode.breakMinutes;

    setSessionLog((current) => [
      {
        id: Date.now(),
        mode: selectedMode.name,
        phase,
        minutes: completedMinutes,
        completedAt: formatCompletedAt(),
      },
      ...current,
    ].slice(0, 5));

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

  return (
    <StudyScreen
      eyebrow="Focus session"
      title="Pick the rhythm for this block"
      subtitle="Pomodoro and deep study modes share the same queue, but adapt intensity to your pace.">
      <View style={styles.modeGrid}>
        {sessionModes.map((mode) => {
          const isSelected = mode.id === selectedMode.id;
          const surfaceColor = mode.id === 'pomodoro' ? theme.brandPink : theme.brandTeal;
          const textColor = mode.id === 'pomodoro' ? theme.onPrimary : theme.onDark;

          return (
            <StudyCard
              key={mode.id}
              style={[
                styles.modeCard,
                {
                  backgroundColor: isSelected ? surfaceColor : theme.card,
                  borderColor: isSelected ? surfaceColor : theme.hairline,
                },
              ]}>
              <View style={styles.cardTopRow}>
                <View style={styles.modeCopy}>
                  <ThemedText
                    type="caption"
                    style={isSelected ? { color: textColor } : undefined}>
                    {mode.name}
                  </ThemedText>
                  <ThemedText
                    type="metric"
                    style={isSelected ? { color: textColor } : undefined}>
                    {mode.studyMinutes}/{mode.breakMinutes}
                  </ThemedText>
                </View>
                {isSelected ? (
                  <ThemedView style={[styles.selectedPill, { backgroundColor: theme.background }]}>
                    <ThemedText type="smallBold">Active</ThemedText>
                  </ThemedView>
                ) : null}
              </View>
              <ThemedText
                type="small"
                style={isSelected ? { color: textColor } : undefined}
                themeColor={isSelected ? undefined : 'textSecondary'}>
                {mode.description}
              </ThemedText>
              <View style={styles.buttonRow}>
                <ActionButton
                  label={isSelected ? 'Restart mode' : 'Choose mode'}
                  variant={isSelected ? 'secondary' : 'primary'}
                  onPress={() => (isSelected ? startSession(mode) : selectMode(mode))}
                />
                <ActionButton
                  label={`Start ${mode.studyMinutes}/${mode.breakMinutes}`}
                  variant="secondary"
                  onPress={() => startSession(mode)}
                />
              </View>
            </StudyCard>
          );
        })}
      </View>

      <View style={styles.sessionGrid}>
        <StudyCard tone="darkSurface" style={styles.timerPanel}>
          <View style={styles.cardTopRow}>
            <View>
              <ThemedText type="caption" style={{ color: theme.brandMint }}>
                {selectedMode.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {phaseLabel}
              </ThemedText>
            </View>
            <ThemedView style={[styles.statusPill, { backgroundColor: theme.brandMint }]}>
              <ThemedText type="smallBold">
                {isRunning ? 'Running' : remainingSeconds === totalSeconds ? 'Ready' : 'Paused'}
              </ThemedText>
            </ThemedView>
          </View>

          <ThemedText type="metric" style={[styles.timerText, { color: theme.onDark }]}>
            {formatTime(remainingSeconds)}
          </ThemedText>

          <ThemedView style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: phase === 'study' ? theme.brandPink : theme.brandMint,
                },
              ]}
            />
          </ThemedView>

          <ThemedText type="small" style={{ color: theme.textMuted }}>
            Finish this {phase} phase to move into your {nextPhaseLabel}.
          </ThemedText>

          <View style={styles.buttonRow}>
            <ActionButton
              label={isRunning ? 'Pause' : remainingSeconds === totalSeconds ? 'Start' : 'Resume'}
              onPress={() => setIsRunning((current) => !current)}
            />
            <ActionButton
              label={`Finish ${phase}`}
              variant="secondary"
              onPress={() => completeCurrentPhase(false)}
            />
            <ActionButton label="Reset" variant="secondary" onPress={resetSession} />
          </View>
        </StudyCard>

        <StudyCard style={styles.sidePanel}>
          <SectionHeader title="Session Plan" detail="Balanced for active recall and interleaving." />
          {sessionPlan.map((item, index) => (
            <ThemedView key={item} style={styles.planRow}>
              <ThemedView type="backgroundSelected" style={styles.stepBadge}>
                <ThemedText type="smallBold">{index + 1}</ThemedText>
              </ThemedView>
              <ThemedText type="smallBold">{item}</ThemedText>
            </ThemedView>
          ))}
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader
          title="Session Log"
          detail="Temporary history for this app session; persistence comes next."
        />
        {sessionLog.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.emptyLog}>
            <ThemedText type="smallBold">No completed blocks yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Complete a focus block or break to add it here.
            </ThemedText>
          </ThemedView>
        ) : (
          sessionLog.map((item) => (
            <ThemedView key={item.id} type="backgroundElement" style={styles.logRow}>
              <View style={styles.logCopy}>
                <ThemedText type="smallBold">
                  {item.mode} {item.phase}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.completedAt}
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{item.minutes} min</ThemedText>
            </ThemedView>
          ))
        )}
      </StudyCard>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  modeCard: {
    flexGrow: 1,
    flexBasis: 340,
    minHeight: 250,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modeCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  selectedPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  timerPanel: {
    flexGrow: 2,
    flexBasis: 460,
  },
  timerText: {
    fontSize: 76,
    lineHeight: 84,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  progressTrack: {
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 250, 240, 0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sidePanel: {
    flexGrow: 1,
    flexBasis: 320,
  },
  planRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLog: {
    borderRadius: 12,
    borderCurve: 'continuous',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  logRow: {
    borderRadius: 12,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  logCopy: {
    flex: 1,
    gap: Spacing.one,
  },
});
