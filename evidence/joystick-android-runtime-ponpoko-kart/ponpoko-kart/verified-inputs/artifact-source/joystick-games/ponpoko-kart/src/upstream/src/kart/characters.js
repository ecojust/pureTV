// ぽんぽこカート — playable characters (original chibi animal / yokai drivers).
//
// colors: kart paint colors (sRGB hex numbers)
//   body   = main glossy paint of the kart
//   accent = secondary paint (side pods, wing, rims, umbrella canopy)
//   trim   = small trims / stripes / seat piping
//   fur    = the driver's main color (for UI badges, name plates, minimap dots)
//   umbrella = canopy color of the 和傘 glider (janome ring is always cream)
// stats: 1–5 each, every character sums to 12.

export const CHARACTERS = [
  {
    id: 'tanuki',
    name: '狸猫',
    kanji: '狸',
    romaji: 'Tanuki',
    description: '只要一片叶子就能变成任何模样！它就是狸猫卡丁车的当家车手。',
    colors: { body: 0xf07c22, accent: 0x7a4b2c, trim: 0xefdcb6, fur: 0x8f7760, umbrella: 0xa8552a },
    stats: { speed: 3, accel: 3, handling: 3, weight: 3 },
  },
  {
    id: 'kitsune',
    name: '狐狸',
    kanji: '狐',
    romaji: 'Kitsune',
    description: '稻荷神的使者。它能像狐火一样灵巧地掠过弯道。',
    colors: { body: 0xe2431e, accent: 0xebe6de, trim: 0xe8b64a, fur: 0xf2f0ec, umbrella: 0xd8321c },
    stats: { speed: 3, accel: 4, handling: 4, weight: 1 },
  },
  {
    id: 'neko',
    name: '招财猫',
    kanji: '猫',
    romaji: 'Neko',
    description: '铃铛叮当，随心而行。这只三花猫最擅长急转弯！',
    colors: { body: 0xff78a8, accent: 0xffcf3a, trim: 0xf2e8da, fur: 0xf7f1e8, umbrella: 0xf0558f },
    stats: { speed: 2, accel: 4, handling: 5, weight: 1 },
  },
  {
    id: 'shiba',
    name: '柴犬',
    kanji: '犬',
    romaji: 'Shiba',
    description: '一往直前！这名柴犬车手最引以为傲的是那一对豆豆眉。',
    colors: { body: 0x2f72d8, accent: 0xe8ebf0, trim: 0xf2b54a, fur: 0xd98a44, umbrella: 0x2657b8 },
    stats: { speed: 4, accel: 3, handling: 3, weight: 2 },
  },
  {
    id: 'usagi',
    name: '玉兔',
    kanji: '兎',
    romaji: 'Usagi',
    description: '来自月宫的捣年糕高手，轻轻一跃就能全速冲刺！',
    colors: { body: 0xb99cf2, accent: 0x7b4fd6, trim: 0xf2e4ec, fur: 0xfaf6f4, umbrella: 0x8a5ce0 },
    stats: { speed: 3, accel: 5, handling: 3, weight: 1 },
  },
  {
    id: 'kappa',
    name: '河童',
    kanji: '河',
    romaji: 'Kappa',
    description: '头顶碟子里的水是它的命根子。最爱的食物当然是黄瓜！',
    colors: { body: 0x5bb44a, accent: 0x2f7f36, trim: 0xdcebbd, fur: 0x71bf5c, umbrella: 0x2f8a3e },
    stats: { speed: 3, accel: 3, handling: 4, weight: 2 },
  },
  {
    id: 'tengu',
    name: '天狗',
    kanji: '天',
    romaji: 'Tengu',
    description: '凭借山间神力呼风唤雨。它对自己的高鼻子和最高速度都很有信心。',
    colors: { body: 0x2a2831, accent: 0xe2b14c, trim: 0xc9312a, fur: 0xd8392c, umbrella: 0x2b2934 },
    stats: { speed: 5, accel: 2, handling: 2, weight: 3 },
  },
  {
    id: 'oni',
    name: '青鬼',
    kanji: '鬼',
    romaji: 'Oni',
    description: '力大无穷却性情温和。说到碰碰车，谁都赢不了它！',
    colors: { body: 0xffc62a, accent: 0x3d68cc, trim: 0x2b2a30, fur: 0x5b8fe0, umbrella: 0xf0b41e },
    stats: { speed: 4, accel: 1, handling: 2, weight: 5 },
  },
];

/** Lookup by id (falls back to tanuki). */
export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);
