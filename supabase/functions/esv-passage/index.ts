import { normalizePsalm119AcrosticVerses } from "../_shared/psalm119-acrostic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const parserVersion = "2026-06-24-psalm119-shared-normalized";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=3600" : "no-store",
    },
  });
}

function cleanVerseText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function headingLevelForLine(line: string) {
  return line.length > 52 ? 2 : 1;
}

function extractEsvHeadings(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-=_—–\s]+$/.test(line))
    .map((line) => ({
      text: cleanVerseText(line),
      level: headingLevelForLine(line),
    }));
}

function parseEsvVerses(
  passages: string[],
  options: { normalizePsalm119?: boolean } = {},
) {
  const body = passages.join("\n").replace(/\u00a0/g, " ");
  const verses: Array<{
    n: number;
    text: string;
    paragraphStart: boolean;
    sectionHeadings?: Array<{ text: string; level: number }>;
  }> = [];
  const markerPattern = /\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|$)/g;
  let match: RegExpExecArray | null;
  let previousEnd = 0;

  while ((match = markerPattern.exec(body))) {
    const n = Number(match[1]);
    const text = cleanVerseText(match[2]);
    const leadingText = body.slice(previousEnd, match.index);
    const sectionHeadings = extractEsvHeadings(leadingText);
    const paragraphStart = verses.length === 0 ||
      /\n\s*\n/.test(leadingText) ||
      /(?:^|\n)[ \t]{2,}$/.test(leadingText);
    if (Number.isFinite(n) && text) {
      verses.push({
        n,
        text,
        paragraphStart,
        ...(sectionHeadings.length ? { sectionHeadings } : {}),
      });
    }
    previousEnd = markerPattern.lastIndex;
  }

  if (verses.length) {
    return options.normalizePsalm119
      ? normalizePsalm119AcrosticVerses(verses)
      : verses;
  }

  const fallbackText = cleanVerseText(body);
  return fallbackText
    ? [{ n: 1, text: fallbackText, paragraphStart: true }]
    : [];
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
  esvUrl.searchParams.set("include-heading-horizontal-lines", "false");
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
