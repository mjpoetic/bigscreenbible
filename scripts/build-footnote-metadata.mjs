import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// These source verses consist only of a manuscript note. Attach the note to
// the preceding included verse, retaining its actual reference in the popup.
const webNoteOnlyVerses = { 'Luke 17:36': 35, 'Acts 8:37': 36, 'Acts 15:34': 33, 'Acts 24:7': 6, 'Romans 16:25': 24 };

function readBundle(name) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, `assets/bibles/${name}.js`), 'utf8'), context);
  return context.window[`BIGSCREEN_BIBLE_${name === 'index' ? 'INDEX' : name}`];
}

function cleanNoteText(value) {
  return value
    .replace(/\\\+?w[hg]?\s+([^|\\]+)(?:\|[^\\]*)?\\\+?w[hg]?\*/g, '$1')
    .replace(/\\\+?[a-z][a-z0-9]*\*/gi, '')
    .replace(/\\\+?[a-z][a-z0-9]*\s?/gi, '')
    .replace(/\s+/g, ' ').trim();
}

export function parseUsfmFootnotes(source, bookNames) {
  const chapters = {};
  const bookCode = source.match(/\\id\s+(\S+)/)?.[1];
  const book = bookNames[bookCode];
  if (!book) return chapters; // Exclude front matter and noncanonical books.
  let chapter = 0;
  let verse = 0;
  // Consume whole notes/cross references so markers in them cannot move the cursor.
  const tokens = /\\c\s+(\d+)|\\v\s+(\d+)(?:[-–]\d+)?|\\(f|fe|x)\s+([\s\S]*?)\\\3\*/g;
  for (const match of source.matchAll(tokens)) {
    if (match[1]) { chapter = Number(match[1]); verse = 0; continue; }
    if (match[2]) { verse = Number(match[2]); continue; }
    if (match[3] === 'x' || !chapter || !verse) continue;
    const body = match[4].replace(/^\S+\s*/, ''); // Publisher caller, e.g. +.
    const reference = cleanNoteText(body.match(/\\fr\s+([^\\]*)/)?.[1] || '');
    const text = cleanNoteText(body.replace(/\\fr\s+[^\\]*/g, ''));
    if (!text) continue;
    const key = `${book} ${chapter}`;
    const notes = (chapters[key] ||= {})[verse] ||= [];
    notes.push({ id: `${chapter}:${verse}-f-${notes.length + 1}`, text, ...(reference ? { reference } : {}) });
  }
  return chapters;
}

export function buildFootnoteMetadata(args) {
  const bookNames = Object.fromEntries(readBundle('index').books.map(book => [book.code, book.name]));
  const versions = {};
  const sources = {};
  for (const arg of args) {
    const separator = arg.indexOf('=');
    const version = arg.slice(0, separator).toUpperCase();
    if (separator < 1 || !['BSB', 'WEB'].includes(version)) throw new Error('Use BSB=folder and WEB=folder');
    const folder = path.resolve(arg.slice(separator + 1));
    const hash = createHash('sha256');
    const chapters = {};
    for (const file of fs.readdirSync(folder).filter(file => /\.(usfm|sfm)$/i.test(file)).sort()) {
      const content = fs.readFileSync(path.join(folder, file), 'utf8');
      hash.update(file + '\0' + content);
      const parsed = parseUsfmFootnotes(content, bookNames);
      for (const [key, verses] of Object.entries(parsed)) {
        if (chapters[key]) throw new Error(`Duplicate source chapter: ${key}`);
        chapters[key] = verses;
      }
    }
    const bundle = readBundle(version);
    let count = 0;
    for (const [key, verses] of Object.entries(chapters)) {
      for (const [number, notes] of Object.entries(verses)) {
        if (!bundle.chapters[key]?.verses.some(verse => verse.n === Number(number))) {
          const preceding = version === 'WEB' && webNoteOnlyVerses[`${key}:${number}`];
          if (!preceding || !bundle.chapters[key]?.verses.some(verse => verse.n === preceding)) {
            throw new Error(`Footnote has no bundled verse: ${version} ${key}:${number}`);
          }
          verses[preceding] = [...(verses[preceding] || []), ...notes];
          delete verses[number];
        }
        count += notes.length;
      }
    }
    if (!count) throw new Error(`No footnotes found for ${version}`);
    versions[version] = chapters;
    sources[version] = { url: bundle.source, format: 'eBible.org USFM', sha256: hash.digest('hex'), notes: count,
      ...(version === 'WEB' ? { noteOnlyVerses: webNoteOnlyVerses } : {}) };
    console.log(`${version}: ${count} footnotes`);
  }
  return { sources, versions };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length < 3) throw new Error('Usage: node scripts/build-footnote-metadata.mjs BSB=sources/engbsb_usfm WEB=sources/engwebp_usfm');
  const metadata = buildFootnoteMetadata(process.argv.slice(2));
  fs.writeFileSync(path.join(root, 'assets/bibles/footnotes.js'), `window.BIGSCREEN_BIBLE_FOOTNOTES = ${JSON.stringify(metadata)};\n`);
}
