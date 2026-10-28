/* Independently written NES-style falling-block rules; see docs/reference.md.
 * Fixed NTSC ticks, Nintendo right-handed orientations, no ROM or emulator. */
(function (root) {
  "use strict";
  const TYPES = ["T", "J", "Z", "O", "S", "L", "I"];
  // Explicit Nintendo orientations, not SRS matrices. S/Z and I use two states.
  // Four-cell coordinates retain the original right-hand alignment on rotation.
  const SHAPES = {
    T: [ [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]],
      [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]] ],
    J: [ [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]],
      [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]] ],
    Z: [ [[0,1],[1,1],[1,2],[2,2]], [[2,0],[1,1],[2,1],[1,2]] ],
    O: [ [[1,1],[2,1],[1,2],[2,2]] ],
    S: [ [[1,1],[2,1],[0,2],[1,2]], [[1,0],[1,1],[2,1],[2,2]] ],
    L: [ [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]],
      [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]] ],
    I: [ [[0,2],[1,2],[2,2],[3,2]], [[2,0],[2,1],[2,2],[2,3]] ],
  };
  const FPS = 60.0988, TICK = 1 / FPS, WIDTH = 10, HEIGHT = 20;
  const SPEEDS = [48,43,38,33,28,23,18,13,8,6,5,5,5,4,4,4,3,3,3];
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const cells = (type, rotation) => SHAPES[type][((rotation % SHAPES[type].length) + SHAPES[type].length) % SHAPES[type].length];
  const gravity = level => level < 19 ? SPEEDS[Math.max(0, level | 0)] : level < 29 ? 2 : 1;
  const transitionLines = level => Math.min((level + 1) * 10, Math.max(100, level * 10 - 50));
  function emptyBoard() { return Array.from({length: HEIGHT}, () => Array(WIDTH).fill(0)); }
  function neutral() { return {connected: false, x: 0, y: 0, a: false, b: false, start: false, select: false}; }
  function normalize(value) {
    value = value || {};
    return { connected: !!value.connected, x: Number(value.x) > .35 ? 1 : Number(value.x) < -.35 ? -1 : 0,
      y: Number(value.y) > .35 ? 1 : Number(value.y) < -.35 ? -1 : 0,
      a: !!value.a, b: !!value.b, start: !!value.start, select: !!value.select };
  }
  class PieceSequence {
    constructor(seed) { this.seed = seed >>> 0 || 0x6d2b79f5; this.previous = -1; }
    random(bound) {
      // A deterministic local generator, with NES's one-retry piece selection.
      let value = this.seed; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      this.seed = value >>> 0; return this.seed % bound;
    }
    next() {
      let index = this.random(8);
      if (index === 7 || index === this.previous) index = this.random(7);
      this.previous = index; return TYPES[index];
    }
  }
  function player(id, level, seed) {
    const sequence = new PieceSequence(seed);
    return { id, joined: false, alive: false, connected: false, board: emptyBoard(), piece: null,
      sequence, nextType: sequence.next(), score: 0, level, startLevel: level, cleared: 0,
      statistics: {T:0,J:0,Z:0,O:0,S:0,L:0,I:0}, clearRows: [], clearTimer: 0, clearDuration: 0,
      entryTimer: 0, entryDuration: 10, gravityTimer: 0, softTimer: 0, softCells: 0,
      dasCharge: 0, previous: neutral(), lockedPieces: 0 };
  }
  class TetrisGame {
    constructor(options) {
      options = options || {};
      this.seed = options.seed == null ? (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0 : options.seed >>> 0;
      this.highScore = Math.max(0, Number(options.highScore) || 0);
      this.saveHighScore = typeof options.saveHighScore === "function" ? options.saveHighScore : null;
      this.phase = "title"; this.selectedPlayers = 1; this.startLevel = 0; this.music = true;
      this.frame = 0; this.accumulator = 0; this.events = []; this.eventId = 0;
      this.pauseReason = ""; this.menuDirection = 0; this.menuTimer = 0;
      this.players = [player(1,0,this.seed), player(2,0,this.seed)];
      this.round = 0;
    }
    emit(type, p, lines) {
      this.events.push({id: ++this.eventId, type, player: p ? p.id : 0, lines: lines || 0});
      if (this.events.length > 96) this.events.shift();
    }
    updateRecord(p) {
      if (p.score <= this.highScore) return;
      this.highScore = p.score;
      if (this.saveHighScore) { try { this.saveHighScore(this.highScore); } catch (_) {} }
    }
    collides(p, piece) {
      return cells(piece.type, piece.rotation).some(cell => {
        const x = piece.x + cell[0], y = piece.y + cell[1];
        return x < 0 || x >= WIDTH || y < -2 || y >= HEIGHT || (y >= 0 && p.board[y][x] !== 0);
      });
    }
    spawn(p) {
      const type = p.nextType;
      p.nextType = p.sequence.next();
      // NES uses a pivot at (5,0); all four spawn cells begin in visible rows.
      p.piece = {type, rotation: 0, x: type === "I" || type === "O" ? 3 : 4, y: type === "I" ? -2 : -1};
      p.gravityTimer = 0; p.softTimer = 0; p.softCells = 0;
      if (this.collides(p,p.piece)) {
        p.alive = false; p.piece = null; this.emit("gameover",p); this.updateRecord(p);
      } else { p.statistics[type]++; }
    }
    start(inputs) {
      const roundSeed = this.seed ^ Math.imul(this.round++,0x9e3779b9);
      this.players = [player(1,this.startLevel,roundSeed), player(2,this.startLevel,roundSeed)];
      this.players.forEach((p,index) => {
        p.joined = index < this.selectedPlayers; p.alive = p.joined;
        p.previous = Object.assign({}, inputs[index]); p.connected = inputs[index].connected;
        if (p.joined) this.spawn(p);
      });
      this.phase = "playing"; this.pauseReason = ""; this.emit("start");
    }
    shift(p, amount) {
      if (!p.piece) return false;
      const next = Object.assign({},p.piece,{x:p.piece.x+amount});
      if (this.collides(p,next)) return false;
      p.piece = next; this.emit("move",p); return true;
    }
    rotate(p, amount) {
      if (!p.piece || p.piece.type === "O") return false;
      const next = Object.assign({},p.piece,{rotation:(p.piece.rotation+amount+SHAPES[p.piece.type].length)%SHAPES[p.piece.type].length});
      if (this.collides(p,next)) return false;
      p.piece = next; this.emit("rotate",p); return true;
    }
    lock(p, softHeld) {
      const piece = p.piece; let bottom = 0;
      cells(piece.type,piece.rotation).forEach(cell => {
        const x = piece.x+cell[0], y = piece.y+cell[1]; bottom = Math.max(bottom,y);
        // Like NES Tetris, cells above the visible playfield are not stored.
        if (y >= 0 && y < HEIGHT) p.board[y][x] = TYPES.indexOf(piece.type)+1;
      });
      if (softHeld) p.score += p.softCells;
      p.piece = null; p.lockedPieces++; p.softCells = 0; this.emit("lock",p);
      p.clearRows = [];
      for (let y=0;y<HEIGHT;y++) if (p.board[y].every(value=>value!==0)) p.clearRows.push(y);
      p.entryDuration = Math.min(18,10+2*Math.floor((21-bottom)/4));
      if (p.clearRows.length) {
        p.clearDuration = p.clearTimer = 20-(this.frame%4);
        this.emit("clear",p,p.clearRows.length);
      } else { p.entryTimer = p.entryDuration; }
      this.updateRecord(p);
    }
    finishClear(p) {
      const count = p.clearRows.length;
      p.board = p.board.filter((row,index)=>p.clearRows.indexOf(index)===-1);
      while (p.board.length < HEIGHT) p.board.unshift(Array(WIDTH).fill(0));
      p.cleared += count;
      const transition = transitionLines(p.startLevel);
      const level = p.cleared < transition ? p.startLevel : p.startLevel+1+Math.floor((p.cleared-transition)/10);
      if (level > p.level) this.emit("level",p);
      p.level = level;
      // Nintendo awards the multiplier using the level after the line clear.
      p.score += [0,40,100,300,1200][count] * (p.level+1);
      p.clearRows = []; p.clearTimer = 0; p.entryTimer = p.entryDuration;
      this.updateRecord(p);
    }
    advancePlayer(p, input) {
      if (!p.alive) return;
      if (p.clearTimer > 0) { if (--p.clearTimer===0) this.finishClear(p); return; }
      if (p.entryTimer > 0) { if (--p.entryTimer===0) this.spawn(p); return; }
      if (!p.piece) return;
      if (input.a && !p.previous.a) this.rotate(p,1);
      else if (input.b && !p.previous.b) this.rotate(p,-1);
      if (input.x !== 0) {
        if (input.x !== p.previous.x) {
          p.dasCharge = this.shift(p,input.x) ? 0 : 16;
        } else {
          p.dasCharge = Math.min(16,p.dasCharge+1);
          if (p.dasCharge===16 && this.shift(p,input.x)) p.dasCharge -= 6;
        }
      }
      if (input.y <= 0) { p.softTimer = 0; p.softCells = 0; }
      else p.softTimer++;
      p.gravityTimer++;
      const autoDrop = p.gravityTimer >= gravity(p.level);
      const softDrop = input.y > 0 && p.softTimer >= 2;
      if (autoDrop || softDrop) {
        const next = Object.assign({},p.piece,{y:p.piece.y+1});
        p.gravityTimer = 0; p.softTimer = 0;
        if (this.collides(p,next)) this.lock(p,input.y>0);
        else { p.piece = next; if (softDrop) p.softCells++; }
      }
    }
    tick(inputs) {
      this.frame++;
      const current = this.players.map(p=>normalize(inputs.find(value=>value && Number(value.id)===p.id)));
      const edge = action => current.some((value,index)=>value.connected && value[action] && !this.players[index].previous[action]);
      this.players.forEach((p,index)=>{p.connected=current[index].connected;});
      if (this.phase === "title") {
        if (edge("select")) { this.selectedPlayers = this.selectedPlayers===1 ? 2 : 1; this.emit("move"); }
        const index = current.findIndex(input=>input.connected && (input.x || input.y));
        const input = index >= 0 ? current[index] : neutral();
        const previous = index >= 0 ? this.players[index].previous : neutral();
        if (input.y && input.y !== previous.y) { this.startLevel=clamp(this.startLevel+(input.y>0?10:-10),0,19); this.emit("move"); }
        if (!input.x) { this.menuDirection=0;this.menuTimer=0; }
        else if (input.x!==this.menuDirection) {
          this.startLevel=clamp(this.startLevel+input.x,0,19); this.menuDirection=input.x;this.menuTimer=0;this.emit("move");
        } else if (++this.menuTimer>=16 && (this.menuTimer-16)%6===0) {
          this.startLevel=clamp(this.startLevel+input.x,0,19);this.emit("move");
        }
        if (edge("start")) this.start(current);
      } else if (this.phase === "gameover") {
        if (edge("start")) { this.phase="title";this.pauseReason=""; }
      } else {
        const missing = this.players.some((p,index)=>p.joined && p.alive && !current[index].connected);
        if (edge("select")) this.music = !this.music;
        if (missing && this.phase === "playing") { this.phase="paused";this.pauseReason="disconnect"; }
        else if (!missing && this.phase === "paused" && this.pauseReason === "disconnect") {
          this.phase="playing";this.pauseReason="";
          this.players.forEach((p,index)=>{p.previous=Object.assign({},current[index]);});
        } else if (edge("start") && !missing) {
          this.phase=this.phase==="paused"?"playing":"paused";this.pauseReason=this.phase==="paused"?"manual":"";
        }
        if (this.phase === "playing") {
          this.players.forEach((p,index)=>{if(p.joined) this.advancePlayer(p,current[index]);});
          if (this.players.filter(p=>p.joined).every(p=>!p.alive)) this.phase="gameover";
        }
      }
      this.players.forEach((p,index)=>{p.previous=Object.assign({},current[index]);});
    }
    step(dt, inputs) {
      this.accumulator += clamp(Number(dt)||0,0,.1);
      inputs = Array.isArray(inputs) ? inputs : [];
      while (this.accumulator >= TICK) { this.accumulator-=TICK;this.tick(inputs); }
    }
    status() {
      return {phase:this.phase,stage:(this.players[0].joined?this.players[0].level:this.startLevel)+1,
        selectedPlayers:this.selectedPlayers,music:this.music,highScore:this.highScore,
        players:this.players.map(p=>({id:p.id,joined:p.joined,alive:p.alive,connected:p.connected,score:p.score,level:p.level,cleared:p.cleared}))};
    }
  }
  const rules = {TYPES,cells,gravity,transitionLines,emptyBoard,PieceSequence,FPS,TICK,WIDTH,HEIGHT};
  if (typeof module !== "undefined" && module.exports) module.exports={TetrisGame,TetrisRules:rules};
  else {root.TetrisGame=TetrisGame;root.TetrisRules=rules;}
})(typeof window !== "undefined" ? window : global);
