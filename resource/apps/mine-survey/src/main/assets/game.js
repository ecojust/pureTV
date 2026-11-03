(function(root){
'use strict';
const C={bg:'#182b34',ink:'#f5e7ce',muted:'#a7b7bb',copper:'#e8a86b',line:'#597581',dark:'#1b3a4b',mint:'#a5d4bc'},config=root.PureModel.config;
const numberColors=['#78928e','#2e6b9d','#337653','#a6503c','#6a5887','#934f69','#267c7a','#593f42','#333b45'];
const atlas={builtins:[],tiles:[
 {name:'covered',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#58717b'],[.5,'#334f5b'],[1,'#213843']]);c.fillRect(2,2,124,124);c.strokeStyle='#91a6a1';c.lineWidth=2;c.strokeRect(5,5,118,118);c.fillStyle='#f4cca840';c.fillRect(8,8,111,2);for(let y=20;y<117;y+=16){c.strokeStyle='#afc1bc0c';c.beginPath();c.moveTo(11,y);c.lineTo(115,y-4);c.stroke();}for(const[x,y]of[[13,13],[115,13],[13,115],[115,115]]){c.fillStyle='#c7a580';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}}},
 {name:'opened',x:128,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#e9e4d0'],[1,'#c6d1c2']]);c.fillRect(1,1,126,126);c.strokeStyle='#6b868e';c.lineWidth=2;c.strokeRect(2,2,124,124);c.strokeStyle='#8ca4a033';c.lineWidth=1;for(let p=20;p<128;p+=20){c.beginPath();c.moveTo(p,4);c.lineTo(p,124);c.moveTo(4,p);c.lineTo(124,p);c.stroke();}}},
 {name:'surveyFlag',x:256,y:0,w:128,h:128,paint(c,w,h,art){art.ellipse(c,64,114,39,8,'#0b273355');c.strokeStyle='#e9d2ab';c.lineWidth=7;c.beginPath();c.moveTo(42,13);c.lineTo(42,108);c.stroke();art.path(c,[[46,18],[110,29],[89,49],[46,63]],art.linear(c,40,20,106,62,[[0,'#f1c28a'],[1,'#ba7149']]),'#5d4132',2);c.strokeStyle='#fee8bd';c.lineWidth=3;c.beginPath();c.moveTo(50,24);c.lineTo(91,31);c.stroke();art.path(c,[[26,108],[65,108],[73,116],[18,116]],'#cfb58b','#463f36',2);}},
 {name:'mineMark',x:384,y:0,w:128,h:128,paint(c,w,h,art){c.strokeStyle='#b58b65';c.lineWidth=6;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(64+Math.cos(a)*29,64+Math.sin(a)*29);c.lineTo(64+Math.cos(a)*49,64+Math.sin(a)*49);c.stroke();}art.ellipse(c,64,66,33,33,art.radial(c,64,66,34,[[0,'#66818a'],[.5,'#213e4b'],[1,'#0a222f']],51,49));art.ellipse(c,54,53,9,7,'#b5c1b7');}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function coord(c){return String.fromCharCode(65+c%6)+(Math.floor(c/6)+1);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,20,912,44,'#254553');text(r,'MINE SURVEY',44,29,28,C.copper);text(r,config.layouts[s.level].name,602,29,26,C.ink);
 const left=84,top=92,size=64;r.rect(left-10,top-10,404,404,'#8c6b51');r.rect(left-5,top-5,394,394,'#142e3e');
 for(let i=0;i<6;i++){center(r,String.fromCharCode(65+i),left+i*size+32,67,22,C.muted);center(r,i+1,left-27,top+i*size+21,23,C.muted);}
 s.cells.forEach((value,i)=>{const x=left+(i%6)*size,y=top+Math.floor(i/6)*size;
  r.sprite(value===null?'covered':'opened',x+32,y+32,size,size,0,'#ffffff');
  if(value===-1){if(i===s.exploded)r.rect(x+3,y+3,58,58,'#ca7f6266');r.sprite('mineMark',x+32,y+32,60,60,0,'#ffffff');}
  else if(value!==null){if(value)center(r,value,x+32,y+9,43,numberColors[value]);else r.circle(x+32,y+32,3,'#7e9c97');}
  if(s.flags[i]&&value===null){r.sprite('surveyFlag',x+32,y+32,55,55,0,'#ffffff');if(s.phase==='lost'){r.line(x+11,y+11,x+53,y+53,4,'#f1816a');r.line(x+53,y+11,x+11,y+53,4,'#f1816a');}}
  if(i===s.cursor)outline(r,x+2,y+2,60,60,C.copper,4);
 });
 text(r,'SAFE REVEALED',538,92,25,C.muted);text(r,s.revealedSafe+' / '+s.safeTotal,538,127,42,C.ink);
 text(r,'SAFE LEFT '+(s.safeTotal-s.revealedSafe),538,182,26,C.mint);
 r.rect(537,225,360,2,C.line);r.sprite('surveyFlag',567,275,47,47,0,'#ffffff');text(r,'FLAGS '+s.flagsUsed+' / '+s.mineCount,610,250,28,C.copper);
 text(r,'FLAGS LEFT '+(s.mineCount-s.flagsUsed),538,299,25,C.muted);text(r,'TOTAL MINES '+s.mineCount,538,339,25,C.muted);
 const value=s.cells[s.cursor],status=value===-1?'MINE':s.flags[s.cursor]?'FLAGGED':value===null?'HIDDEN':'CLUE '+value;
 text(r,coord(s.cursor)+' / '+status,538,383,28,C.ink);r.rect(537,428,360,47,'#284a59');center(r,'A REVEAL / B FLAG',717,442,25,C.ink);
 text(r,'NUMBERS COUNT ALL 8 NEIGHBORS',84,501,24,C.muted);text(r,'FLAGS ARE YOUR NOTES',603,503,22,C.copper);
}
root.GameDef={id:'mine-survey',title:'雷纹勘探',seed:config.defaultSeed,tagline:'读懂八方数字，标出安全的下一格',accent:C.copper,background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'勘探区',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['探开','插旗 / 收旗'],
 description:'初始安全区已经打开。数字表示周围八格中的雷数；方向选格，A 探开，B 插旗或收旗。探开全部安全格即可获胜，旗不必插完。碰雷立即结束，三关均可凭线索推理。',
 controls:{move:'方向键移动勘探光标',a:'空格、Z、确认 / 手机右上：探开',b:'X、B / 手机右下：插旗或收旗'},
 tip:'空白点表示周围无雷，会自动打开相邻安全区。旗标只是你的判断，插旗格不会被打开。旗数上限等于总雷数；不要猜雷位，先用已知数字排除。长按不连动。',
 winTitle:'安全区域全部勘明',loseTitle:'触雷，本次勘探结束',
 hud:s=>[{label:'已探安全格',value:s.revealedSafe+' / '+s.safeTotal,tone:'good'},{label:'总雷数',value:s.mineCount},{label:'剩余旗标',value:s.mineCount-s.flagsUsed},{label:'光标',value:coord(s.cursor)}],
 result:s=>'已探明 '+s.revealedSafe+' / '+s.safeTotal+' 个安全格。'+(s.phase==='won'?'所有安全格均已打开。':'根据相邻数字重新推理，旗标本身不会验证是否有雷。'),render};
})(window);
