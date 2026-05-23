import { Platform } from 'react-native';

import type { PickedStudyFile } from '@/types/parsing';

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
    input.accept = '.pdf,.pptx,.docx,.txt,text/plain,application/pdf';
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
