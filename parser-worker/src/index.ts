import { createServer, type ServerResponse } from 'node:http';
import { inflateRawSync, inflateSync } from 'node:zlib';

type ExtractPayload = {
  fileBase64?: string;
  mimeType?: string;
  title?: string;
};

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlText(value: string) {
  return decodeXmlEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function zipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const flags = buffer.readUInt16LE(offset + 6);
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString('utf8');

    if (flags & 0x08 || compressedSize === 0) {
      offset = dataStart + Math.max(compressedSize, 1);
      continue;
    }

    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const content =
      compression === 8 ? inflateRawSync(compressed) : compression === 0 ? compressed : Buffer.alloc(0);

    if (content.length > 0) {
      entries.set(name, content);
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function extractDocx(buffer: Buffer) {
  const entries = zipEntries(buffer);
  const documentXml = entries.get('word/document.xml');
  return documentXml ? xmlText(documentXml.toString('utf8')) : '';
}

function extractPptx(buffer: Buffer) {
  const entries = zipEntries(buffer);
  const slides = [...entries.entries()]
    .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, content]) => xmlText(content.toString('utf8')));

  return slides.join('\n\n');
}

function unescapePdfString(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\\d{1,3}/g, ' ');
}

function decodePdfHex(hex: string) {
  const bytes = Buffer.from(hex, 'hex');
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const chars: string[] = [];
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      chars.push(String.fromCharCode((bytes[index] << 8) + bytes[index + 1]));
    }
    return chars.join('');
  }

  return bytes.toString('latin1');
}

function extractPdfTextFromString(value: string) {
  const chunks: string[] = [];
  const literalPattern = /\((?:\\.|[^\\)]){2,}\)/g;
  const hexPattern = /<([0-9a-fA-F\s]{6,})>/g;

  for (const match of value.matchAll(literalPattern)) {
    chunks.push(unescapePdfString(match[0].slice(1, -1)));
  }

  for (const match of value.matchAll(hexPattern)) {
    const hex = match[1].replace(/\s+/g, '');
    if (hex.length % 2 === 0) {
      chunks.push(decodePdfHex(hex).replace(/\0/g, ''));
    }
  }

  return chunks.join(' ');
}

function extractPdf(buffer: Buffer) {
  const textParts = [extractPdfTextFromString(buffer.toString('latin1'))];
  const raw = buffer.toString('binary');
  const streamPattern = /<<[\s\S]*?\/FlateDecode[\s\S]*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const match of raw.matchAll(streamPattern)) {
    try {
      const streamBuffer = Buffer.from(match[1], 'binary');
      textParts.push(extractPdfTextFromString(inflateSync(streamBuffer).toString('latin1')));
    } catch {
      // Some PDF streams use predictors or filters this lightweight extractor cannot decode.
    }
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim();
}

function extract(buffer: Buffer, mimeType: string, title = '') {
  if (mimeType === 'text/plain' || title.toLowerCase().endsWith('.txt')) {
    return { method: 'text', text: buffer.toString('utf8') };
  }

  if (mimeType.includes('wordprocessingml') || title.toLowerCase().endsWith('.docx')) {
    return { method: 'docx-text', text: extractDocx(buffer) };
  }

  if (mimeType.includes('presentationml') || title.toLowerCase().endsWith('.pptx')) {
    return { method: 'pptx-text', text: extractPptx(buffer) };
  }

  if (mimeType === 'application/pdf' || title.toLowerCase().endsWith('.pdf')) {
    return { method: 'pdf-text', text: extractPdf(buffer) };
  }

  return { method: 'unsupported', text: '' };
}

createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/extract') {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }

  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    try {
      const payload = JSON.parse(body) as ExtractPayload;
      const buffer = Buffer.from(String(payload.fileBase64 ?? ''), 'base64');
      const result = extract(buffer, String(payload.mimeType ?? ''), payload.title);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Extraction failed.',
      });
    }
  });
}).listen(Number(process.env.PORT ?? 8787));
