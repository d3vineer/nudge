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

export async function cacheSource(source: SourceRecord) {
  memorySources.set(source.id, source);
  const values = readStorage<SourceRecord>(sourceKey).filter((item) => item.id !== source.id);
  writeStorage(sourceKey, [source, ...values]);
}

export async function cacheAsset(asset: GeneratedAssetRecord) {
  memoryAssets.set(asset.sourceId, asset);
  const values = readStorage<GeneratedAssetRecord>(assetKey).filter((item) => item.id !== asset.id);
  writeStorage(assetKey, [asset, ...values]);
}

export async function listCachedSources(): Promise<SourceRecord[]> {
  const stored = readStorage<SourceRecord>(sourceKey);
  return stored.length > 0 ? stored : [...memorySources.values()];
}

export async function listCachedAssets(): Promise<GeneratedAssetRecord[]> {
  const stored = readStorage<GeneratedAssetRecord>(assetKey);
  return stored.length > 0 ? stored : [...memoryAssets.values()];
}
