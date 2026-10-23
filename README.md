# Scary Snacks

Scary Snacks is a merge game in a Transylvanian bistro that needs repairs.
Merge ingredients into local dishes.
Deliver the dishes to your neighbours.
Repair the bistro through six story chapters that end with a community supper.
Miez the black cat watches from the windowsill.
The game has no timers, energy limits, or purchases.

Play it at https://satyrlord.github.io/scary-snacks/.

## Build and run

Use Node.js 24.22.1 or a newer 24.x release. Node.js 26.12.1 or newer is also supported.

```powershell
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:4178. For development, use `npm run dev`.

## Test

```powershell
npx playwright install chromium
npm run quality:full
```

You need to install the browser only once.
