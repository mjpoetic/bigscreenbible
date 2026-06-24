import { normalizePsalm119AcrosticVerses } from "./psalm119-acrostic.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("normalizes ESV-shaped Psalm 119 acrostic headings", () => {
  const verses = normalizePsalm119AcrosticVerses([
    {
      n: 1,
      text:
        "Blessed are those whose way is blameless, who walk in the law of the LORD!",
      paragraphStart: true,
      sectionHeadings: [
        { text: "Your Word Is a Lamp to My Feet", level: 1 },
        { text: "Aleph", level: 1 },
      ],
    },
    {
      n: 8,
      text: "I will keep your statutes; do not utterly forsake me! Beth",
      paragraphStart: false,
    },
    {
      n: 9,
      text: "How can a young man keep his way pure?",
      paragraphStart: false,
    },
  ]);

  assertEquals(verses, [
    {
      n: 1,
      text:
        "Blessed are those whose way is blameless, who walk in the law of the LORD!",
      paragraphStart: true,
      sectionHeadings: [
        { text: "Your Word Is a Lamp to My Feet", level: 1 },
        { text: "Aleph", level: 1 },
      ],
    },
    {
      n: 8,
      text: "I will keep your statutes; do not utterly forsake me!",
      paragraphStart: false,
    },
    {
      n: 9,
      text: "How can a young man keep his way pure?",
      paragraphStart: true,
      sectionHeadings: [{ text: "Beth", level: 1 }],
    },
  ]);
});

Deno.test("removes duplicate Psalm 119 heading supplied by providers", () => {
  const verses = normalizePsalm119AcrosticVerses([
    {
      n: 1,
      text: "Aleph Blessed are those whose ways are blameless.",
      paragraphStart: true,
      sectionHeadings: [{ text: "Psalm 119", level: 1 }],
    },
  ]);

  assertEquals(verses, [{
    n: 1,
    text: "Blessed are those whose ways are blameless.",
    paragraphStart: true,
    sectionHeadings: [{ text: "Aleph", level: 1 }],
  }]);
});
