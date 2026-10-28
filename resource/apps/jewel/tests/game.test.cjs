const test=require('node:test');
const assert=require('node:assert/strict');
const JewelGame=require('../src/main/assets/game-model.js');
const empty=(n=13)=>Array.from({length:n},()=>[0,0,0,0,0,0]);
const input=(extra={})=>Object.assign({id:1,connected:true,x:0,y:0,a:false,b:false,start:false,select:false},extra);
function tick(game,frames=1,first={},second){for(let i=0;i<frames;i++)game.step(1/60,[input(first)].concat(second?[input(Object.assign({id:2},second))]:[]));}
function start(two=false){const g=new JewelGame({seed:1234});if(two){tick(g,1,{select:true});tick(g);}tick(g,1,{start:true},two?{}:undefined);tick(g,1,{},two?{}:undefined);return g;}
function release(game){tick(game);}

test('classic dimensions, six normal gems, next preview, and default frame speed',()=>{
 const g=start(),p=g.players[0];assert.equal(p.board.length,13);assert.equal(p.board[0].length,6);assert.deepEqual({x:p.active.x,y:p.active.y},{x:3,y:-2});
 for(let i=0;i<100;i++)for(const c of g.nextColumn(p))assert.ok(c>=1&&c<=6);
 assert.equal(p.next.length,3);assert.equal(JewelGame.fallFrames(0),63);assert.equal(JewelGame.fallFrames(32),11);assert.equal(JewelGame.fallFrames(48),8);
});
test('horizontal, vertical and both diagonal matches; overlaps clear each cell once',()=>{
 const b=empty();for(const [x,y] of [[1,10],[2,10],[3,10],[2,9],[2,11],[1,9],[3,11],[1,11],[3,9]])b[y][x]=4;
 const cells=JewelGame.findMatches(b);assert.equal(cells.length,9);assert.equal(new Set(cells.map(c=>`${c.x}:${c.y}`)).size,9);
 const small=empty();small[12][0]=small[12][1]=3;assert.equal(JewelGame.findMatches(small).length,0);
});
test('gravity keeps column order and never shifts gems between columns',()=>{
 const b=empty();b[2][1]=2;b[5][1]=5;b[11][1]=1;b[7][4]=3;
 const result=JewelGame.collapse(b);assert.deepEqual(result.slice(10).map(r=>r[1]),[2,5,1]);assert.equal(result[12][4],3);assert.equal(result[11][4],0);assert.equal(b[2][1],2);
});
test('A and B rotate once per press; SELECT modifier swaps top and bottom',()=>{
 const g=start(),p=g.players[0];p.active.colors=[1,2,3];tick(g,1,{a:true});assert.deepEqual(p.active.colors,[3,1,2]);tick(g,10,{a:true});assert.deepEqual(p.active.colors,[3,1,2]);
 release(g);tick(g,1,{b:true});assert.deepEqual(p.active.colors,[2,3,1]);release(g);tick(g,1,{select:true,a:true});assert.deepEqual(p.active.colors,[1,3,2]);assert.equal(g.muted,false);
});
test('horizontal repeat is eight frames, stops after release, respects both walls',()=>{
 const g=start(),p=g.players[0];tick(g,1,{x:-1});assert.equal(p.active.x,2);tick(g,7,{x:-1});assert.equal(p.active.x,2);tick(g,1,{x:-1});assert.equal(p.active.x,1);
 release(g);tick(g,10);assert.equal(p.active.x,1);tick(g,32,{x:-1});assert.equal(p.active.x,0);tick(g,64,{x:1});assert.equal(p.active.x,5);
});
test('lateral collision does not overwrite a stacked gem',()=>{
 const g=start(),p=g.players[0];p.active.x=2;p.active.y=5;p.board[6][3]=4;tick(g,1,{x:1});assert.equal(p.active.x,2);assert.equal(p.board[6][3],4);
});
test('soft drop uses two frames and release returns to normal gravity',()=>{
 const g=start(),p=g.players[0];p.fall=0;const y=p.active.y;tick(g,2,{y:1});assert.equal(p.active.y,y+1);release(g);p.fall=0;tick(g,61);assert.equal(p.active.y,y+1);tick(g,2);assert.equal(p.active.y,y+2);
});
test('holding soft drop does not carry acceleration into the next column',()=>{
 const g=start(),p=g.players[0];p.active.y=10;p.active.colors=[1,2,3];p.fall=0;tick(g,2,{y:1});assert.equal(p.active.y,-2);assert.equal(p.softArmed,false);tick(g,3,{y:1});assert.equal(p.active.y,-2);release(g);tick(g,2,{y:1});assert.equal(p.active.y,-1);
});
test('locking clears a run after flashing and awards score/gem count',()=>{
 const g=start(),p=g.players[0];p.active={x:0,y:10,colors:[2,2,2],magic:false};g.lock(p);assert.equal(p.status,'clearing');assert.equal(p.clearCells.length,3);assert.equal(p.cleared,0);
 tick(g,40);assert.equal(p.cleared,3);assert.equal(p.score,300);assert.equal(p.streak,1);assert.ok(p.board.every(r=>r.every(v=>v===0)));assert.equal(p.status,'falling');assert.equal(g.highScore,300);
});
test('a cleared support row triggers a second wave only after gravity',()=>{
 const g=start(),p=g.players[0];p.active=null;p.status='clearing';p.chain=1;p.clearTicks=1;p.dropMatched=true;p.lastLockY=12;
 p.board=empty();p.board[12][0]=p.board[12][1]=p.board[12][2]=1;
 p.board[11][0]=2;p.board[10][1]=2;p.board[9][2]=2;p.clearCells=[{x:0,y:12},{x:1,y:12},{x:2,y:12}];
 tick(g);assert.equal(p.chain,2);assert.equal(p.status,'clearing');assert.equal(p.clearCells.length,3);tick(g,40);assert.equal(p.cleared,6);assert.equal(p.score,900);assert.ok(p.board.every(r=>r.every(v=>v===0)));
});
test('simultaneous crossing matches and long runs have a defined counting bonus',()=>{
 assert.equal(JewelGame.waveScore(3,1,0,0),300);assert.equal(JewelGame.waveScore(4,1,0,0),500);assert.equal(JewelGame.waveScore(5,1,0,0),800);assert.equal(JewelGame.waveScore(3,2,0,0),600);assert.equal(JewelGame.waveScore(3,1,9,9),579);
});
test('seventy cleared jewels advance level and award a magic column without consuming NEXT',()=>{
 const g=start(),p=g.players[0];p.levelCleared=68;p.cleared=68;p.active={x:0,y:10,colors:[2,2,2],magic:false};const next=p.next.slice(),seq=p.seq;g.lock(p);tick(g,40);
 assert.equal(p.level,1);assert.equal(p.levelCleared,1);assert.deepEqual(p.active.colors,[7,7,7]);assert.equal(p.active.magic,true);assert.deepEqual(p.next,next);assert.equal(p.seq,seq);assert.equal(p.speedLevel,0);
});
test('a magic column clears its contact color across the board and itself',()=>{
 const g=start(),p=g.players[0];p.level=1;p.board=empty();p.board[12][0]=3;p.board[12][5]=3;p.board[11][5]=1;p.active={x:0,y:9,colors:[7,7,7],magic:true};g.lock(p);
 assert.equal(p.clearCells.length,5);assert.equal(p.speedLevel,1);tick(g,40);assert.equal(p.cleared,5);assert.equal(p.board[12][5],1);assert.equal(p.board[12][0],0);
});
test('magic on an empty floor vanishes without erasing other colors',()=>{
 const g=start(),p=g.players[0];p.board=empty();p.board[12][4]=2;p.active={x:0,y:10,colors:[7,7,7],magic:true};g.lock(p);assert.equal(p.clearCells.length,3);tick(g,40);assert.equal(p.board[12][4],2);
});
test('hidden rows participate in clearing; remaining hidden gems cause top out',()=>{
 const g=start(),p=g.players[0];p.active={x:1,y:-2,colors:[1,2,3],magic:false};p.board[1][1]=5;g.lock(p);assert.equal(p.alive,false);assert.equal(g.phase,'gameover');
});
test('pause freezes all board clocks; SELECT changes audio only while paused',()=>{
 const g=start(),p=g.players[0];tick(g,1,{start:true});assert.equal(g.phase,'paused');const saved=JSON.stringify({active:p.active,board:p.board,fall:p.fall});tick(g,100,{x:-1,y:1,a:true});assert.equal(JSON.stringify({active:p.active,board:p.board,fall:p.fall}),saved);tick(g,1,{select:true});assert.equal(g.muted,true);release(g);tick(g,1,{start:true});assert.equal(g.phase,'playing');
});
test('disconnect pauses, reconnect resumes, a manual pause is preserved',()=>{
 const g=start();g.step(1/60,[]);assert.equal(g.phase,'paused');assert.equal(g.autoPaused,true);tick(g);assert.equal(g.phase,'playing');tick(g,1,{start:true});release(g);g.step(1/60,[]);tick(g);assert.equal(g.phase,'paused');assert.equal(g.autoPaused,false);
});
test('two players get equal seeded queues but independent board and input state',()=>{
 const g=start(true),a=g.players[0],b=g.players[1];assert.equal(g.selectedPlayers,2);assert.deepEqual(a.active.colors,b.active.colors);assert.deepEqual(a.next,b.next);tick(g,1,{x:-1,a:true},{x:1,b:true});assert.equal(a.active.x,2);assert.equal(b.active.x,4);a.board[12][0]=1;assert.equal(b.board[12][0],0);
 const aCols=[],bCols=[];for(let i=0;i<20;i++)aCols.push(g.nextColumn(a));for(let i=0;i<20;i++)bCols.push(g.nextColumn(b));assert.deepEqual(aCols,bCols);
});
test('one top-out does not end a duel; last top-out produces game over',()=>{
 const g=start(true);g.topOut(g.players[0]);assert.equal(g.phase,'playing');g.topOut(g.players[1]);assert.equal(g.phase,'gameover');release(g);tick(g,1,{start:true});assert.equal(g.phase,'title');
});
test('public phone status uses one-based levels and valid counts',()=>{
 const g=start();assert.equal(g.status().players[0].level,1);assert.equal(g.status().stage,1);assert.equal(g.status().players[0].cleared,0);assert.equal(g.status().players[0].alive,true);assert.equal(g.status().players[1].joined,false);
});

test('duel pauses both fields when either active player disconnects',()=>{
 const g=start(true);tick(g,10,{},{});g.step(1/60,[input()]);assert.equal(g.phase,'paused');const before=JSON.stringify(g.players.map(p=>({active:p.active,board:p.board,fall:p.fall})));tick(g,60,{x:1,y:1});assert.equal(JSON.stringify(g.players.map(p=>({active:p.active,board:p.board,fall:p.fall}))),before);tick(g,1,{},{});assert.equal(g.phase,'playing');
});

test('hidden-row matches can clear before the top-out decision',()=>{
 const g=start(),p=g.players[0];p.active={x:1,y:-2,colors:[3,3,3],magic:false};p.board[1][1]=4;g.lock(p);assert.equal(p.alive,true);assert.equal(p.status,'clearing');assert.ok(p.clearCells.some(c=>c.y<0));tick(g,40);assert.equal(p.alive,true);assert.equal(p.cleared,3);assert.equal(p.hidden.flat().filter(Boolean).length,0);
});
test('invalid saved high scores cannot corrupt a new game',()=>{
 assert.equal(new JewelGame({highScore:Infinity}).highScore,0);assert.equal(new JewelGame({highScore:'bad'}).highScore,0);assert.equal(new JewelGame({highScore:-3}).highScore,0);assert.equal(new JewelGame({highScore:600}).highScore,600);
});
