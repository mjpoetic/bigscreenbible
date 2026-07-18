import {
  cleanIndexChunks,
  cleanScopeBook,
  cleanSemanticQuery,
  semanticMatchCount,
  semanticMatchThreshold,
  semanticQueryForEmbedding,
  validCorpusVersion,
} from "./helpers.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

const hash = "a".repeat(64);
const validChunk = {
  chunkKey: "WEB:Genesis:6:13-22",
  translation: "WEB" as const,
  book: "Genesis",
  chapter: 6,
  startVerse: 13,
  endVerse: 22,
  reference: "Genesis 6:13-22",
  content: "Genesis 6:13-22. God said to Noah to make a ship of gopher wood.",
  contentHash: hash,
  corpusVersion: hash,
};

Deno.test("cleans and bounds public semantic queries", () => {
  assertEquals(cleanSemanticQuery("  Who\n built the ark?  "), "Who built the ark?");
  assertEquals(cleanSemanticQuery("x".repeat(161)), "");
  assertEquals(semanticMatchCount(99), 20);
  assertEquals(semanticMatchThreshold(0.1), 0.25);
});

Deno.test("accepts only bounded WEB indexing batches", () => {
  assertEquals(cleanIndexChunks([validChunk]).length, 1);
  assertEquals(cleanIndexChunks([{ ...validChunk, translation: "NLT" }]).length, 0);
  assertEquals(cleanIndexChunks(Array.from({ length: 9 }, () => validChunk)).length, 0);
});

Deno.test("validates corpus versions and optional book scopes", () => {
  assertEquals(validCorpusVersion(hash), hash);
  assertEquals(validCorpusVersion("nope"), "");
  assertEquals(cleanScopeBook("1 Samuel"), "1 Samuel");
  assertEquals(cleanScopeBook("Genesis; delete"), "");
});

Deno.test("expands retrieval concepts without changing ordinary questions", () => {
  assertEquals(semanticQueryForEmbedding("Where was Jesus born?"), "Where was Jesus born?");
  const arkQuery = semanticQueryForEmbedding("Who built the ark?");
  assertEquals(arkQuery.includes("constructed"), true);
  assertEquals(arkQuery.includes("ship"), true);
  assertEquals(arkQuery.includes("flood"), true);
  const roadQuery = semanticQueryForEmbedding("What happened on the road to Damascus?");
  assertEquals(roadQuery.includes("occurred"), true);
  assertEquals(roadQuery.includes("traveled"), true);
});
