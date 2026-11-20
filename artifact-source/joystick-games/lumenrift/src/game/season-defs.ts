// The four seasonal campaigns: Spring (the Heartseed), Summer (the Sunwell), Autumn (the Great Lantern)
// and Winter (the Hearth). Each has its own structures, enemies, currency and core ability.
// Balance numbers follow the same curves as the Night and Day campaigns.
import type { BuildingDef, CoreLevel, EnemyDef } from './config';

export type SeasonRealm = 'spring' | 'summer' | 'autumn' | 'winter';

export type SeasonBuildingId =
  // spring
  | 'hedge'
  | 'seedspitter'
  | 'thistle'
  | 'beehive'
  | 'sprinkler'
  | 'snapper'
  | 'puffer'
  | 'mushroom'
  | 'willow'
  | 'brambler'
  | 'elderoak'
  // summer
  | 'sandwall'
  | 'slinger'
  | 'quicksand'
  | 'cistern'
  | 'mirror'
  | 'sandblaster'
  | 'naphtha'
  | 'sundial'
  | 'djinn'
  | 'stinger'
  | 'greatmirror'
  // autumn
  | 'fence'
  | 'candle'
  | 'saltring'
  | 'pumpkinpatch'
  | 'catapult'
  | 'spiritlantern'
  | 'cauldron'
  | 'ravens'
  | 'reanimator'
  | 'reaper'
  | 'clocktower'
  // winter
  | 'icewall'
  | 'snowballer'
  | 'icicles'
  | 'lodge'
  | 'harpoon'
  | 'brazier'
  | 'avalanche'
  | 'snowcannon'
  | 'aurora'
  | 'mammoth'
  | 'winterheart';

export type SeasonEnemyId =
  // spring: garden pests
  | 'slug'
  | 'hare'
  | 'crow'
  | 'badger'
  | 'mole'
  | 'snail'
  | 'locust'
  | 'moleking'
  | 'rookmother'
  // summer: the dune swarm
  | 'scarab'
  | 'skink'
  | 'vulture'
  | 'ram'
  | 'firebug'
  | 'mirage'
  | 'scorpion'
  | 'sandworm'
  | 'phoenix'
  // autumn: the hollow host
  | 'skeleton'
  | 'gremlin'
  | 'bat'
  | 'zombie'
  | 'ghost'
  | 'spidermother'
  | 'spiderling'
  | 'witch'
  | 'horseman'
  | 'banshee'
  // winter: the frost horde
  | 'snowling'
  | 'wolf'
  | 'owl'
  | 'yeti'
  | 'roller'
  | 'golem'
  | 'frostwraith'
  | 'frostgiant'
  | 'wyvern';

type B = Omit<BuildingDef, 'id' | 'realm'>;
const W = (r: SeasonRealm, defs: Record<string, B>) =>
  Object.fromEntries(Object.entries(defs).map(([id, d]) => [id, { ...d, id, realm: r }])) as Record<string, BuildingDef>;

// ======================================================================= spring: the Heartseed
const SPRING = W('spring', {
  hedge: {
    name: 'Hedgerow',
    blurb: 'A living wall. It slowly regrows its leaves and pricks whatever gnaws on it.',
    tier: 1, kind: 'wall', blocks: true, targets: 'none', color: '#5fae4a',
    levels: [
      { cost: 9, hp: 280, heal: 3, damage: 4, light: 0 },
      { cost: 19, hp: 700, heal: 6, damage: 8, light: 0 },
      { cost: 42, hp: 1600, heal: 12, damage: 16, light: 0.5 },
    ],
  },
  seedspitter: {
    name: 'Seed Spitter',
    blurb: 'A pod plant that spits hard seeds in quick bursts. Hits ground and air.',
    tier: 1, kind: 'tower', blocks: true, targets: 'both', color: '#9ad65a',
    levels: [
      { cost: 45, hp: 220, damage: 9, rate: 2.4, range: 3.4, light: 1.6 },
      { cost: 60, hp: 300, damage: 16, rate: 2.8, range: 3.7, light: 1.8 },
      { cost: 125, hp: 420, damage: 28, rate: 3.3, range: 4.1, light: 2 },
    ],
  },
  thistle: {
    name: 'Thistle Patch',
    blurb: 'Spiny weeds underfoot. Pricks and slows ground pests. Hares hop clean over it.',
    tier: 1, kind: 'trap', blocks: false, targets: 'ground', noTargeting: true, color: '#b07ad8',
    levels: [
      { cost: 30, hp: 1, damage: 8, rate: 3, slow: 0.25, light: 0.5 },
      { cost: 45, hp: 1, damage: 15, rate: 3, slow: 0.3, light: 0.6 },
      { cost: 90, hp: 1, damage: 27, rate: 3, slow: 0.35, light: 0.8 },
    ],
  },
  beehive: {
    name: 'Beehive',
    blurb: 'Bees make nectar on a flower meadow, paid out each day, and sting pests that come too close.',
    tier: 1, kind: 'eco', blocks: true, targets: 'both', onlyOn: 'crystal', color: '#f5c542',
    levels: [
      { cost: 95, hp: 250, income: 22, damage: 4, range: 2.2, light: 1.2 },
      { cost: 115, hp: 350, income: 46, damage: 7, range: 2.4, light: 1.4 },
      { cost: 190, hp: 500, income: 80, damage: 12, range: 2.6, light: 1.6 },
    ],
  },
  sprinkler: {
    name: 'Sprinkler',
    blurb: 'Sprays water in a slow circle. Soaks and slows pests, and leaves puddles behind.',
    tier: 2, kind: 'support', blocks: true, targets: 'ground', noTargeting: true, color: '#6cc8ff',
    levels: [
      { cost: 80, hp: 250, range: 2.4, slow: 0.3, rate: 1 / 7, light: 1.2 },
      { cost: 90, hp: 330, range: 2.7, slow: 0.38, rate: 1 / 6, light: 1.4 },
      { cost: 170, hp: 450, range: 3.0, slow: 0.46, rate: 1 / 5, light: 1.6 },
    ],
  },
  snapper: {
    name: 'Snapjaw',
    blurb: 'A carnivorous plant. Swallows small pests whole, then needs a moment to chew. Bites bigger ones.',
    tier: 2, kind: 'tower', blocks: true, targets: 'ground', color: '#e0505a',
    levels: [
      { cost: 100, hp: 300, damage: 45, rate: 0.6, range: 1.6, devour: 3, duration: 5, light: 1.4 },
      { cost: 120, hp: 400, damage: 80, rate: 0.65, range: 1.7, devour: 3.5, duration: 4.5, light: 1.6 },
      { cost: 230, hp: 540, damage: 140, rate: 0.7, range: 1.8, devour: 4, duration: 4, light: 1.8 },
    ],
  },
  puffer: {
    name: 'Pollen Puffer',
    blurb: 'Bursts clouds of pollen. Dazed pests stumble back the way they came.',
    tier: 3, kind: 'tower', blocks: true, targets: 'both', color: '#ffe066',
    levels: [
      { cost: 150, hp: 320, damage: 12, rate: 0.45, range: 3.6, splash: 1.1, confuse: 1.6, light: 1.6 },
      { cost: 170, hp: 430, damage: 22, rate: 0.5, range: 3.9, splash: 1.25, confuse: 2, light: 1.8 },
      { cost: 320, hp: 570, damage: 38, rate: 0.55, range: 4.2, splash: 1.4, confuse: 2.4, light: 2 },
    ],
  },
  mushroom: {
    name: 'Toadstool Ring',
    blurb: 'Puffs poisonous spores on whatever steps in. When a poisoned pest dies, the spores spread to its neighbours.',
    tier: 3, kind: 'trap', blocks: false, targets: 'ground', noTargeting: true, color: '#c86cff',
    levels: [
      { cost: 70, hp: 1, poison: 12, rate: 1.2, light: 0.6 },
      { cost: 80, hp: 1, poison: 22, rate: 1.2, light: 0.7 },
      { cost: 150, hp: 1, poison: 40, rate: 1.2, light: 0.9 },
    ],
  },
  willow: {
    name: 'Whipping Willow',
    blurb: 'Lashes out with long branches, striking several foes at once. Ground and air.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#7fbf6a',
    levels: [
      { cost: 280, hp: 380, damage: 70, rate: 0.8, range: 2.8, shots: 3, light: 1.8 },
      { cost: 300, hp: 500, damage: 115, rate: 0.85, range: 3.0, shots: 4, light: 2 },
      { cost: 520, hp: 660, damage: 190, rate: 0.9, range: 3.3, shots: 5, light: 2.2 },
    ],
  },
  brambler: {
    name: 'Bramble Catapult',
    blurb: 'Hurls thorn-balls that burst into bramble thickets, slowing and scratching everything that walks through.',
    tier: 4, kind: 'tower', blocks: true, targets: 'ground', color: '#8a6a3a',
    levels: [
      { cost: 260, hp: 340, damage: 60, rate: 0.4, range: 5.5, minRange: 1.4, splash: 1.0, poison: 15, duration: 5, light: 1.6 },
      { cost: 280, hp: 450, damage: 100, rate: 0.45, range: 6, minRange: 1.4, splash: 1.15, poison: 25, duration: 5, light: 1.8 },
      { cost: 500, hp: 600, damage: 170, rate: 0.5, range: 6.5, minRange: 1.4, splash: 1.3, poison: 40, duration: 5, light: 2 },
    ],
  },
  elderoak: {
    name: 'Elder Oak',
    blurb: 'An ancient tree. Its roots erupt across a huge area, seizing every walking foe and battering flyers.',
    tier: 5, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#c8a060',
    levels: [
      { cost: 620, hp: 520, damage: 300, rate: 0.12, range: 6, stun: 2, light: 3 },
      { cost: 670, hp: 680, damage: 500, rate: 0.14, range: 6.8, stun: 2.4, light: 3.3 },
      { cost: 1120, hp: 880, damage: 850, rate: 0.16, range: 7.5, stun: 2.8, light: 3.6 },
    ],
  },
});

// ======================================================================= summer: the Sunwell
const SUMMER = W('summer', {
  sandwall: {
    name: 'Sandstone Wall',
    blurb: 'Sun-baked blocks to steer the swarm. Rams and firebugs will break them.',
    tier: 1, kind: 'wall', blocks: true, targets: 'none', color: '#d9b77a',
    levels: [
      { cost: 9, hp: 300, light: 0 },
      { cost: 19, hp: 720, light: 0 },
      { cost: 42, hp: 1650, light: 0.5 },
    ],
  },
  slinger: {
    name: 'Slinger Post',
    blurb: 'A watch post whose slingers pelt foes with stones. Hits ground and air.',
    tier: 1, kind: 'tower', blocks: true, targets: 'both', color: '#e0a060',
    levels: [
      { cost: 45, hp: 220, damage: 16, rate: 1.4, range: 3.8, light: 1.6 },
      { cost: 60, hp: 300, damage: 28, rate: 1.65, range: 4.1, light: 1.8 },
      { cost: 125, hp: 420, damage: 48, rate: 2.0, range: 4.5, light: 2 },
    ],
  },
  quicksand: {
    name: 'Quicksand',
    blurb: 'Sucks at the feet of ground foes. Small ones that linger too long are swallowed whole.',
    tier: 1, kind: 'trap', blocks: false, targets: 'ground', noTargeting: true, color: '#c8a050',
    levels: [
      { cost: 35, hp: 1, slow: 0.35, damage: 3, duration: 3, light: 0.4 },
      { cost: 50, hp: 1, slow: 0.42, damage: 6, duration: 2.5, light: 0.5 },
      { cost: 95, hp: 1, slow: 0.5, damage: 10, duration: 2, light: 0.6 },
    ],
  },
  cistern: {
    name: 'Cistern',
    blurb: 'Gathers water from a desert spring. Pays out each day survived. Must stand on a spring.',
    tier: 1, kind: 'eco', blocks: true, targets: 'none', onlyOn: 'crystal', color: '#4fc8e0',
    levels: [
      { cost: 95, hp: 250, income: 25, light: 1.2 },
      { cost: 115, hp: 350, income: 52, light: 1.4 },
      { cost: 190, hp: 500, income: 88, light: 1.6 },
    ],
  },
  mirror: {
    name: 'Sun Mirror',
    blurb: 'Flashes a beam of reflected sun. Other mirrors close by relay the beam, and each relay makes it stronger.',
    tier: 2, kind: 'tower', blocks: true, targets: 'both', color: '#ffe9a0',
    levels: [
      { cost: 110, hp: 280, damage: 26, rate: 1.0, range: 4.0, chain: 2, light: 1.8 },
      { cost: 125, hp: 380, damage: 45, rate: 1.0, range: 4.3, chain: 2, light: 2 },
      { cost: 240, hp: 520, damage: 80, rate: 1.0, range: 4.6, chain: 3, light: 2.2 },
    ],
  },
  sandblaster: {
    name: 'Sandblaster',
    blurb: 'A roaring cone of grit that grinds away armour for good and slows the swarm.',
    tier: 2, kind: 'tower', blocks: true, targets: 'ground', noTargeting: true, color: '#e8c890',
    levels: [
      { cost: 95, hp: 280, damage: 18, rate: 1.0, range: 2.6, shred: 1, slow: 0.2, light: 1.4 },
      { cost: 110, hp: 380, damage: 32, rate: 1.1, range: 2.9, shred: 1.5, slow: 0.25, light: 1.6 },
      { cost: 210, hp: 520, damage: 55, rate: 1.2, range: 3.2, shred: 2, slow: 0.3, light: 1.8 },
    ],
  },
  naphtha: {
    name: 'Naphtha Thrower',
    blurb: 'Lobs pots of burning oil. The ground stays ablaze for a few seconds.',
    tier: 3, kind: 'tower', blocks: true, targets: 'ground', color: '#ff7a30',
    levels: [
      { cost: 150, hp: 320, damage: 40, rate: 0.45, range: 4.5, minRange: 1.2, splash: 1.0, burn: 14, duration: 4, light: 2 },
      { cost: 170, hp: 430, damage: 70, rate: 0.5, range: 5, minRange: 1.2, splash: 1.1, burn: 24, duration: 4, light: 2.2 },
      { cost: 320, hp: 570, damage: 120, rate: 0.55, range: 5.5, minRange: 1.2, splash: 1.2, burn: 40, duration: 4, light: 2.4 },
    ],
  },
  sundial: {
    name: 'Sundial',
    blurb: 'Every fifteen seconds it strikes High Noon: every tower in its shadow fires much faster for a few seconds.',
    tier: 3, kind: 'support', blocks: true, targets: 'none', noTargeting: true, color: '#ffd24a',
    levels: [
      { cost: 140, hp: 280, range: 3.2, buff: 0.5, duration: 5, rate: 1 / 15, light: 1.6 },
      { cost: 150, hp: 370, range: 3.6, buff: 0.65, duration: 5, rate: 1 / 15, light: 1.8 },
      { cost: 280, hp: 500, range: 4.0, buff: 0.8, duration: 5.5, rate: 1 / 15, light: 2 },
    ],
  },
  djinn: {
    name: 'Djinn Lamp',
    blurb: 'Its djinn spins up a whirlwind that snatches a foe and drops it far back along its path.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', color: '#7ae0d8',
    levels: [
      { cost: 270, hp: 340, damage: 60, rate: 0.25, range: 5, pull: 3, stun: 1.2, light: 2 },
      { cost: 290, hp: 450, damage: 100, rate: 0.28, range: 5.5, pull: 3.5, stun: 1.2, light: 2.2 },
      { cost: 520, hp: 600, damage: 170, rate: 0.32, range: 6, pull: 4, stun: 1.2, light: 2.4 },
    ],
  },
  stinger: {
    name: 'Stinger Ballista',
    blurb: 'Long-range bolts tipped with scorpion venom. Every hit stacks more poison.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', color: '#b0d050',
    levels: [
      { cost: 260, hp: 340, damage: 70, rate: 0.5, range: 7, poison: 20, light: 1.8 },
      { cost: 280, hp: 450, damage: 115, rate: 0.55, range: 7.5, poison: 35, light: 2 },
      { cost: 500, hp: 600, damage: 200, rate: 0.6, range: 8, poison: 60, light: 2.2 },
    ],
  },
  greatmirror: {
    name: 'Great Sun Mirror',
    blurb: 'A colossal mirror that sweeps a blazing beam all the way around itself, searing everything it touches.',
    tier: 5, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#fff2b0',
    levels: [
      { cost: 640, hp: 520, damage: 180, rate: 1 / 6, range: 7, light: 3.4 },
      { cost: 690, hp: 680, damage: 300, rate: 1 / 5.5, range: 8, light: 3.7 },
      { cost: 1150, hp: 880, damage: 500, rate: 1 / 5, range: 9, light: 4 },
    ],
  },
});

// ======================================================================= autumn: the Great Lantern
const AUTUMN = W('autumn', {
  fence: {
    name: 'Graveyard Fence',
    blurb: 'Wrought iron and headstones to bend the host. Zombies smash through; ghosts drift right over.',
    tier: 1, kind: 'wall', blocks: true, targets: 'none', color: '#8a8a9a',
    levels: [
      { cost: 9, hp: 260, light: 0 },
      { cost: 19, hp: 650, light: 0 },
      { cost: 42, hp: 1500, light: 0.6 },
    ],
  },
  candle: {
    name: 'Candle Tower',
    blurb: 'Flicks spitting flame wisps at ground and air. Its light shows ghosts that come close.',
    tier: 1, kind: 'tower', blocks: true, targets: 'both', color: '#ffb050',
    levels: [
      { cost: 45, hp: 220, damage: 13, rate: 1.7, range: 3.5, reveal: 1.6, light: 2.2 },
      { cost: 60, hp: 300, damage: 24, rate: 2.0, range: 3.8, reveal: 1.8, light: 2.5 },
      { cost: 125, hp: 420, damage: 42, rate: 2.4, range: 4.2, reveal: 2.0, light: 2.8 },
    ],
  },
  saltring: {
    name: 'Salt Circle',
    blurb: 'A ring of salt on the ground. Burns whatever crosses it, and ghosts most of all: it even catches them in flight.',
    tier: 1, kind: 'trap', blocks: false, targets: 'both', noTargeting: true, color: '#e8eef8',
    levels: [
      { cost: 30, hp: 1, damage: 9, rate: 3, slow: 0.5, light: 0.6 },
      { cost: 45, hp: 1, damage: 17, rate: 3, slow: 0.5, light: 0.8 },
      { cost: 90, hp: 1, damage: 30, rate: 3, slow: 0.5, light: 1 },
    ],
  },
  pumpkinpatch: {
    name: 'Pumpkin Patch',
    blurb: 'Grows candy-stuffed pumpkins on a pumpkin field. Pays out each night survived.',
    tier: 1, kind: 'eco', blocks: true, targets: 'none', onlyOn: 'crystal', color: '#ff9030',
    levels: [
      { cost: 90, hp: 250, income: 24, light: 1.6 },
      { cost: 110, hp: 350, income: 50, light: 1.9 },
      { cost: 180, hp: 500, income: 85, light: 2.2 },
    ],
  },
  catapult: {
    name: 'Pumpkin Catapult',
    blurb: 'Flings carved pumpkins that burst on impact and scatter smaller blazing pumpkins.',
    tier: 2, kind: 'tower', blocks: true, targets: 'ground', color: '#ff7a20',
    levels: [
      { cost: 110, hp: 280, damage: 34, rate: 0.5, range: 5.5, minRange: 1.6, splash: 1.0, shots: 3, light: 2 },
      { cost: 130, hp: 380, damage: 58, rate: 0.55, range: 6, minRange: 1.6, splash: 1.1, shots: 4, light: 2.3 },
      { cost: 240, hp: 520, damage: 100, rate: 0.6, range: 6.5, minRange: 1.6, splash: 1.2, shots: 5, light: 2.6 },
    ],
  },
  spiritlantern: {
    name: 'Spirit Lantern',
    blurb: 'Its pale light reveals ghosts so your towers can hit them, curses every foe in reach to take more damage, and lifts hexes.',
    tier: 2, kind: 'support', blocks: true, targets: 'none', noTargeting: true, color: '#9fffd8',
    levels: [
      { cost: 70, hp: 240, range: 3.5, reveal: 3.5, buff: 0.2, light: 2.6 },
      { cost: 80, hp: 320, range: 4, reveal: 4, buff: 0.3, light: 3 },
      { cost: 150, hp: 440, range: 4.6, reveal: 4.6, buff: 0.4, light: 3.4 },
    ],
  },
  cauldron: {
    name: "Witch's Cauldron",
    blurb: 'Hurls bubbling potions with a random effect: a poison puddle, a curse that makes foes take double damage, or a blast.',
    tier: 3, kind: 'tower', blocks: true, targets: 'ground', noTargeting: true, color: '#7aff5a',
    levels: [
      { cost: 150, hp: 320, damage: 40, rate: 0.35, range: 3.5, splash: 1.2, poison: 16, duration: 4, light: 2 },
      { cost: 170, hp: 430, damage: 70, rate: 0.4, range: 3.8, splash: 1.3, poison: 28, duration: 4, light: 2.2 },
      { cost: 320, hp: 570, damage: 120, rate: 0.45, range: 4.2, splash: 1.4, poison: 48, duration: 4.5, light: 2.4 },
    ],
  },
  ravens: {
    name: 'Raven Roost',
    blurb: 'Ravens peck at several foes and mark them. Marked foes drop extra candy when they fall.',
    tier: 3, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#7a6aa8',
    levels: [
      { cost: 130, hp: 300, damage: 10, rate: 1.2, range: 4.5, shots: 2, greed: 0.5, light: 1.4 },
      { cost: 150, hp: 400, damage: 18, rate: 1.2, range: 5, shots: 3, greed: 0.75, light: 1.6 },
      { cost: 280, hp: 540, damage: 30, rate: 1.2, range: 5.5, shots: 4, greed: 1, light: 1.8 },
    ],
  },
  reanimator: {
    name: 'Reanimator Coil',
    blurb: 'Arcs crackling bolts between foes. Those it kills rise again as zombies that fight on your side.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', color: '#7affc0',
    levels: [
      { cost: 270, hp: 360, damage: 50, rate: 0.9, range: 3.6, chain: 3, duration: 12, light: 2.6 },
      { cost: 290, hp: 480, damage: 85, rate: 0.9, range: 3.9, chain: 4, duration: 12, light: 2.9 },
      { cost: 520, hp: 640, damage: 140, rate: 0.9, range: 4.2, chain: 5, duration: 14, light: 3.2 },
    ],
  },
  reaper: {
    name: "Reaper's Scythe",
    blurb: 'A spectral blade that harvests the weak: any lesser foe below the threshold is cut down outright.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', color: '#c0c8ff',
    levels: [
      { cost: 260, hp: 340, damage: 140, rate: 0.3, range: 4.5, execute: 0.25, light: 1.8 },
      { cost: 280, hp: 450, damage: 230, rate: 0.33, range: 5, execute: 0.3, light: 2 },
      { cost: 500, hp: 600, damage: 380, rate: 0.37, range: 5.5, execute: 0.35, light: 2.2 },
    ],
  },
  clocktower: {
    name: 'Midnight Clock',
    blurb: 'When it strikes, time stops for every foe in a huge radius, and its hands cut through them.',
    tier: 5, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#ffe8a0',
    levels: [
      { cost: 620, hp: 520, damage: 200, rate: 1 / 14, range: 6, stun: 2, light: 3.4 },
      { cost: 670, hp: 680, damage: 340, rate: 1 / 13, range: 6.8, stun: 2.4, light: 3.7 },
      { cost: 1120, hp: 880, damage: 560, rate: 1 / 12, range: 7.5, stun: 2.8, light: 4 },
    ],
  },
});

// ======================================================================= winter: the Hearth
const WINTER = W('winter', {
  icewall: {
    name: 'Ice Wall',
    blurb: 'Packed snow and ice. Chills whatever claws at it. Yetis will break through.',
    tier: 1, kind: 'wall', blocks: true, targets: 'none', color: '#bfe6ff',
    levels: [
      { cost: 9, hp: 280, slow: 0.3, light: 0 },
      { cost: 19, hp: 690, slow: 0.35, light: 0 },
      { cost: 42, hp: 1600, slow: 0.4, light: 0.6 },
    ],
  },
  snowballer: {
    name: 'Snowball Fort',
    blurb: 'Pelts foes with packed snowballs that briefly slow them. Ground and air.',
    tier: 1, kind: 'tower', blocks: true, targets: 'both', color: '#e8f4ff',
    levels: [
      { cost: 45, hp: 220, damage: 12, rate: 1.7, range: 3.5, slow: 0.15, light: 1.6 },
      { cost: 60, hp: 300, damage: 22, rate: 2.0, range: 3.8, slow: 0.2, light: 1.8 },
      { cost: 125, hp: 420, damage: 38, rate: 2.4, range: 4.2, slow: 0.25, light: 2 },
    ],
  },
  icicles: {
    name: 'Icicle Field',
    blurb: 'Ice spikes jut from the snow and shatter under ground foes, spraying shards around.',
    tier: 1, kind: 'trap', blocks: false, targets: 'ground', noTargeting: true, color: '#9fdcff',
    levels: [
      { cost: 30, hp: 1, damage: 10, rate: 3, splash: 0.6, light: 0.6 },
      { cost: 45, hp: 1, damage: 19, rate: 3, splash: 0.7, light: 0.8 },
      { cost: 90, hp: 1, damage: 34, rate: 3, splash: 0.8, light: 1 },
    ],
  },
  lodge: {
    name: "Woodcutter's Lodge",
    blurb: 'Fells timber in a pine stand for the Hearth. Pays out each night survived. Must stand in a pine stand.',
    tier: 1, kind: 'eco', blocks: true, targets: 'none', onlyOn: 'crystal', color: '#d08a4a',
    levels: [
      { cost: 90, hp: 260, income: 24, light: 1.4 },
      { cost: 110, hp: 360, income: 50, light: 1.6 },
      { cost: 180, hp: 520, income: 85, light: 1.8 },
    ],
  },
  harpoon: {
    name: 'Harpoon Gun',
    blurb: 'Spears a foe and reels it back along its path.',
    tier: 2, kind: 'tower', blocks: true, targets: 'both', color: '#a0b8d0',
    levels: [
      { cost: 110, hp: 280, damage: 45, rate: 0.45, range: 4.5, pull: 1.5, light: 1.4 },
      { cost: 125, hp: 380, damage: 80, rate: 0.5, range: 4.9, pull: 1.9, light: 1.6 },
      { cost: 240, hp: 520, damage: 135, rate: 0.55, range: 5.3, pull: 2.3, light: 1.8 },
    ],
  },
  brazier: {
    name: 'Fire Brazier',
    blurb: 'Warmth! Nearby structures cannot be frozen and thaw at once. Its heat singes foes that come close.',
    tier: 2, kind: 'support', blocks: true, targets: 'both', noTargeting: true, color: '#ff8a3a',
    levels: [
      { cost: 80, hp: 250, range: 2.6, burn: 8, light: 2.8 },
      { cost: 90, hp: 330, range: 3.0, burn: 14, light: 3.2 },
      { cost: 170, hp: 450, range: 3.4, burn: 24, light: 3.6 },
    ],
  },
  avalanche: {
    name: 'Avalanche Ledge',
    blurb: 'Builds up a mass of snow. When it is primed, tap it and choose your moment: the avalanche crushes and buries everything below.',
    tier: 3, kind: 'tower', blocks: true, targets: 'ground', noTargeting: true, color: '#f0f8ff',
    levels: [
      { cost: 140, hp: 320, damage: 250, range: 3.2, splash: 1.6, stun: 2.5, charge: 18, light: 1.4 },
      { cost: 160, hp: 430, damage: 420, range: 3.5, splash: 1.8, stun: 3, charge: 16, light: 1.6 },
      { cost: 300, hp: 570, damage: 700, range: 3.8, splash: 2.0, stun: 3.5, charge: 14, light: 1.8 },
    ],
  },
  snowcannon: {
    name: 'Snow Cannon',
    blurb: 'Fires a giant snowball that rolls back down the path, growing as it flattens every foe in its way.',
    tier: 3, kind: 'tower', blocks: true, targets: 'ground', color: '#dfefff',
    levels: [
      { cost: 160, hp: 320, damage: 35, rate: 0.35, range: 5, duration: 2, light: 1.6 },
      { cost: 180, hp: 430, damage: 60, rate: 0.4, range: 5.5, duration: 2.4, light: 1.8 },
      { cost: 340, hp: 570, damage: 100, rate: 0.45, range: 6, duration: 2.8, light: 2 },
    ],
  },
  aurora: {
    name: 'Aurora Spire',
    blurb: 'Bathes a foe in shimmering light. Held long enough, it freezes solid, then shatters for heavy damage.',
    tier: 4, kind: 'tower', blocks: true, targets: 'both', color: '#7affd0',
    levels: [
      { cost: 280, hp: 360, damage: 30, range: 4.8, stun: 1.4, light: 2.8 },
      { cost: 300, hp: 480, damage: 50, range: 5.2, stun: 1.4, light: 3.1 },
      { cost: 520, hp: 640, damage: 85, range: 5.6, stun: 1.6, light: 3.4 },
    ],
  },
  mammoth: {
    name: 'Mammoth Pen',
    blurb: 'Releases a war mammoth that charges down the path, trampling and tossing foes aside, then plods home.',
    tier: 4, kind: 'tower', blocks: true, targets: 'ground', noTargeting: true, color: '#b08a6a',
    levels: [
      { cost: 280, hp: 400, damage: 90, rate: 1 / 14, range: 7, push: 0.6, light: 1.6 },
      { cost: 300, hp: 520, damage: 150, rate: 1 / 12.5, range: 8, push: 0.7, light: 1.8 },
      { cost: 540, hp: 700, damage: 250, rate: 1 / 11, range: 9, push: 0.8, light: 2 },
    ],
  },
  winterheart: {
    name: "Winter's Heart",
    blurb: 'A shard of the deep cold. Its pulse freezes every lesser foe in a huge radius, and frozen foes take extra damage.',
    tier: 5, kind: 'tower', blocks: true, targets: 'both', noTargeting: true, color: '#a8f0ff',
    levels: [
      { cost: 620, hp: 520, damage: 150, rate: 1 / 11, range: 6, stun: 2.5, light: 3.4 },
      { cost: 670, hp: 680, damage: 250, rate: 1 / 10, range: 6.8, stun: 3, light: 3.7 },
      { cost: 1120, hp: 880, damage: 420, rate: 1 / 9, range: 7.5, stun: 3.5, light: 4 },
    ],
  },
});

export const SEASON_BUILDINGS: Record<SeasonBuildingId, BuildingDef> = { ...SPRING, ...SUMMER, ...AUTUMN, ...WINTER } as Record<SeasonBuildingId, BuildingDef>;

export const SEASON_BUILD_ORDER: Record<SeasonRealm, SeasonBuildingId[]> = {
  spring: ['hedge', 'seedspitter', 'thistle', 'beehive', 'sprinkler', 'snapper', 'puffer', 'mushroom', 'willow', 'brambler', 'elderoak'],
  summer: ['sandwall', 'slinger', 'quicksand', 'cistern', 'mirror', 'sandblaster', 'naphtha', 'sundial', 'djinn', 'stinger', 'greatmirror'],
  autumn: ['fence', 'candle', 'saltring', 'pumpkinpatch', 'catapult', 'spiritlantern', 'cauldron', 'ravens', 'reanimator', 'reaper', 'clocktower'],
  winter: ['icewall', 'snowballer', 'icicles', 'lodge', 'harpoon', 'brazier', 'avalanche', 'snowcannon', 'aurora', 'mammoth', 'winterheart'],
};

// ======================================================================= enemies
type E = Omit<EnemyDef, 'id' | 'realm'>;
const EW = (r: SeasonRealm, defs: Record<string, E>) =>
  Object.fromEntries(Object.entries(defs).map(([id, d]) => [id, { ...d, id, realm: r }])) as Record<string, EnemyDef>;

const SPRING_E = EW('spring', {
  slug: { role: 'basic', traits: { slime: true }, name: 'Slug', hp: 44, speed: 0.85, armor: 0, bounty: 4, damage: 8, leak: 13, attackRate: 1, radius: 0.28, flying: false, breaker: false, threat: 1, firstWave: 1, color: '#8a9a5a', eye: '#e8ff7a' },
  hare: { role: 'fast', traits: { hop: true }, name: 'March Hare', hp: 14, speed: 2.3, armor: 0, bounty: 2, damage: 3, leak: 6, attackRate: 1.6, radius: 0.22, flying: false, breaker: false, threat: 0.45, firstWave: 3, color: '#b89a7a', eye: '#ff6a6a' },
  crow: { role: 'flyer', name: 'Crow', hp: 40, speed: 1.35, armor: 0, bounty: 6, damage: 9, leak: 16, attackRate: 1, radius: 0.3, flying: true, breaker: false, threat: 1.6, firstWave: 5, color: '#2a2a38', eye: '#ffd24a' },
  badger: { role: 'breaker', name: 'Badger', hp: 210, speed: 0.65, armor: 3, bounty: 14, damage: 36, leak: 52, attackRate: 0.8, radius: 0.4, flying: false, breaker: true, threat: 5, firstWave: 7, color: '#4a4a4a', eye: '#ff8a4a' },
  mole: { role: 'special', traits: { burrow: true }, name: 'Mole', hp: 70, speed: 0.9, armor: 1, bounty: 7, damage: 10, leak: 22, attackRate: 1, radius: 0.3, flying: false, breaker: false, threat: 2.5, firstWave: 9, color: '#5a4a5a', eye: '#ffb0d0' },
  snail: { role: 'armored', traits: { shell: true }, name: 'Armoured Snail', hp: 110, speed: 0.55, armor: 9, bounty: 11, damage: 12, leak: 34, attackRate: 1, radius: 0.35, flying: false, breaker: false, threat: 4, firstWave: 12, color: '#a08060', eye: '#d0ff6a' },
  locust: { role: 'special', name: 'Locust', hp: 14, speed: 1.9, armor: 0, bounty: 2, damage: 3, leak: 5, attackRate: 1.6, radius: 0.2, flying: true, breaker: false, threat: 0.5, firstWave: 14, color: '#8a9a3a', eye: '#ff5a3a' },
  moleking: { role: 'bossGround', traits: { burrow: true }, spawns: { id: 'mole', n: 2, every: 7 }, name: 'The Mole King', hp: 800, speed: 0.38, armor: 4, bounty: 230, damage: 62, leak: 0, attackRate: 0.5, radius: 0.7, flying: false, breaker: false, threat: 60, firstWave: 10, color: '#4a3a4a', eye: '#ff6ab0', boss: true },
  rookmother: { role: 'bossAir', spawns: { id: 'crow', n: 3, every: 6 }, name: 'The Rook Matriarch', hp: 1400, speed: 0.56, armor: 1, bounty: 240, damage: 46, leak: 0, attackRate: 0.6, radius: 0.65, flying: true, breaker: false, threat: 60, firstWave: 20, color: '#1e1e2a', eye: '#ffe04a', boss: true },
});

const SUMMER_E = EW('summer', {
  scarab: { role: 'basic', name: 'Scarab', hp: 42, speed: 1.0, armor: 1, bounty: 4, damage: 8, leak: 14, attackRate: 1, radius: 0.28, flying: false, breaker: false, threat: 1, firstWave: 1, color: '#3a6a6a', eye: '#7affe0' },
  skink: { role: 'fast', name: 'Sand Skink', hp: 15, speed: 2.2, armor: 0, bounty: 2, damage: 4, leak: 6, attackRate: 1.5, radius: 0.21, flying: false, breaker: false, threat: 0.45, firstWave: 3, color: '#c8a060', eye: '#ffef6a' },
  vulture: { role: 'flyer', name: 'Vulture', hp: 48, speed: 1.2, armor: 0, bounty: 6, damage: 9, leak: 17, attackRate: 1, radius: 0.32, flying: true, breaker: false, threat: 1.6, firstWave: 5, color: '#5a4030', eye: '#ff7a4a' },
  ram: { role: 'breaker', name: 'Dune Ram', hp: 200, speed: 0.7, armor: 3, bounty: 14, damage: 38, leak: 52, attackRate: 0.8, radius: 0.4, flying: false, breaker: true, threat: 5, firstWave: 6, color: '#a07a50', eye: '#ffb04a' },
  firebug: { role: 'special', traits: { bomb: 1.3 }, name: 'Firebug', hp: 55, speed: 1.1, armor: 0, bounty: 7, damage: 160, leak: 20, attackRate: 1, radius: 0.27, flying: false, breaker: true, threat: 2.5, firstWave: 9, color: '#a03a1a', eye: '#ffd03a' },
  mirage: { role: 'special', traits: { decoy: true }, name: 'Mirage', hp: 70, speed: 0.95, armor: 0, bounty: 10, damage: 8, leak: 24, attackRate: 1, radius: 0.32, flying: false, breaker: false, threat: 3.5, firstWave: 11, color: '#7a8ad0', eye: '#e0f0ff' },
  scorpion: { role: 'armored', traits: { disable: { kind: 'hex', r: 1.6, every: 5, dur: 3 } }, name: 'Scorpion', hp: 115, speed: 0.8, armor: 9, bounty: 11, damage: 14, leak: 34, attackRate: 1, radius: 0.36, flying: false, breaker: false, threat: 4, firstWave: 13, color: '#6a3a2a', eye: '#ff4a4a' },
  sandworm: { role: 'bossGround', traits: { burrow: true }, spawns: { id: 'scarab', n: 3, every: 7 }, name: 'The Sandworm', hp: 820, speed: 0.4, armor: 5, bounty: 230, damage: 65, leak: 0, attackRate: 0.5, radius: 0.72, flying: false, breaker: false, threat: 60, firstWave: 10, color: '#a08050', eye: '#ff5a2a', boss: true },
  phoenix: { role: 'bossAir', traits: { revive: 1 }, spawns: { id: 'vulture', n: 2, every: 7 }, name: 'The Phoenix', hp: 1100, speed: 0.6, armor: 1, bounty: 250, damage: 48, leak: 0, attackRate: 0.6, radius: 0.66, flying: true, breaker: false, threat: 60, firstWave: 20, color: '#c04018', eye: '#ffe060', boss: true },
});

const AUTUMN_E = EW('autumn', {
  skeleton: { role: 'basic', traits: { revive: 0.5 }, name: 'Skeleton', hp: 34, speed: 1.0, armor: 0, bounty: 4, damage: 8, leak: 14, attackRate: 1, radius: 0.27, flying: false, breaker: false, threat: 1.1, firstWave: 1, color: '#d8d0c0', eye: '#ff7a2a' },
  gremlin: { role: 'fast', name: 'Gremlin', hp: 15, speed: 2.1, armor: 0, bounty: 2, damage: 4, leak: 7, attackRate: 1.5, radius: 0.21, flying: false, breaker: false, threat: 0.5, firstWave: 3, color: '#4a6a3a', eye: '#ffe03a' },
  bat: { role: 'flyer', name: 'Vampire Bat', hp: 36, speed: 1.5, armor: 0, bounty: 6, damage: 9, leak: 15, attackRate: 1, radius: 0.27, flying: true, breaker: false, threat: 1.6, firstWave: 5, color: '#3a2238', eye: '#ff3a5a' },
  zombie: { role: 'breaker', name: 'Gravebreaker', hp: 230, speed: 0.55, armor: 2, bounty: 14, damage: 34, leak: 55, attackRate: 0.8, radius: 0.4, flying: false, breaker: true, threat: 5, firstWave: 7, color: '#5a7a5a', eye: '#d0ff5a' },
  ghost: { role: 'special', traits: { ethereal: true }, name: 'Ghost', hp: 50, speed: 1.0, armor: 0, bounty: 8, damage: 8, leak: 20, attackRate: 1, radius: 0.3, flying: true, breaker: false, threat: 2.2, firstWave: 9, color: '#c8e0ff', eye: '#7af0ff' },
  spidermother: { role: 'splitter', spawns: { id: 'spiderling', n: 4 }, name: 'Spider Matriarch', hp: 100, speed: 0.85, armor: 0, bounty: 7, damage: 10, leak: 25, attackRate: 1, radius: 0.37, flying: false, breaker: false, threat: 3, firstWave: 11, color: '#2a2030', eye: '#ff5ad0' },
  spiderling: { role: 'special', name: 'Spiderling', hp: 12, speed: 1.9, armor: 0, bounty: 1, damage: 3, leak: 5, attackRate: 1.5, radius: 0.17, flying: false, breaker: false, threat: 0.4, firstWave: 99, color: '#2a2030', eye: '#ff5ad0' },
  witch: { role: 'special', traits: { disable: { kind: 'hex', r: 3, every: 6, dur: 4 } }, name: 'Witch', hp: 70, speed: 1.1, armor: 0, bounty: 12, damage: 8, leak: 26, attackRate: 1, radius: 0.32, flying: true, breaker: false, threat: 4, firstWave: 13, color: '#3a2a4a', eye: '#a0ff5a' },
  horseman: { role: 'bossGround', traits: { dash: true }, spawns: { id: 'skeleton', n: 3, every: 7 }, name: 'The Headless Horseman', hp: 850, speed: 0.45, armor: 4, bounty: 230, damage: 62, leak: 0, attackRate: 0.5, radius: 0.7, flying: false, breaker: true, threat: 60, firstWave: 10, color: '#2a1a1a', eye: '#ff8a1a', boss: true },
  banshee: { role: 'bossAir', traits: { disable: { kind: 'hex', r: 2.5, every: 9, dur: 4, aoe: true } }, spawns: { id: 'ghost', n: 2, every: 7 }, name: 'The Banshee', hp: 1400, speed: 0.55, armor: 2, bounty: 240, damage: 44, leak: 0, attackRate: 0.6, radius: 0.65, flying: true, breaker: false, threat: 60, firstWave: 20, color: '#a8c0e0', eye: '#e0f8ff', boss: true },
});

const WINTER_E = EW('winter', {
  snowling: { role: 'basic', name: 'Snowling', hp: 40, speed: 0.95, armor: 0, bounty: 4, damage: 8, leak: 13, attackRate: 1, radius: 0.28, flying: false, breaker: false, threat: 1, firstWave: 1, color: '#e8f0fa', eye: '#3a8aff' },
  wolf: { role: 'fast', traits: { pack: true }, name: 'Frost Wolf', hp: 17, speed: 2.1, armor: 0, bounty: 2, damage: 4, leak: 7, attackRate: 1.5, radius: 0.24, flying: false, breaker: false, threat: 0.5, firstWave: 3, color: '#8a9ab0', eye: '#7af0ff' },
  owl: { role: 'flyer', name: 'Snow Owl', hp: 42, speed: 1.3, armor: 0, bounty: 6, damage: 9, leak: 16, attackRate: 1, radius: 0.3, flying: true, breaker: false, threat: 1.6, firstWave: 5, color: '#e0e4ea', eye: '#ffc83a' },
  yeti: { role: 'breaker', name: 'Yeti', hp: 230, speed: 0.6, armor: 3, bounty: 15, damage: 40, leak: 55, attackRate: 0.8, radius: 0.42, flying: false, breaker: true, threat: 5, firstWave: 7, color: '#d8e0ea', eye: '#3ad0ff' },
  roller: { role: 'special', traits: { grow: true }, name: 'Snowball Roller', hp: 50, speed: 0.8, armor: 0, bounty: 8, damage: 10, leak: 25, attackRate: 1, radius: 0.3, flying: false, breaker: false, threat: 2.5, firstWave: 9, color: '#f0f6ff', eye: '#5a8aff' },
  golem: { role: 'armored', traits: { deathSpawn: { id: 'snowling', n: 2 } }, name: 'Ice Golem', hp: 120, speed: 0.7, armor: 9, bounty: 12, damage: 14, leak: 34, attackRate: 1, radius: 0.38, flying: false, breaker: false, threat: 4.5, firstWave: 11, color: '#8ac8e8', eye: '#e0ffff' },
  frostwraith: { role: 'special', traits: { disable: { kind: 'freeze', r: 2.5, every: 6, dur: 3.5 } }, name: 'Frost Wraith', hp: 65, speed: 1.15, armor: 0, bounty: 12, damage: 8, leak: 24, attackRate: 1, radius: 0.32, flying: true, breaker: false, threat: 4, firstWave: 13, color: '#5a7aa8', eye: '#bff6ff' },
  frostgiant: { role: 'bossGround', traits: { disable: { kind: 'freeze', r: 2.2, every: 11, dur: 3, aoe: true } }, spawns: { id: 'snowling', n: 3, every: 7 }, name: 'The Frost Giant', hp: 900, speed: 0.4, armor: 5, bounty: 230, damage: 66, leak: 0, attackRate: 0.5, radius: 0.74, flying: false, breaker: true, threat: 60, firstWave: 10, color: '#9ab8d8', eye: '#5af0ff', boss: true },
  wyvern: { role: 'bossAir', traits: { disable: { kind: 'freeze', r: 2, every: 7, dur: 3.5, aoe: true } }, spawns: { id: 'owl', n: 2, every: 6 }, name: 'The Ice Wyvern', hp: 1400, speed: 0.56, armor: 2, bounty: 245, damage: 48, leak: 0, attackRate: 0.6, radius: 0.66, flying: true, breaker: false, threat: 60, firstWave: 20, color: '#6a9ac8', eye: '#c0ffff', boss: true },
});

export const SEASON_ENEMIES: Record<SeasonEnemyId, EnemyDef> = { ...SPRING_E, ...SUMMER_E, ...AUTUMN_E, ...WINTER_E } as Record<SeasonEnemyId, EnemyDef>;

// ======================================================================= cores
const core = (hp: number, dmg: number, nova: number): CoreLevel[] => [
  { upgradeCost: 0, hp, damage: dmg, rate: 1.5, range: 4.3, nova, light: 6 },
  { upgradeCost: 270, hp: Math.round(hp * 1.48), damage: Math.round(dmg * 1.8), rate: 1.62, range: 4.7, nova: Math.round(nova * 2.2), light: 6.8 },
  { upgradeCost: 570, hp: Math.round(hp * 2.08), damage: Math.round(dmg * 2.9), rate: 1.8, range: 5.1, nova: Math.round(nova * 4.4), light: 7.6 },
  { upgradeCost: 970, hp: Math.round(hp * 2.76), damage: Math.round(dmg * 4.5), rate: 2.0, range: 5.5, nova: Math.round(nova * 8), light: 8.4 },
  { upgradeCost: 1650, hp: Math.round(hp * 3.52), damage: Math.round(dmg * 7), rate: 2.2, range: 5.9, nova: Math.round(nova * 13.4), light: 9.2 },
];

export const SEASON_CORES: Record<SeasonRealm, CoreLevel[]> = {
  spring: core(1050, 15, 90),
  summer: core(1000, 16, 120),
  autumn: core(1000, 16, 60),
  winter: core(1100, 15, 110),
};
