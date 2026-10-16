// Original setting, dialogue, progression, and economy authored for this browser game.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { roomPaintings, roomProblems, decorationProblems, generatorTierProblems, levelRewardProblems, questProblems, taskGoalProblems, economyProblems } from '../src/engine.ts';
import type { Area, Character, DecorationSlot, GameData, Item, Quest, RoomState, Task } from '../src/engine.ts';

const chains: [id: string, name: string, stages: string[], generator: string][] = [
  ['bakery', 'Bread counter', ['Flour', 'Dough', 'Pogăcele', 'Langoș', 'Zacuscă toast', 'Bread basket'], 'Flour bin'],
  ['warm', 'Warm kitchen', ['Cornmeal', 'Mămăligă', 'Bulz', 'Smoked cheese plate', 'Cabbage rolls', 'Goulash pot'], 'Copper pot'],
  ['sweet', 'Dessert table', ['Walnuts', 'Doughnut', 'Papanași', 'Plum dumplings', 'Cozonac', 'Chimney cake'], 'Pastry box'],
  ['drinks', 'Drinks counter', ['Elderflowers', 'Socată', 'Fruit tea', 'Cherry compote', 'Blueberry liqueur', 'Plum brandy'], 'Drinks pitcher'],
  ['pantry', 'Market pantry', ['Aubergine', 'Peppers', 'Roasted vegetables', 'Zacuscă', 'Wild mushroom sauce', 'Sharing board'], 'Produce basket'],
];
// Prices are for the portions in docs/economy.md. A merge stage is not a price multiplier.
const menuPrices: Record<string, number[]> = {
  bakery: [2, 4, 12, 22, 28, 35],
  warm: [2, 8, 32, 40, 50, 80],
  sweet: [3, 8, 32, 28, 40, 35],
  drinks: [1, 12, 18, 20, 35, 40],
  pantry: [3, 3, 18, 24, 28, 65],
};
const items: Record<string, Item> = {};
for (const [row, [chain, , names, generator]] of chains.entries()) {
  names.forEach((name, stage) => {
    const id = `${chain}_${stage + 1}`;
    items[id] = { id, name, chain, stage: stage + 1, next: stage < 5 ? `${chain}_${stage + 2}` : null, sprite: row * 6 + stage, price: menuPrices[chain][stage] };
  });
  const id = `generator_${chain}`;
  items[id] = { id, name: generator, chain, stage: 0, next: null, sprite: 30 + row, price: 0, generator: { outputs: [`${chain}_1`] } };
}

const characters: Character[] = [
  { id: 'mara', name: 'Mara', role: 'Bistro owner', description: 'A practical host with wavy dark brown hair under a red and black headscarf, a white ie blouse with red cross-stitch, and a green woven apron.', sprite: 0,
    introduction: 'I am Mara. I keep the bistro open and make room for neighbours who want a meal or a quiet seat. Help me try a few servings as we prepare the house.',
    thanks: ['Good. That is how it should taste.', 'I will write this one on the menu.', 'Thank you. Now, the next table.'] },
  { id: 'ilie', name: 'Ilie', role: 'Baker', description: 'An older baker with silver hair and moustache, round glasses, a black lambskin căciulă, and a floury sheepskin vest over an embroidered shirt.', sprite: 1,
    introduction: 'I am Ilie, the baker. I bring bread and the notebook where my family kept its dishes. There is room on those pages for what we learn here.',
    thanks: ['Still warm. You remembered!', 'My grandmother would approve.', 'I did not even need my glasses.'] },
  { id: 'eszter', name: 'Eszter', role: 'Potter', description: 'A Székely potter with a short auburn bob, a white puffed-sleeve blouse, a rust-red bodice edged with green and gold braid, and white beads.', sprite: 2,
    introduction: 'I am Eszter. I make the bowls and plates. A useful dish should sit well on the table and leave room for the person beside you.',
    thanks: ['It looks lovely in a blue bowl.', 'Exactly right. Thank you.', 'I will tell the courtyard.'] },
  { id: 'sorin', name: 'Sorin', role: 'Bistro helper', description: 'A cheerful young helper with short wavy chestnut hair, an embroidered white shirt with rolled sleeves, a dark embroidered felt vest, and a woven belt.', sprite: 3,
    introduction: 'I am Sorin. I help at the bistro between deliveries around the neighbourhood. I know the steep streets, the quiet doors, and where to stop for lunch.',
    thanks: ['Fuel for the hill home!', 'Worth every pedal. Thank you!', 'My lunch ride is sorted.'] },
];
const chapters = ['Open the shutters', 'A kitchen for everyone', 'Around one table', 'The courtyard', 'Recipes to share', 'The first community supper'];
const taskRows = [
  ['Fix the broken window', 'mara', 'That window has a cracked pane and a corner missing. The draught reaches all the way to the counter.', 'sorin', 'I brought new glass on the bike. Very slowly. The ladder will have to walk.', 'eszter', 'And I have cobalt paint for the frame and the shutters. The bistro can greet the street again.'],
  ['Mend the welcome board', 'eszter', 'The wooden board is sound. It only needs a new surface.', 'mara', 'Folk flowers, red ones, like the old plates. Miez can supervise the painting.', 'ilie', 'Our black cat has already inspected the empty pastry shelf.'],
  ['Set up the pastry shelf', 'ilie', 'This shelf is low enough for everyone to see the pastries.', 'mara', 'And high enough to keep your elbow out of the walnuts.', 'ilie', 'A thoughtful design. I will bring the pastry box.'],
  ['Light the front room', 'sorin', 'The lamps are ready. Shall we put one above each small table?', 'eszter', 'Yes, and keep the corner warm and quiet.', 'mara', 'A seat for a quick lunch, and a seat for a long conversation.'],
  ['Repair the kitchen worktop', 'ilie', 'A steady worktop makes a calm kitchen.', 'eszter', 'I have sealed the edge. Give it room beside the copper pot.', 'mara', 'Now there is space to prepare tomorrow together.'],
  ['Bring in market produce', 'sorin', 'The market had aubergines and more peppers than my basket could hold.', 'mara', 'We can roast a batch and make a pantry shelf.', 'ilie', 'Good. A jar of zacuscă makes a fine welcome on fresh bread.'],
  ['Hang the kitchen shelves', 'eszter', 'The pastries keep the lower shelf. The jars go up top, on the left.', 'mara', 'Leave the right end free. We will learn what belongs there.', 'ilie', 'An empty space on a shelf is an invitation to cook.'],
  ['Write the first menu', 'mara', 'Bread, warm dishes, sweets, drinks, and something from the pantry.', 'ilie', 'Draw it, then. Nobody needs glasses to read a picture of soup.', 'sorin', 'I will put a copy by the door before the lunch ride.'],
  ['Choose the tableware', 'eszter', 'These bowls came from three firings. None is exactly the same blue.', 'mara', 'That is why I like them. Each place will feel considered.', 'ilie', 'And each bowl is deep enough for a generous serving.'],
  ['Sand the long table', 'sorin', 'Four people can move this table. Three people can offer advice.', 'mara', 'Today all four of us are moving it. Then the old red chairs.', 'eszter', 'Under that sheet they were painted with birds. A little gold, and they will sing again.'],
  ['Make a recipe corner', 'ilie', 'I brought a notebook for recipes and the changes we make.', 'eszter', 'Let people add a memory beside a dish, if they want.', 'mara', 'We will leave pencils here. The menu can grow with the neighbourhood.'],
  ['Open the shared table', 'mara', 'The long table is ready for anyone who wants company.', 'sorin', 'I can stop here between deliveries and still have room for my bag.', 'ilie', 'Your bag may have a chair. Your bicycle must wait outside.'],
  ['Clear the courtyard', 'sorin', 'There is a whole courtyard under these leaves. Miez found it before we did.', 'eszter', 'Our black cat has chosen the sunny wall for a nap.', 'mara', 'Let us make the path clear first, then place the tables.'],
  ['Plant the herb pots', 'eszter', 'The pots have drainage holes and room for roots.', 'ilie', 'Lovage and parsley close to the kitchen will be useful.', 'mara', 'And rosemary under the window, where the warmth reaches it.'],
  ['Repair the door hood', 'sorin', 'New shingles, every one. Rain will run off the front, not down the door.', 'mara', 'Good. Nobody should have a surprise shower with lunch.', 'eszter', 'I will move the pots before we test it with a watering can.'],
  ['Set the outdoor tables', 'mara', 'Keep a wide route from the gate to the door.', 'eszter', 'Both tables fit along the wall, and the red chairs from the front room came out too.', 'ilie', 'Now I can carry a tray outside without turning sideways.'],
  ['Collect family recipes', 'ilie', 'Every page describes a different way to finish the same dish.', 'mara', 'We can keep the names of the people who shared them, with their permission.', 'eszter', 'And write down what we tried, so the next cook can follow it.'],
  ['Prepare the tasting plates', 'eszter', 'Small plates are ready. There is room for notes beside each one.', 'sorin', 'I volunteered to carry them. Tasting was not mentioned, but I remain hopeful.', 'mara', 'Finish the delivery, and we will sit down together.'],
  ['Stock the drinks cabinet', 'mara', 'Socată and fruit tea on one shelf. The traditional spirits on another.', 'ilie', 'Put clear labels on everything, including the cherry compote.', 'sorin', 'Tea for me. There is one more hill on the route home.'],
  ['Print the supper menu', 'eszter', 'The menu shows a picture of each dish. Anyone can ask what is in it.', 'mara', 'The long table is out for the supper. The small ones stay for anyone who wants a quieter seat.', 'ilie', 'Bring a pencil. A useful menu is one we can keep accurate.'],
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
  [160, 60, 2, 'Print twenty small invitations. Dress the gate with a wreath, lantern, and three geraniums. Reuse the towels.'],
  [120, 80, 2, 'Set the existing serving table with a cloth and labels. Prepare the first warm dishes and bread. Reuse the plates.'],
  [120, 60, 1.5, 'Hang one outdoor light string. Arrange gathered wildflowers in existing vases.'],
  [60, 60, 2, 'Top up bread, water, and food for twelve guests. Finish setting places and welcome everyone. Reuse the prepared room and tableware.'],
];
let workBlocks = 0;
const tasks: Task[] = taskRows.map(([title, a, at, b, bt, c, ct], index) => {
  const [materials, labour, hours, summary] = workRows[index];
  workBlocks += hours * 2;
  return {
    id: `task_${index + 1}`, chapter: Math.floor(index / 4) + 1, title,
    cost: materials + labour, work: { summary, materials, labour, hours },
    goals: { served: workBlocks, merges: workBlocks * 2 },
    dialogue: [{ speaker: a, text: at }, { speaker: b, text: bt }, { speaker: c, text: ct }],
    ...(index === 2 ? { unlock: 'sweet' } : index === 5 ? { unlock: 'pantry' } : {}),
  };
});
// Each neighbour has three requests. They stay optional and use food available before they open.
const questRows: [id: string, character: string, title: string, after: number, legacy: number, requirements: [string, number][], reward: number, opening: string, completion: string][] = [
  ['mara-welcome', 'mara', 'A welcome drink', 0, 1, [['drinks_2', 1]], 16,
    'Let us try a glass of socată for the first welcome. I want something simple to offer when a neighbour comes through the door.',
    'That will do well. A glass and a seat can make the first visit easier. I will keep space on the counter.'],
  ['ilie-counter', 'ilie', 'Bread for the counter', 1, 4, [['bakery_3', 1]], 16,
    'A few pogăcele would give the new counter a proper start. Bring me a serving and we can choose where the bread belongs.',
    'Here, within reach of the plates. Nobody should have to ask twice for bread.'],
  ['eszter-bowls', 'eszter', 'Try the bowls', 4, 8, [['warm_2', 2]], 16,
    'Can you bring two servings of mămăligă? I want to check that the bowls leave enough room for a spoon.',
    'Both servings fit comfortably. I will keep this shape for the bowls we use every day.'],
  ['sorin-lunch', 'sorin', 'Lunch between errands', 6, 8, [['bakery_3', 1], ['drinks_2', 1]], 16,
    'I have a short stop between deliveries. Could you set aside pogăcele and socată so I can eat before the next hill?',
    'There is time to sit down after all. I will take the empty glass back before I leave.'],
  ['mara-table', 'mara', 'A place at the table', 8, 12, [['warm_3', 1]], 24,
    'The shared table needs a warm dish that is easy to serve. Bring a bulz and we can test the space for plates.',
    'There is room for the dish and for people to pass it. The table feels ready for company.'],
  ['eszter-table', 'eszter', 'A small sweet plate', 9, 12, [['sweet_3', 1]], 24,
    'The new tableware needs a small sweet plate. Let me try papanași beside the bowl and cup.',
    'The plate fits without crowding the cup. I will use this arrangement at the shared table.'],
  ['ilie-courtyard', 'ilie', 'Bread for outside', 12, 16, [['bakery_4', 1]], 24,
    'Bring a langoș for a trial serving outside. I want to find a good place for the bread when the courtyard tables are ready.',
    'Near the kitchen door will work. We can bring another serving without crossing between the chairs.'],
  ['sorin-path', 'sorin', 'A courtyard break', 13, 16, [['pantry_3', 1], ['drinks_2', 1]], 24,
    'The path is clear. Could you bring roasted vegetables and socată for a break while we check the route from gate to kitchen?',
    'The tray passed every chair. Now I can sit down and enjoy what I carried.'],
  ['ilie-family', 'ilie', 'A dish from the notebook', 16, 18, [['warm_4', 1]], 32,
    'I marked a smoked cheese plate in the family notebook. Bring one so we can choose a serving for the tasting.',
    'This serving belongs at the tasting. I will write the portion beside the family notes, where the next cook can find it.'],
  ['eszter-tasting', 'eszter', 'Match the tasting plates', 17, 20, [['sweet_4', 1]], 32,
    'The tasting plates need their final check. Bring plum dumplings so I can see how much room the serving needs.',
    'There is space for the serving and its label. The plates can go to the shared table.'],
  ['mara-supper', 'mara', 'The supper service', 20, 24, [['bakery_5', 1], ['warm_4', 1]], 32,
    'Let us practise one supper service with zacuscă toast and a smoked cheese plate. I want both dishes to reach the table together.',
    'Everything arrived together. We have a useful plan for the supper, and time to welcome each guest.'],
  ['sorin-welcome', 'sorin', 'Welcome from the gate', 20, 24, [['drinks_3', 2], ['pantry_3', 1]], 32,
    'I will meet people at the gate. Could you prepare two fruit teas and roasted vegetables for the first guests who want a seat?',
    'The welcome is ready. I can show people the table and stay long enough to share it with them.'],
];
const previousQuest = new Map<string, string>();
const quests: Quest[] = questRows.map(([id, character, title, after, legacy, requirements, reward, opening, completion]) => {
  const afterQuest = previousQuest.get(character);
  previousQuest.set(character, id);
  return { id, character, title, afterTask: after ? `task_${after}` : null, legacyAfter: `task_${legacy}`,
    ...(afterQuest ? { afterQuest } : {}), requirements: requirements.map(([item, quantity]) => ({ item, quantity })), reward,
    opening: [{ speaker: character, text: opening }], completion: [{ speaker: character, text: completion }] };
});
// The borrowed flour bin and its tasting portions use their matching existing atlas art.
const questItems: Record<string, Item> = {
  quest_bread_source: { id: 'quest_bread_source', name: 'Tasting flour bin', chain: 'quest_bread', stage: 0, next: null, sprite: 30, price: 0, generator: { outputs: ['quest_bread_1'] } },
  quest_bread_1: { id: 'quest_bread_1', name: 'Tasting flour', chain: 'quest_bread', stage: 1, next: 'quest_bread_2', sprite: 0, price: 2 },
  quest_bread_2: { id: 'quest_bread_2', name: 'Tasting dough', chain: 'quest_bread', stage: 2, next: 'quest_bread_3', sprite: 1, price: 4 },
  quest_bread_3: { id: 'quest_bread_3', name: 'Tasting pogăcele', chain: 'quest_bread', stage: 3, next: null, sprite: 2, price: 12 },
};
quests.push({ id: 'ilie-bread-tasting', character: 'ilie', title: 'The borrowed flour bin', afterTask: 'task_17', afterQuest: 'ilie-family', legacyAfter: null,
  requirements: [{ item: 'quest_bread_3', quantity: 2 }], reward: 24,
  opening: [{ speaker: 'ilie', text: 'I can lend a flour bin for two tasting servings of pogăcele. It needs one free board or pantry space. When the servings are ready, I will collect the bin and all unused tasting portions.' }],
  completion: [{ speaker: 'ilie', text: 'Two servings are ready to share. I have collected the borrowed bin and the remaining tasting portions. Thank you for trying this small batch with me.' }],
  producer: { item: 'quest_bread_source', outputs: ['quest_bread_1'], exclusiveItems: Object.keys(questItems) } });
// The renovation: every preparation repaints one room, so the bistro visibly improves as coins are spent.
// Each area is a series of 3:4 portrait paintings (docs/specs/001-room-states-art-plan.md). A state shows every change paid for in its area.
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
initial[1] = 'generator_bakery';
initial[4] = 'generator_warm';
initial[31] = 'generator_drinks';
initial[13] = 'bakery_1';
initial[14] = 'bakery_1';
initial[22] = 'warm_1';
initial[27] = 'drinks_1';
const data: GameData = {
  title: 'Scary Snacks', inventoryCapacity: 12, board: { columns: 6, rows: 7, initial },
  chains: chains.map(([id, name]) => ({ id, name })), items, characters, chapters, tasks, areas, rooms, decorationSlots, quests, questItems,
  generatorTiers: chains.flatMap(([chain]) => [{ chain, stage: 2, after: 'task_12' }, { chain, stage: 3, after: 'task_20' }]),
  levelRewards: Array.from({ length: 9 }, (_, index) => ({ id: `level-${index + 2}`, level: index + 2, coins: 20 })),
};
// A room shows only paintings whose masters the user accepted; the build ships their variants.
const provenance: { assets: { id: string }[] } = JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8'));
const unapproved = roomPaintings.filter(id => !provenance.assets.some(asset => asset.id === id));
if (unapproved.length) throw new Error(`These room paintings have no approved master: ${unapproved.join(', ')}.`);
const problems = [...roomProblems(data), ...decorationProblems(data, provenance.assets.map(asset => asset.id)), ...generatorTierProblems(data), ...levelRewardProblems(data), ...questProblems(data), ...taskGoalProblems(data), ...economyProblems(data)];
if (problems.length) throw new Error(`The game data is not valid: ${problems.join(' ')}`);
const target = new URL('../public/data/game.json', import.meta.url);
await mkdir(fileURLToPath(new URL('.', target)), { recursive: true });
await writeFile(target, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Created original data: ${Object.keys(items).length} items, ${tasks.length} tasks, ${characters.length} characters, ${areas.length} areas, ${rooms.length} room states.`);
