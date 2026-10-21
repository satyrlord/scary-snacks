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
    width: "max(50vw, 620px)"
  drawer:
    backgroundColor: "{colors.light-panel}"
    textColor: "{colors.light-ink}"
    rounded: "18px 18px 0 0"
    height: "calc(var(--cell) * 7 + 18px + 152px)"
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
    size: "clamp(44px, min(calc((var(--panel-w) - var(--side-w) - 116px) / 6), calc((100dvh - 432px) / 7)), 96px)"
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

In this document, a wider screen is 1024px wide or more. A phone is a screen 1023px wide or less, and this includes tablets. An atlas is one image that holds many small pictures. The text names the width when a rule uses another limit. The drawer moves only on a phone that is taller than 600px. A short screen (see Layout) is a phone that is 600px tall or less, and its drawer does not move.

Scary Snacks is a warm Transylvanian bistro at dusk. The room is the home of the game and its reward. One gouache painting shows each area as the completed preparations leave it. The painting fills the screen behind all other parts.

The kitchen is a parchment drawer over the room. On phones, the drawer is half open. On wider screens, the drawer is one parchment panel beside the room. Each paid preparation repaints the room. Where the drawer moves, it lowers by itself. The new painting then replaces the old painting in the same place.

The setting is a homely room with lamps. The eerie parts stay at the window: black cats on the sill and bats in the dusk. The owner fixed the setting, the title, the cats, the bats, and the village dress of the neighbours. The interface looks hand-made.

Paper tickets carry the quests of the neighbours. The board rests on timber between cross-stitch runner strips. The interface has these small hand-made details:
- a copper coin with a crescent moon
- a cat on the wordmark baseline
- a copper-glow "New" pin
- dashed "not yet" outlines
- dashed covered dishes in place of unmade dishes

Light mode uses cream and parchment with plum and dark brown ink. Dark mode uses walnut and plum with ivory and candle amber. Dark mode is the default, from the first paint. The System choice follows the device.

**Key Characteristics:**
- The room is one full-height 3:4 painting for each area.
- The kitchen is one parchment surface. It holds three paper tickets, the recovery ticket while that quest is open, the board on timber, and Mara's line. On wider screens, it also holds the story and the recipe book.
- Each preparation has its own complete painted state.
- The signature motion is the reveal. The room repaints in place, and the pin lands on the change. Where the drawer moves, it lowers first.
- Food, portraits, mascots, rooms, timber, and the runner are gouache bitmaps made for this project. Every control icon is a vector drawn for this project.
- The two themes are fully drawn. A theme is never an inversion of the other theme.

## Colors

The palette is warm and has low saturation. Each theme has one action colour. That colour is on every primary action. Dark mode uses warm walnut and plum neutrals. It never uses cool grey.

### Primary
- **Plum Brandy** (plum-brandy): the light-mode action and accent colour. It fills Deliver, Pay, Take, and the other primary buttons. It colours links, the chapter name, and the ring of the chosen area. It also colours the border of a hovered control. Text on it is Light On-Action (light-on-action).
- **Candle Amber** (candle-amber): the dark-mode action colour. It fills primary buttons and draws the selected-cell outline. It also gives every cat a faint rim glow. Text on it is Dark On-Action (dark-on-action).
- **Candle Glow** (dark-accent): the dark-mode accent for links, hover tints, the chosen-area ring, and the danger outline.

### Secondary
- **Copper** (copper): the light-mode coin figures, the coin rim, and the crescent moon of the coin. Copper Coin Face (light-coin-face) fills the coin.
- **Copper glow dots** use the coin face. The "New" pin, the Story item, and the Recipes item each have one dot. The dots of the pin and of Recipes add a candle glow. The Story dot has a Parchment ring only.
- **Dark Gold** (dark-gold): the dark-mode coin figures and coin face. Dark Coin Rim (dark-coin-rim) colours the rim and the moon.

### Tertiary
- **Teal Focus** (light-focus / dark-focus): the focus ring and the hint pulse. No other part uses it. It is the only cool hue in the system.
- **Ready Green** (light-ready / dark-ready): the small dot on a ticket dish when the board already holds every portion of it. It also colours the check of a complete chain.
- **Selected Clay** (light-selected): the selected-cell outline and the tile hover in light mode. In dark mode, Candle Amber does this job.

### Neutral
- **Cream Plaster / Walnut Dusk** (light-page / dark-page): the page and the phone masthead. The browser also uses this colour as its theme colour.
- **Parchment / Lamplit Walnut** (light-panel / dark-panel): the drawer, the docked panel, the pin, and the area switch. It also fills the phone bar and the dialogs. From 1024px, the whole page background is Parchment.
- **Fresh Linen / Plum Lacquer** (light-surface / dark-surface): the paper tickets, the Options button, journal entries, and recipe items. In light mode, Fresh Linen is also the chosen fill (`--chosen`).
- **Flour Dust / Hearth Ash** (light-inset / dark-inset): secondary buttons and the track of a segmented choice. It also fills the Miez card in the Story sheet and the current step of a chain. Portraits use it as the backing.
- **Warm Burl** (dark-chosen): the dark-mode chosen fill, for the checked segmented choice and the chosen area.
- **Board Tiles / Oiled Oak** (light-tile-a, light-tile-b / dark-tile-a, dark-tile-b): the alternating checkerboard. In dark mode, the tiles are lighter than the panels, so the board looks lit.
- **Hearth Ink / Ivory** (light-ink / dark-ink): body text, headings, the pin, and the phone bar labels.
- **Smoke** (light-muted / dark-muted): secondary text, the unchosen area names, and "not yet" labels. Its contrast is at least 4.5:1 on the page and on panels.
- **Hairline** (light-line / dark-line): ticket edges and the top edge of the phone bar. It also draws the section dividers in the docked panel. These lines are decorative.
- **Control Line** (light-control-line / dark-control-line): every interactive boundary, the drawer grip, and every dashed "not yet" outline. Its contrast is at least 3:1 against the page.

### Named Rules
**The One Accent Rule.** Each theme has exactly one action colour: Plum Brandy in light mode and Candle Amber in dark mode. Coins are copper and gold. Focus is teal. No other colour marks something that the player can press.

**The Untouched Plate Rule.** Keep food, portraits, and timber in their original colours. Blocked board tiles have the specified 20% red overlay. Dark mode changes the interface colours only. Only the night tint of the room (see The night) darkens a painting, and it never covers the board, the tickets, or a portrait.

## Typography

**Display Font:** Grenze Gotisch (with serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** Grenze Gotisch is a readable Germanic blackletter font. Inter is the font for all other text. Both fonts are self-hosted variable fonts.

### Hierarchy
- **Display** (600, clamp(43px, 3.2vw, 48px), 1): the wordmark only, from 1024px. Below 1024px, the wordmark uses the display-phone size.
- **Headline** (600, 21px, 1.3, -0.025em): section headings and dialog titles, such as "Our little bistro".
- **Title** (600, 19px, 1.4, -0.025em): the preparation name, settings sections, recipe chains, and the Appearance and Motion legends.
- **Title small** (600, 15px, 1.25): the name of the selected item under the board. It also sets the Miez card and the recipe book title, at a line height of 1.4.
- **Figure** (600, 24px, 1, tabular numerals): the coin total. It is 21px below 1024px.
- **Body** (400, 14px, 1.7): dialog copy and control labels. Mara's line is 14px at 1.45 (13px at 1.35 below 1024px). Story dialogue is 16px at 1.75 (14px at 720px and below).
- **Body small** (400, 13px, 1.65): the story copy, Deliver, the area names, and the ticket name (600). It also sets the offer, the item actions, and the bar labels. The ticket title uses the Label size in the accent colour.
- **Label** (400, 12px, 1.5): the chapter number, the save state, and the "N of 24 done" count. Screen readers hear "N of 24 preparations done". It also sets the rule line of the selected item, the pin, and Deliver on phones.

### Named Rules
**The Shop Sign Rule.** Grenze Gotisch appears once per screen, as the wordmark. Every other heading is Inter at weight 600.

**Text sizes.** General interface text is at least 12px. Ticket count badges use 10px.

## Layout

The room and the kitchen share the screen. The room has no scroll of its own.

**The room.** Each area has one painting for each state. The paintings are 3:4 and opaque. The game shows the state of the highest completed preparation in that area. A picture element offers AV1 Image File Format (AVIF) first, then WebP, at 768 by 1024 and 1536 by 2048.

The sizes attribute is `(max-width: 1023px) 100vw, max(50vw, 75vh)`. The browser downloads only the current state. While a paid story plays, the next painting downloads before the reveal.

The frame places the latest change near the middle of the visible room, a little low. The pin then has room above the change. Two numbers (`--fx`, `--fy`) give the focus of the change. The frame never shows past the edges of the painting. A change of focus moves over 0.9s.

The area switch sits in a lower corner of the visible room. The top of the switch is 64px above the lower edge of the visible room. The switch stays on the side away from the change. In the front room, the switch always stays on the left, away from Miez.

**Wider screens (1024px and up).** The room is fixed on the left at full height. The docked panel takes `max(50vw, 620px)` on the right. The panel holds these parts, from top to bottom:
- The masthead, with padding of 18px 24px 12px. The tagline shows only from 1600px.
- The three tickets, in three equal columns 12px apart, and a fourth column while the recovery quest is open.
- The drawer body: the kitchen column, then the side column, 20px apart.

The kitchen column is as wide as the board plus 28px. It holds the timber table and Mara's line, 12px apart. The side column has a hairline on its left and 20px of padding. It holds the story and the recipe book as sections between hairlines. The sections are 14px apart (10px from 1024px to 1365px).

**Phones (1023px and below).** The masthead is 48px tall on the page colour, with 14px gutters. The room fills the screen below the masthead. The painting is as wide as the screen. The drawer is fixed above the bar, with an 18px radius on its top corners. The content of the drawer is at most 560px wide and centred. The drawer holds these parts, from top to bottom:
- The grip. It is a 40px by 4px bar in Control Line, on a 96px by 44px target. The target reaches over the room.
- The three tickets, 6px apart, and the recovery ticket as a fourth while it is open.
- The timber table with the board.
- Mara's line, or the offer, or the selected item and its actions.

The bar is 56px tall plus the safe area. The safe area is the space that the device reserves at the screen edge. The bar holds Story, Recipes, and Options. The recipe book card and the side column do not show. Each of the three bar items opens a dialog.

**The lowered drawer.** The grip is a button. Its accessible name is "Lower the kitchen to see the room", and then "Raise the kitchen". The grip lowers the drawer, and the drawer then shows the whole painting. The tickets stay in view, 68px above the bar. The drawer moves over 0.6s. While the drawer is lowered, the board does not accept input.

**The height budget.** The cell size and the visible room share one budget:
- Wider screens: `--cell: clamp(44px, min(calc((var(--panel-w) - var(--side-w) - 116px) / 6), calc((100dvh - 432px) / 7)), 96px)`, with 4px gaps.
- Phones: `--cell: clamp(44px, min(calc((100vw - 40px) / 6), calc((100dvh - var(--head-h) - var(--bar-h) - var(--safe) - var(--drawer-chrome) - 18px - 29.5dvh) / 7)), 60px)`, with 3px gaps. The value of `--drawer-chrome` is 152px. The room shows at least 29.5dvh above the drawer when the cell size allows it. The unit dvh is one percent of the dynamic viewport height.

**Short screens.** On a short screen, the room, the drawer, and the bar are not fixed. They follow each other in the page, and the page scrolls. The room is 240px tall. The grip does not show. A change to this layout clears the lowered drawer state, so the kitchen accepts input after rotation.

**The masthead.** The cat and the wordmark share one baseline. The wordmark, clock, and purse never overlap. The tagline uses the available space and ends with an ellipsis when necessary. The day clock sits before the coins: "Day N · hh:mm" in 13px tabular figures. The day uses ink at weight 600, and the time uses Smoke.

Below 1024px, the day stands over the time in 12px, right-aligned. From 1024px to 1365px, the day also stands over the time, and Options shows only its icon. On wider screens, a day or absolute coin total of 1,000 or more puts the clock above the purse. Options stays beside both rows. Below 360px, the clock also sits above the purse, with day and time on one line.

At 480px and below, the wordmark is 32px and the gap between header controls is 8px. The coin unit word does not show. At 410px and below, the wordmark is 28px, the masthead gutters are 12px, and its gap is 8px. The coin mark and the exact accessible total stay available.

A purse below zero shows a minus sign (−), for example "−12". Screen readers hear "A debt of 12 coins". At 720px and below, an absolute coin total or day number of 10,000 or more uses short form. For example, 12,300 shows as "12.3K". The accessible clock name always gives the exact day and time.

The short form follows the page language. It rounds down, so it never shows more coins than the player has. Screen readers always get the exact total. When the total grows, the coin mark turns over for 0.7s, and a "+N" figure rises over 0.9s.

**The skip link.** The first Tab stop is the link "Skip to the board". It moves focus to the board.

### Named Rules
**The Open Room Rule.** On wider screens, no interface covers the room, except the pin, the area switch, and unlocked finish switches. On phones, the drawer covers only the lower part of the room. The frame keeps the latest change in the visible part.

**The One Screen Rule.** The cell size and the visible room share one height budget. If you change one of them, recompute the other. The tickets, the whole board, and Mara's line then stay on the first screen at 1280×800, 1440×900, 1920×1080, and 390×844.

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
- **Pressed choice** (`box-shadow: 0 1px 3px #2a1d2024`): the checked segmented choice and the chosen area, under a 2px inset accent ring.
- **Carried dish** (`filter: drop-shadow(0 7px 5px #17101a65)`): the dish under the pointer (74px) and each delivered dish in flight.
- **Cat glow** (`filter: drop-shadow(0 0 1px #e8b58e80) drop-shadow(0 3px 10px #e8b58e30)`): dark mode only, on the wordmark cat and on every cat in the room.
- **Pin glow** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 3px #e8b58eb3`): the copper dot of the "New" pin.
- **Candle dot** (`box-shadow: 0 0 0 2px <panel>, 0 0 8px 2px #e8b58e99`): the new-dish dot on the Recipes item.

### Named Rules
**The Lamplight Rule.** Shadows are warm and soft. A halo with no offset is only for candle glow. Three things have one: the rim of a cat, the dot of the pin, and the new-dish dot. None of them moves.

## Shapes

Corners grow with the size of the surface. A nested shape has a smaller radius than the shape around it.
- **Tile** (6px): board tiles, area choices, segmented choices, and the current step of a chain.
- **Control** (9px): buttons, the area switch, the Options button, phone tickets, journal entries, recipe items, and bar items.
- **Card** (12px): wider-screen tickets and the phone timber table.
- **Panel** (14px): the wider-screen timber table.
- **Pin** (14px): the "New" pin, a capsule 28px tall. Its tail is a rotated 10px square with a 2px radius.
- **Dialog** (18px): every dialog, and the top corners of the drawer and of each bottom sheet.

Borders are 1px. Hairlines separate content. Control Line outlines what the player can press. A dashed outline means "empty" or "not yet". It marks an unaffordable action, a locked area, or an unmade dish. A dashed panel in place of the room means that the painting did not load.

Portraits are circles. Food and mascots keep their own transparent outlines. The room clips only to rectangles: the window glass, its two upper panes, and each decoration region. A bat flies behind the glass, and the night sky shows behind the upper panes.

## Components

### Buttons
Buttons are solid and warm. Every button target is at least 44px tall.
- **Shape:** slightly rounded (9px).
- **Primary:** in light mode, the fill is Plum Brandy with Light On-Action text. In dark mode, the fill is Candle Amber with Dark On-Action text. The weight is 600, and the padding is 11px × 15px. A pointer that can hover brightens an enabled button by 7%. A touch screen has no hover brightness. A press moves the button down 1px.
- **Not yet:** an action that the player cannot afford has a transparent fill. The border is a dashed Control Line, and the text is Smoke. The button is never a dimmed colour.
- **Unavailable:** if the kitchen cannot open, three parts have 50% opacity and do not accept input. They are the Options button, the recipe book, and the bar items. The game dims no other button.
- **Secondary:** the fill is Flour Dust, the text is ink, and the border is a 1px Control Line. Hover brightens it like Primary.
- **Danger:** a transparent fill with an accent outline and accent text. Only the reset actions use this style. A confirmation always follows.
- **Pay:** Story shows only unmet requirements: the extra coins to earn, the quests to deliver, or the board space to free for a source. Completed requirements have no row. When all are met, one line says "Ready to prepare." Pay stays disabled, with the dashed not-yet style, until the player meets every requirement.

  The button reads "Pay · N" with the 16px coin mark. Its accessible name is "Pay N coins: [preparation]". Its description includes the visible requirement note and the exact coin and quest totals, with source space when needed. Cost details also shows those totals. Pay and the Cost details text button share one 44px row with a 10px gap. Pay fills the remaining width.

  Cost details has the accessible name "Work and cost" and reports its expanded state. Its small chevron points down when the details are closed and up when they are open. The control opens and closes its region and keeps focus.
- **Text button:** an underlined accent link at 13px with a 44px target. Find a match, Journal, and the supper quest opening use this style. Read now, the reply in a delivery notice, and Try again also use this style.
- **Focus:** a 3px Teal Focus ring, offset by 3px. Inside a tile, an area choice, the grip, or a bar item, the offset is -3px. In a segmented choice, the offset is 2px. A finish switch has its own focus outline (see Finish switches).

### The room (signature)
- **Painting:** one 3:4 state of the area. It accepts no input. A long press or a drag does not select the image.
- **Caption:** a visually hidden list says in words what each state added. If the painting cannot load, the caption shows in a dashed Parchment panel. The panel text is "The painting of this room could not load, so here it is in words."
- **Miez:** the sitting cat on the left end of the front-room windowsill, as a button (at least 44px). Miez accepts input only while the sill shows above the drawer. The Story sheet also holds the Miez card.
- **Sleeping cat:** in the finished front room (front-room-24), a second cat sleeps on the free left end of the counter. The cat is decorative.
- **Bats:** a rectangular clip on the mended window glass holds the dusk. A bat crosses the clip from right to left over 2.6s, and its wings flap. `PRODUCT.md` gives when a bat crosses.

### The night
- **Closing dialog:** the closing applies at once. Then the dialog "Closing time" opens with one line, "Day N is over. Mara blows out the lamps and locks the door. Something small stirs under the floorboards." Its actions are Skip, a secondary button, and Watch the night, the primary button, which has focus. While the dialog is open, a dish that the night takes stays drawn in its cell, inset 15%, and a cell that the night changes shows its earlier look.
- **Order:** Watch the night closes the dialog. The tint comes over 400ms. The rat of the room runs across the floor over 2.2s. Then the rats on the board act. When the board rat leaves, the tint goes over 400ms, and the morning dialog opens. On a phone with a movable drawer, the drawer lowers over 600ms before the rat of the room runs, and rises over 600ms before the rats on the board act.
- **Tint:** a Night Indigo layer (`#1b2150`, multiply, 62% opacity) covers the whole room painting, its decorations, and its cats. The tint is the same in both themes. The painting and its decorations stay readable.
- **Night sky:** the night-sky painting fills the two upper panes of the front-room window, behind the glass, and fades in with the tint. The clip is a polygon of the two pane rectangles, measured on the window of states 01 and later. The courtyard and the broken window of front-room-00 show no night sky.
- **Rat of the room:** the scurry poses of the rat of the night, 7% of the painting wide, run from left to right on the floor line of the area (77% down the front room, 93% down the courtyard). The two poses take turns every 100ms, and the sprite bounces. The rat is above the tint. A painting that did not load shows no rat.
- **Rats on the board:** a layer over the page holds a rat at the size of one tile. The thief rat breaks up through the board at its first pick, looks around, scurries to each pick, and grabs it: the dish shrinks and fades over 220ms. It drags its first pick into the rat hole, which then shows in its cell, looks back, and scurries off the nearest side of the board. Șoricescu climbs out at the gift cell, opens his traistă, puts down the gift, which fades in over 300ms, lifts his hat, waves, and scurries off. Without a gift, he climbs out at the bottom-left cell, looks both ways, and goes back down. Two scurry poses take turns every 90ms with a small bounce. A rat that lands squashes for 220ms. The code gives the path and the motion; the poses give only the shapes.
- **No stop:** a watched night plays to its end. The layer over the page takes every tap, and no key reaches the page.
- **Morning dialog:** the dialog "Morning of day N" shows the rat of the night, 88px square in pose 5, beside the report: the upkeep, what the rat did, and the purse or the debt. Its one action is Open the bistro, the primary button, which has focus.
- **Reduced motion and a hidden page:** the closing dialog and the night do not show. The morning dialog opens at once. A page that becomes hidden during the night ends it, and the morning dialog opens.

### "New" pin (signature)
- **Style:** a Parchment capsule with a copper-glow dot. The word "New" has weight 600. The change label has weight 400 ("New: the painted dresser"). The tail of the pin touches the edge of the change, so the pin never covers the change. The touch target of the pin is 44px tall.
- **Fit:** the pin uses the side of its mark that fits without covering the area switch. On short screens, the frame can move enough to keep the mark visible, within the edges of the painting. At a side edge, the pin slides sideways, and the tail stays on the mark. If the pin has no room, it hides its label.
- **Action:** a tap puts the description of the change in Mara's line. The pin marks only a painted change.

### Area switch
- **Style:** a Parchment group with a Control Line border and the room marker lift. The choices are the short area names ("Front room", "Courtyard"). The group has the accessible name "Rooms of the bistro".
- **Chosen:** the chosen fill, ink text, weight 600, a 2px inset accent ring, and the pressed choice shadow.
- **Locked:** a dashed Control Line outline inside the choice. The description of the choice names the preparation that opens the area. A tap puts that description in Mara's line.
- **Change:** a new area fades in from an 8px blur over 400ms. The game saves the choice apart from the game save, as a viewing preference.

### Paper tickets
- **Wider screens:** Fresh Linen, a hairline border, a 12px radius, and 8px padding. A 36px portrait sits beside two lines: the name (13px, 600) and the quest title (12px, accent). Each line ends with an ellipsis if it does not fit. The dishes follow in a row under the portrait, as 32px pictures in 40px by 36px slots. Deliver spans the ticket below them. On hover, the title is underlined. The tickets show the first three open quests, in the order of the game data. The accessible name of a ticket is "[Name]’s quest: [title]". With no open quest, one muted 13px line takes the row, beside the recovery ticket when it is open. On phones, the line is as tall as a ticket. `PRODUCT.md` gives the text of the line.
- **Phones:** 50px tall, a 9px radius, 2px × 3px padding. A 22px portrait sits on the upper-left corner with a ring of the ticket colour. The name and the title do not show. The accessible names of the face and Deliver give them. Deliver fills the rest of the width.
- **Dishes:** 32px on wider screens (30px in a 34px slot when a quest needs more than two kinds of dish). A Ready Green dot marks a dish when the board holds every portion of it. On wider screens, a dish that needs several portions has an "n/q" badge at the lower-left corner. The badge uses 10px tabular figures at weight 600, Fresh Linen, and a hairline ring. Phones leave out the badge.
- **Face target:** the portrait, the name, the title, and the dishes of a ticket are one target, the face, that opens the quest dialog. The face is at least 44px tall and 44px wide. Below 1024px, the dishes show as 26px pictures (22px at 360px and below). The accessible name of the face starts with the quest title. Each dish follows with its quantity and the count on the board.
- **Narrowest tickets:** at 360px and below, the ticket padding is 2px, and Deliver has 1px side padding. Each target on a ticket stays at least 44px wide down to 320px.
- **Deliver:** "Deliver · N" with the 16px coin mark. On phones, a ready Deliver shows only the word "Deliver", at its full width. The fanned dishes of the face give way. If the board does not hold every portion, the button shows the dashed "not yet" style. On phones, the not-yet style shows only the reward and a 14px coin mark. The accessible name is "Deliver [quest] to [name] for N coins".
- **Supper ticket:** the supper quest shows its first three plates and a "+8" count in 12px muted figures, and "Serve" in the place of Deliver, with no coin mark. Serve has the dashed "not yet" style until the board holds every plate. The accessible name is "Serve [quest]". Serve opens the finale at once, without the delivery motion.
- **Booked ticket:** on wider screens, a booked ticket gives its evening in Smoke in the place of the title: "Booked for 20:00" for the evening guest, and "Booked for another evening" for each other booked ticket. The line ends with an ellipsis if it does not fit, as the title does. The accessible name of the face also gives it. Before 20:00, the ticket of the evening guest has the lantern control in the place of Deliver: a 16px lantern vector and "Light the lanterns", with the primary style, or the dashed "not yet" style until the board holds every portion. On phones, the lantern control shows the lantern and the time "20:00". Each other booked ticket has a disabled control in the "not yet" style with a crescent moon and "Later". Its accessible name is "[quest]: booked for another evening". The accessible name of the lantern control is "Light the lanterns: [Name] is booked for 20:00". From 20:00, the evening guest's ticket has Deliver.
- **Recovery ticket:** while the recovery quest is open, the last column of the ticket row holds that quest. Its edge is dashed, because it is an offer and not a campaign quest. The other tickets keep their places. On wider screens, the row has four equal columns. On phones, the recovery ticket shows only its face, and its quest dialog delivers. The three quest tickets share the rest of the row. At 410px and below, the row has 4px gaps and 4px side padding while the recovery ticket shows. Each target on a ticket stays at least 44px wide down to 360px.
- **Delivery motion:** the dishes fly to the ticket over 600ms. Each dish starts 60ms after the one before. The sixth and later dishes start together. The delivery notice appears after all dishes arrive. The next quest arrives on the same ticket over 450ms, 700ms after the delivery. With reduced motion, the notice shows at once, and the next ticket appears without motion.

### Timber table and runners
- **Table:** a timber-tabletop variant covers the table, centred. The variant is 1536px wide at 1024px of screen width and above. Below 1024px of screen width, the variant is 1024px wide. On wider screens, the table has a 14px radius and the resting table shadow. On phones, the table has a 12px radius.
- **Runner:** a Scalable Vector Graphics (SVG) strip. The pattern in the strip repeats only the seamless source rectangle of the runner. The rectangle is x 161, width 503, in master pixels. The strip is 14px tall on wider screens and 8px tall on phones. Two strips frame the top and the bottom of the board.

### Board and tiles
- **Board:** six columns by seven rows of alternating tiles. Each tile has the tile lift, a 6px radius, and 5px padding (3px on phones). An empty cell shows a 4px Smoke dot at 30% opacity.
- **Blocked spaces:** every blocked tile shows an ordinary food picture behind a painted blocker with a transparent centre. Four edge cells use crate slats, sack fabric, crock pieces, or linen from the board-clutter atlas. Webs cover these four cells until the first preparation. Four other edge cells use old twine and a nail.

  All blockers keep the ingredient visible and use the same merge rule: a matching dish of the chain or a recipe partner clears them. A blocked tile has a distinct inset boundary and a red overlay at 20% opacity (`rgb(184 38 44 / 20%)`). The overlay sits above the food and blocker art and below the help mark. The overlay clears with the blocker. Every blocked tile stays in the keyboard path.

  The accessible label of a blocked tile has its name, ingredient, and rule. The board label counts only usable empty spaces.
- **Preparation blockers:** each paid preparation adds two or three contextual blockers. The space and queue rules in `PRODUCT.md` limit this. The preparation-clutter atlas supplies 12 pictures. They show window offcuts, paint supplies, lamp packing, pottery pieces, leaves, seedlings, shingles, recipe papers, wrapped plates, menus, invitations, and flower cuttings. Each batch combines a new picture with familiar clutter or tied food. The new pictures use the same gouache style, camera angle, clear margins, and inset tile boundary.

  A tap opens blocker help. The name, the accessible label, and the status message give the work context. The board label also gives the number of blockers that wait. These parts add no new control and no motion.
- **Rat holes:** a rat hole is a blocker. The rat-hole picture lies under the blocked ingredient, inset 4% in its tile, with the red overlay and the help mark of every blocker. Its name is "Rat hole".
- **Blocker framing:** each sprite uses its own square source crop around its visible outer frame. The frame fills the tile near its edge, with a 2px layer inset. The crop keeps its original proportions and stays inside its own atlas cell. Preparation frames are centred on their painted bounds.

  A frame near a cell edge keeps a small offset. The offset keeps the full silhouette and stays out of the next cell. The transparent opening stays clear, and the ingredient keeps 70% of the ordinary food box. Do not shrink the ingredient to compensate for excess outer padding.
- **Blocker help:** every initial blocker and every preparation blocker has a 16px question mark in its lower-right corner. The vector uses the panel fill, ink, and Control Line. The whole tile is the touch target. Hover gives the clearing rule.

  When the player selects a blocker, the strip under the board shows the name of the blocker, the exact clearing instruction, and Clear selection. Help marks the movable matching ingredients with a 2px dotted Smoke outline at 50% opacity inside each tile. All blockers say "Tap a marked [ingredient] to merge here." A tap on a marked item clears the blocker. Its accessible label names that action.

  The accessible labels describe the marked cells. The selected tile refers to the visible instruction. Help adds no dialog, no vertical row, and no motion. `PRODUCT.md` gives the ways to leave the help.
- **States:** hover draws a 2px inset outline in Selected Clay (Candle Amber in dark mode). Selection draws a 3px inset outline. A selected mergeable dish marks every matching movable dish and blocked destination with a 2px dotted Smoke outline at 50% opacity inside each tile. A source and a final dish mark no target. A hint pulses a 4px Teal Focus inset outline three times. In forced colours, matching targets have an opaque dotted Highlight outline. Keyboard focus stays a solid outline.
- **Ingredient sources:** a 17px badge in the corner. The badge has an action-coloured disc, a tile-coloured rim, and a plus in the On-Action colour. A paid source also shows its take cost in another corner, the lower-left corner on wider screens and the upper-left corner on phones: a 14px coin mark and an 11px figure at weight 600 on a Panel pill with a Control Line ring. The free Herb basket shows no cost.
- **Keyboard:** the board is one Tab stop. Arrow keys move between spaces. Home and End go to the ends of the row. With Control, they go to the first and the last space. Escape clears the selection.
- **Motion:** a merged item settles over 180ms from 82% scale. The first of each dish arrives over 700ms with a small tilt.

### Mara's line, the offer, and the selected item
These three parts share one place under the board. The place is at least 62px tall on wider screens.
- **Mara's line:** the 38px portrait of Mara (28px below 1024px), the live status line, and "Find a match". At 720px and below, the first line is shorter, and the note for a selected item does not name the item.
- **Guide cancellation:** when a guide is active with no selected cell, Mara's line shows a short next-step note and "Stop guide" takes the place of "Find a match". When a cell is selected, the same Stop action takes the place of Clear selection in the item strip. Escape works from the board and either Stop control. Tapping the selected dish or blocker again also ends the guide. A tap on a selected source takes another ingredient.
- **Full board guidance:** a legal merge toward the goal keeps its board cue. Otherwise, a ready delivery that frees space has the 50%-opacity dotted Smoke outline on its ticket button. Starting the guide focuses that Deliver button. For the recovery ticket on a phone, the guide focuses the ticket face, which opens its dialog. If no such delivery is ready, another legal pair or blocker merge uses the board cue. If no action can make room, Mara names the limit and Stop stays visible. The guide never marks a source for a take that cannot fit.
- **Offer:** the offer shows the preparation name, "Ready when you are.", and a primary Pay button. An active guide keeps its Stop control visible in Mara's line instead of the offer. The Story button still marks a ready payment, and Pay stays in the Story sheet. The offer returns when the guide ends. `PRODUCT.md` gives when the offer shows.
- **Selected item:** the item picture, its name, and its rule line ("Two make …", "Cook it with …", or "Final dish"). "Cook it with" names only the recipe partners that the player has made. If the player has made none, the line reads "Cook it with a new dish". A selected source shows its name and a short line that says to tap it again for its ingredient. While a dish guide is active, the rule line gives the requested dish and next action. A visible Stop control takes the place of Clear selection. The board marks the next useful cells with the same dotted outline as matching items. The guide adds no row, and the selected board cell keeps its focus. The item picture is 44px (40px below 1024px). Below 411px, the item picture is 34px. At 360px and below, the item picture does not show.

  At 720px and below, if the name takes two lines, the ordinary rule line does not show. The guide's goal line stays visible. Clear selection or Stop follows the name or rule. A source tile takes an ingredient when the player taps it or presses Enter or Space on it.

  Keyboard focus uses the Teal Focus ring. The 44px Clear or Stop control follows. Selecting a source does not move the board under the finger. The selected item and its control fit at 360px without horizontal scroll. On phone screens taller than 600px, the shared line is 52px high and keeps blocker help and the offer visible.

### Story and recipe book
- **Wider screens:** the story and the recipe book are sections of the docked panel between hairlines. They are not cards. The story section starts with the chapter title, the objective, and the steps. A waiting scene follows, if one exists. A waiting scene is a story scene that the player has earned and not yet read.

  The preparation, the unmet requirement list or ready line, and the Pay button complete the section. The Story sheet keeps the title "Our little bistro" and shows "Chapter N · [title]" in its first line. Requirement rows use 13px Inter and ink text. The ready line uses weight 600. Exact totals in Cost details use tabular figures. The rows wrap within the column.

  The rows add no motion and no colour code. Journal has the accessible name "Open the story journal". The save state and the progress count follow. The recipe book is an accent link with the bat sprite and the "N of 85 dishes discovered" line.
- **Phones:** the story and the recipe book each open as a sheet from the bar.
- **Recipe book navigation:** on every screen size, Close or Escape from an item opened in the book returns to the same book position with focus on that dish. "Show me on the board" closes the dialog, raises a lowered kitchen drawer, and focuses the board step.
- **Complete section:** when the player discovers all the dishes of a chain, or all the mixed dishes, the book heading of that section shows a 14px check. The word "Complete" follows the section name. The mark uses the Label size at weight 600 in Ready Green. Screen readers hear the heading as "[Chain], complete". The mark gives no notice and no reward. No other place shows it.
- **Covered dish:** an unmade dish is a transparent slot with a dashed Control Line border. The slot shows a Smoke covered dish and "Not yet". The covered dish is a plate under a dashed dome cover with a knob, at the 1.7 stroke.

**The Covered Dish Rule.** The game does not preview unearned dishes or room changes. An unmade dish shows only as a "Not yet" covered dish. Each room change shows only after the player pays for its preparation. A locked area shows only its name and the preparation that opens it. Tickets and the quest dialog show their required food pictures and names, so that the player can plan a delivery. A blocked ingredient shows on the board. Its recipe book entry stays covered until the player takes or makes that dish. Waiting quests do not show until they take a ticket.

Each source shows only its stage-1 ingredient. Higher-stage dishes stay covered until the player makes them by merging, apart from quest requirements.

Cost details expands under the Pay row inside Story, after a hairline. It shows the work scope, coin rows for Materials and supplies, Labour, and Total, and the estimated person-hours with a note that there is no timer. The exact requirements follow. The region uses the 13px story copy and tabular figures, with no card and no motion. Pay stays above it and works while it is open.

The details do not show an unearned painting. They start closed for each new preparation and stay open through redraws of that preparation. Both Story views share this state. Opening the details does not change the size or the position of the board.

### The reveal (signature motion)
- **Order:** the reveal starts after the story of a paid preparation. Where the drawer moves, it lowers by itself over 0.6s before the repaint. On a short screen, the repaint starts at once.
- **Repaint:** the room switches to the changed area. The new painting replaces the old painting in the same place. The change uses opacity and an 8px blur over 1.2s, with an expo ease-out.
- **Pin:** the pin lands on the change over 450ms, and focus moves to the pin. Mara's line shows the text of the change.
- **Return:** after 1.4s, the drawer rises again, and a bat crosses the window. Then the next scene that the payment earned opens.
- **Reduced motion:** the new state shows at once.

### Navigation
- **Wider screens:** there is no navigation. Options is a Fresh Linen button in the masthead with a sliders icon.
- **Phone bar:** the bar is Parchment, 56px tall plus the safe area, with a hairline on its top edge. Story, Recipes, and Options share the width. Each has a 24px vector icon over a 13px Hearth Ink label. The Story item carries the copper dot while a preparation is ready or a scene waits. Its accessible name then says "a preparation is ready", "a scene is waiting", or both. The Recipes item carries the candle dot while new dishes wait.

### Dialogs
- **Style:** dialogs are Parchment with an 18px radius and 26px padding. A dialog is at most 560px wide. It has a headline title and a 44px close button.
- **Bottom sheets (720px and below):** a bottom sheet has full width and is up to 88% of the viewport height. It has 20px padding plus the safe area and a top border only.
- **Focus:** a dialog opens on its close button. A scene opens on its title at the top. Each confirmation dialog opens on its safe choice. When an open dialog changes, focus moves to the new title, without a ring.
- **Story:** each scene shows the full transcript. Each turn has a 44px portrait, a 12px gap, and a text column. The speaker name is 13px at weight 600, with 4px below it. Body text is 16px with a 1.75 line height, or 14px at 720px and below. Turns have 18px between them. One completion action follows the transcript, aligned right after 24px. After a payment, "See what changed" closes the sheet and starts the reveal.
- **Item help:** the dish picture (100px, or 120px at 720px and below), one line that says how to get the dish, and the count on the board. The dishes of the chain follow, three to a row; for a mixed dish, its two parts and the dish follow. Each dish shows its name or "Not yet". A part of a recipe also names the mixed dishes that it makes, by name once discovered. If the source is on the board, the button "Show me on the board" closes the dialog. The board then points at the next step.

### Chapter story

On wider screens, the story section uses a 19px accent heading for the chapter title. From 1024px to 1365px, the heading uses 16px to keep long titles on one line. In the Story sheet, the chapter line is the accent line under the sheet title. The objective follows in 12px muted text.

The chapter steps follow on one line. The line has one 18px by 6px pip for each preparation of the chapter, then the muted 12px label. The label is "Chapter N" in the story section and "N of 4 done" in the sheet. A done pip has the accent fill. The current pip has an accent outline.

A later pip has the dashed Control Line edge of "not yet". The list has the accessible name "Chapter N preparations". Each pip gives the preparation name and its state to screen readers. Screen readers skip the label.

The steps name no later scene and show no room change.

A waiting scene is one line under the chapter steps, above the hairline of the preparation. The 44px target of its button reaches into the space above and below the line. The line holds a short 13px text and the "Read now" text button. The text is one of these lines:
- "Chapter N is complete."
- "The supper can begin."
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

A scene shows the complete ordered transcript with a portrait and speaker name for each turn, and one completion action. The dialog can scroll. Focus starts on the title and the scroll starts at the top. Close and Escape leave a waiting scene unread; reopening starts at the top.

The completion message shows the payoff, the room change of the preparation, the arrival, or the news. It comes before the completion action. The finale ending appears below the supper painting. A quest completion scene has no completion message. If a waiting scene opens while the session is not saved, a bordered error box shows under the completion message. It states that the session is not saved and that the player can continue to read. The box does not take focus.

The completion action reads "Next scene" when another scene waits, and "Back to the kitchen" otherwise. From the journal, it reads "Return". The finale uses "See the supper" in each case.

After the reveal of the payment that earned the scene, the next earned scene opens. Close and Escape leave the scene waiting. When the scene dialog closes, focus returns to the control that opened it. If Read now is not present, focus returns to the Journal link on wider screens. On phones, focus returns to the Story button.

The same focus rule applies when the player closes a later scene in the same queue.

The journal shows its current or latest chapter after Unread scenes. Other complete chapters sit in Earlier chapters. Each chapter is a section between hairlines with the heading "Chapter N · [title]". A running chapter shows its opening context and its goal in muted text. It also shows its later preparations as a muted list with "Next" or "Not yet". A complete chapter shows its payoff.

The neighbour help line is muted. Each waiting scene has its entry under Unread scenes. After the player reads it, a preparation entry names its room change, for example "New: lamps lit". A closing scene and the finale say "Replay". A news scene has a Local news section in Earlier conversations. A quest reply moves to Earlier conversations with the quest title and the name of the neighbour. These parts have no animation.

### Quests

The title of the quest dialog is the quest title. A 44px portrait for each person sits beside their names. The first lines of the quest follow in 16px body text.

Character introductions, quest dialogs, quest completion scenes, and journal replays of quests use the parchment texture. The paper stays warm cream with dark brown ink (#3b2a1e) in both themes. The texture repeats at 512px square. Muted text uses #58402e. Controls keep their 44px targets, with dark borders and the light-theme action colours. Other dialogs use the current theme. Forced colours use the system canvas.

Each character introduction shows its individual transparent pencil sketch. Quest openings, replies, and journal replays show the owner's sketch, except that each of the nine cathedral supply quests and the two visitor meal quests shows its accepted scene illustration. The chosen art stays through speaker changes. On a wider dialog, an individual sketch floats to the right at 42% of the reading area, up to 210px wide. At 540px and below, it is centred above the words at 170px wide. Landscape scenes are centred above the words at the reading width, up to 460px, with their natural image proportions. The text and controls remain in normal flow and the dialog can scroll vertically. If an image fails to load, it is removed and all words and controls remain. Local news keeps its existing story layout.

Victor draws the sketches while he waits for his meal. Keep light, steady pencil lines drawn by a practised hand, and accurate anatomy, proportions, and perspective. Facial features are lightly drawn but present: awake people have visible open eyes when the view permits, and sleepers have indicated closed eyelids. Victor's secret crush explains Mara's more detailed face. Match the accepted sketches without adding dense fabric or surface detail.

If more than one character speaks, the lines form an exchange. Each line is a paragraph, 12px from the next. At each change of speaker, the name of the speaker (13px, 600) stands on its own line above the words. Screen readers hear "[Name]:" before the words. The food rows show the exact quantity and the count on the board. Each row opens ingredient help, which returns to the quest. An unmet row also has a 44px Find text button. Its accessible name gives the dish. Find closes the dialog and points to the next board step for another portion. The coin reward follows in gold. Then come Deliver ("Deliver · N" with the coin mark) and one muted line: "Delivery uses dishes on the board. There is no deadline." The supper quest names the guest before each food row, for example "Mara: 1 Cabbage rolls with mămăligă". Its line "The supper pays nothing. Serving it opens the finale." replaces the reward, then come "Serve" and the muted line "One plate for each guest, to each one’s taste. There is no deadline." The muted line of the recovery quest is "Ana returns while the purse runs low. Herbs from the Herb basket are free."

Deliver has the dashed disabled style until the board holds every portion. Deliver closes the dialog and starts the delivery motion.

Visitor quests use the same tickets, dialog, food counts, reward, and delivery controls. The portraits come from atlases. Each portrait atlas is a transparent two-by-two image. The visitor atlas holds Adrian at the top left and Monica at the top right. It holds Janos at the bottom left and Ionatan at the bottom right.

The guest atlas holds Vlad and Elisabeta in the top row. Mina and Avram occupy the bottom row, in that order. The four core characters use their own atlas. Three regular atlases hold the other ten regulars in row order. The first holds Dochia, Victor, Ana, and Costel.

The second regular atlas holds Sânziana, Dorian, Ileana, and Cezar. The third holds Cătălina and Bran in its top row, with two empty cells below. Mina and Avram share one quest, and its dialog shows both names and portraits. Dialogue uses the portrait of its current speaker.

Each character has its own square source crop that keeps a consistent face scale and eye line. The crop stays inside its atlas cell and keeps the headwear and the identifying upper-body details. Mara uses the same crop on tickets, in dialogue, and in her line under the board. A tall hat keeps the small eye-line difference that the hat needs.

The portraits keep their colours in both themes.

Paint Adrian and Monica with Romanian village headwear and embroidered shirts. Adrian also wears his steel plate cuirass and burgundy cloak. Monica also wears her brown leather scout armour and green cloak. Paint Janos in Hungarian Roma village dress, with his felt hat, indigo waistcoat, plum neckerchief, and a staff. Paint natural adult faces. Do not draw a caricature.

The journal starts with Unread scenes in saved waiting order. Each waiting scene has one row with its title and "New scene". Keep "New scene" on one line. If none wait, one muted line says "No unread scenes." The current chapter follows, or the latest chapter after all preparations. Earlier chapters, Earlier conversations, and Neighbours follow as native expandable groups that start closed. Their summaries have a 44px minimum height, 14px vertical padding, and 16px text at weight 600. The groups use the existing line, ink, muted text, and focus ring, with no cards and no animation.

Earlier chapters runs newest first. Earlier conversations keeps one entry for each completed quest, most recently delivered first. Earned news and the read finale stay here too. Waiting scenes appear only under Unread scenes.

Neighbours shows the core characters, then the regulars in order of arrival. A neighbour row has a 44px portrait, a text column, and a muted count on the right. The gaps are 12px. The text column holds the name (600). The trade and the favourite dishes follow in 12px muted text ("Favourites: Mămăligă, Bulz, and Drob"). The count says "N quests".

A neighbour row opens the introduction. Waiting arrival scenes open above, under Unread scenes. A regular who has not arrived is a row with these parts:
- a dashed border and a transparent background
- a 44px dashed circle
- the muted words "Not yet"

Traveller rows follow. A traveller row has a 44px portrait and two equal text columns. The names align left, and the roles align right. Long names and roles wrap within their columns.

Finished quests sit in Earlier conversations. Each quest with a reply has one entry with its title and the name of the neighbour. Its accessible name is "Replay [title]", or "Read [title]" while the reply waits. The page shows Quest then Reply in one transcript. Each part has a 16px heading, and speaker names use level-four headings in the 13px speaker style. The Reply part starts after a 24px gap, an 18px inset, and the 1px line. One sketch or scene illustration and one Return action serve both parts. Return marks only a waiting reply as read. The supper quest has only its opening entry. The recovery quest has no entry.

Return, Close, and Escape keep the open groups and the reading position, and focus the journal entry. If reading moved the entry into a group, that group opens. A read arrival focuses its neighbour. A read single-visit farewell focuses the Unread scenes heading. When the player closes the quest sheet, focus returns to the visible Story link or to the phone Story button.

These parts have no animation.

### Supper painting

The supper painting follows the finale. The dialog title is "The supper". The 3:4 painting is centred, with the card radius, at most min(62dvh, 680px) tall. The finale ending line follows in the completion style, 14px above and 16px below. One primary button ends the dialog: "Back to the kitchen", or "Continue" when the journal or another waiting scene follows. The image has a text alternative that names each guest. The painting is the same in both themes.

After the supper is served, the courtyard shows the supper painting in place of its latest state. Serving turns the room to the courtyard, and the room opens there after a reload. The courtyard then has no finish layers, no finish switches, and no New pin, because the guests sit where the finishes go. The frame centres the long table, 50% across and 55% down. The room caption adds the text alternative of the painting.

### Delivery notices

A delivery notice is a temporary text message, also called a toast.
The notice shows the delivery result and any save warning.
The status region uses polite announcements.
The notice does not take focus.
While the completion scene waits, the notice ends with the text button "Read [Name]’s reply". The button opens the scene and removes the notice. Only a notice with this button accepts pointer input.
After the last delivery, focus moves to Read now in Story when no selected board cell can receive focus.
On phones, focus moves to the Story button instead.

Each notice stays for 4.2 seconds, then fades over 300ms. A notice with a reply stays for 8 seconds. It waits while the pointer or focus is on it, and leaves 4.2 seconds after they leave.
Its entrance is a 300ms fade and a scale from 92%.
With reduced motion, the notice has no animation and leaves after the same time.
Several notices form a vertical stack with 8px gaps.

At 1024px and above, the stack sits 20px from the right edge and the bottom edge.
Each notice has a maximum width of 340px.
Below 1024px, the stack sits 10px below the masthead and has centred text.
Its width is the smaller of 92vw and 360px.

The notice uses the panel fill, ink text, and a 1px line border.
It uses the card radius and the panel lift shadow.
Its padding is 10px vertically and 14px horizontally.
The text is 14px with a line height of 1.4.

### Finish switches

A quest can unlock a finish for a detail of the room. The player switches the finish where the detail stands in the room. The switch is a transparent button over the crop of the detail, at least 44px each way. A 26px badge sits on its upper-right corner. The badge is a Fresh Linen disc with a Coin Rim ring and two ink arrows that show a switch.

Hover and focus draw a 2px dashed Coin Face outline around the detail. The accessible name is "[Detail]: [current finish]. Switch to [next finish]". A tap applies the next finish after the save succeeds, and the status line names the new finish. Focus stays on the switch.

The switch shows only in the area that the room shows, and only while its detail is in the room. If the painting fails, the switch stays hidden and cannot take focus. The switch also needs a visible 44px square target inside the room crop and above the drawer. When the player lowers the drawer, the switches whose targets become visible return.

The switch adds no motion.

### Options

Options shows the save state. It also shows the Retry saved game control or the Retry save control when the state needs one. Its other sections are Appearance, Motion, Kitchen sounds, Your saved game, About Scary Snacks, and A fresh start. The sections use the existing dialog, section, button, ink, muted, and focus styles. Below the last section, one small centered muted line shows the version, for example "Version 1.1.30".

### Inputs / Fields
- **Segmented choice:** the Appearance setting and the Motion setting each use a segmented choice. The track is Flour Dust with a Control Line border. The options are 44px tall. The checked option takes the chosen fill, weight 600, a 2px inset accent ring, and the pressed choice shadow.

## Design instructions

### Required actions
- Use only the 93 registered Portable Network Graphics (PNG) masters in public/assets/original. Load only their variants from public/assets/variants.
  - The 25 room masters are front-room-00 to front-room-12, front-room-17, front-room-24, courtyard-13 to courtyard-16, and courtyard-18 to courtyard-23.
  - The supper master is finale-supper, an edit of courtyard-23 with the guests of the supper.
  - The two decoration masters are decoration-front and decoration-courtyard.
  - The 45 other masters are board-clutter, preparation-clutter, portraits, visitor-portraits, guests, regulars-1, regulars-2, regulars-3, mascots, timber-tabletop, embroidered-runner, parchment-page, 22 character sketches, nine cathedral scenes, and two visitor meal scenes.
  - The four night masters are rat-thief and rat-soricescu, each a grid of four columns and two rows of 512px cells, rat-hole, 1024px square, and night-sky, 2048 by 1024px and opaque.
  - The 16 food atlas masters are food-grain, food-corn, food-herbs, food-dairy, food-poultry, food-vegetables, food-fruits, food-pork, food-beans, food-lamb, food-veal, food-fish, food-soups, food-mains, food-sweets, and food-breads. Each is a grid of four columns and two rows. A dish shows its whole cell, with no measured bounds. A chain atlas holds the source in cell 0 and the dishes in stage order.
- Paint each room state as a complete 3:4 painting, 1536 by 2048, opaque. Keep every pixel outside the change the same as the state before it.
- Ship room states and the supper painting as AVIF and WebP at 768 and 1536px wide, AVIF first. Ship the timber as AVIF and WebP at 1024 and 1536px wide. Ship the decoration paintings as WebP at 1536px wide. Ship the transparent atlases and the runner as WebP. Ship the rat sheets and the night sky as WebP at 1024px wide and the rat hole as WebP at 256px square.
- Ship the parchment as a WebP at its native 1254px square size. Ship the 22 character sketches as transparent WebP at 768px square and the 11 landscape scenes as transparent WebP at 1024px wide.
- Keep the neighbours in working village dress: Mara, Ilie, and Sorin in Romanian dress, and Eszter in Székely dress.
- Draw every control icon as a vector with a 1.7 stroke and round caps and joins.
- Give every interactive boundary `--control-line`. Keep every target at least 44px.
- Keep the wordmark as the top-level heading (h1) of the page.
- Recompute `--cell` and the visible room together if either changes. Check the sizes of The One Screen Rule.
- Respect reduced motion. Reduced motion is the Motion choice Reduced, or the Motion choice System on a device that asks for reduced motion. Reduced motion removes every animation and transition. Reduced motion keeps every outcome and line of text. The Motion choice Full keeps every animation and transition.
- In forced-colours mode, give tiles, primary and secondary buttons, tickets, ticket dishes, area choices, and the pin a system-colour border. Give a blocked tile a 2px dashed border. Give the selected tile and the hovered tile a 3px system-highlight outline.
- Use the house words: the board and a preparation. Call an ingredient source by its own name (the Windmill). Players take, merge, cook, deliver, and pay.

### Prohibited actions
- Do not preview unearned dishes or room changes (The Covered Dish Rule).
- Do not darken, tint, or filter food, portraits, or timber. Keep the specified 20% red overlay on blocked board tiles. Only the night tint covers the room painting.
- Do not paste room objects onto a room painting as sprites. Paint a new state instead. The cats, the bat, and the rat of the night are the only sprites over the room.
- Do not cover the room with interface on wider screens (The Open Room Rule).
- Do not let the pin cover the change that it marks.
- Do not use a visual identity, art, audio, fonts, or geometry that this project did not make or license.
- Do not use Grenze Gotisch for anything except the wordmark.
- Do not show an unaffordable action as a faded colour. Use the dashed "not yet" style.
- Do not let the coin figures touch the wordmark at any width.
- Do not put Story, Recipes, or Options in the phone masthead.
- Do not repeat the whole runner bitmap. Do not tile the timber vertically. Both actions show seams.
- Do not use emoji or Unicode characters as icons.
