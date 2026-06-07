import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const MAX_SOURCE_CHARS = 75_000;
const MIN_EXTRACTED_CHARS = 900;
const MIME_TYPE = 'application/pdf';

const pdfs = [
  {
    path: '/Users/yuktaraj/Desktop/study project/cholas history.pdf',
    subject: 'History',
    topic: 'Cholas',
  },
  {
    path: '/Users/yuktaraj/Desktop/study project/deman supply economics.pdf',
    subject: 'Economics',
    topic: 'Demand and Supply',
  },
  {
    path: '/Users/yuktaraj/Desktop/study project/physics motion.pdf',
    subject: 'Physics',
    topic: 'Motion',
  },
  {
    path: '/Users/yuktaraj/Desktop/study project/biology human reproduction.pdf',
    subject: 'Biology',
    topic: 'Human Reproduction',
  },
  {
    path: '/Users/yuktaraj/Desktop/study project/icse-class-8-mathematics-chapter-1-sets-download.pdf',
    subject: 'Math',
    topic: 'Sets',
  },
];

function loadEnvFile() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional; shell-provided env vars are enough.
  }
}

function env(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined) ?? '';
}

function supabaseKey() {
  return (
    env('SEED_SUPABASE_SERVICE_ROLE_KEY') ||
    env('SERVICE_ROLE_KEY') ||
    env('SUPABASE_SERVICE_ROLE_KEY') ||
    env('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  );
}

function headers(contentType = 'application/json') {
  const key = supabaseKey();
  const nextHeaders = {
    'Content-Type': contentType,
    apikey: key,
  };

  if (key.includes('.')) {
    nextHeaders.Authorization = `Bearer ${key}`;
  }

  return nextHeaders;
}

function geminiKey() {
  return env('GEMINI_API_KEY') || env('GOOGLE_GENERATIVE_AI_API_KEY');
}

async function readJson(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed with ${response.status}`);
  }
  return data;
}

function commandExists(command) {
  return spawnSync('sh', ['-lc', `command -v ${command}`], { encoding: 'utf8' }).status === 0;
}

function normalizeText(text) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractWithPdfToText(filePath) {
  if (!commandExists('pdftotext')) return '';
  const result = spawnSync('pdftotext', ['-layout', filePath, '-'], {
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  });
  return result.status === 0 ? normalizeText(result.stdout) : '';
}

function extractWithPython(filePath) {
  if (!commandExists('python3')) return '';
  const script = `
import sys
path = sys.argv[1]
text = ""
try:
    from pypdf import PdfReader
    reader = PdfReader(path)
    text = "\\n".join(page.extract_text() or "" for page in reader.pages)
except Exception:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(path)
        text = "\\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        try:
            from pdfminer.high_level import extract_text
            text = extract_text(path)
        except Exception:
            text = ""
print(text)
`;
  const result = spawnSync('python3', ['-c', script, filePath], {
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  });
  return result.status === 0 ? normalizeText(result.stdout) : '';
}

function warnIfNoLocalExtractor() {
  const hasPdfToText = commandExists('pdftotext');
  const hasPython = commandExists('python3');

  if (!hasPdfToText && !hasPython) {
    console.warn(
      'No local PDF extractor found. Large PDFs may fall back to Gemini inline extraction, which can fail for big files. ' +
      'Install poppler/pdftotext or a Python PDF package before seeding large PDFs.'
    );
  }
}

async function callGemini(body) {
  const apiKey = geminiKey();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Add it to .env or export it before running the seed script.');
  }

  const models = [
    env('GEMINI_GENERATION_MODEL'),
    env('GEMINI_EXTRACTION_MODEL'),
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
  ].filter(Boolean);

  let lastError = 'Gemini request failed.';
  for (const model of [...new Set(models)]) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }
    );
    const data = await response.json();
    if (response.ok) return data;

    lastError = data?.error?.message ?? `${model} failed with ${response.status}`;
    console.warn(`Gemini ${model}: ${lastError}`);
  }

  throw new Error(lastError);
}

async function extractWithGemini(pdf, file) {
  const data = await callGemini({
    contents: [
      {
        parts: [
          {
            text:
              `Extract readable study text from "${basename(pdf.path)}". ` +
              `Subject: ${pdf.subject}. Topic: ${pdf.topic}. ` +
              'Return only useful textbook/lecture text, headings, formulas, and bullet points. ' +
              `Keep it concise and stop after about ${MAX_SOURCE_CHARS} characters.`,
          },
          {
            inline_data: {
              data: file.toString('base64'),
              mime_type: MIME_TYPE,
            },
          },
        ],
        role: 'user',
      },
    ],
  });

  return normalizeText(
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('\n') ?? ''
  );
}

async function extractPdfText(pdf, file) {
  const localText = normalizeText(`${extractWithPdfToText(pdf.path)}\n\n${extractWithPython(pdf.path)}`);
  if (localText.length >= MIN_EXTRACTED_CHARS) {
    console.log(`Extracted ${localText.length.toLocaleString()} chars locally.`);
    return localText.slice(0, MAX_SOURCE_CHARS);
  }

  console.log('Local extraction was weak; asking Gemini to extract the PDF locally from the seed script.');
  const geminiText = await extractWithGemini(pdf, file);
  if (geminiText.length < MIN_EXTRACTED_CHARS) {
    throw new Error(`Could not extract enough text from ${basename(pdf.path)}.`);
  }
  console.log(`Extracted ${geminiText.length.toLocaleString()} chars with Gemini.`);
  return geminiText.slice(0, MAX_SOURCE_CHARS);
}

async function generateStudyPack(pdf, sourceText) {
  const data = await callGemini({
    contents: [
      {
        parts: [
          {
            text:
              `Create a compact study pack for "${basename(pdf.path)}".\n` +
              `Subject: ${pdf.subject}\nTopic: ${pdf.topic}\n\n` +
              'Return strict JSON with this shape: ' +
              '{"summary":"string","detailed_notes":["string"],"flashcards":[{"front":"string","back":"string"}],"quiz":[{"question":"string","choices":["string","string","string"],"answer":"string"}],"weak_topics":["string"]}.\n' +
              'Make 8-14 detailed notes, 8-14 active-recall flashcards, 5 quiz questions, and 3-6 weak topics. ' +
              'Use only the provided source text.\n\n' +
              sourceText,
          },
        ],
        role: 'user',
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) throw new Error('Gemini did not return JSON text.');
  return normalizeStudyPack(JSON.parse(text));
}

function normalizeStudyPack(pack) {
  const detailedNotes = Array.isArray(pack.detailed_notes) ? pack.detailed_notes : [];
  const flashcards = Array.isArray(pack.flashcards) ? pack.flashcards : [];
  const quiz = Array.isArray(pack.quiz) ? pack.quiz : [];
  const weakTopics = Array.isArray(pack.weak_topics) ? pack.weak_topics : [];

  return {
    detailed_notes: detailedNotes.map(String).filter(Boolean).slice(0, 16),
    flashcards: flashcards
      .map((card) => ({
        back: String(card?.back ?? '').trim(),
        front: String(card?.front ?? '').trim(),
      }))
      .filter((card) => card.front && card.back)
      .slice(0, 16),
    quiz: quiz
      .map((item) => ({
        answer: String(item?.answer ?? '').trim(),
        choices: Array.isArray(item?.choices) ? item.choices.map(String).filter(Boolean).slice(0, 4) : [],
        question: String(item?.question ?? '').trim(),
      }))
      .filter((item) => item.question && item.answer && item.choices.length >= 2)
      .slice(0, 8),
    summary: String(pack.summary ?? '').trim(),
    weak_topics: weakTopics.map(String).filter(Boolean).slice(0, 8),
  };
}

function buildStudyTitle(pdf) {
  return `${pdf.subject} - ${pdf.topic}`;
}

async function createUpload(supabaseUrl, pdf, title, size) {
  return readJson(await fetch(`${supabaseUrl}/functions/v1/create-upload`, {
    body: JSON.stringify({
      mimeType: MIME_TYPE,
      size,
      subject: pdf.subject,
      title,
      topic: pdf.topic,
    }),
    headers: headers(),
    method: 'POST',
  }));
}

async function uploadOriginal(supabaseUrl, source, file) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/study-materials/${source.storage_path}`, {
    body: file,
    headers: {
      'Content-Type': MIME_TYPE,
      apikey: supabaseKey(),
      'x-upsert': 'false',
      ...(supabaseKey().includes('.') ? { Authorization: `Bearer ${supabaseKey()}` } : {}),
    },
    method: 'POST',
  });

  if (response.status === 409) {
    console.log('Original already exists in storage; reusing it.');
    return;
  }

  await readJson(response);
}

async function patchSourceReady(supabaseUrl, sourceId) {
  await readJson(await fetch(`${supabaseUrl}/rest/v1/sources?id=eq.${sourceId}`, {
    body: JSON.stringify({
      error: null,
      progress: 100,
      stage: 'complete',
      status: 'ready',
    }),
    headers: {
      ...headers(),
      Prefer: 'return=representation',
    },
    method: 'PATCH',
  }));

  await readJson(await fetch(`${supabaseUrl}/rest/v1/parse_jobs?source_id=eq.${sourceId}`, {
    body: JSON.stringify({
      error: null,
      stage: 'complete',
      status: 'completed',
    }),
    headers: {
      ...headers(),
      Prefer: 'return=representation',
    },
    method: 'PATCH',
  }));
}

async function upsertStudyPack(supabaseUrl, source, studyPack) {
  await readJson(await fetch(`${supabaseUrl}/rest/v1/generated_assets?source_id=eq.${source.id}`, {
    headers: headers(),
    method: 'DELETE',
  }));

  await readJson(await fetch(`${supabaseUrl}/rest/v1/generated_assets`, {
    body: JSON.stringify({
      content_json: studyPack,
      source_id: source.id,
      title: source.title,
      type: 'study_pack',
    }),
    headers: {
      ...headers(),
      Prefer: 'return=representation',
    },
    method: 'POST',
  }));
}

async function main() {
  loadEnvFile();

  const supabaseUrl = env('EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  if (!supabaseUrl || !supabaseKey()) {
    throw new Error('Missing Supabase URL/key. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or a service-role seed key.');
  }
  warnIfNoLocalExtractor();

  const [existingSources, existingAssets] = await Promise.all([
    readJson(await fetch(`${supabaseUrl}/rest/v1/sources?select=*`, { headers: headers() })),
    readJson(await fetch(`${supabaseUrl}/rest/v1/generated_assets?select=id,source_id`, { headers: headers() })),
  ]);
  const sourcesByTitle = new Map(existingSources.map((source) => [source.title, source]));
  const assetSourceIds = new Set(existingAssets.map((asset) => asset.source_id));

  for (const pdf of pdfs) {
    const title = buildStudyTitle(pdf);
    const fileName = basename(pdf.path);
    if (!existsSync(pdf.path)) {
      throw new Error(`Missing PDF: ${pdf.path}`);
    }

    let source = sourcesByTitle.get(title);
    if (source && assetSourceIds.has(source.id)) {
      console.log(`Skipping ${title}: source and study pack already exist.`);
      continue;
    }

    const file = readFileSync(pdf.path);
    const size = statSync(pdf.path).size;
    console.log(`Seeding ${title} from ${fileName}...`);

    if (!source) {
      const upload = await createUpload(supabaseUrl, pdf, title, size);
      source = upload.source;
      sourcesByTitle.set(title, source);
      console.log('Created source row.');
    } else {
      console.log('Reusing existing source row without a study pack.');
    }

    await uploadOriginal(supabaseUrl, source, file);
    const sourceText = await extractPdfText(pdf, file);
    const studyPack = await generateStudyPack(pdf, sourceText);
    await upsertStudyPack(supabaseUrl, source, studyPack);
    await patchSourceReady(supabaseUrl, source.id);
    assetSourceIds.add(source.id);
    console.log(`Seeded ${title}: ${studyPack.flashcards.length} cards, ${studyPack.quiz.length} quiz questions.`);
  }

  console.log('Seed complete. Open the app and refresh Library/Study tools.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
