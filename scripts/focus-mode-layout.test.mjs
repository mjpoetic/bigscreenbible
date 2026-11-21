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
  /padding-left:\s*max\(18px,\s*calc\(var\(--app-safe-area-left, env\(safe-area-inset-left,\s*0px\)\)\s*\+\s*18px\)\);/,
);
assert.match(
  phoneLandscapeFocusScriptureRule,
  /padding-right:\s*max\(18px,\s*calc\(var\(--app-safe-area-right, env\(safe-area-inset-right,\s*0px\)\)\s*\+\s*18px\)\);/,
);

// Collapsing the grid row alone leaves the reader's explicit height unchanged.
// Its shared header-height input must also shrink so the scroll area grows.
const collapsedParallelRule = styles.match(/\.app-shell\.parallel-header-collapsed \{([^}]*)\}/)?.[1] || "";
assert.match(collapsedParallelRule, /--topbar-height:\s*0px;/);
assert.match(styles, /\.main-grid\s*\{[^}]*height:\s*calc\(100vh - var\(--topbar-height\) - var\(--reader-chrome-height\)\)/);
assert.match(styles, /\.main-grid\.focus-mode,[^}]*height:\s*calc\(100vh - var\(--topbar-height\)\)/);

console.log("Focus Mode layout regression checks passed.");
