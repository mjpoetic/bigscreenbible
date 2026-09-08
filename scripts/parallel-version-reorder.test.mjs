import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const start = source.indexOf("function reorderParallelVersion(");
const end = source.indexOf("function bindParallelVersionReordering(", start);
const calls = [];
const state = { mode: "parallel", versions: ["WEB", "YLT", "BSB"], sharedVersionOverride: { returnVersions: ["KJV"] } };
const context = vm.createContext({
  state,
  activeVersions: () => state.versions.slice(0, 3),
  clearSharedVersionOverride: () => { state.sharedVersionOverride = null; },
  rebuildBibleData: () => calls.push("rebuild"),
  persistVersions: ({ changed }) => { assert.equal(changed, true); calls.push([...state.versions]); },
  scheduleCloudSync: () => calls.push("sync"),
  renderPreservingReaderScroll: () => calls.push("render"),
  document: { querySelectorAll: () => [] },
  translationDisplayCode: (v) => v,
  showToast: () => {},
});
vm.runInContext(source.slice(start, end), context);
context.reorderParallelVersion("BSB", 0);
assert.deepEqual(state.versions, ["BSB", "WEB", "YLT"], "Moving last to first shifts both intervening versions");
assert.equal(state.sharedVersionOverride, null, "Explicit ordering adopts the displayed shared version");
assert.deepEqual(calls, ["rebuild", ["BSB", "WEB", "YLT"], "sync", "render"]);
context.reorderParallelVersion("BSB", 2);
assert.deepEqual(state.versions, ["WEB", "YLT", "BSB"]);
context.reorderParallelVersion("WEB", 1);
assert.deepEqual(state.versions, ["YLT", "WEB", "BSB"]);
calls.length = 0;
for (const [version, index] of [["WEB", 1], ["WEB", -1], ["WEB", 3], ["WEB", 0.5], ["KJV", 0]]) context.reorderParallelVersion(version, index);
state.mode = "reader";
context.reorderParallelVersion("BSB", 0);
assert.deepEqual(calls, [], "No-op, invalid, and stale-mode moves never persist");
assert.deepEqual(state.versions, ["YLT", "WEB", "BSB"]);
console.log("Parallel version reorder tests passed");
