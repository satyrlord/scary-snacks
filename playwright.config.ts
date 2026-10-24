import { defineConfig } from '@playwright/test';
// A custom --disable-features replaces Playwright's list. Keep its 1.64.0 defaults.
// The browser-launch test checks this list against the installed browser launch.
const disabledFeatures = [
  'AvoidUnnecessaryBeforeUnloadCheckSync', 'DestroyProfileOnBrowserClose', 'DialMediaRouteProvider',
  'GlobalMediaControls', 'HttpsUpgrades', 'LensOverlay', 'MediaRouter', 'PaintHolding',
  'ThirdPartyStoragePartitioning', 'BlockOriginHeaderModificationOnRedirect', 'Translate',
  'AutoDeElevate', 'OptimizationHints', 'NetworkTimeServiceQuerying', 'AimEnabled',
  'msForceBrowserSignIn', 'msEdgeUpdateLaunchServicesPreferredVersion',
  // Temporary Windows socket workaround: https://github.com/microsoft/playwright/issues/43545
  'TcpPortRandomizationWin',
];
export default defineConfig({
  // Each test has its own browser context and save, so tests run in parallel. More workers slow the game start past the expect timeout
  // and leave no processor time for other local tools.
  testDir:'./tests/browser', fullyParallel:true, workers:'25%', timeout:30000,
  use:{viewport:{width:1440,height:1000},trace:'retain-on-failure',
    launchOptions:process.platform==='win32'?{args:[`--disable-features=${disabledFeatures.join(',')}`]}:undefined},
  webServer:[
    {command:'node tools/server.ts --dist',url:'http://127.0.0.1:4181',env:{PORT:'4181',BASE_PATH:'/'},reuseExistingServer:false},
    {command:'node tools/server.ts --dist',url:'http://127.0.0.1:4182/scary-snacks/',env:{PORT:'4182',BASE_PATH:'/scary-snacks/'},reuseExistingServer:false},
  ],
  projects:[
    // The full suite runs under the GitHub Pages path; the root only needs the asset and path check.
    {name:'chromium-root',grep:/only approved assets load/,use:{browserName:'chromium',baseURL:'http://127.0.0.1:4181/'}},
    {name:'chromium-pages',use:{browserName:'chromium',baseURL:'http://127.0.0.1:4182/scary-snacks/'}},
  ],
});
