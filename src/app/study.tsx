import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { formatTimerTime, sessionModes, useFocusTimer } from '@/components/focus-timer-controller';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadFocusSessions } from '@/lib/study-state';
import type { FocusSessionRecord } from '@/types/study-state';

const sessionPlan = ['Review Biology cards', 'Read calculus notes', 'Try a history quiz'];

function formatCompletedAt(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function StudySessionScreen() {
  const theme = useTheme();
  const {
    accentColor,
    completeCurrentPhase,
    isRunning,
    lastCompletedSession,
    phase,
    phaseLabel,
    progress,
    remainingSeconds,
    resetSession,
    selectMode,
    selectedMode,
    setIsRunning,
    startSession,
    totalSeconds,
  } = useFocusTimer();
  const [sessionLog, setSessionLog] = useState<FocusSessionRecord[]>([]);
  const nextPhaseLabel = phase === 'study' ? 'break' : 'next focus block';
  const isDark = theme.background === '#07111F';
  const selectedCardText = isDark ? '#FFFFFF' : '#0F172A';

  useEffect(() => {
    let isMounted = true;

    loadFocusSessions().then((sessions) => {
      if (!isMounted) return;
      setSessionLog(sessions.slice(0, 5));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lastCompletedSession) return;

    setSessionLog((current) => [
      lastCompletedSession,
      ...current.filter((item) => item.id !== lastCompletedSession.id),
    ].slice(0, 5));
  }, [lastCompletedSession]);

  return (
    <StudyScreen
      eyebrow="Focus"
      title="Choose your study rhythm"
      subtitle="Start a short Pomodoro or a longer deep work session.">
      <View style={styles.modeGrid}>
        {sessionModes.map((mode) => {
          const isSelected = mode.id === selectedMode.id;
          const surfaceColor = mode.id === 'pomodoro' ? theme.brandPink : theme.brandTeal;
          const textColor = selectedCardText;

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
                  <ThemedView style={[styles.selectedPill, { backgroundColor: 'rgba(255, 255, 255, 0.78)' }]}>
                    <ThemedText type="smallBold" style={{ color: '#0F172A' }}>Selected</ThemedText>
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
                  label={isSelected ? 'Restart' : 'Choose'}
                  variant={isSelected ? 'secondary' : 'primary'}
                  onPress={() => (isSelected ? startSession(mode) : selectMode(mode))}
                />
                <ActionButton
                  label="Start"
                  variant="secondary"
                  onPress={() => startSession(mode)}
                />
              </View>
            </StudyCard>
          );
        })}
      </View>

      <View style={styles.sessionGrid}>
        <StudyCard style={[styles.timerPanel, styles.timerGlowCard, isDark && styles.timerGlowCardDark]}>
          <View style={styles.cardTopRow}>
            <View>
              <ThemedText type="caption" style={styles.timerDarkText}>
                {selectedMode.name}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.timerDarkText}>
                {phaseLabel}
              </ThemedText>
            </View>
            <ThemedView style={[styles.statusPill, { backgroundColor: accentColor }]}>
              <ThemedText type="smallBold">
                {isRunning ? 'Running' : remainingSeconds === totalSeconds ? 'Ready' : 'Paused'}
              </ThemedText>
            </ThemedView>
          </View>

          <ThemedText type="metric" style={styles.timerText}>
            {formatTimerTime(remainingSeconds)}
          </ThemedText>

          <ThemedView style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </ThemedView>

          <ThemedText type="smallBold" style={styles.timerDarkText}>
            Finish this {phase === 'study' ? 'focus block' : 'break'} to move into your {nextPhaseLabel}.
          </ThemedText>

          <View style={styles.buttonRow}>
            <ActionButton
              label={isRunning ? 'Pause' : remainingSeconds === totalSeconds ? 'Start' : 'Resume'}
              onPress={() => setIsRunning((current) => !current)}
            />
            <ActionButton
              label="Finish"
              variant="secondary"
              onPress={() => completeCurrentPhase(false)}
            />
            <ActionButton label="Reset" variant="secondary" onPress={resetSession} />
          </View>
        </StudyCard>

        <StudyCard style={styles.sidePanel}>
          <SectionHeader title="Plan" detail="A simple path for this session." />
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
          detail="Completed blocks for this session."
        />
        {sessionLog.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.emptyLog}>
            <ThemedText type="smallBold">Nothing finished yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Finish a focus block or break to add it here.
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
                  {formatCompletedAt(new Date(item.completedAt))}
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
  timerGlowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    boxShadow: '0 28px 80px rgba(184, 164, 237, 0.22), 0 0 70px rgba(164, 212, 197, 0.34)',
  },
  timerGlowCardDark: {
    backgroundColor: 'rgba(226, 232, 240, 0.92)',
    boxShadow: '0 28px 80px rgba(96, 165, 250, 0.2), 0 0 70px rgba(184, 164, 237, 0.16)',
  },
  timerText: {
    fontSize: 76,
    lineHeight: 84,
    color: '#0F172A',
  },
  timerDarkText: {
    color: '#0F172A',
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
    borderRadius: 22,
    borderCurve: 'continuous',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  logRow: {
    borderRadius: 22,
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
