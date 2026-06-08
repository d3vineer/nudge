import type { ReviewCard } from '@/lib/spaced-repetition';
import type { FocusSessionRecord, PersistedStudyState } from '@/types/study-state';

type SQLiteDatabase = {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
};

type SQLiteModule = {
  openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
};

let sqliteModulePromise: Promise<SQLiteModule | null> | null = null;
let dbPromise: Promise<SQLiteDatabase | null> | null = null;
let memoryState: PersistedStudyState = {
  reviewCards: [],
  sessions: [],
};

async function loadSQLite() {
  if (!sqliteModulePromise) {
    const moduleName = 'expo-sqlite';
    sqliteModulePromise = import(moduleName).then((module) => module as SQLiteModule).catch(() => null);
  }

  return sqliteModulePromise;
}

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = loadSQLite().then(async (SQLite) => {
      if (!SQLite) {
        return null;
      }

      const db = await SQLite.openDatabaseAsync('nudge-study-state.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS review_cards (
          id TEXT PRIMARY KEY NOT NULL,
          card_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id INTEGER PRIMARY KEY NOT NULL,
          mode TEXT NOT NULL,
          phase TEXT NOT NULL,
          minutes INTEGER NOT NULL,
          completed_at TEXT NOT NULL,
          note TEXT
        );
      `);

      // Add the note column for databases created before sessions supported notes.
      await db.execAsync('ALTER TABLE focus_sessions ADD COLUMN note TEXT').catch(() => {
        // Column already exists; ignore.
      });

      return db;
    });
  }

  return dbPromise;
}

export async function saveReviewCards(cards: ReviewCard[]) {
  memoryState = { ...memoryState, reviewCards: cards };
  const db = await getDatabase();
  if (!db) return;

  await Promise.all(
    cards.map((card) =>
      db.runAsync(
        'INSERT OR REPLACE INTO review_cards (id, card_json, updated_at) VALUES (?, ?, ?)',
        card.id,
        JSON.stringify(card),
        new Date().toISOString()
      )
    )
  );
}

export async function loadReviewCards(): Promise<ReviewCard[]> {
  const db = await getDatabase();
  if (!db) {
    return memoryState.reviewCards;
  }

  const rows = await db.getAllAsync<{ card_json: string }>(
    'SELECT card_json FROM review_cards ORDER BY updated_at DESC'
  );

  return rows.map((row) => JSON.parse(row.card_json) as ReviewCard);
}

export async function saveFocusSession(session: FocusSessionRecord) {
  memoryState = { ...memoryState, sessions: [session, ...memoryState.sessions].slice(0, 100) };
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO focus_sessions
      (id, mode, phase, minutes, completed_at, note)
      VALUES (?, ?, ?, ?, ?, ?)`,
    session.id,
    session.mode,
    session.phase,
    session.minutes,
    session.completedAt,
    session.note ?? null
  );
}

export async function loadFocusSessions(): Promise<FocusSessionRecord[]> {
  const db = await getDatabase();
  if (!db) {
    return memoryState.sessions;
  }

  const rows = await db.getAllAsync<{
    completed_at: string;
    id: number;
    minutes: number;
    mode: string;
    note: string | null;
    phase: 'study' | 'break';
  }>('SELECT * FROM focus_sessions ORDER BY completed_at DESC LIMIT 100');

  return rows.map((row) => ({
    completedAt: row.completed_at,
    id: row.id,
    minutes: row.minutes,
    mode: row.mode,
    note: row.note ?? undefined,
    phase: row.phase,
  }));
}

export async function loadStudyState(): Promise<PersistedStudyState> {
  const [reviewCards, sessions] = await Promise.all([loadReviewCards(), loadFocusSessions()]);
  return { reviewCards, sessions };
}
