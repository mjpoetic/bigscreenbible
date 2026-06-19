import {
  type ApiBibleContentNode,
  parseVerseContent,
} from "./content-parser.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("joins API.Bible formatting fragments with readable spacing", () => {
  const content: ApiBibleContentNode[] = [{
    name: "para",
    type: "tag",
    items: [
      { name: "verse", type: "tag", attrs: { number: "1" } },
      {
        type: "text",
        text: "O Lord, I will honor and praise your name,",
        attrs: { verseId: "ISA.25.1" },
      },
      {
        name: "char",
        type: "tag",
        items: [{
          type: "text",
          text: "for you are my God.",
          attrs: { verseId: "ISA.25.1" },
        }],
      },
      {
        type: "text",
        text: "You do such wonderful things!",
        attrs: { verseId: "ISA.25.1" },
      },
      {
        name: "char",
        type: "tag",
        items: [{
          type: "text",
          text: "You planned them long ago,",
          attrs: { verseId: "ISA.25.1" },
        }],
      },
      {
        type: "text",
        text: "and now you have accomplished them.",
        attrs: { verseId: "ISA.25.1" },
      },
    ],
  }];

  assertEquals(parseVerseContent(content), [{
    n: 1,
    text:
      "O Lord, I will honor and praise your name, for you are my God. You do such wonderful things! You planned them long ago, and now you have accomplished them.",
    paragraphStart: true,
  }]);
});

Deno.test("repairs word boundaries while preserving attached punctuation", () => {
  const content: ApiBibleContentNode[] = [{
    name: "para",
    type: "tag",
    items: [
      { name: "verse", type: "tag", attrs: { number: "8" } },
      { type: "text", text: "mockery", attrs: { verseId: "ISA.25.8" } },
      {
        type: "text",
        text: "against his land",
        attrs: { verseId: "ISA.25.8" },
      },
      { type: "text", text: ",", attrs: { verseId: "ISA.25.8" } },
      { type: "text", text: "people", attrs: { verseId: "ISA.25.8" } },
      { type: "text", text: "’s", attrs: { verseId: "ISA.25.8" } },
      { type: "text", text: "well-being", attrs: { verseId: "ISA.25.8" } },
      { type: "text", text: "—forever.", attrs: { verseId: "ISA.25.8" } },
    ],
  }];

  assertEquals(
    parseVerseContent(content)[0]?.text,
    "mockery against his land, people’s well-being—forever.",
  );
});
