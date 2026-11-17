// Independent finite take-away game graph, deliberately without XOR rules.
const cache=new Map();
export function winning(piles,misere){
 const total=piles.reduce((a,b)=>a+b,0);if(total===0)return misere;
 const key=Number(misere)+':'+piles.slice().sort((a,b)=>a-b).join(',');if(cache.has(key))return cache.get(key);
 for(let pile=0;pile<piles.length;pile++)for(let amount=1;amount<=piles[pile];amount++){const next=piles.slice();next[pile]-=amount;if(!winning(next,misere)){cache.set(key,true);return true;}}
 cache.set(key,false);return false;
}
export function opponent(piles,misere){
 for(let pile=0;pile<piles.length;pile++)for(let amount=1;amount<=piles[pile];amount++){const next=piles.slice();next[pile]-=amount;if(!winning(next,misere))return {pile,amount};}
 const largest=Math.max(...piles);if(!largest)return null;return {pile:piles.indexOf(largest),amount:1};
}
export function advance(s,pile,amount){
 if(amount<1||amount>s.piles[pile])throw Error('Illegal independent removal');
 const piles=s.piles.slice();let totalMoves=s.totalMoves||0,phase='playing',reason='';
 function remove(side,pile,removed){const before=piles[pile];piles[pile]-=removed;totalMoves++;return {side,pile,removed,before,after:piles[pile],remaining:piles.reduce((a,b)=>a+b,0),moveNumber:totalMoves};}
 const lastPlayerMove=remove('player',pile,amount);let lastAiMove=null;
 if(!lastPlayerMove.remaining){phase=s.misere?'lost':'won';reason='player-last';}
 else{const move=opponent(piles,s.misere);lastAiMove=remove('opponent',move.pile,move.amount);if(!lastAiMove.remaining){phase=s.misere?'won':'lost';reason='opponent-last';}}
 return {...s,piles,totalMoves,phase,reason,remaining:piles.reduce((a,b)=>a+b,0),lastPlayerMove,lastAiMove,lastRound:{player:lastPlayerMove,opponent:lastAiMove}};
}
export function solveVisible(s,{lose=false}={}){
 const queue=[{state:structuredClone(s),route:[]}],seen=new Set([s.piles.join(',')]);
 for(let at=0;at<queue.length;at++){const n=queue[at];for(let pile=0;pile<n.state.piles.length;pile++)for(let amount=1;amount<=n.state.piles[pile];amount++){const expected=advance(n.state,pile,amount),route=[...n.route,{pile,amount,expected}];if(expected.phase===(lose?'lost':'won'))return {route,states:seen.size};if(expected.phase!=='playing')continue;const key=expected.piles.join(',');if(seen.has(key))continue;seen.add(key);queue.push({state:expected,route});}}
 throw Error('Public take-away position has no '+(lose?'losing':'winning')+' route against documented opponent');
}
