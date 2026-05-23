import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { generatedMaterials } from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AssetView = 'summary' | 'notes' | 'flashcards' | 'quiz';

const assetTabs: { id: AssetView; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'notes', label: 'Notes' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
];

export default function AssetsScreen() {
  const theme = useTheme();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(generatedMaterials[0].id);
  const [assetView, setAssetView] = useState<AssetView>('summary');
  const selectedMaterial = useMemo(
    () =>
      generatedMaterials.find((material) => material.id === selectedMaterialId) ??
      generatedMaterials[0],
    [selectedMaterialId]
  );

  return (
    <StudyScreen
      eyebrow="AI-generated study assets"
      title="Summaries, notes, cards, and quizzes"
      subtitle="Mock AI outputs are wired into the UI now, so the generation pipeline can plug in later.">
      <View style={styles.grid}>
        <StudyCard style={styles.sourcePanel}>
          <SectionHeader title="Generated Sources" detail="Select a parsed material." />
          {generatedMaterials.map((material) => {
            const isSelected = material.id === selectedMaterial.id;

            return (
              <Pressable
                key={material.id}
                onPress={() => setSelectedMaterialId(material.id)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView
                  type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                  style={[
                    styles.sourceButton,
                    { borderColor: isSelected ? theme.primary : theme.hairline },
                  ]}>
                  <View style={styles.sourceCopy}>
                    <ThemedText type="smallBold">{material.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {material.course} - {material.sourceType}
                    </ThemedText>
                  </View>
                  <ThemedView
                    style={[
                      styles.readinessPill,
                      {
                        backgroundColor:
                          material.readiness === 'Ready' ? theme.success : theme.brandOchre,
                      },
                    ]}>
                    <ThemedText type="smallBold">{material.readiness}</ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            );
          })}
        </StudyCard>

        <StudyCard style={styles.contentPanel}>
          <View style={styles.contentHeader}>
            <View style={styles.sourceCopy}>
              <ThemedText type="caption" themeColor="textSecondary">
                {selectedMaterial.course}
              </ThemedText>
              <ThemedText type="sectionTitle">{selectedMaterial.title}</ThemedText>
            </View>
            <ThemedView type="backgroundElement" style={styles.modelPill}>
              <ThemedText type="smallBold">AI draft</ThemedText>
            </ThemedView>
          </View>

          <View style={styles.tabRow}>
            {assetTabs.map((tab) => {
              const isSelected = tab.id === assetView;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setAssetView(tab.id)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView
                    type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                    style={styles.assetTab}>
                    <ThemedText type="smallBold" themeColor={isSelected ? 'text' : 'textSecondary'}>
                      {tab.label}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>

          {assetView === 'summary' && (
            <ThemedView style={[styles.summaryCard, { backgroundColor: theme.brandLavender }]}>
              <ThemedText type="caption">Chapter Summary</ThemedText>
              <ThemedText type="default">{selectedMaterial.summary}</ThemedText>
            </ThemedView>
          )}

          {assetView === 'notes' && (
            <View style={styles.stack}>
              {selectedMaterial.notes.map((note, index) => (
                <ThemedView key={note} type="backgroundElement" style={styles.noteRow}>
                  <ThemedView type="backgroundSelected" style={styles.indexBadge}>
                    <ThemedText type="smallBold">{index + 1}</ThemedText>
                  </ThemedView>
                  <ThemedText type="smallBold" style={styles.flexText}>
                    {note}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          )}

          {assetView === 'flashcards' && (
            <View style={styles.cardGrid}>
              {selectedMaterial.flashcards.map((card) => (
                <ThemedView key={card.front} type="backgroundElement" style={styles.flashcard}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Prompt
                  </ThemedText>
                  <ThemedText type="sectionTitle">{card.front}</ThemedText>
                  <ThemedView type="backgroundSelected" style={styles.answerBox}>
                    <ThemedText type="smallBold">{card.back}</ThemedText>
                  </ThemedView>
                </ThemedView>
              ))}
            </View>
          )}

          {assetView === 'quiz' && (
            <View style={styles.stack}>
              {selectedMaterial.quiz.map((question, index) => (
                <ThemedView key={question.question} type="backgroundElement" style={styles.quizCard}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Question {index + 1}
                  </ThemedText>
                  <ThemedText type="sectionTitle">{question.question}</ThemedText>
                  <View style={styles.choiceList}>
                    {question.choices.map((choice) => (
                      <ThemedView
                        key={choice}
                        type={choice === question.answer ? 'backgroundSelected' : 'card'}
                        style={[
                          styles.choicePill,
                          choice === question.answer && { borderColor: theme.success },
                        ]}>
                        <ThemedText type="smallBold">{choice}</ThemedText>
                      </ThemedView>
                    ))}
                  </View>
                </ThemedView>
              ))}
            </View>
          )}
        </StudyCard>
      </View>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  sourcePanel: {
    flexGrow: 1,
    flexBasis: 320,
  },
  contentPanel: {
    flexGrow: 2,
    flexBasis: 540,
  },
  pressed: {
    opacity: 0.72,
  },
  sourceButton: {
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  sourceCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  readinessPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  contentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  modelPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  assetTab: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  summaryCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  stack: {
    gap: Spacing.three,
  },
  noteRow: {
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexText: {
    flex: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  flashcard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    flexGrow: 1,
    flexBasis: 240,
    gap: Spacing.three,
    minHeight: 220,
    padding: Spacing.three,
  },
  answerBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    marginTop: 'auto',
    padding: Spacing.three,
  },
  quizCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  choiceList: {
    gap: Spacing.two,
  },
  choicePill: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
});
