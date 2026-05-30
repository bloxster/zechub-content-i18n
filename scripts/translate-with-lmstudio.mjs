import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const baseUrl = process.env.LMSTUDIO_BASE_URL ?? 'https://stealth.taila51c8e.ts.net/v1';
const model = process.env.LMSTUDIO_MODEL ?? 'minerva-7b-instruct-v1.0';
const sourcePath = process.argv[2];
const targetPath = process.argv[3];

if (!sourcePath || !targetPath) {
  console.error('Usage: node scripts/translate-with-lmstudio.mjs <source.md> <target.md>');
  process.exit(1);
}

const protectedTerms = JSON.parse(
  readFileSync(join(root, 'translation/protected-terms.json'), 'utf8'),
).preserveVerbatim;
const source = readFileSync(join(root, sourcePath), 'utf8');

function buildPrompt(markdown, chunkNote = '') {
  return `Translate the following ZecHub Wiki Markdown ${chunkNote}from English to Italian.

Rules:
- Return ONLY the translated Markdown. Do not wrap it in a code fence.
- Preserve Markdown structure, headings, lists, links, images, HTML, JSX, iframe blocks, and code blocks.
- Preserve these protected Zcash ecosystem terms verbatim when they appear: ${protectedTerms.join(', ')}.
- Keep product, wallet, protocol, organization, and project names unchanged.
- Use natural Italian suitable for a technical wiki.
- Pay special attention to Italian accents: use "è" when the word is the verb "is"; use "e" only for the conjunction "and".
- Do not invent new sections or remove source content.

Markdown source:

${markdown}`;
}

function splitMarkdown(markdown) {
  const chunks = [];
  let current = [];
  let currentWords = 0;
  const maxWords = Number(process.env.LMSTUDIO_CHUNK_WORDS ?? 650);

  for (const line of markdown.split('\n')) {
    const lineWords = line.trim().split(/\s+/).filter(Boolean).length;
    const startsSection = /^#{1,3}\s+/.test(line) || line.trim() === '---';

    if (startsSection && current.length > 0 && currentWords + lineWords > maxWords) {
      chunks.push(current.join('\n').trimEnd());
      current = [];
      currentWords = 0;
    }

    current.push(line);
    currentWords += lineWords;
  }

  if (current.length > 0) {
    chunks.push(current.join('\n').trimEnd());
  }

  return chunks;
}

async function translateMarkdown(markdown, chunkIndex = null, chunkTotal = null) {
  const chunkNote =
    chunkIndex === null ? 'page ' : `chunk ${chunkIndex + 1} of ${chunkTotal} `;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a careful Italian technical translator for Zcash documentation. You preserve Markdown and protected terminology exactly.',
        },
        { role: 'user', content: buildPrompt(markdown, chunkNote) },
      ],
      temperature: 0.15,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  let translated = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;

  if (typeof translated !== 'string' || translated.trim().length === 0) {
    throw new Error(`LM Studio returned no translation content: ${JSON.stringify(data).slice(0, 1000)}`);
  }

  translated = translated.trim();
  return translated.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/i, '').trimEnd();
}

let translated;
try {
  translated = await translateMarkdown(source);
} catch (err) {
  if (!String(err.message ?? err).includes('context length')) {
    console.error(err.message ?? err);
    process.exit(1);
  }

  const chunks = splitMarkdown(source);
  console.log(`Input exceeded context; translating ${chunks.length} chunks.`);
  const translatedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    translatedChunks.push(await translateMarkdown(chunks[i], i, chunks.length));
  }
  translated = translatedChunks.join('\n\n');
}

if (!translated) {
  console.error('No translated output produced.');
  process.exit(1);
}

mkdirSync(dirname(join(root, targetPath)), { recursive: true });
writeFileSync(join(root, targetPath), `${translated}\n`);
console.log(`Translated ${sourcePath} -> ${targetPath} using ${model}`);
