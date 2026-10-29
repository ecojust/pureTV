/* Original pixel artwork for the independently implemented classic block game. */
(function (root) {
  "use strict";
  var FONT = {
    " ": [0,0,0,0,0,0,0], "A": [14,17,17,31,17,17,17], "B": [30,17,17,30,17,17,30],
    "C": [14,17,16,16,16,17,14], "D": [30,17,17,17,17,17,30], "E": [31,16,16,30,16,16,31],
    "F": [31,16,16,30,16,16,16], "G": [14,17,16,23,17,17,15], "H": [17,17,17,31,17,17,17],
    "I": [31,4,4,4,4,4,31], "J": [7,2,2,2,18,18,12], "K": [17,18,20,24,20,18,17],
    "L": [16,16,16,16,16,16,31], "M": [17,27,21,21,17,17,17], "N": [17,25,21,19,17,17,17],
    "O": [14,17,17,17,17,17,14], "P": [30,17,17,30,16,16,16], "Q": [14,17,17,17,21,18,13],
    "R": [30,17,17,30,20,18,17], "S": [15,16,16,14,1,1,30], "T": [31,4,4,4,4,4,4],
    "U": [17,17,17,17,17,17,14], "V": [17,17,17,17,17,10,4], "W": [17,17,17,21,21,21,10],
    "X": [17,17,10,4,10,17,17], "Y": [17,17,10,4,4,4,4], "Z": [31,1,2,4,8,16,31],
    "0": [14,17,19,21,25,17,14], "1": [4,12,4,4,4,4,14], "2": [14,17,1,2,4,8,31],
    "3": [30,1,1,14,1,1,30], "4": [2,6,10,18,31,2,2], "5": [31,16,16,30,1,1,30],
    "6": [14,16,16,30,17,17,14], "7": [31,1,2,4,8,8,8], "8": [14,17,17,14,17,17,14],
    "9": [14,17,17,15,1,1,14], ":": [0,4,4,0,4,4,0], ".": [0,0,0,0,0,12,12],
    "-": [0,0,0,31,0,0,0], "/": [1,1,2,4,8,16,16], "+": [0,4,4,31,4,4,0],
    ">": [16,8,4,2,4,8,16], "<": [1,2,4,8,4,2,1], "!": [4,4,4,4,4,0,4]
  };
  var TYPES = ["T", "J", "Z", "O", "S", "L", "I"];
  var PALETTES = [
    ["#46a8ff", "#d5f2ff", "#1556b8"], ["#64c844", "#e2ffd3", "#24792c"],
    ["#b888ff", "#f1dfff", "#6436ab"], ["#52d8ce", "#d5fff1", "#1a847c"],
    ["#f2b347", "#fff1bb", "#a85623"], ["#ef727c", "#ffe0d6", "#a73555"],
    ["#6bc9ff", "#e3faff", "#2c68b4"], ["#f39bd0", "#ffe3f5", "#a34d89"],
    ["#b9d74e", "#f3ffd0", "#67872c"], ["#f17b3b", "#ffe6c7", "#a33f26"]
  ];
  function number(value, digits) {
    var text = String(Math.max(0, Math.floor(Number(value) || 0)));
    while (text.length < digits) text = "0" + text;
    return text;
  }
  function TetrisRenderer(canvas) {
    this.canvas = canvas;
    canvas.width = 256; canvas.height = 240;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.style.imageRendering = "pixelated";
  }
  TetrisRenderer.prototype.text = function (text, x, y, color, scale) {
    var ctx = this.ctx, size = scale || 1;
    ctx.fillStyle = color || "#eef2f6";
    String(text).toUpperCase().split("").forEach(function (letter, index) {
      var rows = FONT[letter] || FONT[" "];
      for (var row = 0; row < 7; row++) for (var col = 0; col < 5; col++)
        if (rows[row] & (1 << (4-col))) ctx.fillRect(x + (index*6+col)*size, y+row*size, size, size);
    });
  };
  TetrisRenderer.prototype.center = function (text, y, color, scale) {
    var size = scale || 1;
    this.text(text, Math.floor((256-(String(text).length*6-1)*size)/2), y, color, size);
  };
  TetrisRenderer.prototype.frame = function (x, y, width, height, color) {
    var ctx = this.ctx;
    ctx.fillStyle = "#070b19"; ctx.fillRect(x,y,width,height);
    ctx.fillStyle = color || "#6f7eaa"; ctx.fillRect(x,y,width,2); ctx.fillRect(x,y,2,height);
    ctx.fillStyle = "#273656"; ctx.fillRect(x,y+height-2,width,2); ctx.fillRect(x+width-2,y,2,height);
    ctx.fillStyle = "#aab6ce"; ctx.fillRect(x+2,y+2,width-4,1); ctx.fillRect(x+2,y+2,1,height-4);
    ctx.fillStyle = "#38466b"; ctx.fillRect(x+3,y+height-4,width-6,1); ctx.fillRect(x+width-4,y+3,1,height-6);
  };
  TetrisRenderer.prototype.block = function (x, y, type, level, size) {
    var ctx = this.ctx, width = size || 8;
    var palette = PALETTES[(Math.max(0,level || 0)) % PALETTES.length];
    var index = typeof type === "number" ? type-1 : TYPES.indexOf(type);
    if (index < 0) index = 0;
    ctx.fillStyle = "#040711"; ctx.fillRect(x,y,width,width);
    ctx.fillStyle = palette[2]; ctx.fillRect(x+1,y+1,width-1,width-1);
    ctx.fillStyle = index % 3 === 1 ? palette[1] : palette[0]; ctx.fillRect(x+1,y+1,width-2,width-2);
    ctx.fillStyle = palette[1]; ctx.fillRect(x+1,y+1,width-2,1); ctx.fillRect(x+1,y+1,1,width-2);
    if (index % 3 === 1 && width >= 6) {
      ctx.fillStyle = palette[0]; ctx.fillRect(x+3,y+3,width-5,width-5);
    }
  };
  TetrisRenderer.prototype.piece = function (type, rotation, x, y, level, size) {
    if (!type || !root.TetrisRules) return;
    var renderer = this, cells = root.TetrisRules.cells(type, rotation || 0);
    cells.forEach(function (cell) { renderer.block(x+cell[0]*size,y+cell[1]*size,type,level,size); });
  };
  TetrisRenderer.prototype.preview = function (type, x, y, width, height, level, size) {
    if (!type || !root.TetrisRules) return;
    var cells = root.TetrisRules.cells(type,0), left=4, top=4, right=0, bottom=0;
    cells.forEach(function (cell) { left=Math.min(left,cell[0]); top=Math.min(top,cell[1]); right=Math.max(right,cell[0]); bottom=Math.max(bottom,cell[1]); });
    var px = Math.floor(x+(width-(right-left+1)*size)/2)-left*size;
    var py = Math.floor(y+(height-(bottom-top+1)*size)/2)-top*size;
    this.piece(type,0,px,py,level,size);
  };
  TetrisRenderer.prototype.board = function (player, x, y, frame) {
    var ctx = this.ctx, renderer = this;
    this.frame(x-4,y-4,88,168);
    ctx.fillStyle = "#02040c"; ctx.fillRect(x,y,80,160);
    for (var row=0; row<20; row++) for (var col=0; col<10; col++) {
      var value = player.board && player.board[row] && player.board[row][col];
      if (value) this.block(x+col*8,y+row*8,value,player.level,8);
    }
    if (player.piece && player.alive) {
      var p=player.piece;
      root.TetrisRules.cells(p.type,p.rotation).forEach(function(cell){
        var cx=p.x+cell[0],cy=p.y+cell[1];
        if(cx>=0&&cx<10&&cy>=0&&cy<20) renderer.block(x+cx*8,y+cy*8,p.type,player.level,8);
      });
    }
    if (player.clearTimer>0 && player.clearRows) {
      ctx.fillStyle = player.clearRows.length === 4 && Math.floor(frame/3)%2 ? "#eef8ff" : "#02040c";
      var spread=Math.min(40,Math.max(8,Math.floor((22-player.clearTimer)/4)*8));
      player.clearRows.forEach(function(row){ctx.fillRect(x+40-spread,y+row*8,spread*2,8);});
    }
    if (player.completed) {
      ctx.fillStyle="#071a20";ctx.fillRect(x,y+59,80,33);
      this.text("CLEAR!",x+22,y+67,"#9ce9ba");
      this.text("25 LINES",x+16,y+80,"#becbdf");
    }
    if (player.joined && !player.alive) {
      ctx.fillStyle="rgba(3,5,16,0.8)";ctx.fillRect(x,y+59,80,33);
      this.text("TOP OUT",x+19,y+67,"#f39183");
      this.text("P"+player.id,x+34,y+80,"#becbdf");
    }
  };
  TetrisRenderer.prototype.title = function (game) {
    var ctx=this.ctx;
    ctx.fillStyle="#101a35";ctx.fillRect(0,0,256,240);
    for(var row=0;row<15;row++)for(var col=0;col<16;col++){
      ctx.fillStyle=(row+col)%2?"#14203e":"#111c38";ctx.fillRect(col*16+(row%2?-8:0),row*16,15,15);
    }
    this.frame(14,12,228,216,"#a8b5d0");
    ctx.fillStyle="#122b55";ctx.fillRect(19,17,218,64);
    var label="TETRIS",colors=["#e9f5ff","#75baff","#e9f5ff","#75baff","#e9f5ff","#75baff"];
    for(var i=0;i<label.length;i++){
      this.text(label[i],58+i*24,30,"#233e78",4);
      this.text(label[i],56+i*24,28,colors[i],4);
    }
    this.center("CLASSIC BLOCK PUZZLE",66,"#789bc4");
    this.center((game.mode || "A")+"-TYPE",91,"#f2c681");
    this.text(game.selectedPlayers===2?" ":">",57,111,"#74c3ff");
    this.text("1 PLAYER",73,111,"#e6edf7");
    this.text(game.selectedPlayers===2?">":" ",57,126,"#74c3ff");
    this.text("2 PLAYERS",73,126,"#e6edf7");
    this.text("LEVEL",67,150,"#9db2d0");
    this.text("< "+number(game.startLevel,2)+" >",113,150,"#f1c67d");
    this.center(game.mode === "B" ? "HEIGHT < "+game.startHeight+" >  UP/DOWN" : "LEFT/RIGHT LEVEL",168,"#738da9");
    this.center("A/B TYPE  SELECT PLAYERS",180,"#738da9");
    if(Math.floor((game.frame||0)/30)%2===0)this.center("PRESS START",201,"#f0f5ff");
    this.center(game.mode === "B" ? "CLEAR 25 LINES AT A FIXED SPEED" : "LOCAL TWO-PLAYER SCORE CHALLENGE",232,"#6985a8");
  };
  TetrisRenderer.prototype.single = function (game) {
    var p=game.players[0],ctx=this.ctx;
    this.text("TETRIS",12,13,"#85b8ed",2);
    this.text(game.mode === "B" ? "LEFT" : "LINES",88,23,"#e3ebf8");this.text(number(game.mode === "B" ? Math.max(0,25-p.cleared) : p.cleared,3),128,23,"#f5cb82");
    this.frame(6,42,72,170);
    this.text("STATISTICS",12,49,"#9bafd0");
    for(var i=0;i<TYPES.length;i++){
      var type=TYPES[i];
      this.preview(type,12,64+i*20,29,17,p.level,5);
      this.text(number(p.statistics&&p.statistics[type],3),48,70+i*20,"#c1cfe2");
    }
    this.board(p,88,48,game.frame);
    this.text("TOP",182,10,"#93b0d8");this.text(number(Math.max(game.highScore||0,p.score),7),182,21,"#efdcaf");
    this.text("SCORE",182,42,"#93b0d8");this.text(number(p.score,7),182,53,"#f3f5f8");
    this.frame(178,78,71,59);this.text("NEXT",186,85,"#b6cbe9");
    this.preview(p.nextType,184,99,58,29,p.level,8);
    this.text("LEVEL",182,153,"#93b0d8");this.text(number(p.level,2),194,166,"#e6edf8",2);
    this.text(game.mode === "B" ? "B HEIGHT" : "1 PLAYER",181,195,"#7f9cc3");
    if(game.mode === "B")this.text(number(game.startHeight,1),207,207,"#f5cb82");
    ctx.fillStyle="#253454";ctx.fillRect(8,219,240,1);
    this.center("A CW  B CCW  DOWN SOFT DROP",225,"#7894b4");
  };
  TetrisRenderer.prototype.dual = function (game) {
    this.center(game.mode === "B" ? "B-TYPE  25 LINE CHALLENGE" : "TETRIS  2P CHALLENGE",7,"#bdd8f8");
    for(var i=0;i<2;i++){
      var p=game.players[i],x=i?152:24,label=i?"#efba79":"#75c4ef";
      this.text("P"+(i+1),x,25,label);this.text(number(p.score,7),x+25,25,"#e5edf7");
      this.text("L"+number(p.level,2),x,36,"#8ea9ca");this.text((game.mode === "B" ? "LEFT " : "ROWS ")+number(game.mode === "B" ? Math.max(0,25-p.cleared) : p.cleared,3),x+27,36,"#a9c0da");
      this.board(p,x,48,game.frame);
      this.text("NEXT",x,219,"#8ea9ca");
      this.preview(p.nextType,x+33,215,42,20,p.level,5);
    }
    this.text("SAME",113,90,"#7089a7");this.text("PIECE",113,103,"#7089a7");this.text("ORDER",113,116,"#7089a7");
    this.text("VS",122,148,"#9fb7d6");
  };
  TetrisRenderer.prototype.overlay = function (game) {
    var ctx=this.ctx;
    ctx.fillStyle="rgba(3,7,20,0.84)";ctx.fillRect(38,91,180,59);
    ctx.strokeStyle="#728db5";ctx.lineWidth=1;ctx.strokeRect(38.5,91.5,179,58);
    var cleared = game.players.some(function(p){return p.joined && p.completed;});
    this.center(game.phase==="paused"?"PAUSED":cleared?"CHALLENGE CLEAR":"GAME OVER",102,"#eaf2ff",2);
    var message=game.phase==="paused"?(game.pauseReason==="disconnect"?"RECONNECT CONTROLLERS":"START TO RESUME"):"START FOR TITLE";
    this.center(message,126,"#a8bbd3");
    if(game.phase==="paused")this.center("SELECT: MUSIC "+(game.music?"ON":"OFF"),139,"#7a9ac1");
  };
  TetrisRenderer.prototype.draw = function (game) {
    this.ctx.imageSmoothingEnabled=false;
    this.ctx.fillStyle="#101a31";this.ctx.fillRect(0,0,256,240);
    if(game.phase==="title"){this.title(game);return;}
    if(game.selectedPlayers===2)this.dual(game);else this.single(game);
    if(game.phase==="paused"||game.phase==="gameover")this.overlay(game);
  };
  root.TetrisRenderer=TetrisRenderer;
  if(typeof module!=="undefined"&&module.exports)module.exports={TetrisRenderer:TetrisRenderer,FONT:FONT};
})(typeof window!=="undefined"?window:global);
