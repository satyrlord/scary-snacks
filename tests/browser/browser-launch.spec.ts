import { chromium, test, expect } from '@playwright/test';

test('the browser launch preserves default disabled features and adds the Windows TCP workaround', async ({ launchOptions }) => {
  async function features(configured: boolean) {
    const options = configured ? launchOptions : {};
    // CDP needs this flag to report the actual launch arguments. Both launches use it.
    const browser = await chromium.launch({ ...options, headless: true, args: [...(options.args ?? []), '--enable-automation'] });
    try {
      const session = await browser.newBrowserCDPSession();
      const command = await session.send('Browser.getBrowserCommandLine');
      // Chromium uses the last occurrence when a switch occurs more than once.
      const value = command.arguments.filter(argument => argument.startsWith('--disable-features=')).at(-1);
      expect(value).toBeDefined();
      return value!.slice('--disable-features='.length).split(',').sort();
    } finally { await browser.close(); }
  }
  const defaults = await features(false);
  if (process.platform === 'win32') expect(defaults, 'Remove the workaround if Playwright supplies it.').not.toContain('TcpPortRandomizationWin');
  else expect(launchOptions.args ?? []).toEqual([]);
  const expected = process.platform === 'win32' ? [...defaults, 'TcpPortRandomizationWin'].sort() : defaults;
  expect(await features(true)).toEqual(expected);
});
