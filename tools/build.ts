import { mkdir, readdir, readFile, writeFile, rm, lstat, realpath } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

// Keep this list explicit: only the authored runtime files are inputs.
export const runtimeFiles = ['index.html', 'src/app.ts', 'src/art.ts', 'src/board.ts', 'src/content.ts', 'src/dialog.ts', 'src/dishes.ts', 'src/dom.ts', 'src/engine.ts', 'src/model.ts', 'src/options.ts', 'src/preferences.ts', 'src/room.ts', 'src/session.ts', 'src/storage.ts', 'src/story.ts', 'src/style.css', 'src/tickets.ts'];
export const fontFiles = ['assets/fonts/inter-variable.woff2', 'assets/fonts/grenze-gotisch-variable.woff2', 'assets/fonts/OFL-Inter.txt', 'assets/fonts/OFL-Grenze-Gotisch.txt'];
// The PNG masters are not shipped; the build publishes their AVIF and WebP variants (npm run assets:build).
export const variantTypes = new Set(['.avif', '.webp']);

export const sha256 = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');

/** Browsers cannot run TypeScript, so each runtime module is published as a script under this name. */
export const publishedPath = (path: string) => path.replace(/\.ts$/, '.js');

/**
 * Makes the published bytes of one runtime file. Types are replaced with spaces, so lines and columns
 * stay those of the source. The type check keeps the sources to syntax that this removal supports.
 */
export function compile(path: string, bytes: Buffer): Buffer {
  if (path.endsWith('.ts')) {
    const script = stripTypeScriptTypes(bytes.toString('utf8'));
    // Relative imports must name the published modules.
    return Buffer.from(script.replace(/(\b(?:from|import)\s*\(?\s*['"]\.{1,2}\/[^'"\n]+)\.ts(['"])/g, '$1.js$2'));
  }
  if (path.endsWith('.html')) return Buffer.from(bytes.toString('utf8').replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"'));
  return bytes;
}

export async function build(project = resolve(import.meta.dirname, '..')) {
  const root = await realpath(project);
  const output = resolve(root, 'dist');
  const inputs = runtimeFiles.map(path => ({ source: path, target: publishedPath(path) }));
  inputs.push(...fontFiles.map(path => ({ source: `public/${path}`, target: path })));
  inputs.push({ source: 'public/data/game.json', target: 'data/game.json' });
  async function collect(directory: string) {
    const info = await lstat(resolve(root, directory));
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unapproved asset directory: ${directory}`);
    // Sorted names keep the manifest in one order on every file system.
    for (const entry of (await readdir(resolve(root, directory), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const source = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await collect(source);
      else if (entry.isFile() && variantTypes.has(extname(entry.name))) inputs.push({ source, target: source.slice('public/'.length) });
      else throw new Error(`Unapproved image variant: ${source}`);
    }
  }
  await collect('public/assets/variants');
  // Validate and compile all inputs before replacing an existing build. Symlinks are excluded.
  const files = [];
  for (const input of inputs) {
    const source = resolve(root, input.source);
    const actual = await realpath(source);
    if (!(await lstat(source)).isFile() || actual !== source) throw new Error(`Unapproved build input: ${input.source}`);
    files.push({ ...input, bytes: compile(input.source, await readFile(source)) });
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const manifest = [];
  for (const file of files) {
    const target = resolve(output, file.target);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
    manifest.push({ path: file.target, bytes: file.bytes.length, sha256: sha256(file.bytes) });
  }
  await writeFile(resolve(output, '.nojekyll'), '');
  manifest.push({ path: '.nojekyll', bytes: 0, sha256: sha256('') });
  await mkdir(resolve(root, 'analysis'), { recursive: true });
  await writeFile(resolve(root, 'analysis/build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (import.meta.main) {
  const manifest = await build();
  console.log(`Built ${manifest.length} files (${(manifest.reduce((n, f) => n + f.bytes, 0) / 1024 / 1024).toFixed(1)} MiB). Only the authored runtime, the game data, the AVIF and WebP variants in public/assets/variants, and the licensed fonts are included.`);
}
