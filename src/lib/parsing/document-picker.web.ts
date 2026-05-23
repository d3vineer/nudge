import type { PickedStudyFile } from '@/types/parsing';

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

export async function pickStudyFiles(): Promise<PickedStudyFile[]> {
  if (typeof document === 'undefined') {
    return [];
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
