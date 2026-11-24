/* Game-specific configuration; all room and exit cleanup lives in runtime.js. */
startTvGame({
  title: "MAGIC JEWELRY TV", bridge: "JewelHost", api: "JewelTV",
  actions: { a: ["换序", "CYCLE"], b: ["换序", "CYCLE"] },
  createGame: function () {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("jewel-tv.preferences") || "{}"); } catch (_) {}
    return new JewelGame({ highScore:saved && saved.highScore, muted:saved && saved.muted });
  },
  createRenderer: function (canvas) { return new JewelRenderer(canvas); },
  createAudio: function () { return new JewelAudio(); }
});
