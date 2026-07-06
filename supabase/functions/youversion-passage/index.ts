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
const verseFetchConcurrency = 8;
const parserVersion = "2026-07-06-youversion-amp-verse-fetch";

type YouVersionTranslationCode = "AMP";

type YouVersionBibleSummary = {
  id?: number | string;
  abbreviation?: string;
  localized_abbreviation?: string;
  title?: string;
  localized_title?: string;
  copyright?: string;
  info?: string;
  publisher_url?: string;
  youversion_deep_link?: string;
};

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

let authorizedBibleCache:
  | { expiresAt: number; bibles: Map<YouVersionTranslationCode, AuthorizedBible> }
  | null = null;

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

function normalizedLabel(value: unknown) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function cleanQuotedProviderText(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .trim();
}

function cleanPlainText(value: unknown) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_match, decimal) =>
      String.fromCodePoint(parseInt(decimal, 10))
    );
}

function matchesTranslation(
  bible: YouVersionBibleSummary,
  code: YouVersionTranslationCode,
) {
  const abbreviation = normalizedLabel(
    bible.localized_abbreviation || bible.abbreviation,
  );
  const title = normalizedLabel(bible.localized_title || bible.title);
  if (code === "AMP") {
    return (
      abbreviation === "AMP" ||
      (title.includes("AMPLIFIEDBIBLE") && !title.includes("CLASSIC"))
    );
  }
  return false;
}

async function youVersionRequest(path: string, appKey: string) {
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
    throw new Error(`${response.status}: ${message}`);
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

  for (const code of ["AMP"] as YouVersionTranslationCode[]) {
    const bible = available.find((candidate) =>
      matchesTranslation(candidate, code)
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
      name: metadata.title || metadata.localized_title || "Amplified Bible",
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

function chapterReferenceFromReference(reference: string): ChapterReference | null {
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

async function chapterVerseIds(
  bible: AuthorizedBible,
  chapter: ChapterReference,
  appKey: string,
) {
  const payload = await youVersionRequest(
    `/v1/bibles/${encodeURIComponent(String(bible.id))}/books/${
      encodeURIComponent(chapter.bookId)
    }/chapters/${encodeURIComponent(String(chapter.chapter))}`,
    appKey,
  );
  const verses = Array.isArray(payload?.verses) ? payload.verses : [];
  return verses
    .map((verse: { id?: unknown; passage_id?: unknown; title?: unknown }) => {
      const number = Number(verse.id || verse.title);
      const passageId = String(
        verse.passage_id || `${chapter.chapterId}.${number}`,
      ).trim();
      if (!Number.isInteger(number) || number < 1 || !passageId) return null;
      return { number, passageId };
    })
    .filter(Boolean) as Array<{ number: number; passageId: string }>;
}

async function passageText(
  bible: AuthorizedBible,
  passageId: string,
  appKey: string,
) {
  const query = new URLSearchParams({
    format: "text",
    include_headings: "false",
    include_notes: "false",
  });
  const payload = await youVersionRequest(
    `/v1/bibles/${encodeURIComponent(String(bible.id))}/passages/${
      encodeURIComponent(passageId)
    }?${query}`,
    appKey,
  );
  return {
    id: String(payload?.id || passageId),
    reference: String(payload?.reference || "").trim(),
    text: cleanPlainText(payload?.content),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: Array<PromiseSettledResult<R>> = [];
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        try {
          results[currentIndex] = {
            status: "fulfilled",
            value: await mapper(items[currentIndex]),
          };
        } catch (reason) {
          results[currentIndex] = { status: "rejected", reason };
        }
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function chapterVerses(
  bible: AuthorizedBible,
  chapter: ChapterReference,
  appKey: string,
) {
  const verseIds = await chapterVerseIds(bible, chapter, appKey);
  if (!verseIds.length) {
    throw new Error(`${bible.abbreviation} returned no verse index`);
  }
  if (verseIds.length > maximumPassageVerses) {
    throw new Error(
      `YouVersion returned more than ${maximumPassageVerses} verses`,
    );
  }

  const settled = await mapWithConcurrency(
    verseIds,
    verseFetchConcurrency,
    async (verse) => {
      const passage = await passageText(bible, verse.passageId, appKey);
      if (!passage.text) return null;
      return {
        n: verse.number,
        text: passage.text,
        paragraphStart: verse.number === 1,
      };
    },
  );

  const verses = settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  );
  verses.sort((a, b) => a.n - b.n);
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
          missing: (["AMP"] as YouVersionTranslationCode[])
            .filter((code) => !availableBibles.has(code)),
        },
        200,
        "private, max-age=3600",
      );
    }

    const version = normalizedLabel(
      url.searchParams.get("version"),
    ) as YouVersionTranslationCode;
    if (!["AMP"].includes(version)) {
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
    return jsonResponse({ error: message || "YouVersion request failed" }, 502);
  }
});
