// Measure a generated PNG with Node.js built-in modules only.
// The helper reads 8-bit, non-interlaced RGB and RGBA files. It does not change pixels.
import { createHash } from 'node:crypto';
import { crc32, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const VISIBLE_ALPHA = 16;
const STRONG_ALPHA = 128;

interface InspectOptions {
  background: 'transparent' | 'opaque';
  columns: number;
  rows: number;
  blankCells?: readonly number[];
  expectedSize?: { width: number; height: number };
  minimumWidth?: number;
}

export function hasPngSignature(bytes: Buffer) {
  return bytes.length >= 8 && bytes.subarray(0, 8).equals(SIGNATURE);
}

function unfilter(raw: Buffer, width: number, height: number, channels: number) {
  const stride = width * channels;
  if (raw.length !== (stride + 1) * height)
    throw new Error('The PNG pixel data has an unexpected length.');
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const source = y * (stride + 1) + 1;
    const target = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? out[target + x - channels] : 0;
      const up = y > 0 ? out[target - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[target - stride + x - channels] : 0;
      let predictor: number;
      if (filter === 0) predictor = 0;
      else if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const estimate = left + up - upLeft;
        const distanceLeft = Math.abs(estimate - left);
        const distanceUp = Math.abs(estimate - up);
        const distanceUpLeft = Math.abs(estimate - upLeft);
        predictor =
          distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft
            ? left
            : distanceUp <= distanceUpLeft
              ? up
              : upLeft;
      } else throw new Error('The PNG uses an unknown row filter.');
      out[target + x] = (raw[source + x] + predictor) & 255;
    }
  }
  return out;
}

function decodePng(bytes: Buffer) {
  if (!hasPngSignature(bytes)) throw new Error('Use a PNG file.');
  let offset = 8;
  let header: Buffer | undefined;
  let ended = false;
  const data: Buffer[] = [];
  while (!ended && offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('latin1', offset + 4, offset + 8);
    const end = offset + 8 + length;
    if (end + 4 > bytes.length) throw new Error('The PNG is truncated.');
    if (crc32(bytes.subarray(offset + 4, end)) !== bytes.readUInt32BE(end))
      throw new Error(`The PNG chunk ${type} has a bad checksum.`);
    const body = bytes.subarray(offset + 8, end);
    if (type === 'tRNS')
      throw new Error('Use an RGB or RGBA PNG without color-key transparency.');
    if (type === 'IHDR') header = body;
    else if (type === 'IDAT') data.push(body);
    else if (type === 'IEND') ended = true;
    offset = end + 4;
  }
  if (!header || header.length !== 13 || data.length === 0 || !ended)
    throw new Error('The PNG is incomplete.');
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const [bitDepth, colorType, , , interlace] = header.subarray(8);
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0)
    throw new Error('Use an 8-bit, non-interlaced RGB or RGBA PNG.');
  if (width < 1 || height < 1) throw new Error('The PNG has no pixels.');
  const channels = colorType === 6 ? 4 : 3;
  const pixels = unfilter(inflateSync(Buffer.concat(data)), width, height, channels);
  return { width, height, channels, pixels };
}

// A cell is a region of the atlas grid. An opaque painting has one cell.
// A transparent cell needs a pixel with strong alpha, so an image with only weak alpha fails.
export function inspectPng(bytes: Buffer, options: InspectOptions) {
  const { width, height, channels, pixels } = decodePng(bytes);
  const { background, columns, rows, expectedSize, minimumWidth, blankCells = [] } = options;
  const issues: string[] = [];
  const warnings: string[] = [];
  if (expectedSize && (expectedSize.width !== width || expectedSize.height !== height))
    issues.push(
      `The image is ${width}x${height}. The request asked for ${expectedSize.width}x${expectedSize.height}.`,
    );
  if (minimumWidth !== undefined && width <= minimumWidth)
    issues.push(`The width must be more than ${minimumWidth} pixels.`);
  if (width % columns !== 0 || height % rows !== 0)
    issues.push(`The image does not divide into ${columns} columns and ${rows} rows.`);

  const cellWidth = Math.floor(width / columns);
  const cellHeight = Math.floor(height / rows);
  const band = Math.max(2, Math.round(Math.min(cellWidth, cellHeight) * 0.02));
  const cellCount = columns * rows;
  const bandPixels = new Array<number>(cellCount).fill(0);
  const strongPixels = new Array<number>(cellCount).fill(0);
  const nontransparentPixels = new Array<number>(cellCount).fill(0);
  let transparent = 0;
  let partial = 0;
  let opaque = 0;
  for (let y = 0; y < height; y += 1) {
    const row = Math.min(rows - 1, Math.floor(y / cellHeight));
    const localY = y - row * cellHeight;
    const rowBand = localY < band || localY >= cellHeight - band;
    for (let x = 0; x < width; x += 1) {
      const alpha = channels === 4 ? pixels[(y * width + x) * 4 + 3] : 255;
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) opaque += 1;
      else partial += 1;
      if (background !== 'transparent') continue;
      const column = Math.min(columns - 1, Math.floor(x / cellWidth));
      const localX = x - column * cellWidth;
      const cell = row * columns + column;
      if (alpha > 0) nontransparentPixels[cell] += 1;
      if (alpha >= STRONG_ALPHA) strongPixels[cell] += 1;
      if (alpha >= VISIBLE_ALPHA && (rowBand || localX < band || localX >= cellWidth - band))
        bandPixels[cell] += 1;
    }
  }

  const emptyCells: { column: number; row: number }[] = [];
  const edgeBandCells: { column: number; row: number; visiblePixels: number }[] = [];
  if (background === 'transparent') {
    if (channels !== 4) issues.push('The PNG must have an alpha channel.');
    if (transparent === 0) issues.push('The PNG must have fully transparent pixels.');
    for (let cell = 0; cell < cellCount; cell += 1) {
      const column = (cell % columns) + 1;
      const row = Math.floor(cell / columns) + 1;
      if (blankCells.includes(cell)) {
        if (nontransparentPixels[cell] > 0) issues.push(`Cell ${column}, ${row} must be fully transparent.`);
        continue;
      }
      if (strongPixels[cell] === 0) emptyCells.push({ column, row });
      if (bandPixels[cell] > 0) edgeBandCells.push({ column, row, visiblePixels: bandPixels[cell] });
    }
    if (emptyCells.length > 0) issues.push(`${emptyCells.length} cell(s) have no visible object.`);
    // Generated grids are not pixel exact, so an edge-band hit asks for a visual check of the cell.
    if (edgeBandCells.length > 0)
      warnings.push(
        `${edgeBandCells.length} cell(s) have visible pixels in the ${band}-pixel edge band. Examine each cell for containment.`,
      );
  } else if (transparent + partial > 0) {
    issues.push('An opaque painting must be fully opaque.');
  }

  return {
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    width,
    height,
    mode: channels === 4 ? 'RGBA' : 'RGB',
    hasAlphaChannel: channels === 4,
    background,
    columns,
    rows,
    edgeBand: background === 'transparent' ? band : undefined,
    transparentPixels: transparent,
    partialAlphaPixels: partial,
    opaquePixels: opaque,
    valid: issues.length === 0,
    issues,
    warnings,
    emptyCells,
    edgeBandCells,
  };
}
