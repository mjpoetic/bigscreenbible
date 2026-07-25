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
assert.match(rememberSource, /flushReaderPositionPersistence\(\)/);
assert.match(rememberSource, /preferredViewportReaderScrollAnchor\(\)/);
assert.match(rememberSource, /clearTimeout\(readerViewportRestoreTimer\)/);

const restoreSource = extractFunction("restoreReaderScrollAfterAppSwitch");
assert.match(restoreSource, /scrollState\.mode !== state\.mode/);
assert.match(restoreSource, /scrollState\.reference !== state\.reference/);
assert.match(restoreSource, /requestAnimationFrame/);
assert.match(restoreSource, /setTimeout/);
assert.match(restoreSource, /readerAppResumeRestoreWindowMs/);

const context = {};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("normalizedStoredReaderPosition")}
  globalThis.normalize = normalizedStoredReaderPosition;
`, context);
const normalized = context.normalize({
  mode: "reader",
  reference: "James 1",
  scriptureTop: 812,
  activeVerse: 22,
  savedAt: 123,
  readerAnchor: { mode: "reader", reference: "James 1", verse: "22", offset: 48 },
});
assert.equal(normalized.mode, "reader");
assert.equal(normalized.reference, "James 1");
assert.equal(normalized.scriptureTop, 812);
assert.equal(normalized.activeVerse, 22);
assert.equal(normalized.readerAnchor.verse, "22");
assert.equal(context.normalize({ mode: "big", reference: "James 1" }), null);
assert.equal(context.normalize({ mode: "reader", reference: "James 1", scriptureTop: 10 }), null);

assert.match(
  source,
  /document\.visibilityState === "hidden"[\s\S]*?rememberReaderScrollBeforeAppSwitch\(\)[\s\S]*?restoreReaderScrollAfterAppSwitch\(\)/,
);
assert.match(source, /window\.addEventListener\("pagehide", rememberReaderScrollBeforeAppSwitch\)/);
assert.match(source, /window\.addEventListener\("pageshow", \(\) => \{[\s\S]*?restoreReaderScrollAfterAppSwitch\(\{ allowStored: isStandaloneWebApp\(\) \}\)/);
assert.match(source, /window\.addEventListener\("blur", \(\) => \{[\s\S]*?isStandaloneWebApp\(\)[\s\S]*?rememberReaderScrollBeforeAppSwitch\(\)/);
assert.match(source, /window\.addEventListener\("focus", \(\) => \{[\s\S]*?isStandaloneWebApp\(\)[\s\S]*?allowStored: true/);
assert.match(source, /window\.setInterval\(readerLifecycleHeartbeatTick, readerLifecycleHeartbeatIntervalMs\)/);
assert.match(extractFunction("readerLifecycleHeartbeatTick"), /elapsed > readerLifecycleResumeGapMs/);
assert.match(extractFunction("handleReaderScrollPositionChange"), /unexpectedTopReset/);
assert.match(extractFunction("scheduleReaderPositionPersistence"), /captureReaderScroll\(\{ preferLastReaderAnchor: true \}\)/);

const heartbeatContext = {};
vm.createContext(heartbeatContext);
vm.runInContext(`
  const Date = { now: () => 2600 };
  let readerLifecycleHeartbeatAt = 1000;
  const readerLifecycleResumeGapMs = 1200;
  const dataLoading = false;
  const dataError = "";
  const state = { mode: "reader" };
  const isStandaloneWebApp = () => true;
  let restores = 0;
  const restoreReaderScrollAfterAppSwitch = (options) => {
    if (options.allowStored) restores += 1;
  };
  ${extractFunction("readerLifecycleHeartbeatTick")}
  readerLifecycleHeartbeatTick();
  globalThis.result = { restores, heartbeat: readerLifecycleHeartbeatAt };
`, heartbeatContext);
assert.equal(heartbeatContext.result.restores, 1);
assert.equal(heartbeatContext.result.heartbeat, 2600);

const resetContext = {};
vm.createContext(resetContext);
vm.runInContext(`
  const Date = { now: () => 5000 };
  const document = { querySelector: () => ({ scrollTop: 0 }) };
  const protectedPosition = {
    mode: "reader",
    reference: "James 1",
    scriptureTop: 812,
  };
  const protectedReaderPosition = () => protectedPosition;
  let readerAppVisibilityScrollState = null;
  let readerUserScrollIntentUntil = 0;
  let restores = 0;
  let refreshes = 0;
  let persists = 0;
  const restoreReaderScrollAfterAppSwitch = () => { restores += 1; };
  const refreshLastReaderScrollAnchor = () => { refreshes += 1; };
  const scheduleReaderPositionPersistence = () => { persists += 1; };
  ${extractFunction("handleReaderScrollPositionChange")}
  handleReaderScrollPositionChange();
  globalThis.result = { restores, refreshes, persists, restoredState: readerAppVisibilityScrollState };
`, resetContext);
assert.equal(resetContext.result.restores, 1);
assert.equal(resetContext.result.refreshes, 0);
assert.equal(resetContext.result.persists, 0);
assert.equal(resetContext.result.restoredState.scriptureTop, 812);

console.log("Reader lifecycle scroll tests passed");
