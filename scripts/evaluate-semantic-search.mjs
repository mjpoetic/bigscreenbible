import vm from "node:vm";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync(path.join(rootDir, "assets/supabase-config.js"), "utf8"), context);
const config = context.window.BigScreenBibleSupabase || {};
const fixtures = JSON.parse(readFileSync(path.join(__dirname, "semantic-search-quality.json"), "utf8"));
if (!config.url || !config.anonKey) throw new Error("Supabase public configuration is missing");
const url = `${String(config.url).replace(/\/$/, "")}/functions/v1/semantic-bible-search`;

function referenceParts(value) {
  const match = String(value).match(/^(.+?)\s(\d+):(\d+)(?:-(\d+))?/);
  return match ? { book: match[1], chapter: Number(match[2]), start: Number(match[3]), end: Number(match[4] || match[3]) } : null;
}

function referencesOverlap(left, right) {
  const a = referenceParts(left);
  const b = referenceParts(right);
  return Boolean(a && b && a.book === b.book && a.chapter === b.chapter && a.start <= b.end && b.start <= a.end);
}

let topThree = 0;
let topFive = 0;
for (const fixture of fixtures) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({ query: fixture.query, limit: 8 }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Search failed (${response.status})`);
  const results = Array.isArray(payload.results) ? payload.results : [];
  const firstMatch = results.findIndex((result) => fixture.expected.some((expected) => referencesOverlap(result.ref, expected)));
  if (firstMatch >= 0 && firstMatch < 3) topThree += 1;
  if (firstMatch >= 0 && firstMatch < 5) topFive += 1;
  console.log(`${firstMatch >= 0 ? `#${firstMatch + 1}` : "MISS"} ${fixture.query}`);
  if (firstMatch < 0) {
    console.log(`  Returned: ${results.map((result) => result.ref).join(" | ") || "none"}`);
  }
}

console.log(`Top-3 recall: ${topThree}/${fixtures.length}`);
console.log(`Top-5 recall: ${topFive}/${fixtures.length}`);
if (topFive / fixtures.length < 0.75) process.exitCode = 1;
