import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { crc32, deflateSync } from 'node:zlib';
import sharp from 'sharp';
import { checkMask, planAsset, verifyReferenceHash } from '../.github/skills/generate-game-art-openai/scripts/art-image.ts';
import { SEPIA_DARK, compositeRegion, inkPatch, makeMask, paperCopy, paperToAlpha, sepiaLines } from '../.github/skills/generate-game-art-openai/scripts/art-composite.ts';
import { buildImageRequest } from '../.github/skills/generate-game-art-openai/scripts/openai-api.ts';
import { inspectPng } from '../.github/skills/generate-game-art-openai/scripts/png-facts.ts';

function chunk(type: string, data: Buffer) {
  const bytes = Buffer.alloc(data.length + 12);
  bytes.writeUInt32BE(data.length);
  bytes.write(type, 4);
  data.copy(bytes, 8);
  bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4);
  return bytes;
}

function png(channels: 3 | 4, colorKey = false, alpha = 255) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = channels === 4 ? 6 : 2;
  const pixels = channels === 4 ? Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, alpha]) : Buffer.alloc(7);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    ...(colorKey ? [chunk('tRNS', Buffer.alloc(6))] : []),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test('atlas requests preserve the square sheet and square cells', () => {
  const plan = planAsset('mascots');
  assert.equal(plan.size, '1536x1536');
  assert.equal(plan.columns, 2);
  assert.equal(plan.rows, 2);
  assert.equal(plan.width / plan.columns, plan.height / plan.rows);
  const request = buildImageRequest({ assetId: plan.assetId, size: plan.size, promptText: 'Four poses in a grid.' });
  assert.equal(typeof request.body, 'string');
  const body = JSON.parse(request.body as string);
  assert.equal(body.size, '1536x1536');
  assert.equal(body.background, 'transparent');
  assert.throws(() => planAsset('portraits', '1536x1024'), /square size/u);
});

test('the last regulars atlas requires three portraits and a blank last cell', async () => {
  const plan = planAsset('regulars-3');
  const portrait = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 120, g: 80, b: 40, alpha: 1 } } }).png().toBuffer();
  const sheet = (cells: number[]) => sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells.map(cell => ({ input: portrait, left: (cell % 2) * 32 + 12, top: Math.floor(cell / 2) * 32 + 12 }))).png().toBuffer();
  assert.ok(inspectPng(await sheet([0, 1, 2]), plan).valid);
  assert.equal(inspectPng(await sheet([0, 1]), plan).valid, false, 'Three portraits are required.');
  assert.equal(inspectPng(await sheet([0, 1, 2, 3]), plan).valid, false, 'The last cell must stay blank.');
  assert.equal(inspectPng(await sheet([0, 1, 2]), planAsset('regulars-1')).valid, false, 'Other regulars atlases require four portraits.');
});

test('a food atlas is a 2:1 four-by-two sheet whose cells after the last picture stay blank', async () => {
  const plan = planAsset('food-corn');
  assert.equal(plan.size, '2048x1024');
  assert.deepEqual([plan.columns, plan.rows], [4, 2]);
  assert.deepEqual(plan.blankCells, [5, 6, 7]);
  assert.equal(planAsset('food-soups').blankCells, undefined);
  assert.throws(() => planAsset('food-corn', '1536x1536'), /2:1 landscape/u);
  const dish = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 200, g: 160, b: 40, alpha: 1 } } }).png().toBuffer();
  const sheet = (cells: number[]) => sharp({ create: { width: 128, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells.map(cell => ({ input: dish, left: (cell % 4) * 32 + 12, top: Math.floor(cell / 4) * 32 + 12 }))).png().toBuffer();
  assert.ok(inspectPng(await sheet([0, 1, 2, 3, 4]), plan).valid);
  assert.equal(inspectPng(await sheet([0, 1, 2, 3, 4, 5]), plan).valid, false, 'Cells after the last picture must stay blank.');
});

test('image measurement refuses color-key transparency instead of reporting an opaque painting', () => {
  assert.throws(() => inspectPng(png(3, true), { background: 'opaque', columns: 1, rows: 1 }), /color-key transparency/u);
  const opaque = inspectPng(png(3), { background: 'opaque', columns: 1, rows: 1 });
  assert.equal(opaque.valid, true);
  assert.equal(opaque.opaquePixels, 2);
  const alpha = inspectPng(png(4), { background: 'transparent', columns: 1, rows: 1 });
  assert.equal(alpha.valid, true);
  assert.equal(alpha.transparentPixels, 1);
  assert.equal(alpha.opaquePixels, 1);
});

test('image measurement accepts a subject with strong alpha below 255 and rejects a subject with only weak alpha', () => {
  const nearlyOpaque = inspectPng(png(4, false, 254), { background: 'transparent', columns: 1, rows: 1 });
  assert.equal(nearlyOpaque.valid, true);
  assert.equal(nearlyOpaque.opaquePixels, 0);
  const faint = inspectPng(png(4, false, 100), { background: 'transparent', columns: 1, rows: 1 });
  assert.equal(faint.valid, false);
  assert.deepEqual(faint.emptyCells, [{ column: 1, row: 1 }]);
});

test('image references require the recorded hash and reject changed candidate or master bytes', () => {
  const original = Buffer.from('recorded image');
  const hash = createHash('sha256').update(original).digest('hex');
  assert.doesNotThrow(() => verifyReferenceHash(original, hash));
  assert.throws(() => verifyReferenceHash(Buffer.from('replacement image'), hash), /recorded image hash/u);
  for (const missing of [undefined, null, '', 'not a hash', {}])
    assert.throws(() => verifyReferenceHash(original, missing), /recorded image hash/u);
});

test('processed sketch and scene inspection checks transparency while raw inspection still requires paper', () => {
  const inspect = (asset: string, input: string, processed: boolean) => spawnSync(process.execPath, [
    '.github/skills/generate-game-art-openai/scripts/art-image.ts', 'inspect', '--asset', asset,
    '--input', `public/assets/original/${input}.png`, ...(processed ? ['--processed'] : []),
  ], { encoding: 'utf8' });
  for (const asset of ['sketch-sheet-1', 'scene-sheet-1']) {
    const processed = inspect(asset, asset, true);
    assert.equal(processed.status, 0, processed.stderr || processed.stdout);
    assert.equal(JSON.parse(processed.stdout).background, 'transparent');
    const raw = inspect(asset, asset, false);
    assert.equal(raw.status, 1);
    assert.deepEqual(JSON.parse(raw.stdout).issues, ['An opaque painting must be fully opaque.']);
  }
  const missingAlpha = inspect('scene-sheet-1', 'parchment-page', true);
  assert.equal(missingAlpha.status, 1);
  assert.equal(JSON.parse(missingAlpha.stdout).hasAlphaChannel, false);
  assert.equal(JSON.parse(missingAlpha.stdout).valid, false);
  const rawPaper = inspect('scene-sheet-1', 'parchment-page', false);
  assert.equal(rawPaper.status, 0, rawPaper.stderr || rawPaper.stdout);
  const wrongAsset = inspect('portraits', 'portraits', true);
  assert.equal(wrongAsset.status, 1);
  assert.match(wrongAsset.stderr, /only for a character sketch or a quest scene/u);
  const wrongCommand = spawnSync(process.execPath, [
    '.github/skills/generate-game-art-openai/scripts/art-image.ts', 'plan', '--asset', 'sketch-sheet-1', '--processed',
  ], { encoding: 'utf8' });
  assert.equal(wrongCommand.status, 1);
  assert.match(wrongCommand.stderr, /documented helper command/u);
});

test('room states are opaque 3:4 portrait paintings, one for each room state of the game data', () => {
  const plan = planAsset('front-room-00');
  assert.equal(plan.size, '1536x2048');
  assert.equal(plan.background, 'opaque');
  assert.equal(plan.experimentalResolution, false);
  assert.equal(planAsset('courtyard-13').size, '1536x2048');
  assert.throws(() => planAsset('front-room-00', '2496x3328'), /8,294,400 pixels/u);
  assert.throws(() => planAsset('front-room-00', '2304x768'), /3:4 portrait size/u);
  for (const missing of ['front-room-13', 'courtyard-17', 'courtyard-24']) assert.throws(() => planAsset(missing), /asset identifiers/u);
});

test('decoration paintings and the supper painting match the room states, and the board-clutter atlas is a transparent 3:2 sheet of square cells', () => {
  for (const id of ['decoration-front', 'decoration-courtyard', 'finale-supper']) {
    const plan = planAsset(id);
    assert.equal(plan.size, '1536x2048');
    assert.equal(plan.background, 'opaque');
  }
  const plan = planAsset('board-clutter');
  assert.equal(plan.size, '1536x1024');
  assert.equal(plan.background, 'transparent');
  assert.equal(plan.width / plan.columns, plan.height / plan.rows);
  assert.throws(() => planAsset('board-clutter', '1536x1536'), /3:2 landscape size/u);
});

test('a masked edit sends the mask with the image that it edits, and only then', () => {
  const image = { bytes: Buffer.from('previous state'), format: 'png' };
  const mask = { bytes: Buffer.from('mask'), format: 'png' };
  const request = buildImageRequest({ assetId: 'front-room-01', size: '1536x2048', promptText: 'Clean the window.', referenceImages: [image], mask });
  assert.ok(request.endpoint.endsWith('/edits'));
  const body = request.body as FormData;
  assert.equal(body.getAll('image[]').length, 1);
  assert.equal(body.getAll('mask').length, 1);
  assert.throws(() => buildImageRequest({ assetId: 'front-room-01', size: '1536x2048', promptText: 'Clean the window.', mask }), /sent with the image/u);
  assert.throws(() => buildImageRequest({ assetId: 'front-room-01', size: '1536x2048', promptText: 'Clean.', referenceImages: [image], mask: { ...mask, format: 'webp' } }), /PNG/u);
});

test('a region composite keeps every pixel outside the feathered mask and takes the edit inside it', async () => {
  const solid = (value: number) => sharp({ create: { width: 64, height: 48, channels: 3, background: { r: value, g: value, b: value } } }).png().toBuffer();
  const [base, candidate] = await Promise.all([solid(10), solid(200)]);
  const mask = await makeMask(64, 48, [{ left: 24, top: 16, width: 16, height: 16 }]);
  const pixels = await sharp(await compositeRegion(base, candidate, mask, 4)).raw().toBuffer();
  const at = (x: number, y: number) => pixels[(y * 64 + x) * 3];
  assert.equal(at(32, 24), 200);
  assert.equal(at(24, 16), 200);
  assert.equal(at(0, 0), 10);
  assert.equal(at(63, 47), 10);
  assert.ok(at(22, 24) > 10 && at(22, 24) < 200, 'the edge fades outward');
  assert.throws(() => checkMask(base, base), /RGBA PNG mask/u);
  await assert.rejects(compositeRegion(base, candidate, await makeMask(32, 32, [{ left: 0, top: 0, width: 8, height: 8 }])), /size of the image/u);
  await assert.rejects(makeMask(64, 48, [{ left: 60, top: 0, width: 8, height: 8 }]), /inside the image/u);
});

test('a feathered transparent composite fades ink without changing its colour or the pixels outside the edge', async () => {
  const solid = (rgba: number[]) => {
    const pixels = Buffer.alloc(64 * 64 * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) pixels.set(rgba, offset);
    return sharp(pixels, { raw: { width: 64, height: 64, channels: 4 } }).png().toBuffer();
  };
  const clear = [12, 34, 56, 0], ink = [180, 60, 20, 192];
  const [empty, drawing] = await Promise.all([solid(clear), solid(ink)]);
  const mask = await makeMask(64, 64, [{ left: 24, top: 24, width: 16, height: 16 }]);
  for (const adding of [true, false]) {
    const result = await sharp(await compositeRegion(adding ? empty : drawing, adding ? drawing : empty, mask, 8)).raw().toBuffer();
    const at = (x: number, y: number) => [...result.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4)];
    const edge = at(23, 32);
    assert.deepEqual(edge.slice(0, 3), ink.slice(0, 3), 'The fading ink keeps its colour.');
    assert.ok(edge[3] > 0 && edge[3] < ink[3], 'Only its opacity fades.');
    assert.deepEqual(at(0, 0), adding ? clear : ink, 'Pixels outside the feather stay exact.');
    assert.deepEqual(at(32, 32), adding ? ink : clear, 'Pixels inside the mask stay exact.');
  }
});

test('a ramped composite fades from full strength at the region edge with no step', async () => {
  const solid = (value: number) => sharp({ create: { width: 96, height: 48, channels: 3, background: { r: value, g: value, b: value } } }).png().toBuffer();
  const [base, candidate] = await Promise.all([solid(10), solid(210)]);
  const mask = await makeMask(96, 48, [{ left: 40, top: 16, width: 16, height: 16 }]);
  const row = async (ramp: boolean) => {
    const pixels = await sharp(await compositeRegion(base, candidate, mask, 8, ramp)).raw().toBuffer();
    return (x: number) => pixels[(24 * 96 + x) * 3];
  };
  const [plain, ramped] = await Promise.all([row(false), row(true)]);
  assert.ok(plain(55) - plain(56) > 60, 'without a ramp the weight steps down at the edge');
  assert.ok(ramped(55) - ramped(56) < 10, 'a ramp starts at full strength');
  assert.ok(ramped(62) > 10 && ramped(62) < 210, 'and fades outward');
  assert.equal(ramped(0), 10);
  assert.equal(ramped(95), 10);
});

test('an ellipse mask repaints a round region and leaves the corners of its bounding box', async () => {
  const mask = await sharp(await makeMask(40, 40, [], [{ x: 20, y: 20, rx: 16, ry: 12 }])).raw().toBuffer();
  const alpha = (x: number, y: number) => mask[(y * 40 + x) * 4 + 3];
  assert.equal(alpha(20, 20), 0);
  assert.equal(alpha(35, 20), 0);
  assert.equal(alpha(5, 9), 255, 'the corner of the bounding box stays');
  assert.equal(alpha(20, 5), 255);
  await assert.rejects(makeMask(40, 40, [], [{ x: 4, y: 20, rx: 8, ry: 8 }]), /inside the image/u);
  await assert.rejects(makeMask(40, 40, []), /--box, --ellipse or --polygon/u);
});

test('a polygon mask repaints a slanted region and leaves the pixels outside its edges', async () => {
  // A parallelogram whose top and bottom edges slope down to the right, like a ledge on a receding wall.
  const mask = await sharp(await makeMask(40, 40, [], [], [[[4, 10], [36, 20], [36, 30], [4, 20]]])).raw().toBuffer();
  const alpha = (x: number, y: number) => mask[(y * 40 + x) * 4 + 3];
  assert.equal(alpha(20, 18), 0);
  assert.equal(alpha(34, 26), 0);
  assert.equal(alpha(34, 14), 255, 'above the sloping top edge');
  assert.equal(alpha(6, 26), 255, 'below the sloping bottom edge');
  await assert.rejects(makeMask(40, 40, [], [], [[[0, 0], [50, 0], [0, 10]]]), /three points inside the image/u);
});

test('ink conversion makes the paper clear, gives back each pencil colour over the paper, and leaves no paper fill inside a closed shape', async () => {
  // White paper with a closed brown square outline. Its inside is paper, which a cut-out background would keep as a fill.
  const paper = { r: 250, g: 248, b: 244 }, ink = [110, 50, 15];
  const pixels = Buffer.alloc(40 * 40 * 3);
  for (let index = 0; index < 40 * 40; index++) {
    const x = index % 40, y = Math.floor(index / 40), line = (x === 10 || x === 29 || y === 10 || y === 29) && x >= 10 && x <= 29 && y >= 10 && y <= 29;
    pixels.set(line ? ink : [paper.r, paper.g, paper.b], index * 3);
  }
  const { bytes, paper: found } = await paperToAlpha(await sharp(pixels, { raw: { width: 40, height: 40, channels: 3 } }).png().toBuffer());
  const result = await sharp(bytes).raw().toBuffer();
  const at = (x: number, y: number) => [...result.subarray((y * 40 + x) * 4, (y * 40 + x) * 4 + 4)];
  assert.deepEqual(found, [paper.r, paper.g, paper.b]);
  assert.equal(at(20, 20)[3], 0, 'the inside of the closed shape is clear');
  assert.equal(at(0, 0)[3], 0, 'the paper is clear');
  const line = at(10, 20), share = line[3] / 255;
  assert.ok(share > .9, 'the line is nearly opaque');
  // Laid over the same paper, the line gives back its drawn colour.
  for (const [channel, value] of ink.entries()) assert.ok(Math.abs(line[channel] * share + found[channel] * (1 - share) - value) <= 2, `channel ${channel}`);
  await assert.rejects(paperToAlpha(await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 40, g: 40, b: 40 } } }).png().toBuffer()), /light paper/u);
});

test('a paper copy pads a drawing to multiples of 16, and a patch takes back only the masked marks of its edit', async () => {
  // A 30 by 20 transparent drawing with one brown mark.
  const drawing = Buffer.alloc(30 * 20 * 4);
  drawing.set([110, 50, 15, 255], (5 * 30 + 5) * 4);
  const png = await sharp(drawing, { raw: { width: 30, height: 20, channels: 4 } }).png().toBuffer();
  const { bytes, left, top } = await paperCopy(png);
  const copy = await sharp(bytes).metadata();
  assert.deepEqual([copy.width, copy.height, left, top], [32, 32, 1, 6]);
  // The edit is white paper with a new mark inside the mask and a stray mark outside it.
  const edit = Buffer.alloc(32 * 32 * 3, 255);
  edit.set([110, 50, 15], ((top + 10) * 32 + left + 20) * 3);
  edit.set([110, 50, 15], ((top + 15) * 32 + left + 2) * 3);
  const mask = await makeMask(32, 32, [{ left: left + 16, top: top + 6, width: 8, height: 8 }]);
  const patched = await sharp(await inkPatch(png, await sharp(edit, { raw: { width: 32, height: 32, channels: 3 } }).png().toBuffer(), mask, left, top, 0)).raw().toBuffer();
  const alpha = (x: number, y: number) => patched[(y * 30 + x) * 4 + 3];
  assert.ok(alpha(20, 10) > 230, 'the new mark inside the mask arrives');
  assert.equal(alpha(2, 15), 0, 'the stray mark outside the mask stays out');
  assert.equal(alpha(5, 5), 255, 'the drawing keeps its own marks');
  assert.equal(alpha(25, 12), 0, 'the paper inside the mask is clear');
});

test('the repository path is the real path, so a lower-case drive letter still finds the shipping masters', { skip: process.platform !== 'win32' && 'Only Windows has drive letters.' }, () => {
  const module = new URL('../.github/skills/generate-game-art-openai/scripts/art-image.ts', import.meta.url).href.replace(/^file:\/\/\/([A-Z]):/, (_, drive: string) => `file:///${drive.toLowerCase()}:`);
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', `const { REPO } = await import(${JSON.stringify(module)}); console.log(REPO);`], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout.trim(), /^[A-Z]:\\/);
});

test('the sepia colour keeps alpha, turns faint yellowish strokes sepia, and keeps gold and red chalk only when asked', async () => {
  // Four pixels: a dark line, a faint yellowish stroke, a gold flame, and red chalk.
  const pixels = Buffer.from([90, 50, 30, 220, 230, 190, 60, 40, 255, 200, 40, 230, 200, 40, 40, 200]);
  const drawing = await sharp(pixels, { raw: { width: 4, height: 1, channels: 4 } }).png().toBuffer();
  const colour = async (keepRed: boolean, keepGold: boolean) => sharp((await sepiaLines(drawing, keepRed, keepGold)).bytes).raw().toBuffer();
  const plain = await colour(false, false), accents = await colour(true, true);
  assert.deepEqual([plain[3], plain[7], plain[11], plain[15]], [220, 40, 230, 200]);
  // The faint stroke is never gold: it takes the sepia hue, with red above green above blue.
  assert.ok(accents[4] > accents[5] && accents[5] > accents[6] && accents[6] < 190);
  assert.deepEqual([...accents.subarray(8, 12)], [255, 200, 40, 230]);
  assert.deepEqual([...accents.subarray(12, 16)], [200, 40, 40, 200]);
  assert.notDeepEqual([...plain.subarray(8, 11)], [255, 200, 40]);
  assert.ok(plain[12] <= SEPIA_DARK[0] * 3 && plain[12] > plain[13]);
});
