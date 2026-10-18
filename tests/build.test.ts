import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { build, compile, runtimeFiles, fontFiles, publishedPath } from '../tools/build.ts';

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'scary-snacks-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of [...runtimeFiles, ...fontFiles.map(path => `public/${path}`), 'public/assets/fonts/unapproved.woff2', 'public/assets/fonts/unapproved.txt', 'public/data/game.json', 'public/assets/original/items.png', 'public/assets/variants/items-640x640.avif', 'public/assets/variants/items-640x640.webp', 'public/assets/unlisted/old.png', 'src/unlisted.ts', 'analysis/private.json', 'private/notes.md']) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), file);
  }
  return root;
}

test('build publishes only explicit runtime and image variants, never the PNG masters; stale output is removed', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/old.png'), 'old');
  const manifest = await build(root);
  assert.deepEqual(manifest.map(file => file.path).sort(), [...runtimeFiles.map(publishedPath), ...fontFiles, 'data/game.json', 'assets/variants/items-640x640.avif', 'assets/variants/items-640x640.webp', '.nojekyll'].sort());
  for (const file of fontFiles) assert.equal(await readFile(join(root, 'dist', file), 'utf8'), `public/${file}`);
  assert.equal(await readFile(join(root, 'dist/data/game.json'), 'utf8'), 'public/data/game.json');
  assert.ok(!((await readdir(join(root, 'dist'))).includes('old.png')));
  assert.deepEqual(JSON.parse(await readFile(join(root, 'analysis/build-manifest.json'), 'utf8')), manifest);
  const variants = manifest.map(file => file.path).filter(path => path.startsWith('assets/variants/'));
  assert.deepEqual(variants, variants.toSorted((a, b) => a.localeCompare(b)), 'The manifest keeps one order on every file system.');
});

test('runtime sources are published as scripts with types removed and module names rewritten', async t => {
  const script = compile('src/app.ts', Buffer.from("import type { State } from './engine.ts';\nimport { start } from './engine.ts';\nconst state: State = start();\nconst lazy = () => import('../src/storage.ts');\nconst label = 'notes.ts';\n")).toString();
  assert.doesNotMatch(script, /State|import type/);
  assert.match(script, /^import \{ start \} from '\.\/engine\.js';$/m);
  assert.match(script, /import\('\.\.\/src\/storage\.js'\)/);
  assert.match(script, /'notes\.ts'/);
  assert.equal(script.split('\n').length, 6, 'Line numbers stay those of the source.');
  assert.equal(compile('index.html', Buffer.from('<script type="module" src="./src/app.ts"></script><a href="notes.ts">')).toString(), '<script type="module" src="./src/app.js"></script><a href="notes.ts">');
  assert.deepEqual(compile('src/style.css', Buffer.from('a.ts{}')), Buffer.from('a.ts{}'));
  const root = await fixture(t);
  await writeFile(join(root, 'src/app.ts'), "export const coins: number = 1;\n");
  await build(root);
  assert.equal(await readFile(join(root, 'dist/src/app.js'), 'utf8'), 'export const coins         = 1;\n');
  assert.ok(!(await readdir(join(root, 'dist/src'))).some(name => name.endsWith('.ts')));
});

test('build rejects executable assets before replacing the last build', async t => {
  const root = await fixture(t);
  await build(root);
  await writeFile(join(root, 'public/assets/variants/unsafe.js'), 'alert(1)');
  await assert.rejects(build(root), /Unapproved image variant/);
  await rm(join(root, 'public/assets/variants/unsafe.js'));
  await writeFile(join(root, 'public/assets/variants/master.png'), 'png');
  await assert.rejects(build(root), /Unapproved image variant/);
  assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), 'index.html');
});

test('build rejects linked asset directories', async t => {
  const root = await fixture(t);
  await symlink(join(root, 'public/assets/unlisted'), join(root, 'public/assets/variants/linked'), 'junction');
  await assert.rejects(build(root), /Unapproved image variant: public\/assets\/variants\/linked/);
});
