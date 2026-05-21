import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function StudySessionScreen() {
  const theme = useTheme();

  return (
    <StudyScreen
      eyebrow="Focus session"
      title="Pick the rhythm for this block"
      subtitle="Pomodoro and deep study modes share the same queue, but adapt intensity to your pace.">
      <View style={styles.grid}>
        <StudyCard style={[styles.timerCard, { backgroundColor: theme.brandPink }]}>
          <ThemedText type="caption" style={{ color: theme.onPrimary }}>
            Pomodoro
          </ThemedText>
          <ThemedText type="metric" style={{ color: theme.onPrimary }}>
            25:00
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onPrimary }}>
            5 minute break after focused recall.
          </ThemedText>
          <ActionButton label="Start 25/5" />
        </StudyCard>

        <StudyCard style={[styles.timerCard, { backgroundColor: theme.brandTeal }]}>
          <ThemedText type="caption" style={{ color: theme.onDark }}>
            Deep study
          </ThemedText>
          <ThemedText type="metric" style={{ color: theme.onDark }}>
            50:00
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onDark }}>
            10 minute break for dense reading and notes.
          </ThemedText>
          <ActionButton label="Start 50/10" variant="secondary" />
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader title="Session Plan" detail="Balanced for active recall and interleaving." />
        {['Review Biology cards', 'Read calculus proof notes', 'Quiz history sources'].map(
          (item, index) => (
            <ThemedView key={item} style={styles.planRow}>
              <ThemedView type="backgroundSelected" style={styles.stepBadge}>
                <ThemedText type="smallBold">{index + 1}</ThemedText>
              </ThemedView>
              <ThemedText type="smallBold">{item}</ThemedText>
            </ThemedView>
          )
        )}
      </StudyCard>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  timerCard: {
    flexGrow: 1,
    flexBasis: 340,
    minHeight: 240,
    justifyContent: 'space-between',
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
});
