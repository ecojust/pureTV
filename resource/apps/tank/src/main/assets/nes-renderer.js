/* Tank TV's 256×240 pixel renderer. All artwork is drawn from local pixel patterns. */
(function (root) {
  'use strict';

  const SCREEN_W = 256, SCREEN_H = 240;
  const FIELD_X = 16, FIELD_Y = 16, FIELD_SIZE = 208, WORLD_SCALE = 4;
  const COLORS = {
    frame: '#7c7c7c', black: '#000000', white: '#fcfcfc',
    brick: '#a85000', brickLight: '#e89050', brickDark: '#602800',
    steel: '#bcbcbc', steelLight: '#fcfcfc', steelDark: '#585858',
    water: '#0000a8', waterLight: '#4040fc', waterDeep: '#0000fc',
    leaf: '#005800', leafLight: '#50b800', leafDark: '#003000',
    yellow: ['#684400', '#e7a20c', '#fce4a0'],
    green: ['#005800', '#70b000', '#b8f818'],
    enemy: ['#585858', '#bcbcbc', '#fcfcfc'],
    red: ['#780000', '#d82800', '#fc7460']
  };

  // Sixteen-pixel cells give the tread/turret proportions of a console tank.
  // The visible tank is 14 pixels wide; transparent corners keep turns crisp.
  const TANK = [
    '.......33.......',
    '.......22.......',
    '.111...22...111.',
    '.131...22...131.',
    '.121.222222.121.',
    '.131.233332.131.',
    '.121.232232.121.',
    '.131.232232.131.',
    '.121.233332.121.',
    '.131.222222.131.',
    '.121.222222.121.',
    '.131.222222.131.',
    '.121.222222.121.',
    '.131.222222.131.',
    '.111........111.',
    '................'
  ];
  const ARMORED_TANK = [
    '.......33.......',
    '.......22.......',
    '.111...22...111.',
    '.131.222222.131.',
    '.12123333332121.',
    '.13123222232131.',
    '.12123233232121.',
    '.13123233232131.',
    '.12123222232121.',
    '.13123333332131.',
    '.12122222222121.',
    '.13123333332131.',
    '.12122222222121.',
    '.131.222222.131.',
    '.111........111.',
    '................'
  ];
  const EAGLE = [
    '................',
    '1..............1',
    '11............11',
    '121..........121',
    '1221...11...1221',
    '12221.1221.12221',
    '.12221122112221.',
    '..122222222221..',
    '...1222222221...',
    '...1222222221...',
    '....12222221....',
    '.....122221.....',
    '......1221......',
    '.....112211.....',
    '....11....11....',
    '................'
  ];
  const RUINS = [
    '................', '................', '................', '................',
    '................', '................', '......11........', '.....1221.......',
    '..11.1221..11...', '.1221122211221..', '.12222222222221.', '..121222121221..',
    '.12211122112221.', '1122222222222211', '1221212212112221', '1111111111111111'
  ];
  const MINI_TANK = ['...1....', '...1....', '.11111..', '.11111..', '.11111..', '.11111..', '.11.11..', '........'];
  const GRASS = ['11211121', '12212112', '21322121', '12211222', '21123211', '12222122', '21112213', '12211221'];
  const BURST = [
    '.......1........', '..1....11....1..', '...11.1221.11...', '....12222221....',
    '.11122233222111.', '..122233332221..', '...1233333321...', '1112233333322111',
    '..122333333221..', '...1223333221...', '..112223322211..', '.11..122221..11.',
    '.....12221......', '....11.121......', '...1....11......', '........1.......'
  ];
  // A compact bitmap font avoids antialiased system glyphs inside the game screen.
  const FONT = {
    '0':['01110','11011','11011','11011','11011','11011','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','11011','00011','00110','01100','11000','11111'],
    '3':['11110','00011','00011','01110','00011','00011','11110'],
    '4':['00011','00111','01011','11011','11111','00011','00011'],
    '5':['11111','11000','11000','11110','00011','00011','11110'],
    '6':['01110','11000','11000','11110','11011','11011','01110'],
    '7':['11111','00011','00011','00110','01100','01100','01100'],
    '8':['01110','11011','11011','01110','11011','11011','01110'],
    '9':['01110','11011','11011','01111','00011','00011','01110'],
    'P':['11110','11011','11011','11110','11000','11000','11000'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'A':['01110','11011','11011','11111','11011','11011','11011'],
    'B':['11110','11011','11011','11110','11011','11011','11110'],
    'S':['01111','11000','11000','01110','00011','00011','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'G':['01111','11000','11000','11011','11011','11011','01111'],
    'E':['11111','11000','11000','11110','11000','11000','11111'],
    '-':['00000','00000','00000','11111','00000','00000','00000']
  };

  class NesRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = SCREEN_W;
      canvas.height = SCREEN_H;
      this.ctx = canvas.getContext('2d', {alpha:false});
      this.ctx.imageSmoothingEnabled = false;
    }
    rect(x,y,w,h,color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.round(x),Math.round(y),w,h);
    }
    sprite(pattern,x,y,palette,dir=0,trackFrame=0) {
      const n=pattern.length;
      for(let row=0;row<n;row++)for(let col=0;col<pattern[row].length;col++) {
        let value=Number(pattern[row][col]);
        if(!value)continue;
        if(trackFrame&&pattern===TANK&&row>=2&&row<14&&(col<4||col>11))value=value===3?2:value===2?3:value;
        let dx=col,dy=row;
        if(dir===1){dx=n-1-row;dy=col;}else if(dir===2){dx=n-1-col;dy=n-1-row;}else if(dir===3){dx=row;dy=n-1-col;}
        this.rect(x+dx,y+dy,1,1,palette[value-1]||palette[0]);
      }
    }
    text(text,x,y,color=COLORS.black) {
      for(const char of String(text)) {
        const glyph=FONT[char];
        if(glyph)for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(glyph[row][col]==='1')this.rect(x+col,y+row,1,1,color);
        x+=6;
      }
    }
    tile(tile,x,y,time) {
      if(tile===1) {
        this.rect(x,y,8,8,COLORS.brickDark);
        this.rect(x,y,7,3,COLORS.brick);
        this.rect(x,y,7,1,COLORS.brickLight);
        this.rect(x,y+4,3,3,COLORS.brick);
        this.rect(x+4,y+4,4,3,COLORS.brick);
        this.rect(x,y+4,3,1,COLORS.brickLight);
        this.rect(x+4,y+4,4,1,COLORS.brickLight);
      } else if(tile===2) {
        this.rect(x,y,8,8,COLORS.steelDark);
        this.rect(x,y,8,1,COLORS.steelLight);
        this.rect(x,y,1,8,COLORS.steelLight);
        this.rect(x+1,y+1,6,6,COLORS.steel);
        this.rect(x+2,y+2,4,1,COLORS.steelLight);
        this.rect(x+2,y+2,1,4,COLORS.steelLight);
        this.rect(x+5,y+3,1,3,COLORS.steelDark);
        this.rect(x+3,y+5,3,1,COLORS.steelDark);
      } else if(tile===3) {
        const shift=Math.floor(time*3)%2;
        this.rect(x,y,8,8,COLORS.water);
        this.rect(x,y+2,8,2,COLORS.waterDeep);
        this.rect(x,y+6,8,2,COLORS.waterDeep);
        this.rect(x+shift*2,y+1,4,1,COLORS.waterLight);
        this.rect(x+(1-shift)*2,y+5,4,1,COLORS.waterLight);
      } else if(tile===4) {
        this.sprite(GRASS,x,y,[COLORS.leaf,COLORS.leafLight,COLORS.leafDark]);
      }
    }
    tank(t,palette,time,playing) {
      const x=FIELD_X+Math.round(t.x/WORLD_SCALE)-8;
      const y=FIELD_Y+Math.round(t.y/WORLD_SCALE)-8;
      const armored=t.hp>1;
      this.sprite(armored?ARMORED_TANK:TANK,x,y,palette,t.dir||0,playing?Math.floor(time*10)%2:0);
      if(t.shield>0&&Math.floor(time*16)%2===0) {
        this.rect(x-1,y-1,18,1,COLORS.white);this.rect(x-1,y+16,18,1,COLORS.white);
        this.rect(x-1,y,1,16,COLORS.white);this.rect(x+16,y,1,16,COLORS.white);
      }
    }
    hud(game) {
      const queued=Math.max(0,Math.min(20,Math.ceil(Number(game.remaining)||0)));
      for(let n=0;n<queued;n++)this.sprite(MINI_TANK,232+(n%2)*8,16+Math.floor(n/2)*8,[COLORS.black]);
      const players=game.players||[];
      for(let id=1;id<=2;id++) {
        const player=players.find(p=>p.id===id),y=id===1?112:144;
        this.text(id+'P',232,y);
        this.sprite(MINI_TANK,231,y+10,[COLORS.black]);
        this.text(player?Math.max(0,player.lives):0,242,y+10);
      }
      // A two-colour flag and stage number are the last two items in the console HUD.
      this.rect(233,180,2,17,COLORS.black);
      this.rect(235,180,12,8,COLORS.black);
      this.rect(235,181,10,5,'#a85000');
      this.rect(235,186,6,2,'#a85000');
      this.rect(231,197,6,1,COLORS.black);
      const stage=String(Math.max(1,Math.min(99,Number(game.stage)||1)));
      this.text(stage,stage.length>1?236:242,202);
    }
    draw(game) {
      const ctx=this.ctx,time=Number(game.time)||0,playing=game.phase==='playing';
      ctx.imageSmoothingEnabled=false;
      ctx.globalAlpha=1;
      this.rect(0,0,SCREEN_W,SCREEN_H,COLORS.frame);
      this.rect(FIELD_X,FIELD_Y,FIELD_SIZE,FIELD_SIZE,COLORS.black);
      ctx.save();ctx.beginPath();ctx.rect(FIELD_X,FIELD_Y,FIELD_SIZE,FIELD_SIZE);ctx.clip();
      const map=game.map||[];
      for(let row=0;row<map.length;row++)for(let col=0;col<map[row].length;col++)if(map[row][col]!==4)this.tile(map[row][col],FIELD_X+col*8,FIELD_Y+row*8,time);
      const base=game.base||{x:416,y:800,alive:true};
      this.sprite(base.alive?EAGLE:RUINS,FIELD_X+Math.round(base.x/WORLD_SCALE)-8,FIELD_Y+Math.round(base.y/WORLD_SCALE)-8,
        base.alive?['#585858','#bcbcbc']:['#585858','#7c7c7c']);
      for(const player of game.players||[])if(player.joined&&player.connected&&player.alive)this.tank(player,player.id===1?COLORS.yellow:COLORS.green,time,playing);
      if(game.phase==='lobby') {
        this.tank({x:288,y:800,dir:0},COLORS.yellow,time,false);
        this.tank({x:544,y:800,dir:0},COLORS.green,time,false);
      }
      for(const enemy of game.enemies||[]) {
        const palette=enemy.id%4===0&&Math.floor(time*6)%2===0?COLORS.red:COLORS.enemy;
        if(enemy.alive!==false)this.tank(enemy,palette,time,playing);
      }
      // Forest tiles cover tanks completely, as in the console battlefield.
      for(let row=0;row<map.length;row++)for(let col=0;col<map[row].length;col++)if(map[row][col]===4)this.tile(4,FIELD_X+col*8,FIELD_Y+row*8,time);
      for(const bullet of game.bullets||[]) {
        this.rect(FIELD_X+Math.round(bullet.x/WORLD_SCALE)-1,FIELD_Y+Math.round(bullet.y/WORLD_SCALE)-1,2,2,COLORS.white);
      }
      for(const particle of game.particles||[]) {
        const color=particle.life>.35?'#fc9838':particle.life>.18?'#d82800':COLORS.brick;
        this.rect(FIELD_X+Math.round(particle.x/WORLD_SCALE),FIELD_Y+Math.round(particle.y/WORLD_SCALE),1,1,color);
      }
      for(const burst of game.explosions||[]) {
        if(burst.life<=0)continue;
        this.sprite(BURST,FIELD_X+Math.round(burst.x/WORLD_SCALE)-8,FIELD_Y+Math.round(burst.y/WORLD_SCALE)-8,
          burst.life>.15?['#d82800','#fc9838',COLORS.white]:['#a81000','#d82800','#fc9838']);
      }
      ctx.restore();
      this.hud(game);
    }
  }

  root.NesRenderer=NesRenderer;
  if(typeof module!=='undefined'&&module.exports)module.exports={NesRenderer,COLORS,SCREEN_W,SCREEN_H,FIELD_X,FIELD_Y,FIELD_SIZE};
})(typeof window!=='undefined'?window:globalThis);
