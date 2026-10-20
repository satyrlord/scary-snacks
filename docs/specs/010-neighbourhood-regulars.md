# 010: Neighbourhood regulars

Status: Implemented.

In this spec, a neighbour is a core character or a regular.
The core characters are Mara, Ilie, Eszter, and Sorin.

## Outcome and scope

The neighbourhood of the bistro grows as the renovation progresses. New regulars arrive.
Each regular has a name, a trade, a portrait, an introduction, two or three favourite dishes, and quests.
The player can find who lives nearby and what they like.

- The four core characters drive the story, the preparations, and their own quest arcs in 004.
- Only the four core characters are generic neighbours.
  Each regular refers to a horror novel, a horror film, local folklore, or a historical figure.
  The reference uses the name, the trade, or one habit.
- A regular never sulks, queues, or charges a penalty.
  Play earns an arrival. Time does not earn an arrival.

## Rules

1. The roster has 16 neighbours: the four core characters and 12 regulars.
   Vlad and Elisabeta are two of the 12 regulars.
2. Arrivals: Dochia, Victor, Ana, and Costel are present from the start, so a new game has eight neighbours.
   Sânziana and Dorian arrive with preparation 4.
   Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, in that order.
   Cătălina and Bran arrive with preparation 12.
3. Each regular who arrives later records an `arrivesAfter` preparation ID.
   The game derives arrival from completed preparations and does not save it.
4. Each regular has two or three authored favourite dishes (`favourites`).
   Each quest of a regular asks for at least one favourite dish.
   Each quest of Vlad and Elisabeta asks for red wine and a meat dish. No dish of theirs has garlic.
   Cătălina keeps an Orthodox fast: no dish of hers has meat, dairy, or egg. Fish is allowed.
   Spec 012 gives the content tags and the diets.
5. Author the taste of each person from their trade and story.
   Never derive taste from the appearance or the age of a neighbour.
   Never derive taste from an inferred ethnic or national identity.
6. Dochia and Costel have five quests each.
   Victor, Ana, Sânziana, Dorian, Ileana, and Cezar have four quests each.
   Cătălina and Bran have three quests each.
   Vlad and Elisabeta have two quests each.
   The quests follow the campaign rules of 004.
7. The arrival of each later regular plays a short original scene.
   A core character introduces the regular. The regular answers.
   The payment queues the arrival scene after the preparation scene and the closing scene that it earned.
   The scene follows the continuation rules of 008.
   Reading the scene does not change the arrival.
8. The Neighbours group in the journal starts collapsed. It shows the core characters, then the regulars in order of arrival.
   Each arrived neighbour shows the portrait, the name, and the trade.
   A regular also shows the favourite dishes.
   Each arrived neighbour shows the count of delivered quests.
   A neighbour who has not arrived is a "Not yet" outline without a name or a portrait.
   Thus the list does not spoil later chapters.
   A waiting arrival scene has one entry under Unread scenes, above the chapter.
   The neighbour entry always shows the count and opens the introduction.
   Reading the arrival opens Neighbours and focuses that regular.
9. Vlad and Elisabeta do not join the community supper scene.

## Roster

Each reference is in the name, the trade, or one habit of the regular.
A reference never copies text, a plot, or a design from its source.
The Favourite dishes column gives the dish names.

| Arrives | Regular | Trade | Favourite dishes | Reference |
| --- | --- | --- | --- | --- |
| Start | Dochia | Shepherdess | Mămăligă, Bulz, Drob | Baba Dochia, the old woman of March who sheds her nine sheepskins (Romanian folklore) |
| Start | Victor | Anatomy student | Linden tea, Chicken noodle soup, Meatball soup | *Frankenstein* (Mary Shelley, 1818) |
| Start | Ana | Night-shift nurse | Pogăcele, Linden tea, Chicken noodle soup | She hangs garlic on the ward door on Saint Andrew's Eve, when the strigoi walk (Romanian folklore) |
| Start | Costel | Clock and automaton maker | Socată, Papanași, Cozonac | *The Sandman* (E. T. A. Hoffmann, 1816) |
| After preparation 4 | Sânziana | Florist | Socată, Plum dumplings, Fruit tea | The Sânziene, the midsummer flower fairies. She weaves bedstraw crowns on 24 June (Romanian folklore) |
| After preparation 4 | Dorian | Gentleman of leisure | Cheese board, Red wine, Cozonac | *The Picture of Dorian Gray* (Oscar Wilde, 1890). He seems never to age |
| After preparation 8 | Vlad | Local baron | Roast pork, Red wine, Roast lamb | Vlad III Dracula, voivode of Wallachia (historical figure, 15th century). He is a baron who styles himself as a count and lives in a countryside castle |
| After preparation 8 | Elisabeta | Visiting countess | Red wine, Tochitură, Roast lamb | Báthory Erzsébet (Elizabeth Báthory), a Hungarian countess (historical figure, 1560–1614). She is an Austro-Hungarian countess who sometimes visits her land nearby |
| After preparation 8 | Ileana | Seamstress | Zacuscă toast, Fruit tea, Stuffed peppers | She finishes every spindle before Maundy Thursday, for fear of Joimărița, who punishes idle spinners (Romanian folklore) |
| After preparation 8 | Cezar | Night watchman | Tochitură, Bean soup, Mici | *The Cabinet of Dr. Caligari* (film, 1920). He seems to sleepwalk his rounds |
| After preparation 12 | Cătălina | Church bell-ringer | Plum dumplings, Bean stew, Saramură with mămăligă | She rings the bell against hailstorms and the solomonari who ride the storm clouds (village custom) |
| After preparation 12 | Bran | Night-bus driver | Langoș, Bean soup in a bread bowl, Mici | The Headless Horseman of *The Legend of Sleepy Hollow* (Washington Irving, 1820). He rides a horse on his days off |

The night-shift nurse, the night watchman, and the bell-ringer add a slightly eerie side to the village.
They are awake when the bats are.

## Data and state

- `Character` in `src/model.ts` has `regular`, `arrivesAfter`, `favourites`, `diet`, `arrival`, and `portraitAtlas`.
  `tools/create-original-data.ts` authors the records.
- `characterProblems` checks unique IDs, portrait cells, known arrival preparations, and diets.
  Each regular must have two or three different known favourite dishes.
- `questProblems` checks that each quest of a regular asks for a favourite dish and suits each diet.
  Each later regular must speak in their arrival scene.
- `hasArrived` and `resolveNeighbours` derive the arrivals and the delivered counts from the completed preparations and `completedQuests`.
  The state has no field for arrivals or counts.
- A waiting arrival scene uses the ID `arrival-` followed by the ID of its regular.
  A save cannot hold the arrival scene of a regular who has not arrived.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Art

- The `regulars-1`, `regulars-2`, and `regulars-3` masters are transparent two-by-two atlases.
  The first atlas holds Dochia, Victor, Ana, and Costel.
  The second atlas holds Sânziana, Dorian, Ileana, and Cezar.
  The third atlas holds Cătălina and Bran at the top, with two empty cells below.
  The atlases use the style, the framing, and the scale of the `portraits` master.
- The `guests` master holds the portraits of Vlad and Elisabeta.
- The asset records hold the prompts, the provenance, and the variants of the three atlases.

## Acceptance and evidence

- Engine: `tests/regulars.test.ts` covers each group of arrivals and one arrival scene after the earned story scenes.
  It covers rejection of an early arrival scene in a save, the neighbours list, and the cast check.
- Quests: the quest tests of 004 cover the quests of the regulars.
- Assets: `tests/assets.test.ts` compares the masters and the variants of the three atlases with their records.
  It also checks that the portraits of the third atlas stay in its top cells.
- Browser: follow [Verification and release](README.md#verification-and-release).
  Complete an arrival preparation, read the arrival scene, reload, and open the neighbours list.
  Check that the portraits and names fit the tickets and the list at every size.
