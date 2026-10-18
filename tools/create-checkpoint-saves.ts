// Synthetic saves at every preparation checkpoint, for manual checks without playing the whole campaign.
// Each save has its preparations paid, the quests that the next preparation needs delivered, and the exact coins for the next reveal.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { currentTask, requiredQuests } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import type { GameData, GameState } from '../src/model.ts';
import { exportSave } from '../src/storage.ts';

/**
 * The state before the payment of the preparation at index count: the earlier preparations are paid, every quest that this
 * preparation needs is delivered in data order, and the coins equal its cost. A checkpoint keeps no scene from earlier payments,
 * so its own payment shows only the scenes that it earns. The finished checkpoint keeps the scenes earned by the last payment.
 */
export function checkpointState(data: GameData, count: number, start: GameState = createGame(data)): GameState {
  let state = structuredClone(start);
  for (;;) {
    for (const quest of requiredQuests(state.taskIndex, data)) if (!state.completedQuests.includes(quest.id)) state.completedQuests.push(quest.id);
    state.coins = currentTask(state, data)?.cost ?? 0;
    if (state.taskIndex < data.tasks.length) {
      state.pendingScenes = [];
      delete state.sceneLines;
    }
    if (state.taskIndex >= count) return state;
    const result = reduceGame(state, { type: 'task' }, data);
    if (!result.ok) throw new Error(`${data.tasks[state.taskIndex].title}: ${result.message}`);
    state = result.state;
  }
}

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const target = new URL('../tmp/checkpoint-saves/', import.meta.url);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (let count = 0; count <= data.tasks.length; count++) {
    const state = checkpointState(data, count), next = currentTask(state, data);
    const name = `${String(count).padStart(2, '0')}-${next ? `next-${next.title.toLowerCase().replaceAll(' ', '-')}` : 'finished'}`;
    // The same envelope and checks as Export saved game, so every file imports.
    await writeFile(new URL(`${name}.json`, target), exportSave(state, candidate => validateGame(candidate, data)));
  }
  console.log(`Created ${data.tasks.length + 1} checkpoint saves in tmp/checkpoint-saves/. Import one from Options, with Import saved game.`);
}
