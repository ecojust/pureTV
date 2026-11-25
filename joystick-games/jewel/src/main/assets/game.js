/* Game-specific configuration; all room and exit cleanup lives in runtime.js. */
startTvGame({
  chineseTitle: "钻石方块 TV", title: "MAGIC JEWELRY TV", bridge: "JewelHost", api: "JewelTV",
  actions: { a: ["换序", "CYCLE"], b: ["换序", "CYCLE"] },
  createGame: function () {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("jewel-tv.preferences") || "{}"); } catch (_) {}
    return new JewelGame({ highScore:saved && saved.highScore, muted:saved && saved.muted });
  },
  createRenderer: function (canvas) { return new JewelRenderer(canvas, document.documentElement.lang); },
  createAudio: function () { return new JewelAudio(); }
});
