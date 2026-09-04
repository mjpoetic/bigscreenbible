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

const context = { state: { customScriptureFont: "" }, encodeURIComponent };
vm.createContext(context);
vm.runInContext(`
  const genericCustomFontFamilies = new Set([
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "emoji", "math", "fangsong",
  ]);
  ${extractFunction("sanitizeFontName")}
  ${extractFunction("customScriptureFontNames")}
  ${extractFunction("quotedCssFontFamily")}
  ${extractFunction("cssFontFamily")}
  ${extractFunction("customScriptureFontStack")}
  ${extractFunction("customGoogleFontUrl")}
  globalThis.sanitize = sanitizeFontName;
  globalThis.names = customScriptureFontNames;
  globalThis.stack = customScriptureFontStack;
  globalThis.url = customGoogleFontUrl;
`, context);

assert.equal(context.sanitize("  Roboto Slab  "), "Roboto Slab");
assert.equal(context.sanitize("Roboto Slab; color: red"), "Roboto Slab color red");
assert.equal(context.sanitize("Georgia, Charter, Avenir, fourth"), "Georgia, Charter, Avenir");

context.state.customScriptureFont = "Roboto Slab";
assert.deepEqual(Array.from(context.names()), ["Roboto Slab"]);
assert.equal(context.stack(), '"Roboto Slab", Georgia, serif');
assert.equal(context.url("Roboto Slab"), "https://fonts.googleapis.com/css2?family=Roboto+Slab&display=swap");

context.state.customScriptureFont = "Georgia, Charter";
assert.equal(context.stack(), '"Georgia", "Charter", Georgia, serif');

context.state.customScriptureFont = "system-ui";
assert.equal(context.stack(), "system-ui, Georgia, serif");

assert.match(source, /new FontFace\(font, `local\(/);
assert.match(source, /loadGoogleFontStylesheet\(font, request\)/);
assert.match(source, /Loaded \$\{font\} from Google Fonts/);
assert.match(source, /bindCustomScriptureFontInput\("presentationCustomScriptureFontInput"\)/);
assert.match(source, /retryFailedFont/);
assert.match(source, /Custom device or Google font/);
assert.match(source, /document\.documentElement\.style\.setProperty\("--custom-scripture-font", fontStack\)/);
assert.match(styles, /\.custom-font-status\[data-font-status="google"\]/);
assert.match(styles, /\.custom-font-status\[data-font-status="error"\]/);

console.log("Custom scripture font tests passed");
