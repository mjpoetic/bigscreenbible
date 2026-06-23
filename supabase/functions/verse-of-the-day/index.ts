import { createClient } from "npm:@supabase/supabase-js@2";
import { parseNewestVerseItem, type VerseOfTheDayItem } from "./rss-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const feedUrl = "https://feeds.feedburner.com/hl-devos-votd";
const cacheTable = "bsb_verse_of_day_cache";
const cacheTimeZone = "America/Chicago";
const cacheRefreshHour = 2;

type CacheRow = {
  cache_date: string;
  status: "pending" | "ready" | "failed";
  reference: string | null;
  verse_text: string | null;
  source_url: string | null;
  published_at: string | null;
  fetched_at: string | null;
};

function jsonResponse(body: unknown, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

function dateKey(date = new Date()) {
  const refreshAdjustedDate = new Date(date.getTime() - cacheRefreshHour * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: cacheTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(refreshAdjustedDate);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function responseItem(row: CacheRow) {
  if (
    row.status !== "ready" || !row.reference || !row.verse_text ||
    !row.source_url || !row.published_at || !row.fetched_at
  ) return null;

  return {
    reference: row.reference,
    verseText: row.verse_text,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
  };
}

async function fetchNewestItem() {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "BigScreenBible-VerseOfTheDay/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`RSS request failed with status ${response.status}`);
  const xml = await response.text();
  if (xml.length > 1_000_000) throw new Error("RSS response exceeded the size limit");
  return parseNewestVerseItem(xml);
}

function databaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server credentials are not configured");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);

  const cacheDate = dateKey();

  try {
    const supabase = databaseClient();
    const { data: cached, error: cacheReadError } = await supabase
      .from(cacheTable)
      .select("*")
      .eq("cache_date", cacheDate)
      .maybeSingle<CacheRow>();
    if (cacheReadError) throw cacheReadError;

    const cachedItem = cached ? responseItem(cached) : null;
    if (cachedItem) {
      return jsonResponse({ ...cachedItem, cached: true }, 200, "public, max-age=300");
    }
    if (cached?.status === "failed") {
      return jsonResponse({ error: "The Verse of the Day RSS fetch failed today" }, 502);
    }
    if (cached?.status === "pending") {
      return jsonResponse({ error: "The Verse of the Day is being refreshed" }, 503);
    }

    const { error: reservationError } = await supabase.from(cacheTable).insert({
      cache_date: cacheDate,
      status: "pending",
    });
    if (reservationError) {
      if (reservationError.code === "23505") {
        return jsonResponse({ error: "The Verse of the Day is being refreshed" }, 503);
      }
      throw reservationError;
    }

    try {
      const item: VerseOfTheDayItem = await fetchNewestItem();
      const fetchedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(cacheTable)
        .update({
          status: "ready",
          reference: item.reference,
          verse_text: item.verseText,
          source_url: item.sourceUrl,
          published_at: item.publishedAt,
          fetched_at: fetchedAt,
        })
        .eq("cache_date", cacheDate);
      if (updateError) throw updateError;

      return jsonResponse({ ...item, fetchedAt, cached: false }, 200, "public, max-age=300");
    } catch (error) {
      await supabase
        .from(cacheTable)
        .update({ status: "failed", fetched_at: new Date().toISOString() })
        .eq("cache_date", cacheDate);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verse of the Day request failed";
    console.error("[Verse of the Day]", message);
    return jsonResponse({ error: message }, 502);
  }
});
