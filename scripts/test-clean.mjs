#!/usr/bin/env node
/**
 * Clean the test system's traces from the machine.
 *
 * The rule this script enforces:
 *
 *   A test run may leave artefacts behind; it must never leave the *sources*
 *   behind in the repository, and it must never leave megabytes of cache
 *   behind on the machine.
 *
 * So after a run (wired up as `posttest` / `posttest:e2e` in package.json):
 *   - the generated reports and coverage are removed;
 *   - the caches the run filled are removed;
 *   - the scratch files an agent wrote into the project root are removed.
 *
 * The test *sources* are a different matter. They are local-only by design
 * (`.gitignore` keeps them out of the repository), and they are worth
 * keeping: they are the only copy, because they are not in git. Deleting
 * them is therefore opt-in:
 *
 *   npm run test:purge
 *
 * which archives them to the system temp directory first and only then
 * removes them. Nothing is ever deleted that git tracks.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const purgeSources = process.argv.includes('--purge-sources');
const deep = process.argv.includes('--all');

/** Directories a test run fills. All of them are regenerated on demand. */
const ARTIFACT_DIRS = [
  'coverage',
  'playwright-report',
  'test-results',
  'blob-report',
  '.playwright',
  'node_modules/.cache',
];

/** Scratch files an agent or a script leaves in the project root. */
const SCRATCH_PATTERN = /^(.*_out|-out|out|scratch_.*|.*_report|.*\.tmp)\.(txt|log|json)$/i;

/** Never touched, whatever the arguments say. */
const PROTECTED = new Set(['.git', 'node_modules', 'public', 'docs', 'scripts', 'lib', 'pages', 'components']);

const removed = [];
const failures = [];

function sizeOf(target) {
  try {
    const stat = fs.lstatSync(target);
    if (!stat.isDirectory()) return stat.size;
    let total = 0;
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      total += sizeOf(path.join(target, entry.name));
    }
    return total;
  } catch {
    return 0;
  }
}

function remove(target, { protectSources = true } = {}) {
  const relative = path.relative(projectRoot, target);
  const top = relative.split(path.sep)[0];

  if (!relative || relative.startsWith('..')) return false;
  if (PROTECTED.has(top) && top !== 'node_modules') return false;
  if (protectSources && (top === 'tests' || top === '__tests__')) return false;

  if (!fs.existsSync(target)) return false;

  const bytes = sizeOf(target);
  try {
    fs.rmSync(target, { recursive: true, force: true });
    removed.push({ target: relative, bytes });
    return true;
  } catch (error) {
    failures.push(`${relative}: ${error.message}`);
    return false;
  }
}

/** The files git tracks. Nothing on that list is ever removed. */
function trackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    return new Set(output.split('\0').filter(Boolean));
  } catch {
    return new Set();
  }
}

const tracked = trackedFiles();

/* ------------------------------------------------------------------ *
 * 1. The artefacts a run produced
 * ------------------------------------------------------------------ */
for (const relative of ARTIFACT_DIRS) {
  // CI uploads the coverage report as an artefact, so it is left alone there.
  if (relative === 'coverage' && process.env.CI) continue;
  remove(path.join(projectRoot, relative));
}

/* The build cache is not a test artefact, but it is still a cache. It is
 * only removed when the caller asks for a deep clean. */
if (deep) {
  remove(path.join(projectRoot, '.next/cache'));
}

/* ------------------------------------------------------------------ *
 * 2. The caches outside the project
 * ------------------------------------------------------------------ */
for (const entry of fs.readdirSync(os.tmpdir(), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (!entry.name.startsWith('jest_')) continue;
  const target = path.join(os.tmpdir(), entry.name);
  const bytes = sizeOf(target);
  try {
    fs.rmSync(target, { recursive: true, force: true });
    removed.push({ target: path.join(os.tmpdir(), entry.name), bytes });
  } catch {
    /* a locked cache file is not worth failing over */
  }
}

/* ------------------------------------------------------------------ *
 * 3. Scratch files in the project root
 * ------------------------------------------------------------------ */
for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!SCRATCH_PATTERN.test(entry.name)) continue;
  const relative = entry.name;
  if (tracked.has(relative)) continue;
  remove(path.join(projectRoot, relative));
}

/* ------------------------------------------------------------------ *
 * 4. The test sources - only when the caller explicitly asks
 * ------------------------------------------------------------------ */
let archive = null;
if (purgeSources) {
  const source = path.join(projectRoot, 'tests');
  if (fs.existsSync(source)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    archive = path.join(os.tmpdir(), `smart-dental-atelier-tests-${stamp}.tar.gz`);

    try {
      execFileSync('tar', ['-czf', archive, '-C', projectRoot, 'tests'], { stdio: 'pipe' });
    } catch (error) {
      archive = null;
      failures.push(`archive failed: ${error.message} - the sources were left in place`);
    }

    if (archive && fs.existsSync(archive)) {
      remove(source, { protectSources: false });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
const freed = removed.reduce((sum, item) => sum + item.bytes, 0);
const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

if (removed.length === 0) {
  console.log('[test:clean] nothing to remove.');
} else {
  console.log(`[test:clean] removed ${removed.length} item(s), freed ${mb(freed)}:`);
  for (const item of removed) {
    console.log(`  - ${item.target} (${mb(item.bytes)})`);
  }
}

if (archive) {
  console.log(`[test:clean] archived the test sources to:\n  ${archive}`);
  console.log('[test:clean] restore with: tar -xzf <archive> -C <project root>');
}

if (failures.length > 0) {
  console.log('[test:clean] could not remove:');
  for (const failure of failures) console.log(`  - ${failure}`);
}

// A cleanup that cannot finish must not fail the test run it follows.
process.exit(0);
