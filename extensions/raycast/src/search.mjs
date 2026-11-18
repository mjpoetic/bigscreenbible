import { lookupPassage } from './scripture.mjs';
export const onlineTranslations = ['ESV', 'NIV', 'NASB2020', 'AMP', 'NIRV', 'NKJV', 'NLT', 'CEV'];
export const apiBibleTranslations = ['NKJV', 'NLT', 'CEV'];
export const copyrightFor = (version) => version === 'ESV' ? 'ESV® Bible © 2001 by Crossway. Used by permission. All rights reserved.' : '';
export function searchTerms(input) {
  const value = input.trim().replace(/\s+/g, ' ');
  if (!value || value.length > 120) throw new Error('Enter up to 120 characters to search.');
  const exact = /^".*"$/.test(value);
  const query = exact ? value.slice(1, -1).trim() : value;
  if (!query) throw new Error('Enter words inside the quotation marks.');
  return { query, exact };
}
export function searchLocal(bible, input, limit = 50) {
  const { query, exact } = searchTerms(input);
  const words = query.toLocaleLowerCase().split(' ');
  const results = [];
  let total = 0;
  for (const [chapter, verses] of Object.entries(bible.chapters)) {
    for (const verse of verses) {
      const text = verse.text.toLocaleLowerCase();
      if (exact ? text.includes(query.toLocaleLowerCase()) : words.every(word => text.includes(word))) {
        total++;
        if (results.length < limit) results.push({ ref: `${chapter}:${verse.n}`, text: verse.text });
      }
    }
  }
  return { results, total, copyright: '', name: bible.name, source: bible.source };
}
export function isReference(input) {
  return /^\s*[1-3]?\s*[a-zA-Z .]+?\s*\d/.test(input);
}
export function canonicalReference(bible, input) {
  return lookupPassage(bible, input).reference;
}
export async function requestOnline(config, version, params, fetcher = fetch) {
  if (!onlineTranslations.includes(version)) throw new Error('This translation is not available for online lookup.');
  const endpoint = version === 'ESV' ? 'esv-passage' : apiBibleTranslations.includes(version) ? 'api-bible-passage' : 'youversion-passage';
  const url = new URL(`${config.url}/functions/v1/${endpoint}`);
  for (const [key, value] of Object.entries({ ...params, version })) url.searchParams.set(key, String(value));
  const response = await fetcher(url, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, signal: AbortSignal.timeout(25000) });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || `Online lookup failed (${response.status}). Try again or choose an offline translation.`);
  return payload;
}
export function onlinePassage(payload, reference, version) {
  if (!Array.isArray(payload.verses) || !payload.verses.length || !payload.verses.every(v => Number.isInteger(v.n) && typeof v.text === 'string')) throw new Error('The service returned no usable Scripture text.');
  const chapter = reference.split(':')[0];
  const expanded = payload.verses.flatMap(v => Array.from({ length: Math.max(1, Math.min(200, (v.verseEnd || v.n) - v.n + 1)) }, (_, offset) => ({ ...v, n: v.n + offset, sourceVerse: v.n })));

  // Resolve the range against actual provider verses; local numbering can differ.
  const result = lookupPassage({ code: version, name: payload.bibleName || version, source: 'https://bigscreenbible.com/terms/#bible-rights', chapters: { [chapter]: expanded } }, reference);
  const seen = new Set();
  result.verses = result.verses.filter(v => { if (seen.has(v.sourceVerse)) return false; seen.add(v.sourceVerse); return true; });
  result.text = `${result.reference} (${version})\n\n${result.verses.map(v => `${v.sourceVerse}${v.verseEnd ? `-${v.verseEnd}` : ''} ${v.text}`).join('\n\n')}`;
  const copyright = String(payload.copyright || copyrightFor(version));
  return { ...result, copyright, text: `${result.text}${copyright ? `\n\n${copyright}` : ''}` };
}
