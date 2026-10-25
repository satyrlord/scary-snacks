// The game's pictures as page elements: dishes and sources from the food atlases, portraits, blocker art, and the small icons.
import { findQuest, questEvent } from './model.ts';
import { element, svg } from './dom.ts';
import { character, data, definition } from './session.ts';

// Every character has a sketch (tests/assets.test.ts), except Mara's parents, who show in old family photographs. Each entry describes what the sketch shows.
const sketches: Record<string,string>={
  mara:'Mara with a tray, her free hand held out in welcome.',
  ilie:'Ilie in his cap and glasses slides a loaf into a brick oven on a long peel.',
  eszter:'Eszter shapes a bowl at her potter’s wheel, with finished bowls on a shelf behind her.',
  sorin:'Sorin walks beside his delivery bicycle, a parcel in its basket.',
  adrian:'Adrian, a rolled pack on his back, holds up a lantern.',
  monica:'Monica kneels in her headscarf and cloak to trace a route on a flat stone, a lantern beside her.',
  janos:'Janos sits on a stone in his brimmed hat and reads loose pages by a candle, his staff beside him.',
  ionatan:'Ionatan stands and reads an open folio, a travel bag at his feet.',
  vlad:'Vlad sits at a table and raises a glass of wine beside a carafe and a candle.',
  elisabeta:'Elisabeta, in a pearl headdress and veil, reads her papers beside a glass of wine.',
  mina:'Mina holds a folded letter, a travelling case at her feet.',
  avram:'Avram stands with his walking stick and his doctor’s bag.',
  dochia:'Dochia leans on her crook among her sheep.',
  victor:'Victor rests his head on his hand at a table beside a classroom skeleton with a napkin at its neck.',
  ana:'Ana hangs a string of garlic on a door, a lantern at her feet.',
  costel:'Costel smiles at a small bird on his finger, a clock on his workbench.',
  bela:'Bela leans on his spade at the churchyard gate and waves good night to an old headstone.',
  sanziana:'Sânziana, in a flower crown, holds a bunch of flowers beside her flower cart.',
  dorian:'Dorian lounges at a small table with a glass of wine.',
  ileana:'Ileana sews at her table beside a dress on a tailor’s dummy.',
  cezar:'Cezar walks the night streets in his long coat and cap, a lantern in his hand.',
  catalina:'Cătălina pulls the bell rope in the tower.',
  bran:'Bran, his scarf wrapped high, stands beside his horse and holds its rein.',
  ambrozie:'Ambrozie, a tall monk in a black cassock, holds a jar of pickled gherkins, a prayer rope on his wrist.',
  gavril:'Gavril, the mayor, writes a sum in his small ledger, his reading glasses pushed up on his forehead.',
  tarka:'Tarka plays a long shepherd’s pipe in his patched coat and feathered hat, and three small rats sit at his feet and listen.',
};
const questScenes: Record<string,readonly [string,string]>={
  'adrian-first-pack':['scene-cathedral-1','Adrian, Monica, and Janos stand above a staircase descending behind the cathedral altar.'],
  'monica-first-pack':['scene-cathedral-2','A large cook waves a cleaver as Adrian runs upstairs toward Monica and Janos.'],
  'janos-first-pack':['scene-cathedral-3','Janos reads beside a crowned skeleton king dozing on a throne.'],
  'adrian-second-pack':['scene-cathedral-4','A small goblin offers a rock to Adrian, who holds a basket of bread.'],
  'monica-second-pack':['scene-cathedral-5','Monica studies a stone map beside the underground stream and well shaft.'],
  'janos-second-pack':['scene-cathedral-6','Janos turns a page beside the distressed librarian and a plate of chimney cake.'],
  'adrian-third-pack':['scene-cathedral-7','An archbishop preaches to empty benches while Adrian watches from the doorway.'],
  'monica-third-pack':['scene-cathedral-8','The travellers slip away as the archbishop preaches to a closed iron-banded door.'],
  'janos-third-pack':['scene-cathedral-9','Janos carries loose pages past the sleeping archbishop and the closed door.'],
  'ionatan-castle-dinner':['scene-ionatan-dinner','Ionatan dines beside his papers, with a distant castle visible through the window.'],
  'mina-avram-search':['scene-mina-avram-meal','Mina and Avram share a meal as Mara points toward the road and distant castle.'],
  'mara-easter-baskets':['scene-easter-baskets','Eszter packs red eggs into a basket, Mara lowers a pască onto an embroidered towel, and Sorin waits by the door with a covered basket and a church candle.'],
  'bela-snowman':['scene-bela-snowman','Bela drinks tea on a bench in the snowy churchyard while the snowman turns toward the old miller’s grave.'],
  'costel-icicle-clock':['scene-icicle-clock','Costel eats a papanaș at his table while an icicle on the bracket of his clock drips beside the warm stove.'],
  'mara-chimney-sweep':['scene-chimney-sweep','The chimney sweep holds up a burnt page, Mara points at him and laughs, and Sorin brings food on a tray.'],
  'mara-blajini':['scene-blajini','Mara floats red eggshells down the river while Bela holds the churchyard gate open with his lantern.'],
  'mara-three-months':['scene-three-months','Mara holds a candle beside the memorial table with colivă and colaci, the priest reads the names and glances at the basket of colaci in Ilie’s hands, and villagers wait at the churchyard gate.'],
  'ambrozie-scroll-1':['scene-sleeper-1','Adrian counts the sausages on a shelf, Janos holds up a candle, and Monica kneels with one ear to the red door.'],
  'ambrozie-scroll-2':['scene-sleeper-2','Monica tucks a blanket around a soup pot while Janos stands at the red door with his eyes closed and one finger raised.'],
  'ambrozie-scroll-3':['scene-sleeper-3','Janos and Adrian set a roast chicken and a dish of fish on a long table in the dusty kitchen hall, and a mouse runs from the plum brandy.'],
  'ambrozie-scroll-4':['scene-sleeper-4','Adrian sets the last roast on the table by the lit hearth, and Monica holds out her lantern as the dust at the red door blows toward the gap below it.'],
  'ambrozie-scroll-5':['scene-sleeper-5','Janos and Monica carry big platters down the stairs into the kitchen hall, where a fire burns under the cauldrons.'],
  'sanziana-holy-cross':['scene-holy-cross','Sânziana holds up a bunch of basil while her two sisters pick herbs into a basket, and a grass snake nods goodbye from its hole.'],
  'mara-name-day':['scene-name-day','Mara and Ilie smile at Mamaia’s empty chair, with a colac on its seat and a glass of red wine beside it.'],
  'dochia-samedru':['scene-samedru','Dochia tells a story to three shepherds who eat at a table by the sheepfold, while the sheepdog eats from its bowl and the sheep watch over the fence.'],
};
// Mara has a second sketch, at the stove, for the quests where she cooks.
const questDrawings: Record<string,readonly [string,string]>={
  'mara-cellar':['mara-stove','Mara stirs a pot at the stove and smiles over her shoulder.'],
  'mara-easter-lunch':['mara-stove','Mara stirs a pot at the stove and smiles over her shoulder.'],
};
// Victor never meets Mara's parents, so they show in old studio photographs from the family album.
const photographs: Record<string,string>={
  mama:'An old studio photograph in sepia: Mama as a young woman in Transylvanian folk dress, before a painted backdrop.',
  tata:'An old studio photograph in sepia: Tata as a young man in Transylvanian folk dress, before a painted backdrop.',
};
/** A scene illustration in the quest scene format: a pencil sketch of an event, or a painted page of the notebook with its own words. */
export function sceneIllustration(scene: { image: string; text: string }, painted = false) {
  const image=element('img','quest-sketch quest-scene-sketch');
  image.src=new URL(`../assets/variants/${scene.image}-1024x683.webp`,import.meta.url).href;
  image.alt=painted?scene.text:`A pencil sketch: ${scene.text}`;image.width=1024;image.height=683;
  image.addEventListener('error',()=>image.remove(),{once:true});
  return image;
}
/**
 * The quest scene takes precedence over its owner's drawing and stays through speaker changes. Mara's quests in the prologue show the
 * illustration of their event, and Mama and Tata show their family photographs.
 */
export function questSketch(person: string, questId?: string) {
  const quest=questId?findQuest(questId,data):undefined,event=quest?data.prologue.events[questEvent(quest,data)-1]:undefined;
  if(event&&!character(person).family)return sceneIllustration(event.scene);
  const scene=questId?questScenes[questId]:undefined,drawing=questId?questDrawings[questId]:undefined;
  const photo=photographs[person],image=element('img',`quest-sketch${scene?' quest-scene-sketch':''}${photo?' family-photo':''}`);
  const asset=scene?`${scene[0]}-1024x683`:photo?`photo-${person}-672x672`:`sketch-${drawing?.[0]??person}-672x672`;
  image.src=new URL(`../assets/variants/${asset}.webp`,import.meta.url).href;
  image.alt=photo??`A pencil sketch: ${scene?scene[1]:drawing?.[1]??sketches[person]??character(person).name}`;
  image.width=scene?1024:672;image.height=scene?683:672;
  image.addEventListener('error',()=>image.remove(),{once:true});
  return image;
}

// The runtime loads image variants of the PNG masters (npm run assets:build). Each food atlas is a grid of four columns and two rows;
// its variant has 256px cells. Every picture stays inside its cell, so a dish shows its whole cell.
const FOOD_CELL = 256;
const foodAtlas = (atlas: string) => new URL(`../assets/variants/food-${atlas}-1024x512.webp`, import.meta.url).href;
// Square crops within each portrait cell: left, top, and side as fractions of the cell.
// Face scale and eye lines guide these crops; headwear and upper-body identity remain visible.
const portraitFrames: Record<string, readonly [number, number, number]> = {
  mara: [.08,0,.84], ilie: [.07,0,.86], eszter: [.09,0,.82], sorin: [.1,0,.8],
  adrian: [.11,.1,.78], monica: [.1,.14,.78], janos: [.11,.08,.8], ionatan: [.08,.045,.84],
  vlad: [.06,0,.88], elisabeta: [.06,0,.88], mina: [.11,.07,.8], avram: [.1,.09,.8],
  dochia: [.08,.015,.84], victor: [.08,0,.84], ana: [.08,0,.84], costel: [.07,0,.86],
  sanziana: [.07,.015,.86], dorian: [.08,0,.84], ileana: [.09,.015,.82], cezar: [.07,.01,.86],
  catalina: [.1,.06,.82], bran: [.1,.03,.82], bela: [.1,.06,.82], mama: [.12,.2,.8], tata: [.07,.2,.8],
  gavril: [.08,0,.84], ambrozie: [.08,0,.84], tarka: [.09,0,.82],
};
export function portrait(id: string) {
  const person = character(id);
  const value = element('span', `portrait portrait-${person.sprite}${person.portraitAtlas ? ` ${person.portraitAtlas}-portrait` : person.visitor ? ' visitor-portrait' : ''}`);
  const [left,top,side] = portraitFrames[person.id];
  value.style.backgroundSize = `${200/side}% ${200/side}%`;
  value.style.backgroundPosition = `${100*(person.sprite%2+left)/(2-side)}% ${100*(Math.floor(person.sprite/2)+top)/(2-side)}%`;
  value.setAttribute('role', 'img'); value.setAttribute('aria-label', person.name); return value;
}
/** A picture that screen readers skip: an svg with its class and view box, and its shapes, each a tag with its attributes. */
export function icon(className: string, viewBox: string, ...shapes: [keyof SVGElementTagNameMap, Record<string, string>][]) {
  const value = svg('svg');
  if (className) value.setAttribute('class', className);
  value.setAttribute('viewBox', viewBox); value.setAttribute('aria-hidden', 'true');
  for (const [tag, attributes] of shapes) {
    const shape = svg(tag);
    for (const [name, text] of Object.entries(attributes)) shape.setAttribute(name, text);
    value.append(shape);
  }
  return value;
}
/** The coin mark from the purse, for prices inside buttons. */
export const coinMark = () => icon('coin', '0 0 24 24', ['circle', { class: 'coin-face', cx: '12', cy: '12', r: '9' }],
  ['path', { class: 'coin-moon', d: 'M15.7 7.6a5 5 0 1 0 0 8.8 4.6 4.6 0 0 1 0-8.8z' }]);
/** A dish uses its food atlas cell. A source shows the ingredient that it gives. */
export function food(code: string, extra = '') {
  const item = definition(code);
  const { atlas, cell } = (item.generator ? definition(item.generator.outputs[0]) : item).art;
  return icon(`food ${extra}`, [cell % 4 * FOOD_CELL, Math.floor(cell / 4) * FOOD_CELL, FOOD_CELL, FOOD_CELL].join(' '),
    ['image', { href: foodAtlas(atlas), width: String(FOOD_CELL * 4), height: String(FOOD_CELL * 2) }]);
}
// Square crops follow visible frame bounds, with a clear margin, and stay inside their source cells.
// This brings the frame towards the tile edge without shrinking the ingredient or exposing a neighbouring sprite.
const blockerFrames = [[47,44,446],[518,8,504],[1041,30,476],[33,515.5,470],[529,512,482],[1047,514,461]];
const preparationFrames = [[54.5,56,263],[422,56.5,267],[766,45.5,277],[1135,65,259],[51,396,275],[419,389.5,274],[769,391,282],[1130,399,274],[40,730.5,287],[410,728,292],[768,730,286],[1120,732.5,288]];
const hailFrames = [[30,27,456],[547,42,429]];
/** The art of a blocker: the board clutter, a preparation blocker, or a hail blocker, in its square crop of its atlas variant. */
export function clutterArt(index: number, className: string, atlas?: 'preparation' | 'hail') {
  const prefix = atlas ? `${atlas}-art` : 'clutter-art';
  const value = element('span', `${prefix} ${prefix}-${index} ${className}`);
  const [x,y,side] = (atlas === 'preparation' ? preparationFrames : atlas === 'hail' ? hailFrames : blockerFrames)[index];
  const [width,height] = atlas === 'preparation' ? [1448,1086] : atlas === 'hail' ? [1024,512] : [1536,1024];
  value.style.backgroundSize = `${100*width/side}% ${100*height/side}%`;
  value.style.backgroundPosition = `${100*x/(width-side)}% ${100*y/(height-side)}%`;
  value.setAttribute('aria-hidden', 'true');
  return value;
}
export const blockerMark = () => icon('blocker-mark', '0 0 24 24', ['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'M9.2 8.5a2.8 2.8 0 0 1 5.6 0c0 2-2.8 2-2.8 4M12 16v.5' }]);
export const crossMark = () => icon('', '0 0 24 24', ['path', { d: 'm6 6 12 12M18 6 6 18' }]);
/** The switch badge on a finish: two arrows that turn about each other. */
export const swapMark = () => icon('swap-mark', '0 0 24 24', ['circle', { cx: '12', cy: '12', r: '11' }],
  ['path', { d: 'M7.5 10a5 5 0 0 1 8.6-2.2M16.5 5.5v2.8h-2.8M16.5 14a5 5 0 0 1-8.6 2.2M7.5 18.5v-2.8h2.8' }]);
/** A hanging lantern: the control that brings tonight's booked guest. */
export const lanternMark = () => icon('lantern-mark', '0 0 24 24', ['path', { d: 'M12 2.5v2M9.5 4.5h5' }],
  ['path', { d: 'M8.5 7h7l1 3v6.5l-1 2h-7l-1-2V10z' }], ['path', { d: 'M12 10.5c1.3 1.4 1.3 3 0 4-1.3-1-1.3-2.6 0-4z' }]);
/** A crescent moon: a booked table for another evening. */
export const moonMark = () => icon('moon-mark', '0 0 24 24', ['path', { d: 'M15.5 4.5a8 8 0 1 0 4 12.8A7 7 0 0 1 15.5 4.5z' }]);
/** One pose of a rat of the night, from its sheet of eight poses: four columns and two rows. */
export function ratSprite(rat: 'thief' | 'soricescu', className: string) {
  const value=element('span',`rat-sprite rat-${rat} ${className}`);value.setAttribute('aria-hidden','true');return value;
}
/** Shows a pose of a rat sprite: 0 and 1 come out of the board, 2 to 5 act, and 6 and 7 scurry. */
export function ratPose(sprite: HTMLElement, pose: number) {
  sprite.style.backgroundPosition=`${pose%4*100/3}% ${Math.floor(pose/4)*100}%`;
}
/** A plate under a dashed dome cover: the "not yet" mark for a dish nobody has made. */
export const coveredDish = () => icon('covered-dish', '0 0 48 48', ['path', { class: 'covered-dish-dome', d: 'M9 33a15 15 0 0 1 30 0' }],
  ['path', { d: 'M24 18v-2.5M21.5 15.5h5' }], ['path', { d: 'M6 33h36M10 36.5h28' }]);
