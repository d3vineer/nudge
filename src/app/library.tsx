import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { sources } from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const theme = useTheme();

  return (
    <StudyScreen
      eyebrow="Source library"
      title="Turn materials into study assets"
      subtitle="Keep textbooks, lecture slides, PDFs, and notes organized by course and generation status.">
      <View style={styles.grid}>
        <StudyCard style={[styles.uploadCard, { backgroundColor: theme.brandMint }]}>
          <ThemedText type="caption">Document upload</ThemedText>
          <ThemedText type="subtitle">Add a chapter, deck, or packet</ThemedText>
          <ThemedText type="small">
            PDF and slide parsing will feed summaries, notes, cards, and quizzes.
          </ThemedText>
          <View style={styles.buttonRow}>
            <ActionButton label="Choose files" />
            <ActionButton label="Paste notes" variant="secondary" />
          </View>
        </StudyCard>

        <StudyCard style={styles.statusCard}>
          <SectionHeader title="Generated Assets" />
          <View style={styles.assetRow}>
            <ThemedText type="metric">42</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              flashcards ready
            </ThemedText>
          </View>
          <View style={styles.assetRow}>
            <ThemedText type="metric">7</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              quizzes drafted
            </ThemedText>
          </View>
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader title="Recent Sources" detail="Prepared for AI parsing and review planning." />
        {sources.map((source) => (
          <ThemedView key={source.title} style={styles.sourceRow}>
            <View style={styles.sourceCopy}>
              <ThemedText type="smallBold">{source.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {source.type}
              </ThemedText>
            </View>
            <ThemedView type="backgroundElement" style={styles.statusPill}>
              <ThemedText type="smallBold">{source.status}</ThemedText>
            </ThemedView>
          </ThemedView>
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
  uploadCard: {
    flexGrow: 2,
    flexBasis: 440,
  },
  statusCard: {
    flexGrow: 1,
    flexBasis: 280,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  assetRow: {
    gap: Spacing.one,
  },
  sourceRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  sourceCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
