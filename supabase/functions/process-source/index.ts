import { handleOptions, json } from '../_shared/cors.ts';
import { supabaseConfig, supabaseFetch, updateJob, updateSource } from '../_shared/supabase.ts';

type SourceRow = {
  id: string;
  mime_type: string;
  storage_path: string;
  title: string;
};

type StudyPack = {
  detailed_notes: string[];
  flashcards: Array<{ back: string; front: string }>;
  quiz: Array<{ answer: string; choices: string[]; question: string }>;
  summary: string;
  weak_topics: string[];
};

const minimumUsefulCharacters = 500;

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function chunkText(text: string) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const chunks: string[] = [];
  const wordsPerChunk = 700;

  for (let index = 0; index < words.length; index += wordsPerChunk) {
    chunks.push(words.slice(index, index + wordsPerChunk).join(' '));
  }

  return chunks.filter(Boolean).slice(0, 24);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') {
        return text;
      }
    }
  }

  throw new Error('OpenAI response did not include output text.');
}

async function downloadSource(path: string) {
  const config = supabaseConfig();
  const response = await fetch(`${config.url}/storage/v1/object/study-materials/${path}`, {
    headers: config.headers,
  });

  if (!response.ok) {
    throw new Error(`Could not download source file: ${response.status}`);
  }

  return response.arrayBuffer();
}

async function extractText(source: SourceRow, fileBuffer: ArrayBuffer) {
  if (source.mime_type === 'text/plain') {
    return new TextDecoder().decode(fileBuffer);
  }

  const workerUrl = Deno.env.get('PARSER_WORKER_URL');
  if (!workerUrl) {
    return '';
  }

  const response = await fetch(`${workerUrl.replace(/\/$/, '')}/extract`, {
    body: JSON.stringify({
      fileBase64: arrayBufferToBase64(fileBuffer),
      mimeType: source.mime_type,
      sourceId: source.id,
      title: source.title,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Parser worker failed.');
  }

  return String(data.text ?? '');
}

async function createEmbeddings(chunks: string[]) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    body: JSON.stringify({
      input: chunks,
      model: 'text-embedding-3-small',
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Embedding request failed.');
  }

  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

async function generateStudyPack(source: SourceRow, chunks: string[]): Promise<StudyPack> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  const schema = {
    additionalProperties: false,
    properties: {
      detailed_notes: { items: { type: 'string' }, type: 'array' },
      flashcards: {
        items: {
          additionalProperties: false,
          properties: {
            back: { type: 'string' },
            front: { type: 'string' },
          },
          required: ['front', 'back'],
          type: 'object',
        },
        type: 'array',
      },
      quiz: {
        items: {
          additionalProperties: false,
          properties: {
            answer: { type: 'string' },
            choices: { items: { type: 'string' }, type: 'array' },
            question: { type: 'string' },
          },
          required: ['question', 'choices', 'answer'],
          type: 'object',
        },
        type: 'array',
      },
      summary: { type: 'string' },
      weak_topics: { items: { type: 'string' }, type: 'array' },
    },
    required: ['summary', 'detailed_notes', 'flashcards', 'quiz', 'weak_topics'],
    type: 'object',
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text:
                `Create a focused study pack from the uploaded source "${source.title}". ` +
                'Use only the provided source text. Prefer active recall, FSRS-friendly flashcards, and concise quiz answers.\n\n' +
                chunks.join('\n\n---\n\n').slice(0, 80_000),
              type: 'input_text',
            },
          ],
          role: 'user',
        },
      ],
      model: Deno.env.get('OPENAI_GENERATION_MODEL') ?? 'gpt-5-mini',
      text: {
        format: {
          name: 'nudge_study_pack',
          schema,
          strict: true,
          type: 'json_schema',
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Study pack generation failed.');
  }

  return JSON.parse(extractOutputText(data)) as StudyPack;
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  let sourceId: string | null = null;

  try {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    const body = await request.json();
    sourceId = body.sourceId ?? null;
    if (!sourceId) {
      return json({ error: 'sourceId is required.' }, 400);
    }

    await Promise.all([
      updateSource(sourceId, { progress: 20, stage: 'extract_text', status: 'processing' }),
      updateJob(sourceId, { stage: 'extract_text', status: 'running' }),
    ]);

    const [source] = await supabaseFetch<SourceRow[]>(`/rest/v1/sources?id=eq.${sourceId}&select=*`);
    if (!source) {
      return json({ error: 'Source not found.' }, 404);
    }

    const fileBuffer = await downloadSource(source.storage_path);
    const text = await extractText(source, fileBuffer);

    if (text.trim().length < minimumUsefulCharacters) {
      await Promise.all([
        updateSource(sourceId, {
          error: 'Text extraction was too short. OCR is needed for this source.',
          progress: 35,
          stage: 'ocr',
          status: 'needs_ocr',
        }),
        updateJob(sourceId, {
          error: 'Weak extraction; OCR worker required.',
          stage: 'ocr',
          status: 'needs_ocr',
        }),
      ]);
      return json({ sourceId, stage: 'ocr', status: 'needs_ocr' });
    }

    await Promise.all([
      updateSource(sourceId, { progress: 45, stage: 'chunk' }),
      updateJob(sourceId, { stage: 'chunk' }),
    ]);
    const chunks = chunkText(text);

    await Promise.all([
      updateSource(sourceId, { progress: 62, stage: 'embed' }),
      updateJob(sourceId, { stage: 'embed' }),
    ]);
    const embeddings = await createEmbeddings(chunks);
    await supabaseFetch('/rest/v1/chunks', {
      json: chunks.map((chunk, index) => ({
        chunk_index: index,
        embedding: `[${embeddings[index].join(',')}]`,
        source_id: sourceId,
        text: chunk,
        token_count: estimateTokens(chunk),
      })),
      method: 'POST',
    });

    await Promise.all([
      updateSource(sourceId, { progress: 78, stage: 'generate' }),
      updateJob(sourceId, { stage: 'generate' }),
    ]);
    const studyPack = await generateStudyPack(source, chunks);
    await supabaseFetch('/rest/v1/generated_assets', {
      headers: { Prefer: 'return=representation' },
      json: {
        content_json: studyPack,
        source_id: sourceId,
        title: source.title,
        type: 'study_pack',
      },
      method: 'POST',
    });

    await Promise.all([
      updateSource(sourceId, {
        error: null,
        progress: 100,
        stage: 'complete',
        status: 'ready',
      }),
      updateJob(sourceId, {
        error: null,
        stage: 'complete',
        status: 'completed',
      }),
    ]);

    return json({ sourceId, stage: 'complete', status: 'ready' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed.';
    if (sourceId) {
      try {
        await Promise.all([
          updateSource(sourceId, { error: message, progress: 100, stage: 'failed', status: 'failed' }),
          updateJob(sourceId, { error: message, stage: 'failed', status: 'failed' }),
        ]);
      } catch {
        // Ignore failure-path update errors.
      }
    }

    return json({ error: message }, 500);
  }
});
