import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const maximumChunkWords = 180;

function browserGlobal(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readFileSync(filePath, "utf8"), context, { filename: filePath });
  const value = context.window[globalName];
  if (!value) throw new Error(`${globalName} did not initialize from ${filePath}`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function chapterParts(chapterKey) {
  const match = String(chapterKey).match(/^(.+)\s(\d+)$/);
  if (!match) throw new Error(`Invalid chapter key: ${chapterKey}`);
  return { book: match[1], chapter: Number(match[2]) };
}

function verseWords(verse) {
  return String(verse.text || "").trim().split(/\s+/).filter(Boolean).length;
}

function splitLongParagraph(verses) {
  const chunks = [];
  let current = [];
  let currentWords = 0;
  verses.forEach((verse) => {
    const words = verseWords(verse);
    if (current.length && currentWords + words > maximumChunkWords) {
      chunks.push(current);
      current = current.slice(-1);
      currentWords = current.reduce((sum, item) => sum + verseWords(item), 0);
    }
    current.push(verse);
    currentWords += words;
  });
  if (current.length) chunks.push(current);
  return chunks;
}

function chapterParagraphs(verses, starts) {
  const startSet = new Set((starts || []).map(Number));
  const paragraphs = [];
  let paragraph = [];
  verses.forEach((verse) => {
    if (paragraph.length && startSet.has(Number(verse.n))) {
      paragraphs.push(paragraph);
      paragraph = [];
    }
    paragraph.push(verse);
  });
  if (paragraph.length) paragraphs.push(paragraph);
  return paragraphs.flatMap(splitLongParagraph);
}

function referenceLabel(chapterKey, startVerse, endVerse) {
  return startVerse === endVerse
    ? `${chapterKey}:${startVerse}`
    : `${chapterKey}:${startVerse}-${endVerse}`;
}

function semanticContent(reference, verses) {
  const scripture = verses.map((verse) => `${verse.n} ${String(verse.text || "").trim()}`).join(" ");
  return `${reference}. ${scripture}`;
}

function chunkFromVerses(chapterKey, verses) {
  const { book, chapter } = chapterParts(chapterKey);
  const startVerse = Number(verses[0].n);
  const endVerse = Number(verses[verses.length - 1].n);
  const reference = referenceLabel(chapterKey, startVerse, endVerse);
  const content = semanticContent(reference, verses);
  return {
    chunkKey: `WEB:${book}:${chapter}:${startVerse}-${endVerse}`,
    translation: "WEB",
    book,
    chapter,
    startVerse,
    endVerse,
    reference,
    content,
    contentHash: sha256(content),
  };
}

export function buildSemanticCorpus(options = {}) {
  const web = browserGlobal(path.join(rootDir, "assets/bibles/WEB.js"), "BIGSCREEN_BIBLE_WEB");
  const paragraphData = browserGlobal(
    path.join(rootDir, "assets/bibles/paragraphs.js"),
    "BIGSCREEN_BIBLE_PARAGRAPHS",
  );
  const startsByChapter = paragraphData?.versions?.WEB || {};
  const requestedBook = String(options.book || "").trim();
  const chunks = Object.entries(web.chapters).flatMap(([chapterKey, chapter]) => {
    const { book } = chapterParts(chapterKey);
    if (requestedBook && book !== requestedBook) return [];
    return chapterParagraphs(chapter.verses || [], startsByChapter[chapterKey])
      .map((verses) => chunkFromVerses(chapterKey, verses));
  });
  const corpusVersion = sha256(chunks.map((chunk) => `${chunk.chunkKey}:${chunk.contentHash}`).join("\n"));
  return {
    translation: "WEB",
    embeddingModel: "gte-small",
    scopeBook: requestedBook || null,
    corpusVersion,
    chunks: chunks.map((chunk) => ({ ...chunk, corpusVersion })),
  };
}

function commandLineSummary() {
  const bookIndex = process.argv.indexOf("--book");
  const book = bookIndex >= 0 ? String(process.argv[bookIndex + 1] || "") : "";
  const corpus = buildSemanticCorpus({ book });
  console.log(JSON.stringify({
    translation: corpus.translation,
    embeddingModel: corpus.embeddingModel,
    scopeBook: corpus.scopeBook,
    corpusVersion: corpus.corpusVersion,
    chunks: corpus.chunks.length,
    firstReference: corpus.chunks[0]?.reference || null,
    lastReference: corpus.chunks.at(-1)?.reference || null,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) commandLineSummary();
