import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = readFileSync(path.join(root, "assets", "bible-app.css"), "utf8");

const focusScriptureRule = styles.match(/\.focus-mode \.scripture \{(?<body>[^}]*)\}/)?.groups?.body || "";
const phoneLandscapeStart = styles.indexOf("@media (orientation: landscape) and (max-width: 1024px) and (max-height: 560px)");
const phoneLandscapeEnd = styles.indexOf("@media (max-width: 840px)", phoneLandscapeStart);
const phoneLandscapeStyles = styles.slice(phoneLandscapeStart, phoneLandscapeEnd);
const phoneLandscapeFocusScriptureRule = phoneLandscapeStyles.match(/\.focus-mode \.scripture \{(?<body>[^}]*)\}/)?.groups?.body || "";

assert.match(focusScriptureRule, /max-width:\s*none;/);
assert.doesNotMatch(focusScriptureRule, /calc\(100vw\s*-\s*48px\)/);
assert.ok(phoneLandscapeStart >= 0 && phoneLandscapeEnd > phoneLandscapeStart);
assert.match(
  phoneLandscapeFocusScriptureRule,
  /padding-left:\s*max\(18px,\s*calc\(env\(safe-area-inset-left,\s*0px\)\s*\+\s*18px\)\);/,
);
assert.match(
  phoneLandscapeFocusScriptureRule,
  /padding-right:\s*max\(18px,\s*calc\(env\(safe-area-inset-right,\s*0px\)\s*\+\s*18px\)\);/,
);

console.log("Focus Mode layout regression checks passed.");
