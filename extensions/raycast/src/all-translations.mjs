// Bound requests so searching every translation does not burst provider rate limits.
export async function collectTranslations(versions, lookup, concurrency = 3) {
  const slots = new Array(versions.length);
  let next = 0;
  async function worker() {
    while (next < versions.length) {
      const index = next++;
      const version = versions[index];
      try { slots[index] = { version, data: await lookup(version) }; }
      catch (error) { slots[index] = { version, error: error instanceof Error ? error.message : String(error) }; }
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,versions.length)}, worker));
  const results = [], failures = [];
  for (const slot of slots) {
    if (slot.error) { failures.push({version:slot.version, message:slot.error}); continue; }
    for (const hit of slot.data.results) results.push({...hit, version:slot.version, copyright:slot.data.copyright || ''});
  }
  return {results, failures};
}
