// The one dialog of the game. A dialog can name a way back, which Close and Escape then take.
import { $ } from './dom.ts';

export const modal = $<HTMLDialogElement>('#modal');
let modalReturn: (() => void) | null = null;
let backdropPress = false;
/** Opens the dialog, or replaces what an open dialog shows. Replacing removes the focused control, so focus moves to the given control or to the new title, which screen readers then read. */
export function showModal(title: string, content: Node, focus?: HTMLElement, back?: () => void) {
  const replacing=modal.open;
  modalReturn=back ?? null;
  backdropPress=false;
  $('#modal-title').textContent=title; $('#modal-body').replaceChildren(content);
  if(!modal.open)modal.showModal();
  if(focus)focus.focus();else if(replacing&&!modal.contains(document.activeElement))$('#modal-title').focus();
}
$('#close-modal').addEventListener('click',()=>modalReturn?modalReturn():modal.close());
modal.addEventListener('cancel',event=>{if(modalReturn){event.preventDefault();modalReturn();}});
modal.addEventListener('close',()=>{if(!modal.open)modalReturn=null;});
// Only the recipe book dismisses on the backdrop. Dialog padding is still inside the book.
const outsideModal=(event: MouseEvent)=>{
  const box=modal.getBoundingClientRect();
  return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;
};
modal.addEventListener('pointerdown',event=>{backdropPress=event.target===modal&&outsideModal(event);});
modal.addEventListener('pointercancel',()=>{backdropPress=false;});
modal.addEventListener('click',event=>{
  const dismiss=backdropPress;backdropPress=false;
  if(dismiss&&event.target===modal&&modal.querySelector('.recipe-content')&&outsideModal(event))modal.close();
});
