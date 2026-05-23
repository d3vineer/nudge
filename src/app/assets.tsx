import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hasSupabaseConfig } from '@/lib/env';
import { listCachedAssets, listCachedSources } from '@/lib/parsing/cache';
import { getFixtureAssets, getFixtureSources } from '@/lib/parsing/fixtures';
import { refreshParsingState } from '@/lib/parsing/pipeline';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

type AssetView = 'summary' | 'notes' | 'flashcards' | 'quiz';

const assetTabs: { id: AssetView; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'notes', label: 'Notes' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
];

function sourceLabel(source?: SourceRecord) {
  if (!source) {
    return 'Generated source';
  }

  if (source.status === 'ready') {
    return 'Ready';
  }

  if (source.status === 'needs_ocr') {
    return 'Needs OCR';
  }

  if (source.status === 'failed') {
    return 'Failed';
  }

  return 'Processing';
}

function sourceType(source?: SourceRecord) {
  if (!source) return 'Study material';
  if (source.mimeType.includes('pdf')) return 'PDF';
  if (source.mimeType.includes('presentation')) return 'Slides';
  if (source.mimeType.includes('wordprocessing')) return 'Document';
  if (source.mimeType.includes('text')) return 'Text notes';
  return 'Study material';
}

export default function AssetsScreen() {
  const theme = useTheme();
  const [assets, setAssets] = useState<GeneratedAssetRecord[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [assetView, setAssetView] = useState<AssetView>('summary');
  const [statusText, setStatusText] = useState('Loading generated study packs...');

  const loadAssets = useCallback(async () => {
    const [cachedSources, cachedAssets] = await Promise.all([
      listCachedSources(),
      listCachedAssets(),
    ]);
    const localAssets = cachedAssets.length > 0 ? cachedAssets : getFixtureAssets();
    const localSources = cachedSources.length > 0 ? cachedSources : getFixtureSources();

    setAssets(localAssets);
    setSources(localSources);
    setSelectedAssetId((current) => current || localAssets[0]?.id || '');
    setStatusText(
      cachedAssets.length > 0
        ? 'Showing cached generated assets.'
        : 'Showing demo assets until real uploads finish.'
    );

    if (!hasSupabaseConfig()) {
      return;
    }

    try {
      const remoteState = await refreshParsingState();
      const nextAssets = remoteState.assets.length > 0 ? remoteState.assets : localAssets;
      setAssets(nextAssets);
      setSources(remoteState.sources.length > 0 ? remoteState.sources : localSources);
      setSelectedAssetId((current) => current || nextAssets[0]?.id || '');
      setStatusText('Synced generated assets from Supabase.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Could not refresh generated assets.');
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0],
    [assets, selectedAssetId]
  );
  const selectedSource = sources.find((source) => source.id === selectedAsset?.sourceId);

  return (
    <StudyScreen
      eyebrow="AI-generated study assets"
      title="Summaries, notes, cards, and quizzes"
      subtitle="Generated outputs now come from uploaded source content, with local cache used first for fast reloads.">
      <View style={styles.grid}>
        <StudyCard style={styles.sourcePanel}>
          <SectionHeader title="Generated Sources" detail={statusText} />
          <ActionButton label="Refresh" variant="secondary" onPress={loadAssets} />
          {assets.map((asset) => {
            const source = sources.find((item) => item.id === asset.sourceId);
            const isSelected = asset.id === selectedAsset?.id;

            return (
              <Pressable
                key={asset.id}
                onPress={() => setSelectedAssetId(asset.id)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView
                  type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                  style={[
                    styles.sourceButton,
                    { borderColor: isSelected ? theme.primary : theme.hairline },
                  ]}>
                  <View style={styles.sourceCopy}>
                    <ThemedText type="smallBold">{asset.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {sourceType(source)} - {asset.content.flashcards.length} cards
                    </ThemedText>
                  </View>
                  <ThemedView
                    style={[
                      styles.readinessPill,
                      {
                        backgroundColor:
                          source?.status === 'ready' || !source ? theme.success : theme.brandOchre,
                      },
                    ]}>
                    <ThemedText type="smallBold">{sourceLabel(source)}</ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            );
          })}
        </StudyCard>

        <StudyCard style={styles.contentPanel}>
          {selectedAsset ? (
            <>
              <View style={styles.contentHeader}>
                <View style={styles.sourceCopy}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {sourceType(selectedSource)}
                  </ThemedText>
                  <ThemedText type="sectionTitle">{selectedAsset.title}</ThemedText>
                </View>
                <ThemedView type="backgroundElement" style={styles.modelPill}>
                  <ThemedText type="smallBold">AI study pack</ThemedText>
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
                        <ThemedText
                          type="smallBold"
                          themeColor={isSelected ? 'text' : 'textSecondary'}>
                          {tab.label}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>

              {assetView === 'summary' && (
                <ThemedView style={[styles.summaryCard, { backgroundColor: theme.brandLavender }]}>
                  <ThemedText type="caption">Source Summary</ThemedText>
                  <ThemedText type="default">{selectedAsset.content.summary}</ThemedText>
                </ThemedView>
              )}

              {assetView === 'notes' && (
                <View style={styles.stack}>
                  {selectedAsset.content.detailed_notes.map((note, index) => (
                    <ThemedView key={`${note}-${index}`} type="backgroundElement" style={styles.noteRow}>
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
                  {selectedAsset.content.flashcards.map((card, index) => (
                    <ThemedView key={`${card.front}-${index}`} type="backgroundElement" style={styles.flashcard}>
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
                  {selectedAsset.content.quiz.map((question, index) => (
                    <ThemedView key={`${question.question}-${index}`} type="backgroundElement" style={styles.quizCard}>
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
            </>
          ) : (
            <ThemedView type="backgroundElement" style={styles.emptyState}>
              <ThemedText type="sectionTitle">No generated assets yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Upload a source in Library, then refresh this screen after parsing completes.
              </ThemedText>
            </ThemedView>
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
  emptyState: {
    borderRadius: 16,
    borderCurve: 'continuous',
    gap: Spacing.two,
    padding: Spacing.four,
  },
});
