import test from 'node:test';
import assert from 'node:assert/strict';
import { encoderSettings, keptVariants, plannedKeys } from '../tools/build-image-variants.ts';
import type { Variant, VariantRecord } from '../tools/build-image-variants.ts';

const encoder = 'sharp 1.0.0 (libvips 1.0.0)';
const asset = { id: 'scene-sheet-9', file: 'public/assets/original/scene-sheet-9.png', sha256: 'master' };
const plan = { widths: [1024], formats: ['webp'], cells: { columns: 2, rows: 1, names: ['scene-left', 'scene-right'] } } as const;
const variant = (name: string): Variant => ({ file: `public/assets/variants/${name}-1024x683.webp`, master: asset.id, masterSha256: 'master', width: 1024, height: 683, format: 'webp', bytes: 10, sha256: `${name}-hash` });
const recorded = [variant('scene-left'), variant('scene-right')];
const record = (variants: Variant[] = recorded, values: Partial<VariantRecord> = {}): VariantRecord => ({ tool: 'tools/build-image-variants.ts', encoder, settings: encoderSettings, cellPlans: { [asset.id]: plan.cells }, variants, ...values });
const disk = new Map(recorded.map(value => [value.file, value.sha256]));

test('a plan asks for each named cell at each width and format', () => {
  assert.deepEqual(plannedKeys(asset.id, plan), ['scene-left@1024.webp', 'scene-right@1024.webp']);
  assert.deepEqual(plannedKeys('room', { widths: [768, 1536], formats: ['avif', 'webp'] }), ['room@1536.avif', 'room@1536.webp', 'room@768.avif', 'room@768.webp']);
});

test('the build keeps the recorded variants of an unchanged master', () => {
  assert.deepEqual(keptVariants(asset, plan, record(), encoder, disk), recorded);
});

test('the build encodes a sheet again when its cell positions or grid change', () => {
  for (const cells of [
    { ...plan.cells, names: ['scene-right', 'scene-left'] },
    { ...plan.cells, columns: 1, rows: 2 },
    { ...plan.cells, columns: 3, names: ['scene-left', null, 'scene-right'] },
  ]) assert.equal(keptVariants(asset, { ...plan, cells }, record(), encoder, disk), undefined);
  assert.equal(keptVariants(asset, plan, record(recorded, { cellPlans: undefined }), encoder, disk), undefined, 'a sheet without recorded cell positions must be encoded');
});

test('the build encodes a master again when it is new, changed, replanned, damaged on disk, or the encoder changed', () => {
  assert.equal(keptVariants(asset, plan, record([]), encoder, disk), undefined, 'a new master has no recorded variants');
  assert.equal(keptVariants({ ...asset, sha256: 'other' }, plan, record(), encoder, disk), undefined, 'the master changed');
  assert.equal(keptVariants(asset, { ...plan, widths: [512, 1024] }, record(), encoder, disk), undefined, 'the plan asks for another width');
  assert.equal(keptVariants(asset, { ...plan, cells: { ...plan.cells, names: ['scene-left', null] } }, record(), encoder, disk), undefined, 'the plan retired a cell');
  assert.equal(keptVariants(asset, plan, record(), encoder, new Map([...disk, [recorded[1].file, 'edited']])), undefined, 'a file differs from its record');
  assert.equal(keptVariants(asset, plan, record(), encoder, new Map([[recorded[0].file, recorded[0].sha256]])), undefined, 'a file is missing');
  assert.equal(keptVariants(asset, plan, record(), 'sharp 2.0.0 (libvips 2.0.0)', disk), undefined, 'the encoder changed');
  assert.equal(keptVariants(asset, plan, record(recorded, { settings: { ...encoderSettings, webp: { ...encoderSettings.webp, quality: 90 } } }), encoder, disk), undefined, 'the settings changed');
  assert.equal(keptVariants(asset, plan, undefined, encoder, disk), undefined, 'there is no record');
});
