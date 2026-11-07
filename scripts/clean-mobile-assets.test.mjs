import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cleanGeneratedAssets } from './clean-mobile-assets.mjs';
const root = mkdtempSync(path.join(tmpdir(), 'bsb-assets-test-'));
try {
  const generated = path.join(root, 'generated');
  const authored = path.join(root, 'source');
  const backup = path.join(root, 'backup');
  for (const dir of [generated, authored]) mkdirSync(path.join(dir, 'assets'), { recursive: true });
  const write = (base, name, text) => writeFileSync(path.join(base, 'assets', name), text);
  write(generated, 'Bible.js', 'current');
  write(generated, 'Bible 2.js', 'current');
  write(generated, 'Bible 3.js', 'stale');
  write(generated, 'Lesson.txt', 'lesson');
  write(generated, 'Lesson 2.txt', 'authored sequel');
  write(authored, 'Lesson 2.txt', 'authored sequel');
  write(generated, 'Only 2.txt', 'no canonical file');
  const removed = cleanGeneratedAssets(generated, { authoredRoot: authored, backupRoot: backup });
  assert.equal(removed.length, 2);
  assert.equal(readFileSync(path.join(backup, 'assets/Bible 3.js'), 'utf8'), 'stale');
  assert.equal(readFileSync(path.join(generated, 'assets/Bible.js'), 'utf8'), 'current');
  assert.ok(!existsSync(path.join(generated, 'assets/Bible 2.js')));
  assert.ok(existsSync(path.join(generated, 'assets/Lesson 2.txt')));
  assert.ok(existsSync(path.join(generated, 'assets/Only 2.txt')));
  assert.equal(cleanGeneratedAssets(generated, { authoredRoot: authored, backupRoot: backup }).length, 0);
  console.log('Generated asset cleanup: identical and stale copies preserved; originals, authored numbered files, and unmatched files retained.');
} finally { rmSync(root, { recursive: true, force: true }); }
