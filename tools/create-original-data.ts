// Original setting, dialogue, progression, and economy authored for this browser game.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { menuPrice, MIXED, roomPaintings } from '../src/model.ts';
import { dataProblems } from '../src/content.ts';
import type { Area, BoardLayout, Chapter, Character, DayLevers, DecorationSlot, DishTag, Economy, Finale, FoodAtlas, GameData, Item, PreparationObstacleBatch, Quest, RoomState, Task } from '../src/model.ts';

// The levers of the economy (docs/economy.md). They are starting values: the campaign balance test measures them.
const economy: Economy = { takeCost: 1, blockerCoin: 1, workRate: 2, recoveryFloor: 10 };
// The levers of the bistro day, in minutes after midnight. One day holds 150 merges. The campaign balance test measures them.
const day: DayLevers = { opening: 7 * 60, closing: 22 * 60, booking: 20 * 60, mergeMinutes: 6, upkeep: 10, ratTake: 3, ratHoles: 3, giftStage: 4, giftSpace: 5 };
// The staple chains. Each chain is one food family: its source gives the raw staple, and its dishes use only foods of that
// family. Each dish names its content tags. The chain atlas holds the source in cell 0 and the dishes in stage order.
const chains: [id: string, name: string, source: string, stages: [name: string, tags: DishTag[]][], free?: true][] = [
  ['grain', 'Grain', 'Windmill', [['Flour', []], ['Dough', []], ['Loaf', []], ['Pogăcele', []], ['Langoș', []], ['Bread basket', []]]],
  ['corn', 'Corn', 'Corn basket', [['Corn cob', []], ['Shelled corn', []], ['Cornmeal', []], ['Mămăligă', []]]],
  ['herbs', 'Herbs', 'Herb basket', [['Elderflowers', []], ['Herb bunch', []], ['Socată', []], ['Linden tea', []]], true],
  ['dairy', 'Dairy', 'Milk churn', [['Milk', ['dairy']], ['Sour cream', ['dairy']], ['Cottage cheese', ['dairy']], ['Telemea', ['dairy']], ['Smoked cheese', ['dairy']], ['Cheese board', ['dairy']]]],
  ['poultry', 'Poultry', 'Hen’s nest', [['Eggs', ['egg']], ['Chicken', ['meat']], ['Chicken broth', ['meat']], ['Roast chicken', ['meat']]]],
  ['vegetables', 'Vegetables', 'Vegetable crate', [['Potatoes', []], ['Vegetable basket', []], ['Pickled cabbage', []], ['Roasted vegetables', []], ['Zacuscă', []], ['Vegetable stew', []]]],
  ['fruits', 'Fruits', 'Cornucopia', [['Plums', []], ['Fruit bowl', []], ['Cherry compote', []], ['Plum jam', []], ['Red wine', ['alcohol']], ['Plum brandy', ['alcohol']]]],
  ['pork', 'Pork', 'Butcher’s hook', [['Pork', ['meat', 'pork']], ['Minced pork', ['meat', 'pork']], ['Sausages', ['meat', 'pork', 'garlic']], ['Smoked bacon', ['meat', 'pork']], ['Roast pork', ['meat', 'pork']]]],
  ['beans', 'Beans', 'Legume sacks', [['White beans', []], ['Lentils', []], ['Green beans', []], ['Bean dip', ['garlic']], ['Bean stew', []]]],
  ['lamb', 'Lamb', 'Shepherd’s bag', [['Lamb', ['meat']], ['Lamb cuts', ['meat']], ['Lamb chops', ['meat']], ['Lamb stew', ['meat', 'garlic']], ['Roast lamb', ['meat']]]],
  ['veal', 'Veal', 'Butcher’s block', [['Veal', ['meat']], ['Diced veal', ['meat']], ['Minced veal', ['meat']], ['Meatballs', ['meat']], ['Veal stew', ['meat']], ['Roast veal', ['meat']]]],
  ['fish', 'Fish', 'Fish trap', [['Fresh trout', ['fish']], ['Fried trout', ['fish']], ['Smoked trout', ['fish']], ['Saramură', ['fish', 'garlic']]]],
];
// The mixed dishes: a slug, the name, the two parts by name, the tags that the dish adds to those of its parts, and its atlas cell.
// A part that is itself mixed must come earlier in this list.
const mixedRows: [slug: string, name: string, parts: [string, string], added: DishTag[], atlas: FoodAtlas, cell: number][] = [
  ['bulz', 'Bulz', ['Mămăligă', 'Telemea'], [], 'mains', 0],
  ['papanasi', 'Papanași', ['Dough', 'Cottage cheese'], [], 'sweets', 3],
  ['cheese-pie', 'Cheese pie', ['Dough', 'Telemea'], [], 'breads', 0],
  ['sweet-dough', 'Sweet dough', ['Dough', 'Eggs'], [], 'sweets', 0],
  ['chicken-noodle-soup', 'Chicken noodle soup', ['Chicken broth', 'Dough'], [], 'soups', 1],
  ['zacusca-toast', 'Zacuscă toast', ['Loaf', 'Zacuscă'], [], 'breads', 1],
  ['plum-dumplings', 'Plum dumplings', ['Potatoes', 'Plums'], [], 'sweets', 4],
  ['fruit-tea', 'Fruit tea', ['Herb bunch', 'Fruit bowl'], [], 'breads', 3],
  ['cabbage-rolls', 'Cabbage rolls', ['Minced pork', 'Pickled cabbage'], [], 'mains', 1],
  ['stuffed-peppers', 'Stuffed peppers', ['Minced pork', 'Vegetable basket'], [], 'mains', 3],
  ['tochitura', 'Tochitură', ['Roast pork', 'Mămăligă'], [], 'soups', 7],
  ['sharing-board', 'Sharing board', ['Smoked cheese', 'Sausages'], [], 'breads', 2],
  ['bean-soup', 'Bean soup', ['White beans', 'Smoked bacon'], [], 'soups', 3],
  ['beans-with-sausages', 'Beans with sausages', ['Bean stew', 'Sausages'], [], 'soups', 6],
  ['drob', 'Drob', ['Lamb cuts', 'Eggs'], ['garlic'], 'mains', 5],
  ['goulash-pot', 'Goulash pot', ['Diced veal', 'Vegetable basket'], [], 'soups', 5],
  ['meatball-soup', 'Meatball soup', ['Meatballs', 'Herb bunch'], [], 'soups', 0],
  ['mici', 'Mici', ['Minced veal', 'Minced pork'], ['garlic'], 'mains', 4],
  ['fish-soup', 'Fish soup', ['Fresh trout', 'Vegetable basket'], [], 'soups', 2],
  ['cabbage-rolls-mamaliga', 'Cabbage rolls with mămăligă', ['Cabbage rolls', 'Mămăligă'], [], 'mains', 2],
  ['bean-soup-bread-bowl', 'Bean soup in a bread bowl', ['Bean soup', 'Loaf'], [], 'soups', 4],
  ['saramura-mamaliga', 'Saramură with mămăligă', ['Saramură', 'Mămăligă'], [], 'mains', 6],
  ['cozonac', 'Cozonac', ['Sweet dough', 'Fruit bowl'], [], 'sweets', 1],
  ['chimney-cake', 'Chimney cake', ['Sweet dough', 'Milk'], [], 'sweets', 2],
];
const items: Record<string, Item> = {};
for (const [chain, , source, stages, free] of chains) {
  const id = `generator_${chain}`, atlas = chain as FoodAtlas;
  items[id] = { id, name: source, chain, stage: 0, next: null, art: { atlas, cell: 0 }, price: 0, tags: [], generator: { outputs: [`${chain}_1`], ...(free ? { free } : {}) } };
  stages.forEach(([name, tags], stage) => {
    const code = `${chain}_${stage + 1}`;
    items[code] = { id: code, name, chain, stage: stage + 1, next: stage + 1 < stages.length ? `${chain}_${stage + 2}` : null, art: { atlas, cell: stage + 1 }, price: 0, tags };
  });
}
/** The ID of a dish by its name. The names are unique. */
const dish = (name: string) => {
  const found = Object.values(items).find(item => item.name === name && !item.generator);
  if (!found) throw new Error(`Unknown dish: ${name}.`);
  return found.id;
};
for (const [slug, name, parts, added, atlas, cell] of mixedRows) {
  const recipe = parts.map(dish) as [string, string];
  const tags = [...new Set([...recipe.flatMap(part => items[part].tags), ...added])];
  items[`mixed_${slug}`] = { id: `mixed_${slug}`, name, chain: MIXED, stage: recipe.some(part => items[part].recipe) ? 2 : 1, next: null, art: { atlas, cell }, price: 0, tags, recipe };
}
const chainData = { chains: chains.map(([id, name]) => ({ id, name })), items, economy, characters: [], tasks: [], quests: [] } as unknown as GameData;
for (const item of Object.values(items)) if (!item.generator) item.price = menuPrice(item.id, chainData);

const characters: Character[] = [
  { id: 'mara', name: 'Mara', role: 'Bistro owner', sprite: 0,
    introduction: 'I am Mara. I keep the bistro open and make room for neighbours who want a meal or a quiet seat. Help me try a few servings as we prepare the house.' },
  { id: 'ilie', name: 'Ilie', role: 'Baker', sprite: 1,
    introduction: 'I am Ilie, the baker. I bring bread and the notebook where my family kept its dishes. There is room on those pages for what we learn here.' },
  { id: 'eszter', name: 'Eszter', role: 'Potter', sprite: 2,
    introduction: 'I am Eszter. I make the bowls and plates. A useful dish should sit well on the table and leave room for the person beside you.' },
  { id: 'sorin', name: 'Sorin', role: 'Bistro helper', sprite: 3,
    introduction: 'I am Sorin. I help at the bistro between deliveries around the neighbourhood. I know the steep streets, the quiet doors, and where to stop for lunch.' },
  { id: 'adrian', name: 'Adrian', role: 'Travelling guard', visitor: true, provisions: true, sprite: 0,
    introduction: 'I am Adrian. I travel with Monica and Janos. We are checking a few reports from the cathedral beyond the village. We may need provisions for several days at a time.' },
  { id: 'monica', name: 'Monica', role: 'Pathfinder', visitor: true, provisions: true, sprite: 1,
    introduction: 'I am Monica. I check the paths while Adrian and Janos compare their notes. The old cathedral has more entrances than our map shows. A supply pack lets us stay a few days to look.' },
  { id: 'janos', name: 'Janos', role: 'Travelling scholar', visitor: true, provisions: true, sprite: 2,
    introduction: 'I am Janos. I study the marks in old stonework. Adrian and Monica help me examine the nearby cathedral. Its records leave a few questions, and a long visit needs proper meals.' },
  { id: 'ionatan', name: 'Ionatan', role: 'Foreign property agent', visitor: true, singleVisit: true, sprite: 3,
    introduction: 'I am Ionatan, a property agent from another country. I am travelling to the nearby castle to close a real-estate deal with a local noble. I have time for one proper dinner before I leave.' },
  { id: 'vlad', name: 'Vlad', role: 'Local baron', portraitAtlas: 'guest', sprite: 0, regular: true,
    favourites: [dish('Roast pork'), dish('Red wine'), dish('Roast lamb')], diet: nobleDiet(), arrivesAfter: 'task_8',
    arrival: [{ speaker: 'mara', text: 'A carriage has stopped at the gate. Count Vlad sends word that he will dine with us tonight.' },
      { speaker: 'vlad', text: 'Baron, officially. Count, in spirit. I read your new chalk menu by lamplight from my carriage. I dislike the sun, so I approve of a bistro that serves supper late.' }],
    introduction: 'Count Vlad, if you please. My castle is outside the village, so I seldom dine here. A meat dish and red wine will suit me. The country roads have given me quite an appetite.' },
  { id: 'elisabeta', name: 'Elisabeta', role: 'Visiting countess', portraitAtlas: 'guest', sprite: 1, regular: true,
    favourites: [dish('Red wine'), dish('Tochitură'), dish('Roast lamb')], diet: nobleDiet(), arrivesAfter: 'task_8',
    arrival: [{ speaker: 'eszter', text: 'Countess Elisabeta is visiting her land again. She asked whether our front room is quiet.' },
      { speaker: 'elisabeta', text: 'Quiet, clean, and well lit. I shall read my estate papers here with a glass of red wine. Red suits me. It always has.' }],
    introduction: 'I am Countess Elisabeta. I have land nearby, though my visits are infrequent. Please bring a meat dish and red wine. I shall review the estate papers after dinner.' },
  { id: 'mina', name: 'Mina', role: 'Searching for her fiancé', visitor: true, singleVisit: true, portraitAtlas: 'guest', sprite: 2,
    diet: { name: 'Vegetarian', forbid: ['meat', 'fish'] },
    introduction: 'My name is Mina. My fiancé Ionatan came here to sign a property contract, but his letters stopped. Doctor Avram has come with me to find him. I eat no meat or fish; eggs and dairy are welcome.' },
  { id: 'avram', name: 'Avram', role: 'Travelling doctor', visitor: true, singleVisit: true, portraitAtlas: 'guest', sprite: 3,
    diet: { name: 'Kosher-style', forbid: ['pork'], apart: ['meat', 'dairy'] },
    introduction: 'I am Doctor Avram, professional physician and amateur solomonar. I am travelling with Mina to find Ionatan. We will stay together while we ask about the road to the castle.' },
  ...regulars(),
];
/** Vlad and Elisabeta: each quest has red wine and a meat dish, and no dish has garlic. */
function nobleDiet(): Character['diet'] {
  return { name: 'Red wine and meat, no garlic', forbid: ['garlic'], require: { item: dish('Red wine'), tag: 'meat' } };
}
/**
 * The regulars. Each one refers to a horror novel, a horror film, or local folklore, in the name, the trade, or one habit.
 * Each has two or three favourite dishes. Five are present from the start. The others arrive with the last preparation of chapters 1 to 3.
 * A core character introduces each of them.
 */
function regulars(): Character[] {
  const rows: [id: string, name: string, role: string, atlas: Character['portraitAtlas'], sprite: number, favourites: string[], arrivesAfter: number,
    introduction: string, arrival?: [speaker: string, text: string][]][] = [
    ['dochia', 'Dochia', 'Shepherdess', 'regulars-1', 0, ['Mămăligă', 'Bulz', 'Drob'], 0,
      'I am Dochia. I keep sheep on the hill above the village, and I wear all my sheepskins until the weather proves that it deserves fewer. I took one off this morning. The weather has not earned another.'],
    ['victor', 'Victor', 'Anatomy student', 'regulars-1', 1, ['Linden tea', 'Chicken noodle soup', 'Meatball soup'], 0,
      'I am Victor. I study anatomy at the college and work late in its old laboratory. Last week one of my projects sat up on the table. It was only a soufflé, but my landlady still screamed.'],
    ['ana', 'Ana', 'Night-shift nurse', 'regulars-1', 2, ['Pogăcele', 'Linden tea', 'Chicken noodle soup'], 0,
      'I am Ana. I work nights at the clinic, so this is my breakfast. Every Saint Andrew’s Eve I hang garlic on the ward door. The doctor laughs at me, but none of my patients has ever been bitten.'],
    ['costel', 'Costel', 'Clock and automaton maker', 'regulars-1', 3, ['Socată', 'Papanași', 'Cozonac'], 0,
      'I am Costel. I mend clocks and build small brass automata in the shop by the well. If you hear ticking under my coat, it is a mechanical sparrow. It likes bright eyes and shiny spoons, so keep an eye on both.'],
    // Bela keeps the churchyard. He sleeps through the day, and his smile unsettles the other guests, so the supper does not invite him.
    ['bela', 'Bela', 'Graveyard keeper', 'regulars-3', 2, ['Pogăcele', 'Linden tea'], 0,
      'I am Bela. I keep the old churchyard on the hill. I sleep through the day, so please do not knock before dusk. At night I walk between the graves and wish each one a good night. They are the quietest neighbours in the village, and the best listeners.'],
    ['sanziana', 'Sânziana', 'Florist', 'regulars-2', 0, ['Socată', 'Plum dumplings', 'Fruit tea'], 4,
      'I am Sânziana. I sell flowers from the cart by the church. On Midsummer Eve I weave crowns of yellow bedstraw and dance in the meadow until dawn. My sisters dance too. Nobody has ever counted all of us at once.',
      [['eszter', 'The front room is ready, and the first flowers have come to see it. This is Sânziana, from the flower cart by the church.'],
        ['sanziana', 'Eszter promised me a jug for the counter. I promised her flowers that last until midsummer. After that, they make their own plans.']]],
    ['dorian', 'Dorian', 'Gentleman of leisure', 'regulars-2', 1, ['Cheese board', 'Red wine', 'Cozonac'], 4,
      'I am Dorian. I live in the house with the green door. My fortune leaves me free for fine suppers, good company, and very little work. People say I have not aged since they were children. My portrait in the attic does all the worrying for me.',
      [['mara', 'Dorian has asked for a seat under the new lamps. He says that good light is wasted on an empty chair.'],
        ['dorian', 'I dined in this room when your grandmother ran it, Mara. It has hardly changed. Neither have I.'],
        ['mara', 'I will pretend that I did not hear that. Sit down, and I will bring the menu.']]],
    ['ileana', 'Ileana', 'Seamstress', 'regulars-2', 2, ['Zacuscă toast', 'Fruit tea', 'Stuffed peppers'], 8,
      'I am Ileana, the seamstress. I finish every spindle before Maundy Thursday, because that night Joimărița checks the houses for idle spinners. She has never visited my house. She has visited my brother twice.',
      [['ilie', 'Ileana sews the aprons for half the village. She heard that we have a real kitchen now.'],
        ['ileana', 'I heard that you have four aprons and eight stains. I brought thread. Finish your work before Thursday, and nobody gets into trouble.']]],
    ['cezar', 'Cezar', 'Night watchman', 'regulars-2', 3, ['Tochitură', 'Bean soup', 'Mici'], 8,
      'I am Cezar, the night watchman. I walk the village from dusk to dawn. Some people say that I do it asleep. That is not true. I am only resting my eyes, and my feet know the way.',
      [['sorin', 'This is Cezar. He watches the street at night, and he saw the kitchen lights from the square.'],
        ['cezar', 'Good evening. Or good morning. I lose track. A warm plate at the end of my round would be very welcome.'],
        ['sorin', 'He says that at noon too.']]],
    ['catalina', 'Cătălina', 'Church bell-ringer', 'regulars-3', 0, ['Plum dumplings', 'Bean stew', 'Saramură with mămăligă'], 12,
      'I am Cătălina. I ring the church bell, and when hail clouds come over the hill, I ring until they turn back. The old women say that solomonari ride those clouds. I say that they can ride somewhere else.',
      [['mara', 'Cătălina rings the bell at the church. She heard that the shared table is open.'],
        ['catalina', 'I heard it from the bell tower. I hear everything from the bell tower. Save me a seat by the door, in case the hail comes.']]],
    ['bran', 'Bran', 'Night-bus driver', 'regulars-3', 1, ['Langoș', 'Bean soup in a bread bowl', 'Mici'], 12,
      'I am Bran. I drive the night bus to the town and back. On my days off, I ride my horse through the woods. I always wear this scarf, because my neck gets cold. Please do not ask more questions about my neck.',
      [['sorin', 'This is Bran. He drives the night bus. Once he gave me a lift, and my bicycle too.'],
        ['bran', 'From tomorrow, the bus stops by the square for a loaf of bread. The horse prefers apples, but the horse does not drive.']]],
  ];
  return rows.map(([id, name, role, portraitAtlas, sprite, favourites, after, introduction, arrival]) => ({
    id, name, role, introduction, sprite, portraitAtlas, regular: true, favourites: favourites.map(dish),
    ...(id === 'catalina' ? { diet: { name: 'Orthodox fast, fish allowed', forbid: ['meat', 'dairy', 'egg'] } } : {}),
    // Dochia packs food for her days on the hill, and Sânziana buys for her sisters, so their quests are provisions, not one meal.
    ...(id === 'dochia' || id === 'sanziana' ? { provisions: true as const } : {}),
    ...(after ? { arrivesAfter: `task_${after}`, arrival: arrival!.map(([speaker, text]) => ({ speaker, text })) } : {}),
  }));
}
// Each chapter: its title, objective, opening context, payoff, the neighbour quest that contributes during it, and its closing scene.
// The closing scenes name the changes that the chapter's preparations paint into the rooms.
const chapterRows: [title: string, objective: string, opening: string, payoff: string, contribution: string, closing: [speaker: string, text: string][]][] = [
  ['Open the shutters', 'Make the neglected front room ready to greet neighbours.',
    'Dust, webs, and a broken pane keep the street outside. Mara wants the front room to welcome people again.',
    'The front room is clean, lit, and free of webs, and Ilie has a place for his bread on the counter.', 'ilie-counter',
    [['mara', 'Look at it. Clean glass, a mended board, pastries on the shelf, and both lamps lit.'],
      ['ilie', 'I will keep bread on the counter, where people can reach it. That is my first promise to this room.'],
      ['sorin', 'The spiders left with the webs. Well, all but the small one under the shelf.'],
      ['eszter', 'Let it stay. Every good room has one quiet guest.']]],
  ['A kitchen for everyone', 'Arrange a shared kitchen where anyone can help.',
    'The front room is ready, but the kitchen is not. A shared menu needs a steady worktop, fresh produce, and shelves within reach.',
    'The team can cook together, and the first menu explains each dish.', 'sorin-lunch',
    [['mara', 'A steady worktop, a produce shelf, jars above, and a menu by the door. We can cook here together now.'],
      ['sorin', 'And explain it. On every street, people ask me what zacuscă is. Now they can point at the picture.'],
      ['ilie', 'A menu is a promise. Tomorrow we find out if we can keep it.']]],
  ['Around one table', 'Make shared seating that is useful and welcoming.',
    'The food is ready, but the neighbours need a place to sit together. The old long table and the red chairs wait under a dust sheet.',
    'Eszter’s tableware sets every place, and the recipe corner keeps room for memories.', 'eszter-table',
    [['eszter', 'Each place has a bowl and a cup. None of them match, and all of them belong.'],
      ['ilie', 'The notebook is on the cabinet. Somebody has already written their aunt’s name beside the papanași.'],
      ['mara', 'Then the table is open. Anyone who wants company can find it here.']]],
  ['The courtyard', 'Open an outdoor space where everyone can gather and move easily.',
    'Behind the kitchen, a courtyard sleeps under the leaves. With a clear path and a dry door, the bistro can serve outside.',
    'Sorin’s practical help clears the way, and the courtyard is ready for outdoor service.', 'sorin-path',
    [['sorin', 'I walked the route with a full tray. Gate to door, door to tables, and nothing in the way.'],
      ['eszter', 'The herbs are by the door, and the new hood keeps the rain off the step.'],
      ['mara', 'Then we can serve outside. Thank you, Sorin. You found every loose stone before a guest did.']]],
  ['Recipes to share', 'Test the dishes of the neighbourhood and write them down.',
    'Neighbours have started to bring their own recipes. Each one needs a tasting, a label, and a place on the menu.',
    'The supper menu shows each dish, and neighbours can find their own recipes on it.', 'ilie-family',
    [['ilie', 'Every recipe on the wall has a name beside it. My grandmother is on there twice.'],
      ['eszter', 'And every dish on the menu has a picture and a label, so nobody has to guess.'],
      ['sorin', 'A neighbour found her plum dumplings on the menu today. She read it out loud to the whole courtyard.'],
      ['mara', 'That is the menu I wanted. Not ours. Everyone’s.']]],
  ['The first community supper', 'Bring every preparation together and welcome the guests.',
    'The rooms are ready and the menu is printed. Now the street needs invitations, a serving station, and the last few flowers.',
    'Mara and the team have prepared the bistro for the community supper.', 'mara-supper',
    [['sorin', 'Every invitation is delivered. Some people asked twice if they really need to bring only an appetite.'],
      ['eszter', 'The flowers are short, the lights are on, and every dish on the serving table has its label.'],
      ['mara', 'Then we are ready. Let us open the doors.']]],
];
const chapters: Chapter[] = chapterRows.map(([title, objective, opening, payoff, contribution, closing], index) => ({
  id: `chapter-${index + 1}`, title, objective, opening, payoff, contribution, closing: closing.map(([speaker, text]) => ({ speaker, text })),
}));
// The finale names the outcome of each chapter, and every core character speaks. Serving the supper quest earns it.
// The last line leads to the painting of the supper, and then back to the kitchen.
const finale: Finale = { id: 'finale', title: 'Supper at the bistro', dialogue: [
  { speaker: 'mara', text: 'Look at them. The front room is full, and the courtyard too.' },
  { speaker: 'ilie', text: 'We opened the shutters and lit the room. Then we made a kitchen where everyone could help.' },
  { speaker: 'eszter', text: 'We set one long table for everyone, and then we carried it out into the courtyard.' },
  { speaker: 'sorin', text: 'And the recipes came from every street on my route. Half the menu has a neighbour’s name on it.' },
  { speaker: 'mara', text: 'Tonight is the supper that we planned together. Tomorrow the bistro stays open, and every neighbour knows the way.' },
  { speaker: 'ilie', text: 'Then I will start the dough early. Somebody will want bread for breakfast.' },
], ending: 'The supper is served, and the bistro stays open.' };
const taskRows = [
  ['Fix the broken window', 'mara', 'That window has a cracked pane and a corner missing. The draught reaches all the way to the counter.', 'sorin', 'I brought new glass on the bike. Very slowly. The ladder will have to walk.', 'eszter', 'And I have cobalt paint for the frame and the shutters. The bistro can greet the street again.'],
  ['Mend the welcome board', 'eszter', 'The wooden board is sound. It only needs a new surface.', 'mara', 'Folk flowers, red ones, like the old plates. Miez can supervise the painting.', 'ilie', 'Our black cat has already inspected the empty pastry shelf.'],
  ['Set up the pastry shelf', 'ilie', 'This shelf is low enough for everyone to see the pastries.', 'mara', 'And high enough to keep your elbow out of the walnuts.', 'ilie', 'A thoughtful design. Pastries need cream, so I will bring a milk churn from the dairy.'],
  ['Light the front room', 'sorin', 'The lamps are ready. Shall we put one above each small table?', 'eszter', 'Yes, and keep the corner warm and quiet.', 'mara', 'A seat for a quick lunch, and a seat for a long conversation.'],
  ['Repair the kitchen worktop', 'ilie', 'A steady worktop makes a calm kitchen.', 'eszter', 'I have sealed the edge. Leave room at the end for a hen’s nest. Fresh eggs keep a kitchen honest.', 'mara', 'Now there is space to prepare tomorrow together.'],
  ['Bring in market produce', 'sorin', 'The market sent a whole vegetable crate: potatoes, cabbages, and more peppers than my basket could hold.', 'mara', 'We can roast a batch and make a produce shelf.', 'ilie', 'Good. A jar of zacuscă makes a fine welcome on fresh bread.'],
  ['Hang the kitchen shelves', 'eszter', 'The pastries keep the lower shelf. The jars go up top, on the left.', 'mara', 'Leave the right end free. We will learn what belongs there.', 'ilie', 'An empty space on a shelf is an invitation to cook. The cornucopia will fill it with plums.'],
  ['Write the first menu', 'mara', 'Bread, mămăligă, cheese, eggs, vegetables, and fruit. From tomorrow, the butcher’s hook gives us pork too.', 'ilie', 'Draw it, then. Nobody needs glasses to read a picture of soup.', 'sorin', 'I will put a copy by the door before the lunch ride.'],
  ['Choose the tableware', 'eszter', 'These bowls came from three firings. None is exactly the same blue.', 'mara', 'That is why I like them. Each place will feel considered.', 'ilie', 'And each bowl is deep enough for a generous serving.'],
  ['Sand the long table', 'sorin', 'Four people can move this table. Three people can offer advice.', 'mara', 'Today all four of us are moving it. Then the old red chairs.', 'eszter', 'Under that sheet they were painted with birds. A little gold, and they will sing again.'],
  ['Make a recipe corner', 'ilie', 'I brought a notebook for recipes, and my cousin sent legume sacks: beans and lentils for the bean dishes.', 'eszter', 'Let people add a memory beside a dish, if they want.', 'mara', 'We will leave pencils here. The menu can grow with the neighbourhood.'],
  ['Open the shared table', 'mara', 'The long table is ready for anyone who wants company.', 'sorin', 'I can stop here between deliveries and still have room for my bag.', 'ilie', 'Your bag may have a chair. Your bicycle must wait outside.'],
  ['Clear the courtyard', 'sorin', 'There is a whole courtyard under these leaves. Miez found it before we did.', 'eszter', 'Our black cat has chosen the sunny wall for a nap.', 'mara', 'Let us make the path clear first, then place the tables. Dochia sends lamb down the hill in her shepherd’s bag now.'],
  ['Plant the herb pots', 'eszter', 'The pots have drainage holes and room for roots.', 'ilie', 'Lovage and parsley close to the kitchen will be useful.', 'mara', 'And rosemary under the window, where the warmth reaches it.'],
  ['Repair the door hood', 'sorin', 'New shingles, every one. Rain will run off the front, not down the door.', 'mara', 'Good. Nobody should have a surprise shower with lunch.', 'eszter', 'I will move the pots before we test it with a watering can.'],
  ['Set the outdoor tables', 'mara', 'Keep a wide route from the gate to the door.', 'eszter', 'Both tables fit along the wall, and the red chairs from the front room came out too.', 'ilie', 'Now I can carry a tray outside without turning sideways. And the butcher’s block for veal fits by the door.'],
  ['Collect family recipes', 'ilie', 'Every page describes a different way to finish the same dish.', 'mara', 'We can keep the names of the people who shared them, with their permission.', 'eszter', 'And write down what we tried, so the next cook can follow it.'],
  ['Prepare the tasting plates', 'eszter', 'Small plates are ready. There is room for notes beside each one.', 'sorin', 'I volunteered to carry them. Tasting was not mentioned, but I remain hopeful.', 'mara', 'Finish the delivery, and we will sit down together.'],
  ['Stock the drinks cabinet', 'mara', 'Socată and fruit tea on one shelf. The traditional spirits on another.', 'ilie', 'Put clear labels on everything, including the cherry compote.', 'sorin', 'Tea for me. There is one more hill on the route home.'],
  ['Print the supper menu', 'eszter', 'The menu shows a picture of each dish. Anyone can ask what is in it.', 'mara', 'The long table is out for the supper. The small ones stay for anyone who wants a quieter seat.', 'ilie', 'Bring a pencil. Sorin set a fish trap in the stream, so trout goes on the menu too.'],
  ['Send the invitations', 'sorin', 'I can deliver the paper invitations along my usual route.', 'mara', 'Tell people they can come alone or bring company.', 'eszter', 'I will dress the gate so the whole street knows. There is room at the table.'],
  ['Prepare the serving station', 'ilie', 'Plates first, then the warm dishes. Bread belongs at both ends.', 'mara', 'And water where everyone can reach it.', 'eszter', 'I have made a little stand for each dish label.'],
  ['Add the final flowers', 'eszter', 'Short stems, so nobody has to talk through a bouquet.', 'sorin', 'The courtyard lights are on. Two bats are circling above the roof.', 'mara', 'A good evening for them, too. Let us leave their corner of the garden quiet.'],
  ['Welcome the community supper', 'mara', 'The doors are open, the food is ready, and we have a place for everyone.', 'ilie', 'Then it is time to put down the notebook and pick up a plate.', 'eszter', 'Tomorrow we can plan more. Tonight, we share the table.'],
];
// Materials and labour are scoped estimates in lei-equivalent coins, not contractor quotes.
// Hours count active person-hours, not elapsed waiting. See the source anchors and assumptions in docs/economy.md.
const workRows: [materials: number, labour: number, hours: number, summary: string][] = [
  [200, 200, 4, 'Replace one broken pane. Prepare and repaint the existing frame and shutters. Keep the sound window structure.'],
  [30, 60, 1.5, 'Sand and repaint the existing sound welcome board. Add a small flower motif.'],
  [30, 40, 1, 'Clean the existing pastry shelf. Add a tray, a liner, and the first pastry display.'],
  [40, 200, 3, 'Mount and connect two supplied lamps. Fit bulbs and check the existing connections.'],
  [90, 150, 3, 'Stabilize the existing worktop. Repair and seal its damaged edge, then polish the existing pans.'],
  [80, 40, 1, 'Buy one small basket of vegetables and garlic. Prepare the first display and preserves batch.'],
  [80, 100, 2, 'Secure and touch up the existing upper shelf. Add the first jars of preserves.'],
  [25, 25, 0.5, 'Use one small chalk slate and chalk. Write and draw the first menu by hand.'],
  [480, 40, 1, 'Buy six handmade bowls and six cups with saucers. Wash and arrange them. Keep them for later meals.'],
  [120, 480, 8, 'Repair, sand, and refinish the existing long table and two chairs. Keep their sound timber.'],
  [20, 20, 0.5, 'Add a notebook and pencils to the existing cabinet. Arrange the recipe corner.'],
  [20, 80, 2, 'Move the prepared table, chairs, and existing dresser. Clean and set the shared places.'],
  [20, 120, 4, 'Sweep a small paved courtyard of about 20 square metres. Bag the leaves and clear the path.'],
  [100, 40, 1, 'Plant three small herbs in three clay pots with soil and drainage.'],
  [900, 400, 8, 'Replace about two square metres of wooden shingles on the sound door hood. Renew fixings and weather seals.'],
  [10, 80, 2, 'Move two existing outdoor tables and chairs. Clean and level them, and keep the path clear.'],
  [15, 60, 2, 'Collect family recipes, copy them onto paper, and pin them above the menu.'],
  [90, 60, 2, 'Prepare twelve small tasting portions and labels. Use the plates and bowls already bought.'],
  [160, 40, 1, 'Buy the first drinks, fruit, and tea stock and labels. Use the existing niche, pitcher, cups, and glasses.'],
  [40, 80, 2, 'Print ten sturdy supper menus and add simple stands. Move the existing long table into the courtyard.'],
  [160, 60, 2, 'Print twenty small invitations. Hang a wreath on the kitchen door. Dress the gate with a lantern and pots of red geraniums, and line the wall with more. Reuse the towels.'],
  [120, 80, 2, 'Set the existing serving table with a cloth and labels. Prepare the first warm dishes and bread. Reuse the plates.'],
  [120, 60, 1.5, 'Hang one outdoor light string. Arrange gathered wildflowers in existing vases.'],
  [60, 60, 2, 'Top up bread, water, and food for eleven guests. Finish setting places and welcome everyone. Reuse the prepared room and tableware.'],
];
// The preparation, by number, that opens each source after the first three. Its scene names the new source.
const unlocks: Record<number, string> = { 3: 'dairy', 5: 'poultry', 6: 'vegetables', 7: 'fruits', 8: 'pork', 11: 'beans', 13: 'lamb', 16: 'veal', 20: 'fish' };
const tasks: Task[] = taskRows.map(([title, a, at, b, bt, c, ct], index) => {
  const [materials, labour, hours, summary] = workRows[index];
  return {
    id: `task_${index + 1}`, chapter: Math.floor(index / 4) + 1, title,
    cost: materials + labour, work: { summary, materials, labour, hours },
    dialogue: [{ speaker: a, text: at }, { speaker: b, text: bt }, { speaker: c, text: ct }],
    ...(unlocks[index + 1] ? { unlock: unlocks[index + 1] } : {}),
  };
});
// The quest campaign. A quest in window w opens after preparation w (0: in a new game), and preparation w + 1 needs it.
// Every quest pays the menu value of its dishes. A requirement row names a dish by its name. The work value of the quests that open
// before each preparation pays for it; questProblems checks the funds.
const questTerms = (rows: [string, number][]) => ({ requirements: rows.map(([name, quantity]) => ({ item: dish(name), quantity })),
  reward: rows.reduce((sum, [name, quantity]) => sum + items[dish(name)].price * quantity, 0) });
// A quest scene is one line by its character, or an exchange of [speaker, text] turns. The requirement rows list the dishes, so the words need not.
type Speech = string | [speaker: string, text: string][];
const lines = (character: string, speech: Speech) => typeof speech === 'string' ? [{ speaker: character, text: speech }] : speech.map(([speaker, text]) => ({ speaker, text }));
type QuestRow = [id: string, character: string, title: string, window: number, requirements: [string, number][], opening: Speech, completion: Speech];
// Each quest of a regular asks for at least one favourite dish.
const questRows: QuestRow[] = [
  ['mara-welcome', 'mara', 'A welcome drink', 0, [['Herb bunch', 2], ['Linden tea', 1]],
    [['mara', 'What if a neighbour walks in and we have nothing to offer? I keep thinking about it.'],
      ['mara', 'The herbs from the basket cost us nothing. A herb bunch for the water jug, and a linden tea. Cold or warm, ready before they sit down.']],
    [['mara', 'Cold and simple. Now, when someone comes in, I will not just stand there and smile.'],
      ['sorin', 'You will still smile. But with a glass.']]],
  ['ilie-counter', 'ilie', 'Bread for the counter', 1, [['Pogăcele', 2], ['Socată', 1]],
    [['ilie', 'In my family, the bread sits where a guest can reach it without asking. Always.'],
      ['mara', 'Then the new counter is yours. Choose the place.'],
      ['ilie', 'I will try each corner with pogăcele. Bread knows where it belongs.']],
    [['ilie', 'Here, beside the plates. My grandmother kept it on the left too.'],
      ['mara', 'Then the left is your corner. Nobody will have to ask twice for bread.']]],
  ['eszter-bowls', 'eszter', 'Try the bowls', 4, [['Mămăligă', 2], ['Sour cream', 1]],
    [['eszter', 'Two servings of mămăligă with sour cream, please. Ilie says that my new bowls leave no room for a spoon.'],
      ['ilie', 'I said my spoon.']],
    [['eszter', 'The spoon fits.'],
      ['ilie', 'So does a second helping.'],
      ['eszter', 'You could have started with that.']]],
  ['sorin-lunch', 'sorin', 'Lunch between errands', 6, [['Pogăcele', 1], ['Potatoes', 1], ['Socată', 1]],
    [['sorin', 'On every street of my round, people ask what we will cook here. I keep saying "soon".'],
      ['sorin', 'Give me a quick lunch at the counter, and I will have a better answer.']],
    [['sorin', 'Now I can tell them. Bread that is still warm, potatoes from the new crate, and socată that is cold.'],
      ['mara', 'Tell them to come and taste it. That works better than a description.']]],
  ['mara-table', 'mara', 'A place at the table', 8, [['Fruit bowl', 1], ['Pork', 1], ['Vegetable basket', 1]],
    [['mara', 'The long table is ready. What if people sit at the far ends and nobody talks?'],
      ['ilie', 'Then put the food in the middle. People always lean in for food.'],
      ['mara', 'A fruit bowl, then, and a few plates beside it. Something that everyone has to pass.']],
    [['mara', 'They passed it, and they talked. You were right, Ilie.'],
      ['ilie', 'My grandmother was right. I only remembered.']]],
  ['eszter-table', 'eszter', 'A small sweet plate', 9, [['Cozonac', 2], ['Chimney cake', 1]],
    [['eszter', 'Every place at the table has a bowl and a cup. Now the small sweet plate needs its place.'],
      ['mara', 'Does it have to be exact?'],
      ['eszter', 'It has to look as if it was always there. Bring sweets, and I will move it until it does.']],
    [['eszter', 'There. Bowl, cup, plate, and nothing crowds anything.'],
      ['mara', 'You moved it eleven times.'],
      ['eszter', 'Twelve. The last time was the right one.']]],
  ['ilie-courtyard', 'ilie', 'Bread for outside', 12, [['Langoș', 1], ['Socată', 1]],
    [['ilie', 'We have a courtyard now. My family never ate outside. My grandmother said that the air makes bread stale.'],
      ['sorin', 'Your grandmother never had a langoș in the sun.'],
      ['ilie', 'Bring one, then, and a socată. I will find the place where it stays soft.']],
    [['ilie', 'By the kitchen door, in the shade. Still warm, and still soft.'],
      ['ilie', 'I will add a line to her notebook. In small letters.']]],
  ['sorin-path', 'sorin', 'A courtyard break', 13, [['Roasted vegetables', 2], ['Socată', 1]],
    [['sorin', 'Before a guest walks the courtyard, I walk it with a full tray. Gate, door, tables.'],
      ['eszter', 'And if you trip?'],
      ['sorin', 'Then you will hear it. Put roasted vegetables on the tray. If the route is bad, I want to drop something cheap.']],
    [['sorin', 'Not one loose stone. The tray reached every chair.'],
      ['eszter', 'And then you ate the test.'],
      ['sorin', 'A test needs a result.']]],
  ['ilie-family', 'ilie', 'A dish from the notebook', 16, [['Cheese board', 1], ['Lentils', 1]],
    [['ilie', 'My great-aunt’s cheese board is in the family notebook. She wrote "a good amount of cheese".'],
      ['eszter', 'How much is a good amount?'],
      ['ilie', 'Nobody knows. Bring one, and we will decide for the family.']],
    [['ilie', 'This is a good amount. I will write it in numbers, beside her words, for the tasting.'],
      ['ilie', 'The next cook will not have to guess. She would hate that. She loved a mystery.']]],
  ['eszter-tasting', 'eszter', 'Match the tasting plates', 17, [['Plum dumplings', 1], ['Cozonac', 2]],
    [['eszter', 'I glazed the tasting plates to match the long table. One plum dumpling and a little cozonac will show me if they are large enough.'],
      ['sorin', 'And if they are too small?'],
      ['eszter', 'Then the dumpling is too large. My plates are correct.']],
    [['eszter', 'Room for the dumpling and its label. I was right.'],
      ['sorin', 'The plates were right. I will clear the test.']]],
  ['mara-supper', 'mara', 'The supper service', 20, [['Cheese board', 1], ['Fresh trout', 2]],
    [['mara', 'I have a bad dream about the supper. The fish reaches the table while the cheese waits.'],
      ['ilie', 'In my family, the cheese always went first.'],
      ['mara', 'Tonight, both go together. Let us practise one service.']],
    [['mara', 'Together, at last. Now I can watch the guests, not the kitchen door.'],
      ['ilie', 'The cheese still went first. By one step.']]],
  ['sorin-welcome', 'sorin', 'Welcome from the gate', 20, [['Zacuscă', 1], ['Diced veal', 2]],
    [['sorin', 'I know every door on my round. On the supper night, I want to meet each one of them at the gate.'],
      ['sorin', 'A meal ready for the first guests who arrive tired from the hill.']],
    [['sorin', 'For years, people on my round asked me in for a meal. Tonight, I give each of them one back.'],
      ['mara', 'And then you sit down too.'],
      ['sorin', 'Then I sit down too.']]],
  ['sorin-first-ride', 'sorin', 'Snacks for the saddlebag', 0, [['Dough', 2], ['Socată', 1]],
    [['sorin', 'The old woman at the top of the hill says that her dough stopped rising when the frost came.'],
      ['sorin', 'I promised her two pieces of ours to start from. And a socată for me, because the hill is steep.']],
    [['sorin', 'Her dough rose before I left. She says that ours woke it up.'],
      ['sorin', 'Her kitchen clock runs backwards, by the way. She says it always has. I did not ask.']]],
  ['victor-exam', 'victor', 'Food for the nerves', 0, [['Shelled corn', 1], ['Loaf', 1], ['Linden tea', 1]],
    'I have an exam on the nervous system tomorrow, and mine is not cooperating. Shelled corn to crunch while I study, some bread, and a linden tea, please.',
    'Much better. I can name every bone in the hand now. I counted mine twice to be sure.'],
  ['ana-night-shift', 'ana', 'Breakfast at midnight', 0, [['Pogăcele', 2], ['Linden tea', 1]],
    'My shift starts at ten tonight. Pogăcele and linden tea will keep me awake until the sun comes up.',
    'Lovely. If anything knocks on the ward door tonight, it will smell garlic and good bread, and it will go home.'],
  ['eszter-first-plate', 'eszter', 'The first plate', 1, [['Mămăligă', 1], ['Pogăcele', 1], ['Linden tea', 1]],
    [['eszter', 'The new window lets the light in. For the first time, I can see my glazes properly.'],
      ['eszter', 'I made a plate. Put food on it, and tell me honestly if the colour suits it.']],
    [['mara', 'Honestly? It suits it.'],
      ['eszter', 'Good. It looks hungry when it is empty. That is exactly right.']]],
  ['costel-sparrow', 'costel', 'Crumbs for a clockwork bird', 2, [['Pogăcele', 1], ['Socată', 1], ['Linden tea', 1]],
    'My mechanical sparrow has learned to steal crumbs. It cannot eat them, but it enjoys the stealing. Some pogăcele and bread, please, and socată for me.',
    'The sparrow took three crumbs and wound itself up with pride. Tick, tick. I will keep the rest.'],
  ['bela-warm-cup', 'bela', 'A warm cup at the gate', 2, [['Pogăcele', 1], ['Linden tea', 1]],
    'I woke up early. The sun is still up, and I do not trust it. A pogăcea and a hot linden tea, please. The night between the graves is long and cold.',
    'Thank you. I will tell the graves about you. Do not worry, they never tell anyone else.'],
  ['mara-lamp-supper', 'mara', 'Supper under the lamps', 3, [['Milk', 2], ['Linden tea', 1]],
    [['mara', 'We have lamps now. I am afraid that the light makes the plates look tired.'],
      ['eszter', 'My plates are never tired.'],
      ['mara', 'Then let us sit down like guests for once, and find out.']],
    [['mara', 'Warm light and a warm plate. I think the room forgives us for the years of dust.'],
      ['eszter', 'And the plate looks rested.']]],
  ['dochia-lunch', 'dochia', 'Lunch for the hill', 3, [['Sour cream', 4], ['Pogăcele', 4], ['Mămăligă', 1], ['Linden tea', 1]],
    'The sheep eat grass all day and never complain. I eat sour cream, and I complain about the grass. Pack me sour cream, pogăcele, and a mămăligă.',
    'The sheep will smell the sour cream and follow me home. That saves me a walk.'],
  ['sanziana-cart', 'sanziana', 'An empty flower cart', 4, [['Papanași', 3], ['Socată', 4], ['Smoked cheese', 1]],
    'I sold every flower on the cart before noon. Papanași and socată, please, and I can pick more before the bees wake up.',
    'The bees are already waiting by the cart. They like your papanași too.'],
  ['dorian-sitting', 'dorian', 'A long sitting', 4, [['Cheese board', 1], ['Papanași', 1], ['Linden tea', 1]],
    'An artist has asked me to sit for a portrait. Looking effortless is hungry work. A cheese board, papanași, and a linden tea for me, please, before I return to the chair.',
    'I sat perfectly still until the tea arrived. The artist says that I am a difficult subject. I prefer interesting.'],
  ['victor-midnight', 'victor', 'The midnight experiment', 5, [['Eggs', 2], ['Linden tea', 1]],
    'My professor wants proof that I can keep something alive all night. Two eggs and a linden tea should keep me alive, at least.',
    'It worked. I was alive at sunrise, and the professor is very impressed. He expected a frog.'],
  ['costel-clock', 'costel', 'Time for something sweet', 7, [['Papanași', 2], ['Plums', 1]],
    'The church clock stopped at half past three. Until I mend it, it is always teatime. Two papanași, please, and a plum for the pendulum. A clock likes things in pairs.',
    'The clock runs again. I set it five minutes fast, so nobody is ever late for dessert.'],
  ['ileana-fitting', 'ileana', 'Lunch between fittings', 8, [['Fruit tea', 1], ['Cherry compote', 1], ['Minced pork', 1]],
    'I have three wedding dresses to finish before Thursday. Fruit tea, cherry compote, and whatever the butcher and the market sent, please, before I sew a sleeve shut by mistake.',
    'All three dresses are done. Joimărița can inspect my house whenever she likes.'],
  ['eszter-green-bowls', 'eszter', 'A second glaze', 9, [['Bulz', 1], ['Pickled cabbage', 2]],
    [['eszter', 'I fired a second set of bowls with a green glaze. Ilie says that blue is traditional.'],
      ['ilie', 'My grandmother had blue bowls.'],
      ['eszter', 'Your grandmother never saw this green. Fill them, and let the food decide.']],
    [['eszter', 'The food likes both. Keep the green bowls with the blue ones.'],
      ['eszter', 'Tap the bowls on the upper shelf to change them whenever you like.']]],
  ['ana-ward-tea', 'ana', 'Tea for the ward', 9, [['Linden tea', 1], ['Chicken noodle soup', 1], ['Roast chicken', 1]],
    'The night patients cannot sleep. A linden tea for them, please, and a proper supper for the porter.',
    'The whole ward is asleep. Even the porter. Especially the porter.'],
  ['cezar-round', 'cezar', 'The end of the round', 9, [['Tochitură', 1], ['Roasted vegetables', 1], ['Socată', 1]],
    'My round ends at dawn. Tochitură and roasted vegetables would make a fine breakfast. Or supper. Whichever this is.',
    'Very good. I will eat it on the way home. My feet know the way.'],
  ['sanziana-meadow', 'sanziana', 'A picnic in the meadow', 10, [['Roasted vegetables', 2], ['Plum dumplings', 3], ['Fruit tea', 2]],
    'My sisters are having a picnic in the meadow. Roasted vegetables for two, and plum dumplings for the rest. I will not tell you how many the rest are.',
    'My sisters thank you, all of them. You may hear singing in the meadow tonight. Please do not go and count us.'],
  ['dochia-march', 'dochia', 'The last cold week', 11, [['Bulz', 2], ['Langoș', 1], ['Smoked cheese', 1], ['Fruit tea', 2]],
    'Spring is close, and I am down to three sheepskins. Bulz, smoked cheese, langoș, and fruit tea, and I will give up another without a fight.',
    'Done. If it snows tomorrow, I am blaming you.'],
  ['dorian-gallery', 'dorian', 'The exhibition', 12, [['Cheese board', 2], ['Cozonac', 1]],
    'A gallery is showing my portrait on Friday. I have invited a few friends to admire it. Two cheese boards and a cozonac for the guests, please.',
    'Everyone admired the portrait. One guest said that its eyes followed her around the room. I hope that she found them attentive.'],
  ['catalina-hail', 'catalina', 'Bell-ringer’s appetite', 12, [['Zacuscă toast', 2], ['Plum dumplings', 1]],
    'A hail cloud came over the hill this morning. I rang it away, and now my arms are hungry. Zacuscă toast and plum dumplings, please. It is a fasting day.',
    'Not one hailstone fell on the village. The bell and I can rest until the next cloud.'],
  ['bran-last-bus', 'bran', 'The last bus', 13, [['Langoș', 1], ['Bulz', 1]],
    'The last bus leaves the square at midnight. Nobody gets on after the bridge, but I stop anyway. A langoș and a bulz for the road, please.',
    'Thank you. The road through the woods is long, and I like company. Even the quiet kind.'],
  ['ileana-thursday', 'ileana', 'Before Thursday', 14, [['Zacuscă toast', 2], ['Langoș', 1]],
    'Thursday is close, and my brother has not touched his spindle. I am taking him zacuscă toast and a langoș, so that he has no excuse.',
    'He spun all night. Nothing was burned, and nobody had a visitor. A good week.'],
  ['victor-thesis', 'victor', 'The thesis supper', 14, [['Cabbage rolls', 2], ['Linden tea', 1]],
    'I finished my thesis at three in the morning, during a thunderstorm. Bring the best of the menu, please. We are celebrating.',
    'My thesis passed. The examiners said it has a life of its own. I am choosing to take that as praise.'],
  ['vlad-after-dark', 'vlad', 'Dinner after dark', 8, [['Red wine', 2], ['Smoked bacon', 1]],
    'Book my table for eight in the evening. I dine only after sunset, an old family habit. Smoked bacon and two carafes of red wine, if you please. No garlic, naturally.',
    'Excellent. The wine is exactly the right shade of red. I am very particular about red.'],
  ['elisabeta-papers', 'elisabeta', 'The estate papers', 8, [['Red wine', 1], ['Roast pork', 1], ['Chicken broth', 1]],
    'A table at eight in the evening, please, and not on the same evening as my neighbour. He has moved the fence between our lands again. Roast pork, chicken broth, and red wine. Red helps me read estate papers.',
    'The papers are in order. My neighbour’s boundary has moved a little toward my land. How odd.'],
  ['vlad-guest', 'vlad', 'A guest at the castle', 8, [['Red wine', 1], ['Roast pork', 1], ['Tochitură', 1]],
    'A guest from abroad comes to my castle soon, on a matter of property. Book my table for eight in the evening, on a night when the countess is not here. I must give him roast pork, tochitură, and plenty of red wine. First impressions matter.',
    'Splendid. My guest will feel very welcome. Nobody ever wants to leave my castle. Nobody ever does.'],
  ['cezar-castle-lights', 'cezar', 'Lights on the hill', 16, [['Veal', 2], ['Bean soup', 1]],
    'Somebody keeps lighting candles in the castle on the hill. It is not my district, but I like to watch with a warm plate. Veal from the new butcher’s block and a bean soup, please.',
    'The candles went out at midnight. I stayed awake for all of it. Well, for most of it.'],
  ['ana-saint-andrew', 'ana', 'Saint Andrew’s Eve', 17, [['Smoked cheese', 1], ['Langoș', 1], ['Linden tea', 1]],
    'Tonight is Saint Andrew’s Eve. I will hang the garlic early, and then I want a proper supper: smoked cheese, a langoș, and a linden tea.',
    'The garlic is up and the plates are clean. Let anything knock tonight. We are fed, and we smell of garlic.'],
  ['costel-doll', 'costel', 'The dancing doll', 18, [['Cozonac', 1], ['Plum brandy', 1], ['Papanași', 1]],
    'I have finished a dancing doll for the village fair. She dances very well, but she stares a little. Cozonac, papanași, and a plum brandy to celebrate?',
    'She danced through the whole fair. Only one child cried, and that was because the cozonac ran out.'],
  ['bran-horse', 'bran', 'A ride through the woods', 18, [['Zacuscă toast', 1], ['Smoked cheese', 1], ['Langoș', 1]],
    'On my day off, I ride through the woods. The horse wants apples. I want zacuscă toast, smoked cheese, and langoș.',
    'A fine ride. People ran off the road when they saw us, but I think that was the horse. It is very tall.'],
  ['catalina-cloud-rider', 'catalina', 'The cloud rider', 18, [['Green beans', 2], ['Plum dumplings', 1]],
    'A stranger with a long beard and a book is asking about the weather. I do not like it. Green beans and plum dumplings, so that I can keep watch from the tower.',
    'He rode off on a very dark cloud. The weather is fine now. Thank you for the plum dumplings.'],
  ['sanziana-midsummer', 'sanziana', 'Midsummer Eve', 19, [['Plum dumplings', 2], ['Zacuscă', 2], ['Socată', 2], ['Bean dip', 2]],
    'It is almost Midsummer Eve. We dance until dawn, so we need plum dumplings and zacuscă. Dancing is hungry work.',
    'We danced until sunrise and wove a crown for you. It hangs on the gate. Do not wear it after dark.'],
  ['dorian-birthday', 'dorian', 'A quiet birthday', 20, [['Cozonac', 1], ['Cheese board', 1], ['Red wine', 1]],
    'It is my birthday. I will not say which one. Cozonac, a cheese board, and a glass of red wine, please, and no candles. There are never enough.',
    'Thank you. The portrait in my attic sends its regards. It had a much harder day than I did.'],
  ['elisabeta-bath', 'elisabeta', 'An evening at the manor', 15, [['Roast lamb', 1], ['Tochitură', 1], ['Red wine', 1]],
    'I am taking the evening off for a long bath at my manor. Afterwards, a table at eight, please: roast lamb, tochitură, and a carafe of red wine. Do not ask what is in the bath. Rose petals. Only rose petals.',
    'Wonderful. My maids say that I look younger every year. I tell them that it is the tochitură.'],
  ['ileana-towels', 'ileana', 'Towels for the gate', 21, [['Stuffed peppers', 2], ['Fried trout', 1]],
    'I am embroidering the towels for the supper gate. Bring stuffed peppers and a fried trout, and I will finish the last corner.',
    'The towels are done. Each corner has a little red rooster. They keep watch better than Cezar.'],
  ['bran-pumpkins', 'bran', 'The pumpkin fair', 21, [['Langoș', 1], ['Minced veal', 1], ['Cabbage rolls', 1]],
    'The town has a pumpkin fair this weekend. Last year I carved the best pumpkin head. People said that I understand heads very well. A langoș, minced veal, and cabbage rolls, please.',
    'The langoș is for the bus. The rest is for me. The pumpkin head is for anyone who needs one.'],
  ['cezar-sleepwalk', 'cezar', 'A supper to remember', 22, [['Tochitură', 1], ['Mici', 1], ['Cabbage rolls', 1]],
    'Last night I woke up in your courtyard with an empty plate. I do not remember eating. Tochitură, mici, and cabbage rolls, please, so that I remember this time.',
    'I remember every bite. Thank you. If you see me in the courtyard tonight, please wave.'],
  ['ileana-blue-cloth', 'ileana', 'A blue table cloth', 22, [['Zacuscă', 1], ['Zacuscă toast', 1]],
    'I embroidered a blue cloth for the serving table. Let us test it with zacuscă and a zacuscă toast. The stains will tell us if it is ready.',
    'Not a single stain. The blue cloth is yours too. Tap the serving table in the courtyard to change the cloth whenever you like.'],
  ['catalina-supper-bell', 'catalina', 'The supper bell', 23, [['Saramură with mămăligă', 1], ['Bean stew', 1], ['Plum dumplings', 1]],
    'For the supper, I will ring the bell to call everyone in. That is a lot of rope to pull. Saramură with mămăligă, bean stew, and plum dumplings, please.',
    'I will ring it loud enough for the whole valley. The next valley too, if they bring a dish.'],
  ['sanziana-lilacs', 'sanziana', 'Lilacs for the dresser', 23, [['Plum dumplings', 2], ['Roasted vegetables', 2], ['Fruit tea', 2], ['Zacuscă', 1], ['Cherry compote', 2]],
    'Wildflowers are lovely, but lilacs smell like the evening. Bring plum dumplings, roasted vegetables, and fruit tea, and I will bring an armful.',
    'The lilacs are ready. When the supper starts, tap the jug on the dresser in the front room to change the flowers whenever you like.'],
  ['ilie-stove', 'ilie', 'A test for the stove', 0, [['Langoș', 2], ['Cornmeal', 1]],
    [['ilie', 'My grandmother cooked on this stove. She said that it sulks if you rush it.'],
      ['eszter', 'Stoves do not sulk.'],
      ['ilie', 'Then a test bake will prove one of us wrong.']],
    [['ilie', 'Even heat on both sides. It sulks only at the back now, like a cat.'],
      ['eszter', 'Fine. It sulks.']]],
  ['dochia-sheepskin', 'dochia', 'One sheepskin fewer', 0, [['Mămăligă', 2], ['Pogăcele', 2], ['Langoș', 1], ['Linden tea', 1]],
    'The wind on the hill is still cold, so I am wearing all nine sheepskins. Mămăligă, bread, and a hot linden tea would warm me enough to take one off.',
    'There. One sheepskin fewer. Eight to go before summer, and the weather is watching me.'],
  ['eszter-cups', 'eszter', 'Cups for the counter', 0, [['Pogăcele', 1], ['Langoș', 2]],
    [['eszter', 'I brought my first cups down from the workshop. I threw every one of them on my own wheel.'],
      ['ilie', 'One has a crooked handle.'],
      ['eszter', 'That one has character. Fill two with water, and we will see who complains.']],
    [['eszter', 'Not one drop spilled, crooked handle included.'],
      ['eszter', 'I am still taking that one home. It looks at me.']]],
  ['costel-ticking', 'costel', 'A ticking in the wall', 0, [['Socată', 1], ['Langoș', 1], ['Bread basket', 1]],
    'Something in your wall ticks, and it is not one of my clocks. Socată, a langoș, and a whole bread basket, and I will listen to it properly.',
    'It is a beetle with excellent timing. I have offered it an apprenticeship.'],
  ['mara-cellar', 'mara', 'A look at the cellar', 0, [['Bread basket', 1], ['Langoș', 1], ['Mămăligă', 1]],
    [['mara', 'Before we spend a coin, I want to see what the cellar kept for us.'],
      ['sorin', 'I can hold the lamp. From the top of the stairs.'],
      ['mara', 'Then we need a snack. Courage is easier with bread.']],
    [['mara', 'Three empty barrels, one good ladder, and a very polite spider.'],
      ['sorin', 'It waved. I waved back. It seemed the right thing to do.']]],
  ['victor-skeleton', 'victor', 'Lunch for the skeleton', 1, [['Langoș', 1], ['Mămăligă', 1], ['Linden tea', 1]],
    'The university lent me a skeleton to study at home. I set a place for him out of habit. Langoș, mămăligă, and linden tea, please. He will not eat his share.',
    'He did not eat a bite, so I had both. I think we are becoming friends.'],
  ['ana-garlic', 'ana', 'Garlic duty', 2, [['Pogăcele', 1], ['Linden tea', 1], ['Langoș', 1]],
    'It is my turn to hang garlic on every door of the ward. That is a lot of doors. Langoș, pogăcele, and a linden tea, please, before I start.',
    'Every door has its garlic. The ward smells terrible, and nothing knocked all night. Perfect.'],
  ['sorin-tyre', 'sorin', 'A patched tyre', 3, [['Langoș', 1], ['Cottage cheese', 2]],
    [['sorin', 'Something bit my front tyre on the forest road. Probably a nail.'],
      ['ilie', 'Probably?'],
      ['sorin', 'The tyre has two small holes, side by side. I will think about it while I patch it, and eat while I think.']],
    [['sorin', 'Patched. I found a nail by the road, and I have decided that it was that nail.'],
      ['ilie', 'Take the town road tomorrow.']]],
  ['dochia-shearing', 'dochia', 'Shearing day', 3, [['Telemea', 4], ['Pogăcele', 2], ['Socată', 1], ['Mămăligă', 1], ['Loaf', 2], ['Linden tea', 2]],
    'Today I shear the sheep, and the sheep have opinions. Telemea, pogăcele, a mămăligă, and a socată, please. I need my strength.',
    'All the sheep are shorn. Now they look cold and I look warm. I will give one sheepskin back. Maybe.'],
  ['ilie-pickles', 'ilie', 'Jars for winter', 4, [['Bulz', 2], ['Cheese pie', 1]],
    [['ilie', 'My grandmother pickled everything that stood still long enough. I want to fill the cellar jars her way.'],
      ['mara', 'Her way takes all afternoon.'],
      ['ilie', 'That is why I need a proper lunch first.']],
    [['ilie', 'Full and labelled, in her order. Cabbage, then peppers, then plums.'],
      ['ilie', 'One label says "Do not open before winter". I did not write that one.']]],
  ['costel-key', 'costel', 'A key that hums', 4, [['Papanași', 1], ['Smoked cheese', 1], ['Cheese pie', 1]],
    'I found an old key under the counter, and it hums near the cellar door. Papanași, smoked cheese, and cheese pie, and I will find out what it wants.',
    'It wanted oil. It stopped humming and started purring. I am keeping it on a ribbon.'],
  ['eszter-kiln', 'eszter', 'Waiting for the kiln', 5, [['Sweet dough', 2], ['Chicken', 1]],
    [['eszter', 'My best glaze yet is in the kiln. If I open it early, it cracks.'],
      ['eszter', 'So bring me something to eat standing up. My hands need a job.']],
    [['eszter', 'It opened, and nothing cracked. Look at that blue.'],
      ['sorin', 'She was patient for almost the whole hour. I counted.']]],
  ['mara-candles', 'mara', 'Candles in the window', 8, [['Pickled cabbage', 1], ['Sausages', 1], ['Socată', 1]],
    [['mara', 'In this village, a candle in the window means that the door is open to anyone.'],
      ['sorin', 'On my round, only three houses still do it. The others stopped years ago.'],
      ['mara', 'Then we will be the fourth. Let us light ours and have supper beside it.']],
    [['mara', 'Two neighbours waved, and one of them came in.'],
      ['sorin', 'And an owl stared all evening. Nobody invited it. It came anyway.']]],
  ['sorin-postbag', 'sorin', 'A heavy post bag', 9, [['Roasted vegetables', 2], ['Langoș', 1]],
    [['sorin', 'Everyone in the valley is sending letters this week, and every one of them lives up a hill.'],
      ['sorin', 'One letter has no name. Only an address: "the house that is not there".'],
      ['mara', 'Eat first. Then decide what to do with it.']],
    [['sorin', 'Every letter is delivered. I left the strange one at the crossroads, and by morning it was gone.'],
      ['mara', 'Was there a reply?'],
      ['sorin', 'A dry leaf, folded like a letter. I am not delivering that.']]],
  ['dochia-fair', 'dochia', 'The sheep fair', 14, [['Cheese board', 1], ['Zacuscă toast', 2], ['Bulz', 2], ['Lamb', 4], ['Mămăligă', 1], ['White beans', 2]],
    'Tomorrow is the sheep fair, and my ram wants to win. He will not, but I bring food so that he loses with dignity. Enough for the ram, the judges, and me, please.',
    'He won second prize. First prize went to a goat, which is not even a sheep. We are appealing.'],
  ['dorian-sitter', 'dorian', 'Company after dark', 14, [['Cozonac', 1], ['Cheese board', 1], ['Red wine', 1]],
    'A gentleman from the castle has invited me to a candlelit supper. Cozonac, a cheese board, and red wine, please. His evenings tend to last until dawn.',
    'A charming evening. My host had no mirrors, so I checked my cravat in a spoon. One must make an effort for good company.'],
  ['cezar-long-night', 'cezar', 'The longest night', 14, [['Tochitură', 1], ['Bean soup', 1], ['Sharing board', 1]],
    'Tonight is the longest night of the year, and I walk all of it. Tochitură, bean soup, and a sharing board, please. One bite for every hour.',
    'The sun came up at last. I counted fourteen hours, two owls, and one shadow that walked home with me. It was polite.'],
  ['eszter-kiln-party', 'eszter', 'The kiln party', 14, [['Plum dumplings', 1], ['Lamb cuts', 1], ['Fruit tea', 1]],
    [['eszter', 'The new kiln is finished. Potters celebrate by watching it heat up.'],
      ['ilie', 'For how long?'],
      ['eszter', 'Three hours. Bring food for two. You are invited.']],
    [['ilie', 'We watched it for three hours.'],
      ['eszter', 'And?'],
      ['ilie', 'The best party of the year. Do not tell anyone that I said that.']]],
  ['ilie-cellar', 'ilie', 'The cellar shelves', 14, [['Bean soup', 2], ['Lamb chops', 1]],
    [['ilie', 'I built new shelves in the cellar, to my grandfather’s plan. Something keeps moving the jars to the left.'],
      ['mara', 'Mice?'],
      ['ilie', 'Mice do not line them up. I will eat down there and watch.']],
    [['ilie', 'The jars stayed still while I ate. When I went upstairs, they moved again.'],
      ['ilie', 'We have agreed to share. My jars on the right, and whoever it is on the left.']]],
];
// Three quests offer a second finish for a decoration. Delivery adds the finish, and the player can then switch it in the room.
const finishes: Record<string, Quest['unlocks']> = {
  'eszter-green-bowls': { slot: 'tableware', variant: 'green' }, 'ileana-blue-cloth': { slot: 'textiles', variant: 'blue' }, 'sanziana-lilacs': { slot: 'flowers', variant: 'lilacs' },
};
// Vlad and Elisabeta book a table for the evening, never on the same evening.
const bookedGuests = ['vlad', 'elisabeta'];
const campaign: { window: number; quest: Quest }[] = questRows.map(([id, character, title, window, requirements, opening, completion]) => ({ window, quest: {
  id, character, title, afterTask: window ? `task_${window}` : null, ...questTerms(requirements), opening: lines(character, opening), completion: lines(character, completion),
  ...(finishes[id] ? { unlocks: finishes[id] } : {}), ...(bookedGuests.includes(character) ? { booked: true } : {}) } }));
// The travellers return three times each, in one shared sequence, at fixed places in the campaign.
const visitorRows: QuestRow[] = [
  ['adrian-first-pack', 'adrian', 'Provisions for the hill', 6, [['Langoș', 4], ['Smoked cheese', 2], ['Pogăcele', 6]],
    [['adrian', 'The old cathedral on the hill has a staircase behind the altar. It goes down further than the hill is tall.'],
      ['sorin', 'I pass it on my round. At night, it groans. I always thought that it was the wind.'],
      ['adrian', 'There is no wind under a cathedral. We will go down and look, and we need food for several days.']],
    'The pack is full. If we are not back in a week, do not send anyone. Send more pogăcele.'],
  ['monica-first-pack', 'monica', 'Something for the cook', 8, [['Plum jam', 4], ['Sausages', 4], ['Smoked cheese', 4]],
    [['monica', 'We are back from the first floors under the cathedral. Dust, bones, and a very large cook with a cleaver.'],
      ['monica', 'He shouted about fresh meat and chased Adrian up two flights of stairs.'],
      ['mara', 'A cook? Did he say where he trained?'],
      ['monica', 'We did not stop to ask. This time, we bring him something better than Adrian.']],
    'We will leave the sausages on the stairs for him. A cook that busy never gets a hot meal.'],
  ['janos-first-pack', 'janos', 'A long reading', 9, [['Langoș', 3], ['Bread basket', 1], ['Red wine', 2], ['Pogăcele', 6]],
    [['janos', 'The cook ate all the sausages and fell asleep on his cleaver. We walked straight past him.'],
      ['janos', 'Deeper under the cathedral, a king of bones sits on a stone throne. He still wears his crown, and he still asks for taxes.'],
      ['ilie', 'In coins?'],
      ['janos', 'In bread, it seems. I want to read the marks on his throne, and that is a long reading.']],
    'Sit a while, and listen, I will tell him. Then I will read him his own family history. Nobody stays awake for that.'],
  ['adrian-second-pack', 'adrian', 'Supper for the watch', 13, [['Bread basket', 1], ['Loaf', 5], ['Pogăcele', 6]],
    [['adrian', 'The bone king fell asleep at chapter two, as Janos promised. Under his throne, the cathedral has catacombs.'],
      ['adrian', 'A small goblin lives down there. He begs for mercy whenever he sees us, and he keeps promising us a gift.'],
      ['sorin', 'What is the gift?'],
      ['adrian', 'So far, a rock. We will keep watch down there for several nights, so we need proper suppers.']],
    'Most of the bread is for us. One bread basket is for the goblin. Perhaps he will give us a better rock.'],
  ['monica-second-pack', 'monica', 'The longer path', 14, [['Bread basket', 1], ['Cherry compote', 6], ['Lamb stew', 7]],
    [['monica', 'The goblin kept his promise. The rock is a map now. He scratched it himself.'],
      ['monica', 'It shows caves under the cathedral catacombs, and a stream that runs all the way up to your village well.'],
      ['mara', 'So that is why the well water tastes of matches on some mornings.'],
      ['monica', 'We will follow the stream. It is a long path, so we need a large pack.']],
    'Packed. Until we come back, do not drink from the well. Drink cherry compote. It is safer, and it is cherry compote.'],
  ['janos-second-pack', 'janos', 'Meals beside the notes', 17, [['Chimney cake', 1], ['Tochitură', 2], ['Sharing board', 1]],
    [['janos', 'Your well is clean again. Monica moved a family of very damp lizards out of the stream.'],
      ['janos', 'Below the caves, under the cathedral, I found a letter from the archbishop who left this village forty years ago.'],
      ['mara', 'With the money for the church roof. My grandmother never forgave him.'],
      ['janos', 'She was right. In the letter, he writes to someone further down, and he calls them “my lord”.']],
    'We will read the rest in the library down there. Its librarian screams when anyone turns a page, but a chimney cake keeps him quiet.'],
  ['adrian-third-pack', 'adrian', 'One more stay', 19, [['Langoș', 2], ['Socată', 4], ['Loaf', 6]],
    [['adrian', 'Below the library, the stone under the cathedral turns red and warm. Ilie, you could bake bread on those walls.'],
      ['ilie', 'Is the heat even?'],
      ['adrian', 'Hotter at the back, like your stove. The archbishop is down there. He preaches to an empty hall, and we need one more stay to learn who listens.']],
    'That covers the stay. If you hear a bell ring under the hill, it is only the archbishop. Probably.'],
  ['monica-third-pack', 'monica', 'A careful return', 21, [['Loaf', 1], ['Meatballs', 4], ['Smoked trout', 4], ['Pickled cabbage', 3]],
    [['monica', 'Nobody listens to the archbishop. He preaches to a door, a great red door at the very bottom, sixteen floors under the cathedral.'],
      ['monica', 'Behind it, something snores. The stones shake with each breath.'],
      ['sorin', 'So that is the groaning that I hear on my round.'],
      ['monica', 'That is the groaning. We go back carefully, and this time we do not knock.']],
    'The meatballs are for the archbishop. A man who preaches that long must be hungry, and a full man preaches less.'],
  ['janos-third-pack', 'janos', 'The last loose pages', 22, [['Saramură', 4], ['Veal stew', 1], ['Cherry compote', 4], ['Pickled cabbage', 3]],
    [['janos', 'The archbishop ate the meatballs and fell asleep in the middle of a sermon. I borrowed his loose pages.'],
      ['janos', 'They name what sleeps behind the red door under the cathedral. I will not say that name in a kitchen.'],
      ['mara', 'Will it wake up?'],
      ['janos', 'Not this year, if nobody knocks. We need a few quiet days to read the rest.']],
    [['janos', 'We will read the last pages down there. When we come back, we will tell you everything over a proper meal.'],
      ['janos', 'Until then, if a stranger asks for the way to a red door, send him to the bistro for cozonac.']]],
];
for (const [index, [id, character, title, window, requirements, opening, completion]] of visitorRows.entries()) {
  campaign.push({ window, quest: { id, character, title, afterTask: `task_${window}`, ...(index ? { afterQuest: visitorRows[index - 1][0] } : {}),
    ...questTerms(requirements), opening: lines(character, opening), completion: lines(character, completion) } });
}
campaign.push({ window: 9, quest: { id: 'ionatan-castle-dinner', character: 'ionatan', title: 'Dinner before the castle', afterTask: 'task_9', afterQuest: 'vlad-guest',
  ...questTerms([['Plum brandy', 1], ['Sharing board', 1], ['Tochitură', 1]]),
  opening: [{ speaker: 'ionatan', text: 'I have come from abroad to close a real-estate deal with a local noble at the nearby castle. Before I continue, I would like a proper dinner.' }],
  completion: [{ speaker: 'ionatan', text: 'An excellent dinner. Here is the payment, with my thanks. My papers are in order, and I must leave for the castle now. My journey takes me on from there, so I will not return. Farewell.' }] } });
campaign.push({ window: 10, quest: { id: 'mina-avram-search', character: 'mina', companions: ['avram'], title: 'A meal before the search', afterTask: 'task_10',
  afterQuest: 'ionatan-castle-dinner', ...questTerms([['Zacuscă', 2], ['Roasted vegetables', 2], ['Smoked cheese', 1], ['Fruit tea', 1]]),
  opening: [{ speaker: 'mina', text: 'Ionatan is my fiancé. He came from Britain to sign a property contract at the castle, but he has not written back. Have you seen him?' },
    { speaker: 'mara', text: 'He had dinner here and left for the castle. He has not returned to the bistro.' },
    { speaker: 'avram', text: 'Then Mina and I will follow that road together. Before we leave, could you prepare a meal for two?' },
    { speaker: 'mina', text: 'No meat or fish, please. Eggs and dairy are fine.' }],
  completion: [{ speaker: 'mina', text: 'Thank you for the meal and for telling us which road he took. We must find out why his letters stopped.' },
    { speaker: 'avram', text: 'We shall leave for the castle together now. I have my medical bag, should he need help.' },
    { speaker: 'mara', text: 'I hope you find him safe. Take care on the road.' }],
  followUp: { id: 'mina-avram-news', title: 'News from the road', afterDeliveries: 3,
    dialogue: [{ speaker: 'sorin', text: 'There is news going round the village. Mina and Doctor Avram found Ionatan gravely ill. All three have left for Britain. They did not stop at our bistro on the way back.' },
      { speaker: 'mara', text: 'Then he is no longer alone. I hope he recovers at home. Thank you for bringing the news, Sorin.' }] } } });
// After the last preparation, Mara cooks the community supper: one plate for each guest, to the taste of each one. Its delivery pays
// nothing and earns the finale. The plates use every chain, and each regular at the supper gets a favourite dish.
const supperPlates: [guest: string, plate: string][] = [
  ['mara', 'Cabbage rolls with mămăligă'], ['ilie', 'Bean soup in a bread bowl'], ['eszter', 'Drob'], ['sorin', 'Plum dumplings'],
  ['costel', 'Papanași'], ['victor', 'Meatball soup'], ['ana', 'Chicken noodle soup'], ['ileana', 'Stuffed peppers'], ['bran', 'Mici'],
  ['catalina', 'Saramură with mămăligă'], ['cezar', 'Tochitură'],
];
campaign.push({ window: 24, quest: { id: 'mara-community-supper', character: 'mara', title: 'The community supper', afterTask: 'task_24', finale: true,
  requirements: supperPlates.map(([, plate]) => ({ item: dish(plate), quantity: 1 })), reward: 0, guests: supperPlates.map(([guest]) => guest),
  opening: lines('mara', [['mara', 'Every quest is delivered, and every table is set. Only the supper itself is left to cook: one plate for each guest, to each one’s taste.'],
    ['sorin', 'I asked on my round. Vlad and Elisabeta sent their regrets. They do not eat supper, they said. Not this kind.'],
    ['ilie', 'Then we are eleven, and the courtyard has ten seats.'],
    ['mara', 'I will stand. A host never sits until the pot is empty. Tonight the bistro cooks, and nobody pays a coin.']]),
  completion: [] } });
// When the purse is low, Ana asks for linden tea for the night ward. The herbs are free, so a player with an empty purse can always
// cook it. The quest stands outside the order of Ana's other quests, keeps no record, and returns while the purse stays low.
const recovery: Quest = { id: 'ana-night-ward-tea', character: 'ana', title: 'Tea for the night ward', afterTask: null, recovery: true,
  ...questTerms([['Linden tea', 1]]),
  opening: lines('ana', [['ana', 'Your purse looks thin tonight, Mara. Mine too, at the end of the month.'],
    ['ana', 'The night ward needs linden tea, and the herbs cost you nothing. Bring me a cup, and the ward pays for it.'],
    ['mara', 'And if the purse is still thin tomorrow?'],
    ['ana', 'Then I come back tomorrow. Patients never run out of nights.']]),
  completion: [] };
// The tickets show open quests in authored order, so the quests are listed in the order in which they open.
// A booked guest comes last in the window: the quests before the evening bring the dishes of the dinner into the recipe book.
const quests: Quest[] = [recovery, ...campaign.sort((first, second) => first.window - second.window
  || Number(!!first.quest.booked) - Number(!!second.quest.booked)).map(({ quest }) => quest)];
// The renovation: every preparation repaints one room, so the bistro visibly improves as the player spends coins.
// Each area is a series of 3:4 portrait paintings (docs/specs/001-visible-renovation-art-plan.md). A state shows every change paid for in its area.
const areas: Area[] = [
  { id: 'front-room', name: 'The front room', unlock: null },
  { id: 'courtyard', name: 'The courtyard', unlock: 'task_13' },
];
// Preparation number (0: the new game), area, focus x and y (the centre of the change, in percentages of the painting), and the words for the change.
// Focus is the measured centre of the change in the accepted painting.
const roomRows: [after: number, area: string, x: number, y: number, text: string][] = [
  [0, 'front-room', 50, 30, 'The front room at blue hour: the teal tiled stove glows, and the square window looks over the village. Cobwebs hang in the broken window, and a few small spiders keep house on the window web. One small spider lives under the upper wall shelf, by its left bracket.'],
  [1, 'front-room', 81, 33, 'The broken window is fixed: new glass, a cobalt frame and folk-painted shutters. Every web is gone, and the spiders left through the window, all but one.'],
  [2, 'front-room', 51, 62, 'The welcome board hangs on the wall, mended and painted with folk flowers.'],
  [3, 'front-room', 46, 34, 'Round pastries wait on the lower wall shelf.'],
  [4, 'front-room', 50, 12, 'Both hanging lamps are lit.'],
  [5, 'front-room', 57, 46, 'The worktop is mended, and the copper pans on their pegs are polished bright.'],
  [6, 'front-room', 12, 10, 'Strings of red peppers and garlic from the market hang from the hook beside the herbs.'],
  [7, 'front-room', 40, 17, 'Jars of zacuscă and preserves stand on the upper shelf.'],
  [8, 'front-room', 8, 58, 'The first menu, drawn in chalk on a small slate, leans on the low cabinet.'],
  [9, 'front-room', 49, 22, 'Blue bowls from three firings stand beside the jars on the upper shelf.'],
  [10, 'front-room', 87, 72, 'The old dust sheet is gone from the corner. Two restored chairs, painted red with gold birds, wait for the long table.'],
  [11, 'front-room', 12, 60, 'A recipe notebook and a cup of pencils sit on the low cabinet.'],
  [12, 'front-room', 87, 70, 'The chairs have gone to the shared table, and a small dresser stands in their place.'],
  [13, 'courtyard', 50, 50, 'The courtyard behind the kitchen, its cobbled path swept clear of leaves from the gate to the door.'],
  [14, 'courtyard', 34, 59, 'Clay pots of rosemary, parsley and lovage stand by the kitchen door.'],
  [15, 'courtyard', 18, 30, 'The wooden hood over the kitchen door has new shingles and sheds the rain clear of the door.'],
  [16, 'courtyard', 58, 68, 'Two outdoor tables stand along the wall with the red chairs from the front room, leaving a wide path from the gate to the door.'],
  [17, 'front-room', 10, 50, 'Family recipes on loose pages, sketched in coloured pencil, are pinned to the wall above the chalk menu.'],
  [18, 'courtyard', 58, 64, 'Small blue-painted tasting plates wait on the outdoor tables.'],
  [19, 'courtyard', 22, 58, 'A niche in the thick old wall under the kitchen window holds a blue-painted pitcher, matching cups, glasses and bottles of socată.'],
  [20, 'courtyard', 58, 63, 'A long shared table now stands in the courtyard for the supper, and a small picture menu, painted with its dishes, stands on every table. The two small tables stay for shyer guests.'],
  [21, 'courtyard', 84, 52, 'A harvest wreath hangs on the kitchen door, embroidered towels drape the gate posts beside a warm lantern, and red geraniums line the wall: there is room at the table.'],
  [22, 'courtyard', 12, 76, 'A serving table waits by the kitchen door under a cross-stitch cloth: a stack of folk plates, two lidded earthenware dishes of warm food, and a round and a plaited loaf of bread.'],
  [23, 'courtyard', 55, 40, 'A string of warm lights runs across the courtyard from the gutter into the walnut tree, and vases of wildflowers stand on every table for the supper.'],
  [24, 'front-room', 80, 34, 'The front room is ready for the supper: an embroidered towel hangs across the top of the window, and a jug of wildflowers stands on the dresser. A second black cat sleeps on the counter.'],
];
// The New pin of each state: a short name of the change, and the point on the top edge of the change (measured on the accepted
// paintings) where the pin's tail touches, so the pin points at the change without covering it. Under the hanging lamps the pin hangs below the mark.
const pins: Record<number, [label: string, x: number, y: number, below?: true]> = {
  0: ['the unfinished room', 50, 30], 1: ['the mended window', 81, 18], 2: ['the welcome board', 53, 48], 3: ['the pastry plate', 46, 23],
  4: ['lamps lit', 50, 14, true], 5: ['polished copper', 57, 38], 6: ['peppers and garlic', 6, 9], 7: ['jars of preserves', 39, 14],
  8: ['the chalk menu', 12, 53], 9: ['blue bowls', 53, 13], 10: ['the painted chairs', 82, 51], 11: ['the recipe notebook', 7, 60],
  12: ['the painted dresser', 82, 52], 13: ['the swept courtyard', 50, 50], 14: ['herb pots', 34, 50], 15: ['the new door hood', 13, 26],
  16: ['outdoor tables', 56, 50], 17: ['family recipes', 12, 40], 18: ['tasting plates', 56, 50], 19: ['the drinks niche', 22, 51],
  20: ['the long table', 55, 62], 21: ['the festive gate', 88, 44], 22: ['the serving table', 12, 67], 23: ['lights and flowers', 55, 13],
  24: ['ready for the supper', 80, 15],
};
const rooms: RoomState[] = roomRows.map(([after, area, x, y, text]) => {
  const [label, markX, markY, below] = pins[after];
  return { id: `${area}-${String(after).padStart(2, '0')}`, area, after: after ? `task_${after}` : null, focus: { x, y }, mark: { x: markX, y: markY, ...(below ? { below } : {}) }, label, text };
});
const initial = Array<string | null>(42).fill(null);
const decorationSlots: DecorationSlot[] = [
  { id: 'tableware', name: 'Tableware', area: 'front-room', unlock: 'task_9', default: 'blue',
    variants: [{ id: 'blue', name: 'Blue bowls', image: 'front-room-09' }, { id: 'green', name: 'Green bowls', image: 'decoration-front' }],
    crop: { x: 49, y: 13, width: 10, height: 6 } },
  { id: 'textiles', name: 'Courtyard table cloth', area: 'courtyard', unlock: 'task_22', default: 'red',
    variants: [{ id: 'red', name: 'Red embroidery', image: 'courtyard-22' }, { id: 'blue', name: 'Blue embroidery', image: 'decoration-courtyard' }],
    crop: { x: 0, y: 67, width: 26, height: 15 } },
  { id: 'flowers', name: 'Final flowers', area: 'front-room', unlock: 'task_24', default: 'wildflowers',
    variants: [{ id: 'wildflowers', name: 'Wildflowers', image: 'front-room-24' }, { id: 'lilacs', name: 'Lilacs', image: 'decoration-front' }],
    crop: { x: 72, y: 39, width: 21, height: 15 } },
];
initial[1] = 'generator_grain';
initial[4] = 'generator_corn';
initial[31] = 'generator_herbs';
initial[13] = 'grain_1';
initial[14] = 'grain_1';
initial[22] = 'corn_1';
initial[27] = 'herbs_1';
// Two Socată wait by the Herb basket, so a Linden tea is one merge away from the first day.
initial[32] = 'herbs_3';
initial[33] = 'herbs_3';
const layouts: BoardLayout[] = [
  { id: 'workbench-clutter-1', obstacles: [
    { id: 'old-crate', position: 0, name: 'Old crate', type: 'clutter', ingredient: 'grain_3', sprite: 0 },
    { id: 'tied-sack', position: 5, name: 'Tied sack', type: 'clutter', ingredient: 'corn_2', sprite: 1 },
    { id: 'covered-crock', position: 36, name: 'Covered crock', type: 'clutter', ingredient: 'herbs_2', sprite: 2 },
    { id: 'linen-bundle', position: 41, name: 'Linen bundle', type: 'clutter', ingredient: 'grain_2', sprite: 3 },
    { id: 'tied-dough', position: 6, name: 'Tied dough', type: 'anchored', ingredient: 'grain_2' },
    { id: 'tied-corn-cobs', position: 11, name: 'Tied corn cobs', type: 'anchored', ingredient: 'corn_1' },
    { id: 'tied-elderflowers', position: 37, name: 'Tied elderflowers', type: 'anchored', ingredient: 'herbs_1' },
    { id: 'tied-shelled-corn', position: 40, name: 'Tied shelled corn', type: 'anchored', ingredient: 'corn_2' },
  ] },
];
// Each finished preparation leaves its own materials and supplies to sort on the board.
// Preparation clutter uses a preparation-clutter picture (atlas 'preparation') or a board-clutter packing picture; tied food uses its food picture.
const preparations: PreparationObstacleBatch[] = [
  { after: 'task_1', context: 'The window repair leaves packing and cleaning cloths to put away.', obstacles: [
    { id: 'prep-1-frame-offcuts', name: 'Window-frame offcuts', type: 'clutter', ingredient: 'grain_1', atlas: 'preparation', sprite: 0 },
    { id: 'prep-1-frame-cloths', name: 'Frame-cleaning linen bundle', type: 'clutter', ingredient: 'herbs_1', sprite: 3 },
  ] },
  { after: 'task_2', context: 'The welcome board is painted; its supplies still cover the workbench.', obstacles: [
    { id: 'prep-2-paint-pot', name: 'Welcome-board paint pot', type: 'clutter', ingredient: 'corn_1', atlas: 'preparation', sprite: 1 },
    { id: 'prep-2-board-cloths', name: 'Board-cleaning linen bundle', type: 'clutter', ingredient: 'grain_1', sprite: 3 },
    { id: 'prep-2-sanding-sack', name: 'Sanding-supply sack', type: 'clutter', ingredient: 'herbs_1', sprite: 1 },
  ] },
  { after: 'task_3', context: 'The pastry shelf is ready, but its delivery still needs sorting.', obstacles: [
    { id: 'prep-3-pastry-plates', name: 'Wrapped pastry plates', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-3-milk', name: 'Tied pastry milk can', type: 'anchored', ingredient: 'dairy_1' },
  ] },
  { after: 'task_4', context: 'The lamps are lit; their packing and polishing supplies need clearing.', obstacles: [
    { id: 'prep-4-lamp-packing', name: 'Spare lamp and packing', type: 'clutter', ingredient: 'herbs_2', atlas: 'preparation', sprite: 2 },
    { id: 'prep-4-lamp-cloths', name: 'Lamp-polishing linen bundle', type: 'clutter', ingredient: 'corn_1', sprite: 3 },
    { id: 'prep-4-fittings', name: 'Lamp-fitting sack', type: 'clutter', ingredient: 'grain_1', sprite: 1 },
  ] },
  { after: 'task_5', context: 'The worktop is steady, and its repair supplies must go back into storage.', obstacles: [
    { id: 'prep-5-worktop-offcuts', name: 'Worktop-repair offcuts', type: 'clutter', ingredient: 'corn_2', atlas: 'preparation', sprite: 0 },
    { id: 'prep-5-copper-cloths', name: 'Copper-polishing linen bundle', type: 'clutter', ingredient: 'grain_1', sprite: 3 },
  ] },
  { after: 'task_6', context: 'The market delivery leaves produce, packing, and a broken pot to clear.', obstacles: [
    { id: 'prep-6-market-pot', name: 'Broken market pot', type: 'clutter', ingredient: 'vegetables_2', atlas: 'preparation', sprite: 3 },
    { id: 'prep-6-market-sack', name: 'Market-delivery sack', type: 'clutter', ingredient: 'corn_1', sprite: 1 },
    { id: 'prep-6-potatoes', name: 'Tied market potatoes', type: 'anchored', ingredient: 'vegetables_1' },
  ] },
  { after: 'task_7', context: 'The shelf is secure; clear the broken crock and sort the remaining stock.', obstacles: [
    { id: 'prep-7-broken-crock', name: 'Broken shelf crock', type: 'clutter', ingredient: 'vegetables_1', atlas: 'preparation', sprite: 3 },
    { id: 'prep-7-shelf-crock', name: 'Covered shelf-stock crock', type: 'clutter', ingredient: 'dairy_1', sprite: 2 },
  ] },
  { after: 'task_8', context: 'The first menu is written, leaving drawing and cleaning supplies to clear.', obstacles: [
    { id: 'prep-8-menu-drafts', name: 'Rolled menu drafts', type: 'clutter', ingredient: 'grain_1', atlas: 'preparation', sprite: 9 },
    { id: 'prep-8-chalk-cloths', name: 'Chalk-cleaning linen bundle', type: 'clutter', ingredient: 'herbs_1', sprite: 3 },
    { id: 'prep-8-drawing-sack', name: 'Drawing-supply sack', type: 'clutter', ingredient: 'dairy_1', sprite: 1 },
  ] },
  { after: 'task_9', context: 'The new bowls are arranged; unpack the remaining plates and bread supplies.', obstacles: [
    { id: 'prep-9-wrapped-plates', name: 'Wrapped table plates', type: 'clutter', ingredient: 'corn_1', atlas: 'preparation', sprite: 8 },
    { id: 'prep-9-table-dough', name: 'Tied table dough', type: 'anchored', ingredient: 'grain_2' },
  ] },
  { after: 'task_10', context: 'The table and chairs are restored; clear their cloths and repair supplies.', obstacles: [
    { id: 'prep-10-dust-sheet', name: 'Table-cover linen bundle', type: 'clutter', ingredient: 'grain_2', sprite: 3 },
    { id: 'prep-10-chair-offcuts', name: 'Chair-repair offcuts', type: 'clutter', ingredient: 'corn_1', atlas: 'preparation', sprite: 0 },
    { id: 'prep-10-table-supplies', name: 'Table-sanding sack', type: 'clutter', ingredient: 'vegetables_1', sprite: 1 },
  ] },
  { after: 'task_11', context: 'The recipe corner is ready; sort the loose pages and cabinet-cleaning cloths.', obstacles: [
    { id: 'prep-11-recipe-pages', name: 'Tied recipe pages', type: 'clutter', ingredient: 'dairy_1', atlas: 'preparation', sprite: 7 },
    { id: 'prep-11-cabinet-cloths', name: 'Cabinet-cleaning linen bundle', type: 'clutter', ingredient: 'herbs_1', sprite: 3 },
  ] },
  { after: 'task_12', context: 'The shared table is open, leaving its covers and welcome supplies to sort.', obstacles: [
    { id: 'prep-12-table-plates', name: 'Wrapped shared-table plates', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-12-table-stock', name: 'Covered table-stock crock', type: 'clutter', ingredient: 'corn_2', sprite: 2 },
    { id: 'prep-12-welcome-flowers', name: 'Tied welcome elderflowers', type: 'anchored', ingredient: 'herbs_1' },
  ] },
  { after: 'task_13', context: 'The courtyard path is clear; move the gathered leaves and cleaning cloths.', obstacles: [
    { id: 'prep-13-leaf-pile', name: 'Gathered courtyard leaves', type: 'clutter', ingredient: 'vegetables_1', atlas: 'preparation', sprite: 4 },
    { id: 'prep-13-yard-cloths', name: 'Courtyard-cleaning linen bundle', type: 'clutter', ingredient: 'corn_1', sprite: 3 },
  ] },
  { after: 'task_14', context: 'The herbs are planted, leaving pot packing and planting supplies to store.', obstacles: [
    { id: 'prep-14-seedling-tray', name: 'Spare herb seedling tray', type: 'clutter', ingredient: 'vegetables_2', atlas: 'preparation', sprite: 5 },
    { id: 'prep-14-planting-sack', name: 'Planting-supply sack', type: 'clutter', ingredient: 'corn_1', sprite: 1 },
    { id: 'prep-14-pot-cloths', name: 'Pot-cleaning linen bundle', type: 'clutter', ingredient: 'herbs_1', sprite: 3 },
  ] },
  { after: 'task_15', context: 'The door hood is repaired; clear the spare shingles and drying cloths.', obstacles: [
    { id: 'prep-15-spare-shingles', name: 'Spare door-hood shingles', type: 'clutter', ingredient: 'grain_1', atlas: 'preparation', sprite: 6 },
    { id: 'prep-15-door-cloths', name: 'Door-drying linen bundle', type: 'clutter', ingredient: 'corn_2', sprite: 3 },
  ] },
  { after: 'task_16', context: 'The outdoor tables are set; clear the leaves and sort the lunch supplies.', obstacles: [
    { id: 'prep-16-table-leaves', name: 'Leaves from under the tables', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 4 },
    { id: 'prep-16-outdoor-stock', name: 'Covered outdoor-stock crock', type: 'clutter', ingredient: 'herbs_2', sprite: 2 },
    { id: 'prep-16-lunch-vegetables', name: 'Tied lunch vegetable basket', type: 'anchored', ingredient: 'vegetables_2' },
  ] },
  { after: 'task_17', context: 'The family recipes are pinned up; unpack the supplies for their first trials.', obstacles: [
    { id: 'prep-17-recipe-supplies', name: 'Recipe-trial supply sack', type: 'clutter', ingredient: 'dairy_1', sprite: 1 },
    { id: 'prep-17-recipe-pages', name: 'Tied family recipe pages', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 7 },
  ] },
  { after: 'task_18', context: 'The tasting plates are ready; sort their packing and the tasting supplies.', obstacles: [
    { id: 'prep-18-wrapped-plates', name: 'Wrapped tasting plates', type: 'clutter', ingredient: 'vegetables_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-18-tasting-crock', name: 'Covered tasting crock', type: 'clutter', ingredient: 'corn_2', sprite: 2 },
    { id: 'prep-18-tasting-cream', name: 'Tied tasting sour cream', type: 'anchored', ingredient: 'dairy_2' },
  ] },
  { after: 'task_19', context: 'The drinks cabinet is stocked; clear the broken crock and tied supplies.', obstacles: [
    { id: 'prep-19-drinks-crock', name: 'Broken drinks crock', type: 'clutter', ingredient: 'herbs_1', atlas: 'preparation', sprite: 3 },
    { id: 'prep-19-herbs', name: 'Tied cabinet herb bunch', type: 'anchored', ingredient: 'herbs_2' },
  ] },
  { after: 'task_20', context: 'The supper menus are printed; clear their packing and table-setting supplies.', obstacles: [
    { id: 'prep-20-rolled-menus', name: 'Rolled supper menus', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 9 },
    { id: 'prep-20-table-linen', name: 'Supper-table linen bundle', type: 'clutter', ingredient: 'vegetables_2', sprite: 3 },
    { id: 'prep-20-menu-stands', name: 'Menu-stand supply sack', type: 'clutter', ingredient: 'dairy_2', sprite: 1 },
  ] },
  { after: 'task_21', context: 'The invitations are delivered; sort the spare envelopes and gate towels.', obstacles: [
    { id: 'prep-21-gate-towels', name: 'Gate-towel linen bundle', type: 'clutter', ingredient: 'herbs_2', sprite: 3 },
    { id: 'prep-21-spare-invitations', name: 'Spare invitation envelopes', type: 'clutter', ingredient: 'vegetables_1', atlas: 'preparation', sprite: 10 },
  ] },
  { after: 'task_22', context: 'The serving station is ready, but its covers and food supplies still need sorting.', obstacles: [
    { id: 'prep-22-serving-plates', name: 'Wrapped serving plates', type: 'clutter', ingredient: 'grain_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-22-serving-crock', name: 'Covered serving crock', type: 'clutter', ingredient: 'vegetables_2', sprite: 2 },
    { id: 'prep-22-corn', name: 'Tied serving shelled corn', type: 'anchored', ingredient: 'corn_2' },
  ] },
  { after: 'task_23', context: 'The lights and flowers are in place; clear the stem trimmings and spare cloths.', obstacles: [
    { id: 'prep-23-stem-trimmings', name: 'Flower stem trimmings', type: 'clutter', ingredient: 'herbs_1', atlas: 'preparation', sprite: 11 },
    { id: 'prep-23-flower-cloths', name: 'Flower-arranging linen bundle', type: 'clutter', ingredient: 'dairy_1', sprite: 3 },
  ] },
  { after: 'task_24', context: 'The bistro is ready for the supper; clear the final flower trimmings and serving supplies.', obstacles: [
    { id: 'prep-24-flower-trimmings', name: 'Final flower stem trimmings', type: 'clutter', ingredient: 'vegetables_2', atlas: 'preparation', sprite: 11 },
    { id: 'prep-24-supper-crock', name: 'Covered supper crock', type: 'clutter', ingredient: 'corn_2', sprite: 2 },
    { id: 'prep-24-bread-dough', name: 'Tied next-day dough', type: 'anchored', ingredient: 'grain_2' },
  ] },
];
const data: GameData = {
  board: { columns: 6, rows: 7, initial, defaultLayout: 'workbench-clutter-1', layouts, preparations },
  chains: chains.map(([id, name]) => ({ id, name })), items, characters, chapters, finale, tasks, areas, rooms, decorationSlots, economy, day, quests,
};
// A room shows only paintings whose masters the user accepted; the build ships their variants.
const provenance: { assets: { id: string }[] } = JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8'));
const unapproved = roomPaintings.filter(id => !provenance.assets.some(asset => asset.id === id));
if (unapproved.length) throw new Error(`These room paintings have no approved master: ${unapproved.join(', ')}.`);
const problems = dataProblems(data, provenance.assets.map(asset => asset.id));
if (problems.length) throw new Error(`The game data is not valid: ${problems.join(' ')}`);
const target = new URL('../public/data/game.json', import.meta.url);
await mkdir(fileURLToPath(new URL('.', target)), { recursive: true });
await writeFile(target, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Created original data: ${Object.keys(items).length} items, ${tasks.length} tasks, ${characters.length} characters, ${areas.length} areas, ${rooms.length} room states.`);
