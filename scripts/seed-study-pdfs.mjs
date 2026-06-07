import { readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

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

function headers(contentType = 'application/json') {
  const key = env('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const nextHeaders = {
    'Content-Type': contentType,
    apikey: key,
  };

  if (key.includes('.')) {
    nextHeaders.Authorization = `Bearer ${key}`;
  }

  return nextHeaders;
}

async function readJson(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed with ${response.status}`);
  }
  return data;
}

async function main() {
  loadEnvFile();

  const supabaseUrl = env('EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const supabaseKey = env('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const existingRows = await readJson(await fetch(`${supabaseUrl}/rest/v1/sources?select=id,title`, {
    headers: headers(),
  }));
  const existingTitles = new Set(existingRows.map((row) => row.title));

  for (const pdf of pdfs) {
    const title = basename(pdf.path);
    if (existingTitles.has(title)) {
      console.log(`Skipping ${title}: already exists.`);
      continue;
    }

    const file = readFileSync(pdf.path);
    const size = statSync(pdf.path).size;
    console.log(`Uploading ${title}...`);

    const createUpload = await readJson(await fetch(`${supabaseUrl}/functions/v1/create-upload`, {
      body: JSON.stringify({
        mimeType: 'application/pdf',
        size,
        subject: pdf.subject,
        title,
        topic: pdf.topic,
      }),
      headers: headers(),
      method: 'POST',
    }));

    await readJson(await fetch(`${supabaseUrl}/storage/v1/object/study-materials/${createUpload.upload.path}`, {
      body: file,
      headers: {
        'Content-Type': 'application/pdf',
        apikey: supabaseKey,
        'x-upsert': 'false',
      },
      method: 'POST',
    }));

    await readJson(await fetch(`${supabaseUrl}/functions/v1/process-source`, {
      body: JSON.stringify({ sourceId: createUpload.source.id }),
      headers: headers(),
      method: 'POST',
    }));

    existingTitles.add(title);
    console.log(`Seeded ${title}.`);
  }

  await readJson(await fetch(`${supabaseUrl}/functions/v1/get-source-assets`, {
    headers: headers(),
  }));
  console.log('Seed complete. Open the app and refresh Library/Study tools.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
