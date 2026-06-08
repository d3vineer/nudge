import { createServer, type ServerResponse } from 'node:http';

import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import mammoth from 'mammoth';
import { inflateRawSync } from 'node:zlib';

// pdfjs (and its rendering path) expects a handful of browser globals. The Node
// `legacy` build runs fine for text extraction without them, but rasterizing a page
// for OCR touches DOMMatrix / Path2D / ImageData, so we polyfill from @napi-rs/canvas
// before importing pdfjs.
const globalScope = globalThis as Record<string, unknown>;
globalScope.DOMMatrix ??= DOMMatrix;
globalScope.Path2D ??= Path2D;
globalScope.ImageData ??= ImageData;

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

type ExtractPayload = {
  fileBase64?: string;
  mimeType?: string;
  title?: string;
};

type ExtractResult = {
  method: string;
  text: string;
};

// Local extraction is the fast path; the edge function falls back to Gemini OCR when we
// return too little text. Keep these bounded so a huge upload can't hang the worker —
// the caller only keeps ~24 x 700-word chunks anyway.
const MAX_OCR_PAGES = 15;
const PDF_TEXT_MIN_CHARS = 80;
const OCR_RENDER_SCALE = 2;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function log(stage: string, detail?: string) {
  console.log(JSON.stringify({ detail, stage }));
}

function hasExtension(title: string, extension: string) {
  return title.toLowerCase().endsWith(extension);
}

// --- DOCX ------------------------------------------------------------------

async function extractDocx(buffer: Buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value.trim();
}

// --- PPTX ------------------------------------------------------------------
// No quality pure-npm PPTX text library exists, so we keep the original lightweight
// ZIP reader and pull both slide bodies and speaker notes.

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

function extractPptx(buffer: Buffer) {
  const entries = zipEntries(buffer);
  const slidePattern = /^ppt\/slides\/slide\d+\.xml$/;
  const notesPattern = /^ppt\/notesSlides\/notesSlide\d+\.xml$/;

  const parts = [...entries.entries()]
    .filter(([name]) => slidePattern.test(name) || notesPattern.test(name))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, content]) => xmlText(content.toString('utf8')))
    .filter(Boolean);

  return parts.join('\n\n');
}

// --- OCR (tesseract) -------------------------------------------------------
// Lazily create a single worker and reuse it across requests. The first call downloads
// the `eng` traineddata, which tesseract.js then caches on disk.

type TesseractWorker = { recognize: (image: Buffer) => Promise<{ data: { text: string } }> };
let ocrWorkerPromise: Promise<TesseractWorker> | null = null;

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      log('ocr_init');
      // Cache the downloaded `eng` traineddata in a dedicated dir (default is cwd,
      // which would litter the repo). Override with TESSERACT_CACHE_PATH if set.
      const cachePath = process.env.TESSERACT_CACHE_PATH ?? new URL('../.tesseract-cache', import.meta.url).pathname;
      return (await createWorker('eng', undefined, { cachePath })) as unknown as TesseractWorker;
    })();
  }

  return ocrWorkerPromise;
}

async function ocrImage(image: Buffer) {
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(image);
  return data.text.replace(/\s+/g, ' ').trim();
}

// --- PDF -------------------------------------------------------------------

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const textParts: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
    page.cleanup();
  }

  const text = textParts.join('\n').replace(/[ \t]+/g, ' ').trim();
  if (text.length >= PDF_TEXT_MIN_CHARS) {
    await doc.destroy();
    return { method: 'pdf-text', text };
  }

  // Likely a scanned / image-only PDF: rasterize pages and OCR them.
  const pageCount = Math.min(doc.numPages, MAX_OCR_PAGES);
  if (doc.numPages > MAX_OCR_PAGES) {
    log('pdf_ocr_truncated', `OCR limited to first ${MAX_OCR_PAGES} of ${doc.numPages} pages`);
  }

  const ocrParts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    // @napi-rs/canvas's 2D context is compatible with pdfjs at runtime but not by type.
    await page.render({ canvasContext: context as unknown as object, viewport } as Parameters<typeof page.render>[0]).promise;
    ocrParts.push(await ocrImage(canvas.toBuffer('image/png')));
    page.cleanup();
  }

  await doc.destroy();
  return { method: 'pdf-ocr', text: ocrParts.join('\n').trim() };
}

// --- Dispatch --------------------------------------------------------------

async function extract(buffer: Buffer, mimeType: string, title = ''): Promise<ExtractResult> {
  if (mimeType === 'text/plain' || hasExtension(title, '.txt')) {
    return { method: 'text', text: buffer.toString('utf8') };
  }

  if (mimeType.includes('wordprocessingml') || hasExtension(title, '.docx')) {
    return { method: 'docx-text', text: await extractDocx(buffer) };
  }

  if (mimeType.includes('presentationml') || hasExtension(title, '.pptx')) {
    return { method: 'pptx-text', text: extractPptx(buffer) };
  }

  if (mimeType === 'application/pdf' || hasExtension(title, '.pdf')) {
    return extractPdf(buffer);
  }

  if (mimeType.startsWith('image/')) {
    return { method: 'image-ocr', text: await ocrImage(buffer) };
  }

  return { method: 'unsupported', text: '' };
}

function errorMethod(mimeType: string, title: string) {
  if (mimeType === 'application/pdf' || hasExtension(title, '.pdf')) return 'pdf-error';
  if (mimeType.startsWith('image/')) return 'ocr-error';
  if (mimeType.includes('wordprocessingml') || hasExtension(title, '.docx')) return 'docx-error';
  if (mimeType.includes('presentationml') || hasExtension(title, '.pptx')) return 'pptx-error';
  return 'error';
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
  request.on('end', async () => {
    let payload: ExtractPayload;
    try {
      payload = JSON.parse(body) as ExtractPayload;
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body.' });
      return;
    }

    const mimeType = String(payload.mimeType ?? '');
    const title = payload.title ?? '';

    try {
      const buffer = Buffer.from(String(payload.fileBase64 ?? ''), 'base64');
      const result = await extract(buffer, mimeType, title);
      log('extracted', `${result.text.trim().length} chars via ${result.method}`);
      sendJson(response, 200, result);
    } catch (error) {
      // Degrade gracefully: return empty text (HTTP 200) so the edge function can fall
      // back to Gemini OCR / mark needs_ocr instead of failing the whole job.
      const message = error instanceof Error ? error.message : 'Extraction failed.';
      log('extract_error', message);
      sendJson(response, 200, { error: message, method: errorMethod(mimeType, title), text: '' });
    }
  });
}).listen(Number(process.env.PORT ?? 8787), () => {
  log('listening', `parser-worker on :${process.env.PORT ?? 8787}`);
});
