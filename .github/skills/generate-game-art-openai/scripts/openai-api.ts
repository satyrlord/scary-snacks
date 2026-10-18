// OpenAI Images application programming interface (API) transport. Do not read credentials here.
// Do not print provider response bodies.
import { readFileSync } from 'node:fs';
import type { GameData } from '../../../../src/model.ts';

export const MODEL = 'gpt-image-2.5-flare';
export const QUALITY = 'high';
const API_ROOT = 'https://api.openai.com/v1/images/';
const MAX_REFERENCES = 16;
const MAX_REFERENCE_BYTES = 50_000_000;

// Read the current room states from public/data/game.json.
// State 00 of the front room shows the new game. Each other state shows its area after one preparation.
const gameData: GameData = JSON.parse(readFileSync(new URL('../../../../public/data/game.json', import.meta.url), 'utf8'));
type RoomStateId = `front-room-${string}` | `courtyard-${string}`;
export type AssetId =
  | 'menu-atlas'
  | 'portraits'
  | 'regulars-1'
  | 'regulars-2'
  | 'regulars-3'
  | 'mascots'
  | 'timber-tabletop'
  | 'embroidered-runner'
  | 'decoration-front'
  | 'decoration-courtyard'
  | 'board-clutter'
  | RoomStateId;
type Background = 'transparent' | 'opaque';
interface AssetContract {
  background: Background;
  shape: 'square' | 'landscape-3x1' | 'landscape-3x2' | 'portrait-3x4';
  columns: number;
  rows: number;
  blankCells?: readonly number[];
  defaultSize: string;
}
export interface ReferenceImage {
  bytes: Buffer;
  format: string;
}
interface ImageRequest {
  assetId: AssetId;
  endpoint: string;
  body: string | FormData;
  contentType?: string;
}

// These contracts select the assets that the API helper supports.
// The provenance record contains more assets than this table.
// The room states and decoration paintings are opaque 3:4 portrait images.
const roomState: AssetContract = { background: 'opaque', shape: 'portrait-3x4', columns: 1, rows: 1, defaultSize: '1536x2048' };
const portraitAtlas: AssetContract = { background: 'transparent', shape: 'square', columns: 2, rows: 2, defaultSize: '1536x1536' };
const ASSETS: Readonly<Record<AssetId, AssetContract>> = Object.freeze({
  ...(Object.fromEntries(gameData.rooms.map(state => [state.id, roomState])) as Record<RoomStateId, AssetContract>),
  'decoration-front': roomState,
  'decoration-courtyard': roomState,
  'board-clutter': {
    background: 'transparent',
    shape: 'landscape-3x2',
    columns: 3,
    rows: 2,
    defaultSize: '1536x1024',
  },
  'menu-atlas': {
    background: 'transparent',
    shape: 'square',
    columns: 6,
    rows: 6,
    defaultSize: '1536x1536',
  },
  portraits: portraitAtlas,
  // Ten regulars use these atlases in arrival order. The last atlas has two empty lower cells.
  'regulars-1': portraitAtlas,
  'regulars-2': portraitAtlas,
  'regulars-3': { ...portraitAtlas, blankCells: [2, 3] },
  mascots: portraitAtlas,
  'timber-tabletop': {
    background: 'opaque',
    shape: 'square',
    columns: 1,
    rows: 1,
    defaultSize: '1536x1536',
  },
  'embroidered-runner': {
    background: 'opaque',
    shape: 'landscape-3x1',
    columns: 1,
    rows: 1,
    defaultSize: '1536x512',
  },
});

export function assetContract(assetId: unknown): AssetContract {
  if (typeof assetId !== 'string' || !Object.hasOwn(ASSETS, assetId))
    throw new Error(`Use one of these asset identifiers: ${Object.keys(ASSETS).join(', ')}.`);
  return ASSETS[assetId as AssetId];
}

// The size limits come from the OpenAI image generation guide for GPT Image 2.5 models.
export function validateAssetSize(assetId: unknown, size: unknown) {
  const asset = assetContract(assetId);
  const match = typeof size === 'string' ? /^([1-9]\d*)x([1-9]\d*)$/u.exec(size) : null;
  if (!match) throw new Error('Use WIDTHxHEIGHT for the size.');
  const width = Number(match[1]);
  const height = Number(match[2]);
  const pixels = width * height;
  if (width % 16 !== 0 || height % 16 !== 0)
    throw new Error('Use a width and a height that are multiples of 16.');
  if (Math.max(width, height) > 3840) throw new Error('Use no more than 3840 pixels on an edge.');
  if (Math.max(width, height) > 3 * Math.min(width, height))
    throw new Error('Use an aspect ratio between 1:3 and 3:1.');
  if (pixels < 655_360 || pixels > 8_294_400)
    throw new Error('Use between 655,360 and 8,294,400 pixels.');
  const shapes = {
    square: [width === height, 'Use a square size for this asset.'],
    'landscape-3x1': [width === height * 3, 'Use a 3:1 landscape size for this strip.'],
    'landscape-3x2': [width * 2 === height * 3, 'Use a 3:2 landscape size for this atlas.'],
    'portrait-3x4': [width * 4 === height * 3, 'Use a 3:4 portrait size for this room state.'],
  } as const;
  const [shapeMatches, shapeError] = shapes[asset.shape];
  if (!shapeMatches) throw new Error(shapeError);
  if (width % asset.columns !== 0 || height % asset.rows !== 0)
    throw new Error('Use a size that divides into equal grid cells.');
  return { width, height, pixels };
}

export function buildImageRequest({
  promptText,
  size,
  assetId,
  referenceImages = [],
  mask,
}: {
  promptText: string;
  size: string;
  assetId: AssetId;
  referenceImages?: ReferenceImage[];
  // The provider applies a mask to the first reference: its transparent pixels mark the region to repaint.
  mask?: ReferenceImage;
}): ImageRequest {
  const asset = assetContract(assetId);
  validateAssetSize(assetId, size);
  if (typeof promptText !== 'string' || !promptText.trim())
    throw new Error('The generation prompt is empty.');
  if (referenceImages.length > MAX_REFERENCES)
    throw new Error(`Use no more than ${MAX_REFERENCES} reference images.`);
  if (mask && (referenceImages.length === 0 || mask.format !== 'png' || !Buffer.isBuffer(mask.bytes) || mask.bytes.length === 0 || mask.bytes.length >= MAX_REFERENCE_BYTES))
    throw new Error('A mask must be a PNG smaller than 50 MB, sent with the image that it edits.');
  const fields = {
    model: MODEL,
    prompt: promptText,
    size,
    background: asset.background,
    quality: QUALITY,
    output_format: 'png',
    n: 1,
  };
  if (referenceImages.length === 0) {
    return {
      assetId,
      endpoint: `${API_ROOT}generations`,
      body: JSON.stringify(fields),
      contentType: 'application/json',
    };
  }
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, String(value));
  for (const [index, image] of referenceImages.entries()) {
    if (
      !['png', 'jpeg', 'webp'].includes(image.format) ||
      !Buffer.isBuffer(image.bytes) ||
      image.bytes.length === 0 ||
      image.bytes.length >= MAX_REFERENCE_BYTES
    ) {
      throw new Error('Each reference must be a static PNG, JPEG, or WebP smaller than 50 MB.');
    }
    body.append(
      'image[]',
      new Blob([new Uint8Array(image.bytes)], { type: `image/${image.format}` }),
      `reference-${index + 1}.${image.format}`,
    );
  }
  if (mask) body.set('mask', new Blob([new Uint8Array(mask.bytes)], { type: 'image/png' }), 'mask.png');
  return { assetId, endpoint: `${API_ROOT}edits`, body };
}

class ImageRequestError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ImageRequestError';
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

export async function sendImageRequest(request: ImageRequest, key: string): Promise<Buffer> {
  // Recheck the actual payload at the public transport entry point. Callers can
  // construct requests directly or change a request after the builder returns.
  let fields: Record<string, unknown>;
  if (typeof request.body === 'string') {
    try {
      fields = JSON.parse(request.body) as Record<string, unknown>;
    } catch {
      throw new Error('Use a valid image request.');
    }
  } else if (request.body instanceof FormData) {
    fields = Object.fromEntries(request.body.entries());
    for (const field of ['size', 'background', 'model', 'n', 'quality', 'output_format']) {
      if (request.body.getAll(field).length !== 1)
        throw new Error(`Use one ${field} value for the image request.`);
    }
  } else {
    throw new Error('Use a valid image request.');
  }
  const asset = assetContract(request.assetId);
  validateAssetSize(request.assetId, fields.size);
  if (
    fields.background !== asset.background ||
    fields.model !== MODEL ||
    fields.quality !== QUALITY ||
    fields.output_format !== 'png' ||
    ![1, '1'].includes(fields.n as number | string)
  )
    throw new Error('Use the fixed model, quality, format, background, and one image.');
  if (![`${API_ROOT}generations`, `${API_ROOT}edits`].includes(request.endpoint)) {
    throw new Error('Use the fixed OpenAI image endpoint.');
  }
  if (typeof key !== 'string' || !key.trim())
    throw new Error('The local OPENAI_API_KEY is missing.');
  let response: Response;
  try {
    response = await fetch(request.endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(300_000),
      headers: {
        Authorization: `Bearer ${key.trim()}`,
        ...(request.contentType ? { 'Content-Type': request.contentType } : {}),
      },
      body: request.body,
    });
  } catch {
    throw new ImageRequestError(
      'network-outcome-unknown',
      'The image request did not complete. The billing result is unknown. The helper did not retry the request.',
    );
  }
  if (!response.ok) {
    // The provider body can contain private data. Do not log, store, or forward it.
    await response.body?.cancel().catch(() => {});
    const status = response.status;
    const code =
      status === 401 || status === 403
        ? 'authentication-or-access'
        : status === 429
          ? 'rate-or-quota'
          : status >= 500
            ? 'provider-failure'
            : 'request-rejected';
    throw new ImageRequestError(
      code,
      `OpenAI rejected the image request (HTTP ${status}). The helper did not retry the request.`,
      status,
    );
  }
  try {
    const result = (await response.json()) as { data?: { b64_json?: unknown }[] };
    const image = result?.data?.[0]?.b64_json;
    if (
      !Array.isArray(result?.data) ||
      result.data.length !== 1 ||
      typeof image !== 'string' ||
      image.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/u.test(image)
    )
      throw new Error();
    return Buffer.from(image, 'base64');
  } catch {
    throw new ImageRequestError(
      'invalid-response',
      'OpenAI returned no usable image payload. The helper did not retry the request.',
    );
  }
}
