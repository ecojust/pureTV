/* Pixel Clues: compare public row and column runs, never a hidden picture. */
(function(root,factory){'use strict';const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.PureModel=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==='object'){Object.keys(x).forEach(k=>freeze(x[k]));Object.freeze(x);}return x;}
  const config=freeze({defaultSeed:758,maxCounter:2147483647,layouts:[
    {id:'arrowhead',name:'ARROWHEAD',nameZh:'箭羽',size:5,rowClues:[[1],[3],[5],[1],[1]],colClues:[[1],[2],[5],[2],[1]],timeLimit:60},
    {id:'twin-wings',name:'TWIN WINGS',nameZh:'双翼',size:6,rowClues:[[2,2],[2,2],[6],[4],[2],[2]],colClues:[[3],[4],[4],[4],[4],[3]],timeLimit:90},
    {id:'gatehouse',name:'GATEHOUSE',nameZh:'门楼',size:7,rowClues:[[3],[5],[2,2],[7],[2,1,2],[2,1,2],[7]],colClues:[[5],[6],[2,1,1],[2,4],[2,1,1],[6],[5]],timeLimit:120}
  ]});
  function runs(values){const result=[];let count=0;for(const v of values){if(v===1)count++;else if(count){result.push(count);count=0;}}if(count)result.push(count);return result;}
  function equal(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
  function derive(s){const l=config.layouts[s.level],n=l.size;
    s.rowRuns=Array.from({length:n},(_,r)=>runs(s.cells.slice(r*n,(r+1)*n)));
    s.colRuns=Array.from({length:n},(_,c)=>runs(Array.from({length:n},(_,r)=>s.cells[r*n+c])));
    s.rowMatched=s.rowRuns.map((r,i)=>equal(r,l.rowClues[i]));s.colMatched=s.colRuns.map((r,i)=>equal(r,l.colClues[i]));
    s.filledCount=s.cells.filter(v=>v===1).length;
  }
  function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<config.layouts.length?level:0;const l=config.layouts[level];
    const s={schema:1,seed,level,phase:'playing',reason:'',score:0,size:l.size,rowClues:copy(l.rowClues),colClues:copy(l.colClues),timeLimit:l.timeLimit,
      cells:Array(l.size*l.size).fill(0),cursor:0,rowRuns:[],colRuns:[],rowMatched:[],colMatched:[],filledCount:0,elapsed:0,remaining:l.timeLimit,
      calls:0,marks:0,cursorMoves:0,blockedActions:0,lastMark:null,inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,message:'按行列数字填出连续色块；A 涂格，B 标叉，方向移动光标。'};
    derive(s);return s;
  }
  function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
    try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
      for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}
      const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
      return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,
        cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
    }catch(_){return neutral();}}
  function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);if(x<=.5&&y<=.5)return 'none';if(y>=x)return i.y>0?'down':'up';return i.x>0?'right':'left';}
  function inc(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
  function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
  function settle(s,cause,detail){s.phase=cause==='success'?'won':'lost';s.reason=cause==='success'?'':'timeout';s.score=cause==='success'?100:0;
    event(s,cause==='success'?'win':'collision',cause==='success'?detail:{reason:'timeout'});
    s.message=cause==='success'?'所有行列数字均已吻合，像素图完成。':'有效作画时间已结束，请重试线索图。';
    s.terminalReceipt=copy({cause,level:s.level,call:s.calls,elapsed:s.elapsed,remaining:s.remaining,cells:s.cells,cursor:s.cursor,rowRuns:s.rowRuns,colRuns:s.colRuns,
      filledCount:s.filledCount,marks:s.marks,score:s.score,phase:s.phase,reason:s.reason});}
  function mark(s,key){const index=s.cursor,from=s.cells[index],to=key==='a'?(from===1?0:1):(from===2?0:2);
    s.cells[index]=to;inc(s,'marks');s.lastMark={index,from,to,call:s.calls};derive(s);const detail={index,from,to};
    if(s.rowMatched.every(Boolean)&&s.colMatched.every(Boolean))return settle(s,'success',detail);
    event(s,'mark',detail);s.message=to===1?'已涂格；检查连续段是否与行列线索相同。':to===2?'已标叉；叉号是留白笔记，不计入连续段。':'已清空该格。';}
  function move(s,dir){const n=config.layouts[s.level].size,x=s.cursor%n,y=Math.floor(s.cursor/n),dx=dir==='right'?1:dir==='left'?-1:0,dy=dir==='down'?1:dir==='up'?-1:0;
    if(x+dx<0||x+dx>=n||y+dy<0||y+dy>=n){inc(s,'blockedActions');event(s,'blocked',{reason:'edge'});s.message='已到纸面边缘，光标不会跳到另一行。';return;}
    const from=s.cursor;s.cursor+=dx+dy*n;inc(s,'cursorMoves');event(s,'move',{from,to:s.cursor});s.message='第 '+(Math.floor(s.cursor/n)+1)+' 行，第 '+(s.cursor%n+1)+' 列。';}
  function step(s,dt,raw){
    if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const i=normalized(raw);if(i.paused)return s;
    const dir=direction(i),old=s.lastHeld,armed=s.inputArmed,disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
    s.events=[];s.lastCommand='none';inc(s,'calls');const limit=config.layouts[s.level].timeLimit,endpoint=s.elapsed+dt,timely=endpoint<=limit;
    s.elapsed=Math.min(limit,endpoint);s.remaining=limit-s.elapsed;if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
    if(timely&&!disarm&&!i.cancelled&&armed){const cmd=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';s.lastCommand=cmd;
      if(cmd==='a'||cmd==='b')mark(s,cmd);else if(cmd!=='none')move(s,cmd);}
    if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};
    if(s.phase==='playing'&&s.elapsed>=limit)settle(s,'timeout');return s;
  }
  return Object.freeze({create,step,config});
});
