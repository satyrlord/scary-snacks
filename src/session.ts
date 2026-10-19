// The game in this tab: its data, its state, the selected space, and the saves that keep them. The other modules read these
// bindings; only the functions here change them, and each change asks the interface to draw the game again.
import { boardObstacles, getItem } from './model.ts';
import { createGame, reduceGame, repairSave, validateGame } from './engine.ts';
import type { Action, GameData, GameState, Result } from './model.ts';
import { loadSave, saveGame, savedText, SAVE_KEY } from './storage.ts';
import type { LoadResult, WriteResult } from './storage.ts';
import { status } from './dom.ts';
import { modal } from './dialog.ts';
import { storage } from './preferences.ts';

export let data: GameData, state: GameState, selected: number | null = null;
export let saveMessage = '', saveFailed = false, recoveryRequired = false;
// The save text that this tab last read or wrote, and a count that changes with each new state.
let observedSave: string | null = null, gameVersion = 0;
const BLOCKED_STORAGE = 'Not saved: this browser blocks storage, so this game lasts only for this visit.';
export const validate = (candidate: unknown) => validateGame(candidate, data);
export const repair = (candidate: unknown) => repairSave(candidate, data);
export const definition = (code: string) => getItem(code,data)!;
export const itemName = (code: string) => definition(code).name;
export const character = (id: string) => data.characters.find(value => value.id === id)!;
// Players meet generators as ingredient sources: the Flour bin, the Copper pot, and so on. They take ingredients from them.
export const sourceOf = (chain: string) => definition(`generator_${chain}`);
export const sourceOutput = (code: string) => itemName(definition(code).generator!.outputs[0]);
export const matchingBlocker = (code: string) => boardObstacles(state,data).find(obstacle =>
  obstacle.ingredient === code && !state.resolvedObstacles.includes(obstacle.id));

/** What the interface shows after a change: the result of an action and the state before it, or null for a redraw alone. */
export type Change = { result: Result; before: GameState } | null;
let draw: (change: Change) => void = () => {};
let recover: () => void = () => {};
const resets: (() => void)[] = [];
/** The interface draws the game after each change. */
export const onDraw = (listener: (change: Change) => void) => { draw = listener; };
/** Options updates its controls when a live save needs recovery. */
export const onRecovery = (listener: () => void) => { recover = listener; };
/** Each part of the interface ends its own presentation of a game that another game replaces. */
export const onReplace = (listener: () => void) => { resets.push(listener); };
export const redraw = () => draw(null);
export const select = (index: number | null) => { selected = index; };

/** Reads the save of this browser under the game lock and adopts it, or a new game. The data must pass its checks first. */
export async function open(value: GameData): Promise<LoadResult<GameState>> {
  data = value;
  const load = () => loadSave<GameState>(storage, validate, repair);
  const saved = storage&&navigator.locks?await navigator.locks.request(SAVE_KEY,load):load();
  state = saved.state ?? createGame(data);
  // A reload cannot open blocked storage, so that game plays for this visit without the recovery block.
  recoveryRequired = Boolean(storage) && !['loaded','empty'].includes(saved.status);
  observedSave = saved.text;
  saveFailed = !['loaded','empty'].includes(saved.status);
  saveMessage = !storage ? BLOCKED_STORAGE : saveFailed ? `Saved progress could not be loaded. ${saved.error}` : 'Saved in this browser';
  return saved;
}
function reportSave(result: Pick<WriteResult, 'ok' | 'error'>) {
  saveFailed = !result.ok;
  saveMessage = result.ok ? 'Saved in this browser' : storage ? `Not saved: ${result.error}` : BLOCKED_STORAGE;
  for (const line of document.querySelectorAll('.save-status')) line.textContent = saveMessage;
}
export function persist() {
  const result = saveGame(storage, state, validate);
  if (result.ok) observedSave = result.text;
  reportSave(result);
}
/** Replacing the game also ends the presentation of the previous game, in every part of the interface. */
function replaceGame(next: GameState) {
  gameVersion++;
  state = next; selected = null;
  for (const reset of resets) reset();
}
/** Adopts a game that is already saved: an imported game or a new game. */
export function adopt(next: GameState, result: WriteResult) {
  recoveryRequired = false; observedSave = result.text;
  replaceGame(next); reportSave(result); redraw();
}
/**
 * Reads the stored save, not the event value, so a delayed storage event cannot let an old board replace newer progress.
 * The text that this tab last read or wrote needs no parse: only a change by another tab is read and checked.
 */
export function syncSavedGame() {
  if (!recoveryRequired && savedText(storage) === observedSave) return false;
  // A read that fails, or a save that cannot open, leaves the observed text alone, so this tab never takes its own save for a newer one.
  const saved = loadSave<GameState>(storage, validate, repair);
  if (saved.status === 'invalid' || saved.status === 'unsupported') {
    const wasRecovering = recoveryRequired;
    recoveryRequired = true;
    reportSave({ok:false,error:`Saved progress could not be loaded. ${saved.error}`});
    if (!wasRecovering) recover();
    status('Your saved game could not open. Open Options and retry.');
    return false;
  }
  if (saved.status !== 'loaded' || !saved.state) return false;
  observedSave = saved.text;
  recoveryRequired = false;
  replaceGame(saved.state);
  if (modal.open) modal.close();
  reportSave({ok:true,error:null}); redraw();
  status('This game moved on in another tab. The board now shows that progress.');
  return true;
}
/** All game writes share one origin-wide lock. Cancel an action if its board was replaced while it waited. */
export function changeGame(change: () => void, recovery = false) {
  if(recoveryRequired&&!recovery){status('Your saved game could not open. Open Options and retry.');return;}
  const version = gameVersion;
  const run = () => { if (!syncSavedGame() && (!recoveryRequired || recovery) && version === gameVersion) change(); };
  if (storage && navigator.locks) return navigator.locks.request(SAVE_KEY, run);
  run();
}
/** Applies an action. A successful action can also set the selection, so that one drawing shows both. */
export function apply(action: Action, choose?: number | null): Result {
  const before = state, result = reduceGame(state, action, data);
  if (result.ok) {
    // A preparation must be durable before its story or visual reward appears.
    if(action.type==='task'||action.type==='decorate') {
      const saved=saveGame(storage,result.state,validate);reportSave(saved);
      if(!saved.ok) {
        const message=action.type==='decorate'?`The choice was not saved. Your previous choice stays. ${saved.error}`:`The preparation was not saved. No coins were spent. ${saved.error}`;
        const refused={state,ok:false,message,event:null};draw({result:refused,before});return refused;
      }
      observedSave=saved.text;
    }
    gameVersion++;
    state = result.state; if (choose !== undefined) selected = choose; if(action.type!=='task'&&action.type!=='decorate')persist();
  }
  draw({ result, before });
  return result;
}
export const act = (action: Action, choose?: number | null) => changeGame(() => { apply(action, choose); });
