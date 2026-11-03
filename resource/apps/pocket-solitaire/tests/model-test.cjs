'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),witnesses=require('./witnesses.json');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(779,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function go(s,p){for(let n=0;s.cursor!==p;n++){assert.ok(n<10);press(s,{x:1});}}
function a(s,p){go(s,p);press(s,{a:true});}
function move(s,from,to,card){assert.equal(s.selectedSource,null);a(s,from);assert.equal(s.selectedSource,from);const used=s.movesUsed;a(s,to);assert.equal(s.movesUsed,used+1,JSON.stringify(s.events));assert.equal(s.selectedSource,null);if(card!==undefined)assert.equal(s.lastMove.card,card);unique(s);}
function unique(s){const ids=s.tableau.flat().concat(s.freecells.filter(c=>c!==null));s.foundations.forEach((rank,suit)=>{for(let r=1;r<=rank;r++)ids.push(suit*s.maxRank+r-1);});assert.equal(ids.length,s.cards.length);assert.equal(new Set(ids).size,s.cards.length);assert.deepEqual(ids.slice().sort((a,b)=>a-b),s.cards.map(c=>c.id));}
// Explicit synthetic destination fixtures keep all cards unique; reserve cards go in tableau2.
function fixture(tableau,freecells=[null,null],foundations=[0,0,0,0]){const s=fresh();s.tableau=copy(tableau);s.freecells=freecells.slice();s.foundations=foundations.slice();const used=new Set(s.tableau.flat().concat(freecells.filter(c=>c!==null)));foundations.forEach((rank,suit)=>{for(let r=1;r<=rank;r++)used.add(suit*3+r-1);});s.tableau[2].push(...s.cards.map(c=>c.id).filter(c=>!used.has(c)));step(s);unique(s);return s;}
test('public API, visible suit/rank identities and detached immutable deals',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.maxRank,l.moveLimit]),[[3,50],[4,70],[5,90]]);
 const a=M.create(-1,-1),b=M.create(779,0);assert.equal(a.seed,779);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.tableau[0].pop();a.cards[0].rank=99;assert.equal(b.tableau[0].length,3);assert.equal(b.cards[0].rank,1);assert.throws(()=>M.config.layouts[0].tableau[0].pop(),TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);
 for(let level=0;level<3;level++){const s=fresh(level);unique(s);assert.equal(s.cards.length,[12,16,20][level]);assert.deepEqual(s.cards.filter(c=>c.rank===1).map(c=>c.color),[0,1,0,1]);}
});
test('three normal visible deals win with ordinary moves and at least4 temporary placements',()=>{
 witnesses.forEach((w,level)=>{const s=fresh(level);let temporary=0;for(const [from,to,id]of w.witness){const foundations=s.foundations.slice();move(s,from,to,id);if(to<6)temporary++;s.foundations.forEach((n,k)=>assert.ok(n>=foundations[k]));assert.ok(s.history.length<=2);}
 assert.equal(s.phase,'won');assert.equal(s.reason,'complete');assert.equal(s.movesUsed,w.witness.length);assert.equal(temporary,w.temporaryPlacements);assert.ok(temporary>=4);assert.equal(s.remaining,0);assert.deepEqual(s.foundations,Array(4).fill(s.maxRank));assert.equal(s.score,100);assert.notEqual(s.terminalReceipt.tableau,s.tableau);
 const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:99});assert.deepEqual(s,before);});
});
test('tableau placement requires opposite color and exactly one rank lower',()=>{
 const s=fixture([[1],[5],[],[]]);move(s,0,1,1);assert.deepEqual(s.tableau[1],[5,1]);
 const gap=fixture([[0],[5],[],[]]);a(gap,0);a(gap,1);assert.equal(gap.events[0].reason,'tableau-rule');assert.equal(gap.movesUsed,0);assert.equal(gap.selectedSource,0);
 const color=fixture([[7],[2],[],[]]);a(color,0);a(color,1);assert.equal(color.events[0].reason,'tableau-rule');assert.equal(color.movesUsed,0);
});
test('an empty tableau accepts any rank, and only the exposed top card can move',()=>{
 const s=fixture([[0,2],[],[],[]]);move(s,0,1,2);assert.deepEqual(s.tableau[0],[0]);assert.deepEqual(s.tableau[1],[2]);assert.equal(s.lastMove.card,2);unique(s);
});
test('freecells hold one card and allow legal transfer between freecells',()=>{
 const s=fresh();move(s,0,4,2);move(s,1,5,5);a(s,0);const before=copy(s.freecells);a(s,4);assert.equal(s.events[0].reason,'occupied-freecell');assert.equal(s.selectedSource,0);assert.deepEqual(s.freecells,before);a(s,0);assert.equal(s.selectedSource,null);
 const t=fresh();move(t,0,4,2);move(t,4,5,2);assert.deepEqual(t.freecells,[null,2]);assert.equal(t.tableau[0].length,2);
});
test('foundation accepts only next rank of fixed suit and forbids forward withdrawal',()=>{
 const s=fixture([[1,0],[],[],[]]);a(s,0);a(s,7);assert.equal(s.events[0].reason,'foundation-rule');assert.equal(s.movesUsed,0);a(s,6);assert.equal(s.foundations[0],1);assert.equal(s.movesUsed,1);a(s,6);assert.equal(s.events[0].reason,'foundation-source');assert.equal(s.selectedSource,null);move(s,0,6,1);assert.equal(s.foundations[0],2);
 const t=fixture([[1],[],[],[]]);a(t,0);a(t,6);assert.equal(t.events[0].reason,'foundation-rule');assert.equal(t.foundations[0],0);unique(t);
});
test('source marking, same-source cancellation and empty/foundation blocks spend no moves',()=>{
 const s=fresh();a(s,0);assert.equal(s.selectedSource,0);a(s,0);assert.equal(s.selectedSource,null);a(s,4);assert.equal(s.events[0].reason,'empty-source');a(s,6);assert.equal(s.events[0].reason,'foundation-source');assert.equal(s.movesUsed,0);assert.equal(s.history.length,0);
});
test('undo restores a foundation card but never refunds valid move count',()=>{
 const s=fixture([[0],[],[],[]]),initial=copy(s.tableau);press(s,{b:true});assert.equal(s.events[0].reason,'no-history');assert.equal(s.undoTickets,2);move(s,0,6,0);press(s,{b:true});assert.equal(s.foundations[0],0);assert.deepEqual(s.tableau,initial);assert.equal(s.movesUsed,1);assert.equal(s.undoTickets,1);assert.equal(s.selectedSource,null);assert.equal(s.lastMove,null);assert.deepEqual(s.lastUndo.foundationsBefore,[1,0,0,0]);assert.deepEqual(s.lastUndo.foundationsAfter,[0,0,0,0]);
 move(s,0,6,0);press(s,{b:true});assert.equal(s.movesUsed,2);assert.equal(s.undoTickets,0);assert.equal(s.undosUsed,2);move(s,0,6,0);press(s,{b:true});assert.equal(s.events[0].reason,'no-tickets');assert.equal(s.foundations[0],1);assert.equal(s.movesUsed,3);unique(s);
});
test('history keeps only the latest two positions and undo clears a marked source',()=>{
 const s=fresh();move(s,0,4,2);const after1=copy(s.freecells);move(s,4,5,2);const after2=copy(s.freecells);move(s,5,4,2);assert.equal(s.history.length,2);a(s,4);assert.equal(s.selectedSource,4);press(s,{b:true});assert.equal(s.selectedSource,null);assert.deepEqual(s.freecells,after2);press(s,{b:true});assert.deepEqual(s.freecells,after1);assert.equal(s.movesUsed,3);assert.equal(s.undoTickets,0);assert.equal(s.history.length,0);assert.notEqual(s.tableau,s.history.tableau);unique(s);
});
test('all three unchanged deals naturally exhaust50/70/90 moves via legal freecell transfers',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);move(s,0,4);while(s.phase==='playing'){const from=s.freecells[0]===null?5:4;move(s,from,from===4?5:4);}assert.equal(s.reason,'moves');assert.equal(s.movesUsed,s.moveLimit);assert.equal(s.foundationCount,0);assert.equal(s.undoTickets,2);const before=copy(s);press(s,{b:true});assert.deepEqual(s,before);}
});
test('ordinary reversible padding reaches exact-budget wins on all three levels',()=>{
 witnesses.forEach((w,level)=>{const s=fresh(level),extra=s.moveLimit-w.witness.length,odd=extra%2===1;let needsThree=odd;
  move(s,...w.witness[0]);for(let k=0;k<(extra-(odd?3:0))/2;k++){move(s,4,5);move(s,5,4);}
  for(const action of w.witness.slice(1)){move(s,...action);if(needsThree&&s.phase==='playing'){const occupied=s.freecells.findIndex(v=>v!==null),empty=s.freecells.findIndex(v=>v===null),column=s.tableau.findIndex(v=>v.length===0);if(occupied>=0&&empty>=0&&column>=0){const before=copy({tableau:s.tableau,freecells:s.freecells,foundations:s.foundations});move(s,occupied+4,column);move(s,column,empty+4);move(s,empty+4,occupied+4);assert.deepEqual({tableau:s.tableau,freecells:s.freecells,foundations:s.foundations},before);needsThree=false;}}
  }assert.equal(needsThree,false);assert.equal(s.phase,'won');assert.equal(s.movesUsed,s.moveLimit);assert.equal(s.reason,'complete');assert.equal(s.undoTickets,2);
 });
});
test('location cycle and vertical shortcuts have explicit bounded behavior',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.cursor,9);press(s,{y:1});assert.equal(s.cursor,3);press(s,{y:-1});assert.equal(s.cursor,7);press(s,{y:-1});assert.equal(s.events[0].reason,'navigation-bound');press(s,{y:1});assert.equal(s.cursor,3);press(s,{y:1});assert.equal(s.events[0].reason,'navigation-bound');assert.equal(s.movesUsed,0);
});
test('B over A over directions and held edges never defer a move or source switch',()=>{
 const s=fresh();move(s,0,4);go(s,0);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.lastCommand,'b');assert.equal(s.undoTickets,1);assert.equal(s.selectedSource,null);assert.equal(s.cursor,0);step(s,{a:true,x:1});assert.equal(s.selectedSource,null);assert.equal(s.cursor,0);step(s);step(s,{a:true,x:1});assert.equal(s.selectedSource,0);assert.equal(s.cursor,0);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.selectedSource,0);assert.equal(s.movesUsed,1);
});
test('initial neutral and cancellation require release and preserve marked source',()=>{
 const s=M.create(779,0);step(s,{a:true});assert.equal(s.selectedSource,null);step(s,{cancelEpoch:0});step(s,{a:true});assert.equal(s.selectedSource,0);step(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,0);assert.equal(s.inputArmed,false);assert.equal(s.selectedSource,0);step(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,0);step(s,{cancelEpoch:1});step(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,1);step(s,{a:true,cancelled:true});step(s,{a:true});assert.equal(s.movesUsed,0);assert.equal(s.selectedSource,0);step(s);step(s,{a:true});assert.equal(s.events[0].reason,'tableau-rule');
});
test('invalid dt, pause and hostile descriptors cannot partially alter card positions',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.movesUsed,0);assert.equal(s.selectedSource,null);assert.equal(reads,0);step(s,{a:true});assert.equal(s.selectedSource,0);
});
test('diagnostic saturation does not introduce a deadline',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;a(s,6);step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,ordinaryWinningMoves:witnesses.map(w=>w.witness.length),temporaryPlacements:witnesses.map(w=>w.temporaryPlacements),ordinaryExactBudgetWins:[50,70,90],ordinaryBudgetLosses:[50,70,90],physicalTvTested:false,physicalPhoneTested:false},null,2));
