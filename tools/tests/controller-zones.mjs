import assert from 'node:assert/strict';

export const overlaps = (a,b) => a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

// Shared by every game's phone tests: inspect real hit targets, not just the
// bounding boxes of the old circular button artwork.
export async function assertControllerLayout(page, viewport) {
  const single = await page.locator('#controller').getAttribute('data-action-layout') === 'single';
  const ids = ['joystick-zone', 'button-a', ...(single ? [] : ['button-b']), 'button-start', 'button-select'];
  const boxes = await Promise.all(ids.map(id => page.locator('#' + id).boundingBox()));
  for (const box of boxes) assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `Control outside viewport: ${JSON.stringify({viewport, box})}`);
  const actions = boxes.slice(1, single ? 2 : 3);
  for (const box of actions) {
    assert.ok(Math.abs(box.x - viewport.width * 2 / 3) < 1);
    assert.ok(Math.abs(box.width - viewport.width / 3) < 1);
    assert.ok(Math.abs(box.height - viewport.height / (single ? 1 : 2)) < 1);
  }
  for (const id of ['button-start', 'button-select', 'button-a', ...(single ? [] : ['button-b'])]) {
    assert.equal(await page.locator('#' + id).evaluate(el => { const r=el.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2).closest('button').id; }), id, 'Menu and action controls remain reachable above the floating stick');
  }
  const header = await Promise.all(['.brand','.connection','#fullscreen'].map(selector=>page.locator(selector).boundingBox()));
  for(const box of header.filter(Boolean))assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width*2/3+.5&&box.y+box.height<=viewport.height+.5,'Header stays in the movement side');
  for(let i=0;i<header.length;i++)for(let j=i+1;j<header.length;j++)if(header[i]&&header[j])assert.ok(!overlaps(header[i],header[j]),'Header labels and fullscreen do not overlap');
  assert.ok(await page.locator('.header').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Header contents fit');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
  assert.equal(await page.locator('#joystick-zone').evaluate(el=>getComputedStyle(el).touchAction), 'none');
  const overflow = await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  assert.ok(overflow.width <= viewport.width && overflow.height <= viewport.height, 'No page scrolling');
}

export async function verifyBlindTouchZones(page) {
  const single = await page.locator('#controller').getAttribute('data-action-layout') === 'single';
  const {width, height} = page.viewportSize();
  const cdp = await page.context().newCDPSession(page), touches = new Map();
  const input = async expected => page.waitForFunction(expected => {
    const state=window.__sent.filter(x=>x.type==='input').at(-1);
    return state && Object.entries(expected).every(([k,v])=>state[k]===v);
  }, expected, {timeout:5000}).catch(async error => { throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(await page.evaluate(()=>window.__sent.filter(x=>x.type==='input').at(-1)))}`, {cause:error}); });
  async function touch(type,id,x,y) {
    if (type === 'touchEnd') {
      await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[touches.get(id)]});
      touches.delete(id); return;
    }
    else if (type === 'touchCancel') touches.clear();
    else touches.set(id,{id,x,y,radiusX:3,radiusY:3,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...touches.values()]});
  }
  // Screen edges and either side of the divider must all trigger the action.
  for (const x of [width*2/3+2,width-2]) for (const y of [2,height/2-2,height/2+2,height-2]) {
    await touch('touchStart',1,x,y);
    await input({a:single||y>=height/2,b:!single&&y<height/2}).catch(async error=>{throw new Error(`Touch at ${x},${y}: ${await page.evaluate(({x,y})=>document.elementFromPoint(x,y).outerHTML,{x,y})}`,{cause:error});});
    await touch('touchEnd',1); await input({a:false,b:false});
  }
  // A held pointer stays with its original action when the thumb crosses the
  // divider. A second finger can hold the other action or the same single zone.
  await touch('touchStart',1,20,height*.55);
  await touch('touchMove',1,150,height*.55); await input({x:1,y:0});
  await touch('touchStart',2,width-30,height*.2);
  await touch('touchMove',2,width-30,height*.8);
  await input({x:1,a:single,b:!single});
  await touch('touchStart',3,width-60,height*.75);
  await input({x:1,a:true,b:!single});
  await touch('touchEnd',2); await input({x:1,a:true,b:false});
  await touch('touchEnd',1); await input({x:0,y:0,a:true});
  await touch('touchCancel'); await input({x:0,y:0,a:false,b:false});
  // A real long press on the label must neither select text nor drop input.
  await touch('touchStart',1,width*5/6,height*.75);
  await page.waitForTimeout(650); await input({a:true});
  assert.equal(await page.evaluate(()=>String(window.getSelection())), '');
  await touch('touchEnd',1); await input({a:false,b:false});
  const suppression=await page.evaluate(()=>{
    const label=document.getElementById('a-caption');
    return ['selectstart','contextmenu','dragstart'].map(name=>!label.dispatchEvent(new Event(name,{bubbles:true,cancelable:true})));
  });
  assert.deepEqual(suppression,[true,true,true]);
  assert.equal(await page.locator('#a-caption').evaluate(el=>getComputedStyle(el).userSelect),'none');
  // Older WebViews may reject pointer capture: outside releases still neutralize.
  await page.locator('#button-a').dispatchEvent('pointerdown',{pointerId:901,pointerType:'touch',button:0});
  await input({a:true});
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:901})));
  await input({a:false});
  await cdp.detach();
}
