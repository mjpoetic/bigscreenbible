import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const versionPath = path.join(rootDir, "app-version.json");
const htmlFiles = ["index.html", "about.html", "privacy/index.html", "terms/index.html"];
const releaseManagedFiles = [
  ...htmlFiles,
  "assets/bible-app.css",
  "assets/bible-app.js",
  "assets/crossrefs.js",
  "assets/search-query.js",
  "assets/supabase-config.js",
  "assets/theme-catalog.js",
  "assets/trivia.js",
  "assets/verse-of-day.js",
];
const versionPattern = /^[a-z0-9._-]{1,80}$/i;
const assetVersionPattern = /(?:\.\.\/|\.\/)assets\/[^"'?]+\.(?:css|js)\?v=([^"']+)/gi;

function readVersion(contents, source) {
  let version = "";
  try {
    version = String(JSON.parse(contents)?.version || "").trim();
  } catch {
    throw new Error(`${source} is not valid JSON.`);
  }
  if (!versionPattern.test(version)) throw new Error(`${source} has a missing or invalid version.`);
  return version;
}

function git(args) {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
}

const currentVersion = readVersion(readFileSync(versionPath, "utf8"), "app-version.json");
const indexHtml = readFileSync(path.join(rootDir, "index.html"), "utf8");
const metaVersion = indexHtml.match(/<meta name="app-version" content="([^"]*)" \/>/)?.[1] || "";
if (metaVersion !== currentVersion) {
  throw new Error(`index.html app-version (${metaVersion || "missing"}) must match ${currentVersion}.`);
}

for (const htmlFile of htmlFiles) {
  const html = readFileSync(path.join(rootDir, htmlFile), "utf8");
  const versions = [...html.matchAll(assetVersionPattern)].map((match) => match[1]);
  const mismatches = versions.filter((version) => version !== currentVersion);
  if (mismatches.length) {
    throw new Error(`${htmlFile} has first-party CSS/JavaScript URLs that do not match ${currentVersion}.`);
  }
}

let baseRevision = String(process.argv[2] || "HEAD").trim();
if (/^0+$/.test(baseRevision)) baseRevision = "HEAD^";

let previousVersion;
try {
  previousVersion = readVersion(git(["show", `${baseRevision}:app-version.json`]), `${baseRevision}:app-version.json`);
} catch (error) {
  if (baseRevision === "HEAD" && !git(["diff", "--name-only", "HEAD", "--", ...releaseManagedFiles])) {
    console.log(`App release files are consistently versioned as ${currentVersion}.`);
    process.exit(0);
  }
  throw error;
}

const changedFiles = git(["diff", "--name-only", baseRevision, "--", ...releaseManagedFiles])
  .split("\n")
  .filter(Boolean);

if (changedFiles.length && previousVersion === currentVersion) {
  throw new Error([
    `App-shell files changed without advancing app-version.json from ${currentVersion}:`,
    ...changedFiles.map((file) => `- ${file}`),
    "Run: npm run version:app -- <new-version>",
  ].join("\n"));
}

console.log(changedFiles.length
  ? `App release advanced from ${previousVersion} to ${currentVersion}.`
  : `App release files are consistently versioned as ${currentVersion}.`);
