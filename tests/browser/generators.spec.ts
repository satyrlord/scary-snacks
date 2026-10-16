import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, legacyOrderReward, reduceGame, unresolvedObstacle, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, PREVIOUS_SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
function afterPreparations(count: number){
  let state=createGame(data);state.coins=100000;
  Object.assign(state,data.tasks[Math.min(count,data.tasks.length-1)].goals);
  for(let index=0;index<count;index++){
    const result=reduceGame(state,{type:'task'},data);expect(result.ok,result.message).toBe(true);state=result.state;
  }
  state.coins=count<data.tasks.length?data.tasks[count].cost:0;return state;
}
async function start(page: Page,state: GameState){
  const save=exportSave(state,candidate=>validateGame(candidate,data));
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,save]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState>{
  return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);
}
const take=(page: Page,code: string)=>page.getByRole('button',{name:`Take ${data.items[code].name}`,exact:true});
const source=(page: Page,state: GameState,chain='bakery')=>page.locator(`[data-cell="${state.board.findIndex(cell=>cell?.code===`generator_${chain}`)}"]`);
async function appearance(page: Page,mode: string){
  await page.getByRole('button',{name:/House book/}).first().click();
  await page.getByRole('radio',{name:mode,exact:true}).check();await page.getByRole('button',{name:'Close dialog'}).click();
}

for(const [preparations,stage] of [[12,2],[20,3]])test(`preparation ${preparations} names the new outputs only after payment`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const initial=afterPreparations(preparations-1);await start(page,initial);await source(page,initial).click();
  await expect(page.locator('#item-detail .take-button')).toHaveCount(stage-1);
  const covered=page.locator('#story,#status,#item-detail');
  for(const chain of data.chains){
    const name=data.items[`${chain.id}_${stage}`].name;
    await expect(take(page,`${chain.id}_${stage}`)).toHaveCount(0);
    expect((await covered.allTextContents()).join(' ')).not.toContain(name);
  }
  const before=await saved(page);await page.locator('#story').getByRole('button',{name:/^Pay /}).click();
  for(const chain of data.chains){
    await expect(page.locator('.completion-message')).toContainText(`The ${data.items[`generator_${chain.id}`].name} can now make ${data.items[`${chain.id}_${stage}`].name}.`);
  }
  const paid=await saved(page);expect(paid.taskIndex).toBe(preparations);expect(paid.orders).toEqual(before.orders);
  expect(paid.board).toEqual(before.board);expect(paid.outputChoices).toEqual(before.outputChoices);
  await page.keyboard.press('Escape');await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
  await source(page,paid).click();await expect(page.locator('#item-detail .take-button')).toHaveCount(stage);
  await expect(take(page,`bakery_${stage}`)).toBeVisible();
  for(let lower=1;lower<=stage;lower++)await expect(take(page,`bakery_${lower}`).locator('.food')).toBeVisible();
});

test('keyboard takes keep focus, preserve the seed, and can return to a lower output',async({page})=>{
  const initial=afterPreparations(20);await start(page,initial);await appearance(page,'Light');await source(page,initial).click();
  const before=await saved(page);const button=take(page,'bakery_3');await button.focus();
  for(const key of ['Enter','Space']){
    await page.keyboard.press(key);await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-pressed','true');
    await expect(button).toHaveCSS('outline-width','3px');await expect(button).toHaveCSS('outline-offset','3px');
    await expect(button).toHaveCSS('outline-color','rgb(39, 109, 108)');
    // The chosen ring stays visible under the focus ring.
    await expect(button).toHaveCSS('box-shadow',/4px inset$/);
  }
  const higher=await saved(page);expect(higher.outputChoices).toEqual({bakery:'bakery_3'});expect(higher.seed).toBe(before.seed);
  expect(higher.board.filter(cell=>cell?.code==='bakery_3')).toHaveLength(before.board.filter(cell=>cell?.code==='bakery_3').length+2);
  await take(page,'bakery_1').focus();await page.keyboard.press('Enter');await expect(take(page,'bakery_1')).toBeFocused();
  expect((await saved(page)).outputChoices).toEqual({});await expect(take(page,'bakery_3')).toHaveAttribute('aria-pressed','false');
  await expect(take(page,'bakery_3')).toHaveCSS('box-shadow','none');
});

for(const viewport of [{width:360,height:740},{width:390,height:844},{width:412,height:915}])test(`a second tap on an upgraded source takes again at ${viewport.width} by ${viewport.height} because the board stays still`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
  const initial=afterPreparations(20);await start(page,initial);
  const cell=source(page,initial,'pantry'),before=(await cell.boundingBox())!,x=before.x+before.width/2,y=before.y+before.height/2;
  await page.mouse.click(x,y);await expect(page.locator('#item-detail .take-button')).toHaveCount(3);
  expect(await cell.boundingBox()).toEqual(before);
  await page.mouse.click(x,y);const after=await saved(page);
  expect(after.board.findIndex(value=>value?.code==='generator_pantry')).toBe(initial.board.findIndex(value=>value?.code==='generator_pantry'));
  expect(after.board.filter(Boolean)).toHaveLength(initial.board.filter(Boolean).length+2);
});

test('a pointer choice survives pantry storage, retrieval, and reload',async({page})=>{
  const initial=afterPreparations(20);await start(page,initial);await source(page,initial).click();await take(page,'bakery_2').click();
  await page.getByRole('button',{name:'Store',exact:true}).click();const stored=await saved(page);
  expect(stored.inventory).toContainEqual({code:'generator_bakery'});expect(stored.outputChoices).toEqual({bakery:'bakery_2'});
  await page.reload();await expect(page.getByRole('button',{name:'Return Flour bin to the board',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Return Flour bin to the board',exact:true}).click();const retrieved=await saved(page);
  const count=retrieved.board.filter(cell=>cell?.code==='bakery_2').length;await source(page,retrieved).click();
  const taken=await saved(page);expect(taken.board.filter(cell=>cell?.code==='bakery_2')).toHaveLength(count+1);
  await expect(take(page,'bakery_2')).toHaveAttribute('aria-pressed','true');expect(taken.outputChoices).toEqual(stored.outputChoices);
  await page.reload();expect(await saved(page)).toEqual(taken);
});

test('a full board rejects another output without changing the saved choice',async({page})=>{
  const initial=afterPreparations(20);initial.outputChoices={bakery:'bakery_2'};
  initial.board=initial.board.map((cell,index)=>cell??(unresolvedObstacle(initial,index,data)?null:{code:'bakery_1'}));await start(page,initial);await source(page,initial).click();
  await take(page,'bakery_3').click();await expect(page.locator('#status')).toContainText('The board is full.');
  expect(await saved(page)).toEqual(initial);await expect(take(page,'bakery_2')).toHaveAttribute('aria-pressed','true');
  await expect(take(page,'bakery_3')).toHaveAttribute('aria-pressed','false');
});

test('an envelope two save keeps its pantry source and starts its choice at stage one',async({page})=>{
  const initial=afterPreparations(20);const moved=reduceGame(initial,{type:'store',index:initial.board.findIndex(cell=>cell?.code==='generator_bakery')},data);
  expect(moved.ok).toBe(true);const {outputChoices: _choices,claimedLevelRewards: _claims,completedQuests: _quests,legacySatisfiedQuests: _legacy,activeQuestProducers: _producers,layoutId: _layout,resolvedObstacles: _resolved,...previous}=moved.state;
  previous.orders=previous.orders.map(({pricing:_pricing,...order})=>({...order,reward:legacyOrderReward(order.requirements,data)}));
  const old=JSON.stringify({format:'scary-snacks',version:2,state:{...previous,version:3}});
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[PREVIOUS_SAVE_KEY,old]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
  await page.getByRole('button',{name:'Return Flour bin to the board',exact:true}).click();const retrieved=await saved(page);
  expect(retrieved.outputChoices).toEqual({});expect(retrieved.orders).toEqual(previous.orders);expect(retrieved.taskIndex).toBe(20);
  await source(page,retrieved).click();await expect(page.locator('#item-detail .take-button')).toHaveCount(3);
  await expect(take(page,'bakery_1')).toHaveAttribute('aria-pressed','true');
  const current=await saved(page);await page.reload();expect(await saved(page)).toEqual(current);
  expect(await page.evaluate(key=>localStorage.getItem(key),PREVIOUS_SAVE_KEY)).toBe(old);
});

test('touch takes the chosen output with reduced motion',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();const initial=afterPreparations(20);await start(page,initial);
    await source(page,initial).tap();await take(page,'bakery_3').tap();const before=await saved(page);await source(page,before).tap();
    const after=await saved(page);expect(after.board.filter(cell=>cell?.code==='bakery_3')).toHaveLength(before.board.filter(cell=>cell?.code==='bakery_3').length+1);
    await expect(take(page,'bakery_3')).toHaveAttribute('aria-pressed','true');
    expect(await page.locator('#board').evaluate(board=>board.getAnimations({subtree:true}).length)).toBe(0);
  }finally{await context.close();}
});

for(const mode of ['Light','Dark'])for(const viewport of [{width:360,height:740},{width:390,height:800},{width:390,height:844},{width:1440,height:900}]){
  test(`three output controls fit every source in ${mode} at ${viewport.width} by ${viewport.height}`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    const initial=afterPreparations(20);await start(page,initial);await appearance(page,mode);
    for(const chain of data.chains){
      await page.locator('[data-cell="0"]').focus();await page.keyboard.press('Escape');await source(page,initial,chain.id).click();
      const buttons=page.locator('#item-detail .take-button');await expect(buttons).toHaveCount(3);
      if(viewport.width===360||chain.id===data.chains[0].id)await page.screenshot({path:testInfo.outputPath(`${chain.id}-${mode.toLowerCase()}-${viewport.width}x${viewport.height}.png`)});
      const detail=(await page.locator('#item-detail').boundingBox())!;
      const board=(await page.locator('#board').boundingBox())!;expect(detail.y).toBeGreaterThanOrEqual(board.y+board.height-1);
      if(await page.locator('#room-pin').isVisible()){
        const pin=(await page.locator('#room-pin').boundingBox())!,areas=(await page.locator('#area-switch').boundingBox())!;
        expect(pin.x<areas.x+areas.width&&areas.x<pin.x+pin.width&&pin.y<areas.y+areas.height&&areas.y<pin.y+pin.height,JSON.stringify({pin,areas})).toBe(false);
      }
      const boxes=[];
      for(let stage=1;stage<=3;stage++){
        const button=take(page,`${chain.id}_${stage}`);await expect(button).toBeVisible();await expect(button.locator('.food')).toBeVisible();
        const box=(await button.boundingBox())!;boxes.push(box);
        expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.x+box.width).toBeLessThanOrEqual(detail.x+detail.width+1);
        expect(box.y+box.height).toBeLessThanOrEqual(detail.y+detail.height+1);
        const label=button.locator('.take-label'),name=data.items[`${chain.id}_${stage}`].name;
        expect(await label.innerText()).toBe(viewport.width<1024?name:`Take ${name}`);
        expect(await label.evaluate(element=>element.scrollWidth<=element.clientWidth+1&&element.scrollHeight<=element.clientHeight+1)).toBe(true);
        // The label stays inside the 4px chosen ring.
        const inner=(await label.boundingBox())!;expect(inner.y).toBeGreaterThanOrEqual(box.y+4);expect(inner.y+inner.height).toBeLessThanOrEqual(box.y+box.height-4);
      }
      for(let index=1;index<boxes.length;index++)expect(boxes[index].x).toBeGreaterThanOrEqual(boxes[index-1].x+boxes[index-1].width);
      // Phones keep the outputs, Store, and Clear in one row; wider screens put the outputs in a second row.
      for(const action of await page.locator('#item-detail .item-actions button').all()){
        const box=(await action.boundingBox())!;
        if(viewport.width<1024){expect(box.x).toBeGreaterThanOrEqual(boxes[2].x+boxes[2].width);expect(box.y).toBeLessThan(boxes[0].y+boxes[0].height);expect(box.y+box.height).toBeGreaterThan(boxes[0].y);}
        else expect(box.y+box.height).toBeLessThanOrEqual(boxes[0].y+1);
      }
      if(viewport.width<1024){
        const bar=(await page.locator('.phone-bar').boundingBox())!;expect(detail.y+detail.height).toBeLessThanOrEqual(bar.y+1);
        expect((await page.locator('[data-cell="0"]').boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    }
  });
}

for(const width of [320,360,390])test(`stage one source names and controls fit at ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:740});await page.emulateMedia({reducedMotion:'reduce'});
  const initial=afterPreparations(6);await start(page,initial);
  for(const chain of data.chains){
    await page.locator('[data-cell="0"]').focus();await page.keyboard.press('Escape');await source(page,initial,chain.id).click();
    await page.screenshot({path:testInfo.outputPath(`${chain.id}-stage-one-${width}.png`)});
    const name=page.locator('#item-detail h3');await expect(name).toHaveText(data.items[`generator_${chain.id}`].name);
    expect(await name.evaluate(element=>element.scrollWidth<=element.clientWidth+1&&element.scrollHeight<=element.clientHeight+1)).toBe(true);
    await expect(page.locator('#item-detail .take-button')).toHaveCount(1);
    const detail=(await page.locator('#item-detail').boundingBox())!;
    for(const action of await page.locator('#item-detail button').all()){
      const box=(await action.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(detail.x-1);
      expect(box.x+box.width).toBeLessThanOrEqual(detail.x+detail.width+1);
      expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
