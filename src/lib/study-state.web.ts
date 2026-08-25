import type { ReviewCard } from '@/lib/spaced-repetition';
import type { FocusSessionRecord, PersistedStudyState } from '@/types/study-state';

const reviewCardsKey = 'nudge.reviewCards';
const sessionsKey = 'nudge.focusSessions';
let memoryState: PersistedStudyState = {
  reviewCards: [],
  sessions: [],
};

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

function readStorage<T>(key: string): T[] {
  if (!canUseStorage()) return [];

  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, values: T[]) {
  if (canUseStorage()) {
    localStorage.setItem(key, JSON.stringify(values));
  }
}

export async function saveReviewCards(cards: ReviewCard[]) {
  memoryState = { ...memoryState, reviewCards: cards };
  writeStorage(reviewCardsKey, cards);
}

export async function loadReviewCards(): Promise<ReviewCard[]> {
  const stored = readStorage<ReviewCard>(reviewCardsKey);
  return stored.length > 0 ? stored : memoryState.reviewCards;
}

export async function saveFocusSession(session: FocusSessionRecord) {
  const sessions = [session, ...readStorage<FocusSessionRecord>(sessionsKey)].slice(0, 100);
  memoryState = { ...memoryState, sessions };
  writeStorage(sessionsKey, sessions);
}

export async function loadFocusSessions(): Promise<FocusSessionRecord[]> {
  const stored = readStorage<FocusSessionRecord>(sessionsKey);
  return stored.length > 0 ? stored : memoryState.sessions;
}

export async function loadStudyState(): Promise<PersistedStudyState> {
  const [reviewCards, sessions] = await Promise.all([loadReviewCards(), loadFocusSessions()]);
  return { reviewCards, sessions };
}
