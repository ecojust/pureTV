// Independent test-only domino geometry, open-hand opponent policy and graph search.
export const tiles=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)tiles.push({id:tiles.length,a,b});
export const pips=hand=>hand.reduce((sum,id)=>sum+tiles[id].a+tiles[id].b,0);
export function options(hand,chain){const left=chain[0].left,right=chain.at(-1).right,out=[];for(const id of hand){const t=tiles[id];if(t.a===left||t.b===left)out.push({type:'play',tile:id,end:'left'});if(t.a===right||t.b===right)out.push({type:'play',tile:id,end:'right'});}return out;}
export function oriented(id,end,value){const t=tiles[id];if(t.a!==value&&t.b!==value)return null;if(end==='left')return {left:t.b===value?t.a:t.b,right:value};return {left:value,right:t.a===value?t.b:t.a};}
export function initial(layout){const t=tiles[layout.start];return {playerHand:layout.playerHand.slice(),aiHand:layout.aiHand.slice(),drawPile:layout.drawPile.slice(),chain:[{id:t.id,left:t.a,right:t.b,owner:0}],passStreak:0,playerPlays:0,aiPlays:0,playerDraws:0,aiDraws:0,playerPasses:0,aiPasses:0,actions:0,phase:'playing',reason:'',cause:null};}
function finish(b,cause){b.cause=cause;b.phase=cause==='player-empty'||cause==='blocked-win'?'won':'lost';b.reason=b.phase==='won'?'':cause;}
function blocked(b){const human=pips(b.playerHand),ai=pips(b.aiHand);finish(b,human<ai?'blocked-win':human>ai?'blocked-loss':'blocked-tie');}
function play(b,move,owner){const hand=owner===1?b.playerHand:b.aiHand,face=move.end==='left'?b.chain[0].left:b.chain.at(-1).right,o=oriented(move.tile,move.end,face);if(!o||!hand.includes(move.tile))return null;hand.splice(hand.indexOf(move.tile),1);const item={id:move.tile,...o,owner};if(move.end==='left')b.chain.unshift(item);else b.chain.push(item);b.passStreak=0;b[owner===1?'playerPlays':'aiPlays']++;return {type:'play',tile:move.tile,end:move.end,oriented:o};}
export function turn(board,command){const b=structuredClone(board),ai=[];let player=null;const legal=options(b.playerHand,b.chain);
 if(command.type==='play'){player=play(b,command,1);if(!player)return null;if(!b.playerHand.length)finish(b,'player-empty');}
 else if(command.type==='b'){if(legal.length)return null;if(b.drawPile.length){const tile=b.drawPile.shift();b.playerHand.push(tile);b.playerDraws++;b.passStreak=0;player={type:'draw',tile};}else{player={type:'pass'};b.playerPasses++;b.passStreak++;if(b.passStreak===2)blocked(b);}}
 else return null;
 b.actions++;
 if(b.phase==='playing'&&player.type!=='draw'){
  while(true){const choices=options(b.aiHand,b.chain);choices.sort((a,c)=>pips([c.tile])-pips([a.tile])||a.tile-c.tile||Number(a.end==='right')-Number(c.end==='right'));if(choices.length){ai.push(play(b,choices[0],2));if(!b.aiHand.length)finish(b,'ai-empty');break;}
   if(b.drawPile.length){const tile=b.drawPile.shift();b.aiHand.push(tile);b.aiDraws++;b.passStreak=0;ai.push({type:'draw',tile});continue;}
   b.aiPasses++;b.passStreak++;ai.push({type:'pass'});if(b.passStreak===2)blocked(b);break;
  }
 }
 b.playerPips=pips(b.playerHand);b.aiPips=pips(b.aiHand);return {board:b,player,ai};
}
const key=b=>[b.playerHand.slice().sort((a,c)=>a-c).join(','),b.aiHand.slice().sort((a,c)=>a-c).join(','),b.drawPile.join(','),b.chain[0].left,b.chain.at(-1).right,b.passStreak].join('|');
export function search(layout){const start=initial(layout),queue=[{board:start,path:[],plays:0}],best=new Map([[key(start),0]]),samples=[];let visited=0,win=null,loss=null,winningPlays=null,causes=new Set();
 while(queue.length){queue.sort((a,b)=>a.plays-b.plays||a.path.length-b.path.length);const n=queue.shift();if(best.get(key(n.board))!==n.plays)continue;visited++;if(visited>100000)throw Error('Independent search bound exceeded');if(n.board.phase!=='playing'){causes.add(n.board.cause);if(n.board.phase==='won'&&!win){win=n.path;winningPlays=n.plays;}if(n.board.phase==='lost'&&!loss)loss=n.path;if(win&&loss)break;continue;}
  const commands=options(n.board.playerHand,n.board.chain);if(!commands.length)commands.push({type:'b'});for(const command of commands){const result=turn(n.board,command),path=[...n.path,command],plays=n.plays+(command.type==='play'?1:0),k=key(result.board);if(samples.length<180)samples.push({prefix:n.path,command,result});if(!best.has(k)||plays<best.get(k)){best.set(k,plays);queue.push({board:result.board,path,plays});}}
 }
 return {visited,win,loss,winningPlays,terminalCauses:[...causes],samples};
}
export function nextKey(s,command){if(command.type==='b')return 'b';const index=s.playerHand.indexOf(command.tile);if(index<0)throw Error('Route tile missing from current hand');if(s.cursor!==index)return s.cursor<index?'ArrowRight':'ArrowLeft';if(s.end!==command.end)return command.end==='left'?'ArrowUp':'ArrowDown';return 'Space';}
