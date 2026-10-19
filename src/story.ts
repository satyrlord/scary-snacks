// The story: the chapter card with the next preparation and its payment, the scenes, and the story journal.
import { arrivalScene, deliveriesSince, journalCharacters, resolveChapters, resolveNeighbours, resolveQuests, sceneSource, taskEligibility } from './model.ts';
import type { Character, ChapterView, SceneLine, Task } from './model.ts';
import { $, button, coinText, count, element, names } from './dom.ts';
import { coinMark, portrait, questSketch } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { holdChange, miezSprite, preloadRoom, toggleCat } from './room.ts';
import { apply, changeGame, character, data, keep, saveFailed, saveMessage, state } from './session.ts';

// A scene that leads on to the next waiting scene, so that focus can return to the story when the last one closes.
let sceneFlow = false;
// Each waiting scene whose line could not be saved has warned the player once.
const unsavedScenes = new Set<string>();

/** The story card on wider screens and the Story sheet on phones show the same content; the sheet's title replaces the heading. */
export function storyContent(inSheet: boolean) {
  const eligibility = taskEligibility(state, data), task = eligibility.task, views = resolveChapters(state, data);
  const view = views.find(value => value.status === 'current') ?? views.at(-1)!, chapter = view.number;
  const content = document.createDocumentFragment();
  // The chapter title heads the story card, and its steps name the chapter number. The Story sheet keeps the title "Our little bistro".
  if (inSheet) content.append(element('p', 'chapter-name', `Chapter ${chapter} · ${view.chapter.title}`));
  else content.append(element('h2', 'chapter-title', view.chapter.title));
  content.append(element('p', 'chapter-objective', view.chapter.objective), chapterSteps(view, !inSheet));
  // An earned scene waits here until the player finishes or skips it. Cooking never waits for it.
  const waiting = state.pendingScenes[0], scene = waiting ? storyScene(waiting) : null;
  if (waiting) {
    const notice = element('div', 'story-waiting'), read = button('Read now', 'text-button', () => showScene(waiting));
    read.setAttribute('aria-label', `Read now: ${scene?.title ?? 'the waiting scene'}`);
    notice.append(element('p', '', scene?.prompt ?? 'A story scene is waiting.'), read); content.append(notice);
  }
  const body = element('div', 'task-content');
  if (!task) body.append(element('h3', '', 'The table is ready.'), element('p', '', 'The community supper is open, and every quest is delivered. The board and the recipe book stay yours.'));
  else {
    body.append(element('h3', '', task.title));
    const requirements = element('ul', 'task-requirements');
    requirements.id = inSheet ? 'sheet-task-requirements' : 'story-task-requirements';
    requirements.setAttribute('aria-label', 'Preparation requirements');
    for (const requirement of eligibility.requirements) {
      const row = element('li');
      row.dataset.requirement = requirement.kind;
      if (requirement.kind === 'space') {
        if (requirement.met) continue;
        row.append(element('span', '', `Free a space on the board for the ${requirement.source}.`));
      } else {
        const label = requirement.kind === 'coins' ? 'Coins' : 'Quests delivered';
        row.append(element('span', '', `${label}: ${count.format(requirement.current)} / ${count.format(requirement.required)}`),
          element('span', 'requirement-status', requirement.met ? 'Complete' : `Need ${count.format(requirement.required - requirement.current)}`));
      }
      requirements.append(row);
    }
    const pay = payButton(task); pay.setAttribute('aria-describedby', requirements.id);
    const actions = element('div', 'task-payment');
    const details = button('Cost details', 'text-button', () => taskCost(task, inSheet));
    details.dataset.workCost = ''; details.setAttribute('aria-label', 'Work and cost');
    actions.append(pay, details); body.append(requirements, actions);
  }
  const links = element('div', 'story-links');
  const journalLink=button('Journal','text-button',journal);journalLink.setAttribute('aria-label','Open the story journal');links.append(journalLink);
  // The drawer can cover the windowsill on phones, so the cat also waits in the Story sheet there.
  const cat = button('', 'miez-card', toggleCat); const words = element('span');
  words.append(element('strong', '', 'Miez is on kitchen duty.'), element('small', '', 'Give the resident cat some attention.'));
  cat.append(miezSprite(), words);
  // The count is short so that it shares a line with the save state. Screen readers also hear the word "preparations".
  const progress = element('span', '', `${state.taskIndex} of ${data.tasks.length}`); progress.append(element('span', 'visually-hidden', ' preparations'), ' done');
  const foot = element('p', 'story-foot'); foot.append(element('span', 'save-status', saveMessage), progress);
  content.append(body, links, cat, foot); return content;
}
function taskCost(task: Task, inSheet: boolean) {
  const content = element('div', 'task-cost');
  content.append(element('h3', '', task.title), element('p', 'modal-copy', task.work.summary));
  const rows = element('ul', 'task-requirements');
  for (const [label, amount] of [['Materials and supplies', task.work.materials], ['Labour', task.work.labour], ['Total', task.cost]] as const) {
    const row = element('li'); row.append(element('span', '', label), element('span', '', coinText(amount))); rows.append(row);
  }
  content.append(rows, element('p', 'small-copy', `Estimated labour: ${count.format(task.work.hours)} person-hours. This describes the size of the job. There is no waiting timer.`));
  const back = inSheet ? () => {
    const story = storyContent(true);
    const focus = story.querySelector<HTMLElement>('[data-work-cost]')!;
    showModal('Our little bistro', story, focus);
  } : undefined;
  showModal('Work and cost', content, undefined, back);
}
/**
 * Pay for a preparation: from the story card, the Story sheet, or Mara's offer. The game saves the preparation first; the room keeps
 * the previous state until the story ends, and then the change is revealed in place. A failed write spends nothing.
 */
function payButton(task: Task) {
  const pay = button(`Pay · ${count.format(task.cost)}`, 'primary-button pay-button', () => changeGame(() => {
    holdChange(task);
    const waiting = state.pendingScenes, result = apply({ type:'task' });
    if (!result.ok) { holdChange(null); return; }
    // The preparation's scene opens at once. A chapter's closing scene, and then the finale, follow the reveal of the payment that earned them.
    holdChange(task, state.pendingScenes.find(id => !waiting.includes(id) && id !== task.id) ?? null);
    preloadRoom(task); showScene(task.id, undefined, { paid:true, completion:result.message });
  }));
  pay.append(coinMark()); pay.setAttribute('aria-label', `Pay ${coinText(task.cost)}: ${task.title}`);
  pay.disabled = !taskEligibility(state, data).ready;
  return pay;
}
/**
 * One Pay control at a time: where the story card is on screen, it alone carries Pay. Where it is not (the story lives in a sheet),
 * Mara offers the eligible next preparation by name while no tile is selected, and the Story button carries a copper dot.
 */
export function renderOffer() {
  const eligibility = taskEligibility(state, data), task = eligibility.task, offer = $('#offer'), story = $('#story-button');
  const docked = $('#story').checkVisibility(), ready = eligibility.ready && !docked, waiting = !docked && state.pendingScenes.length > 0;
  $('.game-layout').toggleAttribute('data-offer', ready);
  // The dot marks the Story button while the sheet holds a payment or a scene to read.
  story.toggleAttribute('data-ready', ready || waiting);
  story.setAttribute('aria-label', ready && waiting ? 'Story, a preparation is ready and a scene is waiting' : ready ? 'Story, a preparation is ready' : waiting ? 'Story, a scene is waiting' : 'Story');
  if (!ready) { offer.replaceChildren(); return; }
  const face = portrait('mara'), words = element('p');
  face.setAttribute('aria-hidden', 'true'); words.append(element('strong', '', task!.title), element('span', '', 'Ready when you are.'));
  offer.replaceChildren(face, words, payButton(task!));
}
/** The chapter's preparations as steps: done, now, or not yet. Screen readers hear each name; the count repeats it for the eye. */
function chapterSteps(view: ChapterView, numbered: boolean) {
  const row=element('div','chapter-steps'),list=element('ol');list.setAttribute('aria-label',`Chapter ${view.number} preparations`);
  view.tasks.forEach((task,index)=>{
    const step=element('li'),now=view.status==='current'&&index===view.done;step.dataset.step=index<view.done?'done':now?'now':'next';
    step.append(element('span','visually-hidden',`${task.title}: ${index<view.done?'done':now?'now':'not yet'}`));list.append(step);
  });
  const done=element('span','',numbered?`Chapter ${view.number}`:`${view.done} of ${view.tasks.length} done`);done.setAttribute('aria-hidden','true');
  row.append(list,done);return row;
}
/** A preparation scene, a quest completion scene, a regular's arrival scene, a chapter's closing scene, the finale, or local news, by its saved ID. An unknown ID has no scene, so the game never invents one. */
function storyScene(id: string) {
  const more=(dialogue: SceneLine[])=>`${character(dialogue[0].speaker).name} has more to say.`,source=sceneSource(id,data);
  switch(source?.kind){
    case 'task':{const {task}=source;return {title:task.title,dialogue:task.dialogue,completion:data.rooms.find(room=>room.after===id)!.text,prompt:more(task.dialogue)};}
    case 'quest':{const {quest}=source,who=names.format([quest.character,...quest.companions??[]].map(person=>character(person).name));return {title:quest.title,dialogue:quest.completion,questCharacter:quest.character,questId:quest.id,completion:'',prompt:`${who} replied to “${quest.title}”.`};}
    case 'chapter':{const {chapter,number}=source;return {title:`Chapter ${number} complete: ${chapter.title}`,dialogue:chapter.closing,completion:chapter.payoff,prompt:`Chapter ${number} is complete.`};}
    case 'finale':{const {finale}=source;return {title:finale.title,dialogue:finale.dialogue,completion:finale.ending,prompt:'The supper can begin.'};}
    case 'arrival':{const {person}=source;return {title:`${person.name} arrives`,dialogue:person.arrival!,completion:`${person.name} is now a regular. Read more about ${person.name} in the story journal.`,prompt:'A new neighbour has arrived.'};}
    case 'news':{const {news}=source;return {title:news.title,dialogue:news.dialogue,completion:'The news is recorded in the story journal.',prompt:'News has reached the bistro.'};}
    default:return null;
  }
}
/**
 * A waiting scene plays from its saved line until Finish or Skip, which move it to the journal and lead on to the next waiting scene.
 * Close and Escape leave it waiting at its line. A scene that is already read replays from the journal and changes nothing.
 * A paid preparation's scene ends instead with the change that it made, which the room then reveals in place.
 */
export function showScene(id: string, backTo?: () => void, options: { paid?: boolean; completion?: string } = {}) {
  const scene=storyScene(id);
  if(!scene){
    const content=element('div');content.append(element('p','save-error','This story scene could not open. Your progress is safe.'),button('Try again','secondary-button',()=>location.reload()));
    showModal('Story unavailable',content);return;
  }
  const completion=options.completion??scene.completion;
  if(!state.pendingScenes.includes(id)){showStory(scene,false,completion,backTo);return;}
  if(!options.paid)sceneFlow=true;
  const read=()=>changeGame(()=>{
    const result=apply({type:'readScene',id});if(!result.ok)return;
    // The close of a paid scene starts the reveal, which then opens the next scene that the payment earned.
    if(options.paid){modal.close();return;}
    const next=state.pendingScenes[0];
    if(backTo)backTo();else if(next)showScene(next);else modal.close();
  });
  showStory(scene,options.paid,completion,backTo,{id,label:backTo?'Return':state.pendingScenes.length>1?'Next scene':'Back to the kitchen',finish:read,skip:read});
}
/** After the last scene of a flow closes, focus returns to the story, because reading can remove the control that opened the scene. */
export function endSceneFlow() {
  if(!sceneFlow)return;
  sceneFlow=false;
  if(document.activeElement===document.body||modal.contains(document.activeElement)){
    const journalLink=$('#story').querySelector<HTMLElement>('[aria-label="Open the story journal"]');
    (journalLink?.checkVisibility()?journalLink:$('#story-button')).focus({preventScroll:true});
  }
}
/**
 * The line that the player sees in a waiting scene. The write needs no render, because the dialog already shows the line.
 * A failed write keeps the session: the dialog warns once for each scene, and the player can continue to read.
 */
function recordLine(id: string, line: number, warn: () => void) {
  return changeGame(()=>{
    if(!keep({type:'sceneLine',id,line}))return;
    if(saveFailed&&!unsavedScenes.has(id)){unsavedScenes.add(id);warn();}
  });
}
/** A conversation. A waiting scene starts at its saved line and records each change of line. */
function showStory(task: { title: string; dialogue: SceneLine[]; questCharacter?: string; questId?: string }, paid = false, completion = '', backTo?: () => void, end?: { id: string; label: string; finish: () => void; skip: () => void }) {
  const last=task.dialogue.length-1,saved=end?state.sceneLines?.[end.id]??0:0;
  // A release can remove lines, so a saved line past the end starts the scene again.
  let cursor=saved>last?0:saved;
  // The stage is built once and only its words change: the live region stays in place, so each new line is announced, and focus stays on the button pressed.
  const content=element('div',task.questCharacter?'quest-page-content':''),stage=element('div','story-stage'),words=element('div','story-dialogue'),speaker=element('h3'),said=element('p');
  words.id='story-line';words.setAttribute('aria-live','polite');words.setAttribute('aria-atomic','true');words.append(speaker,said);
  const counter=element('span'),controls=element('div','story-controls'),unsaved=element('p');unsaved.setAttribute('role','status');
  const warn=()=>{unsaved.className='save-error scene-unsaved';unsaved.textContent='This session is not saved. You can keep reading. Use Retry save in Options before you leave.';};
  const move=(step: number)=>{cursor+=step;draw();if(end)void recordLine(end.id,cursor,warn);};
  const back=button('Back','secondary-button',()=>{move(-1);if(back.disabled)forward.focus();});
  const forward=button('Continue','primary-button',()=>{if(cursor<last)move(1);else if(end)end.finish();else if(backTo)backTo();else modal.close();});
  forward.setAttribute('aria-describedby','story-line');
  if(saved>last)content.append(element('p','modal-copy','Someone lost the thread. The conversation starts again from the beginning.'));
  stage.append(portrait(task.dialogue[cursor].speaker),words);controls.append(back,counter,forward);
  const reading=element('div','quest-reading');
  if(task.questCharacter)reading.append(questSketch(task.questCharacter,task.questId));
  reading.append(stage);content.append(reading,controls);
  if (end) content.append(button('Skip scene','text-button skip-scene',end.skip));
  if (completion) content.append(element('p','completion-message',completion));
  if (end) content.append(unsaved);
  function draw() {
    const line=task.dialogue[cursor];stage.firstElementChild!.replaceWith(portrait(line.speaker));
    speaker.textContent=character(line.speaker).name;said.textContent=line.text;counter.textContent=`${cursor+1} / ${task.dialogue.length}`;
    back.disabled=cursor===0;forward.textContent=cursor<last?'Continue':paid?'See what changed':end?end.label:backTo?'Return':'Back to the kitchen';
  }
  draw();showModal(task.title,content,forward,backTo);
}
function journal(focusEntry?: string) {
  const content=element('div','journal-list');
  content.append(element('p','modal-copy','Meet your neighbours and read your saved conversations. Reading never gives another reward.'));
  content.append(element('h3','','Neighbours'));
  const people=journalCharacters(state,data);
  const meet=(person: Character)=>showStory({title:`Meet ${person.name}`,dialogue:[{speaker:person.id,text:person.introduction}],questCharacter:person.id},false,'',()=>journal(person.id));
  // A neighbour who has not arrived is a dashed outline without a name, so the page does not spoil later chapters.
  for(const {person,arrived,delivered} of resolveNeighbours(state,data)){
    if(!arrived){const slot=element('div','journal-entry neighbour-entry not-yet');slot.append(element('span','portrait-outline'),element('span','','Not yet'));content.append(slot);continue;}
    const scene=person.arrival?arrivalScene(person):null,waiting=!!scene&&state.pendingScenes.includes(scene);
    const entry=button('','journal-entry neighbour-entry',()=>waiting?showScene(scene!,()=>journal(person.id)):meet(person));
    const likes=person.prefers?`Favourites: ${names.format(person.prefers.map(chain=>data.chains.find(value=>value.id===chain)!.name))}`:'';
    const words=element('span','neighbour-words');words.append(element('strong','',person.name),element('span','',person.role));if(likes)words.append(element('span','',likes));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',waiting?`Read ${person.name} arrives`:`Meet ${person.name}`);
    entry.setAttribute('aria-description',`${person.role}${likes?`. ${likes}`:''}. ${delivered} ${delivered===1?'quest':'quests'} delivered.`);
    entry.append(portrait(person.id),words,element('span','',waiting?'New scene':`${delivered} ${delivered===1?'quest':'quests'}`));content.append(entry);
  }
  // The travellers have their introductions too, while they are part of the story.
  for(const person of people.filter(value=>value.visitor)){
    const entry=button('','journal-entry neighbour-introduction',()=>meet(person));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',`Meet ${person.name}`);
    entry.append(portrait(person.id),element('strong','',person.name),element('span','',person.role));content.append(entry);
  }
  const completed=resolveQuests(state,data).filter(view=>view.status==='complete'&&people.some(person=>person.id===view.quest.character));
  if(completed.length)content.append(element('h3','','Neighbour quests'));
  for(const {quest} of completed){
    const section=element('section','quest-journal');section.append(element('h4','',quest.title));
    const opening=button('Read quest','text-button',()=>showStory({title:quest.title,dialogue:quest.opening,questCharacter:quest.character,questId:quest.id},false,'',()=>journal(quest.id)));
    opening.setAttribute('aria-label',`Read quest: ${quest.title}`);
    const waiting=state.pendingScenes.includes(quest.id),replay=button('Read completion','journal-entry',()=>showScene(quest.id,()=>journal(quest.id)));
    replay.dataset.journal=quest.id;replay.setAttribute('aria-label',`${waiting?'Read':'Replay'} ${quest.title}`);replay.append(element('span','',waiting?'New scene':character(quest.character).name));section.append(opening,replay);content.append(section);
  }
  const quests=resolveQuests(state,data);
  const sceneEntry=(id: string)=>{
    const scene=storyScene(id)!,waiting=state.pendingScenes.includes(id);
    const entry=button('','journal-entry',()=>showScene(id,()=>journal(id)));entry.dataset.journal=id;
    entry.setAttribute('aria-label',`${waiting?'Read':'Replay'} ${scene.title}`);entry.append(element('strong','',scene.title),element('span','',waiting?'New scene':'Replay'));
    return entry;
  };
  for(const quest of data.quests){
    const news=quest.followUp;
    if(!news||deliveriesSince(state,quest.id)<news.afterDeliveries)continue;
    const section=element('section','quest-journal');section.append(element('h4','','Local news'),sceneEntry(news.id));content.append(section);
  }
  // Each open chapter: its goal while it runs, or its payoff once it is complete, with its preparations and the help of a neighbour.
  content.append(element('h3','','Chapters'));
  for(const view of resolveChapters(state,data).filter(value=>value.status!=='locked')){
    const section=element('section','chapter-journal');section.dataset.chapter=view.chapter.id;
    section.append(element('h4','',`Chapter ${view.number} · ${view.chapter.title}`));
    if(view.status==='complete')section.append(element('p','',view.chapter.payoff));
    else section.append(element('p','',view.chapter.opening),element('p','small-copy',`Goal: ${view.chapter.objective}`));
    const help=quests.find(value=>value.quest.id===view.chapter.contribution)!;
    if(help.status!=='locked')section.append(element('p','small-copy',`${character(help.quest.character).name} helps: ${help.quest.title} · ${
      help.status==='complete'?'Delivered':help.status==='active'?'On the counter':'Waiting for a ticket'}`));
    const steps=element('ul','journal-steps');
    view.tasks.forEach((task,index)=>{
      if(index<view.done){
        // A waiting preparation scene says so. A read one names its room change.
        const waiting=state.pendingScenes.includes(task.id),entry=button('','journal-entry',()=>showScene(task.id,()=>journal(task.id)));entry.dataset.journal=task.id;
        if(waiting)entry.setAttribute('aria-label',`Read ${task.title}`);
        entry.append(element('strong','',task.title),element('span','',waiting?'New scene':`New: ${data.rooms.find(room=>room.after===task.id)!.label}`));section.append(entry);
      }else steps.append(element('li','',`${task.title} · ${index===view.done?'Next':'Not yet'}`));
    });
    if(steps.childElementCount)section.append(steps);
    if(view.status==='complete')section.append(sceneEntry(view.chapter.id));
    content.append(section);
  }
  if(state.taskIndex===data.tasks.length){
    const section=element('section','chapter-journal');section.append(element('h4','','The finale'),sceneEntry(data.finale.id));content.append(section);
  }
  showModal('Story journal',content,focusEntry?content.querySelector<HTMLElement>(`[data-journal="${focusEntry}"]`)??undefined:undefined);
}
$('#story-button').addEventListener('click',()=>data&&showModal('Our little bistro',storyContent(true)));
