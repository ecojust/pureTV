const test = require('node:test');
const assert = require('node:assert/strict');
const {TetrisGame, TetrisRules:R} = require('../src/main/assets/game-model.js');
const connected = (id, changes={}) => Object.assign({id,connected:true,x:0,y:0,a:false,b:false,start:false,select:false},changes);
const input = (one={},two={}) => [connected(1,one),connected(2,two)];
function game(level=0,players=1) {
  const g=new TetrisGame({seed:12345});g.startLevel=level;g.selectedPlayers=players;g.start(input());return g;
}
function frames(g,n,one={},two={}) { for(let i=0;i<n;i++)g.tick(input(one,two)); }
function clearWithI(g,count) {
  const p=g.players[0];p.board=R.emptyBoard();
  for(let y=20-count;y<20;y++)p.board[y]=Array.from({length:10},(_,x)=>x===5?0:1);
  p.piece={type:'I',rotation:1,x:3,y:16};g.lock(p,false);return p;
}

test('Nintendo right-handed orientations and spawn pivot are explicit, not SRS',()=>{
  const g=game(),p=g.players[0];
  assert.deepEqual(R.cells('T',0),[[0,1],[1,1],[2,1],[1,2]]);
  assert.deepEqual(R.cells('S',1),[[1,0],[1,1],[2,1],[2,2]]);
  assert.deepEqual(R.cells('Z',1),[[2,0],[1,1],[2,1],[1,2]]);
  for(const type of R.TYPES) {
    p.board=R.emptyBoard();p.nextType=type;g.spawn(p);
    const points=R.cells(type,0).map(([x,y])=>[x+p.piece.x,y+p.piece.y]);
    assert.equal(Math.min(...points.map(p=>p[1])),0);
    assert.equal(new Set(points.map(p=>p.join(','))).size,4);
    assert.ok(points.every(([x,y])=>x>=0&&x<10&&y>=0&&y<20));
  }
  p.nextType='T';g.spawn(p);assert.deepEqual(p.piece,{type:'T',rotation:0,x:4,y:-1});
  p.nextType='I';g.spawn(p);assert.deepEqual(p.piece,{type:'I',rotation:0,x:3,y:-2});
});

test('A/B rotate in opposite directions once per press; O remains unchanged',()=>{
  const g=game(),p=g.players[0];p.piece={type:'T',rotation:0,x:4,y:5};
  frames(g,1,{a:true});assert.equal(p.piece.rotation,1);
  frames(g,5,{a:true});assert.equal(p.piece.rotation,1);
  frames(g,1);frames(g,1,{b:true});assert.equal(p.piece.rotation,0);
  p.piece={type:'O',rotation:0,x:3,y:3};assert.equal(g.rotate(p,1),false);assert.equal(p.piece.rotation,0);
});

test('Rotation rejects walls, floor and occupied cells without kicks or translation',()=>{
  const g=game(),p=g.players[0];p.piece={type:'I',rotation:1,x:-2,y:5};
  const before=Object.assign({},p.piece);assert.equal(g.rotate(p,1),false);assert.deepEqual(p.piece,before);
  p.piece={type:'T',rotation:2,x:4,y:18};assert.equal(g.rotate(p,1),false);
  p.piece={type:'T',rotation:0,x:4,y:5};p.board[5][5]=7;
  assert.equal(g.rotate(p,1),false);assert.equal(p.piece.rotation,0);
});

test('Spawn obstruction is top-out; above-board locked cells are truncated without immediate loss',()=>{
  const g=game(),p=g.players[0];p.nextType='I';p.board[0][3]=1;g.spawn(p);
  assert.equal(p.alive,false);assert.equal(p.piece,null);
  const h=game(),q=h.players[0];q.piece={type:'I',rotation:1,x:0,y:-2};q.nextType='T';h.lock(q,false);
  assert.equal(q.alive,true);assert.equal(q.board[0][2],7);assert.equal(q.board[1][2],7);
  frames(h,q.entryTimer);assert.equal(q.alive,true);assert.ok(q.piece);
});

test('Four rows clear together, collapse stably, and award classic Tetris score',()=>{
  const g=game(),p=clearWithI(g,4);assert.deepEqual(p.clearRows,[16,17,18,19]);
  assert.equal(p.score,0);const delay=p.clearTimer;frames(g,delay-1);assert.equal(p.cleared,0);
  frames(g,1);assert.equal(p.cleared,4);assert.equal(p.score,1200);
  assert.ok(p.board.every(row=>row.every(cell=>cell===0)));assert.equal(p.entryTimer,10);
});

test('Single, double and triple use 40/100/300 times the level multiplier',()=>{
  for(const [count,base] of [[1,40],[2,100],[3,300]]) {
    const g=game(5),p=clearWithI(g,count);g.finishClear(p);assert.equal(p.score,base*6);assert.equal(p.cleared,count);
    assert.equal(p.board.length,20);assert.ok(p.board.every(row=>row.length===10));
  }
});

test('Line scoring uses the new level and start-level transition thresholds',()=>{
  assert.deepEqual([0,5,12,16,19].map(R.transitionLines),[10,60,100,110,140]);
  const g=game(),p=clearWithI(g,1);p.cleared=9;g.finishClear(p);
  assert.equal(p.level,1);assert.equal(p.score,80);assert.equal(p.cleared,10);
  const h=game(16),q=clearWithI(h,1);q.cleared=109;h.finishClear(q);
  assert.equal(q.level,17);assert.equal(q.score,40*18);
});

test('NTSC gravity table and fixed ticks retain slow level zero and level 29 speed',()=>{
  assert.deepEqual([0,8,9,10,12,13,15,16,18,19,28,29,99].map(R.gravity),[48,8,6,5,5,4,4,3,3,2,2,1,1]);
  const g=game(),p=g.players[0],y=p.piece.y;frames(g,47);assert.equal(p.piece.y,y);frames(g,1);assert.equal(p.piece.y,y+1);
  const h=game(29),q=h.players[0],start=q.piece.y;frames(h,1);assert.equal(q.piece.y,start+1);
  const k=game(),frame=k.frame;k.step(10,input());assert.ok(k.frame-frame<=7,'A suspended browser does not catch up seconds of gameplay');
});

test('DAS starts with one move, repeats at 16/6 frames, and preserves charge at the wall',()=>{
  const g=game(),p=g.players[0];p.piece={type:'O',rotation:0,x:0,y:3};
  frames(g,1,{x:1});assert.equal(p.piece.x,1);frames(g,15,{x:1});assert.equal(p.piece.x,1);
  frames(g,1,{x:1});assert.equal(p.piece.x,2);frames(g,6,{x:1});assert.equal(p.piece.x,3);
  p.piece={type:'I',rotation:1,x:-2,y:3};p.previous.x=0;
  frames(g,1,{x:-1});assert.equal(p.piece.x,-2);assert.equal(p.dasCharge,16);
});

test('Entry delay does not charge DAS and allows an existing charge to be redirected',()=>{
  const g=game(),p=g.players[0];p.piece={type:'O',rotation:0,x:3,y:17};p.dasCharge=16;p.nextType='T';g.lock(p,false);
  frames(g,9,{x:-1});assert.equal(p.piece,null);assert.equal(p.dasCharge,16);
  frames(g,1,{x:-1});assert.equal(p.piece.x,4);frames(g,1,{x:-1});assert.equal(p.piece.x,3);
});

test('Soft drop awards only the final continuous segment and no hard drop exists',()=>{
  const g=game(),p=g.players[0];p.piece={type:'O',rotation:0,x:3,y:3};
  frames(g,4,{y:1});assert.equal(p.piece.y,5);assert.equal(p.score,0);assert.equal(p.softCells,2);
  frames(g,1);assert.equal(p.softCells,0);
  p.piece.y=15;frames(g,6,{y:1});assert.equal(p.piece,null);assert.equal(p.score,2);
  const h=game(),q=h.players[0],y=q.piece.y;frames(h,1,{y:-1});assert.equal(q.piece.y,y);
});

test('Line animation follows the global four-frame phase and locks without modern lock delay',()=>{
  const g=game(),p=g.players[0];g.frame=3;p.piece={type:'O',rotation:0,x:3,y:17};
  p.gravityTimer=47;frames(g,1);assert.equal(p.piece,null);assert.equal(p.entryTimer,10);
  const h=game();h.frame=3;const q=clearWithI(h,1);assert.equal(q.clearTimer,17);
});

test('One-retry randomizer permits repetition and both players receive the same sequence',()=>{
  const sequence=new R.PieceSequence(1),calls=[];sequence.random=bound=>{calls.push(bound);return 3;};
  assert.equal(sequence.next(),'O');assert.equal(sequence.next(),'O');assert.deepEqual(calls,[8,8,7]);
  const g=game(0,2),a=g.players[0],b=g.players[1];
  assert.equal(a.piece.type,b.piece.type);assert.equal(a.nextType,b.nextType);
  const one=[],two=[];
  for(let i=0;i<40;i++){one.push(a.nextType);a.board=R.emptyBoard();g.spawn(a);}
  for(let i=0;i<40;i++){two.push(b.nextType);b.board=R.emptyBoard();g.spawn(b);}
  assert.deepEqual(one,two);assert.ok(new Set(one).size===7);
});

test('Title level selection, player selection and pause use press edges',()=>{
  const g=new TetrisGame({seed:9});frames(g,1,{x:1});assert.equal(g.startLevel,1);
  frames(g,1,{y:1});assert.equal(g.startLevel,11);frames(g,1,{select:true});assert.equal(g.selectedPlayers,2);
  frames(g,1);frames(g,1,{start:true});assert.equal(g.phase,'playing');assert.equal(g.players[1].joined,true);
  frames(g,3,{start:true});assert.equal(g.phase,'playing');frames(g,1);frames(g,1,{start:true});assert.equal(g.phase,'paused');
  const before=JSON.stringify(g.players.map(p=>({piece:p.piece,board:p.board})));
  frames(g,60,{x:1,y:1,a:true});assert.equal(JSON.stringify(g.players.map(p=>({piece:p.piece,board:p.board}))),before);
  frames(g,1,{start:true});assert.equal(g.phase,'playing');
});

test('A single live-player disconnect pauses both boards; reconnection does not queue held rotations',()=>{
  const g=game(0,2);g.players[0].piece={type:'T',rotation:0,x:4,y:3};
  g.tick([connected(1,{a:true}),connected(2,{connected:false})]);assert.equal(g.phase,'paused');assert.equal(g.pauseReason,'disconnect');
  const before=JSON.stringify(g.players.map(p=>p.piece));
  for(let i=0;i<120;i++)g.tick([connected(1,{a:true,x:1}),connected(2,{connected:false})]);
  assert.equal(JSON.stringify(g.players.map(p=>p.piece)),before);
  g.tick([connected(1,{a:true}),connected(2)]);assert.equal(g.phase,'playing');assert.equal(g.players[0].piece.rotation,0);
});

test('Two boards are independent and a topped-out player does not prevent the survivor continuing',()=>{
  const g=game(0,2),a=g.players[0],b=g.players[1];a.piece={type:'T',rotation:0,x:4,y:4};b.piece={type:'T',rotation:0,x:4,y:4};
  frames(g,1,{a:true,x:1});assert.equal(a.piece.rotation,1);assert.equal(a.piece.x,5);assert.equal(b.piece.rotation,0);assert.equal(b.piece.x,4);
  b.alive=false;b.piece=null;g.tick([connected(1),connected(2,{connected:false})]);assert.equal(g.phase,'playing');
  a.alive=false;a.piece=null;frames(g,1);assert.equal(g.phase,'gameover');
});

test('SELECT toggles music without resetting progress; high score saves safely',()=>{
  const saved=[];const g=new TetrisGame({seed:1,highScore:20,saveHighScore:n=>saved.push(n)});g.start(input());
  frames(g,1,{select:true});assert.equal(g.music,false);frames(g,2,{select:true});assert.equal(g.music,false);
  frames(g,1);frames(g,1,{select:true});assert.equal(g.music,true);
  const p=clearWithI(g,1);g.finishClear(p);assert.equal(g.highScore,40);assert.deepEqual(saved,[40]);
  g.saveHighScore=()=>{throw new Error('storage disabled');};p.score=100;assert.doesNotThrow(()=>g.updateRecord(p));
  assert.equal(g.status().players[0].cleared,1);assert.equal(g.status().players[0].level,0);
});
