/* Native room integration and local high score for the independent puzzle game. */
startTvGame({
  title: "TETRIS TV", bridge: "TetrisHost", api: "TetrisTV",
  actions: {a: ["顺时针旋转", "ROTATE CW"], b: ["逆时针旋转", "ROTATE CCW"]},
  createGame: () => {
    let highScore = 0;
    try { highScore = Math.max(0,Number(localStorage.getItem("tetris-tv-high-score"))||0); } catch (_) {}
    return new TetrisGame({highScore, saveHighScore: value => {
      try { localStorage.setItem("tetris-tv-high-score",String(value)); } catch (_) {}
    }});
  },
  createRenderer: canvas => new TetrisRenderer(canvas),
  createAudio: () => new TetrisAudio(),
});
