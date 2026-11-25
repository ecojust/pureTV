// Stage definitions in story order. A definition holds everything one mission needs; azure.js is the reference
// for a planet, violet.js for space.
//   id, no, title, place, sub, resultSub      names for banners and panels
//   music, bossAt, checkpoints, wingRearAt     course pacing (bossAt: restarts past it skip the stage music)
//   attract                                    rail range for the title fly-through (first stage only)
//   world: { zoneW, pathX, terrainHeight, faceColor, decorate, palettes, paletteKeys, water, clouds }
//          or { space: true | { band }, zoneW, pathX, decorate, palettes, paletteKeys } (no terrain, sea or gravity;
//          nebula sky — see world.useStageWorld)
//   script(at)                                 registers events with at(distance, fn) and schedules props
//   onSetup(d, run), onClear(run), absent(run) hooks around (re)starts and the clear sequence
//   onUpdate(dt, gameplay), onExit()           every simulated frame (the stage's own actors); when another stage is loaded
//   warm()                                     objects whose shaders to compile while the screen is black before the mission
//   boss: { id, en, title, bar, introLines: [{ who, text, hold }], bannerAt }
//          + onBossPhase(p) / onBossCharge() / onBossDying() / onBossPartDown(partsLeft)
//   clearTime, clearShot(t, cam, ship)         length of the clear orbit (default 8.5 s); a camera of its own (return true)
//   onFragment()                               reaction to the spear fragment
//   rank: { S, A, B, medal }, resultNote(run)  results screen
//   map: { target }                            star-map body highlighted in the briefing (see screens.js)
//   briefing: { lines: [{ who, text }] | (carry) => lines, objective }, talk: [{ who, text }] (story mode, after the results)
//   squadAfter(run, squad)                     wingmen still under repair when the next stage starts (bit 0 = Kota)
//   botTargets(), botSteer()                   dev-build test bot: extra things to shoot; a (u, v) to steer for
import azure from './azure.js';
import violet from './violet.js';

// The seven missions of the story, in order. `def` is the stage definition once the mission has been built.
export const MISSIONS = [
  { no: 1, id: 'azure', title: 'AZURE COAST', place: '阿奎利亚星', def: azure },
  { no: 2, id: 'violet', title: 'VIOLET SARGASSO', place: '萨尔加索空域', def: violet },
  { no: 3, id: 'amber', title: 'AMBER DUNES', place: '阿里迪亚星' },
  { no: 4, id: 'white', title: 'WHITE SILENCE', place: '格拉西亚星' },
  { no: 5, id: 'emerald', title: 'EMERALD STORM', place: '席尔瓦星' },
  { no: 6, id: 'scarlet', title: 'SCARLET FORGE', place: '伊格尼亚星' },
  { no: 7, id: 'night', title: 'LONG NIGHT', place: '天照恒星' },
];

export const STAGES = MISSIONS.filter(m => m.def).map(m => m.def);

// Title → ストーリー → プロローグ (also shown once before the first briefing). One string per page.
export const PROLOGUE = [
  '五年前，一场异变袭击了联盟在冰封星球格拉西亚古遗迹中的调查队。担任护卫的精锐飞行队“枪骑兵”的队长留守遗迹，让调查队先行撤离。从此他再也没有回来。事件被认定为意外，枪骑兵队随之解散。',
  '如今，在枭司令的指挥下，枪骑兵队重获新生。而驾驶队长机“枪骑兵一号”的人，就是你。',
  '某一天，一群来历不明的机械战士突然出现在海洋星阿奎利亚……',
];
