export type VerseOfTheDayItem = {
  reference: string;
  verseText: string;
  sourceUrl: string;
  publishedAt: string;
};

function decodeEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
    nbsp: " ",
    mdash: "—",
    ndash: "–",
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function tagValue(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return decodeEntities((match?.[1] || "").replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")).trim();
}

function plainText(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function sourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.hostname !== "verseoftheday.com" && url.hostname !== "www.verseoftheday.com") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function parseItem(itemXml: string): VerseOfTheDayItem | null {
  const title = tagValue(itemXml, "title");
  const reference = title.match(/^Verse of the Day\s*[-–—]\s*(.+)$/i)?.[1]?.trim() || "";
  const link = sourceUrl(tagValue(itemXml, "link"));
  const publishedDate = new Date(tagValue(itemXml, "pubDate"));
  const description = tagValue(itemXml, "description");
  const verseParagraph = description.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i)?.[1] || "";
  const verseText = plainText(verseParagraph);

  if (!reference || !verseText || !link || Number.isNaN(publishedDate.getTime())) return null;
  return {
    reference,
    verseText,
    sourceUrl: link,
    publishedAt: publishedDate.toISOString(),
  };
}

export function parseNewestVerseItem(xml: string) {
  const items = [...String(xml || "").matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((match) => parseItem(match[1]))
    .filter((item): item is VerseOfTheDayItem => Boolean(item))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  if (!items.length) throw new Error("The RSS feed did not contain a usable verse item");
  return items[0];
}
