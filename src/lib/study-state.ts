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
let activeStateUser = '';

/**
 * Scope review cards and focus sessions to one account. Rows written before
 * this call (user_id = '') are legacy/demo data and are ignored.
 */
export function setStudyStateUser(userId: string) {
  if (activeStateUser === userId) return;
  activeStateUser = userId;
  memoryState = { reviewCards: [], sessions: [] };
}

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

      // Per-user scoping columns (rows from before this migration keep user_id = '').
      await db.execAsync("ALTER TABLE review_cards ADD COLUMN user_id TEXT NOT NULL DEFAULT ''").catch(() => null);
      await db.execAsync("ALTER TABLE focus_sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT ''").catch(() => null);

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
        'INSERT OR REPLACE INTO review_cards (id, user_id, card_json, updated_at) VALUES (?, ?, ?, ?)',
        card.id,
        activeStateUser,
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
    'SELECT card_json FROM review_cards WHERE user_id = ? ORDER BY updated_at DESC',
    activeStateUser
  );

  return rows.map((row) => JSON.parse(row.card_json) as ReviewCard);
}

export async function saveFocusSession(session: FocusSessionRecord) {
  memoryState = { ...memoryState, sessions: [session, ...memoryState.sessions].slice(0, 100) };
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO focus_sessions
      (id, user_id, mode, phase, minutes, completed_at, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    session.id,
    activeStateUser,
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
  }>(
    'SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 100',
    activeStateUser
  );

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
