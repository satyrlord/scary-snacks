// The game's pictures as page elements: dishes from the menu atlas, portraits, blocker art, and the small icons.
import { element, svg } from './dom.ts';
import { character, definition } from './session.ts';

// The runtime loads image variants of the PNG masters (npm run assets:build). The atlas keeps its master size, so the sprite bounds below apply to it.
const atlas = new URL('../assets/variants/menu-atlas-1536x1536.webp', import.meta.url).href;
// Measured from the atlas alpha channel: each sprite's bounds, padded only where no neighbouring sprite intrudes.
// The generated sprites overflow a regular 256px grid, so clipping to these bounds isolates them without modifying pixels.
// Where two sprites' bounds overlap, the bounds split at the middle of the overlap.
const spriteBounds = [[25,53,237,208],[267,92,247,176],[519,50,241,209],[779,76,239,181],[1029,61,237,203],[1269,37,248,225],[18,292,241,204],[261,315,254,187],[519,298,242,197],[765,294,249,204],[1015,312,269,181],[1284,298,237,199],[20,544,240,205],[277,552,221,191],[522,512,226,236],[769,553,257,201],[1035,517,262,241],[1327,508,156,251],[15,779,244,237],[290,762,222,252],[523,744,241,254],[797,775,199,224],[1045,768,181,240],[1299,768,218,242],[23,1035,237,193],[276,1038,217,187],[493,1039,283,180],[791,1007,201,226],[1008,1036,249,197],[1252,1030,269,212],[23,1234,230,256],[267,1242,263,248],[529,1243,269,243],[801,1246,205,242],[1006,1257,292,233],[1299,1281,217,203]];
// Sprites share one scale unless a side is larger than SPRITE_VIEW atlas pixels.
const SPRITE_VIEW = 246;
let spriteSequence = 0;
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
export function food(code: string, extra = '') {
  const index = definition(code).sprite;
  const wine = code === 'drinks_5';
  const rect = wine ? [0,0,256,256] : spriteBounds[index];
  const [x,y,width,height] = rect, side = Math.max(width,height,SPRITE_VIEW);
  const value = svg('svg');
  value.setAttribute('class', `food ${extra}`); value.setAttribute('viewBox',[x+width/2-side/2,y+height/2-side/2,side,side].join(' '));
  const definitions=svg('defs');
  const clip=svg('clipPath');
  const clipId=`food-clip-${++spriteSequence}`;clip.id=clipId;clip.setAttribute('clipPathUnits','userSpaceOnUse');
  const bounds=svg('rect');
  ['x','y','width','height'].forEach((key,index)=>bounds.setAttribute(key,String(rect[index])));
  clip.append(bounds);definitions.append(clip);value.append(definitions);
  const image = svg('image');
  image.setAttribute('href',wine ? new URL('../assets/variants/red-wine-256x256.webp',import.meta.url).href : atlas);
  image.setAttribute('width',wine?'256':'1536');image.setAttribute('height',wine?'256':'1536');
  image.setAttribute('clip-path',`url(#${clipId})`);
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
