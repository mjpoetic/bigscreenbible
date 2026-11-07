import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function canonicalAssetPath(relative) {
  return relative.replace(/ \d+(\.[^/.]+)$/, '$1');
}

// Only generated trees are passed here. Preserve every displaced copy, including
// stale copies whose contents differ, and never remove an authored numbered file.
export function cleanGeneratedAssets(directory, { authoredRoot, backupRoot } = {}) {
  const removed = [];
  if (!existsSync(directory)) return removed;
  function visit(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      const relative = path.relative(directory, file);
      const canonical = canonicalAssetPath(relative);
      if (relative === canonical || !existsSync(path.join(directory, canonical))) continue;
      if (authoredRoot && existsSync(path.join(authoredRoot, relative))) continue;
      const target = path.join(backupRoot, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      const bytes = statSync(file).size;
      renameSync(file, target);
      removed.push({ relative, bytes });
    }
  }
  visit(directory);
  return removed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const backup = mkdtempSync(path.join(tmpdir(), 'bsb-generated-duplicates-'));
  let count = 0;
  for (const relative of ['www', 'ios/App/App/public', 'android/app/src/main/assets/public', 'android/app/src/main/res/xml']) {
    const removed = cleanGeneratedAssets(path.join(root, relative), {
      authoredRoot: relative === 'android/app/src/main/res/xml' ? undefined : root, backupRoot: path.join(backup, relative),
    });
    count += removed.length;
    console.log(`${relative}: preserved ${removed.length} duplicate copies outside the build.`);
  }
  console.log(`${count} copies moved to ${backup}`);
}
