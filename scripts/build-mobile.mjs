import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "www");

const entries = [
  "index.html",
  "about.html",
  "favicon.ico",
  "site.webmanifest",
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

console.log(`Mobile web assets copied to ${path.relative(rootDir, outDir)}/`);
