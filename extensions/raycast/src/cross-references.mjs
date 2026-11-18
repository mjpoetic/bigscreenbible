// OpenBible's CC-BY reference catalog is shared with the website.
export function relatedReferences(catalog, reference) {
  const match = reference.trim().replace(/[–—]/g, '-').match(/^(.+?\s+\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return [];
  const chapter = match[1].replace(/^Psalms /, 'Psalm ');
  const first = Number(match[2]);
  const last = Number(match[3] || match[2]);
  if (match[2] && (first < 1 || last < first || last - first > 200)) return [];
  const sources = match[2] ? Array.from({length:last-first+1},(_,i)=>`${chapter}:${first+i}`) : Object.keys(catalog.refs).filter(key=>key.startsWith(`${chapter}:`));
  const related = new Map();
  for (const source of sources) for (const entry of catalog.refs[source] || []) {
    const label = Array.isArray(entry) ? entry[0] : entry;
    const fallback = Array.isArray(entry) ? entry[1] : entry;
    // Cross-chapter targets use the catalog's starting verse, like the website preview.
    const target = /^.+?\s+\d+:\d+(?:-\d+)?$/.test(label) ? label : fallback;
    if (!related.has(target)) related.set(target, {reference: target, label, sources: []});
    const hit = related.get(target);
    if (!hit.sources.includes(source)) hit.sources.push(source);
  }
  return [...related.values()];
}
