export const dailyQueue = [
  {
    title: 'Neural signaling',
    course: 'Biology 204',
    due: '12 cards',
    retention: '68%',
    dueTime: '9:30 AM',
    difficulty: 'High',
    minutes: 18,
    accent: 'brandPink',
  },
  {
    title: 'Limits and derivatives',
    course: 'Calculus I',
    due: '8 cards',
    retention: '74%',
    dueTime: '11:00 AM',
    difficulty: 'Medium',
    minutes: 14,
    accent: 'brandLavender',
  },
  {
    title: 'Cold War policy',
    course: 'Modern History',
    due: '6 cards',
    retention: '81%',
    dueTime: '3:15 PM',
    difficulty: 'Low',
    minutes: 11,
    accent: 'brandOchre',
  },
] as const;

export const sources = [
  {
    title: 'Cognitive Psychology, Ch. 4',
    type: 'Textbook PDF',
    status: 'Notes ready',
    progress: 100,
    size: '18.4 MB',
    importedAt: 'Today',
    course: 'Psychology 210',
    assets: { notes: 8, flashcards: 24, quizzes: 3 },
  },
  {
    title: 'Biology lecture deck 08',
    type: 'Slides',
    status: 'Flashcards ready',
    progress: 100,
    size: '9.8 MB',
    importedAt: 'Yesterday',
    course: 'Biology 204',
    assets: { notes: 5, flashcards: 18, quizzes: 2 },
  },
  {
    title: 'Calculus review packet',
    type: 'PDF',
    status: 'Quiz drafting',
    progress: 72,
    size: '4.1 MB',
    importedAt: 'Yesterday',
    course: 'Calculus I',
    assets: { notes: 3, flashcards: 12, quizzes: 1 },
  },
] as const;

export const weakTopics = ['Synaptic pruning', 'Chain rule proofs', 'Primary-source bias'];

export const studyBlocks = [
  { label: 'Morning recall', time: '9:30', focus: 'Biology cards', state: 'Due' },
  { label: 'Lunch sprint', time: '12:10', focus: 'Calculus quiz', state: 'Planned' },
  { label: 'Evening review', time: '18:40', focus: 'History sources', state: 'Light' },
] as const;

export const retentionInsights = [
  'Biology retention drops fastest after 36 hours.',
  'Calculus improves when quizzes follow notes within 20 minutes.',
  'History recall is strongest after interleaving primary-source prompts.',
] as const;

export const mastery = [
  { label: 'Biology', value: 78, color: '#ff4d8b' },
  { label: 'Calculus', value: 64, color: '#b8a4ed' },
  { label: 'History', value: 83, color: '#e8b94a' },
  { label: 'Literature', value: 71, color: '#a4d4c5' },
] as const;
