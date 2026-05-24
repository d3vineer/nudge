import { Platform } from 'react-native';

import type { PickedStudyFile } from '@/types/parsing';

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

function inferMimeType(name: string, mimeType?: string) {
  if (mimeType) {
    return mimeType;
  }

  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lowerName.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  if (lowerName.endsWith('.heic')) return 'image/heic';
  if (lowerName.endsWith('.heif')) return 'image/heif';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.txt')) return 'text/plain';

  return 'application/octet-stream';
}

function pickWebFiles(): Promise<PickedStudyFile[]> {
  if (typeof document === 'undefined') {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.pptx,.docx,.txt,.png,.jpg,.jpeg,.webp,.heic,.heif,text/plain,application/pdf,image/*';
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      resolve(
        files.map((file) => ({
          file,
          mimeType: inferMimeType(file.name, file.type),
          name: file.name,
          size: file.size,
        }))
      );
    };
    input.click();
  });
}

export async function pickStudyFiles(): Promise<PickedStudyFile[]> {
  if (Platform.OS === 'web') {
    return pickWebFiles();
  }

  const moduleName = 'expo-document-picker';
  const DocumentPicker = await import(moduleName);
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: allowedTypes,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset: {
    mimeType?: string;
    name: string;
    size?: number;
    uri: string;
  }) => ({
    mimeType: inferMimeType(asset.name, asset.mimeType),
    name: asset.name,
    size: asset.size ?? 0,
    uri: asset.uri,
  }));
}
