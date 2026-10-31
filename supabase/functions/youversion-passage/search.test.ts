import { searchYouVersion } from "./search.ts";

Deno.test("searches each licensed version and resolves Hebrews 4:12 text", async () => {
  for (const id of [111, 110, 2692, 1588]) {
    const calls: string[] = [];
    const results = await searchYouVersion(id, '"alive and active"', (path) => {
      calls.push(path);
      if (path.startsWith('/v1/search-verses?')) {
        const params = new URL('https://example.com' + path).searchParams;
        if (params.get('bible_id') !== String(id) || params.get('query') !== '"alive and active"' || params.get('user_intent') !== 'text') throw Error('Wrong search parameters');
        return Promise.resolve({verses: [{reference: 'HEB.4.12'}, {reference: 'HEB.4.12'}, {reference: '../bad'}]});
      }
      if (path !== `/v1/bibles/${id}/passages/HEB.4.12?format=text`) throw Error('Wrong licensed passage');
      return Promise.resolve({reference: 'Hebrews 4:12', content: 'For the word of God is alive and active.'});
    });
    if (calls.length !== 2 || results.length !== 1 || results[0].ref !== 'Hebrews 4:12' || !results[0].text.includes('alive and active')) throw Error('Missing verse');
  }
});

Deno.test("empty search does not fetch passages and provider errors propagate", async () => {
  const results = await searchYouVersion(111, 'absent', () => Promise.resolve({verses: []}));
  if (results.length) throw Error('Expected no results');
  let failed = false;
  try { await searchYouVersion(111, 'alive', () => Promise.reject(Error('429'))); } catch { failed = true; }
  if (!failed) throw Error('Provider failure must not look like a successful empty search');
});
