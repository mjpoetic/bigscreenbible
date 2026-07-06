import { cleanPlainText } from "./text-cleaner.ts";

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
