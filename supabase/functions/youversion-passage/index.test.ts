import { cleanPlainText } from "./text-cleaner.ts";
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
