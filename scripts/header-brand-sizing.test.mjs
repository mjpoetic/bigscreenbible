import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

const rootRule = styles.match(/:root \{(?<body>[^}]*)\}/)?.groups?.body || "";
const brandMarkRule = styles.match(/\.brand-mark-image \{(?<body>[^}]*)\}/)?.groups?.body || "";
const brandDividerRule = styles.match(/\.brand-divider \{(?<body>[^}]*)\}/)?.groups?.body || "";

assert.match(rootRule, /--brand-title-size:\s*21px;/);
assert.match(rootRule, /--brand-subtitle-size:\s*12px;/);
assert.doesNotMatch(rootRule, /--brand-(?:title|subtitle)-size:[^;]*(?:vw|clamp\()/);
assert.match(brandMarkRule, /width:\s*68px;/);
assert.doesNotMatch(brandMarkRule, /width:[^;]*(?:vw|clamp\()/);
assert.match(brandDividerRule, /height:\s*40px;/);

console.log("Header brand sizing regression checks passed.");
