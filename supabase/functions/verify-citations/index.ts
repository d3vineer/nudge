import { handleOptions, json } from '../_shared/cors.ts';

import { verifyGroups, type CitedChunkLike, type CitedFlashcard, type CitedNote, type CitedQuizItem, type SectionPack } from '../_shared/citation.ts';

import { assertSourceOwnership, getUserIdFromAuth, supabaseFetch } from '../_shared/supabase.ts';

type AssetRow = {
  content_json: {
    detailed_notes?: string[];
    flashcard_items?: CitedFlashcard[];
    flashcards?: Array<{ back: string; front: string }>;
    note_items?: CitedNote[];
    quiz?: Array<{ answer: string; choices: string[]; question: string }>;
    quiz_items?: CitedQuizItem[];
    summary?: string;
    verified?: boolean;
    weak_topics?: string[];
  };
  id: string;
  source_id: string;
};

type ChunkRow = {
  section_path: string | null;
  text: string;
};

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

    const body = await request.json();
    const sourceId = String(body.sourceId ?? '').trim();
    if (!sourceId) {
      return json({ error: 'sourceId is required.' }, 400);
    }

    const userId = getUserIdFromAuth(request.headers.get('Authorization'));
    if (!userId || !(await assertSourceOwnership(userId, sourceId))) {
      return json({ error: 'Source not found.' }, 404);
    }

    const [asset] = await supabaseFetch<AssetRow[]>(
      `/rest/v1/generated_assets?source_id=eq.${sourceId}&select=id,source_id,content_json&order=created_at.desc&limit=1`
    );
    if (!asset?.content_json?.note_items?.length && !asset?.content_json?.flashcard_items?.length && !asset?.content_json?.quiz_items?.length) {
      return json({ error: 'No cited material found for this source.' }, 404);
    }

    const chunkRows = await supabaseFetch<Array<ChunkRow & { id: string }>>(
      `/rest/v1/chunks?source_id=eq.${sourceId}&select=id,text,section_path&order=chunk_index.asc`
    );

    // Labels were assigned per-document as C1..Cn in chunk_index order at generation time.
    const chunks: Array<CitedChunkLike> = chunkRows.map((row, index) => ({
      label: `C${index + 1}`,
      sectionPath: row.section_path,
      text: row.text,
    }));
    const labelToSection = new Map(chunks.map((chunk) => [chunk.label, chunk.sectionPath ?? 'General']));

    const content = asset.content_json;
    const notes = content.note_items ?? [];
    const flashcards = content.flashcard_items ?? [];
    const quiz = content.quiz_items ?? [];

    // Rebuild section groups: each item belongs to the section of its first cited chunk.
    const sectionOf = (item: { citations: string[] }) => labelToSection.get(item.citations[0] ?? '') ?? 'General';

    const sectionNames = [...new Set([
      ...notes.map(sectionOf),
      ...flashcards.map(sectionOf),
      ...quiz.map(sectionOf),
      ...chunks.map((chunk) => chunk.sectionPath ?? 'General'),
    ])];

    const groups = sectionNames.map((sectionName) => ({
      chunks: chunks.filter((chunk) => (chunk.sectionPath ?? 'General') === sectionName),
      pack: {
        flashcards: flashcards.filter((item) => sectionOf(item) === sectionName),
        notes: notes.filter((item) => sectionOf(item) === sectionName),
        quiz: quiz.filter((item) => sectionOf(item) === sectionName),
        sectionPath: sectionName,
      } satisfies SectionPack,
    }));

    const verified = await verifyGroups(apiKey, groups, { sourceId });

    const updatedContent = {
      ...content,
      detailed_notes: verified.notes.map((note) => note.text),
      flashcard_items: verified.flashcards,
      flashcards: verified.flashcards.map((card) => ({ back: card.back, front: card.front })),
      note_items: verified.notes,
      quiz: verified.quiz.map((item) => ({
        answer: item.answer,
        choices: item.choices,
        question: item.question,
      })),
      quiz_items: verified.quiz,
      verified: true,
    };

    await supabaseFetch(`/rest/v1/generated_assets?id=eq.${asset.id}`, {
      headers: { Prefer: 'return=minimal' },
      json: { content_json: updatedContent },
      method: 'PATCH',
    });

    return json({
      dropped: {
        flashcards: flashcards.length - verified.flashcards.length,
        notes: notes.length - verified.notes.length,
        quiz: quiz.length - verified.quiz.length,
      },
      kept: {
        flashcards: verified.flashcards.length,
        notes: verified.notes.length,
        quiz: verified.quiz.length,
      },
      sourceId,
      verified: true,
    });
  } catch (error) {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown', stage: 'verify_citations_failed' }));
    return json({ error: error instanceof Error ? error.message : 'Verification failed.' }, 500);
  }
});
