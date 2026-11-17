(function(root){
'use strict';
const C={bg:'#e6e9dc',ink:'#25464b',muted:'#657b75',paper:'#faf5e5',green:'#327e70',gold:'#95602f',cursor:'#b84c79'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'wordPaper',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#fffbed'],[1,'#e8e8d8']]);c.fillRect(0,0,w,h);c.strokeStyle='#9aaa9844';c.lineWidth=2;c.strokeRect(2,2,124,124);c.strokeStyle='#ffffff99';c.strokeRect(6,6,116,116);c.fillStyle='#738c7211';for(let y=23;y<128;y+=26)c.fillRect(8,y,112,1);}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'WORD LADDER',42,26,28,'#fff3cc');fit(r,config.layouts[s.level].name,601,29,318,25,'#c4dacb');
 r.rect(30,82,280,72,'#d4e3d3');r.rect(330,82,280,72,'#ece0bd');text(r,'CURRENT',44,91,20,C.muted);fit(r,s.current,140,109,154,32,C.ink);text(r,'TARGET',345,91,20,C.gold);fit(r,s.target,440,109,154,32,C.gold);
 fit(r,'ALL '+s.words.length+' WORDS / ALPHABETICAL',30,164,580,22,C.muted);
 const left=30,top=194,cw=138,ch=42,dx=147,dy=48;
 s.words.forEach((word,index)=>{const x=left+index%4*dx,y=top+Math.floor(index/4)*dy,changed=s.differences[index],legal=changed.length===1,isCurrent=word===s.current,isGoal=word===s.target;
  r.sprite('wordPaper',x+cw/2,y+ch/2,cw,ch,0,isCurrent?'#d5ead9':'#ffffff');outline(r,x,y,cw,ch,legal?'#6b9c8c':'#a6b5a3',legal?2:1);
  if(isCurrent)text(r,'=',x+7,y+9,21,C.green);if(isGoal)text(r,'G',x+122,y+11,18,C.gold);
  for(let j=0;j<4;j++){const cx=x+39+j*22,color=changed.includes(j)?(legal?C.green:C.gold):C.ink;center(r,word[j],cx,y+6,27,color);if(changed.includes(j))r.line(cx-7,y+35,cx+7,y+35,2,color);}
  if(index===s.cursor)outline(r,x-2,y-2,cw+4,ch+4,C.cursor,3);
 });
 r.rect(651,84,285,408,C.paper);text(r,'CANDIDATE',670,97,23,C.muted);const candidate=s.words[s.cursor],diff=s.differences[s.cursor];
 for(let j=0;j<4;j++){const x=670+j*61;r.rect(x,133,53,43,diff.includes(j)?'#e7d2aa':'#dce7d5');center(r,candidate[j],x+26.5,137,32,diff.includes(j)?C.gold:C.ink);if(diff.includes(j))r.line(x+12,171,x+41,171,3,C.gold);}
 fit(r,diff.length===1?'ONE CHANGE / A OK':diff.length===0?'SAME WORD / BLOCKED':diff.length+' CHANGES / BLOCKED',670,189,247,22,diff.length===1?C.green:C.gold);
 fit(r,'STEPS '+s.movesUsed+' / '+s.moveLimit,670,225,247,24,C.ink);fit(r,'UNDO '+s.undosLeft+' / 2',670,259,247,24,C.ink);r.rect(670,292,247,2,'#bfccb8');text(r,'PATH / IN ORDER',670,302,21,C.muted);
 s.path.forEach((word,i)=>{const x=670+i%2*125,y=333+Math.floor(i/2)*26;if(i===s.path.length-1)r.rect(x-2,y-1,121,25,'#d7e7d4');fit(r,i+' '+word,x,y,119,21,i===s.path.length-1?C.green:C.ink);});
 fit(r,'A USE WORD / ONE LETTER ONLY',30,506,600,23,C.ink);fit(r,'B UNDO / NO REFUND',651,506,285,22,C.muted);
}
root.GameDef={id:'word-ladder',title:'词阶接龙',seed:config.defaultSeed,tagline:'公开词库，一次只换一个字母，逐阶连到目标',accent:'#b0c899',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'词阶',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['提交候选词','撤销一步'],
 description:'每关完整公开18至24个四字母英文词，不使用隐藏词典。方向键选词，A 提交与当前词恰好一个位置不同的候选。每次合法接龙消耗一步，回到旧词也耗步；到达目标获胜。非法候选免费。',
 controls:{move:'方向键在完整词格中选择；候选释义显示在信息栏',a:'空格、Z、确认 / 手机右上：只差一个字母时提交候选',b:'X、B / 手机右下：撤销上一步，共两次；不退还已用步数'},
 tip:'词库按字母顺序排列，目标词有 G 标记，当前词有等号。下划线表示与当前词不同的字母，绿色边框表示可接。无需另查词典，只认本关公开词库。死路词可以原路返回，但返回仍耗步；最后允许的一步到达目标也获胜。',
 winTitle:'词阶连通，抵达目标',loseTitle:'步数用尽，词阶未达',
 hud:s=>[{label:'候选词 / 释义',value:s.words[s.cursor]+' · '+s.meanings[s.words[s.cursor]]},{label:'当前词 / 释义',value:s.current+' · '+s.meanings[s.current]},{label:'已用步数',value:s.movesUsed+' / '+s.moveLimit},{label:'剩余撤销',value:s.undosLeft+' / 2'}],
 result:s=>s.phase==='won'?'从 '+s.start+'（'+s.meanings[s.start]+'）接到 '+s.target+'（'+s.meanings[s.target]+'），共耗 '+s.movesUsed+' 步。':'已用完 '+s.moveLimit+' 步，尚未抵达 '+s.target+'。先观察可接词之间的分支，撤销也不会退还步数。',render};
})(window);
