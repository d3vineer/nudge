import { generatedMaterials, sources } from '@/constants/study-flow';
import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

function sourceMimeType(type: string) {
  if (type.toLowerCase().includes('slide')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }

  if (type.toLowerCase().includes('pdf')) {
    return 'application/pdf';
  }

  return 'text/plain';
}

export function getFixtureSources(): SourceRecord[] {
  return sources.map((source, index) => ({
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    error: null,
    id: `fixture-source-${index}`,
    mimeType: sourceMimeType(source.type),
    progress: source.progress,
    size: 0,
    stage: source.progress === 100 ? 'complete' : 'generate',
    status: source.progress === 100 ? 'ready' : 'processing',
    storagePath: `fixtures/${index}`,
    title: source.title,
    updatedAt: new Date(Date.now() - index * 43_200_000).toISOString(),
  }));
}

export function getFixtureAssets(): GeneratedAssetRecord[] {
  return generatedMaterials.map((material, index) => ({
    content: {
      detailed_notes: [...material.notes],
      flashcards: [...material.flashcards],
      quiz: material.quiz.map((question) => ({
        answer: question.answer,
        choices: [...question.choices],
        question: question.question,
      })),
      summary: material.summary,
      weak_topics: [],
    },
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    id: `fixture-asset-${material.id}`,
    sourceId: `fixture-source-${index}`,
    title: material.title,
    type: 'study_pack',
  }));
}
