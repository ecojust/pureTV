(function(root){
'use strict';
const C={bg:'#e5e6d7',ink:'#25474c',muted:'#657c77',paper:'#faf5e3',green:'#2b8271',zero:'#638795',gold:'#9b6b30',bad:'#a24f56',cursor:'#b84e77'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'logicChip',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#446d6d'],[1,'#24464c']]);c.fillRect(5,5,118,118);c.strokeStyle='#94b3a2';c.lineWidth=5;c.strokeRect(8,8,112,112);c.fillStyle='#b7c3a5';for(let y=24;y<119;y+=25){c.fillRect(0,y,12,8);c.fillRect(116,y,12,8);}c.strokeStyle='#95af9a22';c.lineWidth=2;c.strokeRect(20,20,88,88);}},
 {name:'logicPort',x:128,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#fff9e5'],[1,'#dbe2ca']]);c.fillRect(2,2,124,124);c.strokeStyle='#9aab8d';c.lineWidth=4;c.strokeRect(4,4,120,120);}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function label(ref){return ref<3?config.inputNames[ref]:'G'+(ref-2);}
function bit(v){return v===null?'?':String(v);}
function signal(v){return v===1?C.green:v===0?C.zero:C.gold;}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'LOGIC WORKBENCH',42,26,28,'#fff3cf');fit(r,config.layouts[s.level].name,601,29,318,25,'#c6ddca');
 const row=s.truthRows[s.selectedRow];r.rect(30,82,580,40,'#d3dfcf');for(let i=0;i<3;i++){text(r,config.inputNames[i]+' = '+row.inputs[i],44+i*112,91,25,signal(row.inputs[i]));}fit(r,'ROW '+row.inputs.join(''),404,93,192,23,C.ink);
 const top=132+(6-s.gates.length)*28;
 s.slots.forEach((slot,i)=>{const y=top+i*56,gate=s.gates[i],selected=i===s.selectedSlot,va=row.signals[slot.a],vb=row.signals[slot.b],out=row.gateOutputs[i];r.rect(30,y,580,51,selected?'#eee0bc':'#f1f0df');if(selected)outline(r,30,y,580,51,C.cursor,2);text(r,'G'+(i+1),44,y+15,25,selected?C.cursor:C.ink);
  [slot.a,slot.b].forEach((ref,p)=>{const py=y+3+p*25,disabled=p===1&&gate===4,value=p===0?va:vb;r.sprite('logicPort',160,py+10.5,110,21,0,disabled?'#c8cbbb':'#ffffff');fit(r,label(ref)+(disabled?' OFF':': '+bit(value)),115,py+1,95,21,disabled?C.muted:signal(value));if(disabled){r.line(218,py+11,269,py+11,1,'#a8b2a4');r.line(238,py+5,250,py+17,2,C.gold);r.line(250,py+5,238,py+17,2,C.gold);}else{r.line(215,py+11,274,py+11,3,signal(value));r.circle(270,py+11,3,signal(value));}});
  r.sprite('logicChip',334,y+25.5,120,49,0,'#ffffff');center(r,config.gateNames[gate],334,y+13,27,gate?'#f6f1d8':'#b2c5b9');
  r.line(394,y+26,455,y+26,3,signal(out));r.line(447,y+20,455,y+26,2,signal(out));r.line(447,y+32,455,y+26,2,signal(out));r.circle(479,y+26,17,out===null?'#e7d5af':out?'#c7e2c5':'#d8e2e0');center(r,bit(out),479,y+14,27,signal(out));text(r,'G'+(i+1),517,y+16,23,C.muted);
 });
 const note=s.lastCheck?(s.lastCheckCurrent?(s.lastCheck.charged?'LAST CHECK / '+s.lastCheck.matchCount+' OF 8 MATCH':'EMPTY SLOTS / LAST HINT FREE'):'LIVE SIGNALS / OLD CHECK AFTER EDIT'):'PORT LABELS = FIXED A/B/C OR EARLIER GATE';fit(r,note,30,476,580,21,C.muted);
 r.rect(651,84,285,410,C.paper);fit(r,'TABLE / OUTPUT G'+s.gates.length,670,99,247,23,C.muted);const xs=[684,718,752,816,884];['A','B','C','TGT','OUT'].forEach((t,i)=>center(r,t,xs[i],133,21,C.muted));
 s.truthRows.forEach((item,i)=>{const y=163+i*31;if(i===s.selectedRow)r.rect(670,y-2,247,29,'#e8d7aa');item.inputs.forEach((v,j)=>center(r,v,xs[j],y,24,C.ink));center(r,item.target,xs[3],y,24,C.gold);center(r,bit(item.output),xs[4],y,24,item.output===null?C.muted:s.matches[i]?C.green:C.bad);if(item.output!==null&&s.matches[i])r.line(904,y+17,913,y+17,2,C.green);});
 fit(r,'MATCH '+s.matchCount+' / 8',670,425,247,26,C.ink);fit(r,'CHECKS '+s.attemptsLeft+' / 3',670,461,247,24,C.ink);
 fit(r,'< > SLOT   UP/DOWN TABLE ROW',30,508,580,23,C.ink);fit(r,'A GATE / B CHECK',651,508,285,23,C.muted);
}
root.GameDef={id:'logic-workbench',title:'逻辑工坊',seed:config.defaultSeed,tagline:'组合布尔门，让完整八行真值表吻合',accent:'#b5cba1',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'电路',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['循环门类型','检查电路'],
 description:'A、B、C 是三个公开输入，右侧给出全部八行目标。固定门槽的来源只能是输入或更早的门，最后一门为输出。选择 AND、OR、XOR、NOT 组合成电路，按真实逻辑运算检查全部八行，不比较隐藏门答案。',
 controls:{move:'左右选门槽；上下选真值表行，查看信号',a:'空格、Z、确认 / 手机右上：循环切换门类型',b:'X、B / 手机右下：检查八行；完整扣一次，空槽免费'},
 tip:'AND 两口都1才输出1；OR 任一口1；XOR 两口不同为1。NOT 只反转第一口，第二口 OFF 禁用。A/B/C/G 标注固定接线，? 为未定信号。填完须按 B 检查八行；第三次正确仍获胜。',
 winTitle:'电路吻合，八行通过',loseTitle:'完整检查机会已用完',
 hud:s=>[{label:'所选门槽',value:'G'+(s.selectedSlot+1)+' · '+config.gateNames[s.gates[s.selectedSlot]]},{label:'输入行 A/B/C',value:s.truthRows[s.selectedRow].inputs.join(' / ')},{label:'匹配真值行',value:s.matchCount+' / 8'},{label:'检查机会',value:s.attemptsLeft+' / 3'}],
 result:s=>s.phase==='won'?'全部八行由实际布尔运算得到正确输出，用了 '+s.checks+' 次完整检查。':'三次完整检查已用完。切换输入行，沿编号端口核对每个门的信号，NOT 的第二口始终禁用。',render};
})(window);
