// Independent Kalah sowing, terminal sweep and public opponent policy. QA only.
const own=(i,side)=>side===0?i>=0&&i<6:i>=7&&i<13;
const store=side=>side===0?6:13;
export function sow(pits,from,side){
 if(!own(from,side)||!pits[from])throw Error('Independent sow requires a nonempty own pit');
 const next=pits.slice(),seeds=next[from],path=[],before=next[store(side)];next[from]=0;let at=from;
 for(let n=0;n<seeds;n++){do{at=(at+1)%14;}while(at===store(1-side));next[at]++;path.push(at);}
 let captured=0,opposite=null;
 if(own(at,side)&&next[at]===1&&next[12-at]>0){opposite=12-at;captured=next[opposite]+1;next[opposite]=next[at]=0;next[store(side)]+=captured;}
 const terminal=next.slice(0,6).every(v=>v===0)||next.slice(7,13).every(v=>v===0),swept={player:0,opponent:0};
 if(terminal){swept.player=next.slice(0,6).reduce((a,b)=>a+b,0);swept.opponent=next.slice(7,13).reduce((a,b)=>a+b,0);for(let i=0;i<14;i++)if(i!==6&&i!==13)next[i]=0;next[6]+=swept.player;next[13]+=swept.opponent;}
 return {pits:next,terminal,receipt:{side:side===0?'player':'opponent',from,seeds,path,last:at,captured,opposite,extraTurn:!terminal&&at===store(side),storeGain:next[store(side)]-before,swept,storesAfter:[next[6],next[13]]}};
}
export function opponent(pits){const candidates=[];for(let i=7;i<13;i++)if(pits[i])candidates.push(sow(pits,i,1));candidates.sort((a,b)=>Number(b.receipt.extraTurn)-Number(a.receipt.extraTurn)||b.receipt.captured-a.receipt.captured||b.receipt.storeGain-a.receipt.storeGain||a.receipt.from-b.receipt.from);return candidates[0]||null;}
export function advance(s,from){
 let pits=s.pits.slice(),sowCount=s.sowCount||0,phase='playing',reason='',lastPlayerSow,lastAiSows=[];
 function apply(result){pits=result.pits;sowCount++;const receipt={...result.receipt,sowNumber:sowCount};if(result.terminal){reason=pits[6]>pits[13]?'majority':pits[6]===pits[13]?'tie':'minority';phase=reason==='majority'?'won':'lost';}else if(sowCount>=160){phase='lost';reason='sow-limit';}return receipt;}
 lastPlayerSow=apply(sow(pits,from,0));if(phase==='playing'&&!lastPlayerSow.extraTurn){let again=true;while(phase==='playing'&&again){const choice=opponent(pits);if(!choice)throw Error('Unfinished board must allow an opponent sow');const receipt=apply(choice);lastAiSows.push(receipt);again=receipt.extraTurn;}}
 return {pits,sowCount,phase,reason,lastPlayerSow,lastAiSows,aiBurstCount:lastAiSows.length,lastSow:lastAiSows.at(-1)||lastPlayerSow};
}
export function solveVisible(s,{lose=false,maxStates=150000}={}){
 const queue=[{pits:s.pits.slice(),sowCount:s.sowCount||0,route:[]}],seen=new Set([s.pits.join(',')+'|'+(s.sowCount||0)]);
 for(let at=0;at<queue.length;at++){const n=queue[at];for(let from=0;from<6;from++){if(!n.pits[from])continue;const next=advance(n,from),route=[...n.route,{from,expected:next}];if(next.phase===(lose?'lost':'won'))return {route,states:seen.size};if(next.phase!=='playing')continue;const key=next.pits.join(',')+'|'+next.sowCount;if(seen.has(key))continue;seen.add(key);if(seen.size>maxStates)throw Error('Independent public sowing search exceeded bound');queue.push({...next,route});}}
 throw Error('Independent search found no '+(lose?'loss':'win'));
}
