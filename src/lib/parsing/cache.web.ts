import type { GeneratedAssetRecord, SourceRecord } from '@/types/parsing';

const sourceKey = 'nudge.sources';
const assetKey = 'nudge.generatedAssets';
const memorySources = new Map<string, SourceRecord>();
const memoryAssets = new Map<string, GeneratedAssetRecord>();

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

function readStorage<T>(key: string): T[] {
  if (!canUseStorage()) {
    return [];
  }

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

function sourceRank(source: SourceRecord) {
  const updatedAt = new Date(source.updatedAt).getTime();
  return {
    progress: source.progress,
    updatedAt: Number.isNaN(updatedAt) ? 0 : updatedAt,
  };
}

function dedupeSources(values: SourceRecord[]) {
  const byId = new Map<string, SourceRecord>();

  for (const source of values) {
    const existing = byId.get(source.id);
    if (!existing) {
      byId.set(source.id, source);
      continue;
    }

    const existingRank = sourceRank(existing);
    const nextRank = sourceRank(source);
    if (
      nextRank.updatedAt > existingRank.updatedAt ||
      (nextRank.updatedAt === existingRank.updatedAt && nextRank.progress >= existingRank.progress)
    ) {
      byId.set(source.id, source);
    }
  }

  return [...byId.values()].sort((first, second) => sourceRank(second).updatedAt - sourceRank(first).updatedAt);
}

export async function cacheSource(source: SourceRecord) {
  memorySources.set(source.id, source);
  const values = readStorage<SourceRecord>(sourceKey);
  writeStorage(sourceKey, dedupeSources([source, ...values]));
}

export async function cacheAsset(asset: GeneratedAssetRecord) {
  memoryAssets.set(asset.sourceId, asset);
  const values = readStorage<GeneratedAssetRecord>(assetKey).filter((item) => item.id !== asset.id);
  writeStorage(assetKey, [asset, ...values]);
}

export async function listCachedSources(): Promise<SourceRecord[]> {
  const stored = readStorage<SourceRecord>(sourceKey);
  return stored.length > 0 ? dedupeSources(stored) : dedupeSources([...memorySources.values()]);
}

export async function listCachedAssets(): Promise<GeneratedAssetRecord[]> {
  const stored = readStorage<GeneratedAssetRecord>(assetKey);
  return stored.length > 0 ? stored : [...memoryAssets.values()];
}

export async function removeCachedSource(sourceId: string) {
  memorySources.delete(sourceId);
  memoryAssets.delete(sourceId);
  writeStorage(
    sourceKey,
    readStorage<SourceRecord>(sourceKey).filter((source) => source.id !== sourceId)
  );
  writeStorage(
    assetKey,
    readStorage<GeneratedAssetRecord>(assetKey).filter((asset) => asset.sourceId !== sourceId)
  );
}
