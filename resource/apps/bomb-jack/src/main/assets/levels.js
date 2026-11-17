/* Independently authored temple rooms. Reference structure, not original ROM maps. */
(function (root) {
  "use strict";
  var W = 16;
  var STAGES = [
    {
      name: "GATE OF DAWN",
      w: 480,
      h: 208,
      p: [
        [64, 160, 80],
        [176, 128, 64],
        [288, 160, 80],
        [368, 104, 64],
      ],
      b: [
        [104, 136],
        [208, 104],
        [320, 136],
        [400, 80],
      ],
      e: [
        ["mummy", 216, 192, 160, 280],
        ["bat", 336, 76, 272, 420],
      ],
    },
    {
      name: "SCARAB GALLERY",
      w: 512,
      h: 208,
      p: [
        [48, 144, 64],
        [144, 96, 80],
        [256, 144, 80],
        [384, 80, 80],
      ],
      b: [
        [72, 120],
        [176, 72],
        [288, 120],
        [416, 56],
      ],
      e: [
        ["mummy", 256, 192, 160, 376],
        ["bird", 352, 48, 224, 464],
      ],
    },
    {
      name: "TWIN PILLARS",
      w: 384,
      h: 320,
      p: [
        [48, 256, 80],
        [160, 208, 64],
        [256, 160, 80],
        [144, 112, 80],
        [48, 64, 64],
      ],
      b: [
        [80, 232],
        [192, 184],
        [288, 136],
        [176, 88],
      ],
      e: [
        ["bat", 184, 176, 112, 304],
        ["mummy", 272, 304, 208, 352],
      ],
    },
    {
      name: "WATER VAULT",
      w: 544,
      h: 208,
      p: [
        [48, 152, 64],
        [144, 112, 64],
        [256, 160, 64],
        [352, 112, 64],
        [448, 64, 64],
      ],
      b: [
        [80, 128],
        [176, 88],
        [288, 136],
        [384, 88],
      ],
      e: [
        ["bird", 256, 64, 128, 416],
        ["mummy", 384, 192, 272, 496],
      ],
    },
    {
      name: "SERPENT STAIRS",
      w: 512,
      h: 272,
      p: [
        [64, 208, 80],
        [176, 160, 64],
        [288, 112, 64],
        [400, 64, 80],
        [288, 208, 64],
      ],
      b: [
        [96, 184],
        [208, 136],
        [320, 88],
        [432, 40],
      ],
      e: [
        ["bat", 224, 120, 112, 416],
        ["mummy", 352, 256, 240, 464],
      ],
    },
    {
      name: "MOON WELL",
      w: 384,
      h: 384,
      p: [
        [48, 320, 80],
        [176, 272, 80],
        [64, 224, 64],
        [192, 176, 80],
        [64, 128, 80],
        [192, 80, 64],
      ],
      b: [
        [80, 296],
        [208, 248],
        [96, 200],
        [224, 152],
      ],
      e: [
        ["bat", 176, 240, 64, 320],
        ["bird", 160, 96, 64, 304],
      ],
    },
    {
      name: "EMBER PASSAGE",
      w: 608,
      h: 208,
      p: [
        [64, 160, 64],
        [176, 128, 80],
        [304, 96, 64],
        [416, 144, 80],
        [512, 80, 64],
      ],
      b: [
        [96, 136],
        [208, 104],
        [336, 72],
        [448, 120],
      ],
      e: [
        ["mummy", 272, 192, 160, 352],
        ["fire", 384, 96, 304, 544],
        ["bat", 496, 56, 352, 560],
      ],
    },
    {
      name: "SILVER ZIGGURAT",
      w: 448,
      h: 304,
      p: [
        [64, 240, 80],
        [192, 192, 64],
        [304, 144, 80],
        [192, 96, 80],
        [64, 48, 64],
      ],
      b: [
        [96, 216],
        [224, 168],
        [336, 120],
        [224, 72],
      ],
      e: [
        ["bird", 224, 144, 80, 368],
        ["mummy", 320, 288, 160, 400],
      ],
    },
    {
      name: "HALL OF MIRRORS",
      w: 576,
      h: 240,
      p: [
        [48, 176, 80],
        [160, 112, 64],
        [272, 176, 64],
        [368, 112, 64],
        [464, 48, 80],
      ],
      b: [
        [80, 152],
        [192, 88],
        [304, 152],
        [496, 24],
      ],
      e: [
        ["bat", 224, 64, 96, 400],
        ["mummy", 400, 224, 256, 528],
        ["fire", 432, 104, 320, 528],
      ],
    },
    {
      name: "DEEP AQUEDUCT",
      w: 512,
      h: 336,
      p: [
        [48, 272, 64],
        [160, 224, 80],
        [288, 176, 80],
        [416, 128, 64],
        [288, 64, 64],
        [144, 112, 80],
      ],
      b: [
        [80, 248],
        [192, 200],
        [320, 152],
        [448, 104],
      ],
      e: [
        ["bird", 256, 128, 112, 432],
        ["bat", 192, 240, 64, 352],
        ["mummy", 352, 320, 208, 464],
      ],
    },
    {
      name: "GOLDEN CROSSING",
      w: 640,
      h: 208,
      p: [
        [64, 144, 80],
        [192, 80, 80],
        [320, 144, 64],
        [432, 96, 64],
        [544, 144, 64],
      ],
      b: [
        [96, 120],
        [224, 56],
        [352, 120],
        [464, 72],
      ],
      e: [
        ["mummy", 288, 192, 160, 384],
        ["bird", 416, 48, 256, 592],
        ["fire", 512, 136, 400, 608],
      ],
    },
    {
      name: "TOWER OF WINDS",
      w: 384,
      h: 432,
      p: [
        [48, 368, 64],
        [160, 320, 80],
        [48, 272, 80],
        [176, 224, 80],
        [64, 176, 64],
        [192, 128, 64],
        [64, 64, 80],
      ],
      b: [
        [80, 344],
        [192, 296],
        [80, 248],
        [208, 200],
      ],
      e: [
        ["bat", 224, 288, 64, 320],
        ["bird", 176, 144, 48, 320],
        ["mummy", 256, 416, 128, 352],
      ],
    },
    {
      name: "CROWN LABYRINTH",
      w: 672,
      h: 272,
      p: [
        [64, 208, 80],
        [192, 144, 80],
        [304, 80, 64],
        [416, 144, 80],
        [544, 208, 80],
        [544, 64, 80],
      ],
      b: [
        [96, 184],
        [224, 120],
        [336, 56],
        [576, 184],
      ],
      e: [
        ["mummy", 304, 256, 192, 416],
        ["fire", 416, 112, 304, 592],
        ["bird", 528, 64, 384, 624],
      ],
    },
    {
      name: "BLACK OBELISK",
      w: 448,
      h: 368,
      p: [
        [48, 304, 80],
        [176, 256, 80],
        [304, 208, 80],
        [176, 160, 80],
        [48, 112, 64],
        [176, 64, 80],
      ],
      b: [
        [80, 280],
        [208, 232],
        [336, 184],
        [208, 136],
      ],
      e: [
        ["bat", 224, 224, 64, 384],
        ["bird", 208, 80, 64, 384],
        ["fire", 304, 304, 160, 400],
      ],
    },
    {
      name: "PALACE APPROACH",
      w: 704,
      h: 240,
      p: [
        [48, 176, 80],
        [160, 112, 80],
        [288, 48, 80],
        [416, 112, 80],
        [544, 176, 80],
        [608, 64, 64],
      ],
      b: [
        [80, 152],
        [192, 88],
        [320, 24],
        [576, 152],
      ],
      e: [
        ["mummy", 288, 224, 160, 416],
        ["bat", 416, 64, 256, 624],
        ["bird", 528, 128, 384, 656],
        ["fire", 608, 192, 480, 672],
      ],
    },
    {
      name: "THRONE OF BELZEBUT",
      w: 512,
      h: 400,
      p: [
        [48, 336, 80],
        [176, 288, 80],
        [304, 240, 80],
        [176, 192, 64],
        [48, 144, 80],
        [176, 96, 80],
        [304, 48, 80],
      ],
      b: [
        [80, 312],
        [208, 264],
        [336, 216],
        [208, 168],
      ],
      e: [
        ["bat", 224, 272, 64, 448],
        ["bird", 256, 128, 96, 448],
        ["fire", 368, 352, 208, 464],
        ["mummy", 320, 384, 144, 464],
      ],
    },
  ];
  var ROYAL = [
    [
      [40, 144, 48],
      [104, 112, 48],
      [168, 144, 48],
    ],
    [
      [32, 160, 64],
      [160, 160, 64],
      [96, 80, 64],
    ],
    [
      [48, 128, 32],
      [112, 96, 32],
      [176, 128, 32],
    ],
    [
      [24, 160, 64],
      [96, 112, 64],
      [168, 64, 64],
    ],
    [
      [32, 80, 64],
      [160, 80, 64],
      [96, 144, 64],
    ],
    [
      [32, 152, 32],
      [80, 112, 32],
      [128, 72, 32],
      [176, 112, 48],
    ],
    [
      [24, 96, 80],
      [152, 96, 80],
      [88, 160, 80],
    ],
    [
      [32, 176, 64],
      [160, 176, 64],
      [64, 112, 128],
    ],
    [
      [32, 144, 48],
      [104, 64, 48],
      [176, 144, 48],
    ],
    [
      [32, 64, 32],
      [80, 112, 32],
      [128, 160, 32],
      [176, 112, 48],
    ],
    [
      [24, 128, 64],
      [96, 80, 64],
      [168, 128, 64],
    ],
    [
      [32, 80, 64],
      [160, 144, 64],
      [96, 176, 48],
    ],
    [
      [32, 160, 32],
      [80, 64, 32],
      [128, 144, 32],
      [176, 80, 48],
    ],
    [
      [24, 96, 48],
      [104, 144, 48],
      [184, 96, 48],
    ],
    [
      [32, 160, 64],
      [160, 64, 64],
      [80, 112, 96],
    ],
    [
      [32, 144, 48],
      [104, 80, 48],
      [176, 144, 48],
    ],
  ];
  function platform(x, y, w) {
    return { x: x, y: y, w: w, h: 8 };
  }
  function enemy(kind, x, y, min, max, id) {
    return {
      id: id,
      kind: kind,
      x: x,
      y: y,
      baseY: y,
      min: min,
      max: max,
      vx: kind === "mummy" ? 0.55 : 0.8,
      phase: id * 1.7,
      alive: true,
    };
  }
  function room(stage, kind) {
    var s = STAGES[Math.max(0, Math.min(15, stage - 1))],
      r = {
        kind: kind,
        name: s.name,
        w: s.w,
        h: s.h,
        platforms: [],
        bombs: [],
        chests: [],
        enemies: [],
        items: [],
        door: null,
        secret: null,
        spawn: { x: 24, y: s.h - 24 },
        flame: -1,
        chain: 0,
        jumps: 0,
      };
    if (kind === "action") {
      r.platforms = [platform(0, s.h - 8, s.w)].concat(
        s.p.map(function (p) {
          return platform(p[0], p[1], p[2]);
        }),
      );
      r.chests = [
        { x: 32, y: s.h - 20, color: "brown", reward: "key", opened: false },
        {
          x: s.b[0][0],
          y: s.b[0][1] + 12,
          color: "brown",
          reward: "coin",
          opened: false,
        },
        {
          x: s.b[1][0],
          y: s.b[1][1] + 12,
          color: stage % 3 === 0 ? "orange" : "brown",
          reward: "drink",
          opened: false,
        },
        {
          x: s.b[2][0],
          y: s.b[2][1] + 12,
          color: "orange",
          reward: stage % 2 ? "sphinx" : "bag",
          opened: false,
        },
      ];
      s.b.forEach(function (b, i) {
        for (var j = 0; j < 3; j++)
          r.bombs.push({
            x: b[0] - 16 + j * 16,
            y: b[1] - 8 * (j % 2),
            collected: false,
            id: i * 3 + j,
          });
      });
      // Later stages require reaching the upper temple, then returning to its gate.
      if (stage >= 3) {
        var summit = s.p.reduce(function(best, tile) { return tile[1] < best[1] ? tile : best; }, s.p[0]);
        r.chests[0].x = summit[0] + Math.floor(summit[2] / 2) - 7;
        r.chests[0].y = summit[1] - 12;
      }
      r.enemies = s.e.map(function (e, i) {
        return enemy(e[0], e[1], e[2] - 8, e[3], e[4], i);
      });
      r.door = { x: s.w - 36, y: s.h - 40, w: 20, h: 32 };
      r.secret = {
        x: Math.floor(s.w / 2),
        y: s.h - 40,
        w: 20,
        h: 32,
        open: false,
      };
    } else if (kind === "royal") {
      r.w = 256;
      r.h = 208;
      r.name = "ROYAL PALACE " + stage;
      r.spawn = { x: 24, y: 184 };
      r.platforms = [platform(0, 200, 256)].concat(
        ROYAL[stage - 1].map(function (p) {
          return platform(p[0], p[1], p[2]);
        }),
      );
      // Per-room order changes where the next flame moves; all locations are reachable by high jump.
      for (var i = 0; i < 24; i++) {
        var col = (i * 5 + stage) % 8,
          row = Math.floor(i / 8);
        r.bombs.push({
          id: i,
          x: 24 + col * 29,
          y: 40 + row * 55 + ((stage + col) % 2) * 12,
          collected: false,
        });
      }
      r.enemies = [
        enemy("mummy", 208, 190, 96, 240, 1),
        enemy(stage % 2 ? "bat" : "bird", 184, 64, 40, 232, 2),
      ];
      if (stage > 8) r.enemies.push(enemy("fire", 144, 132, 48, 232, 3));
      r.door = { x: 224, y: 168, w: 20, h: 32 };
    } else if (kind === "secret") {
      r.w = 256;
      r.h = 208;
      r.name = "SPHINX TREASURY";
      r.spawn = { x: 24, y: 184 };
      r.platforms = [
        platform(0, 200, 256),
        platform(48, 144, 64),
        platform(144, 96, 64),
      ];
      r.chests = [
        { x: 72, y: 132, color: "brown", reward: "bag", opened: false },
        { x: 168, y: 84, color: "orange", reward: "coin", opened: false },
        { x: 208, y: 188, color: "brown", reward: "drink", opened: false },
      ];
      r.door = { x: 224, y: 168, w: 20, h: 32 };
    } else {
      r.w = 256;
      r.h = 208;
      r.name = "TORTURE ROOM";
      r.spawn = { x: 24, y: 184 };
      r.platforms = [platform(0, 200, 256)];
      r.jumps = 12;
      r.enemies = [enemy("mummy", 184, 190, 104, 240, 1)];
    }
    return r;
  }
  root.BombJackLevels = { stages: STAGES, royal: ROYAL, room: room, count: 16 };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.BombJackLevels;
})(typeof window !== "undefined" ? window : global);
