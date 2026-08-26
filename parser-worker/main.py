"""Parser worker for the Nudge pipeline.

Receives a base64-encoded study file and returns structured Markdown text
(headings preserved) using IBM's Docling. Deploy this as a small service
and point the PARSER_WORKER_URL Supabase secret at it.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8787
"""

import base64
import logging
import tempfile
from pathlib import Path

from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parser-worker")

app = FastAPI(title="Nudge Parser Worker")

# Built once at startup; conversion pipelines are expensive to initialize.
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption()  # default options include OCR
    }
)

EXTENSION_BY_MIME = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "text/plain": ".txt",
}


class ExtractRequest(BaseModel):
    fileBase64: str = Field(..., description="Base64-encoded file contents")
    mimeType: str
    sourceId: str | None = None
    title: str | None = None


class ExtractResponse(BaseModel):
    text: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractResponse)
def extract(payload: ExtractRequest) -> ExtractResponse:
    extension = EXTENSION_BY_MIME.get(payload.mimeType)
    if not extension:
        raise HTTPException(status_code=400, detail=f"Unsupported mime type: {payload.mimeType}")

    try:
        raw = base64.b64decode(payload.fileBase64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="fileBase64 is not valid base64.")

    with tempfile.TemporaryDirectory() as tmp_dir:
        file_path = Path(tmp_dir) / f"source{extension}"
        file_path.write_bytes(raw)

        logger.info("Converting %s (%s, %d bytes)", payload.sourceId or "unknown", payload.mimeType, len(raw))
        try:
            result = converter.convert(str(file_path))
        except Exception as exc:  # noqa: BLE001 - surface parser errors to the caller
            logger.exception("Conversion failed")
            raise HTTPException(status_code=500, detail=f"Could not parse document: {exc}")

        markdown = result.document.export_to_markdown()

    if not markdown or not markdown.strip():
        raise HTTPException(status_code=422, detail="Extraction produced no text; document may be empty or unreadable.")

    return ExtractResponse(text=markdown)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8787)
