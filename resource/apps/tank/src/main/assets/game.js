/* Tank TV: an original, offline canvas game. No external assets or services. */
(function (root) {
'use strict';
const TILE = 32, COLS = 26, ROWS = 20, WIDTH = COLS * TILE, HEIGHT = ROWS * TILE;
const DIR = [[0,-1],[1,0],[0,1],[-1,0]];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
function random(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function buildLevel(stage) {
  const map = Array.from({length:ROWS},()=>Array(COLS).fill(0));
  // 0 ground, 1 brick, 2 steel, 3 water, 4 foliage. Spawn and base lanes stay open.
  for(let y=3;y<16;y++) for(let x=2;x<COLS-2;x++) {
    if ((x===3||x===4||x===8||x===9||x===16||x===17||x===21||x===22) && y%6!==0 && y%6!==1) map[y][x]=1;
  }
  for(let x=11;x<=14;x++) { map[7][x]=3; map[8][x]=3; }
  for(let y=10;y<13;y++) for(let x=11;x<=14;x++) map[y][x]=4;
  for(const [x,y] of [[6,5],[19,5],[6,12],[19,12],[12,3],[13,3]]) map[y][x]=2;
  if(stage%2===0) for(const [x,y] of [[6,9],[7,9],[18,9],[19,9],[12,14],[13,14]]) map[y][x]=1;
  if(stage%3===0) for(const [x,y] of [[2,10],[2,11],[23,10],[23,11]]) map[y][x]=4;
  // A narrow brick bunker protects the base; enemies can gradually break through it.
  for(const x of [11,12,13,14]) map[17][x]=1;
  for(const y of [18,19]) { map[y][11]=1; map[y][14]=1; }
  return map;
}
function makePlayer(id) { return {id,x:id===1?336:496,y:592,dir:0,lives:3,score:0,alive:true,joined:false,connected:false,respawn:0,shield:0,cooldown:0,fire:0,lastB:false}; }
class TankGame {
  constructor(seed=7421) {
    this.rng=random(seed); this.stage=1; this.phase='lobby'; this.map=buildLevel(1);
    this.players=[makePlayer(1),makePlayer(2)]; this.enemies=[]; this.bullets=[]; this.particles=[]; this.events=[];
    this.base={x:416,y:608,alive:true}; this.remaining=12; this.spawnTimer=0; this.nextEnemy=0;
    this.time=0; this.transition=0; this.gameoverTimer=0; this.manualPause=false; this.restartArmed=false;
  }
  start(inputs) {
    this.stage=1; this.players=[makePlayer(1),makePlayer(2)]; this.time=0; this.manualPause=false;
    for(const p of this.players) { const i=inputs.find(v=>v.id===p.id); p.joined=p.connected=!!(i&&i.connected); p.shield=3; }
    this.loadStage(); this.phase='playing'; this.restartArmed=false;
  }
  loadStage() {
    this.map=buildLevel(this.stage); this.enemies=[]; this.bullets=[]; this.particles=[];
    this.base.alive=true; this.remaining=Math.min(10+this.stage*2,30); this.spawnTimer=.5; this.transition=0;
    for(const p of this.players) { p.x=p.id===1?336:496;p.y=592;p.dir=0;p.alive=p.lives>0;p.respawn=0;p.shield=3;p.cooldown=0; }
  }
  togglePause() { if(this.phase==='playing'||this.phase==='paused') {this.manualPause=!this.manualPause;this.phase=this.manualPause?'paused':'playing';} }
  blocked(x,y,r=12,ignore=null) {
    if(x-r<0||y-r<0||x+r>WIDTH||y+r>HEIGHT)return true;
    for(let row=Math.floor((y-r)/TILE);row<=Math.floor((y+r-0.01)/TILE);row++) for(let col=Math.floor((x-r)/TILE);col<=Math.floor((x+r-0.01)/TILE);col++) {
      const tile=this.map[row]&&this.map[row][col]; if(tile===1||tile===2||tile===3)return true;
    }
    if(this.base.alive&&Math.abs(x-this.base.x)<r+15&&Math.abs(y-this.base.y)<r+15)return true;
    for(const t of this.enemies.concat(this.players.filter(p=>p.joined&&p.connected))) {
      if(t!==ignore&&t.alive&&Math.abs(t.x-x)<23&&Math.abs(t.y-y)<23)return true;
    }
    return false;
  }
  move(t,dir,speed,dt) {
    t.dir=dir; const [dx,dy]=DIR[dir], d=speed*dt;
    if(!this.blocked(t.x+dx*d,t.y+dy*d,12,t)){t.x+=dx*d;t.y+=dy*d;return true;}
    // Small lane assist makes right-angle turns forgiving on a touchscreen joystick.
    const axis=dx?'y':'x',center=Math.floor(t[axis]/TILE)*TILE+TILE/2,diff=center-t[axis];
    if(Math.abs(diff)>0.01&&Math.abs(diff)<=7){const n=clamp(diff,-d,d),x=t.x+(axis==='x'?n:0),y=t.y+(axis==='y'?n:0);if(!this.blocked(x,y,12,t)){t.x=x;t.y=y;}}
    return false;
  }
  fire(t,team) {
    if(t.fire>0||!t.alive)return;
    if(this.bullets.filter(b=>b.owner===t).length>=(team==='player'?3:1))return;
    const [dx,dy]=DIR[t.dir];this.bullets.push({x:t.x+dx*15,y:t.y+dy*15,dx,dy,team,owner:t,life:3.5});
    t.fire=team==='player'?.27:1.1+this.rng()*.8;this.events.push('fire');
  }
  burst(x,y,color,n=12) {
    for(let i=0;i<n;i++) {const a=this.rng()*Math.PI*2,s=25+this.rng()*85;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+this.rng()*.4,color});}
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  hitPlayer(p) {
    if(p.shield>0)return;
    p.alive=false;p.lives=Math.max(0,p.lives-1);p.respawn=1.5;this.burst(p.x,p.y,p.id===1?'#f1bc6b':'#75d5da',24);this.events.push('explosion');
  }
  end() { this.phase='gameover';this.gameoverTimer=0;this.restartArmed=false;this.events.push('gameover'); }
  spawn() {
    if(!this.remaining||this.enemies.length>=Math.min(4+Math.floor(this.stage/3),6))return;
    const spots=[48,416,784],offset=Math.floor(this.rng()*3);
    for(let n=0;n<3;n++){const x=spots[(offset+n)%3];if(this.blocked(x,32,12))continue;
      this.enemies.push({id:++this.nextEnemy,x,y:32,dir:2,alive:true,fire:1,turn:.6+this.rng()*1.5,hp:this.stage>=3&&this.rng()<.2?2:1,armor:this.stage>=3&&this.rng()<.15,speed:45+Math.min(this.stage,10)*3});this.remaining--;return;}
  }
  step(dt,inputs=[]) {
    dt=clamp(Number(dt)||0,0,.05);this.events=[];this.time+=dt;
    for(const p of this.players){const i=inputs.find(v=>v.id===p.id);p.connected=!!(i&&i.connected);if(p.connected&&!p.joined&&this.phase!=='lobby'){p.joined=true;p.shield=3;}}
    const connected=this.players.some(p=>p.connected),pressedA=inputs.some(i=>i.connected&&i.a);
    if(this.phase==='lobby'){if(pressedA)this.start(inputs);return;}
    if(this.phase==='gameover'){this.gameoverTimer+=dt;if(!pressedA)this.restartArmed=true;if(this.gameoverTimer>.8&&this.restartArmed&&pressedA)this.start(inputs);this.stepParticles(dt);return;}
    if(!connected||this.manualPause){this.phase='paused';return;}
    if(this.phase==='paused')this.phase='playing';
    if(this.transition>0){this.transition-=dt;if(this.transition<=0){this.stage++;this.loadStage();}this.stepParticles(dt);return;}
    for(const p of this.players) {
      p.shield=Math.max(0,p.shield-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.fire=Math.max(0,p.fire-dt);
      if(!p.joined||!p.connected)continue;
      if(!p.alive){if(p.lives>0){p.respawn-=dt;if(p.respawn<=0){const sx=p.id===1?336:496;if(!this.blocked(sx,592,12,p)){p.x=sx;p.y=592;p.dir=0;p.alive=true;p.shield=3;p.lastB=false;}}}continue;}
      const i=inputs.find(v=>v.id===p.id)||{},x=clamp(Number(i.x)||0,-1,1),y=clamp(Number(i.y)||0,-1,1);
      if(Math.max(Math.abs(x),Math.abs(y))>.22){const dir=Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?2:0);this.move(p,dir,105,dt);}
      if(i.a)this.fire(p,'player');
      if(i.b&&!p.lastB&&p.cooldown<=0){p.shield=2.5;p.cooldown=10;this.events.push('shield');}p.lastB=!!i.b;
    }
    this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawn();this.spawnTimer=1.7;}
    for(const e of this.enemies){
      e.fire=Math.max(0,e.fire-dt);e.turn-=dt;const moved=this.move(e,e.dir,e.speed,dt);
      if(!moved||e.turn<=0){const choices=[2,2,0,1,3];if(e.y>HEIGHT-160)choices.push(e.x<416?1:3,2);e.dir=choices[Math.floor(this.rng()*choices.length)];e.turn=.55+this.rng()*1.6;}
      // Tanks fire naturally down lanes; a target aligned to a lane increases their response.
      if(e.fire<=0)this.fire(e,'enemy');
    }
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];b.life-=dt;b.x+=b.dx*305*dt;b.y+=b.dy*305*dt;let remove=b.life<=0||b.x<0||b.x>=WIDTH||b.y<0||b.y>=HEIGHT;
      if(!remove){const row=Math.floor(b.y/TILE),col=Math.floor(b.x/TILE),tile=this.map[row][col];if(tile===1||tile===2){remove=true;if(tile===1){this.map[row][col]=0;this.burst(col*32+16,row*32+16,'#b98c66',7);}else this.burst(b.x,b.y,'#b5c4bd',4);}}
      if(!remove&&this.base.alive&&Math.abs(b.x-this.base.x)<15&&Math.abs(b.y-this.base.y)<15){remove=true;if(b.team==='enemy'){this.base.alive=false;this.burst(this.base.x,this.base.y,'#f0bf70',35);this.end();}}
      if(!remove){const targets=b.team==='player'?this.enemies:this.players.filter(p=>p.joined&&p.connected);for(const t of targets){if(t.alive&&Math.abs(b.x-t.x)<13&&Math.abs(b.y-t.y)<13){remove=true;if(b.team==='player'){t.hp--;if(t.hp<=0){t.alive=false;b.owner.score+=100;this.burst(t.x,t.y,'#dd9a79',18);this.events.push('explosion');}}else this.hitPlayer(t);break;}}}
      if(remove)this.bullets.splice(i,1);
    }
    this.enemies=this.enemies.filter(e=>e.alive);this.stepParticles(dt);
    if(this.phase!=='gameover'&&!this.players.some(p=>p.joined&&p.lives>0))this.end();
    if(this.phase==='playing'&&this.remaining===0&&this.enemies.length===0){this.transition=2.4;this.bullets=[];this.events.push('victory');}
  }
  stepParticles(dt){for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);}
  status(){return{phase:this.phase,stage:this.stage,remaining:this.remaining+this.enemies.length,baseAlive:this.base.alive,players:this.players.map(p=>({id:p.id,connected:p.connected,lives:p.lives,score:p.score,shieldCooldown:Math.ceil(p.cooldown*10)/10,shieldActive:p.shield>0}))};}
}
if(typeof module!=='undefined'&&module.exports)module.exports={TankGame,buildLevel,TILE,WIDTH,HEIGHT};
if(typeof document==='undefined')return;

const $=id=>document.getElementById(id),canvas=$('battlefield'),ctx=canvas.getContext('2d',{alpha:false});
let info={language:'zh',url:'',qr:''};try{if(root.TankHost)info=JSON.parse(root.TankHost.getInfo());}catch(_){}
const en=String(info.language).startsWith('en');document.documentElement.lang=en?'en':'zh-CN';
const tr=(zh,english)=>en?english:zh;
const translations={
 'brand-name':['坦克前线','Tank Frontline'],'mission-title':['守住基地 · 并肩作战','DEFEND TOGETHER'],'stage-label':['关卡','STAGE'],
 'battle-name':['基地防线','Base defense'],'enemy-label':['敌方剩余','ENEMIES'],'base-label':['保护基地','PROTECT THE BASE'],
 'battle-tip':['砖墙可击碎 · 草丛可隐藏 · 钢墙不可摧毁','Break bricks · Hide in foliage · Steel blocks shots'],
 'join-label':['加入房间','JOIN THE ROOM'],'lan-label':['局域网','LOCAL LAN'],'scan-title':['手机扫码，即刻开战','Scan. Join. Battle.'],
 'scan-description':['手机和电视连接同一局域网\n无需安装任何应用','Connect to the same network as your TV\nNo app needed on your phone'],
 'player-name-1':['先锋 · 玩家一','Vanguard · Player 1'],'player-name-2':['支援 · 玩家二','Wingman · Player 2'],
 'move-label':['移动','Move'],'fire-label':['开火','Fire'],'shield-label':['护盾','Shield'],
 'shield-tip':['护盾持续 2.5 秒 · 冷却 10 秒','Shield lasts 2.5s · 10s cooldown'],
 'footer-left':['一起玩，才有意思。','BETTER TOGETHER.'],
 'footer-right':['遥控器：方向键移动 · OK 开火 · 菜单键护盾 · 返回退出','TV remote: arrows to move · OK to fire · Menu for shield · Back to exit']
};
for(const [id,text]of Object.entries(translations)){const el=$(id);el.textContent=text[en?1:0];if(id==='scan-description')el.style.whiteSpace='pre-line';}
const brandSub=document.createElement('span');brandSub.textContent='TANK TV';$('brand-name').appendChild(brandSub);
canvas.setAttribute('aria-label',tr('坦克战场','Tank battlefield'));
function updateRoom(data){
 if(data.qr&&data.url){$('room-qr').src=data.qr;$('room-qr').hidden=false;$('qr-pending').hidden=true;$('room-address').textContent=data.url.replace(/\?.*$/,'');}
 else{$('room-qr').hidden=true;$('qr-pending').hidden=false;$('network-message').textContent=data.error||tr('连接局域网后重新打开游戏','Connect to a LAN, then reopen the game');$('room-address').textContent='';}
}
updateRoom(info);
const game=new TankGame(),keys=new Set();let keyboardActive=false,last=0,frame=0,lastPublish=0,lastUi=0,visible=true,externallySuspended=false,aPulseUntil=0,bPulseUntil=0;
function key(code,pressed){
 const normalized=code.length===1?code.toLowerCase():code;
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','b','p','Escape'].includes(normalized))return;
 if(pressed){if(normalized==='Enter'||normalized===' ')aPulseUntil=performance.now()+70;if(normalized==='b')bPulseUntil=performance.now()+70;if(!keys.has(normalized)&&normalized==='p')game.togglePause();keys.add(normalized);if(normalized!=='Escape'&&normalized!=='p')keyboardActive=true;}else keys.delete(normalized);
}
root.TankTV={key,game,updateRoom,suspend(value){externallySuspended=!!value;keys.clear();aPulseUntil=0;bPulseUntil=0;last=0;updateUi();}};
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','b','B','p','P'].includes(e.key)){e.preventDefault();key(e.key,true);}});
document.addEventListener('keyup',e=>key(e.key,false));
root.addEventListener('blur',()=>{keys.clear();aPulseUntil=0;bPulseUntil=0;});
function readInputs(){let players=[];try{if(root.TankHost)players=JSON.parse(root.TankHost.snapshot()).players||[];}catch(_){}
 players=players.map(p=>({id:Number(p.id),connected:!!p.connected,x:Number(p.x)||0,y:Number(p.y)||0,a:!!p.a,b:!!p.b}));
 if(keyboardActive){let p=players.find(p=>p.id===1);if(!p){p={id:1,connected:true,x:0,y:0,a:false,b:false};players.push(p);}const kx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),ky=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);p.connected=true;p.x=kx||p.x;p.y=ky||p.y;p.a=p.a||keys.has('Enter')||keys.has(' ')||performance.now()<aPulseUntil;p.b=p.b||keys.has('b')||performance.now()<bPulseUntil;}
 return players;
}
function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.fill();}
function drawTank(t,color,enemy=false){
 ctx.save();ctx.translate(Math.round(t.x),Math.round(t.y));
 if(!enemy&&t.shield>0){ctx.strokeStyle=color;ctx.globalAlpha=.42+Math.sin(game.time*9)*.16;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 ctx.rotate(t.dir*Math.PI/2);ctx.fillStyle='#0005';ctx.fillRect(-13,-12,28,29);ctx.fillStyle=enemy?'#423c37':'#263937';ctx.fillRect(-13,-13,7,27);ctx.fillRect(6,-13,7,27);
 ctx.fillStyle=enemy?'#82786a':'#92a296';const offset=Math.floor(game.time*10)%2*3;for(let y=-11;y<12;y+=6){ctx.fillRect(-12,y+offset,5,2);ctx.fillRect(7,y+offset,5,2);}
 ctx.fillStyle=color;ctx.fillRect(-7,-10,14,23);ctx.fillStyle='#ffffff24';ctx.fillRect(-7,-10,3,23);ctx.fillStyle='#0004';ctx.fillRect(4,-10,3,23);
 ctx.fillStyle=color;ctx.fillRect(-3,-22,6,18);ctx.fillStyle='#0005';ctx.fillRect(-3,-22,6,3);ctx.fillStyle='#18211f';ctx.fillRect(-6,-5,12,12);ctx.fillStyle=color;ctx.fillRect(-4,-4,8,9);ctx.fillStyle='#ffffff66';ctx.fillRect(-3,-3,3,2);
 if(t.hp>1){ctx.strokeStyle='#eee4cb';ctx.strokeRect(-7,-10,14,23);}ctx.restore();
 if(!enemy){ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(t.id+'P',t.x,t.y+32);}
}
function drawBase(){const b=game.base;ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle=b.alive?'#a3b98a':'#554b3d';ctx.beginPath();ctx.moveTo(-13,-13);ctx.lineTo(13,-13);ctx.lineTo(13,3);ctx.lineTo(0,15);ctx.lineTo(-13,3);ctx.closePath();ctx.fill();ctx.fillStyle='#293a2e';ctx.fillRect(-7,-8,14,12);ctx.fillStyle=b.alive?'#d4dabc':'#726247';ctx.fillRect(-3,-11,6,19);ctx.fillRect(-8,-3,16,5);ctx.restore();}
function draw(){
 ctx.fillStyle='#18251f';ctx.fillRect(0,0,WIDTH,HEIGHT);
 ctx.strokeStyle='#26372b66';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=WIDTH;x+=TILE){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,HEIGHT);}for(let y=0;y<=HEIGHT;y+=TILE){ctx.moveTo(0,y+.5);ctx.lineTo(WIDTH,y+.5);}ctx.stroke();
 // Quiet ground flecks give the field texture without downloaded artwork.
 ctx.fillStyle='#50604430';for(let i=0;i<220;i++){const x=(i*127+31)%WIDTH,y=(i*251+19)%HEIGHT;ctx.fillRect(x,y,2,2);}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const tile=game.map[r][c],x=c*32,y=r*32;if(tile===1){ctx.fillStyle='#a77955';ctx.fillRect(x+1,y+1,30,30);ctx.fillStyle='#bb8b63';ctx.fillRect(x+2,y+2,28,3);ctx.fillStyle='#5a4939';ctx.fillRect(x,y+15,32,2);ctx.fillRect(x+15,y,2,15);ctx.fillRect(x+7,y+17,2,15);ctx.fillRect(x+24,y+17,2,15);ctx.fillStyle='#2d2c2455';ctx.fillRect(x+2,y+28,28,3);}else if(tile===2){ctx.fillStyle='#798b82';ctx.fillRect(x+1,y+1,30,30);ctx.fillStyle='#a5b4a5';ctx.fillRect(x+2,y+2,28,3);ctx.fillRect(x+2,y+2,3,28);ctx.fillStyle='#46594e';ctx.fillRect(x+3,y+28,27,3);ctx.fillRect(x+28,y+3,3,27);ctx.fillStyle='#b6c0af';ctx.fillRect(x+7,y+7,3,3);ctx.fillRect(x+22,y+22,3,3);}else if(tile===3){ctx.fillStyle='#2d5457';ctx.fillRect(x,y,32,32);ctx.fillStyle='#5b959463';for(let n=0;n<3;n++){const shift=Math.sin(game.time*1.3+r+n)*3;ctx.fillRect(x+4+shift,y+6+n*9,17,2);}}}
 drawBase();
 for(const p of game.players)if(p.joined&&p.connected&&p.alive)drawTank(p,p.id===1?'#efba64':'#70ced0');
 if(game.phase==='lobby'){drawTank({x:336,y:592,dir:0,id:1,shield:0},'#efba64');drawTank({x:496,y:592,dir:0,id:2,shield:0},'#70ced0');for(const [x,y,dir]of [[48,80,2],[416,48,2],[784,96,2]])drawTank({x,y,dir},'#c68c71',true);}
 for(const e of game.enemies)drawTank(e,e.hp>1?'#c5c0a5':'#ce9579',true);
 for(const b of game.bullets){ctx.fillStyle=b.team==='player'?'#ffe0a2':'#f29d7c';ctx.fillRect(b.x-2,b.y-2,4,4);ctx.fillStyle=b.team==='player'?'#fbd08340':'#f29d7c40';ctx.fillRect(b.x-b.dx*8-2,b.y-b.dy*8-2,4,4);}
 // Leaves are drawn last; both sides can hide in foliage.
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(game.map[r][c]===4){const x=c*32,y=r*32;ctx.fillStyle='#3e593bea';ctx.fillRect(x+1,y+1,30,30);ctx.fillStyle='#5e7849e6';for(let n=0;n<6;n++){ctx.fillRect(x+(n*11)%25,y+(n*17)%26,9,5);}ctx.fillStyle='#283f30c7';ctx.fillRect(x+11,y+9,10,12);}
 for(const p of game.particles){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
 // Spawn markers anchor the otherwise intentionally quiet lower corners.
 ctx.strokeStyle='#c3ba8c25';ctx.lineWidth=1;for(const x of [336,496]){ctx.strokeRect(x-17,575,34,34);}
}
let previousOverlay='';
function updateUi(){const status=game.status();$('stage-value').textContent=String(game.stage).padStart(2,'0');$('enemy-value').textContent=String(status.remaining).padStart(2,'0');
 for(const p of game.players){const card=$('player-'+p.id);card.classList.toggle('connected',p.connected);const life='♥'.repeat(p.lives)+'♡'.repeat(3-p.lives);$('player-status-'+p.id).textContent=!p.connected?tr('等待手机加入','Waiting for a phone'):game.phase==='lobby'?tr('已连接 · 按 A 开始','Connected · A to start'):p.lives===0?tr('坦克耗尽','Out of lives'):life+(p.shield>0?tr(' · 护盾中',' · Shield'):p.cooldown>0?' · B '+Math.ceil(p.cooldown)+'s':tr(' · B 就绪',' · B ready'));$('player-score-'+p.id).textContent=p.joined?String(p.score).padStart(3,'0'):p.connected?'READY':'—';}
 const visualPhase=externallySuspended?'paused':game.phase;const overlay=$('game-overlay');overlay.hidden=visualPhase==='playing';const overlayKey=visualPhase+((game.manualPause||externallySuspended)?'manual':'')+(game.players.some(p=>p.connected)?'connected':'');
 if(overlayKey!==previousOverlay){previousOverlay=overlayKey;let title,copy,hint,kicker;
  if(visualPhase==='gameover'){title=tr('防线失守。\n再来一局？','Frontline fallen.\nOne more round?');copy=tr('并肩作战的每一刻，都值得再来一次。','Every good team deserves another chance.');hint=tr('松开后再按 A 重新开始','Release, then press A to restart');kicker='MISSION COMPLETE · STAGE '+String(game.stage).padStart(2,'0');}
  else if(visualPhase==='paused'){title=tr('稍作休整。','Taking a breather.');copy=(game.manualPause||externallySuspended)?tr('战场已暂停，坦克和基地都很安全。','The battlefield is paused. Your base is safe.'):tr('手柄已断开，战场已自动暂停。\n重新连接手机即可继续。','Controllers disconnected. The battle is paused.\nReconnect a phone to continue.');hint=(game.manualPause||externallySuspended)?tr('按 P 或遥控器播放键继续','Press P or Play to resume'):tr('扫描二维码重新加入','Scan the QR code to reconnect');kicker='BATTLE PAUSED';}
  else{title=tr('手机就位，\n战斗开始。','Phones ready.\nTanks rolling.');copy=tr('手机扫描右侧二维码，加入战场。\n摧毁敌方坦克，守住我们的基地。','Scan the code to join the battlefield.\nDestroy enemy tanks. Protect your base.');hint=tr('连接后按 A 开始游戏','Connect, then press A to start');kicker='LOCAL CO-OP · 1–2 PLAYERS';}
  $('overlay-title').textContent=title;$('overlay-title').style.whiteSpace='pre-line';$('overlay-copy').textContent=copy;$('overlay-copy').style.whiteSpace='pre-line';$('overlay-hint').textContent=hint;$('overlay-kicker').textContent=kicker;
 }
 const wave=$('wave-banner');wave.hidden=game.transition<=0;if(game.transition>0)wave.textContent=tr('防线稳固  ·  准备下一关','SECTOR SECURED · NEXT STAGE');
}
let audioContext=null;
function sound(type){try{if(!audioContext){const C=root.AudioContext||root.webkitAudioContext;if(!C)return;audioContext=new C();}if(audioContext.state==='suspended'){audioContext.resume().catch(()=>{});return;}if(type==='fire'&&game.time%0.1>.04)return;const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.type=type==='explosion'?'sawtooth':'square';const f=type==='fire'?180:type==='shield'?600:type==='victory'?500:70;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(type==='shield'?850:Math.max(25,f/3),t+.11);g.gain.setValueAtTime(type==='explosion'?.025:.015,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(t+.14);}catch(_){}}
function tick(now){if(!visible)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!externallySuspended)game.step(dt,readInputs());draw();if(!externallySuspended)for(const e of game.events)sound(e);if(now-lastUi>100){updateUi();lastUi=now;}if(now-lastPublish>200){try{if(root.TankHost)root.TankHost.publish(JSON.stringify(externallySuspended?{...game.status(),phase:'paused'}:game.status()));}catch(_){}lastPublish=now;}frame=requestAnimationFrame(tick);}
function resize(){const wrap=canvas.parentElement,w=wrap.clientWidth,h=wrap.clientHeight,ratio=WIDTH/HEIGHT;canvas.style.width=Math.min(w,h*ratio)+'px';canvas.style.height=Math.min(h,w/ratio)+'px';// Logical pixels deliberately preserve the arcade grid at any display density.
}
root.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{visible=!document.hidden;keys.clear();aPulseUntil=0;bPulseUntil=0;if(!visible){cancelAnimationFrame(frame);last=0;try{if(root.TankHost)root.TankHost.publish(JSON.stringify({...game.status(),phase:'paused'}));}catch(_){}if(audioContext)audioContext.suspend().catch(()=>{});}else{last=0;frame=requestAnimationFrame(tick);}});
root.addEventListener('pagehide',()=>{visible=false;cancelAnimationFrame(frame);keys.clear();if(audioContext)audioContext.close().catch(()=>{});});
resize();updateUi();frame=requestAnimationFrame(tick);
})(typeof window!=='undefined'?window:globalThis);
