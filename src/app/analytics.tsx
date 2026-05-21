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

  return (
    <StudyScreen
      eyebrow="Mastery insights"
      title="Know what is sticking"
      subtitle="Track retention, pace, weak topics, and study consistency without turning the app into a spreadsheet.">
      <View style={styles.grid}>
        <StudyCard style={[styles.summaryCard, { backgroundColor: theme.brandLavender }]}>
          <ThemedText type="caption">Weekly mastery gain</ThemedText>
          <ThemedText type="metric">+12%</ThemedText>
          <ThemedText type="small">Largest lift came from Biology reviews.</ThemedText>
        </StudyCard>

        <StudyCard style={styles.summaryCard}>
          <ThemedText type="caption" themeColor="textSecondary">
            Study pace
          </ThemedText>
          <ThemedText type="metric">4.6h</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            focused time this week
          </ThemedText>
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader title="Mastery by Course" detail="Early visual model for the analytics tab." />
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
