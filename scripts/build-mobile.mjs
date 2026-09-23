import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "www");

const entries = [
  "index.html",
  "404.html",
  "app-version.json",
  "about.html",
  "privacy",
  "terms",
  "favicon.ico",
  "site.webmanifest",
  "push-sw.js",
  "assets",
];

rmSync(outDir, { force: true, recursive: true });
mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(rootDir, entry);
  if (!existsSync(source)) {
    throw new Error(`Missing required mobile build entry: ${entry}`);
  }

  cpSync(source, path.join(outDir, entry), {
    filter: (sourcePath) => path.basename(sourcePath) !== ".DS_Store",
    recursive: true,
  });
}

for (const htmlFile of ["index.html", "about.html"]) {
  const htmlPath = path.join(outDir, htmlFile);
  const html = readFileSync(htmlPath, "utf8");
  writeFileSync(
    htmlPath,
    html.replace(
      /content="width=device-width,\s*initial-scale=1(?:\.0)?,\s*viewport-fit=cover"/,
      'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"',
    ),
  );
}

// The fallback must not wait for CDN scripts or font stylesheets to time out.
// Account authentication stays on the live origin; the offline reader preserves
// account-owned local data without loading an auth client or copying tokens.
const offlineHTML = readFileSync(path.join(outDir, "index.html"), "utf8")
  .replace(/<script\b[^>]*\bsrc="https:\/\/[^\"]*"[^>]*><\/script>/g, "")
  .replace(/<link\b[^>]*\bhref="https:\/\/fonts\.[^\"]*"[^>]*>/g, "")
  .replace("</head>", '<link rel="stylesheet" href="./assets/fonts/offline.css" />\n</head>');
writeFileSync(path.join(outDir, "offline.html"), offlineHTML);
const versions = ["BSB", "KJV", "WEB", "ASV", "BBE", "YLT"].map(code => {
  const data = readFileSync(path.join(outDir, "assets/bibles", `${code}.js`));
  return { code, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
});
writeFileSync(path.join(outDir, "offline-bibles.json"), JSON.stringify({
  version: JSON.parse(readFileSync(path.join(rootDir, "app-version.json"), "utf8")).version,
  versions,
}));

console.log(`Mobile web assets copied to ${path.relative(rootDir, outDir)}/`);
