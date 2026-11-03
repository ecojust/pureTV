(function(root){
'use strict';
const C={bg:'#102b39',panel:'#183a47',ink:'#f1ecd9',muted:'#a9c3c7',wire:'#82adb3',gold:'#e5bc79',mint:'#8ad8cc',line:'#315663'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'workboard',x:0,y:0,w:512,h:256,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,512,256,[[0,'#204a57'],[1,'#153744']]);c.fillRect(0,0,w,h);for(let y=15;y<h;y+=22)for(let x=15;x<w;x+=22){c.fillStyle='#a2c8c718';c.beginPath();c.arc(x,y,1,0,Math.PI*2);c.fill();}c.strokeStyle='#8fc3c844';c.lineWidth=2;c.strokeRect(3,3,w-6,h-6);for(const x of [12,w-12])for(const y of [12,h-12]){art.ellipse(c,x,y,4,4,'#a6c8c8');c.strokeStyle='#31535e';c.beginPath();c.moveTo(x-2,y-2);c.lineTo(x+2,y+2);c.stroke();}}},
 {name:'terminal',x:512,y:0,w:128,h:128,paint(c,w,h,art){art.ellipse(c,65,69,52,52,'#071d2b66');art.ellipse(c,64,63,50,50,art.radial(c,64,63,50,[[0,'#edf4dc'],[.72,'#accbc8'],[1,'#527d88']],45,41));art.ellipse(c,64,63,35,35,'#244a59');art.ellipse(c,64,63,24,24,'#143341');}},
 {name:'comparatorBadge',x:640,y:0,w:128,h:192,paint(c,w,h,art){c.strokeStyle='#dfb87b';c.lineWidth=11;c.beginPath();c.moveTo(64,35);c.lineTo(64,157);c.stroke();for(const y of [35,157]){art.ellipse(c,64,y,19,19,'#f1d9a3');art.ellipse(c,64,y,9,9,'#315865');}c.strokeStyle='#e9cf96';c.lineWidth=5;c.beginPath();c.moveTo(48,79);c.lineTo(64,63);c.lineTo(80,79);c.moveTo(48,113);c.lineTo(64,129);c.lineTo(80,113);c.stroke();}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function brackets(r,x,y,color){for(const [dx,dy]of [[-1,-1],[-1,1],[1,-1],[1,1]]){r.line(x+dx*17,y+dy*17,x+dx*8,y+dy*17,3,color);r.line(x+dx*17,y+dy*17,x+dx*17,y+dy*8,3,color);}}
function point(s,layer,wire){return {x:s.layerCount===3?190+layer*160:140+layer*100,y:142+wire*264/(s.wires-1)};}
function pairOffset(layer,index){return layer.length===1?0:index===0?-12:12;}
function port(s,layer,wire){const p=point(s,layer,wire),pairs=s.network[layer],i=pairs.findIndex(v=>v.a===wire||v.b===wire);return {...p,x:p.x+(i<0?0:pairOffset(pairs,i)),occupied:i>=0};}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,'#244c58');text(r,'SORTING WIRES',42,26,28,C.ink);text(r,config.layouts[s.level].name,610,29,25,C.mint);
 r.sprite('workboard',324,267,600,374,0,'#ffffff');
 const active=point(s,s.selectedLayer,0);r.rect(active.x-36,117,72,311,'#d6e4bf0d');
 text(r,'IN',65,87,22,C.muted);text(r,'OUT',574,87,22,C.muted);
 for(let layer=0;layer<s.layerCount;layer++)center(r,'L'+(layer+1),point(s,layer,0).x,87,26,layer===s.selectedLayer?C.gold:C.muted);
 const witness=s.lastCheckCurrent&&s.lastCheck?s.lastCheck.firstFailure:null;
 for(let wire=0;wire<s.wires;wire++){
  const y=point(s,0,wire).y;r.line(82,y,600,y,3,C.wire);center(r,wire+1,45,y-13,25,C.muted);
  r.sprite('terminal',82,y,34,34,0,'#ffffff');r.sprite('terminal',600,y,34,34,0,'#ffffff');
  if(witness){center(r,witness.input[wire],82,y-13,24,C.ink);center(r,witness.output[wire],600,y-13,24,C.ink);}
  for(let layer=0;layer<s.layerCount;layer++){const p=point(s,layer,wire);r.circle(p.x,p.y,3,'#c3d8cb66');}
 }
 for(let layer=0;layer<s.layerCount;layer++)s.network[layer].forEach((pair,index)=>{
  const a=point(s,layer,pair.a),b=point(s,layer,pair.b),x=a.x+pairOffset(s.network[layer],index),color=index===0?C.gold:C.mint;
  // A dark sleeve at intermediate crossings distinguishes a pass-through from endpoint dots.
  r.line(x,a.y,x,b.y,10,'#153440');r.line(x,a.y,x,b.y,4,color);
  for(const y of [a.y,b.y]){r.circle(x,y,11,'#102b39');r.circle(x,y,8,color);r.circle(x,y,3,'#274c56');}
 });
 if(s.marked){
  const mark=point(s,s.marked.layer,s.marked.wire),to=point(s,s.selectedLayer,s.selectedWire),target=port(s,s.selectedLayer,s.selectedWire);
  if(s.marked.layer===s.selectedLayer&&s.marked.wire!==s.selectedWire&&!target.occupied){const top=Math.min(mark.y,to.y),bottom=Math.max(mark.y,to.y);for(let y=top+15;y<bottom-10;y+=15)r.line(mark.x,y,mark.x,Math.min(y+8,bottom-10),3,C.gold);}
  r.circle(mark.x,mark.y,12,C.gold);r.circle(mark.x,mark.y,7,'#173845');
 }
 const selected=port(s,s.selectedLayer,s.selectedWire);brackets(r,selected.x,selected.y,'#fff6d7');
 r.sprite('comparatorBadge',53,487,37,56,0,'#ffffff');text(r,'MIN UP / MAX DOWN',86,469,23,C.gold);text(r,'DOTS ARE THE TWO ENDPOINTS',86,503,20,C.muted);
 r.rect(648,82,288,440,C.panel);text(r,'PARTS LEFT',668,98,24,C.muted);text(r,s.inventoryLeft+' / '+s.inventoryLimit,668,132,42,C.ink);
 text(r,'CHECKS LEFT',668,189,23,C.muted);for(let i=0;i<3;i++){r.circle(844+i*28,201,9,i<s.attemptsLeft?C.gold:'#42606b');}
 r.rect(668,229,248,2,C.line);text(r,'CURSOR  L'+(s.selectedLayer+1)+' W'+(s.selectedWire+1),668,246,24,C.ink);
 text(r,s.marked?'START   L'+(s.marked.layer+1)+' W'+(s.marked.wire+1):'A MARK / REMOVE',668,280,23,s.marked?C.gold:C.muted);
 r.rect(668,316,248,2,C.line);text(r,s.lastCheck?(s.lastCheckCurrent?'LAST TEST':'OLD TEST / EDITED'):'B CHECK ALL INPUTS',668,334,s.lastCheckCurrent?24:22,C.mint);
 if(s.lastCheck){
  text(r,s.lastCheck.sortedCount+' / '+s.lastCheck.total+' SORTED',668,370,27,s.lastCheck.passed?C.mint:C.gold);
  const fail=s.lastCheck.firstFailure;if(fail){text(r,'IN   '+fail.input.join(''),668,414,27,C.ink);text(r,'OUT  '+fail.output.join(''),668,455,27,C.ink);}else{center(r,'ALL INPUTS SORT',792,421,25,C.mint);center(r,'0 ... 0  1 ... 1',792,462,22,C.muted);}
 }else{text(r,(2**s.wires)+' BINARY CASES',668,377,25,C.ink);text(r,'B = CHECK',668,420,24,C.gold);text(r,'B = CANCEL MARK',668,460,22,C.muted);}
}
root.GameDef={id:'sorting-wires',title:'比较器工坊',seed:config.defaultSeed,tagline:'连好比较器，让每一种输入都排好序',accent:'#e8c487',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'网络',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['标记 / 连接 / 移除','检查 / 取消起点'],
 description:'搭建三种规模的排序网络。比较器把两条线中的小值送到上端，大值送到下端；每层同一条线最多连接一次。A 标记两端安装，A 点已有端点可移除并退回库存。B 手动检查全部二进制输入，每局三次机会。',
 controls:{move:'左右选择层，上下选择线路',a:'空格、Z、确认 / 手机右上：标记、连接或移除',b:'X、B / 手机右下：有起点时取消，否则检查网络'},
 tip:'数字线号从上到下递增；最终应从上到下先 0 后 1。白角框是光标，金圈是已标记起点。只连接同层的空闲端点，长按不连动。网络编辑后显示的旧检查样例会明确标记。',
 winTitle:'全部输入，排序完成',loseTitle:'检查机会已用完',
 hud:s=>[{label:'剩余比较器',value:s.inventoryLeft+' / '+s.inventoryLimit},{label:'检查机会',value:s.attemptsLeft+' / 3',tone:s.attemptsLeft?'good':'warn'},{label:'输入组数',value:2**s.wires},{label:'当前位置',value:'第'+(s.selectedLayer+1)+'层 / 第'+(s.selectedWire+1)+'线'}],
 result:s=>s.phase==='won'?'全部 '+s.lastCheck.total+' 组二进制输入均已排序，共用 '+s.comparatorsUsed+' 个比较器。':'三次检查已用完，仍有输入未排好。检查失败样例，重新安排各层比较器。',render};
})(window);
