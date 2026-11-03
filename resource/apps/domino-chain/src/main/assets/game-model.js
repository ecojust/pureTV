/* Domino Chain: fully open double-six endgames with a deterministic opponent. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const copy=v=>JSON.parse(JSON.stringify(v));function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
 const tiles=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)tiles.push({id:tiles.length,a,b});
 const config=freeze({defaultSeed:777,maxElapsed:86400,maxCounter:2147483647,tiles,
  aiPolicy:'Highest pip-sum legal tile, then smallest tile ID, then left before right; draw in public pile order until legal or empty.',layouts:[{"id": "ivory-opening", "name": "IVORY OPENING", "nameZh": "象牙开局", "playerHand": [12, 14, 20, 22, 26], "aiHand": [6, 7, 8, 15, 24], "drawPile": [5, 4, 3], "start": 18}, {"id": "amber-turn", "name": "AMBER TURN", "nameZh": "琥珀回手", "playerHand": [1, 12, 14, 17, 22, 26], "aiHand": [0, 3, 10, 18, 21, 27], "drawPile": [6, 16, 15, 13], "start": 5}, {"id": "long-table", "name": "LONG TABLE", "nameZh": "长桌残局", "playerHand": [0, 3, 4, 19, 21, 24, 25], "aiHand": [7, 8, 12, 13, 15, 20, 22], "drawPile": [14, 10, 2, 26, 1], "start": 5}]});
 function pips(hand){return hand.reduce((n,id)=>n+tiles[id].a+tiles[id].b,0);}
 function totals(s){s.playerPips=pips(s.playerHand);s.aiPips=pips(s.aiHand);}
 function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level],t=tiles[l.start];
  return{schema:1,seed,level,phase:'playing',reason:'',score:0,playerHand:l.playerHand.slice(),aiHand:l.aiHand.slice(),drawPile:l.drawPile.slice(),chain:[{id:t.id,left:t.a,right:t.b,owner:0}],cursor:0,end:'right',passStreak:0,
   playerPips:pips(l.playerHand),aiPips:pips(l.aiHand),playerPlays:0,aiPlays:0,playerDraws:0,aiDraws:0,playerPasses:0,aiPasses:0,actions:0,lastPlayer:null,lastAI:null,aiTrail:[],receipts:[],
   elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,x:0,y:0,direction:'none'},lastCommand:'none',events:[],terminalReceipt:null,
   message:'左右选牌，上选左端、下选右端，A 接牌；两端都无牌可接时，B 摸牌或跳过。'};
 }
 function normalized(raw){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});try{if(!raw||typeof raw!=='object'||Array.isArray(raw))return neutral();const v=Object.create(null);for(const key of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(raw,key);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[key]=d.value;}const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return{x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};}catch(_){return neutral();}}
 function event(s,type,fields){s.events=[Object.assign({type,call:s.calls},fields)];}
 function blocked(s,reason,message){s.blockedActions=Math.min(config.maxCounter,s.blockedActions+1);event(s,'blocked',{reason});s.message=message;}
 function endpoint(s,end){return end==='left'?s.chain[0].left:s.chain[s.chain.length-1].right;}
 function matches(s,id,end){const t=tiles[id],value=endpoint(s,end);return!!t&&(t.a===value||t.b===value);}
 function legal(s,hand){const moves=[];for(const id of hand)for(const end of ['left','right'])if(matches(s,id,end))moves.push({id,end});return moves;}
 function play(s,id,end,who){const hand=who===1?s.playerHand:s.aiHand,t=tiles[id],value=endpoint(s,end),other=t.a===value?t.b:t.a,item={id,left:end==='left'?other:value,right:end==='left'?value:other,owner:who};
  hand.splice(hand.indexOf(id),1);if(end==='left')s.chain.unshift(item);else s.chain.push(item);s.passStreak=0;if(who===1){s.playerPlays++;s.cursor=Math.min(s.cursor,Math.max(0,s.playerHand.length-1));}else s.aiPlays++;totals(s);return{type:'play',tile:id,end,oriented:{left:item.left,right:item.right}};
 }
 function draw(s,who){const id=s.drawPile.shift();if(who===1){s.playerHand.push(id);s.playerDraws++;s.cursor=s.playerHand.length-1;}else{s.aiHand.push(id);s.aiDraws++;}s.passStreak=0;totals(s);return{type:'draw',tile:id};}
 function pass(s,who){s.passStreak++;if(who===1)s.playerPasses++;else s.aiPasses++;return{type:'pass'};}
 function blockedCause(s){if(s.passStreak<2||s.drawPile.length)return null;return s.playerPips<s.aiPips?'blocked-win':s.playerPips>s.aiPips?'blocked-loss':'blocked-tie';}
 function aiAction(s,move){s.lastAI=copy(move);s.aiTrail.push(copy(move));}
 function respond(s){const bound=s.drawPile.length+1;for(let i=0;i<bound;i++){const moves=legal(s,s.aiHand);if(moves.length){moves.sort((a,b)=>(tiles[b.id].a+tiles[b.id].b)-(tiles[a.id].a+tiles[a.id].b)||a.id-b.id||(a.end==='left'?-1:1));const m=moves[0];aiAction(s,play(s,m.id,m.end,2));return s.aiHand.length?null:'ai-empty';}if(s.drawPile.length){aiAction(s,draw(s,2));continue;}aiAction(s,pass(s,2));return blockedCause(s);}return null;}
 function finishAction(s,cause){if(cause){const won=cause==='player-empty'||cause==='blocked-win';s.phase=won?'won':'lost';s.reason=won?'':cause;s.score=won?100:0;}
  s.receipts.push(copy({action:s.actions,player:s.lastPlayer,ai:s.aiTrail,left:endpoint(s,'left'),right:endpoint(s,'right'),playerCount:s.playerHand.length,aiCount:s.aiHand.length,playerPips:s.playerPips,aiPips:s.aiPips,passStreak:s.passStreak,outcome:s.phase,reason:s.reason}));
  event(s,cause?(s.phase==='won'?'win':'collision'):'turn',Object.assign({player:copy(s.lastPlayer),ai:copy(s.aiTrail)},cause?{cause}:{}));
  if(cause){s.message=cause==='player-empty'?'你的手牌已出完，获胜。':cause==='ai-empty'?'对手先出完手牌，本局结束。':cause==='blocked-win'?'双方无牌可接，你的剩余点数更少，获胜。':cause==='blocked-tie'?'双方无牌可接，剩余点数相同；和局未完成胜利目标。':'双方无牌可接，对手剩余点数更少，本局结束。';s.terminalReceipt=copy({cause,call:s.calls,elapsed:s.elapsed,level:s.level,playerHand:s.playerHand,aiHand:s.aiHand,drawPile:s.drawPile,chain:s.chain,playerPips:s.playerPips,aiPips:s.aiPips,passStreak:s.passStreak,actions:s.actions,playerPlays:s.playerPlays,aiPlays:s.aiPlays,score:s.score,phase:s.phase,reason:s.reason});}
  else{s.message=s.lastPlayer.type==='draw'?'你摸到 '+tiles[s.lastPlayer.tile].a+'|'+tiles[s.lastPlayer.tile].b+'；仍由你行动。':s.lastAI&&s.lastAI.type==='pass'?'对手无牌可接并已跳过；现在轮到你。':'对手已回应；现在轮到你接牌。';}
 }
 function action(s,command){let cause=null;if(command==='a'){const id=s.playerHand[s.cursor];if(!matches(s,id,s.end))return blocked(s,'mismatch','所选骨牌与这一端不匹配；换牌或换端，不消耗回合。');s.actions++;s.lastAI=null;s.aiTrail=[];s.lastPlayer=play(s,id,s.end,1);cause=s.playerHand.length?respond(s):'player-empty';}
  else{if(legal(s,s.playerHand).length)return blocked(s,'legal-play-exists','手中仍有牌能接任一端；此时不能摸牌或跳过。');s.actions++;s.lastAI=null;s.aiTrail=[];
   if(s.drawPile.length)s.lastPlayer=draw(s,1);else{s.lastPlayer=pass(s,1);cause=blockedCause(s)||respond(s);}}
  finishAction(s,cause);
 }
 function step(s,dt,raw){if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;const input=normalized(raw);if(input.paused)return s;
  const direction=Math.max(Math.abs(input.x),Math.abs(input.y))<=.5?'none':Math.abs(input.y)>=Math.abs(input.x)?input.y>0?'down':'up':input.x>0?'right':'left',old=s.lastHeld,armed=s.inputArmed;
  const disarm=(input.cancelEpoch!==null&&s.cancelEpoch!==null&&input.cancelEpoch!==s.cancelEpoch)||(input.cancelled&&!s.cancelledLast);s.events=[];s.lastCommand='none';s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;if(elapsed>config.maxElapsed)s.elapsedCapped=true;s.elapsed=Math.min(config.maxElapsed,elapsed);if(input.cancelEpoch!==null)s.cancelEpoch=input.cancelEpoch;s.cancelledLast=input.cancelled;if(disarm)s.inputArmed=false;
  if(!disarm&&!input.cancelled&&armed){const command=input.b&&!old.b?'b':input.a&&!old.a?'a':direction!=='none'&&direction!==old.direction?direction:'none';s.lastCommand=command;
   if(command==='a'||command==='b')action(s,command);else if(command==='up'||command==='down'){const from=s.end,to=command==='up'?'left':'right';s.end=to;event(s,'end',{from,to});s.message='已选择牌链'+(to==='left'?'左':'右')+'端，端点 '+endpoint(s,to)+'。';}
   else if(command!=='none'){const from=s.cursor,to=Math.max(0,Math.min(s.playerHand.length-1,from+(command==='right'?1:-1)));if(from===to)blocked(s,'boundary','已到手牌边界，不消耗回合。');else{s.cursor=to;event(s,'cursor',{from,to});s.message='已选择 '+tiles[s.playerHand[to]].a+'|'+tiles[s.playerHand[to]].b+'。';}}}
  if(!disarm&&!input.cancelled&&!input.a&&!input.b&&Math.abs(input.x)<=.5&&Math.abs(input.y)<=.5)s.inputArmed=true;s.lastHeld={a:input.a,b:input.b,x:input.x,y:input.y,direction};return s;
 }
 return Object.freeze({create,step,config});
});
