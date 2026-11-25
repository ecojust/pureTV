// Character page entries (title → キャラクター). Texts only tell what the player could know at the start;
// anyone marked `known: false` shows as ？？？ until they have been met in the game (campaign.markSeen).
// face: portrait id (portraits.js; null = no face), ship: whose 3D ship the title camera circles while selected.
export const PROFILES = [
  {
    id: 'lancer1', group: '枪骑兵队', role: '枪骑兵一号 · 队长', nameJa: '枪骑兵一号', name: 'LANCER 1', face: null, ship: 'player', known: true,
    stats: [['所属', '新枪骑兵队'], ['座机', '白底配蓝橙色']],
    text: '新枪骑兵队的队长。岩铁的学生，以第一名从军校毕业的年轻王牌，驾驶着继承前任队长机衣钵的新机型。无线电里始终沉默，因为队长就是你。',
    line: null,
  },
  {
    id: 'kota', group: '枪骑兵队', role: 'LANCER 2', nameJa: '小太', name: 'KOTA', face: 'kota', ship: 'kota', known: true,
    stats: [['种族', '小熊猫'], ['年龄', '18'], ['代表色', '橙色'], ['自称', '我']],
    text: '活泼健谈，天不怕地不怕。技术很好，却总冲得太猛，被敌机紧追不放。他来自森林星席尔瓦。胸前的星形臂章是小时候在航展上由崇拜的飞行员赠予的宝物。',
    line: '好嘞，出发！队长，我一定跟紧你！',
  },
  {
    id: 'gantetsu', group: '枪骑兵队', role: 'LANCER 3', nameJa: '岩铁', name: 'GANTETSU', face: 'gantetsu', ship: 'gantetsu', known: true,
    stats: [['种族', '日本獾'], ['年龄', '52'], ['代表色', '橄榄绿'], ['自称', '老子']],
    text: '沉默寡言，一开口就是简短而中肯的建议。护目镜和脸上的伤疤是他的标志。原枪骑兵队的老兵，队伍解散后在军校教导队长和小太。',
    line: '沉住气，一架一架来。',
  },
  {
    id: 'rio', group: '枪骑兵队', role: 'LANCER 4', nameJa: '莉欧', name: 'RIO', face: 'rio', ship: 'rio', known: true,
    stats: [['种族', '水獭'], ['年龄', '24'], ['代表色', '绿松石色'], ['自称', '我']],
    text: '冷静的电子战与情报分析专家，用单眼显示器分析敌情。语调柔和，判断却比谁都快。来自海洋星阿奎利亚的渔村，从小听祖母讲古老的故事。',
    line: '分析交给我，队长只管看好前方。',
  },
  {
    id: 'hou', group: '指挥部', role: 'COMMAND', nameJa: '枭司令', name: 'HOU', face: 'hou', ship: null, known: true,
    stats: [['种族', '雕鸮'], ['年龄', '64'], ['代表色', '金色'], ['自称', '我']],
    text: '母舰“曙光”号的司令。行事严格，在无线电中惜字如金。他还研究古老传说，正是传说中的“持枪者”给了枪骑兵队名字。',
    line: '别勉强，枪骑兵一号。',
  },
  {
    id: 'ibuki', group: '？？？', role: '？？？', nameJa: '伊吹', name: 'IBUKI', face: 'ibuki', ship: null, known: false,
    stats: [['种族', '雪豹'], ['年龄', '38']],
    text: '驾驶黑色机体的神秘飞行员。',
    line: null,
  },
  {
    id: 'tsumuji', group: '镰鼬队', role: 'KAMAITACHI 1', nameJa: '旋风', name: 'TSUMUJI', face: 'tsumuji', ship: null, known: false,
    stats: [['种族', '鼬'], ['身份', '长兄、队长'], ['代表色', '绿色'], ['自称', '本大爷']],
    text: '镰鼬佣兵队的队长，三兄妹中的老大。喜欢卖弄和挑衅，驾着镰翼战机，用旋风冲击波打乱对手阵形。受雇于某个被他称作“老板”的人。',
    line: '哟，小菜鸟们！我们是镰鼬队！',
  },
  {
    id: 'kiri', group: '镰鼬队', role: 'KAMAITACHI 2', nameJa: '雾刃', name: 'KIRI', face: 'kiri', ship: null, known: false,
    stats: [['种族', '鼬'], ['身份', '长女'], ['代表色', '绯红']],
    text: '镰鼬家的长女，冷漠寡言。擅长绕到敌人身后，用刀刃般的机翼直线切入。',
    line: '……斩。',
  },
  {
    id: 'hari', group: '镰鼬队', role: 'KAMAITACHI 3', nameJa: '小针', name: 'HARI', face: 'hari', ship: null, known: false,
    stats: [['种族', '鼬'], ['身份', '幺弟、机械师'], ['代表色', '黄色']],
    text: '镰鼬家最小的孩子，虽胆小却是天才机械师。在战斗中也能用维修光束修好哥哥和姐姐的飞机。',
    line: '那、那个……对不起！',
  },
  {
    id: 'mizuchi', group: '机械兽', role: 'MACHINE BEAST', nameJa: '水蛟', name: 'MIZUCHI', face: 'mizuchi', ship: null, known: false,
    stats: [['传说', '水蛟：栖息在水中的龙'], ['出没地点', '阿奎利亚星']],
    text: '从海里现身的龙形机械兽，因为酷似莉欧祖母故事中的海龙而得名。背上排列着炮台，口中核心能发射扫射光束，还会断断续续地说话。',
    line: '……发现入侵者。执行排除。',
  },
  {
    id: 'gashadokuro', group: '机械兽', role: 'MACHINE BEAST', nameJa: '荒骷髅', name: 'GASHADOKURO', face: 'gashadokuro', ship: null, known: false,
    stats: [['传说', '荒骷髅：巨大的骸骨'], ['出没地点', '萨尔加索空域']],
    text: '一头由船墓残骸拼成的巨型骷髅机械兽。击破手臂关节就会散架，但不久又会重组。核心藏在头骨里。',
    line: '……骨头，不够。把你的骨头……也交给我。',
  },
];
