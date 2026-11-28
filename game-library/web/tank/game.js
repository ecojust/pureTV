/* Tank TV: original-game model with the common native-room adapter. */
startTvGame({
  title: "TANK TV",
  titleZh: "坦克大战",
  bridge: "TankHost",
  api: "TankTV",
  actions: { a: ["射击", "FIRE"], b: ["射击", "FIRE"] },
  createGame: () => new TankGame(),
  createRenderer: (canvas) => new TankRenderer(canvas, document.documentElement.lang),
  createAudio: () => new TankAudio(),
});
