/* Independent Battle City rules model. Native coordinates: 208×208 pixels.
 * map: 52×52 four-pixel cells (0 empty, 1 brick, 2 steel, 3 water, 4 trees, 5 ice).
 * Frame clocks are 60 Hz; gameplay never uses wall-clock timers. See docs/reference.md.
 */
(function (root) {
  'use strict';
  const Levels = typeof module !== 'undefined' && module.exports ? require('./levels.js') : root.TankLevels;
  const WIDTH = 208, HEIGHT = 208, TILE = 4;
  const DIR = [[0,-1],[1,0],[0,1],[-1,0]];
  const TYPES = ['basic','fast','power','armor'];
  const POWERS = ['helmet','watch','shovel','star','grenade','tank','grenade','star'];
  const emptyStats = () => ({basic:0,fast:0,power:0,armor:0,total:0,bonus:0});
  const neutral = id => ({id,connected:false,x:0,y:0,a:false,b:false,start:false,select:false});
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  const overlaps = (a,b,d) => Math.abs(a.x-b.x)<d && Math.abs(a.y-b.y)<d;

  class TankGame {
    constructor(seed = 0x1985) {
      this.seed = (Number(seed) >>> 0) || 1;
      this.phase = 'title'; this.phaseFrames = 0; this.frame = 0; this.time = 0;
      this.accumulator = 0; this.menuIndex = 0; this.selectedPlayers = 1;
      this.stage = 1; this.loop = 0; this.highScore = 20000; this.stageSelect = false;
      this.manualPause = false; this.controllerPause = false; this.pauseReason = '';
      this.inputs = [neutral(1),neutral(2)]; this.previous = [neutral(1),neutral(2)];
      this.players = [this.makePlayer(1),this.makePlayer(2)];
      this.map = Levels.decode(Levels.maps[0]); this.base = {x:104,y:200,alive:true};
      this.enemies = []; this.bullets = []; this.explosions = []; this.scorePopups = [];
      this.events = []; this.powerUp = null; this.stats = [emptyStats(),emptyStats()];
      this.remaining = 20; this.spawnTimer = 0; this.spawnIndex = 0; this.nextEnemyId = 10;
      this.enemyFreezeCounter = 0; this.shovelCounter = 0; this.battleFrames = 0;
      this.transition = 0; this.resultGameOver = false; this.resultsAwarded = false;
      this.construction = {row:0,col:0,tile:0,painted:false}; this.customMap = null; this.customPending=false;
      this.bunker(1);
    }

    makePlayer(id) {
      return {id,x:id===1?72:136,y:200,dir:0,lives:3,score:0,stars:0,
        shieldCounter:0,shieldFrames:0,freezeFrames:0,spawnFrames:0,respawnFrames:0,
        slideFrames:0,alive:false,connected:false,joined:false,moving:false,extraLife:false};
    }
    random() {
      let n = this.seed; n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
      this.seed = n >>> 0; return this.seed / 4294967296;
    }
    emit(type, detail = {}) {
      this.events.push({type,frame:this.frame,...detail});
      if (this.events.length > 96) this.events.splice(0,this.events.length-96);
    }
    setPhase(phase) { this.phase = phase; this.phaseFrames = 0; }
    readInputs(inputs = []) {
      this.inputs = [1,2].map(id => {
        const input = inputs.find(p => Number(p.id) === id);
        if (!input || !input.connected) return neutral(id);
        return {id,connected:true,x:clamp(Number(input.x)||0,-1,1),y:clamp(Number(input.y)||0,-1,1),
          a:!!input.a,b:!!input.b,start:!!input.start,select:!!input.select};
      });
      this.players.forEach((p,i) => { p.connected = this.inputs[i].connected; });
    }
    edge(i,key) { return this.inputs[i][key] && !this.previous[i][key]; }
    direction(input) {
      if (!input || !input.connected || Math.max(Math.abs(input.x),Math.abs(input.y)) < .35) return -1;
      return Math.abs(input.x)>Math.abs(input.y) ? (input.x>0?1:3) : (input.y>0?2:0);
    }
    step(dt, inputs = []) {
      this.readInputs(inputs);
      this.accumulator += clamp(Number(dt)||0,0,.1);
      while (this.accumulator + 1e-9 >= 1/60) {
        this.accumulator -= 1/60; this.tick();
        this.previous = this.inputs.map(p => ({...p}));
      }
    }
    tick() {
      this.frame++; this.time = this.frame/60; this.phaseFrames++;
      const primary = this.inputs.find(p=>p.connected) || this.inputs[0];
      const i = primary.id-1;
      if (this.phase === 'title') {
        const d = this.direction(primary), previousDir = this.direction(this.previous[i]);
        if (this.edge(i,'select') || (d===2 && previousDir!==2)) this.menuIndex = (this.menuIndex+1)%3;
        if (d===0 && previousDir!==0) this.menuIndex = (this.menuIndex+2)%3;
        if (this.edge(i,'start')) {
          if (this.menuIndex===2) this.beginConstruction();
          else this.beginGame(this.menuIndex+1,true);
        }
        return;
      }
      if (this.phase === 'construction') { this.constructionTick(primary,i); return; }
      if (this.phase === 'stageintro') {
        if (this.stageSelect) {
          if (primary.a && (this.edge(i,'a') || this.phaseFrames%8===0)) this.stage=Math.min(35,this.stage+1);
          if (primary.b && (this.edge(i,'b') || this.phaseFrames%8===0)) this.stage=Math.max(1,this.stage-1);
          if (this.edge(i,'start')) { this.stageSelect=false; this.phaseFrames=0; this.emit('stage_start'); }
        } else if (this.phaseFrames>=90) { this.loadStage(); this.setPhase('playing'); }
        return;
      }
      if (this.phase === 'results') {
        if (this.phaseFrames>=360 || (this.phaseFrames>60 && this.edge(i,'start'))) this.finishResults();
        return;
      }
      if (this.phase === 'gameover') {
        if (this.phaseFrames>=240 || (this.phaseFrames>45 && this.edge(i,'start'))) this.returnToTitle();
        return;
      }
      if (this.phase !== 'playing' && this.phase !== 'paused') return;
      if (this.inputs.some((p,index)=>this.edge(index,'start'))) this.togglePause();
      this.controllerPause = !this.inputs.some((p,index)=>p.connected && index<this.selectedPlayers);
      if (this.manualPause || this.controllerPause) {
        this.phase='paused'; this.pauseReason=this.manualPause?'manual':'controller'; return;
      }
      if (this.phase==='paused') { this.phase='playing'; this.phaseFrames=0; this.pauseReason=''; }
      this.playTick();
    }
    togglePause() {
      if (this.phase!=='playing' && this.phase!=='paused') return;
      this.manualPause = !this.manualPause;
      this.emit('pause');
      this.phase=this.manualPause?'paused':'playing'; this.pauseReason=this.manualPause?'manual':'';
    }

    // Direct start is a deterministic integration/test helper. UI follows title → stage selection.
    start(inputs = this.inputs) {
      this.readInputs(inputs);
      this.beginGame(this.inputs.filter(p=>p.connected).length>=2?2:1,false);
      this.loadStage(); this.setPhase('playing'); this.emit('stage_start'); return this;
    }
    beginGame(players, selectStage = true) {
      this.selectedPlayers=players; this.stage=1; this.loop=0;
      this.players=[this.makePlayer(1),this.makePlayer(2)];
      this.players.forEach((p,i)=>{p.joined=i<players;p.connected=this.inputs[i].connected;if(!p.joined)p.lives=0;});
      this.manualPause=false; this.controllerPause=false; this.resultGameOver=false;
      this.stageSelect=selectStage; this.setPhase('stageintro');
    }
    returnToTitle() {
      this.manualPause=false; this.stageSelect=false; this.setPhase('title');
      this.enemies=[]; this.bullets=[]; this.powerUp=null;
      this.customMap=null;this.customPending=false;
      this.players.forEach(p=>{p.alive=false;p.moving=false;});
    }
    loadStage() {
      const custom=this.customPending && this.customMap;
      this.map = custom ? this.customMap.map(r=>r.slice()) : Levels.decode(Levels.maps[(this.stage-1)%35]);
      this.base={x:104,y:200,alive:true};
      if (!custom) this.bunker(1);
      this.customPending=false;
      this.clearRect(96,192,16,16);
      this.enemies=[]; this.bullets=[]; this.powerUp=null; this.explosions=[]; this.scorePopups=[];
      this.stats=[emptyStats(),emptyStats()]; this.resultsAwarded=false;
      this.remaining=20; this.wave=Levels.wave(this.stage,this.loop===1); this.spawnTimer=0; this.spawnIndex=0;
      this.spawnDelay=190-(this.loop===1?35:this.stage)*4-(this.selectedPlayers-1)*20;
      this.enemyFreezeCounter=0; this.shovelCounter=0; this.battleFrames=0; this.transition=0;
      this.resultGameOver=false; this.players.forEach(p=>{if(p.joined&&p.lives>0)this.spawnPlayer(p);});
    }
    clearRect(x,y,w,h) {
      for(let row=y/4;row<(y+h)/4;row++) for(let col=x/4;col<(x+w)/4;col++) if(this.map[row])this.map[row][col]=0;
    }
    bunker(value) {
      this.clearRect(80,176,48,32);
      for(let y=46;y<52;y++) for(let x=22;x<30;x++) {
        if(y<48 || x<24 || x>=28) this.map[y][x]=value;
      }
    }
    spawnPlayer(p) {
      Object.assign(p,{x:p.id===1?72:136,y:200,dir:0,alive:true,spawnFrames:38,
        respawnFrames:0,shieldCounter:0,shieldFrames:0,freezeFrames:0,slideFrames:0,moving:false});
      this.clearRect(p.x-8,p.y-8,16,16);
    }
    spawnEnemy() {
      if(!this.remaining || this.enemies.filter(e=>e.alive).length >= (this.selectedPlayers===2?6:4)) return false;
      const ordinal=21-this.remaining, type=this.wave[ordinal-1];
      this.spawnIndex=(this.spawnIndex+1)%3;
      const x=[8,104,200][this.spawnIndex];
      if(this.enemies.some(e=>e.alive && Math.abs(e.x-x)<16 && e.y<24)) return false;
      const bonus=[4,11,18].includes(ordinal);
      if(bonus)this.powerUp=null;
      const slot=Array.from({length:this.selectedPlayers===2?6:4},(_,n)=>n).reverse().find(n=>!this.enemies.some(e=>e.alive&&e.slot===n));
      const enemy={id:10+slot,type,hp:type==='armor'?4:1,bonus,
        x,y:8,dir:2,spawnFrames:56,alive:true,moving:false,waitFrames:0,slot};
      this.enemies.push(enemy); this.remaining--; this.clearRect(x-8,0,16,16); return true;
    }
    playTick() {
      this.battleFrames++;
      this.explosions=this.explosions.filter(e=>--e.frames>0);
      this.scorePopups=this.scorePopups.filter(e=>--e.frames>0);
      if((this.frame&63)===0) {
        this.players.forEach(p=>{if(p.shieldCounter>0)p.shieldCounter--;});
        if(this.enemyFreezeCounter>0)this.enemyFreezeCounter--;
        if(this.shovelCounter>0 && --this.shovelCounter===0)this.bunker(1);
      }
      if(this.shovelCounter>0 && this.shovelCounter<4 && (this.frame&15)===0) this.bunker((this.frame&16)?2:1);
      this.players.forEach((p,i)=> {
        p.shieldFrames=p.shieldCounter*64; p.moving=false;
        if(!p.joined || !this.base.alive)return;
        if(!p.alive) {
          if(p.lives>0 && p.respawnFrames>0 && --p.respawnFrames===0)this.spawnPlayer(p);
          return;
        }
        if(p.spawnFrames>0) { if(--p.spawnFrames===0){p.shieldCounter=3;p.shieldFrames=192;}return; }
        const motion=(this.frame&3)!==2;
        if(p.freezeFrames>0) {if(motion)p.freezeFrames--;return;}
        if(motion) this.playerMotion(p,this.inputs[i]);
        if(this.edge(i,'a') || this.edge(i,'b'))this.fire(p,'player');
        if(this.powerUp && overlaps(p,this.powerUp,12))this.takePowerUp(p);
      });
      this.enemies.forEach(e=> {
        e.moving=false; if(!e.alive)return;
        if(e.spawnFrames>0){e.spawnFrames--;return;}
        if(this.enemyFreezeCounter>0)return;
        if(e.waitFrames>0)e.waitFrames--;
        else if(e.type==='fast' || ((this.frame^e.slot)&1))this.enemyMotion(e);
        if(this.random()<1/32)this.fire(e,'enemy');
      });
      if(this.spawnTimer>0)this.spawnTimer--;
      else if(this.base.alive && this.spawnEnemy())this.spawnTimer=this.spawnDelay;
      this.advanceBullets(); this.enemies=this.enemies.filter(e=>e.alive);
      if(!this.base.alive || !this.players.some(p=>p.joined&&p.lives>0)) {
        this.resultGameOver=true;
        if(!this.transition){this.transition=180;this.emit('game_over');}
      } else if(!this.remaining && !this.enemies.length && !this.transition)this.transition=120;
      if(this.transition>0 && --this.transition===0)this.beginResults();
    }
    playerMotion(p,input) {
      const d=this.direction(input), ice=this.cell(p.x,p.y)===5;
      if(d>=0) {
        if(ice && p.slideFrames===0){p.slideFrames=28;this.emit('ice');}
        this.move(p,d);
      } else if(ice && p.slideFrames>0) {p.slideFrames--;this.move(p,p.dir);}
      else p.slideFrames=0;
      if(!ice)p.slideFrames=0;
    }
    enemyMotion(e) {
      if(e.x%8===0 && e.y%8===0 && this.random()<1/16)e.dir=this.enemyDirection(e);
      if(!this.move(e,e.dir)) {
        e.dir=this.random()<.5?this.enemyDirection(e):Math.floor(this.random()*4);
        e.waitFrames=Math.floor(this.random()*16);
      }
    }
    enemyDirection(e) {
      const seconds=Math.floor(this.battleFrames/64);
      if(seconds<this.spawnDelay/8)return Math.floor(this.random()*4);
      const targets=this.players.filter(p=>p.alive && p.joined);
      const target=seconds>this.spawnDelay/4 || !targets.length ? this.base : targets[e.slot%targets.length];
      const dx=target.x-e.x,dy=target.y-e.y;
      if(Math.abs(dx)<1)return dy>=0?2:0;
      if(Math.abs(dy)<1)return dx>=0?1:3;
      return this.random()<.5?(dx>0?1:3):(dy>0?2:0);
    }
    cell(x,y) { return this.map[Math.floor(y/4)]?.[Math.floor(x/4)] ?? 2; }
    blocked(x,y,ignore) {
      if(x<8 || y<8 || x>200 || y>200)return true;
      for(let r=Math.floor((y-8)/4);r<=Math.floor((y+7.99)/4);r++) {
        for(let c=Math.floor((x-8)/4);c<=Math.floor((x+7.99)/4);c++) {
          if([1,2,3].includes(this.map[r]?.[c]))return true;
        }
      }
      if(this.base.alive && Math.abs(x-this.base.x)<16 && Math.abs(y-this.base.y)<16)return true;
      return this.players.concat(this.enemies).some(t=>t!==ignore && t.alive && !t.spawnFrames && Math.abs(x-t.x)<16 && Math.abs(y-t.y)<16);
    }
    move(tank,dir) {
      if(dir<0 || dir>3)return false;
      let x=tank.x,y=tank.y;
      if((tank.dir&1)!==(dir&1)) { if(dir&1)y=Math.round(y/8)*8;else x=Math.round(x/8)*8; }
      tank.dir=dir;
      const nx=x+DIR[dir][0],ny=y+DIR[dir][1];
      if(this.blocked(nx,ny,tank)){tank.moving=false;return false;}
      tank.x=nx;tank.y=ny;tank.moving=true;return true;
    }
    fire(tank,team='player') {
      if(!tank.alive || tank.spawnFrames || tank.freezeFrames || (team==='player'&&!this.base.alive))return false;
      const limit=team==='player' && tank.stars>=2?2:1;
      if(this.bullets.filter(b=>b.owner===tank.id).length>=limit)return false;
      const [dx,dy]=DIR[tank.dir];
      this.bullets.push({x:tank.x+dx*8,y:tank.y+dy*8,dx,dy,dir:tank.dir,
        owner:tank.id,team,speed:(team==='player'?tank.stars>=1:tank.type==='power')?4:2,
        steel:team==='player'&&tank.stars===3,alive:true});
      if(team==='player')this.emit('fire',{player:tank.id});return true;
    }
    advanceBullets() {
      for(const bullet of this.bullets) {
        if(bullet.alive===false)continue;
        for(let n=0;n<(bullet.speed||2);n++) {
          bullet.x+=bullet.dx;bullet.y+=bullet.dy;
          if(bullet.x<0 || bullet.x>=208 || bullet.y<0 || bullet.y>=208){this.impact(bullet,'hit_steel');break;}
          if(this.wallHit(bullet))break;
          if(this.base.alive && overlaps(bullet,this.base,8)) {
            this.base.alive=false;this.explode(this.base,'tank');this.impact(bullet);this.emit('player_explosion');break;
          }
          const target=this.players.concat(this.enemies).find(t=>t.alive && !t.spawnFrames && t.id!==bullet.owner &&
            (bullet.team==='player'||t.joined) && overlaps(t,bullet,10));
          if(target) {
            if(target.joined) {
              if(!target.shieldCounter){if(bullet.team==='player')target.freezeFrames=200;else this.hitPlayer(target);}
            } else this.hitEnemy(target,this.players.find(p=>p.id===bullet.owner));
            this.impact(bullet);break;
          }
          const other=this.bullets.find(b=>b!==bullet && b.alive!==false && b.owner!==bullet.owner &&
            (b.team==='player'||bullet.team==='player') && overlaps(b,bullet,6));
          if(other){bullet.alive=false;other.alive=false;break;}
        }
      }
      this.bullets=this.bullets.filter(b=>b.alive!==false);
    }
    wallHit(bullet) {
      // A shot removes one four-pixel layer across an eight-pixel tile width.
      // The max-star shell clears each contacted 8×8 tile, including steel.
      const horizontal=!!bullet.dx, center=horizontal?bullet.y:bullet.x;
      const across=Math.floor((center-4)/4), along=Math.floor((horizontal?bullet.x:bullet.y)/4);
      const touched=[];
      for(let c=across;c<=across+1;c++) {
        const row=horizontal?c:along,col=horizontal?along:c;
        if([1,2].includes(this.map[row]?.[col]))touched.push([row,col,this.map[row][col]]);
      }
      if(!touched.length)return false;
      let brick=false;
      touched.forEach(([row,col,value])=> {
        if(bullet.steel) {
          const ry=row&~1,cx=col&~1;
          for(let y=ry;y<ry+2;y++)for(let x=cx;x<cx+2;x++)if([1,2].includes(this.map[y]?.[x]))this.map[y][x]=0;
          brick=true;
        } else if(value===1){this.map[row][col]=0;brick=true;}
      });
      this.impact(bullet,brick?'hit_brick':'hit_steel');return true;
    }
    impact(bullet,sound) {
      bullet.alive=false;this.explode(bullet,'bullet');
      if(sound && bullet.team==='player')this.emit(sound);
    }
    explode(target,type) {
      const frames=type==='bullet'?9:28;
      this.explosions.push({x:target.x,y:target.y,frames,total:frames,type});
      if(this.explosions.length>32)this.explosions.shift();
    }
    hitPlayer(p) {
      if(!p.alive || p.spawnFrames || p.shieldCounter)return false;
      p.alive=false;p.moving=false;p.lives=Math.max(0,p.lives-1);p.stars=0;p.freezeFrames=0;
      p.respawnFrames=p.lives>0?50:0;this.explode(p,'tank');this.emit('player_explosion');return true;
    }
    hitEnemy(enemy,player) {
      if(!enemy.alive || enemy.spawnFrames)return false;
      if(enemy.bonus){enemy.bonus=false;this.appearPowerUp();}
      if(--enemy.hp>0){this.emit('hit_steel');return false;}
      this.destroyEnemy(enemy);
      if(player){const score=(TYPES.indexOf(enemy.type)+1)*100;this.addScore(player,score);
        this.stats[player.id-1][enemy.type]++;this.stats[player.id-1].total++;
        this.scorePopups.push({x:enemy.x,y:enemy.y,score,frames:50});}
      return true;
    }
    destroyEnemy(enemy) {
      if(!enemy.alive)return;enemy.alive=false;this.explode(enemy,'tank');this.emit('enemy_explosion');
    }
    appearPowerUp() {
      let power;
      for(let attempt=0;attempt<32;attempt++) {
        power={x:32+48*Math.floor(this.random()*4),y:32+48*Math.floor(this.random()*4),type:''};
        if(!this.players.some(p=>p.alive && !p.spawnFrames && overlaps(p,power,12)))break;
      }
      power.type=POWERS[Math.floor(this.random()*8)];this.powerUp=power;this.emit('powerup_appear');
    }
    takePowerUp(p,type=this.powerUp?.type) {
      if(!type || !POWERS.includes(type))return false;
      const point=this.powerUp || p;
      this.scorePopups.push({x:point.x,y:point.y,score:500,frames:50});
      this.powerUp=null;this.addScore(p,500);this.emit('powerup_pick');
      if(type==='helmet'){p.shieldCounter=10;p.shieldFrames=640;}
      if(type==='watch')this.enemyFreezeCounter=10;
      if(type==='shovel'){this.shovelCounter=20;this.bunker(2);}
      if(type==='star')p.stars=Math.min(3,p.stars+1);
      if(type==='grenade')this.enemies.forEach(e=>{if(!e.spawnFrames)this.destroyEnemy(e);});
      if(type==='tank'){p.lives++;this.emit('extra_life');}
      return true;
    }
    addScore(p,value) {
      p.score+=value;this.highScore=Math.max(this.highScore,p.score);
      if(!p.extraLife && p.score>=20000 && this.base.alive){p.extraLife=true;p.lives++;this.emit('extra_life');}
    }
    beginResults() {
      this.players.forEach(p=>p.moving=false);this.bullets=[];this.setPhase('results');this.emit('statistics');
      if(this.selectedPlayers===2 && this.stats[0].total!==this.stats[1].total && !this.resultsAwarded) {
        const winner=this.stats[0].total>this.stats[1].total?0:1;
        this.stats[winner].bonus=1000;this.addScore(this.players[winner],1000);
      }
      this.resultsAwarded=true;
    }
    finishResults() {
      if(this.resultGameOver){this.setPhase('gameover');return;}
      this.stage++;if(this.stage>35){this.stage=1;this.loop=(this.loop+1)%2;}
      this.stageSelect=false;this.setPhase('stageintro');this.emit('stage_start');
    }
    end() { this.resultGameOver=true;this.beginResults(); }

    beginConstruction() {
      this.map=this.customMap?this.customMap.map(r=>r.slice()):Array.from({length:52},()=>Array(52).fill(0));
      this.base={x:104,y:200,alive:true};if(!this.customMap)this.bunker(1);
      this.construction={row:0,col:0,tile:0,painted:false,heldFrames:0,lastDir:-1};
      this.enemies=[];this.bullets=[];this.powerUp=null;this.players.forEach(p=>p.alive=false);
      this.setPhase('construction');
    }
    constructionTick(input,index) {
      if(this.edge(index,'start')){this.customMap=this.map.map(r=>r.slice());this.customPending=true;this.menuIndex=0;this.setPhase('title');return;}
      const c=this.construction,d=this.direction(input);
      const changed=d!==c.lastDir;c.heldFrames=changed?0:c.heldFrames+1;c.lastDir=d;
      const repeat=c.heldFrames>=20 && (c.heldFrames-20)%5===0;
      if(d>=0 && (changed || repeat)) {
        c.col=clamp(c.col+DIR[d][0],0,12);c.row=clamp(c.row+DIR[d][1],0,12);c.painted=false;
      }
      const paintEdge=this.edge(index,'a')||this.edge(index,'b');
      if(paintEdge || ((input.a||input.b) && (changed||repeat))) {
        if(c.painted)c.tile=(c.tile+(input.b?13:1))%14;
        Levels.paint(this.map,c.row,c.col,Levels.palette[c.tile]);c.painted=true;
      }
    }
    // Small detached snapshot for the native room bridge and phone HUD.
    status() {
      return {phase:this.phase,stage:this.stage,loop:this.loop,menuIndex:this.menuIndex,
        selectedPlayers:this.selectedPlayers,remaining:this.remaining,
        players:this.players.map(p=>({id:p.id,connected:p.connected,joined:p.joined,
          alive:p.alive,lives:p.lives,score:p.score,stars:p.stars}))};
    }
  }
  const api={TankGame,TILE,WIDTH,HEIGHT};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  root.TankGame=TankGame;
})(typeof globalThis!=='undefined'?globalThis:this);
