(function (root) {
  "use strict";
  root.startTvGame({
    title: "BOMB JACK TV",
    bridge: "BombJackHost",
    api: "BombJackTV",
    actions: {
      a: ["跳跃 / 按住缓降", "JUMP / HOLD TO FLOAT"],
      b: ["Mighty 能力", "MIGHTY POWER"],
    },
    createGame: function () {
      var saved = {};
      try {
        saved = JSON.parse(localStorage.getItem("bomb-jack-progress") || "{}");
      } catch (_) {}
      return new root.BombJackGame(saved);
    },
    createRenderer: function (canvas) {
      return new root.BombJackRenderer(canvas);
    },
    createAudio: function () {
      return new root.BombJackAudio();
    },
  });
})(window);
