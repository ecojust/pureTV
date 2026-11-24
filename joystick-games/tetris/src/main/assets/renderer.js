/* Original pixel artwork for the independently implemented classic block game. */
(function (root) {
  "use strict";
  var SMALL_FONT = {
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
  // NES-sized, heavy 8-pixel HUD cells; the statistics heading has its own
  // narrow lettering, as in the Nintendo screen. These are newly drawn masks.
  var FONT = {
    " ":[0,0,0,0,0,0,0], A:[56,108,198,198,254,198,198], B:[252,102,102,124,102,102,252],
    C:[60,102,192,192,192,102,60], D:[248,108,102,102,102,108,248], E:[254,192,192,248,192,192,254],
    F:[254,192,192,248,192,192,192], G:[60,102,192,206,198,102,62], H:[198,198,198,254,198,198,198],
    I:[126,24,24,24,24,24,126], J:[30,6,6,6,198,198,124], K:[198,204,216,240,216,204,198],
    L:[192,192,192,192,192,192,254], M:[198,238,254,214,198,198,198], N:[198,230,246,222,206,198,198],
    O:[124,198,198,198,198,198,124], P:[252,198,198,252,192,192,192], Q:[124,198,198,198,214,204,122],
    R:[252,198,198,252,216,204,198], S:[124,198,192,124,6,198,124], T:[126,24,24,24,24,24,24],
    U:[198,198,198,198,198,198,124], V:[198,198,198,198,108,56,16], W:[198,198,198,214,254,238,198],
    X:[198,108,56,56,56,108,198], Y:[102,102,102,60,24,24,24], Z:[254,12,24,48,96,192,254],
    "0":[124,198,206,214,230,198,124], "1":[24,56,24,24,24,24,126], "2":[124,198,6,28,48,96,254],
    "3":[124,198,6,60,6,198,124], "4":[28,60,108,204,254,12,12], "5":[254,192,248,12,6,204,120],
    "6":[60,96,192,252,198,198,124], "7":[254,198,12,24,48,48,48], "8":[124,198,198,124,198,198,124],
    "9":[124,198,198,126,6,12,120], ":":[0,24,24,0,24,24,0], ".":[0,0,0,0,0,24,24],
    "-":[0,0,0,126,0,0,0], "/":[6,12,24,48,96,192,128], "+":[0,24,24,126,24,24,0],
    ">":[96,48,24,12,24,48,96], "<":[6,12,24,48,24,12,6], "!":[24,24,24,24,24,0,24]
  };
  var TYPES = ["T", "J", "Z", "O", "S", "L", "I"];
  // Two saturated NES-like colors plus white; a level changes the entire
  // tetromino palette, never assigning the modern seven rainbow colors.
  var PALETTES = [
    ["#0000fc", "#fcfcfc", "#3cbcfc"], ["#00a800", "#fcfcfc", "#b8f818"],
    ["#d800cc", "#fcfcfc", "#f878f8"], ["#0000fc", "#fcfcfc", "#58d854"],
    ["#e40058", "#fcfcfc", "#58f898"], ["#58f898", "#fcfcfc", "#6888fc"],
    ["#e40058", "#fcfcfc", "#787878"], ["#6844fc", "#fcfcfc", "#a80020"],
    ["#0000fc", "#fcfcfc", "#f83800"], ["#f83800", "#fcfcfc", "#fca044"]
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
    var ctx=this.ctx,size=scale||1;
    ctx.fillStyle=color||"#fcfcfc";
    String(text).toUpperCase().split("").forEach(function(letter,index){
      var rows=FONT[letter]||FONT[" "];
      for(var row=0;row<7;row++)for(var col=0;col<8;col++)
        if(rows[row]&(1<<(7-col)))ctx.fillRect(x+(index*8+col)*size,y+row*size,size,size);
    });
  };
  TetrisRenderer.prototype.smallText = function(text,x,y,color){
    var ctx=this.ctx;ctx.fillStyle=color||"#fcfcfc";
    String(text).toUpperCase().split("").forEach(function(letter,index){
      var rows=SMALL_FONT[letter]||SMALL_FONT[" "];
      for(var row=0;row<7;row++)for(var col=0;col<5;col++)
        if(rows[row]&(1<<(4-col)))ctx.fillRect(x+index*6+col,y+row,1,1);
    });
  };
  TetrisRenderer.prototype.center = function(text,y,color,scale){
    var size=scale||1;
    this.text(text,Math.floor((256-String(text).length*8*size)/2),y,color,size);
  };
  TetrisRenderer.prototype.background = function(){
    var c=this.ctx,pattern=["10111010","10100010","11101111","00101000","11101110","10001010","10111011","10100001"];
    c.fillStyle="#000000";c.fillRect(0,0,256,240);
    for(var y=0;y<30;y++)for(var x=0;x<32;x++){
      if(pattern[y%8][x%8]!=="1")continue;
      var left=pattern[y%8][(x+7)%8]!=="1",top=pattern[(y+7)%8][x%8]!=="1";
      var right=pattern[y%8][(x+1)%8]!=="1",bottom=pattern[(y+1)%8][x%8]!=="1";
      c.fillStyle="#646464";c.fillRect(x*8,y*8,8,8);
      c.fillStyle="#bcbcbc";if(top)c.fillRect(x*8,y*8,8,1);if(left)c.fillRect(x*8,y*8,1,8);
      c.fillStyle="#8caaaa";if(top)c.fillRect(x*8+1,y*8+1,7,1);if(left)c.fillRect(x*8+1,y*8+1,1,7);
      c.fillStyle="#242424";if(bottom)c.fillRect(x*8,y*8+7,8,1);if(right)c.fillRect(x*8+7,y*8,1,8);
    }
  };
  TetrisRenderer.prototype.frame = function(x,y,width,height){
    var c=this.ctx;
    c.fillStyle="#bcbcbc";c.fillRect(x,y,width,height);
    c.fillStyle="#242424";c.fillRect(x+1,y+1,width-2,height-2);
    c.fillStyle="#8caaaa";c.fillRect(x+2,y+2,width-4,height-4);
    c.fillStyle="#000000";c.fillRect(x+3,y+3,width-6,height-6);
    c.fillStyle="#bcbcbc";c.fillRect(x+4,y+4,width-8,1);c.fillRect(x+4,y+4,1,height-8);
  };
  TetrisRenderer.prototype.block = function(x,y,type,level,size){
    var c=this.ctx,w=size||8,p=PALETTES[Math.max(0,level||0)%10];
    var index=typeof type==="number"?type-1:TYPES.indexOf(type),style=[0,1,2,0,1,2,0][Math.max(0,index)]||0;
    c.fillStyle="#000000";c.fillRect(x,y,w,w);
    c.fillStyle=style===2?p[2]:p[0];c.fillRect(x+1,y+1,w-1,w-1);
    c.fillStyle=style===0?p[1]:p[2];c.fillRect(x+1,y+1,w-2,1);c.fillRect(x+1,y+1,1,w-2);
    if(style===0){c.fillStyle=p[1];c.fillRect(x+2,y+2,Math.max(1,w-4),Math.max(1,w-4));}
    else {c.fillStyle=p[1];c.fillRect(x+2,y+2,1,1);}
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
    ctx.fillStyle = "#000000"; ctx.fillRect(x,y,80,160);
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
      ctx.fillStyle = player.clearRows.length === 4 && Math.floor(frame/3)%2 ? "#eef8ff" : "#000000";
      // clearTimer reaches 16/12/8/4/0 on global four-frame boundaries.
      // Do not erase the center pair before the first animation step.
      var spread=Math.min(40,Math.max(0,Math.floor((20-player.clearTimer)/4)*8));
      player.clearRows.forEach(function(row){ctx.fillRect(x+40-spread,y+row*8,spread*2,8);});
    }
    if (player.completed) {
      ctx.fillStyle="#071a20";ctx.fillRect(x,y+59,80,33);
      this.text("CLEAR!",x+16,y+67,"#fcfcfc");
      this.text("25 LINES",x+8,y+80,"#bcbcbc");
    }
    if (player.joined && !player.alive) {
      ctx.fillStyle="rgba(3,5,16,0.8)";ctx.fillRect(x,y+59,80,33);
      this.text("TOP OUT",x+12,y+67,"#f83800");
      this.text("P"+player.id,x+32,y+80,"#bcbcbc");
    }
  };
  TetrisRenderer.prototype.title = function(game){
    this.background();this.frame(16,16,224,208);
    this.center("TETRIS",32,"#fcfcfc",3);
    this.center((game.mode||"A")+"-TYPE",72,"#fcfcfc");
    this.text(game.selectedPlayers===2?" ":">",56,96,"#fcfcfc");this.text("1 PLAYER",80,96);
    this.text(game.selectedPlayers===2?">":" ",56,112,"#fcfcfc");this.text("2 PLAYERS",80,112);
    this.center("LEVEL < "+number(game.startLevel,2)+" >",140,"#fcfcfc");
    this.center(game.mode==="B"?"HEIGHT < "+game.startHeight+" >":"LEFT/RIGHT LEVEL",160,"#bcbcbc");
    this.smallText("A/B TYPE   SELECT PLAYERS",56,181,"#bcbcbc");
    if(Math.floor((game.frame||0)/30)%2===0)this.center("PRESS START",200,"#fcfcfc");
  };
  TetrisRenderer.prototype.single = function(game){
    var p=game.players[0],mode=game.mode||"A";
    this.frame(16,24,64,24);this.text(mode+"-TYPE",24,32);
    this.frame(88,16,96,24);
    this.text((mode==="B"?"LEFT-":"LINES-")+number(mode==="B"?Math.max(0,25-p.cleared):p.cleared,3),104,24);
    this.frame(8,64,80,152);this.smallText("STATISTICS",18,72,"#fcfcfc");
    for(var i=0;i<TYPES.length;i++){
      var type=TYPES[i];this.preview(type,20,88+i*17,24,15,p.level,4);
      this.text(number(p.statistics&&p.statistics[type],3),48,92+i*17,"#f83800");
    }
    this.board(p,96,48,game.frame);
    this.frame(184,16,64,72);this.text("TOP",192,32);
    var top=number(Math.max(game.highScore||0,p.score),6),score=number(p.score,6);
    if(top.length>6)this.smallText(top,192,40);else this.text(top,192,40);
    this.text("SCORE",192,56);if(score.length>6)this.smallText(score,192,64);else this.text(score,192,64);
    this.frame(184,96,48,48);this.text("NEXT",192,104);this.preview(p.nextType,190,116,36,20,p.level,8);
    this.frame(184,152,56,32);this.text("LEVEL",192,160);this.text(number(p.level,2),208,168);
    if(mode==="B"){this.frame(184,192,64,24);this.smallText("HEIGHT "+game.startHeight,192,200);}
  };
  TetrisRenderer.prototype.dual = function(game){
    this.frame(12,0,232,44);this.center((game.mode||"A")+"-TYPE  2P CHALLENGE",8);
    for(var i=0;i<2;i++){
      var p=game.players[i],x=i?156:20;
      this.smallText("P"+(i+1),x,24,i?"#fca044":"#3cbcfc");this.smallText(number(p.score,7),x+27,24);
      this.smallText("L"+number(p.level,2),x,33);this.smallText((game.mode==="B"?"LEFT ":"ROWS ")+number(game.mode==="B"?Math.max(0,25-p.cleared):p.cleared,3),x+30,33);
      this.board(p,x,52,game.frame);this.frame(x-4,216,88,24);this.smallText("NEXT",x,224);this.preview(p.nextType,x+33,218,42,20,p.level,5);
    }
    this.frame(108,80,40,88);this.smallText("SAME",116,96);this.smallText("PIECE",113,109);this.smallText("ORDER",113,122);this.text("VS",120,148);
  };
  TetrisRenderer.prototype.overlay = function (game) {
    var ctx=this.ctx;
    ctx.fillStyle="rgba(3,7,20,0.84)";ctx.fillRect(12,91,232,59);
    ctx.strokeStyle="#728db5";ctx.lineWidth=1;ctx.strokeRect(12.5,91.5,231,58);
    var cleared = game.players.some(function(p){return p.joined && p.completed;});
    this.center(game.phase==="paused"?"PAUSED":cleared?"CHALLENGE CLEAR":"GAME OVER",102,"#fcfcfc",cleared?1:2);
    var message=game.phase==="paused"?(game.pauseReason==="disconnect"?"RECONNECT CONTROLLERS":"START TO RESUME"):"START FOR TITLE";
    this.center(message,126,"#a8bbd3");
    if(game.phase==="paused")this.center("SELECT: MUSIC "+(game.music?"ON":"OFF"),139,"#7a9ac1");
  };
  TetrisRenderer.prototype.draw = function (game) {
    this.ctx.imageSmoothingEnabled=false;
    this.background();
    if(game.phase==="title"){this.title(game);return;}
    if(game.selectedPlayers===2)this.dual(game);else this.single(game);
    if(game.phase==="paused"||game.phase==="gameover")this.overlay(game);
  };
  root.TetrisRenderer=TetrisRenderer;
  if(typeof module!=="undefined"&&module.exports)module.exports={TetrisRenderer:TetrisRenderer,FONT:FONT};
})(typeof window!=="undefined"?window:global);
