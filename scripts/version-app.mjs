import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const version = String(process.argv[2] || "").trim();

if (!/^[a-z0-9._-]{1,80}$/i.test(version)) {
  throw new Error("Pass a release version containing only letters, numbers, dots, underscores, or hyphens.");
}

const versionPath = path.join(rootDir, "app-version.json");
writeFileSync(versionPath, `${JSON.stringify({ version }, null, 2)}\n`);

const htmlFiles = ["index.html", "about.html", "privacy/index.html", "terms/index.html"];
const firstPartyAssetPattern = /((?:\.\.\/|\.\/)assets\/[^"'?]+\.(?:css|js))\?v=[^"']+/gi;

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(rootDir, htmlFile);
  let html = readFileSync(htmlPath, "utf8");
  html = html.replace(firstPartyAssetPattern, `$1?v=${version}`);
  if (htmlFile === "index.html") {
    html = html.replace(
      /<meta name="app-version" content="[^"]*" \/>/,
      `<meta name="app-version" content="${version}" />`,
    );
  }
  writeFileSync(htmlPath, html);
}

console.log(`App release version set to ${version}`);
