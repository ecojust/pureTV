const test=require('node:test');
const assert=require('node:assert/strict');
const {JackalGame,TILE,WORLD_WIDTH,WORLD_HEIGHT,VIEW_HEIGHT,STAGES,DIR8}=require('../src/main/assets/game-model.js');
const input=(id=1,more={})=>({id,connected:true,x:0,y:0,a:false,b:false,...more});
const tick=(g,seconds,inputs=[input()])=>{for(let n=0;n<Math.ceil(seconds*60);n++)g.step(1/60,inputs);};
const start=(inputs=[input()])=>{const g=new JackalGame(1988);g.step(.02,inputs.map(i=>({...i,a:true})));return g;};
function quiet(g){g.enemies=[];g.huts=[];g.boss.active=false;g.boss.fire=999;g.map=Array.from({length:WORLD_HEIGHT/TILE},()=>Array(WORLD_WIDTH/TILE).fill(0));}

test('A starts the room and a second phone can join at the current scroll position',()=>{
 const g=new JackalGame();g.step(.02,[input()]);assert.equal(g.phase,'lobby');g.step(.02,[input(1,{a:true})]);assert.equal(g.phase,'playing');assert.equal(g.players[1].joined,false);
 g.cameraY=400;g.players[0].y=550;g.step(.02,[input(),input(2)]);const p=g.players[1];assert.equal(p.joined,true);assert.equal(p.lives,3);assert.ok(p.y>=400&&p.y<=608);assert.ok(p.invulnerable>0);
});
test('all phones disconnected or manually paused freezes world simulation',()=>{
 const g=start();tick(g,.5);const before=JSON.stringify({camera:g.cameraY,time:g.time,enemies:g.enemies,bullets:g.bullets,players:g.players.map(p=>[p.x,p.y,p.fire])});tick(g,2,[]);
 assert.equal(g.phase,'paused');assert.equal(JSON.stringify({camera:g.cameraY,time:g.time,enemies:g.enemies,bullets:g.bullets,players:g.players.map(p=>[p.x,p.y,p.fire])}),before);
 g.step(.01,[input()]);assert.equal(g.phase,'playing');g.togglePause();const now=g.time;tick(g,1,[input(1,{y:-1,a:true})]);assert.equal(g.time,now);g.togglePause();g.step(.01,[input()]);assert.equal(g.phase,'playing');
});
test('water and stone stop jeeps while a broad bridge remains passable',()=>{
 const g=start();quiet(g);const p=g.players[0];p.x=80;p.y=888;
 for(const tile of [2,3]){g.map[54][5]=tile;tick(g,.4,[input(1,{y:-1})]);assert.ok(p.y>=887-.001);p.y=888;}
 g.map[54][5]=4;tick(g,.4,[input(1,{y:-1})]);assert.ok(p.y<872);p.x=7;tick(g,.2,[input(1,{x:-1})]);assert.equal(p.x,7);
});
test('co-op camera follows the trailing jeep and never leaves a teammate off screen',()=>{
 const g=start([input(),input(2)]);quiet(g);tick(g,2,[input(1,{y:-1}),input(2)]);assert.equal(g.cameraY,WORLD_HEIGHT-VIEW_HEIGHT);
 for(let i=0;i<240;i++){g.step(1/60,[input(1,{y:-1}),input(2,{y:-1})]);for(const p of g.players)assert.ok(p.y>=g.cameraY&&p.y<=g.cameraY+VIEW_HEIGHT);}
 assert.ok(g.cameraY<700);const y=g.cameraY;tick(g,1,[input(1,{y:1}),input(2,{y:1})]);assert.equal(g.cameraY,y,'Backtracking cannot rewind terrain behind the screen');
});
test('machine gun always shoots north while grenades follow eight-way driving',()=>{
 const g=start();quiet(g);g.step(.02,[input(1,{x:1,a:true,b:true})]);const p=g.players[0];assert.equal(p.dir,2);assert.equal(g.bullets[0].dx,0);assert.equal(g.bullets[0].dy,-1);assert.equal(g.grenades[0].dx,1);assert.equal(g.grenades[0].dy,0);
 const initial=g.grenades.length;g.step(.02,[input(1,{b:true})]);assert.equal(g.grenades.length,initial,'Cooldown prevents one grenade per frame');
 tick(g,.8,[input(1,{b:true})]);assert.ok(p.grenadeCooldown>.5,'Holding B continues firing after cooldown');
 const diagonal=start();quiet(diagonal);diagonal.step(.02,[input(1,{x:1,y:-1,b:true})]);assert.equal(diagonal.players[0].dir,1);assert.deepEqual([diagonal.grenades[0].dx,diagonal.grenades[0].dy],DIR8[1]);
});
test('gunfire stops at prisoner huts; a grenade opens them and frees five people',()=>{
 const g=start();g.enemies=[];const h=g.huts[0];const p=g.players[0];p.x=h.x;p.y=h.y+34;g.bullets=[{x:h.x,y:h.y+17,dx:0,dy:-1,team:'player',owner:1,life:1}];g.step(.05,[input()]);assert.equal(h.open,false);assert.equal(h.hp,3);assert.equal(g.bullets.length,0);
 g.explode({x:h.x,y:h.y,owner:1,power:0});assert.equal(h.open,true);assert.equal(g.prisoners.length,5);assert.ok(g.prisoners.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));g.explode({x:h.x,y:h.y,owner:1,power:0});assert.equal(g.prisoners.length,5,'A ruined hut cannot spawn duplicate prisoners');
});
test('rescued people board by proximity with an eight-passenger limit',()=>{
 const g=start();quiet(g);const p=g.players[0];g.prisoners=Array.from({length:10},(_,id)=>({id,x:p.x,y:p.y,alive:true}));g.step(.02,[input()]);assert.equal(p.passengers,8);assert.equal(g.prisoners.length,2);assert.equal(g.rescued,0,'Boarding is not yet extraction');
});
test('stopping on a helipad unloads passengers, grants score and upgrades grenades',()=>{
 const g=start();quiet(g);const p=g.players[0];const pad=g.helipads[0];p.x=pad.x;p.y=pad.y;p.passengers=6;
 tick(g,.5,[input(1,{x:.3})]);assert.equal(p.passengers,6,'Moving through a pad does not unload');p.x=pad.x;p.y=pad.y;tick(g,2.2);assert.equal(p.passengers,0);assert.equal(p.rescued,6);assert.equal(g.rescued,6);assert.equal(p.score,1500);assert.equal(p.weaponLevel,2);assert.ok(pad.unloading>0);
});
test('destroyed jeep releases passengers and respawns safely without duplicating them',()=>{
 const g=start();quiet(g);const p=g.players[0];p.passengers=4;p.weaponLevel=2;p.invulnerable=0;g.hitPlayer(p);assert.equal(p.alive,false);assert.equal(p.lives,2);assert.equal(p.passengers,0);assert.equal(p.weaponLevel,1);assert.equal(g.prisoners.length,4);g.hitPlayer(p);assert.equal(p.lives,2);assert.equal(g.prisoners.length,4);
 tick(g,1.5);assert.equal(p.alive,true);assert.ok(p.invulnerable>0);assert.equal(g.blocked(p.x,p.y),false);g.hitPlayer(p);assert.equal(p.lives,2,'Respawn invulnerability prevents immediate repeated deaths');
});
test('player grenades destroy hostile armor without harming partners or prisoners',()=>{
 const g=start([input(),input(2)]);quiet(g);const p=g.players[0];g.addEnemy('armor',p.x+5,p.y);g.players[1].x=p.x+8;g.players[1].y=p.y;g.players[1].invulnerable=0;g.prisoners=[{id:1,x:p.x+12,y:p.y,alive:true}];g.explode({x:p.x,y:p.y,owner:1,power:0});assert.equal(g.enemies[0].alive,false);assert.equal(p.score,200);assert.equal(g.players[1].lives,3);assert.equal(g.prisoners[0].alive,true);
});
test('jeeps run over infantry once, while armored vehicles and turrets damage the jeep',()=>{
 const g=start([input(),input(2)]);quiet(g);const [p,partner]=g.players;partner.x=p.x;partner.y=p.y;p.invulnerable=0;partner.invulnerable=0;g.addEnemy('infantry',p.x,p.y);g.enemies[0].fire=0;
 g.step(.02,[input(),input(2)]);assert.equal(g.enemies[0].alive,false);assert.equal(p.lives,3);assert.equal(partner.lives,3);assert.equal(p.score,100);assert.equal(partner.score,0,'One infantry cannot reward both overlapping jeeps');assert.equal(g.bullets.length,0,'Run-over infantry cannot fire in its final frame');
 for(const type of ['armor','turret']){const hostile=start();quiet(hostile);const driver=hostile.players[0];driver.invulnerable=0;hostile.addEnemy(type,driver.x,driver.y);hostile.step(.02,[input()]);assert.equal(driver.lives,2);assert.equal(hostile.enemies[0].alive,true);assert.equal(driver.score,0);}
});
test('co-op respawn beside a boss stays visible and cannot be clamped inside its hull',()=>{
 const g=start([input(),input(2)]);g.cameraY=48;const [p,partner]=g.players;partner.x=32;partner.y=56;p.alive=false;p.lives=2;p.respawn=0;
 g.respawnPlayer(p);assert.equal(p.alive,true);assert.ok(p.y>=g.cameraY+7&&p.y<=g.cameraY+VIEW_HEIGHT-7);assert.equal(g.blocked(p.x,p.y),false);
 g.step(.02,[input(),input(2)]);assert.equal(g.blocked(p.x,p.y),false);
});
test('three boss defeats advance biomes and finish with a restartable victory',()=>{
 const g=start();const p=g.players[0];p.passengers=2;
 for(let stage=1;stage<=STAGES;stage++){assert.equal(g.stage,stage);g.hitBoss(g.boss.maxHp,1);assert.equal(g.boss.alive,false);assert.ok(g.transition>0);tick(g,2.8,[input(1,{a:stage===STAGES})]);}
 assert.equal(g.phase,'victory');assert.equal(g.rescued,2);assert.equal(g.players[0].score,5000);tick(g,1,[input(1,{a:true})]);assert.equal(g.phase,'victory','Still-held fire cannot dismiss the victory screen');g.step(.02,[input()]);g.step(.02,[input(1,{a:true})]);assert.equal(g.phase,'playing');assert.equal(g.stage,1);assert.equal(g.rescued,0);
});
test('game over cannot restart from a still-held fire button',()=>{
 const g=start();g.players[0].lives=0;g.end();tick(g,1,[input(1,{a:true})]);assert.equal(g.phase,'gameover');g.step(.02,[input()]);g.step(.02,[input(1,{a:true})]);assert.equal(g.phase,'playing');assert.equal(g.players[0].lives,3);
});
test('large frame gaps and invalid joystick values cannot teleport or corrupt vehicles',()=>{
 const g=start();quiet(g);const p=g.players[0],startY=p.y;g.step(100,[input(1,{y:-1,x:Infinity})]);assert.ok(startY-p.y<=54*.05+.001);g.step(NaN,[input(1,{x:NaN,y:'broken'})]);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Number.isFinite(g.time));
});
test('every biome has an unbroken central bridge route and valid spawn space',()=>{
 const g=start([input(),input(2)]);
 for(let stage=1;stage<=STAGES;stage++){g.stage=stage;g.loadStage();assert.equal(g.map.length,60);assert.ok(g.map.every(r=>r.length===14&&r.every(t=>Number.isInteger(t)&&t>=0&&t<=4)));
  for(let row=8;row<60;row++)for(let col=5;col<=8;col++)assert.ok(g.map[row][col]!==2&&g.map[row][col]!==3,'Central jeep route stays open');
  for(const p of g.players){assert.equal(g.blocked(p.x,p.y),false);assert.equal(g.blocked(p.x,p.y-16),false);}assert.ok(g.huts.every(h=>h.prisoners===5));
 }
});
test('extended two-player combat remains deterministic with bounded finite entities',()=>{
 const a=start([input(),input(2)]),b=start([input(),input(2)]);
 for(let n=0;n<9000;n++){
  const inputs=[input(1,{x:Math.sin(n/71),y:Math.cos(n/113),a:n%90<80,b:n%100<75}),input(2,{x:Math.cos(n/79),y:Math.sin(n/91),a:n%80<70,b:n%110<85})];
  for(const g of[a,b]){g.step(1/60,inputs);if(g.phase==='gameover'){g.step(.02,[input(),input(2)]);g.gameoverTimer=1;g.step(.02,[input(1,{a:true}),input(2)]);}assert.ok(g.bullets.length<=120);assert.ok(g.grenades.length<=4);assert.ok(g.effects.length<=48);assert.ok(g.prisoners.length<=41);for(const p of g.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=7&&p.x<=217);assert.ok(p.passengers<=8);}}
 }
 assert.deepEqual(a.status(),b.status());assert.deepEqual(a.players,b.players);
});
