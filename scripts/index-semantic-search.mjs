import vm from "node:vm";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSemanticCorpus } from "./semantic-search-corpus.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const functionName = "semantic-bible-search";
const retryableStatuses = new Set([429, 500, 502, 503, 504, 546]);

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "") : "";
}

function publicSupabaseConfig() {
  const context = { window: {} };
  vm.createContext(context);
  const configPath = path.join(rootDir, "assets/supabase-config.js");
  vm.runInContext(readFileSync(configPath, "utf8"), context, { filename: configPath });
  return context.window.BigScreenBibleSupabase || {};
}

async function request(url, serverKey, body) {
  const headers = {
    "Content-Type": "application/json",
    apikey: serverKey,
  };
  if (!serverKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${serverKey}`;
  }
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) return payload;
    const detail = payload.error || payload.message || payload.code || "Semantic index request failed";
    if (!retryableStatuses.has(response.status) || attempt === 4) {
      throw new Error(`${detail} (${response.status})`);
    }
    const delayMs = 500 * (2 ** (attempt - 1));
    console.warn(`Request returned ${response.status}; retrying in ${delayMs}ms (${attempt}/4).`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

async function main() {
  const book = optionValue("--book");
  const dryRun = process.argv.includes("--dry-run");
  const batchSize = Math.max(1, Math.min(8, Number(optionValue("--batch-size")) || 2));
  const corpus = buildSemanticCorpus({ book });
  console.log(`Prepared ${corpus.chunks.length} WEB chunks (${corpus.scopeBook || "whole Bible"}).`);
  console.log(`Corpus version: ${corpus.corpusVersion}`);
  if (dryRun) return;

  const serverKey = String(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ).trim();
  if (!serverKey) {
    throw new Error("Set SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY before indexing. Never add it to the repository.");
  }
  const config = publicSupabaseConfig();
  if (!config.url) throw new Error("Supabase URL is missing from assets/supabase-config.js");
  const functionUrl = `${String(config.url).replace(/\/$/, "")}/functions/v1/${functionName}`;

  const existingChunkKeys = new Set();
  let statusOffset = 0;
  do {
    const status = await request(functionUrl, serverKey, {
      action: "status",
      corpusVersion: corpus.corpusVersion,
      scopeBook: corpus.scopeBook,
      offset: statusOffset,
    });
    (Array.isArray(status.chunkKeys) ? status.chunkKeys : []).forEach((key) => existingChunkKeys.add(key));
    statusOffset = Number.isInteger(status.nextOffset) ? status.nextOffset : -1;
  } while (statusOffset >= 0);
  const chunksToIndex = corpus.chunks.filter((chunk) => !existingChunkKeys.has(chunk.chunkKey));
  if (existingChunkKeys.size) {
    console.log(`Resuming with ${existingChunkKeys.size}/${corpus.chunks.length} chunks already indexed.`);
  }

  for (let index = 0; index < chunksToIndex.length; index += batchSize) {
    const chunks = chunksToIndex.slice(index, index + batchSize);
    await request(functionUrl, serverKey, { action: "index", chunks });
    const completed = corpus.chunks.length - chunksToIndex.length + index + chunks.length;
    if (completed === corpus.chunks.length || completed % 20 < chunks.length) {
      console.log(`Indexed ${Math.min(completed, corpus.chunks.length)}/${corpus.chunks.length}`);
    }
  }
  await request(functionUrl, serverKey, {
    action: "finalize",
    corpusVersion: corpus.corpusVersion,
    scopeBook: corpus.scopeBook,
  });
  console.log(`Semantic index finalized for ${corpus.scopeBook || "the whole Bible"}.`);
}

await main();
