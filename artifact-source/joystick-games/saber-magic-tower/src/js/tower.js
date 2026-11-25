import floors from './floors.json' with { type: 'json' };

export { floors };
export const directions = { UP: [0, -1], RIGHT: [1, 0], DOWN: [0, 1], LEFT: [-1, 0] };
export const keyNames = { y: '黄', b: '蓝', r: '红' };
export const enemies = { g: '石面兽', s: '守门剑士', w: '紫焰术士', K: '封印统领' };
export const locationKey = (x, z) => z * 11 + x;

export function createRun() {
  return {
    floor: 0, x: 1, z: 9, facing: 'RIGHT', hp: 180, attack: 14, defense: 5, gold: 0,
    keys: { y: 0, b: 0, r: 0 }, clears: floors.map(() => []), kills: 0, steps: 0,
    mode: 'explore', duel: null, notice: floors[0].lore
  };
}

export function tile(run, x, z) {
  if (run.clears[run.floor].includes(locationKey(x, z))) return '.';
  return floors[run.floor].rows[z]?.[x] ?? '#';
}

export function enemyStats(floor, kind) {
  const rank = floor + 1;
  const boss = kind === 'K';
  const name = boss ? ({ 7: '铜盔统领', 14: '镜甲统领', 21: '永夜之王' })[rank] : enemies[kind];
  return {
    name, kind,
    hp: 20 + 3 * rank + (boss ? rank * 2 + 34 : kind === 's' ? 16 : 0),
    attack: 11 + 2 * rank + (boss ? 10 : kind === 'w' ? 5 : 0),
    defense: 2 + rank + (kind === 's' ? 4 : 0),
    period: kind === 'w' ? 1.3 : boss ? 1.2 : 1.6,
    gold: rank + (boss ? 18 : 5)
  };
}

export function move(run, direction) {
  if (run.mode !== 'explore') return;
  const [dx, dz] = directions[direction];
  run.facing = direction;
  const x = run.x + dx, z = run.z + dz;
  const target = tile(run, x, z);
  if (target === '#') return;
  if (enemies[target]) {
    const enemy = enemyStats(run.floor, target);
    run.duel = { enemy, x, z, hp: enemy.hp, timer: enemy.period, guard: 0, guardCooldown: 0,
      recovery: 0, energy: 2, combo: 0, swing: 0, parried: false };
    run.mode = 'duel';
    run.notice = '连斩蓄力，敌方蓄力条亮起时可格挡。';
    return;
  }
  if ('YBR'.includes(target)) {
    const color = target.toLowerCase();
    if (!run.keys[color]) { run.notice = '需要' + keyNames[color] + '钥匙。'; return; }
    run.keys[color]--;
    run.notice = keyNames[color] + '锁已打开。';
  }
  if (target === '$') {
    run.x = x; run.z = z; run.steps++;
    run.mode = 'shop'; run.notice = '用守卫掉落的金币强化装备。'; return;
  }
  if (target === '*') { run.mode = 'won'; run.notice = '永夜已尽，你取回了黎明之冠。'; return; }
  run.x = x; run.z = z; run.steps++;
  if (target === '>' || (target === '<' && run.floor > 0)) {
    const goingUp = target === '>';
    run.floor += goingUp ? 1 : -1;
    const stairs = goingUp ? '<' : '>';
    const rows = floors[run.floor].rows;
    run.z = rows.findIndex(row => row.includes(stairs));
    run.x = rows[run.z].indexOf(stairs);
    run.notice = floors[run.floor].lore;
    return 'checkpoint';
  }
  if (target in keyNames) {
    run.keys[target]++; run.notice = '获得' + keyNames[target] + '钥匙。';
  }
  if (target === 'h') { run.hp += 45; run.notice = '红药水 · 生命 +45'; }
  if (target === 'a') { run.attack += 3; run.notice = '琥珀晶石 · 攻击 +3'; }
  if (target === 'd') { run.defense += 2; run.notice = '蔚蓝晶石 · 防御 +2'; }
  if ('ybrYBRhad'.includes(target)) run.clears[run.floor].push(locationKey(x, z));
}

export function strike(run, heavy = false) {
  if (run.mode !== 'duel') return;
  const duel = run.duel;
  if (duel.recovery > 0 || (heavy && duel.energy < 2)) return;
  duel.combo = heavy ? 0 : duel.combo + 1;
  const power = heavy ? 1.85 : duel.combo % 3 === 0 ? 1.35 : 1;
  const damage = Math.max(1, Math.round(run.attack * power) - duel.enemy.defense + (duel.parried ? 8 : 0));
  duel.parried = false;
  duel.hp = Math.max(0, duel.hp - damage);
  duel.energy = heavy ? duel.energy - 2 : Math.min(4, duel.energy + 1);
  duel.recovery = heavy ? 0.72 : 0.38;
  duel.swing = heavy ? 0.36 : 0.22;
  run.notice = (heavy ? '破甲重斩' : duel.combo % 3 === 0 ? '三连挑斩' : '横斩') + ' · ' + damage;
  if (!duel.hp) {
    run.kills++; run.gold += duel.enemy.gold;
    run.clears[run.floor].push(locationKey(duel.x, duel.z));
    run.notice = duel.enemy.name + '已击败 · 金币 +' + duel.enemy.gold;
    run.duel = null; run.mode = 'explore';
  }
}

export function guard(run) {
  const duel = run.duel;
  if (run.mode !== 'duel' || duel.guardCooldown > 0) return;
  duel.guard = 0.38; duel.guardCooldown = 0.8;
}

export function advance(run, dt) {
  if (run.mode !== 'duel') return;
  const duel = run.duel;
  duel.timer -= dt;
  for (const field of ['recovery', 'guardCooldown', 'swing']) duel[field] = Math.max(0, duel[field] - dt);
  if (duel.timer <= 0) {
    if (duel.guard > 0) {
      duel.parried = true; duel.energy = Math.min(4, duel.energy + 1);
      run.notice = '完美格挡 · 下一击强化';
    } else {
      const damage = Math.max(1, duel.enemy.attack - run.defense);
      run.hp = Math.max(0, run.hp - damage);
      run.notice = '受击 · 生命 −' + damage;
      if (!run.hp) run.mode = 'lost';
    }
    duel.timer = duel.enemy.period;
  }
  duel.guard = Math.max(0, duel.guard - dt);
}

export const wares = [
  { label: '磨砺光刃', price: 15, stat: 'attack', gain: 3 },
  { label: '加固护甲', price: 15, stat: 'defense', gain: 3 },
  { label: '补充生命', price: 10, stat: 'hp', gain: 60 }
];

export function buy(run, index) {
  const ware = wares[index];
  if (run.mode !== 'shop' || !ware) return;
  if (run.gold < ware.price) { run.notice = '金币不足。'; return; }
  run.gold -= ware.price; run[ware.stat] += ware.gain;
  run.notice = ware.label + ' +' + ware.gain;
}

export function readCheckpoint(raw) {
  try {
    const run = JSON.parse(raw);
    if (!run || run.mode !== 'explore' || !Number.isInteger(run.floor) || !floors[run.floor] ||
        !Number.isInteger(run.x) || !Number.isInteger(run.z) ||
        ![run.hp, run.attack, run.defense, run.gold, run.kills, run.steps, ...Object.keys(keyNames).map(k => run.keys?.[k])]
          .every(v => Number.isSafeInteger(v) && v >= 0) || !run.hp ||
        !Array.isArray(run.clears) || run.clears.length !== floors.length ||
        !run.clears.every(c => Array.isArray(c) && c.every(p => Number.isInteger(p) && p >= 0 && p < 121)) ||
        tile(run, run.x, run.z) === '#') return null;
    return run;
  } catch { return null; }
}
