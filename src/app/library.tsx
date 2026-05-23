import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ActionButton, SectionHeader, StudyCard } from '@/components/study-card';
import { StudyScreen } from '@/components/study-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { sources } from '@/constants/study-flow';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LibrarySource = {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  size: string;
  importedAt: string;
  course: string;
  assets: {
    notes: number;
    flashcards: number;
    quizzes: number;
  };
};

function formatSize(size?: number) {
  if (!size) {
    return 'Unknown size';
  }

  if (size > 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function inferType(name: string, mimeType?: string) {
  const lowerName = name.toLowerCase();

  if (mimeType?.includes('pdf') || lowerName.endsWith('.pdf')) {
    return 'PDF';
  }

  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) {
    return 'Lecture slides';
  }

  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
    return 'Document';
  }

  return 'Study material';
}

function assetEstimate(index: number) {
  return {
    notes: 2 + index,
    flashcards: 10 + index * 4,
    quizzes: 1 + (index % 3),
  };
}

const initialSources: LibrarySource[] = sources.map((source, index) => ({
  id: `seed-${index}`,
  ...source,
}));

export default function LibraryScreen() {
  const theme = useTheme();
  const [librarySources, setLibrarySources] = useState<LibrarySource[]>(initialSources);
  const [uploadMessage, setUploadMessage] = useState('Ready for PDF, slides, docs, or notes.');
  const parserTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const generatedTotals = useMemo(
    () =>
      librarySources.reduce(
        (totals, source) => ({
          notes: totals.notes + source.assets.notes,
          flashcards: totals.flashcards + source.assets.flashcards,
          quizzes: totals.quizzes + source.assets.quizzes,
        }),
        { notes: 0, flashcards: 0, quizzes: 0 }
      ),
    [librarySources]
  );

  const parsingCount = librarySources.filter((source) => source.progress < 100).length;

  useEffect(
    () => () => {
      parserTimers.current.forEach(clearTimeout);
    },
    []
  );

  function scheduleParsing(ids: string[]) {
    const midpointTimer = setTimeout(() => {
      setLibrarySources((current) =>
        current.map((source) =>
          ids.includes(source.id)
            ? { ...source, progress: 68, status: 'Generating flashcards' }
            : source
        )
      );
    }, 800);

    const completeTimer = setTimeout(() => {
      setLibrarySources((current) =>
        current.map((source) =>
          ids.includes(source.id)
            ? { ...source, progress: 100, status: 'Ready for review' }
            : source
        )
      );
      setUploadMessage('Parsing complete. New notes, flashcards, and quizzes are ready.');
    }, 1800);

    parserTimers.current.push(midpointTimer, completeTimer);
  }

  function addSources(nextSources: LibrarySource[]) {
    const ids = nextSources.map((source) => source.id);

    setLibrarySources((current) => [...nextSources, ...current]);
    setUploadMessage(`${nextSources.length} source${nextSources.length === 1 ? '' : 's'} queued.`);
    scheduleParsing(ids);
  }

  function chooseFiles() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      addSampleNotes();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.ppt,.pptx,.doc,.docx,.txt,text/plain,application/pdf';
    input.onchange = () => {
      const selectedFiles = Array.from(input.files ?? []);

      if (selectedFiles.length === 0) {
        return;
      }

      addSources(
        selectedFiles.map((file, index) => ({
          id: `file-${file.name}-${Date.now()}-${index}`,
          title: file.name,
          type: inferType(file.name, file.type),
          status: 'Parsing document',
          progress: 28,
          size: formatSize(file.size),
          importedAt: 'Just now',
          course: 'Unsorted',
          assets: assetEstimate(index),
        }))
      );
    };
    input.click();
  }

  function addSampleNotes() {
    addSources([
      {
        id: `notes-${Date.now()}`,
        title: 'Pasted study notes',
        type: 'Notes',
        status: 'Parsing notes',
        progress: 36,
        size: '2 KB',
        importedAt: 'Just now',
        course: 'Unsorted',
        assets: { notes: 1, flashcards: 8, quizzes: 1 },
      },
    ]);
  }

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
            Imported sources enter a parsing queue for summaries, notes, flashcards, and quizzes.
          </ThemedText>
          <ThemedView style={[styles.uploadDropzone, { borderColor: theme.primary }]}>
            <ThemedText type="sectionTitle">Drop zone model</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {uploadMessage}
            </ThemedText>
          </ThemedView>
          <View style={styles.buttonRow}>
            <ActionButton label="Choose files" onPress={chooseFiles} />
            <ActionButton label="Paste notes" variant="secondary" onPress={addSampleNotes} />
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
        <SectionHeader title="Parsing Queue" detail="Source metadata and generated study output." />
        {librarySources.map((source) => (
          <ThemedView key={source.id} type="backgroundElement" style={styles.sourceRow}>
            <View style={styles.sourceCopy}>
              <ThemedText type="smallBold">{source.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {source.type} - {source.course} - {source.size} - {source.importedAt}
              </ThemedText>
              <ThemedView style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${source.progress}%`,
                      backgroundColor:
                        source.progress === 100 ? theme.success : theme.brandCoral,
                    },
                  ]}
                />
              </ThemedView>
            </View>
            <View style={styles.sourceMeta}>
              <ThemedView
                type={source.progress === 100 ? 'backgroundSelected' : 'cardStrong'}
                style={styles.statusPill}>
                <ThemedText type="smallBold">{source.status}</ThemedText>
              </ThemedView>
              <ThemedText type="small" themeColor="textSecondary">
                {source.assets.notes} notes / {source.assets.flashcards} cards /{' '}
                {source.assets.quizzes} quizzes
              </ThemedText>
            </View>
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
