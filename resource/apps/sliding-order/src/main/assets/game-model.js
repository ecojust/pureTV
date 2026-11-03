/* Sliding Order: arrows move the empty cell; undo never refunds used slides. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":754,"size":3,"goal":[1,2,3,4,5,6,7,8,0],"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"morning-grid","name":"MORNING GRID","nameZh":"晨光棋格","board":[2,3,5,1,0,4,7,8,6],"moveLimit":14},{"id":"afternoon-grid","name":"AFTERNOON GRID","nameZh":"午后排布","board":[2,5,4,1,3,6,7,8,0],"moveLimit":18},{"id":"evening-grid","name":"EVENING GRID","nameZh":"暮色归序","board":[0,6,8,1,2,5,4,3,7],"moveLimit":24}]});
function matched(board){return board.reduce((n,v,i)=>n+(v!==0&&v===config.goal[i]?1:0),0);}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
 level=Number.isInteger(level)&&level>=0&&level<3?level:0;const layout=config.layouts[level],board=layout.board.slice();
 return {schema:1,seed,level,phase:'playing',reason:'',score:0,board,blank:board.indexOf(0),movesUsed:0,moveLimit:layout.moveLimit,slides:0,undos:0,matched:matched(board),history:[],lastSlide:null,terminalReceipt:null,
  elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'方向键移动空格；把数字按 1–8 排好，A 撤销但不退已用步数。'};
}
function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
function finish(s,won){
 s.phase=won?'won':'lost';s.reason=won?'':'moves';s.score=won?100:0;
 s.message=won?'八块数字瓷砖已归位，空格停在右下角。':'本关滑动额度已用完，请重新安排路径。';
 event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,board:s.board,blank:s.blank,movesUsed:s.movesUsed,moveLimit:s.moveLimit,undos:s.undos,historyDepth:s.history.length});
}
function command(s,key){
 if(key==='a'){
  if(!s.history.length)return blocked(s,'empty-history','没有可以撤销的滑动。');
  const old=s.history.pop();s.board=old.board.slice();s.blank=old.blank;s.undos++;s.lastSlide=null;s.matched=matched(s.board);event(s,'undo',{blank:s.blank,movesUsed:s.movesUsed});s.message='已撤销一步；已用 '+s.movesUsed+' 步不退还。';return;
 }
 if(key==='none')return;
 const x=s.blank%3,y=Math.floor(s.blank/3),nx=x+(key==='right'?1:key==='left'?-1:0),ny=y+(key==='down'?1:key==='up'?-1:0);
 if(nx<0||nx>2||ny<0||ny>2)return blocked(s,'boundary','空格已在该方向的边缘，不消耗步数。');
 const from=s.blank,to=ny*3+nx,tile=s.board[to];s.history.push({board:s.board.slice(),blank:from});s.board[from]=tile;s.board[to]=0;s.blank=to;s.movesUsed++;s.slides++;s.matched=matched(s.board);s.lastSlide={from,to,tile};
 if(s.board.every((v,i)=>v===config.goal[i]))return finish(s,true);
 if(s.movesUsed>=s.moveLimit)return finish(s,false);
 event(s,'slide',{from,to,tile,movesUsed:s.movesUsed});s.message='空格已移动；剩余 '+(s.moveLimit-s.movesUsed)+' 步，已归位 '+s.matched+'/8。';
}
function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
 try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
  for(const k of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,k);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[k]=d.value;}
  const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
  return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
 }catch(_){return neutral();}
}
function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);return x<=.5&&y<=.5?'none':y>=x?(i.y>0?'down':'up'):(i.x>0?'right':'left');}
function step(s,dt,raw){
 if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
 const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
 const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
 s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 if(!disarm&&!i.cancelled&&armed){s.lastCommand=i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';command(s,s.lastCommand);}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
