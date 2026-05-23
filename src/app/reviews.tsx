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
      eyebrow="Review"
      title="Keep it fresh"
      subtitle="Review the cards that need attention today.">
      <StudyCard style={[styles.forecast, { backgroundColor: theme.brandOchre }]}>
        <View>
          <ThemedText type="caption">Recall</ThemedText>
          <ThemedText type="metric">76%</ThemedText>
        </View>
        <ThemedText type="small">
          Finish today’s cards to keep tomorrow easier.
        </ThemedText>
        <ActionButton label="Review now" />
      </StudyCard>

      <StudyCard>
        <SectionHeader title="Due Cards" detail="Start at the top." />
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
    borderRadius: 22,
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
