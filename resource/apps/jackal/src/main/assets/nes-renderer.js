/* Jackal TV: original, code-drawn 8-bit art. Native pixels; no ROM or external assets. */
(function (root) {
  'use strict';
  const SCREEN_W=256, SCREEN_H=240, FIELD_X=0, FIELD_Y=16, FIELD_W=224, FIELD_H=208, TILE=16;
  const PALETTES=[
    {ground:'#88a028',light:'#a8b840',dark:'#687c20',road:'#c8b068',roadLight:'#e0c880',roadDark:'#a08848',stone:'#687058',stoneLight:'#a0a880',stoneDark:'#384830',leaf:'#285818',leafLight:'#507828',water:'#185890',wave:'#50a8c0'},
    {ground:'#c8a858',light:'#e0c078',dark:'#a08040',road:'#e0c890',roadLight:'#f0d8a0',roadDark:'#b89860',stone:'#987048',stoneLight:'#c09868',stoneDark:'#584830',leaf:'#587030',leafLight:'#809848',water:'#206888',wave:'#60b8b8'},
    {ground:'#688070',light:'#88a090',dark:'#506858',road:'#a0a898',roadLight:'#c0c8b0',roadDark:'#788878',stone:'#586878',stoneLight:'#98a8b0',stoneDark:'#303c50',leaf:'#385848',leafLight:'#587858',water:'#184870',wave:'#4888a8'}
  ];
  const INK='#101820', WHITE='#f8f0d0', RED='#e85030', GOLD='#f8c848', GREEN='#a8d848';
  const PLAYER_COLORS=[['#202818','#886820','#d8a830','#f8d860','#588888','#404838','#e8b888'],['#182818','#386028','#70a838','#b8d860','#589090','#384838','#e8b888']];
  const ENEMY_COLORS=['#202028','#685848','#a88860','#d8b888','#486878','#404048','#d8a878'];
  // Four separate tyres, open cockpit, rear spare wheel and a bright bonnet.
  const JEEP=[
    '....................',
    '.....1111111111.....',
    '.....1344444431.....',
    '.....1344444431.....',
    '..1113333333333111..',
    '..1613333333333161..',
    '..1613333333333161..',
    '..1113555555553111..',
    '.....1555555551.....',
    '.....1111111111.....',
    '.....1227721121.....',
    '.....1227721121.....',
    '..1113222222223111..',
    '..1613222222223161..',
    '..1613333333333161..',
    '..1113331111333111..',
    '.....1331661331.....',
    '.....1111661111.....',
    '........1111........',
    '....................'
  ];
  const ARMOR=[
    '..........1111..........','..........1441..........','..........1441..........',
    '...1111...1221...1111...','...1661...1221...1661...',
    '...12111111111111121....','...16123333333332161....',
    '...12133444444333121....','...16133433334333161....',
    '...12133433334333121....','...16133433334333161....',
    '...12133444444333121....','...16133333333333161....',
    '...12133333333333121....','...16133322223333161....',
    '...12133322223333121....','...16133322223333161....',
    '...12133333333333121....','...16133333333333161....',
    '...12111111111111121....','...1661.........1661....',
    '...1111.........1111....','........................','........................'
  ];
  const SOLDIER=[
    '..1111..','..1221..','..1331..','...11...','.112211.','14122141',
    '.112211.','..1221..','..1441..','.11..11.'
  ];
  const PRISONER=[
    '..1111..','..1221..','..1221..','3..11..3','31144113','.144441.',
    '..1441..','..1441..','..1551..','.11..11.'
  ];
  const EXPLOSION=[
    '.......1........','..1....11....1..','...11.1221.11...','....12222221....',
    '.11122233222111.','..122233332221..','...1233333321...','1112233333322111',
    '..122333333221..','...1223333221...','..112223322211..','.11..122221..11.',
    '.....12221......','....11.121......','...1....11......','........1.......'
  ];
  const FONT={
    '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
    '2':['110','001','111','100','111'],'3':['110','001','011','001','110'],
    '4':['101','101','111','001','001'],'5':['111','100','110','001','110'],
    '6':['011','100','111','101','111'],'7':['111','001','010','010','010'],
    '8':['111','101','111','101','111'],'9':['111','101','111','001','110'],
    'A':['010','101','111','101','101'],'B':['110','101','110','101','110'],
    'C':['011','100','100','100','011'],'D':['110','101','101','101','110'],
    'E':['111','100','110','100','111'],'F':['111','100','110','100','100'],
    'G':['011','100','101','101','011'],'H':['101','101','111','101','101'],
    'I':['111','010','010','010','111'],'J':['001','001','001','101','010'],
    'K':['101','101','110','101','101'],'L':['100','100','100','100','111'],
    'M':['101','111','111','101','101'],'N':['101','111','111','111','101'],
    'O':['010','101','101','101','010'],'P':['110','101','110','100','100'],
    'Q':['010','101','101','111','011'],'R':['110','101','110','101','101'],
    'S':['011','100','010','001','110'],'T':['111','010','010','010','010'],
    'U':['101','101','101','101','111'],'V':['101','101','101','101','010'],
    'W':['101','101','111','111','101'],'X':['101','101','010','101','101'],
    'Y':['101','101','010','010','010'],'Z':['111','001','010','100','111'],
    '-':['000','000','111','000','000'],'/':['001','001','010','100','100'],
    ':':['000','010','000','010','000'],'+':['000','010','111','010','000'],
    '!':['010','010','010','000','010'],'.':['000','000','000','000','010']
  };
  const hash=(x,y)=>((Math.imul(x+7,73856093)^Math.imul(y+11,19349663))>>>0);
  // Inverse-sampled integer sprite rotations keep diagonal vehicles crisp, with no canvas transforms.
  function rotations(pattern){
    const n=Math.max(pattern.length,...pattern.map(row=>row.length)),result=[];
    for(let direction=0;direction<8;direction++){
      const size=direction%2?Math.ceil(n*Math.SQRT2):n,rows=[],a=direction*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
      for(let y=0;y<size;y++){let row='';for(let x=0;x<size;x++){
        const dx=x-(size-1)/2,dy=y-(size-1)/2,sourceX=Math.round(dx*c+dy*s+(n-1)/2),sourceY=Math.round(-dx*s+dy*c+(n-1)/2);
        row+=(pattern[sourceY]||'')[sourceX]||'.';
      }rows.push(row);}result.push(rows);
    }
    return result;
  }
  const JEEP_FRAMES=rotations(JEEP),ARMOR_FRAMES=rotations(ARMOR);
  class JackalRenderer {
    constructor(canvas){this.canvas=canvas;canvas.width=SCREEN_W;canvas.height=SCREEN_H;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;}
    rect(x,y,w,h,color){if(w<=0||h<=0)return;this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    text(value,x,y,color=WHITE,scale=1){for(const char of String(value).toUpperCase()){
      const glyph=FONT[char];if(glyph)for(let y1=0;y1<5;y1++)for(let x1=0;x1<3;x1++)if(glyph[y1][x1]==='1')this.rect(x+x1*scale,y+y1*scale,scale,scale,color);x+=4*scale;
    }}
    sprite(pattern,x,y,palette){for(let row=0;row<pattern.length;row++)for(let col=0;col<pattern[row].length;col++){const v=Number(pattern[row][col]);if(v)this.rect(x+col,y+row,1,1,palette[v-1]||palette[0]);}}
    screenY(y){return Math.round(y-this.cameraY)+FIELD_Y;}
    visible(y,r=32){return y+r>=this.cameraY&&y-r<=this.cameraY+FIELD_H;}
    ground(x,y,col,row,p){
      const h=hash(col,row);this.rect(x,y,TILE,TILE,p.ground);
      this.rect(x+(h%13),y+((h>>>5)%14),2,1,p.light);
      this.rect(x+((h>>>12)%13),y+((h>>>18)%14),3,1,p.dark);
      if((h&3)===0){this.rect(x+5,y+8,1,3,p.dark);this.rect(x+3,y+7,1,2,p.dark);this.rect(x+7,y+6,1,2,p.light);}
    }
    tile(value,x,y,col,row,map,p,time){
      if(value===2){
        this.rect(x,y,16,16,p.water);const wave=Math.floor(time*3+row)%3;
        this.rect(x+((col+wave)%4),y+3,7,1,p.wave);this.rect(x+((col+wave*2)%5),y+11,8,1,p.wave);
        this.rect(x+2,y+4,5,1,'#204878');this.rect(x+7,y+12,4,1,'#204878');
        const above=map[row-1]&&map[row-1][col],below=map[row+1]&&map[row+1][col];
        if(above!==2&&above!==4){this.rect(x,y,16,2,p.roadDark);this.rect(x,y+2,16,1,p.wave);}
        if(below!==2&&below!==4){this.rect(x,y+14,16,2,p.roadDark);this.rect(x,y+13,16,1,p.wave);}
      }else if(value===4){
        this.rect(x,y,16,16,p.stoneDark);this.rect(x+1,y,14,16,p.roadDark);
        for(let n=0;n<4;n++){this.rect(x+1,y+n*4,14,2,p.roadLight);this.rect(x+3,y+n*4,1,2,p.roadDark);this.rect(x+12,y+n*4,1,2,p.roadDark);}
        if(!map[row]||map[row][col-1]!==4){this.rect(x,y,2,16,p.stoneDark);this.rect(x,y,1,16,p.stoneLight);}
        if(!map[row]||map[row][col+1]!==4){this.rect(x+14,y,2,16,p.stoneDark);this.rect(x+14,y,1,16,p.stoneLight);}
      }else if(value===1){
        this.rect(x,y,16,16,p.road);const h=hash(col,row);
        this.rect(x+(h%13),y+((h>>>6)%14),2,1,p.roadLight);
        this.rect(x+((h>>>15)%14),y+((h>>>20)%14),1,2,p.roadDark);
        if(map[row]&&map[row][col-1]===0){this.rect(x,y,1,16,p.roadDark);this.rect(x+1,y+(h%10),1,3,p.ground);}
        if(map[row]&&map[row][col+1]===0){this.rect(x+15,y,1,16,p.roadDark);this.rect(x+14,y+(h%10),1,3,p.ground);}
      }else if(value===3){
        this.ground(x,y,col,row,p);
        if(this.stage===1&&(col<3||col>10)){
          this.rect(x+6,y+7,3,9,p.stoneDark);this.rect(x+7,y+8,1,7,p.roadDark);
          this.rect(x+3,y+2,10,9,p.leaf);this.rect(x+1,y+4,14,5,p.leaf);this.rect(x+5,y,6,13,p.leaf);
          this.rect(x+4,y+3,4,2,p.leafLight);this.rect(x+8,y+2,3,1,p.leafLight);this.rect(x+2,y+6,3,1,p.leafLight);this.rect(x+9,y+8,3,2,p.stoneDark);
        }else{
          this.rect(x+1,y+3,14,12,p.stoneDark);this.rect(x+3,y+1,10,12,p.stone);
          this.rect(x+2,y+4,12,8,p.stone);this.rect(x+4,y+2,8,2,p.stoneLight);this.rect(x+2,y+4,3,4,p.stoneLight);
          this.rect(x+9,y+8,4,4,p.stoneDark);this.rect(x+5,y+12,7,2,p.stoneDark);
        }
      }else this.ground(x,y,col,row,p);
    }
    hut(hut,p){
      const x=Math.round(hut.x-16),y=this.screenY(hut.y)-12;
      this.rect(x+1,y+3,31,23,p.stoneDark);this.rect(x,y,30,22,p.stone);this.rect(x,y,30,2,p.stoneLight);
      this.rect(x,y+2,2,19,p.stoneLight);this.rect(x+2,y+3,26,4,p.roadDark);
      for(let line=0;line<2;line++)for(let n=0;n<4;n++)this.rect(x+3+n*7+(line%2?2:0),y+4+line*2,4,1,p.roadLight);
      this.rect(x+11,y+9,10,13,INK);this.rect(x+13,y+10,6,11,hut.open?'#202820':'#505848');
      if(!hut.open){for(let n=0;n<3;n++)this.rect(x+13+n*2,y+10,1,11,p.stoneLight);this.rect(x+12,y+16,8,1,p.stoneDark);}
      else {this.rect(x+3,y+18,5,3,p.stoneDark);this.rect(x+23,y+20,6,2,p.stoneDark);this.rect(x+9,y+20,2,3,p.stoneLight);}
      this.rect(x+3,y+10,5,5,p.stoneDark);this.rect(x+24,y+10,4,5,p.stoneDark);
      if(!hut.open){this.text('POW',x+9,y-6,WHITE);if(hut.hp<hut.maxHp){this.rect(x+6,y+11,1,3,INK);this.rect(x+7,y+14,2,1,INK);this.rect(x+23,y+5,1,3,INK);}}
    }
    helipad(pad,p,time){
      const x=Math.round(pad.x-16),y=this.screenY(pad.y)-16;
      this.rect(x-1,y-1,34,34,p.roadDark);this.rect(x,y,32,32,p.stone);this.rect(x+1,y+1,30,1,p.stoneLight);this.rect(x+1,y+1,1,30,p.stoneLight);
      this.rect(x+3,y+3,26,1,WHITE);this.rect(x+3,y+28,26,1,WHITE);this.rect(x+3,y+3,1,26,WHITE);this.rect(x+28,y+3,1,26,WHITE);
      this.rect(x+9,y+8,3,16,WHITE);this.rect(x+20,y+8,3,16,WHITE);this.rect(x+12,y+14,8,3,WHITE);
      const blink=Math.floor(time*4)%2===0;for(const [dx,dy] of [[0,0],[29,0],[0,29],[29,29]])this.rect(x+dx,y+dy,3,3,blink?GOLD:RED);
      if(pad.unloading>0){this.text('RESCUE',x+4,y-7,GOLD);this.rect(x+8,y+35,16,1,WHITE);}
    }
    jeep(player,time){
      if(!this.visible(player.y))return;
      const x=Math.round(player.x),y=this.screenY(player.y),palette=PLAYER_COLORS[player.id===2?1:0];
      this.rect(x-7,y+7,15,4,'#384028');
      if(player.invulnerable>0&&Math.floor(time*16)%2===0)return;
      const frame=JEEP_FRAMES[(Number(player.dir)||0)%8];this.sprite(frame,x-Math.floor(frame.length/2),y-Math.floor(frame.length/2),palette);
      // Like the classic jeep, its machine gun points north while grenades follow the hull.
      this.rect(x-1,y-8,2,8,INK);this.rect(x,y-9,1,8,WHITE);this.rect(x-2,y-1,4,3,palette[1]);
      if(player.moving&&Math.floor(time*12)%2===0){const d=(Number(player.dir)||0)*Math.PI/4;this.rect(x-Math.round(Math.sin(d)*11)-1,y+Math.round(Math.cos(d)*11),2,2,this.palette.roadLight);}
      this.rect(x-2,y-15,5,5,INK);this.text(player.id,x-1,y-15,player.id===2?GREEN:GOLD);
    }
    enemy(enemy,time){
      if(enemy.alive===false||!this.visible(enemy.y))return;const x=Math.round(enemy.x),y=this.screenY(enemy.y),dir=(Number(enemy.dir)||0)%8;
      if(enemy.type==='infantry'){
        this.rect(x-3,y+4,7,2,this.palette.dark);const pattern=SOLDIER.map((row,i)=>i===9&&Math.floor(time*6+enemy.id)%2===0?'..1..1..':row);
        this.sprite(pattern,x-4,y-5,[INK,'#b8a060','#e0b088','#686840']);
        const a=dir*Math.PI/4;this.rect(x+Math.round(Math.sin(a)*4),y-Math.round(Math.cos(a)*4),2,2,INK);
      }else if(enemy.type==='armor'){
        this.rect(x-10,y+8,21,5,'#384028');const frame=ARMOR_FRAMES[dir];this.sprite(frame,x-Math.floor(frame.length/2),y-Math.floor(frame.length/2),ENEMY_COLORS);
      }else{
        const p=this.palette;this.rect(x-7,y-5,14,12,p.stoneDark);this.rect(x-5,y-7,10,16,p.stoneDark);
        this.rect(x-6,y-4,12,10,p.stone);this.rect(x-4,y-6,8,14,p.stone);this.rect(x-4,y-5,8,2,p.stoneLight);
        this.rect(x-3,y-3,6,7,'#886850');this.rect(x-2,y-2,4,3,'#b8a078');
        const a=dir*Math.PI/4;for(let n=2;n<=10;n++)this.rect(x+Math.round(Math.sin(a)*n)-1,y-Math.round(Math.cos(a)*n)-1,3,3,INK);
        for(let n=2;n<=10;n++)this.rect(x+Math.round(Math.sin(a)*n),y-Math.round(Math.cos(a)*n)-1,1,2,'#b0b0a0');
      }
    }
    fortress(boss,p,time){
      if(!boss||!this.visible(boss.y,40))return;const x=Math.round(boss.x-32),y=this.screenY(boss.y)-16;
      if(!boss.alive){this.rect(x+2,y+9,60,21,p.stoneDark);for(let n=0;n<8;n++)this.rect(x+3+n*7,y+7+(n%3)*4,5,7,p.stone);return;}
      this.rect(x-2,y+4,68,30,INK);this.rect(x,y,64,32,p.stoneDark);this.rect(x+2,y+1,60,27,p.stone);this.rect(x+2,y+1,60,2,p.stoneLight);
      for(let n=0;n<8;n++){this.rect(x+n*8,y-3,6,8,p.stone);this.rect(x+n*8,y-3,6,2,p.stoneLight);}
      this.rect(x+22,y+8,20,24,INK);this.rect(x+24,y+9,16,23,'#503c30');
      for(let n=0;n<5;n++)this.rect(x+25,y+10+n*4,14,1,p.stoneLight);
      this.rect(x+29,y+20,6,4,Math.floor(time*6)%2?RED:GOLD);
      for(const dx of [4,46]){
        this.rect(x+dx,y+8,14,18,INK);this.rect(x+dx+1,y+9,12,13,'#886850');this.rect(x+dx+2,y+10,10,2,'#c0a078');
        this.rect(x+dx+4,y+16,6,17,INK);this.rect(x+dx+5,y+16,2,16,'#b8b8a0');this.rect(x+dx+8,y+16,1,16,'#686858');
      }
      const hp=Math.max(0,Math.min(1,boss.hp/boss.maxHp));this.rect(x+4,y-9,56,3,INK);this.rect(x+5,y-8,54*hp,1,RED);
    }
    hud(game){
      this.rect(224,0,32,240,INK);this.rect(224,0,1,240,'#384838');this.rect(0,0,224,16,INK);this.rect(0,224,224,16,INK);
      this.text('JACKAL',5,5,GOLD);this.text('STAGE '+Math.max(1,game.stage||1),166,5,WHITE);
      for(let id=1;id<=2;id++){
        const player=(game.players||[]).find(p=>p.id===id)||{},y=id===1?18:112,color=id===1?GOLD:GREEN;
        this.text(id+'P',230,y,color);this.rect(229,y+8,22,1,'#384838');
        this.text('LIFE',229,y+13,'#a0a890');
        for(let n=0;n<Math.min(3,Math.max(0,player.lives||0));n++){this.rect(229+n*7,y+22,5,5,color);this.rect(231+n*7,y+21,1,1,color);this.rect(230+n*7,y+24,3,1,INK);}
        this.text(String(Math.max(0,Math.min(999999,player.score||0))).padStart(6,'0'),228,y+31,WHITE);
        this.text('POW',229,y+43,'#a0a890');this.text((player.passengers||0)+'/8',231,y+52,color);
        this.text('WPN',229,y+64,'#a0a890');
        for(let n=0;n<3;n++)this.rect(229+n*8,y+73,6,4,n<=(player.weaponLevel||0)?color:'#384838');
        if(!player.connected)this.text('WAIT',229,y+82,'#687868');
      }
      this.text('RESCUED',5,230,'#a0a890');this.text(String(game.rescued||0).padStart(2,'0'),39,230,GOLD);
      if(game.boss&&game.boss.active&&game.boss.alive)this.text('DESTROY FORTRESS',125,230,RED);
      else this.text('A GUN  B GRENADE',125,230,WHITE);
      this.text('GO',232,219,GOLD);this.rect(238,209,2,6,GOLD);this.rect(237,210,4,1,GOLD);this.rect(236,211,6,1,GOLD);
    }
    draw(game){
      const ctx=this.ctx,time=Number(game.time)||0;this.cameraY=Math.round(Number(game.cameraY)||0);this.stage=Math.max(1,game.stage||1);this.palette=PALETTES[(this.stage-1)%PALETTES.length];const p=this.palette;
      ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;this.rect(0,0,SCREEN_W,SCREEN_H,INK);
      ctx.save();ctx.beginPath();ctx.rect(FIELD_X,FIELD_Y,FIELD_W,FIELD_H);ctx.clip();
      this.rect(FIELD_X,FIELD_Y,FIELD_W,FIELD_H,p.ground);
      const map=game.map||[],start=Math.max(0,Math.floor(this.cameraY/TILE)),end=Math.min(map.length,Math.ceil((this.cameraY+FIELD_H)/TILE));
      for(let row=start;row<end;row++)for(let col=0;col<Math.min(14,(map[row]||[]).length);col++)this.tile(map[row][col],col*TILE,this.screenY(row*TILE),col,row,map,p,time);
      for(const pad of game.helipads||[])if(this.visible(pad.y))this.helipad(pad,p,time);
      for(const hut of game.huts||[])if(this.visible(hut.y))this.hut(hut,p);
      this.fortress(game.boss,p,time);
      for(const prisoner of game.prisoners||[])if(prisoner.alive!==false&&this.visible(prisoner.y)){
        const x=Math.round(prisoner.x)-4,y=this.screenY(prisoner.y)-5;this.rect(x+1,y+9,7,1,p.dark);
        this.sprite(PRISONER,x,y,[INK,'#e0b888','#e0b888','#6898c8','#385880']);
      }
      for(const enemy of game.enemies||[])this.enemy(enemy,time);
      for(const player of game.players||[])if(player.alive!==false&&((player.joined&&player.connected)||game.phase==='lobby'))this.jeep(player,time);
      for(const bullet of game.bullets||[])if(this.visible(bullet.y,4)){
        const x=Math.round(bullet.x),y=this.screenY(bullet.y),friendly=bullet.team==='player';this.rect(x-1,y-1,3,3,INK);this.rect(x,y-1,1,2,friendly?WHITE:RED);
      }
      for(const grenade of game.grenades||[])if(this.visible(grenade.y,20)){
        const x=Math.round(grenade.x),y=this.screenY(grenade.y),progress=1-Math.max(0,Math.min(1,grenade.life/grenade.maxLife)),arc=Math.round(Math.sin(progress*Math.PI)*12);
        this.rect(x-2,y+1,4,2,p.dark);this.rect(x-2,y-arc-2,5,5,INK);this.rect(x-1,y-arc-2,3,3,GOLD);this.rect(x,y-arc-3,1,1,WHITE);
        if(grenade.power>0)this.rect(x-1,y-arc+2,3,2,RED);
      }
      for(const effect of game.effects||[])if(this.visible(effect.y,24)){
        const x=Math.round(effect.x),y=this.screenY(effect.y);
        if(effect.kind==='explosion')this.sprite(EXPLOSION,x-8,y-8,effect.life/effect.maxLife>.45?[RED,GOLD,WHITE]:['#883820',RED,GOLD]);
        else if(effect.kind==='rescue'){const offset=Math.round((1-effect.life/effect.maxLife)*12);this.text('+POW',x-8,y-offset-8,WHITE);}
        else{this.rect(x-2,y,5,1,WHITE);this.rect(x,y-2,1,5,GOLD);}
      }
      ctx.restore();this.hud(game);
    }
  }
  root.JackalRenderer=JackalRenderer;
  if(typeof module!=='undefined'&&module.exports)module.exports={JackalRenderer,SCREEN_W,SCREEN_H,FIELD_X,FIELD_Y,FIELD_W,FIELD_H};
})(typeof window!=='undefined'?window:globalThis);
