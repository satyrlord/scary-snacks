// Make masks and region composites for the painted room states, and convert and patch pencil drawings.
// A provider can change pixels outside a mask.
// The composite preserves the previous state outside the region and its soft edge.
// It uses generated pixels inside that region.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { REPO, TASK_ROOT, checkMask, isInside, pathExists, readReference, resolveWithAncestors, sha256 } from './art-image.ts';

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
    const offset = index * channels;
    if (share === 0 || share === 1) {
      const source = share === 0 ? under.data : over.data;
      source.copy(pixels, offset, offset, offset + channels);
      continue;
    }
    if (channels === 4) {
      // Blend visible colour with its alpha. Hidden RGB in clear pixels must not tint the soft edge.
      const underAlpha = under.data[offset + 3] * (1 - share), overAlpha = over.data[offset + 3] * share;
      const alpha = underAlpha + overAlpha;
      for (let channel = 0; channel < 3; channel++)
        pixels[offset + channel] = alpha === 0 ? 0 : Math.round((under.data[offset + channel] * underAlpha + over.data[offset + channel] * overAlpha) / alpha);
      pixels[offset + 3] = Math.round(alpha);
      continue;
    }
    for (let channel = 0; channel < channels; channel++) {
      const at = offset + channel;
      pixels[at] = Math.round(under.data[at] * (1 - share) + over.data[at] * share);
    }
  }
  return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();
}

/**
 * Turn a drawing on plain paper into marks on transparency. The paper colour is the median of the brighter half of the
 * pixels. Each pixel keeps the ink that, laid over that paper, gives its colour: paper becomes clear, and no paper
 * survives as a fill inside a closed shape. Alpha under `floor` is paper grain and becomes 0.
 */
export async function paperToAlpha(drawing: Buffer, floor = 0.04) {
  const { data, info } = await sharp(drawing).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const count = info.width * info.height;
  const light = (index: number) => data[index * 3] + data[index * 3 + 1] + data[index * 3 + 2];
  const order = Array.from({ length: count }, (_, index) => index).sort((a, b) => light(a) - light(b));
  const bright = order.slice(Math.floor(count / 2));
  const paper = [0, 1, 2].map(channel => bright.map(index => data[index * 3 + channel]).sort((a, b) => a - b)[Math.floor(bright.length / 2)]);
  if (paper.some(value => value < 200)) throw new Error('Use a drawing on light paper.');
  const pixels = Buffer.alloc(count * 4);
  for (let index = 0; index < count; index++) {
    let alpha = 0;
    for (let channel = 0; channel < 3; channel++) alpha = Math.max(alpha, (paper[channel] - data[index * 3 + channel]) / paper[channel]);
    if (alpha < floor) continue;
    for (let channel = 0; channel < 3; channel++) {
      const ink = (data[index * 3 + channel] - (1 - alpha) * paper[channel]) / alpha;
      pixels[index * 4 + channel] = Math.max(0, Math.min(255, Math.round(ink)));
    }
    pixels[index * 4 + 3] = Math.round(alpha * 255);
  }
  return { bytes: await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(), paper, floor };
}

/**
 * Lay a transparent pencil drawing on white paper. Pad each side to the next multiple of 16.
 * Then the provider edits the drawing at its own scale, and the copy resamples no pixel.
 */
export async function paperCopy(drawing: Buffer) {
  const { width, height } = await sharp(drawing).metadata();
  const extra = (size: number) => Math.ceil(size / 16) * 16 - size;
  const left = Math.floor(extra(width!) / 2), top = Math.floor(extra(height!) / 2);
  const bytes = await sharp(drawing).flatten({ background: '#ffffff' })
    .extend({ left, top, right: extra(width!) - left, bottom: extra(height!) - top, background: '#ffffff' }).png().toBuffer();
  return { bytes, left, top };
}

/** Copy the masked region of an edited paper copy into the transparent drawing. Make the paper of that region clear. */
export async function inkPatch(drawing: Buffer, edit: Buffer, mask: Buffer, left: number, top: number, feather = 8) {
  const { width, height } = await sharp(drawing).metadata();
  const region = { left, top, width: width!, height: height! };
  const { bytes } = await paperToAlpha(await sharp(edit).extract(region).png().toBuffer());
  return compositeRegion(drawing, bytes, await sharp(mask).extract(region).png().toBuffer(), feather);
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
  } else if (command === 'ink' && values.candidate && values.out) {
    // The drawing must be a candidate.png from a helper run, so its record names the request.
    const candidate = await readReference(values.candidate);
    if (path.basename(values.candidate) !== 'candidate.png') throw new Error('Convert a candidate.png from a helper run.');
    const out = await newOutput(values.out);
    const { bytes, paper, floor } = await paperToAlpha(candidate.bytes);
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'ink.png'), bytes, { flag: 'wx' });
    const record = { candidateSha256: candidate.sha256, paper, floor, sourceSha256: sha256(bytes) };
    await writeFile(path.join(out, 'ink.json'), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ ink: path.join(out, 'ink.png'), ...record }));
  } else if (command === 'paper' && values.base && values.out) {
    const base = await readReference(values.base);
    const out = await newOutput(values.out);
    const { bytes, left, top } = await paperCopy(base.bytes);
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'paper.png'), bytes, { flag: 'wx' });
    const record = { base: path.relative(REPO, await resolveWithAncestors(values.base)).replaceAll('\\', '/'), baseSha256: base.sha256, left, top, sourceSha256: sha256(bytes) };
    await writeFile(path.join(out, 'paper.json'), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ paper: path.join(out, 'paper.png'), ...record }));
  } else if (command === 'patch' && values.base && values.candidate && values.mask && values.out) {
    // The base is a paper.png; its record names the drawing and the padding.
    const paper = await readReference(values.base);
    if (path.basename(values.base) !== 'paper.png') throw new Error('Patch from a paper.png that the paper command made.');
    const record = JSON.parse(await readFile(path.join(path.dirname(values.base), 'paper.json'), 'utf8')) as { base: string; baseSha256: string; left: number; top: number };
    const drawing = await readReference(path.join(REPO, record.base));
    if (drawing.sha256 !== record.baseSha256) throw new Error('The drawing changed after its paper copy was made.');
    const candidate = await readReference(values.candidate);
    if (path.basename(values.candidate) !== 'candidate.png') throw new Error('Patch with a candidate.png from a helper run.');
    const maskPath = await resolveWithAncestors(values.mask);
    if (!isInside(await resolveWithAncestors(TASK_ROOT), maskPath)) throw new Error('Keep the mask inside analysis/art-generation/.');
    const mask = await readFile(maskPath);
    const feather = values.feather === undefined ? 8 : Number(values.feather);
    if (!Number.isSafeInteger(feather) || feather < 0 || feather > 128) throw new Error('Use a feather from 0 to 128 pixels.');
    const out = await newOutput(values.out);
    const bytes = await inkPatch(drawing.bytes, candidate.bytes, mask, record.left, record.top, feather);
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, 'patch.png'), bytes, { flag: 'wx' });
    const result = { baseSha256: drawing.sha256, paperSha256: paper.sha256, candidateSha256: candidate.sha256, maskSha256: sha256(mask), feather, sourceSha256: sha256(bytes) };
    await writeFile(path.join(out, 'patch.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ patch: path.join(out, 'patch.png'), ...result }));
  } else {
    throw new Error('Use "mask --size WxH [--box left,top,width,height] [--ellipse x,y,rx,ry] [--polygon x1,y1,x2,y2,x3,y3,...] --out <file>", "composite --base <png> --candidate <candidate.png> --mask <png> --out <dir> [--feather 24] [--ramp]", "ink --candidate <candidate.png> --out <dir>", "paper --base <drawing png> --out <dir>", or "patch --base <paper.png> --candidate <candidate.png> --mask <png> --out <dir> [--feather 8]".');
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'The composite helper failed.');
    process.exitCode = 1;
  });
}
