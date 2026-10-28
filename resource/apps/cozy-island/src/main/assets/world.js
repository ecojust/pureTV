/* Original island, residents and economy. All art is drawn from geometric shapes. */
(function (root) {
  "use strict";
  var items = {
    fruit: { zh: "蜜桃", en: "Peach", price: 6, color: "#f49c96" },
    wood: { zh: "木材", en: "Wood", price: 3, color: "#b78b63" },
    stone: { zh: "石材", en: "Stone", price: 4, color: "#95a4aa" },
    shell: { zh: "贝壳", en: "Shell", price: 8, color: "#f5d4cb" },
    fish: { zh: "海鱼", en: "Fish", price: 12, color: "#73c7d1" },
    bench: {
      zh: "花园长椅",
      en: "Garden bench",
      price: 35,
      buy: 45,
      furniture: true,
      color: "#d2a36c",
      recipe: { wood: 4, stone: 1 },
    },
    lamp: {
      zh: "星光灯",
      en: "Star lamp",
      price: 35,
      buy: 50,
      furniture: true,
      color: "#ffdb75",
      recipe: { wood: 2, stone: 3 },
    },
    planter: {
      zh: "花草盆",
      en: "Flower pot",
      price: 25,
      buy: 35,
      furniture: true,
      color: "#eea2ad",
      recipe: { stone: 2, shell: 1 },
    },
    rug: {
      zh: "海风地毯",
      en: "Sea breeze rug",
      price: 30,
      buy: 40,
      furniture: true,
      color: "#8bcec6",
      recipe: { wood: 2, shell: 2 },
    },
    trophy: {
      zh: "友谊纪念像",
      en: "Friendship keepsake",
      price: 0,
      furniture: true,
      color: "#f7cb70",
    },
  };
  var nodes = [
    ["peach-a", "fruit", 5.5, 8],
    ["peach-b", "fruit", 5, 12],
    ["peach-c", "fruit", 15.5, 4.5],
    ["wood-a", "wood", 8, 14],
    ["wood-b", "wood", 16, 15],
    ["wood-c", "wood", 11, 4.5],
    ["rock-a", "stone", 7, 5.5],
    ["rock-b", "stone", 18, 9],
    ["rock-c", "stone", 12, 16],
    ["shell-a", "shell", 6, 15.8],
    ["shell-b", "shell", 19, 14],
    ["shell-c", "shell", 14.5, 17.3],
  ].map(function (v) {
    return {
      id: v[0],
      item: v[1],
      x: v[2],
      y: v[3],
      amount: v[1] === "shell" ? 1 : 2,
      radius: v[1] === "fruit" ? 0.48 : 0.35,
    };
  });
  var landmarks = [
    {
      id: "house",
      x: 8.5,
      y: 7.2,
      radius: 1.15,
      zh: "海风小屋",
      en: "Seabreeze home",
    },
    {
      id: "shop",
      x: 16,
      y: 7,
      radius: 1.15,
      zh: "小岛商店",
      en: "Island market",
    },
    {
      id: "craft",
      x: 13.4,
      y: 10.3,
      radius: 0.5,
      zh: "制作台",
      en: "Workbench",
    },
    { id: "mira", x: 10.3, y: 10.3, radius: 0.3, zh: "米拉", en: "Mira" },
    { id: "pip", x: 17, y: 12.4, radius: 0.3, zh: "皮普", en: "Pip" },
    {
      id: "dock",
      x: 20.2,
      y: 11.2,
      radius: 0,
      zh: "海边钓点",
      en: "Fishing pier",
    },
  ];
  var tasks = [
    {
      id: "welcome",
      npc: "mira",
      zh: "分享甜蜜：交给米拉 3 个蜜桃",
      en: "A sweet welcome: give Mira 3 peaches",
      need: { fruit: 3 },
      coins: 30,
      gift: "lamp",
    },
    {
      id: "woodland",
      npc: "pip",
      zh: "修整花园：交给皮普 4 份木材",
      en: "Garden repairs: give Pip 4 wood",
      need: { wood: 4 },
      coins: 35,
      gift: "bench",
    },
    {
      id: "supper",
      npc: "mira",
      zh: "海边晚餐：交给米拉 2 条海鱼",
      en: "Seaside supper: give Mira 2 fish",
      need: { fish: 2 },
      coins: 60,
      after: "welcome",
    },
    {
      id: "shellgarden",
      npc: "pip",
      zh: "贝壳花园：交给皮普 3 贝壳、4 石材",
      en: "Shell garden: give Pip 3 shells + 4 stone",
      need: { shell: 3, stone: 4 },
      coins: 80,
      gift: "planter",
      after: "woodland",
    },
    {
      id: "festival",
      npc: "mira",
      zh: "温馨庆典：升级小屋，摆好长椅和星光灯",
      en: "Housewarming: upgrade home and place a bench + lamp",
      need: {},
      coins: 120,
      gift: "trophy",
      after: "supper",
      festival: true,
    },
  ];
  function onLand(x, y) {
    return (
      Math.pow((x - 12) / 10.1, 2) + Math.pow((y - 10.2) / 8.3, 2) < 1 ||
      (x > 19 && x < 21.9 && y > 10.4 && y < 12)
    );
  }
  var world = {
    items: items,
    nodes: nodes,
    landmarks: landmarks,
    tasks: tasks,
    onLand: onLand,
  };
  root.CozyIslandWorld = world;
  if (typeof module !== "undefined") module.exports = world;
})(typeof window !== "undefined" ? window : globalThis);
