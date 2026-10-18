# 001 Room states: art plan

Status: Implemented.

This plan is the companion of [spec 001](001-visible-renovation.md). It defines the painted room states for the "room and drawer" screen. [DESIGN.md](../../DESIGN.md) controls the design of that screen. Each preparation repaints the room itself. Every change has the perspective, the light, and the contact shadows of the painting.

The focus coordinates in the table below follow the accepted paintings and the game data.

## Painted areas

There are two areas. Each state has one 3:4 portrait painting. There are 25 masters in all:

- **Front room:** 15 states. State 00 is the new game. One state follows each of preparations 1 to 12, 17, and 24.
- **Courtyard:** 10 states. One state follows each of preparations 13 to 16 and 18 to 23.

A state shows every change that the player has paid for in its area. The game shows the state for the highest completed preparation in that area.

The masters are opaque 1536x2048 Portable Network Graphics (PNG) images. The build ships AV1 Image File Format (AVIF) and WebP variants at 768x1024 and 1536x2048. Only the current state downloads. The next state preloads while its story plays.

## How each state is made

1. **Base paintings.** Use front-room-00 and courtyard-13 as the base paintings of the two areas.
   Include the composition table for the area in each base request.
   To repaint a base, give the accepted base to the generator as the reference.
2. **Edits.** Use the previous state as the reference for each later state.
   Include a mask if the selected route needs one.
   Composite only the changed region over the previous state, with a soft edge.
   Keep every pixel outside that region unchanged.
   Follow the selected art skill for the permitted edit and composite tools.
3. **Review.** Examine each candidate at full size.
   Check that the change sits on a surface.
   Compare its perspective, light, scale, and shadows with the room.
   Check that nothing outside the changed region moved.
   Check that the painting has no text.
   Follow the acceptance requirements of [generate-game-art](../../.github/skills/generate-game-art/SKILL.md).
   Obtain the acceptance of the user for each master before you request a later state that uses that master.
   Use any acceptance or explicit waiver that the user already gave for that master.

### Fixed in every state

- The windowsill where Miez sits.
- The resident spider under the left bracket of the upper shelf. The painting shows it in every state from state 00. It is not a sprite.
- The counter edge at the bottom. It carries no characters.
- No people, no cats, no text, no letters, and no numbers. The cat sprites are not part of a painting.

## Front room composition (portrait)

Positions are percentages of the painting, measured from the top-left corner. On a phone, the visible view shows about half the height of the painting. The view moves to frame the change of each state.

| Zone | Height | Contents in state 00 |
| --- | --- | --- |
| Ceiling | 0–12% | Dark beams with drying herbs. Two unlit brass lamps at x 26% and x 72%. An empty iron hook beside the herbs at x 10% |
| Upper wall | 12–47% | Left: the embroidered wall hanging at x 4–16%, y 18–38%. Centre: two empty wall shelves at x 36–60%, y 22% and 33%. Right: a square two-casement village window in a deep plaster reveal at about x 64–98%, y 19–46%. The window is old and broken. It has cobwebs and three small spiders. The sill is at y 47% |
| Middle | 40–76% | The teal tiled stove with a small fire at x 18–40%, y 30–76%. A copper rail with dull pans at x 44–60%, y 44–56%. A blank weathered board under the rail at x 44–58%, y 60–76%. The board leans against the wall |
| Low zone | 60–86% | Left: a low cabinet with one lit candle at x 2–18%. The top of the cabinet is at y 62%. Right corner: a dust sheet over stacked chairs at x 72–98%, y 52–86% |
| Counter | 86–100% | The top edge and front of the timber counter. The counter is empty |

## Courtyard composition (portrait)

The measurements are on the accepted courtyard-13, in master pixels (1536x2048).

| Zone | Contents in state 13 |
| --- | --- |
| Left wall, x 0–520 | The cream back wall of the bistro under tiled eaves. The kitchen door is at x 95–245, y 640–1360, with its stone step. The lit window is at x 320–400, y 730–1060. A small broken wooden door hood is over the door at x 15–435, y 470–750 |
| Back, from x 520 | The low stone wall. Its top is at y ≈ 975. Beyond the wall are the village, the church spire, and the hills under the dusk sky |
| Right, x 1215–1536 | The wooden gate ajar between stone posts, at y 940–1300. The walnut tree is across the top right |
| Floor, y 1200–2048 | Swept cobbles with raked leaves. Free space is by the door, along the back wall, and before the gate |

## The 25 states

In the Request column, Base means a base painting. Edit means an edit of the previous state. Focus is the centre of the change. The phone view frames the focus.

| State | After | Request | Change painted | Focus (x, y) |
| --- | --- | --- | --- | --- |
| front-room-00 | new game | Base | The unfinished room as above, at blue hour | 50, 30 |
| front-room-01 | 1 Fix the broken window | Edit (window) | The window has new glass, a cobalt-blue frame, and inner shutters with folk motifs. Every web and small spider is gone. The resident spider stays | 81, 33 |
| front-room-02 | 2 Mend the welcome board | Edit (board) | The board is mended and painted with red folk flowers. It hangs on the wall above its old place | 51, 62 |
| front-room-03 | 3 Set up the pastry shelf | Edit (lower shelf) | A plate of round pastries is on the lower shelf | 46, 34 |
| front-room-04 | 4 Light the front room | Edit (upper room) | Both lamps are lit. Warm light falls on the beams and the wall | 50, 12 |
| front-room-05 | 5 Repair the kitchen worktop | Edit (copper rail) | The pans are polished bright copper | 57, 46 |
| front-room-06 | 6 Bring in market produce | Edit (hook) | A string of red peppers and a braid of garlic hang from the hook. The wall hanging loses its dark-red left strip | 12, 10 |
| front-room-07 | 7 Hang the kitchen shelves | Edit (upper shelf) | Jars of preserves are on the left half of the upper shelf | 40, 17 |
| front-room-08 | 8 Write the first menu | Edit (cabinet top) | A small slate with chalk food drawings leans on the cabinet | 8, 58 |
| front-room-09 | 9 Choose the tableware | Edit (upper shelf) | Blue painted bowls are on the right half of the upper shelf, beside the jars | 49, 22 |
| front-room-10 | 10 Sand the long table | Edit (corner) | The dust sheet is gone. Two restored, traditional painted folk chairs stand in the corner. They are red and gold, with carved bird crests and rush seats | 87, 72 |
| front-room-11 | 11 Make a recipe corner | Edit (cabinet top) | An open recipe notebook and a cup of pencils are beside the candle | 12, 60 |
| front-room-12 | 12 Open the shared table | Edit (corner) | The chairs have moved to the shared table. A small dresser stands in the corner | 87, 70 |
| front-room-17 | 17 Collect family recipes | Edit (wall over cabinet) | Illustrated recipe pages are pinned to the wall between the wall hanging and the notebook | 10, 50 |
| front-room-24 | 24 Welcome the community supper | Edit (window and dresser) | An embroidered towel is over the window. A jug of wildflowers is on the dresser | 80, 34 |
| courtyard-13 | 13 Clear the courtyard | Base | The walled courtyard at dusk. The path is swept clear and empty | 50, 50 |
| courtyard-14 | 14 Plant the herb pots | Edit (by the door) | Three clay pots of herbs are by the kitchen door | 34, 59 |
| courtyard-15 | 15 Repair the door hood | Edit (over the door) | The broken wooden door hood has new shingles | 18, 30 |
| courtyard-16 | 16 Set the outdoor tables | Edit (along the wall) | Two wooden tables stand along the wall. The red painted folk chairs from the front room (states 10 and 11) stand at the tables. The path stays clear. The scene text of preparation 16 names the red chairs | 58, 68 |
| courtyard-18 | 18 Prepare the tasting plates | Edit (tables) | Small painted plates are on both tables | 58, 64 |
| courtyard-19 | 19 Stock the drinks cabinet | Edit (beside the door) | A recessed wall niche (firidă) is under the kitchen window. It holds jugs, cups, glasses, and bottles of socată | 22, 58 |
| courtyard-20 | 20 Print the supper menu | Edit (tables and near floor) | A small illustrated card stands on each table. A long shared trestle table with two benches stands in the near courtyard. The long table has the same plates and its own card. The two small tables stay for shyer guests. The long table first appears in this state, not in states 16 to 19 | 58, 63 |
| courtyard-21 | 21 Send the invitations | Edit (gate, wall top and kitchen door) | Decorations prepare the courtyard for a village celebration. A lit lantern is on the right gate post. Embroidered towels (ștergare) are over both gate posts. Large pots of red geraniums are by the gate. A row of geranium pots is along the top of the back wall. A harvest wreath with ribbons is on the kitchen door | 84, 52 |
| courtyard-22 | 22 Prepare the serving station | Edit (by the door) | A serving table has bread, plates, and covered dishes | 12, 76 |
| courtyard-23 | 23 Add the final flowers | Edit (tables and overhead) | Vases of flowers are on the tables. A string of warm lights crosses the courtyard | 55, 40 |

## Prompts

Use the accepted paintings as the style reference for a base request.
Specify gouache paint and coloured-pencil edges.
Include cream limewashed plaster, dark timber, copper, painted pottery, and blue-hour light.
Keep the perspective and architecture the same as the accepted room.
Exclude people, cats, text, letters, numbers, signs, logos, frames, and interface controls.
Include the composition table for the area.

For an edit, instruct the generator to preserve the reference painting and its style.
Specify the single change from the table above.
Specify the change region if the request has a mask.
Name the surface that supports the changed object.
Describe its contact shadow.

Record the exact prompt in `docs/asset-prompts.json` as the selected art skill requires.

## Route

Use [generate-game-art](../../.github/skills/generate-game-art/SKILL.md) for each request.
Follow the route and the approval rules of that skill.

## Integration

- The "room and drawer" screen shows the states.
  `tools/create-original-data.ts` gives each state its focus coordinates and caption.
- The game finds the state from the completed preparations. The save does not store the state.
- The list `roomPaintings` in `src/engine.ts` names the states that have an accepted painting. Every state is in the list. [PRODUCT.md](../../PRODUCT.md) gives the fallback for a state with no painting.
- To add a painting, follow the steps in [DELIVERY.md "Assets"](../../DELIVERY.md#assets). A new master changes the count in the asset test.
- Spec 001, PRODUCT.md, and DESIGN.md describe the screen.

### Fixed points measured on the states

- Miez sits on the left end of the windowsill. The sill top is 47.2% down the painting. The sprite cell is 8.8% of the painting height. It starts 62.65% across.
- The glass of the mended window (from state 01) is a rectangle. It spans 71% to 90.4% across and 24.5% to 45.5% down. Bats cross the glass. State 00 has no bats.
- In state 24, the sleeping cat lies on the counter top, 83.5% down. It starts 1.05% across.
