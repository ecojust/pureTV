'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => JSON.parse(JSON.stringify(value));
const cell = (s, c, r) => s.cells[r * s.grid.cols + c];
function ticks(s, n, input = {}) { for (let i = 0; i < n; i++) Model.step(s, DT, input); return s; }
function place(s, c, r) { const p = cell(s, c, r); Object.assign(s.player, { x: p.x, y: p.y }); }
function fixture(open = true) {
  const s = Model.create(3, 0);
  s.hazards = []; s.beacons = []; // Isolate physical boundaries, not a normal-play claim.
  s.cells.forEach(c => { c.type = open && c.col > 0 && c.col < 18 && c.row > 0 && c.row < 10 ? 'floor' : 'wall'; c.seen = c.visible = false; c.revealedUntil = 0; });
  s.lampRadius = s.reserveLampRadius = 0;
  place(s, 2, 5);
  return s;
}
function stationaryHazard(s, c, r) {
  const h = copy(Model.create().hazards[0]), t = cell(s, c, r);
  Object.assign(h, { x: t.x, y: t.y, _patrol: [t.id, t.id], _patrolIndex: 0, _route: [], _navTarget: null, _lastHeardTileId: null, alertTime: 0 });
  s.hazards = [h]; return h;
}

test('UMD APIs, three authored maps and reset state are independent', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(require.resolve('../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['TICK_HZ', 'create', 'step']);
  for (let d = 0; d < 3; d++) {
    const s = Model.create(19, d), again = Model.create(19, d);
    assert.deepEqual(s, again); assert.equal(s.level, d + 1); assert.equal(s.cells.length, 209);
    assert.equal(s.target, [2, 3, 3][d]); assert.equal(s.hazards.length, d + 1); assert.equal(s.player.shield, 3);
    assert.equal(s.sonarCost, 3, 'each exploratory scan pays three finite battery units');
    assert.ok(s.timeLimit >= 80 && s.timeLimit <= 90);
    s.cells[0].seen = true; s.beacons[0].collected = true; s.hazards[0]._patrol.push(1);
    assert.deepEqual(Model.create(19, d), again);
  }
  assert.notDeepEqual(Model.create(1, 0).cells.map(c => c.type), Model.create(1, 1).cells.map(c => c.type));
});

test('A is edge-triggered; cooldown rejects genuine rapid pulses without spending power', () => {
  const s = fixture(); Model.step(s, DT, { a: true }); assert.equal(s.sonarCount, 1);
  const after = s.battery; ticks(s, 120, { a: true }); assert.equal(s.sonarCount, 1);
  assert.ok(Math.abs(s.battery - (after - 2 * s.batteryDrain)) < 1e-8);
  Model.step(s, DT, {}); Model.step(s, DT, { a: true }); assert.equal(s.sonarCount, 2);
  const before = s.battery; Model.step(s, DT, { aPressed: true });
  assert.equal(s.sonarCount, 2); assert.ok(s.events.some(e => e.type === 'scanRejected' && e.reason === 'cooldown'));
  assert.ok(Math.abs(s.battery - (before - s.batteryDrain * DT)) < 1e-8);
});

test('pulse edges remain valid after release/repress between simulation calls', () => {
  const s = fixture(); Model.step(s, DT, { a: true, aPressed: true }); ticks(s, 70, { a: true });
  Model.step(s, DT, { a: true, aPressed: true }); assert.equal(s.sonarCount, 2);
});

test('insufficient battery does not emit and exact sonar cost is sufficient', () => {
  const s = fixture(); s.battery = s.sonarCost - 0.01;
  Model.step(s, DT, { a: true }); assert.equal(s.sonarCount, 0); assert.equal(s.waves.length, 0);
  assert.ok(s.events.some(e => e.reason === 'battery'));
  s.battery = s.sonarCost; Model.step(s, DT, {}); s.battery = s.sonarCost;
  Model.step(s, DT, { a: true }); assert.equal(s.sonarCount, 1); assert.equal(s.battery, 0);
  assert.ok(s.reserve < s.maxReserve);
});

test('a scan updates the energy estimate even before the next fixed movement tick', () => {
  const s=fixture();Model.step(s,DT/4,{aPressed:true});
  assert.equal(s.tick,0);assert.equal(s.sonarCount,1);assert.equal(s.battery,s.maxBattery-s.sonarCost);
  assert.equal(s.remaining,s.battery/s.batteryDrain+s.reserve);
});

test('sonar arrives by distance, not on key press or whole-wave radius through walls', () => {
  const s = fixture(false);
  [[3, 5], [3, 4], [4, 4], [5, 4], [5, 5]].forEach(([c, r]) => cell(s, c, r).type = 'floor');
  place(s, 3, 5); const wall = cell(s, 4, 5), beyond = cell(s, 5, 5);
  Model.step(s, DT, { a: true }); assert.equal(wall.seen, false); assert.equal(beyond.seen, false);
  assert.equal(s.waves[0]._distances[wall.id], 40); assert.equal(s.waves[0]._distances[beyond.id], 160);
  ticks(s, 10); assert.equal(wall.seen, false); ticks(s, 1); assert.equal(wall.seen, true);
  ticks(s, 12); assert.equal(beyond.seen, false, 'Euclidean radius has crossed the wall, but sound has not travelled around it');
  ticks(s, 23); assert.equal(beyond.seen, false); ticks(s, 1); assert.equal(beyond.visible, true);
  assert.ok(Math.abs(beyond.revealedUntil - 4.8) < 1e-10);
});

test('a sealed wall stops propagation entirely, including behind-wall beacons and hazards', () => {
  const s = fixture(false); cell(s, 3, 5).type = cell(s, 5, 5).type = 'floor'; place(s, 3, 5);
  const target = cell(s, 5, 5); s.beacons = [{ id: 'hidden', tileId: target.id, x: target.x, y: target.y, radius: 8, collected: false, visible: false, seen: false }];
  const h = stationaryHazard(s, 5, 5);
  Model.step(s, DT, { a: true }); assert.equal(s.waves[0]._distances[target.id], null);
  ticks(s, 100); assert.equal(target.seen, false); assert.equal(s.beacons[0].seen, false); assert.equal(h.visible, false);
});

test('emitted wave origin is fixed, including conservative off-center travel distance', () => {
  const s = fixture(); s.player.x += 10;
  Model.step(s, DT, { a: true }); const w = s.waves[0], origin = [w.x, w.y, w.originTileId], destination = cell(s, 3, 5);
  assert.equal(w._distances[destination.id], 50);
  ticks(s, 13, { y: -1 }); assert.equal(destination.seen, false);
  ticks(s, 1, { y: -1 }); assert.equal(destination.seen, true); assert.notEqual(s.player.y, origin[1]);
  assert.deepEqual([w.x, w.y, w.originTileId], origin);
});

test('echo visibility expires at arrival+4 seconds, while chart and collected state persist', () => {
  const s = fixture(); const target = cell(s, 3, 5);
  Model.step(s, DT, { a: true }); ticks(s, 11);
  const expiry = target.revealedUntil; assert.ok(Math.abs(expiry - 4.2) < 1e-10);
  ticks(s, 84); assert.equal(s.waves.length, 1); assert.equal(target.revealedUntil, expiry);
  ticks(s, 1); assert.equal(s.waves.length, 0);
  ticks(s, 154); assert.equal(target.visible, true); ticks(s, 1); assert.equal(target.visible, false); assert.equal(target.seen, true);
});

test('near lamp sees the hit wall but not its back, and tangent corners block light', () => {
  const s = fixture(); s.lampRadius = 130; place(s, 2, 2); cell(s, 3, 2).type = 'wall';
  Model.step(s, DT, {});
  assert.equal(cell(s, 3, 2).visible, true); assert.equal(cell(s, 4, 2).visible, false);
  assert.equal(cell(s, 3, 3).visible, false, 'diagonal ray tangential to the solid corner is blocked');
  assert.equal(cell(s, 2, 3).visible, true);
});

test('near lamp uses a moving hazard actual position, not a visible tile center around a corner', () => {
  const s=Model.create();Object.assign(s.player,{x:370,y:185});
  const h=s.hazards[0];Object.assign(h,{x:392,y:145,_route:[],_navTarget:null});
  Model.step(s,DT,{});
  assert.equal(cell(s,7,2).visible,true,'the tile center ray passes beyond the corner');
  assert.ok(Math.hypot(h.x-s.player.x,h.y-s.player.y)<48);
  const crossingX=s.player.x+(h.x-s.player.x)*(170-s.player.y)/(h.y-s.player.y);
  assert.ok(crossingX<380,'the actual entity ray crosses the blocking wall');
  assert.equal(h.visible,false);
  cell(s,7,2).revealedUntil=s.elapsed+1;
  Model.step(s,DT,{});assert.equal(h.visible,true,'a reached sonar tile still legitimately reveals its occupant');
});

test('entity lamp range is independent of its tile center range', () => {
  const outside=fixture();outside.lampRadius=48;const far=stationaryHazard(outside,3,5);far.x+=9;
  Model.step(outside,DT,{});assert.equal(cell(outside,3,5).visible,true);assert.ok(Math.hypot(far.x-outside.player.x,far.y-outside.player.y)>48);assert.equal(far.visible,false);
  const inside=fixture();inside.lampRadius=48;inside.player.x+=19.9;const near=stationaryHazard(inside,4,5);near.x-=18;
  Model.step(inside,DT,{});assert.equal(cell(inside,4,5).visible,false);assert.ok(Math.hypot(near.x-inside.player.x,near.y-inside.player.y)<48);assert.equal(near.visible,true);
});

test('frontiers are bounded to reached visible cells and waves have bounded lifetime/count', () => {
  const s = fixture();
  for (let i = 0; i < 600 && s.phase === 'playing'; i++) {
    Model.step(s, DT, { aPressed: i % 67 === 0 });
    assert.ok(s.waves.length <= 2);
    for (const w of s.waves) {
      assert.ok(w._distances.length === 209 && w.frontier.length <= 209);
      for (const n of w.frontier) { assert.ok(w._distances[n] <= w.radius + 1e-8); assert.equal(s.cells[n].seen, true); }
    }
    assert.ok(s.events.length <= 32);
  }
});

test('normal movement is normalized and B gives precise quiet speed, not pause', () => {
  const normal = fixture(), diagonal = fixture(), quiet = fixture();
  const x = normal.player.x, y = normal.player.y;
  ticks(normal, 60, { x: 1 }); ticks(diagonal, 60, { x: 1, y: 1 }); ticks(quiet, 60, { x: 1, b: true });
  assert.ok(Math.abs(normal.player.x - x - 60) < 1e-8);
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - x, diagonal.player.y - y) - 60) < 1e-8);
  assert.ok(Math.abs(quiet.player.x - x - 34) < 1e-8);
  assert.equal(normal.player.noiseRadius, 180); assert.equal(quiet.player.noiseRadius, 35);
  assert.equal(quiet.tick, 60); assert.ok(quiet.battery < quiet.maxBattery);
});

test('quiet movement actually avoids a patrol alert that loud movement triggers', () => {
  const loud = fixture(), quiet = fixture(); place(loud, 2, 5); place(quiet, 2, 5);
  stationaryHazard(loud, 5, 5); stationaryHazard(quiet, 5, 5);
  Model.step(loud, DT, { x: 1 }); Model.step(quiet, DT, { x: 1, b: true });
  assert.equal(loud.hazards[0].alerted, true); assert.equal(loud.hazards[0].speed, 42);
  assert.equal(quiet.hazards[0].alerted, false); assert.equal(quiet.hazards[0].speed, 22);
  assert.ok(loud.hazards[0].x < quiet.hazards[0].x);
  ticks(loud, 73); assert.equal(loud.hazards[0].alerted, false, 'a quiet stationary player does not keep the alert alive');
});

test('noise follows the corridor instead of hearing through a sealed neighboring room', () => {
  const s = fixture(false); [[2,5],[3,5],[5,5]].forEach(([c,r]) => cell(s,c,r).type='floor');
  place(s,2,5); const h=stationaryHazard(s,5,5); ticks(s,20,{x:1}); assert.equal(h.alerted,false);
});

test('same-cell quiet hearing uses real separation, including the 35px threshold', () => {
  for (const [separation, expected] of [[35, true], [35.01, false]]) {
    const s=fixture();place(s,4,5);const c=cell(s,4,5),h=stationaryHazard(s,4,5);
    // Quiet moves +34/60 before hearing is evaluated. Both entities remain in this tile.
    s.player.x=c.x-17-34/60;h.x=c.x-17+separation;
    Model.step(s,DT,{x:1,b:true});assert.equal(h.alerted,expected,'distance '+separation);
  }
});

test('hearing across tiles accounts for both endpoint offsets at the 180px boundary', () => {
  for (const [offset, expected] of [[9,true],[9.01,false]]) {
    const s=fixture();place(s,2,5);s.player.x+=offset;
    const h=stationaryHazard(s,6,5);h.x+=10;
    // Four center edges=160, player offset after movement=offset+1, hazard offset=10.
    Model.step(s,DT,{x:1});assert.equal(h.alerted,expected,'player pre-movement offset '+offset);
  }
});

test('wall collision does not tunnel at large dt or diagonal corner contact and can slide', () => {
  const s = fixture(); cell(s, 3, 5).type = 'wall'; const initial = copy(s.player);
  s.normalSpeed = 9000; Model.step(s, DT, { x: 1 });
  assert.ok(s.player.x <= cell(s, 3, 5).x - 20 - s.player.radius + 1e-8);
  s.normalSpeed = 60; const edgeX = s.player.x; ticks(s, 20, { x: 1, y: 1 });
  assert.ok(s.player.y > initial.y); assert.ok(s.player.x >= edgeX - 1e-8);
  for (const wall of s.cells.filter(c => c.type === 'wall')) {
    const dx=Math.max(0,Math.abs(s.player.x-wall.x)-20),dy=Math.max(0,Math.abs(s.player.y-wall.y)-20);
    assert.ok(Math.hypot(dx,dy)>=s.player.radius-1e-7);
  }
  const corner = fixture(); cell(corner,3,5).type='wall'; cell(corner,2,6).type='wall';
  ticks(corner,120,{x:1,y:1}); assert.ok(corner.player.x<cell(corner,3,5).x); assert.ok(corner.player.y<cell(corner,2,6).y);
});

test('swept moving contact damages even when neither endpoint overlaps', () => {
  const s=fixture(); place(s,2,5); stationaryHazard(s,4,5); s.normalSpeed=12000;
  const h=s.hazards[0],x0=s.player.x; Model.step(s,DT,{x:1});
  assert.ok(Math.abs(x0-h.x)>21&&Math.abs(s.player.x-h.x)>21);
  assert.equal(s.player.shield,2); assert.ok(s.events.some(e=>e.type==='collision'));
});

test('contact grace interval prevents per-frame damage and repeated contact can lose', () => {
  const s=fixture(); stationaryHazard(s,2,5); Model.step(s,DT,{}); assert.equal(s.player.shield,2);
  ticks(s,60); assert.equal(s.player.shield,2); ticks(s,25); assert.equal(s.player.shield,1);
  ticks(s,84); assert.equal(s.phase,'lost'); assert.equal(s.lostReason,'shield'); assert.equal(s.player.shield,0);
});

test('battery exhaustion switches to finite reserve exactly, then darkness freezes', () => {
  const s=fixture(); s.battery=s.batteryDrain*DT/2; s.reserve=0.05;
  Model.step(s,DT,{}); assert.equal(s.battery,0); assert.ok(Math.abs(s.reserve-(.05-DT/2))<1e-9);
  ticks(s,2); assert.equal(s.phase,'playing'); ticks(s,1); assert.equal(s.phase,'lost'); assert.equal(s.lostReason,'darkness');
  const ended=JSON.stringify(s); ticks(s,90,{x:1,aPressed:true,b:true}); assert.equal(JSON.stringify(s),ended);
});

test('idle rounds all end from finite light without an external timer or endless pause-by-B', () => {
  for(let d=0;d<3;d++){
    const s=Model.create(1,d); while(s.phase==='playing'&&s.tick<5500)Model.step(s,.25,{b:true});
    assert.equal(s.phase,'lost'); assert.equal(s.lostReason,'darkness'); assert.ok(s.elapsed<=90); assert.equal(s.battery,0); assert.equal(s.reserve,0);
  }
});

test('reserve light shrinks and cannot power a sonar', () => {
  const s=fixture(); s.lampRadius=48;s.reserveLampRadius=24;Model.step(s,DT,{});assert.equal(cell(s,3,5).visible,true);
  s.battery=0;Model.step(s,DT,{aPressed:true});assert.equal(cell(s,3,5).visible,false);assert.equal(s.sonarCount,0);assert.equal(s.player.shield,3);
});

test('beacons collect once, remain collected after fading, and entrance needs every beacon', () => {
  const s=Model.create();s.hazards=[];Model.step(s,DT,{});assert.equal(s.phase,'playing');assert.equal(s.entry.unlocked,false);
  const first=s.beacons[0];Object.assign(s.player,{x:first.x,y:first.y});Model.step(s,DT,{});assert.equal(s.collected,1);assert.equal(s.score,500);
  ticks(s,360);assert.equal(first.collected,true);assert.equal(s.collected,1);assert.equal(s.score,500);
  Object.assign(s.player,{x:s.entry.x,y:s.entry.y});Model.step(s,DT,{});assert.equal(s.phase,'playing');
  const second=s.beacons[1];Object.assign(s.player,{x:second.x,y:second.y});Model.step(s,DT,{});assert.equal(s.collected,2);assert.equal(s.entry.unlocked,true);assert.equal(s.phase,'playing');
  Object.assign(s.player,{x:s.entry.x,y:s.entry.y});Model.step(s,DT,{});assert.equal(s.phase,'won');
  assert.equal(s.score,1500+Math.round(s.remaining*10)+s.player.shield*100);assert.equal(s.lostReason,null);
  const frozen=JSON.stringify(s);ticks(s,180,{aPressed:true,x:1,b:true});assert.equal(JSON.stringify(s),frozen);
});

test('shield or darkness failure takes priority over same-tick pickup/return', () => {
  const s=Model.create();s.hazards=[];s.collected=s.target;s.beacons.forEach(b=>b.collected=true);s.battery=0;s.reserve=DT/2;
  Model.step(s,DT,{});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'darkness');
  const hit=fixture();hit.collected=hit.target;Object.assign(hit.player,{x:hit.entry.x,y:hit.entry.y,shield:1});stationaryHazard(hit,hit.entry.col,hit.entry.row);
  Model.step(hit,DT,{});assert.equal(hit.phase,'lost');assert.equal(hit.lostReason,'shield');
});

test('fixed rules reproduce frame subdivision and serialize/resume without aliases', () => {
  const a=Model.create(8,1),b=Model.create(8,1);for(let i=0;i<60;i++)Model.step(a,DT,{x:1,b:true});for(let i=0;i<4;i++)Model.step(b,.25,{x:1,b:true});
  for(const key of ['tick','elapsed','battery','reserve','score'])assert.equal(a[key],b[key]);assert.deepEqual(a.player,b.player);assert.deepEqual(a.hazards,b.hazards);
  Model.step(a,DT,{aPressed:true});const restored=copy(a);ticks(a,60);ticks(restored,60);assert.deepEqual(restored,a);
});

test('invalid time/input cannot trigger actions or poison physics; long gaps are bounded', () => {
  const s=Model.create(),before=JSON.stringify(s);for(const dt of [0,-1,NaN,Infinity])Model.step(s,dt,{aPressed:true,x:NaN,y:Infinity});assert.equal(JSON.stringify(s),before);
  s.player.x=NaN;s.player.y=Infinity;s.player.angle=NaN;Model.step(s,100,{x:Infinity,y:NaN});assert.equal(s.tick,15);
  for(const key of ['x','y','angle','vx','vy','shield'])assert.ok(Number.isFinite(s.player[key]));assert.ok(Number.isFinite(s.battery));
});

test('retry restores fog, wave origin, patrols, beacon state, inputs and reserves independently', () => {
  const first=Model.create(11,2),baseline=copy(first);ticks(first,60,{x:1,a:true,b:true});first.beacons[0].collected=true;first.player.shield=0;
  const retry=Model.create(11,2);assert.deepEqual(retry,baseline);assert.equal(retry.waves.length,0);assert.equal(retry.sonarCount,0);
  assert.equal(retry.cells.filter(c=>c.seen).length,baseline.cells.filter(c=>c.seen).length);assert.equal(retry.reserve,10);
});

test('observational normal-key exploration collects and returns on all three maps', async () => {
  const {createPilot}=await import(pathToFileURL(path.join(__dirname,'automation.mjs')).href);
  for(let d=0;d<3;d++){
    const pilot=createPilot(),s=Model.create(61,d);let held=new Set(),scans=0,pickups=0,sawQuiet=false;const startSeen=s.revealedCount;
    for(let elapsed=0;elapsed<91&&s.phase==='playing';elapsed+=.08){
      const snapshot={phase:s.phase,paused:false,level:d,model:copy(s)},unchanged=copy(snapshot);
      const desired=pilot(snapshot,{elapsed,mode:'qa'});assert.deepEqual(snapshot,unchanged,'pilot may only read its snapshot');
      const down=new Set(desired),input={x:Number(down.has('ArrowRight'))-Number(down.has('ArrowLeft')),y:Number(down.has('ArrowDown'))-Number(down.has('ArrowUp')),a:down.has('Space'),b:down.has('b'),aPressed:down.has('Space')&&!held.has('Space'),bPressed:down.has('b')&&!held.has('b')};
      Model.step(s,.08,input);held=down;scans=s.sonarCount;pickups=s.collected;sawQuiet=sawQuiet||s.player.quiet;
    }
    assert.equal(s.phase,'won',`map${d+1}: ${s.lostReason}; player=${s.player.col},${s.player.row}; ${s.message}`);
    assert.equal(pickups,s.target);assert.ok(scans>0);assert.ok(s.revealedCount>startSeen);assert.ok(s.elapsed>=30&&s.elapsed<=90);assert.ok(s.player.shield>0);assert.ok(s.beacons.every(b=>b.collected));
    assert.ok(Math.hypot(s.player.x-s.entry.x,s.player.y-s.entry.y)<=s.entry.radius+1e-8);
  }
});
