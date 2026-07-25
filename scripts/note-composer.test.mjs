import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const context = {
  state: {
    reference: "John 3",
    notes: {
      "John 3:16-18": "Passage note",
      "John 3:16": "Verse note",
      "John 3:17": "",
      "John 4:16": "Other chapter",
    },
  },
  parsePassageReference(ref) {
    const match = ref.match(/^(John \d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    const start = Number(match[2]);
    const end = Number(match[3] || start);
    return {
      key: match[1],
      verse: start,
      verses: Array.from({ length: end - start + 1 }, (_, index) => start + index),
    };
  },
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("noteReferencesStartingAtVerse")}
  globalThis.notesAt = noteReferencesStartingAtVerse;
`, context);

assert.deepEqual(
  [...context.notesAt(16)],
  ["John 3:16", "John 3:16-18"],
  "Verse notes should appear before range notes that start at the same verse",
);
assert.deepEqual([...context.notesAt(17)], [], "A range note marker should only appear at its first verse");

assert.match(source, /id="noteSelection"[^>]+data-note-reference=/);
assert.match(source, /function noteComposerMarkup\(\)/);
assert.match(source, /function saveNoteComposer\(event\)/);
assert.match(source, /function deleteNoteComposer\(\)/);
assert.match(source, /verseNoteIndicatorsMarkup\(verse\.n\)/);
assert.match(source, /data-menu-note/);
assert.match(source, /data-menu-highlight/);
assert.match(source, /function openHighlightToolsForVerse\(verseNumber\)/);
assert.match(styles, /\.verse-note-indicator/);
assert.match(styles, /\.note-composer/);
assert.match(styles, /grid-template-columns: repeat\(7, minmax\(32px, 1fr\)\)/);
assert.match(styles, /@media \(max-width: 840px\)[\s\S]*?\.note-composer/);

console.log("Note composer tests passed");
