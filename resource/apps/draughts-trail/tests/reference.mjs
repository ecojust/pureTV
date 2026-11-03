// Independent complete-turn enumerator and visible deterministic opponent. QA only.
const sign=v=>Math.sign(v),row=i=>Math.floor(i/6),col=i=>i%6;
const index=(r,c)=>r>=0&&r<6&&c>=0&&c<6?r*6+c:-1;
export function pieceSteps(board,from,capture=false){
 const value=board[from],side=sign(value);if(!side)return[];const ys=Math.abs(value)===2?[-1,1]:[-side],result=[];
 for(const dy of ys)for(const dx of [-1,1]){const near=index(row(from)+dy,col(from)+dx);if(near<0)continue;
  if(!capture){if(!board[near])result.push({to:near,captured:null});continue;}
  const to=index(row(from)+2*dy,col(from)+2*dx);if(to>=0&&!board[to]&&sign(board[near])===-side)result.push({to,captured:near});
 }
 return result;
}
function move(board,from,step){const next=board.slice(),value=next[from],side=sign(value);next[from]=0;next[step.to]=value;if(step.captured!==null)next[step.captured]=0;const promoted=Math.abs(value)===1&&row(step.to)===(side===1?0:5);if(promoted)next[step.to]=side*2;return {board:next,promoted};}
export function turns(board,side){
 const pieces=board.flatMap((v,i)=>sign(v)===side?[i]:[]),capturing=pieces.filter(i=>pieceSteps(board,i,true).length),result=[];
 function chain(b,at,path,captured){const options=pieceSteps(b,at,true);if(!options.length){result.push({board:b,path,captured,promoted:false});return;}
  for(const step of options){const next=move(b,at,step),p=[...path,step.to],c=[...captured,step.captured];if(next.promoted)result.push({...next,path:p,captured:c});else chain(next.board,step.to,p,c);}}
 if(capturing.length){for(const from of capturing)chain(board,from,[from],[]);return result;}
 for(const from of pieces)for(const step of pieceSteps(board,from)){const next=move(board,from,step);result.push({...next,path:[from,step.to],captured:[]});}return result;
}
function lex(a,b){for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length;}
export function opponent(board){const legal=turns(board,-1);legal.sort((a,b)=>b.captured.length-a.captured.length||Number(b.promoted)-Number(a.promoted)||(!a.captured.length?row(b.path.at(-1))-row(a.path.at(-1)):0)||lex(a.path,b.path));return legal[0]||null;}
export function round(board,player,halfTurns=0){
 let b=player.board,half=halfTurns+1;const ai=opponent(b);if(!ai)return {board:b,halfTurns:half,phase:'won',reason:b.some(v=>v<0)?'opponent-blocked':'opponent-empty',ai:null};
 if(half>=80)return {board:b,halfTurns:half,phase:'lost',reason:'turn-limit',ai:null};b=ai.board;half++;
 if(!turns(b,1).length)return {board:b,halfTurns:half,phase:'lost',reason:b.some(v=>v>0)?'player-blocked':'player-empty',ai};
 return {board:b,halfTurns:half,phase:half>=80?'lost':'playing',reason:half>=80?'turn-limit':'',ai};
}
export function solveVisible(s,{lose=false,maxStates=150000}={}){
 const queue=[{board:s.board.slice(),halfTurns:s.halfTurns,route:[]}],seen=new Set([s.board.join(',')]);
 for(let at=0;at<queue.length;at++){const n=queue[at];for(const player of turns(n.board,1)){const next=round(n.board,player,n.halfTurns),route=[...n.route,{path:player.path,player,expected:next}];
  if(next.phase===(lose?'lost':'won'))return {route,states:seen.size};if(next.phase!=='playing')continue;const key=next.board.join(',');if(seen.has(key))continue;seen.add(key);if(seen.size>maxStates)throw Error('Independent public position search exceeded bound');queue.push({...next,route});
 }}throw Error('Independent search found no '+(lose?'loss':'win'));
}
