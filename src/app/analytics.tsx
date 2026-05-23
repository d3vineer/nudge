import { StyleSheet, View } from 'react-native';

import { SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mastery } from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const isDark = theme.background === '#07111F';

  return (
    <StudyScreen
      eyebrow="Progress"
      title="See what’s improving"
      subtitle="A quick look at time, mastery, and where to focus next.">
      <View style={styles.grid}>
        <StudyCard style={[styles.summaryCard, styles.blueLiftCard, isDark && styles.blueLiftCardDark]}>
          <ThemedText type="caption">This week</ThemedText>
          <ThemedText type="metric">+12%</ThemedText>
          <ThemedText type="small">Biology improved the most.</ThemedText>
        </StudyCard>

        <StudyCard style={[styles.summaryCard, styles.aquaLiftCard, isDark && styles.aquaLiftCardDark]}>
          <ThemedText type="caption" themeColor="textSecondary">
            Study time
          </ThemedText>
          <ThemedText type="metric">4.6h</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            this week
          </ThemedText>
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader title="By Course" detail="Where you stand right now." />
        {mastery.map((item) => (
          <View key={item.label} style={styles.masteryRow}>
            <View style={styles.masteryLabel}>
              <ThemedText type="smallBold">{item.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.value}%
              </ThemedText>
            </View>
            <ThemedView type="backgroundElement" style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.value}%`, backgroundColor: item.color },
                ]}
              />
            </ThemedView>
          </View>
        ))}
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
  summaryCard: {
    flexGrow: 1,
    flexBasis: 320,
  },
  blueLiftCard: {
    backgroundColor: 'rgba(184, 164, 237, 0.22)',
    boxShadow: '0 24px 70px rgba(184, 164, 237, 0.18)',
  },
  aquaLiftCard: {
    backgroundColor: 'rgba(164, 212, 197, 0.28)',
    boxShadow: '0 24px 70px rgba(164, 212, 197, 0.16)',
  },
  blueLiftCardDark: {
    backgroundColor: 'rgba(184, 164, 237, 0.16)',
  },
  aquaLiftCardDark: {
    backgroundColor: 'rgba(164, 212, 197, 0.12)',
  },
  masteryRow: {
    gap: Spacing.two,
  },
  masteryLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
