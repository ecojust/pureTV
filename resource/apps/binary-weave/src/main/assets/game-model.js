/* Binary Weave: public-given Takuzu; validation uses visible rows and columns only. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:790,mistakeLimit:3,maxElapsed:86400,maxCounter:2147483647,layouts:[
    {id:'first-threads',name:'FIRST THREADS',nameZh:'初织经纬',width:4,height:4,givens:[{cell:0,value:0},{cell:2,value:0},{cell:6,value:1},{cell:7,value:0},{cell:12,value:1},{cell:14,value:1}]},
    {id:'cross-stitch',name:'CROSS STITCH',nameZh:'交织纹样',width:6,height:6,givens:[{cell:0,value:1},{cell:1,value:0},{cell:2,value:1},{cell:8,value:0},{cell:11,value:1},{cell:15,value:1},{cell:17,value:1},{cell:18,value:1},{cell:20,value:1},{cell:22,value:0},{cell:26,value:1},{cell:29,value:1},{cell:35,value:0}]},
    {id:'grand-weave',name:'GRAND WEAVE',nameZh:'八方锦织',width:8,height:8,givens:[{cell:0,value:1},{cell:3,value:1},{cell:6,value:0},{cell:7,value:1},{cell:17,value:0},{cell:18,value:1},{cell:19,value:0},{cell:22,value:1},{cell:25,value:0},{cell:26,value:0},{cell:29,value:0},{cell:31,value:1},{cell:33,value:1},{cell:34,value:1},{cell:36,value:1},{cell:37,value:0},{cell:38,value:1},{cell:39,value:0},{cell:40,value:1},{cell:48,value:0},{cell:50,value:0},{cell:53,value:0},{cell:55,value:1},{cell:58,value:0},{cell:60,value:0},{cell:62,value:1}]}
  ]});
  function lineCells(s,index,column){return Array.from({length:column?s.height:s.width},(_,k)=>column?k*s.width+index:index*s.width+k);}
  function statuses(s,column){const count=column?s.width:s.height,patterns=[],out=[];for(let index=0;index<count;index++){
    const values=lineCells(s,index,column).map(p=>s.cells[p]),zeros=values.filter(v=>v===0).length,ones=values.filter(v=>v===1).length,triples=[];
    for(let k=0;k+2<values.length;k++)if(values[k]!==-1&&values[k]===values[k+1]&&values[k]===values[k+2])triples.push(k);
    const filled=zeros+ones;patterns.push(values.join(','));out.push({index,filled,zeros,ones,complete:filled===values.length,balanced:zeros===values.length/2&&ones===values.length/2,triples,duplicateWith:[],matched:false});
  }for(let a=0;a<out.length;a++)if(out[a].complete)for(let b=a+1;b<out.length;b++)if(out[b].complete&&patterns[a]===patterns[b]){out[a].duplicateWith.push(b);out[b].duplicateWith.push(a);}
    for(const line of out){line.duplicateWith.sort((a,b)=>a-b);line.matched=line.complete&&line.balanced&&!line.triples.length&&!line.duplicateWith.length;}return out;
  }
  function refresh(s){s.zeros=s.cells.filter(v=>v===0).length;s.ones=s.cells.filter(v=>v===1).length;s.filledCount=s.zeros+s.ones;s.rowStatus=statuses(s,false);s.columnStatus=statuses(s,true);}
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level],fixedValues={},cells=Array(l.width*l.height).fill(-1);for(const g of l.givens){fixedValues[g.cell]=g.value;cells[g.cell]=g.value;}
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,width:l.width,height:l.height,givens:copy(l.givens),fixedValues,cells,cursor:0,editableCount:cells.length-l.givens.length,filledCount:0,zeros:0,ones:0,rowStatus:[],columnStatus:[],edits:0,checks:0,mistakes:0,mistakeLimit:config.mistakeLimit,lastCheck:null,
      elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
      message:'A 循环空格→0→1；锁标数字固定。每行列0/1各半、不能三连、同向行列不重复；填满后 B 检查。'};refresh(s);return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
    for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
    const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
      cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function blocked(s,reason){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=reason==='fixed'?'带锁的数字是公开线索，不能修改；请选择未锁定格。':reason==='incomplete'?'还有空格；完整填入0/1后再检查，本次不扣错误次数。':'已到棋盘边缘，不能绕到另一侧。';}
  function edit(s){if(Object.prototype.hasOwnProperty.call(s.fixedValues,s.cursor))return blocked(s,'fixed');const from=s.cells[s.cursor];s.cells[s.cursor]=from===-1?0:from===0?1:-1;s.edits=Math.min(config.maxCounter,s.edits+1);s.lastCheck=null;refresh(s);event(s,'edit',{cell:s.cursor,from,to:s.cells[s.cursor]});s.message=s.filledCount===s.cells.length?'已填满；按 B 检查数量、三连和行列重复。':'每行每列0和1数量相同；任何三个连续格不能全相同。';}
  function errors(s){const out=[];for(const g of s.givens)if(s.cells[g.cell]!==g.value)out.push({type:'fixed-clue',cell:g.cell,cells:[g.cell],expected:g.value,actual:s.cells[g.cell]});
    for(const column of [false,true]){const family=column?s.columnStatus:s.rowStatus,label=column?'column':'row',plural=column?'columns':'rows';for(const line of family){const cells=lineCells(s,line.index,column);
      if(!line.balanced)out.push({type:label+'-balance',[label]:line.index,cells,zeros:line.zeros,ones:line.ones,expected:cells.length/2});
      for(const start of line.triples)out.push({type:label+'-triple',[label]:line.index,start,cells:cells.slice(start,start+3),value:s.cells[cells[start]]});
    }for(const line of family)for(const other of line.duplicateWith)if(other>line.index)out.push({type:'duplicate-'+plural,[plural]:[line.index,other],cells:lineCells(s,line.index,column).concat(lineCells(s,other,column))});}
    return out;
  }
  function settle(s,reason){s.phase=reason==='solved'?'won':'lost';s.reason=reason;s.score=s.phase==='won'?100:0;event(s,s.phase==='won'?'win':'collision',{reason});s.message=reason==='solved'?'0/1各半、无三连、所有行列互异，织格完成。':'三次完整检查仍有数量、三连或重复错误，本局结束。';s.terminalReceipt=copy({cause:reason,level:s.level,call:s.calls,elapsed:s.elapsed,cells:s.cells,edits:s.edits,checks:s.checks,mistakes:s.mistakes,lastCheck:s.lastCheck,score:s.score,phase:s.phase,reason:s.reason});}
  function check(s){if(s.filledCount!==s.cells.length)return blocked(s,'incomplete');s.checks=Math.min(config.maxCounter,s.checks+1);const found=errors(s);if(found.length)s.mistakes++;s.lastCheck={call:s.calls,complete:true,valid:found.length===0,errors:copy(found),mistakesAfter:s.mistakes};if(!found.length)return settle(s,'solved');if(s.mistakes>=s.mistakeLimit)return settle(s,'mistakes');event(s,'check',{errors:copy(found),mistakes:s.mistakes});s.message='完整图中发现 '+found.length+' 处规则错误，本次记1次；可继续编辑再检查。';}
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
