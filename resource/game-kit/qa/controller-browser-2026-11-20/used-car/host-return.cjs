const assert = require("node:assert/strict");

async function verifyHostReturn({ game, down, release, pass }) {
  await game.evaluate(() => {
    const bridge = window.UsedCarHost;
    const original = bridge.snapshot.bind(bridge);
    const room = { suspended: false, empty: 0, live: 0 };
    bridge.snapshot = () => {
      if (room.suspended) {
        room.empty++;
        // MainActivity.HostBridge.snapshot() while its dialog owns the input.
        return '{"players":[],"connections":0}';
      }
      const sample = original();
      if (JSON.parse(sample).players.some((p) => p.connected)) room.live++;
      return sample;
    };
    window.__hostReturn = room;
  });

  async function roundTrip() {
    const baseline = await game.evaluate(() => {
      const room = window.__hostReturn;
      window.UsedCarTV.suspend(true);
      room.suspended = true;
      return { empty: room.empty, live: room.live };
    });
    await game.waitForFunction((n) => window.__hostReturn.empty >= n + 4, baseline.empty);
    const during = await game.evaluate(() => window.UsedCarTV.game.phase);
    assert.equal(during, "paused");
    await game.evaluate(() => {
      window.__hostReturn.suspended = false;
      window.UsedCarTV.suspend(false);
    });
    await game.waitForFunction((n) => window.__hostReturn.live >= n + 4, baseline.live);
    return game.evaluate((before) => ({
      emptySnapshots: window.__hostReturn.empty - before.empty,
      restoredSnapshots: window.__hostReturn.live - before.live,
      phase: window.UsedCarTV.game.phase,
    }), baseline);
  }

  const automatic = await roundTrip();
  assert.equal(automatic.phase, "race");
  pass("returning phone driver resumes after the real room is sampled", automatic);

  const beforeBlur = await game.evaluate(() => {
    window.dispatchEvent(new Event("blur"));
    return window.__hostReturn.live;
  });
  await game.waitForFunction((n) => window.__hostReturn.live >= n + 4, beforeBlur);
  assert.equal(await game.evaluate(() => window.UsedCarTV.game.phase), "paused");
  await game.evaluate(() => window.dispatchEvent(new Event("focus")));
  await game.waitForFunction(() => window.UsedCarTV.game.phase === "race");
  pass("window blur keeps the race paused until focus returns");

  await down("start");
  await game.waitForFunction(() => window.UsedCarTV.game.phase === "paused");
  await release();
  const manual = await roundTrip();
  assert.equal(manual.phase, "paused");
  await down("start");
  await game.waitForFunction(() => window.UsedCarTV.game.phase === "race");
  await release();
  pass("manual pause survives the same interruption until the phone sends START", manual);
}

module.exports = { verifyHostReturn };
