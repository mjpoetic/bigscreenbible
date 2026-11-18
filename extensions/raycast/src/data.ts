import { collectTranslations } from './all-translations.mjs';
import { translations } from './scripture.mjs';
import { onlineTranslations } from './search.mjs';
import { relatedReferences } from './cross-references.mjs';
import { environment, LocalStorage } from '@raycast/api';
import { randomUUID } from 'node:crypto';
import { reportScriptureView } from './fums.mjs';
import { apiBibleTranslations } from './search.mjs';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { lookupPassage } from './scripture.mjs';
import { canonicalReference, onlinePassage, requestOnline, searchLocal, searchTerms } from './search.mjs';
import config from './service-config.json';
const sessionId = randomUUID();
let deviceIdRequest: Promise<string> | undefined;
async function trackPayload(payload: any, version: string) {
  if (!apiBibleTranslations.includes(version)) return;
  if (!String(payload.copyright || '').trim()) throw new Error('The provider returned no copyright notice. Please try again.');
  deviceIdRequest ??= (async () => {
    const saved = await LocalStorage.getItem<string>('api-bible-anonymous-device-id');
    if (saved) return saved;
    const id = randomUUID();
    await LocalStorage.setItem('api-bible-anonymous-device-id', id);
    return id;
  })();
  await reportScriptureView(payload.fumsToken, await deviceIdRequest, sessionId);
}
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
  const passage = onlinePassage(payload, reference, version);
  await trackPayload(payload, version);
  return passage;
}
export async function findVerses(input: string, version: string) {
  if (['BSB','KJV','WEB','ASV','BBE','YLT'].includes(version)) return searchLocal(await bibleData(version), input);
  const { query, exact } = searchTerms(input);
  const payload = await requestOnline(config, version, { action: 'search', query, exact });
  const results = (Array.isArray(payload.results) ? payload.results : []).filter((hit: any) => typeof hit.ref === 'string' && typeof hit.text === 'string' && (!exact || hit.text.toLowerCase().includes(query.toLowerCase())));
  if (results.length) await trackPayload(payload, version);
  return { results, total: payload.totalResults, name: payload.bibleName || version, copyright: payload.copyright || (version === 'ESV' ? 'ESV® Bible © 2001 by Crossway. Used by permission. All rights reserved.' : ''), source: 'https://bigscreenbible.com/terms/#bible-rights' };
}

let crossReferenceCatalog: any;
export async function getCrossReferences(reference: string) {
  if (!crossReferenceCatalog) {
    const bytes = await readFile(join(environment.assetsPath, 'crossrefs.json.gz'));
    crossReferenceCatalog = JSON.parse(gunzipSync(bytes).toString('utf8'));
  }
  return relatedReferences(crossReferenceCatalog, reference);
}

export async function searchAllTranslations(input: string, reference = false) {
  return collectTranslations([...translations, ...onlineTranslations], async (version: string) => {
    if (!reference) return findVerses(input, version);
    const passage = await getPassage(input, version);
    return { results: [{ ref: passage.reference, text: passage.text, passage }], copyright: passage.copyright || '' };
  });
}
