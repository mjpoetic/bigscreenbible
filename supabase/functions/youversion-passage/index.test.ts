import {
  cleanPlainText,
  extractYouVersionChapterHtml,
  extractYouVersionPassageHtml,
} from "./text-cleaner.ts";
import {
  matchesYouVersionTranslation,
  supportedYouVersionTranslations,
} from "./translations.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("removes YouVersion pilcrow paragraph markers from AMP text", () => {
  assertEquals(
    cleanPlainText(
      "&#182;Listen carefully, I will put the Medes [in motion] against them.",
    ),
    "Listen carefully, I will put the Medes [in motion] against them.",
  );
  assertEquals(
    cleanPlainText(
      "Their bows will cut down the young men. ¶ They will take no pity.",
    ),
    "Their bows will cut down the young men. They will take no pity.",
  );
});

Deno.test("preserves YouVersion words-of-Jesus ranges from passage HTML", () => {
  assertEquals(
    extractYouVersionPassageHtml(`
      <div class="p">
        <span class="yv-v" v="16"></span>
        <span class="yv-vlbl">16</span>
        <span class="wj">For God <span class="it">so</span> loved</span>
        the world &amp; gave.
      </div>
    `),
    {
      text: "For God so loved the world & gave.",
      wordsOfJesus: [{ start: 0, end: 16 }],
    },
  );
});

Deno.test("omits YouVersion labels and notes without changing verse text", () => {
  assertEquals(
    extractYouVersionPassageHtml(`
      <div class="p">
        <span class="yv-vlbl">3</span>
        He said, <span class="wj">&#182;“Come to me.”</span>
        <span class="yv-n f">Hidden note</span> Then they came.
      </div>
    `),
    {
      text: "He said, “Come to me.” Then they came.",
      wordsOfJesus: [{ start: 9, end: 22 }],
    },
  );
});

Deno.test("splits YouVersion chapter HTML at verse milestones", () => {
  assertEquals(
    extractYouVersionChapterHtml(`
      <div class="p">
        <span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>
        Before <span class="wj">Jesus spoke.</span>
        <span class="yv-v" v="2"></span><span class="yv-vlbl">2</span>
        <span class="wj">He continued</span>, then the narrator spoke.
      </div>
    `),
    [
      {
        n: 1,
        text: "Before Jesus spoke.",
        wordsOfJesus: [{ start: 7, end: 19 }],
      },
      {
        n: 2,
        text: "He continued, then the narrator spoke.",
        wordsOfJesus: [{ start: 0, end: 12 }],
      },
    ],
  );
});

Deno.test("recognizes the authorized NIrV edition", () => {
  assertEquals(supportedYouVersionTranslations, ["AMP", "NIRV"]);
  assertEquals(
    matchesYouVersionTranslation(
      { localized_abbreviation: "NIrV" },
      "NIRV",
    ),
    true,
  );
  assertEquals(
    matchesYouVersionTranslation(
      { title: "New International Reader’s Version" },
      "NIRV",
    ),
    true,
  );
  assertEquals(
    matchesYouVersionTranslation(
      { abbreviation: "NIV", title: "New International Version" },
      "NIRV",
    ),
    false,
  );
});

Deno.test("keeps Amplified Bible matching distinct from AMP Classic", () => {
  assertEquals(
    matchesYouVersionTranslation({ title: "Amplified Bible" }, "AMP"),
    true,
  );
  assertEquals(
    matchesYouVersionTranslation(
      { title: "Amplified Bible, Classic Edition" },
      "AMP",
    ),
    false,
  );
});
