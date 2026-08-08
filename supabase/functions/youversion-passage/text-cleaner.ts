export function cleanQuotedProviderText(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .trim();
}

export function cleanPlainText(value: unknown) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s*¶+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractYouVersionPassageHtml(value: unknown) {
  return normalizedYouVersionText(
    youVersionHtmlCharacters(value, false).get(0) || [],
  );
}

export function extractYouVersionChapterHtml(value: unknown) {
  return [...youVersionHtmlCharacters(value, true).entries()]
    .map(([n, characters]) => ({ n, ...normalizedYouVersionText(characters) }))
    .filter((verse) => Number.isInteger(verse.n) && verse.n > 0 && verse.text)
    .sort((a, b) => a.n - b.n);
}

function youVersionHtmlCharacters(value: unknown, splitByVerse: boolean) {
  const html = String(value || "");
  const verses = new Map<
    number,
    Array<{ value: string; wordsOfJesus: boolean }>
  >();
  if (!splitByVerse) verses.set(0, []);
  let currentVerse = splitByVerse ? -1 : 0;
  const elements: Array<{
    name: string;
    skipped: boolean;
    wordsOfJesus: boolean;
  }> = [];
  let skippedDepth = 0;
  let wordsOfJesusDepth = 0;

  for (
    const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || []
  ) {
    if (!token.startsWith("<")) {
      if (skippedDepth || currentVerse < 0) continue;
      const characters = verses.get(currentVerse) || [];
      if (!verses.has(currentVerse)) verses.set(currentVerse, characters);
      for (const character of decodeHtmlEntities(token)) {
        characters.push({
          value: character,
          wordsOfJesus: wordsOfJesusDepth > 0,
        });
      }
      continue;
    }
    if (/^<!--|^<![^-]/.test(token)) continue;

    const closing = /^<\s*\//.test(token);
    const name = token.match(/^<\s*\/?\s*([a-z0-9:-]+)/i)?.[1]?.toLowerCase();
    if (!name) continue;

    if (closing) {
      const matchingIndex = elements.map((element) => element.name)
        .lastIndexOf(name);
      if (matchingIndex === -1) continue;
      while (elements.length > matchingIndex) {
        const element = elements.pop();
        if (element?.skipped) skippedDepth -= 1;
        if (element?.wordsOfJesus) wordsOfJesusDepth -= 1;
      }
      continue;
    }

    const classes = htmlClassTokens(token);
    if (splitByVerse && classes.includes("yv-v")) {
      const verseNumber = Number(htmlAttribute(token, "v"));
      currentVerse = Number.isInteger(verseNumber) && verseNumber > 0
        ? verseNumber
        : -1;
      if (currentVerse > 0 && !verses.has(currentVerse)) {
        verses.set(currentVerse, []);
      }
    }
    const skipped = classes.some((className) =>
      ["yv-vlbl", "yv-clbl", "yv-n", "yv-h"].includes(className)
    );
    const wordsOfJesus = classes.includes("wj");
    const selfClosing = /\/\s*>$/.test(token) ||
      ["br", "hr", "img", "input", "meta", "link"].includes(name);
    if (selfClosing) continue;
    elements.push({ name, skipped, wordsOfJesus });
    if (skipped) skippedDepth += 1;
    if (wordsOfJesus) wordsOfJesusDepth += 1;
  }

  return verses;
}

function normalizedYouVersionText(
  characters: Array<{ value: string; wordsOfJesus: boolean }>,
) {
  const normalized: Array<{ value: string; wordsOfJesus: boolean }> = [];
  for (const character of characters) {
    const whitespace = /\s/.test(character.value) || character.value === "¶";
    if (whitespace) {
      if (normalized.length && normalized.at(-1)?.value !== " ") {
        normalized.push({ value: " ", wordsOfJesus: character.wordsOfJesus });
      }
      continue;
    }
    normalized.push(character);
  }
  while (normalized.at(-1)?.value === " ") normalized.pop();

  const wordsOfJesus: Array<{ start: number; end: number }> = [];
  normalized.forEach((character, index) => {
    if (!character.wordsOfJesus) return;
    const previous = wordsOfJesus.at(-1);
    if (previous && previous.end === index) previous.end = index + 1;
    else wordsOfJesus.push({ start: index, end: index + 1 });
  });

  return {
    text: normalized.map((character) => character.value).join(""),
    ...(wordsOfJesus.length ? { wordsOfJesus } : {}),
  };
}

function htmlClassTokens(tag: string) {
  const value = tag.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return String(value?.[1] || value?.[2] || value?.[3] || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function htmlAttribute(tag: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = tag.match(
    new RegExp(
      `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );
  return String(value?.[1] || value?.[2] || value?.[3] || "");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_match, hex) => String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(
      /&#(\d+);/g,
      (_match, decimal) => String.fromCodePoint(parseInt(decimal, 10)),
    );
}
