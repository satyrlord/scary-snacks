// The game's pictures as page elements: dishes and sources from the food atlases, portraits, blocker art, and the small icons.
import { element, svg } from './dom.ts';
import { character, definition } from './session.ts';

// Every character has a sketch (tests/assets.test.ts). Each entry describes what the sketch shows.
const sketches: Record<string,string>={
  mara:'Mara with a tray, her free hand held out in welcome.',
  ilie:'Ilie in his cap and glasses draws a loaf from the oven on a long peel.',
  eszter:'Eszter shapes a bowl at her potter’s wheel, with finished bowls on a shelf behind her.',
  sorin:'Sorin, seen from behind, pushes a delivery bicycle with parcels up a cobbled lane.',
  adrian:'Adrian, a rolled pack on his back, holds up a lantern.',
  monica:'Monica kneels in her headscarf and cloak to trace a route on a flat stone, a lantern beside her.',
  janos:'Janos sits on a stone in his brimmed hat and reads loose pages by a candle, his staff beside him.',
  ionatan:'Ionatan stands and reads a book, a travel bag at his feet.',
  vlad:'Vlad sits at a table and raises a glass of wine beside a carafe and a candle.',
  elisabeta:'Elisabeta, in a pearl headdress and veil, reads a letter beside a glass of wine.',
  mina:'Mina holds a folded letter, a travelling case at her feet.',
  avram:'Avram stands with his walking stick and his doctor’s bag.',
  dochia:'Dochia leans on her crook among her sheep.',
  victor:'Victor rests his head on his hand at a table beside a classroom skeleton with a napkin at its neck.',
  ana:'Ana hangs a string of garlic on a door, a lantern at her feet.',
  costel:'Costel smiles at a small mechanical bird on his finger, with clockwork parts on his bench.',
  sanziana:'Sânziana, in a flower crown, holds a bunch of flowers beside her flower cart.',
  dorian:'Dorian lounges at a small table with a glass of wine.',
  ileana:'Ileana sews at her table beside a dress on a tailor’s dummy.',
  cezar:'Cezar walks the night streets in his long coat and cap, a lantern in his hand.',
  catalina:'Cătălina pulls the bell rope in the tower.',
  bran:'Bran, his scarf wrapped high, stands beside his horse and holds its rein.',
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
};
/** The quest scene takes precedence over its owner's drawing and stays through speaker changes. */
export function questSketch(person: string, questId?: string) {
  const scene=questId?questScenes[questId]:undefined;
  const image=element('img',`quest-sketch${scene?' quest-scene-sketch':''}`);
  const asset=scene?`${scene[0]}-1024x683`:`sketch-${person}-768x768`;
  image.src=new URL(`../assets/variants/${asset}.webp`,import.meta.url).href;
  image.alt=`A pencil sketch: ${scene?scene[1]:sketches[person]??character(person).name}`;
  image.width=scene?1024:768;image.height=scene?683:768;
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
  catalina: [.1,.06,.82], bran: [.1,.03,.82],
};
export function portrait(id: string) {
  const person = character(id);
  const value = element('span', `portrait portrait-${person.sprite}${person.portraitAtlas ? ` ${person.portraitAtlas}-portrait` : person.visitor ? ' visitor-portrait' : ''}`);
  const [left,top,side] = portraitFrames[person.id];
  value.style.backgroundSize = `${200/side}% ${200/side}%`;
  value.style.backgroundPosition = `${100*(person.sprite%2+left)/(2-side)}% ${100*(Math.floor(person.sprite/2)+top)/(2-side)}%`;
  value.setAttribute('role', 'img'); value.setAttribute('aria-label', person.name); return value;
}
/** The ingredient-source badge on a board tile: a plus in a disc. */
export function sourceMark() {
  const value = svg('svg'); value.setAttribute('class', 'source-mark'); value.setAttribute('viewBox', '0 0 24 24'); value.setAttribute('aria-hidden', 'true');
  const face = svg('circle'); face.setAttribute('cx', '12'); face.setAttribute('cy', '12'); face.setAttribute('r', '11');
  const plus = svg('path'); plus.setAttribute('d', 'M12 7v10M7 12h10');
  value.append(face, plus); return value;
}
/** The coin mark from the purse, for prices inside buttons. */
export function coinMark() {
  const value = svg('svg'); value.setAttribute('class', 'coin'); value.setAttribute('viewBox', '0 0 24 24'); value.setAttribute('aria-hidden', 'true');
  const face = svg('circle'); face.setAttribute('class', 'coin-face'); face.setAttribute('cx', '12'); face.setAttribute('cy', '12'); face.setAttribute('r', '9');
  const moon = svg('path'); moon.setAttribute('class', 'coin-moon'); moon.setAttribute('d', 'M15.7 7.6a5 5 0 1 0 0 8.8 4.6 4.6 0 0 1 0-8.8z');
  value.append(face, moon); return value;
}
/** A dish or a source: its cell of its food atlas. */
export function food(code: string, extra = '') {
  const { atlas, cell } = definition(code).art;
  const value = svg('svg');
  value.setAttribute('class', `food ${extra}`);
  value.setAttribute('viewBox', [cell % 4 * FOOD_CELL, Math.floor(cell / 4) * FOOD_CELL, FOOD_CELL, FOOD_CELL].join(' '));
  const image = svg('image');
  image.setAttribute('href', foodAtlas(atlas)); image.setAttribute('width', String(FOOD_CELL * 4)); image.setAttribute('height', String(FOOD_CELL * 2));
  value.append(image);
  value.setAttribute('aria-hidden', 'true'); return value;
}
// Square crops follow visible frame bounds, with a clear margin, and stay inside their source cells.
// This brings the frame towards the tile edge without shrinking the ingredient or exposing a neighbouring sprite.
const blockerFrames = [[47,44,446],[518,8,504],[1041,30,476],[33,515.5,470],[529,512,482],[1047,514,461]];
const preparationFrames = [[54.5,56,263],[422,56.5,267],[766,45.5,277],[1135,65,259],[51,396,275],[419,389.5,274],[769,391,282],[1130,399,274],[40,730.5,287],[410,728,292],[768,730,286],[1120,732.5,288]];
export function clutterArt(index: number, className: string, preparation = false) {
  const prefix = preparation ? 'preparation-art' : 'clutter-art';
  const value = element('span', `${prefix} ${prefix}-${index} ${className}`);
  const [x,y,side] = (preparation ? preparationFrames : blockerFrames)[index];
  const [width,height] = preparation ? [1448,1086] : [1536,1024];
  value.style.backgroundSize = `${100*width/side}% ${100*height/side}%`;
  value.style.backgroundPosition = `${100*x/(width-side)}% ${100*y/(height-side)}%`;
  value.setAttribute('aria-hidden', 'true');
  return value;
}
export function blockerMark() {
  const value = svg('svg'); value.classList.add('blocker-mark'); value.setAttribute('viewBox','0 0 24 24'); value.setAttribute('aria-hidden','true');
  const circle = svg('circle'); circle.setAttribute('cx','12'); circle.setAttribute('cy','12'); circle.setAttribute('r','10');
  const question = svg('path'); question.setAttribute('d','M9.2 8.5a2.8 2.8 0 0 1 5.6 0c0 2-2.8 2-2.8 4M12 16v.5');
  value.append(circle,question); return value;
}
export function crossMark() {
  const cross = svg('svg'); cross.setAttribute('viewBox','0 0 24 24'); cross.setAttribute('aria-hidden','true');
  const mark = svg('path'); mark.setAttribute('d','m6 6 12 12M18 6 6 18'); cross.append(mark); return cross;
}
/** The switch badge on a finish: two arrows that turn about each other. */
export function swapMark() {
  const value=svg('svg');value.setAttribute('class','swap-mark');value.setAttribute('viewBox','0 0 24 24');value.setAttribute('aria-hidden','true');
  const face=svg('circle');face.setAttribute('cx','12');face.setAttribute('cy','12');face.setAttribute('r','11');
  const arrows=svg('path');arrows.setAttribute('d','M7.5 10a5 5 0 0 1 8.6-2.2M16.5 5.5v2.8h-2.8M16.5 14a5 5 0 0 1-8.6 2.2M7.5 18.5v-2.8h2.8');
  value.append(face,arrows);return value;
}
/** A plate under a dashed dome cover: the "not yet" mark for a dish nobody has made. */
export function coveredDish() {
  const value=svg('svg');value.setAttribute('class','covered-dish');value.setAttribute('viewBox','0 0 48 48');value.setAttribute('aria-hidden','true');
  const dome=svg('path');dome.setAttribute('class','covered-dish-dome');dome.setAttribute('d','M9 33a15 15 0 0 1 30 0');
  const knob=svg('path');knob.setAttribute('d','M24 18v-2.5M21.5 15.5h5');
  const plate=svg('path');plate.setAttribute('d','M6 33h36M10 36.5h28');
  value.append(dome,knob,plate);return value;
}
