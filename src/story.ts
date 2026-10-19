// The story: the chapter card with the next preparation and its payment, the scenes, and the story journal.
import { deliveriesSince, journalCharacters, resolveChapters, resolveNeighbours, resolveQuests, sceneSource, supperComplete, supperQuest, taskEligibility } from './model.ts';
import type { Character, ChapterView, SceneLine, Task, TaskRequirement } from './model.ts';
import { $, button, coinText, count, element, names, svg } from './dom.ts';
import { coinMark, portrait, questSketch } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { guidanceGoal } from './dishes.ts';
import { holdChange, miezSprite, preloadRoom, roomPicture, SUPPER_PICTURE, toggleCat } from './room.ts';
import { apply, changeGame, character, data, onReplace, saveFailed, saveMessage, state } from './session.ts';

// A scene that leads on to the next waiting scene, so that focus can return to the story when the last one closes.
let sceneFlow = false;
let expandedCost: string | null = null;
onReplace(() => { expandedCost = null; });

/** The story card on wider screens and the Story sheet on phones show the same content; the sheet's title replaces the heading. */
export function storyContent(inSheet: boolean) {
  const eligibility = taskEligibility(state, data), task = eligibility.task, views = resolveChapters(state, data);
  const view = views.find(value => value.status === 'current') ?? views.at(-1)!, chapter = view.number;
  const content = document.createDocumentFragment();
  // The chapter title heads the story card, and its steps name the chapter number. The Story sheet keeps the title "Our little bistro".
  if (inSheet) content.append(element('p', 'chapter-name', `Chapter ${chapter} · ${view.chapter.title}`));
  else content.append(element('h2', 'chapter-title', view.chapter.title));
  content.append(element('p', 'chapter-objective', view.chapter.objective), chapterSteps(view, !inSheet));
  // An earned scene waits here until the player finishes it. Cooking never waits for it.
  const waiting = state.pendingScenes[0], scene = waiting ? storyScene(waiting) : null;
  if (waiting) {
    const notice = element('div', 'story-waiting'), read = button('Read now', 'text-button', () => showScene(waiting));
    read.setAttribute('aria-label', `Read now: ${scene?.title ?? 'the waiting scene'}`);
    notice.append(element('p', '', scene?.prompt ?? 'A story scene is waiting.'), read); content.append(notice);
  }
  const body = element('div', 'task-content');
  const supper = supperQuest(data)!;
  if (!task && !supperComplete(state,data)) body.append(element('h3', '', supper.title), element('p', '', `Every preparation is done. ${character(supper.character).name}’s last quest waits on the counter: pay for the supper there.`));
  else if (!task) body.append(element('h3', '', 'The table is ready.'), element('p', '', 'The community supper is open, and every quest is delivered. The board and the recipe book stay yours.'));
  else {
    body.append(element('h3', '', task.title));
    const requirements = element('div', 'preparation-requirements');
    requirements.id = inSheet ? 'sheet-task-requirements' : 'story-task-requirements';
    if (eligibility.ready) requirements.append(element('p', 'task-ready', 'Ready to prepare.'));
    else {
      const remaining = element('ul', 'task-requirements'); remaining.setAttribute('aria-label', 'Preparation requirements');
      for (const requirement of eligibility.requirements.filter(value => !value.met)) {
        const row = element('li'); row.dataset.requirement = requirement.kind;
        const amount = requirement.kind === 'space' ? 0 : requirement.required - requirement.current;
        row.append(element('span', '', requirement.kind === 'space' ? `Free a board space for the ${requirement.source}.`
          : requirement.kind === 'coins' ? `Earn ${count.format(amount)} more ${amount === 1 ? 'coin' : 'coins'}.`
          : `Deliver ${count.format(amount)} more ${amount === 1 ? 'quest' : 'quests'}.`));
        remaining.append(row);
      }
      requirements.append(remaining);
    }
    requirements.append(element('p', 'visually-hidden', eligibility.requirements.map(requirementTotal).join(' ')));
    const pay = payButton(task); pay.setAttribute('aria-describedby', requirements.id);
    const actions = element('div', 'task-payment');
    const costs = taskCost(task); costs.id = inSheet ? 'sheet-work-cost' : 'story-work-cost'; costs.hidden = expandedCost !== task.id;
    const details = button('Cost details', 'text-button cost-toggle', () => {
      const opened = costs.hidden; expandedCost = opened ? task.id : null;
      for (const toggle of document.querySelectorAll<HTMLButtonElement>('[data-work-cost]')) {
        toggle.setAttribute('aria-expanded', String(opened));
        document.getElementById(toggle.getAttribute('aria-controls')!)!.hidden = !opened;
      }
    });
    details.dataset.workCost = ''; details.setAttribute('aria-label', 'Work and cost');
    details.setAttribute('aria-expanded', String(!costs.hidden)); details.setAttribute('aria-controls', costs.id);
    const chevron = svg('svg'), path = svg('path'); chevron.setAttribute('viewBox','0 0 24 24'); chevron.setAttribute('aria-hidden','true');
    path.setAttribute('d','m7 10 5 5 5-5'); chevron.append(path); details.append(chevron);
    actions.append(pay, details); body.append(requirements, actions, costs);
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
/** Exact totals stay in payment descriptions and in Cost details when the main list shows only unmet needs. */
function requirementTotal(requirement: TaskRequirement) {
  if (requirement.kind === 'space') return `Board space for the ${requirement.source}: ${requirement.met ? 'available' : '1 needed'}.`;
  const label = requirement.kind === 'coins' ? 'Coins' : 'Quests delivered';
  return `${label}: ${count.format(requirement.current)} / ${count.format(requirement.required)}.`;
}
function taskCost(task: Task) {
  const content = element('section', 'task-cost'); content.setAttribute('aria-label','Work and cost');
  content.append(element('p', 'work-summary', task.work.summary));
  const rows = element('ul', 'task-requirements work-costs');
  for (const [label, amount] of [['Materials and supplies', task.work.materials], ['Labour', task.work.labour], ['Total', task.cost]] as const) {
    const row = element('li'); row.append(element('span', '', label), element('span', '', coinText(amount))); rows.append(row);
  }
  content.append(rows, element('p', 'small-copy', `Estimated labour: ${count.format(task.work.hours)} person-hours. This describes the size of the job. There is no waiting timer.`));
  const totals = element('ul', 'task-requirements requirement-totals'); totals.setAttribute('aria-label', 'Preparation requirement totals');
  for (const requirement of taskEligibility(state,data).requirements) {
    const row = element('li'); row.dataset.requirement = requirement.kind; row.textContent = requirementTotal(requirement); totals.append(row);
  }
  content.append(element('h4', 'cost-requirements-title', 'Preparation requirements'), totals);
  return content;
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
    // The preparation's scene opens at once. Other scenes that the payment earned follow its reveal.
    holdChange(task, state.pendingScenes.find(id => !waiting.includes(id) && id !== task.id) ?? null);
    preloadRoom(task); showScene(task.id, undefined, { paid:true, completion:result.message });
  }));
  pay.append(coinMark()); pay.setAttribute('aria-label', `Pay ${coinText(task.cost)}: ${task.title}`);
  const eligibility = taskEligibility(state,data);
  pay.disabled = !eligibility.ready;
  pay.setAttribute('aria-description', eligibility.requirements.map(requirementTotal).join(' '));
  return pay;
}
/**
 * One Pay control at a time: where the story card is on screen, it alone carries Pay. Where it is not (the story lives in a sheet),
 * Mara offers the eligible next preparation by name while no tile is selected, and the Story button carries a copper dot.
 */
export function renderOffer() {
  const eligibility = taskEligibility(state, data), task = eligibility.task, offer = $('#offer'), story = $('#story-button');
  const docked = $('#story').checkVisibility(), ready = eligibility.ready && !docked, waiting = !docked && state.pendingScenes.length > 0;
  const showOffer = ready && !guidanceGoal();
  $('.game-layout').toggleAttribute('data-offer', showOffer);
  // The dot marks the Story button while the sheet holds a payment or a scene to read.
  story.toggleAttribute('data-ready', ready || waiting);
  story.setAttribute('aria-label', ready && waiting ? 'Story, a preparation is ready and a scene is waiting' : ready ? 'Story, a preparation is ready' : waiting ? 'Story, a scene is waiting' : 'Story');
  if (!showOffer) { offer.replaceChildren(); return; }
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
    // The ending line of the finale stands under the supper painting.
    case 'finale':{const {finale}=source;return {title:finale.title,dialogue:finale.dialogue,completion:'',prompt:'The supper can begin.'};}
    case 'arrival':{const {person}=source;return {title:`${person.name} arrives`,dialogue:person.arrival!,completion:`${person.name} is now a regular. Read more about ${person.name} in the story journal.`,prompt:'A new neighbour has arrived.'};}
    case 'news':{const {news}=source;return {title:news.title,dialogue:news.dialogue,completion:'The news is recorded in the story journal.',prompt:'News has reached the bistro.'};}
    default:return null;
  }
}
/**
 * A waiting scene ends with its completion action, which moves it to the journal.
 * Close and Escape leave it waiting. A read scene replays from the journal and changes nothing.
 * A paid preparation's scene ends instead with the change that it made, which the room then reveals in place.
 * The finale always ends with the painting of the supper.
 */
export function showScene(id: string, backTo?: () => void, options: { paid?: boolean; completion?: string; includeOpening?: boolean } = {}) {
  const scene=storyScene(id);
  if(!scene){
    const content=element('div');content.append(element('p','save-error','This story scene could not open. Your progress is safe.'),button('Try again','secondary-button',()=>location.reload()));
    showModal('Story unavailable',content);return;
  }
  const source=options.includeOpening?sceneSource(id,data):null;
  const conversation=source?.kind==='quest'?{...scene,opening:source.quest.opening}:scene;
  const completion=options.completion??scene.completion,finale=id===data.finale.id;
  if(!state.pendingScenes.includes(id)){showStory(conversation,false,completion,backTo,undefined,finale?()=>showSupper(backTo):undefined);return;}
  if(!options.paid)sceneFlow=true;
  const read=()=>changeGame(()=>{
    const result=apply({type:'readScene',id});if(!result.ok)return;
    // The close of a paid scene starts the reveal, which then opens the next scene that the payment earned.
    if(options.paid){modal.close();return;}
    const next=state.pendingScenes[0],after=backTo??(next?()=>showScene(next):undefined);
    if(finale)showSupper(after);else if(after)after();else modal.close();
  });
  showStory(conversation,options.paid,completion,backTo,{id,label:finale?'See the supper':backTo?'Return':state.pendingScenes.length>1?'Next scene':'Back to the kitchen',finish:read});
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
/** Each scene, and a combined quest journal page, is one transcript. Opening or scrolling it never changes the game. After follows the last line of a replay. */
function showStory(task: { title: string; dialogue: SceneLine[]; opening?: SceneLine[]; questCharacter?: string; questId?: string }, paid = false, completion = '', backTo?: () => void, end?: { id: string; label: string; finish: () => void }, after?: () => void) {
  const content=element('div',task.questCharacter?'quest-page-content':''),reading=element('div','quest-reading'),transcript=element('div','story-transcript');
  transcript.id='story-line';
  if(task.questCharacter)reading.append(questSketch(task.questCharacter,task.questId));
  const parts=task.opening?[{label:'Request',lines:task.opening},{label:'Reply',lines:task.dialogue}]:[{label:'',lines:task.dialogue}];
  for(const part of parts){
    const section=part.label?element('section','conversation-part'):transcript;
    if(part.label){section.setAttribute('aria-label',part.label);section.append(element('h3','',part.label));}
    for(const line of part.lines){
      const turn=element('div','story-turn'),words=element('div','turn-words');
      words.append(element(part.label?'h4':'h3','',character(line.speaker).name),element('p','',line.text));turn.append(portrait(line.speaker),words);section.append(turn);
    }
    if(part.label)transcript.append(section);
  }
  reading.append(transcript);content.append(reading);
  if(completion)content.append(element('p','completion-message',completion));
  if(end&&saveFailed){
    const warning=element('p','save-error scene-unsaved','This session is not saved. You can keep reading. Use Retry save in Options before you leave.');warning.setAttribute('role','status');content.append(warning);
  }
  const controls=element('div','story-controls');
  const done=button(paid?'See what changed':end?end.label:after?'See the supper':backTo?'Return':'Back to the kitchen','primary-button',()=>{
    if(end)end.finish();else if(after)after();else if(backTo)backTo();else modal.close();
  });controls.append(done);content.append(controls);
  showModal(task.title,content,$('#modal-title'),backTo);modal.scrollTop=0;
}
/** The painting of the supper: the neighbours at the courtyard tables. It ends the finale, and the journal replays it with the finale. */
function showSupper(after?: () => void) {
  const content=element('div','supper-view'),picture=roomPicture('finale-supper','(max-width: 1023px) 100vw, 560px');
  picture.className='supper-painting';picture.querySelector('img')!.alt=SUPPER_PICTURE;
  const done=button(after?'Continue':'Back to the kitchen','primary-button',()=>after?after():modal.close());
  content.append(picture,element('p','completion-message',data.finale.ending),done);
  showModal('The supper',content,done,after);
}
/** The journal puts waiting scenes and the current chapter before optional browsing. Return keeps the open groups and reading position. */
function journal(focusEntry?: string, scrollTop = 0, openGroups: string[] = []) {
  const content=element('div','journal-list'),people=journalCharacters(state,data),quests=resolveQuests(state,data);
  const group=(id: string,title: string)=>{
    const details=element('details','journal-group');details.dataset.group=id;details.open=openGroups.includes(id);
    details.append(element('summary','',title));return details;
  };
  const returnTo=(id: string,readTarget = id)=>{
    const position=modal.scrollTop,groups=[...content.querySelectorAll<HTMLDetailsElement>('details[open]')].map(value=>value.dataset.group!);
    return ()=>journal(state.pendingScenes.includes(id)?id:readTarget,position,groups);
  };
  const sceneEntry=(id: string)=>{
    const scene=storyScene(id)!,waiting=state.pendingScenes.includes(id),source=sceneSource(id,data);
    const target=source?.kind==='arrival'?source.person.id:id;
    const wholeQuest=source?.kind==='quest'&&!character(source.quest.character).singleVisit;
    const entry=button('','journal-entry',()=>showScene(id,returnTo(id,target),{includeOpening:wholeQuest}));entry.dataset.journal=id;entry.dataset.scene=id;
    if(source?.kind==='quest')entry.dataset.quest=id;
    entry.setAttribute('aria-label',`${waiting?'Read':'Replay'} ${scene.title}`);
    entry.append(element('strong','',scene.title),element('span','',waiting?'New scene':'Replay'));return entry;
  };
  content.append(element('p','modal-copy','Read your saved conversations. Reading never gives another reward.'));
  const unread=element('section','journal-unread'),heading=element('h3','','Unread scenes');heading.tabIndex=-1;
  unread.setAttribute('aria-label','Unread scenes');unread.append(heading);
  for(const id of state.pendingScenes)unread.append(sceneEntry(id));
  if(!state.pendingScenes.length)unread.append(element('p','small-copy','No unread scenes.'));
  content.append(unread);
  // A waiting scene has one row, above. Read preparations and chapter endings stay with their chapter.
  const chapters=resolveChapters(state,data).filter(value=>value.status!=='locked');
  const latest=chapters.find(value=>value.status==='current')??chapters.at(-1)!;
  const chapterSection=(view: ChapterView,current: boolean)=>{
    const section=element('section','chapter-journal');section.dataset.chapter=view.chapter.id;
    if(current)section.dataset.currentChapter='';
    section.append(element(current?'h3':'h4','',`Chapter ${view.number} · ${view.chapter.title}`));
    if(view.status==='complete')section.append(element('p','',view.chapter.payoff));
    else section.append(element('p','',view.chapter.opening),element('p','small-copy',`Goal: ${view.chapter.objective}`));
    const help=quests.find(value=>value.quest.id===view.chapter.contribution)!;
    if(help.status!=='locked')section.append(element('p','small-copy',`${character(help.quest.character).name} helps: ${help.quest.title} · ${
      help.status==='complete'?'Delivered':help.status==='active'?'On the counter':'Waiting for a ticket'}`));
    const steps=element('ul','journal-steps');
    view.tasks.forEach((task,index)=>{
      if(index<view.done){
        if(state.pendingScenes.includes(task.id))return;
        const entry=sceneEntry(task.id);entry.lastElementChild!.textContent=`New: ${data.rooms.find(room=>room.after===task.id)!.label}`;section.append(entry);
      }else steps.append(element('li','',`${task.title} · ${index===view.done?'Next':'Not yet'}`));
    });
    if(steps.childElementCount)section.append(steps);
    if(view.status==='complete'&&!state.pendingScenes.includes(view.chapter.id))section.append(sceneEntry(view.chapter.id));
    return section;
  };
  content.append(chapterSection(latest,true));
  if(chapters.length>1){
    const earlier=group('chapters','Earlier chapters');
    for(const view of [...chapters].reverse())if(view!==latest)earlier.append(chapterSection(view,false));
    content.append(earlier);
  }
  const conversations=group('conversations','Earlier conversations');
  const completed=quests.filter(view=>view.status==='complete'&&people.some(person=>person.id===view.quest.character))
    .sort((a,b)=>state.completedQuests.indexOf(b.quest.id)-state.completedQuests.indexOf(a.quest.id));
  for(const {quest} of completed){
    // A pending reply keeps the whole conversation under Unread scenes, once.
    if(state.pendingScenes.includes(quest.id))continue;
    const section=element('section','quest-journal');
    if(quest.completion.length){
      const replay=sceneEntry(quest.id);replay.lastElementChild!.textContent=character(quest.character).name;section.append(replay);
    }else{
      // The supper has no reply. Its opening stays separate from the finale.
      section.append(element('h4','',quest.title));
      const opening=button('Read quest','text-button',()=>showStory({title:quest.title,dialogue:quest.opening,questCharacter:quest.character,questId:quest.id},false,'',returnTo(`opening-${quest.id}`)));
      opening.dataset.journal=`opening-${quest.id}`;opening.dataset.quest=quest.id;opening.setAttribute('aria-label',`Read quest: ${quest.title}`);section.append(opening);
    }
    conversations.append(section);
  }
  for(const quest of data.quests){
    const news=quest.followUp;
    if(!news||deliveriesSince(state,quest.id)<news.afterDeliveries||state.pendingScenes.includes(news.id))continue;
    const section=element('section','quest-journal');section.append(element('h4','','Local news'),sceneEntry(news.id));conversations.append(section);
  }
  if(supperComplete(state,data)&&!state.pendingScenes.includes(data.finale.id)){
    const section=element('section','quest-journal');section.append(element('h4','','The finale'),sceneEntry(data.finale.id));conversations.insertBefore(section,conversations.children[1]??null);
  }
  if(conversations.querySelector('section'))content.append(conversations);
  const neighbours=group('neighbours','Neighbours');
  const meet=(person: Character)=>showStory({title:`Meet ${person.name}`,dialogue:[{speaker:person.id,text:person.introduction}],questCharacter:person.id},false,'',returnTo(person.id));
  // A neighbour who has not arrived is an unnamed outline. Arrival scenes are above; these rows always open introductions.
  for(const {person,arrived,delivered} of resolveNeighbours(state,data)){
    if(!arrived){const slot=element('div','journal-entry neighbour-entry not-yet');slot.append(element('span','portrait-outline'),element('span','','Not yet'));neighbours.append(slot);continue;}
    const entry=button('','journal-entry neighbour-entry',()=>meet(person));
    const likes=person.prefers?`Favourites: ${names.format(person.prefers.map(chain=>data.chains.find(value=>value.id===chain)!.name))}`:'';
    const words=element('span','neighbour-words');words.append(element('strong','',person.name),element('span','',person.role));if(likes)words.append(element('span','',likes));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',`Meet ${person.name}`);
    entry.setAttribute('aria-description',`${person.role}${likes?`. ${likes}`:''}. ${delivered} ${delivered===1?'quest':'quests'} delivered.`);
    entry.append(portrait(person.id),words,element('span','',`${delivered} ${delivered===1?'quest':'quests'}`));neighbours.append(entry);
  }
  for(const person of people.filter(value=>value.visitor)){
    const entry=button('','journal-entry neighbour-introduction',()=>meet(person));
    entry.dataset.journal=person.id;entry.setAttribute('aria-label',`Meet ${person.name}`);
    entry.append(portrait(person.id),element('strong','',person.name),element('span','',person.role));neighbours.append(entry);
  }
  content.append(neighbours);
  const focus=focusEntry?content.querySelector<HTMLElement>(`[data-journal="${focusEntry}"]`)??heading:undefined;
  const parent=focus?.closest('details');if(parent)parent.open=true;
  showModal('Story journal',content,focus);modal.scrollTop=focusEntry?scrollTop:0;
  // Reading can move an unread row into a group. Keep the returned focus visible at its new position.
  if(focus){const box=focus.getBoundingClientRect(),frame=modal.getBoundingClientRect();if(box.top<frame.top||box.bottom>frame.bottom)focus.scrollIntoView({block:'nearest'});}
}
$('#story-button').addEventListener('click',()=>data&&showModal('Our little bistro',storyContent(true)));
