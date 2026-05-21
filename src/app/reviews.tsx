import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { dailyQueue } from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ReviewsScreen() {
  const theme = useTheme();

  return (
    <StudyScreen
      eyebrow="Spaced repetition"
      title="Review before recall fades"
      subtitle="The queue prioritizes cards with rising forgetting probability and high exam value.">
      <StudyCard style={[styles.forecast, { backgroundColor: theme.brandOchre }]}>
        <View>
          <ThemedText type="caption">Retention forecast</ThemedText>
          <ThemedText type="metric">76%</ThemedText>
        </View>
        <ThemedText type="small">
          Complete the current queue to push tomorrow’s estimated retention above 82%.
        </ThemedText>
        <ActionButton label="Review now" />
      </StudyCard>

      <StudyCard>
        <SectionHeader title="Due Cards" detail="Sorted by FSRS-style retrievability." />
        {dailyQueue.map((item) => (
          <ThemedView key={item.title} type="backgroundElement" style={styles.reviewRow}>
            <View style={styles.reviewCopy}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.course}
              </ThemedText>
            </View>
            <View style={styles.retentionBlock}>
              <ThemedText type="smallBold">{item.retention}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                recall
              </ThemedText>
            </View>
          </ThemedView>
        ))}
      </StudyCard>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  forecast: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  reviewCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  retentionBlock: {
    alignItems: 'flex-end',
  },
});
