import { cacheAsset, cacheSource } from '@/lib/parsing/cache';
import {
  createUpload,
  fetchSourceAssets,
  listGeneratedAssets,
  listSources,
  startProcessing,
  uploadOriginal,
} from '@/lib/parsing/supabase-api';
import type { GeneratedAssetRecord, PickedStudyFile, SourceRecord, UploadResult } from '@/types/parsing';

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

export async function uploadAndProcessFile(file: PickedStudyFile): Promise<UploadResult> {
  const upload = await createUpload(file);
  const uploadingSource: SourceRecord = {
    ...upload.source,
    progress: Math.max(upload.source.progress, 18),
    stage: 'upload',
    status: 'uploading',
  };
  await cacheSource(uploadingSource);

  const blob = await fileToBlob(file);
  await uploadOriginal(upload.upload.path, blob, file.mimeType);

  await startProcessing(upload.source.id);
  const processingSource: SourceRecord = {
    ...upload.source,
    progress: Math.max(upload.source.progress, 36),
    stage: 'extract_text',
    status: 'processing',
    updatedAt: new Date().toISOString(),
  };
  await cacheSource(processingSource);

  return {
    asset: null,
    source: processingSource,
  };
}

export async function uploadAndProcessFiles(files: PickedStudyFile[]) {
  const results: UploadResult[] = [];

  for (const file of files) {
    results.push(await uploadAndProcessFile(file));
  }

  return results;
}

export async function refreshParsingState() {
  const [sources, assets] = await Promise.all([listSources(), listGeneratedAssets()]);

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
