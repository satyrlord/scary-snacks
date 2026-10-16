// Synthetic saves at every preparation checkpoint, for manual checks without playing the whole campaign.
// Each save has its preparations paid and the exact coins and counters for the next reveal.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createGame, currentTask, reduceGame, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';
import { exportSave } from '../src/storage.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const target = new URL('../.tools/checkpoint-saves/', import.meta.url);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
let state = createGame(data);
for (;;) {
  const next = currentTask(state, data);
  state.coins = next?.cost ?? 0;
  if (next) {
    state.served = next.goals.served;
    state.merges = next.goals.merges;
  }
  const name = `${String(state.taskIndex).padStart(2, '0')}-${next ? `next-${next.title.toLowerCase().replaceAll(' ', '-')}` : 'finished'}`;
  // The same envelope and checks as Export saved game, so every file imports.
  await writeFile(new URL(`${name}.json`, target), exportSave(state, candidate => validateGame(candidate, data)));
  if (!next) break;
  const result = reduceGame(state, { type: 'task' }, data);
  if (!result.ok) throw new Error(`${next.title}: ${result.message}`);
  state = result.state;
}
console.log(`Created ${data.tasks.length + 1} checkpoint saves in .tools/checkpoint-saves/. Import one from the House book, with Import saved game.`);
