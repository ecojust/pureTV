/* Original industrial outpost maps. Coordinates use screen-right +X, down +Y. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AlienShooterWorld = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var weapons = [
    { id: 'pistol', name: ['战术手枪', 'TACTICAL PISTOL'], damage: 21, interval: .24, speed: 31, pellets: 1, spread: .018, color: '#ffd88a', capacity: -1 },
    { id: 'smg', name: ['突击冲锋枪', 'ASSAULT SMG'], damage: 16, interval: .075, speed: 35, pellets: 1, spread: .065, color: '#fff2ba', capacity: 240 },
    { id: 'shotgun', name: ['破门霰弹枪', 'BREACH SHOTGUN'], damage: 15, interval: .63, speed: 29, pellets: 7, spread: .24, color: '#ffc88a', capacity: 48 },
    { id: 'minigun', name: ['六管重机枪', 'ROTARY CANNON'], damage: 23, interval: .065, speed: 39, pellets: 1, spread: .09, color: '#ffe0a1', capacity: 360 },
    { id: 'plasma', name: ['聚能等离子', 'PLASMA LANCE'], damage: 65, interval: .24, speed: 27, pellets: 1, spread: .02, color: '#81fff0', capacity: 80, splash: 1.35 }
  ];
  var enemyTypes = {
    crawler: { name: ['异变爬行者', 'CRAWLER'], hp: 38, speed: 1.65, radius: .46, damage: 10, reward: 7, color: '#738d56' },
    runner: { name: ['镰足疾行者', 'RUNNER'], hp: 25, speed: 2.8, radius: .34, damage: 7, reward: 6, color: '#a19a58' },
    spitter: { name: ['酸液喷吐者', 'SPITTER'], hp: 68, speed: 1.25, radius: .56, damage: 12, reward: 12, color: '#809955' },
    brute: { name: ['重甲兽', 'ARMORED BRUTE'], hp: 190, speed: .94, radius: .69, damage: 22, reward: 24, color: '#806f66' },
    boss: { name: ['母巢守卫', 'HIVE GUARDIAN'], hp: 1550, speed: .82, radius: 1.15, damage: 30, reward: 250, color: '#a37872' }
  };
  var shopItems = [
    { id: 'smg', kind: 'weapon', weapon: 'smg', name: ['冲锋枪与弹药', 'SMG + AMMUNITION'], description: ['解锁冲锋枪，并补充 240 发弹药', 'Unlock the SMG and add 240 rounds'], price: 120 },
    { id: 'shotgun', kind: 'weapon', weapon: 'shotgun', name: ['霰弹枪与弹药', 'SHOTGUN + SHELLS'], description: ['解锁霰弹枪，并补充 48 发霰弹', 'Unlock the shotgun and add 48 shells'], price: 150 },
    { id: 'minigun', kind: 'weapon', weapon: 'minigun', name: ['重机枪与弹药', 'ROTARY CANNON + AMMO'], description: ['解锁重机枪，并补充 360 发弹药', 'Unlock the rotary cannon and add 360 rounds'], price: 300 },
    { id: 'plasma', kind: 'weapon', weapon: 'plasma', name: ['等离子武器', 'PLASMA LANCE'], description: ['解锁等离子枪，并补充 80 发电池', 'Unlock the plasma lance and add 80 cells'], price: 420 },
    { id: 'medical', kind: 'health', name: ['医疗补给', 'MEDICAL SUPPLIES'], description: ['恢复至最大生命', 'Restore your health to maximum'], price: 55 },
    { id: 'armor', kind: 'armor', name: ['装甲板', 'ARMOR PLATES'], description: ['护甲补充至 100', 'Restore your armor to 100'], price: 80 },
    { id: 'ammo', kind: 'ammo', name: ['综合弹药箱', 'AMMUNITION CRATE'], description: ['补充所有已解锁武器的弹药', 'Refill every unlocked weapon'], price: 100 },
    { id: 'grenades', kind: 'grenades', name: ['破片手雷', 'FRAGMENTATION GRENADES'], description: ['补充 3 枚手雷', 'Add three grenades'], price: 60 },
    { id: 'vitality', kind: 'vitality', name: ['生存强化', 'SURVIVAL TRAINING'], description: ['最大生命 +25，并恢复生命（最多 200）', '+25 maximum health and heal; maximum 200'], price: 160 }
  ];
  function rect(id, type, x, y, w, h) { return { id: id, type: type, x: x, y: y, w: w, h: h }; }
  function stage(index, name, theme, spawn, exit, walls, doors, objectives, spawnPoints, props) {
    var solids = [rect('north', 'wall', 0, 0, 48, .7), rect('south', 'wall', 0, 33.3, 48, .7), rect('west', 'wall', 0, 0, .7, 34), rect('east', 'wall', 47.3, 0, .7, 34)].concat(walls);
    return { id: index, name: name, theme: theme, width: 48, height: 34, cellSize: 1, spawn: spawn, exit: exit, solids: solids,
      doors: doors.map(function (d, i) { return Object.assign(rect('gate-' + i, 'door', d[0], d[1], d[2], d[3]), { open: false }); }),
      objectives: objectives.map(function (o, i) { return { id: 'console-' + i, x: o[0], y: o[1], name: o[2], status: i === 0 ? 'ready' : 'locked', progress: 0 }; }),
      spawnPoints: spawnPoints, props: props.map(function (p, i) { return { id: 'prop-' + i, type: p[0], x: p[1], y: p[2], angle: p[3] || 0 }; }),
      lights: objectives.map(function (o, i) { return { x: o[0], y: o[1] - 2, color: i === 2 ? '#ff6048' : '#6ecbd7' }; }),
      barrels: spawnPoints.map(function (points, i) { return { id: 'barrel-' + i, x: points[0][0] + .7, y: points[0][1], radius: .45, hp: 30, exploded: false }; }),
      palette: theme === 'laboratory' ? { floor: '#566567', wall: '#a2b4ae', accent: '#64dfda' } : theme === 'reactor' ? { floor: '#373e46', wall: '#64707b', accent: '#ff7654' } : { floor: '#555247', wall: '#8c8a77', accent: '#e8b45e' }
    };
  }
  var stages = [
    stage(0, ['01 · 隔离货运站', '01 · QUARANTINE DOCK'], 'warehouse', { x: 5, y: 28 }, { x: 44, y: 5 }, [
      rect('divider-1a', 'wall', 16, .7, 1, 12.3), rect('divider-1b', 'wall', 16, 16, 1, 17.3),
      rect('divider-2a', 'wall', 32, .7, 1, 22.3), rect('divider-2b', 'wall', 32, 26, 1, 7.3),
      rect('cargo-1', 'crate', 4, 16, 5, 3), rect('cargo-2', 'crate', 10, 22, 3, 5), rect('cargo-3', 'crate', 3, 3, 3, 3),
      rect('cargo-4', 'crate', 20, 6, 6, 3), rect('cargo-5', 'crate', 24, 14, 5, 4), rect('cargo-6', 'crate', 19, 22, 3, 5),
      rect('cargo-7', 'crate', 37, 17, 6, 3), rect('cargo-8', 'crate', 41, 25, 4, 3), rect('cargo-9', 'crate', 35, 5, 3, 6)
    ], [[16, 13, 1, 3], [32, 23, 1, 3]], [
      [10, 7, ['恢复货运电力', 'RESTORE DOCK POWER']], [26, 28, ['解除隔离闸门', 'RELEASE QUARANTINE GATE']], [42, 10, ['开启撤离通道', 'OPEN EXTRACTION ACCESS']]
    ], [[[3, 10], [13, 4], [13, 29], [5, 24]], [[20, 12], [29, 4], [29, 29], [19, 29]], [[35, 14], [45, 15], [36, 29], [44, 3]]], [
      ['rack', 2, 14], ['rack', 14, 20], ['pipe', 8, 2], ['vent', 14, 10], ['cable', 20, 29], ['warning', 15, 14.5], ['warning', 31, 24.5], ['tank', 39, 4], ['rack', 46, 22]
    ]),
    stage(1, ['02 · 生物研究设施', '02 · BIOTECH LABORATORY'], 'laboratory', { x: 5, y: 5 }, { x: 44, y: 29 }, [
      rect('divider-1a', 'wall', .7, 11, 35.3, 1), rect('divider-1b', 'wall', 40, 11, 7.3, 1),
      rect('divider-2a', 'wall', .7, 22, 4.3, 1), rect('divider-2b', 'wall', 9, 22, 38.3, 1),
      rect('lab-1', 'tank', 12, 3, 3, 4), rect('lab-2', 'tank', 22, 3, 3, 4), rect('lab-3', 'crate', 30, 6, 3, 3),
      rect('lab-4', 'wall', 28, 13, 1, 5), rect('lab-5', 'tank', 17, 15, 5, 3), rect('lab-6', 'crate', 10, 13, 3, 3),
      rect('lab-7', 'tank', 14, 26, 4, 4), rect('lab-8', 'tank', 24, 25, 3, 5), rect('lab-9', 'crate', 35, 26, 4, 4)
    ], [[36, 11, 4, 1], [5, 22, 4, 1]], [
      [41, 6, ['关闭培养舱', 'SHUT DOWN INCUBATORS']], [6, 17, ['净化实验通道', 'PURGE THE LAB CORRIDOR']], [42, 25, ['下载实验记录', 'RECOVER RESEARCH RECORDS']]
    ], [[[4, 9], [19, 8], [28, 3], [44, 9]], [[4, 14], [24, 20], [44, 14], [34, 18]], [[4, 29], [20, 30], [31, 26], [44, 32]]], [
      ['pipe', 8, 2], ['rack', 18, 2], ['tank', 34, 3], ['vent', 45, 4], ['cable', 40, 17], ['rack', 13, 20], ['warning', 38, 10], ['warning', 7, 21], ['pipe', 31, 31]
    ]),
    stage(2, ['03 · 母巢反应堆', '03 · HIVE REACTOR'], 'reactor', { x: 43, y: 29 }, { x: 5, y: 4 }, [
      rect('divider-1a', 'wall', 31, .7, 1, 10.3), rect('divider-1b', 'wall', 31, 15, 1, 18.3),
      rect('divider-2a', 'wall', 16, .7, 1, 22.3), rect('divider-2b', 'wall', 16, 27, 1, 6.3),
      rect('reactor-1', 'tank', 36, 17, 5, 5), rect('reactor-2', 'crate', 42, 11, 3, 4),
      rect('reactor-3', 'tank', 21, 6, 5, 5), rect('reactor-4', 'crate', 20, 17, 3, 4),
      rect('reactor-5', 'tank', 3, 22, 3, 4), rect('reactor-6', 'tank', 11, 22, 3, 4), rect('reactor-7', 'crate', 3, 10, 2, 3)
    ], [[31, 11, 1, 4], [16, 23, 1, 4]], [
      [40, 6, ['切断冷却循环', 'ISOLATE COOLANT LOOP']], [25, 28, ['启动反应堆过载', 'OVERLOAD THE REACTOR']], [8, 8, ['摧毁母巢守卫', 'DESTROY THE HIVE GUARDIAN']]
    ], [[[35, 5], [45, 20], [35, 28], [44, 3]], [[19, 4], [28, 15], [19, 29], [28, 30]], [[3, 18], [13, 17], [8, 29], [12, 4]]], [
      ['pipe', 43, 3], ['vent', 35, 10], ['cable', 45, 26], ['warning', 32, 13], ['rack', 28, 5], ['pipe', 22, 3], ['warning', 17, 25], ['tank', 8, 18], ['cable', 7, 3]
    ])
  ];
  return { stages: stages, weapons: weapons, enemyTypes: enemyTypes, shopItems: shopItems };
});
