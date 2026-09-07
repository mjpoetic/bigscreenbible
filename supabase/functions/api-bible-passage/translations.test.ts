import { matchesTranslation } from "./translations.ts";
Deno.test("CEV and NKJV matching keeps other translations distinct", () => {
  for (const [code, abbreviation, name, expected] of [
    ["CEV", "CEV", "Contemporary English Version", true],
    ["CEV", "CEVUS06", "Contemporary English Version", true],
    ["NKJV", "NKJV", "New King James Version", true],
    ["NKJV", "KJV", "King James Version", false],
    ["NKJV", "NIV", "New International Version", false],
    ["CEV", "CEB", "Common English Bible", false],
    ["CEV", "NLT", "New Living Translation", false],
    ["NLT", "NLT", "New Living Translation", true],
    ["NIV", "NIV", "New International Version", true],
    ["NASB2020", "NASB2020", "New American Standard Bible 2020", true],
  ] as const) {
    if (matchesTranslation({id:"fixture", abbreviation, name}, code) !== expected) {
      throw new Error(`${code} incorrectly matched ${abbreviation}`);
    }
  }
});
