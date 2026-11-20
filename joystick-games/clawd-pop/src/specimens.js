// These extend the upstream simulation tables. Geometry still uses the shared
// instanced specimen meshes, including hit flashes and attack wind-ups.
export const specimens = {
  codexSentinel: {
    label: 'Codex Sentinel', hint: 'Twin bolts — sidestep the volley', score: 210,
    encounter: { sector: 2, base: .045, perSector: .005, max: .065, lead: 1 },
    rule: {
      scale: .94, hp: 100, radius: .52, height: 1.36, speed: 3.2, turnRate: 6,
      damage: 6, threatCost: 2, approach: { spread: 2, commitDistance: 1, keepAway: { min: 5, max: 9, strafe: .9 } },
      ranged: { firstDelay: 1.1, windUp: .95, interval: 3.4, enrageBelow: 0, enragedInterval: 3.4,
        shots: 2, spread: .15, damage: 6, lead: .6, speed: 9 }
    },
    skin: {
      tint: [.23, 2.1, 1.8], body: [.96, .81, 1.06], side: [1.05, .62, .92],
      plate: { tint: [.07, .4, .47] }, glow: { kind: 'vent', color: [.03, 1.55, .83] }
    }
  },
  emberHopper: {
    label: 'Ember Hopper', hint: 'Short high leap — its burst also hits nearby specimens', score: 190,
    encounter: { sector: 4, base: .04, perSector: .005, max: .06, lead: 1 },
    rule: {
      scale: .76, hp: 100, radius: .44, height: 1.1, speed: 3.8, turnRate: 7.5,
      damage: 12, threatCost: 2, approach: { spread: 2.7, commitDistance: .5 },
      attack: { range: 4.8, windUpTime: .68, lungeTime: .45, lungeSpeed: 0,
        recoverTime: .96, contactPad: .2, leap: { apex: 1.7, maxDistance: 5.8, contactFrom: .65 } },
      blast: { radius: 2.1, playerDamage: 9, enemyDamage: 110 }
    },
    skin: {
      tint: [1.34, .56, .65], body: [1.13, .66, 1.05], stance: 1.1,
      rearLeg: { length: 1.45, girth: 1.7, out: .47, back: .13, haunch: .85 },
      glow: { kind: 'seams', color: [1.7, .08, .14] }, crouch: .44, crouchRear: .21
    }
  }
};

const entries = Object.entries(specimens);
const table = project => Object.fromEntries(entries.map(([name, value]) => [name, project(value, name)]));
export const lab = {
  rules: table((value, name) => ({ name, ...value.rule })),
  skins: defaults => table(({ skin }) => ({ ...defaults, ...skin, rearLeg: { ...defaults.rearLeg, ...skin.rearLeg } })),
  scores: table(value => value.score),
  names: table(value => value.label),
  hints: table(value => value.hint),
  introductions: entries.map(([variant, value]) => ({ variant, ...value.encounter })),
  picker: entries.map(([variant]) => ({ variant, chance: room => room[variant + 'Chance'] || 0 })),
  chances: (curve, sector, critical, schedule) =>
    table((_, name) => curve(sector, name, critical, schedule))
};
