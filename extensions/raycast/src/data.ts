import { environment } from '@raycast/api';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { lookupPassage } from './scripture.mjs';
import { canonicalReference, onlinePassage, requestOnline, searchLocal, searchTerms } from './search.mjs';
import config from './service-config.json';
const cache = new Map<string, any>();
export async function bibleData(version: string) {
  if (!cache.has(version)) {
    const bytes = await readFile(join(environment.assetsPath, `${version}.json.gz`));
    cache.set(version, JSON.parse(gunzipSync(bytes).toString('utf8')));
  }
  return cache.get(version);
}
export async function getPassage(input: string, version: string) {
  if (['BSB','KJV','WEB','ASV','BBE','YLT'].includes(version)) return lookupPassage(await bibleData(version), input);
  const reference = canonicalReference(await bibleData('BSB'), input);
  const payload = await requestOnline(config, version, { ref: reference.split(':')[0] });
  return onlinePassage(payload, reference, version);
}
export async function findVerses(input: string, version: string) {
  if (['BSB','KJV','WEB','ASV','BBE','YLT'].includes(version)) return searchLocal(await bibleData(version), input);
  const { query, exact } = searchTerms(input);
  const payload = await requestOnline(config, version, { action: 'search', query, exact });
  const results = (Array.isArray(payload.results) ? payload.results : []).filter((hit: any) => typeof hit.ref === 'string' && typeof hit.text === 'string' && (!exact || hit.text.toLowerCase().includes(query.toLowerCase())));
  return { results, total: payload.totalResults, name: payload.bibleName || version, copyright: payload.copyright || (version === 'ESV' ? 'ESV® Bible © 2001 by Crossway. Used by permission. All rights reserved.' : ''), source: 'https://bigscreenbible.com/terms/#bible-rights' };
}
