/* Jackal TV: original scrolling rescue game, with no ROM or external game assets.
 * Shared renderer contract: native world 224×960; viewport 224×208; tile16.
 * Tiles: 0 grass, 1 road/dirt, 2 water (solid), 3 stone (solid), 4 bridge.
 * Direction: 0 north, then clockwise through eight directions.
 * All entity positions are world-space centers. Width/height are full extents.
 * Public arrays: players, enemies, bullets, grenades, huts, prisoners, helipads,
 * effects. Public boss has x/y/w/h/hp/maxHp/alive/active. cameraY is world top.
 * A fires north; B throws in the current driving direction. Inputs are snapshots.
 */
(function(root){
'use strict';
const TILE=16,WORLD_WIDTH=224,WORLD_HEIGHT=960,VIEW_HEIGHT=208,STAGES=3;
const COLS=WORLD_WIDTH/TILE,ROWS=WORLD_HEIGHT/TILE,PLAYER_RADIUS=7;
const DIR8=[[0,-1],[Math.SQRT1_2,-Math.SQRT1_2],[1,0],[Math.SQRT1_2,Math.SQRT1_2],[0,1],[-Math.SQRT1_2,Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,-Math.SQRT1_2]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=v=>Number.isFinite(Number(v))?Number(v):0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function direction(x,y){return((Math.round(Math.atan2(x,-y)/(Math.PI/4))%8)+8)%8;}
function intersects(x,y,r,item){return Math.abs(x-item.x)<r+item.w/2&&Math.abs(y-item.y)<r+item.h/2;}
function circleRect(x,y,r,item){return Math.hypot(Math.max(0,Math.abs(x-item.x)-item.w/2),Math.max(0,Math.abs(y-item.y)-item.h/2))<=r;}
function buildLevel(stage){
 const map=Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>c>=5&&c<=8?1:0));
 // Broad connected routes leave space for two jeeps. Every river has a 64px bridge.
 for(const row of [9,18,27,39,49,55])for(let r=row;r<row+2;r++)for(let c=1;c<COLS-1;c++)map[r][c]=1;
 for(const row of (stage===1?[29]:stage===2?[24,42]:[17,35]))for(let r=row;r<row+3;r++)for(let c=0;c<COLS;c++)map[r][c]=c>=5&&c<=8?4:2;
 for(const [row,col] of [[11,1],[11,12],[20,2],[20,11],[34,1],[34,12],[46,2],[46,11]]){
  if(map[row][col]!==2){map[row][col]=3;map[row+1][col]=3;}
 }
 // Clear exit apron and spawn beach.
 for(let r=0;r<8;r++)for(let c=2;c<12;c++)map[r][c]=1;
 for(let r=56;r<ROWS;r++)for(let c=2;c<12;c++)map[r][c]=1;
 return map;
}
function makePlayer(id){return{id,x:id===1?88:136,y:912,dir:0,alive:true,joined:false,connected:false,lives:3,score:0,passengers:0,rescued:0,weaponLevel:0,grenadeCooldown:0,fire:0,invulnerable:0,respawn:0,moving:false,unload:0};}
class JackalGame{
 constructor(seed=1988){
  this.rng=random(seed);this.stage=1;this.phase='lobby';this.time=0;this.players=[makePlayer(1),makePlayer(2)];
  this.manualPause=false;this.transition=0;this.gameoverTimer=0;this.restartArmed=false;this.rescued=0;this.events=[];this.nextEntity=0;
  this.loadStage();
 }
 start(inputs=[]){
  this.stage=1;this.time=0;this.rescued=0;this.manualPause=false;this.players=[makePlayer(1),makePlayer(2)];
  for(const p of this.players){const i=inputs.find(v=>v.id===p.id);p.connected=p.joined=!!(i&&i.connected);}
  this.loadStage();this.phase='playing';this.restartArmed=false;this.events=[];
 }
 loadStage(){
  this.map=buildLevel(this.stage);this.cameraY=WORLD_HEIGHT-VIEW_HEIGHT;this.bullets=[];this.grenades=[];this.effects=[];this.prisoners=[];this.enemies=[];this.transition=0;this.bossDefeated=false;
  this.huts=[{x:48,y:840},{x:176,y:696},{x:48,y:552},{x:176,y:360},{x:48,y:216}].map((p,n)=>({id:n+1,...p,w:32,h:24,hp:3,maxHp:3,open:false,prisoners:5}));
  this.helipads=[{x:168,y:824},{x:48,y:632},{x:176,y:520},{x:48,y:328},{x:176,y:184}].map((p,n)=>({id:n+1,...p,w:32,h:32,unloading:0}));
  // Keep interactive structures reachable even where a later biome has a river.
  for(const object of this.huts.concat(this.helipads))for(let r=Math.floor((object.y-24)/TILE);r<=Math.floor((object.y+24)/TILE);r++)for(let c=Math.floor((object.x-24)/TILE);c<=Math.floor((object.x+24)/TILE);c++)if(r>=0&&r<ROWS&&c>=0&&c<COLS)this.map[r][c]=1;
  for(const [n,y]of [864,784,720,640,576,496,416,336,256,176].entries()){
   const x=n%2?176:48;
   this.addEnemy(n%3===1?'turret':'infantry',x,y);
   if(n>0)this.addEnemy(n%3===0?'armor':'infantry',n%2?72:152,y-24);
  }
  for(const enemy of this.enemies){const safe=this.findFree(enemy.x,enemy.y,enemy.type==='armor'?9:5);enemy.x=safe.x;enemy.y=safe.y;}
  this.boss={x:112,y:72,w:64,h:32,hp:28+this.stage*8,maxHp:28+this.stage*8,alive:true,active:false,fire:1.6,dir:4};
  for(const p of this.players){p.x=p.id===1?88:136;p.y=912;p.dir=0;p.alive=p.lives>0;p.respawn=0;p.invulnerable=3;p.grenadeCooldown=0;p.fire=0;p.moving=false;p.unload=0;}
 }
 addEnemy(type,x,y){const hp=type==='armor'?4:type==='turret'?3:1;this.enemies.push({id:++this.nextEntity,type,x,y,dir:4,alive:true,hp,maxHp:hp,fire:.8+this.rng(),active:false,turn:0});}
 togglePause(){if(this.phase==='playing'||this.phase==='paused'){this.manualPause=!this.manualPause;this.phase=this.manualPause?'paused':'playing';}}
 blocked(x,y,r=PLAYER_RADIUS){
  if(x-r<0||y-r<0||x+r>WORLD_WIDTH||y+r>WORLD_HEIGHT)return true;
  for(let row=Math.floor((y-r)/TILE);row<=Math.floor((y+r-.001)/TILE);row++)for(let col=Math.floor((x-r)/TILE);col<=Math.floor((x+r-.001)/TILE);col++)if(this.map[row][col]===2||this.map[row][col]===3)return true;
  if(this.huts.some(h=>!h.open&&intersects(x,y,r,h)))return true;
  return !!(this.boss&&this.boss.alive&&intersects(x,y,r,this.boss));
 }
 findFree(x,y,r=PLAYER_RADIUS,minY=r,maxY=WORLD_HEIGHT-r){
  minY=Math.max(r,minY);maxY=Math.min(WORLD_HEIGHT-r,maxY);
  x=clamp(x,r,WORLD_WIDTH-r);y=clamp(y,minY,maxY);
  if(!this.blocked(x,y,r))return{x,y};
  for(let step=8;step<=96;step+=8)for(const [dx,dy]of DIR8){const nx=clamp(x+dx*step,r,WORLD_WIDTH-r),ny=clamp(y+dy*step,minY,maxY);if(!this.blocked(nx,ny,r))return{x:nx,y:ny};}
  for(let row=Math.floor(minY/TILE);row<=Math.floor(maxY/TILE);row++)for(let col=0;col<COLS;col++){const nx=clamp(col*TILE+8,r,WORLD_WIDTH-r),ny=clamp(row*TILE+8,minY,maxY);if(!this.blocked(nx,ny,r))return{x:nx,y:ny};}
  return null;
 }
 move(p,x,y,dt,speed=54){
  x=clamp(finite(x),-1,1);y=clamp(finite(y),-1,1);const strength=Math.hypot(x,y);p.moving=false;if(strength<.22)return false;
  x/=Math.max(1,strength);y/=Math.max(1,strength);p.dir=direction(x,y);const oldX=p.x,oldY=p.y;
  const nx=p.x+x*speed*dt,ny=p.y+y*speed*dt;
  if(!this.blocked(nx,p.y,PLAYER_RADIUS))p.x=nx;
  if(!this.blocked(p.x,ny,PLAYER_RADIUS))p.y=ny;
  p.y=clamp(p.y,this.cameraY+PLAYER_RADIUS,this.cameraY+VIEW_HEIGHT-PLAYER_RADIUS);
  p.moving=Math.abs(p.x-oldX)+Math.abs(p.y-oldY)>.01;return p.moving;
 }
 fire(p){
  if(p.fire>0||!p.alive)return;
  this.bullets.push({x:p.x,y:p.y-11,dx:0,dy:-1,team:'player',owner:p.id,life:1.55});p.fire=.17;this.events.push('fire');
 }
 throwGrenade(p){
  if(p.grenadeCooldown>0||!p.alive)return;
  const [dx,dy]=DIR8[p.dir];const life=.65+(p.weaponLevel*.08);
  this.grenades.push({x:p.x+dx*9,y:p.y+dy*9,startX:p.x,startY:p.y,dx,dy,life,maxLife:life,owner:p.id,power:p.weaponLevel});p.grenadeCooldown=.75;this.events.push('grenade');
 }
 effect(x,y,kind='explosion'){this.effects.push({x,y,kind,life:kind==='rescue'?.7:.4,maxLife:kind==='rescue'?.7:.4});if(this.effects.length>48)this.effects.shift();}
 reward(owner,points){const p=this.players.find(v=>v.id===owner);if(p)p.score+=points;}
 damageEnemy(enemy,damage,owner){
  if(!enemy.alive)return;enemy.hp-=damage;if(enemy.hp<=0){enemy.hp=0;enemy.alive=false;this.reward(owner,enemy.type==='armor'?200:enemy.type==='turret'?150:100);this.effect(enemy.x,enemy.y);this.events.push('explosion');}
 }
 openHut(hut){
  if(hut.open)return;hut.open=true;hut.hp=0;this.effect(hut.x,hut.y);this.events.push('explosion');
  for(let n=0;n<hut.prisoners;n++){const point=this.findFree(hut.x+(n-2)*5,hut.y+8,3);this.prisoners.push({id:++this.nextEntity,...point,alive:true});}
 }
 explode(grenade){
  const radius=20+grenade.power*7;this.effect(grenade.x,grenade.y);this.events.push('explosion');
  for(const enemy of this.enemies)if(enemy.alive&&distance(enemy,grenade)<radius+(enemy.type==='armor'?10:5))this.damageEnemy(enemy,4+grenade.power*2,grenade.owner);
  for(const hut of this.huts)if(!hut.open&&circleRect(grenade.x,grenade.y,radius,hut)){hut.hp-=3+grenade.power;if(hut.hp<=0)this.openHut(hut);}
  if(this.boss.alive&&circleRect(grenade.x,grenade.y,radius,this.boss))this.hitBoss(4+grenade.power*2,grenade.owner);
 }
 hitBoss(damage,owner){
  if(!this.boss.alive)return;this.boss.hp=Math.max(0,this.boss.hp-damage);
  if(this.boss.hp===0){this.boss.alive=false;this.bossDefeated=true;this.transition=2.6;this.bullets=[];this.reward(owner,1500);this.effect(this.boss.x,this.boss.y);this.events.push('victory');}
 }
 hitPlayer(p){
  if(!p.alive||p.invulnerable>0)return;p.alive=false;p.lives=Math.max(0,p.lives-1);p.respawn=1.4;p.weaponLevel=Math.max(0,p.weaponLevel-1);
  for(let n=0;n<p.passengers;n++){const point=this.findFree(p.x+(n%4-1.5)*5,p.y+Math.floor(n/4)*5,3);this.prisoners.push({id:++this.nextEntity,...point,alive:true});}
  p.passengers=0;p.unload=0;this.effect(p.x,p.y);this.events.push('explosion');
 }
 end(){this.phase='gameover';this.gameoverTimer=0;this.restartArmed=false;this.events.push('gameover');}
 updateCamera(){
  const active=this.players.filter(p=>p.connected&&p.alive&&p.joined);
  if(!active.length)return;
  // The trailing jeep controls the scroll, so neither teammate is dragged into hazards.
  const desired=clamp(Math.max(...active.map(p=>p.y))-150,0,WORLD_HEIGHT-VIEW_HEIGHT);
  this.cameraY=Math.min(this.cameraY,desired);
 }
 respawnPlayer(p){
  const partners=this.players.filter(v=>v!==p&&v.connected&&v.alive&&v.joined);const y=partners.length?partners[0].y:Math.min(WORLD_HEIGHT-16,this.cameraY+176);
  const spot=this.findFree(p.id===1?96:128,clamp(y,this.cameraY+16,this.cameraY+VIEW_HEIGHT-16),PLAYER_RADIUS,this.cameraY+PLAYER_RADIUS,this.cameraY+VIEW_HEIGHT-PLAYER_RADIUS);
  if(!spot){p.alive=false;p.respawn=.1;return;}
  Object.assign(p,spot);p.alive=true;p.invulnerable=3;p.dir=0;p.grenadeCooldown=0;p.fire=0;
 }
 deliver(p){
  if(p.passengers<=0)return;p.passengers--;p.rescued++;this.rescued++;p.score+=250;this.effect(p.x,p.y,'rescue');this.events.push('rescue');
  const level=Math.min(2,Math.floor(p.rescued/3));if(level>p.weaponLevel){p.weaponLevel=level;this.events.push('upgrade');}
 }
 updateRescue(dt){
  for(const pad of this.helipads)pad.unloading=Math.max(0,pad.unloading-dt);
  for(const prisoner of this.prisoners){
   if(!prisoner.alive)continue;
   let nearest=null,dist=Infinity;
   for(const p of this.players)if(p.connected&&p.alive&&p.joined&&p.passengers<8){const d=distance(p,prisoner);if(d<dist){nearest=p;dist=d;}}
   if(!nearest||dist>42)continue;
   if(dist<12){nearest.passengers++;prisoner.alive=false;this.effect(prisoner.x,prisoner.y,'rescue');this.events.push('rescue');continue;}
   const x=prisoner.x+(nearest.x-prisoner.x)/dist*17*dt,y=prisoner.y+(nearest.y-prisoner.y)/dist*17*dt;
   if(!this.blocked(x,prisoner.y,3))prisoner.x=x;if(!this.blocked(prisoner.x,y,3))prisoner.y=y;
  }
  this.prisoners=this.prisoners.filter(p=>p.alive);
  for(const p of this.players){
   const pad=this.helipads.find(h=>Math.abs(p.x-h.x)<17&&Math.abs(p.y-h.y)<17);
   if(!p.connected||!p.alive||p.moving||!pad||!p.passengers){p.unload=0;continue;}
   p.unload+=dt;pad.unloading=.8;if(p.unload>=.35){p.unload-=.35;this.deliver(p);}
  }
 }
 enemyShot(enemy,target,spread=0){
  const angle=Math.atan2(target.y-enemy.y,target.x-enemy.x)+spread;
  this.bullets.push({x:enemy.x,y:enemy.y,dx:Math.cos(angle),dy:Math.sin(angle),team:'enemy',owner:0,life:3});
 }
 updateEnemies(dt){
  const targets=this.players.filter(p=>p.joined&&p.connected&&p.alive);if(!targets.length)return;
  for(const enemy of this.enemies){
   if(!enemy.alive)continue;enemy.active=enemy.y>this.cameraY-24&&enemy.y<this.cameraY+VIEW_HEIGHT+16;if(!enemy.active)continue;
   const target=targets.reduce((a,p)=>distance(p,enemy)<distance(a,enemy)?p:a,targets[0]);const d=distance(target,enemy),dx=(target.x-enemy.x)/Math.max(1,d),dy=(target.y-enemy.y)/Math.max(1,d);enemy.dir=direction(dx,dy);enemy.fire-=dt;
   if(enemy.type!=='turret'&&d>22){const speed=enemy.type==='armor'?17:13,r=enemy.type==='armor'?9:4;const nx=enemy.x+dx*speed*dt,ny=enemy.y+dy*speed*dt;if(!this.blocked(nx,enemy.y,r))enemy.x=nx;if(!this.blocked(enemy.x,ny,r))enemy.y=ny;}
   for(const p of targets)if(p.alive&&distance(p,enemy)<(enemy.type==='armor'?16:11)){
    if(enemy.type==='infantry'){this.damageEnemy(enemy,enemy.hp,p.id);break;}
    this.hitPlayer(p);
   }
   if(!enemy.alive)continue;
   if(enemy.fire<=0&&d<180){this.enemyShot(enemy,target);enemy.fire=(enemy.type==='turret'?1.45:2)+this.rng()*.65;}
  }
  this.boss.active=this.boss.alive&&this.cameraY<144;
  if(this.boss.active){this.boss.fire-=dt;if(this.boss.fire<=0){const target=targets.reduce((a,p)=>distance(p,this.boss)<distance(a,this.boss)?p:a,targets[0]);for(const spread of this.stage===3?[-.45,-.22,0,.22,.45]:[-.25,0,.25])this.enemyShot(this.boss,target,spread);this.boss.fire=1.45-this.stage*.12;}}
 }
 updateProjectiles(dt){
  for(let index=this.bullets.length-1;index>=0;index--){
   const b=this.bullets[index];if(!b)continue;b.life-=dt;let remove=b.life<=0;
   const steps=2,speed=b.team==='player'?160:66+this.stage*3;
   for(let n=0;n<steps&&!remove;n++){
    b.x+=b.dx*speed*dt/steps;b.y+=b.dy*speed*dt/steps;
    remove=b.x<0||b.x>=WORLD_WIDTH||b.y<0||b.y>=WORLD_HEIGHT||b.y<this.cameraY-32||b.y>this.cameraY+VIEW_HEIGHT+32;if(remove)break;
    if(this.map[Math.floor(b.y/TILE)][Math.floor(b.x/TILE)]===3||this.huts.some(h=>!h.open&&intersects(b.x,b.y,1,h))){remove=true;this.effect(b.x,b.y,'spark');continue;}
    if(b.team==='player'){
     const enemy=this.enemies.find(e=>e.alive&&Math.abs(e.x-b.x)<(e.type==='armor'?10:e.type==='turret'?8:5)&&Math.abs(e.y-b.y)<(e.type==='armor'?12:e.type==='turret'?8:6));
     if(enemy){this.damageEnemy(enemy,1,b.owner);remove=true;}
     else if(this.boss.alive&&intersects(b.x,b.y,1,this.boss)){this.hitBoss(.25,b.owner);remove=true;}
    }else{
     const player=this.players.find(p=>p.connected&&p.joined&&p.alive&&Math.abs(p.x-b.x)<6&&Math.abs(p.y-b.y)<8);if(player){this.hitPlayer(player);remove=true;}
    }
   }
   // Boss destruction can clear the whole array while handling the final bullet.
   if(remove&&this.bullets[index]===b)this.bullets.splice(index,1);
  }
  for(let index=this.grenades.length-1;index>=0;index--){const g=this.grenades[index];g.life-=dt;g.x=clamp(g.x+g.dx*83*dt,0,WORLD_WIDTH-1);g.y=clamp(g.y+g.dy*83*dt,0,WORLD_HEIGHT-1);if(g.life<=0){this.explode(g);this.grenades.splice(index,1);}}
  if(this.bullets.length>120)this.bullets.splice(0,this.bullets.length-120);
 }
 updateEffects(dt){for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);}
 step(dt,inputs=[]){
  dt=clamp(finite(dt),0,.05);this.events=[];
  const safeInputs=Array.isArray(inputs)?inputs:[];
  for(const p of this.players){
   const i=safeInputs.find(v=>v&&v.id===p.id);const wasConnected=p.connected;p.connected=!!(i&&i.connected);
   if(p.connected&&!p.joined&&this.phase!=='lobby'){p.joined=true;this.respawnPlayer(p);}
   else if(p.connected&&!wasConnected&&p.alive&&(p.y<this.cameraY+8||p.y>this.cameraY+VIEW_HEIGHT-8))this.respawnPlayer(p);
  }
  const pressedA=safeInputs.some(i=>i&&i.connected&&i.a),connected=this.players.some(p=>p.connected);
  if(this.phase==='lobby'){if(pressedA)this.start(safeInputs);return;}
  if(this.phase==='gameover'||this.phase==='victory'){this.gameoverTimer+=dt;if(!pressedA)this.restartArmed=true;if(this.gameoverTimer>.8&&this.restartArmed&&pressedA)this.start(safeInputs);this.updateEffects(dt);return;}
  if(!this.players.some(p=>p.joined&&p.lives>0)){this.end();return;}
  if(!connected||this.manualPause||!this.players.some(p=>p.connected&&p.lives>0)){this.phase='paused';return;}
  this.phase='playing';this.time+=dt;
  if(this.transition>0){
   this.transition-=dt;this.updateEffects(dt);
   if(this.transition<=0){
    // The extraction helicopter also carries any passengers aboard surviving jeeps.
    for(const p of this.players)while(p.passengers>0)this.deliver(p);
    if(this.stage>=STAGES){this.phase='victory';this.gameoverTimer=0;this.restartArmed=false;this.events.push('victory');}
    else{this.stage++;this.loadStage();}
   }
   return;
  }
  for(const p of this.players){
   p.moving=false;if(!p.joined||!p.connected)continue;p.fire=Math.max(0,p.fire-dt);p.grenadeCooldown=Math.max(0,p.grenadeCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
   if(!p.alive){if(p.lives>0){p.respawn-=dt;if(p.respawn<=0)this.respawnPlayer(p);}continue;}
   const i=safeInputs.find(v=>v&&v.id===p.id)||{};this.move(p,i.x,i.y,dt);if(i.a)this.fire(p);if(i.b)this.throwGrenade(p);
  }
  this.updateCamera();this.updateEnemies(dt);this.updateProjectiles(dt);this.updateRescue(dt);this.updateEffects(dt);
  if(!this.players.some(p=>p.joined&&p.lives>0))this.end();
 }
 status(){return{phase:this.phase,stage:this.stage,remaining:this.enemies.filter(e=>e.alive&&e.active).length+(this.boss.alive?1:0),rescued:this.rescued,rescueGoal:0,bossHealth:this.boss.hp/this.boss.maxHp,progress:1-this.cameraY/(WORLD_HEIGHT-VIEW_HEIGHT),players:this.players.map(p=>({id:p.id,connected:p.connected,lives:p.lives,score:p.score,passengers:p.passengers,rescued:p.rescued,weaponLevel:p.weaponLevel,grenadeCooldown:Math.ceil(p.grenadeCooldown*100)/100,grenadeReady:p.grenadeCooldown<=0}))};}
}
const api={JackalGame,buildLevel,TILE,WORLD_WIDTH,WORLD_HEIGHT,VIEW_HEIGHT,COLS,ROWS,PLAYER_RADIUS,DIR8,STAGES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JackalGame=JackalGame;root.JackalModel=api;
})(typeof window!=='undefined'?window:globalThis);
