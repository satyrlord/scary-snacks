import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFiles } from '../tools/export-source.ts';

const root = new URL('../', import.meta.url);

test('the source export includes every product test and excludes skill-specific tests', async () => {
  const skillTests = new Set(['tests/art-image.test.ts']);
  const exported = new Set(sourceFiles);
  for (const entry of await readdir(new URL('tests/', root), { recursive: true })) {
    const path = `tests/${entry.replaceAll('\\', '/')}`;
    if (!/\.(test|spec)\.ts$/.test(path)) continue;
    assert.equal(exported.has(path), !skillTests.has(path), path);
  }
});

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

test('the exported dead-code command rejects an unused development dependency', async t => {
  assert.ok(sourceFiles.includes('.fallowrc.json'));
  const fixture = await mkdtemp(join(tmpdir(), 'scary-snacks-deadcode-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const { scripts } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const [command, ...args] = scripts.deadcode.split(/\s+/);
  assert.equal(command, 'fallow');
  await writeFile(join(fixture, '.fallowrc.json'), await readFile(new URL('.fallowrc.json', root)));
  await writeFile(join(fixture, 'package.json'), JSON.stringify({
    name: 'deadcode-fixture', type: 'module', scripts: { start: 'node main.ts' },
    devDependencies: { 'unused-fixture': '1.0.0' },
  }));
  await writeFile(join(fixture, 'main.ts'), 'console.log("fixture");');
  const dependency = join(fixture, 'node_modules/unused-fixture');
  await mkdir(dependency, { recursive: true });
  await writeFile(join(dependency, 'package.json'), JSON.stringify({ name: 'unused-fixture', version: '1.0.0', main: 'index.ts' }));
  await writeFile(join(dependency, 'index.ts'), 'export const unused = true;');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/fallow/bin/fallow', root)), ...args,
    '--root', fixture, '--format', 'json', '--quiet', '--no-cache'], { cwd: fixture, encoding: 'utf8', timeout: 30000 });
  assert.ifError(result.error);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.unused_dev_dependencies.map((dependency: { package_name: string }) => dependency.package_name), ['unused-fixture']);
  assert.equal(result.status, 1, result.stderr || 'An unused development dependency must fail the gate.');
});

test('each document or record that an exported test reads is exported, or the test reads it only where it exists', async () => {
  const exported = new Set(sourceFiles);
  for (const file of sourceFiles.filter(path => path.startsWith('tests/'))) {
    const text = await readFile(new URL(file, root), 'utf8');
    for (const [, path] of text.matchAll(/['"]((?:docs\/)?[A-Za-z0-9_-]+\.(?:md|json))['"]/g)) {
      if (!existsSync(new URL(path, root))) continue;
      assert.ok(exported.has(path) || text.includes(`existsSync('${path}')`), `${file} reads ${path}, which the source export leaves out`);
    }
  }
});
