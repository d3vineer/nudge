export const dailyQueue = [
  {
    title: 'Neural signaling',
    course: 'Biology 204',
    due: '12 cards',
    retention: '68%',
    accent: 'brandPink',
  },
  {
    title: 'Limits and derivatives',
    course: 'Calculus I',
    due: '8 cards',
    retention: '74%',
    accent: 'brandLavender',
  },
  {
    title: 'Cold War policy',
    course: 'Modern History',
    due: '6 cards',
    retention: '81%',
    accent: 'brandOchre',
  },
] as const;

export const sources = [
  { title: 'Cognitive Psychology, Ch. 4', type: 'Textbook PDF', status: 'Notes ready' },
  { title: 'Biology lecture deck 08', type: 'Slides', status: 'Flashcards ready' },
  { title: 'Calculus review packet', type: 'PDF', status: 'Quiz drafting' },
] as const;

export const weakTopics = ['Synaptic pruning', 'Chain rule proofs', 'Primary-source bias'];

export const mastery = [
  { label: 'Biology', value: 78, color: '#ff4d8b' },
  { label: 'Calculus', value: 64, color: '#b8a4ed' },
  { label: 'History', value: 83, color: '#e8b94a' },
  { label: 'Literature', value: 71, color: '#a4d4c5' },
] as const;
