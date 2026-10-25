import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { boardObstacles } from '../../src/model.ts';
import { actOne, checkpoint, data, know, payAndRead, prologueAt, revealed, saved, source, start, startStill, supply, tile } from './support.ts';

test.use({ hasTouch:true });

/** Includes the seasonal sources, as a player can retain them after their arrival. In act 3, every chain is open. */
function fullRibbon() {
  const state = checkpoint(52, { coins:100 });
  state.sources = data.chains.map(chain => chain.id);
  state.discovered = [...new Set([...state.discovered, ...state.sources.map(chain => `generator_${chain}`)])];
  return state;
}
const scroll = (page: Page) => page.locator('#sources').evaluate(element => element.scrollLeft);
async function watchScrollEnd(page: Page) {
  await page.locator('#sources').evaluate(element => {
    element.removeAttribute('data-scroll-ended');
    element.addEventListener('scrollend', () => element.setAttribute('data-scroll-ended', 'true'), { once:true });
  });
}
async function insideRibbon(page: Page, card: Locator) {
  const strip = (await page.locator('#sources').boundingBox())!, box = (await card.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(strip.x - 1);
  expect(box.x + box.width).toBeLessThanOrEqual(strip.x + strip.width + 1);
}

test('ribbon arrows reach every source, stop at both ends, and retain position after a take and redraw', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  const initial = fullRibbon(); await startStill(page, initial);
  const previous = page.getByRole('button', { name:'Previous ingredients', exact:true });
  const next = page.getByRole('button', { name:'Next ingredients', exact:true });
  await expect(page.locator('#sources .source')).toHaveCount(data.chains.length);
  await expect(previous).toBeDisabled(); await expect(next).toBeEnabled();
  const seen = new Set<string>();
  for (let step = 0; step <= data.chains.length; step++) {
    for (const chain of await page.locator('#sources').evaluate(element => {
      const strip = element.getBoundingClientRect();
      return [...element.querySelectorAll<HTMLElement>('[data-source]')].filter(card => {
        const box = card.getBoundingClientRect(); return box.left >= strip.left - 1 && box.right <= strip.right + 1;
      }).map(card => card.dataset.source!);
    })) seen.add(chain);
    if (await next.isDisabled()) break;
    const before = await scroll(page); await next.tap();
    await expect.poll(() => scroll(page)).toBeGreaterThan(before);
  }
  expect([...seen].sort()).toEqual([...initial.sources].sort());
  await expect(next).toBeDisabled(); await expect(previous).toBeEnabled();
  const lastChain = initial.sources.at(-1)!, card = source(page, lastChain), offset = await scroll(page);
  await insideRibbon(page, card);
  const before = await saved(page), output = data.items[`generator_${lastChain}`].generator!.outputs[0];
  await card.tap();
  const after = await saved(page);
  expect(after.board.filter(cell => cell?.code === output)).toHaveLength(before.board.filter(cell => cell?.code === output).length + 1);
  expect(after.sources).toEqual(before.sources);
  expect(await scroll(page)).toBeCloseTo(offset, 0);
  await tile(page, 20).click();
  expect(await scroll(page)).toBeCloseTo(offset, 0);
  await expect(next).toBeDisabled();
  for (let step = 0; step <= data.chains.length && await previous.isEnabled(); step++) {
    const before = await scroll(page); await previous.tap();
    await expect.poll(() => scroll(page)).toBeLessThan(before);
  }
  await expect(previous).toBeDisabled(); await expect(next).toBeEnabled();
  expect(await scroll(page)).toBe(0);
});

test('ribbon keyboard navigation reveals the focused ingredient and keeps its focus after a take', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  const initial = fullRibbon(); await startStill(page, initial);
  await source(page, initial.sources[0]).focus();
  await page.keyboard.press('End');
  const last = source(page, initial.sources.at(-1)!);
  await expect(last).toBeFocused(); await insideRibbon(page, last);
  await expect(last).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('ArrowLeft');
  const previous = source(page, initial.sources.at(-2)!);
  await expect(previous).toBeFocused(); await insideRibbon(page, previous);
  await page.keyboard.press('Home'); await expect(source(page, initial.sources[0])).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const second = source(page, initial.sources[1]);
  await expect(second).toBeFocused(); await insideRibbon(page, second);
  const before = await saved(page), output = data.items[`generator_${initial.sources[1]}`].generator!.outputs[0];
  await page.keyboard.press('Enter');
  await expect(second).toBeFocused(); await insideRibbon(page, second);
  expect((await saved(page)).board.filter(cell => cell?.code === output)).toHaveLength(before.board.filter(cell => cell?.code === output).length + 1);
  expect((await saved(page)).sources).toEqual(initial.sources);
});

test('a native touch swipe scrolls the ribbon without taking or reordering an ingredient', async ({ page, context }) => {
  await page.setViewportSize({ width:390, height:844 });
  await startStill(page, fullRibbon());
  const before = await saved(page), strip = (await page.locator('#sources').boundingBox())!;
  const cdp = await context.newCDPSession(page);
  try {
    await watchScrollEnd(page);
    const x = strip.x + strip.width - 15, y = strip.y + strip.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x, y }] });
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x:x - step * 15, y }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    // Hold the finger before release so this gesture ends without a fling.
    await page.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await expect.poll(() => scroll(page)).toBeGreaterThan(0);
    await expect(page.locator('#sources')).toHaveAttribute('data-scroll-ended', 'true');
    expect(await saved(page)).toEqual(before);
    await expect(page.locator('.drag-ghost,#sources .lifted,#sources .drop-target')).toHaveCount(0);
    const first = source(page, before.sources[0]);
    await first.scrollIntoViewIfNeeded(); await first.tap();
    await expect.poll(async () => (await saved(page)).board.filter(cell => cell?.code === 'grain_1').length)
      .toBe(before.board.filter(cell => cell?.code === 'grain_1').length + 1);
  } finally { await cdp.detach(); }
});

for (const theme of ['light', 'dark']) for (const viewport of [{ width:390, height:844 }, { width:360, height:740 }, { width:320, height:720 }, { width:360, height:701 }]) {
  test(`the board and ribbon fit the screen with usable targets in ${theme} at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await startStill(page, actOne(), theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const board = (await page.locator('#board').boundingBox())!, tray = (await page.locator('.source-tray').boundingBox())!;
    const cell = (await tile(page, 0).boundingBox())!;
    // The room strip gives way first, so cells keep 44px down to about 740px tall, and never drop below 30px.
    expect(cell.width).toBeGreaterThanOrEqual(viewport.width === 390 ? 50 : viewport.height >= 740 ? 44 : 30);
    expect(cell.height).toBeGreaterThanOrEqual(cell.width - .5);
    expect(tray.y).toBeGreaterThanOrEqual(board.y + board.height);
    for (const target of [source(page, 'grain'), page.locator('#sources-previous'), page.locator('#sources-next')]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const slot = (await page.locator('.line-slot').boundingBox())!, bar = (await page.locator('.phone-bar').boundingBox())!;
    expect(tray.y + tray.height).toBeLessThanOrEqual(slot.y);
    expect(slot.y + slot.height).toBeLessThanOrEqual(bar.y + 1);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await expect(page.locator('#drawer-handle')).toBeVisible();
    // A room strip too thin for the area switch hides it until the drawer lowers.
    const thin = await page.locator('.game-layout').evaluate(element => element.hasAttribute('data-thin-room'));
    await expect(page.locator('#area-switch')).toHaveCSS('visibility', thin ? 'hidden' : 'visible');
    if (thin) {
      await page.locator('#drawer-handle').click();
      await expect(page.locator('.game-layout')).not.toHaveAttribute('data-thin-room');
      await expect(page.locator('#area-switch')).toBeVisible();
    }
  });
}

test('on a short landscape phone a vertical swipe on the board scrolls the page, and a tap still selects', async ({ page, context }) => {
  await page.setViewportSize({ width:844, height:390 });
  await startStill(page, actOne());
  await expect(page.locator('#drawer')).toHaveCSS('position', 'static');
  await tile(page, 20).scrollIntoViewIfNeeded();
  const before = await saved(page), cell = (await tile(page, 20).boundingBox())!, top = await page.evaluate(() => scrollY);
  const cdp = await context.newCDPSession(page);
  try {
    const x = cell.x + cell.width / 2, y = cell.y + cell.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x, y:y - step * 15 }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  } finally { await cdp.detach(); }
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(top + 20);
  expect(await saved(page)).toEqual(before);
  await tile(page, 13).tap(); await expect(tile(page, 13)).toHaveAttribute('aria-pressed', 'true');
});

test('a lowered drawer and a room reveal prevent focus and input on the ingredient ribbon', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await start(page, checkpoint(0, { ready:true }));
  const handle = page.locator('#drawer-handle'), card = source(page, 'grain');
  await handle.click(); await expect(page.locator('#drawer-body')).toHaveAttribute('inert', '');
  const before = await saved(page);
  await card.focus(); await expect(card).not.toBeFocused();
  await page.locator('#sources-next').focus(); await expect(page.locator('#sources-next')).not.toBeFocused();
  expect(await saved(page)).toEqual(before);
  await handle.click(); await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await payAndRead(page); await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  await expect(page.locator('#drawer-body')).toHaveAttribute('inert', '');
  await card.focus(); await expect(card).not.toBeFocused();
  await revealed(page); await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await card.focus(); await expect(card).toBeFocused();
});

test('a guide reveals an offscreen source when a board merge changes its next step to a take', async ({ page }) => {
  await page.setViewportSize({ width:320, height:844 });
  // Four sources overflow this ribbon. No preparation has added a queued blocker batch.
  const initial = checkpoint(0, { coins:100 });
  initial.board = initial.board.map(() => null);
  // Clear the authored blockers so the guide needs a new ingredient after the pair merges.
  initial.resolvedObstacles = [...new Set([...initial.resolvedObstacles, ...boardObstacles(initial, data).map(obstacle => obstacle.id)])];
  initial.sources = [...initial.sources.filter(chain => chain !== 'grain'), 'grain'];
  know(initial, 'grain_3');
  const state = supply(initial, ['grain_1', 'grain_1']);
  const pair = state.board.flatMap((cell, index) => cell?.code === 'grain_1' ? [index] : []);
  await startStill(page, state);
  await page.locator('#recipes-button').click();
  await page.getByRole('button', { name:data.items.grain_3.name, exact:true }).click();
  await page.getByRole('button', { name:'Show me on the board', exact:true }).click();
  await expect(tile(page, pair[0])).toBeFocused();
  const strip = (await page.locator('#sources').boundingBox())!;
  const hiddenSource=(await source(page, 'grain').boundingBox())!;
  expect(hiddenSource.x+hiddenSource.width).toBeGreaterThan(strip.x+strip.width);
  const top = await page.evaluate(() => scrollY);
  await tile(page, pair[1]).click();
  expect((await saved(page)).board[pair[1]]?.code).toBe('grain_2');
  await expect(source(page, 'grain')).toHaveClass(/guide-target/);
  await insideRibbon(page, source(page, 'grain'));
  await expect(tile(page, pair[1])).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(top);
});

for (const scenario of ['prologue counter', 'late room with safe area']) test(`the phone ribbon fits the ${scenario} without scrolling`, async ({ page }) => {
  const late = scenario === 'late room with safe area';
  await page.setViewportSize(late ? { width:390, height:844 } : { width:320, height:701 });
  await startStill(page, late ? fullRibbon() : prologueAt(7, { served:true }));
  if (late) await page.evaluate(() => document.documentElement.style.setProperty('--safe', '20px'));
  const cell = (await tile(page, 0).boundingBox())!, line = (await page.locator('.line-slot').boundingBox())!, bar = (await page.locator('.phone-bar').boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(late ? 44 : 30); expect(cell.height).toBeGreaterThanOrEqual(late ? 44 : 30);
  expect(line.y + line.height).toBeLessThanOrEqual(bar.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await expect(page.locator('#drawer-handle')).toBeVisible();
  if (!late) await expect(page.locator('.prologue-wait')).toBeInViewport({ ratio:1 });
  else {
    const area = (await page.locator('#area-switch').boundingBox())!, handle = (await page.locator('#drawer-handle').boundingBox())!;
    expect(Math.min(area.x + area.width, handle.x + handle.width) > Math.max(area.x, handle.x)
      && Math.min(area.y + area.height, handle.y + handle.height) > Math.max(area.y, handle.y)).toBe(false);
  }
});

test('full-motion ribbon arrows finish scrolling and disable at each endpoint', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.emulateMedia({ reducedMotion:'no-preference' }); await start(page, fullRibbon());
  for (const direction of [1, -1]) {
    const arrow = page.locator(direction === 1 ? '#sources-next' : '#sources-previous');
    for (let step = 0; step <= data.chains.length && await arrow.isEnabled(); step++) {
      const before = await scroll(page); await watchScrollEnd(page);
      await arrow.tap();
      await expect(page.locator('#sources')).toHaveAttribute('data-scroll-ended', 'true');
      expect((await scroll(page) - before) * direction).toBeGreaterThan(0);
    }
    await expect(arrow).toBeDisabled();
    const remaining = await page.locator('#sources').evaluate((element, direction) => direction === 1
      ? element.scrollWidth - element.clientWidth - element.scrollLeft : element.scrollLeft, direction);
    expect(remaining).toBeLessThanOrEqual(1);
  }
});

test('a late-game New pin keeps its full touch target clear of the phone switch, drawer, and handle', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await startStill(page, checkpoint(40, { ready:true }));
  await payAndRead(page); await revealed(page);
  const pin = page.locator('#room-pin'); await expect(pin).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const pin = document.querySelector<HTMLElement>('#room-pin')!, box = pin.getBoundingClientRect(), extension = getComputedStyle(pin, '::before');
    const target = { left:box.left + parseFloat(extension.left), right:box.right - parseFloat(extension.right),
      top:box.top + parseFloat(extension.top), bottom:box.bottom - parseFloat(extension.bottom) };
    const room = document.querySelector('#room-stage')!.getBoundingClientRect(), drawer = document.querySelector('#drawer')!.getBoundingClientRect();
    const clear = ['#area-switch', '#drawer-handle'].every(selector => {
      const obstacle = document.querySelector(selector)!.getBoundingClientRect();
      return Math.min(target.right, obstacle.right) <= Math.max(target.left, obstacle.left)
        || Math.min(target.bottom, obstacle.bottom) <= Math.max(target.top, obstacle.top);
    });
    const points = [target.left + 1, (target.left + target.right) / 2, target.right - 1]
      .flatMap(x => [target.top + 1, (target.top + target.bottom) / 2, target.bottom - 1].map(y => ({ x, y })));
    return { height:target.bottom - target.top, inside:target.left >= room.left && target.right <= room.right
      && target.top >= room.top && target.bottom <= drawer.top, clear,
      reachable:points.every(({ x, y }) => pin.contains(document.elementFromPoint(x, y))) };
  })).toEqual({ height:44, inside:true, clear:true, reachable:true });
});

for (const scenario of [{ width:390, height:560, preparations:30, motion:'no-preference' }, { width:844, height:390, preparations:5, motion:'reduce' },
  { width:390, height:601, preparations:30, motion:'no-preference' }, { width:390, height:700, preparations:5, motion:'reduce' }] as const) {
  test(`a reveal on a scrolled page brings its change into view at ${scenario.width} by ${scenario.height} with ${scenario.motion} motion`, async ({ page }) => {
    await page.setViewportSize(scenario); await page.emulateMedia({ reducedMotion:scenario.motion });
    await start(page, checkpoint(scenario.preparations, { ready:true }));
    await expect(page.locator('#drawer')).toHaveCSS('position', 'static');
    // The player pays from the kitchen, below the room.
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('#room-stage')).not.toBeInViewport({ ratio:1 });
    await payAndRead(page); await revealed(page);
    await expect(page.locator('#room-pin')).toBeFocused();
    await expect(page.locator('#room-pin')).toBeInViewport({ ratio:1 });
    await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  });
}

test('on a thin room strip the reveal lowers the drawer to show the pin, then hides the pin and returns focus to the board', async ({ page }) => {
  await page.setViewportSize({ width:390, height:701 });
  await page.emulateMedia({ reducedMotion:'no-preference' }); await start(page, checkpoint(22, { ready:true }));
  const layout = page.locator('.game-layout'), pin = page.locator('#room-pin');
  await expect(layout).toHaveAttribute('data-thin-room', '');
  await payAndRead(page);
  await expect(pin).toBeFocused(); await expect(layout).not.toHaveAttribute('data-thin-room');
  await expect(pin).toBeInViewport({ ratio:1 });
  await revealed(page);
  await expect(layout).toHaveAttribute('data-thin-room', '');
  await expect(pin).toHaveCSS('visibility', 'hidden'); await expect(page.locator('#area-switch')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

for (const theme of ['light', 'dark']) test(`the final prologue counter keeps the full grip and board clear at the minimum fixed height in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width:320, height:701 });
  await startStill(page, prologueAt(7, { served:true }), theme);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.documentElement.style.setProperty('--safe', '20px'));
  const handle = page.locator('#drawer-handle'), head = (await page.locator('.masthead').boundingBox())!;
  const grip = (await handle.boundingBox())!, cell = (await tile(page, 0).boundingBox())!;
  const skip = (await page.locator('#skip-tutorial').boundingBox())!;
  expect(skip.y).toBeGreaterThanOrEqual(head.y);
  expect(skip.y + skip.height).toBeLessThanOrEqual(head.y + head.height);
  expect(skip.height).toBeGreaterThanOrEqual(44);
  expect(grip.y).toBeGreaterThanOrEqual(head.y + head.height);
  expect(grip.height).toBeGreaterThanOrEqual(44);
  expect(Math.min(cell.width, cell.height)).toBeGreaterThanOrEqual(30);
  expect(await handle.evaluate(element => {
    const box = element.getBoundingClientRect();
    // Sample the top, middle, and bottom away from the rounded corners.
    return [box.left + 10, box.left + box.width / 2, box.right - 10].every(x => [box.top + 1, box.top + box.height / 2, box.bottom - 1].every(y => element.contains(document.elementFromPoint(x, y))));
  })).toBe(true);
  await expect(page.locator('.prologue-wait')).toBeInViewport({ ratio:1 });
  const words = (await page.locator('#status').boundingBox())!, line = (await page.locator('.line-slot').boundingBox())!, bar = (await page.locator('.phone-bar').boundingBox())!;
  expect(words.y).toBeGreaterThanOrEqual(line.y - 1);
  expect(words.y + words.height).toBeLessThanOrEqual(bar.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await handle.click(); await expect(page.locator('.game-layout')).toHaveClass(/lowered/);
  await expect(page.locator('.prologue-wait')).toBeInViewport({ ratio:1 });
});

test('a reduced-motion reveal returns focus to the board when the pin cannot fit above the drawer', async ({ page }) => {
  await page.setViewportSize({ width:390, height:701 });
  await startStill(page, checkpoint(22, { ready:true }));
  await payAndRead(page); await revealed(page);
  await expect(page.locator('#room-pin')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();
});
