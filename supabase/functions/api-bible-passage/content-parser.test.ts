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

Deno.test("preserves words-of-Jesus character ranges without changing verse text", () => {
  const content: ApiBibleContentNode[] = [{
    name: "para",
    type: "tag",
    items: [
      { name: "verse", type: "tag", attrs: { number: "3" } },
      {
        type: "text",
        text: "Jesus answered him,",
        attrs: { verseId: "JHN.3.3" },
      },
      {
        name: "char",
        type: "tag",
        attrs: { style: "wj" },
        items: [{
          type: "text",
          text: "“You must be born again.”",
          attrs: { verseId: "JHN.3.3" },
        }],
      },
    ],
  }];

  assertEquals(parseVerseContent(content), [{
    n: 3,
    text: "Jesus answered him, “You must be born again.”",
    paragraphStart: true,
    wordsOfJesus: [{ start: 19, end: 45 }],
  }]);
});

Deno.test("attaches API.Bible section headings to the next verse", () => {
  const content: ApiBibleContentNode[] = [
    {
      name: "para",
      type: "tag",
      attrs: { style: "s1" },
      items: [{
        type: "text",
        text: "Nothing Can Separate Us from God’s Love",
      }],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "31" } },
        {
          type: "text",
          text: "What shall we say about such wonderful things as these?",
          attrs: { verseId: "ROM.8.31" },
        },
      ],
    },
  ];

  assertEquals(parseVerseContent(content), [{
    n: 31,
    text: "What shall we say about such wonderful things as these?",
    paragraphStart: true,
    sectionHeadings: [{
      text: "Nothing Can Separate Us from God’s Love",
      level: 1,
    }],
  }]);
});

Deno.test("keeps Psalm 119 acrostic labels out of the previous verse text", () => {
  const content: ApiBibleContentNode[] = [
    {
      name: "para",
      type: "tag",
      attrs: { style: "s1" },
      items: [{ type: "text", text: "Psalm 119" }],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "1" } },
        {
          type: "text",
          text: "א Aleph Joyful are people of integrity.",
          attrs: { verseId: "PSA.119.1" },
        },
      ],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "8" } },
        {
          type: "text",
          text: "I will obey your decrees. Please don’t give up on me! ב Beth",
          attrs: { verseId: "PSA.119.8" },
        },
      ],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "9" } },
        {
          type: "text",
          text: "¶How can a young person stay pure?",
          attrs: { verseId: "PSA.119.9" },
        },
      ],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "160" } },
        {
          type: "text",
          text: "All your words are true. ש Sin and",
          attrs: { verseId: "PSA.119.160" },
        },
      ],
    },
    {
      name: "para",
      type: "tag",
      items: [
        { name: "verse", type: "tag", attrs: { number: "161" } },
        {
          type: "text",
          text: "Rulers persecute me without cause.",
          attrs: { verseId: "PSA.119.161" },
        },
      ],
    },
  ];

  assertEquals(parseVerseContent(content), [
    {
      n: 1,
      text: "Joyful are people of integrity.",
      paragraphStart: true,
      sectionHeadings: [{ text: "Aleph", level: 1 }],
    },
    {
      n: 8,
      text: "I will obey your decrees. Please don’t give up on me!",
      paragraphStart: true,
    },
    {
      n: 9,
      text: "How can a young person stay pure?",
      paragraphStart: true,
      sectionHeadings: [{ text: "Beth", level: 1 }],
    },
    {
      n: 160,
      text: "All your words are true.",
      paragraphStart: true,
    },
    {
      n: 161,
      text: "Rulers persecute me without cause.",
      paragraphStart: true,
      sectionHeadings: [{ text: "Shin", level: 1 }],
    },
  ]);
});
