import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hasSupabaseConfig } from '@/lib/env';
import { listCachedAssets, listCachedSources } from '@/lib/parsing/cache';
import { pickStudyFiles } from '@/lib/parsing/document-picker';
import { getFixtureAssets, getFixtureSources } from '@/lib/parsing/fixtures';
import { refreshParsingState, uploadAndProcessFiles } from '@/lib/parsing/pipeline';
import { startProcessing } from '@/lib/parsing/supabase-api';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

function formatSize(size?: number) {
  if (!size) {
    return 'Unknown size';
  }

  if (size > 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function inferType(source: SourceRecord) {
  const lowerTitle = source.title.toLowerCase();

  if (source.mimeType.includes('pdf') || lowerTitle.endsWith('.pdf')) {
    return 'PDF';
  }

  if (lowerTitle.endsWith('.ppt') || lowerTitle.endsWith('.pptx')) {
    return 'Lecture slides';
  }

  if (lowerTitle.endsWith('.doc') || lowerTitle.endsWith('.docx')) {
    return 'Document';
  }

  if (source.mimeType.includes('text')) {
    return 'Text notes';
  }

  return 'Study material';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function stageLabel(source: SourceRecord) {
  if (source.status === 'ready') return 'Ready for review';
  if (source.status === 'needs_ocr') return 'Needs OCR';
  if (source.status === 'failed') return 'Failed';

  const labels: Record<SourceRecord['stage'], string> = {
    chunk: 'Chunking text',
    complete: 'Ready for review',
    embed: 'Creating embeddings',
    extract_text: 'Extracting text',
    failed: 'Failed',
    generate: 'Generating study pack',
    metadata: 'Preparing upload',
    ocr: 'Waiting for OCR',
    upload: 'Uploading file',
  };

  return labels[source.stage];
}

function countAssets(source: SourceRecord, assets: GeneratedAssetRecord[]) {
  const asset = assets.find((item) => item.sourceId === source.id);

  return {
    flashcards: asset?.content.flashcards.length ?? 0,
    notes: asset?.content.detailed_notes.length ?? 0,
    quizzes: asset?.content.quiz.length ?? 0,
  };
}

function mergeRemoteWithLocalDiagnostics(remoteSources: SourceRecord[], localSources: SourceRecord[]) {
  const localById = new Map(localSources.map((source) => [source.id, source]));

  return remoteSources.map((remoteSource) => {
    const localSource = localById.get(remoteSource.id);
    if (
      localSource?.status === 'failed' &&
      localSource.error &&
      (remoteSource.status === 'queued' || remoteSource.status === 'uploading')
    ) {
      return localSource;
    }

    return remoteSource;
  });
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [assets, setAssets] = useState<GeneratedAssetRecord[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(
    hasSupabaseConfig()
      ? 'Ready for PDF, slides, docs, or notes.'
      : 'Add Supabase public env vars to enable real uploads.'
  );

  const loadLocal = useCallback(async () => {
    const [cachedSources, cachedAssets] = await Promise.all([
      listCachedSources(),
      listCachedAssets(),
    ]);

    setSources(cachedSources.length > 0 ? cachedSources : getFixtureSources());
    setAssets(cachedAssets.length > 0 ? cachedAssets : getFixtureAssets());
  }, []);

  const refresh = useCallback(async () => {
    await loadLocal();

    if (!hasSupabaseConfig()) {
      return;
    }

    try {
      const nextState = await refreshParsingState();
      setSources((current) => mergeRemoteWithLocalDiagnostics(nextState.sources, current));
      setAssets(nextState.assets);
      setUploadMessage('Library refreshed from Supabase.');
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Could not refresh parsing state.');
    }
  }, [loadLocal]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [refresh]);

  const generatedTotals = useMemo(
    () =>
      assets.reduce(
        (totals, asset) => ({
          notes: totals.notes + asset.content.detailed_notes.length,
          flashcards: totals.flashcards + asset.content.flashcards.length,
          quizzes: totals.quizzes + asset.content.quiz.length,
        }),
        { notes: 0, flashcards: 0, quizzes: 0 }
      ),
    [assets]
  );

  const parsingCount = sources.filter(
    (source) => source.status === 'queued' || source.status === 'uploading' || source.status === 'processing'
  ).length;

  async function chooseFiles() {
    if (!hasSupabaseConfig()) {
      setUploadMessage('Add Supabase URL and anon key first, then restart the Expo server.');
      return;
    }

    setIsBusy(true);
    try {
      const files = await pickStudyFiles();
      if (files.length === 0) {
        setUploadMessage('No files selected.');
        return;
      }

      const results = await uploadAndProcessFiles(files);
      setSources((current) => [...results.map((result) => result.source), ...current]);
      const failedResults = results.filter((result) => result.source.status === 'failed');
      setUploadMessage(
        failedResults.length > 0
          ? failedResults[0].source.error ?? 'Upload succeeded, but processing did not start.'
          : `${files.length} source${files.length === 1 ? '' : 's'} uploaded and queued.`
      );
      if (failedResults.length === 0) {
        await refresh();
      }
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function retrySource(sourceId: string) {
    if (!hasSupabaseConfig()) {
      setUploadMessage('Add Supabase URL and anon key first, then restart the Expo server.');
      return;
    }

    setIsBusy(true);
    try {
      await startProcessing(sourceId);
      setUploadMessage('Processing restarted for that source.');
      await refresh();
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Could not restart processing.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <StudyScreen
      eyebrow="Source library"
      title="Turn materials into study assets"
      subtitle="Upload textbooks, lecture slides, PDFs, and notes, then track extraction, embeddings, and AI generation.">
      <View style={styles.grid}>
        <StudyCard style={[styles.uploadCard, { backgroundColor: theme.brandMint }]}>
          <ThemedText type="caption">Document upload</ThemedText>
          <ThemedText type="subtitle">Add a chapter, deck, or packet</ThemedText>
          <ThemedText type="small">
            Selected files are uploaded to Supabase Storage, parsed server-side, chunked, embedded,
            and turned into summaries, notes, flashcards, and quizzes.
          </ThemedText>
          <ThemedView style={[styles.uploadDropzone, { borderColor: theme.primary }]}>
            <ThemedText type="sectionTitle">Real parsing pipeline</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {uploadMessage}
            </ThemedText>
          </ThemedView>
          <View style={styles.buttonRow}>
            <ActionButton
              label={isBusy ? 'Uploading...' : 'Choose files'}
              onPress={chooseFiles}
            />
            <ActionButton label="Refresh" variant="secondary" onPress={refresh} />
            <ActionButton
              label="Open assets"
              variant="secondary"
              onPress={() => router.push('/assets')}
            />
          </View>
        </StudyCard>

        <StudyCard style={styles.statusCard}>
          <SectionHeader title="Generated Assets" detail={`${parsingCount} sources parsing`} />
          <View style={styles.assetGrid}>
            <View style={styles.assetRow}>
              <ThemedText type="metric">{generatedTotals.notes}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                notes
              </ThemedText>
            </View>
            <View style={styles.assetRow}>
              <ThemedText type="metric">{generatedTotals.flashcards}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                flashcards
              </ThemedText>
            </View>
            <View style={styles.assetRow}>
              <ThemedText type="metric">{generatedTotals.quizzes}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                quizzes
              </ThemedText>
            </View>
          </View>
        </StudyCard>
      </View>

      <StudyCard>
        <SectionHeader title="Parsing Queue" detail="Source metadata, progress, and generated output." />
        {sources.map((source) => {
          const sourceAssets = countAssets(source, assets);

          return (
            <ThemedView key={source.id} type="backgroundElement" style={styles.sourceRow}>
              <View style={styles.sourceCopy}>
                <ThemedText type="smallBold">{source.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {inferType(source)} - {formatSize(source.size)} - {formatDate(source.createdAt)}
                </ThemedText>
                {source.error && (
                  <ThemedText type="smallBold" style={{ color: theme.error }}>
                    {source.error}
                  </ThemedText>
                )}
                <ThemedView style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${source.progress}%`,
                        backgroundColor:
                          source.status === 'ready' ? theme.success : theme.brandCoral,
                      },
                    ]}
                  />
                </ThemedView>
              </View>
              <View style={styles.sourceMeta}>
                <ThemedView
                  type={source.status === 'ready' ? 'backgroundSelected' : 'cardStrong'}
                  style={styles.statusPill}>
                  <ThemedText type="smallBold">{stageLabel(source)}</ThemedText>
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary">
                  {sourceAssets.notes} notes / {sourceAssets.flashcards} cards /{' '}
                  {sourceAssets.quizzes} quizzes
                </ThemedText>
                {(source.status === 'failed' || source.status === 'needs_ocr') && (
                  <ActionButton
                    label={source.status === 'needs_ocr' ? 'Retry OCR' : 'Retry'}
                    variant="secondary"
                    onPress={() => retrySource(source.id)}
                  />
                )}
              </View>
            </ThemedView>
          );
        })}
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
  uploadDropzone: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderStyle: 'dashed',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  statusCard: {
    flexGrow: 1,
    flexBasis: 300,
  },
  assetGrid: {
    gap: Spacing.three,
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
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  sourceCopy: {
    flex: 1,
    minWidth: 260,
    gap: Spacing.two,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sourceMeta: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
