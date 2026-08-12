import { parseEsvVerses } from "./passage-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const parserVersion = "2026-08-12-section-heading-boundaries";
const maximumSearchQueryLength = 120;
const maximumSearchResults = 20;

function jsonResponse(
  body: unknown,
  status = 200,
  cacheControl = status === 200 ? "public, max-age=3600" : "no-store",
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

function cleanPlainText(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchPhraseFromQuery(value: string) {
  const quoted = value.match(/"([^"]+)"/);
  return normalizeSearchText(quoted?.[1] || value);
}

function esvSearchQuery(value: string, exact: boolean) {
  const phrase = searchPhraseFromQuery(value);
  if (!exact) return value;
  return phrase ? `"${phrase}"` : value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ESV_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "ESV_API_KEY is not configured" }, 500);
  }

  const url = new URL(request.url);
  if (url.searchParams.get("action") === "search") {
    const searchQuery = (url.searchParams.get("query") || "").trim()
      .replace(/\s+/g, " ");
    if (!searchQuery || searchQuery.length > maximumSearchQueryLength) {
      return jsonResponse({ error: "A valid search query is required" }, 400);
    }
    const exact = url.searchParams.get("exact") === "true";
    const phrase = searchPhraseFromQuery(searchQuery);
    const esvSearchUrl = new URL("https://api.esv.org/v3/passage/search/");
    esvSearchUrl.searchParams.set("q", esvSearchQuery(searchQuery, exact));
    esvSearchUrl.searchParams.set("page-size", String(maximumSearchResults));

    const esvSearchResponse = await fetch(esvSearchUrl, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });
    const payload = await esvSearchResponse.json().catch(() => ({}));

    if (!esvSearchResponse.ok) {
      return jsonResponse(
        { error: payload.detail || payload.error || "ESV API search failed" },
        esvSearchResponse.status,
      );
    }

    const sourceResults = Array.isArray(payload.results)
      ? payload.results
      : [];
    const results = sourceResults
      .map((result: { reference?: unknown; content?: unknown }, index: number) => {
        const text = cleanPlainText(result.content);
        const ref = String(result.reference || "").trim();
        if (!text || !ref) return null;
        if (exact && !normalizeSearchText(text).includes(phrase)) return null;
        return {
          ref,
          reference: ref,
          text,
          score: maximumSearchResults - index,
        };
      })
      .filter(Boolean);

    return jsonResponse({
      provider: "esv",
      version: "ESV",
      query: searchQuery,
      exact,
      totalResults: Number(payload.total_results) || results.length,
      totalPages: Number(payload.total_pages) || 1,
      results,
    }, 200, "no-store");
  }

  const ref = (url.searchParams.get("ref") || "").trim();
  if (!ref || ref.length > 80) {
    return jsonResponse(
      { error: "A valid passage reference is required" },
      400,
    );
  }

  const esvUrl = new URL("https://api.esv.org/v3/passage/text/");
  esvUrl.searchParams.set("q", ref);
  esvUrl.searchParams.set("include-passage-references", "false");
  esvUrl.searchParams.set("include-verse-numbers", "true");
  esvUrl.searchParams.set("include-first-verse-numbers", "true");
  esvUrl.searchParams.set("include-footnotes", "false");
  esvUrl.searchParams.set("include-footnote-body", "false");
  esvUrl.searchParams.set("include-headings", "true");
  esvUrl.searchParams.set("include-short-copyright", "false");
  esvUrl.searchParams.set("include-passage-horizontal-lines", "false");
  esvUrl.searchParams.set("include-heading-horizontal-lines", "true");
  esvUrl.searchParams.set("include-selahs", "true");
  esvUrl.searchParams.set("indent-paragraphs", "2");

  const esvResponse = await fetch(esvUrl, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });
  const payload = await esvResponse.json().catch(() => ({}));

  if (!esvResponse.ok) {
    return jsonResponse(
      { error: payload.detail || payload.error || "ESV API request failed" },
      esvResponse.status,
    );
  }

  const canonical = payload.canonical || ref;
  const verses = parseEsvVerses(
    Array.isArray(payload.passages) ? payload.passages : [],
    {
      normalizePsalm119: /^psalms?\s+119\b/i.test(canonical) ||
        /^psalms?\s+119\b/i.test(ref),
    },
  );
  return jsonResponse({
    version: "ESV",
    reference: ref,
    canonical,
    parserVersion,
    verses,
  });
});
