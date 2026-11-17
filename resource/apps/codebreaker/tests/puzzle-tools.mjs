// Test-only Mastermind-style arithmetic; no production model or private state access.
export const publicLayouts=[{symbols:4,attemptLimit:7},{symbols:5,attemptLimit:8},{symbols:6,attemptLimit:9}];
export function feedback(secret,guess){
 let exact=0;const left=new Map(),right=new Map();
 for(let i=0;i<4;i++)if(secret[i]===guess[i])exact++;else{left.set(secret[i],(left.get(secret[i])||0)+1);right.set(guess[i],(right.get(guess[i])||0)+1);}
 let misplaced=0;for(const [symbol,count] of left)misplaced+=Math.min(count,right.get(symbol)||0);return {exact,misplaced};
}
export function allCodes(symbols){const result=[];for(let a=0;a<symbols;a++)for(let b=0;b<symbols;b++)for(let c=0;c<symbols;c++)for(let d=0;d<symbols;d++)result.push([a,b,c,d]);return result;}
export function candidates(symbols,history){return allCodes(symbols).filter(code=>history.every(row=>{const f=feedback(code,row.guess);return f.exact===row.exact&&f.misplaced===row.misplaced;}));}
export function choose(codes,historyLength=1){
 if(!codes.length)throw Error('Public feedback has no consistent code');if(historyLength===0)return [0,0,1,1];if(codes.length===1)return codes[0].slice();
 let best=null,bestWorst=Infinity;
 for(const guess of codes){const bins=new Map();let worst=0;
  for(const secret of codes){const f=feedback(secret,guess),key=f.exact*5+f.misplaced,size=(bins.get(key)||0)+1;bins.set(key,size);worst=Math.max(worst,size);if(worst>bestWorst)break;}
  if(worst<bestWorst){best=guess;bestWorst=worst;}
 }return best.slice();
}
export function planFromPublic(state){const l=publicLayouts[state.level],remaining=candidates(l.symbols,state.history);return {guess:choose(remaining,state.history.length),candidateCount:remaining.length};}
