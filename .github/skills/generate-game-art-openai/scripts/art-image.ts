import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';
import {
  MODEL,
  QUALITY,
  assetContract,
  buildImageRequest,
  sendImageRequest,
  validateAssetSize,
} from './openai-api.ts';
import type { AssetId, ReferenceImage } from './openai-api.ts';
import { hasPngSignature, inspectPng } from './png-facts.ts';

// Use the real path. Then the drive letter agrees with the paths from realpath if the shell gives a lower-case letter.
export const REPO = realpathSync.native(fileURLToPath(new URL('../../../../', import.meta.url)));
export const TASK_ROOT = path.join(REPO, 'analysis', 'art-generation');
const SHIPPING_ROOT = path.join(REPO, 'public', 'assets', 'original');
const EXPERIMENTAL_PIXELS = 2560 * 1440;
const MINIMUM_WIDTH = 1000;

export const sha256 = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const writeJson = (file: string, data: unknown) =>
  writeFile(file, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });

export async function pathExists(file: string) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

// Resolve the deepest ancestor that exists. Then a junction cannot move a write outside its root.
export async function resolveWithAncestors(value: string) {
  let ancestor = path.resolve(value);
  const suffix: string[] = [];
  while (true) {
    try {
      ancestor = await realpath(ancestor);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      suffix.unshift(path.basename(ancestor));
      ancestor = parent;
    }
  }
  return path.join(ancestor, ...suffix);
}

export function isInside(root: string, target: string) {
  const relative = path.relative(root, target);
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function git(args: string[]) {
  return execFileSync('git', args, {
    cwd: REPO,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

async function readApiKey() {
  if (git(['ls-files', '--', '.env.local'])) throw new Error('The environment file must be untracked.');
  try {
    git(['check-ignore', '-q', '--', '.env.local']);
  } catch {
    throw new Error('The environment file must be ignored.');
  }
  let key: string | undefined;
  try {
    key = parseEnv(await readFile(path.join(REPO, '.env.local'), 'utf8')).OPENAI_API_KEY;
  } catch {
    throw new Error('Cannot read the local environment file.');
  }
  if (typeof key !== 'string' || !key.trim()) throw new Error('The local OPENAI_API_KEY is missing.');
  return key.trim();
}

export function planAsset(assetId: unknown, size?: string) {
  const asset = assetContract(assetId);
  const chosen = size ?? asset.defaultSize;
  const dimensions = validateAssetSize(assetId, chosen);
  return {
    route: 'openai-images-api',
    model: MODEL,
    quality: QUALITY,
    outputFormat: 'png',
    assetId: assetId as AssetId,
    background: asset.background,
    size: chosen,
    ...dimensions,
    columns: asset.columns,
    rows: asset.rows,
    ...(asset.blankCells ? { blankCells: asset.blankCells } : {}),
    experimentalResolution: dimensions.pixels > EXPERIMENTAL_PIXELS,
  };
}

export function verifyReferenceHash(bytes: Buffer, expectedHash: unknown) {
  if (typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedHash) || sha256(bytes) !== expectedHash)
    throw new Error('The reference does not match its recorded image hash.');
}

// Use only project-generated images as references.
// Accept shipped bitmaps, helper candidates, and the composites and paper copies that art-composite.ts makes from those images.
export async function readReference(file: string): Promise<ReferenceImage & { sha256: string }> {
  const resolved = await realpath(path.resolve(file));
  const shipping = await resolveWithAncestors(SHIPPING_ROOT);
  const tasks = await resolveWithAncestors(TASK_ROOT);
  const isShipping = isInside(shipping, resolved);
  const record = { 'candidate.png': 'generation.json', 'composite.png': 'composite.json', 'paper.png': 'paper.json' }[path.basename(resolved)];
  const isCandidate =
    isInside(tasks, resolved) && record !== undefined && (await pathExists(path.join(path.dirname(resolved), record)));
  if (!isShipping && !isCandidate)
    throw new Error(
      'Use only a shipped bitmap, a candidate that this helper generated, or a composite or a paper copy of them as a reference.',
    );
  const bytes = await readFile(resolved);
  if (isShipping) {
    const record = JSON.parse(await readFile(path.join(REPO, 'docs', 'asset-provenance.json'), 'utf8')) as {
      assets: { file: string; sha256: string; sourceGameImageInput: boolean }[];
    };
    const asset = record.assets.find((entry) => path.resolve(REPO, entry.file) === resolved);
    if (!asset || asset.sourceGameImageInput !== false)
      throw new Error('Use a shipped bitmap from the project provenance record.');
    verifyReferenceHash(bytes, asset.sha256);
  } else {
    const generation = JSON.parse(await readFile(path.join(path.dirname(resolved), record!), 'utf8')) as {
      sourceSha256?: unknown;
    };
    verifyReferenceHash(bytes, generation?.sourceSha256);
  }
  if (!hasPngSignature(bytes)) throw new Error('Use a PNG reference.');
  return { bytes, format: 'png', sha256: sha256(bytes) };
}

const pngSize = (bytes: Buffer) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] });

// Keep the RGBA PNG mask in the task folder.
// Match the edited image dimensions. Transparent pixels mark the region to repaint.
export function checkMask(mask: Buffer, edited: Buffer) {
  if (!hasPngSignature(mask) || mask.length < 33 || pngSize(mask).colorType !== 6)
    throw new Error('Use an RGBA PNG mask.');
  const [a, b] = [pngSize(mask), pngSize(edited)];
  if (!hasPngSignature(edited) || a.width !== b.width || a.height !== b.height)
    throw new Error('Use a mask the size of the image that it edits.');
}

async function readMask(file: string, edited: Buffer): Promise<ReferenceImage & { sha256: string }> {
  const resolved = await realpath(path.resolve(file));
  if (!isInside(await resolveWithAncestors(TASK_ROOT), resolved))
    throw new Error('Keep the mask inside analysis/art-generation/.');
  const bytes = await readFile(resolved);
  checkMask(bytes, edited);
  return { bytes, format: 'png', sha256: sha256(bytes) };
}

function inspectOptions(assetId: AssetId, size?: string, processed = false) {
  const asset = assetContract(assetId);
  if (processed && !assetId.startsWith('sketch-') && !assetId.startsWith('scene-'))
    throw new Error('Use --processed only for a character sketch or a quest scene.');
  const expectedSize = size ? validateAssetSize(assetId, size) : undefined;
  return {
    background: processed ? 'transparent' as const : asset.background,
    columns: asset.columns,
    rows: asset.rows,
    ...(asset.blankCells ? { blankCells: asset.blankCells } : {}),
    minimumWidth: MINIMUM_WIDTH,
    ...(expectedSize ? { expectedSize } : {}),
  };
}

function summary(report: ReturnType<typeof inspectPng>) {
  return {
    sha256: report.sha256,
    bytes: report.bytes,
    width: report.width,
    height: report.height,
    mode: report.mode,
    valid: report.valid,
    issues: report.issues,
    warnings: report.warnings,
    emptyCells: report.emptyCells,
    edgeBandCells: report.edgeBandCells,
  };
}

async function generate(values: {
  asset?: string;
  prompt?: string;
  out?: string;
  size?: string;
  reference?: string[];
  mask?: string;
  'dry-run'?: boolean;
}) {
  if (!values.asset || !values.prompt || !values.out)
    throw new Error('Give --asset, --prompt, and --out to generate.');
  const plan = planAsset(values.asset, values.size);
  const assetId = plan.assetId;
  const out = await resolveWithAncestors(values.out);
  if (!isInside(await resolveWithAncestors(TASK_ROOT), out))
    throw new Error('Write generated files inside analysis/art-generation/.');
  if (await pathExists(out))
    throw new Error('The output path is in use. Use a new output path for each run.');
  const promptText = await readFile(values.prompt, 'utf8');
  if (!promptText.trim()) throw new Error('The generation prompt is empty.');
  const references = [];
  for (const file of values.reference ?? []) references.push(await readReference(file));
  if (values.mask && !references.length) throw new Error('Give the image that the mask edits as the first --reference.');
  const mask = values.mask ? await readMask(values.mask, references[0].bytes) : undefined;
  const request = buildImageRequest({
    promptText,
    size: plan.size,
    assetId,
    referenceImages: references,
    ...(mask ? { mask } : {}),
  });
  const record = {
    model: MODEL,
    assetId,
    requestedSize: plan.size,
    quality: QUALITY,
    outputFormat: 'png',
    background: plan.background,
    inputMode: mask ? 'masked-edit' : references.length ? 'edit' : 'text',
    endpoint: request.endpoint,
    promptSha256: sha256(promptText),
    references: references.map(({ sha256: hash, format, bytes }) => ({
      sha256: hash,
      format,
      bytes: bytes.length,
    })),
    ...(mask ? { mask: { sha256: mask.sha256, bytes: mask.bytes.length } } : {}),
  };
  if (values['dry-run']) {
    console.log(JSON.stringify({ ...plan, ...record, requestConstructed: true, networkRequest: false }));
    return;
  }

  const key = await readApiKey();
  await mkdir(path.dirname(out), { recursive: true });
  await mkdir(out); // An existing run must never cause another paid request.
  await writeFile(path.join(out, 'prompt.txt'), promptText, { flag: 'wx' });
  await writeJson(path.join(out, 'request-record.json'), {
    ...record,
    createdAt: new Date().toISOString(),
  });
  const statusPath = path.join(out, 'status.json');
  const status = (data: Record<string, unknown>) =>
    writeFile(statusPath, `${JSON.stringify(data, null, 2)}\n`);
  await status({ state: 'request-started', automaticRetries: 0 });
  let bytes: Buffer;
  try {
    bytes = await sendImageRequest(request, key);
  } catch (error) {
    const failure = error as { code?: string; status?: number };
    await status({
      state: 'request-failed',
      code: failure.code ?? 'local-error',
      ...(failure.status ? { httpStatus: failure.status } : {}),
      automaticRetries: 0,
    });
    throw error;
  }
  const candidate = path.join(out, 'candidate.png');
  await writeFile(candidate, bytes, { flag: 'wx' });
  await writeJson(path.join(out, 'generation.json'), { ...record, sourceSha256: sha256(bytes) });
  await status({ state: 'response-saved', sourceSha256: sha256(bytes), automaticRetries: 0 });
  let report: ReturnType<typeof inspectPng>;
  try {
    report = inspectPng(bytes, inspectOptions(assetId, plan.size));
  } catch {
    await status({ state: 'candidate-undecodable', automaticRetries: 0 });
    throw new Error(
      'The saved candidate did not decode as an 8-bit RGB or RGBA PNG. Examine the saved candidate before a new request.',
    );
  }
  await writeJson(path.join(out, 'inspection.json'), report);
  await status({
    state: report.valid ? 'visual-review-required' : 'measurement-review-required',
    automaticRetries: 0,
  });
  console.log(JSON.stringify({ candidate, ...summary(report), visualReview: 'required' }));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const { values } = parseArgs({
    args,
    options: {
      asset: { type: 'string' },
      prompt: { type: 'string' },
      reference: { type: 'string', multiple: true },
      mask: { type: 'string' },
      out: { type: 'string' },
      input: { type: 'string' },
      size: { type: 'string' },
      processed: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  });
  const allowed = {
    plan: ['asset', 'size'],
    generate: ['asset', 'prompt', 'reference', 'mask', 'out', 'size', 'dry-run'],
    inspect: ['asset', 'input', 'size', 'processed'],
  }[command as 'plan' | 'generate' | 'inspect'];
  if (!allowed || Object.keys(values).some((key) => !allowed.includes(key)))
    throw new Error('Use a documented helper command and its arguments.');
  if (command === 'plan') {
    console.log(JSON.stringify(planAsset(values.asset, values.size)));
  } else if (command === 'generate') {
    await generate(values);
  } else if (values.input && values.asset) {
    const assetId = values.asset as AssetId;
    const options = inspectOptions(assetId, values.size, values.processed);
    const report = inspectPng(await readFile(values.input), options);
    console.log(JSON.stringify(report));
    if (!report.valid) process.exitCode = 1;
  } else throw new Error('Give --asset and --input to inspect.');
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'The art helper failed.');
    process.exitCode = 1;
  });
}
