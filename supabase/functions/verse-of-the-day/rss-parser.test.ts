import { parseNewestVerseItem } from "./rss-parser.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

Deno.test("parses only the newest item reference, verse text, and source URL", () => {
  const xml = `
    <rss><channel>
      <item>
        <title>Verse of the Day - Psalm 91:1</title>
        <link>https://www.verseoftheday.com/en/06212026/?utm_source=rss&amp;utm_medium=devos</link>
        <pubDate>Sun, 21 Jun 2026 02:00:00 -0500</pubDate>
        <description>&lt;p&gt;He who dwells in the shelter of the Most High will rest in the shadow of the Almighty.&lt;/p&gt;&lt;h4&gt;Thoughts on Today's Verse...&lt;/h4&gt;&lt;p&gt;This must not be included.&lt;/p&gt;</description>
      </item>
      <item>
        <title>Verse of the Day - Psalm 121:7-8</title>
        <link>https://www.verseoftheday.com/en/06222026/?utm_source=rss&amp;utm_medium=devos</link>
        <pubDate>Mon, 22 Jun 2026 02:00:00 -0500</pubDate>
        <description>&lt;p&gt;The LORD will keep you from all harm — he will watch over your life.&lt;/p&gt;&lt;p&gt;&amp;mdash;Psalm 121:7-8&lt;/p&gt;&lt;h4&gt;Thoughts on Today's Verse...&lt;/h4&gt;</description>
      </item>
    </channel></rss>
  `;

  assertEquals(parseNewestVerseItem(xml), {
    reference: "Psalm 121:7-8",
    verseText: "The LORD will keep you from all harm — he will watch over your life.",
    sourceUrl: "https://www.verseoftheday.com/en/06222026/?utm_source=rss&utm_medium=devos",
    publishedAt: "2026-06-22T07:00:00.000Z",
  });
});

Deno.test("rejects items whose attribution URL is not VerseoftheDay.com", () => {
  const xml = `
    <rss><channel><item>
      <title>Verse of the Day - John 3:16</title>
      <link>https://example.com/copied-item</link>
      <pubDate>Mon, 22 Jun 2026 02:00:00 -0500</pubDate>
      <description>&lt;p&gt;For God so loved the world.&lt;/p&gt;</description>
    </item></channel></rss>
  `;

  let message = "";
  try {
    parseNewestVerseItem(xml);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes("did not contain a usable verse item")) throw new Error("Expected invalid source URL to be rejected");
});

Deno.test("falls back to an approved permalink when the item link is unusable", () => {
  const xml = `
    <rss><channel><item>
      <title>Verse of the Day - Jeremiah 23:24</title>
      <link>https://example.com/copied-item</link>
      <guid isPermaLink="true">https://www.verseoftheday.com/en/06252026/?utm_source=rss&amp;utm_medium=devos&amp;utm_content=votd&amp;utm_term=en</guid>
      <pubDate>Thu, 25 Jun 2026 02:00:00 -0500</pubDate>
      <description>&lt;p&gt;Can anyone hide in secret places so that I cannot see them?&lt;/p&gt;</description>
    </item></channel></rss>
  `;

  assertEquals(parseNewestVerseItem(xml), {
    reference: "Jeremiah 23:24",
    verseText: "Can anyone hide in secret places so that I cannot see them?",
    sourceUrl: "https://www.verseoftheday.com/en/06252026/?utm_source=rss&utm_medium=devos&utm_content=votd&utm_term=en",
    publishedAt: "2026-06-25T07:00:00.000Z",
  });
});
