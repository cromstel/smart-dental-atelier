/**
 * Image optimisation pipeline.
 *
 * Every raster image under `public/images` is transcoded to WebP and the
 * source file is deleted, so the repository and the deployed `public/` folder
 * contain exactly one format. References in source files are rewritten to the
 * new extension in the same pass, which is what makes it safe to run
 * repeatedly (it is idempotent — a second run finds nothing left to do).
 *
 * Run directly, or automatically before `dev` / `build`:
 *
 *   npm run images:optimize
 *
 * Two files are deliberately exempt (see KEEP_AS_IS): `favicon.ico` must keep
 * its extension for legacy browsers, and the Apple touch icon is served to
 * iOS Safari versions that do not all accept WebP for that role.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGE_DIR = path.join(ROOT, 'public', 'images');

/** Extensions we transcode to WebP. */
const CONVERTIBLE = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif']);

/** Files that must keep their original format. */
const KEEP_AS_IS = new Set(['favicon.ico', 'apple-touch-icon.png']);

/** Directories scanned for source references. */
const SOURCE_DIRS = ['components', 'lib', 'pages', 'styles', 'prisma', 'scripts'];
const SOURCE_FILES = ['README.md', 'tailwind.config.js', 'playwright.config.js', 'next.config.js'];

const QUALITY = 82;
const EFFORT = 6;

/** @returns {Promise<string[]>} absolute paths of files that were converted */
async function convertImages() {
  let entries = [];
  try {
    entries = await fs.readdir(IMAGE_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('• public/images does not exist — nothing to do');
      return [];
    }
    throw error;
  }

  /** @type {{from: string, to: string, before: number, after: number, width: number, height: number}[]} */
  const converted = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const name = entry.name;
    const ext = path.extname(name).toLowerCase();

    if (!CONVERTIBLE.has(ext)) continue;
    if (KEEP_AS_IS.has(name)) continue;

    // Already-optimised assets pass straight through.
    if (ext === '.webp') continue;

    const source = path.join(IMAGE_DIR, name);
    const target = path.join(IMAGE_DIR, `${path.basename(name, ext)}.webp`);

    const input = sharp(source, { failOn: 'none' });
    const metadata = await input.metadata();

    // `.rotate()` applies the EXIF orientation; without it, photos taken in
    // portrait come out sideways. `.withMetadata()` keeps the ICC profile so
    // colours do not shift, then the transform strips the metadata bulk.
    const output = await sharp(source, { failOn: 'none' })
      .rotate()
      .webp({ quality: QUALITY, effort: EFFORT, smartSubsample: true })
      .toBuffer();

    await fs.writeFile(target, output);

    const before = (await fs.stat(source)).size;
    await fs.rm(source);

    converted.push({
      from: name,
      to: path.basename(target),
      before,
      after: output.length,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    });
  }

  return converted;
}

/** Every file that may contain an image reference, searched recursively. */
async function collectSourceFiles() {
  /** @type {string[]} */
  const files = [];

  /** Recursively walk a directory, collecting source files. */
  const walk = async (dir) => {
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Never descend into build output or dependencies.
        if (['node_modules', '.next', 'generated', 'coverage'].includes(entry.name)) continue;
         
        await walk(absolute);
      } else if (entry.isFile() && /\.(js|mjs|jsx|css|ts|tsx|json|md)$/i.test(entry.name)) {
        files.push(absolute);
      }
    }
  };

  // Recursion matters: components/layout, pages/admin, pages/api, pages/portal
  // and friends are all nested a level down.
  for (const dir of SOURCE_DIRS) {
     
    await walk(path.join(ROOT, dir));
  }

  for (const name of SOURCE_FILES) {
    const absolute = path.join(ROOT, name);
    try {
      await fs.access(absolute);
      files.push(absolute);
    } catch {
      /* optional */
    }
  }

  return files;
}

/**
 * Repairs references to source images that no longer exist on disk.
 *
 * Scans source text for any `/images/<name>.<ext>` path where `<ext>` is a
 * convertible raster format, and rewrites it to `<name>.webp` when that file
 * exists. This makes the pipeline self-healing: if a reference escaped the
 * conversion rewrite, or a developer typed a `.jpg` path by hand after the
 * originals were deleted, the next run fixes it instead of shipping a broken
 * `<Image src>`.
 *
 * @param {string[]} files
 * @returns {Promise<{files: number, replacements: number}>}
 */
async function repairDanglingReferences(files) {
  const available = new Set();
  for (const entry of await fs.readdir(IMAGE_DIR, { withFileTypes: true })) {
    if (entry.isFile()) available.add(entry.name);
  }

  let replacements = 0;
  let touched = 0;

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;

    // Match an images/ path with a convertible extension.
    updated = updated.replace(
      /(\/images\/[A-Za-z0-9._-]+?)\.(jpg|jpeg|png|bmp|tiff?)(\b)/gi,
      (match, stem, ext) => {
        const base = path.basename(stem);
        // The referenced file must be gone and a .webp sibling must exist.
        if (available.has(`${base}.${ext.toLowerCase()}`)) return match;
        const sibling = `${base}.webp`;
        if (!available.has(sibling)) return match;
        // Never rewrite a format we deliberately keep (apple-touch-icon.png).
        if (KEEP_AS_IS.has(`${base}.${ext.toLowerCase()}`)) return match;
        replacements += 1;
        return `${stem}.webp`;
      },
    );

    if (updated !== original) {
      await fs.writeFile(file, updated);
      touched += 1;
    }
  }

  return { files: touched, replacements };
}

/**
 * Rewrites `<name>.jpg` -> `<name>.webp` references in source files.
 * @param {{from: string, to: string}[]} conversions
 */
async function rewriteReferences(conversions) {
  const files = await collectSourceFiles();
  let touchedFiles = 0;
  let totalReplacements = 0;

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;

    for (const { from, to } of conversions) {
      // Only replace the extension when the basename matches exactly, so
      // `hero-sexy.webp` never rewrites a path like `photos/hero-sexy.webp.bak`.
      const base = path.basename(from, path.extname(from));
      const pattern = new RegExp(`(${escapeRegExp(base)})\\.(jpg|jpeg|png|bmp|tiff?)`, 'gi');
      updated = updated.replace(pattern, `$1.${path.extname(to).replace('.', '')}`);
    }

    if (updated !== original) {
      await fs.writeFile(file, updated);
      touchedFiles += 1;
      const count = conversions.filter(({ from }) =>
        new RegExp(`${escapeRegExp(path.basename(from, path.extname(from)))}\\.webp`, 'i').test(updated),
      ).length;
      totalReplacements += count;
    }
  }

  return { touchedFiles, totalReplacements };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function main() {
  console.log('Optimising images to WebP…');

  const conversions = await convertImages();

  if (conversions.length === 0) {
    console.log('• All images are already WebP — nothing to convert');
  } else {
    const before = conversions.reduce((sum, c) => sum + c.before, 0);
    const after = conversions.reduce((sum, c) => sum + c.after, 0);
    const saved = before - after;
    const percent = before === 0 ? 0 : Math.round((saved / before) * 100);

    console.log(`• Converted ${conversions.length} file(s):`);
    for (const { from, to, before: b, after: a } of conversions) {
      console.log(`    ${from} → ${to}   ${kb(b)} → ${kb(a)}`);
    }
    console.log(`• Total ${kb(before)} → ${kb(after)} (saved ${kb(saved)}, ${percent}%)`);
  }

  const { touchedFiles } = await rewriteReferences(conversions);
  console.log(`• Updated references in ${touchedFiles} file(s)`);

  // Self-heal any reference still pointing at a source image that is gone.
  const repair = await repairDanglingReferences(await collectSourceFiles());
  if (repair.replacements > 0) {
    console.log(`• Repaired ${repair.replacements} dangling reference(s) in ${repair.files} file(s)`);
  }

  const remaining = (await fs.readdir(IMAGE_DIR)).filter((name) =>
    CONVERTIBLE.has(path.extname(name).toLowerCase()),
  );
  if (remaining.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Non-WebP images remain in public/images: ${remaining.join(', ')}. ` +
        'Check the KEEP_AS_IS list in scripts/optimize-images.mjs.',
    );
  }
}

main().catch((error) => {
  console.error(`\nImage optimisation failed: ${error.message}`);
  process.exitCode = 1;
});