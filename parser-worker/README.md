# Parser Worker (Docling)

OCR/structure extraction service for the Nudge pipeline. Uses [Docling](https://github.com/docling-project/docling)
to convert PDFs, DOCX, PPTX, and images into Markdown with preserved headings
(which the `chunkBySections` step in `process-source` uses to build section metadata).

## Contract

`POST /extract`

```json
{
  "fileBase64": "<base64 file contents>",
  "mimeType": "application/pdf",
  "sourceId": "optional",
  "title": "optional"
}
```

Response: `{ "text": "<markdown>" }`. Non-2xx responses make the edge function
fall back to Gemini-based OCR.

Also exposes `GET /health`.

## Run locally

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8787
```

## Run in Docker

```bash
docker build -t nudge-parser-worker .
docker run -p 8787:8787 nudge-parser-worker
```

For local testing against iOS/Android simulators, expose it publicly:

```bash
cloudflared tunnel --url http://localhost:8787
```

## Quickstart tunnels (trycloudflare) expire

`cloudflared tunnel --url ...` without a hostname gives you a **temporary**
`https://<random>.trycloudflare.com` URL that changes **every time you restart
the tunnel or your machine**. Since Supabase reads `PARSER_WORKER_URL` from its
secrets at invocation time, you must re-set the secret after each restart:

```bash
npx supabase secrets set PARSER_WORKER_URL=https://<new-random-url>.trycloudflare.com
```

A stale URL makes uploads fall back to Gemini OCR (the pipeline logs
`parser_worker_unreachable` — it will not fail).

To avoid this churn:

- Use a named Cloudflare tunnel with a fixed hostname (free Cloudflare account):
  ```bash
  cloudflared tunnel login
  cloudflared tunnel create nudge-parser
  cloudflared tunnel route dns nudge-parser parser.yourdomain.com   # or <name>.cfargotunnel.com setup via dashboard
  cloudflared tunnel run nudge-parser
  ```
- Or deploy the container to Fly.io / Google Cloud Run / Railway for a permanent
  HTTPS URL (see "Deploy options" below).

## Wire it up

Set the Supabase secret so `process-source` routes non-plaintext files here:

```bash
npx supabase secrets set PARSER_WORKER_URL=https://your-worker-url
```

If the worker is unreachable or fails, the pipeline automatically falls back to
Gemini-based extraction, then to the `needs_ocr` status as a last resort.

## Deploy options

- **Fly.io**: `fly launch --no-deploy && fly deploy` (512MB RAM is enough; first build is slow due to ML models)
- **Google Cloud Run**: `gcloud run deploy --source . --port 8787`
- **Railway/Render**: point them at this directory; they detect the Dockerfile
