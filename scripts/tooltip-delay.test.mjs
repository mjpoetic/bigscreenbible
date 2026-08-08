import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

assert.match(styles, /:root \{[\s\S]*?--tooltip-delay: 1s;/);
assert.match(styles, /\[data-tooltip\]::after \{[\s\S]*?transition-delay: 0s;/);
assert.match(styles, /\[data-tooltip\]:hover::after,[\s\S]*?\[data-tooltip\]:focus-visible::after \{[\s\S]*?transition-delay: var\(--tooltip-delay\);/);
assert.match(styles, /\.topbar \.search\[data-tooltip\]:has\(\[data-tooltip\]:hover\)::after,[\s\S]*?transition-delay: 0s;/);
assert.match(styles, /\.app-shell\.toast-visible \.reader-auto-scroll-button\[data-tooltip\]::after \{[\s\S]*?transition-delay: 0s !important;/);

console.log("Tooltip delay tests passed");
