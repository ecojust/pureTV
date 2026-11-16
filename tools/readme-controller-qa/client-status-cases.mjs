import assert from 'node:assert/strict';

export const CLIENT_STATUS_SCOPE='controller client status acceptance';

function inside(rect,clip,label) {
  assert.ok(rect && rect.width>0 && rect.height>0,label+' has a non-empty rectangle');
  const tolerance=2;
  assert.ok(rect.left>=clip.left-tolerance && rect.top>=clip.top-tolerance && rect.right<=clip.right+tolerance && rect.bottom<=clip.bottom+tolerance,label+' is fully visible without clipping');
}

export function assertControllerClients(snapshot,expected) {
  const observed=snapshot.document?.controllerClients;
  assert.ok(observed && Array.isArray(observed.containers),'Fixed read-only controller DOM observation is available');
  const rows=observed.containers.filter(c=>c.visible).flatMap(c=>c.rows.filter(r=>r.visible));
  assert.equal(rows.length,expected.length,'Exactly the expected connected controller rows are visible');
  assert.equal(new Set(rows.map(r=>r.controllerId)).size,rows.length,'Visible identities are not duplicated');
  const viewport={left:0,top:0,right:snapshot.document.width,bottom:snapshot.document.height};
  for(const wanted of expected) {
    const row=rows.find(r=>r.controllerId===wanted.controllerId);
    assert.ok(row,'The visible ID is the real SDK controller_id '+wanted.controllerId);
    assert.equal(row.playerId,wanted.playerId,'ID has its actual seat');
    assert.ok(row.iconVisible,'A controller SVG icon is visible');
    assert.ok(row.idText?.includes(wanted.controllerId),'The full ID is visible text, not only an attribute');
    assert.ok(row.text.includes(wanted.playerId+'P'),'The player seat is visible text');
    inside(row.rect,viewport,'Controller row');inside(row.rect,row.clip,'Controller row');
    inside(row.idRect,row.idClip,'Full controller ID');
    assert.ok(row.idTextRects.length>0,'ID has rendered text');
    for(const range of row.idTextRects)if(range.width>0&&range.height>0)inside(range,row.idClip,'Every line of the controller ID');
    assert.ok(row.idScrollWidth<=row.idClientWidth+2,'ID has no hidden horizontal overflow');
    assert.ok(row.idScrollHeight<=row.idClientHeight+2,'ID has no hidden vertical overflow');
  }
  if(!expected.length)assert.equal(observed.containers.filter(c=>c.visible).length,0,'No controller strip remains visible when disconnected');
  return {visibleControllers:rows.map(r=>({controllerId:r.controllerId,playerId:r.playerId})),viewport:{width:snapshot.document.width,height:snapshot.document.height}};
}

export function visibleControllerClients(snapshot) {
  return (snapshot.document?.controllerClients?.containers||[]).filter(c=>c.visible).flatMap(c=>c.rows.filter(r=>r.visible));
}

// A natural settling interval is not a compositor fence. Keep the raw PNG and
// both fixed read-only DOM observations; the actual pixels still require review.
export async function captureControllerStatus(ctx,name,expected) {
  const {mode,report,read,delay,screenshot}=ctx;
  if(mode!=='android')return screenshot(name);
  const capture={file:name+'.png',status:'running',expected:expected.map(row=>({...row})),settleRequestedMs:1500,compositorFence:false,pixelReviewRequired:true};
  (report.controllerStatusCaptures??=[]).push(capture);
  async function observe(key) {
    const at=new Date().toISOString(),state=await read();
    capture[key]={at,phase:state.phase,paused:state.paused,controllerClients:state.document.controllerClients};
    assertControllerClients(state,expected);
  }
  try {
    await observe('beforeSettle');
    capture.settleStartedAt=new Date().toISOString();const started=performance.now();
    await delay(capture.settleRequestedMs);
    capture.settleFinishedAt=new Date().toISOString();capture.settleElapsedMs=performance.now()-started;
    await observe('before');
    capture.image=await screenshot(name);
    await observe('after');
    capture.domIdentityStable=true;
    capture.status='captured-awaiting-pixel-review';
    return capture.image;
  }catch(error){capture.status='failed';capture.error=error.stack;throw error;}
}

// Input must still come from the unchanged SDK. This module only reads state/DOM.
export async function statusAcceptance(ctx) {
  const {mode,kit,slug,report,test,read,until,waitFor,delay,trace,screenshot,setViewport,connectPad,disconnectPad,tap,controllers,startPeer}=ctx;
  const primaryHello=report.wire.find(e=>e.direction==='sdk-to-game'&&e.message.type==='hello');
  assert.ok(primaryHello && typeof primaryHello.message.controller_id==='string');
  const primaryId=primaryHello.message.controller_id;
  let expected=[{controllerId:primaryId,playerId:1}];
  async function ready(label,identities=expected) {
    await until(s=>visibleControllerClients(s).length===identities.length && identities.every(w=>visibleControllerClients(s).some(r=>r.controllerId===w.controllerId)),label);
    const state=await read();assertControllerClients(state,identities);return state;
  }
  async function captureSizes(prefix,identities=expected) {
    for(const size of mode==='browser'?[[960,540],[1280,720]]:[null]) {
      if(size){await setViewport(size);await delay(180);}
      const state=await ready(prefix,identities);
      assert.ok(state.document.scrollWidth<=state.document.width+1 && state.document.scrollHeight<=state.document.height+1,'Page stays within the viewport');
      trace(prefix+'-'+(size?size[0]:'android'),null,state);
      await captureControllerStatus(ctx,prefix+'-'+(size?size[0]:'android'),identities);
    }
  }
  await test('connected status displays the real SDK identity and controller icon',async()=>{
    const state=await until(s=>controllers(s).some(p=>p.connected&&p.controllerId===primaryId),'Native input cache sees real SDK identity');
    assert.equal(controllers(state).find(p=>p.controllerId===primaryId).id,1);
    await captureSizes('controller-connected');return {controllerId:primaryId,playerId:1};
  });
  if(!kit&&slug!=='alien-shooter')await test('two SDK identities display separate seats and update independently',async()=>{
    const peer=await startPeer();const connected=await peer.command({command:'connect'});
    assert.notEqual(connected.identity,primaryId);
    const state=await until(s=>controllers(s).filter(p=>p.connected).length===2,'Two actual receiver seats');
    const second=controllers(state).find(p=>p.controllerId===connected.identity);assert.ok(second);assert.equal(second.id,2);
    const pair=[...expected,{controllerId:connected.identity,playerId:2}];
    await captureSizes('controllers-two',pair);
    await peer.command({command:'disconnect'});await ready('Second controller removed while first remains');
    await peer.command({command:'connect'});await ready('Second identity keeps the same seat on reconnect',pair);
    await peer.command({command:'disconnect'});await ready('Second controller removed after reconnect');await peer.close();
    return {primaryControllerId:primaryId,secondaryControllerId:connected.identity,seats:2};
  });
  await test('disconnect removes the ID and same-ID reconnect restores its seat',async()=>{
    await disconnectPad();await ready('Disconnected status cleared',[]);await captureControllerStatus(ctx,'controller-disconnected',[]);
    const mark=report.wire.length;await connectPad();
    await waitFor(()=>report.wire.slice(mark).some(e=>e.direction==='sdk-to-game'&&e.message.type==='hello'),'Reconnect hello');
    const hello=report.wire.slice(mark).find(e=>e.direction==='sdk-to-game'&&e.message.type==='hello');assert.equal(hello.message.controller_id,primaryId);
    const state=await ready('Reconnected identity visible');assert.equal(controllers(state).find(p=>p.connected&&p.controllerId===primaryId).id,1);
    trace('controller-reconnected',null,state);await captureControllerStatus(ctx,'controller-reconnected',expected);return {controllerId:primaryId,playerId:1};
  });
  if(mode==='browser')await test('controller identity stays visible during ordinary play and pause',async()=>{
    await setViewport([960,540]);await tap('START');if(slug==='tank')await tap('START');
    await until(s=>['playing','race','countdown'].includes(s.phase)&&!s.paused,'Ordinary START begins gameplay',45000);
    let state=await ready('Controller ID stays visible while playing');trace('controller-playing',null,state);await screenshot('controller-playing');
    await tap('START');await until(s=>s.paused||s.phase==='paused','Ordinary START pauses');
    state=await ready('Controller ID stays visible while paused');trace('controller-paused',null,state);await screenshot('controller-paused');
    return {ordinaryStartAndPause:true,gameplayDirectionAndActionAcceptance:false};
  });
}
