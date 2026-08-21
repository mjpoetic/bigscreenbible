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
  const parsed = youVersionHtmlCharacters(value, false);
  return normalizedYouVersionText(
    parsed.verses.get(0) || [],
  );
}

export function extractYouVersionChapterHtml(value: unknown) {
  const parsed = youVersionHtmlCharacters(value, true);
  return [...parsed.verses.entries()]
    .map(([n, characters]) => ({
      n,
      ...normalizedYouVersionText(characters),
      paragraphStart: parsed.paragraphStarts.has(n),
      ...(parsed.sectionHeadings.has(n)
        ? { sectionHeadings: parsed.sectionHeadings.get(n) }
        : {}),
    }))
    .filter((verse) => Number.isInteger(verse.n) && verse.n > 0 && verse.text)
    .sort((a, b) => a.n - b.n);
}

function youVersionHtmlCharacters(value: unknown, splitByVerse: boolean) {
  const html = String(value || "");
  const verses = new Map<
    number,
    Array<{
      value: string;
      wordsOfJesus: boolean;
      lineBreakBefore?: boolean;
    }>
  >();
  const paragraphStarts = new Set<number>();
  const sectionHeadings = new Map<
    number,
    Array<{ text: string; level: number }>
  >();
  let pendingHeadings: Array<{ text: string; level: number }> = [];
  if (!splitByVerse) verses.set(0, []);
  let currentVerse = splitByVerse ? -1 : 0;
  const elements: Array<{
    name: string;
    skipped: boolean;
    wordsOfJesus: boolean;
    headingLevel: number;
    headingCharacters?: string[];
    scriptureBlock: boolean;
    paragraphBlock: boolean;
    boundaryApplied: boolean;
  }> = [];
  let skippedDepth = 0;
  let wordsOfJesusDepth = 0;
  let pendingExplicitLineBreak = false;

  const closeElement = (element: typeof elements[number] | undefined) => {
    if (!element) return;
    if (element.skipped) skippedDepth -= 1;
    if (element.wordsOfJesus) wordsOfJesusDepth -= 1;
    if (!element.headingCharacters) return;
    const text = cleanYouVersionHeadingText(element.headingCharacters.join(""));
    if (text) pendingHeadings.push({ text, level: element.headingLevel });
  };

  const attachPendingHeadings = () => {
    if (!splitByVerse || currentVerse < 1 || !pendingHeadings.length) return;
    const existing = sectionHeadings.get(currentVerse) || [];
    pendingHeadings.forEach((heading) => {
      if (
        !existing.some((item) =>
          item.text === heading.text && item.level === heading.level
        )
      ) existing.push(heading);
    });
    sectionHeadings.set(currentVerse, existing);
    pendingHeadings = [];
  };

  for (
    const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || []
  ) {
    if (!token.startsWith("<")) {
      const decoded = decodeHtmlEntities(token);
      const headingElement = elements.findLast((element) =>
        Boolean(element.headingCharacters)
      );
      if (headingElement?.headingCharacters) {
        headingElement.headingCharacters.push(decoded);
        continue;
      }
      if (skippedDepth || currentVerse < 0) continue;
      const characters = verses.get(currentVerse) || [];
      if (!verses.has(currentVerse)) verses.set(currentVerse, characters);
      const firstVisibleIndex = decoded.search(/[^\s¶]/u);
      const block = elements.findLast((element) => element.scriptureBlock);
      const beginsBlock = firstVisibleIndex >= 0 && block &&
        !block.boundaryApplied;
      if (beginsBlock) {
        block.boundaryApplied = true;
        if (block.paragraphBlock) paragraphStarts.add(currentVerse);
        attachPendingHeadings();
      } else if (firstVisibleIndex >= 0) attachPendingHeadings();
      const lineBreakBefore = Boolean(
        (beginsBlock || pendingExplicitLineBreak) &&
          characters.some((character) => /[^\s¶]/u.test(character.value)),
      );
      if (firstVisibleIndex >= 0) pendingExplicitLineBreak = false;
      for (const [index, character] of [...decoded].entries()) {
        characters.push({
          value: character,
          wordsOfJesus: wordsOfJesusDepth > 0,
          ...(lineBreakBefore && index === firstVisibleIndex
            ? { lineBreakBefore: true }
            : {}),
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
        closeElement(elements.pop());
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
    const headingLevel = youVersionHeadingLevel(classes);
    const heading = headingLevel > 0;
    const skipped = heading ||
      classes.some((className) =>
        ["yv-vlbl", "yv-clbl", "yv-n"].includes(className)
      );
    const wordsOfJesus = classes.includes("wj");
    const scriptureBlock = isYouVersionScriptureBlock(name, classes);
    const paragraphBlock = isYouVersionParagraphBlock(classes);
    const selfClosing = /\/\s*>$/.test(token) ||
      ["br", "hr", "img", "input", "meta", "link"].includes(name);
    if (name === "br" && currentVerse >= 0) pendingExplicitLineBreak = true;
    if (selfClosing) continue;
    elements.push({
      name,
      skipped,
      wordsOfJesus,
      headingLevel,
      ...(heading ? { headingCharacters: [] } : {}),
      scriptureBlock,
      paragraphBlock,
      boundaryApplied: false,
    });
    if (skipped) skippedDepth += 1;
    if (wordsOfJesus) wordsOfJesusDepth += 1;
  }

  while (elements.length) closeElement(elements.pop());
  return { verses, paragraphStarts, sectionHeadings };
}

function normalizedYouVersionText(
  characters: Array<{
    value: string;
    wordsOfJesus: boolean;
    lineBreakBefore?: boolean;
  }>,
) {
  const normalized: Array<{ value: string; wordsOfJesus: boolean }> = [];
  const lineBreaks: number[] = [];
  for (const character of characters) {
    const whitespace = /\s/.test(character.value) || character.value === "¶";
    if (whitespace) {
      if (normalized.length && normalized.at(-1)?.value !== " ") {
        normalized.push({ value: " ", wordsOfJesus: character.wordsOfJesus });
      }
      continue;
    }
    if (character.lineBreakBefore && normalized.length) {
      if (normalized.at(-1)?.value !== " ") {
        normalized.push({ value: " ", wordsOfJesus: false });
      }
      if (lineBreaks.at(-1) !== normalized.length) {
        lineBreaks.push(normalized.length);
      }
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
    ...(lineBreaks.length
      ? {
        lineBreaks: lineBreaks.filter((offset) => offset < normalized.length),
      }
      : {}),
    ...(wordsOfJesus.length ? { wordsOfJesus } : {}),
  };
}

function cleanYouVersionHeadingText(value: string) {
  return String(value || "")
    .replace(/\bL\s+ord(?=[A-Z])/g, "Lord ")
    .replace(/\bL\s+ord\b/g, "Lord")
    .replace(/\s+/g, " ")
    .trim();
}

function youVersionHeadingLevel(classes: string[]) {
  if (
    !classes.includes("yv-h") &&
    !classes.some((className) =>
      /^(?:s\d?|ms\d?|mr|r|d|sp|qa|qd)$/i.test(className)
    )
  ) return 0;
  const numbered = classes
    .map((className) => Number(className.match(/^(?:s|ms)(\d+)$/i)?.[1]))
    .find((level) => Number.isFinite(level) && level > 0);
  return Math.max(1, Math.min(4, numbered || 1));
}

function isYouVersionScriptureBlock(name: string, classes: string[]) {
  if (!["div", "p", "li", "td"].includes(name)) return false;
  return classes.some((className) =>
    /^(?:p|m|mi|nb|pc|pr|pm|pmc|pmo|pmr|pi\d*|q\d*|qm\d*|qr|qc|b)$/i
      .test(className)
  );
}

function isYouVersionParagraphBlock(classes: string[]) {
  return classes.some((className) =>
    /^(?:p|m|mi|nb|pc|pr|pm|pmc|pmo|pmr|pi\d*)$/i.test(className)
  );
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
