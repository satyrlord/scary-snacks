import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { GameState } from '../../src/model.ts';
import { KEY, data, exportText, forward, importSaveFile, opened, options, saved, start, tile , source } from './support.ts';

// These envelopes are fixed inputs from the supported release, not new saves from the current engine.
const saves: Record<string, { state: GameState }> = JSON.parse(readFileSync(new URL('../fixtures/save-v18.json', import.meta.url), 'utf8'));

for (const name of ['prologue-new', 'prologue-last-scene', 'preparations-12', 'supper-served', '2-may', '18-july', 'feast-served', 'preparations-49']) {
  test(`the built game preserves the supported ${name} save through reload, export, import, and play`, async ({ page }) => {
    const envelope = saves[name], text = JSON.stringify(envelope), before = envelope.state;
    expect(KEY).toBe('scary-snacks-save-v18');
    await start(page, text);
    expect(await saved(page)).toEqual(before);
    expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(text);
    await page.reload(); await opened(page);
    expect(await saved(page)).toEqual(before);
    expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(text);
    await options(page);
    expect(JSON.parse(await exportText(page))).toEqual(envelope);
    await importSaveFile(page, text);
    expect(await saved(page)).toEqual(before);
    await page.keyboard.press('Escape');
    if (name === 'prologue-last-scene') {
      await page.locator('.prologue-wait').getByRole('button', { name: 'Read now' }).click();
      await forward(page).click();
      const continued = await saved(page);
      expect(continued.prologue).toBeNull();
      expect(continued.coins).toBe(data.prologue.gift);
      await page.reload(); await opened(page);
      expect(await saved(page)).toEqual(continued);
    } else {
      await source(page, before.prologue ? 'beans' : 'herbs').click();
      const continued = await saved(page);
      expect(continued.board.filter(Boolean)).toHaveLength(before.board.filter(Boolean).length + 1);
      expect(continued.coins).toBe(before.coins);
      expect(continued.taskIndex).toBe(before.taskIndex);
      expect(continued.completedQuests).toEqual(before.completedQuests);
      expect(continued.act1).toEqual(before.act1);
      await page.reload(); await opened(page);
      expect(await saved(page)).toEqual(continued);
    }
  });
}
