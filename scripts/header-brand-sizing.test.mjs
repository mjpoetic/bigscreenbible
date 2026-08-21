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
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.app-shell\.focus-shell \.brand \{[\s\S]*?grid-column:\s*1 \/ 3;[\s\S]*?display:\s*flex;/);
assert.match(styles, /\.app-shell\.focus-shell \.brand-mark-image \{[\s\S]*?width:\s*44px;[\s\S]*?margin-right:\s*0;/);
assert.match(styles, /\.app-shell\.focus-shell \.brand-copy \{[\s\S]*?display:\s*none;/);
assert.match(styles, /\.app-shell\.focus-shell \.mode-tabs \{[\s\S]*?grid-column:\s*3 \/ 9;/);
assert.match(styles, /\.app-shell\.focus-shell #focusToggle \{[\s\S]*?grid-column:\s*9 \/ 11;/);
assert.match(styles, /\.app-shell\.focus-shell \.account-menu \{[\s\S]*?grid-column:\s*11 \/ -1;/);

console.log("Header brand sizing regression checks passed.");
