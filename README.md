# Scary Snacks

A cosy, slightly eerie merge game set in a run-down Transylvanian bistro. Merge ingredients into local dishes, serve your neighbours, and fix up the bistro one repair at a time. Miez the black cat watches from the windowsill. The game has no timers, no energy, and no purchases.

Play it at https://satyrlord.github.io/scary-snacks/.

## Build and run

You need Node.js 24 or newer.

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

## More

- [PRODUCT.md](PRODUCT.md): the game rules and behavior.
- [DESIGN.md](DESIGN.md): the visual design.
- [DELIVERY.md](DELIVERY.md): hosting, assets, game data, and the source export.
- [Verification](docs/verification.md), [economy](docs/economy.md), and [release notes](docs/release-notes.md).
- `docs/specs/README.md`: the feature specs and planned work. The repository has them; the source export leaves them out.
