import { cacheAsset, cacheSource } from '@/lib/parsing/cache';
import {
  createUpload,
  fetchAllSourceAssets,
  fetchSourceAssets,
  startProcessing,
  uploadOriginal,
} from '@/lib/parsing/supabase-api';
import type {
  GeneratedAssetRecord,
  PickedStudyFile,
  SourceRecord,
  UploadMetadata,
  UploadResult,
} from '@/types/parsing';

async function fileToBlob(file: PickedStudyFile) {
  if (file.file) {
    return file.file;
  }

  if (file.uri) {
    const response = await fetch(file.uri);
    return response.blob();
  }

  throw new Error(`Could not read ${file.name}.`);
}

export async function uploadAndProcessFile(
  file: PickedStudyFile,
  metadata: UploadMetadata = {}
): Promise<UploadResult> {
  const upload = await createUpload(file, metadata);
  const uploadingSource: SourceRecord = {
    ...upload.source,
    progress: Math.max(upload.source.progress, 18),
    stage: 'upload',
    status: 'uploading',
  };
  await cacheSource(uploadingSource);

  const blob = await fileToBlob(file);
  await uploadOriginal(upload.upload.path, blob, file.mimeType);

  let processingSource: SourceRecord;
  try {
    const processResult = await startProcessing(upload.source.id);
    const refreshed = await refreshSource(upload.source.id);
    processingSource = refreshed.source ?? {
      ...upload.source,
      progress: processResult.status === 'ready' ? 100 : Math.max(upload.source.progress, 36),
      stage: processResult.stage as SourceRecord['stage'],
      status: processResult.status as SourceRecord['status'],
      updatedAt: new Date().toISOString(),
    };
    return {
      asset: refreshed.assets[0] ?? null,
      source: processingSource,
    };
  } catch (error) {
    processingSource = {
      ...upload.source,
      error: error instanceof Error ? error.message : 'Processing failed.',
      progress: 100,
      stage: 'failed',
      status: 'failed',
      updatedAt: new Date().toISOString(),
    };
  }
  await cacheSource(processingSource);

  return {
    asset: null,
    source: processingSource,
  };
}

export async function uploadAndProcessFiles(files: PickedStudyFile[], metadata: UploadMetadata = {}) {
  const results: UploadResult[] = [];

  for (const file of files) {
    results.push(await uploadAndProcessFile(file, metadata));
  }

  return results;
}

export async function refreshParsingState() {
  const { assets, sources } = await fetchAllSourceAssets();

  await Promise.all([
    ...sources.map(cacheSource),
    ...assets.map(cacheAsset),
  ]);

  return { assets, sources };
}

export async function refreshSource(sourceId: string): Promise<{
  assets: GeneratedAssetRecord[];
  source: SourceRecord | null;
}> {
  const result = await fetchSourceAssets(sourceId);

  await Promise.all([
    result.source ? cacheSource(result.source) : Promise.resolve(),
    ...result.assets.map(cacheAsset),
  ]);

  return result;
}
