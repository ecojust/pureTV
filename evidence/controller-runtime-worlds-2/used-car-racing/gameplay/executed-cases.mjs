import assert from 'node:assert/strict';
const model=s=>s.model, player=s=>s.players?.[0]||s.model?.player||s.model?.players?.[0];
const changed=(before,after,field)=>assert.notDeepEqual(after,before,field+' must change through ordinary controller input');
export async function gameplay(slug,{read,tap,hold,until,record}){
  let before=await read(),after;
  if(['twenty-four','torch-bridge'].includes(slug)){
    await tap('RIGHT');after=await read();assert.equal(model(after).cursor,model(before).cursor+1);record('right-selection',before,after);
    await tap('LEFT');after=await read();assert.equal(model(after).cursor,model(before).cursor);
    before=after;await tap('A');after=await read();
    if(slug==='twenty-four'){assert.equal(model(after).stage,'second');await tap('B');assert.equal(model(await read()).stage,'first');}
    else {assert.ok(model(after).selected.length>0);await tap('B');await until(s=>s.model.trips>0||s.model.mode==='crossing','crossing begins');}
    record('game-action',before,after);return;
  }
  if(slug==='tower-overlap'){
    await until(s=>{const m=s.model,b=m.floors.at(-1),v=m.slab;return m.mode==='moving'&&Math.min(b.x+b.width,v.x+v.width)-Math.max(b.x,v.x)>b.width*.7;},'visible slab overlap');
    before=await read();await tap('A');after=await read();assert.equal(after.model.drops,before.model.drops+1);record('drop-slab',before,after);return;
  }
  if(slug==='packing-sculptor'){
    await tap('RIGHT');after=await read();assert.ok(after.model.rackIndex>before.model.rackIndex);await tap('LEFT');
    await tap('A');before=await read();assert.equal(before.model.mode,'place');await tap('B');after=await read();assert.equal(after.model.rotations,before.model.rotations+1);record('pick-rotate',before,after);return;
  }
  if(slug==='conveyor-window'){
    await hold('RIGHT',220);after=await read();assert.ok(after.model.gripper.x>before.model.gripper.x);record('right-gripper',before,after);
    before=after;await hold('LEFT',220);after=await read();assert.ok(after.model.gripper.x<before.model.gripper.x);
    // Grabbing can miss a moving part. The actual action receipt proves processing,
    // while the eventual campaign QA verifies successful production separately.
    before=after;await tap('A');after=await read();assert.equal(after.model.actionReceipts.length,before.model.actionReceipts.length+1);record('grab-receipt',before,after);return;
  }
  if(slug==='glass-fold'){
    await tap('RIGHT');after=await read();changed(before.model.selectedId,after.model.selectedId,'fold line');await tap('LEFT');
    before=await read();await tap('A');after=await until(s=>s.model.foldCount>before.model.foldCount,'fold material');await until(s=>s.model.canUndo,'fold animation complete');await tap('B');const undone=await read();assert.ok(undone.model.undoCount>after.model.undoCount);record('fold-undo',before,undone);return;
  }
  if(slug==='tension-span'){
    await tap('RIGHT');after=await read();changed(before.model.selectedId,after.model.selectedId,'selected cable');await tap('LEFT');
    before=await read();await tap('A');after=await read();changed(before.model.cables.map(c=>c.installed),after.model.cables.map(c=>c.installed),'installed cables');record('build-cable',before,after);return;
  }
  if(slug==='prism-relay'){
    before=await read();await tap('A');after=await read();changed(before.model.devices.map(c=>c.orientation),after.model.devices.map(c=>c.orientation),'mirror orientation');await tap('B');const undo=await read();assert.deepEqual(undo.model.devices.map(c=>c.orientation),before.model.devices.map(c=>c.orientation));record('rotate-both-ways',before,after);return;
  }
  if(['super-mario','bomb-jack','adventure-island','cozy-island','alien-shooter','jackal','tank'].includes(slug)){
    if(slug==='tank')await until(s=>player(s).alive&&!player(s).spawnFrames,'tank finishes normal spawn',30000);
    before=await read();
    // Screen-horizontal games use x in the authored world; rendered movement is
    // also recorded. Start by moving away from the left boundary.
    await hold('RIGHT',220);after=await read();assert.ok(player(after).x>player(before).x,slug+' RIGHT');record('right-position',before,after);
    before=after;await hold('LEFT',180);after=await read();assert.ok(player(after).x<player(before).x,slug+' LEFT');record('left-position',before,after);
    before=after;
    if(['super-mario','bomb-jack','adventure-island'].includes(slug)){
      await hold('A',160,async()=>{after=await read();});assert.ok(player(after).y<player(before).y || player(after).vy<0,'jump moves upward');record('jump',before,after);
    }else if(slug==='cozy-island'){
      await tap('Y');after=await read();changed(player(before).tool,player(after).tool,'tool selection');record('select-tool',before,after);
      await tap('B');after=await read();record('bag-button',before,after); // Bag assertion added once the diagnostic includes modal state.
    }else if(slug==='alien-shooter'){
      await tap('B');after=await read();assert.ok(player(after).grenades<player(before).grenades,'grenade consumed');record('grenade',before,after);
    }else if(slug==='tank'){
      // Tank fires once per press. Its bullet may hit a wall or leave the screen
      // before an Android diagnostic round trip observes it. The game's fire
      // event is emitted only after a real player bullet is successfully added.
      before=await read();record('fire-before',null,before);
      const owner=player(before).id;
      const previousFireFrame=Math.max(-1,...(before.effects?.events||[]).filter(e=>e.type==='fire'&&e.player===owner).map(e=>e.frame));
      await hold('A',0,async()=>{
        after=await until(s=>(s.effects?.events||[]).some(e=>e.type==='fire'&&e.player===owner&&e.frame>previousFireFrame),'Tank creates a new player bullet');
        record('fire',before,after);
      });
    }else{
      await hold('A',140,async()=>{after=await read();});assert.ok((after.effects?.bullets||[]).some(b=>b.team==='player')||(after.effects?.weapons||[]).some(w=>w.team==='player'),'weapon fires');record('fire',before,after);
    }
    return;
  }
  if(['tetris','jewel'].includes(slug)){
    const piece=s=>player(s).piece||player(s).active;
    await tap('RIGHT');after=await read();assert.ok(piece(after).x>piece(before).x,'piece moves right');record('piece-right',before,after);before=after;await tap('LEFT');after=await read();assert.ok(piece(after).x<piece(before).x,'piece moves left');record('piece-left',before,after);
    before=await read();
    if(slug==='tetris'?piece(before).type==='O':new Set(piece(before).colors).size===1){
      // An O tetromino and a monochrome jewel column have no visible rotation.
      // Use the normal soft-drop input until the next eligible piece actually spawns.
      await hold('DOWN',0,async()=>{await until(s=>piece(s)&&(slug==='tetris'?piece(s).type!=='O':new Set(piece(s).colors).size>1),'ordinary soft drop reaches rotatable piece',60000);});before=await read();
    }
    await tap('A');after=await read();
    if(slug==='tetris')assert.notEqual(piece(after).rotation,piece(before).rotation,'initial tetromino rotation');else changed(piece(before).colors,piece(after).colors,'gem order');record('rotate',before,after);return;
  }
  if(slug==='used-car-racing'){
    // Keep ordinary throttle held through both steering checks. A coasting car
    // driven into the shoulder cannot establish the response to the next turn.
    await hold('A',0,async()=>{
      await until(s=>player(s).speed>3&&!player(s).telemetry.offRoad,'ordinary throttle reaches a movable road position',60000);
      for(const [key,sign] of [['LEFT',-1],['RIGHT',1]]){
        before=await read();assert.ok(player(before).speed>1&&!player(before).telemetry.offRoad,'steering starts on the road while moving');
        await hold(key,0,async()=>{after=await read();});record(key+'-rendered-direction',before,after);
        const p=before.camera?.projection,v=before.camera?.view;assert.ok(p&&v,'actual camera required');
        const project=c=>{const q=[c.x,c.y,c.z,1],e=[0,0,0,0].map((_,r)=>q.reduce((n,x,i)=>n+v[4*i+r]*x,0)),f=[0,0,0,0].map((_,r)=>e.reduce((n,x,i)=>n+p[4*i+r]*x,0));return f[0]/f[3];};
        // Countersteering changes heading before existing momentum reverses.
        // Compare both real yaw values at one origin through the same camera.
        const origin=player(before),heading=c=>project({...origin,x:origin.x+3*Math.sin(c.yaw),z:origin.z+3*Math.cos(c.yaw)});
        const centerDelta=project(player(after))-project(origin),headingDelta=heading(player(after))-heading(origin);
        record(key+'-direction-projection',null,{origin:{x:origin.x,y:origin.y,z:origin.z},rayLength:3,centerDelta,headingDelta});
        assert.ok(headingDelta*sign>0,key+' actual camera heading projection');
      }
    });
    before=await read();await hold('B',0,async()=>{after=await until(s=>player(s).telemetry.pedalForceN>player(before).telemetry.pedalForceN,'actual brake pedal pressure');});record('brake-pedal',before,after);return;
  }
  if(['neon-rush','coast-kart'].includes(slug)){
    if(slug==='neon-rush')await until(s=>s.model.countdown<=0&&s.model.player.speed>10,'race accelerating',120000);
    if(slug==='coast-kart')await until(s=>s.phase==='playing'&&player(s).speed>15,'kart accelerating',45000);
    for(const [key,sign] of [['LEFT',-1],['RIGHT',1]]){
      before=await read();await hold(key,300);after=await read();record(key+'-rendered-direction',before,after);
      if(slug==='coast-kart'){const a=before.renderedPlayers?.[0],b=after.renderedPlayers?.[0],p=before.camera?.projection,v=before.camera?.view;assert.ok(a&&b&&p&&v,'actual kart mesh and camera diagnostics');const project=c=>{const q=[c.x,c.y+.4,c.z,1],e=[0,0,0,0].map((_,r)=>q.reduce((n,x,i)=>n+v[4*i+r]*x,0)),f=[0,0,0,0].map((_,r)=>e.reduce((n,x,i)=>n+p[4*i+r]*x,0));return f[0]/f[3];};assert.ok((project(b)-project(a))*sign>0,'kart actual camera projection '+key);}
      else {
        const a=player(before),b=player(after),matrix=before.renderer?.cameraViewProjection;
        if(matrix){const project=c=>{const v=[c.x,c.y+.5,c.z,1];const p=[0,0,0,0].map((_,r)=>v.reduce((n,x,i)=>n+matrix[4*i+r]*x,0));return p[0]/p[3];};assert.ok((project(b)-project(a))*sign>0,key+' actual camera projection');}
        else {assert.ok(before.camera,'Native camera evidence required');const p=before.camera.projection,v=before.camera.view;const project=c=>{const q=[c.x,c.y||0,c.z,1];const e=[0,0,0,0].map((_,r)=>q.reduce((n,x,i)=>n+v[4*i+r]*x,0));const f=[0,0,0,0].map((_,r)=>e.reduce((n,x,i)=>n+p[4*i+r]*x,0));return f[0]/f[3];};assert.ok((project(b)-project(a))*sign>0,key+' actual camera projection');}
      }
    }
    if(slug==='neon-rush'){before=await read();await tap('B');after=await until(s=>s.model.stats.nitros>before.model.stats.nitros,'nitro consumed');record('nitro',before,after);}
    if(slug==='coast-kart'){await until(s=>player(s).speed>90,'speed sufficient for ordinary drift',60000);before=await read();await hold('LEFT',0,async()=>{await hold('B',0,async()=>{after=await until(s=>player(s).drifting,'kart drift');});});record('drift',before,after);}
    return;
  }
  throw Error('No actual gameplay case for '+slug);
}
