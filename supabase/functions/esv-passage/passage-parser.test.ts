import { parseEsvVerses } from "./passage-parser.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("extracts ESV notes without leaking callers, bodies, or footer headings into Scripture", () => {
  const plain = "The Word\n\n  [4] In him was life. [5] The light shines in the darkness, and the darkness has not overcome it. [6] There was a man sent from God.";
  const withNotes = "The Word\n\n  [4] In him was life. [5] The light shines in the darkness, and the darkness has not overcome(1) it.(2) [6] There was a man sent from God.\n\nFootnotes\n\n(1) 1:5 Or understood\n(2) 1:5 A second note\n  with a wrapped line.";
  const verses = parseEsvVerses([withNotes]);
  assertEquals(verses.map(({ footnotes: _notes, ...verse }) => verse), parseEsvVerses([plain]));
  assertEquals(verses[1].footnotes, [
    { id: "1", reference: "1:5", text: "Or understood" },
    { id: "2", reference: "1:5", text: "A second note with a wrapped line." },
  ]);
  assertEquals(verses[2].footnotes, undefined);
});

Deno.test("keeps ESV footnote numbering separate across passage responses", () => {
  assertEquals(parseEsvVerses([
    "[5] First(1).\nFootnotes\n(1) 1:5 First *note*.",
    "[8] Second(1).\nFootnotes\n(1) 3:8 Second note.",
  ]).map(verse => verse.footnotes?.[0].text), ["First note.", "Second note."]);
});

Deno.test("attaches an ESV section heading to the following verse", () => {
  const passages = [
    "  [13] Therefore I will hurl you out of this land, for I will show you no favor.’\n\n" +
    "_______________________________________________________\n" +
    "The LORD Will Restore Israel\n\n" +
    "  [14] “Therefore, behold, the days are coming, declares the LORD.",
  ];

  assertEquals(parseEsvVerses(passages), [
    {
      n: 13,
      text:
        "Therefore I will hurl you out of this land, for I will show you no favor.’",
      paragraphStart: true,
    },
    {
      n: 14,
      text: "“Therefore, behold, the days are coming, declares the LORD.",
      paragraphStart: true,
      sectionHeadings: [{ text: "The LORD Will Restore Israel", level: 1 }],
    },
  ]);
});

Deno.test("preserves a heading before the first verse", () => {
  const passages = [
    "_______________________________________________________\n" +
    "Famine, Sword, and Death\n\n" +
    "  [1] The word of the LORD came to me:",
  ];

  assertEquals(parseEsvVerses(passages), [{
    n: 1,
    text: "The word of the LORD came to me:",
    paragraphStart: true,
    sectionHeadings: [{ text: "Famine, Sword, and Death", level: 1 }],
  }]);
});
