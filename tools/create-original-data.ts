// Original setting, dialogue, progression, and economy authored for this browser game.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { roomPaintings, dataProblems } from '../src/engine.ts';
import type { Area, BoardLayout, Chapter, Character, DecorationSlot, Finale, GameData, Item, Quest, RoomState, Task } from '../src/engine.ts';

const chains: [id: string, name: string, stages: string[], generator: string][] = [
  ['bakery', 'Bread counter', ['Flour', 'Dough', 'Pogăcele', 'Langoș', 'Zacuscă toast', 'Bread basket'], 'Flour bin'],
  ['warm', 'Warm kitchen', ['Cornmeal', 'Mămăligă', 'Bulz', 'Smoked cheese plate', 'Cabbage rolls', 'Goulash pot'], 'Copper pot'],
  ['sweet', 'Dessert table', ['Walnuts', 'Doughnut', 'Papanași', 'Plum dumplings', 'Cozonac', 'Chimney cake'], 'Pastry box'],
  ['drinks', 'Drinks counter', ['Elderflowers', 'Socată', 'Fruit tea', 'Cherry compote', 'Blueberry liqueur', 'Plum brandy'], 'Drinks pitcher'],
  ['produce', 'Market produce', ['Aubergine', 'Peppers', 'Roasted vegetables', 'Zacuscă', 'Wild mushroom sauce', 'Sharing board'], 'Produce basket'],
];
// Prices are for the portions in docs/economy.md. A merge stage is not a price multiplier.
const menuPrices: Record<string, number[]> = {
  bakery: [2, 4, 12, 22, 28, 35],
  warm: [2, 8, 32, 40, 50, 80],
  sweet: [3, 8, 32, 28, 40, 35],
  drinks: [1, 12, 18, 20, 35, 40],
  produce: [3, 3, 18, 24, 28, 65],
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
  { id: 'adrian', name: 'Adrian', role: 'Travelling guard', visitor: true, sprite: 0,
    description: 'A Romanian middle-aged man with short dark hair, a thick neat moustache, a black lambskin căciulă cap, a cream linen ie with red and black geometric embroidery, a practical weathered steel plate cuirass, and a burgundy wool cloak.',
    introduction: 'I am Adrian. I travel with Monica and Janos. We are checking a few reports from the cathedral beyond the village. We may need provisions for several days at a time.',
    thanks: ['Enough for the road. Thank you.', 'We will pack this with care.', 'A good meal before we leave.'] },
  { id: 'monica', name: 'Monica', role: 'Pathfinder', visitor: true, sprite: 1,
    description: 'A Romanian adult woman with dark brown hair in a braid under a red and black woven headscarf, a cream embroidered ie blouse, fitted brown leather scout armour with brass buckles and a cross-strap, and a moss-green travelling cloak.',
    introduction: 'I am Monica. I check the paths while Adrian and Janos compare their notes. The old cathedral has more entrances than our map shows. A supply pack lets us stay a few days to look.',
    thanks: ['These will travel well.', 'I have room in the pack.', 'Thank you. We can stay longer.'] },
  { id: 'janos', name: 'Janos', role: 'Travelling scholar', visitor: true, sprite: 2,
    description: 'An older Hungarian Roma scholar with a warm medium olive complexion, wavy black hair streaked with grey, a neat moustache and short beard, a black wide-brim felt hat, an indigo embroidered waistcoat over a cream shirt, a muted plum neckerchief, and a wooden walking staff.',
    introduction: 'I am Janos. I study the marks in old stonework. Adrian and Monica help me examine the nearby cathedral. Its records leave a few questions, and a long visit needs proper meals.',
    thanks: ['A welcome break from my notes.', 'Thank you for the provisions.', 'We can finish our work calmly.'] },
  { id: 'ionatan', name: 'Ionatan', role: 'Foreign property agent', visitor: true, singleVisit: true, sprite: 3,
    description: 'A reserved young adult with fair skin, neat side-parted chestnut hair, a clean-shaven face, a charcoal travel suit, a cream shirt, a burgundy cravat, and a leather document folio.',
    introduction: 'I am Ionatan, a property agent from another country. I am travelling to the nearby castle to close a real-estate deal with a local noble. I have time for one proper dinner before I leave.',
    thanks: ['A fine dinner. Thank you.', 'You have taken great care.', 'My compliments to the kitchen.'] },
];
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
    'Mara and the team share the completed supper with the neighbourhood.', 'mara-supper',
    [['sorin', 'Every invitation is delivered. Some people asked twice if they really need to bring only an appetite.'],
      ['eszter', 'The flowers are short, the lights are on, and every dish on the serving table has its label.'],
      ['mara', 'Then we are ready. Let us open the doors.']]],
];
const chapters: Chapter[] = chapterRows.map(([title, objective, opening, payoff, contribution, closing], index) => ({
  id: `chapter-${index + 1}`, title, objective, opening, payoff, contribution, closing: closing.map(([speaker, text]) => ({ speaker, text })),
}));
// The finale names the outcome of each chapter, and every core character speaks. The last line returns the player to the kitchen.
const finale: Finale = { id: 'finale', title: 'Supper at the bistro', dialogue: [
  { speaker: 'mara', text: 'Look at them. The front room is full, and the courtyard too.' },
  { speaker: 'ilie', text: 'We opened the shutters and lit the room. Then we made a kitchen where everyone could help.' },
  { speaker: 'eszter', text: 'We set one long table for everyone, and then we carried it out into the courtyard.' },
  { speaker: 'sorin', text: 'And the recipes came from every street on my route. Half the menu has a neighbour’s name on it.' },
  { speaker: 'mara', text: 'Tonight is the supper that we planned together. Tomorrow the bistro stays open, and the orders keep coming.' },
  { speaker: 'ilie', text: 'Then I will start the dough early. Somebody will want bread for breakfast.' },
], ending: 'The supper is served, and the bistro stays open. Your neighbours keep coming with new orders.' };
const taskRows = [
  ['Fix the broken window', 'mara', 'That window has a cracked pane and a corner missing. The draught reaches all the way to the counter.', 'sorin', 'I brought new glass on the bike. Very slowly. The ladder will have to walk.', 'eszter', 'And I have cobalt paint for the frame and the shutters. The bistro can greet the street again.'],
  ['Mend the welcome board', 'eszter', 'The wooden board is sound. It only needs a new surface.', 'mara', 'Folk flowers, red ones, like the old plates. Miez can supervise the painting.', 'ilie', 'Our black cat has already inspected the empty pastry shelf.'],
  ['Set up the pastry shelf', 'ilie', 'This shelf is low enough for everyone to see the pastries.', 'mara', 'And high enough to keep your elbow out of the walnuts.', 'ilie', 'A thoughtful design. I will bring the pastry box.'],
  ['Light the front room', 'sorin', 'The lamps are ready. Shall we put one above each small table?', 'eszter', 'Yes, and keep the corner warm and quiet.', 'mara', 'A seat for a quick lunch, and a seat for a long conversation.'],
  ['Repair the kitchen worktop', 'ilie', 'A steady worktop makes a calm kitchen.', 'eszter', 'I have sealed the edge. Give it room beside the copper pot.', 'mara', 'Now there is space to prepare tomorrow together.'],
  ['Bring in market produce', 'sorin', 'The market had aubergines and more peppers than my basket could hold.', 'mara', 'We can roast a batch and make a produce shelf.', 'ilie', 'Good. A jar of zacuscă makes a fine welcome on fresh bread.'],
  ['Hang the kitchen shelves', 'eszter', 'The pastries keep the lower shelf. The jars go up top, on the left.', 'mara', 'Leave the right end free. We will learn what belongs there.', 'ilie', 'An empty space on a shelf is an invitation to cook.'],
  ['Write the first menu', 'mara', 'Bread, warm dishes, sweets, drinks, and vegetable dishes.', 'ilie', 'Draw it, then. Nobody needs glasses to read a picture of soup.', 'sorin', 'I will put a copy by the door before the lunch ride.'],
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
    ...(index === 2 ? { unlock: 'sweet' } : index === 5 ? { unlock: 'produce' } : {}),
  };
});
// Each neighbour has three requests. They stay optional and use food available before they open.
const questRows: [id: string, character: string, title: string, after: number, requirements: [string, number][], reward: number, opening: string, completion: string][] = [
  ['mara-welcome', 'mara', 'A welcome drink', 0, [['drinks_2', 1]], 16,
    'Let us try a glass of socată for the first welcome. I want something simple to offer when a neighbour comes through the door.',
    'That will do well. A glass and a seat can make the first visit easier. I will keep space on the counter.'],
  ['ilie-counter', 'ilie', 'Bread for the counter', 1, [['bakery_3', 1]], 16,
    'A few pogăcele would give the new counter a proper start. Bring me a serving and we can choose where the bread belongs.',
    'Here, within reach of the plates. Nobody should have to ask twice for bread.'],
  ['eszter-bowls', 'eszter', 'Try the bowls', 4, [['warm_2', 2]], 16,
    'Can you bring two servings of mămăligă? I want to check that the bowls leave enough room for a spoon.',
    'Both servings fit comfortably. I will keep this shape for the bowls we use every day.'],
  ['sorin-lunch', 'sorin', 'Lunch between errands', 6, [['bakery_3', 1], ['drinks_2', 1]], 16,
    'I have a short stop between deliveries. Could you set aside pogăcele and socată so I can eat before the next hill?',
    'There is time to sit down after all. I will take the empty glass back before I leave.'],
  ['mara-table', 'mara', 'A place at the table', 8, [['warm_3', 1]], 24,
    'The shared table needs a warm dish that is easy to serve. Bring a bulz and we can test the space for plates.',
    'There is room for the dish and for people to pass it. The table feels ready for company.'],
  ['eszter-table', 'eszter', 'A small sweet plate', 9, [['sweet_3', 1]], 24,
    'The new tableware needs a small sweet plate. Let me try papanași beside the bowl and cup.',
    'The plate fits without crowding the cup. I will use this arrangement at the shared table.'],
  ['ilie-courtyard', 'ilie', 'Bread for outside', 12, [['bakery_4', 1]], 24,
    'Bring a langoș for a trial serving outside. I want to find a good place for the bread when the courtyard tables are ready.',
    'Near the kitchen door will work. We can bring another serving without crossing between the chairs.'],
  ['sorin-path', 'sorin', 'A courtyard break', 13, [['produce_3', 1], ['drinks_2', 1]], 24,
    'The path is clear. Could you bring roasted vegetables and socată for a break while we check the route from gate to kitchen?',
    'The tray passed every chair. Now I can sit down and enjoy what I carried.'],
  ['ilie-family', 'ilie', 'A dish from the notebook', 16, [['warm_4', 1]], 32,
    'I marked a smoked cheese plate in the family notebook. Bring one so we can choose a serving for the tasting.',
    'This serving belongs at the tasting. I will write the portion beside the family notes, where the next cook can find it.'],
  ['eszter-tasting', 'eszter', 'Match the tasting plates', 17, [['sweet_4', 1]], 32,
    'The tasting plates need their final check. Bring plum dumplings so I can see how much room the serving needs.',
    'There is space for the serving and its label. The plates can go to the shared table.'],
  ['mara-supper', 'mara', 'The supper service', 20, [['bakery_5', 1], ['warm_4', 1]], 32,
    'Let us practise one supper service with zacuscă toast and a smoked cheese plate. I want both dishes to reach the table together.',
    'Everything arrived together. We have a useful plan for the supper, and time to welcome each guest.'],
  ['sorin-welcome', 'sorin', 'Welcome from the gate', 20, [['drinks_3', 2], ['produce_3', 1]], 32,
    'I will meet people at the gate. Could you prepare two fruit teas and roasted vegetables for the first guests who want a seat?',
    'The welcome is ready. I can show people the table and stay long enough to share it with them.'],
];
const previousQuest = new Map<string, string>();
const quests: Quest[] = questRows.map(([id, character, title, after, requirements, reward, opening, completion]) => {
  const afterQuest = previousQuest.get(character);
  previousQuest.set(character, id);
  return { id, character, title, afterTask: after ? `task_${after}` : null,
    ...(afterQuest ? { afterQuest } : {}), requirements: requirements.map(([item, quantity]) => ({ item, quantity })), reward,
    opening: [{ speaker: character, text: opening }], completion: [{ speaker: character, text: completion }] };
});
// The travellers return three times each. Ordinary service spaces their visits, and one shared sequence keeps only one request active.
const visitorRows: [id: string, character: string, title: string, after: number, requirements: [string, number][], opening: string, completion: string][] = [
  ['adrian-first-pack', 'adrian', 'Provisions for the hill', 6, [['bakery_3', 8], ['warm_3', 4], ['drinks_3', 4]],
    'We plan to spend several days near the cathedral. A few reports need a closer look. Could you fill a large pack with pogăcele, bulz, and fruit tea before we leave?',
    'The pack is full. We can take our time on the hill without returning for each meal. I will bring back the empty containers.'],
  ['monica-first-pack', 'monica', 'Meals beyond the gate', 6, [['bakery_5', 2], ['produce_5', 2], ['warm_5', 2]],
    'One path runs behind the cathedral wall. I would like several days to check where it leads. Could you prepare zacuscă toast, wild mushroom sauce, and cabbage rolls for our camp meals?',
    'Everything is packed separately. We can share these meals while we compare the paths with our map. Thank you for taking care with the order.'],
  ['janos-first-pack', 'janos', 'A long reading', 6, [['bakery_4', 4], ['sweet_3', 4], ['drinks_3', 4]],
    'A few marks near the cathedral do not match the written records. Reading them may take several days. Could you prepare a full supply of langoș, papanași, and fruit tea for the three of us?',
    'There is enough here for a long stay. We can stop to eat without losing our place in the notes. The old records can wait until after lunch.'],
  ['adrian-second-pack', 'adrian', 'Supper for the watch', 12, [['warm_6', 2], ['bakery_6', 2]],
    'We are going back to examine a quiet part of the cathedral grounds. This visit may last several days. Two goulash pots and two bread baskets would give us proper suppers between our rounds.',
    'The suppers are ready to share. We will carry them up together. There is no need to rush the work when everyone has eaten.'],
  ['monica-second-pack', 'monica', 'The longer path', 12, [['produce_3', 6], ['bakery_3', 6], ['drinks_4', 4]],
    'Our next route starts beyond the cathedral garden. We may be away for several days while we check the old paths. Could you make a large pack of roasted vegetables, pogăcele, and cherry compote?',
    'The provisions fit both bags. We can follow the route carefully and stop wherever the path gives us a dry place to sit.'],
  ['janos-second-pack', 'janos', 'Meals beside the notes', 12, [['sweet_6', 2], ['produce_6', 2], ['warm_5', 2]],
    'We found another page to compare with the cathedral stonework. It may keep us there for several days. Could you send chimney cakes, sharing boards, and cabbage rolls for our meal breaks?',
    'These are meals worth closing a notebook for. We will keep the table clear before we spread out the pages again.'],
  ['adrian-third-pack', 'adrian', 'One more stay', 20, [['bakery_4', 6], ['warm_4', 6], ['drinks_3', 4]],
    'There are still a few places near the cathedral that we have not checked. We need supplies for another stay of several days. Could you pack langoș, smoked cheese plates, and fruit tea in quantity?',
    'That will cover the stay. We will take the meals in turns and keep the path clear for anyone else who needs to pass. Thank you.'],
  ['monica-third-pack', 'monica', 'A careful return', 20, [['bakery_6', 2], ['warm_6', 2], ['produce_6', 2]],
    'We are checking our route around the cathedral once more. A careful visit takes several days. Could you prepare bread baskets, goulash pots, and sharing boards for the three of us?',
    'The baskets are secure. We can share the food and compare what we saw on each path. I will keep your containers together for the return.'],
  ['janos-third-pack', 'janos', 'The last loose pages', 20, [['sweet_5', 2], ['warm_5', 2], ['produce_5', 2]],
    'A few loose pages still leave questions about the cathedral. We have set aside several days to read them there. Could you prepare cozonac, cabbage rolls, and wild mushroom sauce for our meals?',
    'Our provisions are ready. Whatever those pages tell us, we will discuss them after a proper meal. There will be a warm table to come back to here.'],
];
for (const [index, [id, character, title, after, requirements, opening, completion]] of visitorRows.entries()) {
  quests.push({ id, character, title, afterTask: `task_${after}`, afterServed: (index + 1) * 24,
    ...(index ? { afterQuest: visitorRows[index - 1][0] } : {}),
    requirements: requirements.map(([item, quantity]) => ({ item, quantity })),
    reward: requirements.reduce((sum, [item, quantity]) => sum + items[item].price * quantity, 0) * 2,
    opening: [{ speaker: character, text: opening }], completion: [{ speaker: character, text: completion }] });
}
quests.push({ id: 'ionatan-castle-dinner', character: 'ionatan', title: 'Dinner before the castle', afterTask: 'task_16', afterServed: 120,
  requirements: [{ item: 'warm_6', quantity: 1 }, { item: 'produce_6', quantity: 1 }, { item: 'sweet_6', quantity: 1 }, { item: 'drinks_6', quantity: 1 }], reward: 1100,
  opening: [{ speaker: 'ionatan', text: 'I have come from abroad to close a real-estate deal with a local noble at the nearby castle. Before I continue, I would like a proper dinner: a goulash pot, a sharing board, a chimney cake, and plum brandy. I will pay well for the care this meal needs.' }],
  completion: [{ speaker: 'ionatan', text: 'An excellent dinner. Here is the payment, with my thanks. My papers are in order, and I must leave for the castle now. My journey takes me on from there, so I will not return. Farewell.' }] });
// The borrowed flour bin and its tasting portions use their matching existing atlas art.
const questItems: Record<string, Item> = {
  quest_bread_source: { id: 'quest_bread_source', name: 'Tasting flour bin', chain: 'quest_bread', stage: 0, next: null, sprite: 30, price: 0, generator: { outputs: ['quest_bread_1'] } },
  quest_bread_1: { id: 'quest_bread_1', name: 'Tasting flour', chain: 'quest_bread', stage: 1, next: 'quest_bread_2', sprite: 0, price: 2 },
  quest_bread_2: { id: 'quest_bread_2', name: 'Tasting dough', chain: 'quest_bread', stage: 2, next: 'quest_bread_3', sprite: 1, price: 4 },
  quest_bread_3: { id: 'quest_bread_3', name: 'Tasting pogăcele', chain: 'quest_bread', stage: 3, next: null, sprite: 2, price: 12 },
};
quests.push({ id: 'ilie-bread-tasting', character: 'ilie', title: 'The borrowed flour bin', afterTask: 'task_17', afterQuest: 'ilie-family',
  requirements: [{ item: 'quest_bread_3', quantity: 2 }], reward: 24,
  opening: [{ speaker: 'ilie', text: 'I can lend a flour bin for two tasting servings of pogăcele. It needs one free board space. When the servings are ready, I will collect the bin and all unused tasting portions.' }],
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
const layouts: BoardLayout[] = [
  { id: 'workbench-clutter-1', obstacles: [
    { id: 'old-crate', position: 0, name: 'Old crate', type: 'clutter', ingredient: 'bakery_3' },
    { id: 'tied-sack', position: 5, name: 'Tied sack', type: 'clutter', ingredient: 'warm_2' },
    { id: 'covered-crock', position: 36, name: 'Covered crock', type: 'clutter', ingredient: 'drinks_2' },
    { id: 'linen-bundle', position: 41, name: 'Linen bundle', type: 'clutter', ingredient: 'bakery_2' },
    { id: 'tied-dough', position: 6, name: 'Tied dough', type: 'anchored', ingredient: 'bakery_2' },
    { id: 'tied-cornmeal', position: 11, name: 'Tied cornmeal', type: 'anchored', ingredient: 'warm_1' },
    { id: 'tied-elderflowers', position: 37, name: 'Tied elderflowers', type: 'anchored', ingredient: 'drinks_1' },
    { id: 'tied-mamaliga', position: 40, name: 'Tied mămăligă', type: 'anchored', ingredient: 'warm_2' },
  ] },
];
const data: GameData = {
  title: 'Scary Snacks', board: { columns: 6, rows: 7, initial, defaultLayout: 'workbench-clutter-1', layouts },
  chains: chains.map(([id, name]) => ({ id, name })), items, characters, chapters, finale, tasks, areas, rooms, decorationSlots, quests, questItems,
  generatorTiers: chains.flatMap(([chain]) => [{ chain, stage: 2, after: 'task_12' }, { chain, stage: 3, after: 'task_20' }]),
  levelRewards: Array.from({ length: 9 }, (_, index) => ({ id: `level-${index + 2}`, level: index + 2, coins: 20 })),
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
