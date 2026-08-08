import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = readFileSync(path.join(root, "assets", "bible-app.css"), "utf8");

const focusScriptureRule = styles.match(/\.focus-mode \.scripture \{(?<body>[^}]*)\}/)?.groups?.body || "";

assert.match(focusScriptureRule, /max-width:\s*none;/);
assert.doesNotMatch(focusScriptureRule, /calc\(100vw\s*-\s*48px\)/);

console.log("Focus Mode layout regression checks passed.");
