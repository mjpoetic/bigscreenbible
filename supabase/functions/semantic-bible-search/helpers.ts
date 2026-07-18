export const semanticModel = "gte-small";
export const maximumQueryLength = 160;
export const maximumIndexBatchSize = 8;
const semanticConceptFamilies = [
  ["build", "built", "construct", "constructed", "make", "made"],
  ["ark", "boat", "ship", "vessel"],
  ["defeat", "defeated", "kill", "killed", "slay", "slew", "strike", "struck", "stone", "sling"],
  ["receive", "received", "give", "gave", "given"],
  ["commandment", "commandments", "law", "laws", "tablet", "tablets"],
  ["road", "way", "journey", "journeyed", "travel", "traveled", "approach", "approached"],
  ["happen", "happened", "occur", "occurred"],
  ["lead", "led", "bring", "brought", "guide", "guided"],
];

export type SemanticIndexChunk = {
  chunkKey: string;
  translation: "WEB";
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  content: string;
  contentHash: string;
  corpusVersion: string;
};

export function cleanSemanticQuery(value: unknown) {
  const query = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (query.length < 2 || query.length > maximumQueryLength) return "";
  return query;
}

export function semanticQueryForEmbedding(query: string) {
  const normalized = String(query || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = new Set(normalized.split(" ").filter(Boolean));
  const expansions = semanticConceptFamilies
    .filter((family) => family.some((term) => tokens.has(term)))
    .flat();
  const hasBuildConcept = semanticConceptFamilies[0].some((term) => tokens.has(term));
  if (hasBuildConcept && tokens.has("ark")) expansions.push("flood");
  return [...new Set([query, ...expansions])].join(" ");
}

export function semanticMatchCount(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 12;
  return Math.max(1, Math.min(20, Math.round(count)));
}

export function semanticMatchThreshold(value: unknown) {
  const threshold = Number(value);
  if (!Number.isFinite(threshold)) return 0.55;
  return Math.max(0.25, Math.min(0.95, threshold));
}

function validHexHash(value: unknown) {
  return /^[0-9a-f]{64}$/.test(String(value || ""));
}

function validIndexChunk(value: unknown): value is SemanticIndexChunk {
  if (!value || typeof value !== "object") return false;
  const chunk = value as Record<string, unknown>;
  const chapter = Number(chunk.chapter);
  const startVerse = Number(chunk.startVerse);
  const endVerse = Number(chunk.endVerse);
  return (
    /^WEB:.{2,120}$/.test(String(chunk.chunkKey || "")) &&
    chunk.translation === "WEB" &&
    String(chunk.book || "").length >= 2 && String(chunk.book || "").length <= 40 &&
    Number.isInteger(chapter) && chapter >= 1 && chapter <= 150 &&
    Number.isInteger(startVerse) && startVerse >= 1 && startVerse <= 176 &&
    Number.isInteger(endVerse) && endVerse >= startVerse && endVerse <= 176 &&
    String(chunk.reference || "").length >= 5 && String(chunk.reference || "").length <= 100 &&
    String(chunk.content || "").length >= 10 && String(chunk.content || "").length <= 4000 &&
    validHexHash(chunk.contentHash) &&
    validHexHash(chunk.corpusVersion)
  );
}

export function cleanIndexChunks(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > maximumIndexBatchSize) return [];
  return value.filter(validIndexChunk);
}

export function validCorpusVersion(value: unknown) {
  return validHexHash(value) ? String(value) : "";
}

export function cleanScopeBook(value: unknown) {
  const book = String(value || "").trim();
  return /^[1-3]?[ A-Za-z]{2,40}$/.test(book) ? book : "";
}
