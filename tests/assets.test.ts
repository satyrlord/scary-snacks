import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { runtimeFiles } from '../tools/build.ts';

test('the PNG masters match their provenance records',async()=>{
  const record=JSON.parse(await readFile('docs/asset-provenance.json','utf8'));
  assert.equal(record.assets.length,37);
  const names=await readdir('public/assets/original');
  assert.deepEqual(names.sort(),record.assets.map((a: { file: string })=>a.file.split('/').at(-1)).sort());
  for(const asset of record.assets){assert.equal(asset.sourceGameImageInput,false);const bytes=await readFile(asset.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.id);assert.ok(asset.width>1000);}
});

test('each document that counts the PNG masters gives the number in the provenance record',async()=>{
  const count=JSON.parse(await readFile('docs/asset-provenance.json','utf8')).assets.length;
  for(const file of ['AGENTS.md','PRODUCT.md','DESIGN.md','DELIVERY.md','docs/release-notes.md']){
    const counts=[...(await readFile(file,'utf8')).matchAll(/(\d+) (?:generated |registered )?(?:Portable Network Graphics \(PNG\) |PNG )?masters/g)].map(match=>Number(match[1]));
    assert.ok(counts.length,file);
    for(const value of counts)assert.equal(value,count,file);
  }
});

for(const atlas of ['visitor-portraits','guests'])test(`the four ${atlas} portraits stay inside their cells`,async()=>{
  const {data,info}=await sharp(`public/assets/original/${atlas}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,info.height);assert.equal(info.width%2,0);
  const side=info.width/2,alpha=(x: number,y: number)=>data[(y*info.width+x)*4+3];
  for(let cell=0;cell<4;cell++){
    let painted=0;
    for(let y=0;y<side;y++)for(let x=0;x<side;x++)if(alpha(cell%2*side+x,Math.floor(cell/2)*side+y)>=128)painted++;
    assert.ok(painted>side*side/4,`Portrait ${cell} is present and opaque.`);
  }
  const edgeLimit=atlas==='guests'?2:1;
  for(let y=0;y<info.height;y++)for(const x of [0,side-1,side,info.width-1])assert.ok(alpha(x,y)<edgeLimit,'No visible portrait crosses a column edge.');
  for(let x=0;x<info.width;x++)for(const y of [0,side-1,side,info.height-1])assert.ok(alpha(x,y)<edgeLimit,'No visible portrait crosses a row edge.');
});

test('the board clutter sprites stay inside their cells and leave overlay centers open',async()=>{
  const {data,info}=await sharp(await readFile('public/assets/original/board-clutter.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height,info.channels],[1536,1024,4]);
  const alpha=(x: number,y: number)=>data[(y*info.width+x)*info.channels+3];
  for(const x of [511,512,1023,1024])for(let y=0;y<info.height;y++)assert.ok(alpha(x,y)<16,`painted pixel crosses column seam at ${x},${y}`);
  for(const y of [511,512])for(let x=0;x<info.width;x++)assert.ok(alpha(x,y)<16,`painted pixel crosses row seam at ${x},${y}`);
  for(const x of [768,1280])assert.ok(alpha(x,768)<16,`overlay at ${x} covers its center`);
});

test('the preparation clutter atlas has twelve opaque objects inside clear square cells',async()=>{
  const {data,info}=await sharp('public/assets/original/preparation-clutter.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height,info.channels],[1448,1086,4]);
  const side=info.width/4;
  assert.equal(info.height/3,side);
  const alpha=(x: number,y: number)=>data[(y*info.width+x)*4+3];
  for(let row=0;row<3;row++)for(let column=0;column<4;column++){
    let painted=0;
    for(let y=0;y<side;y++)for(let x=0;x<side;x++){
      const value=alpha(column*side+x,row*side+y);
      if(value>=128)painted++;
      if(x<16||y<16||x>=side-16||y>=side-16)assert.ok(value<16,`Object ${row*4+column} crosses its clear margin.`);
    }
    assert.ok(painted>side*side*0.15,`Object ${row*4+column} is present and opaque.`);
  }
  for(const x of [361,362,723,724,1085,1086])for(let y=0;y<info.height;y++)assert.ok(alpha(x,y)<2,`Visible paint crosses column seam at ${x},${y}.`);
  for(const y of [361,362,723,724])for(let x=0;x<info.width;x++)assert.ok(alpha(x,y)<2,`Visible paint crosses row seam at ${x},${y}.`);
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
