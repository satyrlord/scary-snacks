// Make masks and region composites for the painted room states.
// A provider can change pixels outside a mask.
// The composite preserves the previous state outside the region and its soft edge.
// It uses generated pixels inside that region.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { TASK_ROOT, checkMask, isInside, pathExists, readReference, resolveWithAncestors } from './art-image.ts';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type Box = { left: number; top: number; width: number; height: number };
type Ellipse = { x: number; y: number; rx: number; ry: number };
type Point = [number, number];

/** Make an RGBA mask. Transparent pixels mark each shape to repaint. All other pixels are opaque. */
export async function makeMask(width: number, height: number, boxes: Box[], ellipses: Ellipse[] = [], polygons: Point[][] = []) {
  if (!boxes.length && !ellipses.length && !polygons.length) throw new Error('Give at least one --box, --ellipse or --polygon.');
  const pixels = Buffer.alloc(width * height * 4);
  for (let index = 3; index < pixels.length; index += 4) pixels[index] = 255;
  for (const box of boxes) {
    if (![box.left, box.top, box.width, box.height].every(Number.isSafeInteger) || box.left < 0 || box.top < 0
      || box.width <= 0 || box.height <= 0 || box.left + box.width > width || box.top + box.height > height)
      throw new Error('Keep every box inside the image.');
    for (let y = box.top; y < box.top + box.height; y++)
      for (let x = box.left; x < box.left + box.width; x++) pixels[(y * width + x) * 4 + 3] = 0;
  }
  // An ellipse follows a round shape, such as a window's glass, without taking the frame around it.
  for (const { x: cx, y: cy, rx, ry } of ellipses) {
    if (![cx, cy, rx, ry].every(Number.isSafeInteger) || rx <= 0 || ry <= 0 || cx - rx < 0 || cy - ry < 0 || cx + rx > width || cy + ry > height)
      throw new Error('Keep every ellipse inside the image.');
    for (let y = cy - ry; y < cy + ry; y++)
      for (let x = cx - rx; x < cx + rx; x++)
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) pixels[(y * width + x) * 4 + 3] = 0;
  }
  // A polygon follows a surface in perspective, such as a wall.
  for (const points of polygons) {
    if (points.length < 3 || !points.every(([x, y]) => Number.isSafeInteger(x) && Number.isSafeInteger(y) && x >= 0 && y >= 0 && x <= width && y <= height))
      throw new Error('Give each polygon at least three points inside the image.');
    const ys = points.map(([, y]) => y);
    for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
      for (let x = 0; x < width; x++) {
        // Even-odd rule at the pixel centre.
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i];
          const [xj, yj] = points[j];
          if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) pixels[(y * width + x) * 4 + 3] = 0;
      }
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/**
 * Copy generated pixels into the mask region with a soft edge of `feather` pixels.
 * Preserve the alpha outside the region. Keep an opaque base opaque.
 */
export async function compositeRegion(base: Buffer, candidate: Buffer, mask: Buffer, feather = 24, ramp = false) {
  checkMask(mask, base);
  const channels = (await sharp(base).metadata()).hasAlpha ? 4 : 3;
  const read = (image: Buffer) => (channels === 4 ? sharp(image).ensureAlpha() : sharp(image).removeAlpha()).raw().toBuffer({ resolveWithObject: true });
  const [under, over] = await Promise.all([read(base), read(candidate)]);
  const { width, height } = under.info;
  if (over.info.width !== width || over.info.height !== height) throw new Error('Use a candidate the size of the previous state.');
  // The weight is 1 inside the region and 0 outside it. The blur fades the edge, and only outward from the region.
  // Without a ramp, the weight drops to one half at the region's edge. A ramp first widens the region by the feather,
  // so the fade starts at full strength there. Use a ramp for a change of light, which shows that step.
  let weight = sharp(mask).extractChannel(3).negate();
  if (ramp && feather > 0) {
    const { data, info } = await weight.dilate(feather).raw().toBuffer({ resolveWithObject: true });
    weight = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  }
  if (feather > 0) weight = weight.blur(feather / 2);
  const inside = await sharp(mask).extractChannel(3).negate().raw().toBuffer();
  // A blurred single-channel raw image has three equal channels. Read one of them.
  const soft = await (ramp && feather > 0 ? weight.extractChannel(0) : weight).raw().toBuffer();
  const pixels = Buffer.alloc(width * height * channels);
  for (let index = 0; index < width * height; index++) {
    const share = Math.max(inside[index], soft[index]) / 255;
    for (let channel = 0; channel < channels; channel++) {
      const at = index * channels + channel;
      pixels[at] = share === 0 ? under.data[at] : Math.round(under.data[at] * (1 - share) + over.data[at] * share);
    }
  }
  return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();
}

async function newOutput(file: string) {
  const out = await resolveWithAncestors(file);
  if (!isInside(await resolveWithAncestors(TASK_ROOT), out)) throw new Error('Write inside analysis/art-generation/.');
  if (await pathExists(out)) throw new Error('The output path is in use. Use a new output path.');
  return out;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const { values } = parseArgs({
    args,
    options: {
      size: { type: 'string' }, box: { type: 'string', multiple: true }, ellipse: { type: 'string', multiple: true }, polygon: { type: 'string', multiple: true }, out: { type: 'string' },
      base: { type: 'string' }, candidate: { type: 'string' }, mask: { type: 'string' }, feather: { type: 'string' }, ramp: { type: 'boolean' },
    },
  });
  if (command === 'mask' && values.size && (values.box || values.ellipse || values.polygon) && values.out) {
    const [width, height] = values.size.split('x').map(Number);
    const ellipses = (values.ellipse ?? []).map(value => {
      const [x, y, rx, ry] = value.split(',').map(Number);
      return { x, y, rx, ry };
    });
    const boxes = (values.box ?? []).map(value => {
      const [left, top, w, h] = value.split(',').map(Number);
      return { left, top, width: w, height: h };
    });
    const polygons = (values.polygon ?? []).map(value => {
      const numbers = value.split(',').map(Number);
      return numbers.flatMap((n, i) => (i % 2 ? [] : [[n, numbers[i + 1]] as Point]));
    });
    const out = await newOutput(values.out);
    await mkdir(path.dirname(out), { recursive: true });
    const bytes = await makeMask(width, height, boxes, ellipses, polygons);
    await writeFile(out, bytes, { flag: 'wx' });
    console.log(JSON.stringify({ mask: out, sha256: sha256(bytes), boxes, ellipses, polygons }));
  } else if (command === 'composite' && values.base && values.candidate && values.mask && values.out) {
    // The previous state and the candidate must both be project images with their records.
    const base = await readReference(values.base);
    const candidate = await readReference(values.candidate);
    if (path.basename(values.candidate) !== 'candidate.png') throw new Error('Composite a candidate.png from a helper run.');
    const maskPath = await resolveWithAncestors(values.mask);
    if (!isInside(await resolveWithAncestors(TASK_ROOT), maskPath)) throw new Error('Keep the mask inside analysis/art-generation/.');
    const mask = await readFile(maskPath);
    const feather = values.feather === undefined ? 24 : Number(values.feather);
    if (!Number.isSafeInteger(feather) || feather < 0 || feather > 128) throw new Error('Use a feather from 0 to 128 pixels.');
    const out = await newOutput(values.out);
    const ramp = values.ramp === true;
    const bytes = await compositeRegion(base.bytes, candidate.bytes, mask, feather, ramp);
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'composite.png'), bytes, { flag: 'wx' });
    const record = { baseSha256: base.sha256, candidateSha256: candidate.sha256, maskSha256: sha256(mask), feather, ...(ramp ? { ramp } : {}), sourceSha256: sha256(bytes) };
    await writeFile(path.join(out, 'composite.json'), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ composite: path.join(out, 'composite.png'), ...record }));
  } else {
    throw new Error('Use "mask --size WxH [--box left,top,width,height] [--ellipse x,y,rx,ry] [--polygon x1,y1,x2,y2,x3,y3,...] --out <file>" or "composite --base <png> --candidate <candidate.png> --mask <png> --out <dir> [--feather 24] [--ramp]".');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'The composite helper failed.');
    process.exitCode = 1;
  });
}
