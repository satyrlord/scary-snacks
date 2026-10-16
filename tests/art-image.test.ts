import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crc32, deflateSync } from 'node:zlib';
import sharp from 'sharp';
import { checkMask, planAsset, verifyReferenceHash } from '../.github/skills/generate-game-art-openai/scripts/art-image.ts';
import { compositeRegion, makeMask } from '../.github/skills/generate-game-art-openai/scripts/art-composite.ts';
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
  const plan = planAsset('menu-atlas');
  assert.equal(plan.size, '1536x1536');
  assert.equal(plan.columns, 6);
  assert.equal(plan.rows, 6);
  assert.equal(plan.width / plan.columns, plan.height / plan.rows);
  const request = buildImageRequest({ assetId: plan.assetId, size: plan.size, promptText: 'Thirty-six dishes in a grid.' });
  assert.equal(typeof request.body, 'string');
  const body = JSON.parse(request.body as string);
  assert.equal(body.size, '1536x1536');
  assert.equal(body.background, 'transparent');
  assert.throws(() => planAsset('portraits', '1536x1024'), /square size/u);
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

test('decoration paintings match the room states, and the board-clutter atlas is a transparent 3:2 sheet of square cells', () => {
  for (const id of ['decoration-front', 'decoration-courtyard']) {
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
