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
    height: "50px"
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

Scary Snacks is a warm Transylvanian bistro at dusk. The room is the home of the game and its reward. One gouache painting shows each area as the completed preparations leave it. The painting fills the screen behind everything.

The kitchen is a parchment drawer over the room. On phones, the drawer is half open. On wider screens, the drawer is one parchment panel beside the room. Each paid preparation repaints the room.

On phones, the drawer lowers by itself. The new painting then replaces the old painting in the same place.

The setting is homely and lit by lamps. The eerie parts stay at the window: black cats on the sill and bats in the dusk. The user chose the setting, the title, the cats, the bats, and the village dress of the neighbours. The interface looks hand-made.

Paper tickets carry the requests of the neighbours. The board rests on timber between cross-stitch runner strips. The small details are authored. These are a copper coin with a crescent moon and a cat on the wordmark baseline.

The other details are a copper-glow "New" pin, dashed "not yet" outlines, and dashed covered dishes in place of unmade dishes. Light mode uses cream and parchment with plum and dark brown ink. Dark mode uses walnut and plum with ivory and candle amber. The System choice follows the device.

**Key Characteristics:**
- The room is one full-height 3:4 painting for each area. On wider screens, only the pin, the area switch, and unlocked finish switches cover it.
- The kitchen is one parchment surface. It holds three paper tickets, the board on timber, and Mara's line. On wider screens, it also holds the story and the recipe book.
- Each preparation has its own complete painted state. The game never pastes room objects onto a painting. Only the cat and bat sprites sit over it.
- The signature motion is the reveal. The room repaints in place, and the pin lands on the change. On phones, the drawer lowers first.
- Food, portraits, mascots, rooms, timber, and the runner are gouache bitmaps made for this project. Every control icon is an authored vector.
- The two themes are fully authored. A theme is never an inversion of the other theme.

## Colors

The palette is warm and has low saturation. Each theme has one action colour. That colour is on every primary action. Dark mode uses warm walnut and plum neutrals. It never uses cool grey.

### Primary
- **Plum Brandy** (plum-brandy): the light-mode action and accent colour. It fills Deliver, Pay, Take, and the other primary buttons. It colours links, the chapter name, and the ring of the chosen area. It also colours the border of a hovered control. Text on it is Light On-Action (light-on-action).
- **Candle Amber** (candle-amber): the dark-mode action colour. It fills primary buttons and draws the selected-cell outline. It also gives every cat a faint rim glow. Text on it is Dark On-Action (dark-on-action).
- **Candle Glow** (dark-accent): the dark-mode accent for links, hover tints, the chosen-area ring, and the danger outline.

### Secondary
- **Copper** (copper): the light-mode coin figures, the coin rim, and the crescent moon of the coin. Copper Coin Face (light-coin-face) fills the coin.
- **Copper glow dots** use the coin face. The "New" pin, the Story item, and the Recipes item each have one dot. The dot of the pin and the dot of Recipes add a candle glow. The Story dot has a Parchment ring only.
- **Dark Gold** (dark-gold): the dark-mode coin figures and coin face. Dark Coin Rim (dark-coin-rim) colours the rim and the moon.

### Tertiary
- **Teal Focus** (light-focus / dark-focus): the focus ring and the hint pulse. Nothing else uses it. It is the only cool hue in the system.
- **Ready Green** (light-ready / dark-ready): the small dot on a ticket dish when the board already holds every portion of it.
- **Selected Clay** (light-selected): the selected-cell outline and the tile hover in light mode. In dark mode, Candle Amber does this job.

### Neutral
- **Cream Plaster / Walnut Dusk** (light-page / dark-page): the page and the phone masthead. The browser also uses this colour as its theme colour.
- **Parchment / Lamplit Walnut** (light-panel / dark-panel): the drawer, the docked panel, the pin, and the area switch. It also fills the phone bar and the dialogs. From 1024px, the whole page background is Parchment.
- **Fresh Linen / Plum Lacquer** (light-surface / dark-surface): the paper tickets, the Options button, journal entries, and recipe items. In light mode, Fresh Linen is also the chosen fill (`--chosen`).
- **Flour Dust / Hearth Ash** (light-inset / dark-inset): secondary buttons and the choice track. It also fills the Miez card in the Story sheet and the current step of a chain. Portraits use it as the backing.
- **Warm Burl** (dark-chosen): the dark-mode chosen fill, for the checked appearance and the chosen area.
- **Board Tiles / Oiled Oak** (light-tile-a, light-tile-b / dark-tile-a, dark-tile-b): the alternating checkerboard. In dark mode, the tiles are lighter than the panels, so the board looks lit.
- **Hearth Ink / Ivory** (light-ink / dark-ink): body text, headings, the pin, and the phone bar labels.
- **Smoke** (light-muted / dark-muted): secondary text, the unchosen area names, and "not yet" labels. Its contrast is at least 4.5:1 on the page and on panels.
- **Hairline** (light-line / dark-line): ticket edges and the top edge of the phone bar. It also draws the section dividers in the docked panel. These lines are decorative.
- **Control Line** (light-control-line / dark-control-line): every interactive boundary, the drawer grip, and every dashed "not yet" outline. Its contrast is at least 3:1 against the page.

### Named Rules
**The One Accent Rule.** Each theme has exactly one action colour: Plum Brandy in light mode and Candle Amber in dark mode. Coins are copper and gold. Focus is teal. No other colour marks something that the player can press.

**The Untouched Plate Rule.** Keep food, portraits, room paintings, and timber in their original colours. Blocked board tiles have the specified 20% red overlay. Dark mode changes the interface colours.

## Typography

**Display Font:** Grenze Gotisch (with serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** Grenze Gotisch is the readable Germanic blackletter that the user asked for. Inter is the font for all other text.

### Hierarchy
- **Display** (600, clamp(43px, 3.2vw, 48px), 1): the wordmark only, from 1024px. Below 1024px, the wordmark uses the display-phone size.
- **Headline** (600, 21px, 1.3, -0.025em): section headings and dialog titles, such as "Our little bistro". The chapter title of the story section uses the same weight at 19px in the accent colour.
- **Title** (600, 19px, 1.4, -0.025em): the preparation name, settings sections, recipe chains, and the Appearance legend.
- **Title small** (600, 15px, 1.25): the name of the selected item under the board. It also sets the Miez card and the recipe book title, at a line height of 1.4.
- **Figure** (600, 24px, 1, tabular numerals): the coin total. It is 21px below 1024px.
- **Body** (400, 14px, 1.7): dialog copy and control labels. Mara's line is 14px at 1.45 (13px at 1.35 below 1024px). Story dialogue is 16px at 1.75 (14px at 720px and below).
- **Body small** (400, 13px, 1.65): the story copy, Deliver, the area names, and the ticket name (600). It also sets the offer, the item actions, and the bar labels.
- **Label** (400, 12px, 1.5): the chapter number, the save state, and the "N of 24 done" count. Screen readers hear "N of 24 preparations done". It also sets the rule line of the selected item, the pin, and Deliver on phones.

### Named Rules
**The Shop Sign Rule.** Grenze Gotisch appears once per screen, as the wordmark. Every other heading is Inter at weight 600.

**Text sizes.** General interface text is at least 12px. Ticket count badges use 10px. Source output labels use 11px on phones.

## Layout

The screen is "The room and the drawer". The room and the kitchen share the screen. The room never scrolls.

**The room.** Each area has one painting for each state. The paintings are 3:4 and opaque. The game shows the state of the highest completed preparation in that area. A picture element offers AV1 Image File Format (AVIF) first, then WebP, at 768 by 1024 and 1536 by 2048.

The sizes value is `(max-width: 1023px) 100vw, max(50vw, 75vh)`. The browser downloads only the current state. While a paid story plays, the next painting downloads before the reveal.

The frame places the latest change near the middle of the visible room, a little low. The pin then has room above the change. Two numbers (`--fx`, `--fy`) give the focus of the change. The frame never shows past the edges of the painting. A change of focus moves over 0.9s.

The area switch sits in a lower corner of the visible room. The top of the switch is 64px above the lower edge of the visible room. The switch stays on the side away from the change. In the front room, the switch always stays on the left, away from Miez.

**Wider screens (1024px and up).** The room is fixed on the left at full height. The docked panel takes `max(50vw, 620px)` on the right. The panel holds, from top to bottom:
- The masthead, with 18px 24px 12px padding. The tagline shows only from 1600px.
- The three tickets, in three equal columns 12px apart.
- The drawer body: the kitchen column, then the side column, 20px apart.

The kitchen column is as wide as the board plus 28px. It holds the timber table and Mara's line, 12px apart. The side column has a hairline on its left and 20px of padding. It holds the story and the recipe book as sections between hairlines. The sections are 14px apart (10px from 1024px to 1365px).

**Phones and tablets (1023px and below).** The masthead is 48px tall on the page colour, with 14px gutters. The room fills the screen below the masthead. The painting is as wide as the screen. The drawer is fixed above the bar, with an 18px radius on its top corners. The content of the drawer is at most 560px wide, centred. From top to bottom, the drawer holds:
- The grip. It is a 40px by 4px bar in Control Line, on a 96px by 44px target. The target reaches over the room.
- The three tickets, 6px apart.
- The timber table with the board.
- Mara's line, or the offer, or the selected item and its actions.

The bar is 56px tall plus the safe area. The safe area is the space that the device reserves at the screen edge. The bar holds Story, Recipes, and Options. The recipe book card and the side column do not show. Each of the three bar items opens a dialog. At 720px and below, these dialogs are bottom sheets.

**The lowered drawer.** The grip lowers the drawer. The drawer then shows the whole painting. The tickets stay in view, 68px above the bar. The drawer moves over 0.6s. While the drawer is lowered, the board does not accept input.

**The height budget.** The cell size and the visible room share one budget:
- Wider screens: `--cell: clamp(44px, min(calc((var(--panel-w) - var(--side-w) - 116px) / 6), calc((100dvh - 400px) / 7)), 96px)`, with 4px gaps.
- Phones: `--cell: clamp(44px, min(calc((100vw - 40px) / 6), calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7)), 60px)`, with 3px gaps. The value of `--drawer-chrome` is 156px. The room shows at least 29.5dvh above the drawer when the cell size allows it. The unit dvh is one percent of the dynamic viewport height.

**Short screens.** A screen of 1023px wide or less and 600px tall or less is short. On a short screen, the room, the drawer, and the bar are not fixed. They follow each other in the page, and the page scrolls. The room is 240px tall. The grip does not show. A change to this layout clears the lowered drawer state, so the kitchen accepts input after rotation.

**Bottom sheets.** At 720px and below, dialogs rise from the bottom edge.

**The masthead.** The cat, the wordmark, the tagline, and the coin figures share one baseline. The wordmark and the coins never touch. Below 411px, the word "coins" does not show once the total reaches 1,000. At 720px and below, a total of 10,000 or more shows in short form, for example "12.3K".

The short form follows the page language. It rounds down, so it never shows more coins than the player has. Screen readers always get the exact total.

### Named Rules
**The Open Room Rule.** On wider screens, no interface covers the room, except the pin, the area switch, and unlocked finish switches. On phones, the drawer covers only the lower part of the room. The frame keeps the latest change in the visible part.

**The One Screen Rule.** The cell size and the visible room share one height budget. If you change one of them, recompute the other. The tickets, the whole board, and Mara's line then stay on the first screen at 1440×900 and 390×844.

**The Thumb Rule.** On phones, the bottom bar holds Story, Recipes, and Options. The masthead never holds them.

## Elevation & Depth

The system uses layers. The room is the deepest layer. The parchment lies over the room. On wider screens, the panel shades its own edge toward the room.

The panel casts no shadow on the painting. On phones, the drawer casts a short shadow up onto the room. The tickets and the timber rest on the parchment with small contact shadows. Inside the parchment, tonal layers and hairlines separate the parts.

A state change uses an inset outline, not more shadow.

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
- **Carried dish** (`filter: drop-shadow(0 7px 5px #17101a65)`): the dish under the pointer (74px) and each delivered dish in flight.
- **Cat glow** (`filter: drop-shadow(0 0 1px #e8b58e80) drop-shadow(0 3px 10px #e8b58e30)`): dark mode only, on the wordmark cat and on every cat in the room.
- **Pin glow** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 3px #e8b58eb3`): the copper dot of the "New" pin.
- **Candle dot** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 2px #e8b58e99`): the new-dish dot on the Recipes item.

### Named Rules
**The Lamplight Rule.** Shadows are warm and soft. A halo with no offset is only for candle glow. Three things have one: the rim of a cat, the dot of the pin, and the new-dish dot. None of them moves.

**The Clean Canvas Rule.** No shadow, gradient, or tint falls on a room painting. The docked panel shades its own edge instead.

## Shapes

Corners grow with the size of the surface. A nested shape uses a smaller radius than the shape around it.
- **Tile** (6px): board tiles, area choices, appearance choices, and the current step of a chain.
- **Control** (9px): buttons, the area switch, the Options button, phone tickets, journal entries, recipe items, and bar items.
- **Card** (12px): desktop tickets and the phone timber table.
- **Panel** (14px): the desktop timber table.
- **Pin** (14px): the "New" pin, a pill 28px tall. Its tail is a rotated 10px square with a 2px radius.
- **Dialog** (18px): every dialog, and the top corners of the drawer and of each bottom sheet.

Borders are 1px. Hairlines separate content. Control Line outlines what the player can press. A dashed outline means "empty" or "not yet". It marks an unaffordable action, a locked area, or an unmade dish. A dashed panel in place of the room means that the painting did not load.

Portraits are circles. Food and mascots keep their own transparent outlines. The room clips only to rectangles: the window glass and each decoration region. A bat flies behind the glass.

## Components

### Buttons
Buttons are solid and warm. Every button target is at least 44px tall.
- **Shape:** slightly rounded (9px).
- **Primary:** in light mode, the fill is Plum Brandy with Light On-Action text. In dark mode, the fill is Candle Amber with Dark On-Action text. The weight is 600, and the padding is 11px × 15px. Hover brightens the button by 7%. A press moves the button down 1px.
- **Not yet:** an action that the player cannot afford has a transparent fill. The border is a dashed Control Line, and the text is Smoke. The button is never a dimmed colour.
- **Unavailable:** if the kitchen cannot open, three parts have 50% opacity and do not accept input. They are the Options button, the recipe book, and the bar items. The game dims no other button.
- **Secondary:** the fill is Flour Dust, the text is ink, and the border is a 1px Control Line.
- **Danger:** a transparent fill with an accent outline and accent text. Only the reset action uses this style. A confirmation always follows.
- **Pay:** the story shows the current and required coins, and the quests delivered out of the quests that the preparation needs. Each row says "Complete" or "Need N". A blocked source placement states the space needed. Pay stays disabled with the dashed not-yet style until every requirement is met.

  The button reads "Pay · N" with the 16px coin mark. Its accessible name is "Pay N coins: [preparation]" and its description is the requirement list. Pay and the Cost details text button share one 44px row with a 10px gap. Pay fills the remaining width.

  Cost details has the accessible name "Work and cost".
- **Text button:** an underlined accent link at 13px with a 44px target. Find a match, Open the story journal, and Read request use this style. Skip scene, Read now, and Try again also use this style.
- **Focus:** a 3px Teal Focus ring, offset by 3px. Inside a tile, an area choice, the grip, or a bar item, the offset is -3px. In an appearance choice or on a finish switch, the offset is 2px.

### The room (signature)
- **Painting:** one 3:4 state of the area. It is never tinted, and it accepts no input. A long press or a drag does not select the image.
- **Caption:** a visually hidden list says in words what each state added. If the painting cannot load, the caption shows in a dashed Parchment panel. The panel text is "The painting of this room could not load, so here it is in words."
- **Miez:** the sitting cat on the left end of the front-room windowsill, as a button (at least 44px). Miez accepts input only while the sill shows above the drawer. The Story sheet also holds the Miez card.
- **Sleeping cat:** in the finished front room (front-room-24), a second cat sleeps on the free left end of the counter. The cat is decorative.
- **Bats:** a rectangular clip on the mended window glass holds the dusk. After each reveal and after every third delivery, a bat crosses the clip from right to left over 2.6s. The wings flap. No bat flies in state front-room-00 or in the courtyard. No bat flies while the page is hidden or under reduced motion.

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
- **Wider screens:** Fresh Linen, a hairline border, a 12px radius, and 8px padding. A 36px portrait, the name (13px, 600), and the dishes share the top row. Deliver spans the ticket below them. The tickets show the first three open requests, in authored order. With no open request, one muted 13px line takes the row: what to do next, or that every request is delivered.
- **Phones:** 50px tall, a 9px radius, 2px × 3px padding. A 22px portrait sits on the upper-left corner with a ring of the ticket colour. The name shows only to a screen reader. Deliver fills the rest of the width.
- **Dishes:** 38px on wider screens (30px in a 34px slot when a request needs three kinds of dish). A Ready Green dot marks a dish when the board holds every portion of it. On wider screens, dishes that need several portions have an "n/q" badge at the lower-left corner. The badge uses 10px tabular figures at weight 600, Fresh Linen, and a hairline ring. Phones leave out the badge.
- **Dish target:** the dishes of a ticket are one target, at least 44px tall, that opens the request dialog. Below 1024px, the dishes show as 26px pictures (22px at 360px and below). The accessible name of the target is the request title, then each dish with its quantity and the count on the board.
- **Narrowest tickets:** at 360px and below, the ticket padding is 2px, and Deliver has 1px side padding. Each target on a ticket stays at least 44px wide down to 320px.
- **Deliver:** "Deliver · N" with the 16px coin mark. On phones, it shows "Deliver N". If the board does not hold every portion, the button shows the dashed "not yet" style. On phones, the not-yet style shows only the reward and a 14px coin mark. The accessible name is "Deliver [request] to [name] for N coins".
- **Delivery motion:** the dishes fly to the ticket over 600ms, up to 60ms apart. The delivery notice appears after all dishes arrive. The completion scene stays waiting in Story. The next request arrives on the same ticket over 450ms, 700ms after the delivery. Reduced motion shows the notice at once, and the next ticket appears without motion.

### Timber table and runners
- **Table:** a timber-tabletop variant covers the table, centred. The variant is 1536px wide at 1024px of screen width and above. Below 1024px of screen width, the variant is 1024px wide. Wider screens give the table a 14px radius and the resting table shadow. Phones give the table a 12px radius.
- **Runner:** a Scalable Vector Graphics (SVG) strip. The pattern in the strip repeats only the seamless source rectangle of the runner. The rectangle is x 161, width 503, in master pixels. The strip is 14px tall on wider screens and 8px tall on phones. Two strips frame the top and the bottom of the board.

### Board and tiles
- **Board:** six columns by seven rows of alternating tiles. Each tile has the tile lift, a 6px radius, and 5px padding (3px on phones). An empty cell shows a 4px Smoke dot at 30% opacity.
- **Blocked spaces:** every blocked tile shows an ordinary food picture behind a painted blocker with a transparent center. Four edge cells use crate slats, sack fabric, crock pieces, or linen from the board-clutter atlas. Webs cover them until the first preparation. Four edge cells use old twine and a nail.

  All blockers keep the ingredient visible and use the same matching-merge rule. A blocked tile has a distinct inset boundary and a red overlay at 20% opacity (`rgb(184 38 44 / 20%)`). The overlay sits above the food and blocker art, below the help mark, and clears with the blocker. Every blocked tile stays in the keyboard path.

  Its name, ingredient, and rule are in its accessible label. The board label counts only usable empty spaces.
- **Preparation blockers:** each paid preparation adds two or three contextual blockers, subject to the space and queue rules in `PRODUCT.md`. The preparation-clutter atlas supplies window offcuts, paint supplies, lamp packing, pottery pieces, leaves, seedlings, shingles, recipe papers, wrapped plates, menus, invitations, and flower cuttings. Each batch combines a new picture with familiar clutter or tied food. The new pictures use the same gouache, camera angle, clear margins, and inset tile boundary.

  A tap opens blocker help. The name, accessible label, and status announcement give the work context. The board label also gives the count of blockers that wait. These additions use the existing status and keyboard controls and add no motion.
- **Blocker framing:** each sprite uses an individual square source crop around its visible outer frame. The frame fills the tile near its edge, with a 2px layer inset. The crop keeps its original proportions and stays inside its own atlas cell. Preparation frames are centered on their painted bounds.

  A frame near a cell edge keeps the small offset needed to retain its full silhouette without sampling another cell. The transparent opening stays clear, and the ingredient keeps 70% of the ordinary food box. Do not shrink the ingredient to compensate for excess outer padding.
- **Blocker help:** every initial and preparation blocker has a 16px question mark in its lower-right corner. The authored vector uses the panel fill, ink, and control line. The whole tile remains the touch target. Hover gives the clearing rule.

  A tap selects the tile and puts its name, exact clearing instruction, and Clear selection in the existing strip under the board. The instruction remains visible when item actions or the preparation offer had occupied that strip. Help marks movable matching ingredients with a steady Teal Focus inset outline. All blockers say "Merge another [ingredient] into this blocked space."

  Accessible labels describe the marked cells. The selected tile refers to the visible instruction. Help adds no dialog, vertical row, motion, or game-state change. Escape, Clear selection, or a new item selection dismisses it.
- **States:** hover draws a 2px inset outline in Selected Clay (Candle Amber in dark mode). Selection draws a 3px inset outline. A hint pulses a 4px Teal Focus inset outline three times.
- **Ingredient sources:** a 17px badge in the corner. The badge has an action-coloured disc, a tile-coloured rim, and a plus in the On-Action colour. One tap on a source takes one ingredient and selects the source.
- **Keyboard:** the board is one Tab stop. Arrow keys move between spaces. Home and End go to the ends of the row. With Control, they go to the first and the last space. Escape clears the selection.
- **Motion:** a merged item settles over 180ms from 82% scale. The first of each dish arrives over 700ms with a small tilt.

### Mara's line, the offer, and the selected item
These three parts share one place under the board. The place is at least 62px tall on wider screens.
- **Mara's line:** the 38px portrait of Mara (28px below 1024px), the live status line, and "Find a match". At 720px and below, the opening line is shorter, and the note for a selected item does not name the item.
- **Offer:** Mara offers a ready preparation if the story section is off screen and no tile is selected. The offer shows the preparation name, "Ready when you are.", and a primary Pay button. The Story item of the bar then carries the copper dot.
- **Selected item:** the item picture, its name, and its rule line ("Source of …", "Two make …", or "Final dish"). The item picture is 44px (40px below 1024px). Below 411px, the item picture is 34px. At 360px and below, the item picture and the rule line do not show.

  At 720px and below, if the name takes two lines, the rule line does not show. The actions follow. A source has one primary Take button per earned output. Each button has the output picture and its name, such as "Take Dough".

  The chosen output has an inset On-Action ring and a pressed state. Keyboard focus uses the Teal Focus ring, and the inset ring stays visible with it. The 44px clear button follows. A dish has only the clear button.
- **Upgraded source:** above 1023px, the source name and Clear occupy the first row. Two or three equal-width Take buttons occupy a second row. Each Take button is at least 64px tall and has a 24px output picture. The rule line does not show.

  At 1023px and below, the selection does not change the height of the strip, so the board does not move under the finger. The name row does not show. The equal-width Take buttons and Clear share one row. Each Take button is at least 44px tall.

  It shows a 22px output picture above the output name in 11px type. Its accessible name stays "Take" and the output name. The controls fit at 360px without horizontal scroll.

### Story and recipe book
- **Wider screens:** these are sections of the docked panel between hairlines. They are not cards. The story section starts with the chapter title, objective, and steps. Any waiting scene follows.

  The preparation, requirement list, and Pay button complete the section. The Story sheet keeps the title "Our little bistro" and shows "Chapter N · [title]" in its first line. Requirement rows use 13px Inter, tabular figures, ink for totals, and muted text for status. The rows wrap within the column.

  They add no motion or colour code. Journal has the accessible name "Open the story journal". The save state and progress count follow. The recipe book is an accent link with the bat sprite and the "N of 30 dishes discovered" line.
- **Phones:** each opens as a sheet from the bar.
- **Complete chain:** when all six dishes of a chain are discovered, its book heading shows a 14px check and "Complete" after the chain name. They use the Label size at weight 600 in Ready Green. The heading reads "[Chain], complete" to screen readers. The mark has no notice and earns nothing. No other place shows it.
- **Covered dish:** an unmade dish is a transparent slot with a dashed Control Line border. The slot shows a Smoke covered dish and "Not yet". The covered dish is a plate under a dashed dome cover with a knob, at the 1.7 stroke.

**The Covered Dish Rule.** The game does not preview unearned dishes or room changes. An unmade dish shows only as a "Not yet" covered dish. Each room change shows only after its preparation is paid. A locked area shows only its name and the preparation that opens it. Tickets and the request dialog show their required food pictures and names, so that the player can plan a delivery. A blocked ingredient shows on the board, but its recipe book entry stays covered until the player takes or makes that dish. Waiting requests do not show until they take a ticket.

Generator upgrades have no preview. Before payment, the story, Mara's line, and the source controls name no future tier or output. After payment, the story completion message names each source and its new output. The Take buttons show all earned outputs, including an output that the player has not yet taken. The recipe book keeps the dish covered until the player makes it. The room reveal keeps its sequence.

Cost details opens the existing dialog or phone sheet. It names the current preparation and its work scope. Materials and supplies, Labour, and Total have separate coin rows. Estimated person-hours describe the work scale, with an explicit no-timer explanation.

This text can describe the planned work but does not show an unearned painting or source upgrade. Close and Escape return to the cost control. On phones they restore the Story sheet first. The details add no extra row to the desktop story panel.

### The reveal (signature motion)
- **Order:** the reveal starts after the story of a paid preparation. Where the kitchen is a drawer (1023px and below), the drawer lowers by itself over 0.6s. The board then does not accept input.
- **Repaint:** the room switches to the changed area. The new painting replaces the old painting in the same place. The change uses opacity and an 8px blur over 1.2s, with an expo ease-out.
- **Pin:** the pin lands on the change over 450ms, and focus moves to the pin. Mara's line shows the text of the change.
- **Return:** after 1.4s, the drawer rises again, and a bat crosses the window. Then a closing scene, the finale, or an arrival scene that the payment earned opens, unless another dialog is open.
- **Safety:** the game saves the preparation before the story opens. The reveal cannot charge or reward the player again. Reduced motion shows the new state at once.

### Navigation
- **Wider screens:** there is no navigation. Options is a Fresh Linen button in the masthead with a sliders icon.
- **Phone bar:** the bar is Parchment, 56px tall plus the safe area, with a hairline on its top edge. Story, Recipes, and Options share the width. Each has a 24px authored icon over a 13px Hearth Ink label. The Story item carries the copper dot while a preparation is ready. The Recipes item carries the candle dot while new dishes wait.

### Dialogs
- **Style:** dialogs are Parchment with an 18px radius and 26px padding. A dialog is at most 560px wide. It has a headline title and a 44px close button.
- **Bottom sheets (720px and below):** a bottom sheet has full width and is up to 88% of the viewport height. It has 20px padding plus the safe area and a top border only.
- **Focus:** a dialog opens on its close button. The story dialog opens on Continue. Each confirmation dialog opens on its safe choice. When an open dialog changes, focus moves to the new title, without a ring.
- **Story:** a 120px portrait (82px on phones) and the line at 16px. Back, the line count, and Continue follow. After a payment, the last line reads "See what changed". The sheet then closes, and the reveal runs. "Skip scene", Close, and Escape also close the sheet and start the reveal. A scene that the payment earned opens after the reveal.

### Chapter story

On wider screens, the story section uses a 19px accent heading for the chapter title. From 1024px to 1365px, the heading uses 16px to keep long titles on one line. In the Story sheet, the chapter line is the accent line under the sheet title. The objective follows in 12px muted text.

The chapter steps follow on one line: one 18px by 6px pip for each preparation of the chapter, then the muted 12px label. The label is "Chapter N" in the story section and "N of 4 done" in the sheet. A done pip is filled with the accent colour. The current pip has an accent outline.

A later pip has the dashed Control Line edge of "not yet". The list has the accessible name "Chapter N preparations". Each pip gives the preparation name and its state to screen readers. The label is hidden from screen readers.

The steps name no later scene and show no room change.

A waiting scene is one line under the chapter steps, above the hairline of the preparation. The 44px target of its button reaches into the space above and below the line. It holds a short 13px line and the "Read now" text button. The line is "Chapter N is complete.", "The supper can begin.", "News has reached the bistro.", or, for a preparation scene or a quest completion scene, "[First speaker] has more to say."

The accessible name of the button names the scene. On phones, the row is in the Story sheet. The row has no motion and no dot.

A closing scene has the dialog title "Chapter N complete: [title]". The finale, a preparation scene, and a quest completion scene have the title of their finale, preparation, or quest. Each waiting scene uses the story portrait, dialogue, Back, line count, and Continue. A "Skip scene" text button with a 44px target follows the controls.

The completion message shows the payoff, ending, preparation room change, or delivery result. A waiting scene opens at its saved line. If the saved line is past the end of the scene, a muted 14px notice above the portrait says "Someone lost the thread. The conversation starts again from the beginning." If a line save fails, a bordered error box appears under the completion message.

It states that the session is not saved and the player can continue to read. The box appears once for each scene and does not take focus. The last line reads "Next scene" when another scene waits, and "Back to the kitchen" otherwise. From the journal it reads "Return".

After the reveal of the payment that earned it, the scene opens and focus moves to Continue. Close and Escape leave the scene waiting. When the scene dialog closes, focus returns to the control that opened it. If Read now is no longer present, focus returns to the Journal link on wider screens or the Story button on phones.

This also applies when the player closes a later scene in the same queue.

The journal has a Chapters section after the finished quests. Each open or complete chapter is a section between hairlines with the heading "Chapter N · [title]". A running chapter shows its opening context, its goal in muted text, and its later preparations as a muted list with "Next" or "Not yet". A complete chapter shows its payoff.

The neighbour help line is muted. Done preparations are journal entries with the name of their room change, for example "New: lamps lit". A done preparation whose scene waits says "New scene" instead. The closing scene and the finale are journal entries that say "New scene" or "Replay".

A completed quest's "Read completion" entry says "New scene" while its scene waits, and the neighbour's name after that. These additions have no animation.

### Requests

A tap on the dishes of a ticket opens the request dialog. Its title is the request title. A 44px portrait for each person sits beside their names. The opening lines of the request follow in 16px body text.

A line by another speaker starts with that speaker's name. The food rows show the exact quantity and the count on the board. Each row opens ingredient help, which returns to the request. The coin reward follows in gold, then Deliver ("Deliver · N" with the coin mark) and one muted line: "Delivery uses dishes on the board. There is no deadline."

Deliver has the dashed disabled style until the board holds every portion. Deliver closes the dialog and starts the delivery motion.


Visitor requests use the same tickets, dialog, food counts, reward, and delivery controls. Adrian, Monica, Janos, and Ionatan use a separate transparent two-by-two portrait atlas. Its cells are Adrian at the top left, Monica at the top right, Janos at the bottom left, and Ionatan at the bottom right. A second transparent two-by-two atlas holds Vlad and Elisabeta in the top row.

Mina and Avram occupy the bottom row, in that order. The four core portraits use their own atlas. Three transparent two-by-two atlases hold the other ten regulars in row order. The first holds Dochia, Victor, Ana, and Costel.

The second holds Sânziana, Dorian, Ileana, and Cezar. The third holds Cătălina and Bran in its top row, with two empty cells below. Mina and Avram share one request, and its dialog shows both names and portraits. Dialogue uses the portrait of its current speaker.

Each character has an individual square source crop that keeps a consistent face scale and eye line. The crop stays inside its atlas cell and retains headwear and identifying upper-body details. Mara uses the same crop in tickets, dialogue, and her line under the board. Tall hats keep the small eye-line difference needed to retain the hat.

The portraits keep their colours in both themes.

Paint Adrian and Monica with Romanian village headwear and embroidered shirts. Adrian keeps his steel plate cuirass and burgundy cloak. Monica keeps her brown leather scout armour and green cloak. Paint Janos in Hungarian Roma village dress, with his felt hat, indigo waistcoat, plum neckerchief, and walking staff. Keep natural adult faces and no caricature.

The journal starts with Neighbours: the core characters, then the regulars in order of arrival. A neighbour row has a 44px portrait, a text column, and a muted count on the right, with 12px gaps. The text column holds the name (600), then the trade and the favourite chains in 12px muted text ("Favourites: Warm kitchen and Bread counter"). The count says "N quests", or "New scene" while an arrival scene waits.

A row opens the waiting arrival scene, or else the introduction. A regular who has not arrived is a row with a dashed border, a transparent background, a 44px dashed circle, and the muted words "Not yet". Traveller rows follow, with a 44px portrait and two equal text columns: names align left, and roles align right. Long names and roles wrap within their columns.

Finished quests have opening and completion replay controls before the chapters. Quest scenes and introductions use the existing portrait, dialogue, Back, and Continue controls. Return, Close, and Escape restore focus to their quest heading or journal entry. Closing the quest sheet returns focus to its visible Story link or to the phone Story button.

These additions have no animation.

### Delivery notices

A delivery notice is a temporary text message, also called a toast.
The notice shows the delivery result and any save warning.
The status region uses polite announcements.
The notice does not take focus or accept pointer input.
After the last ticket is delivered, focus moves to Read now in Story, or to the phone Story button, if no selected board cell can receive focus.

Each notice remains for 4.2 seconds, then fades over 300ms.
Its entrance uses a 300ms fade and scale from 92%.
Reduced motion removes both animations and removes the notice after 4.2 seconds.
Multiple notices form a vertical stack with 8px gaps.

At 1024px and above, the stack sits 20px from the right and bottom edges.
Each notice has a maximum width of 340px.
Below 1024px, the stack sits 10px below the masthead and has centered text.
Its width is the smaller of 92vw and 360px.

The notice uses the panel fill, ink text, and a 1px line border.
It uses the card radius and shared shadow.
Its padding is 10px vertically and 14px horizontally.
Text uses 14px type with a line height of 1.4.

### Finish switches

A finish that a quest has unlocked switches where it stands in the room. The switch is a transparent button over the crop of its detail, at least 44px each way. A 26px badge sits on its upper-right corner. The Fresh Linen disc has a Coin Rim ring and two ink arrows that indicate a switch.

Hover and keyboard focus draw a 2px dashed Coin Face outline around the detail. The accessible name is "[Detail]: [current finish]. Switch to [next finish]". A tap applies the next finish after the save succeeds, and the status line names the new finish. Focus stays on the switch.

The switch shows only in the area that the room shows, and only while its detail is in the room. The switch stays hidden and cannot take focus if the painting fails. It also needs a visible 44px square target inside the room crop and above the drawer. Lowering the drawer restores switches whose targets become visible.

It adds no motion.

### Options

Options shows the save state and any applicable Retry saved game or Retry save control. Its other sections are Appearance, Kitchen sounds, Your saved game, About Scary Snacks, and A fresh start. The sections use the existing dialog, section, button, ink, muted, and focus styles.

### Inputs / Fields
- **Segmented choice:** the Appearance setting is a Flour Dust track with a Control Line border and 44px options. The checked option takes the chosen fill, weight 600, a 2px inset accent ring, and the pressed choice shadow.

## Design instructions

### Required actions
- Use only the 40 registered Portable Network Graphics (PNG) masters in public/assets/original. Load only their variants from public/assets/variants.
  - The 25 room masters are front-room-00 to front-room-12, front-room-17, front-room-24, courtyard-13 to courtyard-16, and courtyard-18 to courtyard-23.
  - The two decoration masters are decoration-front and decoration-courtyard.
  - The 13 other masters are menu-atlas, red-wine, board-clutter, preparation-clutter, portraits, visitor-portraits, guests, regulars-1, regulars-2, regulars-3, mascots, timber-tabletop, and embroidered-runner.
- Paint each room state as a complete 3:4 painting, 1536 by 2048, opaque. Keep every pixel outside the change the same as the state before it.
- Ship room states as AVIF and WebP at 768 and 1536px wide, AVIF first. Ship the timber as AVIF and WebP at 1024 and 1536px wide. Ship the decoration paintings as WebP at 1536px wide. Ship the transparent atlases and the runner as WebP.
- Keep the neighbours in working village dress: Mara, Ilie, and Sorin in Romanian dress, and Eszter in Székely dress.
- Draw every control icon as an authored vector with a 1.7 stroke and round caps and joins.
- Give every interactive boundary `--control-line`. Keep every target at least 44px.
- Keep the wordmark as the top-level heading (h1) of the page.
- Keep one Pay button on screen at a time.
- Recompute `--cell` and the visible room together if either changes. Check 1440×900, 390×844, and 390×800.
- Respect reduced motion. Reduced motion removes every animation and transition. Reduced motion keeps every outcome and line of text.
- Use the house words: the board and a preparation. Call an ingredient source by its own name (the Flour bin). Players take, merge, deliver, and pay.

### Prohibited actions
- Do not preview unearned dishes or room changes (The Covered Dish Rule).
- Do not darken, tint, or filter food, portraits, room paintings, or timber. Keep the specified 20% red overlay on blocked board tiles.
- Do not paste room objects onto a room painting as sprites. Paint a new state instead. The cats and the bat are the only sprites over the room.
- Do not cover the room with interface on wider screens. Only the pin, the area switch, and unlocked finish switches sit on it.
- Do not let the pin cover the change that it marks.
- Do not use a visual identity, art, audio, fonts, or geometry that this project did not make or license.
- Do not use Grenze Gotisch for anything except the wordmark.
- Do not show an unaffordable action as a faded colour. Use the dashed "not yet" style.
- Do not let the coin figures touch the wordmark at any width.
- Do not put Story, Recipes, or Options in the phone masthead.
- Do not repeat the whole runner bitmap. Do not tile the timber vertically. Both actions show seams.
- Do not use emoji or Unicode characters as icons.
