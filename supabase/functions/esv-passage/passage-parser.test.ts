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
