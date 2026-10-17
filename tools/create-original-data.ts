// Original setting, dialogue, progression, and economy authored for this browser game.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { roomPaintings, dataProblems } from '../src/engine.ts';
import type { Area, BoardLayout, Chapter, Character, DecorationSlot, Finale, GameData, Item, PreparationObstacleBatch, Quest, RoomState, Task } from '../src/engine.ts';

const chains: [id: string, name: string, stages: string[], generator: string][] = [
  ['bakery', 'Bread counter', ['Flour', 'Dough', 'Pogăcele', 'Langoș', 'Zacuscă toast', 'Bread basket'], 'Flour bin'],
  ['warm', 'Warm kitchen', ['Cornmeal', 'Mămăligă', 'Bulz', 'Smoked cheese plate', 'Cabbage rolls', 'Goulash pot'], 'Copper pot'],
  ['sweet', 'Dessert table', ['Walnuts', 'Doughnut', 'Papanași', 'Plum dumplings', 'Cozonac', 'Chimney cake'], 'Pastry box'],
  ['drinks', 'Drinks counter', ['Elderflowers', 'Socată', 'Fruit tea', 'Cherry compote', 'Red wine', 'Plum brandy'], 'Drinks pitcher'],
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
    introduction: 'I am Mara. I keep the bistro open and make room for neighbours who want a meal or a quiet seat. Help me try a few servings as we prepare the house.' },
  { id: 'ilie', name: 'Ilie', role: 'Baker', description: 'An older baker with silver hair and moustache, round glasses, a black lambskin căciulă, and a floury sheepskin vest over an embroidered shirt.', sprite: 1,
    introduction: 'I am Ilie, the baker. I bring bread and the notebook where my family kept its dishes. There is room on those pages for what we learn here.' },
  { id: 'eszter', name: 'Eszter', role: 'Potter', description: 'A Székely potter with a short auburn bob, a white puffed-sleeve blouse, a rust-red bodice edged with green and gold braid, and white beads.', sprite: 2,
    introduction: 'I am Eszter. I make the bowls and plates. A useful dish should sit well on the table and leave room for the person beside you.' },
  { id: 'sorin', name: 'Sorin', role: 'Bistro helper', description: 'A cheerful young helper with short wavy chestnut hair, an embroidered white shirt with rolled sleeves, a dark embroidered felt vest, and a woven belt.', sprite: 3,
    introduction: 'I am Sorin. I help at the bistro between deliveries around the neighbourhood. I know the steep streets, the quiet doors, and where to stop for lunch.' },
  { id: 'adrian', name: 'Adrian', role: 'Travelling guard', visitor: true, sprite: 0,
    description: 'A Romanian middle-aged man with short dark hair, a thick neat moustache, a black lambskin căciulă cap, a cream linen ie with red and black geometric embroidery, a practical weathered steel plate cuirass, and a burgundy wool cloak.',
    introduction: 'I am Adrian. I travel with Monica and Janos. We are checking a few reports from the cathedral beyond the village. We may need provisions for several days at a time.' },
  { id: 'monica', name: 'Monica', role: 'Pathfinder', visitor: true, sprite: 1,
    description: 'A Romanian adult woman with dark brown hair in a braid under a red and black woven headscarf, a cream embroidered ie blouse, fitted brown leather scout armour with brass buckles and a cross-strap, and a moss-green travelling cloak.',
    introduction: 'I am Monica. I check the paths while Adrian and Janos compare their notes. The old cathedral has more entrances than our map shows. A supply pack lets us stay a few days to look.' },
  { id: 'janos', name: 'Janos', role: 'Travelling scholar', visitor: true, sprite: 2,
    description: 'An older Hungarian Roma scholar with a warm medium olive complexion, wavy black hair streaked with grey, a neat moustache and short beard, a black wide-brim felt hat, an indigo embroidered waistcoat over a cream shirt, a muted plum neckerchief, and a wooden walking staff.',
    introduction: 'I am Janos. I study the marks in old stonework. Adrian and Monica help me examine the nearby cathedral. Its records leave a few questions, and a long visit needs proper meals.' },
  { id: 'ionatan', name: 'Ionatan', role: 'Foreign property agent', visitor: true, singleVisit: true, sprite: 3,
    description: 'A reserved young adult with fair skin, neat side-parted chestnut hair, a clean-shaven face, a charcoal travel suit, a cream shirt, a burgundy cravat, and a leather document folio.',
    introduction: 'I am Ionatan, a property agent from another country. I am travelling to the nearby castle to close a real-estate deal with a local noble. I have time for one proper dinner before I leave.' },
  { id: 'vlad', name: 'Vlad', role: 'Local baron', portraitAtlas: 'guest', sprite: 0, regular: true,
    prefers: ['warm', 'drinks'], arrivesAfter: 'task_15',
    arrival: [{ speaker: 'mara', text: 'A carriage has stopped at the gate. Count Vlad sends word that he will dine with us tonight.' },
      { speaker: 'vlad', text: 'Baron, officially. Count, in spirit. Your new door hood keeps the rain off very well. I dislike the sun, and I dislike the rain only a little less.' }],
    description: 'A reserved local baron with long dark hair, a narrow moustache, a red velvet cap with a gold jewel, a dark red court coat, and a fur collar. He styles himself as a count and lives in a castle in the countryside.',
    introduction: 'Count Vlad, if you please. My castle is outside the village, so I seldom dine here. A meat dish and red wine will suit me. The country roads have given me quite an appetite.' },
  { id: 'elisabeta', name: 'Elisabeta', role: 'Visiting countess', portraitAtlas: 'guest', sprite: 1, regular: true,
    prefers: ['warm', 'drinks'], arrivesAfter: 'task_15',
    arrival: [{ speaker: 'eszter', text: 'Countess Elisabeta is visiting her land again. She asked whether our courtyard is quiet.' },
      { speaker: 'elisabeta', text: 'Quiet, clean, and well lit. I shall read my estate papers here with a glass of red wine. Red suits me. It always has.' }],
    description: 'An Austro-Hungarian countess with fair skin, neatly dressed dark hair beneath a white lace headdress, a high white ruff, pearls, and a rich dark red gown. She sometimes visits her land near the village.',
    introduction: 'I am Countess Elisabeta. I have land nearby, though my visits are infrequent. Please bring a meat dish and red wine. I shall review the estate papers after dinner.' },
  { id: 'mina', name: 'Mina', role: 'Searching for her fiancé', visitor: true, singleVisit: true, portraitAtlas: 'guest', sprite: 2,
    description: 'A young British middle-class woman in Victorian dress, with fair skin, dark brown hair pinned neatly back, a cream high-collared blouse, a modest charcoal travelling jacket, and a blue ribbon with a small brooch.',
    introduction: 'My name is Mina. My fiancé Ionatan came here to sign a property contract, but his letters stopped. Doctor Avram has come with me to find him. I eat no meat or fish; eggs and dairy are welcome.' },
  { id: 'avram', name: 'Avram', role: 'Travelling doctor', visitor: true, singleVisit: true, portraitAtlas: 'guest', sprite: 3,
    description: 'An older Hungarian Jewish doctor with fair skin, short silver hair, a clean-shaven face, a dark wool travelling coat, a waistcoat, a white shirt, a restrained necktie, and a leather medical bag.',
    introduction: 'I am Doctor Avram, professional physician and amateur solomonar. I am travelling with Mina to find Ionatan. We will stay together while we ask about the road to the castle.' },
  ...regulars(),
];
/**
 * The regulars of spec 013. Each one nods to a horror novel, a horror film, or local folklore, in the name, the trade, or one habit.
 * Four are present from the start. The others arrive with the last preparation of chapters 1 to 3, introduced by a core character.
 */
function regulars(): Character[] {
  const rows: [id: string, name: string, role: string, atlas: Character['portraitAtlas'], sprite: number, prefers: [string, string], arrivesAfter: number,
    description: string, introduction: string, arrival?: [speaker: string, text: string][]][] = [
    ['dochia', 'Dochia', 'Shepherdess', 'regulars-1', 0, ['warm', 'bakery'], 0,
      'An older shepherdess with a white braid under a dark brown headscarf, wearing a cream sheepskin vest over a brown sheepskin coat and a white linen blouse.',
      'I am Dochia. I keep sheep on the hill above the village, and I wear all my sheepskins until the weather proves that it deserves fewer. I took one off this morning. The weather has not earned another.'],
    ['victor', 'Victor', 'Anatomy student', 'regulars-1', 1, ['warm', 'drinks'], 0,
      'An anatomy student of about thirty with untidy dark hair and stubble, in a dark charcoal coat with a high collar, a white shirt, and a black neck scarf.',
      'I am Victor. I study anatomy at the college and work late in its old laboratory. Last week one of my projects sat up on the table. It was only a soufflé, but my landlady still screamed.'],
    ['ana', 'Ana', 'Night-shift nurse', 'regulars-1', 2, ['warm', 'drinks'], 0,
      'A night-shift nurse with a dark brown bun, in a pale blue work dress and a white apron, with a small braid of garlic pinned to her apron strap.',
      'I am Ana. I work nights at the clinic, so this is my breakfast. Every Saint Andrew’s Eve I hang garlic on the ward door. The doctor laughs at me, but none of my patients has ever been bitten.'],
    ['costel', 'Costel', 'Clock and automaton maker', 'regulars-1', 3, ['sweet', 'drinks'], 0,
      'A clock and automaton maker with grey curly hair and a trimmed beard, a brass loupe on a band around his head, a green waistcoat with a watch chain, and a small brass key on a cord.',
      'I am Costel. I mend clocks and build small brass automata in the shop by the well. If you hear ticking under my coat, it is a mechanical sparrow. It likes bright eyes and shiny spoons, so keep an eye on both.'],
    ['sanziana', 'Sânziana', 'Florist', 'regulars-2', 0, ['sweet', 'produce'], 4,
      'A young florist with long light-brown hair under a crown of small yellow bedstraw flowers, in a white blouse with yellow and green embroidery and a moss-green apron.',
      'I am Sânziana. I sell flowers from the cart by the church. On Midsummer Eve I weave crowns of yellow bedstraw and dance in the meadow until dawn. My sisters dance too. Nobody has ever counted all of us at once.',
      [['eszter', 'The front room is ready, and the first flowers have come to see it. This is Sânziana, from the flower cart by the church.'],
        ['sanziana', 'Eszter promised me a jug for the counter. I promised her flowers that last until midsummer. After that, they make their own plans.']]],
    ['dorian', 'Dorian', 'Portrait painter', 'regulars-2', 1, ['sweet', 'drinks'], 4,
      'A portrait painter with a smooth, youthful face and waved dark blond hair, in a wine-red velvet jacket with a dusty rose silk cravat and dabs of paint on one cuff.',
      'I am Dorian. I paint portraits in the house with the green door. People say I have not aged since they were children. I put it down to good bread and a quiet life. My portrait in the attic does all the worrying for me.',
      [['mara', 'Dorian, the painter, has asked for a seat under the new lamps. He says the light is finally good enough for a portrait.'],
        ['dorian', 'I painted this room once before, Mara, when your grandmother ran it. It has hardly changed. Neither have I.'],
        ['mara', 'I will pretend that I did not hear that. Sit down, and I will bring the menu.']]],
    ['ileana', 'Ileana', 'Seamstress', 'regulars-2', 2, ['produce', 'drinks'], 8,
      'A seamstress with dark hair turning grey under a dark blue headscarf, with a tape measure around her neck, a wooden spindle in her apron bib, and a pin cushion.',
      'I am Ileana, the seamstress. I finish every spindle before Maundy Thursday, because that night Joimărița checks the houses for idle spinners. She has never visited my house. She has visited my brother twice.',
      [['ilie', 'Ileana sews the aprons for half the village. She heard that we have a real kitchen now.'],
        ['ileana', 'I heard that you have four aprons and eight stains. I brought thread. Finish your work before Thursday, and nobody gets into trouble.']]],
    ['cezar', 'Cezar', 'Night watchman', 'regulars-2', 3, ['warm', 'produce'], 8,
      'A night watchman with greying dark hair and heavy-lidded, sleepy eyes, in a long dark grey wool coat, a black watchman’s cap, and a brass whistle on a cord.',
      'I am Cezar, the night watchman. I walk the village from dusk to dawn. Some people say that I do it asleep. That is not true. I am only resting my eyes, and my feet know the way.',
      [['sorin', 'This is Cezar. He watches the street at night, and he saw the kitchen lights from the square.'],
        ['cezar', 'Good evening. Or good morning. I lose track. A warm plate at the end of my round would be very welcome.'],
        ['sorin', 'He says that at noon too.']]],
    ['catalina', 'Cătălina', 'Church bell-ringer', 'regulars-3', 0, ['sweet', 'warm'], 12,
      'A strong church bell-ringer with dark brown hair under a red and black headscarf, a white embroidered blouse, a brown sheepskin vest, and a coil of bell rope over one shoulder.',
      'I am Cătălina. I ring the church bell, and when hail clouds come over the hill, I ring until they turn back. The old women say that solomonari ride those clouds. I say that they can ride somewhere else.',
      [['mara', 'Cătălina rings the bell at the church. She heard that the shared table is open.'],
        ['catalina', 'I heard it from the bell tower. I hear everything from the bell tower. Save me a seat by the door, in case the hail comes.']]],
    ['bran', 'Bran', 'Night-bus driver', 'regulars-3', 1, ['bakery', 'warm'], 12,
      'A broad night-bus driver with a short dark beard, in a navy driver’s cap and a navy jacket with brass buttons, with a long dark red scarf wound high around his neck and a small pumpkin pin.',
      'I am Bran. I drive the night bus to the town and back. On my days off, I ride my horse through the woods. I always wear this scarf, because my neck gets cold. Please do not ask more questions about my neck.',
      [['sorin', 'This is Bran. He drives the night bus. Once he gave me a lift, and my bicycle too.'],
        ['bran', 'From tomorrow, the bus stops by the square for a loaf of bread. The horse prefers apples, but the horse does not drive.']]],
  ];
  return rows.map(([id, name, role, portraitAtlas, sprite, prefers, after, description, introduction, arrival]) => ({
    id, name, role, description, introduction, sprite, portraitAtlas, regular: true, prefers,
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
  { speaker: 'mara', text: 'Tonight is the supper that we planned together. Tomorrow the bistro stays open, and every neighbour knows the way.' },
  { speaker: 'ilie', text: 'Then I will start the dough early. Somebody will want bread for breakfast.' },
], ending: 'The supper is served, and the bistro stays open.' };
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
const tasks: Task[] = taskRows.map(([title, a, at, b, bt, c, ct], index) => {
  const [materials, labour, hours, summary] = workRows[index];
  return {
    id: `task_${index + 1}`, chapter: Math.floor(index / 4) + 1, title,
    cost: materials + labour, work: { summary, materials, labour, hours },
    dialogue: [{ speaker: a, text: at }, { speaker: b, text: bt }, { speaker: c, text: ct }],
    ...(index === 2 ? { unlock: 'sweet' } : index === 5 ? { unlock: 'produce' } : {}),
  };
});
// The quest campaign. A quest in window w opens after preparation w (0: in a new game), and preparation w + 1 needs it.
// Personal requests pay their menu value times the rate of the chapter of their window. Supply packs and the meal for two pay their
// menu value, and Ionatan pays well. Each preparation is paid by the quests that open before it; questProblems checks the funds.
const rates = [3, 2.5, 2, 1.5, 1, 1];
const menuValue = (requirements: [string, number][]) => requirements.reduce((sum, [item, quantity]) => sum + items[item].price * quantity, 0);
const lines = (speaker: string, text: string) => [{ speaker, text }];
type QuestRow = [id: string, character: string, title: string, window: number, requirements: [string, number][], opening: string, completion: string];
// The four core arcs keep their requests. The regulars ask for dishes from their favourite chains.
const questRows: QuestRow[] = [
  ['mara-welcome', 'mara', 'A welcome drink', 0, [['drinks_2', 1]],
    'Let us try a glass of socată for the first welcome. I want something simple to offer when a neighbour comes through the door.',
    'That will do well. A glass and a seat can make the first visit easier. I will keep space on the counter.'],
  ['ilie-counter', 'ilie', 'Bread for the counter', 1, [['bakery_3', 1]],
    'A few pogăcele would give the new counter a proper start. Bring me a serving and we can choose where the bread belongs.',
    'Here, within reach of the plates. Nobody should have to ask twice for bread.'],
  ['eszter-bowls', 'eszter', 'Try the bowls', 4, [['warm_2', 2]],
    'Can you bring two servings of mămăligă? I want to check that the bowls leave enough room for a spoon.',
    'Both servings fit comfortably. I will keep this shape for the bowls we use every day.'],
  ['sorin-lunch', 'sorin', 'Lunch between errands', 6, [['bakery_3', 1], ['drinks_2', 1]],
    'I have a short stop between deliveries. Could you set aside pogăcele and socată so I can eat before the next hill?',
    'There is time to sit down after all. I will take the empty glass back before I leave.'],
  ['mara-table', 'mara', 'A place at the table', 8, [['warm_3', 1]],
    'The shared table needs a warm dish that is easy to serve. Bring a bulz and we can test the space for plates.',
    'There is room for the dish and for people to pass it. The table feels ready for company.'],
  ['eszter-table', 'eszter', 'A small sweet plate', 9, [['sweet_3', 1]],
    'The new tableware needs a small sweet plate. Let me try papanași beside the bowl and cup.',
    'The plate fits without crowding the cup. I will use this arrangement at the shared table.'],
  ['ilie-courtyard', 'ilie', 'Bread for outside', 12, [['bakery_4', 1]],
    'Bring a langoș for a trial serving outside. I want to find a good place for the bread when the courtyard tables are ready.',
    'Near the kitchen door will work. We can bring another serving without crossing between the chairs.'],
  ['sorin-path', 'sorin', 'A courtyard break', 13, [['produce_3', 1], ['drinks_2', 1]],
    'The path is clear. Could you bring roasted vegetables and socată for a break while we check the route from gate to kitchen?',
    'The tray passed every chair. Now I can sit down and enjoy what I carried.'],
  ['ilie-family', 'ilie', 'A dish from the notebook', 16, [['warm_4', 1]],
    'I marked a smoked cheese plate in the family notebook. Bring one so we can choose a serving for the tasting.',
    'This serving belongs at the tasting. I will write the portion beside the family notes, where the next cook can find it.'],
  ['eszter-tasting', 'eszter', 'Match the tasting plates', 17, [['sweet_4', 1]],
    'The tasting plates need their final check. Bring plum dumplings so I can see how much room the serving needs.',
    'There is space for the serving and its label. The plates can go to the shared table.'],
  ['mara-supper', 'mara', 'The supper service', 20, [['bakery_5', 1], ['warm_4', 1]],
    'Let us practise one supper service with zacuscă toast and a smoked cheese plate. I want both dishes to reach the table together.',
    'Everything arrived together. We have a useful plan for the supper, and time to welcome each guest.'],
  ['sorin-welcome', 'sorin', 'Welcome from the gate', 20, [['drinks_3', 2], ['produce_3', 1]],
    'I will meet people at the gate. Could you prepare two fruit teas and roasted vegetables for the first guests who want a seat?',
    'The welcome is ready. I can show people the table and stay long enough to share it with them.'],
  ['sorin-first-ride', 'sorin', 'Snacks for the saddlebag', 0, [['bakery_2', 2], ['drinks_2', 1]],
    'I start my delivery round in ten minutes, and the first hill is the worst. Two pieces of dough and a socată, please. I will bake the dough on the warm handlebars.',
    'That is not how baking works, but thank you. I will eat it raw and tell everyone it was a recipe.'],
  ['dochia-sheepskin', 'dochia', 'One sheepskin fewer', 0, [['warm_3', 1], ['bakery_3', 1]],
    'The wind on the hill is still cold, so I am wearing all nine sheepskins. A bulz and some pogăcele would warm me enough to take one off.',
    'There. One sheepskin fewer. Eight to go before summer, and the weather is watching me.'],
  ['victor-exam', 'victor', 'Food for the nerves', 0, [['warm_2', 2], ['drinks_2', 1]],
    'I have an exam on the nervous system tomorrow, and mine is not cooperating. Two bowls of mămăligă and a socată, please.',
    'Much better. I can name every bone in the hand now. I counted mine twice to be sure.'],
  ['ana-night-shift', 'ana', 'Breakfast at midnight', 0, [['bakery_3', 1], ['drinks_3', 1]],
    'My shift starts at ten tonight. Pogăcele and a fruit tea will keep me awake until the sun comes up.',
    'Lovely. If anything knocks on the ward door tonight, it will smell garlic and good bread, and it will go home.'],
  ['eszter-first-plate', 'eszter', 'The first plate', 1, [['warm_2', 1], ['bakery_3', 1]],
    'The window lets the light in now, so I can finally see my glazes. Put mămăligă and pogăcele on my new plate, and I will see if the colour suits food.',
    'It suits it. The plate looks hungry when it is empty, and that is exactly right.'],
  ['costel-sparrow', 'costel', 'Crumbs for a clockwork bird', 2, [['bakery_3', 1], ['drinks_2', 1]],
    'My mechanical sparrow has learned to steal crumbs. It cannot eat them, but it enjoys the stealing. Some pogăcele, please, and a socată for me.',
    'The sparrow took three crumbs and wound itself up with pride. Tick, tick. I will keep the rest.'],
  ['mara-lamp-supper', 'mara', 'Supper under the lamps', 3, [['warm_3', 1], ['drinks_3', 1]],
    'When the lamps are in, I want to see how a plate looks under them. Bring a bulz and a fruit tea, and we will sit down like guests for once.',
    'Warm light and a warm plate. I think the room will forgive us for the years of dust.'],
  ['dochia-lunch', 'dochia', 'Lunch for the hill', 3, [['warm_4', 1], ['bakery_3', 1]],
    'The sheep eat grass all day and never complain. I eat cheese, and I complain about the grass. Pack me a smoked cheese plate and pogăcele.',
    'The sheep will smell the cheese and follow me home. That saves me a walk.'],
  ['sanziana-cart', 'sanziana', 'An empty flower cart', 4, [['sweet_2', 2], ['drinks_2', 1]],
    'I sold every flower on the cart before noon. Two doughnuts and a socată, and I can pick more before the bees wake up.',
    'The bees are already waiting by the cart. They like your doughnuts too.'],
  ['dorian-sitting', 'dorian', 'A long sitting', 4, [['sweet_3', 1], ['drinks_3', 1]],
    'I am painting the miller. He has to sit still for hours, and he gets hungry. Papanași and a fruit tea for him, please.',
    'He sat perfectly still. A little too still near the end, but I think he was only asleep.'],
  ['victor-midnight', 'victor', 'The midnight experiment', 5, [['warm_3', 2], ['drinks_3', 1]],
    'My professor wants proof that I can keep something alive all night. Two bulz and a fruit tea should keep me alive, at least.',
    'It worked. I was alive at sunrise, and the professor is very impressed. He expected a frog.'],
  ['costel-clock', 'costel', 'Time for something sweet', 7, [['sweet_3', 2], ['drinks_3', 1]],
    'The church clock stopped at half past three. Until I mend it, it is always teatime. Two papanași and a fruit tea, please.',
    'The clock runs again. I set it five minutes fast, so nobody is ever late for dessert.'],
  ['ileana-fitting', 'ileana', 'Lunch between fittings', 8, [['produce_3', 1], ['drinks_2', 2]],
    'I have three wedding dresses to finish before Thursday. Roasted vegetables and two socată, please, before I sew a sleeve shut by mistake.',
    'All three dresses are done. Joimărița can inspect my house whenever she likes.'],
  ['eszter-green-bowls', 'eszter', 'A second glaze', 9, [['warm_3', 2], ['sweet_3', 1]],
    'I fired a second set of bowls with a green glaze. Fill two with bulz and one with papanași, and we will see which colour the food prefers.',
    'The food likes both. Keep the green bowls with the blue ones. Tap the bowls on the upper shelf to change them whenever you like.'],
  ['ana-ward-tea', 'ana', 'Tea for the ward', 9, [['drinks_3', 3], ['warm_2', 1]],
    'The night patients cannot sleep. Three fruit teas for them, please, and a mămăligă for the porter.',
    'The whole ward is asleep. Even the porter. Especially the porter.'],
  ['cezar-round', 'cezar', 'The end of the round', 9, [['warm_3', 1], ['produce_3', 1]],
    'My round ends at dawn. A bulz and roasted vegetables would make a fine breakfast. Or supper. Whichever this is.',
    'Very good. I will eat it on the way home. My feet know the way.'],
  ['sanziana-meadow', 'sanziana', 'A picnic in the meadow', 10, [['produce_3', 2], ['sweet_3', 1]],
    'My sisters are having a picnic in the meadow. Roasted vegetables for two, and papanași for the rest. I will not tell you how many the rest are.',
    'My sisters thank you, all of them. You may hear singing in the meadow tonight. Please do not go and count us.'],
  ['dochia-march', 'dochia', 'The last cold week', 11, [['warm_4', 1], ['bakery_4', 1], ['drinks_3', 1]],
    'Spring is close, and I am down to three sheepskins. A smoked cheese plate, a langoș, and a fruit tea, and I will give up another without a fight.',
    'Done. If it snows tomorrow, I am blaming you.'],
  ['dorian-gallery', 'dorian', 'The exhibition', 12, [['drinks_4', 2], ['sweet_4', 2]],
    'My exhibition opens on Friday. Cherry compote and plum dumplings for the guests, please. The paintings do not eat, whatever people say.',
    'Everyone loved the portraits. One guest said that the eyes followed her around the room. I told her that is what eyes are for.'],
  ['catalina-hail', 'catalina', 'Bell-ringer’s appetite', 12, [['warm_3', 1], ['sweet_3', 1]],
    'A hail cloud came over the hill this morning. I rang it away, and now my arms are hungry. A bulz and papanași, please.',
    'Not one hailstone fell on the village. The bell and I can rest until the next cloud.'],
  ['bran-last-bus', 'bran', 'The last bus', 13, [['bakery_4', 1], ['warm_3', 1]],
    'The last bus leaves the square at midnight. Nobody gets on after the bridge, but I stop anyway. A langoș and a bulz for the road, please.',
    'Thank you. The road through the woods is long, and I like company. Even the quiet kind.'],
  ['ileana-thursday', 'ileana', 'Before Thursday', 14, [['produce_4', 2], ['drinks_3', 2]],
    'Thursday is close, and my brother has not touched his spindle. I am taking him zacuscă and fruit tea, so that he has no excuse.',
    'He spun all night. Nothing was burned, and nobody had a visitor. A good week.'],
  ['victor-thesis', 'victor', 'The thesis supper', 14, [['warm_5', 1], ['drinks_4', 2]],
    'I finished my thesis at three in the morning, during a thunderstorm. Cabbage rolls and cherry compote, please. We are celebrating.',
    'My thesis passed. The examiners said it has a life of its own. I am choosing to take that as praise.'],
  ['vlad-after-dark', 'vlad', 'Dinner after dark', 15, [['warm_5', 1], ['drinks_5', 1]],
    'I dine only after sunset. An old family habit. Cabbage rolls and a carafe of red wine, if you please.',
    'Excellent. The wine is exactly the right shade of red. I am very particular about red.'],
  ['elisabeta-papers', 'elisabeta', 'The estate papers', 15, [['warm_5', 1], ['drinks_5', 1]],
    'I have estate papers to read tonight. Cabbage rolls and red wine, please. Red helps me concentrate.',
    'The papers are in order. My neighbour’s boundary has moved a little toward my land. How odd.'],
  ['vlad-guest', 'vlad', 'A guest at the castle', 15, [['warm_6', 1], ['drinks_5', 2]],
    'A guest from abroad comes to my castle soon, on a matter of property. I must give him a goulash pot and plenty of red wine. First impressions matter.',
    'Splendid. My guest will feel very welcome. Nobody ever wants to leave my castle. Nobody ever does.'],
  ['cezar-castle-lights', 'cezar', 'Lights on the hill', 16, [['warm_4', 2], ['produce_3', 1]],
    'Somebody keeps lighting candles in the castle on the hill. It is not my district, but I like to watch with a warm plate. Two smoked cheese plates and roasted vegetables, please.',
    'The candles went out at midnight. I stayed awake for all of it. Well, for most of it.'],
  ['ana-saint-andrew', 'ana', 'Saint Andrew’s Eve', 17, [['warm_4', 1], ['bakery_4', 2], ['drinks_3', 1]],
    'Tonight is Saint Andrew’s Eve. I will hang the garlic early, and then I want a proper supper: a smoked cheese plate, two langoș, and a fruit tea.',
    'The garlic is up and the plates are clean. Let anything knock tonight. We are fed, and we smell of garlic.'],
  ['costel-doll', 'costel', 'The dancing doll', 18, [['sweet_5', 1], ['drinks_4', 1]],
    'I have finished a dancing doll for the village fair. She dances very well, but she stares a little. A cozonac and a cherry compote to celebrate?',
    'She danced through the whole fair. Only one child cried, and that was because the cozonac ran out.'],
  ['bran-horse', 'bran', 'A ride through the woods', 18, [['bakery_5', 1], ['warm_4', 1], ['bakery_3', 2]],
    'On my day off, I ride through the woods. The horse wants apples. I want zacuscă toast, a smoked cheese plate, and pogăcele.',
    'A fine ride. People ran off the road when they saw us, but I think that was the horse. It is very tall.'],
  ['catalina-cloud-rider', 'catalina', 'The cloud rider', 18, [['warm_4', 1], ['sweet_4', 2]],
    'A stranger with a long beard and a book is asking about the weather. I do not like it. A smoked cheese plate and plum dumplings, so that I can keep watch from the tower.',
    'He rode off on a very dark cloud. The weather is fine now. Thank you for the plum dumplings.'],
  ['sanziana-midsummer', 'sanziana', 'Midsummer Eve', 19, [['sweet_4', 2], ['produce_4', 1]],
    'It is almost Midsummer Eve. We dance until dawn, so we need plum dumplings and zacuscă. Dancing is hungry work.',
    'We danced until sunrise and wove a crown for you. It hangs on the gate. Do not wear it after dark.'],
  ['dorian-birthday', 'dorian', 'A quiet birthday', 20, [['sweet_5', 1], ['drinks_5', 1]],
    'It is my birthday. I will not say which one. A cozonac and a glass of red wine, please, and no candles. There are never enough.',
    'Thank you. The portrait in my attic sends its regards. It had a much harder day than I did.'],
  ['elisabeta-bath', 'elisabeta', 'An evening at the manor', 20, [['warm_6', 1], ['drinks_5', 2]],
    'I am taking the evening off for a long bath at my manor. Afterwards, a goulash pot and two carafes of red wine. Do not ask what is in the bath. Rose petals. Only rose petals.',
    'Wonderful. My maids say that I look younger every year. I tell them that it is the goulash.'],
  ['ileana-towels', 'ileana', 'Towels for the gate', 21, [['produce_5', 1], ['drinks_4', 1], ['bakery_4', 1]],
    'I am embroidering the towels for the supper gate. Bring mushroom sauce, a cherry compote, and a langoș, and I will finish the last corner.',
    'The towels are done. Each corner has a little red rooster. They keep watch better than Cezar.'],
  ['bran-pumpkins', 'bran', 'The pumpkin fair', 21, [['bakery_6', 1], ['warm_5', 1]],
    'The town has a pumpkin fair this weekend. Last year I carved the best pumpkin head. People said that I understand heads very well. A bread basket and cabbage rolls, please.',
    'The bread basket is for the bus. The cabbage rolls are for me. The pumpkin head is for anyone who needs one.'],
  ['cezar-sleepwalk', 'cezar', 'A supper to remember', 22, [['warm_5', 1], ['produce_5', 1]],
    'Last night I woke up in your courtyard with an empty plate. I do not remember eating. Cabbage rolls and mushroom sauce, please, so that I remember this time.',
    'I remember every bite. Thank you. If you see me in the courtyard tonight, please wave.'],
  ['ileana-blue-cloth', 'ileana', 'A blue table cloth', 22, [['produce_4', 1], ['bakery_5', 1]],
    'I embroidered a blue cloth for the serving table. Let us test it with zacuscă and a zacuscă toast. The stains will tell us if it is ready.',
    'Not a single stain. The blue cloth is yours too. Tap the serving table in the courtyard to change the cloth whenever you like.'],
  ['catalina-supper-bell', 'catalina', 'The supper bell', 23, [['warm_5', 2], ['sweet_5', 1]],
    'For the supper, I will ring the bell to call everyone in. That is a lot of rope to pull. Two cabbage rolls and a cozonac, please.',
    'I will ring it loud enough for the whole valley. The next valley too, if they bring a dish.'],
  ['sanziana-lilacs', 'sanziana', 'Lilacs for the dresser', 23, [['sweet_4', 1], ['produce_3', 1], ['drinks_3', 1]],
    'Wildflowers are lovely, but lilacs smell like the evening. Bring plum dumplings, roasted vegetables, and a fruit tea, and I will bring an armful.',
    'The lilacs are ready. When the supper starts, tap the jug on the dresser in the front room to change the flowers whenever you like.'],
];
// Three requests offer a second finish for a decoration. Delivery adds the finish, and the player can then switch it in the room.
const finishes: Record<string, Quest['unlocks']> = {
  'eszter-green-bowls': { slot: 'tableware', variant: 'green' }, 'ileana-blue-cloth': { slot: 'textiles', variant: 'blue' }, 'sanziana-lilacs': { slot: 'flowers', variant: 'lilacs' },
};
const campaign: { window: number; quest: Quest }[] = questRows.map(([id, character, title, window, requirements, opening, completion]) => ({ window, quest: {
  id, character, title, afterTask: window ? `task_${window}` : null, requirements: requirements.map(([item, quantity]) => ({ item, quantity })),
  reward: Math.round(menuValue(requirements) * rates[Math.floor(window / 4)] / 2) * 2, opening: lines(character, opening), completion: lines(character, completion),
  ...(finishes[id] ? { unlocks: finishes[id] } : {}) } }));
// The travellers return three times each, in one shared sequence, at fixed places in the campaign.
const visitorRows: QuestRow[] = [
  ['adrian-first-pack', 'adrian', 'Provisions for the hill', 6, [['bakery_3', 8], ['warm_3', 4], ['drinks_3', 4]],
    'We plan to spend several days near the cathedral. A few reports need a closer look. Could you fill a large pack with pogăcele, bulz, and fruit tea before we leave?',
    'The pack is full. We can take our time on the hill without returning for each meal. I will bring back the empty containers.'],
  ['monica-first-pack', 'monica', 'Meals beyond the gate', 8, [['bakery_5', 2], ['produce_5', 2], ['warm_5', 2]],
    'One path runs behind the cathedral wall. I would like several days to check where it leads. Could you prepare zacuscă toast, wild mushroom sauce, and cabbage rolls for our camp meals?',
    'Everything is packed separately. We can share these meals while we compare the paths with our map. Thank you for taking care with the order.'],
  ['janos-first-pack', 'janos', 'A long reading', 9, [['bakery_4', 4], ['sweet_3', 4], ['drinks_3', 4]],
    'A few marks near the cathedral do not match the written records. Reading them may take several days. Could you prepare a full supply of langoș, papanași, and fruit tea for the three of us?',
    'There is enough here for a long stay. We can stop to eat without losing our place in the notes. The old records can wait until after lunch.'],
  ['adrian-second-pack', 'adrian', 'Supper for the watch', 13, [['warm_6', 2], ['bakery_6', 2]],
    'We are going back to examine a quiet part of the cathedral grounds. This visit may last several days. Two goulash pots and two bread baskets would give us proper suppers between our rounds.',
    'The suppers are ready to share. We will carry them up together. There is no need to rush the work when everyone has eaten.'],
  ['monica-second-pack', 'monica', 'The longer path', 14, [['produce_3', 6], ['bakery_3', 6], ['drinks_4', 4]],
    'Our next route starts beyond the cathedral garden. We may be away for several days while we check the old paths. Could you make a large pack of roasted vegetables, pogăcele, and cherry compote?',
    'The provisions fit both bags. We can follow the route carefully and stop wherever the path gives us a dry place to sit.'],
  ['janos-second-pack', 'janos', 'Meals beside the notes', 17, [['sweet_6', 2], ['produce_6', 2], ['warm_5', 2]],
    'We found another page to compare with the cathedral stonework. It may keep us there for several days. Could you send chimney cakes, sharing boards, and cabbage rolls for our meal breaks?',
    'These are meals worth closing a notebook for. We will keep the table clear before we spread out the pages again.'],
  ['adrian-third-pack', 'adrian', 'One more stay', 19, [['bakery_4', 6], ['warm_4', 6], ['drinks_3', 4]],
    'There are still a few places near the cathedral that we have not checked. We need supplies for another stay of several days. Could you pack langoș, smoked cheese plates, and fruit tea in quantity?',
    'That will cover the stay. We will take the meals in turns and keep the path clear for anyone else who needs to pass. Thank you.'],
  ['monica-third-pack', 'monica', 'A careful return', 21, [['bakery_6', 2], ['warm_6', 2], ['produce_6', 2]],
    'We are checking our route around the cathedral once more. A careful visit takes several days. Could you prepare bread baskets, goulash pots, and sharing boards for the three of us?',
    'The baskets are secure. We can share the food and compare what we saw on each path. I will keep your containers together for the return.'],
  ['janos-third-pack', 'janos', 'The last loose pages', 22, [['sweet_5', 2], ['warm_5', 2], ['produce_5', 2]],
    'A few loose pages still leave questions about the cathedral. We have set aside several days to read them there. Could you prepare cozonac, cabbage rolls, and wild mushroom sauce for our meals?',
    'Our provisions are ready. Whatever those pages tell us, we will discuss them after a proper meal. There will be a warm table to come back to here.'],
];
for (const [index, [id, character, title, window, requirements, opening, completion]] of visitorRows.entries()) {
  campaign.push({ window, quest: { id, character, title, afterTask: `task_${window}`, ...(index ? { afterQuest: visitorRows[index - 1][0] } : {}),
    requirements: requirements.map(([item, quantity]) => ({ item, quantity })), reward: menuValue(requirements), opening: lines(character, opening), completion: lines(character, completion) } });
}
campaign.push({ window: 16, quest: { id: 'ionatan-castle-dinner', character: 'ionatan', title: 'Dinner before the castle', afterTask: 'task_16', afterQuest: 'vlad-guest',
  requirements: [{ item: 'warm_6', quantity: 1 }, { item: 'produce_6', quantity: 1 }, { item: 'sweet_6', quantity: 1 }, { item: 'drinks_6', quantity: 1 }], reward: 1100,
  opening: [{ speaker: 'ionatan', text: 'I have come from abroad to close a real-estate deal with a local noble at the nearby castle. Before I continue, I would like a proper dinner: a goulash pot, a sharing board, a chimney cake, and plum brandy. I will pay well for the care this meal needs.' }],
  completion: [{ speaker: 'ionatan', text: 'An excellent dinner. Here is the payment, with my thanks. My papers are in order, and I must leave for the castle now. My journey takes me on from there, so I will not return. Farewell.' }] } });
const searchRequirements = [{ item: 'bakery_5', quantity: 2 }, { item: 'produce_3', quantity: 2 }, { item: 'warm_4', quantity: 1 }, { item: 'drinks_3', quantity: 2 }];
campaign.push({ window: 17, quest: { id: 'mina-avram-search', character: 'mina', companions: ['avram'], title: 'A meal before the search', afterTask: 'task_17',
  afterQuest: 'ionatan-castle-dinner', requirements: searchRequirements,
  reward: searchRequirements.reduce((sum, { item, quantity }) => sum + items[item].price * quantity, 0),
  opening: [{ speaker: 'mina', text: 'Ionatan is my fiancé. He came from Britain to sign a property contract at the castle, but he has not written back. Have you seen him?' },
    { speaker: 'mara', text: 'He had dinner here and left for the castle. He has not returned to the bistro.' },
    { speaker: 'avram', text: 'Then Mina and I will follow that road together. Before we leave, could you prepare a meal for two? We will both eat vegetarian food.' },
    { speaker: 'mina', text: 'Two plates of zacuscă toast, two plates of roasted vegetables, a smoked cheese plate to share, and two pots of fruit tea, please. Eggs and dairy are fine, but no meat or fish.' }],
  completion: [{ speaker: 'mina', text: 'Thank you for the meal and for telling us which road he took. We must find out why his letters stopped.' },
    { speaker: 'avram', text: 'We shall leave for the castle together now. I have my medical bag, should he need help.' },
    { speaker: 'mara', text: 'I hope you find him safe. Take care on the road.' }],
  followUp: { id: 'mina-avram-news', title: 'News from the road', afterDeliveries: 3,
    dialogue: [{ speaker: 'sorin', text: 'There is news going round the village. Mina and Doctor Avram found Ionatan gravely ill. All three have left for Britain. They did not stop at our bistro on the way back.' },
      { speaker: 'mara', text: 'Then he is no longer alone. I hope he recovers at home. Thank you for bringing the news, Sorin.' }] } } });
// The tickets show open quests in authored order, so the quests are listed in the order in which they open.
const quests: Quest[] = campaign.sort((first, second) => first.window - second.window).map(({ quest }) => quest);
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
// Each finished preparation leaves its own materials and supplies to sort on the board.
// Preparation clutter mixes its matching new pictures with existing packing; tied food uses its food picture.
const preparations: PreparationObstacleBatch[] = [
  { after: 'task_1', context: 'The window repair leaves packing and cleaning cloths to put away.', obstacles: [
    { id: 'prep-1-frame-offcuts', name: 'Window-frame offcuts', type: 'clutter', ingredient: 'bakery_1', atlas: 'preparation', sprite: 0 },
    { id: 'prep-1-frame-cloths', name: 'Frame-cleaning linen bundle', type: 'clutter', ingredient: 'drinks_1', sprite: 3 },
  ] },
  { after: 'task_2', context: 'The welcome board is painted; its supplies still cover the workbench.', obstacles: [
    { id: 'prep-2-paint-pot', name: 'Welcome-board paint pot', type: 'clutter', ingredient: 'warm_1', atlas: 'preparation', sprite: 1 },
    { id: 'prep-2-board-cloths', name: 'Board-cleaning linen bundle', type: 'clutter', ingredient: 'bakery_1', sprite: 3 },
    { id: 'prep-2-sanding-sack', name: 'Sanding-supply sack', type: 'clutter', ingredient: 'drinks_1', sprite: 1 },
  ] },
  { after: 'task_3', context: 'The pastry shelf is ready, but its delivery still needs sorting.', obstacles: [
    { id: 'prep-3-pastry-plates', name: 'Wrapped pastry plates', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-3-walnuts', name: 'Tied pastry walnuts', type: 'anchored', ingredient: 'sweet_1' },
  ] },
  { after: 'task_4', context: 'The lamps are lit; their packing and polishing supplies need clearing.', obstacles: [
    { id: 'prep-4-lamp-packing', name: 'Spare lamp and packing', type: 'clutter', ingredient: 'drinks_2', atlas: 'preparation', sprite: 2 },
    { id: 'prep-4-lamp-cloths', name: 'Lamp-polishing linen bundle', type: 'clutter', ingredient: 'warm_1', sprite: 3 },
    { id: 'prep-4-fittings', name: 'Lamp-fitting sack', type: 'clutter', ingredient: 'bakery_1', sprite: 1 },
  ] },
  { after: 'task_5', context: 'The worktop is steady, and its repair supplies must go back into storage.', obstacles: [
    { id: 'prep-5-worktop-offcuts', name: 'Worktop-repair offcuts', type: 'clutter', ingredient: 'warm_2', atlas: 'preparation', sprite: 0 },
    { id: 'prep-5-copper-cloths', name: 'Copper-polishing linen bundle', type: 'clutter', ingredient: 'bakery_1', sprite: 3 },
  ] },
  { after: 'task_6', context: 'The market delivery leaves produce, packing, and a broken pot to clear.', obstacles: [
    { id: 'prep-6-market-pot', name: 'Broken market pot', type: 'clutter', ingredient: 'produce_2', atlas: 'preparation', sprite: 3 },
    { id: 'prep-6-market-sack', name: 'Market-delivery sack', type: 'clutter', ingredient: 'warm_1', sprite: 1 },
    { id: 'prep-6-aubergine', name: 'Tied market aubergine', type: 'anchored', ingredient: 'produce_1' },
  ] },
  { after: 'task_7', context: 'The shelf is secure; clear the broken crock and sort the remaining stock.', obstacles: [
    { id: 'prep-7-broken-crock', name: 'Broken shelf crock', type: 'clutter', ingredient: 'produce_1', atlas: 'preparation', sprite: 3 },
    { id: 'prep-7-shelf-crock', name: 'Covered shelf-stock crock', type: 'clutter', ingredient: 'sweet_1', sprite: 2 },
  ] },
  { after: 'task_8', context: 'The first menu is written, leaving drawing and cleaning supplies to clear.', obstacles: [
    { id: 'prep-8-menu-drafts', name: 'Rolled menu drafts', type: 'clutter', ingredient: 'bakery_1', atlas: 'preparation', sprite: 9 },
    { id: 'prep-8-chalk-cloths', name: 'Chalk-cleaning linen bundle', type: 'clutter', ingredient: 'drinks_1', sprite: 3 },
    { id: 'prep-8-drawing-sack', name: 'Drawing-supply sack', type: 'clutter', ingredient: 'sweet_1', sprite: 1 },
  ] },
  { after: 'task_9', context: 'The new bowls are arranged; unpack the remaining plates and bread supplies.', obstacles: [
    { id: 'prep-9-wrapped-plates', name: 'Wrapped table plates', type: 'clutter', ingredient: 'warm_1', atlas: 'preparation', sprite: 8 },
    { id: 'prep-9-table-dough', name: 'Tied table dough', type: 'anchored', ingredient: 'bakery_2' },
  ] },
  { after: 'task_10', context: 'The table and chairs are restored; clear their cloths and repair supplies.', obstacles: [
    { id: 'prep-10-dust-sheet', name: 'Table-cover linen bundle', type: 'clutter', ingredient: 'bakery_2', sprite: 3 },
    { id: 'prep-10-chair-offcuts', name: 'Chair-repair offcuts', type: 'clutter', ingredient: 'warm_1', atlas: 'preparation', sprite: 0 },
    { id: 'prep-10-table-supplies', name: 'Table-sanding sack', type: 'clutter', ingredient: 'produce_1', sprite: 1 },
  ] },
  { after: 'task_11', context: 'The recipe corner is ready; sort the loose pages and cabinet-cleaning cloths.', obstacles: [
    { id: 'prep-11-recipe-pages', name: 'Tied recipe pages', type: 'clutter', ingredient: 'sweet_1', atlas: 'preparation', sprite: 7 },
    { id: 'prep-11-cabinet-cloths', name: 'Cabinet-cleaning linen bundle', type: 'clutter', ingredient: 'drinks_1', sprite: 3 },
  ] },
  { after: 'task_12', context: 'The shared table is open, leaving its covers and welcome supplies to sort.', obstacles: [
    { id: 'prep-12-table-plates', name: 'Wrapped shared-table plates', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-12-table-stock', name: 'Covered table-stock crock', type: 'clutter', ingredient: 'warm_2', sprite: 2 },
    { id: 'prep-12-welcome-flowers', name: 'Tied welcome elderflowers', type: 'anchored', ingredient: 'drinks_1' },
  ] },
  { after: 'task_13', context: 'The courtyard path is clear; move the gathered leaves and cleaning cloths.', obstacles: [
    { id: 'prep-13-leaf-pile', name: 'Gathered courtyard leaves', type: 'clutter', ingredient: 'produce_1', atlas: 'preparation', sprite: 4 },
    { id: 'prep-13-yard-cloths', name: 'Courtyard-cleaning linen bundle', type: 'clutter', ingredient: 'warm_1', sprite: 3 },
  ] },
  { after: 'task_14', context: 'The herbs are planted, leaving pot packing and planting supplies to store.', obstacles: [
    { id: 'prep-14-seedling-tray', name: 'Spare herb seedling tray', type: 'clutter', ingredient: 'produce_2', atlas: 'preparation', sprite: 5 },
    { id: 'prep-14-planting-sack', name: 'Planting-supply sack', type: 'clutter', ingredient: 'warm_1', sprite: 1 },
    { id: 'prep-14-pot-cloths', name: 'Pot-cleaning linen bundle', type: 'clutter', ingredient: 'drinks_1', sprite: 3 },
  ] },
  { after: 'task_15', context: 'The door hood is repaired; clear the spare shingles and drying cloths.', obstacles: [
    { id: 'prep-15-spare-shingles', name: 'Spare door-hood shingles', type: 'clutter', ingredient: 'bakery_1', atlas: 'preparation', sprite: 6 },
    { id: 'prep-15-door-cloths', name: 'Door-drying linen bundle', type: 'clutter', ingredient: 'warm_2', sprite: 3 },
  ] },
  { after: 'task_16', context: 'The outdoor tables are set; clear the leaves and sort the lunch supplies.', obstacles: [
    { id: 'prep-16-table-leaves', name: 'Leaves from under the tables', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 4 },
    { id: 'prep-16-outdoor-stock', name: 'Covered outdoor-stock crock', type: 'clutter', ingredient: 'drinks_2', sprite: 2 },
    { id: 'prep-16-lunch-peppers', name: 'Tied lunch peppers', type: 'anchored', ingredient: 'produce_2' },
  ] },
  { after: 'task_17', context: 'The family recipes are pinned up; unpack the supplies for their first trials.', obstacles: [
    { id: 'prep-17-recipe-supplies', name: 'Recipe-trial supply sack', type: 'clutter', ingredient: 'sweet_1', sprite: 1 },
    { id: 'prep-17-recipe-pages', name: 'Tied family recipe pages', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 7 },
  ] },
  { after: 'task_18', context: 'The tasting plates are ready; sort their packing and the tasting supplies.', obstacles: [
    { id: 'prep-18-wrapped-plates', name: 'Wrapped tasting plates', type: 'clutter', ingredient: 'produce_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-18-tasting-crock', name: 'Covered tasting crock', type: 'clutter', ingredient: 'warm_2', sprite: 2 },
    { id: 'prep-18-tasting-doughnut', name: 'Tied tasting doughnut', type: 'anchored', ingredient: 'sweet_2' },
  ] },
  { after: 'task_19', context: 'The drinks cabinet is stocked; clear the broken crock and tied supplies.', obstacles: [
    { id: 'prep-19-drinks-crock', name: 'Broken drinks crock', type: 'clutter', ingredient: 'drinks_1', atlas: 'preparation', sprite: 3 },
    { id: 'prep-19-socata', name: 'Tied cabinet socată', type: 'anchored', ingredient: 'drinks_2' },
  ] },
  { after: 'task_20', context: 'The supper menus are printed; clear their packing and table-setting supplies.', obstacles: [
    { id: 'prep-20-rolled-menus', name: 'Rolled supper menus', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 9 },
    { id: 'prep-20-table-linen', name: 'Supper-table linen bundle', type: 'clutter', ingredient: 'produce_2', sprite: 3 },
    { id: 'prep-20-menu-stands', name: 'Menu-stand supply sack', type: 'clutter', ingredient: 'sweet_2', sprite: 1 },
  ] },
  { after: 'task_21', context: 'The invitations are delivered; sort the spare envelopes and gate towels.', obstacles: [
    { id: 'prep-21-gate-towels', name: 'Gate-towel linen bundle', type: 'clutter', ingredient: 'drinks_2', sprite: 3 },
    { id: 'prep-21-spare-invitations', name: 'Spare invitation envelopes', type: 'clutter', ingredient: 'produce_1', atlas: 'preparation', sprite: 10 },
  ] },
  { after: 'task_22', context: 'The serving station is ready, but its covers and food supplies still need sorting.', obstacles: [
    { id: 'prep-22-serving-plates', name: 'Wrapped serving plates', type: 'clutter', ingredient: 'bakery_2', atlas: 'preparation', sprite: 8 },
    { id: 'prep-22-serving-crock', name: 'Covered serving crock', type: 'clutter', ingredient: 'produce_2', sprite: 2 },
    { id: 'prep-22-mamaliga', name: 'Tied serving mămăligă', type: 'anchored', ingredient: 'warm_2' },
  ] },
  { after: 'task_23', context: 'The lights and flowers are in place; clear the stem trimmings and spare cloths.', obstacles: [
    { id: 'prep-23-stem-trimmings', name: 'Flower stem trimmings', type: 'clutter', ingredient: 'drinks_1', atlas: 'preparation', sprite: 11 },
    { id: 'prep-23-flower-cloths', name: 'Flower-arranging linen bundle', type: 'clutter', ingredient: 'sweet_1', sprite: 3 },
  ] },
  { after: 'task_24', context: 'The supper has begun; clear the final flower trimmings and serving supplies.', obstacles: [
    { id: 'prep-24-flower-trimmings', name: 'Final flower stem trimmings', type: 'clutter', ingredient: 'produce_2', atlas: 'preparation', sprite: 11 },
    { id: 'prep-24-supper-crock', name: 'Covered supper crock', type: 'clutter', ingredient: 'warm_2', sprite: 2 },
    { id: 'prep-24-bread-dough', name: 'Tied next-day dough', type: 'anchored', ingredient: 'bakery_2' },
  ] },
];
const data: GameData = {
  title: 'Scary Snacks', board: { columns: 6, rows: 7, initial, defaultLayout: 'workbench-clutter-1', layouts, preparations },
  chains: chains.map(([id, name]) => ({ id, name })), items, characters, chapters, finale, tasks, areas, rooms, decorationSlots, quests,
  generatorTiers: chains.flatMap(([chain]) => [{ chain, stage: 2, after: 'task_12' }, { chain, stage: 3, after: 'task_20' }]),
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
