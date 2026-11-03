(function(root){
'use strict';
const C={bg:'#152b36',ink:'#e9eedb',muted:'#a3b7b4',panel:'#203d46',gold:'#e2bc72',cyan:'#85ddd1',red:'#ef9886'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'formationShip',x:0,y:0,w:128,h:128,paint(c,w,h,art){art.path(c,[[13,94],[43,64],[50,35],[64,17],[78,35],[85,64],[115,94],[96,109],[32,109]],'#e5ead6','#7caba9',5);art.path(c,[[45,87],[52,52],[64,40],[76,52],[83,87]],'#547e86','#b7ddd0',3);c.fillStyle='#8bdacf';c.fillRect(56,57,16,27);c.fillStyle='#cbad71';c.fillRect(29,87,17,9);c.fillRect(82,87,17,9);}},
 {name:'formationEnemy',x:128,y:0,w:128,h:128,paint(c,w,h,art){art.path(c,[[15,57],[33,57],[42,22],[64,39],[86,22],[95,57],[113,57],[106,95],[83,91],[64,111],[45,91],[22,95]],'#e5e6d3','#a6b8ad',4);art.path(c,[[39,62],[56,65],[54,77],[37,74]],'#30434b');art.path(c,[[72,65],[89,62],[91,74],[74,77]],'#30434b');c.strokeStyle='#7c8e84';c.lineWidth=4;c.beginPath();c.moveTo(54,91);c.lineTo(74,91);c.stroke();}},
 {name:'formationShield',x:256,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#a2bfc0'],[1,'#5c7c85']]);c.fillRect(4,4,120,120);c.strokeStyle='#d1e0ce';c.lineWidth=6;c.strokeRect(7,7,114,114);c.strokeStyle='#324e60';c.lineWidth=5;c.beginPath();c.moveTo(23,23);c.lineTo(105,105);c.moveTo(23,105);c.lineTo(105,23);c.stroke();}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,'#304c54');text(r,'STAR FORMATION',42,26,28,'#fff1c7');fit(r,config.layouts[s.level].name,601,29,318,25,'#b7d9ca');
 const scale=.82,left=35,top=110,w=720*scale,h=450*scale,point=(x,y)=>({x:left+x*scale,y:top+y*scale});r.rect(left-5,top-5,w+10,h+10,'#627c7f');r.rect(left,top,w,h,'#102632');
 for(let i=0;i<46;i++){const x=(i*137+43)%720,y=(i*83+21)%450,p=point(x,y);r.circle(p.x,p.y,i%5?1:1.6,i%5?'#70909677':'#bad2ba99');}
 for(let y=75;y<450;y+=75){const p=point(0,y);r.line(left,p.y,left+w,p.y,1,'#42606b22');}
 const line=point(0,config.defenseY);for(let x=0;x<720;x+=24){const p=point(x,config.defenseY);r.line(p.x,p.y,p.x+13,p.y,2,'#dba46b');}text(r,'DEFENSE',left+5,line.y+4,19,'#d9ae79');
 for(const c of s.shieldCells)if(c.hp>0){const p=point(c.x+c.w/2,c.y+c.h/2);r.sprite('formationShield',p.x,p.y,c.w*scale,c.h*scale,0,'#ffffff');}
 for(const e of s.enemies)if(e.hp>0){const p=point(e.x,e.y),tint=['#e4bd87','#c6dda4','#9ecfd2'][e.row%3];r.sprite('formationEnemy',p.x,p.y,e.w*scale,e.h*scale,0,tint);}
 for(const b of s.friendlyBullets){const p=point(b.x,b.y),color=b.piercing?C.cyan:C.gold;r.rect(p.x-b.w*scale/2,p.y-b.h*scale/2,b.w*scale,b.h*scale,color);if(b.piercing){r.line(p.x-5,p.y+3,p.x,p.y-7,2,'#b7fff1');r.line(p.x+5,p.y+3,p.x,p.y-7,2,'#b7fff1');}}
 for(const b of s.enemyBullets){const p=point(b.x,b.y);r.line(p.x-3,p.y-4,p.x+3,p.y,2,C.red);r.line(p.x+3,p.y,p.x-3,p.y+4,2,C.red);r.line(p.x,p.y-5,p.x,p.y+5,2,'#ffd2b1');}
 const player=point(s.player.x,s.player.y);r.sprite('formationShip',player.x,player.y,s.player.w*scale+4,s.player.h*scale+7,0,'#ffffff');if(s.invulnerable>0)outline(r,player.x-18,player.y-14,36,28,C.cyan,2);
 fit(r,'LEFT / RIGHT MOVE   |   A HOLD FIRE',32,77,600,22,C.muted);fit(r,'B PIERCE / 2 ROUNDS',32,506,570,25,C.cyan);
 r.rect(651,84,285,408,C.panel);text(r,'INVADERS',670,99,24,C.muted);fit(r,s.remaining+' / '+s.initialEnemies,670,134,247,38,C.ink);
 text(r,'LIVES',670,188,23,C.muted);for(let i=0;i<3;i++){const x=795+i*43;r.rect(x,190,29,18,i<s.lives?'#dce8cb':'#405963');if(i>=s.lives){r.line(x,190,x+29,208,2,'#6a7c7d');r.line(x+29,190,x,208,2,'#6a7c7d');}}
 text(r,'PIERCE',670,231,23,C.muted);fit(r,s.piercingLeft+' / 2',809,229,108,27,C.cyan);
 r.rect(670,275,247,2,'#527277');fit(r,'COVER '+s.shieldRemaining+' / 18',670,292,247,24,C.muted);
 fit(r,'FLEET '+(s.baseStepInterval/s.formation.stepInterval).toFixed(2)+'x',670,331,247,25,C.ink);r.rect(670,369,247,7,'#142e3a');r.rect(670,369,247*Math.min(1,s.formation.stepClock/s.formation.stepInterval),7,'#c5b07c');
 fit(r,s.formation.direction>0?'MARCH RIGHT >':'< MARCH LEFT',670,393,247,23,C.gold);fit(r,'GUARD THE LINE',670,445,247,23,C.muted);
 fit(r,'CLEAR ALL BEFORE DESCENT',651,506,285,22,C.muted);
}
root.GameDef={id:'star-formation',title:'星阵防线',seed:config.defaultSeed,tagline:'横移躲弹，击穿掩体，拦住下降的星阵',accent:'#a0d3c4',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'敌阵',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['按住连射','穿透弹'],
 description:'战机只能左右移动。按住 A 持续射击，B 以新按键发射两枚限量穿透弹。敌阵整体横移，触边下降，数量越少越快；仍存活列的底部敌人按轮次发射下落子弹。可破坏掩体挡住双方普通子弹。',
 controls:{move:'左右持续横移躲开敌弹；上下不移动',a:'空格、Z、确认 / 手机右上：按住连续射击',b:'X、B / 手机右下：新按一次发一枚穿透弹，共两枚'},
 tip:'浅金短弹向上，折线敌弹向下，带尖头的青色弹可穿过多个敌人与掩体。掩体每格只挡一次；敌阵接触会压碎掩体。三点生命耗尽或敌人到金色防线就失败。同一物理步若同时清空敌阵，清空优先获胜。',
 winTitle:'星阵清空，防线稳固',loseTitle:'星阵突破防线',
 hud:s=>[{label:'剩余敌人',value:s.remaining+' / '+s.initialEnemies},{label:'生命',value:s.lives+' / 3'},{label:'穿透弹',value:s.piercingLeft+' / 2'},{label:'掩体格',value:s.shieldRemaining+' / 18'}],
 result:s=>s.phase==='won'?'清除 '+s.enemyKills+' 架敌人，剩余 '+s.lives+' 点生命；使用 '+s.piercingShots+' 枚穿透弹。':s.reason==='lives'?'敌弹耗尽了三点生命。横向躲避下落弹，掩体也会逐格损坏。':'敌阵已抵达金色防线。减少敌人会加快行进，需及时清空最后几架。',render};
})(window);
