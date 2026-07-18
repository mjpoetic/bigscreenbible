import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixtures = JSON.parse(readFileSync(new URL("./semantic-search-quality.json", import.meta.url), "utf8"));
assert.ok(Array.isArray(fixtures));
assert.ok(fixtures.length >= 20);
assert.equal(new Set(fixtures.map((fixture) => fixture.query.toLowerCase())).size, fixtures.length);
fixtures.forEach((fixture) => {
  assert.ok(typeof fixture.query === "string" && fixture.query.endsWith("?"));
  assert.ok(Array.isArray(fixture.expected) && fixture.expected.length >= 1);
  fixture.expected.forEach((reference) => assert.match(reference, /^(?:[1-3]\s)?[A-Za-z]+(?: [A-Za-z]+)* \d+:\d/));
});

console.log(`Semantic search quality fixtures passed (${fixtures.length} questions)`);
