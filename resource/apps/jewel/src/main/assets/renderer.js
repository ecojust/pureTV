/* Original pixel artwork and bitmap lettering for the independent Jewel TV game. */
(function (root) {
  "use strict";
  const FONT = {
    A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
    D: [30,17,17,17,17,17,30], E: [31,16,16,30,16,16,31], F: [31,16,16,30,16,16,16],
    G: [14,17,16,23,17,17,15], H: [17,17,17,31,17,17,17], I: [31,4,4,4,4,4,31],
    J: [7,2,2,2,2,18,12], K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
    M: [17,27,21,21,17,17,17], N: [17,25,21,19,17,17,17], O: [14,17,17,17,17,17,14],
    P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
    S: [15,16,16,14,1,1,30], T: [31,4,4,4,4,4,4], U: [17,17,17,17,17,17,14],
    V: [17,17,17,17,17,10,4], W: [17,17,17,21,21,21,10], X: [17,17,10,4,10,17,17],
    Y: [17,17,10,4,4,4,4], Z: [31,1,2,4,8,16,31],
    0: [14,17,19,21,25,17,14], 1: [4,12,4,4,4,4,14], 2: [14,17,1,2,4,8,31],
    3: [30,1,1,14,1,1,30], 4: [2,6,10,18,31,2,2], 5: [31,16,16,30,1,1,30],
    6: [14,16,16,30,17,17,14], 7: [31,1,2,4,8,8,8], 8: [14,17,17,14,17,17,14],
    9: [14,17,17,15,1,1,14], "-": [0,0,0,31,0,0,0], ":": [0,4,4,0,4,4,0],
    ".": [0,0,0,0,0,12,12], "/": [1,1,2,4,8,16,16], "+": [0,4,4,31,4,4,0],
    "!": [4,4,4,4,4,0,4], ">": [16,8,4,2,4,8,16], "<": [1,2,4,8,4,2,1],
    "?": [14,17,1,2,4,0,4], "*": [0,21,14,31,14,21,0], "=": [0,0,31,0,31,0,0],
  };
  // Each character is one deliberately drawn pixel, not a sampled game asset.
  const SHAPES = [
    ["0001111000","0013332100","0133332210","1333332221","1332222221","1322222241","1222222441","0122244410","0014444100","0001111000"],
    ["0000110000","0001331000","0013333100","0133332210","1333222221","1322222441","0122224410","0012244100","0001441000","0000110000"],
    ["0111111110","1333333321","1322222221","1322222221","1322222221","1322222241","1322222241","1222222441","1244444441","0111111110"],
    ["0000110000","0001331000","0001321000","0013332100","0113322110","1332222221","1322222441","1222224441","0114444110","0001111000"],
    ["0001111000","0013333100","0133333210","1333322221","1322222221","1322222241","1222222441","0122224410","0014444100","0001111000"],
    ["0011111100","0133333320","1333333321","1322222221","1322222221","1322222241","1222222441","1222224441","0144444410","0011111100"],
    ["0001111000","0113333110","1333333221","1322222221","1322222221","1322222241","1222222441","1244444441","0114444110","0001111000"],
  ];
  const COLORS = [
    ["#5e182a","#e64663","#ffbcc6","#9e2444"],
    ["#134153","#3ed6ee","#d2ffff","#1688bc"],
    ["#145d49","#49d887","#c2ffc3","#19875b"],
    ["#62430b","#f1c64d","#fff4bd","#bd7e1b"],
    ["#203774","#638bfc","#d2e2ff","#3555b1"],
    ["#532a78","#b374ea","#f3d1ff","#7a43b7"],
    ["#203774","#638bfc","#d2e2ff","#3555b1"],
  ];

  // Original screen structure: dark sky, vivid cloud ribbons, torch-bearing
  // statue and the bright framed well. Stage hues are independently redrawn.
  const SCENES = [
    {sky:'#000000',well:'#000000',grid:'#a85000',rim:'#f85898',light:'#f8b800',body:'#f87800',shade:'#e40058',edge:'#780088',cloud:'#f87800'},
    {sky:'#04000a',well:'#000000',grid:'#6840a0',rim:'#b878f8',light:'#f8d878',body:'#c878e8',shade:'#7838b8',edge:'#401060',cloud:'#c878e8'},
    {sky:'#000806',well:'#000000',grid:'#008848',rim:'#58d898',light:'#e0f878',body:'#58b880',shade:'#008878',edge:'#004860',cloud:'#58d898'},
    {sky:'#080004',well:'#000000',grid:'#c03868',rim:'#f8b8d8',light:'#f8d878',body:'#f87898',shade:'#c01868',edge:'#681848',cloud:'#f87898'},
    {sky:'#000408',well:'#000000',grid:'#1858a0',rim:'#78b8f8',light:'#d8f8f8',body:'#58a8e8',shade:'#3858c8',edge:'#182878',cloud:'#78b8f8'},
    {sky:'#080400',well:'#000000',grid:'#a87018',rim:'#f8d878',light:'#f8f8b8',body:'#d89838',shade:'#b85818',edge:'#683800',cloud:'#e8b858'},
    {sky:'#000804',well:'#000000',grid:'#609820',rim:'#a8d858',light:'#e8f8a8',body:'#98c838',shade:'#388858',edge:'#185838',cloud:'#98d858'},
    {sky:'#040008',well:'#000000',grid:'#8040a0',rim:'#e8b8f8',light:'#f8d8f8',body:'#b878d8',shade:'#6848a8',edge:'#382060',cloud:'#b898e8'},
  ];
  function scene(level) { return SCENES[Math.max(0, level | 0) % SCENES.length]; }

  class JewelRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      canvas.width = 256; canvas.height = 240;
      this.ctx.imageSmoothingEnabled = false;
      this.tiles = Object.create(null);
      this.disposed = false;
    }
    rect(x, y, w, h, color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    text(value, x, y, color, scale, align) {
      value = String(value).toUpperCase(); scale = scale || 1;
      const width = value.length * 6 * scale - scale;
      if (align === "center") x -= width / 2;
      if (align === "right") x -= width;
      this.ctx.fillStyle = color || "#ecedec";
      for (let i = 0; i < value.length; i++) {
        const glyph = FONT[value[i]];
        if (!glyph) continue;
        for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++)
          if (glyph[row] & (1 << (4 - col)))
            this.ctx.fillRect(Math.round(x + (i * 6 + col) * scale), Math.round(y + row * scale), scale, scale);
      }
    }
    panel(x, y, w, h, color) {
      this.rect(x, y, w, h, "#05091b");
      this.rect(x, y, w, 1, color || "#9a824f");
      this.rect(x, y + h - 1, w, 1, "#494165");
      this.rect(x, y, 1, h, color || "#9a824f");
      this.rect(x + w - 1, y, 1, h, "#494165");
      this.rect(x + 2, y + 2, w - 4, 1, "#202743");
      this.rect(x + 2, y + 2, 1, h - 4, "#202743");
    }
    gem(value, x, y, size, glow) {
      if (!value) return;
      const index = (Math.max(1, Math.floor(value)) - 1) % COLORS.length;
      const mask = SHAPES[index], palette = COLORS[index];
      const pixel = Math.max(1, Math.floor(size / 10));
      x = Math.floor(x + (size - pixel * 10) / 2);
      y = Math.floor(y + (size - pixel * 10) / 2);
      if (size>=16) {
        this.rect(x-1,y-2,12,14,palette[2]);
        this.rect(x,y-1,10,12,palette[1]);
      }
      if (glow) this.rect(x - 1, y - 1, pixel * 10 + 2, pixel * 10 + 2, "#fff8da");
      const phase = Math.floor((this.frame || 0) / 7) % 6;
      const key = value + ":" + (value === 7 ? phase : 0) + ":" + !!glow;
      let tile = this.tiles[key];
      if (!tile) {
        tile = (this.canvas.ownerDocument || root.document).createElement("canvas");
        tile.width = tile.height = 10;
        const pixels = tile.getContext("2d");
      for (let row = 0; row < mask.length; row++) for (let col = 0; col < 10; col++) {
        const shade = Number(mask[row][col]);
        if (shade) {
          const rainbow = COLORS[(phase + Math.floor(row / 2) + Math.floor(col / 3)) % 6];
          const color = value === 7 ? (shade === 3 ? "#ffffff" : rainbow[shade - 1]) : palette[shade - 1];
          pixels.fillStyle = glow ? "#fff7d4" : color;
          pixels.fillRect(col, row, 1, 1);
        }
      }
        this.tiles[key] = tile;
      }
      this.ctx.drawImage(tile, x, y, pixel * 10, pixel * 10);
    }
    polygon(points, color) {
      // Integer scanlines preserve the native pixel grid without antialiasing.
      let first=240,last=0;
      points.forEach(p=>{first=Math.min(first,p[1]);last=Math.max(last,p[1]);});
      for(let y=Math.floor(first);y<Math.ceil(last);y++){
        const hits=[];
        for(let i=0;i<points.length;i++){
          const a=points[i],b=points[(i+1)%points.length];
          if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))hits.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }
        hits.sort((a,b)=>a-b);
        for(let i=0;i+1<hits.length;i+=2)this.rect(Math.ceil(hits[i]),y,Math.floor(hits[i+1])-Math.ceil(hits[i])+1,1,color);
      }
    }
    statue(colors, x, y, scale) {
      const rect=(a,b,w,h,color)=>this.rect(x+a*scale,y+b*scale,w*scale,h*scale,color);
      const poly=(points,color)=>this.polygon(points.map(p=>[x+p[0]*scale,y+p[1]*scale]),color);
      const edge=colors.edge,shade=colors.shade,body=colors.body,light=colors.light;
      // The raised torch is on the left of the crowned head, with a full robe
      // and tablet on the right. No score panel obscures the figure.
      poly([[1,27],[4,15],[7,23],[10,8],[12,22],[16,17],[15,31]],'#58d854');
      rect(6,5,2,8,'#3cbcfc');rect(10,1,2,10,'#6888fc');rect(14,10,2,7,'#b8f818');
      poly([[0,31],[16,31],[13,38],[10,40],[11,47],[6,48],[6,39],[2,37]],edge);
      rect(2,32,12,3,light);rect(5,36,7,3,body);rect(7,40,3,9,light);
      poly([[5,43],[12,43],[16,75],[26,87],[37,84],[45,83],[54,93],[58,104],[68,109],[74,127],[84,147],[82,174],[1,174],[5,141],[12,111],[18,97],[10,85]],edge);
      poly([[7,46],[11,47],[13,76],[24,91],[21,102],[16,97],[11,83]],body);
      poly([[8,51],[10,52],[12,80],[19,92],[16,94],[11,82]],light);
      poly([[16,93],[26,89],[35,86],[50,91],[57,102],[50,111],[54,130],[72,148],[80,171],[4,171],[10,146],[14,120]],body);
      poly([[17,98],[25,95],[29,104],[18,120],[13,143],[6,165],[14,125]],light);
      poly([[31,104],[37,105],[34,132],[21,163],[15,171],[17,153],[26,127]],shade);
      poly([[42,105],[49,108],[46,134],[57,165],[64,171],[49,159],[38,136]],shade);
      poly([[31,116],[35,113],[30,149],[28,170],[23,170],[25,151]],light);
      poly([[39,120],[41,120],[43,144],[51,171],[46,171],[38,145]],edge);
      poly([[50,119],[57,121],[63,141],[77,171],[70,170],[58,146]],light);
      poly([[30,70],[34,65],[44,66],[49,72],[48,85],[42,93],[36,91],[30,82]],edge);
      poly([[32,72],[36,68],[44,70],[46,76],[44,85],[40,89],[35,86],[33,80]],light);
      rect(33,76,3,2,edge);rect(41,76,3,2,edge);rect(38,78,2,5,shade);rect(36,85,5,1,shade);
      poly([[27,70],[30,65],[49,65],[52,71],[46,70],[42,67],[35,67],[31,71]],body);
      [[23,60,30,66],[27,54,34,65],[35,48,37,65],[44,51,42,65],[54,57,46,66],[58,65,49,69]].forEach(a=>poly([[a[0],a[1]],[a[2],a[3]],[a[2]+2,a[3]+2]],light));
      poly([[58,109],[69,113],[77,135],[65,145],[56,125]],edge);
      poly([[59,112],[67,115],[74,133],[66,140],[59,124]],light);
      for(let n=0;n<5;n++)rect(61+n,118+n*3,7,1,shade);
      poly([[48,103],[55,104],[62,118],[60,125],[54,120]],body);
      rect(57,119,7,3,light);
      // Short broken folds give the woven, high-contrast pixel texture of the
      // reference silhouette without importing a CHR tile or screenshot.
      for(let n=0;n<25;n++){
        const a=14+(n*17)%51,b=114+(n*11)%54;
        if(a<18&&b<137)continue;
        rect(a,b,1,3+(n%4),n%3===0?light:shade);
      }
      rect(2,173,82,2,shade);
    }
    background(frame, level, duel) {
      const colors=scene(level);
      this.rect(0,0,256,240,colors.sky);
      // The original skyline has swept cloud ribbons, not a generic star field.
      for(let band=0;band<6;band++)for(let n=0;n<9;n++){
        const x=(n*31+band*17)%270-12,y=18+band*23+((n*7)%13);
        for(let k=0;k<10;k++){
          const dy=Math.floor(Math.sin(k*.33)*5);
          this.rect(x+k*2,y+dy,2,1,colors.cloud);
          this.rect(x+k*2,y+dy+2,2,1,colors.light);
        }
        this.rect(x+18,y+1,1,3,colors.cloud);
        this.rect(x+20,y,1,2,colors.light);
      }
      // Leave the original upper-right counters legible against the sky.
      // This is empty scenery, not the large opaque card used by the old UI.
      if(duel)this.rect(0,0,256,58,colors.sky);
      else this.rect(179,0,77,95,colors.sky);
      for(let i=0;i<5;i++){
        const x=i*8+4,tall=[41,58,51,86,42][i];
        this.rect(x,232-tall,7,tall,'#604878');this.rect(x,232-tall,7,1,'#d8b8f8');
        for(let row=0;row<Math.floor(tall/4);row++)for(let col=0;col<2;col++)this.rect(x+1+col*3,234-tall+row*4,2,1,'#b898d8');
      }
      this.statue(colors,duel?101:159,duel?112:56,duel ? 0.64 : 1);
    }
    well(player, x, y, cell, frame) {
      const w = 6 * cell, h = 13 * cell;
      const colors = scene(player.speedLevel);
      this.rect(x-6,y-6,w+12,h+12,colors.rim);
      this.rect(x-4,y-4,w+8,h+8,"#fcfcfc");
      this.rect(x-3,y-3,w+6,h+6,colors.light);
      this.rect(x-1,y-1,w+2,h+2,colors.well);
      this.ctx.save(); this.ctx.beginPath(); this.ctx.rect(x, y, w, h); this.ctx.clip();
      for (let row = 0; row < 13; row++) for (let col = 0; col < 6; col++) {
        this.rect(x + col * cell, y + row * cell, cell, cell, colors.well);
        this.rect(x + col * cell, y + (row+1) * cell-1, cell-1, 1, colors.grid);
        const value = player.board && player.board[row] ? player.board[row][col] : 0;
        let glow = false;
        if (player.clearCells && frame % 10 < 5)
          glow = player.clearCells.some(function (point) { return point.x === col && point.y === row; });
        if (player.status !== 'settling') this.gem(value, x + col * cell, y + row * cell, cell, glow);
      }
      if (player.status === 'settling') {
        const fallen = (player.gravityDuration - player.gravityTicks) / 4;
        (player.gravityMoves || []).forEach(move => {
          this.gem(move.color, x + move.x * cell, y + Math.min(move.to, move.from + fallen) * cell, cell, false);
        });
      }
      if (player.active) {
        const active = player.active;
        for (let i = 0; i < 3; i++) this.gem(active.colors[i], x + active.x * cell, y + (active.y + i) * cell, cell, false);
      }
      this.ctx.restore();
      if (player.alive === false && player.joined) {
        this.rect(x, y + Math.floor(h / 2) - 13, w, 27, "#0b1023");
        this.text("TOP OUT", x + w / 2, y + Math.floor(h / 2) - 4, "#f7adbc", 1, "center");
      }
      if (player.chain > 1 && (player.status === 'clearing' || player.status === 'settling')) {
        this.text("CHAIN " + player.chain, x + w / 2, y - 15, "#fff0b1", 1, "center");
      }
    }
    title(game) {
      const frame = game.frame || 0;
      this.panel(19, 27, 218, 76, "#be9756");
      this.text("MAGIC", 129, 38, "#4c2d65", 3, "center");
      this.text("MAGIC", 127, 36, "#f1d684", 3, "center");
      this.text("JEWELRY", 129, 68, "#3d2e63", 3, "center");
      this.text("JEWELRY", 127, 66, "#ddd8ff", 3, "center");
      for (let i = 0; i < 7; i++) this.gem(i + 1, 35 + i * 27, 111 + ((Math.floor(frame / 24) + i) % 2), 20, false);
      this.text((game.selectedPlayers === 2 ? "  " : "> ") + "1 PLAYER", 128, 150, game.selectedPlayers === 2 ? "#929bb5" : "#fff1bf", 1, "center");
      this.text((game.selectedPlayers === 2 ? "> " : "  ") + "2 PLAYERS", 128, 166, game.selectedPlayers === 2 ? "#fff1bf" : "#929bb5", 1, "center");
      this.text("LEVEL " + String(game.titleLevel || 0).padStart(3, "0"), 128, 185, "#9baac8", 1, "center");
      if (Math.floor(frame / 35) % 2 === 0) this.text("PRESS START", 128, 205, "#f1d684", 1, "center");
      this.text("SELECT MODE  START BEGIN", 128, 222, "#7d8ba9", 1, "center");
    }
    single(game) {
      const player=game.players[0],next=player.next||[1,2,3];
      this.well(player,52,16,16,game.frame||0);
      this.text("NEXT",26,6,"#3cbcfc",1,"center");
      for(let i=0;i<3;i++)this.gem(next[i],18,18+i*16,16,false);
      this.text("SCORE",208,12,"#3cbcfc",1,"center");
      this.text(String(Math.min(99999999,player.score||0)).padStart(8,"0"),208,23,"#3cbcfc",1,"center");
      this.text("JEWELRY",208,42,"#f85898",1,"center");
      this.text(String(Math.min(999999,player.cleared||0)).padStart(6,"0"),208,53,"#f8b800",1,"center");
      this.text("LEVEL",208,72,"#3cbcfc",1,"center");
      this.text(String(player.level||0).padStart(3,"0"),208,83,"#b8f818",1,"center");
      const magic=player.active&&player.active.magic;
      if(magic||player.levelCleared>=70){
        this.rect(160,96,92,10,"#000000");
        this.text(magic?"MAGIC COLUMN!":"MAGIC READY",207,98,"#fff0b1",1,"center");
      }
    }
    double(game) {
      this.text("JEWELRY DUEL", 128, 10, "#efe0b4", 2, "center");
      this.text("SAME GEMS - BEST SCORE", 128, 31, "#91a0bd", 1, "center");
      for (let index = 0; index < 2; index++) {
        const p = game.players[index], left = index ? 176 : 20;
        this.text("P" + (index + 1) + "  LV" + String(p.level || 0).padStart(3, "0"), left + 30, 48, index ? "#f0bedc" : "#e9d68f", 1, "center");
        this.well(p, left, 65, 10, game.frame || 0);
        this.rect(left - 4, 199, 68, 30, "#080d21");
        this.rect(left - 4, 199, 68, 1, "#34344b");
        this.text(String(Math.min(9999999, p.score || 0)).padStart(7, "0"), left + 30, 204, "#e5e8f2", 1, "center");
        this.text("GEMS " + String(p.cleared || 0).padStart(3, "0"), left + 30, 219, "#8fa4bb", 1, "center");
        const nx = index ? 158 : 88;
        this.rect(nx,65,10,11,"#000000");
        this.text("N", nx + 5, 67, "#8a93ab", 1, "center");
        for (let n = 0; n < 3; n++) this.gem((p.next || [1, 2, 3])[n], nx, 80 + 11 * n, 10, false);
      }
      this.rect(118,113,20,13,"#000000");
      this.text("VS",128,116,"#f8b800",1,"center");
    }
    overlay(title, detail) {
      this.rect(17, 96, 222, 50, "#080d21");
      this.rect(17, 96, 222, 1, "#aa8750");
      this.rect(17, 145, 222, 1, "#504265");
      this.text(title, 128, 106, "#f4dfaa", 2, "center");
      this.text(detail, 128, 133, "#a9b3cb", 1, "center");
    }
    draw(game) {
      if (this.disposed) return;
      this.frame = game.frame || 0;
      this.ctx.imageSmoothingEnabled = false;
      // In a duel, each well follows its own completed magic stages. Keep the
      // shared skyline at the opening palette so P1 cannot recolor P2's field.
      const stage = game.phase !== "title" && game.selectedPlayers !== 2 ? game.players[0].speedLevel : 0;
      this.background(game.frame || 0, stage,game.phase!=="title"&&game.selectedPlayers===2);
      if (game.phase === "title") this.title(game);
      else {
        if (game.selectedPlayers === 2) this.double(game); else this.single(game);
        if (game.phase === "paused") this.overlay("PAUSED", game.autoPaused ? "WAIT FOR CONTROLLERS" : "START RESUME / SELECT MUSIC");
        else if (game.phase === "gameover") this.overlay("GAME OVER", "START TO RETURN TO TITLE");
      }
      if(game.phase==="title"||game.selectedPlayers===2)this.text(game.muted?"SOUND OFF":"SOUND ON",252,231,"#8a98b4",1,"right");
    }
    dispose() { this.disposed = true; this.tiles = Object.create(null); }
  }
  root.JewelRenderer = JewelRenderer;
  if (typeof module !== "undefined" && module.exports) module.exports = { JewelRenderer, FONT };
})(typeof window !== "undefined" ? window : global);
