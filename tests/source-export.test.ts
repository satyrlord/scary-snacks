import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFiles } from '../tools/export-source.ts';

const root = new URL('../', import.meta.url);

test('each relative TypeScript import in the source export names an exported file', async () => {
  const exported = new Set(sourceFiles);
  for (const file of sourceFiles.filter(path => path.endsWith('.ts'))) {
    const text = await readFile(new URL(file, root), 'utf8');
    for (const [, target] of text.matchAll(/^(?:import|export)\s+(?:[^;'"\n]*\sfrom\s*)?['"](\.{1,2}\/[^'"\n]+\.ts)['"]/gm)) {
      const path = join(dirname(file), target).replaceAll('\\', '/');
      assert.ok(exported.has(path), `${file} imports ${target}, which the source export leaves out`);
    }
  }
});

test('each relative link in an exported document names an exported file', async () => {
  const exported = new Set(sourceFiles);
  for (const file of sourceFiles.filter(path => path.endsWith('.md'))) {
    const text = await readFile(new URL(file, root), 'utf8');
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(#|[a-z]+:)/.test(target)) continue;
      const path = join(dirname(file), target.split('#')[0]).replaceAll('\\', '/');
      assert.ok(exported.has(path), `${file} links to ${target}, which the source export leaves out`);
    }
  }
});

test('no exported file comes from a local folder, and no code or test reads the private documents', async () => {
  assert.ok(sourceFiles.every(path => !/^(private|analysis)\//.test(path)));
  const self = fileURLToPath(import.meta.url);
  for (const folder of ['src', 'tools', 'tests', '.github']) {
    for (const entry of await readdir(new URL(`${folder}/`, root), { recursive: true, withFileTypes: true })) {
      const path = join(entry.parentPath, entry.name);
      if (!entry.isFile() || !/\.(ts|yml|ps1)$/.test(entry.name) || path === self) continue;
      assert.doesNotMatch(await readFile(path, 'utf8'), /private[\\/]docs/, path);
    }
  }
});

test('the source export keeps the ignore rules for the local key and the local folders', async () => {
  assert.ok(sourceFiles.includes('.gitignore'));
  const rules = (await readFile(new URL('.gitignore', root), 'utf8')).split(/\r?\n/);
  for (const rule of ['.env.local', 'private/', 'analysis/', '.release/', '.tools/']) assert.ok(rules.includes(rule), rule);
});
