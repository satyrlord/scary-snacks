import { createGame, reduceGame, validateGame, generatorOutputs, nextOutput, dataProblems, taskEligibility, resolveRooms, latestArea, resolveDecorations, getItem, resolveQuests, canDeliverQuest, questDeliveryCells, decorationUnlocked, deliveriesSince, unresolvedObstacle, boardObstacles, pendingPreparationObstacles, freeBoardCells, resolveChapters, journalCharacters, resolveNeighbours, arrivalScene, sceneSource } from './engine.ts';
import type { Action, ChapterView, DecorationSlot, DecorationVariant, GameData, GameState, Quest, RoomView, SceneLine, Task } from './engine.ts';
import { loadSave, saveGame, exportSave, importSave, resetSave, SAVE_KEY, MAX_SAVE_BYTES } from './storage.ts';
import type { WriteResult } from './storage.ts';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (text !== undefined) value.textContent = text;
  return value;
};
const button = (text: string, className: string, action: () => unknown) => {
  const value = element('button', className, text);
  value.type = 'button'; value.addEventListener('click', () => action()); return value;
};
// The runtime loads image variants of the PNG masters (npm run assets:build). The atlas keeps its master size, so the sprite bounds below apply to it.
const atlas = new URL('../assets/variants/menu-atlas-1536x1536.webp', import.meta.url).href;
// Measured from the atlas alpha channel: each sprite's bounds, padded only where no neighbouring sprite intrudes.
// The generated sprites overflow a regular 256px grid, so clipping to these bounds isolates them without modifying pixels.
// Where two sprites' bounds overlap, the bounds split at the middle of the overlap.
const spriteBounds = [[25,53,237,208],[267,92,247,176],[519,50,241,209],[779,76,239,181],[1029,61,237,203],[1269,37,248,225],[18,292,241,204],[261,315,254,187],[519,298,242,197],[765,294,249,204],[1015,312,269,181],[1284,298,237,199],[20,544,240,205],[277,552,221,191],[522,512,226,236],[769,553,257,201],[1035,517,262,241],[1327,508,156,251],[15,779,244,237],[290,762,222,252],[523,744,241,254],[797,775,199,224],[1045,768,181,240],[1299,768,218,242],[23,1035,237,193],[276,1038,217,187],[493,1039,283,180],[791,1007,201,226],[1008,1036,249,197],[1252,1030,269,212],[23,1234,230,256],[267,1242,263,248],[529,1243,269,243],[801,1246,205,242],[1006,1257,292,233],[1299,1281,217,203]];
// Sprites share one scale unless a side is larger than SPRITE_VIEW atlas pixels.
const SPRITE_VIEW = 246;
// Rendering replaces the controls in these regions, so focus is restored by region and position.
const FOCUS_REGIONS = '#board,#tickets,#story,#item-detail,#offer';
const TONE_EVENTS = ['merge', 'deliverQuest', 'task'];
const modal = $<HTMLDialogElement>('#modal');
const toastStack = $('#toast-stack');
const svg = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
const reason = (error: unknown) => error instanceof Error ? error.message : String(error);
const THEME_KEY = 'scary-snacks-theme';
// The area the room shows when the player chose one: a viewing preference, kept apart from the save.
const AREA_KEY = 'scary-snacks-area';
const THEMES = [['system','System'],['light','Light'],['dark','Dark']];
const phone = matchMedia('(max-width: 720px)');
// Up to this width the kitchen uses sheets; wider screens dock it beside the room.
const drawerLayout = matchMedia('(max-width: 1023px)');
// Short screens put the kitchen in page flow and have no drawer handle.
const movableDrawer = matchMedia('(max-width: 1023px) and (height > 600px)');
// Reduced motion keeps every outcome and line of text, without the flights, the drawer's movement, the fades, or the bats.
const still = matchMedia('(prefers-reduced-motion: reduce)');
// The delivery timeline: the dishes land on the ticket, a notice reports the reward, and the next request arrives in the same place.
// RISE_AT sets the arrival delay in style.css; ARRIVAL_MS covers the arrival.
const FLIGHT_MS = 600, RISE_AT = 700, ARRIVAL_MS = 1300;
// The reveal timeline: the drawer lowers, the new state comes into focus, the pin lands, and the drawer rises again.
const LOWER_MS = 650, FOCUS_MS = 1200, SETTLE_MS = 1400;
const TOAST_MS = 4200, TOAST_OUT_MS = 300;
// A room painting is shown as wide as the room: the phone's full width, or the room half of a wider screen.
const ROOM_SIZES = '(max-width: 1023px) 100vw, max(50vw, 75vh)';
// Numbers follow the page language, like the words around them. Compact totals truncate so they never overstate the purse.
const locale = document.documentElement.lang;
const plural = new Intl.PluralRules(locale);
const count = new Intl.NumberFormat(locale);
const compact = new Intl.NumberFormat(locale, { notation:'compact', maximumFractionDigits:1, roundingMode:'trunc' });
const names = new Intl.ListFormat(locale, { type:'conjunction' });
const coinText = (value: number) => `${count.format(value)} ${plural.select(value) === 'one' ? 'coin' : 'coins'}`;
// Mara's note when nothing is selected: the move gesture, in the same words as the other board guidance.
const MOVE_HINT = 'Tap an item, then tap where it should go.';
const BLOCKED_STORAGE = 'Not saved: this browser blocks storage, so this game lasts only for this visit.';
let theme = 'system';
let data: GameData, state: GameState, selected: number | null = null, sound = false, audioContext: AudioContext | null = null;
let saveMessage = '', saveFailed = false, ignoreClick = false, catAsleep = false, freshDishes = 0;
let observedSave: string | null = null, gameVersion = 0, deliveryToken = 0;
let recoveryRequired = false;
let modalReturn: (() => void) | null = null, sceneFlow = false;
// Each waiting scene whose line could not be saved has warned the player once.
const unsavedScenes = new Set<string>();
// The time at which each ticket slot took a new request, so its arrival survives renders.
const arriving: number[] = [];
let dragging: { index: number; id: number; x: number; y: number; ghost: SVGSVGElement | null } | null = null;
let spriteSequence = 0, boardFocus = 0;
// The story scene that the paid preparation earned, which opens after its reveal.
let earnedScene: string | null = null;
// The room: the area it shows, a paid preparation whose change waits for the end of its story, and the next painting while it downloads.
let viewArea = '', held: Task | null = null, revealToken = 0, paintingToken = 0, preloaded: HTMLPictureElement | null = null, lowered = false, swipe = 0;
let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* Session play remains available. */ }
const validate = (candidate: unknown) => validateGame(candidate, data);
const definition = (code: string) => getItem(code,data)!;
const itemName = (code: string) => definition(code).name;
const character = (id: string) => data.characters.find(value => value.id === id)!;
// Players meet generators as ingredient sources: the Flour bin, the Copper pot, and so on. They take ingredients from them.
const sourceOf = (chain: string) => Object.values(data.items).find(item => item.generator && item.chain === chain)!;
const chosenOutput = (code: string) => nextOutput(state,code,data)!;
const sourceOutput = (code: string) => generatorOutputs(state,code,data).map(itemName).join(' or ');
const matchingBlocker = (code: string) => boardObstacles(state,data).find(obstacle =>
  obstacle.ingredient === code && !state.resolvedObstacles.includes(obstacle.id));
function status(text: string) { $('#status').textContent = text; }
/** A short notice that reports itself and clears on its own: used where the game should not stop for a tap. */
function toast(text: string) {
  const note = element('p', 'toast', text); note.setAttribute('aria-atomic', 'true');
  toastStack.append(note);
  setTimeout(() => { note.classList.add('leaving'); setTimeout(() => note.remove(), still.matches ? 0 : TOAST_OUT_MS); }, TOAST_MS);
}
/** Mara's note for a selected item, which the status region announces. On phones the note leaves out the name, which the selection strip shows. */
function selectionLine(code: string) {
  const def = definition(code), name = phone.matches ? '' : `${itemName(code)}: `;
  const line = def.generator ? `tap it to take more ${itemName(chosenOutput(code))}.` : def.next ? 'tap another to merge, or an empty space to move it.' : 'a final dish. Deliver it, or tap an empty space to move it.';
  return name ? name + line : line[0].toUpperCase() + line.slice(1);
}
/** Board cells pulse after a render; the next render removes the pulse. */
function pulse(cells: number[]) { for (const at of cells) $(`[data-cell="${at}"]`).classList.add('hint'); }
// Square crops within each portrait cell: left, top, and side as fractions of the cell.
// Face scale and eye lines guide these crops; headwear and upper-body identity remain visible.
const portraitFrames: Record<string, readonly [number, number, number]> = {
  mara: [.08,0,.84], ilie: [.07,0,.86], eszter: [.09,0,.82], sorin: [.1,0,.8],
  adrian: [.11,.1,.78], monica: [.1,.14,.78], janos: [.11,.08,.8], ionatan: [.08,.045,.84],
  vlad: [.06,0,.88], elisabeta: [.06,0,.88], mina: [.11,.07,.8], avram: [.1,.09,.8],
  dochia: [.08,.015,.84], victor: [.08,0,.84], ana: [.08,0,.84], costel: [.07,0,.86],
  sanziana: [.07,.015,.86], dorian: [.08,0,.84], ileana: [.09,.015,.82], cezar: [.07,.01,.86],
  catalina: [.1,.06,.82], bran: [.1,.03,.82],
};
function portrait(id: string) {
  const person = character(id);
  const value = element('span', `portrait portrait-${person.sprite}${person.portraitAtlas ? ` ${person.portraitAtlas}-portrait` : person.visitor ? ' visitor-portrait' : ''}`);
  const [left,top,side] = portraitFrames[person.id];
  value.style.backgroundSize = `${200/side}% ${200/side}%`;
  value.style.backgroundPosition = `${100*(person.sprite%2+left)/(2-side)}% ${100*(Math.floor(person.sprite/2)+top)/(2-side)}%`;
  value.setAttribute('role', 'img'); value.setAttribute('aria-label', person.name); return value;
}
/** The ingredient-source badge on a board tile: a plus in a disc. */
function sourceMark() {
  const value = svg('svg'); value.setAttribute('class', 'source-mark'); value.setAttribute('viewBox', '0 0 24 24'); value.setAttribute('aria-hidden', 'true');
  const face = svg('circle'); face.setAttribute('cx', '12'); face.setAttribute('cy', '12'); face.setAttribute('r', '11');
  const plus = svg('path'); plus.setAttribute('d', 'M12 7v10M7 12h10');
  value.append(face, plus); return value;
}
/** The coin mark from the purse, for prices inside buttons. */
function coinMark() {
  const value = svg('svg'); value.setAttribute('class', 'coin'); value.setAttribute('viewBox', '0 0 24 24'); value.setAttribute('aria-hidden', 'true');
  const face = svg('circle'); face.setAttribute('class', 'coin-face'); face.setAttribute('cx', '12'); face.setAttribute('cy', '12'); face.setAttribute('r', '9');
  const moon = svg('path'); moon.setAttribute('class', 'coin-moon'); moon.setAttribute('d', 'M15.7 7.6a5 5 0 1 0 0 8.8 4.6 4.6 0 0 1 0-8.8z');
  value.append(face, moon); return value;
}
function food(code: string, extra = '') {
  const index = definition(code).sprite;
  const wine = code === 'drinks_5';
  const rect = wine ? [0,0,256,256] : spriteBounds[index];
  const [x,y,width,height] = rect, side = Math.max(width,height,SPRITE_VIEW);
  const value = svg('svg');
  value.setAttribute('class', `food ${extra}`); value.setAttribute('viewBox',[x+width/2-side/2,y+height/2-side/2,side,side].join(' '));
  const definitions=svg('defs');
  const clip=svg('clipPath');
  const clipId=`food-clip-${++spriteSequence}`;clip.id=clipId;clip.setAttribute('clipPathUnits','userSpaceOnUse');
  const bounds=svg('rect');
  ['x','y','width','height'].forEach((key,index)=>bounds.setAttribute(key,String(rect[index])));
  clip.append(bounds);definitions.append(clip);value.append(definitions);
  const image = svg('image');
  image.setAttribute('href',wine ? new URL('../assets/variants/red-wine-256x256.webp',import.meta.url).href : atlas);
  image.setAttribute('width',wine?'256':'1536');image.setAttribute('height',wine?'256':'1536');
  image.setAttribute('clip-path',`url(#${clipId})`);
  value.append(image);
  value.setAttribute('aria-hidden', 'true'); return value;
}
// Square crops follow visible frame bounds, with a clear margin, and stay inside their source cells.
// This brings the frame towards the tile edge without shrinking the ingredient or exposing a neighbouring sprite.
const blockerFrames = [[47,44,446],[518,8,504],[1041,30,476],[33,515.5,470],[529,512,482],[1047,514,461]];
const preparationFrames = [[54.5,56,263],[422,56.5,267],[766,45.5,277],[1135,65,259],[51,396,275],[419,389.5,274],[769,391,282],[1130,399,274],[40,730.5,287],[410,728,292],[768,730,286],[1120,732.5,288]];
function clutterArt(index: number, className: string, preparation = false) {
  const prefix = preparation ? 'preparation-art' : 'clutter-art';
  const value = element('span', `${prefix} ${prefix}-${index} ${className}`);
  const [x,y,side] = (preparation ? preparationFrames : blockerFrames)[index];
  const [width,height] = preparation ? [1448,1086] : [1536,1024];
  value.style.backgroundSize = `${100*width/side}% ${100*height/side}%`;
  value.style.backgroundPosition = `${100*x/(width-side)}% ${100*y/(height-side)}%`;
  value.setAttribute('aria-hidden', 'true');
  return value;
}
function blockerMark() {
  const value = svg('svg'); value.classList.add('blocker-mark'); value.setAttribute('viewBox','0 0 24 24'); value.setAttribute('aria-hidden','true');
  const circle = svg('circle'); circle.setAttribute('cx','12'); circle.setAttribute('cy','12'); circle.setAttribute('r','10');
  const question = svg('path'); question.setAttribute('d','M9.2 8.5a2.8 2.8 0 0 1 5.6 0c0 2-2.8 2-2.8 4M12 16v.5');
  value.append(circle,question); return value;
}
/** Mark movable matches for the selected blocked ingredient. */
function blockerTargets(index: number): number[] {
  const obstacle = unresolvedObstacle(state,index,data);
  if (!obstacle) return [];
  return state.board.flatMap((cell, at) => {
    const other = unresolvedObstacle(state,at,data);
    return !other && cell?.code === obstacle.ingredient ? [at] : [];
  });
}
function clearSelectionButton() {
  const clear = button('', 'icon-button clear-selection', () => { selected = null; render(); status(MOVE_HINT); });
  clear.setAttribute('aria-label', 'Clear selection');
  const cross = svg('svg'); cross.setAttribute('viewBox','0 0 24 24'); cross.setAttribute('aria-hidden','true');
  const mark = svg('path'); mark.setAttribute('d','m6 6 12 12M18 6 6 18'); cross.append(mark); clear.append(cross);
  return clear;
}
/** Both theme-color metas take the resolved page colour, so the browser chrome follows a forced theme too. */
function syncThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
  if (!color) return;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = color;
}
function setTheme(choice: string, persist = false) {
  theme = THEMES.some(([value]) => value === choice) ? choice : 'system';
  document.documentElement.dataset.theme = theme;
  syncThemeColor();
  if (persist) {
    try { storage?.setItem(THEME_KEY, theme); }
    catch { status('Appearance changed for this session. Browser storage is unavailable.'); }
  }
}
let initialTheme = 'system';
try { initialTheme = storage?.getItem(THEME_KEY) || 'system'; } catch { /* Use the system appearance. */ }
setTheme(initialTheme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeColor);

function playTone(kind: string) {
  if (!sound) return;
  const unavailable = () => {
    sound = false;
    const toggle = document.querySelector('[data-sound-toggle]');
    if (toggle) toggle.textContent = 'Turn sound on';
    status('Sound is unavailable in this browser.');
  };
  try {
    const context = audioContext ||= new AudioContext();
    context.resume().catch(unavailable);
    const now = context.currentTime;
    const frequencies = kind === 'deliverQuest' ? [392, 587.33] : kind === 'task' ? [329.63, 493.88] : [293.66];
    frequencies.forEach((frequency, index) => {
      const tone = context.createOscillator(); const gain = context.createGain();
      tone.type = 'sine'; tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index * .07);
      gain.gain.linearRampToValueAtTime(.045, now + index * .07 + .012);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .07 + .16);
      tone.connect(gain); gain.connect(context.destination);
      tone.start(now + index * .07); tone.stop(now + index * .07 + .18);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    });
  } catch { unavailable(); }
}
function reportSave(result: WriteResult) {
  saveFailed = !result.ok;
  saveMessage = result.ok ? 'Saved in this browser' : storage ? `Not saved: ${result.error}` : BLOCKED_STORAGE;
  for (const line of document.querySelectorAll('.save-status')) line.textContent = saveMessage;
}
function persist() {
  const result = saveGame(storage, state, validate);
  if (result.ok) observedSave = JSON.stringify(state);
  reportSave(result);
}
/** Reads the stored save, not the event value, so a delayed storage event cannot let an old board replace newer progress. */
function syncSavedGame() {
  const saved = loadSave<GameState>(storage, validate);
  if (saved.status !== 'loaded' || !saved.state || JSON.stringify(saved.state) === observedSave) return false;
  observedSave = JSON.stringify(saved.state);
  recoveryRequired = false;
  replaceGame(saved.state);
  if (modal.open) modal.close();
  reportSave({ok:true,error:null}); render();
  status('This game moved on in another tab. The board now shows that progress.');
  return true;
}
/** All game writes share one origin-wide lock. Cancel an action if its board was replaced while it waited. */
function changeGame(change: () => void, recovery = false) {
  if(recoveryRequired&&!recovery){status('Your saved game could not open. Open Options and retry.');return;}
  const version = gameVersion;
  const apply = () => { if (!syncSavedGame() && version === gameVersion) change(); };
  if (storage && navigator.locks) return navigator.locks.request(SAVE_KEY, apply);
  apply();
}
function act(action: Action, select?: number | null) { return changeGame(() => { applyAction(action, select); }); }
/** A successful action can also set the selection, so that one render shows both. */
function applyAction(action: Action, select?: number | null) {
  const coins = state.coins, before = state.board.map(cell => cell?.code), known = new Set(state.discovered);
  const result = reduceGame(state, action, data);
  if (result.ok) {
    // A preparation must be durable before its story or visual reward appears.
    if(action.type==='task'||action.type==='decorate') {
      const saved=saveGame(storage,result.state,validate);reportSave(saved);
      if(!saved.ok) {
        const message=action.type==='decorate'?`The choice was not saved. Your previous choice stays. ${saved.error}`:`The preparation was not saved. No coins were spent. ${saved.error}`;
        render();status(message);return {state,ok:false,message,event:null};
      }
      observedSave=JSON.stringify(result.state);
    }
    gameVersion++;
    state = result.state; if (select !== undefined) selected = select; if(action.type!=='task'&&action.type!=='decorate')persist();
    if (result.event && TONE_EVENTS.includes(result.event)) playTone(result.event);
  }
  render();
  if (state.coins > coins) celebrateCoins(state.coins - coins);
  if (result.ok && (result.event === 'merge' || result.event === 'spawn')) {
    // A new dish settles onto its tile; the first one of its kind arrives with a little flourish and goes into the recipe book.
    state.board.forEach((cell, index) => { if (cell && cell.code !== before[index]) $(`[data-cell="${index}"]`).classList.add(known.has(cell.code) ? 'settle' : 'first'); });
    const first = state.discovered.filter(code => !known.has(code) && data.items[code] && !definition(code).generator);
    if (first.length) { freshDishes += first.length; markRecipeBook(); }
  }
  status(result.message);
  return result;
}
/** The recipe book shows how many dishes are new since it was last opened. */
function markRecipeBook() {
  const label = freshDishes ? `, ${freshDishes} new` : '';
  for (const opener of [$('#collection-button'), $('#recipes-button')]) opener.toggleAttribute('data-fresh', freshDishes > 0);
  $('#recipes-button').setAttribute('aria-label', `Recipes${label}`);
  const dishes = Object.values(data.items).filter(item => !item.generator).length;
  $('#discovery-count').textContent = `${state.discovered.filter(code => data.items[code] && !definition(code).generator).length} of ${dishes} dishes discovered${label}`;
}
/**
 * The dishes land on the ticket, a notice reports the reward, and the next request takes the ticket's place.
 * The completion scene waits in Story. After a failed save, the notice says so, and Options offers Retry save.
 */
function deliver(quest: Quest) { return changeGame(() => {
  const slot = activeQuests().indexOf(quest);
  const card = $('#tickets').children[slot] as HTMLElement | undefined;
  const cells = questDeliveryCells(state, quest, data), from = cells.filter(index => index >= 0).map(index => $(`[data-cell="${index}"]`).getBoundingClientRect());
  const codes = quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item));
  const into = card?.getBoundingClientRect();
  arriving[slot] = performance.now();
  const result = applyAction({ type:'deliverQuest', id:quest.id });
  if (!result.ok) { arriving[slot] = 0; renderTickets(); return; }
  if (state.completedQuests.length % 3 === 0) batFlight();
  const message = `${result.message}${saveFailed ? ' This session is not saved. Use Retry save in Options, or export before leaving.' : ''}`;
  const token = deliveryToken;
  const notify = () => { if (token === deliveryToken) toast(message); };
  if (still.matches || !into) notify(); else void fly(codes, from, into).then(notify);
}); }
/** Delivered dishes lift off their tiles, arc over the board and land on the neighbour's ticket, visible all the way. */
function fly(codes: string[], from: DOMRect[], target: DOMRect) {
  return Promise.all(from.map((start, index) => {
    const size = Math.min(start.width, start.height), ghost = food(codes[index], 'deliver-flight');
    ghost.style.left = `${start.left}px`; ghost.style.top = `${start.top}px`; ghost.style.width = ghost.style.height = `${size}px`;
    document.body.append(ghost);
    const dx = target.left + target.width / 2 - (start.left + size / 2), dy = target.top + target.height / 2 - (start.top + size / 2);
    const landed = Math.min(.6, target.height / size);
    return ghost.animate([
      { transform: 'translate(0, 0) scale(1)', easing: 'cubic-bezier(.3,0,.2,1)' },
      { transform: `translate(${dx * .45}px, ${dy * .55 - 40}px) scale(.85)`, offset: .45, easing: 'cubic-bezier(.4,0,.2,1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed})`, opacity: 1, offset: .88 },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed * .9})`, opacity: 0 },
    ], { duration: FLIGHT_MS, delay: Math.min(index, 5) * 60, fill: 'both' }).finished.finally(() => ghost.remove());
  }));
}
/** Replacing the game also ends presentation state from the previous board, including a reveal that has not run. */
function replaceGame(next: GameState) {
  gameVersion++; deliveryToken++;
  cancelDrag(); arriving.fill(0); ticketQuests = [];
  for (const flight of document.querySelectorAll('.deliver-flight')) flight.remove();
  toastStack.replaceChildren();
  state = next; selected = null; freshDishes = 0;
  held = null; earnedScene = null; revealToken++; preloaded = null; viewArea = latestArea(state.decorations, data);
  $('.game-layout').classList.remove('revealing'); $('#room-stage').removeAttribute('data-reveal'); setLowered(false);
}
/** Now and then a bat crosses the dusk beyond the front room's mended window: after each preparation, and after every third delivery. Never while the page is hidden, under reduced motion, or before the window is mended. */
function batFlight() {
  const frame = $('#room-frame');
  if (still.matches || document.hidden || frame.dataset.area !== 'front-room' || frame.dataset.painting === 'front-room-00' || $('#room-stage').hasAttribute('data-failed')) return;
  const sky = $('.window-sky'), bat = element('span', 'mascot bat'); bat.setAttribute('aria-hidden', 'true'); sky.append(bat);
  const { width, height } = sky.getBoundingClientRect();
  bat.animate([
    // In from the right and out to the left, across the upper panes and down past the transom.
    { transform: `translate(${1.05 * width}px, ${.12 * height}px)` },
    { transform: `translate(${.66 * width}px, ${.02 * height}px)`, offset: .35 },
    { transform: `translate(${.3 * width}px, ${.2 * height}px)`, offset: .7 },
    { transform: `translate(${-.45 * width}px, ${.06 * height}px)` },
  ], { duration: 2600, easing: 'ease-in-out' }).finished.finally(() => bat.remove());
}
/** Phones abbreviate large totals so the coins never reach the wordmark; screen readers always hear the exact amount. */
function renderCoins() {
  const short = phone.matches && state.coins >= 10000;
  const label = plural.select(state.coins) === 'one' ? 'coin' : 'coins';
  $('#coins').textContent = short ? compact.format(state.coins) : count.format(state.coins);
  $('#coin-label').textContent = label;
  $('#coin-total').textContent = `${count.format(state.coins)} ${label}`;
  $('#coin-count').classList.toggle('long', state.coins >= 1000);
}
function celebrateCoins(gain: number) {
  const purse = $('#coin-count');
  purse.querySelector('.coin-delta')?.remove();
  purse.classList.remove('gained'); void purse.offsetWidth; purse.classList.add('gained');
  const delta = element('span', 'coin-delta', `+${count.format(gain)}`); delta.setAttribute('aria-hidden', 'true');
  delta.addEventListener('animationend', () => { delta.remove(); purse.classList.remove('gained'); });
  purse.append(delta);
}
function chooseCell(index: number) {
  if (ignoreClick) return;
  const obstacle = unresolvedObstacle(state,index,data);
  if (obstacle) {
    const held = selected !== null ? state.board[selected] : null;
    if (held?.code === obstacle.ingredient) {
      act({ type:'move', from:selected!, to:index }, index);
    } else if (selected === index) {
      selected = null; render(); status(MOVE_HINT);
    } else {
      selected = index;
      render();
      const rule = `${obstacle.name}: merge a movable ${itemName(obstacle.ingredient)} into this space to clear it.`;
      status(obstacle.context ? `${rule} ${obstacle.context}` : rule);
    }
    return;
  }
  const cell = state.board[index];
  // One tap on an ingredient source takes an ingredient and selects the source, so its actions stay in view. A drag only moves it.
  if (cell && definition(cell.code).generator) { selected = index; act({ type:'spawn', index }); return; }
  if (selected === index) { selected = null; render(); status(MOVE_HINT); return; }
  const held = selected !== null ? state.board[selected] : null;
  // A click moves into an empty space or merges a matching pair. Any other item is selected instead; swapping needs a drag.
  if (selected !== null && held && (!cell || (cell.code === held.code && definition(cell.code).next))) {
    act({ type:'move', from:selected, to:index }, index);
    return;
  }
  selected = cell ? index : null;
  render();
  status(cell ? selectionLine(cell.code) : 'Tap an item first, then this space to move it here.');
}
function render() {
  const active = document.activeElement;
  const region = active?.closest<HTMLElement>(FOCUS_REGIONS) ?? null;
  const position = region ? [...region.querySelectorAll('button')].indexOf(active as HTMLButtonElement) : -1;
  const previousCell = $('#board').querySelector<HTMLElement>('.selected')?.dataset.cell;
  // A delivery can use up the selected item.
  if (selected !== null && !state.board[selected] && !unresolvedObstacle(state,selected,data)) selected = null;
  // While an item is selected, its actions take the place of Mara's line.
  $('.game-layout').toggleAttribute('data-selected', selected !== null);
  renderRoom();
  renderCoins();
  const free = freeBoardCells(state,data);
  const pending = pendingPreparationObstacles(state,data).length;
  const targets = selected === null ? [] : blockerTargets(selected);
  const board = $('#board'); board.replaceChildren();
  board.setAttribute('aria-label', `Merge board, ${data.board.columns} columns and ${data.board.rows} rows, ${free} free ${free === 1 ? 'space' : 'spaces'}${pending ? `, ${pending} preparation blockers waiting` : ''}`);
  state.board.forEach((cell, index) => {
    const obstacle = unresolvedObstacle(state,index,data);
    const value = button('', `cell ${obstacle ? `obstacle ${obstacle.type}` : cell ? '' : 'empty'} ${selected === index ? 'selected' : ''} ${targets.includes(index) ? 'blocker-target' : ''}`, () => chooseCell(index));
    value.dataset.cell = String(index);
    const what = obstacle
      ? `${obstacle.name}, blocked ${itemName(obstacle.ingredient)}. Merge a matching movable ingredient into this space to clear it`
      : !cell ? 'empty' : definition(cell.code).generator ? `${itemName(cell.code)}, source of ${sourceOutput(cell.code)}: tap to take an ingredient` : itemName(cell.code);
    value.setAttribute('aria-label', `Row ${Math.floor(index / data.board.columns) + 1}, column ${index % data.board.columns + 1}: ${what}${obstacle?.context ? `. ${obstacle.context}` : ''}`);
    if (targets.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Matching item for the selected blocked ingredient`);
    if (selected === index && obstacle) value.setAttribute('aria-describedby','blocker-rule');
    // One tab stop for the whole board; the arrow keys move between spaces.
    value.tabIndex = index === (selected ?? boardFocus) ? 0 : -1;
    value.setAttribute('aria-pressed', String(selected === index));
    if (cell) {
      value.append(food(cell.code));
      if (definition(cell.code).generator) value.append(sourceMark());
    }
    if (obstacle) value.append(food(obstacle.ingredient));
    if (obstacle?.type === 'clutter') {
      value.append(clutterArt(obstacle.sprite!, 'clutter-object', obstacle.atlas === 'preparation'));
      if (state.taskIndex === 0) value.append(clutterArt(4, 'clutter-overlay'));
    }
    if (obstacle?.type === 'anchored') {
      value.append(clutterArt(5, 'clutter-overlay'));
    }
    if (obstacle) {
      value.append(blockerMark());
      value.title = `Merge another ${itemName(obstacle.ingredient)} into this blocked space. Tap for help.`;
    }
    board.append(value);
  });
  renderTickets(); $('#story').replaceChildren(storyContent(false)); renderDetail(); renderOffer();
  markRecipeBook();
  if (region && position >= 0) {
    const controls = [...region.querySelectorAll('button')];
    const target = [controls[position], ...controls].find(control => control && !control.disabled && control.checkVisibility({ visibilityProperty:true }))
      ?? (previousCell === undefined || board.closest('[inert]') ? null : board.querySelector<HTMLElement>(`[data-cell="${previousCell}"]`))
      ?? (region.id === 'tickets' ? [...document.querySelectorAll<HTMLElement>('#story .story-waiting button,#story-button')].find(control => control.checkVisibility({ visibilityProperty:true })) : null);
    target?.focus({ preventScroll:true });
  }
  syncRoomControls();
}
/** The request on each ticket. A request keeps its ticket, and the next open request takes the first free ticket, in authored order. */
let ticketQuests: string[] = [];
const activeQuests = () => {
  const open = resolveQuests(state, data).filter(view => view.status === 'active').map(view => view.quest);
  const waiting = open.filter(quest => !ticketQuests.includes(quest.id));
  const kept = ticketQuests.map(id => open.find(quest => quest.id === id) ?? waiting.shift()).filter(quest => quest !== undefined);
  const tickets = [...kept, ...waiting]; ticketQuests = tickets.map(quest => quest.id); return tickets;
};
/** The portions of a request that the board holds now, at most the quantity that it needs. */
const onBoard = (code: string, quantity: number) => Math.min(quantity, state.board.filter((cell, index) => cell?.code === code && !unresolvedObstacle(state, index, data)).length);
/** Each request on the counter is a paper ticket on the drawer: the neighbour's portrait, the dishes with their counts, and Deliver. */
function renderTickets() {
  const container = $('#tickets'); container.replaceChildren();
  activeQuests().forEach((quest, slot) => {
    const person = character(quest.character), ready = canDeliverQuest(state, quest, data);
    const card = element('article', 'ticket');
    card.setAttribute('aria-label', `${person.name}’s request: ${quest.title}`);
    card.dataset.quest = quest.id;
    // A ticket that has just taken a delivered request's place arrives in the same slot; the delay survives renders.
    const since = arriving[slot] ? performance.now() - arriving[slot] : Infinity;
    if (since < ARRIVAL_MS) { card.classList.add('arriving'); card.style.setProperty('--rise-delay', `${RISE_AT - Math.round(since)}ms`); }
    const face = portrait(person.id); face.setAttribute('aria-hidden', 'true');
    const labels = quest.requirements.map(({ item, quantity }) => `${quantity} ${itemName(item)}, ${onBoard(item, quantity)} on the board`);
    // The dishes open the request: its words, each dish with its count, and Deliver.
    const dishes = button('', `ticket-items${quest.requirements.length > 2 ? ' many' : ''}`, () => showQuest(quest));
    dishes.setAttribute('aria-label', `${quest.title}: ${labels.join('; ')}`);
    for (const { item, quantity } of quest.requirements) {
      const value = element('span', `ticket-item ${onBoard(item, quantity) === quantity ? 'ready' : ''}`);
      value.append(food(item));
      if (quantity > 1) value.append(element('span', 'ticket-count', `${onBoard(item, quantity)}/${quantity}`));
      dishes.append(value);
    }
    // Phones show the reward alone until the request can be delivered, so three tickets fit the drawer's handle.
    const deliverButton = button('', 'primary-button deliver-button', () => deliver(quest));
    deliverButton.append(element('span', 'deliver-word', 'Deliver'), element('span', 'deliver-dot', ' ·'), ` ${count.format(quest.reward)}`, coinMark());
    deliverButton.disabled = !ready; deliverButton.setAttribute('aria-label', `Deliver ${quest.title} to ${person.name} for ${coinText(quest.reward)}`);
    card.append(face, element('p', 'ticket-name', person.name), dishes, deliverButton); container.append(card);
  });
  if (!container.childElementCount) container.append(element('p', 'tickets-empty', state.taskIndex === data.tasks.length ? 'Every request is delivered. The bistro is yours.' : 'No requests wait now. Pay for the next preparation.'));
}
function miezSprite() {
  const sprite = element('span', `mascot miez-sprite ${catAsleep ? 'cat-sleeping' : 'cat-sitting'}`); sprite.setAttribute('aria-hidden', 'true'); return sprite;
}
function toggleCat() {
  catAsleep = !catAsleep;
  for (const sprite of document.querySelectorAll('.miez-sprite')) { sprite.classList.toggle('cat-sleeping', catAsleep); sprite.classList.toggle('cat-sitting', !catAsleep); }
  status(catAsleep ? 'Miez approves. The warm chair is now officially reserved.' : 'Miez is back on duty. No pastry will go unobserved.'); playTone('merge');
}
/** The story card on wider screens and the Story sheet on phones show the same content; the sheet's title replaces the heading. */
function storyContent(inSheet: boolean) {
  const eligibility = taskEligibility(state, data), task = eligibility.task, views = resolveChapters(state, data);
  const view = views.find(value => value.status === 'current') ?? views.at(-1)!, chapter = view.number;
  const content = document.createDocumentFragment();
  // The chapter title heads the story card, and its steps name the chapter number. The Story sheet keeps the title "Our little bistro".
  if (inSheet) content.append(element('p', 'chapter-name', `Chapter ${chapter} · ${view.chapter.title}`));
  else content.append(element('h2', 'chapter-title', view.chapter.title));
  content.append(element('p', 'chapter-objective', view.chapter.objective), chapterSteps(view, !inSheet));
  // An earned scene waits here until the player finishes or skips it. Cooking never waits for it.
  const waiting = state.pendingScenes[0], scene = waiting ? storyScene(waiting) : null;
  if (waiting) {
    const notice = element('div', 'story-waiting'), read = button('Read now', 'text-button', () => showScene(waiting));
    read.setAttribute('aria-label', `Read now: ${scene?.title ?? 'the waiting scene'}`);
    notice.append(element('p', '', scene?.prompt ?? 'A story scene is waiting.'), read); content.append(notice);
  }
  const body = element('div', 'task-content');
  if (!task) body.append(element('h3', '', 'The table is ready.'), element('p', '', 'The community supper is open, and every request is delivered. The board and the recipe book stay yours.'));
  else {
    body.append(element('h3', '', task.title));
    const requirements = element('ul', 'task-requirements');
    requirements.id = inSheet ? 'sheet-task-requirements' : 'story-task-requirements';
    requirements.setAttribute('aria-label', 'Preparation requirements');
    for (const requirement of eligibility.requirements) {
      const row = element('li');
      row.dataset.requirement = requirement.kind;
      if (requirement.kind === 'space') {
        if (requirement.met) continue;
        row.append(element('span', '', `Free a space on the board for the ${requirement.source}.`));
      } else {
        const label = requirement.kind === 'coins' ? 'Coins' : 'Quests delivered';
        row.append(element('span', '', `${label}: ${count.format(requirement.current)} / ${count.format(requirement.required)}`),
          element('span', 'requirement-status', requirement.met ? 'Complete' : `Need ${count.format(requirement.required - requirement.current)}`));
      }
      requirements.append(row);
    }
    const pay = payButton(task); pay.setAttribute('aria-describedby', requirements.id);
    const actions = element('div', 'task-payment');
    const details = button('Cost details', 'text-button', () => taskCost(task, inSheet));
    details.dataset.workCost = ''; details.setAttribute('aria-label', 'Work and cost');
    actions.append(pay, details); body.append(requirements, actions);
  }
  const links = element('div', 'story-links');
  const journalLink=button('Journal','text-button',journal);journalLink.setAttribute('aria-label','Open the story journal');links.append(journalLink);
  // The drawer can cover the windowsill on phones, so the cat also waits in the Story sheet there.
  const cat = button('', 'cat-visit', toggleCat); const words = element('span');
  words.append(element('strong', '', 'Miez is on kitchen duty.'), element('small', '', 'Give the resident cat some attention.'));
  cat.append(miezSprite(), words);
  // The count is short so that it shares a line with the save state. Screen readers also hear the word "preparations".
  const progress = element('span', '', `${state.taskIndex} of ${data.tasks.length}`); progress.append(element('span', 'visually-hidden', ' preparations'), ' done');
  const foot = element('p', 'story-foot'); foot.append(element('span', 'save-status', saveMessage), progress);
  content.append(body, links, cat, foot); return content;
}
function taskCost(task: Task, inSheet: boolean) {
  const content = element('div', 'task-cost');
  content.append(element('h3', '', task.title), element('p', 'modal-copy', task.work.summary));
  const rows = element('ul', 'task-requirements');
  for (const [label, amount] of [['Materials and supplies', task.work.materials], ['Labour', task.work.labour], ['Total', task.cost]] as const) {
    const row = element('li'); row.append(element('span', '', label), element('span', '', coinText(amount))); rows.append(row);
  }
  content.append(rows, element('p', 'small-copy', `Estimated labour: ${count.format(task.work.hours)} person-hours. This describes the size of the job. There is no waiting timer.`));
  const back = inSheet ? () => {
    const story = storyContent(true);
    const focus = story.querySelector<HTMLElement>('[data-work-cost]')!;
    showModal('Our little bistro', story, focus);
  } : undefined;
  showModal('Work and cost', content, undefined, back);
}
/**
 * Pay for a preparation: from the story card, the Story sheet, or Mara's offer. The game saves the preparation first; the room keeps
 * the previous state until the story ends, and then the change is revealed in place. A failed write spends nothing.
 */
function payButton(task: Task) {
  const pay = button(`Pay · ${count.format(task.cost)}`, 'primary-button pay-button', () => changeGame(() => {
    held = task;
    const waiting = state.pendingScenes, result = applyAction({ type:'task' });
    if (!result.ok) { held = null; return; }
    // The preparation's scene opens at once. A chapter's closing scene, and then the finale, follow the reveal of the payment that earned them.
    earnedScene = state.pendingScenes.find(id => !waiting.includes(id) && id !== task.id) ?? null;
    preloadRoom(task); showScene(task.id, undefined, { paid:true, completion:result.message });
  }));
  pay.append(coinMark()); pay.setAttribute('aria-label', `Pay ${coinText(task.cost)}: ${task.title}`);
  pay.disabled = !taskEligibility(state, data).ready;
  return pay;
}
/**
 * One Pay control at a time: where the story card is on screen, it alone carries Pay. Where it is not (the story lives in a sheet),
 * Mara offers the eligible next preparation by name while no tile is selected, and the Story button carries a copper dot.
 */
function renderOffer() {
  const eligibility = taskEligibility(state, data), task = eligibility.task, offer = $('#offer'), story = $('#story-button');
  const ready = eligibility.ready && !$('#story').checkVisibility();
  $('.game-layout').toggleAttribute('data-offer', ready);
  story.toggleAttribute('data-ready', ready); story.setAttribute('aria-label', ready ? 'Story, a preparation is ready' : 'Story');
  if (!ready) { offer.replaceChildren(); return; }
  const face = portrait('mara'), words = element('p');
  face.setAttribute('aria-hidden', 'true'); words.append(element('strong', '', task!.title), element('span', '', 'Ready when you are.'));
  offer.replaceChildren(face, words, payButton(task!));
}
/** The selection strip's note: how a source works, or which neighbours on the tickets want the item. */
function detailNote(code: string) {
  if (definition(code).generator) return 'Tap it on the board, or use Take. It never runs out.';
  const waiting = [...new Set(activeQuests().filter(quest => quest.requirements.some(requirement => requirement.item === code)).map(quest => character(quest.character).name))];
  return waiting.length ? `${names.format(waiting)} ${waiting.length === 1 ? 'is' : 'are'} waiting for one.` : 'No request on the counter needs it now.';
}
/** An item's six-stage chain as an ordered list with visible names, three to a row. */
function chainOf(code: string) {
  const def = definition(code); const chain = element('ol', 'chain named'); chain.setAttribute('aria-label','Merge chain');
  for (let stage=1;stage<=6;stage++) {
    const id=`${def.chain}_${stage}`; const step=element('li', id===code?'current':'');
    if (id===code) step.setAttribute('aria-current','step');
    const known = state.discovered.includes(id);
    step.append(known ? food(id) : coveredDish(), element('span', '', known ? itemName(id) : 'Not yet')); chain.append(step);
  }
  return chain;
}
/** The item dialog answers the request's question: how to get this item, and how many are at hand. Its title names the item. */
function detailContent(code: string) {
  const def = definition(code), name = itemName(code), source = sourceOf(def.chain);
  const onBoard = state.board.filter(cell => cell?.code === code).length;
  const unlocked = state.board.some(cell => cell?.code === source.id);
  const content = document.createDocumentFragment();
  const direct = generatorOutputs(state,source.id,data).includes(code) && (def.stage > 1 || chosenOutput(source.id) !== code);
  content.append(food(code), element('p','item-how', direct ? `Select the ${source.name}, then choose Take ${name}.` : def.stage > 1 ? `Merge two ${itemName(`${def.chain}_${def.stage - 1}`)} to make ${name}.` : `Tap the ${source.name} to take ${name}.`));
  if (!unlocked) {
    const task = data.tasks.find(value => value.unlock === def.chain);
    content.append(element('p','',`The ${source.name} arrives with ${task ? `the preparation “${task.title}”` : 'a later preparation'}.`), chainOf(code));
    return content;
  }
  const have = onBoard ? `You have ${onBoard} on the board.` : 'You have none yet.';
  content.append(element('p','',have), chainOf(code), button('Show me on the board','secondary-button',() => showWay(code)));
  return content;
}
/** Points at the next step toward an item: the item itself, the highest pair that merges toward it, or its source. */
function showWay(code: string) {
  modal.close();
  const def = definition(code), name = itemName(code);
  const cells = (id: string) => state.board.flatMap((cell, index) => cell?.code === id ? [index] : []);
  // The first cell is selected and the rest pulse, so the selected outline stays visible.
  const point = (at: number[], line: string) => { selected = at[0]; render(); pulse(at.slice(1)); status(line); $(`[data-cell="${at[0]}"]`).focus({ preventScroll:true }); };
  if (cells(code).length) return point(cells(code), `${name} is ready on the board.`);
  for (let stage = def.stage - 1; stage >= 1; stage--) {
    const id = `${def.chain}_${stage}`, pair = cells(id).slice(0, 2);
    if (pair.length === 2) return point(pair, `Tap the other ${itemName(id)} to merge them.`);
    const blocker = matchingBlocker(id);
    if (pair.length && blocker) return point([pair[0], blocker.position], `Tap the blocked ${itemName(id)} to merge and clear it.`);
  }
  const source = sourceOf(def.chain), at = cells(source.id);
  const output = generatorOutputs(state,source.id,data).filter(id => definition(id).stage <= def.stage).at(-1)!;
  if (at.length) point(at, `Use Take ${itemName(output)} on the ${source.name}.`);
}
/** The selected item and its actions take the place of Mara's line under the board, so the player acts without leaving the board. */
function renderDetail() {
  const container = $('#item-detail'); container.replaceChildren();
  const obstacle = selected === null ? null : unresolvedObstacle(state,selected,data);
  container.classList.toggle('blocker-help', !!obstacle);
  container.setAttribute('aria-label', obstacle ? 'Selected blocker' : 'Selected item');
  const cell = selected !== null ? state.board[selected] : null;
  const outputs = cell && definition(cell.code).generator ? generatorOutputs(state,cell.code,data) : [];
  container.classList.toggle('multiple-outputs', outputs.length > 1);
  if (obstacle) {
    const copy = element('div','blocker-copy'), rule = element('p','blocker-rule',
      `Merge another ${itemName(obstacle.ingredient)} into this blocked space.`);
    rule.id = 'blocker-rule';
    copy.append(element('strong','blocker-title',obstacle.name),rule);
    container.append(copy,clearSelectionButton()); fitPin(); return;
  }
  if (!cell) { fitPin(); return; }
  const def = definition(cell.code); const at = selected!;
  const head = element('div','detail-head'); const words = element('div','detail-words');
  words.append(element('h3','',def.name), element('p','detail-next', def.generator ? `Source of ${sourceOutput(cell.code)}` : def.next ? `Two make ${state.discovered.includes(def.next) ? itemName(def.next) : 'a new dish'}` : 'Final dish'), element('p','detail-description',detailNote(cell.code)));
  head.append(food(cell.code), words);
  const actions = element('div','item-actions');
  const takes = element('div','take-actions');
  for (const output of outputs) {
    const take = button('', 'primary-button take-button', () => act({type:'spawn',index:at,output}));
    // Phones show only the output name in a compact row; the accessible name keeps the verb.
    const label = element('span','take-label'); label.append(element('span','take-word','Take '), itemName(output));
    take.append(food(output), label); take.setAttribute('aria-label', `Take ${itemName(output)}`);
    take.setAttribute('aria-pressed', String(output === chosenOutput(cell.code)));
    takes.append(take);
  }
  if (outputs.length === 1) actions.append(takes);
  actions.append(clearSelectionButton());
  container.append(head, actions);
  if (outputs.length > 1) container.append(takes);
  const title = words.firstElementChild as HTMLElement;
  words.classList.toggle('long-name', phone.matches && title.offsetHeight > parseFloat(getComputedStyle(title).lineHeight) * 1.5);
  fitPin();
}
/** Opens the dialog, or replaces what an open dialog shows. Replacing removes the focused control, so focus moves to the given control or to the new title, which screen readers then read. */
function showModal(title: string, content: Node, focus?: HTMLElement, back?: () => void) {
  const replacing=modal.open;
  modalReturn=back ?? null;
  $('#modal-title').textContent=title; $('#modal-body').replaceChildren(content);
  if(!modal.open)modal.showModal();
  if(focus)focus.focus();else if(replacing&&!modal.contains(document.activeElement))$('#modal-title').focus();
}
function showItem(code: string, back?: () => void) { const content=element('div','item-detail');content.append(detailContent(code));showModal(itemName(code),content,undefined,back); }
/** A request on a ticket: who asks and why, each dish with the count on the board, the reward, and Deliver. Each dish opens its help. */
function showQuest(quest: Quest) {
  const content=element('div','quest-view'),people=[quest.character,...quest.companions??[]],head=element('div','quest-heading'),words=element('div');
  words.append(element('p','quest-person',names.format(people.map(id=>character(id).name))));
  for(const id of people)head.append(portrait(id));
  head.append(words);content.append(head);
  for(const line of quest.opening)content.append(element('p','',people.length>1||line.speaker!==quest.character?`${character(line.speaker).name}: ${line.text}`:line.text));
  const requirements=element('ul','quest-requirements');
  for(const {item,quantity} of quest.requirements){
    const have=onBoard(item,quantity),row=element('li'),inspect=button('','quest-item',()=>showItem(item,()=>showQuest(quest)));
    inspect.setAttribute('aria-label',`${quantity} ${itemName(item)}: ${have} of ${quantity} on the board`);
    inspect.append(food(item),element('span','',`${quantity} ${itemName(item)}`),element('span','quest-count',`${have} / ${quantity} on board`));row.append(inspect);requirements.append(row);
  }
  const deliverButton=button(`Deliver · ${count.format(quest.reward)}`,'primary-button quest-deliver',()=>{modal.close();void deliver(quest);});
  deliverButton.append(coinMark());deliverButton.setAttribute('aria-label',`Deliver ${quest.title} for ${coinText(quest.reward)}`);deliverButton.disabled=!canDeliverQuest(state,quest,data);
  const actions=element('div','quest-actions');actions.append(deliverButton);
  content.append(requirements,element('p','quest-reward',`Reward: ${coinText(quest.reward)}`),actions,element('p','quest-note','Delivery uses dishes on the board. There is no deadline.'));
  showModal(quest.title,content);
}
/** The chapter's preparations as steps: done, now, or not yet. Screen readers hear each name; the count repeats it for the eye. */
function chapterSteps(view: ChapterView, numbered: boolean) {
  const row=element('div','chapter-steps'),list=element('ol');list.setAttribute('aria-label',`Chapter ${view.number} preparations`);
  view.tasks.forEach((task,index)=>{
    const step=element('li'),now=view.status==='current'&&index===view.done;step.dataset.step=index<view.done?'done':now?'now':'next';
    step.append(element('span','visually-hidden',`${task.title}: ${index<view.done?'done':now?'now':'not yet'}`));list.append(step);
  });
  const done=element('span','',numbered?`Chapter ${view.number}`:`${view.done} of ${view.tasks.length} done`);done.setAttribute('aria-hidden','true');
  row.append(list,done);return row;
}
/** A preparation scene, a quest completion scene, a chapter's closing scene, the finale, or local news, by its saved ID. An unknown ID has no scene, so the game never invents one. */
function storyScene(id: string) {
  const more=(dialogue: SceneLine[])=>`${character(dialogue[0].speaker).name} has more to say.`,source=sceneSource(id,data);
  switch(source?.kind){
    case 'task':{const {task}=source;return {title:task.title,dialogue:task.dialogue,completion:data.rooms.find(room=>room.after===id)!.text,prompt:more(task.dialogue)};}
    case 'quest':{const {quest}=source;return {title:quest.title,dialogue:quest.completion,completion:'The request is delivered.',prompt:more(quest.completion)};}
    case 'chapter':{const {chapter,number}=source;return {title:`Chapter ${number} complete: ${chapter.title}`,dialogue:chapter.closing,completion:chapter.payoff,prompt:`Chapter ${number} is complete.`};}
    case 'finale':{const {finale}=source;return {title:finale.title,dialogue:finale.dialogue,completion:finale.ending,prompt:'The supper can begin.'};}
    case 'arrival':{const {person}=source;return {title:`${person.name} arrives`,dialogue:person.arrival!,completion:`${person.name} is now a regular. Read more about ${person.name} in the story journal.`,prompt:'A new neighbour has arrived.'};}
    case 'news':{const {news}=source;return {title:news.title,dialogue:news.dialogue,completion:'The news is recorded in the story journal.',prompt:'News has reached the bistro.'};}
    default:return null;
  }
}
/**
 * A waiting scene plays from its saved line until Finish or Skip, which move it to the journal and lead on to the next waiting scene.
 * Close and Escape leave it waiting at its line. A scene that is already read replays from the journal and changes nothing.
 * A paid preparation's scene ends instead with the change that it made, which the room then reveals in place.
 */
function showScene(id: string, backTo?: () => void, options: { paid?: boolean; completion?: string } = {}) {
  const scene=storyScene(id);
  if(!scene){
    const content=element('div');content.append(element('p','save-error','This story scene could not open. Your progress is safe.'),button('Try again','secondary-button',()=>location.reload()));
    showModal('Story unavailable',content);return;
  }
  const completion=options.completion??scene.completion;
  if(!state.pendingScenes.includes(id)){showStory(scene,false,completion,backTo);return;}
  if(!options.paid)sceneFlow=true;
  const read=()=>changeGame(()=>{
    const result=applyAction({type:'readScene',id});if(!result.ok)return;
    // The close of a paid scene starts the reveal, which then opens the next scene that the payment earned.
    if(options.paid){modal.close();return;}
    const next=state.pendingScenes[0];
    if(backTo)backTo();else if(next)showScene(next);else modal.close();
  });
  showStory(scene,options.paid,completion,backTo,{id,label:backTo?'Return':state.pendingScenes.length>1?'Next scene':'Back to the kitchen',finish:read,skip:read});
}
/**
 * The line that the player sees in a waiting scene. The write needs no render, because the dialog already shows the line.
 * A failed write keeps the session: the dialog warns once for each scene, and the player can continue to read.
 */
function recordLine(id: string, line: number, warn: () => void) {
  return changeGame(()=>{
    const result=reduceGame(state,{type:'sceneLine',id,line},data);if(!result.ok)return;
    state=result.state;persist();
    if(saveFailed&&!unsavedScenes.has(id)){unsavedScenes.add(id);warn();}
  });
}
/** A conversation. A waiting scene starts at its saved line and records each change of line. */
function showStory(task: { title: string; dialogue: SceneLine[] }, paid = false, completion = '', backTo?: () => void, end?: { id: string; label: string; finish: () => void; skip: () => void }) {
  const last=task.dialogue.length-1,saved=end?state.sceneLines?.[end.id]??0:0;
  // A release can remove lines, so a saved line past the end starts the scene again.
  let cursor=saved>last?0:saved;
  // The stage is built once and only its words change: the live region stays in place, so each new line is announced, and focus stays on the button pressed.
  const content=element('div'),stage=element('div','story-stage'),words=element('div','story-dialogue'),speaker=element('h3'),said=element('p');
  words.id='story-line';words.setAttribute('aria-live','polite');words.setAttribute('aria-atomic','true');words.append(speaker,said);
  const counter=element('span'),controls=element('div','story-controls'),unsaved=element('p');unsaved.setAttribute('role','status');
  const warn=()=>{unsaved.className='save-error scene-unsaved';unsaved.textContent='This session is not saved. You can keep reading. Use Retry save in Options before you leave.';};
  const move=(step: number)=>{cursor+=step;draw();if(end)void recordLine(end.id,cursor,warn);};
  const back=button('Back','secondary-button',()=>{move(-1);if(back.disabled)forward.focus();});
  const forward=button('Continue','primary-button',()=>{if(cursor<last)move(1);else if(end)end.finish();else if(backTo)backTo();else modal.close();});
  forward.setAttribute('aria-describedby','story-line');
  if(saved>last)content.append(element('p','modal-copy','Someone lost the thread. The conversation starts again from the beginning.'));
  stage.append(portrait(task.dialogue[cursor].speaker),words);controls.append(back,counter,forward);content.append(stage,controls);
  if (end) content.append(button('Skip scene','text-button skip-scene',end.skip));
  if (completion) content.append(element('p','completion-message',completion));
  if (end) content.append(unsaved);
  function draw() {
    const line=task.dialogue[cursor];stage.firstElementChild!.replaceWith(portrait(line.speaker));
    speaker.textContent=character(line.speaker).name;said.textContent=line.text;counter.textContent=`${cursor+1} / ${task.dialogue.length}`;
    back.disabled=cursor===0;forward.textContent=cursor<last?'Continue':paid?'See what changed':end?end.label:backTo?'Return':'Back to the kitchen';
  }
  draw();showModal(task.title,content,forward,backTo);
}
function journal(focusEntry?: string) {
  const content=element('div','journal-list');
  content.append(element('p','modal-copy','Meet your neighbours and read your saved conversations. Reading never gives another reward.'));
  content.append(element('h3','','Neighbours'));
  const people=journalCharacters(state,data);
  // A neighbour who has not arrived is a dashed outline without a name, so the page does not spoil later chapters.
  for(const {person,arrived,delivered} of resolveNeighbours(state,data)){
    if(!arrived){const slot=element('div','journal-entry neighbour-entry not-yet');slot.append(element('span','portrait-outline'),element('span','','Not yet'));content.append(slot);continue;}
    const scene=person.arrival?arrivalScene(person):null,waiting=!!scene&&state.pendingScenes.includes(scene);
    const meet=()=>showStory({title:`Meet ${person.name}`,dialogue:[{speaker:person.id,text:person.introduction}]},false,'',()=>journal(person.id));
    const entry=button('','journal-entry neighbour-entry',()=>waiting?showScene(scene!,()=>journal(person.id)):meet());
    const likes=person.prefers?`Favourites: ${names.format(person.prefers.map(chain=>data.chains.find(value=>value.id===chain)!.name))}`:'';
    const words=element('span','neighbour-words');words.append(element('strong','',person.name),element('span','',person.role));if(likes)words.append(element('span','',likes));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',waiting?`Read ${person.name} arrives`:`Meet ${person.name}`);
    entry.setAttribute('aria-description',`${person.role}${likes?`. ${likes}`:''}. ${delivered} ${delivered===1?'quest':'quests'} delivered.`);
    entry.append(portrait(person.id),words,element('span','',waiting?'New scene':`${delivered} ${delivered===1?'quest':'quests'}`));content.append(entry);
  }
  // The travellers have their introductions too, while they are part of the story.
  for(const person of people.filter(value=>value.visitor)){
    const entry=button('','journal-entry neighbour-introduction',()=>showStory({title:`Meet ${person.name}`,dialogue:[{speaker:person.id,text:person.introduction}]},false,'',()=>journal(person.id)));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',`Meet ${person.name}`);
    entry.append(portrait(person.id),element('strong','',person.name),element('span','',person.role));content.append(entry);
  }
  const completed=resolveQuests(state,data).filter(view=>view.status==='complete'&&people.some(person=>person.id===view.quest.character));
  if(completed.length)content.append(element('h3','','Neighbour quests'));
  for(const {quest} of completed){
    const section=element('section','quest-journal');section.append(element('h4','',quest.title));
    const opening=button('Read request','text-button',()=>showStory({title:quest.title,dialogue:quest.opening},false,'',()=>journal(quest.id)));
    opening.setAttribute('aria-label',`Read request: ${quest.title}`);
    const waiting=state.pendingScenes.includes(quest.id),replay=button('Read completion','journal-entry',()=>showScene(quest.id,()=>journal(quest.id)));
    replay.dataset.journal=quest.id;replay.setAttribute('aria-label',`${waiting?'Read':'Replay'} ${quest.title}`);replay.append(element('span','',waiting?'New scene':character(quest.character).name));section.append(opening,replay);content.append(section);
  }
  const quests=resolveQuests(state,data);
  const sceneEntry=(id: string)=>{
    const scene=storyScene(id)!,waiting=state.pendingScenes.includes(id);
    const entry=button('','journal-entry',()=>showScene(id,()=>journal(id)));entry.dataset.journal=id;
    entry.setAttribute('aria-label',`${waiting?'Read':'Replay'} ${scene.title}`);entry.append(element('strong','',scene.title),element('span','',waiting?'New scene':'Replay'));
    return entry;
  };
  for(const quest of data.quests){
    const news=quest.followUp;
    if(!news||deliveriesSince(state,quest.id)<news.afterDeliveries)continue;
    const section=element('section','quest-journal');section.append(element('h4','','Local news'),sceneEntry(news.id));content.append(section);
  }
  // Each open chapter: its goal while it runs, or its payoff once it is complete, with its preparations and the help of a neighbour.
  content.append(element('h3','','Chapters'));
  for(const view of resolveChapters(state,data).filter(value=>value.status!=='locked')){
    const section=element('section','chapter-journal');section.dataset.chapter=view.chapter.id;
    section.append(element('h4','',`Chapter ${view.number} · ${view.chapter.title}`));
    if(view.status==='complete')section.append(element('p','',view.chapter.payoff));
    else section.append(element('p','',view.chapter.opening),element('p','small-copy',`Goal: ${view.chapter.objective}`));
    const help=quests.find(value=>value.quest.id===view.chapter.contribution)!;
    if(help.status!=='locked')section.append(element('p','small-copy',`${character(help.quest.character).name} helps: ${help.quest.title} · ${
      help.status==='complete'?'Delivered':help.status==='active'?'On the counter':'Waiting for a ticket'}`));
    const steps=element('ul','journal-steps');
    view.tasks.forEach((task,index)=>{
      if(index<view.done){
        // A waiting preparation scene says so. A read one names its room change.
        const waiting=state.pendingScenes.includes(task.id),entry=button('','journal-entry',()=>showScene(task.id,()=>journal(task.id)));entry.dataset.journal=task.id;
        if(waiting)entry.setAttribute('aria-label',`Read ${task.title}`);
        entry.append(element('strong','',task.title),element('span','',waiting?'New scene':`New: ${data.rooms.find(room=>room.after===task.id)!.label}`));section.append(entry);
      }else steps.append(element('li','',`${task.title} · ${index===view.done?'Next':'Not yet'}`));
    });
    if(steps.childElementCount)section.append(steps);
    if(view.status==='complete')section.append(sceneEntry(view.chapter.id));
    content.append(section);
  }
  if(state.taskIndex===data.tasks.length){
    const section=element('section','chapter-journal');section.append(element('h4','','The finale'),sceneEntry(data.finale.id));content.append(section);
  }
  showModal('Story journal',content,focusEntry?content.querySelector<HTMLElement>(`[data-journal="${focusEntry}"]`)??undefined:undefined);
}
/** A plate under a dashed dome cover: the "not yet" mark for a dish nobody has made. */
function coveredDish() {
  const value=svg('svg');value.setAttribute('class','covered-dish');value.setAttribute('viewBox','0 0 48 48');value.setAttribute('aria-hidden','true');
  const dome=svg('path');dome.setAttribute('class','covered-dish-dome');dome.setAttribute('d','M9 33a15 15 0 0 1 30 0');
  const knob=svg('path');knob.setAttribute('d','M24 18v-2.5M21.5 15.5h5');
  const plate=svg('path');plate.setAttribute('d','M6 33h36M10 36.5h28');
  value.append(dome,knob,plate);return value;
}
/** Undiscovered dishes stay covered, so the book never spoils what the kitchen has not made yet. */
function recipeBook() {
  freshDishes=0;markRecipeBook();
  const content=element('div');content.append(element('p','modal-copy','A playful menu inspired by regional foods and drinks. Merge paths are game rules, not cooking recipes. Dishes you have not made yet stay covered.'));
  for(const chain of data.chains) {
    const section=element('section','recipe-chain'),heading=element('h3','',chain.name);section.append(heading);
    // A chain is complete once all six of its dishes are discovered. The mark is derived, never saved, and earns nothing.
    if([1,2,3,4,5,6].every(stage=>state.discovered.includes(`${chain.id}_${stage}`))){
      heading.setAttribute('aria-label',`${chain.name}, complete`);
      const mark=element('span','chain-complete'),check=svg('svg');check.setAttribute('viewBox','0 0 16 16');check.setAttribute('aria-hidden','true');
      const tick=svg('path');tick.setAttribute('d','M3.5 8.5l3 3 6-7');check.append(tick);mark.append(check,element('span','','Complete'));heading.append(mark);
    }
    const grid=element('div','recipe-grid');
    for(let stage=1;stage<=6;stage++) {
      const code=`${chain.id}_${stage}`;
      if(!state.discovered.includes(code)){const slot=element('div','recipe-item not-yet');slot.append(coveredDish(),element('span','','Not yet'));grid.append(slot);continue;}
      const value=button('','recipe-item',()=>showItem(code));value.append(food(code),element('span','',itemName(code)));grid.append(value);
    }
    section.append(grid);content.append(section);
  }
  showModal('The recipe book',content);
}
/** The completed preparations the room shows: a paid preparation waits for the end of its story before its change appears. */
const roomCompleted = () => held ? state.decorations.filter(id => id !== held!.id) : state.decorations;
/** A room painting from its variants, AVIF first. Built before it is shown, it starts to download at once. */
function roomPicture(id: string) {
  const picture=element('picture','room-painting'),url=(width: number,type: string)=>new URL(`../assets/variants/${id}-${width}x${width*4/3}.${type}`,import.meta.url).href;
  picture.dataset.painting=id;
  for(const type of ['avif','webp']){const source=element('source');source.type=`image/${type}`;source.srcset=[768,1536].map(width=>`${url(width,type)} ${width}w`).join(', ');source.sizes=ROOM_SIZES;picture.append(source);}
  // The image joins its picture before it gets a source, so the browser chooses among the variants.
  const image=element('img');picture.append(image);image.alt='';image.draggable=false;image.width=1536;image.height=2048;image.src=url(1536,'webp');
  return picture;
}
/** While a paid preparation's story plays, its painting downloads, so the reveal does not wait for it. */
function preloadRoom(task: Task) {
  const area=data.rooms.find(room=>room.after===task.id)!.area;
  const painting=resolveRooms(state.decorations,data).find(view=>view.id===area)!.painting!;
  if(painting.id!==$('#room-frame').dataset.painting)preloaded=roomPicture(painting.id);
}
/** Shows a painting in the frame. With a fade, the new painting comes into focus over the old one once it has decoded. */
async function showPainting(id: string, fade: number) {
  const token=++paintingToken,holder=$('#room-paintings'),shown=holder.querySelector<HTMLElement>('.room-painting:not(.leaving)');
  if(shown?.dataset.painting===id)return;
  const next=preloaded?.dataset.painting===id?preloaded:roomPicture(id);preloaded=null;
  $('#room-stage').removeAttribute('data-failed');
  const animate=Boolean(shown&&fade&&!still.matches);
  if(animate){for(const old of holder.children)old.classList.add('leaving');next.classList.add('entering');holder.append(next);}
  else holder.replaceChildren(next);
  const decoded=await next.querySelector('img')!.decode().then(()=>true,()=>false);
  // Only the current request can replace the room. This also detects a preload that failed before its story ended.
  if(token!==paintingToken||!next.isConnected)return;
  if(!decoded){holder.replaceChildren();$('#room-stage').dataset.failed='';return;}
  next.classList.remove('entering');
  // The states share every pixel outside their change, so the old painting stays under the new one until the fade ends.
  if(animate)await next.animate([{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}],{duration:fade,easing:'cubic-bezier(.16,1,.3,1)'}).finished.catch(()=>{});
  if(token!==paintingToken)return;
  for(const old of holder.querySelectorAll('.leaving'))old.remove();
}
/** The area the room shows: the player's open choice, or the area of the latest change. */
function currentView() {
  const views=resolveRooms(roomCompleted(),data);
  return {views,view:views.find(view=>view.id===viewArea&&view.open)??views.find(view=>view.id===latestArea(roomCompleted(),data))!};
}
function renderRoom() { const {views,view}=currentView();viewArea=view.id;renderAreaSwitch(views,view);void drawRoom(view); }
/**
 * Draws one area as it stands: its painting framed on the latest change, the New pin on that change, the cats in the front room,
 * and a caption that says in words what is there. A render that changes nothing leaves the room alone.
 */
function drawRoom(view: RoomView, fade = 0) {
  const frame=$('#room-frame'),current=view.current!,painting=view.painting!,pin=$('#room-pin');
  Object.assign(frame.dataset,{area:view.id,current:current.id});
  // The frame centres the change a little low, so the pin above it has room inside the visible room.
  frame.style.setProperty('--fx',String(painting.focus.x/100));frame.style.setProperty('--fy',String(Math.max(0,painting.focus.y-4)/100));
  // The area switch keeps to the side of the room away from the change, and in the front room away from Miez on the windowsill.
  $('#area-switch').dataset.side=view.id===data.areas[0].id||painting.focus.x>=50?'left':'right';
  // The pin marks a painted change, so a state that waits for its painting is told only in words.
  const marked=current.after!==null&&painting===current;
  if(!marked)frame.style.removeProperty('--pin-pan');
  // The pin's tail touches the edge of the change, so the pin names the change without covering it.
  if(marked&&pin.dataset.state!==current.id){
    pin.dataset.state=current.id;pin.style.left=`${current.mark.x}%`;pin.style.top=`${current.mark.y}%`;pin.toggleAttribute('data-below',Boolean(current.mark.below));
    const dot=element('span','pin-dot');dot.setAttribute('aria-hidden','true');
    const words=element('span','','New');words.append(element('span','pin-label',`: ${current.label}`));
    pin.replaceChildren(dot,words);pin.setAttribute('aria-label',`New: ${current.text}`);
  }
  const decorations=resolveDecorations(roomCompleted(),state.decorationChoices,data).filter(slot=>slot.unlocked&&slot.area===view.id);
  drawDecorations($('#room-decorations'),view.id,roomCompleted(),state.decorationChoices);renderFinishes();
  const caption=$('#room-caption'),key=`${view.id}:${view.states.map(room=>room.id).join()}:${decorations.map(slot=>slot.selected.id).join()}`;
  if(caption.dataset.key!==key){
    caption.dataset.key=key;const list=element('ol','room-changes');
    for(const room of view.states)list.append(element('li','',room.text));
    const finishes=element('p','',decorations.map(slot=>`${slot.name}: ${slot.selected.name}.`).join(' '));
    caption.replaceChildren(element('p','room-missing','The painting of this room could not load, so here it is in words.'),element('p','room-name',view.name),list,finishes);
  }
  if(frame.dataset.painting===painting.id&&!fade){pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');fitPin();return Promise.resolve();}
  frame.dataset.painting=painting.id;
  if(fade)pin.hidden=true;else pin.hidden=!marked;
  return showPainting(painting.id,fade).then(()=>{if(frame.dataset.current!==current.id)return;pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');syncRoomControls();});
}
/** The area switch in the room's corner: open areas by name, and a locked one with the dashed "not yet" edge and the preparation that opens it. */
function renderAreaSwitch(views: RoomView[], view: RoomView) {
  const group=$('#area-switch');
  if(group.childElementCount!==views.length*2) group.replaceChildren(...views.flatMap(area=>{
    const short=area.name.replace(/^The /,''),choice=button(short[0].toUpperCase()+short.slice(1),'area-choice',()=>chooseArea(area.id)),note=element('span','visually-hidden');
    choice.dataset.area=area.id;note.id=`area-note-${area.id}`;return [choice,note];
  }));
  for(const area of views){
    const choice=group.querySelector<HTMLElement>(`[data-area="${area.id}"]`)!,note=$(`#area-note-${area.id}`);
    choice.setAttribute('aria-pressed',String(area===view));
    if(area.open)choice.removeAttribute('aria-disabled');else choice.setAttribute('aria-disabled','true');
    const task=data.tasks.find(value=>value.id===area.unlock);
    note.textContent=area.open||!task?'':`${area.name} opens with “${task.title}” in chapter ${task.chapter}.`;
    if(area.open)choice.removeAttribute('aria-describedby');else choice.setAttribute('aria-describedby',note.id);
  }
}
function chooseArea(id: string) {
  const {views}=currentView(),area=views.find(value=>value.id===id)!;
  if(!area.open)return status($(`#area-note-${id}`).textContent!);
  if(id===viewArea)return;
  viewArea=id;try{storage?.setItem(AREA_KEY,id);}catch{/* The choice holds for this visit. */}
  renderAreaSwitch(views,area);void drawRoom(area,400);
  status(`${area.name}: ${area.current!.text}`);
}
/**
 * After the story of a paid preparation: the drawer lowers by itself, the new state comes into focus in place over the old one,
 * the New pin lands on the change, and the drawer rises again. The game was saved before the story opened, so nothing here can be paid or earned again.
 */
async function reveal(task: Task) {
  const token=++revealToken,changed=data.rooms.find(room=>room.after===task.id)!,layout=$('.game-layout'),stage=$('#room-stage');
  viewArea=changed.area;try{storage?.setItem(AREA_KEY,viewArea);}catch{/* The room still follows the change. */}
  const {views,view}=currentView(),pause=(ms: number)=>new Promise(resolve=>setTimeout(resolve,ms));
  const land=()=>{if(!$('#room-pin').hidden&&!still.matches)$('#room-pin').animate([{opacity:0,transform:'translateY(-14px) scale(.6)'},{opacity:1,transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});};
  stage.dataset.reveal='waiting';$('#room-pin').hidden=true;
  if(!still.matches){
    layout.classList.add('revealing');if(drawerLayout.matches){$('#drawer-body').inert=true;await pause(LOWER_MS);}
    if(token!==revealToken)return;
  }
  renderAreaSwitch(views,view);
  stage.dataset.reveal='run';await drawRoom(view,still.matches?0:FOCUS_MS);
  if(token!==revealToken)return;
  land();status(changed.text);
  // The pin is described by the change, so focus lands where the change is.
  if(!$('#room-pin').hidden)$('#room-pin').focus({preventScroll:true});
  if(!still.matches)await pause(SETTLE_MS);
  if(token!==revealToken)return;
  layout.classList.remove('revealing');$('#drawer-body').inert=lowered;stage.dataset.reveal='done';
  // A failed painting has no pin. Return focus only after the board can take input again.
  if($('#room-pin').hidden)(lowered?$('#drawer-handle'):$('#board').querySelector<HTMLElement>('[tabindex="0"]'))?.focus({preventScroll:true});
  batFlight();
  // The earned scene continues the story, unless the player has opened another dialog meanwhile. It stays waiting in Story either way.
  const scene=earnedScene;earnedScene=null;
  if(scene&&state.pendingScenes.includes(scene)&&!modal.open)showScene(scene);
}
/** Where the kitchen is a drawer, its handle lowers it to show the whole room and raises it again. */
function setLowered(value: boolean) {
  lowered=value&&movableDrawer.matches;const handle=$('#drawer-handle'),layout=$('.game-layout');
  layout.classList.toggle('lowered',lowered);$('#drawer-body').inert=lowered||layout.classList.contains('revealing');
  handle.setAttribute('aria-expanded',String(!lowered));handle.setAttribute('aria-label',lowered?'Raise the kitchen':'Lower the kitchen to see the room');
  syncRoomControls();
}
/** Room controls take input only while their detail is inside the visible painting, above the drawer. */
function syncRoomControls() {
  fitPin();
  const stage=$('#room-stage').getBoundingClientRect(),failed=$('#room-stage').hasAttribute('data-failed');
  const bottom=drawerLayout.matches?Math.min(stage.bottom,$('#drawer').getBoundingClientRect().top):stage.bottom;
  for(const control of document.querySelectorAll<HTMLElement>('#cat-button,.room-finish')){
    const box=control.getBoundingClientRect();
    const visibleWidth=Math.min(box.right,stage.right)-Math.max(box.left,stage.left);
    const visibleHeight=Math.min(box.bottom,bottom)-Math.max(box.top,stage.top);
    control.inert=failed||!box.width||(control.classList.contains('room-finish')
      ? visibleWidth<44||visibleHeight<44
      : box.top<stage.top||box.bottom>bottom+1||box.left<stage.left||box.right>stage.right+1);
  }
}
/**
 * Keeps the pin inside the visible room. It can use either side of its mark, shorten its label, or move the frame enough to show
 * a mark near the edge. The tail stays on the authored mark when the pin slides sideways.
 */
function fitPin() {
  const pin=$('#room-pin');if(pin.hidden)return;
  const frame=$('#room-frame'),stage=$('#room-stage').getBoundingClientRect(),area=$('#area-switch').getBoundingClientRect(),below=Boolean(data.rooms.find(room=>room.id===pin.dataset.state)?.mark.below);
  const bottom=drawerLayout.matches?Math.min(stage.bottom,$('#drawer').getBoundingClientRect().top):stage.bottom;
  frame.style.setProperty('--pin-pan','0px');
  pin.style.setProperty('--shift','0px');pin.removeAttribute('data-bare');pin.toggleAttribute('data-below',below);
  const meets=(box: DOMRect)=>box.left<area.right&&area.left<box.right&&box.top<area.bottom&&area.top<box.bottom;
  let box=pin.getBoundingClientRect();
  if(box.width>stage.width-16){pin.toggleAttribute('data-bare',true);box=pin.getBoundingClientRect();}
  if(box.top<stage.top+4||box.bottom>bottom-4||meets(box)){
    pin.toggleAttribute('data-below',!below);const alternate=pin.getBoundingClientRect();
    const cost=(value: DOMRect)=>Math.max(0,stage.top+4-value.top)+Math.max(0,value.bottom-(bottom-4))+(meets(value)?value.height:0);
    if(cost(alternate)<cost(box))box=alternate;else pin.toggleAttribute('data-below',below);
  }
  // A short viewport can place the mark itself above the crop. Pan the painting with the mark, not the pin alone.
  const pan=Math.max(0,stage.top+4-box.top)-Math.max(0,box.bottom-(bottom-4));
  if(pan){frame.style.setProperty('--pin-pan',`${pan}px`);box=pin.getBoundingClientRect();}
  if(meets(box)){pin.toggleAttribute('data-bare',true);box=pin.getBoundingClientRect();}
  let left=Math.max(stage.left+8,Math.min(box.left,stage.right-8-box.width));
  if(box.top<area.bottom&&area.top<box.bottom&&left<area.right&&area.left<left+box.width){
    if(area.right+8+box.width<=stage.right-8)left=area.right+8;
    else if(area.left-8-box.width>=stage.left+8)left=area.left-8-box.width;
  }
  pin.style.setProperty('--shift',`${Math.round(left-box.left)}px`);
}
function downloadSave() {
  try { const url=URL.createObjectURL(new Blob([exportSave(state,validate)],{type:'application/json'}));const link=element('a');link.href=url;link.download='scary-snacks-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  catch(error) { showModal('Save export failed',element('p','save-error',reason(error))); }
}
/** Kitchen sounds: the toggle changes its own words, so focus stays on it. */
function soundToggle() {
  const toggle=button(sound?'Turn sound off':'Turn sound on','secondary-button',()=>{sound=!sound;playTone('deliverQuest');toggle.textContent=sound?'Turn sound off':'Turn sound on';});
  toggle.dataset.soundToggle='';
  return toggle;
}
/** A finish over the room painting, cropped to its slot in scene coordinates. Saves only supply validated choice IDs. */
function decorationImage(slot: DecorationSlot, variant: DecorationVariant) {
  const crop=slot.crop,scaleX=15.36,scaleY=20.48,value=svg('svg');
  value.setAttribute('viewBox','0 0 1536 2048');
  value.setAttribute('class','decoration-layer');value.setAttribute('aria-hidden','true');
  value.dataset.slot=slot.id;value.dataset.variant=variant.id;
  const bounds=svg('svg');bounds.setAttribute('x',String(crop.x*scaleX));bounds.setAttribute('y',String(crop.y*scaleY));
  bounds.setAttribute('width',String(crop.width*scaleX));bounds.setAttribute('height',String(crop.height*scaleY));
  bounds.setAttribute('viewBox',[crop.x*scaleX,crop.y*scaleY,crop.width*scaleX,crop.height*scaleY].join(' '));
  const image=svg('image');
  image.setAttribute('href',new URL(`../assets/variants/${variant.image}-1536x2048.webp`,import.meta.url).href);
  image.setAttribute('width','1536');image.setAttribute('height','2048');bounds.append(image);value.append(bounds);return value;
}
function drawDecorations(holder: HTMLElement,area: string,completed: string[],choices: Record<string,string>) {
  const slots=resolveDecorations(completed,choices,data).filter(slot=>slot.unlocked&&slot.area===area&&slot.selected.id!==slot.default);
  const key=slots.map(slot=>`${slot.id}:${slot.selected.id}`).join();if(holder.dataset.key===key)return;
  holder.dataset.key=key;holder.replaceChildren(...slots.map(slot=>decorationImage(slot,slot.selected)));
}
/**
 * Each finish that a quest has unlocked has a switch on its place in the room. A tap moves to the next finish of the slot. The choice
 * goes through the same lock and durable write as a preparation, so a failed write keeps the earlier finish.
 */
function renderFinishes() {
  const holder=$('#room-finishes'),{view}=currentView();
  const slots=resolveDecorations(roomCompleted(),state.decorationChoices,data).filter(slot=>slot.unlocked&&slot.area===view.id
    &&slot.variants.filter(variant=>decorationUnlocked(state,slot,variant.id,data)).length>1);
  const key=slots.map(slot=>`${slot.id}:${slot.selected.id}`).join();if(holder.dataset.key===key)return;
  holder.dataset.key=key;holder.replaceChildren(...slots.map(slot=>{
    const choices=slot.variants.filter(variant=>decorationUnlocked(state,slot,variant.id,data)),next=choices[(choices.indexOf(slot.selected)+1)%choices.length];
    const finish=button('','room-finish',()=>changeGame(()=>{
      const result=applyAction({type:'decorate',slot:slot.id,variant:next.id});
      if(result.ok)status(`${slot.name}: ${next.name}.`);
      // The new switch takes the place of the one that was pressed.
      $('#room-finishes').querySelector<HTMLElement>(`[data-slot="${slot.id}"]`)?.focus({preventScroll:true});
    }));
    finish.dataset.slot=slot.id;finish.setAttribute('aria-label',`${slot.name}: ${slot.selected.name}. Switch to ${next.name}`);
    Object.assign(finish.style,{left:`${slot.crop.x}%`,top:`${slot.crop.y}%`,width:`${slot.crop.width}%`,height:`${slot.crop.height}%`});
    finish.append(swapMark());return finish;
  }));
}
/** The switch badge on a finish: two arrows that turn about each other. */
function swapMark() {
  const value=svg('svg');value.setAttribute('class','swap-mark');value.setAttribute('viewBox','0 0 24 24');value.setAttribute('aria-hidden','true');
  const face=svg('circle');face.setAttribute('cx','12');face.setAttribute('cy','12');face.setAttribute('r','11');
  const arrows=svg('path');arrows.setAttribute('d','M7.5 10a5 5 0 0 1 8.6-2.2M16.5 5.5v2.8h-2.8M16.5 14a5 5 0 0 1-8.6 2.2M7.5 18.5v-2.8h2.8');
  value.append(face,arrows);return value;
}
/** Options: appearance, sound, the saved game, About Scary Snacks, and a fresh start. */
function options() {
  const content=element('div');content.append(element('p','modal-copy save-status',saveMessage));
  // Writes never replace an unreadable save, so only a new game (an explicit reset) lets this browser save again.
  if(saveFailed&&recoveryRequired)content.append(element('p','save-error',['invalid','unsupported'].includes(loadSave(storage,validate).status)?`${saveMessage} To save in this browser again, start a new game below. That replaces the unreadable save.`:saveMessage));
  if(recoveryRequired)content.append(button('Retry saved game','primary-button',()=>location.reload()));
  else if(saveFailed&&storage)content.append(button('Retry save','secondary-button',()=>changeGame(()=>{persist();options();status(saveFailed?`This session is not saved. ${saveMessage}`:'Your progress is saved in this browser.');})));
  const appearance=element('section','settings-section');const choices=element('fieldset','choice-fieldset');const group=element('div','choice-group');
  for(const [value,name] of THEMES) {
    const choice=element('label','choice');const input=element('input');input.type='radio';input.name='appearance';input.value=value;input.checked=theme===value;
    input.addEventListener('change',()=>setTheme(value,true));choice.append(input,element('span','',name));group.append(choice);
  }
  choices.append(element('legend','','Appearance'),element('p','','System follows your device’s light or dark setting.'),group);appearance.append(choices);content.append(appearance);
  const audio=element('section','settings-section');audio.append(element('h3','','Kitchen sounds'),element('p','','Soft tones for merging, delivering, and finishing preparations. Sound stays off until you turn it on.'),soundToggle());content.append(audio);
  const saves=element('section','settings-section');saves.append(element('h3','','Your saved game'),element('p','','Export a copy to keep it safe or to carry on in another browser.'));
  const actions=element('div','settings-actions');actions.append(button('Export saved game','secondary-button',downloadSave));
  const file=element('input','hidden');file.type='file';file.accept='.json,application/json';
  file.addEventListener('change',async()=>{
    const selectedFile=file.files?.[0];if(!selectedFile)return;
    try {
      if(selectedFile.size>MAX_SAVE_BYTES)throw new Error('Select a saved game smaller than 2 MiB.');
      const candidate=importSave<GameState>(await selectedFile.text(),validate);
      const review=element('div');review.append(element('p','modal-copy',`Replace the current game with this saved game: ${coinText(candidate.coins)} and ${count.format(candidate.taskIndex)} of ${data.tasks.length} preparations done? Export the current game first if you want to keep it.`));
      const keep=button('Keep the current game','secondary-button',options),choice=element('div','settings-actions');
      choice.append(button('Import this saved game','primary-button',()=>changeGame(()=>{
        const result=saveGame(storage,candidate,validate);if(!result.ok){showModal('Import failed',element('p','save-error',result.error ?? ''));return;}
        recoveryRequired=false;observedSave=JSON.stringify(candidate);replaceGame(candidate);reportSave(result);render();modal.close();status('Saved game imported.');
      },true)),keep);review.append(choice);showModal('Import saved game',review,keep);
    }catch(error){showModal('Cannot import this file',element('p','save-error',reason(error)));}
  });
  actions.append(button('Import saved game','secondary-button',()=>file.click()),file);saves.append(actions);content.append(saves);
  const about=element('section','settings-section');about.append(element('h3','','About Scary Snacks'),element('p','','Original setting, characters, dialogue, progression, and AI-generated artwork made for this project. No advertising, payments, accounts, or remote game services.'));content.append(about);
  const reset=element('section','settings-section');reset.append(element('h3','','A fresh start'),element('p','','Erase this game from this browser and start again. Exported files and your appearance setting stay.'),button('Start a new game','danger-button',()=>{
    // The safe choice holds focus, so a stray Enter keeps the game.
    const keep=button('Keep this game','secondary-button',options),choice=element('div','settings-actions');
    choice.append(button('Erase and start again','danger-button',()=>changeGame(()=>{
      const fresh=createGame(data),result=resetSave(storage,fresh,validate);if(!result.ok){showModal('Reset failed',element('p','save-error',result.error ?? ''));return;}
      recoveryRequired=false;observedSave=JSON.stringify(fresh);replaceGame(fresh);reportSave(result);render();modal.close();status('The kitchen is ready for a fresh start.');
    },true)),keep);
    const confirm=element('div');confirm.append(element('p','modal-copy','This erases the dishes, coins, story progress, discoveries, and decoration finishes saved in this browser. Export a copy first if you want to keep this game.'),choice);showModal('Start a new game?',confirm,keep);
  }));content.append(reset);showModal('Options',content,modal.open?undefined:$('#close-modal'));
}
function findMatch() {
  for(let from=0;from<state.board.length;from++) {
    const cell=state.board[from];if(!cell||!definition(cell.code).next)continue;
    const blocker=matchingBlocker(cell.code);
    if(blocker){selected=from;render();pulse([blocker.position]);status(`Tap the blocked ${itemName(cell.code)} to merge and clear it.`);return;}
    const to=state.board.findIndex((other,index)=>index!==from&&other?.code===cell.code);
    // One item of the pair is selected and the other pulses, so the instruction names a single target.
    if(to>=0){selected=from;render();pulse([to]);status(`Tap the other ${itemName(cell.code)} to merge them.`);return;}
  }
  const index=state.board.findIndex(cell=>cell&&definition(cell.code).generator);
  if(index>=0){const code=state.board[index]!.code;selected=index;render();status(`No matches yet. Tap the ${itemName(code)} to take ${itemName(chosenOutput(code))}.`);return;}
  status('No matches yet.');
}
function cancelDrag() { dragging?.ghost?.remove();dragging=null; }
$('#board').addEventListener('pointerdown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target||event.button!==0)return;
  const index=Number(target.dataset.cell);if(!state.board[index]||unresolvedObstacle(state,index,data))return;
  // A second pointer, or a release that the window did not receive, must not leave a ghost behind.
  cancelDrag();
  dragging={index,id:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
});
window.addEventListener('pointermove',event=>{
  if(!dragging||dragging.id!==event.pointerId)return;
  if(!dragging.ghost&&Math.hypot(event.clientX-dragging.x,event.clientY-dragging.y)>8){const cell=state.board[dragging.index];if(!cell){cancelDrag();return;}dragging.ghost=food(cell.code,'drag-ghost');document.body.append(dragging.ghost);}
  if(dragging.ghost){dragging.ghost.style.left=`${event.clientX-37}px`;dragging.ghost.style.top=`${event.clientY-37}px`;event.preventDefault();}
},{passive:false});
window.addEventListener('pointerup',event=>{
  if(!dragging||dragging.id!==event.pointerId)return;
  const from=dragging.index,moved=Boolean(dragging.ghost);const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-cell]');cancelDrag();
  if(moved){ignoreClick=true;setTimeout(()=>ignoreClick=false,0);const to=target?Number(target.dataset.cell):from;if(to!==from){selected=to;act({type:'move',from,to});}else{selected=from;render();}}
});
window.addEventListener('pointercancel',cancelDrag);window.addEventListener('blur',cancelDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();});
$('#board').addEventListener('keydown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;const index=Number(target.dataset.cell);let next=index;const {columns}=data.board;const row=index-index%columns;
  if(event.key==='ArrowLeft'&&index%columns>0)next--;else if(event.key==='ArrowRight'&&index%columns<columns-1)next++;else if(event.key==='ArrowUp'&&index>=columns)next-=columns;else if(event.key==='ArrowDown'&&index<state.board.length-columns)next+=columns;
  else if(event.key==='Home')next=event.ctrlKey?0:row;else if(event.key==='End')next=event.ctrlKey?state.board.length-1:row+columns-1;
  else if(event.key==='Escape'){if(selected!==null){selected=null;render();status(MOVE_HINT);}return;}else return;
  event.preventDefault();$(`[data-cell="${next}"]`).focus();
});
// The board keeps a single tab stop where focus last was; the skip link lands on it too.
$('#board').addEventListener('focusin',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;boardFocus=Number(target.dataset.cell);
  for(const cell of $('#board').querySelectorAll<HTMLElement>('[data-cell]'))cell.tabIndex=cell===target?0:-1;
});
$('#board').addEventListener('focus',()=>$('#board').querySelector<HTMLElement>('[tabindex="0"]')?.focus());
$('.skip-link').addEventListener('click',event=>{
  const stop=$('#board').querySelector<HTMLElement>('[tabindex="0"]');if(!stop)return;
  if(lowered)setLowered(false);
  event.preventDefault();stop.focus({preventScroll:true});stop.scrollIntoView({block:'nearest'});
});
$('#close-modal').addEventListener('click',()=>modalReturn?modalReturn():modal.close());
modal.addEventListener('cancel',event=>{if(modalReturn){event.preventDefault();modalReturn();}});
// The end of a paid preparation's story reveals its change.
modal.addEventListener('close',()=>{
  if(modal.open)return;
  modalReturn=null;
  if(sceneFlow){
    sceneFlow=false;
    // Reading can remove Read now before this scene, or the next scene, closes.
    if(document.activeElement===document.body||modal.contains(document.activeElement)){
      const journalLink=$('#story').querySelector<HTMLElement>('[aria-label="Open the story journal"]');
      (journalLink?.checkVisibility()?journalLink:$('#story-button')).focus({preventScroll:true});
    }
  }
  if(held){const task=held;held=null;void reveal(task);}
});
$('#drawer-handle').addEventListener('pointerdown',event=>{swipe=event.clientY;});
$('#drawer-handle').addEventListener('pointerup',event=>{swipe=event.clientY-swipe;});
// A keyboard click has no pointer, so it toggles the drawer whatever an earlier pointer left in swipe.
$('#drawer-handle').addEventListener('click',event=>{const moved=event.detail&&Math.abs(swipe)>20?swipe>0:!lowered;swipe=0;setLowered(moved);});
$('#room-pin').addEventListener('click',()=>{const {view}=currentView();status(view.current!.text);});
for(const opener of document.querySelectorAll('[data-options]'))opener.addEventListener('click',()=>data&&options());
$('#collection-button').addEventListener('click',()=>data&&recipeBook());
$('#recipes-button').addEventListener('click',()=>data&&recipeBook());
$('#story-button').addEventListener('click',()=>data&&showModal('Our little bistro',storyContent(true)));
$('#hint-button').addEventListener('click',()=>state&&findMatch());
$('#cat-button').addEventListener('click',toggleCat);
phone.addEventListener('change',()=>{if(state){renderCoins();renderDetail();}});
drawerLayout.addEventListener('change',()=>{setLowered(false);if(state){renderOffer();renderTickets();}});
movableDrawer.addEventListener('change',()=>setLowered(false));
window.addEventListener('resize',syncRoomControls);
$('#room-frame').addEventListener('transitionend',syncRoomControls);$('.game-layout').addEventListener('transitionend',syncRoomControls);
window.addEventListener('storage',event=>{
  if(!state||event.key!==SAVE_KEY||event.newValue===null)return;
  syncSavedGame();
});
try {
  const response=await fetch(new URL('../data/game.json',import.meta.url));if(!response.ok)throw new Error('Game data could not be loaded.');
  data=await response.json();
  // Data that fails its checks never reaches the save, so it cannot be mistaken for a damaged save.
  const problems=dataProblems(data);if(problems.length)throw new Error('The game data is not valid.',{cause:problems});
  const line=$('.mara-line .portrait'), mara=portrait('mara');
  mara.setAttribute('aria-label',line.getAttribute('aria-label')!);line.replaceWith(mara);
  // Loading shares the game lock with writes from other tabs.
  const load=()=>loadSave<GameState>(storage,validate);
  const saved=storage&&navigator.locks?await navigator.locks.request(SAVE_KEY,load):load();
  state=saved.state??createGame(data);
  // A reload cannot open blocked storage, so that game plays for this visit without the recovery block.
  recoveryRequired=Boolean(storage)&&!['loaded','empty'].includes(saved.status);
  observedSave=saved.state?JSON.stringify(saved.state):null;
  saveFailed=!['loaded','empty'].includes(saved.status);
  saveMessage=!storage?BLOCKED_STORAGE:saveFailed?`Saved progress could not be loaded. ${saved.error}`:'Saved in this browser';
  // The room opens on the player's chosen area while it is open, and otherwise on the area of the latest change.
  try{viewArea=storage?.getItem(AREA_KEY)??'';}catch{/* Follow the latest change. */}
  render();
  // The frame pans smoothly only after it first settles, so opening the game shows the room in place.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#room-frame').classList.add('settled');syncRoomControls();}));
  if(saved.status==='empty')await changeGame(persist);
  // Phones get a shorter opening line, so that it fits the line under the board.
  status(saved.status==='loaded'?`Welcome back. The stove is still warm.${state.pendingScenes.length?' A story scene is waiting in Story.':''}`:phone.matches?'Merge the two Flours. Merge onto matching blocked food.':'Tap one Flour, then the other, to merge. Merge onto matching blocked food to clear it.');
  if(saveFailed)options();
}catch(error){
  status(`The kitchen could not open. ${reason(error)}`);console.error(error);
  const hint=$('#hint-button');hint.textContent='Try again';hint.addEventListener('click',()=>location.reload());
  for(const opener of document.querySelectorAll<HTMLButtonElement>('#story-button,#recipes-button,#collection-button,[data-options]'))opener.disabled=true;
}
