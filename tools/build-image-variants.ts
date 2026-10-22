import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { sha256 } from './build.ts';

// The PNG masters in public/assets/original stay unchanged and are not shipped. The build ships these variants instead.
// Widths follow the largest size each image is shown at, at twice the device pixel ratio.
// Transparent atlases ship as WebP only: its alpha is exact, while AVIF leaves faint pixels in fully clear areas.
export const imageVariants = {
  // Decoration edits are sampled only inside their authored regions, at the full size of the room painting that they edit.
  'decoration-front': { widths: [1536], formats: ['webp'] },
  'decoration-courtyard': { widths: [1536], formats: ['webp'] },
  'timber-tabletop': { widths: [1024, 1536], formats: ['avif', 'webp'] },
  // The page repeats the parchment at 512px. The native size keeps it sharp at more than twice the device pixel ratio.
  'parchment-page': { widths: [1254], formats: ['webp'] },
  // The pencil drawings are drawn in sheets so that they share one hand. The build cuts each named cell into its own variant.
  // A sketch floats at up to 210px; its native 672px cell covers three times the device pixel ratio.
  'sketch-sheet-1': { widths: [672], formats: ['webp'], cells: { columns: 4, rows: 2, names: ['sketch-adrian', 'sketch-avram', 'sketch-bran', 'sketch-costel', 'sketch-eszter', 'sketch-ilie', 'sketch-sorin', 'sketch-vlad'] } },
  'sketch-sheet-2': { widths: [672], formats: ['webp'], cells: { columns: 4, rows: 2, names: ['sketch-ana', 'sketch-bela', 'sketch-catalina', 'sketch-cezar', 'sketch-dochia', 'sketch-dorian', 'sketch-elisabeta', 'sketch-ileana'] } },
  'sketch-sheet-3': { widths: [672], formats: ['webp'], cells: { columns: 4, rows: 2, names: ['sketch-ionatan', 'sketch-janos', 'sketch-mara', 'sketch-mina', 'sketch-monica', 'sketch-sanziana', 'sketch-victor', 'sketch-mara-stove'] } },
  // Landscape scenes fill the reading column at up to 460px. The 1024px width covers twice the device pixel ratio.
  // The game shows no quest for the last cell of the third sheet, the Easter baskets, so that cell has no variant.
  'scene-sheet-1': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-1', 'scene-cathedral-2', 'scene-cathedral-3', 'scene-cathedral-4'] } },
  'scene-sheet-2': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-5', 'scene-cathedral-6', 'scene-cathedral-7', 'scene-cathedral-8'] } },
  'scene-sheet-3': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-9', 'scene-ionatan-dinner', 'scene-mina-avram-meal', null] } },
  // The page draws the runner at most 14px tall through an SVG pattern, which takes one format.
  'embroidered-runner': { widths: [384], formats: ['webp'] },
  // The food atlases have 512px cells. The 1024px width gives 256px cells.
  'food-grain': { widths: [1024], formats: ['webp'] },
  'food-corn': { widths: [1024], formats: ['webp'] },
  'food-herbs': { widths: [1024], formats: ['webp'] },
  'food-dairy': { widths: [1024], formats: ['webp'] },
  'food-poultry': { widths: [1024], formats: ['webp'] },
  'food-vegetables': { widths: [1024], formats: ['webp'] },
  'food-fruits': { widths: [1024], formats: ['webp'] },
  'food-pork': { widths: [1024], formats: ['webp'] },
  'food-beans': { widths: [1024], formats: ['webp'] },
  'food-lamb': { widths: [1024], formats: ['webp'] },
  'food-veal': { widths: [1024], formats: ['webp'] },
  'food-fish': { widths: [1024], formats: ['webp'] },
  'food-soups': { widths: [1024], formats: ['webp'] },
  'food-mains': { widths: [1024], formats: ['webp'] },
  'food-sweets': { widths: [1024], formats: ['webp'] },
  'food-breads': { widths: [1024], formats: ['webp'] },
  'board-clutter': { widths: [1536], formats: ['webp'] },
  'preparation-clutter': { widths: [1448], formats: ['webp'] },
  portraits: { widths: [640], formats: ['webp'] },
  'visitor-portraits': { widths: [640], formats: ['webp'] },
  guests: { widths: [640], formats: ['webp'] },
  'regulars-1': { widths: [640], formats: ['webp'] },
  'regulars-2': { widths: [640], formats: ['webp'] },
  'regulars-3': { widths: [640], formats: ['webp'] },
  mascots: { widths: [640], formats: ['webp'] },
  // The rat sheets have 512px cells. The 1024px width gives 256px cells for a rat of at most one board cell.
  'rat-thief': { widths: [1024], formats: ['webp'] },
  'rat-soricescu': { widths: [1024], formats: ['webp'] },
  // A rat hole fills one board cell.
  'rat-hole': { widths: [256], formats: ['webp'] },
  // The night sky shows only through the two upper panes of the front-room window.
  'night-sky': { widths: [1024], formats: ['webp'] },
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
  // The painting of the supper fills the dialog on a phone and a half-height dialog on a wider screen.
  'finale-supper': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-24': { widths: [768, 1536], formats: ['avif', 'webp'] },
} as const;
const encoderSettings = {
  avif: { quality: 66, effort: 6, chromaSubsampling: '4:4:4' },
  webp: { quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true },
} as const;
const variantDirectory = 'public/assets/variants';
const variantRecord = 'docs/asset-variants.json';

async function buildImageVariants() {
  const root = resolve(import.meta.dirname, '..');
  const provenance = JSON.parse(await readFile(resolve(root, 'docs/asset-provenance.json'), 'utf8')) as { assets: { id: string; file: string; sha256: string }[] };
  const planned = new Set(Object.keys(imageVariants));
  const recorded = new Set(provenance.assets.map(asset => asset.id));
  if (planned.size !== recorded.size || [...planned].some(id => !recorded.has(id))) throw new Error('Every approved master needs a variant plan, and every plan needs an approved master.');
  const variants = [];
  const files = new Map<string, Buffer>();
  for (const asset of provenance.assets) {
    const master = await readFile(resolve(root, asset.file));
    if (sha256(master) !== asset.sha256) throw new Error(`${asset.id}: the master does not match its provenance record.`);
    const plan: { widths: readonly number[]; formats: readonly ('avif' | 'webp')[]; cells?: { columns: number; rows: number; names: readonly (string | null)[] } } = imageVariants[asset.id as keyof typeof imageVariants];
    const { width: sheetWidth, height: sheetHeight } = await sharp(master).metadata();
    const parts = plan.cells
      ? plan.cells.names.flatMap((name, index) => name ? [{ name, region: { left: (index % plan.cells!.columns) * sheetWidth / plan.cells!.columns, top: Math.floor(index / plan.cells!.columns) * sheetHeight / plan.cells!.rows, width: sheetWidth / plan.cells!.columns, height: sheetHeight / plan.cells!.rows } }] : [])
      : [{ name: asset.id, region: undefined }];
    for (const { name, region } of parts) {
      const source = region ? await sharp(master).extract(region).toBuffer() : master;
      for (const width of plan.widths) {
        for (const format of plan.formats) {
          const resized = sharp(source).resize({ width });
          const { data, info } = await (format === 'avif' ? resized.avif(encoderSettings.avif) : resized.webp(encoderSettings.webp)).toBuffer({ resolveWithObject: true });
          const file = `${variantDirectory}/${name}-${info.width}x${info.height}.${format}`;
          files.set(file, data);
          variants.push({ file, master: asset.id, masterSha256: asset.sha256, width: info.width, height: info.height, format, bytes: data.length, sha256: sha256(data) });
        }
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

if (import.meta.main) {
  const variants = await buildImageVariants();
  const total = variants.reduce((sum, variant) => sum + variant.bytes, 0);
  console.log(`Wrote ${variants.length} image variants (${(total / 1048576).toFixed(2)} MiB) to ${variantDirectory} and recorded them in ${variantRecord}.`);
}
