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

export const generatedMaterials = [
  {
    id: 'cognitive-psychology-ch4',
    title: 'Cognitive Psychology, Ch. 4',
    course: 'Psychology 210',
    sourceType: 'Textbook PDF',
    readiness: 'Ready',
    summary:
      'Working memory depends on attention, chunking, and rehearsal. The chapter connects cognitive load to long-term encoding and explains why retrieval practice improves later recall.',
    notes: [
      'Working memory is limited, but structured chunks increase usable capacity.',
      'Encoding improves when learners connect new facts to existing schemas.',
      'Retrieval practice strengthens access paths more reliably than rereading.',
    ],
    flashcards: [
      {
        front: 'What is chunking?',
        back: 'Grouping separate pieces of information into meaningful units to reduce working-memory load.',
      },
      {
        front: 'Why does retrieval practice outperform rereading?',
        back: 'It forces active reconstruction, strengthening recall routes and exposing gaps.',
      },
      {
        front: 'What raises cognitive load during study?',
        back: 'Too many novel elements, weak prior schemas, and distractions competing for attention.',
      },
    ],
    quiz: [
      {
        question: 'Which action best supports durable encoding?',
        choices: ['Highlighting every paragraph', 'Testing recall after reading', 'Reading faster'],
        answer: 'Testing recall after reading',
      },
      {
        question: 'Chunking mainly helps by...',
        choices: ['Reducing working-memory load', 'Removing forgetting', 'Replacing sleep'],
        answer: 'Reducing working-memory load',
      },
    ],
  },
  {
    id: 'biology-lecture-08',
    title: 'Biology lecture deck 08',
    course: 'Biology 204',
    sourceType: 'Slides',
    readiness: 'Review due',
    summary:
      'The lecture explains synaptic signaling, neurotransmitter release, receptor binding, and plasticity. It emphasizes how repeated activation changes connection strength.',
    notes: [
      'Action potentials trigger calcium influx at the presynaptic terminal.',
      'Neurotransmitters cross the synaptic cleft and bind receptors on the next cell.',
      'Long-term potentiation supports learning through strengthened synaptic response.',
    ],
    flashcards: [
      {
        front: 'What triggers neurotransmitter release?',
        back: 'Calcium influx after an action potential reaches the presynaptic terminal.',
      },
      {
        front: 'What does long-term potentiation describe?',
        back: 'A persistent strengthening of synaptic response after repeated activation.',
      },
    ],
    quiz: [
      {
        question: 'Where do neurotransmitters bind after release?',
        choices: ['Myelin sheath', 'Postsynaptic receptors', 'Cell nucleus'],
        answer: 'Postsynaptic receptors',
      },
    ],
  },
  {
    id: 'calculus-review-packet',
    title: 'Calculus review packet',
    course: 'Calculus I',
    sourceType: 'PDF',
    readiness: 'Draft',
    summary:
      'The packet reviews limits, derivative rules, and proof patterns. The highest-yield section is translating graph behavior into derivative statements.',
    notes: [
      'A limit describes behavior as input approaches a value, not necessarily the function value.',
      'The chain rule handles nested functions by multiplying outer and inner derivatives.',
      'Derivative sign charts connect algebraic results to increasing/decreasing intervals.',
    ],
    flashcards: [
      {
        front: 'What does the chain rule differentiate?',
        back: 'Compositions of functions, by multiplying the derivative of the outside by the derivative of the inside.',
      },
      {
        front: 'What does a positive derivative mean?',
        back: 'The function is increasing over that interval.',
      },
    ],
    quiz: [
      {
        question: 'A derivative sign chart is mainly used to identify...',
        choices: ['Function intervals', 'Citation formats', 'Molecular bonds'],
        answer: 'Function intervals',
      },
    ],
  },
] as const;

export const mastery = [
  { label: 'Biology', value: 78, color: '#ff4d8b' },
  { label: 'Calculus', value: 64, color: '#b8a4ed' },
  { label: 'History', value: 83, color: '#e8b94a' },
  { label: 'Literature', value: 71, color: '#a4d4c5' },
] as const;
