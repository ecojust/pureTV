/* Island Ink: public Nurikabe clues; accepts any coloring satisfying the constraints. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:784,mistakeLimit:3,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'coastal-notes',name:'COASTAL NOTES',nameZh:'海岸笔记',width:4,height:4,seeds:[{cell:2,size:1},{cell:5,size:1},{cell:13,size:4}],givenSea:[]},
    {id:'reed-islands',name:'REED ISLANDS',nameZh:'芦洲分界',width:5,height:5,seeds:[{cell:0,size:1},{cell:7,size:4},{cell:14,size:4},{cell:17,size:1},{cell:20,size:3}],givenSea:[]},
    {id:'open-water',name:'OPEN WATER',nameZh:'连海群岛',width:6,height:6,seeds:[{cell:1,size:1},{cell:9,size:2},{cell:12,size:2},{cell:20,size:4},{cell:31,size:1},{cell:33,size:3}],givenSea:[]}
  ]});
  function refresh(s){s.filledCount=s.cells.filter(v=>v===1||v===2).length;s.seaCount=s.cells.filter(v=>v===1).length;s.islandCellCount=s.cells.filter(v=>v===2).length;}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level],fixedValues={};l.seeds.forEach(clue=>fixedValues[clue.cell]=2);l.givenSea.forEach(p=>fixedValues[p]=1);const cells=Array.from({length:l.width*l.height},(_,p)=>fixedValues[p]||0);
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,seeds:copy(l.seeds),givenSea:l.givenSea.slice(),fixedValues,cells,cursor:cells.findIndex((v,p)=>!Object.prototype.hasOwnProperty.call(fixedValues,p)),filledCount:0,seaCount:0,islandCellCount:0,targetIslandCells:l.seeds.reduce((sum,clue)=>sum+clue.size,0),editableCount:cells.length-Object.keys(fixedValues).length,edits:0,checks:0,mistakes:0,mistakeLimit:config.mistakeLimit,lastCheck:null,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'A 循环未定、海、岛；每岛一个数字且面积相符，海须正交连通且不能出现2×2全海。填满后 B 检查。'};if(s.cursor<0)s.cursor=0;refresh(s);return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=reason==='fixed'?'这是公开固定格，不能修改。':reason==='incomplete'?'还有未定格；全部决定后再检查，本次不扣错误次数。':'已到棋盘边缘，不能绕回另一边。';}
  function neighbors(s,p){const x=p%s.width,y=Math.floor(p/s.width),out=[];if(x>0)out.push(p-1);if(x<s.width-1)out.push(p+1);if(y>0)out.push(p-s.width);if(y<s.height-1)out.push(p+s.width);return out;}
  function components(s,value){const seen=new Set(),out=[];for(let p=0;p<s.cells.length;p++)if(s.cells[p]===value&&!seen.has(p)){const todo=[p],component=[];seen.add(p);for(let k=0;k<todo.length;k++){const q=todo[k];component.push(q);for(const next of neighbors(s,q))if(s.cells[next]===value&&!seen.has(next)){seen.add(next);todo.push(next);}}out.push(component.sort((a,b)=>a-b));}return out;}
  function errors(s){const out=[];for(const key of Object.keys(s.fixedValues).map(Number).sort((a,b)=>a-b))if(s.cells[key]!==s.fixedValues[key])out.push({type:'fixed-cell',cells:[key],cell:key,expected:s.fixedValues[key],actual:s.cells[key]});
    for(const cells of components(s,2)){const seeds=s.seeds.filter(clue=>cells.includes(clue.cell));if(!seeds.length)out.push({type:'unseeded-island',cells:cells.slice()});else if(seeds.length>1)out.push({type:'merged-islands',cells:cells.slice(),seeds:seeds.map(clue=>clue.cell).sort((a,b)=>a-b)});else if(cells.length!==seeds[0].size)out.push({type:'island-size',cells:cells.slice(),seed:seeds[0].cell,expected:seeds[0].size,actual:cells.length});}
    const sea=components(s,1);if(!sea.length)out.push({type:'missing-sea',cells:[]});else if(sea.length>1)out.push({type:'split-sea',cells:sea.flat().sort((a,b)=>a-b),components:sea.length});
    for(let y=0;y<s.height-1;y++)for(let x=0;x<s.width-1;x++){const p=y*s.width+x,cells=[p,p+1,p+s.width,p+s.width+1];if(cells.every(q=>s.cells[q]===1))out.push({type:'sea-square',cells});}return out;
  }
  function edit(s){const p=s.cursor;if(Object.prototype.hasOwnProperty.call(s.fixedValues,p))return blocked(s,'fixed');const from=s.cells[p];s.cells[p]=(from+1)%3;s.edits=Math.min(config.maxCounter,s.edits+1);s.lastCheck=null;refresh(s);event(s,'edit',{cell:p,from,to:s.cells[p]});s.message=s.filledCount===s.cells.length?'全部格已决定，按 B 检查岛屿面积与海水规则。':'已修改；未定→海→岛→未定，编辑不扣错误次数。';}
  function settle(s,reason){s.phase=reason==='solved'?'won':'lost';s.reason=reason;s.score=s.phase==='won'?100:0;event(s,s.phase==='won'?'win':'collision',{reason});s.message=reason==='solved'?'数字岛面积正确，海水连通且没有2×2全海，墨图完成。':'三次完整提交仍有规则错误，本局结束。';s.terminalReceipt=copy({cause:reason,level:s.level,call:s.calls,elapsed:s.elapsed,cells:s.cells,edits:s.edits,checks:s.checks,mistakes:s.mistakes,lastCheck:s.lastCheck,score:s.score,phase:s.phase,reason:s.reason});}
  function check(s){if(s.filledCount!==s.cells.length)return blocked(s,'incomplete');s.checks=Math.min(config.maxCounter,s.checks+1);const found=errors(s);if(found.length)s.mistakes++;s.lastCheck={call:s.calls,complete:true,valid:found.length===0,errors:copy(found),mistakesAfter:s.mistakes};if(!found.length)return settle(s,'solved');if(s.mistakes>=s.mistakeLimit)return settle(s,'mistakes');event(s,'check',{errors:copy(found),mistakes:s.mistakes});s.message='本次发现 '+found.length+' 处岛海规则错误，记1次错误；继续修改可清除旧标记。';}
  function navigate(s,dir){const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;if(x+dx<0||x+dx>=s.width||y+dy<0||y+dy>=s.height)return blocked(s,'edge');const from=s.cursor;s.cursor+=dx+dy*s.width;event(s,'cursor',{from,to:s.cursor});}
  function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);refresh(s);
    if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;if(cmd==='b')check(s);else if(cmd==='a')edit(s);else if(cmd!=='none')navigate(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
  }
  return Object.freeze({create,step,config});
});
