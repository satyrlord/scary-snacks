import { createGame, reduceGame, validateGame, saveMigrations, getLevel, availableLevelRewards, generatorOutputs, nextOutput, dataProblems, canServe, servedCells, taskEligibility, saleValue, normalizeOrderCustomers, resolveRooms, latestArea, resolveDecorations, getItem, resolveQuests, canDeliverQuest, previewQuestCleanup } from './engine.ts';
import type { Action, DecorationSlot, DecorationVariant, GameData, GameState, Order, Quest, RoomView, Task } from './engine.ts';
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
const FOCUS_REGIONS = '#board,#orders,#story,#item-detail,#offer,#inventory';
const TONE_EVENTS = ['merge', 'serve', 'task'];
const modal = $<HTMLDialogElement>('#modal');
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
// The serve timeline: the dishes land on the ticket, the neighbour thanks you, the ticket goes, and the next neighbour's ticket arrives in the same place.
// RISE_AT sets the arrival delay in style.css; ARRIVAL_MS covers the arrival.
const FLIGHT_MS = 600, SINK_AT = 1500, FAREWELL_MS = 1850, RISE_AT = 1600, ARRIVAL_MS = 2200;
// The reveal timeline: the drawer lowers, the new state comes into focus, the pin lands, and the drawer rises again.
const LOWER_MS = 650, FOCUS_MS = 1200, SETTLE_MS = 1400;
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
let observedSave: string | null = null, gameVersion = 0;
let recoveryRequired = false, editingDecoration: string | null = null;
let modalReturn: (() => void) | null = null, questFlow = false;
const arriving: number[] = [], farewells = new Map<string, number>(), spoken = new Map<string, number>();
let dragging: { index: number; id: number; x: number; y: number; ghost: SVGSVGElement | null } | null = null;
let spriteSequence = 0, boardFocus = 0;
// The room: the area it shows, a paid preparation whose change waits for the end of its story, and the next painting while it downloads.
let viewArea = '', held: Task | null = null, revealToken = 0, paintingToken = 0, preloaded: HTMLPictureElement | null = null, lowered = false, swipe = 0;
const pantryPanel = $('#pantry');
let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* Session play remains available. */ }
const validate = (candidate: unknown) => validateGame(candidate, data);
const definition = (code: string) => getItem(code,data)!;
const itemName = (code: string) => definition(code)?.name || 'Item';
const character = (id: string) => data.characters.find(value => value.id === id) || data.characters[0];
// Players meet generators as ingredient sources: the Flour bin, the Copper pot, and so on. They take ingredients from them.
const sourceOf = (chain: string) => [...Object.values(data.items),...Object.values(data.questItems)].find(item => item.generator && item.chain === chain)!;
const chosenOutput = (code: string) => nextOutput(state,code,data)!;
const sourceOutput = (code: string) => generatorOutputs(state,code,data).map(itemName).join(' or ');
function status(text: string) { $('#status').textContent = text; }
/** Mara's note for a selected item, which the status region announces. On phones the note leaves out the name, which the selection strip shows. */
function selectionLine(code: string) {
  const def = definition(code), name = phone.matches ? '' : `${itemName(code)}: `;
  const line = def.generator ? `tap it to take more ${itemName(chosenOutput(code))}.` : def.next ? 'tap another to merge, or an empty space to move it.' : 'a final dish. Serve it, or tap an empty space to move it.';
  return name ? name + line : line[0].toUpperCase() + line.slice(1);
}
/** Board cells pulse after a render; the next render removes the pulse. */
function pulse(cells: number[]) { for (const at of cells) $(`[data-cell="${at}"]`).classList.add('hint'); }
function portrait(id: string) {
  const person = character(id);
  const value = element('span', `portrait portrait-${person.sprite}`);
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
  const rect = spriteBounds[index];
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
  image.setAttribute('href',atlas);
  image.setAttribute('width','1536');image.setAttribute('height','1536');
  image.setAttribute('clip-path',`url(#${clipId})`);
  value.append(image);
  value.setAttribute('aria-hidden', 'true'); return value;
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
  try {
    const context = audioContext ||= new AudioContext();
    context.resume().catch(() => {});
    const now = context.currentTime;
    const frequencies = kind === 'serve' ? [392, 587.33] : kind === 'task' ? [329.63, 493.88] : [293.66];
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
  } catch { sound = false; status('Sound is unavailable in this browser.'); }
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
  if(recoveryRequired&&!recovery){status('Your saved game could not open. Open the House book and retry.');return;}
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
  render(); if(action.type!=='claimLevelReward')status(result.message);
  if (state.coins > coins) celebrateCoins(state.coins - coins);
  if (result.ok && (result.event === 'merge' || result.event === 'spawn')) {
    // A new dish settles onto its tile; the first one of its kind arrives with a little flourish and goes into the recipe book.
    state.board.forEach((cell, index) => { if (cell && cell.code !== before[index]) $(`[data-cell="${index}"]`).classList.add(known.has(cell.code) ? 'settle' : 'first'); });
    const first = state.discovered.filter(code => !known.has(code) && data.items[code] && !definition(code).generator);
    if (first.length) { freshDishes += first.length; markRecipeBook(); status(`${itemName(first[0])} is a new dish! It is in the recipe book now.`); }
  }
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
/** Serving from a ticket: the dishes lift from the board and land on the ticket, the neighbour thanks you, and the next neighbour's ticket takes its place. */
function serve(order: Order) { return changeGame(() => {
  const slot = state.orders.findIndex(value => value.id === order.id);
  const card = $('#orders').children[slot] as HTMLElement | undefined;
  const from = servedCells(state, order).filter(index => index >= 0).map(index => $(`[data-cell="${index}"]`).getBoundingClientRect());
  const leaving = card?.cloneNode(true) as HTMLElement | undefined, box = card?.getBoundingClientRect(), stage = $('.tickets').getBoundingClientRect();
  const now = performance.now();
  arriving[slot] = now;
  const result = applyAction({ type:'serve', id:order.id });
  if (!result.ok || !leaving || !box) { arriving[slot] = 0; renderOrders(); return; }
  const person = character(order.customer), turn = spoken.get(person.id) ?? state.served, line = person.thanks[turn % person.thanks.length];
  spoken.set(person.id, turn + 1);
  status(`${person.name}: “${line}” Earned ${coinText(order.reward)}.`);
  // With four neighbours and three tickets, the one who arrives may still be saying goodbye elsewhere: they wait until that copy has gone.
  const farewell = farewells.get(state.orders[slot].customer);
  if (farewell && farewell > now) arriving[slot] = farewell + 150 - RISE_AT;
  farewells.set(person.id, now + FAREWELL_MS);
  const arrival = arriving[slot];
  setTimeout(() => {
    if (arriving[slot] !== arrival) return;
    arriving[slot] = 0;
    $('#orders').children[slot]?.classList.remove('arriving');
  }, arrival + ARRIVAL_MS - now);
  // The departing ticket is a copy laid over the slot, outside #orders, so renders during the farewell leave it alone.
  leaving.classList.remove('arriving'); leaving.classList.add('leaving'); leaving.removeAttribute('aria-label'); leaving.setAttribute('aria-hidden', 'true'); leaving.inert = true;
  leaving.style.left = `${box.left - stage.left}px`; leaving.style.top = `${box.top - stage.top}px`; leaving.style.width = `${box.width}px`; leaving.style.height = `${box.height}px`;
  // The ticket keeps its size and its dish slot until the dishes land; then the neighbour says thank you.
  const thank = () => leaving.replaceChildren(element('span', `portrait portrait-${person.sprite}`), element('p', 'order-name', person.name), element('p', 'thanks', line));
  $('.tickets').append(leaving);
  if (still.matches) thank(); else fly(order.requirements, from, leaving.querySelector('.order-items') ?? leaving).then(thank);
  if (state.served % 7 === 0) batFlight();
  setTimeout(() => leaving.classList.add('gone'), SINK_AT);
  setTimeout(() => leaving.remove(), FAREWELL_MS);
}); }
/** Served dishes lift off their tiles, arc over the board and land on the neighbour's ticket, visible all the way. */
function fly(codes: string[], from: DOMRect[], into: Element) {
  const target = into.getBoundingClientRect();
  return Promise.all(from.map((start, index) => {
    const size = Math.min(start.width, start.height), ghost = food(codes[index], 'serve-flight');
    ghost.style.left = `${start.left}px`; ghost.style.top = `${start.top}px`; ghost.style.width = ghost.style.height = `${size}px`;
    document.body.append(ghost);
    const dx = target.left + target.width / 2 - (start.left + size / 2), dy = target.top + target.height / 2 - (start.top + size / 2);
    const landed = Math.min(.6, target.height / size);
    return ghost.animate([
      { transform: 'translate(0, 0) scale(1)', easing: 'cubic-bezier(.3,0,.2,1)' },
      { transform: `translate(${dx * .45}px, ${dy * .55 - 40}px) scale(.85)`, offset: .45, easing: 'cubic-bezier(.4,0,.2,1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed})`, opacity: 1, offset: .88 },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed * .9})`, opacity: 0 },
    ], { duration: FLIGHT_MS, delay: index * 80, fill: 'both' }).finished.finally(() => ghost.remove());
  }));
}
/** A resize or rotation moves the tickets, so any farewell still on screen ends at once and the next tickets simply stand in place. */
function endFarewells() {
  for (const copy of document.querySelectorAll('.tickets > .order.leaving')) copy.remove();
  farewells.clear(); arriving.fill(0);
  for (const card of $('#orders').children) card.classList.remove('arriving');
}
/** Replacing the game also ends presentation state from the previous board, including a reveal that has not run. */
function replaceGame(next: GameState) {
  gameVersion++;
  cancelDrag(); endFarewells();
  for (const flight of document.querySelectorAll('.serve-flight')) flight.remove();
  state = normalizeOrderCustomers(next, data); selected = null; freshDishes = 0; spoken.clear();
  held = null; revealToken++; preloaded = null; viewArea = latestArea(state.decorations, data);
  $('.game-layout').classList.remove('revealing'); $('#room-stage').removeAttribute('data-reveal'); setLowered(false);
}
/** Now and then a bat crosses the dusk beyond the front room's mended window: after each preparation, and after every seventh serve. Never while the page is hidden, under reduced motion, or before the window is mended. */
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
  // An order can use up the selected item.
  if (selected !== null && !state.board[selected]) selected = null;
  // While an item is selected, its actions take the place of Mara's line.
  $('.game-layout').toggleAttribute('data-selected', selected !== null);
  renderRoom();
  renderCoins();
  const free = state.board.filter(value => !value).length;
  const board = $('#board'); board.replaceChildren();
  board.setAttribute('aria-label', `Merge board, ${data.board.columns} columns and ${data.board.rows} rows, ${free} free ${free === 1 ? 'space' : 'spaces'}`);
  state.board.forEach((cell, index) => {
    const value = button('', `cell ${cell ? '' : 'empty'} ${selected === index ? 'selected' : ''}`, () => chooseCell(index));
    value.dataset.cell = String(index);
    const what = !cell ? 'empty' : definition(cell.code).generator ? `${itemName(cell.code)}, source of ${sourceOutput(cell.code)}: tap to take an ingredient` : itemName(cell.code);
    value.setAttribute('aria-label', `Row ${Math.floor(index / data.board.columns) + 1}, column ${index % data.board.columns + 1}: ${what}`);
    // One tab stop for the whole board; the arrow keys move between spaces.
    value.tabIndex = index === (selected ?? boardFocus) ? 0 : -1;
    value.setAttribute('aria-pressed', String(selected === index));
    if (cell) {
      value.append(food(cell.code));
      if (definition(cell.code).generator) value.append(sourceMark());
    }
    board.append(value);
  });
  renderOrders(); $('#story').replaceChildren(storyContent(false)); renderDetail(); renderOffer(); renderStorage();
  markRecipeBook();
  markLevelRewards();
  if (region && position >= 0) {
    const controls = [...region.querySelectorAll('button')];
    const target = [controls[position], ...controls].find(control => control && !control.disabled && control.checkVisibility({ visibilityProperty:true }))
      ?? (previousCell === undefined ? null : board.querySelector<HTMLElement>(`[data-cell="${previousCell}"]`));
    target?.focus({ preventScroll:true });
  }
}
/** Each waiting neighbour is a paper ticket on the drawer: their portrait, the dishes they want, and Serve. */
function renderOrders() {
  const container = $('#orders'); container.replaceChildren();
  state.orders.forEach((order, slot) => {
    const ready = canServe(state, order, data);
    const person = character(order.customer);
    const card = element('article', 'order'); card.setAttribute('aria-label', `${person.name}’s order`);
    // A ticket that has just taken a served neighbour's place arrives in the same slot; the delay survives renders.
    const since = arriving[slot] ? performance.now() - arriving[slot] : Infinity;
    if (since < ARRIVAL_MS) { card.classList.add('arriving'); card.style.setProperty('--rise-delay', `${RISE_AT - Math.round(since)}ms`); }
    const face = element('span', `portrait portrait-${person.sprite}`); face.setAttribute('aria-hidden', 'true');
    const onBoard = servedCells(state, order).map(index => index >= 0);
    const labels = order.requirements.map((code, index) => `${itemName(code)}, ${onBoard[index] ? 'ready on the board' : 'not on the board yet'}`);
    // A drawer ticket is too narrow for a 44px target per dish, so two dishes share one target that opens the order.
    const shared = drawerLayout.matches && order.requirements.length > 1;
    const requirements = shared ? button('', 'order-items', () => showOrder(person.name, order.requirements)) : element('div', 'order-items');
    if (shared) requirements.setAttribute('aria-label', `${person.name}’s dishes: ${labels.join('; ')}`);
    order.requirements.forEach((code, index) => {
      const kind = `order-item ${onBoard[index] ? 'ready' : ''}`;
      const value = shared ? element('span', kind) : button('', kind, () => showItem(code));
      if (!shared) value.setAttribute('aria-label', labels[index]);
      value.append(food(code)); requirements.append(value);
    });
    // Phones show the price alone until the order can be served, so three tickets fit the drawer's handle.
    const serveButton = button('', 'primary-button serve-button', () => serve(order));
    serveButton.append(element('span', 'serve-word', 'Serve'), element('span', 'serve-dot', ' ·'), ` ${order.reward}`, coinMark());
    serveButton.disabled = !ready; serveButton.setAttribute('aria-label', `Serve ${person.name} for ${coinText(order.reward)}`);
    card.append(face, element('p', 'order-name', person.name), requirements, serveButton); container.append(card);
  });
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
  const eligibility = taskEligibility(state, data), task = eligibility.task; const chapter = task?.chapter || data.chapters.length;
  const content = document.createDocumentFragment();
  if (inSheet) content.append(element('p', 'chapter-name', `Chapter ${chapter} · ${data.chapters[chapter - 1]}`));
  else {
    const heading = element('div', 'section-heading'); heading.append(element('h2', '', 'Our little bistro'), element('span', '', `Chapter ${chapter}`));
    content.append(heading, element('p', 'chapter-name', data.chapters[chapter - 1]));
  }
  const body = element('div', 'task-content');
  if (!task) body.append(element('h3', '', 'The table is ready.'), element('p', '', 'The community supper is open. Keep serving your neighbours and completing your menu.'));
  else {
    body.append(element('h3', '', task.title));
    const requirements = element('ul', 'task-requirements');
    requirements.id = inSheet ? 'sheet-task-requirements' : 'story-task-requirements';
    requirements.setAttribute('aria-label', 'Preparation requirements');
    for (const requirement of eligibility.requirements) {
      const row = element('li');
      row.dataset.requirement = requirement.kind;
      if (requirement.kind === 'quest') {
        row.append(element('span', '', `Quest: ${requirement.title}`), element('span', 'requirement-status', requirement.met ? 'Complete' : 'Required'));
      } else if (requirement.kind === 'space') {
        if (requirement.met) continue;
        row.append(element('span', '', `Free one board or pantry space for the ${requirement.source}.`));
      } else {
        const label = requirement.kind === 'coins' ? 'Coins' : requirement.kind === 'served' ? 'Total orders served' : 'Total merges';
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
  const requests = resolveQuests(state,data).filter(view => view.status === 'active' || view.status === 'offer').length;
  const quests = button(`Neighbour quests${requests ? ` · ${requests}` : ''}`, 'text-button', () => questBook()); quests.dataset.quests = '';
  links.append(quests);
  const journalLink=button('Journal','text-button',journal);journalLink.setAttribute('aria-label','Open the story journal');links.append(journalLink);
  // The drawer can cover the windowsill on phones, so the cat also waits in the Story sheet there.
  const cat = button('', 'cat-visit', toggleCat); const words = element('span');
  words.append(element('strong', '', 'Miez is on kitchen duty.'), element('small', '', 'Give the resident cat some attention.'));
  cat.append(miezSprite(), words);
  const foot = element('p', 'story-foot'); foot.append(element('span', 'save-status', saveMessage), element('span', '', `${state.taskIndex} of ${data.tasks.length} preparations done`));
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
    const result = applyAction({ type:'task' });
    if (!result.ok) { held = null; return; }
    preloadRoom(task); showStory(task, true, result.message);
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
  const face = element('span', 'portrait portrait-0'), words = element('p');
  face.setAttribute('aria-hidden', 'true'); words.append(element('strong', '', task!.title), element('span', '', 'Ready when you are.'));
  offer.replaceChildren(face, words, payButton(task!));
}
/** The selection strip's note: how a source works, or which neighbours are waiting for the item, so a sale is never a surprise. */
function detailNote(code: string) {
  if (definition(code).generator) return 'Tap it on the board, or use Take. It never runs out.';
  const waiting = [...new Set([...state.orders.filter(order => order.requirements.includes(code)).map(order => character(order.customer).name),
    ...resolveQuests(state,data).filter(view => view.status === 'active' && view.quest.requirements.some(requirement => requirement.item === code)).map(view => character(view.quest.character).name)])];
  return waiting.length ? `${names.format(waiting)} ${waiting.length === 1 ? 'is' : 'are'} waiting for one.` : 'No one has ordered it yet.';
}
/** An item's six-stage chain as an ordered list with visible names, three to a row. */
function chainOf(code: string) {
  const def = definition(code); const chain = element('ol', 'chain named'); chain.setAttribute('aria-label','Merge chain');
  for (let stage=1;stage<=6;stage++) {
    const id=`${def.chain}_${stage}`; const step=element('li', id===code?'current':'');
    if (!getItem(id,data)) break;
    if (id===code) step.setAttribute('aria-current','step');
    const known = state.discovered.includes(id);
    step.append(known ? food(id) : cloche(), element('span', '', known ? itemName(id) : 'Not yet')); chain.append(step);
  }
  return chain;
}
/** The item dialog answers the order's question: how to get this item, and how many are at hand. Its title names the item. */
function detailContent(code: string) {
  const def = definition(code), name = itemName(code), source = sourceOf(def.chain);
  const onBoard = state.board.filter(cell => cell?.code === code).length, inPantry = state.inventory.filter(cell => cell.code === code).length;
  const unlocked = [...state.board, ...state.inventory].some(cell => cell?.code === source.id);
  const content = document.createDocumentFragment();
  const direct = generatorOutputs(state,source.id,data).includes(code) && (def.stage > 1 || chosenOutput(source.id) !== code);
  content.append(food(code), element('p','item-how', direct ? `Select the ${source.name}, then choose Take ${name}.` : def.stage > 1 ? `Merge two ${itemName(`${def.chain}_${def.stage - 1}`)} to make ${name}.` : `Tap the ${source.name} to take ${name}.`));
  if (!unlocked) {
    const task = data.tasks.find(value => value.unlock === def.chain);
    const quest=data.quests.find(value=>value.producer?.item===source.id);
    content.append(element('p','',quest?`Accept “${quest.title}” in Neighbour quests to borrow the ${source.name}.`:`The ${source.name} arrives with ${task ? `the preparation “${task.title}”` : 'a later preparation'}.`), chainOf(code));
    return content;
  }
  const have = onBoard && inPantry ? `You have ${onBoard} on the board and ${inPantry} in the pantry.` : onBoard ? `You have ${onBoard} on the board.` : inPantry ? `You have ${inPantry} in the pantry.` : 'You have none yet.';
  content.append(element('p','',have), chainOf(code), button('Show me on the board','secondary-button',() => showWay(code)));
  return content;
}
/** Points at the next step toward an item: the item itself, the highest pair that merges toward it, or its source. */
function showWay(code: string) {
  // Ingredient help transfers focus into the kitchen, so the close event must not return it to Story.
  questFlow=false;
  modal.close();
  const def = definition(code), name = itemName(code);
  const cells = (id: string) => state.board.flatMap((cell, index) => cell?.code === id ? [index] : []);
  // The first cell is selected and the rest pulse, so the selected outline stays visible.
  const point = (at: number[], line: string) => { selected = at[0]; render(); pulse(at.slice(1)); status(line); $(`[data-cell="${at[0]}"]`).focus({ preventScroll:true }); };
  // Where the pantry is a sheet, a stored item opens it.
  const inPantry = (line: string) => { selected = null; render(); if (drawerLayout.matches) pantrySheet(); status(line); };
  if (cells(code).length) return point(cells(code), `${name} is ready on the board.`);
  if (state.inventory.some(cell => cell.code === code)) return inPantry(`${name} is in the pantry. Tap it to bring it back.`);
  for (let stage = def.stage - 1; stage >= 1; stage--) {
    const id = `${def.chain}_${stage}`, pair = cells(id).slice(0, 2);
    if (pair.length === 2) return point(pair, `Tap the other ${itemName(id)} to merge them.`);
  }
  const source = sourceOf(def.chain), at = cells(source.id);
  const output = generatorOutputs(state,source.id,data).filter(id => definition(id).stage <= def.stage).at(-1)!;
  if (at.length) point(at, `Use Take ${itemName(output)} on the ${source.name}.`);
  else inPantry(`Tap the ${source.name} in the pantry to bring it back.`);
}
/** The selected item and its actions take the place of Mara's line under the board, so the player acts without leaving the board. */
function renderDetail() {
  const container = $('#item-detail'); container.replaceChildren();
  const cell = selected !== null ? state.board[selected] : null;
  const outputs = cell && definition(cell.code).generator ? generatorOutputs(state,cell.code,data) : [];
  container.classList.toggle('multiple-outputs', outputs.length > 1);
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
  actions.append(button('Store','secondary-button',() => act({type:'store',index:at},null)));
  if (!def.generator) {
    const value = saleValue(cell.code,data), sell = button(`Sell · ${count.format(value)}`,'secondary-button sell-button',() => act({type:'sell',index:at},null));
    sell.append(coinMark()); sell.setAttribute('aria-label', `Sell for ${coinText(value)}`); actions.append(sell);
  }
  const clear = button('', 'icon-button clear-selection', () => { selected = null; render(); status(MOVE_HINT); });
  clear.setAttribute('aria-label', 'Clear selection');
  const cross = svg('svg'); cross.setAttribute('viewBox','0 0 24 24'); cross.setAttribute('aria-hidden','true'); const mark = svg('path'); mark.setAttribute('d','m6 6 12 12M18 6 6 18'); cross.append(mark); clear.append(cross);
  actions.append(clear);
  container.append(head, actions);
  if (outputs.length > 1) container.append(takes);
  const title = words.firstElementChild as HTMLElement;
  words.classList.toggle('long-name', phone.matches && title.offsetHeight > parseFloat(getComputedStyle(title).lineHeight) * 1.5);
  fitPin();
}
function renderStorage() {
  $('#inventory-count').textContent = `${state.inventory.length} / ${data.inventoryCapacity}`;
  $('#pantry-button').setAttribute('aria-label', `Pantry, ${state.inventory.length} of ${data.inventoryCapacity}`);
  const container = pantryPanel.querySelector<HTMLElement>('.inventory')!; container.replaceChildren();
  for(let index=0;index<data.inventoryCapacity;index++) {
    const cell=state.inventory[index]; const value=button('','inventory-slot',() => act({type:'retrieve',index}));
    value.disabled=!cell; value.setAttribute('aria-label',cell?`Return ${itemName(cell.code)} to the board`:`Empty pantry space ${index+1}`);
    if(cell)value.append(food(cell.code)); container.append(value);
  }
}
/** The pantry lives beside the board on wider screens. Where the kitchen is a drawer, the Pantry button lends it to a sheet. */
function restorePantry() { if (pantryPanel.parentElement !== $('#side')) $('#side').append(pantryPanel); }
function pantrySheet() { showModal('The pantry', pantryPanel); }
/** Opens the dialog, or replaces what an open dialog shows. Replacing removes the focused control, so focus moves to the given control or to the new title, which screen readers then read. */
function showModal(title: string, content: Node, focus?: HTMLElement, back?: () => void) {
  const replacing=modal.open;
  modalReturn=back ?? null;
  if(content!==pantryPanel)restorePantry();
  $('#modal-title').textContent=title; $('#modal-body').replaceChildren(content);
  if(!modal.open)modal.showModal();
  if(focus)focus.focus();else if(replacing&&!modal.contains(document.activeElement))$('#modal-title').focus();
}
function showItem(code: string) { const content=element('div','item-detail');content.append(detailContent(code));showModal(itemName(code),content); }
/** A drawer ticket's shared dish target: the order lists its dishes, and each opens its item dialog. */
function showOrder(name: string, codes: string[]) {
  const grid=element('div','recipe-grid');
  for(const code of codes){const value=button('','recipe-item',()=>showItem(code));value.append(food(code),element('span','',itemName(code)));grid.append(value);}
  showModal(`${name}’s order`,grid);
}
/** A preparation's conversation. Right after paying, its last line leads on to the change it made, which the room then reveals in place. */
function showStory(task: Pick<Task,'title'|'dialogue'>, paid = false, completion = '', backTo?: () => void) {
  let cursor=0;const last=task.dialogue.length-1;
  // The stage is built once and only its words change: the live region stays in place, so each new line is announced, and focus stays on the button pressed.
  const content=element('div'),stage=element('div','story-stage'),words=element('div','story-dialogue'),speaker=element('h3'),said=element('p');
  words.id='story-line';words.setAttribute('aria-live','polite');words.setAttribute('aria-atomic','true');words.append(speaker,said);
  const counter=element('span'),controls=element('div','story-controls');
  const back=button('Back','secondary-button',()=>{cursor--;draw();if(back.disabled)forward.focus();});
  const forward=button('Continue','primary-button',()=>{if(cursor<last){cursor++;draw();}else if(backTo)backTo();else modal.close();});
  forward.setAttribute('aria-describedby','story-line');
  stage.append(portrait(task.dialogue[0].speaker),words);controls.append(back,counter,forward);content.append(stage,controls);
  if (completion) content.append(element('p','completion-message',completion));
  function draw() {
    const line=task.dialogue[cursor];stage.firstElementChild!.replaceWith(portrait(line.speaker));
    speaker.textContent=character(line.speaker).name;said.textContent=line.text;counter.textContent=`${cursor+1} / ${task.dialogue.length}`;
    back.disabled=cursor===0;forward.textContent=cursor<last?'Continue':paid?'See what changed':backTo?'Return':'Back to the kitchen';
  }
  draw();showModal(task.title,content,forward,backTo);
}
/** Quests share the Story sheet. They leave every ordinary ticket and board space in place. */
function questBook(focusQuest?: string, message = '') {
  questFlow=true;
  const content=element('div','quest-book');
  content.append(element('p','modal-copy','Prepare something for a neighbour. These requests have no deadline. Your three ordinary orders stay at the counter.'));
  const notice=element('p','quest-notice');notice.setAttribute('role','status');notice.textContent=message;
  content.append(notice);
  const views=resolveQuests(state,data),available=views.filter(view=>view.status==='active'||view.status==='offer');
  for(const {quest,status:questStatus} of available){
    const card=element('article','quest-card');card.dataset.quest=quest.id;
    const heading=element('h3','',quest.title);heading.tabIndex=-1;heading.id=`heading-${quest.id}`;card.setAttribute('aria-labelledby',heading.id);
    const head=element('div','quest-heading'),words=element('div');words.append(heading,element('p','quest-person',character(quest.character).name));
    head.append(portrait(quest.character),words);card.append(head);
    const requirements=element('ul','quest-requirements'),totals=new Map<string,number>();
    for(const requirement of quest.requirements)totals.set(requirement.item,(totals.get(requirement.item)??0)+requirement.quantity);
    for(const [code,quantity] of totals){
      const onBoard=Math.min(state.board.filter(cell=>cell?.code===code).length,quantity);
      const row=element('li'),inspect=button('','quest-item',()=>{
        const details=element('div','item-detail');details.append(detailContent(code));
        showModal(itemName(code),details,undefined,()=>questBook(quest.id));
      });
      inspect.setAttribute('aria-label',`${itemName(code)}: ${onBoard} of ${quantity} on the board`);
      inspect.append(food(code),element('span','',`${quantity} ${itemName(code)}`),element('span','quest-count',`${onBoard} / ${quantity} on board`));row.append(inspect);requirements.append(row);
    }
    card.append(requirements,element('p','quest-reward',`Reward: ${coinText(quest.reward)}`));
    card.append(element('p','quest-note','Delivery uses the board only. Return stored items from the pantry first.'));
    const actions=element('div','quest-actions');
    const read=button('Read request','secondary-button',()=>showStory({title:quest.title,dialogue:quest.opening},false,'',()=>questBook(quest.id)));
    read.setAttribute('aria-label',`Read request: ${quest.title}`);actions.append(read);
    if(questStatus==='offer'){
      card.append(element('p','quest-note',`Accept to borrow the ${itemName(quest.producer!.item)}. It needs one free space on the board or in the pantry. Delivery returns this source and all of its tasting items.`));
      const accept=button('Accept request','primary-button',()=>changeGame(()=>{
        if(!card.isConnected)return;
        const result=applyAction({type:'acceptQuest',id:quest.id});
        questBook(quest.id,`${result.message}${saveFailed?' This session is not saved.':''}`);
      }));
      accept.setAttribute('aria-label',`Accept ${quest.title}`);actions.append(accept);
    }else{
      const deliver=button(`Deliver · ${quest.reward}`,'primary-button',()=>quest.producer?confirmQuestDelivery(quest):deliverQuest(quest,card));
      deliver.setAttribute('aria-label',`Deliver ${quest.title} for ${quest.reward} coins`);deliver.disabled=!canDeliverQuest(state,quest.id,data);actions.append(deliver);
      if(quest.producer)card.append(element('p','quest-note',`Before delivery, review the tasting source and leftover tasting items that will return to ${character(quest.character).name}.`));
    }
    card.append(actions);content.append(card);
  }
  const done=views.filter(view=>view.status==='complete'||view.status==='legacy').length;
  if(!available.length)content.append(element('p','',done===views.length?'Every neighbour request is complete. You can read their conversations in the story journal.':'No request is ready yet. Finish more preparations to open the next neighbour request.'));
  content.append(element('p','quest-progress',`${done} of ${data.quests.length} requests complete`),element('p','save-status',saveMessage));
  if(saveFailed&&!recoveryRequired&&storage)content.append(button('Retry save','secondary-button',()=>changeGame(()=>{
    persist();questBook(focusQuest,saveFailed?`This session is not saved. ${saveMessage}`:'Your quests and progress are saved in this browser.');
  })));
  content.append(button('Open the story journal','text-button',journal));
  const focus=focusQuest?content.querySelector<HTMLElement>(`[data-quest="${focusQuest}"] h3`)??$('#modal-title'):undefined;
  showModal('Neighbour quests',content,focus);
}
function deliverQuest(quest: Quest, source: HTMLElement, cleanupToken?: string) { return changeGame(()=>{
  if(!source.isConnected)return;
  const result=applyAction({type:'deliverQuest',id:quest.id,cleanupToken});
  if(!result.ok){questBook(quest.id,result.message);return;}
  const message=`${result.message}${saveFailed?' This session is not saved. Return to quests and use Retry save, or export before leaving.':''}`;
  showStory({title:quest.title,dialogue:quest.completion},false,message,()=>questBook(quest.id));
}); }
function confirmQuestDelivery(quest: Quest) {
  const preview=previewQuestCleanup(state,quest.id,data);
  if(!preview){questBook(quest.id,'This request is no longer ready. Check its requirements.');return;}
  const content=element('div','quest-cleanup');
  content.append(element('p','modal-copy','Delivery also returns these tasting supplies. Ordinary items stay where they are.'));
  for(const [label,items] of [['Board',preview.board],['Pantry',preview.inventory]] as const){
    content.append(element('h3','',label));const list=element('ul','quest-cleanup-list');
    for(const entry of items)list.append(element('li','',`${itemName(entry.item)} · ${label} space ${entry.index+1}`));
    if(!items.length)list.append(element('li','','No tasting supplies here.'));
    content.append(list);
  }
  content.append(element('p','quest-reward',`Reward: ${coinText(quest.reward)}`));
  const actions=element('div','quest-actions'),keep=button('Keep items','secondary-button',()=>questBook(quest.id));
  actions.append(button('Deliver and return supplies','primary-button',()=>deliverQuest(quest,content,preview.token)),keep);content.append(actions);
  showModal('Return the tasting supplies',content,keep,()=>questBook(quest.id));
}
function journal(focusEntry?: string) {
  const content=element('div','journal-list');
  content.append(element('p','modal-copy','Meet your neighbours and read your saved conversations. Reading never gives another reward.'));
  content.append(element('h3','','Neighbours'));
  for(const person of data.characters){
    const entry=button('','journal-entry',()=>showStory({title:`Meet ${person.name}`,dialogue:[{speaker:person.id,text:person.introduction}]},false,'',()=>journal(person.id)));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',`Meet ${person.name}`);
    entry.append(portrait(person.id),element('strong','',person.name),element('span','',person.role));content.append(entry);
  }
  const completed=resolveQuests(state,data).filter(view=>view.status==='complete'||view.status==='legacy');
  if(completed.length)content.append(element('h3','','Neighbour quests'));
  for(const {quest,status:questStatus} of completed){
    const section=element('section','quest-journal');section.append(element('h4','',quest.title));
    if(questStatus==='legacy')section.append(element('p','small-copy','Satisfied by your earlier preparations. No quest reward was added.'));
    const opening=button('Read request','text-button',()=>showStory({title:quest.title,dialogue:quest.opening},false,'',()=>journal(quest.id)));
    opening.setAttribute('aria-label',`Read request: ${quest.title}`);
    const replay=button('Read completion','journal-entry',()=>showStory({title:quest.title,dialogue:quest.completion},false,'',()=>journal(quest.id)));
    replay.dataset.journal=quest.id;replay.setAttribute('aria-label',`Replay ${quest.title}`);replay.append(element('span','',character(quest.character).name));section.append(opening,replay);content.append(section);
  }
  content.append(element('h3','','Preparations'));
  if(!state.taskIndex)content.append(element('p','small-copy','Finish your first preparation to start the journal.'));
  for(const task of data.tasks.slice(0,state.taskIndex)) {
    const entry=button('','journal-entry',()=>showStory(task));entry.append(element('strong','',task.title),element('span','',`Chapter ${task.chapter}`));content.append(entry);
  }
  showModal('Story journal',content,focusEntry?content.querySelector<HTMLElement>(`[data-journal="${focusEntry}"]`)??undefined:undefined);
}
/** A serving cloche with a dashed dome: the "not yet" mark for a dish nobody has made. */
function cloche() {
  const value=svg('svg');value.setAttribute('class','cloche');value.setAttribute('viewBox','0 0 48 48');value.setAttribute('aria-hidden','true');
  const dome=svg('path');dome.setAttribute('class','cloche-dome');dome.setAttribute('d','M9 33a15 15 0 0 1 30 0');
  const knob=svg('path');knob.setAttribute('d','M24 18v-2.5M21.5 15.5h5');
  const plate=svg('path');plate.setAttribute('d','M6 33h36M10 36.5h28');
  value.append(dome,knob,plate);return value;
}
/** Undiscovered dishes wait under cloches, so the book never spoils what the kitchen has not made yet. */
function recipeBook() {
  freshDishes=0;markRecipeBook();
  const content=element('div');content.append(element('p','modal-copy','A playful menu inspired by regional foods and drinks. Merge paths are game rules, not cooking recipes. Dishes you have not made yet wait under a cloche.'));
  for(const chain of data.chains) {
    const section=element('section','recipe-chain');section.append(element('h3','',chain.name));
    const grid=element('div','recipe-grid');
    for(let stage=1;stage<=6;stage++) {
      const code=`${chain.id}_${stage}`;
      if(!state.discovered.includes(code)){const slot=element('div','recipe-item not-yet');slot.append(cloche(),element('span','','Not yet'));grid.append(slot);continue;}
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
  drawDecorations($('#room-decorations'),view.id,roomCompleted(),state.decorationChoices);
  const caption=$('#room-caption'),key=`${view.id}:${view.states.map(room=>room.id).join()}:${decorations.map(slot=>slot.selected.id).join()}`;
  if(caption.dataset.key!==key){
    caption.dataset.key=key;const list=element('ol','room-changes');
    for(const room of view.states)list.append(element('li','',room.text));
    const finishes=element('p','decoration-caption',decorations.map(slot=>`${slot.name}: ${slot.selected.name}.`).join(' '));
    caption.replaceChildren(element('p','room-missing','The painting of this room could not load, so here it is in words.'),element('p','room-name',view.name),list,finishes);
  }
  if(frame.dataset.painting===painting.id&&!fade){pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');fitPin();return Promise.resolve();}
  frame.dataset.painting=painting.id;
  if(fade)pin.hidden=true;else pin.hidden=!marked;
  return showPainting(painting.id,fade).then(()=>{if(frame.dataset.current!==current.id)return;pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');syncMiez();});
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
}
/** Where the kitchen is a drawer, its handle lowers it to show the whole room and raises it again. */
function setLowered(value: boolean) {
  lowered=value&&movableDrawer.matches;const handle=$('#drawer-handle'),layout=$('.game-layout');
  layout.classList.toggle('lowered',lowered);$('#drawer-body').inert=lowered||layout.classList.contains('revealing');
  handle.setAttribute('aria-expanded',String(!lowered));handle.setAttribute('aria-label',lowered?'Raise the kitchen':'Lower the kitchen to see the room');
}
/** Miez takes input only while the windowsill shows above the drawer, so focus never lands on a hidden cat. */
function syncMiez() {
  const cat=$<HTMLButtonElement>('#cat-button'),box=cat.getBoundingClientRect(),stage=$('#room-stage').getBoundingClientRect();
  const bottom=drawerLayout.matches?$('#drawer').getBoundingClientRect().top:stage.bottom;
  cat.inert=!box.width||box.top<stage.top||box.bottom>bottom+1||box.left<stage.left||box.right>stage.right+1;
  fitPin();
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
  const toggle=button(sound?'Turn sound off':'Turn sound on','secondary-button',()=>{sound=!sound;playTone('serve');toggle.textContent=sound?'Turn sound off':'Turn sound on';});
  return toggle;
}
/** A crop uses the same scene coordinates in the room and in the editor. Saves only supply validated choice IDs. */
function decorationImage(slot: DecorationSlot, variant: DecorationVariant, detail = false) {
  const crop=slot.crop,scaleX=15.36,scaleY=20.48,value=svg('svg');
  value.setAttribute('viewBox',detail?[crop.x*scaleX,crop.y*scaleY,crop.width*scaleX,crop.height*scaleY].join(' '):'0 0 1536 2048');
  value.setAttribute('class',detail?'decoration-detail':'decoration-layer');value.setAttribute('aria-hidden','true');
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
/** The editor owns only a preview. Apply goes through the same lock and durable-write boundary as a preparation. */
function editDecoration(id: string) {
  const slot=resolveDecorations(state.decorations,state.decorationChoices,data).find(slot=>slot.id===id);
  if(!slot?.unlocked)return;
  editingDecoration=id;
  let pending=slot.selected.id;
  const content=element('div','decoration-editor'),preview=element('div','decoration-preview'),notice=element('p','decoration-notice');
  notice.setAttribute('role','status');
  const options=element('fieldset','choice-fieldset'),group=element('div','decoration-options');
  options.append(element('legend','','Choose a finish'),group);
  const refresh=()=>{
    const variant=slot.variants.find(variant=>variant.id===pending)!;
    preview.replaceChildren(decorationImage(slot,variant,true));
    notice.textContent=`Preview: ${variant.name}. Saved: ${slot.selected.name}.`;
  };
  for(const variant of slot.variants){
    const label=element('label','decoration-option'),input=element('input');input.type='radio';input.name='decoration';input.value=variant.id;input.checked=variant.id===pending;
    input.addEventListener('change',()=>{pending=variant.id;refresh();});
    label.append(input,element('span','',variant.name),element('small','',variant.id===slot.selected.id?'Saved choice':'Optional finish'));group.append(label);
  }
  const actions=element('div','settings-actions'),cancel=button('Cancel','secondary-button',()=>settings(id));
  const apply=button('Apply','primary-button',()=>{
    apply.disabled=true;
    void Promise.resolve(changeGame(()=>{
      // Cancel or dismissal while waiting for a lock discards the queued preview too.
      if(editingDecoration!==id||!content.isConnected)return;
      const result=applyAction({type:'decorate',slot:id,variant:pending});
      if(result.ok){settings(id);status(`${slot.name}: ${slot.variants.find(variant=>variant.id===pending)!.name}. Saved in this browser.`);}
      else{notice.textContent=`${result.message} Select Retry to save this choice.`;notice.classList.add('save-error');apply.textContent='Retry';}
    })).finally(()=>{apply.disabled=false;});
  });
  actions.append(apply,cancel);refresh();content.append(element('p','modal-copy','Make this corner your own. You can change it again for free.'),preview,options,notice,actions);
  showModal(slot.name,content,group.querySelector<HTMLInputElement>('input:checked')!);
}
function markLevelRewards() {
  const ready=availableLevelRewards(state,data).length;
  for(const opener of document.querySelectorAll<HTMLElement>('[data-house-book]')){
    opener.toggleAttribute('data-rewards',ready>0);
    opener.setAttribute('aria-label',`House book: settings and saved game${ready?`, ${ready} level ${ready===1?'reward':'rewards'} available`:''}`);
  }
}
/** The notice stays mounted while claims refresh, so each result is announced once. */
function levelPanel() {
  const panel=element('section','settings-section level-panel');panel.setAttribute('aria-labelledby','level-heading');
  const heading=element('h3','','Level rewards');heading.id='level-heading';heading.tabIndex=-1;
  const details=element('div'),notice=element('p','level-notice');notice.setAttribute('role','status');
  const refresh=()=>{
    const level=getLevel(state),ready=availableLevelRewards(state,data),next=data.levelRewards.find(reward=>reward.level>level);
    details.replaceChildren(element('p','level-progress',`Level ${count.format(level)} · ${count.format(state.xp)} XP`),element('p','',`${state.xp%100} of 100 XP to level ${count.format(level+1)}. Merge dishes, serve orders, and finish preparations to earn XP.`));
    if(next)details.append(element('p','level-next',`Next reward: level ${next.level} · ${coinText(next.coins)} at ${count.format((next.level-1)*100)} XP.`));
    else details.append(element('p','level-next',ready.length?'All level rewards earned. Claim your remaining rewards below.':'All level rewards claimed. Your level can keep rising.'));
    if(ready.length)details.append(element('p','',`${ready.length} ${ready.length===1?'reward is':'rewards are'} ready to claim.`));
    const list=element('ul','level-rewards');
    for(const reward of data.levelRewards.filter(reward=>reward.level<=level)){
      const row=element('li','level-reward');row.append(element('span','',`Level ${reward.level} · ${coinText(reward.coins)}`));
      if(state.claimedLevelRewards.includes(reward.id))row.append(element('span','level-claimed','Claimed'));
      else {
        const claim=button(`Claim ${coinText(reward.coins)}`,'primary-button',()=>changeGame(()=>{
          const result=applyAction({type:'claimLevelReward',id:reward.id});
          refresh();heading.focus({preventScroll:true});
          const message=result.ok&&saveFailed?`${result.message} This session is not saved.${storage?' Use Retry save before you leave.':''}`:result.message;
          if(notice.textContent!==message)notice.textContent=message;
        }));
        claim.setAttribute('aria-label',`Claim ${coinText(reward.coins)} for level ${reward.level}`);row.append(claim);
      }
      list.append(row);
    }
    details.append(list,element('p','save-status',saveMessage));
    if(saveFailed&&!recoveryRequired&&storage)details.append(button('Retry save','secondary-button',()=>changeGame(()=>{
      persist();refresh();heading.focus({preventScroll:true});
      const message=saveFailed?`This session is not saved. ${saveMessage}`:'Your level rewards and progress are saved in this browser.';
      if(notice.textContent!==message)notice.textContent=message;
    })));
  };
  refresh();panel.append(heading,details,notice);return panel;
}
function settings(focusSlot?: string) {
  editingDecoration=null;
  const content=element('div');content.append(element('p','modal-copy save-status',saveMessage));
  // Writes never replace an unreadable save, so only a new game (an explicit reset) lets this browser save again.
  if(saveFailed&&recoveryRequired)content.append(element('p','save-error',['invalid','unsupported'].includes(loadSave(storage,validate).status)?`${saveMessage} To save in this browser again, start a new game below. That replaces the unreadable save.`:saveMessage));
  if(recoveryRequired)content.append(button('Retry saved game','primary-button',()=>location.reload()));
  content.append(levelPanel());
  const decorationSection=element('section','settings-section');decorationSection.append(element('h3','','Decorations'),element('p','','Choose the details of your bistro. Each choice is free.'));
  for(const slot of resolveDecorations(state.decorations,state.decorationChoices,data)){
    const row=element('div','decoration-row');
    if(slot.unlocked){
      const open=button('','decoration-slot',()=>editDecoration(slot.id));open.dataset.decoration=slot.id;
      const words=element('span','decoration-slot-words');words.append(element('strong','',slot.name),element('span','',slot.selected.name));
      open.append(decorationImage(slot,slot.selected,true),words,element('span','decoration-edit','Change'));row.append(open);
    }else{row.classList.add('decoration-locked');row.append(element('strong','',slot.name),element('p','',`Finish “${data.tasks.find(task=>task.id===slot.unlock)!.title}” to choose this detail.`));}
    decorationSection.append(row);
  }
  content.append(decorationSection);
  const appearance=element('section','settings-section');const choices=element('fieldset','choice-fieldset');const group=element('div','choice-group');
  for(const [value,name] of THEMES) {
    const choice=element('label','choice');const input=element('input');input.type='radio';input.name='appearance';input.value=value;input.checked=theme===value;
    input.addEventListener('change',()=>setTheme(value,true));choice.append(input,element('span','',name));group.append(choice);
  }
  choices.append(element('legend','','Appearance'),element('p','','System follows your device’s light or dark setting.'),group);appearance.append(choices);content.append(appearance);
  const audio=element('section','settings-section');audio.append(element('h3','','Kitchen sounds'),element('p','','Soft tones for merging, serving, and finishing preparations. Sound stays off until you turn it on.'),soundToggle());content.append(audio);
  const saves=element('section','settings-section');saves.append(element('h3','','Your saved game'),element('p','','Export a copy to keep it safe or to carry on in another browser.'));
  const actions=element('div','settings-actions');actions.append(button('Export saved game','secondary-button',downloadSave));
  const file=element('input','hidden');file.type='file';file.accept='.json,application/json';
  file.addEventListener('change',async()=>{
    const selectedFile=file.files?.[0];if(!selectedFile)return;
    try {
      if(selectedFile.size>MAX_SAVE_BYTES)throw new Error('Select a saved game smaller than 2 MiB.');
      const candidate=normalizeOrderCustomers(importSave<GameState>(await selectedFile.text(),validate,saveMigrations(data)),data);
      const review=element('div');review.append(element('p','modal-copy',`Replace the current game with this saved game: ${coinText(candidate.coins)} and ${count.format(candidate.taskIndex)} of ${data.tasks.length} preparations done? Export the current game first if you want to keep it.`));
      const keep=button('Keep the current game','secondary-button',settings),choice=element('div','settings-actions');
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
    const keep=button('Keep this game','secondary-button',settings),choice=element('div','settings-actions');
    choice.append(button('Erase and start again','danger-button',()=>changeGame(()=>{
      const fresh=createGame(data),result=resetSave(storage,fresh,validate);if(!result.ok){showModal('Reset failed',element('p','save-error',result.error ?? ''));return;}
      recoveryRequired=false;observedSave=JSON.stringify(fresh);replaceGame(fresh);reportSave(result);render();modal.close();status('The kitchen is ready for a fresh start.');
    },true)),keep);
    const confirm=element('div');confirm.append(element('p','modal-copy','This erases the dishes, coins, story progress, discoveries, and decoration choices saved in this browser. Export a copy first if you want to keep this game.'),choice);showModal('Start a new game?',confirm,keep);
  }));content.append(reset);showModal('House book',content,focusSlot?content.querySelector<HTMLElement>(`[data-decoration="${focusSlot}"]`)!:modal.open?undefined:$('#close-modal'));
}
function findMatch() {
  for(let from=0;from<state.board.length;from++) {
    const cell=state.board[from];if(!cell||!definition(cell.code).next)continue;
    const to=state.board.findIndex((other,index)=>index!==from&&other?.code===cell.code);
    // One item of the pair is selected and the other pulses, so the instruction names a single target.
    if(to>=0){selected=from;render();pulse([to]);status(`Tap the other ${itemName(cell.code)} to merge them.`);return;}
  }
  const index=state.board.findIndex(cell=>cell&&definition(cell.code).generator);
  if(index>=0){const code=state.board[index]!.code;selected=index;render();status(`No matches yet. Tap the ${itemName(code)} to take ${itemName(chosenOutput(code))}.`);return;}
  const stored=state.inventory.find(cell=>definition(cell.code).generator);
  status(stored?`No matches yet. Tap the ${itemName(stored.code)} in the pantry to bring it back.`:'No matches yet.');
}
function cancelDrag() { dragging?.ghost?.remove();dragging=null; }
$('#board').addEventListener('pointerdown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target||event.button!==0)return;
  const index=Number(target.dataset.cell);if(!state.board[index])return;
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
$('#close-modal').addEventListener('click',()=>editingDecoration?settings(editingDecoration):modalReturn?modalReturn():modal.close());
modal.addEventListener('cancel',event=>{if(editingDecoration){event.preventDefault();settings(editingDecoration);}else if(modalReturn){event.preventDefault();modalReturn();}});
// A closed sheet gives the pantry back, and the end of a paid preparation's story reveals its change.
modal.addEventListener('close',()=>{
  if(modal.open)return;
  editingDecoration=null;
  modalReturn=null;
  restorePantry();
  if(questFlow){questFlow=false;const opener=[...document.querySelectorAll<HTMLElement>('[data-quests]')].find(value=>value.checkVisibility());(opener??$('#story-button')).focus({preventScroll:true});}
  if(held){const task=held;held=null;void reveal(task);}
});
$('#drawer-handle').addEventListener('pointerdown',event=>{swipe=event.clientY;});
$('#drawer-handle').addEventListener('pointerup',event=>{swipe=event.clientY-swipe;});
// A keyboard click has no pointer, so it toggles the drawer whatever an earlier pointer left in swipe.
$('#drawer-handle').addEventListener('click',event=>{const moved=event.detail&&Math.abs(swipe)>20?swipe>0:!lowered;swipe=0;setLowered(moved);});
$('#room-pin').addEventListener('click',()=>{const {view}=currentView();status(view.current!.text);});
for(const opener of document.querySelectorAll('[data-house-book]'))opener.addEventListener('click',()=>data&&settings());
$('#collection-button').addEventListener('click',()=>data&&recipeBook());
$('#recipes-button').addEventListener('click',()=>data&&recipeBook());
$('#pantry-button').addEventListener('click',()=>data&&pantrySheet());
$('#story-button').addEventListener('click',()=>data&&showModal('Our little bistro',storyContent(true)));
$('#hint-button').addEventListener('click',()=>state&&findMatch());
$('#cat-button').addEventListener('click',toggleCat);
phone.addEventListener('change',()=>{if(state){renderCoins();renderDetail();}});
drawerLayout.addEventListener('change',()=>{setLowered(false);if(!drawerLayout.matches&&modal.open&&pantryPanel.closest('dialog'))modal.close();if(state){renderOffer();renderOrders();}});
movableDrawer.addEventListener('change',()=>setLowered(false));
window.addEventListener('resize',()=>{if(state&&farewells.size)endFarewells();syncMiez();});
$('#room-frame').addEventListener('transitionend',syncMiez);$('.game-layout').addEventListener('transitionend',syncMiez);
window.addEventListener('storage',event=>{
  if(!state||event.key!==SAVE_KEY||event.newValue===null)return;
  syncSavedGame();
});
try {
  const response=await fetch(new URL('../data/game.json',import.meta.url));if(!response.ok)throw new Error('Game data could not be loaded.');
  data=await response.json();
  // Data that fails its checks never reaches the save, so it cannot be mistaken for a damaged save.
  const problems=dataProblems(data);if(problems.length)throw new Error('The game data is not valid.',{cause:problems});
  // Migration writes share the game lock, so an old tab cannot replace a newer destination.
  const load=()=>loadSave<GameState>(storage,validate,saveMigrations(data));
  const saved=storage&&navigator.locks?await navigator.locks.request(SAVE_KEY,load):load();
  state=saved.state?normalizeOrderCustomers(saved.state,data):createGame(data);
  // A reload cannot open blocked storage, so that game plays for this visit without the recovery block.
  recoveryRequired=Boolean(storage)&&!['loaded','empty'].includes(saved.status);
  observedSave=saved.state?JSON.stringify(saved.state):null;
  saveFailed=!['loaded','empty'].includes(saved.status);
  saveMessage=!storage?BLOCKED_STORAGE:saveFailed?`Saved progress could not be loaded. ${saved.error}`:'Saved in this browser';
  // The room opens on the player's chosen area while it is open, and otherwise on the area of the latest change.
  try{viewArea=storage?.getItem(AREA_KEY)??'';}catch{/* Follow the latest change. */}
  render();
  // The frame pans smoothly only after it first settles, so opening the game shows the room in place.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#room-frame').classList.add('settled');syncMiez();}));
  if(saved.status==='empty')await changeGame(persist);
  // Phones get a shorter opening line, so that it fits the line under the board.
  status(saved.status==='loaded'?'Welcome back. The stove is still warm.':phone.matches?'Merge the two Flours. Tap the Flour bin for more.':'Tap one Flour, then the other, to merge. Tap the Flour bin for more.');
  if(saveFailed)settings();
}catch(error){
  status(`The kitchen could not open. ${reason(error)}`);console.error(error);
  const hint=$('#hint-button');hint.textContent='Try again';hint.addEventListener('click',()=>location.reload());
  for(const opener of document.querySelectorAll<HTMLButtonElement>('#story-button,#recipes-button,#pantry-button,#collection-button,[data-house-book]'))opener.disabled=true;
}
