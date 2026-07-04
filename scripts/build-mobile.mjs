import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

console.log(`Mobile web assets copied to ${path.relative(rootDir, outDir)}/`);
