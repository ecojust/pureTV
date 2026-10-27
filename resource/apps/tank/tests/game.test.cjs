const test=require('node:test');
const assert=require('node:assert/strict');
const {TankGame,buildLevel,WIDTH,HEIGHT}=require('../src/main/assets/game.js');
const input=(id=1,more={})=>({id,connected:true,x:0,y:0,a:false,b:false,...more});
const tick=(g,seconds,inputs=[input()])=>{for(let n=0;n<seconds*60;n++)g.step(1/60,inputs);};
const start=(players=[input()])=>{const g=new TankGame(100);g.step(.02,players.map(p=>({...p,a:true})));return g;};

test('phone A starts, second phone may join a running co-op game',()=>{
 const g=new TankGame();g.step(.02,[input()]);assert.equal(g.phase,'lobby');g.step(.02,[input(1,{a:true})]);assert.equal(g.phase,'playing');assert.equal(g.players[0].joined,true);assert.equal(g.players[1].joined,false);
 g.step(.02,[input(),input(2)]);assert.equal(g.players[1].joined,true);assert.equal(g.players[1].lives,3);
});
test('no controller pauses the battlefield, reconnect resumes without simulation catch-up',()=>{
 const g=start();tick(g,1);const before={time:g.spawnTimer,x:g.players[0].x,enemies:JSON.stringify(g.enemies)};tick(g,2,[]);assert.equal(g.phase,'paused');assert.equal(g.spawnTimer,before.time);assert.equal(JSON.stringify(g.enemies),before.enemies);g.step(.02,[input()]);assert.equal(g.phase,'playing');assert.equal(g.players[0].x,before.x);
});
test('walls, water, boundaries and tank bodies block movement',()=>{
 const g=start([input(),input(2)]);g.map=Array.from({length:20},()=>Array(26).fill(0));const p=g.players[0];p.x=80;p.y=80;
 for(const tile of [1,2,3]){g.map[2][3]=tile;const old=p.x;for(let n=0;n<30;n++)g.move(p,1,105,1/60);assert.ok(p.x<=84.001);p.x=old;}
 g.map[2][3]=0;p.x=12;assert.equal(g.move(p,3,105,.02),false);g.players[1].x=104;g.players[1].y=80;p.x=80;assert.equal(g.move(p,1,105,.02),false);
});
test('brick is destructible, steel survives; friendly fire does not destroy the base',()=>{
 const g=start();g.spawnTimer=999;g.map=Array.from({length:20},()=>Array(26).fill(0));const p=g.players[0];
 for(const tile of [1,2]){g.map[2][3]=tile;g.bullets=[{x:93,y:80,dx:1,dy:0,team:'player',owner:p,life:2}];g.step(.02,[input()]);assert.equal(g.map[2][3],tile===1?0:2);assert.equal(g.bullets.length,0);}
 g.bullets=[{x:416,y:590,dx:0,dy:1,team:'player',owner:p,life:2}];g.step(.02,[input()]);assert.equal(g.base.alive,true);
 g.bullets=[{x:416,y:590,dx:0,dy:1,team:'enemy',owner:{},life:2}];g.step(.02,[input()]);assert.equal(g.base.alive,false);assert.equal(g.phase,'gameover');
});
test('B grants timed shield and cooldown; a held B does not repeatedly activate',()=>{
 const g=start();g.spawnTimer=999;const p=g.players[0];p.shield=0;g.step(.02,[input(1,{b:true})]);assert.equal(p.shield,2.5);assert.equal(p.cooldown,10);g.hitPlayer(p);assert.equal(p.lives,3);tick(g,3,[input(1,{b:true})]);assert.equal(p.shield,0);assert.ok(p.cooldown>6);g.hitPlayer(p);assert.equal(p.lives,2);tick(g,1.6);assert.equal(p.alive,true);assert.ok(p.shield>0);tick(g,7,[input(1,{b:true})]);assert.equal(p.cooldown,0);assert.equal(p.shield,0);g.step(.02,[input()]);g.step(.02,[input(1,{b:true})]);assert.equal(p.shield,2.5);
});
test('enemy destruction rewards its player; completed waves advance and preserve scores',()=>{
 const g=start();g.spawnTimer=999;g.remaining=0;g.map=Array.from({length:20},()=>Array(26).fill(0));const p=g.players[0];g.enemies=[{id:1,x:80,y:80,dir:2,alive:true,fire:99,turn:99,speed:0,hp:1}];g.bullets=[{x:60,y:80,dx:1,dy:0,team:'player',owner:p,life:2}];g.step(.03,[input()]);assert.equal(p.score,100);assert.ok(g.transition>0);tick(g,2.6);assert.equal(g.stage,2);assert.equal(p.score,100);assert.equal(g.remaining,14);
});
test('game over requires A release before restart; fresh game resets lives and score',()=>{
 const g=start();g.players[0].score=300;g.players[0].lives=0;g.end();tick(g,1,[input(1,{a:true})]);assert.equal(g.phase,'gameover');g.step(.02,[input()]);g.step(.02,[input(1,{a:true})]);assert.equal(g.phase,'playing');assert.equal(g.players[0].lives,3);assert.equal(g.players[0].score,0);
});
test('simulation keeps bounded entities and finite coordinates over extended play',()=>{
 const g=start([input(),input(2)]);for(let n=0;n<12000;n++){g.step(1/60,[input(1,{x:Math.sin(n/77),y:Math.cos(n/91),a:n%80<60,b:n%601===0}),input(2,{x:Math.cos(n/64),y:Math.sin(n/83),a:n%90<70,b:n%605===0})]);if(g.phase==='gameover'){g.step(.02,[input(),input(2)]);g.gameoverTimer=1;g.step(.02,[input(1,{a:true}),input(2)]);}assert.ok(g.enemies.length<=6);assert.ok(g.bullets.length<=12);assert.ok(g.particles.length<=180);for(const p of g.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=12&&p.x<=WIDTH-12&&p.y>=12&&p.y<=HEIGHT-12);}}
});
test('level definitions stay valid and player spawn lanes remain clear',()=>{
 for(let stage=1;stage<=12;stage++){const map=buildLevel(stage);assert.equal(map.length,20);assert.ok(map.every(row=>row.length===26&&row.every(t=>Number.isInteger(t)&&t>=0&&t<=4)));for(const x of [10,15])assert.equal(map[18][x],0);}
});
