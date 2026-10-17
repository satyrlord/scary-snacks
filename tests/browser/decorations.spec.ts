import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { checkpoint, data, deliverButton, deliverable, exportText, failWrites, opened, options, quest, restoreWrites, saved, start, startAgainAndImport, toast, KEY } from './support.ts';

const finish=(page: Page,slot: string)=>page.locator(`#room-finishes .room-finish[data-slot="${slot}"]`);
const layer=(page: Page,slot: string,variant: string)=>page.locator(`#room-decorations svg[data-slot="${slot}"][data-variant="${variant}"]`);
const slotOf=(id: string)=>data.decorationSlots.find(slot=>slot.id===id)!;
/** The label of a finish switch: the slot, its current finish, and the finish that a press gives. */
function label(id: string,current: string){
  const slot=slotOf(id),names=slot.variants.map(variant=>variant.id),next=names[(names.indexOf(current)+1)%names.length];
  return `${slot.name}: ${slot.variants.find(variant=>variant.id===current)!.name}. Switch to ${slot.variants.find(variant=>variant.id===next)!.name}`;
}
async function waitForArt(page: Page) {
  await page.locator('#room-frame svg image').evaluateAll(async elements=>Promise.all(elements.map(async element=>{
    const image=new Image();image.src=element.getAttribute('href')!;await image.decode();
  })));
}
async function begin(page: Page,state=checkpoint(24),theme='light'){await page.emulateMedia({reducedMotion:'reduce'});await start(page,state,theme);}

test('finish switches cannot take focus outside the visible room crop on a phone',async({page})=>{
  await page.setViewportSize({width:390,height:844});await begin(page,checkpoint(10));
  const tableware=finish(page,'tableware');
  expect(await tableware.evaluate(element=>element.getBoundingClientRect().bottom<document.querySelector('#room-stage')!.getBoundingClientRect().top)).toBe(true);
  await expect(tableware).toHaveAttribute('inert','');
  await tableware.evaluate(element=>(element as HTMLElement).focus());await expect(tableware).not.toBeFocused();
  await page.locator('#drawer-handle').click();await expect(tableware).not.toHaveAttribute('inert','');
  await tableware.focus();await page.keyboard.press('Enter');await expect(layer(page,'tableware','green')).toHaveCount(1);
  await page.locator('#drawer-handle').click();await expect(tableware).toHaveAttribute('inert','');
});

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844}])for(const theme of ['light','dark']){
  test(`room finish switches change each finish durably at ${viewport.name} in ${theme}`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);await begin(page,checkpoint(24),theme);const before=await saved(page);
    // On a phone the drawer lowers, so the whole painting and its switches show.
    if(viewport.name==='phone')await page.locator('#drawer-handle').click();
    await expect(page.locator('#room-frame')).toHaveAttribute('data-area','front-room');
    await expect(page.locator('#room-finishes .room-finish')).toHaveCount(2);
    const tableware=finish(page,'tableware');await expect(tableware).toHaveAccessibleName(label('tableware','blue'));
    for(const slot of ['tableware','flowers']){
      const box=(await finish(page,slot).boundingBox())!,room=(await page.locator('#room-stage').boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(room.x);expect(box.x+box.width).toBeLessThanOrEqual(room.x+room.width);
      await expect(finish(page,slot)).toBeInViewport();
    }
    await tableware.click();await expect(page.locator('#status')).toHaveText('Tableware: Green bowls.');
    await expect(layer(page,'tableware','green')).toHaveCount(1);await expect(tableware).toHaveAccessibleName(label('tableware','green'));await expect(tableware).toBeFocused();
    expect(await saved(page)).toEqual({...before,decorationChoices:{tableware:'green'}});
    await finish(page,'flowers').click();await expect(layer(page,'flowers','lilacs')).toHaveCount(1);
    const committed=await saved(page);expect(committed.decorationChoices).toEqual({tableware:'green',flowers:'lilacs'});
    await waitForArt(page);await page.screenshot({path:testInfo.outputPath('front-room.png')});
    await page.reload();await opened(page);expect(await saved(page)).toEqual(committed);
    await expect(layer(page,'tableware','green')).toHaveCount(1);await expect(layer(page,'flowers','lilacs')).toHaveCount(1);
    await expect(finish(page,'flowers')).toHaveAccessibleName(label('flowers','lilacs'));
    if(viewport.name==='phone')await page.locator('#drawer-handle').click();
    await page.getByRole('button',{name:'Courtyard',exact:true}).click();await expect(page.locator('#room-finishes .room-finish')).toHaveCount(1);
    await finish(page,'textiles').click();await expect(layer(page,'textiles','blue')).toHaveCount(1);await expect(finish(page,'textiles')).toHaveAccessibleName(label('textiles','blue'));
    await waitForArt(page);await page.screenshot({path:testInfo.outputPath('courtyard.png')});
    // A second press returns to the default finish, which the save does not record.
    await finish(page,'textiles').click();await expect(layer(page,'textiles','blue')).toHaveCount(0);expect((await saved(page)).decorationChoices).toEqual({tableware:'green',flowers:'lilacs'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('a finish switch appears only once its quest is delivered and its preparation is done',async({page})=>{
  const bowls=quest('eszter-green-bowls');expect(bowls.unlocks).toEqual({slot:'tableware',variant:'green'});
  // The preparation is done, but the quest that offers the green bowls is not delivered yet.
  await begin(page,deliverable(bowls));await expect(page.locator('#room-frame')).toHaveAttribute('data-area','front-room');
  expect((await saved(page)).decorations).toContain(slotOf('tableware').unlock);await expect(page.locator('#room-finishes .room-finish')).toHaveCount(0);
  await deliverButton(page,bowls).click();await expect(toast(page)).toHaveText(`${bowls.title}: delivered. Earned ${bowls.reward} coins.`);
  await expect(finish(page,'tableware')).toHaveAccessibleName(label('tableware','blue'));
  await page.reload();await opened(page);await expect(finish(page,'tableware')).toHaveCount(1);
});

test('a delivered quest gives no switch before the preparation that unlocks its place',async({page})=>{
  const lilacs=quest('sanziana-lilacs'),state=checkpoint(23,{ready:true});
  expect(state.completedQuests).toContain(lilacs.id);expect(state.decorations).not.toContain(slotOf('flowers').unlock);
  await begin(page,state);await page.getByRole('button',{name:'Front room',exact:true}).click();await expect(page.locator('#room-frame')).toHaveAttribute('data-area','front-room');
  await expect(finish(page,'tableware')).toHaveCount(1);await expect(finish(page,'flowers')).toHaveCount(0);
});

test('a failed finish write keeps the earlier finish, and a later press saves it',async({page})=>{
  await begin(page);const before=await saved(page),tableware=finish(page,'tableware');
  await failWrites(page);await tableware.click();
  await expect(page.locator('#status')).toContainText('The choice was not saved. Your previous choice stays.');
  expect(await saved(page)).toEqual(before);await expect(layer(page,'tableware','green')).toHaveCount(0);await expect(tableware).toHaveAccessibleName(label('tableware','blue'));
  await restoreWrites(page);await tableware.click();
  await expect(layer(page,'tableware','green')).toHaveCount(1);expect((await saved(page)).decorationChoices).toEqual({tableware:'green'});
});

test('finishes survive export and import',async({page})=>{
  await begin(page);await finish(page,'tableware').click();await expect(layer(page,'tableware','green')).toHaveCount(1);
  const committed=await saved(page);await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(committed);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(committed);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(committed);await expect(layer(page,'tableware','green')).toHaveCount(1);
  await expect(finish(page,'tableware')).toHaveAccessibleName(label('tableware','green'));
});

test('a finish chosen in another tab shows in this tab',async({page,context})=>{
  await begin(page);const other=await context.newPage();await other.goto('./');await opened(other);
  await finish(other,'tableware').click();await expect(layer(other,'tableware','green')).toHaveCount(1);
  await expect(page.locator('#status')).toContainText('another tab');await expect(layer(page,'tableware','green')).toHaveCount(1);
  await expect(finish(page,'tableware')).toHaveAccessibleName(label('tableware','green'));await other.close();
});

test('a finish press waits for the shared save lock and then saves once',async({page,context})=>{
  await begin(page);const before=await saved(page),other=await context.newPage();await other.goto('./');await opened(other);
  await other.evaluate(key=>{
    void navigator.locks.request(key,async()=>{
      document.body.dataset.locked='';await new Promise<void>(resolve=>document.addEventListener('release-test-lock',()=>resolve(),{once:true}));
    });
  },KEY);
  await expect(other.locator('body')).toHaveAttribute('data-locked','');
  await finish(page,'tableware').click();expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,KEY)).toEqual(before);
  await other.evaluate(()=>document.dispatchEvent(new Event('release-test-lock')));
  await expect(layer(page,'tableware','green')).toHaveCount(1);expect((await saved(page)).decorationChoices).toEqual({tableware:'green'});await other.close();
});
