import assert from "node:assert/strict";
import test from "node:test";
import { passageUrl } from "../src/passage.mjs";

test("preserves numbered books and ranges in reader links", () => {
  const url = new URL(passageUrl("  1 John 2:1–3  ", "kjv"));
  assert.equal(url.origin, "https://bigscreenbible.com");
  assert.equal(url.searchParams.get("ref"), "1 John 2:1-3");
  assert.equal(url.searchParams.get("version"), "KJV");
  assert.equal(url.searchParams.get("mode"), "reader");
});
test("supports presentation and parallel links with default translation", () => {
  for (const mode of ["big", "parallel"]) {
    const url = new URL(passageUrl("Psalm 23", " ", mode));
    assert.equal(url.searchParams.get("mode"), mode);
    assert.equal(url.searchParams.get("version"), "BSB");
  }
});
test("reference cannot inject query parameters or redirect the destination", () => {
  const url = new URL(passageUrl("John 3:16&mode=big#test"));
  assert.equal(url.searchParams.get("mode"), "reader");
  assert.equal(url.hash, "");
  assert.equal(url.searchParams.get("ref"), "John 3:16&mode=big#test");
});
test("rejects empty references and unsupported modes", () => {
  assert.throws(() => passageUrl("  "), /Enter a Bible reference/);
  assert.throws(() => passageUrl("a".repeat(201)), /200 characters/);
  assert.throws(() => passageUrl("John 3", "BSB", "invalid"), /display mode/);
});
