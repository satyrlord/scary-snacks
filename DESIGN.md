---
name: Scary Snacks
description: A lamplit Transylvanian bistro with black cats, bats, and local dishes.
colors:
  blocker-red-overlay: "rgb(184 38 44 / 20%)"
  plum-brandy: "#6e3d50"
  light-on-action: "#fff6ea"
  candle-amber: "#e8b58e"
  dark-accent: "#ecc1a2"
  dark-on-action: "#2a2028"
  copper: "#835121"
  light-coin-face: "#d39a5c"
  dark-gold: "#e8bd83"
  dark-coin-rim: "#8f5f2e"
  light-page: "#eee7dc"
  light-panel: "#f8f2e8"
  light-surface: "#fffbf3"
  light-inset: "#e9dfd0"
  light-ink: "#33292a"
  light-muted: "#6d5853"
  light-line: "#d6c6b9"
  light-control-line: "#8f7a70"
  light-tile-a: "#f2e7d5"
  light-tile-b: "#e7d8c2"
  light-selected: "#9b6644"
  light-ready: "#3e6848"
  light-focus: "#276d6c"
  dark-page: "#1c1614"
  dark-panel: "#2a201e"
  dark-surface: "#33272a"
  dark-inset: "#382b29"
  dark-chosen: "#56423a"
  dark-ink: "#f5e9d8"
  dark-muted: "#cdb7a6"
  dark-line: "#544039"
  dark-control-line: "#8c7064"
  dark-tile-a: "#47362f"
  dark-tile-b: "#3b2c27"
  dark-ready: "#9ecea1"
  dark-focus: "#8fd0ca"
typography:
  display:
    fontFamily: "Grenze Gotisch, serif"
    fontWeight: 600
    fontSize: "clamp(43px, 3.2vw, 48px)"
    lineHeight: 1
    letterSpacing: "0"
  display-phone:
    fontFamily: "Grenze Gotisch, serif"
    fontWeight: 600
    fontSize: "clamp(28px, 9.4vw, 38px)"
    lineHeight: 1
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "21px"
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "19px"
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "15px"
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "24px"
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "14px"
    lineHeight: 1.7
  body-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "13px"
    lineHeight: 1.65
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "12px"
    lineHeight: 1.5
rounded:
  tile: "6px"
  control: "9px"
  card: "12px"
  panel: "14px"
  pin: "14px"
  dialog: "18px"
spacing:
  tile-gap: "4px"
  tile-gap-phone: "3px"
  ticket-gap: "12px"
  ticket-gap-phone: "6px"
  section: "14px"
  column-gap: "20px"
  gutter: "24px"
  gutter-phone: "14px"
components:
  button-primary:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    rounded: "{rounded.control}"
    padding: "11px 15px"
    height: "44px"
  button-primary-dark:
    backgroundColor: "{colors.candle-amber}"
    textColor: "{colors.dark-on-action}"
    rounded: "{rounded.control}"
    padding: "11px 15px"
    height: "44px"
  button-not-yet:
    backgroundColor: "transparent"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.control}"
    padding: "11px 15px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.light-inset}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.control}"
    padding: "11px 15px"
    height: "44px"
  button-pay:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    rounded: "{rounded.control}"
    padding: "11px 15px"
    height: "44px"
  button-offer-pay:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  button-item-action:
    backgroundColor: "{colors.light-inset}"
    textColor: "{colors.light-ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  button-options:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px 0 12px"
    height: "44px"
  room-pin:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pin}"
    padding: "4px 11px 4px 8px"
    height: "28px"
  area-switch:
    backgroundColor: "{colors.light-panel}"
    rounded: "{rounded.control}"
    padding: "3px"
  area-choice:
    backgroundColor: "transparent"
    textColor: "{colors.light-muted}"
    typography: "{typography.body-small}"
    rounded: "{rounded.tile}"
    padding: "0 12px"
    height: "44px"
  area-choice-chosen:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.tile}"
    padding: "0 12px"
    height: "44px"
  docked-panel:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    padding: "0 24px 16px"
    width: "max(50vw, 100vw - 75dvh, 620px)"
  drawer:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    rounded: "18px 18px 0 0"
    height: "calc(max(var(--cell), 44px) * 7 + 18px + var(--drawer-chrome))"
  drawer-handle:
    backgroundColor: "{colors.light-control-line}"
    rounded: "2px"
    width: "96px"
    height: "44px"
  quest-ticket:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.card}"
    padding: "8px"
  quest-ticket-phone:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.control}"
    padding: "2px 3px"
    height: "74px"
  deliver-button:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "6px"
    height: "44px"
  deliver-button-phone:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 3px"
    height: "44px"
  timber-table:
    rounded: "{rounded.panel}"
    padding: "14px"
  timber-table-phone:
    rounded: "{rounded.card}"
    padding: "6px 8px"
  table-runner:
    height: "14px"
  table-runner-phone:
    height: "8px"
  board-tile:
    backgroundColor: "{colors.light-tile-a}"
    rounded: "{rounded.tile}"
    padding: "5px"
    size: "clamp(40px, min(calc((var(--panel-w) - var(--side-w) - var(--chrome-w)) / 7.75), max(44px, calc((100dvh - 432px) / 7))), 96px)"
  board-tile-phone:
    backgroundColor: "{colors.light-tile-a}"
    rounded: "{rounded.tile}"
    padding: "3px"
    size: "clamp(34px, min(calc((min(100vw, 560px) - 42px) / 7.75), max(44px, calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7))), 60px)"
  source-place:
    backgroundColor: "{colors.light-tile-a}"
    rounded: "{rounded.tile}"
    padding: "3px"
    size: "calc((var(--cell) * 7 - var(--gap)) / 8)"
  mara-line:
    textColor: "{colors.light-ink}"
    typography: "{typography.body}"
    padding: "6px 2px"
    height: "62px"
  recipe-item:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.control}"
    padding: "8px"
  recipe-item-not-yet:
    backgroundColor: "transparent"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.control}"
    padding: "8px"
  phone-bar:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    typography: "{typography.body-small}"
    height: "56px"
  dialog:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.dialog}"
    padding: "26px"
    width: "560px"
  bottom-sheet:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    rounded: "18px 18px 0 0"
    padding: "20px"
    width: "100%"
---

# Design System: Scary Snacks

## Overview

**Design direction: "The Room and the Drawer"**

In this document, a wider screen is 1024px wide or more. A phone is a screen 1023px wide or less, and this includes tablets. An atlas is one image that holds many small pictures. If a rule uses another width limit, the text gives that width. The drawer can move only on a phone that is taller than 600px. This document calls that drawer a movable drawer. A short screen (see Layout) is a phone that is 600px tall or less. The drawer of a short screen does not move.

Scary Snacks is a warm Transylvanian bistro at dusk. The room is the main view of the game and its reward. For each area, one gouache painting shows the result of the completed preparations. The painting fills the screen behind all other parts.

The kitchen is a parchment drawer over the room. On phones, the drawer is half open. On wider screens, the drawer is one parchment panel beside the room. Each paid preparation repaints the room. A movable drawer lowers by itself. Then the new painting replaces the old painting in the same place.

The setting is a homely room with lamps. The eerie parts stay at the window: black cats on the sill and bats in the dusk. The owner sets these parts: the setting, the title, the cats, the bats, and the village dress of the neighbours. The interface looks hand-made.

Paper tickets show the quests of the neighbours. The board is on timber between two strips of cross-stitch runner. The interface has these small hand-made details:
- a copper coin with a crescent moon
- a cat on the wordmark baseline
- a copper-glow "New" pin
- dashed "not yet" outlines
- dashed covered dishes in place of undiscovered dishes

Light mode uses cream and parchment with plum and dark brown ink. Dark mode uses walnut and plum with ivory and candle amber. Dark mode is the default from the first paint. The System choice follows the device.

**Key Characteristics:**
- The room is one full-height 3:4 painting for each area.
- The kitchen is one parchment surface. It holds three paper tickets, the board on timber, and Mara's line. While the recovery quest is open, it also holds the recovery ticket. On wider screens, it also holds the story and the recipe book.
- Each preparation has its own complete painted state.
- The signature motion is the reveal. The room repaints in place, and the pin lands on the change. A movable drawer lowers first.
- Food, portraits, mascots, rooms, timber, and the runner are gouache bitmaps that this project made. Each control icon is a vector that this project drew.
- Each of the two themes has its own complete design. A theme is never an inversion of the other theme.

## Colors

The palette is warm and has low saturation. Each theme has one action colour. That colour is on every primary action. Dark mode uses warm walnut and plum neutrals. Dark mode never uses cool grey.

### Primary
- **Plum Brandy** (plum-brandy): the light-mode action and accent colour. It fills Deliver, Pay, Take, and the other primary buttons. It colours links, the chapter name, and the ring of the chosen area. It also colours the border of a hovered control. Text on Plum Brandy uses Light On-Action (light-on-action).
- **Candle Amber** (candle-amber): the dark-mode action colour. It fills primary buttons and draws the selected-cell outline. It also gives each cat a faint rim glow. Text on Candle Amber uses Dark On-Action (dark-on-action).
- **Candle Glow** (dark-accent): the dark-mode accent for links, hover tints, the chosen-area ring, and the danger outline.

### Secondary
- **Copper** (copper): the light-mode coin figures, the coin rim, and the crescent moon of the coin. Copper Coin Face (light-coin-face) fills the coin.
- **Copper glow dots** use the coin face colour. The "New" pin, the Story item, and the Recipes item each have one dot. The dots of the pin and of Recipes add a candle glow. The Story dot has only a Parchment ring.
- **Dark Gold** (dark-gold): the dark-mode coin figures and coin face. Dark Coin Rim (dark-coin-rim) colours the rim and the moon.

### Tertiary
- **Teal Focus** (light-focus / dark-focus): the focus ring and the hint pulse. No other part uses it. Teal Focus is the only cool hue in the system.
- **Ready Green** (light-ready / dark-ready): the small dot on a ticket dish when the board holds every portion of that dish. It also colours the check of a complete chain.
- **Selected Clay** (light-selected): the selected-cell outline and the tile hover in light mode. In dark mode, Candle Amber does this job.

### Neutral
- **Cream Plaster / Walnut Dusk** (light-page / dark-page): the page and the phone masthead. The browser also uses this colour as its theme colour.
- **Parchment / Lamplit Walnut** (light-panel / dark-panel): the drawer, the docked panel, the pin, and the area switch. It also fills the phone bar and the dialogs. On wider screens, the whole page background is Parchment.
- **Fresh Linen / Plum Lacquer** (light-surface / dark-surface): the paper tickets, the Options button, journal entries, and recipe items. In light mode, Fresh Linen is also the chosen fill (`--chosen`).
- **Flour Dust / Hearth Ash** (light-inset / dark-inset): secondary buttons and the track of a segmented choice. It also fills the Miez card in the Story sheet and the current step of a chain. Portraits use it as their background.
- **Warm Burl** (dark-chosen): the dark-mode chosen fill, for the checked segmented choice and the chosen area.
- **Board Tiles / Oiled Oak** (light-tile-a, light-tile-b / dark-tile-a, dark-tile-b): the two colours of the checkerboard. In dark mode, the tiles are lighter than the panels, so the board looks lit.
- **Hearth Ink / Ivory** (light-ink / dark-ink): body text, headings, the pin, and the phone bar labels.
- **Smoke** (light-muted / dark-muted): secondary text, the unchosen area names, and "not yet" labels. Its contrast is at least 4.5:1 on the page and on panels.
- **Hairline** (light-line / dark-line): ticket edges and the top edge of the phone bar. It also draws the section dividers in the docked panel. These lines are decorative.
- **Control Line** (light-control-line / dark-control-line): every interactive boundary, the drawer grip, and every dashed "not yet" outline. Its contrast is at least 3:1 against the page.

### Named Rules
**The One Accent Rule.** Each theme has exactly one action colour: Plum Brandy in light mode and Candle Amber in dark mode. Coins are copper and gold. Focus is teal. No other colour marks a part that the player can press.

**The Untouched Plate Rule.** Keep food, portraits, and timber in their original colours. Blocked board tiles have the specified 20% red overlay. Dark mode changes only the interface colours. Only the night tint of the room (see The night) darkens a painting. The night tint never covers the board, the tickets, or a portrait.

## Typography

**Display Font:** Grenze Gotisch (with serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** Grenze Gotisch is a readable Germanic blackletter font. Inter is the font for all other text. Both fonts are self-hosted variable fonts.

### Hierarchy
- **Display** (600, clamp(43px, 3.2vw, 48px), 1): only the wordmark, on wider screens. On phones, the wordmark uses the display-phone size.
- **Headline** (600, 21px, 1.3, -0.025em): section headings and dialog titles, for example "Our little bistro".
- **Title** (600, 19px, 1.4, -0.025em): the preparation name, settings sections, recipe chains, and the Appearance and Motion legends.
- **Title small** (600, 15px, 1.25): the name of the selected item under the board. The Miez card and the recipe book title also use this size, at a line height of 1.4.
- **Figure** (600, 24px, 1, tabular numerals): the coin total. On phones, the coin total is 21px.
- **Body** (400, 14px, 1.7): dialog text and control labels. Mara's line is 14px at 1.45 (13px at 1.35 on phones). Story dialogue is 16px at 1.75 (14px at 720px and below).
- **Body small** (400, 13px, 1.65): the story text, Deliver, the area names, and the ticket name (600). The offer, the item actions, and the bar labels also use this size. The ticket title uses the Label size in the accent colour.
- **Label** (400, 12px, 1.5): the chapter number, the save state, and the "N of 24 done" count. Screen readers hear "N of 24 preparations done". The rule line of the selected item, the pin, and Deliver on phones also use this size.

### Named Rules
**The Shop Sign Rule.** Grenze Gotisch occurs once on each screen, as the wordmark. Each other heading uses Inter at weight 600.

**Text sizes.** General interface text is at least 12px. Ticket count badges use 10px. The phone ticket status uses 11px. At 410px and below, while the recovery ticket is open, the status uses 10px. The "more" label of a long order uses 10px.

## Layout

The room and the kitchen share the screen. The room does not scroll.

**The room.** Each area has one painting for each state. The paintings are 3:4 and opaque. The game shows the state of the highest completed preparation in that area. A picture element gives AV1 Image File Format (AVIF) first, then WebP, at 768 by 1024 and 1536 by 2048.

The sizes attribute is `(max-width: 1023px) 100vw, max(50vw, 75vh)`. The browser downloads only the current state. While a paid story plays, the browser downloads the next painting before the reveal.

The frame puts the latest change near the middle of the visible room, a little low. The pin then has room above the change. Two numbers (`--fx`, `--fy`) give the focus point of the change. The frame never shows an area outside the edges of the painting. A change of focus takes 0.9s.

The area switch is in a lower corner of the visible room. The top of the switch is 64px above the lower edge of the visible room. The switch stays on the side opposite the change. In the front room, the switch always stays on the left, away from Miez. In the summer kitchen and the vegetable garden, the switch always stays on the right, away from Miez.

**Wider screens (1024px or more).** The room has a fixed position on the left at full height. The docked panel has the width `max(50vw, 100vw - 75dvh, 620px)` on the right. So the room is never wider than its 3:4 painting at full height, and a wide screen gives the rest to the kitchen. The panel holds these parts, from top to bottom:
- The masthead, with padding of 18px 24px 12px.
- The three tickets, in three equal columns 12px apart. While the recovery quest is open, a fourth column holds the recovery ticket.
- The drawer body: the kitchen column, then the side column, 20px apart.

The kitchen column is as wide as the source tab, an 8px gap, the board, and 28px of timber padding. It holds the timber table and Mara's line, 12px apart. The side column has a hairline on its left and 20px of padding (14px from 1024px to 1279px). It holds the story and the recipe book as sections between hairlines. The sections are 14px apart (10px from 1024px to 1365px).

At a wider-screen height of 799px or less, the masthead has 10px top and 8px bottom padding. The wordmark is 43px. Tickets have 6px padding and 4px gaps. Their portraits are 28px, and their dishes are 26px in 28px-high slots. The drawer gap is 10px, the kitchen gap is 8px, and the board has 10px vertical padding. The status strip has 4px vertical padding. These sizes keep the board and its instructions visible at 1280 by 720px.

**Phones (1023px or less).** The masthead is 48px tall on the page colour, with 14px gutters. The room fills the screen below the masthead. The painting is as wide as the screen. The drawer has a fixed position above the bar, with an 18px radius on its top corners. The content of the drawer is at most 560px wide and in the centre. The drawer holds these parts, from top to bottom:
- The grip. The grip is a 40px by 4px bar in Control Line, on a 96px by 44px target. The target extends over the room.
- The three tickets, 6px apart. While the recovery quest is open, the recovery ticket is a fourth ticket.
- The timber table with the source tab and the board.
- Mara's line, or the offer, or the selected item and its actions.

The bar is 56px tall plus the safe area. The safe area is the space that the device reserves at the screen edge. The bar holds Story, Recipes, and Options. The recipe book card and the side column do not show. Each of the three bar items opens a dialog.

**The lowered drawer.** The grip is a button. Its accessible name is "Lower the kitchen to see the room". While the drawer is lowered, its accessible name is "Raise the kitchen". The grip lowers the drawer, and the drawer then shows the whole painting. The tickets and their status lines stay visible. The height budget reserves 92px above the bar, or 108px below 360px when a ticket has four shown dishes. The final-scene counter of the prologue reserves 116px for its line and Read now, or 140px below 360px. The drawer moves over 0.6s. While the drawer is lowered, the board does not accept input.

**The height budget.** The cell size and the visible room share one budget:
- Wider screens: `--cell: clamp(40px, min(calc((var(--panel-w) - var(--side-w) - var(--chrome-w)) / 7.75), max(44px, calc((100dvh - 432px) / 7))), 96px)`, with 4px gaps. The value of `--side-w` is `clamp(220px, 30% of the panel, 300px)`, and `--chrome-w` is 128px. From 1024px to 1279px, `--side-w` is 200px, `--chrome-w` is 100px, and the panel has 16px side padding. Only the width can take a cell below 44px.
- Phones: `--cell: clamp(34px, min(calc((min(100vw, 560px) - 42px) / 7.75), max(44px, calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7))), 60px)`, with 3px gaps. On a phone narrower than 391px, the width takes the cell below 44px, so the board and the source tab fit side by side. The drawer keeps the height of 44px cells, so the room keeps its view. The value of `--drawer-chrome` is 102px plus the ticket height, normally 176px in total. Below 360px, a ticket with four shown dishes uses 192px in total. The final-scene counter of the prologue uses a 58px base height and adds 40px, or 64px below 360px. Its totals are 200px and 224px, so its wrapped line and button leave room for Mara's line. A visible action failure adds 24px for its explanation. If the cell size allows it, the room shows at least 29.5dvh above the drawer. The unit dvh is one percent of the dynamic viewport height.

**Compact phones (601px to 700px tall).** The runners are 4px tall, the board has 2px vertical padding, and the table has a 2px top margin. The value of `--drawer-chrome` uses 84px plus the ticket height and the same prologue and failure additions. This saves 18px while the board cells and controls keep their minimum sizes. At 360 by 640px, the room has 52px above the drawer for the New pin and its full touch target.

**Short screens.** On a short screen, the room, the drawer, and the bar do not have a fixed position. They follow each other in the page, and the page scrolls. The room is 240px tall. The grip does not show. A change to this layout clears the lowered drawer state, so the kitchen accepts input after rotation.

**The masthead.** The cat and the wordmark share one baseline. The wordmark, the clock, and the purse never overlap, and at least 12px separate the wordmark from the clock and the purse. The clock gives the date and the time, "Sat 15 Feb · 07:00", in 13px tabular figures. The date uses ink at weight 600, and the time uses Smoke. Screen readers hear the full date and the time from hidden text, "Saturday 15 February, 07:00". The visible short text is hidden from them.

On wider screens, the masthead is a ledger at every width: the clock is on one line above the purse, aligned right, and the coin figures share the wordmark baseline. Options stays beside both rows. The arrangement does not change with the coin total. From 1024px to 1365px, Options shows only its icon.

On phones, the clock is before the coins, and the date is above the time in 12px, aligned right. Below 360px, the clock is above the purse, with the day and the time on one line. At 410px and below, an absolute coin total of 1,000 or more also puts the clock on one line above the purse.

At 480px and below, the wordmark is 32px, and the gap between masthead controls is 8px. The coin unit word does not show. At 410px and below, the wordmark is 28px, the masthead gutters are 12px, and the masthead gap is 8px. The coin mark and the exact accessible total stay available.

A purse below zero is a debt. It shows a minus sign (−), for example "−12", with the figures in ink and the unit word "owed" in Smoke, as Mara writes a debt in her notebook. Screen readers hear "A debt of 12 coins". On phones, an absolute coin total of 10,000 or more uses the short form. On wider screens, the short form starts at 1,000,000. For example, 12,300 shows as "12.3K".

The short form follows the page language. The short form rounds down, so it never shows more coins than the player has. Screen readers always get the exact total. When the total increases, the coin mark turns once over 0.7s, and a "+N" figure rises over 0.9s.

**The skip link.** The first Tab stop is the link "Skip to the board". The link moves focus to the board.

### Named Rules
**The Open Room Rule.** On wider screens, no interface covers the room, except the pin, the area switch, and unlocked finish switches. On phones, the drawer covers only the lower part of the room. The frame keeps the latest change in the visible part.

**The One Screen Rule.** The cell size and the visible room share one height budget. If you change one of them, recompute the other. Then the tickets, the whole board, and Mara's line stay on the first screen at 1280×720, 1280×800, 1440×900, 1920×1080, and 390×844.

**The Thumb Rule.** On phones, the bar holds Story, Recipes, and Options. The masthead never holds them.

## Elevation & Depth

The system uses layers. The room is the deepest layer. The parchment is over the room. On wider screens, the panel shades its own edge on the side of the room.

The panel casts no shadow on the painting. On phones, the drawer casts a short shadow up onto the room. The tickets and the timber are on the parchment with small contact shadows. In the parchment, tonal layers and hairlines separate the parts.

A state change uses an inset outline, not more shadow.

### Shadow Vocabulary
- **Panel edge** (`box-shadow: inset 10px 6px 14px -10px #42282440`): a 24px strip on the edge of the docked panel that is near the room.
- **Drawer cast** (`box-shadow: 0 -8px 12px -6px #1a0f0a73`): the drawer on phones, cast up onto the room.
- **Resting table** (`box-shadow: 0 2px 4px #2a1a1029, <panel lift>`): the timber table on wider screens.
- **Panel lift** (`box-shadow: 0 9px 26px #42282412` in light, `#0a060433` in dark): the lift part of the resting table.
- **Ticket rest** (`box-shadow: 0 1px 2px #2a1a1029`): each paper ticket.
- **Tile lift** (`box-shadow: 0 1px 2px #2a1a1040`): every board tile. The lift stays under the hover, selected, and hint outlines.
- **Room marker lift** (`box-shadow: 0 6px 16px #1009122e`): the pin and the area switch over the painting.
- **Dialog lift** (`box-shadow: 0 24px 70px #100b173f`): dialogs and sheets, over a plum-black backdrop (`#17101ac4`).
- **Pressed choice** (`box-shadow: 0 1px 3px #2a1d2024`): the checked segmented choice and the chosen area, under a 2px inset accent ring.
- **Carried dish** (`filter: drop-shadow(0 7px 5px #17101a65)`): the dish under the pointer (74px) and each delivered dish in flight.
- **Cat glow** (`filter: drop-shadow(0 0 1px #e8b58e80) drop-shadow(0 3px 10px #e8b58e30)`): only in dark mode, on the wordmark cat and on every cat in the room.
- **Pin glow** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 3px #e8b58eb3`): the copper dot of the "New" pin.
- **Candle dot** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 2px #e8b58e99`): the new-dish dot on the Recipes item.

### Named Rules
**The Lamplight Rule.** Shadows are warm and soft. Only candle glow uses a halo with no offset. Three parts have this halo: the rim of a cat, the dot of the pin, and the new-dish dot. None of these parts moves.

## Shapes

Corners increase with the size of the surface. A nested shape has a smaller radius than the shape around it.
- **Tile** (6px): board tiles, area choices, segmented choices, and the current step of a chain.
- **Control** (9px): buttons, the area switch, the Options button, phone tickets, journal entries, recipe items, and bar items.
- **Card** (12px): tickets on wider screens and the phone timber table.
- **Panel** (14px): the timber table on wider screens.
- **Pin** (14px): the "New" pin, a capsule 28px tall. Its tail is a rotated 10px square with a 2px radius.
- **Dialog** (18px): every dialog, and the top corners of the drawer and of each bottom sheet.

Borders are 1px. Hairlines separate content. Control Line outlines the parts that the player can press. A dashed outline means "empty" or "not yet". It marks an unaffordable action, a locked area, or an undiscovered dish. A dashed panel in place of the room means that the painting did not load.

Portraits are circles. Food and mascots keep their own transparent outlines. The room clips only to rectangles: the six repaired window panes, its two upper panes for the night sky, and each decoration region. A bat flies behind the glass and its wooden frames. The night sky shows behind the upper panes.

## Components

### Buttons
Buttons are solid and warm. Button targets are at least 44px tall, except for the board and source tiles. Those tiles use the sizes in "Layout" and "Board and tiles".
- **Shape:** slightly rounded (9px).
- **Primary:** in light mode, the fill is Plum Brandy with Light On-Action text. In dark mode, the fill is Candle Amber with Dark On-Action text. The weight is 600, and the padding is 11px × 15px. A pointer that can hover makes an enabled button 7% brighter. A touch screen has no hover brightness. A press moves the button down 1px.
- **Not yet:** an action that the player cannot afford has a transparent fill. The border is a dashed Control Line, and the text is Smoke. The button never has a dimmed colour.
- **Unavailable:** if the kitchen cannot open, three parts have 50% opacity and do not accept input. These parts are the Options button, the recipe book, and the bar items. The game dims no other button.
- **Secondary:** the fill is Flour Dust, the text is ink, and the border is a 1px Control Line. Hover makes it brighter, as for Primary.
- **Danger:** a transparent fill with an accent outline and accent text. Only the reset actions use this style. A confirmation always follows.
- **Pay:** Story shows only the unmet requirements. They can be extra coins to earn, quests to deliver, or an opening date. A met requirement has no row. When the player meets all requirements, one line says "Ready to prepare." Pay stays disabled with the dashed not-yet style until the player meets every requirement.

  The button reads "Pay · N" with the 16px coin mark. Its accessible name is "Pay N coins: [preparation]". Its description includes the visible requirement note and the exact coin and quest totals. Cost details also shows those totals. Pay and the Cost details text button share one 44px row with a 10px gap. Pay fills the rest of the width. From 1024px to 1279px, Pay takes its own row above Cost details.

  Cost details has the accessible name "Work and cost" and reports its expanded state. Its small chevron points down when the details are closed and up when they are open. The control opens and closes its region and keeps focus.
- **Text button:** an underlined accent link at 13px with a 44px target. Find a match, Journal, and the opening of a finale quest use this style. Read now, the reply in a delivery notice, and Try again also use this style.
- **Focus:** a 3px Teal Focus ring, with a 3px offset. Inside a tile, an area choice, the grip, or a bar item, the offset is -3px. In a segmented choice, the offset is 2px. A finish switch has its own focus outline (see Finish switches).

### The room (signature)
- **Painting:** one 3:4 state of the area. It accepts no input. A long press or a drag does not select the image.
- **Caption:** a visually hidden list gives in words what each state added. If the painting cannot load, the caption shows in a dashed Parchment panel. The panel text is "The painting of this room could not load, so here it is in words."
- **Miez:** the cat that sits on the left end of the front-room windowsill. In act 2, Miez sits on the windowsill of the summer kitchen, on the windowsill beside the garden, and on the rim of the fountain in the town square. Miez does not show in the courtyard or over a finale painting. Miez is a button (at least 44px). Miez accepts input only while his place shows above the drawer. The Story sheet also holds the Miez card.
- **Second cat:** in the finished front room (front-room-24), a second cat sleeps on the free left end of the counter. The second cat is decorative.
- **Bats:** a separate layer clips only the bat to the six glass panes measured on front-room-01 and the later repaired paintings. The central wooden bar and both horizontal bars hide the bat. The room painting and night sky are separate from this clip. The broken window has four different panes and no bat. A bat crosses from right to left over 2.6s, and its wings flap. `PRODUCT.md` gives when a bat crosses.
- **Window view:** the six glass panes of the mended front-room window show the village of the season, behind the glass, at the same dusk as the paintings: late winter, early spring, or spring. The view fills the window bounds with a cover fit and the clip of the six panes, so the painted wood stays in front. The two upper panes show the sky, and the hills, the church, and the roofs show in the four lower panes. At night, the night sky covers the two upper panes, and the tint covers the view. The broken window of front-room-00 shows no view. The view is a 3:4 picture, shipped as WebP at 576px wide.
- **Rain and snow:** the code draws them as fine marks, so they never change the colours of the paintings, the food, the portraits, or the timber. On a rain day, short slanted streaks run down the window glass of the front room, slowly, and fall over the whole courtyard, the vegetable garden, and the town square, fast. The streaks repeat in two scattered tiles of different sizes, so no horizontal band shows. On a snow day, small white flakes fall outside the window glass of the front room and over the courtyard. The flakes fall in three depths: many small, slow, faint flakes far away; fewer, larger, faster flakes near; each depth with its own gentle sway. The flakes are scattered at random, so no grid or row shows, and the fall loops with no jump. The window shows the same snow farther away, so its flakes are smaller. They stay inside the room and never cover the board, the tickets, or the food art. With reduced motion, they show as still marks. The night tint covers them.
- **Holiday decorations:** each decoration was painted into a room state and cut out by its difference from that state, so it keeps the light, the brushwork, and the shadow of the room. The game crops it from the holiday image of its area, at the full size of the paintings, as it does for a finish. The front-room decorations hang on the window latch or stand on the right end of the sill, which stay the same from front-room-01 on. The green branches hang on the upper hinge of the left gate leaf, which stays the same from courtyard-13 on. Miez sits on the left end of the sill, so no decoration touches the cat. A decoration is in front of the window view. The broken window and the supper painting show no decoration. The caption names each decoration that shows.

### The night
- **Weekday closing:** a closing without a rat shows only a temporary notice, as a delivery does: "The bistro closed for the night. Upkeep: 20 coins. Good morning, Tuesday 18 February." The notice names a seasonal source that left or came. No dialog opens, and the board takes the next action at once. After Ambrozie's dinner, the notice of 12 July starts with "Ambrozie sleeps in the courtyard."
- **Sunday of the piper's tune:** a Sunday closing without a rat after the piper's fee opens no closing dialog and no night. The morning dialog opens at once, and its report says "The piper’s tune still plays in the cellar. No rat came."
- **Closing dialog:** on Sunday night, the closing applies at once. Then the dialog "Closing time" opens with one line, "[Weekday] [day] [month] is over. Mara blows out the lamps and locks the door. Something small stirs under the floorboards." Its actions are Skip, a secondary button, and Watch the night, the primary button. Watch the night has focus. While the dialog is open, a dish that the night takes stays drawn in its cell, inset 15%. Also, a cell that the night changes shows its earlier look.
- **Order:** Watch the night closes the dialog. The tint appears over 400ms. The rat of the room runs across the floor over 2.2s. Then the rats on the board act. When the board rat leaves, the tint disappears over 400ms, and the morning dialog opens. A movable drawer lowers over 600ms before the rat of the room runs. The drawer rises over 600ms before the rats on the board act.
- **Tint:** a Night Indigo layer (`#1b2150`, multiply, 62% opacity) covers the whole room painting, its decorations, and its cats. The tint is the same in both themes. The painting and its decorations stay readable.
- **Night sky:** the night-sky painting fills the two upper panes of the front-room window, behind the glass. The night sky appears with the tint, with the same fade. The clip is a polygon of the two pane rectangles of the window in states 01 and later. The courtyard and the broken window of front-room-00 show no night sky.
- **Rat of the room:** the rat of the room uses the scurry poses of the rat of the night. The rat is 7% of the painting wide. It runs from left to right on the floor line of the area. The floor line is 77% down the front room, 93% down the courtyard, and 90% down the areas of act 2. The two poses alternate every 100ms, and the sprite bounces. The rat is above the tint. A painting that did not load shows no rat.
- **Rats on the board:** a layer over the page holds a rat at the size of one tile.

  The thief rat breaks through the board from below at its first pick and looks to each side. Then the thief rat scurries to each pick and grabs it. The dish shrinks and fades over 220ms. The rat drags its first pick into the rat hole, and the rat hole then shows in its cell. The rat looks behind it and scurries away over the nearest side of the board.

  Șoricescu comes from below the board at the gift cell and opens his traistă. He puts the gift on the cell, and the gift appears with a fade over 300ms. He lifts his hat, waves, and scurries away. Without a gift, he comes from below the board at the bottom-left cell. He looks left and right and goes below the board again.

  Two scurry poses alternate every 90ms with a small bounce. A rat that lands squashes for 220ms. The code gives the path and the motion. The poses give only the shapes.
- **No stop:** a watched night plays to its end. The layer over the page takes every tap, and no key reaches the page.
- **Morning dialog:** the dialog "Good morning, [weekday] [day] [month]" shows the rat of the night beside the report. If no rat came, the report has no rat picture. The rat is 88px square in pose 5. The report gives the upkeep, what the rat did, and the purse or the debt. The one action of the dialog is Open the bistro, the primary button, which has focus.
- **Reduced motion and a hidden page:** the closing dialog and the night do not show. The morning dialog opens at once. If the page becomes hidden during the night, the night ends, and the morning dialog opens.

### "New" pin (signature)
- **Style:** a Parchment capsule with a copper-glow dot. The word "New" has weight 600. The change label has weight 400 ("New: the painted dresser"). The tail of the pin touches the edge of the change, so the pin never covers the change. The touch target of the pin is 44px tall.
- **Fit:** the complete 44px touch target stays inside the visible room and clear of the area switch and drawer handle. On short screens, the frame can move enough to keep the mark visible, within the edges of the painting. At a side edge, the pin slides sideways, and the tail stays on the mark. If the pin has no room, it hides its label.
- **Action:** a tap puts the description of the change in Mara's line. The pin marks only a painted change.

### Area switch
- **Style:** a Parchment group with a Control Line border and the room marker lift. The choices are the short area names of the act: "Front room" and "Courtyard" in act 1, and "Summer kitchen", "Vegetable garden", and "Town square" in act 2. The group has the accessible name "Rooms of the bistro".
- **Chosen:** the chosen fill, ink text, weight 600, a 2px inset accent ring, and the pressed choice shadow.
- **Locked:** a dashed Control Line outline inside the choice. The description of the choice names the preparation that opens the area and its chapter number in its act. A tap puts that description in Mara's line.
- **Change:** a new area appears over 400ms with a fade from an 8px blur. The game saves the choice separately from the game save, as a display preference.

### Paper tickets
- **Wider screens:** Fresh Linen, a hairline border, a 12px radius, and 8px padding. A 36px portrait is beside two lines: the name (13px, 600) and the quest title (12px, accent). If a line does not fit, it ends with an ellipsis. The dishes follow in a row under the portrait, as 32px pictures in 40px by 36px slots. Deliver spans the ticket below them. On hover, the title has an underline. The tickets show the first three open quests, in the order of the game data. The accessible name of a ticket is "[Name]’s quest: [title]". If no quest is open, one muted 13px line fills the row. While the recovery ticket is open, the line is beside the recovery ticket. On phones, the line is as tall as a ticket. `PRODUCT.md` gives the text of the line.
- **Phones:** 74px tall, a 9px radius, and 2px × 3px padding. A 16px portrait is beside the name in 12px text. The title stays in the accessible name and the quest dialog. A 16px status row follows the dishes. Its text is 11px in Smoke. It says Prepare while portions are missing, Later while the day prevents delivery, Deliver or Serve when delivery is available, or Light lanterns when that action is available. Later takes priority over the dish state. An available action uses Ready Green at weight 600. A crescent moon accompanies Later. A lantern accompanies Prepare for tonight's booking before its booking time. Light lanterns has no extra icon. The marks are 12px. At 410px and below with a recovery ticket, the status text and marks are 10px. Only the food pictures of a later ticket have 55% opacity. Counts and status text keep full opacity. Each ticket has one full-width face target. The quest dialog holds the reward and its Deliver, Serve, or lantern control.
- **Dishes:** 32px on wider screens. If a quest needs more than two kinds of dish, each dish is 30px in a 34px slot. A Ready Green dot marks a dish when the board holds every portion of it. On wider screens, a dish that needs more than one portion has an "n/q" badge at the lower-left corner. Phones show this badge for every shown dish, including a single portion. The phone badge is below its picture and uses Ready Green when complete. The badge uses 10px tabular figures at weight 600, Fresh Linen, and a hairline ring.
- **Face target:** the portrait, the name, the title, the dishes, and the phone status of a ticket are one target, the face. The face opens the quest dialog. The face is at least 44px tall and 44px wide. On phones, the dishes show as square pictures up to 26px wide in separate slots. The accessible name of the face starts with the quest title. Each dish follows with its quantity and the count on the board. The name also gives the booking condition, if present, and the current status.
- **Narrowest tickets:** below 360px, four shown dishes use two rows of two, with a 16px picture beside each count. The ticket row is then 90px tall. The height budget includes these extra 16px. Each face target stays at least 44px wide down to 320px.
- **Deliver:** wider-screen tickets show "Deliver · N" with the 16px coin mark. If the board does not hold every portion, the button shows the dashed "not yet" style. The accessible name is "Deliver [quest] to [name] for N coins". Phone tickets open the quest dialog for delivery.
- **Long-order progress:** a quest with more than four dishes shows its first three. The fourth slot shows the board count and required quantity of the other portions, for example "3/8", with "more" in 10px text below it. Each board portion counts only once, including when more than one requirement names the same dish. The summary keeps full opacity. Its accessible name and the face name give "[n] of [q] additional portions on the board".
- **Finale ticket:** the supper and the feast each use the long-order progress summary. In the place of the title, the ticket shows "Booked for [day] [month]" before its day and "Booked for [booking time]" on its day: "Booked for 20:00" on 1 May, and "Booked for 19:30" on 15 August. "Serve" takes the place of Deliver, with no coin mark. Before its day, Later takes the place of Serve. On its day before the booking time, the lantern control takes its place, with the accessible name "Light the lanterns: the supper is booked for 20:00", or "the feast is booked for 19:30". Serve has the dashed "not yet" style until the board holds every plate. The accessible name is "Serve [quest]". Serve opens the finale at once, without the delivery motion.
- **Piper's fee:** the ticket of "The piper’s fee" shows Serve, with no coin mark, because the quest pays nothing.
- **Booked ticket:** on wider screens, a booked ticket shows its evening in Smoke in the place of the title. The evening guest shows "Booked for" and the booking time of the act: 20:00 in act 1, and 19:30 in act 2. A fixed booking before its evening shows "Booked for Saturday 12 July". Each other booked ticket shows "Booked for another evening". If the line does not fit, it ends with an ellipsis, as the title does. The accessible name of the face also gives the evening.

  Before 20:00, the wider-screen ticket of the evening guest has the lantern control in the place of Deliver. The lantern control has a 16px lantern vector and "Light the lanterns". It has the primary style, or the dashed "not yet" style until the board holds every portion. On phones, the quest dialog shows the booking time and the full lantern control. The accessible name of the lantern control is "Light the lanterns: [Name] is booked for 20:00".

  Each other booked ticket has a disabled control in the "not yet" style with a crescent moon and "Later". Its accessible name is "[quest]: Booked for another evening". From 20:00, the ticket of the evening guest has Deliver.
- **Ticket of a later day:** a holiday quest before its holiday shows "For [holiday], [weekday] [day] [month]" in Smoke in the place of the title, and after its holiday "Late for [holiday]". An outdoor quest on a day without a terrace shows "Waits for fair weather". While the quest cannot deliver, Later takes the place of Deliver, and its accessible name is "[quest]: [the shown line]". The quest dialog gives the same line with one sentence about when the quest delivers.
- **Recovery ticket:** while the recovery quest is open, the last column of the ticket row holds that quest. The ticket has a dashed edge, because it is an offer and not a campaign quest. The four columns have equal widths. On phones, all tickets show their faces, and their quest dialogs deliver. At 410px and below, while the recovery ticket shows, the row has 4px gaps and 4px side padding. Each target on a ticket stays at least 44px wide down to 320px.
- **Delivery motion:** the dishes fly to the ticket over 600ms. Each dish starts 60ms after the dish before it. The sixth and later dishes start together. The delivery notice appears after all dishes arrive. The next quest arrives on the same ticket over 450ms, 700ms after the delivery. With reduced motion, the notice shows at once, and the next ticket appears without motion.

### Timber table and runners
- **Table:** a timber-tabletop variant covers the table, in the centre. On wider screens, the variant is 1536px wide. On phones, the variant is 1024px wide. On wider screens, the table has a 14px radius and the resting table shadow. On phones, the table has a 12px radius.
- **Runner:** a Scalable Vector Graphics (SVG) strip. The pattern in the strip repeats only the source rectangle of the runner that has no seam. The rectangle is x 161, width 503, in master pixels. The strip is 14px tall on wider screens and 8px tall on phones. Two strips frame the top and the bottom of the board.

### Board and tiles
- **Food pictures:** each food picture has a square box in every place: on a tile, on a ticket, in a dialog, and in the recipe book. A box that is not square shows a slice of the neighbouring atlas cell, so a style rule never gives a food picture a different width and height. Each picture is centred in its atlas cell.
- **Board:** six columns by seven rows of tiles in a checkerboard. Each tile has the tile lift, a 6px radius, and 5px padding (3px on phones). A free cell shows a 4px Smoke dot at 30% opacity.
- **Blocked cells:** every blocked tile shows an ordinary food picture behind a painted blocker with a transparent centre. Four edge cells use crate slats, sack fabric, crock pieces, or linen from the board-clutter atlas. Webs cover these four cells until the first preparation. Four other edge cells use old twine and a nail.

  All blockers keep the ingredient visible and use the same merge rule. A matching dish of the chain or a recipe partner clears them. A blocked tile has a distinct inset boundary and a red overlay at 20% opacity (`rgb(184 38 44 / 20%)`). The overlay is above the food and blocker art and below the help mark. The overlay clears with the blocker. Every blocked tile stays in the keyboard path.

  The accessible name of a blocked tile gives its name, ingredient, and rule. The accessible name of the board counts only free cells.
- **Preparation blockers:** each paid preparation adds two or three contextual blockers. The cell and queue rules in `PRODUCT.md` limit these blockers. The preparation-clutter atlas supplies 12 pictures. They show window offcuts, paint supplies, lamp packing, pottery pieces, leaves, and seedlings. They also show shingles, recipe papers, wrapped plates, menus, invitations, and flower cuttings. Each batch combines a new picture with familiar clutter or tied food. The new pictures use the same gouache style, camera angle, clear margins, and inset tile boundary.

  The hail of 18 July uses the hail-clutter atlas: two cells, the hailstones and the broken pot. The hail blockers use the same frame, overlay, and help as the preparation blockers.

  A tap opens blocker help. The name, the accessible name, and the status message give the work context. The accessible name of the board also gives the number of blockers that wait. These parts add no new control and no motion.
- **Rat holes:** a rat hole is a blocker. The rat-hole picture is under the blocked ingredient, inset 4% in its tile. It has the red overlay and the help mark of every blocker. Its name is "Rat hole".
- **Blocker frames:** each blocker picture uses its own square source crop around its visible outer frame. The frame fills the tile near its edge, with a 2px layer inset. The crop keeps its original proportions and stays inside its own atlas cell. The centre of each preparation frame is the centre of its painted bounds.

  A frame near a cell edge keeps a small offset. The offset keeps the full silhouette and keeps the frame out of the next cell. The transparent opening stays clear, and the ingredient keeps 70% of the ordinary food box. Do not make the ingredient smaller to compensate for too much outer padding.
- **Blocker help:** every initial blocker and every preparation blocker has a 16px question mark in its lower-right corner. The vector uses the panel fill, ink, and Control Line. The whole tile is the touch target. Hover gives the rule to clear the blocker.

  When the player selects a blocker, the strip under the board shows three parts. These parts are the name of the blocker, the exact instruction to clear it, and Clear selection. Help marks the movable matching ingredients with a 2px dotted Smoke outline at 50% opacity inside each tile. All blockers say "Tap a marked [ingredient] to merge here." A tap on a marked item clears the blocker. The accessible name of the marked item names that action.

  The accessible names describe the marked cells. The selected tile refers to the visible instruction. Help adds no dialog, no vertical row, and no motion. `PRODUCT.md` gives the ways to leave the help.
- **States:** hover draws a 2px inset outline in Selected Clay (Candle Amber in dark mode). Selection draws a 3px inset outline. A selected mergeable dish marks each matching movable dish and blocked destination. The mark is a 2px dotted Smoke outline at 50% opacity inside each tile. A source and a final dish mark no target. A hint pulses a 4px Teal Focus inset outline three times. In forced colours, matching targets have an opaque dotted Highlight outline. Keyboard focus stays a solid outline.
- **Source tab:** the sources stand beside the left edge of the board, never on it. The tab has one square place for each source of the game, in columns of eight. The first column is next to the board, and the order runs down each column. The eight places of a column span the seven rows of the board, so the tab and the board share their top and bottom edges. A dark well (`#1e120c47`, 10px radius, an inset shadow) lies 4px around all the places, so the tab keeps its size while places are free. A free place shows nothing. A source is a tile in Tile A with the tile lift and 3px padding.
  A paid source shows its take cost in its lower-right corner: a 14px coin mark and an 11px figure at weight 600, on a Panel pill with a Control Line ring. The free sources show no cost.
  Hover draws the 2px Selected Clay ring. A drag lifts the source to 35% opacity, a ghost follows the pointer, and the place of the drop has the 3px Selected Clay ring. The guide marks its source with the dotted mark of a matching item. A hint pulses the source as it pulses a cell.
  The accessible name of a source is "[Source], source of [ingredient]: tap to take an ingredient, [price]. Place N of M." The tab is one Tab stop. The Up and Down arrow keys move between the sources, and Home and End go to the first and the last. Alt and the Up or Down arrow key move the focused source by one place, and the focus stays on it. In forced colours, a source has a ButtonBorder edge.
- **Sale:** a dish that a drag drops outside the board and the source tab opens the dialog "Sell this dish?". The dialog has one line, "Are you sure you want to sell [dish], for [price] coins?", then Sell, the primary button, and Keep it, the secondary button. Keep it has focus. The dish stays selected in its cell until the player chooses.
- **Keyboard:** the board is one Tab stop. Arrow keys move between cells. Home and End go to the ends of the row. With Control, Home and End go to the first and the last cell. Escape clears the selection.
- **Motion:** a merged item settles over 180ms from 82% scale. The first of each dish arrives over 700ms with a small tilt.

### Mara's line, the offer, and the selected item
These three parts share one strip under the board. The strip is at least 62px tall on wider screens.
On the first opening without a save, the instruction connects the starting Socată pair to Linden tea and Ana's 14-coin delivery. The pair has the hint pulse. The selected item keeps the purpose in a 12px rule line until the first income. A loaded game keeps its welcome message.

If an action on a selected cell fails, its reason and recovery text replace the item picture and ordinary detail text. This paragraph uses 13px text at line height 1.35, with no clamp. Clear selection or Stop stays visible. The next selection or action clears the refusal. A phone drawer adds 24px to its height budget while the refusal shows.
- **Mara's line:** the 38px portrait of Mara (28px on phones), the live status line, and "Find a match". On phones, the live note for a selected item does not repeat its visible name.
- **Stop the guide:** if a guide is active with no selected cell, Mara's line shows a short next-step note. "Stop guide" takes the place of "Find a match". With a selected cell, the same Stop control takes the place of Clear selection in the strip. Escape works from the board and from each Stop control. A tap on the selected dish or blocker also ends the guide. A guide to a take marks and focuses its source in the tab, and Mara's line gives the step.
- **Full board:** a legal merge toward the goal keeps its board cue. Otherwise, the ticket button of a ready delivery that frees a cell has the dotted Smoke outline at 50% opacity. When the guide starts, it focuses that Deliver button on wider screens. On a phone, the guide marks and focuses the ticket face, which opens its dialog. If no such delivery is ready, another legal pair merge or blocker merge uses the board cue. If no action can make room, Mara names the limit, and Stop stays visible. The guide never marks a source for a take that cannot fit.
- **Offer:** the offer shows the preparation name, "Ready when you are.", and a primary Pay button. An active guide keeps its Stop control visible in Mara's line in place of the offer. The Story button still marks a ready payment, and Pay stays in the Story sheet. The offer returns when the guide ends. `PRODUCT.md` gives when the offer shows.
- **Selected item:** the item picture, its name, and its rule line ("Two make …", "Cook it with …", or "Final dish"). "Cook it with" names only the recipe partners that the player has made. If the player has made none, the line reads "Cook it with a new dish". While a dish guide is active, the rule line gives the goal dish and the next action. A visible Stop control takes the place of Clear selection. The board marks the next useful cells with the same dotted outline as matching items. The guide adds no row, and the selected board cell keeps its focus. The item picture is 44px (40px on phones). Below 411px, the item picture is 34px. At 360px and below, the item picture does not show.

  At 720px and below, if the name takes two lines, the ordinary rule line does not show. The goal line of the guide stays visible. Clear selection or Stop follows the name or rule.

  Keyboard focus uses the Teal Focus ring. The 44px Clear or Stop control follows. The selected item and its control fit at 360px without horizontal scroll. On a phone that is taller than 600px, the ordinary strip is 52px high. A refusal gives the strip more room for its full explanation. The strip keeps blocker help and the offer visible.

### Story and recipe book
- **Wider screens:** the story and the recipe book are sections of the docked panel between hairlines. They are not cards. The story section starts with the chapter title, the objective, and the steps. If an unread scene exists, its line follows. An unread scene is a story scene that the player has earned and not read.

  The preparation, the unmet requirement list or the ready line, and the Pay button complete the section. The Story sheet keeps the title "Our little bistro" and shows "Chapter N · [title]" in its first line. From 2 May, the line starts with the act: "Act 2 · Chapter N · [title]". Requirement rows use 13px Inter and ink text. The ready line uses weight 600. Exact totals in Cost details use tabular figures. The rows wrap within the column.

  The rows add no motion and no colour code. Journal has the accessible name "Open the story journal". The save state and the progress count follow. The recipe book is an accent link with the bat sprite and the "N of 107 dishes discovered" line.

  Story shows the chapters and the payments of the act of the current day. When every preparation of an act is paid and its finale quest waits, the finale card names the finale quest in place of the preparation. After the supper, until the closing of 1 May, the act 1 result card shows "The table is ready." and the result line. From the feast, the purchase of the orchard shows as a preparation, with its requirements and Pay. After the purchase, the act 2 result card shows "The orchard is yours.", "The trees creak, and they wait for autumn.", and the result line. Each result line uses the paragraph style of the story section, for example "The bistro worked from 2 May to 31 August. The purse holds 214 coins." The progress count gives the preparations of the act, for example "12 of 24 done".
- **Phones:** the story and the recipe book each open as a sheet from the bar.
- **Recipe book focus:** if the player opens an item in the book, Close or Escape returns to that book position. Focus goes to that dish. "Show me on the board" closes the dialog, raises a lowered drawer, and focuses the board step. These rules apply on every screen size.
- **Recipe book layout:** the book is up to 1120px wide. Its title and 44px close button stay above one scrolling body. Above 800px, the chains form two columns in reading order. Each chain has three dish columns. Mixed dishes follow across the full width in six columns. At 800px and below, chains form one column and mixed dishes have three dish columns. At 380px and below, each grid has two dish columns. Names wrap within each slot. A labelled section picker moves to a section heading and focuses it. The help text is in a closed expandable group. Returning from item help keeps that group's state. A click on the backdrop closes the book and returns focus to its opener. A press that starts inside the book does not dismiss it.
- **Complete section:** a section is one chain or the mixed dishes. When the player discovers all the dishes of a section, its book heading shows a 14px check. The word "Complete" follows the section name. The mark uses the Label size at weight 600 in Ready Green. Screen readers hear the heading as "[Chain], complete". The mark gives no notice and no reward. No other place shows the mark.
- **Covered dish:** an undiscovered dish is a transparent slot with a dashed Control Line border. The slot shows a Smoke covered dish and "Not yet". The covered dish is a plate under a dashed dome cover with a knob, at the 1.7 stroke.

**The Covered Dish Rule.** The game does not preview a dish or a room change before the player earns it. An undiscovered dish shows only as a "Not yet" covered dish. Each room change shows only after the player pays for its preparation. A locked area shows only its name and the preparation that opens it. Tickets and the quest dialog show their required food pictures and names, so that the player can plan a delivery. A blocked ingredient shows on the board. Its recipe book entry stays covered until the player takes or makes that dish. A quest in the queue does not show until it has a ticket.

Each source shows only its stage-1 ingredient. Higher-stage dishes stay covered until the player makes them by a merge. Quest requirements are the exception.

Cost details expands under the Pay row in Story, after a hairline. It shows the work scope and coin rows for Materials and supplies, Labour, and Total. It also shows the estimated person-hours, with a note that there is no timer. The exact requirements follow. The region uses the 13px story text and tabular figures, with no card and no motion. Pay stays above the region and works while the region is open.

The details do not show a painting that the player has not earned. The details start closed for each new preparation. They stay open through redraws of that preparation. Both Story views share this state. When the player opens the details, the size and the position of the board do not change.

### The reveal (signature motion)
- **Order:** the reveal starts after the story of a paid preparation. A movable drawer lowers by itself over 0.6s before the repaint. On a short screen, the repaint starts at once.
- **Repaint:** the room changes to the area of the change. The new painting replaces the old painting in the same place. The change uses opacity and an 8px blur over 1.2s, with an expo ease-out.
- **Pin:** the pin lands on the change over 450ms, and focus moves to the pin. Mara's line shows the text of the change.
- **Return:** after 1.4s, the drawer rises again, and a bat crosses the window. Then the next scene that the payment earned opens.
- **Reduced motion:** the new state shows at once.

### Navigation
- **Wider screens:** there is no navigation. Options is a Fresh Linen button in the masthead with a sliders icon.
- **Phone bar:** the bar is Parchment, 56px tall plus the safe area, with a hairline on its top edge. Story, Recipes, and Options share the width. Each has a 24px vector icon over a 13px Hearth Ink label. The Story item has the copper dot while a preparation is ready or a scene is unread. Its accessible name then says "a preparation is ready", "a scene is waiting", or both. The Recipes item has the candle dot while the recipe book has new dishes.

### Dialogs
- **Style:** dialogs are Parchment with an 18px radius and 26px padding. A dialog is at most 560px wide, except for the recipe book. It has a headline title and a 44px close button.
- **Bottom sheets (720px and below):** a bottom sheet has full width and is up to 88% of the viewport height. It has 20px padding plus the safe area, and only a top border.
- **Focus:** a dialog opens with focus on its close button. A scene opens with focus on its title at the top. Each confirmation dialog opens with focus on its safe choice. When an open dialog changes, focus moves to the new title, without a ring.
- **Story:** each scene shows the full transcript. Each turn has a 44px portrait, a 12px gap, and a text column. The speaker name is 13px at weight 600, with 4px below it. Body text is 16px with a 1.75 line height, or 14px at 720px and below. Turns are 18px apart. One completion action follows the transcript, aligned right, after 24px. After a payment, "See what changed" closes the dialog and starts the reveal.
- **Item help:** the dish picture, one line about how to get the dish, and the count on the board. The picture is 100px, or 120px at 720px and below. The dishes of the chain follow, three to a row. For a mixed dish, its two parts and the dish follow. Each dish shows its name or "Not yet". A part of a recipe also names the mixed dishes that it makes. It gives the name of a mixed dish after the player discovers that dish. If the source is in the source tab, the button "Show me on the board" closes the dialog. The board then points at the next step.

### Chapter story

On wider screens, the story section uses a 19px accent heading for the chapter title. From 1024px to 1365px, the heading uses 16px to keep long titles on one line. In the Story sheet, the chapter line is the accent line under the sheet title. The objective follows in 12px muted text.

The chapter steps follow on one line. The line has one 18px by 6px pip for each preparation of the chapter, then the muted 12px label. The label is "Chapter N" in the story section and "N of 4 done" in the sheet. A done pip has the accent fill. The current pip has an accent outline.

A later pip has the dashed Control Line edge of "not yet". The list has the accessible name "Chapter N preparations". Each pip gives the preparation name and its state to screen readers. Screen readers skip the label.

The steps name no later scene and show no room change.

An unread scene has one line under the chapter steps, above the hairline of the preparation. The 44px target of its button extends into the space above and below the line. The line holds a short 13px text and the "Read now" text button. The text is one of these lines:
- "Chapter N is complete."
- "The supper can begin." or "The feast can begin."
- "News has reached the bistro."
- "A new neighbour has arrived."
- "[First speaker] has more to say." (for a preparation scene)
- "[Name] replied to “[quest title]”." (for a quest completion scene)

The accessible name of the button names the scene. On phones, the row is in the Story sheet. The row has no motion and no dot.

The title of a scene dialog depends on the scene:
- A closing scene: "Chapter N complete: [title]".
- The finale, a preparation scene, and a quest completion scene: the title of the finale, the preparation, or the quest.
- An arrival scene: "[Name] arrives".
- A news scene: the title of the news.

A scene shows the complete ordered transcript and one completion action. Each turn has a portrait and a speaker name. The dialog can scroll. Focus starts on the title, and the scroll starts at the top. Close and Escape leave an unread scene unread. When the player opens the scene again, it starts at the top.

The completion message shows the payoff, the room change of the preparation, the arrival, or the news. The completion message comes before the completion action. The ending of a finale is below its painting. A quest completion scene has no completion message. If an unread scene opens while the session is not saved, a bordered error box shows under the completion message. The box states that the session is not saved and that the player can continue to read. The box does not take focus.

The completion action reads "Next scene" if another unread scene exists, and "Back to the kitchen" in other cases. From the journal, it reads "Return". A scene that ends with a painting uses "See [painting]" in each case: "See the supper" for the finale of act 1, "See the feast" for the finale of act 2, and "See the festival" for the reply to the fifth stall quest.

After the reveal of the payment that earned the scene, the next earned scene opens. Close and Escape leave the scene unread. When the scene dialog closes, focus returns to the control that opened it. If Read now is not present, focus returns to the Journal link on wider screens. On phones, focus returns to the Story button.

The same focus rule applies when the player closes a later scene in the same queue.

The journal shows its current or latest chapter after Unread scenes. The other complete chapters are in Earlier chapters. Each chapter is a section between hairlines with the heading "Chapter N · [title]". From 2 May, each heading starts with its act, for example "Act 1 · Chapter 6 · The first community supper". A chapter that is not complete shows its opening context and its goal in muted text. It also shows its later preparations as a muted list with "Next" or "Not yet". A complete chapter shows its payoff.

The neighbour help line uses muted text. Each unread scene has its entry under Unread scenes. After the player reads a preparation scene, its entry names its room change, for example "New: lamps lit". A closing scene and the finale say "Replay". A news scene has a Local news section in Earlier conversations. A quest reply moves to Earlier conversations with the quest title and the name of the neighbour. These parts have no animation.

### The prologue

The prologue room has one area, the family kitchen of a flat in a city apartment block, in a front-facing 3:4 painting. The area switch does not show. The kitchen has four painted states: mourning (events 1 and 6: a cloth over the mirror, and a candle beside a photograph of Paraschiva with a black ribbon), Christmas (events 2 and 3: fir branches, the carol star, and a basket of colaci), the new year (events 4 and 5: streamers and frost on the window), and the farewell (event 7: a packed suitcase and an empty cat basket by the door). The room shows the state of the current event. At the change of event, the new state comes into focus over the old one in 1200ms. With reduced motion, the change is immediate. The kitchen has no New pin, no window view, no weather, no holiday decoration, no finish, and no bat.

Miez appears in the family kitchen from event 2. He sits on the windowsill and sleeps on the radiator. In the farewell state, he sits beside the empty cat basket. From event 2, the Miez card in Story works as in act 1.

The masthead shows the short date of the current event, for example "Tue 24 Dec", with no time and no coins. Screen readers hear the full date.

Story shows the prologue as one part. The heading is "Prologue: The inheritance", and the objective is the meal of the current event. The steps have one pip for each of the seven events, with the label "Prologue" in the story section and "N of 7 done" in the sheet. The list has the accessible name "Prologue events". The body names the event and its long date. Story shows no Pay and no cost details. The foot counts the events. While the game waits for closing 7, every pip is done. The Story sheet offers the first pending scene with Read now, and the story card does not, because the counter beside it offers the scene. The counter then says "Every dish is served. N scenes wait before Mara leaves." ("One scene waits" for one), with a primary Read now button that opens the first pending scene. The line and the button share a row and wrap on a narrow phone.

An event quest ticket and its dialog show Serve, with no coin mark. The dialog says "A family meal pays nothing." Mara's quests in the prologue show the illustration of their event in place of a sketch. Mama and Tata show an old sepia studio photograph on a card with a paper border, in the slot of the sketch.

Each prologue scene shows the illustration of its event, a pencil sketch in the quest scene format, above its transcript. Opening 3 and closing 5 show a painted page of Mamaia's notebook in place of the illustration: the cabbage rolls beside a page of old Cyrillic, and the note to Mara beside a pressed basil sprig. The Cyrillic page shows an authored prayer, which Mara cannot read. The other pages suggest handwriting. Mara reads the recipe and the note aloud in her lines. The text alternative of each page describes the page. A journal replay shows the same picture. The completion action of closing 7 reads "Leave for the village".

In the journal, the prologue part has the heading "Prologue · The inheritance". Each event with a read scene shows its title and date in muted text, then a Replay entry for each read scene. An event with no read scene shows as a muted entry. Its status is "Done", "Now", or "Not yet", from its quest progress.

### Quests

The title of the quest dialog is the quest title. A 44px portrait for each person is beside the names. When delivery or the lantern action is available, its single action control comes next. Its reward and booking explanation follow before the artwork and opening dialogue. The action remains in normal flow and is visible when the dialog opens. An unavailable action stays after the dish rows. The first lines of the quest use 16px body text.

Character introductions, quest dialogs, quest completion scenes, and journal replays of quests use the parchment texture. The paper stays warm cream with dark brown ink (#3b2a1e) in both themes. The texture repeats at 512px square. Muted text uses #58402e. Controls keep their 44px targets, with dark borders and the light-theme action colours. Other dialogs use the current theme. Forced colours use the system canvas.

Each character introduction shows its own transparent character sketch in pencil. Quest openings, replies, and journal replays show the character sketch of the quest owner. Mara's quests "A look at the cellar" and "Easter lunch" show her second sketch, at the stove. The nine cathedral supply quests, the two visitor meal quests, Mara's "Baskets for the blessing", "The chimney sweep", "Three months", and "The Easter of the Blajini", Bela's "A snowman among the graves", and Costel's "The icicle clock" are the exception. Each of these 17 quests shows its accepted quest scene, a landscape image. The art does not change when the speaker changes. On a wider dialog, a character sketch floats to the right at 42% of the text area. The sketch is up to 210px wide. At 540px and below, the sketch is in the centre above the text, at 170px wide. A quest scene is in the centre above the text, at the text width, up to 460px. It keeps its natural proportions. The text and the controls stay in normal flow, and the dialog can scroll vertically. If an image does not load, the dialog removes it, and all text and controls stay. Local news keeps the story layout.

Victor draws the sketches while he waits for his meal and listens to the other guests. So each drawing is a quick sketch: simple lines, a simple face, and soft light shading. Keep light, steady pencil lines of a skilled artist. Keep accurate anatomy, proportions, and perspective. Draw the facial features lightly, but always draw them. If the view shows the eyes, awake people have open eyes, and sleepers have closed eyelids. Victor's secret crush explains the more detailed face of Mara. Match the accepted sketches, and do not add dense fabric or surface detail.

Each quest scene and each character sketch matches the sketches of Adrian, Avram, Bran, Costel, Eszter, Ilie, Sorin, and Vlad:

- Use a soft warm sepia pencil, drawn freehand. Draw one clear outline for each body and garment, with several fold lines. Show embroidery only as a few small motifs on a sleeve or a cuff.
- Draw each face lightly but completely: open eyes with a small iris and a lid line, brows, a nose with a little shadow on one side, and a mouth. Draw age lines on old characters.
- Shade with soft tone from the side of the pencil, in short parallel strokes that fade at their edges. Put the tone on the shadow side of each form, with the light from the upper left. About a third of each figure carries tone. No area is solid.
- Show the full figure on the ground with its props. Draw the setting with a few light lines, and let it fade out unfinished.
- Do not use scratchy or hairy lines, the grainy texture of a crayon, or an even, clean outline, as from a fine pen. Do not draw dense pattern or texture on cloth, hair, or walls.
- Use only three colours: sepia, red chalk, and gold. Each sepia line has the same colour. The transparency of the line gives its light and dark.
- Use faint red chalk only on the objects that the quest names: the cathedral door, the Easter eggs, the ribbon of the Easter candle, and the eggshells of the Blajini.
- Use gold only on crowns and on flames.

If more than one character speaks, the lines form an exchange. Each line is a paragraph, 12px from the next. At each change of speaker, the name of the speaker (13px, 600) is on its own line above the text. Screen readers hear "[Name]:" before the text. The food rows show the exact quantity and the count on the board. Each row opens item help, which returns to the quest. An unmet row also has a 44px Find text button. Its accessible name gives the dish. Find closes the dialog and points to the next board step for another portion. If the action is unavailable, the coin reward follows in gold, then Deliver ("Deliver · N" with the coin mark). An available action and its reward appear before the artwork as described above. The final muted line says "Delivery uses dishes on the board. There is no deadline."

A finale quest names the guest before each food row, for example "Mara: 1 Cabbage rolls with mămăligă". On the feast, the two dishes of the empty chair say "Mamaia’s chair: 1 Colivă" and "Mamaia’s chair: 1 Colaci". The line "The supper pays nothing. Serving it opens the finale." or "The feast pays nothing. Serving it opens the finale." replaces the reward. On "The piper’s fee", the line "The piper’s fee pays nothing. His tune keeps the thief rats away for 4 Sunday nights." replaces the reward. Serve uses the same available-action placement. The final muted line of a finale says "One plate for each guest, to each one’s taste. There is no deadline." The muted line of the recovery quest is "Ana returns while the purse runs low. Herbs from the Herb basket are free."

Deliver has the dashed disabled style until the board holds every portion. Deliver closes the dialog and starts the delivery motion.

Visitor quests use the same tickets, dialog, food counts, reward, and delivery controls. The portraits come from atlases. Each portrait atlas is a transparent two-by-two image. The visitor atlas holds Adrian at the top left and Monica at the top right. It holds Janos at the bottom left and Ionatan at the bottom right.

The guest atlas holds Vlad and Elisabeta in the top row. Mina and Avram are in the bottom row, in that order. The four core characters use their own atlas. Three regular atlases hold the other 12 regulars in row order. The first regular atlas holds Dochia, Victor, Ana, and Costel. The second regular atlas holds Sânziana, Dorian, Ileana, and Cezar. The third holds Cătălina, Bran, Bela, and Gavril. The summer-guests atlas holds Ambrozie and Tarka in its top row, with two empty cells below.

Mina and Avram share one quest, and its dialog shows both names and portraits. Dialogue uses the portrait of its current speaker.

Each character has its own square source crop that keeps a consistent face scale and eye line. The crop stays inside its atlas cell and keeps the headwear and the upper-body details that identify the character. Mara uses the same crop on tickets, in dialogue, and in her line under the board. A tall hat keeps the small eye-line difference that the hat needs.

The portraits keep their colours in both themes.

Paint Adrian and Monica with Romanian village headwear and embroidered shirts. Adrian also wears his steel plate cuirass and burgundy cloak. Monica also wears her brown leather scout armour and green cloak. Paint Janos in Hungarian Roma village dress, with his felt hat, indigo waistcoat, plum neckerchief, and a staff. Paint natural adult faces. Do not draw a caricature.

The journal starts with Unread scenes in the saved queue order. Each unread scene has one row with its title and "New scene". Keep "New scene" on one line. If no scene is unread, one muted line says "No unread scenes." The current chapter follows. After all preparations, the latest chapter follows. Earlier chapters, Earlier conversations, and Neighbours follow as native expandable groups that start closed. Their summaries have a 44px minimum height, 14px vertical padding, and 16px text at weight 600. The groups use the dialog line, ink, muted text, and focus ring, with no cards and no animation.

Earlier chapters shows the newest chapter first. Earlier conversations keeps one entry for each completed quest, with the last delivery first. Earned news and the read finale also stay there. Unread scenes show only under Unread scenes.

Neighbours shows the core characters, then the regulars in order of arrival. A neighbour row has a 44px portrait, a text column, and a muted count on the right. The gaps are 12px. The text column holds the name (600). The trade and the favourite dishes follow in 12px muted text ("Favourites: Mămăligă, Bulz, and Drob"). The count says "N quests".

A neighbour row opens the introduction. An unread arrival scene shows above, under Unread scenes. A regular who has not arrived has a row with these parts:
- a dashed border and a transparent background
- a 44px dashed circle
- the muted words "Not yet"

Visitor rows follow. A visitor row has a 44px portrait and two equal text columns. The names align left, and the roles align right. Long names and long roles wrap within their columns.

Completed quests are in Earlier conversations. Each quest with a reply has one entry with its title and the name of the neighbour. Its accessible name is "Replay [title]", or "Read [title]" while the reply is unread. The page shows Quest then Reply in one transcript. Each part has a 16px heading. Speaker names use level-four headings in the 13px speaker style. The Reply part starts after a 24px gap, an 18px inset, and the 1px line. One character sketch or quest scene and one Return action serve both parts. Return marks only an unread reply as read. A finale quest has only its opening entry. The recovery quest has no entry.

Return, Close, and Escape keep the open groups and the scroll position, and focus the journal entry. If the entry moved into a group after the player read it, that group opens. A read arrival focuses its neighbour. A read single-visit farewell focuses the Unread scenes heading. When the player closes the quest sheet, focus returns to the visible Story link or to the phone Story button.

These parts have no animation.

### Scene paintings

A scene painting follows a finale or the reply to the fifth stall quest: the supper, the feast, or the festival. The dialog title is the title of the painting: "The supper", "The feast", or "The festival". The 3:4 painting is in the centre, with the card radius, and is at most min(62dvh, 680px) tall. The ending line of a finale follows in the completion style, 14px above and 16px below. One primary button ends the dialog: "Back to the kitchen", or "Continue" if the journal or another unread scene follows. The image has a text alternative that names each guest. The painting is the same in both themes. A painting that does not ship shows its text alternative as a paragraph in its place.

After the player serves a finale, the area of its painting shows the painting in place of its latest state, if the painting ships. The supper painting shows in the courtyard until the end of 1 May, and the feast painting shows in the town square until the end of act 2. When the player serves the finale, the room changes to that area. After a reload, the room opens on that area. The guests sit where the finishes go. So the area then has no finish layers, no finish switches, no New pin, and no Miez. Each finale painting has its own frame focus: the supper at 50% across and 55% down, and the feast at 50% across and 72% down, on the guests at the table. The room caption adds the text alternative of the painting. The festival painting shows only in its scene, and the town square keeps its state.

### Delivery notices

A delivery notice is a temporary text message.
The notice shows the delivery result and any save warning.
The status region uses polite announcements.
The notice does not take focus.
While the completion scene is unread, the notice ends with the text button "Read [Name]’s reply". The button opens the scene and removes the notice. Only a notice with this button accepts pointer input.
After the last delivery, focus moves to Read now in Story if no selected board cell can receive focus.
On phones, focus moves to the Story button instead.

Each notice stays for 4.2 seconds, then fades over 300ms. A notice with a reply stays for 8 seconds. While the pointer or focus is on the notice, the notice waits. It leaves 4.2 seconds after the pointer and focus leave.
Its entrance is a 300ms fade and a scale from 92%.
With reduced motion, the notice has no animation and leaves after the same time.
More than one notice forms a vertical stack with 8px gaps.

On wider screens, the stack is 20px from the right edge and the bottom edge.
Each notice has a maximum width of 340px.
On phones, the stack is 10px below the masthead and has centred text.
Its width is the smaller of 92vw and 360px.

The notice uses the panel fill, ink text, and a 1px line border.
It uses the card radius and the panel lift shadow.
Its padding is 10px vertically and 14px horizontally.
The text is 14px with a line height of 1.4.

### Finish switches

A quest can unlock a finish for a detail of the room. The player changes the finish at the place of the detail in the room. The switch is a transparent button over the crop of the detail, at least 44px each way. A 26px badge is on its upper-right corner. The badge is a Fresh Linen disc with a Coin Rim ring and two ink arrows that show a switch.

Hover and focus draw a 2px dashed Coin Face outline around the detail. The accessible name is "[Detail]: [current finish]. Switch to [next finish]". A tap applies the next finish after the save succeeds, and the status line names the new finish. Focus stays on the switch.

The switch shows only in the area that the room shows, and only while its detail is in the room. If the painting does not load, the switch stays hidden and cannot take focus. The switch also needs a visible 44px square target inside the room crop and above the drawer. When the player lowers the drawer, the switches whose targets become visible return.

The switch adds no motion.

### Options

Options shows the save state. If the state needs one, Options also shows the Retry saved game control or the Retry save control. Its other sections are Appearance, Motion, Kitchen sounds, Your saved game, About Scary Snacks, and A fresh start. The sections use the dialog, section, button, ink, muted, and focus styles. Below the last section, one small centred muted line shows the version, for example "Version 1.1.30".

### Inputs / Fields
- **Segmented choice:** the Appearance setting and the Motion setting each use a segmented choice. The track is Flour Dust with a Control Line border. The options are 44px tall. The checked option has the chosen fill, weight 600, a 2px inset accent ring, and the pressed choice shadow.

## Design instructions

### Required actions
- Use only the 115 registered Portable Network Graphics (PNG) masters in public/assets/original. Load only their variants from public/assets/variants.
  - The 25 room masters of act 1 are front-room-00 to front-room-12, front-room-17, front-room-24, courtyard-13 to courtyard-16, and courtyard-18 to courtyard-23.
  - The 25 room masters of act 2 are summer-kitchen-00 to summer-kitchen-04, summer-kitchen-15, summer-kitchen-16, summer-kitchen-19, summer-kitchen-20, vegetable-garden-05, vegetable-garden-06, vegetable-garden-13, vegetable-garden-14, vegetable-garden-17, vegetable-garden-18, vegetable-garden-21, vegetable-garden-22, town-square-07 to town-square-12, town-square-23, and town-square-24. The screen door of the summer kitchen has netting that a script draws over its two panes.
  - The four family kitchen masters of the prologue are family-kitchen-mourning, family-kitchen-christmas, family-kitchen-new-year, and family-kitchen-farewell. Christmas and the farewell are edits of the mourning state, and the new year is an edit of Christmas.
  - The supper master is finale-supper, an edit of courtyard-23 with the guests of the supper. The feast master is finale-feast, an edit of town-square-24 with the guests of the feast. The festival master is festival, an edit of town-square-12 with the people of the festival.
  - The two decoration masters are decoration-front and decoration-courtyard. The two holiday masters are holiday-front and holiday-courtyard: transparent pictures at the size of the room states, with each decoration at its place.
  - The three window views are window-view-late-winter, window-view-early-spring, and window-view-spring, each 1152 by 1536px and opaque.
  - The 27 other masters are these:
    - board-clutter, preparation-clutter, portraits, visitor-portraits, guests, regulars-1, regulars-2, regulars-3, summer-guests, family-portraits, mascots, timber-tabletop, embroidered-runner, and parchment-page
    - hail-clutter, one row of two cells: the hailstones and the broken pot
    - sketch-sheet-1 to sketch-sheet-4, each a grid of four columns and two rows of 672px character sketches; sketch-sheet-4 holds Ambrozie, Gavril, and Tarka in its first three cells, with five empty cells
    - scene-sheet-1 to scene-sheet-6, each a grid of two columns and two rows of 1152 by 768px quest scenes; scene-sheet-5 holds the four event scenes of the prologue, and scene-sheet-6 holds the memorial of three months in its first cell, with three empty cells
    - notebook-pages, one row of two opaque 1152 by 768px painted pages of the notebook
    - family-photos, one row of two 1024px square cells, each with an old photograph of Mama or Tata on transparency
  - The four night masters are these:
    - rat-thief and rat-soricescu, each a grid of four columns and two rows of 512px cells
    - rat-hole, 1024px square
    - night-sky, 2048 by 1024px and opaque
  - The 20 food atlas masters are grids of four columns and two rows. A dish shows its whole cell, with no measured bounds. Each picture is centred in its cell. A chain atlas holds the source in cell 0 and the dishes in stage order. The food atlas masters are these:
    - food-grain, food-corn, food-herbs, food-dairy, food-poultry, food-vegetables, food-fruits, food-pork, food-beans, food-lamb, food-veal, food-fish, food-pickles, food-greens, food-garden, food-soups, food-mains, food-sweets, food-breads, and food-summer
- Paint each room state as a complete 3:4 painting, 1536 by 2048, opaque. Keep every pixel outside the change the same as in the state before it.
- Ship room states, the family kitchen states, the supper painting, the festival painting, and the feast painting as AVIF and WebP at 768 and 1536px wide, AVIF first. Ship the timber as AVIF and WebP at 1024 and 1536px wide. Ship the decoration paintings and the holiday images as WebP at 1536px wide. Ship the window views as WebP at 576px wide. Ship the transparent atlases and the runner as WebP. Ship the rat sheets and the night sky as WebP at 1024px wide. Ship the rat hole as WebP at 256px square.
- Ship the parchment as a WebP at its native 1254px square size. Cut each cell of a pencil sheet into its own variant. Ship each character sketch as a transparent WebP at its native 672px square. Ship each quest scene as a transparent WebP at 1024px wide, and each notebook page as a WebP at 1024px wide. Ship each family photograph as a transparent WebP at 672px square.
- Keep the neighbours in working village dress: Mara, Ilie, and Sorin in Romanian dress, and Eszter in Székely dress.
- Draw every control icon as a vector with a 1.7 stroke and round caps and joins.
- Give every interactive boundary `--control-line`. Keep targets at least 44px, except for the board and source tiles, which use their specified sizes.
- Keep the wordmark as the top-level heading (h1) of the page.
- If `--cell` or the visible room changes, recompute both together. Check the sizes of The One Screen Rule.
- Obey reduced motion. Reduced motion is the Motion choice Reduced, or the Motion choice System on a device that asks for reduced motion. Reduced motion removes every animation and transition. Reduced motion keeps every outcome and line of text. The Motion choice Full keeps every animation and transition.
- In forced-colours mode, give a system-colour border to tiles, primary buttons, secondary buttons, and tickets. Give the same border to ticket dishes, area choices, and the pin. Give a blocked tile a 2px dashed border. Give the selected tile and the hovered tile a 3px system-highlight outline.
- Use the house words: the board and a preparation. Call an ingredient source by its own name (the Windmill). Players take, merge, cook, deliver, and pay.

### Prohibited actions
- Do not preview a dish or a room change before the player earns it (The Covered Dish Rule).
- Do not darken, tint, or filter food, portraits, or timber. Keep the specified 20% red overlay on blocked board tiles. Only the night tint covers the room painting.
- Do not paste room objects onto a room painting as sprites. Paint a new state. The cats, the bat, and the rat of the night are the only sprites over the room.
- Do not cover the room with interface on wider screens (The Open Room Rule).
- Do not let the pin cover the change that it marks.
- Do not use a visual identity, art, audio, fonts, or geometry that this project did not make or license.
- Do not use Grenze Gotisch for anything except the wordmark.
- Do not show an unaffordable action in a dimmed colour. Use the dashed "not yet" style.
- Do not let the coin figures touch the wordmark at any width.
- Do not put Story, Recipes, or Options in the phone masthead.
- Do not repeat the whole runner bitmap. Do not tile the timber vertically. Both actions show seams.
- Do not use emoji or Unicode characters as icons.
