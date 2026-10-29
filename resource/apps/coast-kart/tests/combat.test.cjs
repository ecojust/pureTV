'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../src/main/assets/game-model.js');
const input = (id = 1, values = {}) => ({id, connected:true, x:0, y:0, a:false, b:false, start:false, select:false, ...values});
function race(two = false) {
  const game = new Game();
  game.selectedPlayers = two ? 2 : 1;
  game.start();
  game.countdown = 0;
  game.racers = game.players.filter(p => p.joined);
  return game;
}
const shot = (s, patch = {}) => ({type:'pulse', owner:99, s, x:0, speed:400, life:5, ...patch});

test('A holds offensive items for defense, joystick aims, and release throws exactly once', () => {
  const g = race(), p = g.players[0];
  p.item = 'pulse'; p.x = 0; p.s = 300;
  g.step(.05, [input(1,{a:true})]);
  assert.equal(p.heldItem,true);
  assert.equal(p.item,'pulse');
  assert.equal(g.items.length,0);
  g.step(.05, [input(1,{a:true,y:1})]);
  assert.equal(p.itemAim,-1);
  g.step(.05, [input()]);
  assert.equal(p.item,null);
  assert.equal(p.heldItem,false);
  assert.equal(g.items.length,1);
  assert.equal(g.items[0].speed,-260);
  for(let i=0;i<4;i++)g.step(.05,[input()]);
  assert.equal(g.items.length,1);
  p.item='trap';
  g.step(.05,[input(1,{a:true,y:-1})]);
  g.step(.05,[input()]);
  const trap=g.items.find(item=>item.type==='trap');
  assert.ok(trap.speed>0 && trap.flight>0,'up launches the trap ahead');
  for(let i=0;i<15;i++)g.step(.05,[input()]);
  assert.equal(trap.speed,0,'forward trap lands and becomes a stationary obstacle');
  assert.equal(trap.flight,0);
});

test('trailing defense intercepts one rear pulse across the finish seam', () => {
  const g=race(),p=g.players[0];
  Object.assign(p,{s:40,stepS:40,x:0,item:'trap',heldItem:true});
  g.items=[shot(g.track.length-45)];
  assert.equal(g.rearThreat(p,400),true);
  g.moveItems(.1);
  assert.equal(g.items.length,0);
  assert.equal(p.item,null);
  assert.equal(p.heldItem,false);
  assert.equal(p.stun,0);
  assert.ok(p.blockFlash>0);
  assert.ok(g.events.some(e=>e.type==='block'));
  g.items=[shot(5)];
  g.moveItems(.1);
  assert.ok(p.stun>0,'the spent defense cannot absorb a second attack');
});

test('held rear defense does not protect the front or hide a nearer victim', () => {
  const g=race(true),p=g.players[0],q=g.players[1];
  Object.assign(p,{s:100,stepS:100,x:0,item:'pulse',heldItem:true});
  Object.assign(q,{s:800,stepS:800,x:1});
  g.items=[shot(170,{speed:-400})];
  g.moveItems(.1);
  assert.ok(p.stun>0);
  assert.equal(p.item,null,'a frontal hit drops the held item');
  Object.assign(p,{s:180,stepS:180,x:0,stun:0});
  Object.assign(q,{s:140,stepS:140,x:0,stun:0});
  g.items=[shot(0,{speed:2000})];
  g.moveItems(.1);
  assert.equal(p.stun,0,'array order must not let a shot skip the nearer kart');
  assert.ok(q.stun>0);
});

test('two players hold and throw independently and can drift while guarding', () => {
  const g=race(true),p=g.players[0],q=g.players[1];
  Object.assign(p,{item:'pulse',speed:180,s:20,x:-.4});
  Object.assign(q,{item:'trap',speed:180,s:400,x:.4});
  g.step(.05,[input(1,{a:true,b:true,x:.2}),input(2,{a:true})]);
  assert.ok(p.drift>0);
  assert.ok(p.heldItem&&q.heldItem);
  g.step(.05,[input(1),input(2,{a:true})]);
  assert.equal(p.item,null);
  assert.equal(q.item,'trap');
  assert.equal(q.heldItem,true);
  assert.equal(g.status().players[1].holding,true);
});

test('pause and disconnect cancel the armed throw while preserving inventory', () => {
  for(const item of ['pulse','trap']) for(const disconnect of [false,true]){
    const g=race(),p=g.players[0];p.item=item;
    g.step(.05,[input(1,{a:true})]);
    g.step(.05,[input(1,disconnect?{connected:false}:{start:true,a:true})]);
    assert.equal(g.phase,'paused');
    assert.equal(p.heldItem,false);
    assert.equal(p.item,item);
    const clock=g.clock;
    g.step(.1,[input(1,disconnect?{connected:false}:{})]);
    assert.equal(g.clock,clock);
    g.step(.05,[input(1,disconnect?{}:{start:true})]);
    assert.equal(g.phase,'playing');
    assert.equal(g.items.length,0,'releasing while suspended cannot launch on resume');
    assert.equal(p.item,item);
    g.step(.05,[input(1,{a:true})]);
    g.step(.05,[input()]);
    assert.equal(p.item,null,'a fresh press/release works after resume');
  }
});

test('rank changes actual item odds while seeded selections remain repeatable', () => {
  const g=new Game();g.start();const p=g.players[0];
  function distribution(rank){
    p.rank=rank;const result={};
    for(let n=0;n<700;n++){
      g.random=()=> (n+.5)/700;
      const item=g.pickItem(p);result[item]=(result[item]||0)+1;
    }
    return result;
  }
  const lead=distribution(1),chase=distribution(g.racers.length);
  assert.ok(lead.trap>chase.trap&&lead.shield>chase.shield);
  assert.ok(chase.boost>lead.boost&&chase.pulse>lead.pulse);
  const a=new Game(),b=new Game();a.start();b.start();
  assert.deepEqual(Array.from({length:20},()=>a.pickItem(a.players[0])),Array.from({length:20},()=>b.pickItem(b.players[0])));
});

test('AI uses the hold/release path and time trials reject combat items', () => {
  const g=new Game();g.start();g.countdown=0;
  const ai=g.racers.find(p=>!p.human);
  Object.assign(ai,{item:'pulse',aiTimer:-1,s:1000,x:0});
  g.step(.05,[input()]);
  assert.equal(ai.heldItem,true);
  for(let n=0;n<20;n++)g.step(.05,[input()]);
  assert.equal(ai.item,null);
  assert.ok(g.events.some(e=>e.type==='pulse'&&e.id===ai.id));
  const solo=new Game();solo.modeIndex=2;solo.start();solo.countdown=0;
  solo.players[0].item='pulse';
  solo.step(.05,[input(1,{a:true})]);solo.step(.05,[input()]);
  solo.useItem(solo.players[0]);
  assert.equal(solo.players[0].heldItem,false);
  assert.equal(solo.items.length,0);
  assert.equal(solo.racers.length,1);
});

test('rear threat notification is edge triggered and respects lane and owner', () => {
  const g=race(),p=g.players[0];Object.assign(p,{s:500,stepS:500,x:0,speed:100});
  g.items=[shot(250)];
  g.moveItems(.01);g.moveItems(.01);
  assert.equal(p.incoming,true);
  assert.equal(g.events.filter(e=>e.type==='warning').length,1);
  p.x=1;g.moveItems(.01);assert.equal(p.incoming,false);
  p.x=0;g.items[0].owner=p.id;g.moveItems(.01);assert.equal(p.incoming,false);
});

test('A pressed during a pause cannot activate or arm an item until released after resuming', () => {
  for(const item of ['boost','shield','pulse','trap']) {
    for(const reason of ['manual','disconnect']) {
      const g=race(),p=g.players[0];p.item=item;
      g.step(.05,[input(1,reason==='manual'?{start:true}:{connected:false})]);
      assert.equal(g.phase,'paused');
      // A can remain physically held while disconnected; the reconnect snapshot
      // is the first time the host can observe that new press.
      g.step(.05,[input(1,{a:true,connected:reason==='manual'})]);
      assert.equal(g.phase,'paused');
      g.step(.05,[input(1,{a:true,start:reason==='manual'})]);
      assert.equal(g.phase,'playing');
      for(let i=0;i<3;i++)g.step(.05,[input(1,{a:true})]);
      assert.equal(p.item,item,reason+' must not queue '+item+' from pause');
      assert.equal(p.heldItem,false,reason+' must not arm '+item+' from pause');
      assert.equal(p.boost,0);
      assert.equal(p.shield,0);
      assert.equal(g.items.length,0);
      g.step(.05,[input()]);
      assert.equal(p.item,item,'the first release is neutral');
      assert.equal(g.items.length,0);
      g.step(.05,[input(1,{a:true})]);
      if(item==='pulse'||item==='trap')assert.equal(p.heldItem,true);
      else assert.equal(p.item,null);
      g.step(.05,[input()]);
      assert.equal(p.item,null,'a fresh press works normally after '+reason);
    }
  }
});
