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

const context = {};
vm.createContext(context);
vm.runInContext(`
  const translationCodes = ["ASV", "BSB", "KJV", "NIV", "WEB"];
  const bundledTranslations = new Set(["ASV", "BSB", "KJV", "WEB"]);
  const isBundledTranslation = (version) => bundledTranslations.has(version);
  ${extractFunction("uniqueList")}
  ${extractFunction("mergeVersions")}
  ${extractFunction("normalizedVersions")}
  ${extractFunction("normalizedVersionsUpdatedAt")}
  ${extractFunction("latestVersionSettings")}
  globalThis.normalize = normalizedVersions;
  globalThis.latest = latestVersionSettings;
`, context);

const normalized = (versions) => [...context.normalize(versions)];
const latest = (cloudSettings, localSettings) => {
  const result = context.latest(cloudSettings, localSettings);
  return { ...result, versions: [...result.versions] };
};

assert.deepEqual(normalized(["ASV", "WEB"]), ["ASV", "WEB"]);
assert.deepEqual(normalized(["NIV"]), ["BSB", "NIV"]);
assert.deepEqual(normalized([]), ["BSB", "KJV"]);

const localEdit = latest(
  { versions: ["BSB", "KJV", "WEB"], versionsUpdatedAt: "2026-07-22T12:00:00.000Z" },
  { versions: ["BSB", "WEB"], versionsUpdatedAt: "2026-07-22T12:01:00.000Z" },
);
assert.deepEqual(localEdit.versions, ["BSB", "WEB"]);
assert.equal(localEdit.versionsUpdatedAt, "2026-07-22T12:01:00.000Z");

const cloudEdit = latest(
  { versions: ["ASV", "WEB"], versionsUpdatedAt: "2026-07-22T12:02:00.000Z" },
  { versions: ["BSB", "KJV"], versionsUpdatedAt: "2026-07-22T12:01:00.000Z" },
);
assert.deepEqual(cloudEdit.versions, ["ASV", "WEB"]);

const legacyMerge = latest(
  { versions: ["BSB", "KJV"] },
  { versions: ["BSB", "WEB"] },
);
assert.deepEqual(legacyMerge.versions, ["BSB", "KJV", "WEB"]);
assert.equal(legacyMerge.versionsUpdatedAt, "");

const applyCloudSnapshotSource = extractFunction("applyCloudSnapshot");
assert.match(applyCloudSnapshotSource, /state\.versions = versionsWithSharedVersionOverride\(settings\.versions\)/);
assert.match(extractFunction("versionsWithSharedVersionOverride"), /const baseVersions = normalizedVersions\(versions\)/);
assert.doesNotMatch(applyCloudSnapshotSource, /state\.versions = mergeVersions/);
assert.match(
  source,
  /code: "NIRV", displayCode: "NIrV", name: "New International Reader's Version", provider: "youVersion"/,
);
assert.match(source, /recommendation: "Great for children & new readers"/);

console.log("Version sync tests passed");
