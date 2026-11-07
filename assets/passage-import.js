/* Shared, deterministic reference extraction. No devotional text leaves the device. */
(function (root) {
  const MAX_TEXT = 100000;
  function extract(text, aliases, chapters) {
    if (String(text).length > MAX_TEXT) throw new Error('Please import no more than 100,000 characters at a time.');
    const clean = String(text).normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, '').replace(/[–—−]/g, '-');
    const names = Object.keys(aliases).sort((a, b) => b.length - a.length)
      .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
    const pattern = new RegExp('(?<![A-Za-z0-9])(' + names.join('|') + ')\\.?\\s*(\\d{1,3})\\s*:\\s*(\\d{1,3}(?:\\s*-\\s*\\d{1,3}(?:\\s*:\\s*\\d{1,3})?)?(?:\\s*,\\s*\\d{1,3}(?:\\s*-\\s*\\d{1,3})?)*)(?![0-9])', 'gi');
    const seen = new Set();
    const results = [];
    for (const match of clean.matchAll(pattern)) {
      const book = aliases[match[1].toLowerCase().replace(/\s+/g, ' ')] || aliases[match[1].toLowerCase().replace(/\s+/g, '')];
      if (!book) continue;
      const key = `${book} ${Number(match[2])}`;
      const spec = match[3].replace(/\s/g, '');
      const ref = `${key}:${spec}`;
      if (seen.has(ref)) continue;
      seen.add(ref);
      if (results.length >= 100) throw new Error('More than 100 passages found. Please split this text into smaller imports.');
      let error = '';
      const numbers = new Set();
      if (spec.includes(':')) error = 'Cross-chapter ranges need to be split into separate references.';
      else for (const token of spec.split(',')) {
        const [start, last] = token.split('-').map(Number);
        const end = last ?? start;
        if (start < 1 || end < start || end - start >= 200) { error = 'Use an ascending range of up to 200 verses.'; break; }
        for (let n = start; n <= end; n++) numbers.add(n);
      }
      const available = new Set((chapters[key]?.verses || []).map(v => v.n));
      if (!error && (!numbers.size || numbers.size > 200 || [...numbers].some(n => !available.has(n)))) error = 'This chapter or verse is not available. Check the reference.';
      results.push({ ref, key, verses: [...numbers].sort((a, b) => a - b), error });
    }
    return results;
  }
  root.BSBPassageImport = { extract, MAX_TEXT };
})(globalThis);
