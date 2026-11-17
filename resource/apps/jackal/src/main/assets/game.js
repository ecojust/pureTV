/* Jackal TV: independent game rules, original-reference data and native room. */
startTvGame({
  title: "JACKAL TV",
  bridge: "JackalHost",
  api: "JackalTV",
  actions: { a: ["榴弹", "GRENADE"], b: ["机枪", "GUN"] },
  load: async () => {
    const base = (window.JACKAL_ART_BASE || "art/").replace(/\/?$/, "/");
    const audio = new JackalAudio({ scoreUrl: base + "data/audio-score.json" });
    const [art, score] = await Promise.all([
      JackalRenderer.load(base),
      audio.load(),
    ]);
    if (!score) {
      art.dispose();
      audio.dispose();
      throw new Error(audio.failed || "Missing audio score");
    }
    return { art, audio };
  },
  createGame: () => new JackalGame(),
  createRenderer: (canvas, assets) => new JackalRenderer(canvas, assets.art),
  createAudio: (assets) => assets.audio,
});
