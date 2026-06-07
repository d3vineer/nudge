import { addDays, type ReviewCard } from '@/lib/spaced-repetition';
import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function sourceForAsset(asset: GeneratedAssetRecord, sources: SourceRecord[]) {
  return sources.find((source) => source.id === asset.sourceId);
}

export function buildReviewCardsFromGeneratedAssets(
  assets: GeneratedAssetRecord[],
  sources: SourceRecord[],
  now = new Date()
): ReviewCard[] {
  return assets.flatMap((asset) => {
    const source = sourceForAsset(asset, sources);
    const course = source?.subject?.trim() || 'General';
    const topic = source?.topic?.trim() || 'General';

    return asset.content.flashcards.map((flashcard, index) => ({
      answer: flashcard.back,
      course,
      difficulty: 5,
      dueAt: now.toISOString(),
      id: `generated-${asset.sourceId}-${index}-${slug(flashcard.front)}`,
      lastReviewedAt: addDays(now, -1).toISOString(),
      prompt: flashcard.front,
      reviewHistory: [],
      stability: 1,
      topic,
    }));
  });
}

export function mergeReviewCardsWithGeneratedCards(
  savedCards: ReviewCard[],
  generatedCards: ReviewCard[]
) {
  const savedIds = new Set(savedCards.map((card) => card.id));
  return [...savedCards, ...generatedCards.filter((card) => !savedIds.has(card.id))];
}
