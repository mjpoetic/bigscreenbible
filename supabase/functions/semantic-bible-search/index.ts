import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  cleanIndexChunks,
  cleanScopeBook,
  cleanSemanticQuery,
  semanticMatchCount,
  semanticMatchThreshold,
  semanticModel,
  semanticQueryForEmbedding,
  validCorpusVersion,
} from "./helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const semanticTable = "bsb_semantic_passages";
const semanticRpc = "match_bsb_semantic_passages";
const model = new Supabase.ai.Session(semanticModel);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function serverCredentials() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("Supabase server credentials are not configured");
  return { url, serviceRoleKey };
}

function databaseClient() {
  const { url, serviceRoleKey } = serverCredentials();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function authorizedIndexer(request: Request) {
  const { serviceRoleKey } = serverCredentials();
  if (request.headers.get("Authorization") === `Bearer ${serviceRoleKey}`) return true;
  const suppliedApiKey = request.headers.get("apikey");
  if (!suppliedApiKey) return false;
  try {
    const configuredSecretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return Object.values(configuredSecretKeys).some((key) => key === suppliedApiKey);
  } catch {
    return false;
  }
}

async function embeddingFor(content: string) {
  return await model.run(content, { mean_pool: true, normalize: true }) as number[];
}

async function searchPassages(body: Record<string, unknown>) {
  const query = cleanSemanticQuery(body.query);
  if (!query) return jsonResponse({ error: "A valid search query is required" }, 400);
  const matchCount = semanticMatchCount(body.limit);
  const matchThreshold = semanticMatchThreshold(body.threshold);
  const embedding = await embeddingFor(semanticQueryForEmbedding(query));
  const { data, error } = await databaseClient().rpc(semanticRpc, {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error) throw error;
  const results = (Array.isArray(data) ? data : []).map((row) => {
    const ref = String(row.reference || "");
    const content = String(row.content || "");
    return {
      ref,
      goto: String(row.start_ref || ""),
      text: content.startsWith(`${ref}. `) ? content.slice(ref.length + 2) : content,
      version: "WEB",
      score: Number(row.similarity) || 0,
    };
  }).filter((result) => result.ref && result.goto && result.text);
  return jsonResponse({ query, model: semanticModel, results });
}

async function indexPassages(request: Request, body: Record<string, unknown>) {
  if (!authorizedIndexer(request)) return jsonResponse({ error: "Unauthorized" }, 401);
  const chunks = cleanIndexChunks(body.chunks);
  if (!chunks.length || chunks.length !== (Array.isArray(body.chunks) ? body.chunks.length : 0)) {
    return jsonResponse({ error: "A valid WEB indexing batch is required" }, 400);
  }
  const rows = [];
  for (const chunk of chunks) {
    rows.push({
      chunk_key: chunk.chunkKey,
      translation: chunk.translation,
      book: chunk.book,
      chapter: chunk.chapter,
      start_verse: chunk.startVerse,
      end_verse: chunk.endVerse,
      reference: chunk.reference,
      content: chunk.content,
      content_hash: chunk.contentHash,
      corpus_version: chunk.corpusVersion,
      embedding_model: semanticModel,
      embedding: JSON.stringify(await embeddingFor(chunk.content)),
      updated_at: new Date().toISOString(),
    });
  }
  const { error } = await databaseClient().from(semanticTable).upsert(rows, { onConflict: "chunk_key" });
  if (error) throw error;
  return jsonResponse({ indexed: rows.length, corpusVersion: chunks[0].corpusVersion });
}

async function indexStatus(request: Request, body: Record<string, unknown>) {
  if (!authorizedIndexer(request)) return jsonResponse({ error: "Unauthorized" }, 401);
  const corpusVersion = validCorpusVersion(body.corpusVersion);
  if (!corpusVersion) return jsonResponse({ error: "A valid corpus version is required" }, 400);
  const requestedScopeBook = String(body.scopeBook || "").trim();
  const scopeBook = cleanScopeBook(requestedScopeBook);
  if (requestedScopeBook && !scopeBook) return jsonResponse({ error: "Invalid scopeBook" }, 400);
  const offset = Math.max(0, Math.min(20_000, Math.floor(Number(body.offset) || 0)));
  const pageSize = 1_000;
  let query = databaseClient()
    .from(semanticTable)
    .select("chunk_key")
    .eq("translation", "WEB")
    .eq("corpus_version", corpusVersion)
    .order("chunk_key")
    .range(offset, offset + pageSize - 1);
  if (scopeBook) query = query.eq("book", scopeBook);
  const { data, error } = await query;
  if (error) throw error;
  const chunkKeys = (Array.isArray(data) ? data : [])
    .map((row) => String(row.chunk_key || ""))
    .filter(Boolean);
  return jsonResponse({
    corpusVersion,
    scopeBook: scopeBook || null,
    chunkKeys,
    nextOffset: chunkKeys.length === pageSize ? offset + pageSize : null,
  });
}

async function finalizeIndex(request: Request, body: Record<string, unknown>) {
  if (!authorizedIndexer(request)) return jsonResponse({ error: "Unauthorized" }, 401);
  const corpusVersion = validCorpusVersion(body.corpusVersion);
  if (!corpusVersion) return jsonResponse({ error: "A valid corpus version is required" }, 400);
  const requestedScopeBook = String(body.scopeBook || "").trim();
  const scopeBook = cleanScopeBook(requestedScopeBook);
  if (requestedScopeBook && !scopeBook) {
    return jsonResponse({ error: "Invalid scopeBook" }, 400);
  }
  let deletion = databaseClient()
    .from(semanticTable)
    .delete()
    .eq("translation", "WEB")
    .neq("corpus_version", corpusVersion);
  if (scopeBook) deletion = deletion.eq("book", scopeBook);
  const { error } = await deletion;
  if (error) throw error;
  return jsonResponse({ finalized: true, corpusVersion, scopeBook: scopeBook || null });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 500_000) return jsonResponse({ error: "Request body is too large" }, 413);

  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "index") return await indexPassages(request, body);
    if (body.action === "status") return await indexStatus(request, body);
    if (body.action === "finalize") return await finalizeIndex(request, body);
    return await searchPassages(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Semantic Bible search failed";
    console.error("[Semantic Bible Search]", message);
    return jsonResponse({ error: "Semantic Bible search is temporarily unavailable" }, 502);
  }
});
