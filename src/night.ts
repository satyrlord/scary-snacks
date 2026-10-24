// The night: the closing dialog, the short sequence of a closing over the room and the board, and the morning dialog that reports the night.
// The closing has already changed the game. The sequence only shows it. The player watches it or skips it, and a watched night plays to its end.
import { dateText, levers } from './model.ts';
import type { NightReport } from './model.ts';
import { $, button, coinText, count, element, names } from './dom.ts';
import { food, ratPose, ratSprite } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { apply, changeGame, data, itemName, onReplace, state } from './session.ts';
import { drawerLayout, onMotionReduce, still } from './preferences.ts';
import { drawerCanMove, setLowered, showInPage } from './room.ts';
import { newDishLine } from './engine.ts';

// The timeline: the tint comes over 400ms, the rat of the room runs for RUN_MS, the rats on the board act, and the tint goes over 400ms.
// On a phone with a movable drawer, the drawer lowers over DRAWER_MS for the rat of the room and rises again for the rats on the board.
// A scrolling phone page pans the room to its floor and scrolls to the room, then scrolls to the board.
const TINT_MS = 400, RUN_MS = 2200, DRAWER_MS = 600;
// The floor of each area, in percentages of the painting from its top, where the rat of the room runs.
const FLOORS: Record<string, number> = { 'front-room': 77, courtyard: 93 };
const floorOf = (frame: HTMLElement) => FLOORS[frame.dataset.area ?? ''] ?? 90;
// Poses: 0 and 1 come out of the board, 2 to 5 act, 6 and 7 scurry.
const OUT = [0, 1], SCURRY = [6, 7];
let stop: ((morningNext: boolean) => void) | null = null;
let closeMorning: (() => void) | null = null;
function clearMorning() {
  if (closeMorning) modal.removeEventListener('close', closeMorning);
  closeMorning = null;
}
onReplace(() => { clearMorning(); stop?.(false); });
onMotionReduce(() => stop?.(true));

/** The words of the morning: the upkeep, then what the rat did, then the seasonal sources that left, then the purse or the debt. */
function nightText(report: NightReport) {
  const dishes = (placed: { item: string }[]) => {
    const counted = new Map<string, number>();
    for (const { item } of placed) counted.set(itemName(item), (counted.get(itemName(item)) ?? 0) + 1);
    return names.format([...counted].map(([name, number]) => number > 1 ? `${count.format(number)} ${name}` : name));
  };
  const lines = [`The upkeep took ${coinText(report.upkeep)}.`], dayLevers = levers(report.day, data);
  if (report.rat === 'thief') {
    if (report.trapped) lines.push(`${report.taken.length ? `The thief rat took ${dishes(report.taken)}, and it dropped` : 'The thief rat dropped'} the ${itemName(report.trapped.item)} into a new rat hole.`);
    else lines.push(`The thief rat took ${dishes(report.taken)}. All ${count.format(dayLevers.ratHoles)} rat holes are open, so it made no new one.`);
  } else if (report.piper && !report.rat) {
    lines.push('The piper’s tune still plays in the cellar. No rat came.');
  } else if (report.gift) {
    const name = itemName(report.gift.item);
    lines.push(`Șoricescu lifted his hat and left ${name} as a gift.${report.gift.first ? ` ${newDishLine(name)}` : ''}`);
  } else lines.push(`Șoricescu found no room for his gift. He needs ${count.format(dayLevers.giftSpace)} free spaces.`);
  for (const chain of report.departed) lines.push(data.chains.find(value => value.id === chain)!.season!.departure);
  lines.push(report.purse < 0 ? `Mara writes the debt pe caiet: the shop notebook holds a debt of ${coinText(-report.purse)}.` : `The purse holds ${coinText(report.purse)}.`);
  return lines.join(' ');
}
/** The morning dialog reports the night. Closing it in any way marks the report as seen. */
export function morning() {
  const report = state.night;
  if (!report || report.seen) return;
  clearMorning();
  const content = element('div'), body = element('div', 'night-morning');
  if (report.rat) {
    const picture = ratSprite(report.rat, 'morning-rat');
    ratPose(picture, 5); body.append(picture);
  }
  body.append(element('p', 'modal-copy', nightText(report)));
  const done = button('Open the bistro', 'primary-button', () => modal.close()), controls = element('div', 'story-controls');
  controls.append(done); content.append(body, controls);
  closeMorning = () => {
    // The closing dialog can queue its close event before a hidden page opens this morning dialog.
    if (modal.open) return;
    clearMorning();
    if (state.night === report && !report.seen) void changeGame(() => { apply({ type: 'seeNight' }); });
  };
  modal.addEventListener('close', closeMorning);
  showModal(`Good morning, ${dateText(report.day + 1, data)}`, content, done);
}

/** The cell of the board on the screen. */
const cellBox = (index: number) => $(`[data-cell="${index}"]`).getBoundingClientRect();
/** A rat on the board: a holder that moves, a flip that turns it, and the sprite that shows the pose and bounces. */
function boardRat(rat: 'thief' | 'soricescu', layer: HTMLElement, at: number) {
  const holder = element('div', 'night-rat'), flip = element('div', 'night-flip'), sprite = ratSprite(rat, 'night-pose');
  flip.append(sprite); holder.append(flip); layer.append(holder);
  const box = cellBox(at);
  Object.assign(holder.style, { width: `${box.width}px`, height: `${box.height}px` });
  let x = box.left, y = box.top, timer: ReturnType<typeof setInterval> | undefined;
  holder.style.transform = `translate(${x}px, ${y}px)`;
  return {
    pose(pose: number) { clearInterval(timer); sprite.classList.remove('scurrying'); ratPose(sprite, pose); },
    face(left: boolean) { flip.style.transform = left ? 'scaleX(-1)' : ''; },
    land() { sprite.animate([{ transform: 'scale(1.08, .85)' }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.3,1.6,.5,1)' }); },
    /** Scurries to a point on the screen: the two scurry poses take turns, and the sprite bounces. */
    run(toX: number, toY: number, duration: number) {
      this.face(toX < x);
      let step = 0; ratPose(sprite, SCURRY[0]); sprite.classList.add('scurrying');
      timer = setInterval(() => ratPose(sprite, SCURRY[++step % 2]), 90);
      const motion = holder.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${toX}px, ${toY}px)` }], { duration, easing: 'ease-in-out', fill: 'forwards' });
      x = toX; y = toY;
      return motion.finished.catch(() => {}).then(() => this.pose(SCURRY[0]));
    },
    to(index: number, duration: number) { const target = cellBox(index); return this.run(target.left, target.top, duration); },
    box: () => holder.getBoundingClientRect(),
  };
}
/** A dish that the closing took from the board, still drawn in its cell until the rat takes it. It moves with the board. */
function ghost(item: string, index: number) {
  const value = food(item, 'night-ghost');
  $(`[data-cell="${index}"]`).append(value); return value;
}

/**
 * Opens the closing dialog of the latest closing. Until the player chooses, the board shows how it was before the night. Watch the
 * night plays the whole night: the room dims and a rat runs across its floor; then, on the board, the thief rat takes its picks and
 * leaves its rat hole, or Șoricescu puts down his gift. No input ends a watched night. Skip, and the end of the night, open the morning
 * dialog. With reduced motion or a hidden page, the morning dialog opens at once.
 */
export function playNight() {
  const report = state.night;
  if (!report?.rat || report.seen) return;
  const rat = report.rat;
  stop?.(false);
  if (still() || document.hidden) { morning(); return; }
  const frame = $('#room-frame'), layer = element('div', 'night-layer'), timers = new Set<ReturnType<typeof setTimeout>>();
  layer.setAttribute('aria-hidden', 'true');
  let running = true, asking = true, dropped = false, focusY: string | null = null;
  const cells = (name: string) => document.querySelectorAll<HTMLElement>(`.cell.${name}`);
  const finish = (morningNext: boolean) => {
    if (!running) return;
    running = false; stop = null;
    for (const timer of timers) clearTimeout(timer);
    for (const animation of layer.getAnimations({ subtree: true })) animation.cancel();
    const roomRat = frame.querySelector('.room-rat');
    for (const animation of roomRat?.getAnimations() ?? []) animation.cancel();
    layer.remove(); roomRat?.remove(); frame.classList.remove('night');
    for (const value of document.querySelectorAll('.cell .night-ghost')) value.remove();
    for (const cell of cells('night-hidden')) cell.classList.remove('night-hidden');
    if (dropped) setLowered(false);
    if (focusY !== null) frame.style.setProperty('--fy', focusY);
    window.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange', hidden);
    if (morningNext) morning();
    else if (asking && modal.open) modal.close();
  };
  stop = finish;
  const pause = (ms: number) => new Promise<void>(resolve => { const timer = setTimeout(() => { timers.delete(timer); resolve(); }, ms); timers.add(timer); });
  // During a watched night, the layer takes every tap and no key reaches the page.
  const key = (event: KeyboardEvent) => { event.preventDefault(); event.stopImmediatePropagation(); };
  const hidden = () => { if (document.hidden) finish(true); };
  document.addEventListener('visibilitychange', hidden);
  document.body.append(layer);
  // The changed cells show the board before the night until their moment comes.
  const changed = [...(report.trapped ? [report.trapped.position] : []), ...(report.gift ? [report.gift.position] : [])];
  for (const index of changed) $(`[data-cell="${index}"]`).classList.add('night-hidden');
  const trapped = report.trapped && ghost(report.trapped.item, report.trapped.position);
  const taken = new Map(report.taken.map(({ item, position }) => [position, ghost(item, position)]));

  const watch = async () => {
    asking = false; modal.close();
    window.addEventListener('keydown', key, true);
    frame.classList.add('night');
    dropped = drawerCanMove(); if (dropped) setLowered(true);
    else if (drawerLayout.matches) { focusY = frame.style.getPropertyValue('--fy'); frame.style.setProperty('--fy', String(floorOf(frame) / 100)); }
    await Promise.all([pause(dropped ? DRAWER_MS : TINT_MS), showInPage($('#room-stage'))]); if (!running) return;
    await roomRun(frame, rat); if (!running) return;
    if (dropped) { setLowered(false); dropped = false; await pause(DRAWER_MS); if (!running) return; }
    else if (focusY !== null) { frame.style.setProperty('--fy', focusY); focusY = null; await showInPage($('#board')); if (!running) return; }
    await (rat === 'thief' ? thief(report, layer, taken, trapped, pause, () => running) : soricescu(report, layer, pause, () => running));
    if (!running) return;
    frame.classList.remove('night');
    await pause(TINT_MS);
    finish(true);
  };
  const content = element('div'), controls = element('div', 'story-controls');
  const play = button('Watch the night', 'primary-button', watch);
  controls.append(button('Skip', 'secondary-button', () => { asking = false; finish(true); }), play);
  content.append(element('p', 'modal-copy', `${dateText(report.day, data)} is over. Mara blows out the lamps and locks the door. Something small stirs under the floorboards.`), controls);
  showModal('Closing time', content, play, watch);
}
/** The rat of the night runs across the floor of the area that the room shows. A painting that did not load shows no rat. */
function roomRun(frame: HTMLElement, rat: 'thief' | 'soricescu') {
  if ($('#room-stage').hasAttribute('data-failed')) return Promise.resolve();
  const runner = ratSprite(rat, 'room-rat scurrying'), floor = floorOf(frame);
  runner.style.top = `${floor}%`; frame.append(runner);
  let step = 0; ratPose(runner, SCURRY[0]);
  const timer = setInterval(() => ratPose(runner, SCURRY[++step % 2]), 100);
  return runner.animate([{ left: '-12%' }, { left: '106%' }], { duration: RUN_MS, easing: 'linear', fill: 'both' })
    .finished.catch(() => {}).finally(() => { clearInterval(timer); runner.remove(); });
}
/** The thief rat breaks up through the board at its first pick, looks around, takes each pick, and leaves by the nearest side. */
async function thief(report: NightReport, layer: HTMLElement, taken: Map<number, SVGSVGElement>, trapped: SVGSVGElement | null, pause: (ms: number) => Promise<void>, running: () => boolean) {
  const first = report.trapped?.position ?? report.taken[0].position, rat = boardRat('thief', layer, first);
  rat.pose(OUT[0]); rat.land(); await pause(260); if (!running()) return;
  rat.pose(OUT[1]); await pause(260); if (!running()) return;
  rat.pose(2); await pause(360); if (!running()) return;
  for (const { position } of report.taken) {
    if (position !== first || report.trapped) { await rat.to(position, 300); if (!running()) return; }
    rat.pose(3);
    taken.get(position)?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.4)' }], { duration: 220, fill: 'forwards' });
    await pause(240); if (!running()) return;
  }
  if (report.trapped) {
    // The rat drags its first pick back into the hole, and the hole stays.
    await rat.to(report.trapped.position, 300); if (!running()) return;
    rat.pose(4); await pause(260); if (!running()) return;
    trapped?.remove();
    const cell = $(`[data-cell="${report.trapped.position}"]`);
    cell.classList.remove('night-hidden'); cell.animate([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }
  rat.pose(5); await pause(280); if (!running()) return;
  await leave(rat);
}
/** Șoricescu climbs out of the board, puts down his gift, lifts his hat, and leaves. Without room for a gift, he looks around and leaves. */
async function soricescu(report: NightReport, layer: HTMLElement, pause: (ms: number) => Promise<void>, running: () => boolean) {
  const { columns, rows } = data.board, at = report.gift?.position ?? (rows - 1) * columns, rat = boardRat('soricescu', layer, at);
  rat.pose(OUT[0]); rat.land(); await pause(280); if (!running()) return;
  rat.pose(OUT[1]); await pause(300); if (!running()) return;
  if (!report.gift) {
    rat.face(true); await pause(300); if (!running()) return;
    rat.face(false); await pause(300); if (!running()) return;
    rat.pose(OUT[0]); await pause(260);
    return;
  }
  rat.pose(2); await pause(360); if (!running()) return;
  rat.pose(3); await pause(200); if (!running()) return;
  const cell = $(`[data-cell="${at}"]`);
  cell.classList.remove('night-hidden'); cell.querySelector('.food')?.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' });
  await pause(260); if (!running()) return;
  rat.pose(4); await pause(460); if (!running()) return;
  rat.pose(5); await pause(400); if (!running()) return;
  await leave(rat);
}
/** The rat scurries off the nearest side of the board. */
function leave(rat: ReturnType<typeof boardRat>) {
  const board = $('#board').getBoundingClientRect(), box = rat.box();
  const left = box.left + box.width / 2 < board.left + board.width / 2;
  return rat.run(left ? board.left - box.width * 1.2 : board.right + box.width * .2, box.top, 380);
}
