import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

if (!fs.existsSync(srcDir)) {
  console.log('[clean-generated-src-js] No src directory found, skipping.');
  process.exit(0);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(fullPath));
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function normalizeForGit(p) {
  return path.relative(rootDir, p).split(path.sep).join('/');
}

function loadTrackedFiles() {
  try {
    const raw = execFileSync('git', ['ls-files', '-z', 'src'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new Set(raw.split('\0').filter(Boolean));
  } catch {
    return new Set();
  }
}

function sourceExists(basePath) {
  if (fs.existsSync(basePath)) {
    const stat = fs.statSync(basePath);
    if (stat.isFile() && basePath.endsWith('.vue')) return true;
  }

  const tsLikeExts = ['.ts', '.tsx', '.mts', '.cts'];
  return tsLikeExts.some((ext) => fs.existsSync(`${basePath}${ext}`));
}

function isGeneratedArtifact(filePath) {
  if (filePath.endsWith('.js')) {
    return sourceExists(filePath.slice(0, -3));
  }
  if (filePath.endsWith('.js.map')) {
    return sourceExists(filePath.slice(0, -7));
  }
  return false;
}

const trackedFiles = loadTrackedFiles();
const deleted = [];

for (const filePath of walk(srcDir)) {
  const rel = normalizeForGit(filePath);
  if (trackedFiles.has(rel)) continue;
  if (!isGeneratedArtifact(filePath)) continue;

  fs.unlinkSync(filePath);
  deleted.push(rel);
}

if (deleted.length === 0) {
  console.log('[clean-generated-src-js] No generated src JS artifacts found.');
} else {
  console.log(`[clean-generated-src-js] Removed ${deleted.length} generated artifacts.`);
  for (const file of deleted.slice(0, 20)) {
    console.log(` - ${file}`);
  }
  if (deleted.length > 20) {
    console.log(` - ...and ${deleted.length - 20} more`);
  }
}
