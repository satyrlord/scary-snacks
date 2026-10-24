import { test, expect } from '@playwright/test';
import { actOne, data, options, saved, source, start } from './support.ts';

test.use({ hasTouch:true });

for (const input of ['touch', 'keyboard']) test(`Options arranges sources with ${input} without taking ingredients or moving the clock`, async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.emulateMedia({ reducedMotion:'reduce' });
  await start(page, actOne());
  const before = await saved(page);
  await options(page);
  const dialog = page.getByRole('dialog', { name:'Options', exact:true });
  const sourceChoice = dialog.getByLabel('Source', { exact:true }), position = dialog.getByLabel('Position', { exact:true });
  const move = dialog.getByRole('button', { name:'Move source', exact:true });
  if (input === 'touch') {
    await sourceChoice.selectOption('pickles'); await position.selectOption('0'); await move.tap();
  } else {
    await sourceChoice.focus(); await page.keyboard.press('End');
    await page.keyboard.press('Tab'); await expect(position).toBeFocused(); await page.keyboard.press('Home');
    await page.keyboard.press('Tab'); await expect(move).toBeFocused(); await page.keyboard.press('Enter');
  }
  await expect(dialog.locator('.source-order-result')).toHaveText('Pickle barrel: place 1 of 4.');
  await expect(dialog).toBeVisible();
  if (input === 'keyboard') await expect(move).toBeFocused();
  const after = await saved(page);
  expect(after.sources).toEqual(['pickles', 'grain', 'corn', 'herbs']);
  expect({ ...after, sources:before.sources }).toEqual(before);
  await page.keyboard.press('Escape'); await page.reload();
  await expect(page.locator('#sources [data-source]').first()).toHaveAttribute('data-source', 'pickles');
});

for (const release of ['destination', 'original']) test(`Escape cancels a source drag released on its ${release} card and the next take works`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await start(page, actOne());
  const before = await saved(page), windmill = source(page, 'grain'), target = source(page, 'pickles');
  await windmill.focus();
  const from = (await windmill.boundingBox())!, to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps:8 });
  await expect(page.locator('.drag-ghost')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
  await expect(page.locator('#sources .lifted,#sources .drop-target')).toHaveCount(0);
  if (release === 'original') await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2, { steps:8 });
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  await windmill.click();
  const after = await saved(page);
  expect(after.coins).toBe(before.coins - data.economy.takeCost);
  expect(after.board.filter(cell => cell?.code === 'grain_1')).toHaveLength(before.board.filter(cell => cell?.code === 'grain_1').length + 1);
  expect(after.sources).toEqual(before.sources);
});
