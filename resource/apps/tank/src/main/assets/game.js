/* Tank TV: an original, offline canvas game. No external assets or services. */
(function (root) {
'use strict';
const TILE = 32, COLS = 26, ROWS = 26, WIDTH = COLS * TILE, HEIGHT = ROWS * TILE;
const TANK_RADIUS = 24, BASE_RADIUS = 28;
const PLAYER_SPAWNS = [{x:288,y:800},{x:544,y:800}];
const DIR = [[0,-1],[1,0],[0,1],[-1,0]];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
function random(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function buildLevel(stage) {
  const map = Array.from({length:ROWS},()=>Array(COLS).fill(0));
  // 13 × 13 large blocks, each made of four 8-pixel tiles on the NES-sized field.
  // Long brick columns, open spawn lanes and a U-shaped base bunker define the opening sector.
  const rows = [
    '.............', '.#.#.#.#.#.#.', '.#.#.#.#.#.#.', '.#.#.#.#.#.#.',
    '.#.#.#S#.#.#.', '.#.#.#.#.#.#.', '.....#.#.....', '##.##...##.##',
    '.....#.#.....', '.#.#.#.#.#.#.', '.#.#.#.#.#.#.', '.#.#.....#.#.', '.............'
  ];
  for(let r=0;r<13;r++) for(let c=0;c<13;c++) {
    const tile=rows[r][c]==='#'?1:rows[r][c]==='S'?2:0;
    for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++) map[r*2+dy][c*2+dx]=tile;
  }
  // Later sectors introduce the other classic terrain without changing the square arena.
  if(stage%3===2) {
    for(let r=12;r<14;r++) for(const c of [4,5,6,7,18,19,20,21]) map[r][c]=3;
    for(let r=16;r<20;r++) for(let c=12;c<14;c++) map[r][c]=4;
  }
  if(stage%3===0) {
    for(let r=4;r<8;r++) for(const c of [4,5,20,21]) map[r][c]=4;
    for(const c of [0,1,24,25]) map[14][c]=2;
  }
  for(const x of [11,12,13,14]) map[23][x]=1;
  for(const y of [24,25]) { map[y][11]=1; map[y][14]=1; }
  return map;
}
function makePlayer(id) { return {id,...PLAYER_SPAWNS[id-1],dir:0,lives:3,score:0,alive:true,joined:false,connected:false,respawn:0,shield:0,cooldown:0,fire:0,lastB:false}; }
class TankGame {
  constructor(seed=7421) {
    this.rng=random(seed); this.stage=1; this.phase='lobby'; this.map=buildLevel(1);
    this.players=[makePlayer(1),makePlayer(2)]; this.enemies=[]; this.bullets=[]; this.particles=[]; this.explosions=[]; this.events=[];
    this.base={x:416,y:800,alive:true}; this.remaining=20; this.spawnTimer=0; this.nextEnemy=0;
    this.time=0; this.transition=0; this.gameoverTimer=0; this.manualPause=false; this.restartArmed=false;
  }
  start(inputs) {
    this.stage=1; this.players=[makePlayer(1),makePlayer(2)]; this.time=0; this.manualPause=false;
    for(const p of this.players) { const i=inputs.find(v=>v.id===p.id); p.joined=p.connected=!!(i&&i.connected); p.shield=3; }
    this.loadStage(); this.phase='playing'; this.restartArmed=false;
  }
  loadStage() {
    this.map=buildLevel(this.stage); this.enemies=[]; this.bullets=[]; this.particles=[]; this.explosions=[];
    this.base.alive=true; this.remaining=20; this.spawnTimer=.5; this.transition=0;
    for(const p of this.players) { Object.assign(p,PLAYER_SPAWNS[p.id-1]);p.dir=0;p.alive=p.lives>0;p.respawn=0;p.shield=3;p.cooldown=0; }
  }
  togglePause() { if(this.phase==='playing'||this.phase==='paused') {this.manualPause=!this.manualPause;this.phase=this.manualPause?'paused':'playing';} }
  blocked(x,y,r=TANK_RADIUS,ignore=null) {
    if(x-r<0||y-r<0||x+r>WIDTH||y+r>HEIGHT)return true;
    for(let row=Math.floor((y-r)/TILE);row<=Math.floor((y+r-0.01)/TILE);row++) for(let col=Math.floor((x-r)/TILE);col<=Math.floor((x+r-0.01)/TILE);col++) {
      const tile=this.map[row]&&this.map[row][col]; if(tile===1||tile===2||tile===3)return true;
    }
    if(this.base.alive&&Math.abs(x-this.base.x)<r+BASE_RADIUS&&Math.abs(y-this.base.y)<r+BASE_RADIUS)return true;
    for(const t of this.enemies.concat(this.players.filter(p=>p.joined&&p.connected))) {
      if(t!==ignore&&t.alive&&Math.abs(t.x-x)<TANK_RADIUS*2&&Math.abs(t.y-y)<TANK_RADIUS*2)return true;
    }
    return false;
  }
  move(t,dir,speed,dt) {
    t.dir=dir; const [dx,dy]=DIR[dir], d=speed*dt;
    if(!this.blocked(t.x+dx*d,t.y+dy*d,TANK_RADIUS,t)){t.x+=dx*d;t.y+=dy*d;return true;}
    // Small lane assist makes right-angle turns forgiving on a touchscreen joystick.
    const axis=dx?'y':'x',center=Math.round((t[axis]-TILE)/(TILE*2))*TILE*2+TILE,diff=center-t[axis];
    if(Math.abs(diff)>0.01&&Math.abs(diff)<=28){const n=clamp(diff,-d,d),x=t.x+(axis==='x'?n:0),y=t.y+(axis==='y'?n:0);if(!this.blocked(x,y,TANK_RADIUS,t)){t.x=x;t.y=y;}}
    return false;
  }
  fire(t,team) {
    if(t.fire>0||!t.alive)return;
    if(this.bullets.filter(b=>b.owner===t).length>=(team==='player'?3:1))return;
    const [dx,dy]=DIR[t.dir];this.bullets.push({x:t.x+dx*28,y:t.y+dy*28,dx,dy,team,owner:t,life:3.5});
    t.fire=team==='player'?.27:1.1+this.rng()*.8;this.events.push('fire');
  }
  burst(x,y,color,n=12) {
    if(n>=18){this.explosions.push({x,y,life:.3,maxLife:.3});if(this.explosions.length>12)this.explosions.shift();}
    for(let i=0;i<n;i++) {const a=this.rng()*Math.PI*2,s=25+this.rng()*85;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+this.rng()*.4,color});}
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  hitPlayer(p) {
    if(p.shield>0)return;
    p.alive=false;p.lives=Math.max(0,p.lives-1);p.respawn=1.5;this.burst(p.x,p.y,p.id===1?'#e7a20c':'#70b000',24);this.events.push('explosion');
  }
  end() { this.phase='gameover';this.gameoverTimer=0;this.restartArmed=false;this.events.push('gameover'); }
  spawn() {
    if(!this.remaining||this.enemies.length>=Math.min(4+Math.floor(this.stage/3),6))return;
    const spots=[32,416,800],offset=Math.floor(this.rng()*3);
    for(let n=0;n<3;n++){const x=spots[(offset+n)%3];if(this.blocked(x,32,TANK_RADIUS))continue;
      this.enemies.push({id:++this.nextEnemy,x,y:32,dir:2,alive:true,fire:1,turn:.6+this.rng()*1.5,hp:this.stage>=3&&this.rng()<.2?2:1,armor:this.stage>=3&&this.rng()<.15,speed:76+Math.min(this.stage,10)*3});this.remaining--;return;}
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
      if(!p.alive){if(p.lives>0){p.respawn-=dt;if(p.respawn<=0){const spawn=PLAYER_SPAWNS[p.id-1];if(!this.blocked(spawn.x,spawn.y,TANK_RADIUS,p)){Object.assign(p,spawn);p.dir=0;p.alive=true;p.shield=3;p.lastB=false;}}}continue;}
      const i=inputs.find(v=>v.id===p.id)||{},x=clamp(Number(i.x)||0,-1,1),y=clamp(Number(i.y)||0,-1,1);
      if(Math.max(Math.abs(x),Math.abs(y))>.22){const dir=Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?2:0);this.move(p,dir,144,dt);}
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
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];b.life-=dt;b.x+=b.dx*440*dt;b.y+=b.dy*440*dt;let remove=b.life<=0||b.x<0||b.x>=WIDTH||b.y<0||b.y>=HEIGHT;
      if(!remove){const row=Math.floor(b.y/TILE),col=Math.floor(b.x/TILE),tile=this.map[row][col];if(tile===1||tile===2){remove=true;if(tile===1){this.map[row][col]=0;this.burst(col*32+16,row*32+16,'#b98c66',7);}else this.burst(b.x,b.y,'#b5c4bd',4);}}
      if(!remove&&this.base.alive&&Math.abs(b.x-this.base.x)<BASE_RADIUS&&Math.abs(b.y-this.base.y)<BASE_RADIUS){remove=true;if(b.team==='enemy'){this.base.alive=false;this.burst(this.base.x,this.base.y,'#fc9838',35);this.end();}}
      if(!remove){const targets=b.team==='player'?this.enemies:this.players.filter(p=>p.joined&&p.connected);for(const t of targets){if(t.alive&&Math.abs(b.x-t.x)<TANK_RADIUS&&Math.abs(b.y-t.y)<TANK_RADIUS){remove=true;if(b.team==='player'){t.hp--;if(t.hp<=0){t.alive=false;b.owner.score+=100;this.burst(t.x,t.y,'#fc9838',18);this.events.push('explosion');}}else this.hitPlayer(t);break;}}}
      if(remove)this.bullets.splice(i,1);
    }
    this.enemies=this.enemies.filter(e=>e.alive);this.stepParticles(dt);
    if(this.phase!=='gameover'&&!this.players.some(p=>p.joined&&p.lives>0))this.end();
    if(this.phase==='playing'&&this.remaining===0&&this.enemies.length===0){this.transition=2.4;this.bullets=[];this.events.push('victory');}
  }
  stepParticles(dt){for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);for(const e of this.explosions)e.life-=dt;this.explosions=this.explosions.filter(e=>e.life>0);}
  status(){return{phase:this.phase,stage:this.stage,remaining:this.remaining+this.enemies.length,baseAlive:this.base.alive,players:this.players.map(p=>({id:p.id,connected:p.connected,lives:p.lives,score:p.score,shieldCooldown:Math.ceil(p.cooldown*10)/10,shieldActive:p.shield>0}))};}
}
if(typeof module!=='undefined'&&module.exports)module.exports={TankGame,buildLevel,TILE,COLS,ROWS,WIDTH,HEIGHT,TANK_RADIUS,BASE_RADIUS,PLAYER_SPAWNS};
if(typeof document==='undefined')return;

const $=id=>document.getElementById(id),canvas=$('battlefield'),renderer=new root.NesRenderer(canvas);
let info={language:'zh',url:'',qr:''};try{if(root.TankHost)info=JSON.parse(root.TankHost.getInfo());}catch(_){}
const en=String(info.language).startsWith('en');document.documentElement.lang=en?'en':'zh-CN';
const tr=(zh,english)=>en?english:zh;
const translations={
 'brand-name':['坦克大战','TANK TV'],'mission-title':['经典像素 · 基地保卫战','8-BIT TANK DEFENSE'],'stage-label':['关卡','STAGE'],
 'battle-name':['基地防线','Base defense'],'enemy-label':['敌方剩余','ENEMIES'],'base-label':['保护基地','PROTECT THE BASE'],
 'battle-tip':['砖墙可击碎 · 草丛可隐藏 · 钢墙不可摧毁','Break bricks · Hide in foliage · Steel blocks shots'],
 'join-label':['加入房间','JOIN THE ROOM'],'lan-label':['局域网','LOCAL LAN'],'scan-title':['手机扫码，即刻开战','Scan. Join. Battle.'],
 'scan-description':['手机和电视连接同一局域网\n无需安装任何应用','Connect to the same network as your TV\nNo app needed on your phone'],
 'player-name-1':['玩家一 · 黄色坦克','PLAYER 1 · YELLOW'],'player-name-2':['玩家二 · 绿色坦克','PLAYER 2 · GREEN'],
 'move-label':['移动','Move'],'fire-label':['开火','Fire'],'shield-label':['护盾','Shield'],
 'shield-tip':['护盾持续 2.5 秒 · 冷却 10 秒','Shield lasts 2.5s · 10s cooldown'],
 'footer-left':['TANK TV · 8-BIT','TANK TV · 8-BIT'],
 'footer-right':['遥控器：方向键移动 · OK 开火 · 菜单键护盾 · 返回退出','TV remote: arrows to move · OK to fire · Menu for shield · Back to exit']
};
for(const [id,text]of Object.entries(translations)){const el=$(id);el.textContent=text[en?1:0];if(id==='scan-description')el.style.whiteSpace='pre-line';}

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
function draw(){renderer.draw(game);}
let previousOverlay='';
function updateUi(){const status=game.status();$('stage-value').textContent=String(game.stage).padStart(2,'0');$('enemy-value').textContent=String(status.remaining).padStart(2,'0');
 for(const p of game.players){const card=$('player-'+p.id);card.classList.toggle('connected',p.connected);const life='♥'.repeat(p.lives)+'♡'.repeat(3-p.lives);$('player-status-'+p.id).textContent=!p.connected?tr('等待手机加入','Waiting for a phone'):game.phase==='lobby'?tr('已连接 · 按 A 开始','Connected · A to start'):p.lives===0?tr('坦克耗尽','Out of lives'):life+(p.shield>0?tr(' · 护盾中',' · Shield'):p.cooldown>0?' · B '+Math.ceil(p.cooldown)+'s':tr(' · B 就绪',' · B ready'));$('player-score-'+p.id).textContent=p.joined?String(p.score).padStart(3,'0'):p.connected?'READY':'—';}
 const visualPhase=externallySuspended?'paused':game.phase;const overlay=$('game-overlay');overlay.hidden=visualPhase==='playing';const overlayKey=visualPhase+((game.manualPause||externallySuspended)?'manual':'')+(game.players.some(p=>p.connected)?'connected':'');
 if(overlayKey!==previousOverlay){previousOverlay=overlayKey;let title,copy,hint,kicker;
  if(visualPhase==='gameover'){title='GAME OVER';copy=tr('基地被摧毁或坦克耗尽。','BASE LOST OR NO TANKS REMAIN.');hint=tr('松开后再按 A 重新开始','Release, then press A to restart');kicker='STAGE '+String(game.stage).padStart(2,'0');}
  else if(visualPhase==='paused'){title='PAUSE';copy=(game.manualPause||externallySuspended)?tr('战场已暂停，坦克和基地都很安全。','The battlefield is paused. Your base is safe.'):tr('手柄已断开，战场已自动暂停。\n重新连接手机即可继续。','Controllers disconnected. The battle is paused.\nReconnect a phone to continue.');hint=(game.manualPause||externallySuspended)?tr('按 P 或遥控器播放键继续','Press P or Play to resume'):tr('扫描二维码重新加入','Scan the QR code to reconnect');kicker='BATTLE PAUSED';}
  else{title='TANK\nTV';copy=tr('1 PLAYER / 2 PLAYERS\n手机扫码加入，守住鹰形基地。','1 PLAYER / 2 PLAYERS\nSCAN TO JOIN. DEFEND THE EAGLE.');hint=tr('连接后按 A 开始游戏','Connect, then press A to start');kicker='CLASSIC 8-BIT TANK BATTLE';}
  $('overlay-title').textContent=title;$('overlay-title').style.whiteSpace='pre-line';$('overlay-copy').textContent=copy;$('overlay-copy').style.whiteSpace='pre-line';$('overlay-hint').textContent=hint;$('overlay-kicker').textContent=kicker;
 }
 const wave=$('wave-banner');wave.hidden=game.transition<=0;if(game.transition>0)wave.textContent=tr('下一关  STAGE '+(game.stage+1),'STAGE '+(game.stage+1));
}
let audioContext=null;
function sound(type){try{if(!audioContext){const C=root.AudioContext||root.webkitAudioContext;if(!C)return;audioContext=new C();}if(audioContext.state==='suspended'){audioContext.resume().catch(()=>{});return;}if(type==='fire'&&game.time%0.1>.04)return;const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.type=type==='explosion'?'sawtooth':'square';const f=type==='fire'?180:type==='shield'?600:type==='victory'?500:70;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(type==='shield'?850:Math.max(25,f/3),t+.11);g.gain.setValueAtTime(type==='explosion'?.025:.015,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(t+.14);}catch(_){}}
function tick(now){if(!visible)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!externallySuspended)game.step(dt,readInputs());draw();if(!externallySuspended)for(const e of game.events)sound(e);if(now-lastUi>100){updateUi();lastUi=now;}if(now-lastPublish>200){try{if(root.TankHost)root.TankHost.publish(JSON.stringify(externallySuspended?{...game.status(),phase:'paused'}:game.status()));}catch(_){}lastPublish=now;}frame=requestAnimationFrame(tick);}
function resize(){
 const wrap=canvas.parentElement,panel=wrap.parentElement,scale=Math.min(panel.clientWidth/256,panel.clientHeight/240);
 const width=Math.floor(256*scale)+'px',height=Math.floor(240*scale)+'px';
 wrap.style.width=width;wrap.style.height=height;canvas.style.width=width;canvas.style.height=height;
}
root.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{visible=!document.hidden;keys.clear();aPulseUntil=0;bPulseUntil=0;if(!visible){cancelAnimationFrame(frame);last=0;try{if(root.TankHost)root.TankHost.publish(JSON.stringify({...game.status(),phase:'paused'}));}catch(_){}if(audioContext)audioContext.suspend().catch(()=>{});}else{last=0;frame=requestAnimationFrame(tick);}});
root.addEventListener('pagehide',()=>{visible=false;cancelAnimationFrame(frame);keys.clear();if(audioContext)audioContext.close().catch(()=>{});});
resize();updateUi();frame=requestAnimationFrame(tick);
})(typeof window!=='undefined'?window:globalThis);
