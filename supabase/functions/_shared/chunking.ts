export type SectionChunk = {
  text: string;
  sectionPath: string | null;
  page: number | null;
};

const WORDS_PER_CHUNK = 700;

const HEADING_PATTERNS: Array<{ regex: RegExp; level: number }> = [
  { regex: /^#{1,6}\s+(.{2,120})$/, level: 1 },
  { regex: /^(?:chapter|unit|module|part)\s+([ivxlc\d]+)\s*[:.\-–]?\s*(.{0,100})$/i, level: 1 },
  { regex: /^(\d+(?:\.\d+)*)[.):]?\s+([A-Z][^.!?]{2,100})$/, level: 2 },
  { regex: /^([A-Z][A-Z\s&,'-]{4,80})$/, level: 2 },
];

function matchHeading(line: string): { title: string; level: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 140) {
    return null;
  }

  for (const pattern of HEADING_PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      const title = match.slice(1).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (title.length >= 3) {
        return { title, level: pattern.level };
      }
    }
  }

  return null;
}

export function detectSections(text: string): SectionChunk[] {
  const lines = text.split(/\r?\n/);
  const sections: SectionChunk[] = [];
  let currentTitle: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body) {
      sections.push({ page: null, sectionPath: currentTitle, text: body });
    }
    buffer = [];
  };

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      flush();
      currentTitle = heading.title;
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections.length > 0 ? sections : [{ page: null, sectionPath: null, text }];
}

function splitWordsIntoChunks(body: string): string[] {
  const words = body.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const pieces: string[] = [];

  for (let index = 0; index < words.length; index += WORDS_PER_CHUNK) {
    const piece = words.slice(index, index + WORDS_PER_CHUNK).join(' ');
    if (piece) {
      pieces.push(piece);
    }
  }

  return pieces.length > 0 ? pieces : [];
}

export function chunkBySections(
  text: string,
  maxChunks = 48
): SectionChunk[] {
  const sections = detectSections(text);
  const chunks: SectionChunk[] = [];

  for (const section of sections) {
    for (const piece of splitWordsIntoChunks(section.text)) {
      chunks.push({
        page: section.page,
        sectionPath: section.sectionPath,
        text: piece,
      });

      if (chunks.length >= maxChunks) {
        return chunks;
      }
    }
  }

  return chunks;
}
