export type ParseStatus = 'queued' | 'uploading' | 'processing' | 'needs_ocr' | 'ready' | 'failed';

export type ParseStage =
  | 'metadata'
  | 'upload'
  | 'extract_text'
  | 'ocr'
  | 'chunk'
  | 'embed'
  | 'generate'
  | 'complete'
  | 'failed';

export type SourceRecord = {
  id: string;
  title: string;
  mimeType: string;
  storagePath: string;
  size: number;
  status: ParseStatus;
  progress: number;
  stage: ParseStage;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedAssetContent = {
  summary: string;
  detailed_notes: string[];
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  quiz: Array<{
    question: string;
    choices: string[];
    answer: string;
  }>;
  weak_topics: string[];
};

export type GeneratedAssetRecord = {
  id: string;
  sourceId: string;
  type: 'study_pack';
  title: string;
  content: GeneratedAssetContent;
  createdAt: string;
};

export type PickedStudyFile = {
  name: string;
  mimeType: string;
  size: number;
  uri?: string;
  file?: File;
};

export type UploadResult = {
  source: SourceRecord;
  asset: GeneratedAssetRecord | null;
};
