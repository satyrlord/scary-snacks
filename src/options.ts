// Options: appearance, motion, sound, the saved game with its export, import, and recovery, a fresh start, and the version.
import type { GameState } from './model.ts';
import { exportSave, importSave, loadSave, resetSave, MAX_SAVE_BYTES } from './storage.ts';
import { $, button, coinText, count, element, reason, status } from './dom.ts';
import { modal, showModal } from './dialog.ts';
import { adopt, changeGame, data, newGame, onRecovery, persist, recoveryRequired, saveFailed, saveMessage, state, validate } from './session.ts';
import { MOTIONS, THEMES, motion, motionNote, setMotion, setTheme, soundToggle, storage, theme } from './preferences.ts';
import { showScene } from './story.ts';

function downloadSave() {
  try { const url=URL.createObjectURL(new Blob([exportSave(state,validate)],{type:'application/json'}));const link=element('a');link.href=url;link.download='scary-snacks-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  catch(error) { showModal('Save export failed',element('p','save-error',reason(error))); }
}
/** A setting in Options: a segmented radio group with its legend and one line of explanation. */
function segmented(name: string, legend: string, note: string, values: string[][], current: string, choose: (value: string) => void) {
  const section=element('section','settings-section'),choices=element('fieldset','choice-fieldset'),group=element('div','choice-group');
  for(const [value,label] of values) {
    const choice=element('label','choice');const input=element('input');input.type='radio';input.name=name;input.value=value;input.checked=current===value;
    input.addEventListener('change',()=>choose(value));choice.append(input,element('span','',label));group.append(choice);
  }
  const description=element('p','',note);description.id=`${name}-note`;
  choices.append(element('legend','',legend),description,group);section.append(choices);return section;
}
/** Options: appearance, motion, sound, the saved game, About Scary Snacks, a fresh start, and the version. */
export function options() {
  const content=element('div');content.append(element('p','modal-copy save-status',saveMessage));
  // Writes never replace an unreadable save, so only an import or a new game (an explicit replacement) lets this browser save again.
  if(saveFailed&&recoveryRequired)content.append(element('p','save-error',['invalid','unsupported'].includes(loadSave(storage,validate).status)?`${saveMessage} To save in this browser again, import a saved game or start a new game below. That replaces the unreadable save.`:saveMessage));
  if(recoveryRequired)content.append(button('Retry saved game','primary-button',()=>location.reload()));
  else if(saveFailed&&storage)content.append(button('Retry save','secondary-button',()=>changeGame(()=>{persist();options();status(saveFailed?`This session is not saved. ${saveMessage}`:'Your progress is saved in this browser.');})));
  content.append(segmented('appearance','Appearance','System follows your device’s light or dark setting.',THEMES,theme,value=>setTheme(value,true)),
    segmented('motion','Motion',motionNote(),MOTIONS,motion,value=>setMotion(value,true)));
  const audio=element('section','settings-section');audio.append(element('h3','','Kitchen sounds'),element('p','','Soft tones for merging, delivering, and finishing preparations. Sound stays off until you turn it on.'),soundToggle());content.append(audio);
  const saves=element('section','settings-section');saves.append(element('h3','','Your saved game'),element('p','','Export a copy to keep it safe or to carry on in another browser.'));
  const actions=element('div','settings-actions');actions.append(button('Export saved game','secondary-button',downloadSave));
  const file=element('input','hidden');file.type='file';file.accept='.json,application/json';
  file.addEventListener('change',async()=>{
    const selectedFile=file.files?.[0];if(!selectedFile)return;
    try {
      if(selectedFile.size>MAX_SAVE_BYTES)throw new Error(`Select a saved game smaller than ${MAX_SAVE_BYTES / 2 ** 20} MiB.`);
      const candidate=importSave<GameState>(await selectedFile.text(),validate);
      const progress=candidate.prologue?`the prologue, at ${data.prologue.events[candidate.prologue.event-1].title.replace(/^The /,'the ')}`:`${coinText(candidate.coins)} and ${count.format(candidate.taskIndex)} of ${data.tasks.length} payments done`;
      const review=element('div');review.append(element('p','modal-copy',`Replace the current game with this saved game: ${progress}? Export the current game first if you want to keep it.`));
      const keep=button('Keep the current game','secondary-button',options),choice=element('div','settings-actions');
      // A confirmed import is an explicit replacement, like a new game, so it also replaces an unreadable save.
      choice.append(button('Import this saved game','primary-button',()=>changeGame(()=>{
        const result=resetSave(storage,candidate,validate);if(!result.ok){showModal('Import failed',element('p','save-error',result.error ?? ''));return;}
        adopt(candidate,result);modal.close();status('Saved game imported.');
      },true)),keep);review.append(choice);showModal('Import saved game',review,keep);
    }catch(error){showModal('Cannot import this file',element('p','save-error',reason(error)));}
  });
  actions.append(button('Import saved game','secondary-button',()=>file.click()),file);saves.append(actions);content.append(saves);
  const about=element('section','settings-section');about.append(element('h3','','About Scary Snacks'),element('p','','Original setting, characters, dialogue, progression, and AI-generated artwork made for this project. No advertising, payments, accounts, or remote game services.'));content.append(about);
  const reset=element('section','settings-section');reset.append(element('h3','','A fresh start'),element('p','','Erase this game from this browser and start again. Exported files and your appearance and motion settings stay.'),button('Start a new game','danger-button',()=>{
    // The safe choice holds focus, so a stray Enter keeps the game.
    const keep=button('Keep this game','secondary-button',options),choice=element('div','settings-actions');
    choice.append(button('Erase and start again','danger-button',()=>changeGame(()=>{
      const fresh=newGame(),result=resetSave(storage,fresh,validate);if(!result.ok){showModal('Reset failed',element('p','save-error',result.error ?? ''));return;}
      adopt(fresh,result);modal.close();status('The kitchen is ready for a fresh start.');
      // A new game opens the first scene of the prologue at once.
      showScene(fresh.pendingScenes[0]);
    },true)),keep);
    const confirm=element('div');confirm.append(element('p','modal-copy','This erases the dishes, coins, story progress, discoveries, and decoration finishes saved in this browser. Export a copy first if you want to keep this game.'),choice);showModal('Start a new game?',confirm,keep);
  }));content.append(reset);
  // The build writes the version into the page.
  const version=$<HTMLMetaElement>('meta[name="app-version"]').content;if(version)content.append(element('p','app-version',`Version ${version}`));
  showModal('Options',content,modal.open?undefined:$('#close-modal'));
}
onRecovery(()=>{if(modal.open&&$('#modal-title').textContent==='Options')options();});
for(const opener of document.querySelectorAll('[data-options]'))opener.addEventListener('click',()=>data&&options());
