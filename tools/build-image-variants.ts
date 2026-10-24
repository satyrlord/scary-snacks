import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
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
  // The new characters of act 2. The empty cells wait for the characters of later acts.
  'sketch-sheet-4': { widths: [672], formats: ['webp'], cells: { columns: 4, rows: 2, names: ['sketch-ambrozie', 'sketch-gavril', 'sketch-tarka', null, null, null, null, null] } },
  // Landscape scenes fill the reading column at up to 460px. The 1024px width covers twice the device pixel ratio.
  'scene-sheet-1': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-1', 'scene-cathedral-2', 'scene-cathedral-3', 'scene-cathedral-4'] } },
  'scene-sheet-2': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-5', 'scene-cathedral-6', 'scene-cathedral-7', 'scene-cathedral-8'] } },
  'scene-sheet-3': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-cathedral-9', 'scene-ionatan-dinner', 'scene-mina-avram-meal', 'scene-easter-baskets'] } },
  'scene-sheet-4': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-bela-snowman', 'scene-icicle-clock', 'scene-chimney-sweep', 'scene-blajini'] } },
  // The illustrations of the prologue events, and the two painted pages of the notebook in cells of the same size.
  'scene-sheet-5': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-prologue-churchyard', 'scene-prologue-carols', 'scene-prologue-midnight', 'scene-prologue-bus-stop'] } },
  // The scenes of the mourning year of the grandmother. The empty cells wait for the later memorials.
  'scene-sheet-6': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 2, names: ['scene-three-months', null, null, null] } },
  'notebook-pages': { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 1, names: ['scene-notebook-cabbage-rolls', 'scene-notebook-note'] } },
  // The family photographs of Mama and Tata take the place of their sketches, in cells of the sketch size.
  'family-photos': { widths: [672], formats: ['webp'], cells: { columns: 2, rows: 1, names: ['photo-mama', 'photo-tata'] } },
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
  'food-pickles': { widths: [1024], formats: ['webp'] },
  'food-greens': { widths: [1024], formats: ['webp'] },
  'food-garden': { widths: [1024], formats: ['webp'] },
  'food-soups': { widths: [1024], formats: ['webp'] },
  'food-mains': { widths: [1024], formats: ['webp'] },
  'food-sweets': { widths: [1024], formats: ['webp'] },
  'food-breads': { widths: [1024], formats: ['webp'] },
  'food-summer': { widths: [1024], formats: ['webp'] },
  'board-clutter': { widths: [1536], formats: ['webp'] },
  'preparation-clutter': { widths: [1448], formats: ['webp'] },
  // The two blockers of the hail have 1024px cells. The 1024px width gives 512px cells, as the preparation clutter has 362px cells.
  'hail-clutter': { widths: [1024], formats: ['webp'] },
  portraits: { widths: [640], formats: ['webp'] },
  'visitor-portraits': { widths: [640], formats: ['webp'] },
  guests: { widths: [640], formats: ['webp'] },
  'regulars-1': { widths: [640], formats: ['webp'] },
  'regulars-2': { widths: [640], formats: ['webp'] },
  'regulars-3': { widths: [640], formats: ['webp'] },
  'summer-guests': { widths: [640], formats: ['webp'] },
  mascots: { widths: [640], formats: ['webp'] },
  'family-portraits': { widths: [640], formats: ['webp'] },
  // The rat sheets have 512px cells. The 1024px width gives 256px cells for a rat of at most one board cell.
  'rat-thief': { widths: [1024], formats: ['webp'] },
  'rat-soricescu': { widths: [1024], formats: ['webp'] },
  // The 512px variants supply the rack and each pocket front.
  'source-rack': { widths: [512], formats: ['webp'] },
  'source-rack-eight': { widths: [512], formats: ['webp'] },
  // The cutting board under the cells is at most about 640px wide on the widest kitchen.
  'cutting-board': { widths: [1068], formats: ['webp'] },
  // A rat hole fills one board cell.
  'rat-hole': { widths: [256], formats: ['webp'] },
  // The night sky shows only through the two upper panes of the front-room window.
  'night-sky': { widths: [1024], formats: ['webp'] },
  // A window view fills the six panes of the front-room window, at most about 290px wide on the widest room.
  'window-view-late-winter': { widths: [576], formats: ['webp'] },
  'window-view-early-spring': { widths: [576], formats: ['webp'] },
  'window-view-spring': { widths: [576], formats: ['webp'] },
  // The holiday decorations are sampled only inside their regions, at the full size of the room paintings of their area.
  'holiday-front': { widths: [1536], formats: ['webp'] },
  'holiday-courtyard': { widths: [1536], formats: ['webp'] },
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
  // The finale and festival paintings fill the dialog on a phone and a half-height dialog on a wider screen.
  'finale-supper': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'festival': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'finale-feast': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'front-room-24': { widths: [768, 1536], formats: ['avif', 'webp'] },
  // The areas of act 2: the summer kitchen, the vegetable garden, and the town square.
  'summer-kitchen-00': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-01': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-02': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-03': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-04': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-05': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-06': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-07': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-08': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-09': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-10': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-11': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-13': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-14': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-17': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-15': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-16': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-18': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-19': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'summer-kitchen-20': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-21': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'vegetable-garden-22': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-12': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-23': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'town-square-24': { widths: [768, 1536], formats: ['avif', 'webp'] },
  // The family kitchen of the prologue fills the same 3:4 room view.
  'family-kitchen-mourning': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'family-kitchen-christmas': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'family-kitchen-new-year': { widths: [768, 1536], formats: ['avif', 'webp'] },
  'family-kitchen-farewell': { widths: [768, 1536], formats: ['avif', 'webp'] },
} as const;
export const encoderSettings = {
  avif: { quality: 66, effort: 6, chromaSubsampling: '4:4:4' },
  webp: { quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true },
} as const;
const variantDirectory = 'public/assets/variants';
const variantRecord = 'docs/asset-variants.json';

type Plan = { widths: readonly number[]; formats: readonly ('avif' | 'webp')[]; cells?: { columns: number; rows: number; names: readonly (string | null)[] } };
type Asset = { id: string; file: string; sha256: string };
export type Variant = { file: string; master: string; masterSha256: string; width: number; height: number; format: 'avif' | 'webp'; bytes: number; sha256: string };
export type VariantRecord = { tool: string; encoder: string; settings: unknown; cellPlans?: Record<string, Plan['cells']>; variants: Variant[] };

/** The name, width, and format of each variant that a plan asks for, as `name@width.format`. */
export function plannedKeys(id: string, plan: Plan) {
  const names = plan.cells ? plan.cells.names.filter(name => name !== null) : [id];
  return names.flatMap(name => plan.widths.flatMap(width => plan.formats.map(format => `${name}@${width}.${format}`))).sort();
}
const recordedKey = (variant: Variant) => `${variant.file.slice(variantDirectory.length + 1).replace(/-\d+x\d+\.(avif|webp)$/, '')}@${variant.width}.${variant.format}`;

/**
 * The recorded variants of a master that the build keeps: the record has the same encoder and settings, the master has its recorded hash,
 * the record has each planned variant and no other, and each file on disk has its recorded hash. Otherwise the build encodes the master again.
 */
export function keptVariants(asset: Asset, plan: Plan, record: VariantRecord | undefined, encoder: string, onDisk: ReadonlyMap<string, string>) {
  if (!record || record.encoder !== encoder || JSON.stringify(record.settings) !== JSON.stringify(encoderSettings)) return undefined;
  if (JSON.stringify(record.cellPlans?.[asset.id]) !== JSON.stringify(plan.cells)) return undefined;
  const variants = record.variants.filter(variant => variant.master === asset.id);
  if (variants.some(variant => variant.masterSha256 !== asset.sha256 || onDisk.get(variant.file) !== variant.sha256)) return undefined;
  return JSON.stringify(variants.map(recordedKey).sort()) === JSON.stringify(plannedKeys(asset.id, plan)) ? variants : undefined;
}

/** The images that the build encodes from a master, in record order: each named cell, or the whole master, at each width and format. */
async function encodeJobs(asset: Asset, master: Buffer, plan: Plan) {
  const { width: sheetWidth, height: sheetHeight } = await sharp(master).metadata();
  const parts = plan.cells
    ? plan.cells.names.flatMap((name, index) => name ? [{ name, region: { left: (index % plan.cells!.columns) * sheetWidth / plan.cells!.columns, top: Math.floor(index / plan.cells!.columns) * sheetHeight / plan.cells!.rows, width: sheetWidth / plan.cells!.columns, height: sheetHeight / plan.cells!.rows } }] : [])
    : [{ name: asset.id, region: undefined }];
  const jobs: { asset: Asset; name: string; source: Buffer; width: number; format: 'avif' | 'webp' }[] = [];
  for (const { name, region } of parts) {
    const source = region ? await sharp(master).extract(region).toBuffer() : master;
    for (const width of plan.widths) for (const format of plan.formats) jobs.push({ asset, name, source, width, format });
  }
  return jobs;
}
async function encode({ asset, name, source, width, format }: Awaited<ReturnType<typeof encodeJobs>>[number]) {
  const resized = sharp(source).resize({ width });
  const { data, info } = await (format === 'avif' ? resized.avif(encoderSettings.avif) : resized.webp(encoderSettings.webp)).toBuffer({ resolveWithObject: true });
  const file = `${variantDirectory}/${name}-${info.width}x${info.height}.${format}`;
  return { data, variant: { file, master: asset.id, masterSha256: asset.sha256, width: info.width, height: info.height, format, bytes: data.length, sha256: sha256(data) } };
}

/** Encodes only the masters that are new or changed since the record, or every master when all is true, and removes retired variants. */
async function buildImageVariants(all: boolean) {
  const root = resolve(import.meta.dirname, '..');
  const provenance = JSON.parse(await readFile(resolve(root, 'docs/asset-provenance.json'), 'utf8')) as { assets: Asset[] };
  const planned = new Set(Object.keys(imageVariants));
  const recorded = new Set(provenance.assets.map(asset => asset.id));
  if (planned.size !== recorded.size || [...planned].some(id => !recorded.has(id))) throw new Error('Every approved master needs a variant plan, and every plan needs an approved master.');
  const record = all ? undefined : await readFile(resolve(root, variantRecord), 'utf8').then(text => JSON.parse(text) as VariantRecord, () => undefined);
  await mkdir(resolve(root, variantDirectory), { recursive: true });
  const present = await readdir(resolve(root, variantDirectory));
  const onDisk = new Map(await Promise.all(present.map(async name => [`${variantDirectory}/${name}`, sha256(await readFile(resolve(root, variantDirectory, name)))] as const)));
  const encoder = `sharp ${sharp.versions.sharp} (libvips ${sharp.versions.vips})`;
  const results = new Map<string, Variant[]>(), files = new Map<string, Buffer>();
  const pending: { asset: Asset; master: Buffer; plan: Plan }[] = [];
  for (const asset of provenance.assets) {
    const master = await readFile(resolve(root, asset.file));
    if (sha256(master) !== asset.sha256) throw new Error(`${asset.id}: the master does not match its provenance record.`);
    const plan: Plan = imageVariants[asset.id as keyof typeof imageVariants];
    const kept = keptVariants(asset, plan, record, encoder, onDisk);
    if (kept) results.set(asset.id, kept); else pending.push({ asset, master, plan });
  }
  // The WebP and AVIF encoders use about one core for each image, so the images encode in parallel, one for each core.
  const jobs = (await Promise.all(pending.map(({ asset, master, plan }) => encodeJobs(asset, master, plan)))).flat();
  const encoded: Awaited<ReturnType<typeof encode>>[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(jobs.length, availableParallelism()) }, async () => {
    for (let index = next++; index < jobs.length; index = next++) encoded[index] = await encode(jobs[index]);
  }));
  for (const { asset } of pending) results.set(asset.id, encoded.filter(({ variant }) => variant.master === asset.id).map(({ variant }) => variant));
  for (const { variant, data } of encoded) files.set(variant.file, data);
  // Encode everything before changing the shipped variants.
  const variants = provenance.assets.flatMap(asset => results.get(asset.id)!);
  for (const [file, data] of files) await writeFile(resolve(root, file), data);
  const shipped = new Set(variants.map(variant => variant.file));
  const retired = [...onDisk.keys()].filter(file => !shipped.has(file));
  for (const file of retired) await rm(resolve(root, file));
  const cellPlans = Object.fromEntries(Object.entries(imageVariants).flatMap(([id, plan]) => 'cells' in plan ? [[id, plan.cells]] : []));
  await writeFile(resolve(root, variantRecord), `${JSON.stringify({ tool: 'tools/build-image-variants.ts', encoder, settings: encoderSettings, cellPlans, variants }, null, 2)}\n`);
  return { variants, encoded: pending.map(({ asset }) => asset.id), written: files.size, retired: retired.length };
}

if (import.meta.main) {
  const { variants, encoded, written, retired } = await buildImageVariants(process.argv.includes('--all'));
  const total = variants.reduce((sum, variant) => sum + variant.bytes, 0);
  console.log(`Encoded ${written} variants of ${encoded.length} masters${encoded.length && encoded.length <= 8 ? ` (${encoded.join(', ')})` : ''}, kept ${variants.length - written}, and removed ${retired}.`);
  console.log(`${variants.length} image variants (${(total / 1048576).toFixed(2)} MiB) are in ${variantDirectory} and recorded in ${variantRecord}.`);
}
