import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runtimeFiles } from '../tools/build.ts';

test('the PNG masters match their provenance records',async()=>{
  const record=JSON.parse(await readFile('docs/asset-provenance.json','utf8'));
  assert.equal(record.assets.length,32);
  const names=await readdir('public/assets/original');
  assert.deepEqual(names.sort(),record.assets.map((a: { file: string })=>a.file.split('/').at(-1)).sort());
  for(const asset of record.assets){assert.equal(asset.sourceGameImageInput,false);const bytes=await readFile(asset.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.id);assert.ok(asset.width>1000);}
});

test('each room-state reference has a generated record, and nothing ships or loads a reference image',async()=>{
  const record=JSON.parse(await readFile('docs/asset-provenance.json','utf8'));
  type Entry={ id: string; sha256: string; sourceGameImageInput: boolean; referenceAsset?: string; referenceSha256?: string };
  const assets: Entry[]=record.assets,references: Entry[]=record.references;
  const known=new Map([...assets,...references].map(entry=>[entry.id,entry]));
  for(const asset of assets)if(asset.referenceAsset){
    const reference=known.get(asset.referenceAsset);
    assert.ok(reference,`${asset.id} names an unknown reference`);assert.equal(reference.sha256,asset.referenceSha256,asset.id);assert.equal(reference.sourceGameImageInput,false,reference.id);
  }
  const names=await readdir('public/assets/original'),variants=await readdir('public/assets/variants');
  for(const reference of references){
    assert.ok(!assets.some(asset=>asset.id===reference.id),reference.id);
    assert.ok(!names.includes(`${reference.id}.png`),`${reference.id} has no master`);
    assert.ok(!variants.some(name=>name.replace(/-\d+x\d+\.\w+$/,'')===reference.id),`${reference.id} has no variants`);
  }
  // The courtyard is also the name of an area, so only its painting's file names count for it.
  for(const path of [...runtimeFiles,'public/data/game.json']){
    const text=await readFile(path,'utf8');
    for(const reference of references)assert.doesNotMatch(text,new RegExp(reference.id==='courtyard'?'courtyard-\\d+x\\d+':`['"/]${reference.id}['"-]`),`${path} names ${reference.id}`);
  }
});

test('shipped image variants match their record and the current masters',async()=>{
  const provenance=JSON.parse(await readFile('docs/asset-provenance.json','utf8'));
  const record=JSON.parse(await readFile('docs/asset-variants.json','utf8'));
  const names=await readdir('public/assets/variants');
  assert.deepEqual(names.sort(),record.variants.map((v: { file: string })=>v.file.split('/').at(-1)).sort());
  for(const variant of record.variants){
    const master=provenance.assets.find((asset: { id: string })=>asset.id===variant.master);
    assert.ok(master,variant.file);assert.equal(variant.masterSha256,master.sha256,`${variant.file} is stale: run npm run assets:build`);
    assert.equal(createHash('sha256').update(await readFile(variant.file)).digest('hex'),variant.sha256,variant.file);
  }
  for(const asset of provenance.assets)assert.ok(record.variants.some((v: { master: string })=>v.master===asset.id),asset.id);
  // The runtime loads only variants that exist, and never a PNG master.
  for(const path of runtimeFiles){
    const text=await readFile(path,'utf8');assert.doesNotMatch(text,/assets\/original\//,path);
    for(const [,name] of text.matchAll(/assets\/variants\/([a-z0-9-]+-\d+x\d+\.(?:avif|webp))/g))assert.ok(names.includes(name),`${path} references a missing variant ${name}`);
  }
});

test('runtime and authored content load assets only from the variant and font folders',async()=>{
  for(const path of [...runtimeFiles,'public/data/game.json']){
    const text=await readFile(path,'utf8');
    for(const [,folder] of text.matchAll(/assets\/([^/'"`\s]+)\//g))assert.ok(['variants','fonts'].includes(folder),`${path} loads from assets/${folder}/`);
  }
});

test('self-hosted fonts and complete licence texts retain their verified source hashes',async()=>{
  const record=JSON.parse(await readFile('docs/font-provenance.json','utf8'));
  assert.equal(record.files.length,4);
  for(const file of record.files){assert.equal(file.modified,false);assert.equal(file.license,'SIL Open Font License 1.1');const bytes=await readFile(file.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);}
});
