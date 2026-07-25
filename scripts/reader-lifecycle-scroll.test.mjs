import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

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

const currentAnchorSource = extractFunction("currentReaderScrollAnchor");
assert.match(
  currentAnchorSource,
  /document\.visibilityState === "hidden"/,
  "Hidden documents must not replace the last good reader anchor with unusable layout geometry",
);

const viewportRenderSource = extractFunction("renderAfterViewportChangePreservingReaderScroll");
assert.match(
  viewportRenderSource,
  /document\.visibilityState === "hidden"/,
  "Background viewport changes must not rerender the reader",
);

const viewportRestoreSource = extractFunction("preserveReaderScrollAfterViewportChange");
assert.match(
  viewportRestoreSource,
  /document\.visibilityState === "hidden"/,
  "Background viewport changes must not schedule a reader restore from hidden geometry",
);

const rememberSource = extractFunction("rememberReaderScrollBeforeAppSwitch");
assert.match(rememberSource, /captureReaderScroll\(\{ preferLastReaderAnchor: true \}\)/);
assert.match(rememberSource, /preferredViewportReaderScrollAnchor\(\)/);
assert.match(rememberSource, /clearTimeout\(readerViewportRestoreTimer\)/);

const restoreSource = extractFunction("restoreReaderScrollAfterAppSwitch");
assert.match(restoreSource, /scrollState\.mode !== state\.mode/);
assert.match(restoreSource, /scrollState\.reference !== state\.reference/);
assert.match(restoreSource, /requestAnimationFrame/);
assert.match(restoreSource, /setTimeout/);

assert.match(
  source,
  /document\.visibilityState === "hidden"[\s\S]*?rememberReaderScrollBeforeAppSwitch\(\)[\s\S]*?restoreReaderScrollAfterAppSwitch\(\)/,
);
assert.match(source, /window\.addEventListener\("pagehide", rememberReaderScrollBeforeAppSwitch\)/);
assert.match(source, /window\.addEventListener\("pageshow", \(\) => \{[\s\S]*?restoreReaderScrollAfterAppSwitch\(\)/);

console.log("Reader lifecycle scroll tests passed");
