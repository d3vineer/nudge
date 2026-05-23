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
  const isDark = theme.background === '#07111F';
  const totalDueCards = dailyQueue.reduce((sum, item) => sum + Number.parseInt(item.due, 10), 0);
  const readySources = sources.filter((source) => source.progress === 100).length;

  return (
    <StudyScreen
      eyebrow="Today"
      title="Your study plan is ready"
      subtitle="A simple queue for what to review, read, and focus on next.">
      <View style={styles.heroGrid}>
        <StudyCard style={[styles.heroCard, styles.heroGlowCard, isDark && styles.heroGlowCardDark]}>
          <ThemedText type="caption" style={{ color: theme.primary }}>
            Risk today
          </ThemedText>
          <ThemedText type="metric">
            23%
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            You are in a good spot after recent reviews.
          </ThemedText>
          <View style={styles.buttonRow}>
            <ActionButton label="Start review" onPress={() => router.push('/reviews')} />
            <ActionButton
              label="Add material"
              variant="secondary"
              onPress={() => router.push('/library')}
            />
          </View>
        </StudyCard>

        <View style={styles.metricGrid}>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandLavender }]}>
            <ThemedText type="caption">Review</ThemedText>
            <ThemedText type="metric">{totalDueCards}</ThemedText>
            <ThemedText type="small">cards due now</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandPeach }]}>
            <ThemedText type="caption">Focus</ThemedText>
            <ThemedText type="metric">50</ThemedText>
            <ThemedText type="small">minutes suggested</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandMint }]}>
            <ThemedText type="caption">Materials</ThemedText>
            <ThemedText type="metric">{readySources}/{sources.length}</ThemedText>
            <ThemedText type="small">ready to study</ThemedText>
          </StudyCard>
        </View>
      </View>

      <View style={styles.grid}>
        <StudyCard style={[styles.column, styles.playfulPanel, isDark && styles.playfulPanelDark]}>
          <SectionHeader title="Today’s Queue" detail="Start with these." />
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
                  {item.course} - {item.difficulty}
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

        <StudyCard style={[styles.column, styles.playfulPanelAlt, isDark && styles.playfulPanelAltDark]}>
          <SectionHeader title="Study Blocks" detail="A gentle plan for the day." />
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
        <StudyCard style={[styles.column, styles.playfulPanelAlt, isDark && styles.playfulPanelAltDark]}>
          <SectionHeader title="Notes From Nudge" detail="Small things to keep in mind." />
          {retentionInsights.map((insight) => (
            <ThemedView key={insight} style={styles.insightRow}>
              <View style={[styles.accentDot, { backgroundColor: theme.brandCoral }]} />
              <ThemedText type="smallBold" style={styles.insightText}>
                {insight}
              </ThemedText>
            </ThemedView>
          ))}
        </StudyCard>

        <StudyCard style={[styles.column, styles.playfulPanel, isDark && styles.playfulPanelDark]}>
          <SectionHeader title="Needs Practice" detail="Mix these into your next session." />
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
  heroGlowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    boxShadow: '0 28px 80px rgba(184, 164, 237, 0.2), 0 0 70px rgba(164, 212, 197, 0.28)',
  },
  heroGlowCardDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    boxShadow: '0 28px 80px rgba(96, 165, 250, 0.12), 0 0 70px rgba(184, 164, 237, 0.1)',
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
  playfulPanel: {
    backgroundColor: 'rgba(184, 164, 237, 0.16)',
  },
  playfulPanelAlt: {
    backgroundColor: 'rgba(164, 212, 197, 0.24)',
  },
  playfulPanelDark: {
    backgroundColor: 'rgba(184, 164, 237, 0.12)',
  },
  playfulPanelAltDark: {
    backgroundColor: 'rgba(164, 212, 197, 0.1)',
  },
  queueItem: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  accentDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    boxShadow: '0 0 18px rgba(96, 165, 250, 0.34)',
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
