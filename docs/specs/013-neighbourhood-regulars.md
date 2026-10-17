# 013: Neighbourhood regulars

Status: Implemented.
The game has the regulars, their arrivals, arrival scenes, portraits, and quests.
The journal lists the neighbours.
Owner: `PRODUCT.md` for the cast, the arrivals, and the quests; `DESIGN.md` for portraits and the neighbours list.

In this spec, a neighbour is a core character or a regular.

## Outcome and scope

The bistro welcomes a growing neighbourhood. New regulars arrive as the renovation progresses.
Each regular has a name, a trade, a portrait, an introduction, two favourite chains, and quests.
The player can find who lives nearby and what they like.

- Keep Mara, Ilie, Eszter, and Sorin as the four core characters. They drive the story,
  the preparations, and their own quest arcs in 005. Regulars add neighbours. They do not replace the core
  characters.
- Only the four core characters are generic neighbours.
  Each regular refers to a horror novel, a horror film, or local folklore.
  The reference uses the name, trade, or one habit.
- Keep unlimited energy, no waiting, and no expiry. A regular never sulks, queues, or charges a penalty.
  Play earns the arrival. Time does not.
- Do not add a currency, purchases, a backend, a dependency, or imported game content.

## Rules

1. The roster has 16 neighbours: the four core characters and 12 regulars. Vlad and Elisabeta are two of the 12 regulars.
2. Arrivals: Dochia, Victor, Ana, and Costel are present from the start, so a new game has eight neighbours.
   Sânziana and Dorian arrive with preparation 4. Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, in that order.
   Cătălina and Bran arrive with preparation 12.
3. Each regular who arrives later records an `arrivesAfter` preparation identifier (ID). The game derives arrival from
   completed preparations and does not save it.
4. Each regular has two authored favourite chains (`prefers`). Each quest of a regular asks for at least one dish
   from those chains. Vlad and Elisabeta like the warm kitchen and the drinks counter. Their quests ask for
   cabbage rolls, goulash, and red wine.
5. Author the taste of each person from their trade and story. Never derive taste from the
   appearance or age of a neighbour. Never derive taste from an inferred ethnic or national identity.
6. Dochia and Costel have five quests each. Victor, Ana, Sânziana, Dorian, Ileana, and Cezar have four. Cătălina and Bran have three. Vlad and Elisabeta have two quests each.
   The quests follow the campaign rules of 005.
7. The arrival of each later regular plays a short original scene. A core character introduces the
   regular. The regular answers. The payment queues the arrival scene after its preparation scene, chapter scene, and finale.
   The scene follows the continuation
   rules of 009. Reading or skipping the scene does not change arrival.
8. The neighbours list in the journal shows the core characters, then the regulars in order of arrival.
   Each arrived neighbour shows the portrait, the name, the trade, the favourite chains, and the count of
   delivered quests. A neighbour who has not arrived is a "Not yet" outline without a name or a portrait.
   The list therefore does not spoil later chapters. A waiting arrival scene opens from the entry of its regular.
   After the scene, the entry opens the introduction.
9. Vlad and Elisabeta do not join the community supper scene.

## Roster

Each reference is in the name, the trade, or one habit of the regular.
A reference never copies text, a plot, or a design from the work.

| Arrives | Regular | Trade | Favourite chains | Reference |
| --- | --- | --- | --- | --- |
| Start | Dochia | Shepherdess | warm, bakery | Baba Dochia, the old woman of March who sheds her nine sheepskins (Romanian folklore) |
| Start | Victor | Anatomy student | warm, drinks | *Frankenstein* (Mary Shelley, 1818) |
| Start | Ana | Night-shift nurse | warm, drinks | She leaves garlic at the ward door on Saint Andrew's Eve, when the strigoi walk (Romanian folklore) |
| Start | Costel | Clock and automaton maker | sweet, drinks | *The Sandman* (E. T. A. Hoffmann, 1816) |
| After preparation 4 | Sânziana | Florist | sweet, produce | The Sânziene, the midsummer flower fairies. She weaves bedstraw crowns on 24 June (Romanian folklore) |
| After preparation 4 | Dorian | Portrait painter who never seems to age | sweet, drinks | *The Picture of Dorian Gray* (Oscar Wilde, 1890) |
| After preparation 8 | Vlad | Local baron | warm, drinks | A baron who styles himself as a count and lives in a countryside castle |
| After preparation 8 | Elisabeta | Visiting countess | warm, drinks | An Austro-Hungarian countess who sometimes visits her land nearby |
| After preparation 8 | Ileana | Seamstress | produce, drinks | She finishes every spindle before Maundy Thursday, for fear of Joimărița, who punishes idle spinners (Romanian folklore) |
| After preparation 8 | Cezar | Night watchman who seems to sleepwalk his rounds | warm, produce | *The Cabinet of Dr. Caligari* (film, 1920) |
| After preparation 12 | Cătălina | Church bell-ringer | sweet, warm | She rings the bell against hailstorms and the solomonari who ride the storm clouds (village custom) |
| After preparation 12 | Bran | Night-bus driver who rides a horse on his days off | bakery, warm | The Headless Horseman of *The Legend of Sleepy Hollow* (Washington Irving, 1820) |

The night-shift nurse, the night watchman, and the bell-ringer add a slightly eerie side to the
village. They are awake when the bats are.

## Data and state

- `Character` in `src/engine.ts` has `regular`, `arrivesAfter`, `prefers`, `arrival`, and `portraitAtlas`.
  `tools/create-original-data.ts` authors the records.
- `characterProblems` checks unique IDs, portrait cells, and known arrival preparations.
  Each regular must have two different known favourite chains.
  Each later regular must speak in their arrival scene.
- `hasArrived` and `resolveNeighbours` derive arrivals and the delivered count from the completed preparations and `completedQuests`.
  The state has no field for arrivals or counts.
- A waiting arrival scene uses the ID `arrival-` and the ID of its regular. A save cannot hold the arrival scene of a regular who has not arrived.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Art

- The `regulars-1`, `regulars-2`, and `regulars-3` masters are transparent two-by-two atlases.
  The first atlas holds Dochia, Victor, Ana, and Costel.
  The second atlas holds Sânziana, Dorian, Ileana, and Cezar.
  The third atlas holds Cătălina and Bran at the top, with two empty cells below.
  The atlases use the style, framing, and scale of the `portraits` master.
- Vlad and Elisabeta keep their portraits in the `guests` master.
- The asset records hold the prompts, the provenance, and the variants of the three atlases.

## Acceptance and evidence

- Engine: `tests/regulars.test.ts` covers each arrival pair and one arrival scene after the earned story scenes.
  It covers rejection of an early arrival scene in a save, the neighbours list, and the cast check.
- Quests: the quest tests of 005 cover the quests of the regulars.
- Assets: `tests/assets.test.ts` compares the three atlases and their variants with their records.
- Browser: follow [Verification and release](README.md#verification-and-release). Complete an arrival preparation, read the
  arrival scene, reload, and open the neighbours list. Check that the portraits and names fit the tickets and the list at every size.

## Remaining decisions

008 may let the finale name the regulars who arrived. The challenges in 012 stay with the core four.
