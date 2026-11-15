/* Independently written Magic Jewelry rules; factual reference notes: docs/reference.md. */
(function (root) {
  'use strict';
  var WIDTH = 6, HEIGHT = 13, HIDDEN = 2, FPS = 60;
  var SPEEDS = [63,52,41,32,29,25,23,23,21,21,21,20,19,18,18,18,17,17,17,18,16,16,16,17,13,13,13,16,12,12,12,13];
  function rows(count) { return Array.from({ length: count }, function () { return [0,0,0,0,0,0]; }); }
  function random(seed) {
    var value = (seed >>> 0) || 0x5a17b39d;
    return function () { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0; };
  }
  function fullBoard(player) { return player.hidden.concat(player.board); }
  function splitBoard(player, board) { player.hidden = board.slice(0, HIDDEN); player.board = board.slice(HIDDEN); }
  function matches(board) {
    var found = new Set(), directions = [[1,0],[0,1],[1,1],[1,-1]];
    for (var y = 0; y < board.length; y++) for (var x = 0; x < WIDTH; x++) {
      var color = board[y][x];
      if (!color) continue;
      for (var d = 0; d < directions.length; d++) {
        var dx = directions[d][0], dy = directions[d][1], previousY = y - dy, previousX = x - dx;
        if (previousY >= 0 && previousY < board.length && previousX >= 0 && previousX < WIDTH && board[previousY][previousX] === color) continue;
        var line = [], nx = x, ny = y;
        while (ny >= 0 && ny < board.length && nx >= 0 && nx < WIDTH && board[ny][nx] === color) {
          line.push(ny * WIDTH + nx); nx += dx; ny += dy;
        }
        if (line.length >= 3) line.forEach(function (cell) { found.add(cell); });
      }
    }
    return Array.from(found).sort(function (a,b) { return a-b; }).map(function (cell) { return { x: cell % WIDTH, y: Math.floor(cell / WIDTH) }; });
  }
  function collapse(board) {
    var result = rows(board.length);
    for (var x = 0; x < WIDTH; x++) {
      var dest = board.length - 1;
      for (var y = board.length - 1; y >= 0; y--) if (board[y][x]) result[dest--][x] = board[y][x];
    }
    return result;
  }
  function fallFrames(level) { return level >= 48 ? 8 : level >= 32 ? 11 : SPEEDS[Math.max(0, level | 0)]; }
  function waveScore(count, chain, streak, heightBonus) {
    var bonus = count > 3 ? (count - 3) * (count - 2) / 2 : 0;
    return (count + bonus) * (100 + Math.min(9, Math.max(0, streak)) * 10) * Math.pow(2, Math.max(0, chain - 1)) + heightBonus;
  }
  function neutral() { return { connected:false,x:0,y:0,a:false,b:false,start:false,select:false }; }
  function player(id) {
    return { id:id, joined:false, alive:false, connected:false, board:rows(HEIGHT), hidden:rows(HIDDEN), active:null, next:[1,2,3], score:0, level:0, speedLevel:0, cleared:0, chain:0, clearCells:[], clearTicks:0, gravityMoves:[], gravityTicks:0, gravityDuration:0, status:'waiting', seq:0, streak:0, pendingMagic:0, levelCleared:0, last:neutral(), input:neutral(), dx:0, das:0, fall:0, softArmed:false, lastLockY:12, dropMatched:false, resolvingMagic:false };
  }
  function JewelGame(options) {
    options = options || {};
    this.seed = options.seed == null ? ((Date.now() ^ 0x36d8c21b) >>> 0) : options.seed >>> 0;
    this.highScore = Number.isFinite(Number(options.highScore)) ? Math.min(99999999, Math.max(0, Number(options.highScore))) : 0;
    this.phase = 'title'; this.selectedPlayers = 1; this.titleLevel = 0;
    this.players = [player(1), player(2)]; this.frame = 0; this.accumulator = 0;
    this.events = []; this.eventId = 0; this.autoPaused = false; this.muted = !!options.muted;
  }
  JewelGame.prototype.emit = function (type, player, extra) {
    this.events.push(Object.assign({ id:++this.eventId, type:type, player:player ? player.id : 0 }, extra || {}));
  };
  JewelGame.prototype.nextColumn = function (p) {
    p.seq++;
    return [0,0,0].map(function () { var value = p.random() & 7; return value === 0 ? 1 : value === 7 ? 5 : value; });
  };
  JewelGame.prototype.canPlace = function (p, x, y) {
    if (x < 0 || x >= WIDTH || y < -HIDDEN || y + 2 >= HEIGHT) return false;
    var board = fullBoard(p);
    for (var i = 0; i < 3; i++) if (board[y + i + HIDDEN][x]) return false;
    return true;
  };
  JewelGame.prototype.spawn = function (p) {
    var magic = p.pendingMagic > 0;
    var colors = magic ? [7,7,7] : p.next.slice();
    if (magic) p.pendingMagic--; else p.next = this.nextColumn(p);
    p.active = { x:3, y:-2, colors:colors, magic:magic };
    p.fall = 0; p.dx = 0; p.das = 0; p.chain = 0; p.dropMatched = false;
    p.softArmed = !p.input.y || p.input.y < .5;
    p.clearCells = []; p.status = 'falling';
    if (!this.canPlace(p, p.active.x, p.active.y)) this.topOut(p);
  };
  JewelGame.prototype.topOut = function (p) {
    p.alive = false; p.active = null; p.status = 'over'; p.clearCells = []; this.emit('gameover',p);
    if (this.players.filter(function (value) { return value.joined; }).every(function (value) { return !value.alive; })) this.phase = 'gameover';
  };
  JewelGame.prototype.begin = function () {
    var game = this;
    this.phase = 'playing'; this.autoPaused = false; this.accumulator = 0;
    this.players = this.players.map(function (old) {
      var p = player(old.id); p.last = old.last; p.input = old.input; p.connected = old.connected;
      p.joined = p.id <= game.selectedPlayers; p.alive = p.joined; p.level = game.titleLevel; p.speedLevel = p.level;
      p.random = random(game.seed); p.next = game.nextColumn(p);
      if (p.joined) game.spawn(p);
      return p;
    });
    this.emit('start',null);
  };
  JewelGame.prototype.markClear = function (p, cells) {
    p.chain++; p.clearCells = cells.map(function (cell) { return {x:cell.x,y:cell.y-HIDDEN}; });
    p.clearTicks = 40; p.status = 'clearing'; p.dropMatched = true;
    this.emit(p.chain > 1 ? 'chain' : 'clear', p, { count:cells.length, chain:p.chain });
  };
  JewelGame.prototype.finishDrop = function (p) {
    p.streak = p.dropMatched ? Math.min(9,p.streak+1) : Math.max(0,p.streak-2);
    // The stage's speed/palette changes after the magic column's entire
    // clear/cascade resolves, not when it first touches the stack.
    if (p.resolvingMagic) { p.speedLevel = p.level; p.resolvingMagic = false; }
    // Classic play awards one level per resolved column. Excess jewels remain
    // banked for the next magic column, instead of jumping several speeds now.
    if (p.levelCleared >= 70) { p.levelCleared -= 70; p.level++; p.pendingMagic++; this.emit('level',p); }
    // The magic reward precedes the hidden-row loss check. With a clear spawn
    // column, that earned magic column can rescue another overfilled column.
    if (!p.pendingMagic && p.hidden.some(function (row) { return row.some(Boolean); })) { this.topOut(p); return; }
    this.spawn(p);
  };
  JewelGame.prototype.lock = function (p) {
    var active = p.active, board = fullBoard(p), targetY = active.y + 3 + HIDDEN;
    var target = targetY < board.length ? board[targetY][active.x] : 0;
    for (var i = 0; i < 3; i++) board[active.y+i+HIDDEN][active.x] = active.colors[i];
    p.lastLockY = active.y+2; p.resolvingMagic = active.magic; p.active = null; this.emit('land',p);
    if (active.magic) {
      var cells = [];
      for (var y=0;y<board.length;y++) for(var x=0;x<WIDTH;x++) if (board[y][x] === 7 || (target > 0 && target < 7 && board[y][x] === target)) cells.push({x:x,y:y});
      this.markClear(p,cells);
    } else {
      var found = matches(board);
      if (found.length) this.markClear(p,found); else this.finishDrop(p);
    }
  };
  JewelGame.prototype.clearWave = function (p) {
    var board = fullBoard(p), count = p.clearCells.length;
    p.clearCells.forEach(function (cell) { board[cell.y+HIDDEN][cell.x] = 0; });
    p.score += waveScore(count,p.chain,p.streak,Math.min(9,Math.max(0,12-p.lastLockY)));
    p.cleared += count; p.levelCleared += count;
    this.highScore = Math.max(this.highScore,p.score);
    p.clearCells = [];
    p.gravityMoves = []; var distance = 0;
    for (var x=0;x<WIDTH;x++) {
      var dest = board.length-1;
      for (var y=board.length-1;y>=0;y--) if (board[y][x]) {
        p.gravityMoves.push({x:x,from:y-HIDDEN,to:dest-HIDDEN,color:board[y][x]});
        distance=Math.max(distance,dest-y);dest--;
      }
    }
    p.gravityDuration = p.gravityTicks = distance*4;
    if (distance) p.status='settling';
    else this.finishGravity(p);
  };
  JewelGame.prototype.finishGravity = function (p) {
    splitBoard(p,collapse(fullBoard(p))); p.gravityMoves=[];p.gravityTicks=0;
    var found = matches(fullBoard(p));
    if (found.length) this.markClear(p,found); else this.finishDrop(p);
  };
  JewelGame.prototype.move = function (p, dx) {
    if (p.active && this.canPlace(p,p.active.x+dx,p.active.y)) { p.active.x+=dx; this.emit('move',p); return true; }
    return false;
  };
  JewelGame.prototype.tickPlayer = function (p) {
    if (!p.joined || !p.alive) return;
    if (p.status === 'clearing') { if (--p.clearTicks <= 0) this.clearWave(p); return; }
    if (p.status === 'settling') { if (--p.gravityTicks <= 0) this.finishGravity(p); return; }
    if (!p.active) return;
    var input=p.input,last=p.last;
    if ((input.a&&!last.a)||(input.b&&!last.b)) {
      var c=p.active.colors;
      p.active.colors=input.select?[c[2],c[1],c[0]]:[c[2],c[0],c[1]];
      this.emit('rotate',p);
    }
    var dx=input.x<-.35?-1:input.x>.35?1:0;
    if (dx !== p.dx) { p.dx=dx;p.das=0;if(dx)this.move(p,dx); }
    else if(dx && ++p.das>=8) { p.das=0;this.move(p,dx); }
    if(input.y<.5)p.softArmed=true;
    var interval=input.y>.5&&p.softArmed?2:fallFrames(p.speedLevel);
    if (++p.fall >= interval) {
      p.fall=0;
      if (this.canPlace(p,p.active.x,p.active.y+1)) { p.active.y++; if(interval===2)this.emit('drop',p); }
      else this.lock(p);
    }
  };
  JewelGame.prototype.tick = function (inputs) {
    this.frame++;
    var game=this, start=false, select=false;
    this.players.forEach(function (p) {
      var raw=inputs.find(function (value) { return Number(value.id)===p.id; });
      p.input=raw&&raw.connected?{connected:true,x:Number(raw.x)||0,y:Number(raw.y)||0,a:!!raw.a,b:!!raw.b,start:!!raw.start,select:!!raw.select}:neutral();
      p.connected=p.input.connected;
      start=start||(p.input.start&&!p.last.start);select=select||(p.input.select&&!p.last.select);
    });
    if (this.phase==='title') {
      if (select) this.selectedPlayers=this.selectedPlayers===1?2:1;
      if (start) this.begin();
    } else if (this.phase==='gameover') {
      if(start){this.phase='title';this.players.forEach(function(p){p.joined=false;});}
    } else {
      var connected=this.players.filter(function(p){return p.joined&&p.alive;}).every(function(p){return p.connected;});
      if(!connected&&this.phase==='playing'){this.phase='paused';this.autoPaused=true;}
      else if(connected&&this.phase==='paused'&&this.autoPaused){this.phase='playing';this.autoPaused=false;start=false;}
      if(start&&connected){this.phase=this.phase==='paused'?'playing':'paused';this.autoPaused=false;}
      if(this.phase==='paused'&&select){this.muted=!this.muted;this.emit('mute',null);}
      if(this.phase==='playing')this.players.forEach(function(p){game.tickPlayer(p);});
    }
    this.players.forEach(function(p){p.last=Object.assign({},p.input);});
  };
  JewelGame.prototype.step = function (dt, inputs) {
    this.events=[];this.accumulator+=Math.min(.1,Math.max(0,Number(dt)||0));
    while(this.accumulator+1e-9>=1/FPS){this.accumulator-=1/FPS;this.tick(Array.isArray(inputs)?inputs:[]);}
  };
  JewelGame.prototype.status = function () {
    return {phase:this.phase,stage:this.players[0].level,selectedPlayers:this.selectedPlayers,muted:this.muted,players:this.players.map(function(p){return{id:p.id,joined:p.joined,alive:p.alive,score:p.score,level:p.level,cleared:p.cleared,chain:p.chain};})};
  };
  JewelGame.WIDTH=WIDTH;JewelGame.HEIGHT=HEIGHT;JewelGame.findMatches=matches;JewelGame.collapse=collapse;JewelGame.fallFrames=fallFrames;JewelGame.waveScore=waveScore;
  root.JewelGame=JewelGame;
  if(typeof module!=='undefined'&&module.exports)module.exports=JewelGame;
})(typeof window!=='undefined'?window:global);
