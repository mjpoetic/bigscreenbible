import { parseVerseContent } from "./content-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const apiBibleBaseUrl = "https://rest.api.bible";
const authorizedBibleCacheTtlMs = 24 * 60 * 60 * 1000;
const maximumPassageVerses = 200;
const parserVersion = "2026-06-24-psalm119-shared-normalized";

type ApiBibleTranslationCode = "NIV" | "NLT" | "NASB2020";

type ApiBibleSummary = {
  id: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
  nameLocal?: string;
  copyright?: string;
};

type AuthorizedBible = {
  code: ApiBibleTranslationCode;
  id: string;
  abbreviation: string;
  name: string;
  copyright: string;
};

let authorizedBibleCache:
  | { expiresAt: number; bibles: Map<ApiBibleTranslationCode, AuthorizedBible> }
  | null = null;

const apiBookIds: Record<string, string> = {
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

function matchesTranslation(
  bible: ApiBibleSummary,
  code: ApiBibleTranslationCode,
) {
  const abbreviation = normalizedLabel(
    bible.abbreviationLocal || bible.abbreviation,
  );
  const name = normalizedLabel(bible.nameLocal || bible.name);
  if (code === "NIV") {
    return abbreviation === "NIV" || name.includes("NEWINTERNATIONALVERSION");
  }
  if (code === "NLT") {
    return abbreviation === "NLT" || name.includes("NEWLIVINGTRANSLATION");
  }
  return (
    ["NASB2020", "NASB20", "NASB"].includes(abbreviation) ||
    name.includes("NEWAMERICANSTANDARDBIBLE2020") ||
    (name.includes("NEWAMERICANSTANDARDBIBLE") && name.includes("2020")) ||
    name === "NEWAMERICANSTANDARDBIBLENASB"
  );
}

async function apiBibleRequest(path: string, apiKey: string) {
  const response = await fetch(`${apiBibleBaseUrl}${path}`, {
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error ||
      "API.Bible request failed";
    throw new Error(`${response.status}: ${message}`);
  }
  return payload;
}

async function authorizedBibles(apiKey: string) {
  if (authorizedBibleCache && authorizedBibleCache.expiresAt > Date.now()) {
    return authorizedBibleCache.bibles;
  }

  const payload = await apiBibleRequest(
    "/v1/bibles?language=eng&include-full-details=true",
    apiKey,
  );
  const available = Array.isArray(payload?.data)
    ? payload.data as ApiBibleSummary[]
    : [];
  const bibles = new Map<ApiBibleTranslationCode, AuthorizedBible>();

  (["NIV", "NLT", "NASB2020"] as ApiBibleTranslationCode[]).forEach((code) => {
    const bible = available.find((candidate) =>
      matchesTranslation(candidate, code)
    );
    if (!bible?.id) return;
    bibles.set(code, {
      code,
      id: bible.id,
      abbreviation: bible.abbreviationLocal || bible.abbreviation || code,
      name: bible.nameLocal || bible.name || code,
      copyright: bible.copyright || "",
    });
  });

  authorizedBibleCache = {
    expiresAt: Date.now() + authorizedBibleCacheTtlMs,
    bibles,
  };
  return bibles;
}

function chapterIdFromReference(reference: string) {
  const match = reference.match(/^(.+?)\s+(\d{1,3})$/);
  if (!match) return "";
  const bookId = apiBookIds[match[1]];
  const chapter = Number(match[2]);
  if (!bookId || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return "";
  }
  return `${bookId}.${chapter}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("API_BIBLE_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "API_BIBLE_KEY is not configured" }, 500);
  }

  try {
    const url = new URL(request.url);
    const availableBibles = await authorizedBibles(apiKey);

    if (url.searchParams.get("action") === "bibles") {
      return jsonResponse(
        {
          translations: [...availableBibles.values()],
          missing: (["NIV", "NLT", "NASB2020"] as ApiBibleTranslationCode[])
            .filter((code) => !availableBibles.has(code)),
        },
        200,
        "private, max-age=3600",
      );
    }

    const version = normalizedLabel(
      url.searchParams.get("version"),
    ) as ApiBibleTranslationCode;
    if (!["NIV", "NLT", "NASB2020"].includes(version)) {
      return jsonResponse({
        error: "A supported API.Bible version is required",
      }, 400);
    }

    const bible = availableBibles.get(version);
    if (!bible) {
      return jsonResponse(
        { error: `${version} is not authorized for this API.Bible account` },
        403,
      );
    }

    const reference = (url.searchParams.get("ref") || "").trim();
    const chapterId = chapterIdFromReference(reference);
    if (!chapterId) {
      return jsonResponse(
        { error: "A valid chapter reference is required" },
        400,
      );
    }

    const query = new URLSearchParams({
      "content-type": "json",
      "include-notes": "false",
      "include-titles": "true",
      "include-chapter-numbers": "false",
      "include-verse-numbers": "true",
      "include-verse-spans": "false",
    });
    const payload = await apiBibleRequest(
      `/v1/bibles/${encodeURIComponent(bible.id)}/chapters/${
        encodeURIComponent(chapterId)
      }?${query}`,
      apiKey,
    );
    const passage = payload?.data || {};
    const verseCount = Number(passage.verseCount) || 0;
    if (verseCount > maximumPassageVerses) {
      return jsonResponse(
        {
          error: `API.Bible returned more than ${maximumPassageVerses} verses`,
        },
        422,
      );
    }

    const verses = parseVerseContent(
      Array.isArray(passage.content) ? passage.content : [],
    );
    if (!verses.length) {
      return jsonResponse({ error: `${version} returned no verse text` }, 502);
    }

    return jsonResponse({
      provider: "api-bible",
      version,
      parserVersion,
      bibleId: bible.id,
      bibleName: bible.name,
      abbreviation: bible.abbreviation,
      reference: passage.reference || reference,
      passageId: passage.id || chapterId,
      verseCount: verseCount || verses.length,
      copyright: passage.copyright || bible.copyright,
      fumsToken: payload?.meta?.fumsToken || "",
      fetchedAt: new Date().toISOString(),
      verses,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "API.Bible request failed";
    const statusMatch = message.match(/^(\d{3}):/);
    return jsonResponse(
      { error: message.replace(/^\d{3}:\s*/, "") },
      statusMatch ? Number(statusMatch[1]) : 502,
    );
  }
});
