import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

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

const context = {
  window: { innerWidth: 412, screen: { width: 412, height: 915 }, matchMedia: () => ({ matches: true }) },
  state: { textScale: 1 },
  document: { visibilityState: "visible" },
  presentationResizeTimer: null,
  pending: new Map(), nextId: 0, renders: 0,
};
context.setTimeout = callback => { const id = ++context.nextId; context.pending.set(id, callback); return id; };
context.clearTimeout = id => context.pending.delete(id);
context.renderPreservingReaderScroll = options => { assert.equal(options.preferLastReaderAnchor, true); context.renders++; };
vm.createContext(context);
vm.runInContext(["clamp", "computedTextFonts", "renderAfterViewportChangePreservingReaderScroll"].map(extractFunction).join("\n"), context);
for (const shortSide of [360, 390, 412, 480]) {
  for (const scale of [0.8, 1, 1.6]) {
    context.state.textScale = scale;
    context.window.screen = { width: shortSide, height: 915 };
    context.window.innerWidth = shortSide;
    const portrait = JSON.stringify(context.computedTextFonts());
    context.window.screen = { width: 915, height: shortSide };
    context.window.innerWidth = 915;
    assert.equal(JSON.stringify(context.computedTextFonts()), portrait, `Rotation preserves Reader and Parallel at ${shortSide}, scale ${scale}`);
  }
}
context.window.matchMedia = () => ({ matches: false });
context.window.innerWidth = 1440;
context.state.textScale = 1;
assert.equal(context.computedTextFonts().verse, 26.8, "Desktop sizing is preserved");
for (let i = 0; i < 4; i++) context.renderAfterViewportChangePreservingReaderScroll();
assert.equal(context.pending.size, 1, "Rotation event burst schedules one render");
for (const callback of context.pending.values()) callback();
assert.equal(context.renders, 1);
context.pending.clear();
context.renderAfterViewportChangePreservingReaderScroll();
context.document.visibilityState = "hidden";
for (const callback of context.pending.values()) callback();
assert.equal(context.renders, 1, "Pending rotation cannot redraw a background app");
console.log("Phone rotation sizing and render coalescing tests passed.");
