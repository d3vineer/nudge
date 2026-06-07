import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildReviewCardsFromGeneratedAssets, mergeReviewCardsWithGeneratedCards } from '@/lib/generated-review-cards';
import { listCachedAssets, listCachedSources } from '@/lib/parsing/cache';
import { formatDueDate, getDueState, getRetrievability, type ReviewCard } from '@/lib/spaced-repetition';
import { calculateDashboardReviewMetrics, detectWeakTopics, getStudyStreak } from '@/lib/study-analytics';
import { loadFocusSessions, loadReviewCards } from '@/lib/study-state';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function riskMessage(risk: number) {
  if (risk < 35) return 'You’re in a good spot after recent reviews.';
  if (risk < 70) return 'A short review will help keep things fresh.';
  return 'Some cards are slipping. Start with a quick review.';
}

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.background === '#07111F';
  const [hasRealMaterials, setHasRealMaterials] = useState(false);
  const [hasReviewState, setHasReviewState] = useState(false);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [studyStreak, setStudyStreak] = useState(0);
  const hasStudyPlan = hasRealMaterials || hasReviewState;
  const reviewMetrics = useMemo(
    () => calculateDashboardReviewMetrics(reviewCards),
    [reviewCards]
  );
  const dueReviewCards = useMemo(
    () =>
      reviewCards
        .filter((card) => getDueState(card))
        .sort((first, second) => getRetrievability(first) - getRetrievability(second))
        .slice(0, 3),
    [reviewCards]
  );
  const weakTopicItems = useMemo(() => detectWeakTopics(reviewCards), [reviewCards]);
  const studyBlocks = useMemo(
    () => [
      {
        focus: dueReviewCards[0]?.course ?? 'Add study material',
        label: 'First review',
        state: dueReviewCards[0] ? 'Due' : 'Ready',
        time: 'Now',
      },
      {
        focus: dueReviewCards[1]?.course ?? 'Read notes',
        label: 'Short recall',
        state: dueReviewCards[1] ? 'Due' : 'Optional',
        time: 'Later',
      },
      {
        focus: dueReviewCards[2]?.course ?? 'Try a quiz',
        label: 'Mixed practice',
        state: dueReviewCards[2] ? 'Light' : 'Optional',
        time: 'Evening',
      },
    ],
    [dueReviewCards]
  );

  useFocusEffect(useCallback(() => {
    let isMounted = true;
    Promise.all([listCachedSources(), listCachedAssets(), loadReviewCards(), loadFocusSessions()]).then(([cachedSources, cachedAssets, storedCards, sessions]) => {
      if (!isMounted) return;
      setHasRealMaterials(cachedSources.some((source) => !source.id.startsWith('fixture-')));
      const generatedCards = buildReviewCardsFromGeneratedAssets(cachedAssets, cachedSources);
      const nextCards = mergeReviewCardsWithGeneratedCards(storedCards, generatedCards);
      setHasReviewState(nextCards.length > 0);
      setReviewCards(nextCards);
      setStudyStreak(getStudyStreak(sessions));
    });

    return () => {
      isMounted = false;
    };
  }, []));

  return (
    <StudyScreen
      eyebrow="Today"
      title={hasStudyPlan ? 'Your study plan is ready' : 'Start with one study material'}
      subtitle={
        hasStudyPlan
          ? 'A simple queue for what to review, read, and focus on next.'
          : 'Upload a PDF, slide deck, image, or pasted notes. Nudge will turn it into a study pack.'
      }>
      <View style={styles.heroGrid}>
        <StudyCard style={[styles.heroCard, styles.heroGlowCard, isDark && styles.heroGlowCardDark]}>
          <ThemedText type="caption" style={{ color: theme.primary }}>
            {hasStudyPlan ? 'Risk today' : 'First step'}
          </ThemedText>
          <ThemedText type="metric">
            {hasStudyPlan ? `${reviewMetrics.riskToday}%` : 'Upload'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {hasStudyPlan
              ? riskMessage(reviewMetrics.riskToday)
              : 'Create summaries, notes, flashcards, quizzes, and a review queue from one source.'}
          </ThemedText>
          <View style={styles.buttonRow}>
            <ActionButton
              label={hasStudyPlan ? 'Start review' : 'Add first material'}
              onPress={() => router.push(hasStudyPlan ? '/reviews' : '/library')}
            />
            <ActionButton
              label={hasStudyPlan ? 'Add material' : 'See study tools'}
              variant="secondary"
              onPress={() => router.push(hasStudyPlan ? '/library' : '/assets')}
            />
          </View>
        </StudyCard>

        <View style={styles.metricGrid}>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandLavender }]}>
            <ThemedText type="caption">Review</ThemedText>
            <ThemedText type="metric">{reviewMetrics.dueCount}</ThemedText>
            <ThemedText type="small">cards due now</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandPeach }]}>
            <ThemedText type="caption">Recall</ThemedText>
            <ThemedText type="metric">{formatPercent(reviewMetrics.averageRecall)}</ThemedText>
            <ThemedText type="small">average right now</ThemedText>
          </StudyCard>
          <StudyCard style={[styles.metricCard, { backgroundColor: theme.brandMint }]}>
            <ThemedText type="caption">Streak</ThemedText>
            <ThemedText type="metric">{studyStreak}</ThemedText>
            <ThemedText type="small">active day{studyStreak === 1 ? '' : 's'}</ThemedText>
          </StudyCard>
        </View>
      </View>

      <View style={styles.grid}>
        <StudyCard style={[styles.column, styles.playfulPanel, isDark && styles.playfulPanelDark]}>
          <SectionHeader title="Today’s Queue" detail="Start with these." />
          {dueReviewCards.length > 0 ? (
            dueReviewCards.map((item) => (
              <ThemedView key={item.id} style={styles.queueItem}>
                <View style={[styles.accentDot, { backgroundColor: theme.brandPink }]} />
                <View style={styles.queueCopy}>
                  <ThemedText type="smallBold">{item.topic}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.course} - difficulty {item.difficulty.toFixed(1)}
                  </ThemedText>
                </View>
                <View style={styles.queueMeta}>
                  <ThemedText type="smallBold">1 card</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDueDate(item.dueAt)}
                  </ThemedText>
                </View>
              </ThemedView>
            ))
          ) : (
            <ThemedView type="backgroundElement" style={styles.emptyPanel}>
              <ThemedText type="smallBold">No reviews due yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Seed or upload materials to build your first queue.
              </ThemedText>
            </ThemedView>
          )}
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
          {[
            reviewCards.length > 0
              ? 'Your review mix now comes from generated flashcards.'
              : 'Upload or seed PDFs to generate summaries, notes, cards, and quizzes.',
            'Alternating subjects can make recall practice more durable.',
            studyStreak > 0
              ? `You have a ${studyStreak}-day study streak.`
              : 'Complete a focus block to start your streak.',
          ].map((insight) => (
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
            {(weakTopicItems.length > 0 ? weakTopicItems.map((item) => item.topic) : ['No weak topics yet']).map((topic) => (
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
    flexBasis: 320,
    minWidth: 0,
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
    flexBasis: 260,
    gap: Spacing.two,
    minWidth: 0,
  },
  metricCard: {
    minHeight: 116,
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
    flexBasis: 300,
    minWidth: 0,
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
    gap: Spacing.two,
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
    minWidth: 0,
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
    gap: Spacing.two,
    padding: Spacing.four,
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
    minWidth: 0,
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
  emptyPanel: {
    borderCurve: 'continuous',
    borderRadius: 18,
    gap: Spacing.one,
    padding: Spacing.four,
  },
});
