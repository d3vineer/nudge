import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  dailyQueue,
  retentionInsights,
  sources,
  studyBlocks,
  weakTopics,
} from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const totalDueCards = dailyQueue.reduce((sum, item) => sum + Number.parseInt(item.due, 10), 0);
  const readySources = sources.filter((source) => source.progress === 100).length;

  return (
    <StudyScreen
      eyebrow="Adaptive study flow"
      title="Today’s memory plan is ready"
      subtitle="Nudge blends active recall, spaced repetition, and focused sessions into one calm queue.">
      <View style={styles.heroGrid}>
        <StudyCard tone="darkSurface" style={styles.heroCard}>
          <ThemedText type="caption" style={{ color: theme.brandMint }}>
            Forgetting risk
          </ThemedText>
          <ThemedText type="metric" style={{ color: theme.onDark }}>
            23%
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textMuted }}>
            Lower than last Thursday after two strong reviews.
          </ThemedText>
          <View style={styles.buttonRow}>
            <ActionButton label="Start queue" onPress={() => router.push('/reviews')} />
            <ActionButton
              label="Upload source"
              variant="secondary"
              onPress={() => router.push('/library')}
            />
          </View>
        </StudyCard>

        <View style={styles.metricGrid}>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandLavender }]}>
            <ThemedText type="caption">Due now</ThemedText>
            <ThemedText type="metric">{totalDueCards}</ThemedText>
            <ThemedText type="small">cards across 3 courses</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandPeach }]}>
            <ThemedText type="caption">Deep work</ThemedText>
            <ThemedText type="metric">50</ThemedText>
            <ThemedText type="small">minute session suggested</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandMint }]}>
            <ThemedText type="caption">Sources ready</ThemedText>
            <ThemedText type="metric">{readySources}/{sources.length}</ThemedText>
            <ThemedText type="small">parsed into study assets</ThemedText>
          </StudyCard>
        </View>
      </View>

      <View style={styles.grid}>
        <StudyCard style={styles.column}>
          <SectionHeader title="Daily Queue" detail="Ordered by predicted recall drop." />
          {dailyQueue.map((item) => (
            <ThemedView key={item.title} style={styles.queueItem}>
              <View
                style={[
                  styles.accentDot,
                  { backgroundColor: theme[item.accent as keyof typeof theme] },
                ]}
              />
              <View style={styles.queueCopy}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.course} - {item.difficulty} difficulty
                </ThemedText>
              </View>
              <View style={styles.queueMeta}>
                <ThemedText type="smallBold">{item.due}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.dueTime}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </StudyCard>

        <StudyCard style={styles.column}>
          <SectionHeader title="Study Blocks" detail="A suggested rhythm for today." />
          {studyBlocks.map((block) => (
            <ThemedView key={block.label} type="backgroundElement" style={styles.blockRow}>
              <ThemedText type="smallBold">{block.time}</ThemedText>
              <View style={styles.queueCopy}>
                <ThemedText type="smallBold">{block.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {block.focus}
                </ThemedText>
              </View>
              <ThemedView type="backgroundSelected" style={styles.statusPill}>
                <ThemedText type="smallBold">{block.state}</ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </StudyCard>
      </View>

      <View style={styles.grid}>
        <StudyCard style={styles.column}>
          <SectionHeader title="Retention Insights" detail="What the optimizer is noticing." />
          {retentionInsights.map((insight) => (
            <ThemedView key={insight} style={styles.insightRow}>
              <View style={[styles.accentDot, { backgroundColor: theme.brandCoral }]} />
              <ThemedText type="smallBold" style={styles.insightText}>
                {insight}
              </ThemedText>
            </ThemedView>
          ))}
        </StudyCard>

        <StudyCard style={styles.column}>
          <SectionHeader title="Weak Topics" detail="Needs interleaving this week." />
          <View style={styles.topicWrap}>
            {weakTopics.map((topic) => (
              <ThemedView key={topic} type="backgroundElement" style={styles.topicPill}>
                <ThemedText type="smallBold">{topic}</ThemedText>
              </ThemedView>
            ))}
          </View>
        </StudyCard>
      </View>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  heroCard: {
    flexGrow: 2,
    flexBasis: 440,
  },
  metricGrid: {
    flexGrow: 1,
    flexBasis: 300,
    gap: Spacing.three,
  },
  metricCard: {
    minHeight: 148,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  column: {
    flexGrow: 1,
    flexBasis: 360,
  },
  queueItem: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  accentDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  queueCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  queueMeta: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  blockRow: {
    borderRadius: 12,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  insightRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  insightText: {
    flex: 1,
  },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  topicPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
