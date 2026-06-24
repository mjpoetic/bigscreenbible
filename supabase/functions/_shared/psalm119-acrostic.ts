type SectionHeading = {
  text: string;
  level: number;
};

type Psalm119Verse = {
  n: number;
  text: string;
  paragraphStart: boolean;
  sectionHeadings?: SectionHeading[];
};

type Psalm119AcrosticStart = {
  verse: number;
  label: string;
  hebrew: string;
  variants: string[];
};

const psalm119AcrosticStarts: Psalm119AcrosticStart[] = [
  { verse: 1, label: "Aleph", hebrew: "א", variants: ["aleph"] },
  { verse: 9, label: "Beth", hebrew: "ב", variants: ["beth"] },
  { verse: 17, label: "Gimel", hebrew: "ג", variants: ["gimel"] },
  { verse: 25, label: "Daleth", hebrew: "ד", variants: ["daleth"] },
  { verse: 33, label: "He", hebrew: "ה", variants: ["he", "heh"] },
  { verse: 41, label: "Waw", hebrew: "ו", variants: ["waw", "vav"] },
  { verse: 49, label: "Zayin", hebrew: "ז", variants: ["zayin"] },
  { verse: 57, label: "Heth", hebrew: "ח", variants: ["heth", "cheth"] },
  { verse: 65, label: "Teth", hebrew: "ט", variants: ["teth"] },
  { verse: 73, label: "Yodh", hebrew: "י", variants: ["yodh", "yod"] },
  { verse: 81, label: "Kaph", hebrew: "כ", variants: ["kaph", "kaf"] },
  { verse: 89, label: "Lamedh", hebrew: "ל", variants: ["lamedh", "lamed"] },
  { verse: 97, label: "Mem", hebrew: "מ", variants: ["mem"] },
  { verse: 105, label: "Nun", hebrew: "נ", variants: ["nun"] },
  { verse: 113, label: "Samekh", hebrew: "ס", variants: ["samekh", "samech"] },
  { verse: 121, label: "Ayin", hebrew: "ע", variants: ["ayin"] },
  { verse: 129, label: "Pe", hebrew: "פ", variants: ["pe", "peh"] },
  {
    verse: 137,
    label: "Tsadhe",
    hebrew: "צ",
    variants: ["tsadhe", "tsadde", "tsaddi", "tsade", "tsadi", "tzaddi"],
  },
  { verse: 145, label: "Qoph", hebrew: "ק", variants: ["qoph", "qof"] },
  { verse: 153, label: "Resh", hebrew: "ר", variants: ["resh"] },
  {
    verse: 161,
    label: "Shin",
    hebrew: "ש",
    variants: ["shin", "sin and shin", "sin and"],
  },
  { verse: 169, label: "Taw", hebrew: "ת", variants: ["taw", "tav"] },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function acrosticVariantPattern(heading: Psalm119AcrosticStart) {
  return heading.variants
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length)
    .join("|");
}

function addPsalm119Heading(
  verse: Psalm119Verse,
  heading: Psalm119AcrosticStart,
) {
  const existing = verse.sectionHeadings || [];
  if (
    existing.some((item) => headingKey(item.text) === headingKey(heading.label))
  ) return;
  verse.sectionHeadings = existing.concat({ text: heading.label, level: 1 });
}

function stripLeadingPsalm119Marker(
  text: string,
  heading: Psalm119AcrosticStart,
) {
  const variantPattern = acrosticVariantPattern(heading);
  const hebrew = escapeRegExp(heading.hebrew);
  const pattern = new RegExp(
    `^\\s*¶*\\s*(?:(?:${hebrew})\\s*(?:${variantPattern})?|(?:${variantPattern}))(?:\\s*[.:;,-])?\\s+`,
    "iu",
  );
  return text.replace(/^(\s*¶+\s*)/u, "").replace(pattern, "");
}

function stripTrailingPsalm119Marker(
  text: string,
  heading: Psalm119AcrosticStart,
) {
  const variantPattern = acrosticVariantPattern(heading);
  const hebrew = escapeRegExp(heading.hebrew);
  const pattern = new RegExp(
    `(?:\\s+)(?:(?:${hebrew})\\s*(?:${variantPattern})?|(?:${variantPattern})|(?:${hebrew}))\\s*$`,
    "iu",
  );
  return text.replace(pattern, "").trimEnd();
}

function removeDuplicatePsalm119Heading(verse: Psalm119Verse) {
  const sectionHeadings = (verse.sectionHeadings || []).filter((heading) =>
    headingKey(heading.text) !== "psalm119"
  );
  if (sectionHeadings.length) verse.sectionHeadings = sectionHeadings;
  else delete verse.sectionHeadings;
}

export function normalizePsalm119AcrosticVerses<T extends Psalm119Verse>(
  verses: T[],
) {
  const byNumber = new Map(verses.map((verse) => [verse.n, verse]));

  verses.forEach(removeDuplicatePsalm119Heading);

  psalm119AcrosticStarts.forEach((heading) => {
    const startVerse = byNumber.get(heading.verse);
    const previousVerse = byNumber.get(heading.verse - 1);

    if (previousVerse) {
      const stripped = stripTrailingPsalm119Marker(previousVerse.text, heading);
      if (stripped !== previousVerse.text) previousVerse.text = stripped;
    }

    if (startVerse) {
      startVerse.text = stripLeadingPsalm119Marker(startVerse.text, heading)
        .trim();
      startVerse.paragraphStart = true;
      addPsalm119Heading(startVerse, heading);
    }
  });

  return verses.filter(({ text }) => text.length > 0);
}
