import {
  cleanPlainText,
  cleanQuotedProviderText,
  extractYouVersionChapterHtml,
} from "./text-cleaner.ts";
import {
  fallbackYouVersionTranslationNames,
  matchesYouVersionTranslation,
  supportedYouVersionTranslations,
  type YouVersionBibleSummary,
  type YouVersionTranslationCode,
} from "./translations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const youVersionBaseUrl = "https://api.youversion.com";
const authorizedBibleCacheTtlMs = 24 * 60 * 60 * 1000;
const maximumPassageVerses = 200;
const maximumSearchQueryLength = 120;
const maximumSearchResults = 20;
const parserVersion = "2026-08-21-youversion-structure";

type AuthorizedBible = {
  code: YouVersionTranslationCode;
  id: number;
  abbreviation: string;
  name: string;
  copyright: string;
  info: string;
  publisherUrl: string;
  deepLink: string;
};

type ChapterReference = {
  book: string;
  bookId: string;
  chapter: number;
  chapterId: string;
};

type PassageVerse = {
  n: number;
  text: string;
  paragraphStart: boolean;
  sectionHeadings?: Array<{ text: string; level: number }>;
  lineBreaks?: number[];
  wordsOfJesus?: Array<{ start: number; end: number }>;
};

let authorizedBibleCache:
  | {
    expiresAt: number;
    bibles: Map<YouVersionTranslationCode, AuthorizedBible>;
  }
  | null = null;

let youVersionBlockedUntil = 0;
let youVersionRateLimitReset = "";

class YouVersionRequestError extends Error {
  status: number;
  retryAfterSeconds: number;
  rateLimitReset: string;

  constructor(
    status: number,
    message: string,
    retryAfterSeconds = 0,
    rateLimitReset = "",
  ) {
    super(message);
    this.name = "YouVersionRequestError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.rateLimitReset = rateLimitReset;
  }
}

const youVersionBookIds: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalm: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Songs": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
};

function jsonResponse(
  body: unknown,
  status = 200,
  cacheControl = "no-store",
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      ...extraHeaders,
    },
  });
}

function retryAfterSecondsFromHeaders(headers: Headers, now = Date.now()) {
  const retryAfter = String(headers.get("Retry-After") || "").trim();
  if (/^\d+$/.test(retryAfter)) return Math.max(1, Number(retryAfter));
  const retryAt = Date.parse(retryAfter);
  if (Number.isFinite(retryAt)) {
    return Math.max(1, Math.ceil((retryAt - now) / 1000));
  }

  const reset = String(headers.get("X-RateLimit-Reset") || "").trim();
  if (/^\d+$/.test(reset)) {
    const resetNumber = Number(reset);
    const resetAt = resetNumber > 1_000_000_000
      ? resetNumber * 1000
      : now + resetNumber * 1000;
    return Math.max(1, Math.ceil((resetAt - now) / 1000));
  }
  return 0;
}

async function youVersionRequest(path: string, appKey: string) {
  if (youVersionBlockedUntil > Date.now()) {
    throw new YouVersionRequestError(
      429,
      "YouVersion is temporarily rate-limited",
      Math.max(1, Math.ceil((youVersionBlockedUntil - Date.now()) / 1000)),
      youVersionRateLimitReset,
    );
  }

  const response = await fetch(`${youVersionBaseUrl}${path}`, {
    headers: {
      "X-YVP-App-Key": appKey,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error ||
      "YouVersion request failed";
    const retryAfterSeconds = retryAfterSecondsFromHeaders(response.headers);
    const rateLimitReset = String(
      response.headers.get("X-RateLimit-Reset") || "",
    ).trim();
    if (response.status === 429) {
      // Keep older clients from turning one upstream 429 into a retry storm.
      youVersionBlockedUntil = Date.now() +
        Math.max(60, retryAfterSeconds || 300) * 1000;
      youVersionRateLimitReset = rateLimitReset;
    }
    throw new YouVersionRequestError(
      response.status,
      `${response.status}: ${message}`,
      retryAfterSeconds,
      rateLimitReset,
    );
  }
  return payload;
}

async function allEnglishBibles(appKey: string) {
  const bibles: YouVersionBibleSummary[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      page_size: "99",
    });
    params.append("language_ranges[]", "en");
    if (pageToken) params.set("page_token", pageToken);
    const payload = await youVersionRequest(`/v1/bibles?${params}`, appKey);
    if (Array.isArray(payload?.data)) bibles.push(...payload.data);
    pageToken = String(payload?.next_page_token || "");
  } while (pageToken);
  return bibles;
}

async function authorizedBibles(appKey: string) {
  if (authorizedBibleCache && authorizedBibleCache.expiresAt > Date.now()) {
    return authorizedBibleCache.bibles;
  }

  const available = await allEnglishBibles(appKey);
  const bibles = new Map<YouVersionTranslationCode, AuthorizedBible>();

  for (const code of supportedYouVersionTranslations) {
    const bible = available.find((candidate) =>
      matchesYouVersionTranslation(candidate, code)
    );
    const id = Number(bible?.id);
    if (!Number.isInteger(id)) continue;
    const details = await youVersionRequest(
      `/v1/bibles/${encodeURIComponent(String(id))}`,
      appKey,
    ) as YouVersionBibleSummary;
    const metadata = { ...bible, ...details };
    bibles.set(code, {
      code,
      id,
      abbreviation: metadata.localized_abbreviation || metadata.abbreviation ||
        code,
      name: metadata.title || metadata.localized_title ||
        fallbackYouVersionTranslationNames[code],
      copyright: cleanQuotedProviderText(metadata.copyright),
      info: cleanQuotedProviderText(metadata.info),
      publisherUrl: String(metadata.publisher_url || "").trim(),
      deepLink: String(metadata.youversion_deep_link || "").trim(),
    });
  }

  authorizedBibleCache = {
    expiresAt: Date.now() + authorizedBibleCacheTtlMs,
    bibles,
  };
  return bibles;
}

function chapterReferenceFromReference(
  reference: string,
): ChapterReference | null {
  const match = reference.match(/^(.+?)\s+(\d{1,3})$/);
  if (!match) return null;
  const book = match[1];
  const bookId = youVersionBookIds[book];
  const chapter = Number(match[2]);
  if (!bookId || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return null;
  }
  return {
    book,
    bookId,
    chapter,
    chapterId: `${bookId}.${chapter}`,
  };
}

async function chapterPassageHtml(
  bible: AuthorizedBible,
  chapter: ChapterReference,
  appKey: string,
) {
  const query = new URLSearchParams({
    format: "html",
    include_headings: "true",
    include_notes: "false",
  });
  const payload = await youVersionRequest(
    `/v1/bibles/${encodeURIComponent(String(bible.id))}/passages/${
      encodeURIComponent(chapter.chapterId)
    }?${query}`,
    appKey,
  );
  return String(payload?.content || "");
}

function cleanSectionHeading(value: string) {
  const heading = normalizeYouVersionHeadingText(cleanPlainText(value))
    .trim();
  if (!heading) return "";
  if (/^\d+$/.test(heading)) return "";
  if (heading.length > 240) return "";
  return heading;
}

function normalizeYouVersionHeadingText(value: string) {
  return String(value || "")
    .replace(/\bL\s+ord(?=[A-Z])/g, "Lord ")
    .replace(/\bL\s+ord\b/g, "Lord")
    .replace(/\s+/g, " ")
    .trim();
}

async function chapterVerses(
  bible: AuthorizedBible,
  chapter: ChapterReference,
  appKey: string,
) {
  const passageHtml = await chapterPassageHtml(bible, chapter, appKey);
  const verses: PassageVerse[] = extractYouVersionChapterHtml(passageHtml)
    .map((verse) => ({
      ...verse,
      paragraphStart: verse.n === 1 || verse.paragraphStart,
    }));
  if (!verses.length) {
    throw new Error(`${bible.abbreviation} returned no verse text`);
  }
  if (verses.length > maximumPassageVerses) {
    throw new Error(
      `YouVersion returned more than ${maximumPassageVerses} verses`,
    );
  }
  return dedupeRepeatedSectionHeadings(verses);
}

function dedupeRepeatedSectionHeadings<
  T extends { sectionHeadings?: Array<{ text?: string; level?: number }> },
>(verses: T[]) {
  const seen = new Set<string>();
  verses.forEach((verse) => {
    if (!Array.isArray(verse.sectionHeadings)) return;
    verse.sectionHeadings = verse.sectionHeadings.filter((heading) => {
      const text = cleanSectionHeading(String(heading?.text || ""));
      const level = Math.max(1, Math.min(4, Number(heading?.level) || 1));
      if (!text) return false;
      const key = `${level}:${text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      heading.text = text;
      heading.level = level;
      return true;
    });
    if (!verse.sectionHeadings.length) delete verse.sectionHeadings;
  });
  return verses;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const appKey = Deno.env.get("YOUVERSION_APP_KEY");
  if (!appKey) {
    return jsonResponse({ error: "YOUVERSION_APP_KEY is not configured" }, 500);
  }

  try {
    const url = new URL(request.url);
    const availableBibles = await authorizedBibles(appKey);

    if (url.searchParams.get("action") === "bibles") {
      return jsonResponse(
        {
          translations: [...availableBibles.values()],
          missing: supportedYouVersionTranslations
            .filter((code) => !availableBibles.has(code)),
        },
        200,
        "private, max-age=3600",
      );
    }

    const version = String(url.searchParams.get("version") || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") as YouVersionTranslationCode;
    if (!supportedYouVersionTranslations.includes(version)) {
      return jsonResponse({
        error: "A supported YouVersion version is required",
      }, 400);
    }

    const bible = availableBibles.get(version);
    if (!bible) {
      return jsonResponse(
        { error: `${version} is not authorized for this YouVersion app key` },
        403,
      );
    }

    if (url.searchParams.get("action") === "search") {
      const searchQuery = (url.searchParams.get("query") || "").trim()
        .replace(/\s+/g, " ");
      if (!searchQuery || searchQuery.length > maximumSearchQueryLength) {
        return jsonResponse({ error: "A valid search query is required" }, 400);
      }
      return jsonResponse({
        provider: "youversion",
        version,
        query: searchQuery,
        exact: url.searchParams.get("exact") === "true",
        bibleId: bible.id,
        bibleName: bible.name,
        abbreviation: bible.abbreviation,
        copyright: bible.copyright,
        results: [] as unknown[],
        resultLimit: maximumSearchResults,
        searchSupported: false,
      });
    }

    const reference = (url.searchParams.get("ref") || "").trim();
    const chapter = chapterReferenceFromReference(reference);
    if (!chapter) {
      return jsonResponse(
        { error: "A valid chapter reference is required" },
        400,
      );
    }

    const verses = await chapterVerses(bible, chapter, appKey);
    if (!verses.length) {
      return jsonResponse({ error: `${version} returned no verse text` }, 502);
    }

    return jsonResponse({
      provider: "youversion",
      version,
      parserVersion,
      bibleId: bible.id,
      bibleName: bible.name,
      abbreviation: bible.abbreviation,
      reference: `${chapter.book} ${chapter.chapter}`,
      passageId: chapter.chapterId,
      verseCount: verses.length,
      copyright: bible.copyright,
      info: bible.info,
      publisherUrl: bible.publisherUrl,
      deepLink: bible.deepLink,
      verses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    if (error instanceof YouVersionRequestError && error.status === 429) {
      const retryAfter = Math.max(1, error.retryAfterSeconds || 300);
      return jsonResponse(
        {
          error: "YouVersion is temporarily rate-limited",
          retryAfter,
          rateLimitReset: error.rateLimitReset || undefined,
        },
        429,
        "no-store",
        {
          "Retry-After": String(retryAfter),
          ...(error.rateLimitReset
            ? { "X-RateLimit-Reset": error.rateLimitReset }
            : {}),
        },
      );
    }
    return jsonResponse({ error: message || "YouVersion request failed" }, 502);
  }
});
