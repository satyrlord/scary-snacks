// The night: the short sequence of a closing over the room and the board, and the notice that reports the night.
// The closing has already changed the game. The sequence only shows it, and a tap or a key ends it at once.
import type { NightReport } from './model.ts';
import { $, coinText, count, element, names } from './dom.ts';
import { food, ratPose, ratSprite } from './art.ts';
import { apply, changeGame, data, itemName, onReplace, state } from './session.ts';
import { onMotionReduce, still } from './preferences.ts';
import { toast } from './tickets.ts';

// The timeline: the tint comes over 400ms, the rat of the room runs for RUN_MS, and the tint goes over 400ms after both rats leave.
const TINT_MS = 400, RUN_MS = 2200, NOTICE_MS = 9000;
// The floor of each area, in percentages of the painting from its top, where the rat of the room runs.
const FLOORS: Record<string, number> = { 'front-room': 77, courtyard: 93 };
// Poses: 0 and 1 come out of the board, 2 to 5 act, 6 and 7 scurry.
const OUT = [0, 1], SCURRY = [6, 7];
let stop: ((notice: boolean) => void) | null = null;
onReplace(() => stop?.(false));
onMotionReduce(() => stop?.(true));

/** The words of the night: the upkeep, then what the rat did, then the purse or the debt. */
function nightText(report: NightReport) {
  const dishes = (placed: { item: string }[]) => {
    const counted = new Map<string, number>();
    for (const { item } of placed) counted.set(itemName(item), (counted.get(itemName(item)) ?? 0) + 1);
    return names.format([...counted].map(([name, number]) => number > 1 ? `${count.format(number)} ${name}` : name));
  };
  const lines = [`Day ${report.day} is over. The upkeep took ${coinText(report.upkeep)}.`];
  if (report.rat === 'thief') {
    if (report.trapped) lines.push(`${report.taken.length ? `The thief rat took ${dishes(report.taken)}, and it dropped` : 'The thief rat dropped'} the ${itemName(report.trapped.item)} into a new rat hole.`);
    else lines.push(`The thief rat took ${dishes(report.taken)}. Three rat holes are open, so it made no new one.`);
  } else if (report.gift) {
    const name = itemName(report.gift.item);
    lines.push(`Șoricescu lifted his hat and left ${name} as a gift.${report.gift.first ? ` ${name} is a new dish! It is in the recipe book now.` : ''}`);
  } else lines.push(`Șoricescu found no room for his gift. He needs ${count.format(data.day.giftSpace)} free spaces.`);
  lines.push(report.purse < 0 ? `Mara writes the debt pe caiet: the shop notebook holds a debt of ${coinText(-report.purse)}.` : `The purse holds ${coinText(report.purse)}.`);
  return lines.join(' ');
}
/** The notice reports the night and marks it as seen. */
export function nightNotice() {
  const report = state.night;
  if (!report || report.seen) return;
  toast(nightText(report), undefined, NOTICE_MS);
  void changeGame(() => { apply({ type: 'seeNight' }); });
}

/** The cell of the board on the screen. */
const cellBox = (index: number) => $(`[data-cell="${index}"]`).getBoundingClientRect();
/** A rat on the board: a holder that moves, a flip that turns it, and the sprite that shows the pose and bounces. */
function boardRat(rat: NightReport['rat'], layer: HTMLElement, at: number) {
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
/** A dish that the closing took from the board, still drawn in its cell until the rat takes it. */
function ghost(layer: HTMLElement, item: string, index: number) {
  const box = cellBox(index), value = food(item, 'night-ghost'), inset = box.width * .15;
  Object.assign(value.style, { left: `${box.left + inset}px`, top: `${box.top + inset}px`, width: `${box.width - 2 * inset}px`, height: `${box.height - 2 * inset}px` });
  layer.append(value); return value;
}

/**
 * Plays the night of the latest closing, then shows its notice. The room dims and a rat runs across its floor; on the board, the
 * thief rat takes its picks and leaves its rat hole, or Șoricescu puts down his gift. With reduced motion or a hidden page, the
 * notice shows at once. A tap or a key ends the sequence at once, and that input does nothing else.
 */
export async function playNight() {
  const report = state.night;
  if (!report) return;
  stop?.(false);
  if (still() || document.hidden) { nightNotice(); return; }
  const frame = $('#room-frame'), layer = element('div', 'night-layer'), timers = new Set<ReturnType<typeof setTimeout>>();
  layer.setAttribute('aria-hidden', 'true');
  let running = true;
  const cells = (name: string) => document.querySelectorAll<HTMLElement>(`.cell.${name}`);
  const finish = (notice: boolean) => {
    if (!running) return;
    running = false; stop = null;
    for (const timer of timers) clearTimeout(timer);
    for (const animation of layer.getAnimations({ subtree: true })) animation.cancel();
    const roomRat = frame.querySelector('.room-rat');
    for (const animation of roomRat?.getAnimations() ?? []) animation.cancel();
    layer.remove(); roomRat?.remove(); frame.classList.remove('night');
    for (const cell of cells('night-hidden')) cell.classList.remove('night-hidden');
    window.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange', hidden);
    if (notice) nightNotice();
  };
  stop = finish;
  const pause = (ms: number) => new Promise<void>(resolve => { const timer = setTimeout(() => { timers.delete(timer); resolve(); }, ms); timers.add(timer); });
  // The input that ends the sequence does nothing else: the layer takes the pointer until its click ends, and the key does not reach the page.
  const key = (event: KeyboardEvent) => { event.preventDefault(); event.stopImmediatePropagation(); finish(true); swallowKey(event.code); };
  const hidden = () => { if (document.hidden) finish(true); };
  layer.addEventListener('pointerdown', event => { event.preventDefault(); finish(true); document.body.append(layer); layer.replaceChildren(); release(layer); });
  window.addEventListener('keydown', key, true); document.addEventListener('visibilitychange', hidden);
  document.body.append(layer);
  // The changed cells show the board before the night until their moment comes.
  const changed = [...(report.trapped ? [report.trapped.position] : []), ...(report.gift ? [report.gift.position] : [])];
  for (const index of changed) $(`[data-cell="${index}"]`).classList.add('night-hidden');
  if (report.trapped) ghost(layer, report.trapped.item, report.trapped.position);
  const taken = new Map(report.taken.map(({ item, position }) => [position, ghost(layer, item, position)]));

  frame.classList.add('night');
  const room = roomRun(frame, report.rat);
  const board = report.rat === 'thief' ? thief(report, layer, taken, pause, () => running) : soricescu(report, layer, pause, () => running);
  await Promise.all([room, board, pause(TINT_MS + RUN_MS)]);
  if (!running) return;
  frame.classList.remove('night');
  await pause(TINT_MS);
  finish(true);
}
/** After a tap ends the sequence, the empty layer stays until the click of that tap is over, so the click reaches no control. */
function release(layer: HTMLElement) {
  const done = () => layer.remove();
  layer.addEventListener('click', done, { once: true });
  setTimeout(done, 600);
}
function swallowKey(code: string) {
  const done = () => {
    window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); window.removeEventListener('blur', done);
  };
  const down = (event: KeyboardEvent) => { if (event.code === code) { event.preventDefault(); event.stopImmediatePropagation(); } };
  const up = (event: KeyboardEvent) => { if (event.code === code) { down(event); done(); } };
  window.addEventListener('keydown', down, true); window.addEventListener('keyup', up, true); window.addEventListener('blur', done);
}
/** The rat of the night runs across the floor of the area that the room shows. A painting that did not load shows no rat. */
function roomRun(frame: HTMLElement, rat: NightReport['rat']) {
  if ($('#room-stage').hasAttribute('data-failed')) return Promise.resolve();
  const runner = ratSprite(rat, 'room-rat scurrying'), floor = FLOORS[frame.dataset.area ?? ''] ?? 90;
  runner.style.top = `${floor}%`; frame.append(runner);
  let step = 0; ratPose(runner, SCURRY[0]);
  const timer = setInterval(() => ratPose(runner, SCURRY[++step % 2]), 100);
  return runner.animate([{ left: '-12%' }, { left: '106%' }], { duration: RUN_MS, delay: TINT_MS, easing: 'linear', fill: 'both' })
    .finished.catch(() => {}).finally(() => { clearInterval(timer); runner.remove(); });
}
/** The thief rat breaks up through the board at its first pick, looks around, takes each pick, and leaves by the nearest side. */
async function thief(report: NightReport, layer: HTMLElement, taken: Map<number, SVGSVGElement>, pause: (ms: number) => Promise<void>, running: () => boolean) {
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
    layer.querySelector('.night-ghost')?.remove();
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
