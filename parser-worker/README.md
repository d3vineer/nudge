# Nudge Parser Worker

The Supabase Edge Function calls this worker for heavier extraction tasks that are not a good fit for Deno Edge runtime tooling.

Expected endpoint:

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
  "method": "pdf-text | docx-text | pptx-text | ocr"
}
```

For production, wire this to PDF, DOCX, PPTX, and OCR packages in a small Node service. The Edge Function already handles weak text extraction by marking a source as `needs_ocr`.
