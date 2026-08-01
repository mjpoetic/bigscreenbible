import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

assert.match(
  source,
  /verseNavCollapsed: localStorage\.getItem\("lw_verse_nav_collapsed"\) === "true"/,
  "The Reader verse chooser should keep its original expanded default",
);
assert.match(
  source,
  /libraryOpen: localStorage\.getItem\("lw_library_open"\) === "true"/,
  "The side-panel verse selector should default to collapsed while preserving an explicit open preference",
);

assert.match(source, /authEmailCueId: ""/);
assert.match(source, /placeholder="\$\{showEmailCue \? "Email required" : "Email"\}"/);
assert.match(source, /state\.authEmailCueId = emailId;[\s\S]*?renderPreservingReaderScroll\(\);[\s\S]*?\.focus\(\{ preventScroll: true \}\)/);
assert.match(styles, /\.account-form input\.account-email-cue \{[\s\S]*?border-color: #dc2626/);

assert.match(source, /const accountTutorialStep = \{[\s\S]*?title: "Save your bookmarks"/);
assert.match(source, /const presentationAccountTutorialStep = \{[\s\S]*?title: "Save your bookmarks"/);
assert.match(source, /if \(state\.authUser\) return steps;/);
assert.match(source, /return \[\.\.\.steps, presentationTour \? presentationAccountTutorialStep : accountTutorialStep\];/);

console.log("Default behavior tests passed");
