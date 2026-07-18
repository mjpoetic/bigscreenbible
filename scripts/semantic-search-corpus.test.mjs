import assert from "node:assert/strict";
import { buildSemanticCorpus } from "./semantic-search-corpus.mjs";

const genesis = buildSemanticCorpus({ book: "Genesis" });
const genesisAgain = buildSemanticCorpus({ book: "Genesis" });

assert.equal(genesis.translation, "WEB");
assert.equal(genesis.embeddingModel, "gte-small");
assert.equal(genesis.corpusVersion, genesisAgain.corpusVersion);
assert.ok(genesis.chunks.length > 150);
assert.equal(new Set(genesis.chunks.map((chunk) => chunk.chunkKey)).size, genesis.chunks.length);
assert.ok(genesis.chunks.every((chunk) => chunk.translation === "WEB"));
assert.ok(genesis.chunks.every((chunk) => chunk.content.length <= 4000));
assert.ok(genesis.chunks.every((chunk) => chunk.contentHash.length === 64));

const ark = genesis.chunks.find((chunk) => chunk.reference.startsWith("Genesis 6:13-"));
assert.ok(ark, "Expected the WEB paragraph containing Noah's ark");
assert.match(ark.content, /Noah/);
assert.match(ark.content, /ship/);

console.log(`Semantic WEB corpus tests passed (${genesis.chunks.length} Genesis chunks)`);
