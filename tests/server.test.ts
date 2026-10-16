import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { get } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { build, runtimeFiles, fontFiles } from '../tools/build.ts';
import browserConfig from '../playwright.config.ts';

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'scary-snacks-server-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of [...runtimeFiles, ...fontFiles.map(path => `public/${path}`), 'public/assets/fonts/unapproved.woff2', 'public/assets/fonts/unapproved.txt', 'public/data/game.json', 'public/data/other.json', 'public/assets/variants/items-640x640.avif', 'public/assets/original/items.png', 'public/assets/unlisted/old.png', 'src/unlisted.ts', 'analysis/private.json', 'private/index.html', 'package.json']) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), file === 'package.json' ? '{"type":"module"}' : file);
  }
  await mkdir(join(root, 'tools'));
  for (const file of ['build.ts', 'server.ts']) await copyFile(new URL(`../tools/${file}`, import.meta.url), join(root, 'tools', file));
  await build(root);
  return root;
}

function listening(server: ReturnType<typeof spawn>) {
  return new Promise<string>((resolve, reject) => {
    server.stdout!.on('data', (chunk: Buffer) => { const url = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) resolve(url); });
    server.once('error', reject);
    server.once('exit', () => reject(new Error('Server stopped before listening.')));
  });
}

function request(address: string, path: string) {
  return new Promise<number | undefined>((resolve, reject) => {
    get(address + path, response => { response.resume(); response.on('end', () => resolve(response.statusCode)); }).on('error', reject);
  });
}

for (const built of [false, true]) for (const basePath of ['/', '/scary-snacks/']) {
  test(`${built ? 'built' : 'development'} server confines files under ${basePath}`, async t => {
    const root = await fixture(t);
    const server = spawn(process.execPath, ['tools/server.ts', ...(built ? ['--dist'] : [])], { cwd: root, env: { ...process.env, PORT: '0', BASE_PATH: basePath }, stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      const address = await listening(server);
      for (const path of ['', 'src/app.js', 'data/game.json', 'assets/variants/items-640x640.avif', ...fontFiles]) assert.equal(await request(address, basePath + path), 200, path);
      for (const file of fontFiles) {
        const response = await fetch(address + basePath + file);
        assert.equal(response.headers.get('content-type'), file.endsWith('.woff2') ? 'font/woff2' : 'text/plain; charset=utf-8');
        assert.equal(await response.text(), `public/${file}`);
      }
      for (const file of ['assets/fonts/unapproved.woff2', 'assets/fonts/unapproved.txt', 'assets/fonts/..%2f../data/game.json']) assert.equal(await request(address, basePath + file), 404, file);
      for (const path of ['src/..%2fanalysis/private.json', 'src/..%5cpackage.json', 'assets/variants/..%2f..%2f..%2fpackage.json', 'assets/original/items.png', 'data/..%5c..%5cpackage.json', 'private/index.html', 'package.json', 'src/unlisted.js', 'src/unlisted.ts', 'src/app.ts', 'tools/build.ts', 'assets/unlisted/old.png', 'data/other.json', 'assets/variants/%2e%2e/unlisted/old.png', 'src/%', 'src//app.js']) {
        assert.equal(await request(address, basePath + path), 404, path);
      }
      const entry = await fetch(address + basePath);
      // A meta policy cannot carry frame-ancestors, so the header adds it to the policy of the page.
      const page = (await readFile(new URL('../index.html', import.meta.url), 'utf8')).match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)![1];
      assert.equal(entry.headers.get('content-security-policy'), `${page}; frame-ancestors 'none'`);
      assert.equal(entry.headers.get('x-content-type-options'), 'nosniff');
      assert.equal((await fetch(address + basePath, { method: 'POST' })).status, 405);
      assert.equal(await (await fetch(address + basePath, { method: 'HEAD' })).text(), '');
      if (basePath !== '/') {
        assert.equal(await request(address, '/'), 404);
        assert.equal(await request(address, '/src/app.js'), 404);
        assert.equal(await request(address, basePath.slice(0, -1)), 308);
      }
    } finally {
      if (server.exitCode === null) { const stopped = once(server, 'exit'); server.kill(); await stopped; }
    }
  });
}

test('browser test servers serve their configured URLs despite an inherited preview base path', async t => {
  const root = await fixture(t);
  assert.ok(Array.isArray(browserConfig.webServer));
  for (const configured of browserConfig.webServer) {
    assert.ok(configured.url);
    const basePath = new URL(configured.url).pathname;
    const server = spawn(process.execPath, ['tools/server.ts', '--dist'], { cwd: root, env: { ...process.env, BASE_PATH: '/scary-snacks/', ...configured.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      const address = await listening(server);
      for (const path of ['', 'src/app.js', 'data/game.json']) assert.equal(await request(address, basePath + path), 200, configured.url + path);
    } finally {
      if (server.exitCode === null) { const stopped = once(server, 'exit'); server.kill(); await stopped; }
    }
  }
});

test('development server serves files when Windows reports the drive letter in lower case', { skip: process.platform !== 'win32' }, async t => {
  const root = await fixture(t);
  const lower = root[0].toLowerCase() + root.slice(1);
  const server = spawn(process.execPath, [join(lower, 'tools', 'server.ts')], { cwd: lower, env: { ...process.env, PORT: '0', BASE_PATH: '/' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const address = await listening(server);
    for (const path of ['', 'src/app.js', 'data/game.json']) assert.equal(await request(address, '/' + path), 200, path);
  } finally {
    if (server.exitCode === null) { const stopped = once(server, 'exit'); server.kill(); await stopped; }
  }
});
