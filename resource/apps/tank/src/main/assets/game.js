/* Tank TV: original-game model with the common native-room adapter. */
startTvGame({
  title: "TANK TV",
  bridge: "TankHost",
  api: "TankTV",
  actions: { a: ["射击", "FIRE"], b: ["射击", "FIRE"] },
  createGame: () => new TankGame(),
  createRenderer: (canvas) => new TankRenderer(canvas),
  createAudio: () => new TankAudio(),
});
