---
name: Scary Snacks
description: A lamplit Transylvanian bistro with black cats, bats, and local dishes.
colors:
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
    width: "100%"
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
  button-house-book:
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
    width: "max(50vw, 620px)"
  drawer:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    rounded: "18px 18px 0 0"
    height: "calc(var(--cell) * 7 + 18px + 156px)"
  drawer-handle:
    backgroundColor: "{colors.light-control-line}"
    rounded: "2px"
    width: "96px"
    height: "44px"
  order-ticket:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.card}"
    padding: "8px"
  order-ticket-phone:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.control}"
    padding: "2px 3px"
    height: "50px"
  serve-button:
    backgroundColor: "{colors.plum-brandy}"
    textColor: "{colors.light-on-action}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "6px"
    height: "44px"
  serve-button-phone:
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
    padding: "6px 0"
  table-runner:
    height: "14px"
  table-runner-phone:
    height: "8px"
  board-tile:
    backgroundColor: "{colors.light-tile-a}"
    rounded: "{rounded.tile}"
    padding: "5px"
    size: "clamp(44px, min(calc((var(--panel-w) - var(--side-w) - 116px) / 6), calc((100dvh - 400px) / 7)), 96px)"
  board-tile-phone:
    backgroundColor: "{colors.light-tile-a}"
    rounded: "{rounded.tile}"
    padding: "3px"
    size: "clamp(44px, min(calc((100vw - 40px) / 6), calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7)), 60px)"
  mara-line:
    textColor: "{colors.light-ink}"
    typography: "{typography.body}"
    padding: "6px 2px"
    height: "62px"
  pantry-slot:
    backgroundColor: "{colors.light-panel}"
    rounded: "{rounded.control}"
    padding: "5px"
    size: "max(44px, min(var(--cell), calc((100cqw - 6px * (var(--cols) - 1)) / var(--cols)), calc((100cqh - 40px - 6px * (var(--rows) - 1)) / var(--rows))))"
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

**Creative North Star: "The Room and the Drawer"**

Scary Snacks is a warm Transylvanian bistro at dusk. The room is the home of the game and its reward. One gouache painting shows each area as the completed preparations leave it. The painting fills the screen behind everything. The kitchen is a parchment drawer over the room. On phones, the drawer is half open. On wider screens, the drawer is one parchment panel beside the room. Each paid preparation repaints the room. On phones, the drawer lowers by itself. The new painting then replaces the old painting in the same place.

The setting is homely and lit by lamps. The eerie parts stay at the window: black cats on the sill and bats in the dusk. The user chose the setting, the title, the cats, the bats, and the village dress of the neighbours. The interface looks hand-made. Paper tickets carry the orders. The board rests on timber between cross-stitch runner strips. The small details are authored. These are a copper coin with a crescent moon and a cat on the wordmark baseline. The ledger has a house on its cover. The other details are a copper-glow "New" pin, dashed "not yet" outlines, and dashed cloches over unmade dishes. Light mode uses cream and parchment with plum and dark brown ink. Dark mode uses walnut and plum with ivory and candle amber. The System choice follows the device.

**Key Characteristics:**
- The room is one full-height 3:4 painting for each area. On wider screens, only the pin and the area switch cover it.
- The kitchen is one parchment surface. It holds three paper tickets, the board on timber, and Mara's line. On wider screens, it also holds the story, the recipe book, and the pantry.
- Each preparation has its own complete painted state. The game never pastes room objects onto a painting. Only the cat and bat sprites sit over it.
- The signature motion is the reveal. The room repaints in place, and the pin lands on the change. On phones, the drawer lowers first.
- Food, portraits, mascots, rooms, timber, and the runner are gouache bitmaps made for this project. Every control icon is an authored vector.
- The two themes are fully authored. A theme is never an inversion of the other theme.

## Colors

The palette is warm and has low saturation. Each theme has one action colour. That colour is on every primary action. Dark mode uses warm walnut and plum neutrals. It never uses cool grey.

### Primary
- **Plum Brandy** (plum-brandy): the light-mode action and accent colour. It fills Serve, Pay, Take, and the other primary buttons. It colours links, the chapter name, and the ring of the chosen area. It also colours the border of a hovered control. Text on it is Light On-Action (light-on-action).
- **Candle Amber** (candle-amber): the dark-mode action colour. It fills primary buttons and draws the selected-cell outline. It also gives every cat a faint rim glow. Text on it is Dark On-Action (dark-on-action).
- **Candle Glow** (dark-accent): the dark-mode accent for links, hover tints, the chosen-area ring, and the danger outline.

### Secondary
- **Copper** (copper): the light-mode coin figures, the coin rim, and the crescent moon of the coin. Copper Coin Face (light-coin-face) fills the coin.
- **Copper glow dots** use the coin face. The "New" pin, the Story item, and the Recipes item each have one dot. The dot of the pin and the dot of Recipes add a candle glow. The Story dot has a Parchment ring only.
- **Dark Gold** (dark-gold): the dark-mode coin figures and coin face. Dark Coin Rim (dark-coin-rim) colours the rim and the moon.

### Tertiary
- **Teal Focus** (light-focus / dark-focus): the focus ring and the hint pulse. Nothing else uses it. It is the only cool hue in the system.
- **Ready Green** (light-ready / dark-ready): the small dot on an order dish that the board can already supply.
- **Selected Clay** (light-selected): the selected-cell outline and the tile hover in light mode. In dark mode, Candle Amber does this job.

### Neutral
- **Cream Plaster / Walnut Dusk** (light-page / dark-page): the page and the phone masthead. The browser also uses this colour as its theme colour.
- **Parchment / Lamplit Walnut** (light-panel / dark-panel): the drawer, the docked panel, the pin, and the area switch. It also fills the pantry slots, the phone bar, and the dialogs. From 1024px, the whole page background is Parchment.
- **Fresh Linen / Plum Lacquer** (light-surface / dark-surface): the paper tickets, the House book, journal entries, and recipe items. In light mode, Fresh Linen is also the chosen fill (`--chosen`).
- **Flour Dust / Hearth Ash** (light-inset / dark-inset): secondary buttons and the choice track. It also fills the Miez card in the Story sheet and the current step of a chain. Portraits use it as the backing.
- **Warm Burl** (dark-chosen): the dark-mode chosen fill, for the checked appearance and the chosen area.
- **Board Tiles / Oiled Oak** (light-tile-a, light-tile-b / dark-tile-a, dark-tile-b): the alternating checkerboard. In dark mode, the tiles are lighter than the panels, so the board looks lit.
- **Hearth Ink / Ivory** (light-ink / dark-ink): body text, headings, the pin, and the phone bar labels.
- **Smoke** (light-muted / dark-muted): secondary text, the unchosen area names, and "not yet" labels. Its contrast is at least 4.5:1 on the page and on panels.
- **Hairline** (light-line / dark-line): ticket edges, pantry slots, and the top edge of the phone bar. It also draws the section dividers in the docked panel. These lines are decorative.
- **Control Line** (light-control-line / dark-control-line): every interactive boundary, the drawer grip, and every dashed "not yet" outline. Its contrast is at least 3:1 against the page.

### Named Rules
**The One Accent Rule.** Each theme has exactly one action colour: Plum Brandy in light mode and Candle Amber in dark mode. Coins are copper and gold. Focus is teal. No other colour marks something that the player can press.

**The Untouched Plate Rule.** Never darken, tint, or filter food, portraits, a room painting, or the timber at rest. Dark mode changes the interface, not the paintings.

## Typography

**Display Font:** Grenze Gotisch (with serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** Grenze Gotisch is the readable Germanic blackletter that the user asked for. Use it for the shop sign only. Inter is the font for all other text. Both fonts are self-hosted files in Web Open Font Format 2 (WOFF2). Each font has the SIL Open Font License (OFL) 1.1. The license texts are beside the font files.

### Hierarchy
- **Display** (600, clamp(43px, 3.2vw, 48px), 1): the wordmark only, from 1024px. Below 1024px, the wordmark uses the display-phone size.
- **Headline** (600, 21px, 1.3, -0.025em): section headings ("Our little bistro", "The pantry") and dialog titles.
- **Title** (600, 19px, 1.4, -0.025em): the preparation name, settings sections, recipe chains, and the Appearance legend.
- **Title small** (600, 15px, 1.25): the name of the selected item under the board. It also sets the Miez card and the recipe book title, at a line height of 1.4.
- **Figure** (600, 24px, 1, tabular numerals): the coin total. It is 21px below 1024px.
- **Body** (400, 14px, 1.7): dialog copy and control labels. Mara's line is 14px at 1.45 (13px at 1.35 below 1024px). Story dialogue is 16px at 1.75 (14px at 720px and below).
- **Body small** (400, 13px, 1.65): the story copy, Serve, the area names, and the ticket name (600). It also sets the offer, the item actions, and the bar labels.
- **Label** (400, 12px, 1.5): the chapter number, the save state, and the "N of 24 preparations done" count. It also sets the pantry count, the rule line of the selected item, the pin, and Serve on phones.

### Named Rules
**The Shop Sign Rule.** Grenze Gotisch appears once per screen, as the wordmark. Every other heading is Inter at weight 600.

**The Twelve-Pixel Floor Rule.** No text is smaller than 12px at any width.

## Layout

The screen is "The room and the drawer". The room and the kitchen share the screen. The room never scrolls.

**The room.** Each area has one painting for each state. The paintings are 3:4 and opaque. The game shows the state of the highest completed preparation in that area. A picture element offers AV1 Image File Format (AVIF) first, then WebP, at 768 by 1024 and 1536 by 2048. The sizes value is `(max-width: 1023px) 100vw, max(50vw, 75vh)`. The browser downloads only the current state. While a paid story plays, the next painting downloads before the reveal.

The frame places the latest change near the middle of the visible room, a little low. The pin then has room above the change. Two numbers (`--fx`, `--fy`) give the focus of the change. The frame never shows past the edges of the painting. A change of focus moves over 0.9s.

The area switch sits in a lower corner of the visible room. The top of the switch is 64px above the lower edge of the visible room. The switch stays on the side away from the change. In the front room, the switch always stays on the left, away from Miez.

**Wider screens (1024px and up).** The room is fixed on the left at full height. The docked panel takes `max(50vw, 620px)` on the right. Nothing covers the room, except the pin and the area switch. The panel holds, from top to bottom:
- The masthead, with 18px 24px 12px padding. The tagline shows only from 1600px.
- The three tickets, in three equal columns 12px apart.
- The drawer body: the kitchen column, then the side column, 20px apart.

The kitchen column is as wide as the board plus 28px. It holds the timber table and Mara's line, 12px apart. The side column has a hairline on its left and 20px of padding. It holds the story, the recipe book, and the pantry as sections between hairlines. The sections are 14px apart (10px from 1024px to 1365px). The pantry fills the rest of the column, so the column ends at the same height as the board. The slots of the pantry grow up to the cell size. The shape of the space sets the number of columns: six, four, or three.

**Phones and tablets (1023px and below).** The masthead is 48px tall on the page colour, with 14px gutters. The room fills the screen below the masthead. The painting is as wide as the screen. The drawer is fixed above the bar, with an 18px radius on its top corners. The content of the drawer is at most 560px wide, centred. From top to bottom, the drawer holds:
- The grip. It is a 40px by 4px bar in Control Line, on a 96px by 44px target. The target reaches over the room.
- The three tickets, 6px apart.
- The timber table with the board.
- Mara's line, or the offer, or the selected item and its actions.

The bar is 56px tall plus the safe area. The safe area is the space that the device reserves at the screen edge. The bar holds Story, Recipes, Pantry, and House book. The recipe book card and the side column do not show. Each of the four bar items opens a dialog. At 720px and below, these dialogs are bottom sheets.

**The lowered drawer.** The grip lowers the drawer. The drawer then shows the whole painting. The tickets stay in view, 68px above the bar. The drawer moves over 0.6s. While the drawer is lowered, the board does not accept input.

**The height budget.** The cell size and the visible room share one budget:
- Wider screens: `--cell: clamp(44px, min(calc((var(--panel-w) - var(--side-w) - 116px) / 6), calc((100dvh - 400px) / 7)), 96px)`, with 4px gaps.
- Phones: `--cell: clamp(44px, min(calc((100vw - 40px) / 6), calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7)), 60px)`, with 3px gaps. The value of `--drawer-chrome` is 156px. The room shows at least 29.5dvh above the drawer when the cell size allows it. The unit dvh is one percent of the dynamic viewport height.

**Short screens.** A screen of 1023px wide or less and 600px tall or less is short. On a short screen, the room, the drawer, and the bar are not fixed. They follow each other in the page, and the page scrolls. The room is 240px tall. The grip does not show. A change to this layout clears the lowered drawer state, so the kitchen accepts input after rotation.

**Bottom sheets.** At 720px and below, dialogs rise from the bottom edge.

**The masthead.** The cat, the wordmark, the tagline, and the coin figures share one baseline. The wordmark and the coins never touch. Below 411px, the word "coins" does not show once the total reaches 1,000. At 720px and below, a total of 10,000 or more shows in short form, for example "12.3K". The short form follows the page language. It rounds down, so it never shows more coins than the player has. Screen readers always get the exact total.

**Known limits:**
- At 1280x800, the ends of the two desktop columns can be 50 to 75px apart.
- At 1440, the 44px pantry slots sit at the left edge of the column. About 44px is free on the right.
- The tests do not use physical touch or a screen reader.

### Named Rules
**The Open Room Rule.** On wider screens, no interface covers the room, except the pin and the area switch. On phones, the drawer covers only the lower part of the room. The frame keeps the latest change in the visible part.

**The One Screen Rule.** The cell size and the visible room share one height budget. If you change one of them, recompute the other. The tickets, the whole board, and Mara's line then stay on the first screen at 1440×900 and 390×844.

**The Thumb Rule.** On phones, the bottom bar holds Story, Recipes, Pantry, and the House book. The masthead never holds them.

## Elevation & Depth

The system uses layers. The room is the deepest layer. The parchment lies over the room. On wider screens, the panel shades its own edge toward the room. The panel casts no shadow on the painting. On phones, the drawer casts a short shadow up onto the room. The tickets and the timber rest on the parchment with small contact shadows. Inside the parchment, tonal layers and hairlines separate the parts. A state change uses an inset outline, not more shadow.

### Shadow Vocabulary
- **Panel edge** (`box-shadow: inset 10px 6px 14px -10px #42282440`): a 24px strip on the edge of the docked panel toward the room.
- **Drawer cast** (`box-shadow: 0 -8px 12px -6px #1a0f0a73`): the drawer on phones, cast up onto the room.
- **Resting table** (`box-shadow: 0 2px 4px #2a1a1029, <panel lift>`): the timber table on wider screens.
- **Panel lift** (`box-shadow: 0 9px 26px #42282412` in light, `#0a060433` in dark): the lift part of the resting table.
- **Ticket rest** (`box-shadow: 0 1px 2px #2a1a1029`): each paper ticket.
- **Tile lift** (`box-shadow: 0 1px 2px #2a1a1040`): every board tile. The lift stays under the hover, selected, and hint outlines.
- **Room marker lift** (`box-shadow: 0 6px 16px #1009122e`): the pin and the area switch over the painting.
- **Dialog lift** (`box-shadow: 0 24px 70px #100b173f`): dialogs and sheets, over a plum-black backdrop (`#17101ac4`).
- **Pressed choice** (`box-shadow: 0 1px 3px #2a1d2024`): the checked appearance and the chosen area, under a 2px inset accent ring.
- **Carried dish** (`filter: drop-shadow(0 7px 5px #17101a65)`): the dish under the pointer (74px) and each served dish in flight.
- **Cat glow** (`filter: drop-shadow(0 0 1px #e8b58e80) drop-shadow(0 3px 10px #e8b58e30)`): dark mode only, on the wordmark cat and on every cat in the room.
- **Pin glow** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 3px #e8b58eb3`): the copper dot of the "New" pin.
- **Candle dot** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 2px #e8b58e99`): the new-dish dot on the Recipes item.

### Named Rules
**The Lamplight Rule.** Shadows are warm and soft. A halo with no offset is only for candle glow. Three things have one: the rim of a cat, the dot of the pin, and the new-dish dot.

**The Clean Canvas Rule.** No shadow, gradient, or tint falls on a room painting. The docked panel shades its own edge instead.

## Shapes

Corners grow with the size of the surface. A nested shape uses a smaller radius than the shape around it.
- **Tile** (6px): board tiles, area choices, appearance choices, and the current step of a chain.
- **Control** (9px): buttons, the area switch, the House book, pantry slots, phone tickets, journal entries, recipe items, and bar items.
- **Card** (12px): desktop tickets and the phone timber table.
- **Panel** (14px): the desktop timber table.
- **Pin** (14px): the "New" pin, a pill 28px tall. Its tail is a rotated 10px square with a 2px radius.
- **Dialog** (18px): every dialog, and the top corners of the drawer and of each bottom sheet.

Borders are 1px. Hairlines separate content. Control Line outlines what the player can press. A dashed outline means "empty" or "not yet". It marks an empty pantry slot, an unaffordable action, a locked area, or an unmade dish. A dashed panel in place of the room means that the painting did not load.

Portraits are circles. Food and mascots keep their own transparent outlines. The room clips only to rectangles: the window glass and each decoration region. A bat flies behind the glass.

## Components

### Buttons
Buttons are solid and warm. Every button target is at least 44px tall.
- **Shape:** slightly rounded (9px).
- **Primary:** in light mode, the fill is Plum Brandy with Light On-Action text. In dark mode, the fill is Candle Amber with Dark On-Action text. The weight is 600, and the padding is 11px × 15px. Hover brightens the button by 7%. A press moves the button down 1px.
- **Not yet:** an action that the player cannot afford has a transparent fill. The border is a dashed Control Line, and the text is Smoke. The button is never a dimmed colour.
- **Unavailable:** if the kitchen cannot open, three parts have 50% opacity and do not accept input. They are the House book, the recipe book, and the bar items. The game dims no other button.
- **Secondary:** the fill is Flour Dust, the text is ink, and the border is a 1px Control Line.
- **Danger:** a transparent fill with an accent outline and accent text. Only the reset action uses this style. A confirmation always follows.
- **Pay:** the story shows the current and required coins, total orders served, and total merges. Each row says "Complete" or "Need N". Total means the lifetime count across all preparations. A required quest shows its name. A blocked source placement states the space needed. Pay stays disabled with the dashed not-yet style until every requirement is met. The button reads "Pay · N" with the 16px coin mark. Its accessible name is "Pay N coins: [preparation]" and its description is the requirement list. Pay and the Cost details text button share one 44px row with a 10px gap. Pay fills the remaining width. Cost details has the accessible name "Work and cost".
- **Text button:** an underlined accent link at 13px with a 44px target. It is used by Find a match, Open the story journal, Neighbour quests, the quest journal's Read request, and Try again when the kitchen cannot open.
- **Focus:** a 3px Teal Focus ring, offset by 3px. Inside a tile, an area choice, the grip, or a bar item, the offset is -3px. In an appearance choice or a decoration choice, the offset is 2px.

### The room (signature)
- **Painting:** one 3:4 state of the area. It is never tinted, and it accepts no input. A long press or a drag does not select the image.
- **Caption:** a visually hidden list says in words what each state added. If the painting cannot load, the caption shows in a dashed Parchment panel. The panel text is "The painting of this room could not load, so here it is in words."
- **Miez:** the sitting cat on the left end of the front-room windowsill, as a button (at least 44px). Miez accepts input only while the sill shows above the drawer. The Story sheet also holds the Miez card.
- **Sleeping cat:** in the finished front room (front-room-24), a second cat sleeps on the free left end of the counter. The cat is decorative.
- **Bats:** a rectangular clip on the mended window glass holds the dusk. After each reveal and after every seventh serve, a bat crosses the clip from right to left over 2.6s. The wings flap. No bat flies in state front-room-00 or in the courtyard. No bat flies while the page is hidden or under reduced motion.

### "New" pin (signature)
- **Style:** a Parchment pill with a copper-glow dot. The word "New" has weight 600. The change label has weight 400 ("New: the painted dresser"). The tail of the pin touches the edge of the change, so the pin never covers the change.
- **Fit:** the pin uses the side of its mark that fits without covering the area switch. On short screens, the frame can move enough to keep the mark visible, within the edges of the painting. At a side edge, the pin slides sideways, and the tail stays on the mark. If the pin has no room, it hides its label.
- **Action:** a tap puts the description of the change in Mara's line. The pin marks only a painted change.

### Area switch
- **Style:** a Parchment group with a Control Line border and the room marker lift. The choices are the short area names ("Front room", "Courtyard").
- **Chosen:** the chosen fill, ink text, weight 600, a 2px inset accent ring, and the pressed choice shadow.
- **Locked:** a dashed Control Line outline inside the choice. The description of the choice names the preparation that opens the area. A tap puts that description in Mara's line.
- **Change:** a new area appears with a fade over 400ms. The choice is a viewing preference, saved apart from the game.

### Paper tickets
- **Wider screens:** Fresh Linen, a hairline border, a 12px radius, and 8px padding. A 36px portrait, the name (13px, 600), and the dishes share the top row. Serve spans the ticket below them.
- **Phones:** 50px tall, a 9px radius, 2px × 3px padding. A 22px portrait sits on the upper-left corner with a ring of the ticket colour. The name shows only to a screen reader. Serve fills the rest of the width.
- **Dishes:** 38px on wider screens, 28px on phones. A Ready Green dot marks a dish that the board can supply. On wider screens, each dish is a 44px target, and a tap opens its item dialog.
- **Dishes below 1024px:** one dish is a 44px target that opens its item dialog. A ticket is too narrow for two 44px dish targets, so two dishes share one target. The dishes show as 26px pictures (22px at 360px and below). A tap on the shared target opens the order sheet "[name]’s order". The order sheet shows each dish as a recipe item. A tap on a dish opens its item dialog. The accessible name of the shared target starts with "[name]’s dishes:". The name then gives each dish and its state.
- **Narrowest tickets:** at 360px and below, the ticket padding is 2px, and Serve has 1px side padding. Each target on a ticket stays at least 44px wide down to 320px.
- **Serve:** "Serve · N" with the 16px coin mark. On phones, it shows "Serve N". If the order cannot be served, the button shows the dashed "not yet" style. On phones, the not-yet style shows only the price and a 14px coin mark. The accessible name is "Serve [name] for N coins".
- **Serve motion:** the dishes fly to the ticket over 600ms, 80ms apart. A copy of the ticket shows one thank-you line from the neighbour. At 1.5s, the copy fades and drops 10px over 0.3s. At 1.6s, the next ticket arrives over 450ms. Reduced motion shows the thanks at once. The next ticket then appears after the copy leaves.

### Timber table and runners
- **Table:** a timber-tabletop variant covers the table, centred. The variant is 1536px wide at 1024px of screen width and above. Below 1024px of screen width, the variant is 1024px wide. Wider screens give the table a 14px radius and the resting table shadow. Phones give the table a 12px radius.
- **Runner:** a Scalable Vector Graphics (SVG) strip. The pattern in the strip repeats only the seamless source rectangle of the runner. The rectangle is x 161, width 503, in master pixels. The strip is 14px tall on wider screens and 8px tall on phones. Two strips frame the top and the bottom of the board.

### Board and tiles
- **Board:** six columns by seven rows of alternating tiles. Each tile has the tile lift, a 6px radius, and 5px padding (3px on phones). An empty cell shows a 4px Smoke dot at 30% opacity.
- **Blocked spaces:** four edge cells show dusty crate, sack, crock, and linen pictures from the transparent board-clutter atlas. Webs cover them until the first preparation. Four edge cells show an ordinary food picture with old twine and a nail over it. A blocked tile has a distinct inset boundary. The wrappers look unlike food and the twine leaves the food visible. Every blocked tile stays in the keyboard path. Its name and rule are in its accessible label. The board label counts only usable empty spaces.
- **States:** hover draws a 2px inset outline in Selected Clay (Candle Amber in dark mode). Selection draws a 3px inset outline. A hint pulses a 4px Teal Focus inset outline three times.
- **Ingredient sources:** a 17px badge in the corner. The badge has an action-coloured disc, a tile-coloured rim, and a plus in the On-Action colour. One tap on a source takes one ingredient and selects the source.
- **Keyboard:** the board is one Tab stop. Arrow keys move between spaces. Home and End go to the ends of the row. With Control, they go to the first and the last space. Escape clears the selection.
- **Motion:** a merged item settles over 180ms from 82% scale. The first of each dish arrives over 700ms with a small tilt.

### Mara's line, the offer, and the selected item
These three parts share one place under the board. The place is at least 62px tall on wider screens.
- **Mara's line:** the 38px portrait of Mara (28px below 1024px), the live status line, and "Find a match". At 720px and below, the opening line is shorter, and the note for a selected item does not name the item.
- **Offer:** if the story section is not on screen and no tile is selected, Mara offers the next preparation only when all its requirements are met. The offer shows the preparation name, "Ready when you are.", and a primary Pay button. The Story item of the bar then carries the copper dot. So only one Pay button shows at a time.
- **Selected item:** the item picture, its name, and its rule line ("Source of …", "Two make …", or "Final dish"). The item picture is 44px (40px below 1024px). Below 411px, the item picture is 34px. At 360px and below, the item picture and the rule line do not show. At 720px and below, if the name takes two lines, the rule line does not show. The actions follow. A source has one primary Take button per earned output. Each button has the output picture and its name, such as "Take Dough". The chosen output has an inset On-Action ring and a pressed state. Keyboard focus uses the Teal Focus ring, and the inset ring stays visible with it. Store and the 44px clear button follow. A dish has Store and "Sell · N" (secondary). Sell is instant.
- **Upgraded source:** above 1023px, the source name, Store, and Clear occupy the first row. Two or three equal-width Take buttons occupy a second row. Each Take button is at least 64px tall and has a 24px output picture. The rule line does not show. At 1023px and below, the selection does not change the height of the strip, so the board does not move under the finger. The name row does not show. The equal-width Take buttons, Store, and Clear share one row. Each Take button is at least 44px tall. It shows a 22px output picture above the output name in 11px type. Its accessible name stays "Take" and the output name. The controls fit at 360px without horizontal scroll.

### Story, recipe book, and pantry
- **Wider screens:** these are sections of the docked panel between hairlines. They are not cards. The story section shows "Our little bistro", the chapter, the preparation, its requirement list, and its Pay button. Requirement rows use 13px Inter, tabular figures, ink for totals, and muted text for status. The rows wrap within the column. They add no motion or colour code. Neighbour quests and Journal share one link row. Journal has the accessible name "Open the story journal". The save state and progress count follow. The recipe book is an accent link with the bat sprite and the "N of 30 dishes discovered" line.
- **Phones:** each opens as a sheet from the bar. The pantry sheet shows the slots in six columns.
- **Pantry slots:** the slots are square Parchment tiles of at least 44px. They have a hairline border, a 9px radius, and 5px padding. Empty slots are dashed and transparent.
- **Cloche:** an unmade dish is a transparent slot with a dashed Control Line border. The slot shows a Smoke cloche and "Not yet". The cloche has a dashed dome, a knob, and a plate, at the 1.7 stroke.

**The Covered Dish Rule.** The game does not preview unearned dishes or room changes. An unmade dish shows only as a "Not yet" cloche. Each room change shows only after its preparation is paid. A locked area shows only its name and the preparation that opens it. The next level reward is an explicit exception: it shows its level, XP threshold, and exact coin amount. Active requests and quest offers also show their required food pictures and names so that the player can plan a delivery.

Generator upgrades have no preview. Before payment, the story, Mara's line, and the source controls name no future tier or output. After payment, the story completion message names each source and its new output. The Take buttons show all earned outputs, including an output that the player has not yet taken. The recipe book keeps the cloche until the player makes the dish. The room reveal keeps its sequence.

Cost details opens the existing dialog or phone sheet. It names the current preparation and its work scope. Materials and supplies, Labour, and Total have separate coin rows. Estimated person-hours describe the work scale, with an explicit no-timer explanation. This text can describe the planned work but does not show an unearned painting or source upgrade. Close and Escape return to the cost control. On phones they restore the Story sheet first. The details add no extra row to the desktop story panel.

### The reveal (signature motion)
- **Order:** the reveal starts after the story of a paid preparation. Where the kitchen is a drawer (1023px and below), the drawer lowers by itself over 0.6s. The board then does not accept input.
- **Repaint:** the room switches to the changed area. The new painting replaces the old painting in the same place. The change uses opacity and an 8px blur over 1.2s, with an expo ease-out.
- **Pin:** the pin lands on the change over 450ms, and focus moves to the pin. Mara's line shows the text of the change.
- **Return:** after 1.4s, the drawer rises again, and a bat crosses the window.
- **Safety:** the game saves the preparation before the story opens. The reveal cannot charge or reward the player again. Reduced motion shows the new state at once.

### Navigation
- **Wider screens:** there is no navigation. The House book is a Fresh Linen button in the masthead with a ledger icon.
- **Phone bar:** the bar is Parchment, 56px tall plus the safe area, with a hairline on its top edge. Story, Recipes, Pantry, and House book share the width. Each has a 24px authored icon over a 13px Hearth Ink label. The Story item carries the copper dot while a preparation is ready. The Recipes item carries the candle dot while new dishes wait.

### Dialogs
- **Style:** dialogs are Parchment with an 18px radius and 26px padding. A dialog is at most 560px wide. It has a headline title and a 44px close button.
- **Bottom sheets (720px and below):** a bottom sheet has full width and is up to 88% of the viewport height. It has 20px padding plus the safe area and a top border only.
- **Focus:** a dialog opens on its close button. The story dialog opens on Continue. Each confirmation dialog opens on its safe choice. When an open dialog changes, focus moves to the new title, without a ring. The decoration editor opens on its checked radio. Apply, Cancel, Escape, and Close return focus to the slot in the House book that opened the editor.
- **Story:** a 120px portrait (82px on phones) and the line at 16px. Back, the line count, and Continue follow. After a payment, the last line reads "See what changed". The sheet then closes, and the reveal runs.

### Neighbour quests

Story has a Neighbour quests link with the number of active requests and offers. The link opens the existing dialog or phone sheet. It adds no ticket or control above the board. The three ordinary tickets keep their positions.

Each quest is a section between hairlines. A 44px portrait sits beside the request title and neighbour name. The food rows show the exact quantity and the amount on the board. Each row opens ingredient help. The coin reward follows. Read request and Deliver are separate controls. Deliver has the dashed disabled style until the board holds every required item. The text explains that pantry items must return first. Titles, text, reward figures, and controls use the existing Inter, ink, muted, gold, action, and focus tokens.

A temporary-source offer names its space requirement before Accept. Its delivery opens a cleanup review that lists the board and pantry supplies separately, with their space numbers. Keep items has initial focus. Deliver and return supplies confirms the action. Cancel, Close, and Escape return to the quest heading. The completion scene returns to the quest list heading. An unsaved session has a visible warning and Retry save.

The journal starts with Neighbours. Each portrait row opens an optional introduction. Finished quests have opening and completion replay controls before the preparation entries. Quest scenes and introductions use the existing portrait, dialogue, Back, and Continue controls. Return, Close, and Escape restore focus to their quest heading or journal entry. Closing the quest sheet returns focus to its visible Story link or to the phone Story button. These additions have no animation.

### Level rewards

The House book starts with Level rewards, before Decorations. It shows the current level, total XP, progress to the next level, and the next supported coin reward. Earned rewards are simple rows between hairlines. Each row shows its level and exact coin amount, with a primary Claim button or the word Claimed. Claims move focus to the section heading. One persistent status region announces each result. A failed save shows the unsaved session and Retry save. After the last reward, the panel says whether rewards remain to claim. It does not promise another reward.

The desktop and phone House book controls carry a copper dot while a reward is available. Their accessible names give the count. Closing the book and reloading keep the dot while rewards remain. The dot uses the existing coin face and parchment ring. The panel uses the existing dialog, section, button, ink, muted, and focus styles. It adds no motion.

### Decoration choices

The House book has a Decorations section before Appearance. Each unlocked row shows a cropped painting, its slot name, its saved finish, and Change. A locked row shows the preparation that opens it, with a dashed bottom edge. The rows use the parchment, ink, control, and focus tokens.

Change opens a preview in the same dialog. Native radio controls name both finishes. The saved option has the text "Saved choice". A large crop shows the pending finish. Apply and Cancel are separate buttons. Cancel, Escape, and Close return to the row and restore its focus. Apply returns only after a successful save. If the write fails, the preview stays and Retry shows with an error message. Reduced motion does not change the selection.

The three slots are Tableware, Courtyard table cloth, and Final flowers. The defaults are the Blue bowls, the Red embroidery, and the Wildflowers. The alternatives are the Green bowls, the Blue embroidery, and the Lilacs. Two full scene edit masters supply the alternatives. A rectangular region samples only the earned detail. The region has the same coordinates in the room, the thumbnail, and the preview. This keeps the painted perspective and background. It does not add free-standing object sprites. The original room states do not change. A region does not cover the change of another preparation.

### Inputs / Fields
- **Segmented choice:** the Appearance setting is a Flour Dust track with a Control Line border and 44px options. The checked option takes the chosen fill, weight 600, a 2px inset accent ring, and the pressed choice shadow.

## Do's and Don'ts

### Do:
- **Do** use only the 33 registered Portable Network Graphics (PNG) masters in public/assets/original. Load only their variants from public/assets/variants.
  - The 25 room masters are front-room-00 to front-room-12, front-room-17, front-room-24, courtyard-13 to courtyard-16, and courtyard-18 to courtyard-23.
  - The two decoration masters are decoration-front and decoration-courtyard.
  - The six other masters are menu-atlas, board-clutter, portraits, mascots, timber-tabletop, and embroidered-runner.
- **Do** paint each room state as a complete 3:4 painting, 1536 by 2048, opaque. Keep every pixel outside the change the same as the state before it.
- **Do** ship room states as AVIF and WebP at 768 and 1536px wide, AVIF first. Ship the timber as AVIF and WebP at 1024 and 1536px wide. Ship the decoration paintings as WebP at 1536px wide. Ship the transparent atlases and the runner as WebP.
- **Do** keep the neighbours in working village dress: Mara, Ilie, and Sorin in Romanian dress, and Eszter in Székely dress.
- **Do** draw every control icon as an authored vector with a 1.7 stroke and round caps and joins.
- **Do** give every interactive boundary `--control-line` and keep every target at least 44px.
- **Do** keep the wordmark as the top-level heading (h1) of the page.
- **Do** keep one Pay button on screen at a time.
- **Do** recompute `--cell` and the visible room together if either changes. Check 1440×900, 390×844, and 390×800.
- **Do** respect reduced motion. Reduced motion removes every animation and transition. Reduced motion keeps every outcome and line of text.
- **Do** use the house words: the board, the pantry, and a preparation. Call an ingredient source by its own name (the Flour bin). Players take, merge, serve, sell, store, and pay.

### Don't:
- **Don't** preview unearned dishes or room changes (The Covered Dish Rule). Show the next level reward as specified above.
- **Don't** darken, tint, or filter food, portraits, a room painting, or the timber.
- **Don't** paste room objects onto a room painting as sprites. Paint a new state instead. The cats and the bat are the only sprites over the room.
- **Don't** cover the room with interface on wider screens. Only the pin and the area switch sit on it.
- **Don't** let the pin cover the change that it marks.
- **Don't** use a visual identity, art, audio, fonts, or geometry that this project did not make or license.
- **Don't** use Grenze Gotisch for anything except the wordmark.
- **Don't** show an unaffordable action as a faded colour. Use the dashed "not yet" style.
- **Don't** let the coin figures touch the wordmark at any width.
- **Don't** put Story, Recipes, Pantry, or the House book in the phone masthead.
- **Don't** repeat the whole runner bitmap. Don't tile the timber vertically. Both actions show seams.
- **Don't** use emoji or Unicode characters as icons.
