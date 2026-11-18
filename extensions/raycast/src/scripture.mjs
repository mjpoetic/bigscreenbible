export const translations = ['BSB', 'KJV', 'WEB', 'ASV', 'BBE', 'YLT'];
const normalize = (value) => value.toLowerCase().replace(/[\s.]/g, '');
export function lookupPassage(bible, input) {
  const value = input.trim().replace(/[–—]/g, '-');
  const match = value.length <= 200 && value.match(/^([1-3]?\s*[a-zA-Z .]+?)\s*(\d{1,3})(?:\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?$/);
  if (!match) throw new Error('Enter a reference such as John 3:16-18 or Psalm 23. Use one chapter at a time.');
  let book = normalize(match[1]);
  if (book === 'psalms') book = 'psalm';
  if (book === 'songofsolomon') book = 'songofsongs';
  const key = Object.keys(bible.chapters).find((key) => normalize(key).replace(/^psalms/, 'psalm').replace(/^songofsolomon/, 'songofsongs') === `${book}${Number(match[2])}`);
  if (!key) throw new Error('Book or chapter not found. Use the full book name, such as 1 Corinthians 13.');
  const first = match[3] ? Number(match[3]) : undefined;
  const last = Number(match[4] || first);
  const verses = bible.chapters[key].filter(({ n }) => first === undefined || (n >= first && n <= last));
  if (!verses.length || (first !== undefined && (first < 1 || last < first || verses.length !== last - first + 1))) throw new Error('That verse range is not available in this chapter.');
  const reference = key + (first === undefined ? '' : `:${first}${last === first ? '' : `-${last}`}`);
  const text = `${reference} (${bible.code})\n\n${verses.map(({ n, text }) => `${n} ${text}`).join('\n\n')}`;
  return { reference, version: bible.code, name: bible.name, source: bible.source, verses, text };
}
export function escapeMarkdown(value) {
  return String(value).replace(/[\\`*_{}\[\]()<>#+.!|~-]/g, '\\$&');
}
