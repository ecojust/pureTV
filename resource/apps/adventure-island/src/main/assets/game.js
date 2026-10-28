/* The native room adapter and original island game share one observable model. */
startTvGame({
  title: "ADVENTURE ISLAND",
  bridge: "AdventureHost",
  api: "AdventureTV",
  actions: { a: ["跳跃", "JUMP"], b: ["投掷／奔跑", "THROW / RUN"] },
  createGame: function () {
    var settings = {};
    try {
      settings =
        JSON.parse(localStorage.getItem("adventure-settings") || "{}") || {};
    } catch (_) {}
    return new AdventureGame(settings);
  },
  createRenderer: function (canvas) {
    return new AdventureRenderer(canvas);
  },
  createAudio: function () {
    return new AdventureAudio();
  },
});
