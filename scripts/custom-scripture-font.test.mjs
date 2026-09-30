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

// Both surfaces retain independent selections, custom stacks, and loading status.
const saved = new Map();
Object.assign(context, {
  localStorage: { setItem: (key, value) => saved.set(key, value) },
  scheduleCloudSync() {},
  renderPreservingReaderScroll() {},
  window: { clearTimeout() {} },
  document: { querySelectorAll: () => [], getElementById: () => null },
});
vm.runInContext(`
  const scriptureFontCodes = ["lora", "figtree", "custom"];
  const customFontInputTimers = {};
  ${extractFunction("setScriptureFont")}
  ${extractFunction("createCustomFontLoader")}
  globalThis.readerLoader = createCustomFontLoader(false);
  globalThis.bigLoader = createCustomFontLoader(true);
  globalThis.setFont = setScriptureFont;
`, context);
context.state.scriptureFont = "lora";
context.setFont("figtree", true);
assert.equal(context.state.scriptureFont, "lora");
assert.equal(context.state.presentationScriptureFont, "figtree");
assert.equal(saved.get("lw_presentation_scripture_font"), "figtree");
context.setFont("custom");
context.setFont("custom", true);
context.state.customScriptureFont = "serif";
context.state.presentationCustomScriptureFont = "monospace";
await context.readerLoader.load();
await context.bigLoader.load();
assert.equal(context.readerLoader.state.family, "serif");
assert.equal(context.bigLoader.state.family, "monospace");
assert.equal(context.stack(true), "monospace, Georgia, serif");
context.setFont("lora");
await context.readerLoader.load();
assert.equal(context.readerLoader.state.status, "idle");
assert.equal(context.bigLoader.state.status, "ready");
assert.equal(context.state.presentationScriptureFont, "custom");
console.log("Independent Big Screen font settings and loaders passed");

// Keyboard viewport/inset changes must never replace a focused font field.
let pendingResize;
let renders = 0;
let fits = 0;
const listeners = {};
const fontInput = {
  value: 'Roboto Slab',
  matches: (selector) => selector.split(', ').includes('.custom-font-input'),
  addEventListener: (name, listener) => { listeners[name] = listener; },
};
const viewportDocument = {
  visibilityState: 'visible', activeElement: fontInput,
  documentElement: { dataset: {} },
  getElementById: () => fontInput,
};
const viewportContext = vm.createContext({
  state: { mode: 'reader' }, document: viewportDocument,
  clearTimeout: () => { pendingResize = null; },
  setTimeout: (callback) => { pendingResize = callback; return 1; },
  render: () => { renders++; },
  renderPreservingReaderScroll: () => { renders++; },
  fitPresentationText: () => { fits++; },
  queueCustomScriptureFont() {},
  commitCustomScriptureFont: (value) => { assert.equal(value, fontInput.value); },
});
vm.runInContext(`
  let presentationResizeTimer;
  let inputViewportRefreshPending = false;
  function scriptureSearchOwnsViewport() { return false; }
  ${extractFunction('deferViewportRefreshForActiveInput')}
  ${extractFunction('resumeViewportRefreshAfterInput')}
  ${extractFunction('renderAfterViewportChangePreservingReaderScroll')}
  ${extractFunction('schedulePresentationViewportFit')}
  ${extractFunction('bindCustomScriptureFontInput')}
`, viewportContext);
for (const mode of ['reader', 'parallel', 'big']) {
  viewportContext.state.mode = mode;
  viewportContext.bindCustomScriptureFontInput(mode === 'big' ? 'presentationCustomScriptureFontInput' : 'customScriptureFontInput');
  viewportDocument.activeElement = fontInput;
  for (let i = 0; i < 3; i++) viewportContext.renderAfterViewportChangePreservingReaderScroll();
  assert.equal(pendingResize, null, `${mode}: keyboard events do not schedule destructive rendering`);
  viewportDocument.activeElement = null;
  listeners.blur({ currentTarget: fontInput });
  assert.equal(typeof pendingResize, 'function', `${mode}: editing completion resumes layout`);
  const before = renders;
  pendingResize();
  assert.equal(renders, before + 1);
  // A resize queued before focus must also leave the newly focused input intact.
  viewportContext.renderAfterViewportChangePreservingReaderScroll();
  viewportDocument.activeElement = fontInput;
  pendingResize();
  assert.equal(renders, before + 1, `${mode}: delayed resize rechecks focus`);
}
viewportContext.schedulePresentationViewportFit(true);
assert.equal(viewportDocument.documentElement.dataset.presentationRotating, undefined, 'Editing during rotation cannot leave the screen hidden');
assert.ok(fits > 0, 'Presentation fitting resumes after editing');
for (const name of ['compactWidthQuery', 'shortLandscapeQuery']) {
  assert.ok(source.includes(`${name}?.addEventListener("change", () => {\n  if (deferViewportRefreshForActiveInput()) return;`), 'Keyboard-driven breakpoints preserve open settings');
}
console.log('Custom font keyboard resize, native insets, delayed render, and blur recovery passed');

// Big Screen search shares the same keyboard protection as custom fonts.
const searchInput = { value: 'John 3:16', matches: (selector) => selector.split(', ').includes('#presentationSearchInput') };
viewportContext.state.mode = 'big';
viewportDocument.activeElement = searchInput;
const beforeSearch = renders;
for (let i = 0; i < 4; i++) {
  viewportContext.schedulePresentationViewportFit(); // iOS visualViewport and web resize
  viewportContext.renderAfterViewportChangePreservingReaderScroll(); // Android insets
}
assert.equal(pendingResize, null);
assert.equal(renders, beforeSearch);
assert.equal(viewportDocument.activeElement, searchInput);
assert.equal(searchInput.value, 'John 3:16');
viewportDocument.activeElement = null;
viewportContext.resumeViewportRefreshAfterInput();
pendingResize();
assert.equal(renders, beforeSearch + 1, 'Search blur resumes presentation pagination');
viewportContext.schedulePresentationViewportFit();
viewportDocument.activeElement = searchInput;
pendingResize();
assert.equal(renders, beforeSearch + 1, 'Search focus also cancels a previously queued fit');
assert.ok(source.includes('document.getElementById("presentationSearchInput")?.addEventListener("blur", resumeViewportRefreshAfterInput)'));
console.log('Big Screen search keyboard resize, native insets, queued fit, and blur recovery passed');
