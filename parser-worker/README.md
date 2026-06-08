# Nudge Parser Worker

The Supabase Edge Function (`process-source`) calls this worker for heavier text
extraction that is not a good fit for the Deno Edge runtime. The worker does local
extraction first; the Edge Function only falls back to Gemini OCR when the worker
returns too little text (and finally marks a source `needs_ocr`).

## Run

```sh
npm install
npm run dev      # or: npm start  — listens on :8787 (override with PORT)
```

The Edge Function reaches it via the `PARSER_WORKER_URL` env var (e.g.
`http://localhost:8787`).

## Endpoint

```txt
POST /extract
```

Request JSON:

```json
{
  "sourceId": "uuid",
  "title": "lecture.pdf",
  "mimeType": "application/pdf",
  "fileBase64": "..."
}
```

Response JSON:

```json
{
  "text": "extracted source text",
  "method": "text | docx-text | pptx-text | pdf-text | pdf-ocr | image-ocr | unsupported"
}
```

- `400` — malformed JSON body.
- `200` — every other case, **including extraction failures**. On a recoverable error
  the worker returns `{ text: "", method: "<type>-error", error }` so the caller can fall
  back to Gemini OCR / `needs_ocr` instead of failing the whole job.

## Extraction

| Input | Library | `method` |
| --- | --- | --- |
| `text/plain` / `.txt` | native | `text` |
| `.docx` | `mammoth` | `docx-text` |
| `.pptx` | ZIP reader (slides + speaker notes) | `pptx-text` |
| PDF with a text layer | `pdfjs-dist` | `pdf-text` |
| Scanned / image-only PDF | `pdfjs-dist` render + `tesseract.js` OCR | `pdf-ocr` |
| Images (`image/*`) | `tesseract.js` OCR | `image-ocr` |
| anything else | — | `unsupported` |

OCR uses a single, lazily-created, reused `tesseract.js` worker (`eng`). The traineddata
is cached under `.tesseract-cache/` (override with `TESSERACT_CACHE_PATH`). PDF
rasterization for OCR uses `@napi-rs/canvas` (prebuilt npm binaries — no system install).
PDF OCR is capped at the first 15 pages to bound latency.
