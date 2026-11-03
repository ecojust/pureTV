// Independent one-card FreeCell transitions and bounded best-first search. QA only.
export function top(s,from){return from<4?s.tableau[from].at(-1):from<6?s.freecells[from-4]:null;}
export function transfer(s,from,to){
 const card=top(s,from);if(card===null||card===undefined||from===to||to<0||to>9)return null;const info=s.cards[card];
 if(to<4){const dest=top(s,to);if(dest!==undefined&&dest!==null&&(s.cards[dest].rank!==info.rank+1||s.cards[dest].color===info.color))return null;}
 else if(to<6){if(s.freecells[to-4]!==null)return null;}
 else if(to-6!==info.suit||s.foundations[info.suit]+1!==info.rank)return null;
 const next={...s,tableau:s.tableau.map(p=>p.slice()),freecells:s.freecells.slice(),foundations:s.foundations.slice(),movesUsed:s.movesUsed+1,phase:'playing',reason:'',lastMove:{card,from,to,move:s.movesUsed+1}};
 if(from<4)next.tableau[from].pop();else next.freecells[from-4]=null;
 if(to<4)next.tableau[to].push(card);else if(to<6)next.freecells[to-4]=card;else next.foundations[to-6]++;
 next.foundationCount=next.foundations.reduce((a,b)=>a+b,0);next.remaining=s.cards.length-next.foundationCount;
 if(next.remaining===0){next.phase='won';next.reason='complete';}else if(next.movesUsed>=s.moveLimit){next.phase='lost';next.reason='moves';}
 return next;
}
export function cardIds(s){const ids=[...s.tableau.flat(),...s.freecells.filter(c=>c!==null)];for(let suit=0;suit<4;suit++)for(let rank=1;rank<=s.foundations[suit];rank++)ids.push(s.cards.find(c=>c.suit===suit&&c.rank===rank).id);return ids.sort((a,b)=>a-b);}
function key(s){return s.foundations.join(',')+'|'+s.freecells.map(v=>v===null?-1:v).sort((a,b)=>a-b).join(',')+'|'+s.tableau.map(p=>p.join(',')).sort().join(';');}
function estimate(s){let blocked=0,bad=0;for(let suit=0;suit<4;suit++){const card=s.cards.find(c=>c.suit===suit&&c.rank===s.foundations[suit]+1);if(card)for(const p of s.tableau){const at=p.indexOf(card.id);if(at>=0)blocked+=p.length-at-1;}}
 for(const p of s.tableau)for(let i=1;i<p.length;i++){const a=s.cards[p[i-1]],b=s.cards[p[i]];if(a.rank!==b.rank+1||a.color===b.color)bad++;}
 return s.remaining*8+blocked*2+bad+s.freecells.filter(c=>c!==null).length*3-s.tableau.filter(p=>!p.length).length;
}
class Heap{constructor(){this.a=[];}push(n){const a=this.a;let i=a.length;a.push(n);while(i){const p=(i-1)>>1;if(a[p].score<=n.score)break;a[i]=a[p];i=p;}a[i]=n;}pop(){const a=this.a,result=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(last.score<=a[c].score)break;a[i]=a[c];i=c;}a[i]=last;}return result;}}
export function solveVisible(s,{maxStates=250000}={}){
 const heap=new Heap(),seen=new Map([[key(s),s.movesUsed]]);heap.push({state:structuredClone(s),route:[],score:estimate(s)});let expanded=0;
 while(heap.a.length){const node=heap.pop();if(++expanded>maxStates)throw Error('Independent solitaire search exceeded explicit bound');
  for(let from=0;from<6;from++){const id=top(node.state,from);if(id===null||id===undefined)continue;const suit=node.state.cards[id].suit;
   const free=node.state.freecells.findIndex(c=>c===null),empty=node.state.tableau.findIndex(p=>!p.length),destinations=[6+suit,...(free>=0&&from<4?[4+free]:[]),...Array.from({length:4},(_,i)=>i).filter(i=>node.state.tableau[i].length||i===empty)];
   for(const to of destinations){const state=transfer(node.state,from,to);if(!state)continue;const route=[...node.route,{from,to,card:id}];if(state.phase==='won')return {route,expanded,seen:seen.size};if(state.phase!=='playing')continue;const k=key(state),old=seen.get(k);if(old!==undefined&&old<=state.movesUsed)continue;seen.set(k,state.movesUsed);heap.push({state,route,score:estimate(state)+(state.movesUsed-s.movesUsed)*.5});}
  }
 }
 throw Error('No solitaire witness within remaining move allowance');
}
export function navigation(from,to){
 const queue=[{at:from,route:[]}],seen=new Set([from]);for(let q=0;q<queue.length;q++){const n=queue[q];if(n.at===to)return n.route;const edges=[{key:'ArrowLeft',x:-1,y:0,at:(n.at+9)%10},{key:'ArrowRight',x:1,y:0,at:(n.at+1)%10}];if(n.at<4)edges.push({key:'ArrowUp',x:0,y:-1,at:n.at+4});else edges.push({key:'ArrowDown',x:0,y:1,at:Math.min(n.at-4,3)});for(const e of edges)if(!seen.has(e.at)){seen.add(e.at);queue.push({at:e.at,route:[...n.route,e]});}}throw Error('Unreachable location');
}
