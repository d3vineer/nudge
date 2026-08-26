import { handleOptions, json } from '../_shared/cors.ts';

import { callGeminiGenerateContent, modelCandidates } from '../_shared/gemini.ts';

import { getUserIdFromAuth, supabaseFetch } from '../_shared/supabase.ts';

type ChunkHit = {
  id: string;
  label: string;
  section_path: string | null;
  text: string;
};

function embedQuestion(apiKey: string, question: string) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        content: { parts: [{ text: question }] },
        model: 'models/gemini-embedding-001',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }
  ).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `Embedding failed with ${response.status}`);
    }
    const values = data?.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Embedding response did not include vector values.');
    }
    return values as number[];
  });
}

async function matchChunks(
  queryEmbedding: number[],
  question: string,
  sourceId: string,
  matchCount: number
): Promise<ChunkHit[]> {
  // Hybrid retrieval (vector + lexical, RRF-fused) inside Postgres.
  const rows = await supabaseFetch<Array<{ id: string; section_path: string | null; text: string }>>(
    '/rest/v1/rpc/match_chunks',
    {
      body: JSON.stringify({
        match_count: matchCount,
        query_embedding: `[${queryEmbedding.join(',')}]`,
        query_text: question,
        source_ids: [sourceId],
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }
  );

  return rows.map((row, index) => ({
    id: row.id,
    label: `C${index + 1}`,
    section_path: row.section_path,
    text: row.text,
  }));
}

async function lexicalChunks(
  question: string,
  sourceId: string,
  matchCount: number
): Promise<ChunkHit[]> {
  // Lexical-only fallback (full-text search) for sources without embeddings.
  const rows = await supabaseFetch<Array<{ id: string; section_path: string | null; text: string }>>(
    `/rest/v1/chunks?source_id=eq.${sourceId}&tsv=fts(english).${encodeURIComponent(question)}&select=id,text,section_path&limit=${matchCount}`
  );

  return rows.map((row, index) => ({
    id: row.id,
    label: `C${index + 1}`,
    section_path: row.section_path,
    text: row.text,
  }));
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return json({ error: 'GEMINI_API_KEY is required.' }, 500);
    }

    const userId = getUserIdFromAuth(request.headers.get('Authorization'));
    if (!userId) {
      return json({ error: 'Unauthorized. Missing or invalid user token.' }, 401);
    }

    const body = await request.json();
    const sourceId = String(body.sourceId ?? '').trim();
    const question = String(body.question ?? '').trim();

    if (!sourceId || !question) {
      return json({ error: 'sourceId and question are required.' }, 400);
    }

    // Enforce ownership.
    const [source] = await supabaseFetch<Array<{ title: string }>>(
      `/rest/v1/sources?id=eq.${sourceId}&user_id=eq.${userId}&select=title&limit=1`
    );
    if (!source) {
      return json({ error: 'Source not found.' }, 404);
    }

    const embedding = await embedQuestion(apiKey, question);

    let chunks: ChunkHit[];
    try {
      chunks = await matchChunks(embedding, question, sourceId, 6);
    } catch {
      // Hybrid RPC failed (e.g. legacy source without embeddings); fall back to lexical search.
      chunks = await lexicalChunks(question, sourceId, 6);
    }

    if (chunks.length === 0) {
      return json({
        answer: 'Could not find anything in this document that answers that question.',
        citations: [],
        question,
        sourceId,
      });
    }

    const evidence = chunks
      .map((chunk) => `[${chunk.label}]${chunk.section_path ? ` (${chunk.section_path})` : ''} ${chunk.text}`)
      .join('\n\n');

    const data = await callGeminiGenerateContent(
      apiKey,
      modelCandidates('GEMINI_QA_MODEL', 'GEMINI_FALLBACK_MODELS', [
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
      ]),
      {
        contents: [
          {
            parts: [
              {
                text:
                  `Answer the question using ONLY the passages below from "${source.title}".\n` +
                  'Cite the chunk labels you used inline, like [C2]. If the passages do not contain the answer, say so plainly.\n' +
                  'Be concise and study-friendly.\n\n' +
                  `QUESTION: ${question}\n\nPASSAGES:\n${evidence}`,
              },
            ],
            role: 'user',
          },
        ],
        generationConfig: { temperature: 0.3 },
      },
      'ask',
      sourceId
    );

    const answer = data.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
    if (!answer) {
      throw new Error('Gemini response did not include an answer.');
    }

    // Collect labels actually cited in the answer and attach their snippets.
    const citedLabels = new Set(
      [...answer.matchAll(/\[(C\d+)\]/g)].map((match) => match[1].toUpperCase())
    );
    const citations = chunks
      .filter((chunk) => citedLabels.has(chunk.label))
      .map((chunk) => ({
        label: chunk.label,
        sectionPath: chunk.section_path,
        snippet: chunk.text.slice(0, 400),
      }));

    return json({ answer, citations, question, sourceId });
  } catch (error) {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown', stage: 'ask_source_failed' }));
    return json({ error: error instanceof Error ? error.message : 'Could not answer the question.' }, 500);
  }
});
