import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// The PNG masters in public/assets/original stay unchanged and are not shipped. The build ships these variants instead.
// Widths follow the largest size each image is shown at, at twice the device pixel ratio.
// Transparent atlases ship as WebP only: its alpha is exact, while AVIF leaves faint pixels in fully clear areas.
export const imageVariants = {
  // Decoration edits are sampled only inside their authored regions, at the full size of the room painting that they edit.
  'decoration-front': { widths: [1536], formats: ['webp'] },
  'decoration-courtyard': { widths: [1536], formats: ['webp'] },
  'timber-tabletop': { widths: [1024, 1536], formats: ['avif', 'webp'] },
  // The runner is drawn at most 14px tall through an SVG pattern, which takes one format.
  'embroidered-runner': { widths: [384], formats: ['webp'] },
  'menu-atlas': { widths: [1536], formats: ['webp'] },
  'board-clutter': { widths: [1536], formats: ['webp'] },
  portraits: { widths: [640], formats: ['webp'] },
  'visitor-portraits': { widths: [640], formats: ['webp'] },
  mascots: { widths: [640], formats: ['webp'] },
  // The painted room states fill a 3:4 room view; phones take the half-size painting.
  'front-room-00': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-01': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-02': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-03': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-04': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-05': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-06': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-07': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-08': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-09': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-10': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-11': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-12': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-13': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-14': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-15': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-16': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-17': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-18': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-19': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-20': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-21': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-22': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'courtyard-23': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-24': { widths: [768, 1536], formats: ['avif', 'webp'] },
} as const;
const encoderSettings = {
  avif: { quality: 66, effort: 6, chromaSubsampling: '4:4:4' },
  webp: { quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true },
} as const;
const variantDirectory = 'public/assets/variants';
const variantRecord = 'docs/asset-variants.json';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function buildImageVariants(root = resolve(import.meta.dirname, '..')) {
  const provenance = JSON.parse(await readFile(resolve(root, 'docs/asset-provenance.json'), 'utf8')) as { assets: { id: string; file: string; sha256: string }[] };
  const planned = new Set(Object.keys(imageVariants));
  const recorded = new Set(provenance.assets.map(asset => asset.id));
  if (planned.size !== recorded.size || [...planned].some(id => !recorded.has(id))) throw new Error('Every approved master needs a variant plan, and every plan needs an approved master.');
  const variants = [];
  const files = new Map<string, Buffer>();
  for (const asset of provenance.assets) {
    const master = await readFile(resolve(root, asset.file));
    if (sha256(master) !== asset.sha256) throw new Error(`${asset.id}: the master does not match its provenance record.`);
    const plan = imageVariants[asset.id as keyof typeof imageVariants];
    for (const width of plan.widths) {
      for (const format of plan.formats) {
        const resized = sharp(master).resize({ width });
        const { data, info } = await (format === 'avif' ? resized.avif(encoderSettings.avif) : resized.webp(encoderSettings.webp)).toBuffer({ resolveWithObject: true });
        const file = `${variantDirectory}/${asset.id}-${info.width}x${info.height}.${format}`;
        files.set(file, data);
        variants.push({ file, master: asset.id, masterSha256: asset.sha256, width: info.width, height: info.height, format, bytes: data.length, sha256: sha256(data) });
      }
    }
  }
  // Encode everything before replacing the shipped variants.
  await rm(resolve(root, variantDirectory), { recursive: true, force: true });
  await mkdir(resolve(root, variantDirectory), { recursive: true });
  for (const [file, data] of files) await writeFile(resolve(root, file), data);
  const encoder = `sharp ${sharp.versions.sharp} (libvips ${sharp.versions.vips})`;
  await writeFile(resolve(root, variantRecord), `${JSON.stringify({ tool: 'tools/build-image-variants.ts', encoder, settings: encoderSettings, variants }, null, 2)}\n`);
  return variants;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const variants = await buildImageVariants();
  const total = variants.reduce((sum, variant) => sum + variant.bytes, 0);
  console.log(`Wrote ${variants.length} image variants (${(total / 1048576).toFixed(2)} MiB) to ${variantDirectory} and recorded them in ${variantRecord}.`);
}
