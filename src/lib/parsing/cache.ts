import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

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
const memorySources = new Map<string, SourceRecord>();
const memoryAssets = new Map<string, GeneratedAssetRecord>();

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

      const db = await SQLite.openDatabaseAsync('nudge-study-cache.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          storage_path TEXT NOT NULL,
          size INTEGER NOT NULL,
          status TEXT NOT NULL,
          progress INTEGER NOT NULL,
          stage TEXT NOT NULL,
          error TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS generated_assets (
          id TEXT PRIMARY KEY NOT NULL,
          source_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          content_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      return db;
    });
  }

  return dbPromise;
}

export async function cacheSource(source: SourceRecord) {
  memorySources.set(source.id, source);
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO sources
      (id, title, mime_type, storage_path, size, status, progress, stage, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    source.id,
    source.title,
    source.mimeType,
    source.storagePath,
    source.size,
    source.status,
    source.progress,
    source.stage,
    source.error,
    source.createdAt,
    source.updatedAt
  );
}

export async function cacheAsset(asset: GeneratedAssetRecord) {
  memoryAssets.set(asset.sourceId, asset);
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO generated_assets
      (id, source_id, type, title, content_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    asset.id,
    asset.sourceId,
    asset.type,
    asset.title,
    JSON.stringify(asset.content),
    asset.createdAt
  );
}

export async function listCachedSources(): Promise<SourceRecord[]> {
  const db = await getDatabase();
  if (!db) {
    return [...memorySources.values()];
  }

  const rows = await db.getAllAsync<{
    created_at: string;
    error: string | null;
    id: string;
    mime_type: string;
    progress: number;
    size: number;
    stage: SourceRecord['stage'];
    status: SourceRecord['status'];
    storage_path: string;
    title: string;
    updated_at: string;
  }>('SELECT * FROM sources ORDER BY created_at DESC');

  return rows.map((row: {
    created_at: string;
    error: string | null;
    id: string;
    mime_type: string;
    progress: number;
    size: number;
    stage: SourceRecord['stage'];
    status: SourceRecord['status'];
    storage_path: string;
    title: string;
    updated_at: string;
  }) => ({
    createdAt: row.created_at,
    error: row.error,
    id: row.id,
    mimeType: row.mime_type,
    progress: row.progress,
    size: row.size,
    stage: row.stage,
    status: row.status,
    storagePath: row.storage_path,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function listCachedAssets(): Promise<GeneratedAssetRecord[]> {
  const db = await getDatabase();
  if (!db) {
    return [...memoryAssets.values()];
  }

  const rows = await db.getAllAsync<{
    content_json: string;
    created_at: string;
    id: string;
    source_id: string;
    title: string;
    type: 'study_pack';
  }>('SELECT * FROM generated_assets ORDER BY created_at DESC');

  return rows.map((row: {
    content_json: string;
    created_at: string;
    id: string;
    source_id: string;
    title: string;
    type: 'study_pack';
  }) => ({
    content: JSON.parse(row.content_json),
    createdAt: row.created_at,
    id: row.id,
    sourceId: row.source_id,
    title: row.title,
    type: row.type,
  }));
}
