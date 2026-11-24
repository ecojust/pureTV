/* Local room integration for the independent classic platform game. */
startTvGame({
  title: "SUPER MARIO TV",
  bridge: "MarioHost",
  api: "MarioTV",
  actions: { a: ["跳跃", "JUMP"], b: ["加速 / 火球", "RUN / FIRE"] },
  createGame: () => {
    let highScore = 0,
      muted = false;
    try {
      highScore = Number(localStorage.getItem("super-mario-tv-high-score"));
      muted = localStorage.getItem("super-mario-tv-muted") === "true";
    } catch (_) {}
    if (!Number.isFinite(highScore) || highScore < 0) highScore = 0;
    return new MarioGame({
      highScore,
      muted,
      saveMuted: (value) => {
        try {
          localStorage.setItem("super-mario-tv-muted", String(value));
        } catch (_) {}
      },
      saveHighScore: (value) => {
        try {
          localStorage.setItem("super-mario-tv-high-score", String(value));
        } catch (_) {}
      },
    });
  },
  createRenderer: (canvas) => new MarioRenderer(canvas),
  createAudio: () => new MarioAudio(),
});
