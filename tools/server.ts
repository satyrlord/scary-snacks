import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { realpathSync } from 'node:fs';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { runtimeFiles, fontFiles, publishedPath, compile } from './build.ts';

// Windows may report the drive letter in either case; the real path matches the case that the confinement check below compares against.
const project = realpathSync.native(resolve(import.meta.dirname, '..'));
const built = process.argv.includes('--dist');
const root = built ? resolve(project, 'dist') : project;
const port = Number(process.env.PORT || 4178);
const basePath = process.env.BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new Error('BASE_PATH must start and end with a slash and contain simple path segments.');
const mime: Record<string, string> = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.avif':'image/avif', '.webp':'image/webp', '.woff2':'font/woff2', '.txt':'text/plain' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
// Requests use published names. Development compiles the source of a runtime file for each request.
const runtimeSources = new Map(runtimeFiles.map(path => [publishedPath(path), path]));
const server = http.createServer(async (request, response) => {
  response.setHeader('Content-Security-Policy', csp);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(request.method ?? '')) { response.writeHead(405).end(); return; }
  try {
    // Reject separators before URL parsing can normalize a traversal attempt.
    const rawPath = (request.url ?? '').split('?')[0];
    if (/\\|%2f|%5c/i.test(rawPath)) throw new Error('Noncanonical path.');
    const pathname = decodeURIComponent(rawPath);
    if (pathname.split('/').some(part => part === '.' || part === '..') || pathname.includes('\0')) throw new Error('Noncanonical path.');
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) { response.writeHead(308, { Location: basePath }).end(); return; }
    if (!pathname.startsWith(basePath)) throw new Error('Outside base path.');
    const mapped = pathname.slice(basePath.length) || 'index.html';
    const bitmap = mapped.startsWith('assets/variants/') && ['.avif', '.webp'].includes(extname(mapped));
    const runtimeSource = runtimeSources.get(mapped);
    if (!(runtimeSource || fontFiles.includes(mapped) || mapped === 'data/game.json' || bitmap)) throw new Error('Unapproved file.');
    const file = !built && runtimeSource ? runtimeSource : mapped;
    const type = mime[extname(mapped)];
    const base = !built && /^(assets|data)\//.test(mapped) ? resolve(root, 'public') : root;
    const boundary = bitmap ? resolve(base, 'assets/variants') : base;
    const expected = resolve(base, file);
    const path = await realpath(expected);
    if (path !== expected || !path.startsWith(boundary + sep) || !type || !(await stat(path)).isFile()) throw new Error('Unapproved file.');
    response.setHeader('Content-Type', `${type}${['.html','.js','.css','.json','.txt'].includes(extname(mapped)) ? '; charset=utf-8' : ''}`);
    const bytes = await readFile(path);
    response.writeHead(200).end(request.method === 'HEAD' ? undefined : built ? bytes : compile(file, bytes));
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local game: http://127.0.0.1:${(server.address() as AddressInfo).port}${basePath} (${built ? 'built artifact' : 'development'})`));
