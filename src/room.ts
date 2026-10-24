// The room: the painting of an area as the completed preparations leave it, the reveal of a paid change, the area switch,
// the decoration finishes, the kitchen drawer over the room, and the cats.
import { actOf, chapterNumber, currentEvent, decorationUnlocked, finaleServed, holidayDecorations, latestArea, resolveDecorations, resolveRooms, roomPaintings, scenePaintings, taskAct, weather, windowView } from './model.ts';
import type { DecorationSlot, DecorationVariant, RoomState, RoomView, Task } from './model.ts';
import { $, button, element, status, svg } from './dom.ts';
import { swapMark } from './art.ts';
import { apply, changeGame, data, onReplace, state } from './session.ts';
import { AREA_KEY, drawerLayout, movableDrawer, playTone, still, storage } from './preferences.ts';

// The reveal timeline: the drawer lowers, the new state comes into focus, the pin lands, and the drawer rises again.
const LOWER_MS = 650, FOCUS_MS = 1200, SETTLE_MS = 1400;
// A room painting is shown as wide as the room: the phone's full width, or the room half of a wider screen.
const ROOM_SIZES = '(max-width: 1023px) 100vw, max(50vw, 75vh)';
// The area the room shows, a paid preparation whose change waits for the end of its story with the scene that follows the reveal,
// and the next painting while it downloads.
let viewArea = '', held: { task: Task; scene: string | null } | null = null, revealToken = 0, paintingToken = 0, preloaded: HTMLPictureElement | null = null, swipe = 0;
export let lowered = false;
/**
 * The scrolling layout of a phone can leave the room or the board outside the screen. Where a movable drawer lowers or rises, the page
 * scrolls that part into view. The promise settles when the scroll ends.
 */
export function showInPage(part: Element) {
  if(!drawerLayout.matches||movableDrawer.matches)return Promise.resolve();
  const box=part.getBoundingClientRect(),top=Math.min(Math.max(0,scrollY+box.top-Math.max(0,(innerHeight-box.height)/2)),document.documentElement.scrollHeight-innerHeight);
  if(box.top>=0&&box.bottom<=innerHeight||Math.abs(top-scrollY)<1)return Promise.resolve();
  return new Promise<void>(resolve=>{
    const done=()=>{clearTimeout(timer);removeEventListener('scrollend',done);resolve();},timer=setTimeout(done,1000);
    addEventListener('scrollend',done);scrollTo({top,behavior:still()?'instant':'smooth'});
  });
}
let catAsleep = false;
// The room opens on the player's chosen area while it is open, and otherwise on the area of the latest change.
try{viewArea=storage?.getItem(AREA_KEY)??'';}catch{/* Follow the latest change. */}
/** The act whose areas the room shows: the act of the current day. */
const roomAct = () => actOf(state.clock.day, data);
/**
 * After the finale of the room's act, its area shows the finale painting with no finishes, because the guests sit where the finishes
 * would go. A painting that does not ship leaves the area as it is.
 */
function finaleState(): RoomState | null {
  const finale = data.finales.find(value => actOf(value.day, data) === roomAct());
  if (!finale || !finaleServed(state, finale, data) || !scenePaintings.includes(finale.painting.image)) return null;
  const { image, area, title, text, focus } = finale.painting;
  return { id: image, area, after: null, focus, mark: focus, label: title.replace(/^The /, 'the '), text };
}
/** The area of the latest change: the area of the finale painting once the finale is served. */
const latestView = () => finaleState()?.area ?? latestArea(roomCompleted(), data, roomAct());
onReplace(() => {
  held = null; revealToken++; preloaded = null; viewArea = latestView();
  $('.game-layout').classList.remove('revealing'); $('#room-stage').removeAttribute('data-reveal'); setLowered(false);
});

/** A paid preparation keeps its change out of the room until its story ends. The scene follows the reveal of the change. */
export function holdChange(task: Task | null, scene: string | null = null) { held = task && { task, scene }; }
/** Takes the change that waits for the end of its story, if any. */
export function takeHeldChange() { const change = held; held = null; return change; }
/** The completed preparations the room shows: a paid preparation waits for the end of its story before its change appears. */
const roomCompleted = () => held ? state.decorations.filter(id => id !== held!.task.id) : state.decorations;
/** A 3:4 painting from its variants, AVIF first: a room state, or the supper. Built before it is shown, it starts to download at once. */
export function roomPicture(id: string, sizes = ROOM_SIZES) {
  const picture=element('picture','room-painting'),url=(width: number,type: string)=>new URL(`../assets/variants/${id}-${width}x${width*4/3}.${type}`,import.meta.url).href;
  picture.dataset.painting=id;
  for(const type of ['avif','webp']){const source=element('source');source.type=`image/${type}`;source.srcset=[768,1536].map(width=>`${url(width,type)} ${width}w`).join(', ');source.sizes=sizes;picture.append(source);}
  // The image joins its picture before it gets a source, so the browser chooses among the variants.
  const image=element('img');picture.append(image);image.alt='';image.draggable=false;image.width=1536;image.height=2048;image.src=url(1536,'webp');
  return picture;
}
/** While a paid preparation's story plays, its painting downloads, so the reveal does not wait for it. */
export function preloadRoom(task: Task) {
  const area=data.rooms.find(room=>room.after===task.id)!.area;
  const painting=resolveRooms(state.decorations,data,roomPaintings,taskAct(task,data)).find(view=>view.id===area)!.painting!;
  if(painting.id!==$('#room-frame').dataset.painting)preloaded=roomPicture(painting.id);
}
/** Shows a painting in the frame. With a fade, the new painting comes into focus over the old one once it has decoded. */
async function showPainting(id: string, fade: number) {
  const token=++paintingToken,holder=$('#room-paintings'),shown=holder.querySelector<HTMLElement>('.room-painting:not(.leaving)');
  if(shown?.dataset.painting===id)return;
  const next=preloaded?.dataset.painting===id?preloaded:roomPicture(id);preloaded=null;
  $('#room-stage').removeAttribute('data-failed');
  const animate=Boolean(shown&&fade&&!still());
  if(animate){for(const old of holder.children)old.classList.add('leaving');next.classList.add('entering');holder.append(next);}
  else holder.replaceChildren(next);
  const decoded=await next.querySelector('img')!.decode().then(()=>true,()=>false);
  // Only the latest painting can replace the room. This also detects a preload that failed before its story ended.
  if(token!==paintingToken||!next.isConnected)return;
  if(!decoded){holder.replaceChildren();$('#room-stage').dataset.failed='';return;}
  next.classList.remove('entering');
  // The states share every pixel outside their change, so the old painting stays under the new one until the fade ends.
  if(animate&&!still())await next.animate([{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}],{duration:fade,easing:'cubic-bezier(.16,1,.3,1)'}).finished.catch(()=>{});
  if(token!==paintingToken)return;
  for(const old of holder.querySelectorAll('.leaving'))old.remove();
}
/** The family kitchen of the prologue, in the painted state of the current event. It is the only area of the prologue. */
function kitchenView(): RoomView | null {
  const event=currentEvent(state,data);if(!event)return null;
  const room=data.prologue.rooms.find(value=>value.id===event.room)!;
  return {id:room.area,name:'The family kitchen',unlock:null,act:0,open:true,states:[room],current:room,painting:room};
}
/** The area the room shows: the family kitchen in the prologue, and else the player's open choice, or the area of the latest change. */
function currentView() {
  const kitchen=kitchenView();if(kitchen)return {views:[kitchen],view:kitchen};
  const finale=finaleState(),views=resolveRooms(roomCompleted(),data,roomPaintings,roomAct()).map(view=>finale&&view.id===finale.area?{...view,states:[...view.states,finale],current:finale,painting:finale}:view);
  return {views,view:views.find(view=>view.id===viewArea&&view.open)??views.find(view=>view.id===latestView())!};
}
/** Serving a finale turns the room to its painting. */
export function showFinaleRoom() { const area=finaleState()?.area;if(area){viewArea=area;try{storage?.setItem(AREA_KEY,viewArea);}catch{/* The room still shows the finale. */}}renderRoom(); }
/** The kitchen changes its state with the event, so the new state comes into focus over the old one. */
export function renderRoom() {
  const {views,view}=currentView(),frame=$('#room-frame'),change=frame.dataset.area===view.id&&view.id==='family-kitchen'&&frame.dataset.painting!==view.painting!.id;
  // The area switch does not show in the prologue.
  $('#area-switch').hidden=views.length===1&&view.id==='family-kitchen';
  if(view.id!=='family-kitchen')viewArea=view.id;
  renderAreaSwitch(views,view);void drawRoom(view,change?FOCUS_MS:0);
}
/**
 * Draws one area as it stands: its painting framed on the latest change, the New pin on that change, the cats in the front room,
 * and a caption that says in words what is there. A render that changes nothing leaves the room alone.
 */
function drawRoom(view: RoomView, fade = 0) {
  const frame=$('#room-frame'),current=view.current!,painting=view.painting!,pin=$('#room-pin');
  Object.assign(frame.dataset,{area:view.id,current:current.id});
  // The frame centres the change a little low, so the pin above it has room inside the visible room.
  frame.style.setProperty('--fx',String(painting.focus.x/100));frame.style.setProperty('--fy',String(Math.max(0,painting.focus.y-4)/100));
  // The area switch keeps to the side of the room away from the change, and away from Miez: on the right of the front room, and on
  // the left of the summer kitchen and the vegetable garden.
  $('#area-switch').dataset.side=view.id==='front-room'?'left':['summer-kitchen','vegetable-garden'].includes(view.id)||painting.focus.x<50?'right':'left';
  // The pin marks a painted change, so a state that waits for its painting is told only in words.
  const marked=current.after!==null&&painting===current;
  if(!marked)frame.style.removeProperty('--pin-pan');
  // The pin's tail touches the edge of the change, so the pin names the change without covering it.
  if(marked&&pin.dataset.state!==current.id){
    pin.dataset.state=current.id;pin.style.left=`${current.mark.x}%`;pin.style.top=`${current.mark.y}%`;pin.toggleAttribute('data-below',Boolean(current.mark.below));
    const dot=element('span','pin-dot');dot.setAttribute('aria-hidden','true');
    const words=element('span','','New');words.append(element('span','pin-label',`: ${current.label}`));
    pin.replaceChildren(dot,words);pin.setAttribute('aria-label',`New: ${current.text}`);
  }
  const area=painting.id===finaleState()?.id?'':view.id,decorations=resolveDecorations(roomCompleted(),state.decorationChoices,data).filter(slot=>slot.unlocked&&slot.area===area);
  drawDecorations($('#room-decorations'),area,roomCompleted(),state.decorationChoices);renderFinishes(area);
  // The day gives the weather, the view behind the window, and the holiday decorations. The broken window shows no view and no decoration.
  const day=state.clock.day,holidays=painting.id==='front-room-00'?[]:holidayDecorations(day,area,data);
  // Miez comes to the city after the funeral, so the family kitchen shows him from the second event.
  $('#cat-button').hidden=state.prologue?.event===1;
  frame.dataset.weather=weather(day,data);$('.window-view').dataset.view=windowView(day,data).id;
  drawHolidays(holidays);
  const caption=$('#room-caption'),key=`${view.id}:${view.states.map(room=>room.id).join()}:${decorations.map(slot=>slot.selected.id).join()}:${holidays.map(decoration=>decoration.id).join()}`;
  if(caption.dataset.key!==key){
    caption.dataset.key=key;const list=element('ol','room-changes');
    for(const room of view.states)list.append(element('li','',room.text));
    const finishes=element('p','',[...decorations.map(slot=>`${slot.name}: ${slot.selected.name}.`),...holidays.map(decoration=>`${decoration.name}.`)].join(' '));
    caption.replaceChildren(element('p','room-missing','The painting of this room could not load, so here it is in words.'),element('p','room-name',view.name),list,finishes);
  }
  if(frame.dataset.painting===painting.id&&!fade){pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');fitPin();return Promise.resolve();}
  frame.dataset.painting=painting.id;
  if(fade)pin.hidden=true;else pin.hidden=!marked;
  return showPainting(painting.id,fade).then(()=>{if(frame.dataset.current!==current.id)return;pin.hidden=!marked||$('#room-stage').hasAttribute('data-failed');syncRoomControls();});
}
/** The area switch in the room's corner: open areas by name, and a locked one with the dashed "not yet" edge and the preparation that opens it. */
function renderAreaSwitch(views: RoomView[], view: RoomView) {
  const group=$('#area-switch');
  if(group.childElementCount!==views.length*2) group.replaceChildren(...views.flatMap(area=>{
    const short=area.name.replace(/^The /,''),choice=button(short[0].toUpperCase()+short.slice(1),'area-choice',()=>chooseArea(area.id)),note=element('span','visually-hidden');
    choice.dataset.area=area.id;note.id=`area-note-${area.id}`;return [choice,note];
  }));
  for(const area of views){
    const choice=group.querySelector<HTMLElement>(`[data-area="${area.id}"]`)!,note=$(`#area-note-${area.id}`);
    choice.setAttribute('aria-pressed',String(area===view));
    if(area.open)choice.removeAttribute('aria-disabled');else choice.setAttribute('aria-disabled','true');
    const task=data.tasks.find(value=>value.id===area.unlock);
    note.textContent=area.open||!task?'':`${area.name} opens with “${task.title}” in chapter ${chapterNumber(data.chapters[task.chapter-1],data)}.`;
    if(area.open)choice.removeAttribute('aria-describedby');else choice.setAttribute('aria-describedby',note.id);
  }
}
function chooseArea(id: string) {
  const {views}=currentView(),area=views.find(value=>value.id===id)!;
  if(!area.open)return status($(`#area-note-${id}`).textContent!);
  if(id===viewArea)return;
  viewArea=id;try{storage?.setItem(AREA_KEY,id);}catch{/* The choice holds for this visit. */}
  renderAreaSwitch(views,area);void drawRoom(area,400);
  status(`${area.name}: ${area.current!.text}`);
}
/**
 * After the story of a paid preparation: the drawer lowers by itself, the new state comes into focus in place over the old one,
 * the New pin lands on the change, and the drawer rises again. The game was saved before the story opened, so nothing here can be paid
 * or earned again. True when the reveal ran to its end, so that the scene that the payment earned can follow.
 */
export async function reveal(task: Task) {
  const token=++revealToken,changed=data.rooms.find(room=>room.after===task.id)!,layout=$('.game-layout'),stage=$('#room-stage');
  viewArea=changed.area;try{storage?.setItem(AREA_KEY,viewArea);}catch{/* The room still follows the change. */}
  const {views,view}=currentView(),pause=(ms: number)=>new Promise(resolve=>setTimeout(resolve,ms));
  const land=()=>{if(!$('#room-pin').hidden&&!still())$('#room-pin').animate([{opacity:0,transform:'translateY(-14px) scale(.6)'},{opacity:1,transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});};
  stage.dataset.reveal='waiting';$('#room-pin').hidden=true;
  // The player pays in the kitchen, so a scrolling page brings the room back into view. The repaint does not wait for the scroll.
  void showInPage(stage);
  if(!still()){
    layout.classList.add('revealing');if(movableDrawer.matches){$('#drawer-body').inert=true;await pause(LOWER_MS);}
    if(token!==revealToken)return false;
  }
  renderAreaSwitch(views,view);
  stage.dataset.reveal='run';await drawRoom(view,still()?0:FOCUS_MS);
  if(token!==revealToken)return false;
  land();status(changed.text);
  // The pin is described by the change, so focus lands where the change is.
  if($('#room-pin').checkVisibility({visibilityProperty:true}))$('#room-pin').focus({preventScroll:true});
  if(!still())await pause(SETTLE_MS);
  if(token!==revealToken)return false;
  layout.classList.remove('revealing');$('#drawer-body').inert=lowered;stage.dataset.reveal='done';
  // A failed painting or a thin room strip has no visible pin. Return focus after the board can take input again.
  if(!$('#room-pin').checkVisibility({visibilityProperty:true}))(lowered?$('#drawer-handle'):$('#board').querySelector<HTMLElement>('[tabindex="0"]'))?.focus({preventScroll:true});
  batFlight();
  return true;
}
/** Where the kitchen is a drawer, its handle lowers it to show the whole room and raises it again. */
export function setLowered(value: boolean) {
  lowered=value&&movableDrawer.matches;const handle=$('#drawer-handle'),layout=$('.game-layout');
  layout.classList.toggle('lowered',lowered);$('#drawer-body').inert=lowered||layout.classList.contains('revealing');
  handle.setAttribute('aria-expanded',String(!lowered));handle.setAttribute('aria-label',lowered?'Raise the kitchen':'Lower the kitchen to see the room');
  syncRoomControls();
}
/** Room controls take input only while their detail is inside the visible painting, above the drawer. */
export function syncRoomControls() {
  // A marked change asks the phone board for room above the drawer: the pin's target and the centre of the change. The board gives it
  // while its cells keep 44px.
  const frame=$('#room-frame'),current=data.rooms.find(room=>room.id===frame.dataset.current);
  const reserve=current?.after&&frame.dataset.painting===current.id?Math.max(132,Math.abs(current.focus.y-current.mark.y)*frame.getBoundingClientRect().height/100+36):80;
  $('.game-layout').style.setProperty('--room-space',`${reserve}px`);
  const stage=$('#room-stage').getBoundingClientRect(),failed=$('#room-stage').hasAttribute('data-failed');
  const bottom=drawerLayout.matches?Math.min(stage.bottom,$('#drawer').getBoundingClientRect().top):stage.bottom;
  // A thin strip of room above a raised drawer has no space for the area switch. It returns when the drawer lowers.
  $('.game-layout').toggleAttribute('data-thin-room',drawerLayout.matches&&bottom-stage.top<56);
  fitPin();
  for(const control of document.querySelectorAll<HTMLElement>('#cat-button,.room-finish')){
    const box=control.getBoundingClientRect();
    const visibleWidth=Math.min(box.right,stage.right)-Math.max(box.left,stage.left);
    const visibleHeight=Math.min(box.bottom,bottom)-Math.max(box.top,stage.top);
    control.inert=failed||!box.width||(control.classList.contains('room-finish')
      ? visibleWidth<44||visibleHeight<44
      : box.top<stage.top||box.bottom>bottom+1||box.left<stage.left||box.right>stage.right+1);
  }
}
/**
 * Keeps the pin inside the visible room. It can use either side of its mark, shorten its label, or move the frame enough to show
 * a mark near the edge. The tail stays on the authored mark when the pin slides sideways.
 */
export function fitPin() {
  const pin=$('#room-pin');if(pin.hidden)return;
  const frame=$('#room-frame'),current=data.rooms.find(room=>room.id===frame.dataset.current);
  const stage=$('#room-stage').getBoundingClientRect(),area=$('#area-switch').getBoundingClientRect(),handle=$('#drawer-handle').getBoundingClientRect(),below=Boolean(current?.mark.below);
  // The handle reaches above the drawer. Its transparent target must also stay clear of the pin.
  const obstacles=[area,...(handle.width&&handle.height?[handle]:[])];
  const bottom=drawerLayout.matches?Math.min(stage.bottom,$('#drawer').getBoundingClientRect().top):stage.bottom;
  frame.style.setProperty('--pin-pan','0px');
  const focus=()=>{const box=frame.getBoundingClientRect();return {x:box.left+box.width*(current?.focus.x??50)/100,y:box.top+box.height*(current?.focus.y??50)/100};};
  const clearFocus=(point: {x:number;y:number})=>point.y>stage.top+20&&point.y<bottom-20&&!obstacles.some(box=>point.x>=box.left&&point.x<=box.right&&point.y>=box.top&&point.y<=box.bottom);
  let focusPan=0;
  if(drawerLayout.matches&&!clearFocus(focus())){
    const point=focus(),candidates=[stage.top+21,bottom-21,...obstacles.flatMap(box=>[box.top-4,box.bottom+4])]
      .filter(y=>clearFocus({x:point.x,y})).sort((a,b)=>Math.abs(a-point.y)-Math.abs(b-point.y));
    if(candidates.length){focusPan=candidates[0]-point.y;frame.style.setProperty('--pin-pan',`${focusPan}px`);}
  }
  pin.style.setProperty('--shift','0px');pin.removeAttribute('data-bare');pin.toggleAttribute('data-below',below);
  // Include the transparent extension of the button. Fitting only the painted capsule lets the drawer intercept its lower edge.
  const target=getComputedStyle(pin,'::before'),outset={left:-parseFloat(target.left)||0,top:-parseFloat(target.top)||0,right:-parseFloat(target.right)||0,bottom:-parseFloat(target.bottom)||0};
  const bounds=()=>{const box=pin.getBoundingClientRect();return new DOMRect(box.left-outset.left,box.top-outset.top,box.width+outset.left+outset.right,box.height+outset.top+outset.bottom);};
  const meets=(box: DOMRect)=>obstacles.some(obstacle=>box.left<obstacle.right&&obstacle.left<box.right&&box.top<obstacle.bottom&&obstacle.top<box.bottom);
  let box=bounds();
  if(box.width>stage.width-16){pin.toggleAttribute('data-bare',true);box=bounds();}
  if(box.top<stage.top+4||box.bottom>bottom-4||meets(box)){
    pin.toggleAttribute('data-below',!below);const alternate=bounds();
    const cost=(value: DOMRect)=>{const pan=Math.max(0,stage.top+4-value.top)-Math.max(0,value.bottom-(bottom-4)),point=focus();return Math.abs(pan)+(meets(value)?value.height:0)+(drawerLayout.matches&&!clearFocus({x:point.x,y:point.y+pan})?1000:0);};
    if(cost(alternate)<cost(box))box=alternate;else pin.toggleAttribute('data-below',below);
  }
  // A short viewport can place the mark itself above the crop. Pan the painting with the mark, not the pin alone.
  const pan=Math.max(0,stage.top+4-box.top)-Math.max(0,box.bottom-(bottom-4));
  if(pan&&(!drawerLayout.matches||clearFocus({x:focus().x,y:focus().y+pan}))){frame.style.setProperty('--pin-pan',`${focusPan+pan}px`);box=bounds();}
  if(meets(box)){pin.toggleAttribute('data-bare',true);box=bounds();}
  let left=Math.max(stage.left+8,Math.min(box.left,stage.right-8-box.width));
  const candidates=[left,...obstacles.flatMap(obstacle=>[obstacle.right+8,obstacle.left-8-box.width])]
    .filter(value=>value>=stage.left+8&&value+box.width<=stage.right-8)
    .sort((a,b)=>Math.abs(a-left)-Math.abs(b-left));
  left=candidates.find(value=>!meets(new DOMRect(value,box.top,box.width,box.height)))??left;
  pin.style.setProperty('--shift',`${Math.round(left-box.left)}px`);
  // A raised drawer can leave too little room for the whole target. The pin then waits under the drawer, and its focus goes to the board.
  const covered=drawerLayout.matches&&(box.top<stage.top-1||box.bottom>bottom+1);
  pin.toggleAttribute('data-covered',covered);
  if(covered&&document.activeElement===pin)$('#board').querySelector<HTMLElement>('[tabindex="0"]')?.focus({preventScroll:true});
}
/** An image of the size of a room painting, cropped to a region in percentages of the painting. */
function croppedImage(crop: DecorationSlot['crop'], image: string) {
  const scaleX=15.36,scaleY=20.48,value=svg('svg');
  value.setAttribute('viewBox','0 0 1536 2048');value.setAttribute('aria-hidden','true');
  const bounds=svg('svg');bounds.setAttribute('x',String(crop.x*scaleX));bounds.setAttribute('y',String(crop.y*scaleY));
  bounds.setAttribute('width',String(crop.width*scaleX));bounds.setAttribute('height',String(crop.height*scaleY));
  bounds.setAttribute('viewBox',[crop.x*scaleX,crop.y*scaleY,crop.width*scaleX,crop.height*scaleY].join(' '));
  const picture=svg('image');
  picture.setAttribute('href',new URL(`../assets/variants/${image}-1536x2048.webp`,import.meta.url).href);
  picture.setAttribute('width','1536');picture.setAttribute('height','2048');bounds.append(picture);value.append(bounds);return value;
}
/** A finish over the room painting, cropped to its slot in scene coordinates. Saves only supply validated choice IDs. */
function decorationImage(slot: DecorationSlot, variant: DecorationVariant) {
  const value=croppedImage(slot.crop,variant.image);
  value.setAttribute('class','decoration-layer');value.dataset.slot=slot.id;value.dataset.variant=variant.id;return value;
}
/** The holiday decorations of the day in the area that the room shows. */
function drawHolidays(holidays: ReturnType<typeof holidayDecorations>) {
  const holder=$('#room-holidays'),key=holidays.map(decoration=>decoration.id).join();if(holder.dataset.key===key)return;
  holder.dataset.key=key;holder.replaceChildren(...holidays.map(decoration=>{const value=croppedImage(decoration.crop,decoration.image);value.dataset.holiday=decoration.id;return value;}));
}
function drawDecorations(holder: HTMLElement,area: string,completed: string[],choices: Record<string,string>) {
  const slots=resolveDecorations(completed,choices,data).filter(slot=>slot.unlocked&&slot.area===area&&slot.selected.id!==slot.default);
  const key=slots.map(slot=>`${slot.id}:${slot.selected.id}`).join();if(holder.dataset.key===key)return;
  holder.dataset.key=key;holder.replaceChildren(...slots.map(slot=>decorationImage(slot,slot.selected)));
}
/**
 * Each finish that a quest has unlocked has a switch on its place in the room. A tap moves to the next finish of the slot. The choice
 * goes through the same lock and durable write as a preparation, so a failed write keeps the earlier finish.
 */
function renderFinishes(area: string) {
  const holder=$('#room-finishes');
  const slots=resolveDecorations(roomCompleted(),state.decorationChoices,data).filter(slot=>slot.unlocked&&slot.area===area
    &&slot.variants.filter(variant=>decorationUnlocked(state,slot,variant.id,data)).length>1);
  const key=slots.map(slot=>`${slot.id}:${slot.selected.id}`).join();if(holder.dataset.key===key)return;
  holder.dataset.key=key;holder.replaceChildren(...slots.map(slot=>{
    const choices=slot.variants.filter(variant=>decorationUnlocked(state,slot,variant.id,data)),next=choices[(choices.indexOf(slot.selected)+1)%choices.length];
    const finish=button('','room-finish',()=>changeGame(()=>{
      const result=apply({type:'decorate',slot:slot.id,variant:next.id});
      if(result.ok)status(`${slot.name}: ${next.name}.`);
      // The new switch takes the place of the one that was pressed.
      $('#room-finishes').querySelector<HTMLElement>(`[data-slot="${slot.id}"]`)?.focus({preventScroll:true});
    }));
    finish.dataset.slot=slot.id;finish.setAttribute('aria-label',`${slot.name}: ${slot.selected.name}. Switch to ${next.name}`);
    Object.assign(finish.style,{left:`${slot.crop.x}%`,top:`${slot.crop.y}%`,width:`${slot.crop.width}%`,height:`${slot.crop.height}%`});
    finish.append(swapMark());return finish;
  }));
}
/** Now and then a bat crosses the dusk beyond the front room's mended window: after each preparation, and after every third delivery. Never while the page is hidden, under reduced motion, or before the window is mended. */
export function batFlight() {
  const frame = $('#room-frame');
  if (still() || document.hidden || frame.dataset.area !== 'front-room' || frame.dataset.painting === 'front-room-00' || $('#room-stage').hasAttribute('data-failed')) return;
  const sky = $('.window-sky'), bat = element('span', 'mascot bat'); bat.setAttribute('aria-hidden', 'true'); $('.window-flight').append(bat);
  const { width, height } = sky.getBoundingClientRect();
  bat.animate([
    // In from the right and out to the left, across the upper panes and down past the transom.
    { transform: `translate(${1.05 * width}px, ${.12 * height}px)` },
    { transform: `translate(${.66 * width}px, ${.02 * height}px)`, offset: .35 },
    { transform: `translate(${.3 * width}px, ${.2 * height}px)`, offset: .7 },
    { transform: `translate(${-.45 * width}px, ${.06 * height}px)` },
  ], { duration: 2600, easing: 'ease-in-out' }).finished.finally(() => bat.remove());
}
export function miezSprite() {
  const sprite = element('span', `mascot miez-sprite ${catAsleep ? 'cat-sleeping' : 'cat-sitting'}`); sprite.setAttribute('aria-hidden', 'true'); return sprite;
}
export function toggleCat() {
  catAsleep = !catAsleep;
  for (const sprite of document.querySelectorAll('.miez-sprite')) { sprite.classList.toggle('cat-sleeping', catAsleep); sprite.classList.toggle('cat-sitting', !catAsleep); }
  status(catAsleep ? 'Miez approves. The warm chair is now officially reserved.' : 'Miez is back on duty. No pastry will go unobserved.'); playTone('merge');
}
$('#drawer-handle').addEventListener('pointerdown',event=>{swipe=event.clientY;});
$('#drawer-handle').addEventListener('pointerup',event=>{swipe=event.clientY-swipe;});
// A keyboard click has no pointer, so it toggles the drawer whatever an earlier pointer left in swipe.
$('#drawer-handle').addEventListener('click',event=>{const moved=event.detail&&Math.abs(swipe)>20?swipe>0:!lowered;swipe=0;setLowered(moved);});
$('#room-pin').addEventListener('click',()=>{const {view}=currentView();status(view.current!.text);});
$('#cat-button').addEventListener('click',toggleCat);
movableDrawer.addEventListener('change',()=>setLowered(false));
window.addEventListener('resize',syncRoomControls);
// Only the pan of the frame and the drop of the drawer move the room. The press transitions of the buttons inside them also bubble here.
for(const mover of [$('#room-frame'),$('.game-layout')])mover.addEventListener('transitionend',event=>{if(event.target===mover)syncRoomControls();});
