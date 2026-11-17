const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {TankGame,TILE,WIDTH,HEIGHT}=require('../src/main/assets/game-model.js');
const Levels=require('../src/main/assets/levels.js');
const input=(id=1,more={})=>({id,connected:true,x:0,y:0,a:false,b:false,start:false,select:false,...more});
const frames=(g,n,inputs=[input()])=>{for(let i=0;i<n;i++)g.step(1/60,inputs);};
const press=(g,key,id=1)=>{g.step(1/60,[input(id,{[key]:true})]);g.step(1/60,[input(id)]);};
const start=(players=1)=>new TankGame(100).start(Array.from({length:players},(_,i)=>input(i+1)));
const lab=(players=1)=>{const g=start(players);g.map=Array.from({length:52},()=>Array(52).fill(0));g.spawnTimer=1e6;g.players.forEach(p=>{p.spawnFrames=0;p.shieldCounter=0;});return g;};
const hash=s=>createHash('sha256').update(s).digest('hex');
const enemy=(g,type='basic',more={})=>{const e={id:10,type,hp:type==='armor'?4:1,x:104,y:40,dir:2,alive:true,spawnFrames:0,slot:0,waitFrames:1e6,...more};g.enemies.push(e);return e;};
const shot=(more={})=>({x:80,y:80,dx:0,dy:-1,dir:0,owner:1,team:'player',speed:2,steel:false,alive:true,...more});

test('all 35 map layouts and all 20-enemy wave sequences match independent source fixtures',()=>{
 assert.equal(Levels.maps.length,35);assert.equal(WIDTH,208);assert.equal(HEIGHT,208);assert.equal(TILE,4);
 assert.ok(Levels.maps.every(m=>m.length===13&&m.every(r=>r.length===13)));
 // SHA fixtures were computed from the 35 original ASCII reference files and enemy tables,
 // not from the implementation; source permalinks and map corrections are in docs/reference.md.
 assert.equal(hash(Levels.maps.map(m=>m.join('\n')).join('\n')),'1c835a60ffbcf9cc2e61057cd393a49a168206412c18a81f38e51f8584f25545');
 assert.equal(hash(Array.from({length:35},(_,i)=>Levels.wave(i+1).join(',')).join('\n')),'2679333ac97b77290ad44c261a36321eb5b3d9b9257e5b91e0f951dc0d0deb64');
 assert.deepEqual(Levels.wave(1),[...Array(18).fill('basic'),'fast','fast']);
 assert.deepEqual(Levels.wave(2).slice(0,6),['armor','armor','fast','fast','fast','fast']);
 assert.ok(Array.from({length:35},(_,i)=>Levels.wave(i+1)).every(w=>w.length===20));
 assert.deepEqual(Levels.wave(1,true),Levels.wave(35));
});

test('13×13 metatiles preserve half-bricks, steel, water, trees and ice',()=>{
 const map=Levels.decode(Array(13).fill('#]-_[}@v{^~T*'));
 assert.deepEqual(map[0].slice(4,8),[0,0,1,1]);
 assert.deepEqual(map[0].slice(8,12),[1,1,1,1]);assert.deepEqual(map[2].slice(8,12),[0,0,0,0]);
 assert.deepEqual(map[0].slice(12,16),[0,0,0,0]);assert.deepEqual(map[2].slice(12,16),[1,1,1,1]);
 assert.deepEqual([map[0][40],map[0][44],map[0][48]],[3,4,5]);
 for(let stage=1;stage<=35;stage++){
  const g=start();g.stage=stage;g.loadStage();assert.equal(g.map.length,52);
  assert.deepEqual([g.base.x,g.base.y],[104,200]);
  assert.equal(g.map[46][22],1);assert.equal(g.map[48][22],1);assert.equal(g.map[48][29],1);
  assert.equal(g.map[48][24],0);assert.equal(g.map[44][20],0);
  assert.equal(g.cell(72,200),0);
 }
});

test('original title choices, bounded stage selection, Start pause and a 2P game',()=>{
 const g=new TankGame();press(g,'a');assert.equal(g.phase,'title');
 press(g,'select');assert.equal(g.menuIndex,1);press(g,'start');assert.equal(g.phase,'stageintro');assert.equal(g.selectedPlayers,2);
 press(g,'b');assert.equal(g.stage,1);press(g,'a');assert.equal(g.stage,2);
 g.stage=35;press(g,'a');assert.equal(g.stage,35);press(g,'start');frames(g,90,[input(),input(2)]);
 assert.equal(g.phase,'playing');assert.equal(g.players[1].joined,true);assert.equal(g.players[1].lives,3);
 press(g,'start');assert.equal(g.phase,'paused');const before=g.battleFrames;frames(g,60);assert.equal(g.battleFrames,before);
 press(g,'start');assert.equal(g.phase,'playing');
});

test('single-action phone layout can select stages in both directions with its stick',()=>{
 const g=new TankGame();press(g,'start');assert.equal(g.stageSelect,true);
 frames(g,1,[input(1,{x:1})]);assert.equal(g.stage,2);
 frames(g,1,[input(1,{x:-1})]);assert.equal(g.stage,1);
 frames(g,20,[input(1,{y:-1})]);assert.equal(g.stage,1);
 g.stage=34;frames(g,1,[input(1,{y:1})]);assert.equal(g.stage,35);
 frames(g,20,[input(1,{y:1})]);assert.equal(g.stage,35);
 frames(g,1);frames(g,1,[input(1,{x:.2})]);assert.equal(g.stage,35);
 press(g,'start');assert.equal(g.stageSelect,false);frames(g,90);assert.equal(g.phase,'playing');
});

test('disconnect and native pause preserve the battle, and stalls never fast-forward seconds',()=>{
 const g=start();frames(g,60);const before=g.battleFrames;frames(g,120,[]);assert.equal(g.phase,'paused');assert.equal(g.battleFrames,before);
 frames(g,1);assert.equal(g.phase,'playing');g.togglePause();frames(g,60);assert.equal(g.battleFrames,before+1);g.togglePause();
 const frame=g.battleFrames;g.step(10,[input()]);assert.ok(g.battleFrames-frame<=6);
});

test('first enemy is center, then right and left; 4/6 limits, original ordinal carriers and rates',()=>{
 const g=lab();g.spawnTimer=0;frames(g,1);assert.equal(g.enemies[0].x,104);assert.equal(g.enemies[0].type,'basic');assert.equal(g.remaining,19);assert.equal(g.spawnDelay,186);
 g.enemies[0].y=80;g.spawnEnemy();assert.equal(g.enemies[1].x,200);g.spawnEnemy();assert.equal(g.enemies[2].x,8);
 g.enemies.forEach(e=>e.y=80);g.spawnEnemy();assert.equal(g.enemies[3].bonus,true);assert.equal(g.spawnEnemy(),false);
 const coop=lab(2);assert.equal(coop.spawnDelay,166);for(let n=0;n<6;n++){coop.enemies.forEach((e,i)=>e.y=40+i*20);assert.equal(coop.spawnEnemy(),true);}assert.equal(coop.spawnEnemy(),false);
 const carriers=lab();const ordinals=[];for(let n=1;n<=20;n++){carriers.enemies=[];carriers.spawnEnemy();if(carriers.enemies[0].bonus)ordinals.push(n);}assert.deepEqual(ordinals,[4,11,18]);
});

test('player moves 3 of 4 frames, slow enemies every other frame and fast enemies every frame',()=>{
 const g=lab();const p=g.players[0];p.x=40;p.y=100;frames(g,60,[input(1,{x:1})]);assert.equal(p.x,85);
 // Keep direction deterministic and bypass the separately tested AI, preserving motion scheduling.
 const h=lab();const slow=enemy(h,'basic',{x:40,y:40,waitFrames:0}),fast=enemy(h,'fast',{id:11,x:120,y:40,waitFrames:0});
 h.enemyMotion=e=>h.move(e,2);h.random=()=>1;frames(h,60);assert.equal(slow.y,70);assert.equal(fast.y,100);
});

test('walls and water block tanks; trees and ice are passable; turning aligns to 8px',()=>{
 const g=lab();const p=g.players[0];p.x=40;p.y=40;
 for(const terrain of [1,2,3]){g.map[8][12]=terrain;assert.equal(g.move(p,1),false);assert.equal(p.x,40);}
 for(const terrain of [4,5]){g.map[8][12]=terrain;p.x=40;assert.equal(g.move(p,1),true);}
 g.map[8][12]=0;p.x=53;p.y=53;p.dir=1;g.move(p,0);assert.equal(p.x,56);
 p.x=8;p.y=8;assert.equal(g.move(p,3),false);
 const q=enemy(g,'basic',{x:24,y:8});assert.equal(g.move(p,1),false);q.alive=false;assert.equal(g.move(p,1),true);
});

test('A and B each fire on an edge; holding does not auto-fire or grant shields',()=>{
 const g=lab();g.players[0].x=40;g.players[0].y=180;
 frames(g,120,[input(1,{a:true})]);assert.equal(g.events.filter(e=>e.type==='fire').length,1);assert.equal(g.players[0].shieldCounter,0);
 frames(g,1);press(g,'b');assert.equal(g.events.filter(e=>e.type==='fire').length,2);assert.equal(g.players[0].shieldCounter,0);
});

test('three stars give 4px bullets, then two shells, then steel destruction; death resets upgrades',()=>{
 const g=lab(),p=g.players[0];g.fire(p);assert.equal(g.bullets[0].speed,2);assert.equal(g.fire(p),false);
 g.bullets=[];g.takePowerUp(p,'star');g.fire(p);assert.equal(g.bullets[0].speed,4);assert.equal(g.fire(p),false);
 g.bullets=[];g.takePowerUp(p,'star');assert.equal(g.fire(p),true);assert.equal(g.fire(p),true);assert.equal(g.fire(p),false);
 g.bullets=[];g.takePowerUp(p,'star');g.fire(p);assert.equal(g.bullets[0].steel,true);g.takePowerUp(p,'star');assert.equal(p.stars,3);
 g.hitPlayer(p);assert.equal(p.stars,0);assert.equal(p.lives,2);
});

test('normal shots carve one 4px brick layer; steel resists until max stars',()=>{
 for(const [tile,steel,remaining] of [[1,false,2],[2,false,4],[2,true,0]]){
  const g=lab();for(let y=10;y<12;y++)for(let x=10;x<12;x++)g.map[y][x]=tile;
  g.bullets=[shot({x:44,y:50,steel})];g.advanceBullets();g.advanceBullets();
  assert.equal(g.map.slice(10,12).flatMap(r=>r.slice(10,12)).filter(Boolean).length,remaining);
  assert.equal(g.bullets.length,0);
 }
 const g=lab();for(const tile of [3,4,5]){g.map[10][10]=tile;g.bullets=[shot({x:42,y:45})];g.advanceBullets();assert.equal(g.bullets.length,1);}
});

test('player shells also destroy headquarters; friendly fire freezes a partner without killing',()=>{
 const g=lab(2),p=g.players[1];p.x=80;p.y=80;
 g.bullets=[shot({x:80,y:92})];g.advanceBullets();g.advanceBullets();assert.equal(p.freezeFrames,200);assert.equal(p.lives,3);
 const before=p.y;frames(g,100,[input(),input(2,{y:-1})]);assert.equal(p.y,before);assert.equal(p.freezeFrames,125);
 p.freezeFrames=0;p.shieldCounter=3;g.bullets=[shot({x:80,y:92})];g.advanceBullets();g.advanceBullets();assert.equal(p.freezeFrames,0);
 g.bullets=[shot({x:104,y:190,dy:1,dir:2})];g.advanceBullets();g.advanceBullets();assert.equal(g.base.alive,false);
});

test('bullets cancel against other owners, while enemies cannot shoot one another',()=>{
 const g=lab();const e=enemy(g,'armor',{x:80,y:80});g.bullets=[shot({x:80,y:92,team:'enemy',owner:11})];g.advanceBullets();g.advanceBullets();assert.equal(e.hp,4);
 g.bullets=[shot({x:40,y:42}),shot({x:40,y:38,dy:1,team:'enemy',owner:10})];g.advanceBullets();assert.equal(g.bullets.length,0);
});

test('armor needs four hits, drops a bonus on first hit, and awards 400 points only on destruction',()=>{
 const g=lab(),p=g.players[0],e=enemy(g,'armor',{bonus:true});
 g.hitEnemy(e,p);assert.equal(e.hp,3);assert.ok(g.powerUp);assert.equal(e.bonus,false);assert.equal(p.score,0);
 assert.ok([32,80,128,176].includes(g.powerUp.x));assert.ok([32,80,128,176].includes(g.powerUp.y));
 g.hitEnemy(e,p);g.hitEnemy(e,p);assert.equal(e.alive,true);g.hitEnemy(e,p);assert.equal(e.alive,false);assert.equal(p.score,400);assert.equal(g.stats[0].armor,1);
});

test('six original pickups: helmet/watch/shovel counters, grenade score and tank life',()=>{
 const g=lab(),p=g.players[0];g.takePowerUp(p,'helmet');assert.equal(p.shieldCounter,10);assert.equal(g.hitPlayer(p),false);
 g.takePowerUp(p,'watch');const e=enemy(g,'fast');const y=e.y;frames(g,20);assert.equal(e.y,y);assert.equal(g.enemyFreezeCounter,10);
 g.takePowerUp(p,'shovel');assert.equal(g.shovelCounter,20);assert.equal(g.map[46][22],2);
 const spawning=enemy(g,'basic',{id:11,spawnFrames:10});g.takePowerUp(p,'grenade');assert.equal(e.alive,false);assert.equal(spawning.alive,true);assert.equal(g.stats[0].total,0);assert.equal(p.score,2000);
 g.takePowerUp(p,'tank');assert.equal(p.lives,4);assert.equal(p.score,2500);
 g.frame=63;frames(g,1);assert.equal(p.shieldCounter,9);assert.equal(g.enemyFreezeCounter,9);assert.equal(g.shovelCounter,19);
 g.shovelCounter=1;g.frame=127;frames(g,1);assert.equal(g.map[46][22],1);
});

test('ice retains movement after release and stops after its 28 movement ticks',()=>{
 const g=lab(),p=g.players[0];g.map=Array.from({length:52},()=>Array(52).fill(5));p.x=40;p.y=40;
 frames(g,4,[input(1,{x:1})]);assert.equal(p.x,43);frames(g,40);assert.equal(p.x,71);assert.equal(p.slideFrames,0);frames(g,20);assert.equal(p.x,71);
});

test('20,000 points grants one life once, stage stats award 2P winner 1,000 and preserve stars',()=>{
 const g=lab(2),p=g.players[0];p.score=19900;g.addScore(p,100);assert.equal(p.lives,4);g.addScore(p,20000);assert.equal(p.lives,4);
 p.stars=2;g.stats[0].basic=12;g.stats[0].total=12;g.stats[1].total=8;g.beginResults();assert.equal(g.stats[0].bonus,1000);
 const score=p.score;g.finishResults();assert.equal(g.stage,2);frames(g,90,[input(),input(2)]);assert.equal(p.score,score);assert.equal(p.stars,2);
 assert.equal(g.remaining,20);assert.equal(g.stats[0].total,0);
 g.stage=35;g.beginResults();g.finishResults();assert.equal(g.stage,1);assert.equal(g.loop,1);g.loadStage();assert.deepEqual(g.wave,Levels.wave(35));assert.equal(g.spawnDelay,30);
});

test('construction paints 14 original tiles, survives title, and replaces only the next battle',()=>{
 const g=new TankGame();press(g,'select');press(g,'select');press(g,'start');assert.equal(g.phase,'construction');
 press(g,'a');assert.deepEqual(g.map[0].slice(0,4),[0,0,1,1]);press(g,'a');assert.deepEqual(g.map[0].slice(0,4),[0,0,0,0]);assert.deepEqual(g.map[2].slice(0,4),[1,1,1,1]);
 press(g,'start');assert.equal(g.phase,'title');assert.equal(g.customPending,true);press(g,'start');press(g,'start');frames(g,90);
 assert.equal(g.phase,'playing');assert.equal(g.map[2][1],1);assert.equal(g.customPending,false);
 g.stage=2;g.loadStage();assert.equal(g.map[2][1],0);
});

test('last enemy leads to statistics; base loss leads through statistics to game over and title',()=>{
 const g=lab();g.remaining=0;frames(g,120);assert.equal(g.phase,'results');frames(g,360);assert.equal(g.phase,'stageintro');
 const h=lab();h.base.alive=false;frames(h,180);assert.equal(h.phase,'results');assert.equal(h.resultGameOver,true);frames(h,360);assert.equal(h.phase,'gameover');frames(h,240);assert.equal(h.phase,'title');
});

test('fixed seed and fixed frame inputs produce deterministic bounded long games',()=>{
 const a=start(2),b=start(2);
 for(let n=0;n<12000;n++){
  const inputs=[input(1,{x:Math.sin(n/41),y:Math.cos(n/61),a:n%17===0,b:n%23===0}),input(2,{x:Math.cos(n/73),y:Math.sin(n/51),a:n%19===0})];
  a.step(1/60,inputs);b.step(1/60,inputs);
  if(a.phase==='title'){a.start(inputs);b.start(inputs);}
  assert.ok(a.enemies.length<=6);assert.ok(a.bullets.length<=10);assert.ok(a.explosions.length<=32);
  for(const p of a.players)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=8&&p.x<=200&&p.y>=8&&p.y<=200);
 }
 assert.equal(JSON.stringify(a),JSON.stringify(b));
});

test('native room status publishes detached player HUD values within the bridge limit',()=>{
 const g=lab(2);g.stage=12;g.players[1].score=12300;g.players[1].lives=2;g.players[1].stars=3;
 const snapshot=g.status();assert.equal(snapshot.phase,'playing');assert.equal(snapshot.stage,12);
 assert.deepEqual(snapshot.players[1],{id:2,connected:true,joined:true,alive:true,lives:2,score:12300,stars:3});
 snapshot.players[1].lives=99;assert.equal(g.players[1].lives,2);
 assert.ok(Buffer.byteLength(JSON.stringify(g.status()))<4096);
 g.togglePause();assert.equal(g.status().phase,'paused');
});
