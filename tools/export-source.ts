import { mkdir, cp, rm, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { runtimeFiles, fontFiles } from './build.ts';

const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'.release/scary-snacks-source');
// The export keeps the repository's own ignore rules, so a repository made from it also ignores .env.local and the local folders private/ and analysis/.
export const sourceFiles=[...runtimeFiles,'public/data/game.json',...fontFiles.map(path=>`public/${path}`),
  'package.json','package-lock.json','tsconfig.json','playwright.config.ts','.fallowrc.json','.gitignore','README.md','PRODUCT.md','DESIGN.md','DELIVERY.md',
  'tools/build.ts','tools/build-image-variants.ts','tools/server.ts','tools/create-original-data.ts','tools/create-checkpoint-saves.ts','tools/export-source.ts',
  'tests/assets.test.ts','tests/build.test.ts','tests/server.test.ts','tests/engine.test.ts','tests/storage.test.ts','tests/decorations.test.ts','tests/source-export.test.ts','tests/browser/game.spec.ts','tests/browser/renovation.spec.ts','tests/browser/decorations.spec.ts','tests/browser/generators.spec.ts',
  'tests/quests.test.ts','tests/guests.test.ts','tests/regulars.test.ts','tests/browser/quests.spec.ts','tests/browser/visitors.spec.ts','tests/browser/guests.spec.ts',
  'tools/campaign-balance.ts','tests/campaign-balance.test.ts','tests/campaign-goals.test.ts','tests/economy.test.ts','tests/browser/campaign-goals.spec.ts',
  'tests/board-clearing.test.ts','tests/browser/board-clearing.spec.ts',
  'tests/preparation-blockers.test.ts','tests/browser/preparation-blockers.spec.ts',
  'tests/browser/blocker-help.spec.ts',
  'tests/story.test.ts','tests/browser/story.spec.ts',
  'tests/checkpoint-saves.test.ts','tests/support.ts','tests/browser/support.ts','tests/browser/portrait-framing.spec.ts',
  'docs/asset-prompts.json','docs/asset-provenance.json','docs/asset-variants.json','docs/font-provenance.json','docs/release-notes.md','docs/verification.md','docs/economy.md',
  '.github/workflows/pages.yml',
];
const record: { assets: { file: string }[] }=JSON.parse(await readFile(resolve(root,'docs/asset-provenance.json'),'utf8'));
for(const asset of record.assets){
  if(!/^public\/assets\/original\/[a-z0-9-]+\.png$/.test(asset.file))throw new Error('Unapproved export asset.');
  sourceFiles.push(asset.file);
}
const variants: { variants: { file: string }[] }=JSON.parse(await readFile(resolve(root,'docs/asset-variants.json'),'utf8'));
for(const variant of variants.variants){
  if(!/^public\/assets\/variants\/[a-z0-9-]+-\d+x\d+\.(avif|webp)$/.test(variant.file))throw new Error('Unapproved export variant.');
  sourceFiles.push(variant.file);
}
if (import.meta.main) {
  await rm(output,{recursive:true,force:true});
  for(const file of sourceFiles){const target=resolve(output,file);await mkdir(dirname(target),{recursive:true});await cp(resolve(root,file),target);}
  console.log(`Exported ${sourceFiles.length} files to ${output}. No Git history and no file from private/ or analysis/ were copied.`);
}
