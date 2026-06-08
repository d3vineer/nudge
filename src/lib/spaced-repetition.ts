export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';

export type ReviewHistoryItem = {
  reviewedAt: string;
  grade: RecallGrade;
  recallScore: number;
  elapsedDays: number;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  retrievabilityBefore: number;
  nextDueAt: string;
};

export type ReviewCard = {
  id: string;
  prompt: string;
  answer: string;
  topic: string;
  course: string;
  difficulty: number;
  stability: number;
  lastReviewedAt: string;
  dueAt: string;
  reviewHistory: ReviewHistoryItem[];
};

export const recallGrades: Array<{
  id: RecallGrade;
  label: string;
  score: number;
  tone: 'again' | 'hard' | 'good' | 'easy';
}> = [
  { id: 'again', label: 'Again', score: 1, tone: 'again' },
  { id: 'hard', label: 'Hard', score: 2, tone: 'hard' },
  { id: 'good', label: 'Good', score: 3, tone: 'good' },
  { id: 'easy', label: 'Easy', score: 4, tone: 'easy' },
];

const dayMs = 86_400_000;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

export function daysBetween(from: Date, to: Date) {
  return Math.max(0, (to.getTime() - from.getTime()) / dayMs);
}

export function getElapsedDays(card: ReviewCard, now = new Date()) {
  return daysBetween(new Date(card.lastReviewedAt), now);
}

export function getRetrievability(card: ReviewCard, now = new Date()) {
  const elapsedDays = getElapsedDays(card, now);
  return Math.exp(-elapsedDays / Math.max(card.stability, 0.1));
}

export function getDueState(card: ReviewCard, now = new Date()) {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

export function formatDueDate(value: string, now = new Date()) {
  const due = new Date(value);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / dayMs);

  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nextIntervalDays(grade: RecallGrade, stability: number, difficulty: number) {
  if (grade === 'again') return 0.15;
  if (grade === 'hard') return Math.max(1, stability * (1.15 - difficulty * 0.025));
  if (grade === 'good') return Math.max(2, stability * (2.35 - difficulty * 0.06));
  return Math.max(4, stability * (3.35 - difficulty * 0.08));
}

export function reviewCard(card: ReviewCard, grade: RecallGrade, now = new Date()): ReviewCard {
  const gradeMeta = recallGrades.find((item) => item.id === grade) ?? recallGrades[2];
  const elapsedDays = getElapsedDays(card, now);
  const retrievabilityBefore = getRetrievability(card, now);
  const difficultyDelta = grade === 'again' ? 0.8 : grade === 'hard' ? 0.35 : grade === 'good' ? -0.12 : -0.35;
  const difficultyAfter = clamp(card.difficulty + difficultyDelta, 1, 10);
  const recallBoost = grade === 'again' ? 0.42 : grade === 'hard' ? 0.92 : grade === 'good' ? 1.75 : 2.55;
  const elapsedBoost = Math.max(1, elapsedDays / Math.max(card.stability, 0.1));
  const stabilityAfter =
    grade === 'again'
      ? clamp(card.stability * 0.45, 0.25, 365)
      : clamp(card.stability * recallBoost * (1 + (1 - retrievabilityBefore) * 0.55) * elapsedBoost ** 0.08, 0.25, 365);
  const intervalDays = nextIntervalDays(grade, stabilityAfter, difficultyAfter);
  const nextDueAt = addDays(now, intervalDays).toISOString();

  return {
    ...card,
    difficulty: Number(difficultyAfter.toFixed(2)),
    dueAt: nextDueAt,
    lastReviewedAt: now.toISOString(),
    reviewHistory: [
      {
        difficultyAfter: Number(difficultyAfter.toFixed(2)),
        difficultyBefore: card.difficulty,
        elapsedDays: Number(elapsedDays.toFixed(2)),
        grade,
        nextDueAt,
        recallScore: gradeMeta.score,
        retrievabilityBefore: Number(retrievabilityBefore.toFixed(3)),
        reviewedAt: now.toISOString(),
        stabilityAfter: Number(stabilityAfter.toFixed(2)),
        stabilityBefore: card.stability,
      },
      ...card.reviewHistory,
    ].slice(0, 8),
    stability: Number(stabilityAfter.toFixed(2)),
  };
}

// A "study area" is a subject + topic pair. Used to keep queues varied with no repeats.
export function studyAreaKey(card: ReviewCard) {
  return `${card.course}::${card.topic}`;
}

// Keep only the first card from each study area, preserving the incoming order.
export function dedupeByStudyArea(cards: ReviewCard[]) {
  const seen = new Set<string>();
  const result: ReviewCard[] = [];

  for (const card of cards) {
    const key = studyAreaKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(card);
  }

  return result;
}

// Daily review queue: subjects/topics interleaved, no repeated study area, and capped
// to a handful of tasks for the day (defaults to 4-6 distinct topics).
export const DAILY_REVIEW_MIN_TASKS = 4;
export const DAILY_REVIEW_MAX_TASKS = 6;

export function buildDailyReviewQueue(
  cards: ReviewCard[],
  now = new Date(),
  maxTasks = DAILY_REVIEW_MAX_TASKS
) {
  return dedupeByStudyArea(interleaveReviewQueue(cards, now)).slice(0, Math.max(1, maxTasks));
}

export function interleaveReviewQueue(cards: ReviewCard[], now = new Date()) {
  const dueFirst = [...cards].sort((first, second) => {
    const firstDue = getDueState(first, now) ? 0 : 1;
    const secondDue = getDueState(second, now) ? 0 : 1;
    if (firstDue !== secondDue) return firstDue - secondDue;

    return getRetrievability(first, now) - getRetrievability(second, now);
  });
  const remaining = [...dueFirst];
  const mixed: ReviewCard[] = [];
  let previousCourse = '';
  let previousTopic = '';

  while (remaining.length > 0) {
    const differentCourseIndex = remaining.findIndex((card) => card.course !== previousCourse);
    const differentTopicIndex = remaining.findIndex((card) => card.topic !== previousTopic);
    const nextIndex = differentCourseIndex >= 0 ? differentCourseIndex : Math.max(0, differentTopicIndex);
    const [nextCard] = remaining.splice(nextIndex, 1);
    mixed.push(nextCard);
    previousCourse = nextCard.course;
    previousTopic = nextCard.topic;
  }

  return mixed;
}
