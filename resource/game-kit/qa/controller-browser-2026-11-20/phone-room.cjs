const { chromium } = require(process.env.QA_PLAYWRIGHT || "playwright");
const { spawn, execFileSync } = require("node:child_process"),
  { once } = require("node:events"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const base = process.env.QA_WORKDIR;
assert.ok(base, "Set QA_WORKDIR to the prepared local directory");
const catalog = require("./source.json"),
  results = path.join(base, "results");
const jar = process.env.QA_JSON_JAR,
  cp = path.join(base, "classes") + ":" + jar;
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)),
  phase = (s) => s.phase,
  player = (s) => s.players?.[0] || s.model?.player || s.model?.players?.[0];
const views = [
    ...(process.env.QA_COMPACT ? [{ width: 720, height: 480 }] : []),
    { width: 960, height: 540 },
    { width: 1280, height: 720 },
  ],
  active = (s) =>
    ["playing", "race", "countdown"].includes(s.phase) && !s.paused;
const kitGames = ["tower-overlap", "neon-rush"];
const helpers = {
  getRects: () => {
    const rect = (e) => {
      const r = e.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10);
    };
    const visible = (e) =>
      e &&
      e.checkVisibility({ visibilityProperty: true, opacityProperty: true }) &&
      e.getClientRects().length > 0;
    const v = Array.from(document.querySelectorAll("canvas"))
      .filter(visible)
      .map((e) => ({ name: e.id || e.nodeName, box: rect(e) }))
      .sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3]);
    const rows = Array.from(document.querySelectorAll("[data-puretv-phone]"))
      .filter(visible)
      .map((e) => ({
        box: rect(e),
        seat: e.getAttribute("data-player-id"),
        text: e.innerText.trim(),
      }));
    const rail = document.querySelector(".sidebar"),
      qr = document.querySelector("#room-qr,#qr");
    return {
      canvas: v[0] || null,
      phoneRows: rows,
      ...(rail
        ? { sidebar: rect(rail), qr: qr && visible(qr) ? rect(qr) : null }
        : {}),
    };
  },
};
async function until(read, test, label, timeout = 20000) {
  const t = Date.now();
  let last;
  while (Date.now() - t < timeout) {
    last = await read();
    if (last && test(last)) return last;
    await wait(90);
  }
  throw Error(label + " timed out; phase=" + (last?.phase || ""));
}
function qr(mode, input) {
  return execFileSync(
    "java",
    [
      "-XX:ActiveProcessorCount=2",
      "-Djava.awt.headless=true",
      "-cp",
      path.join(base, "classes") + ":" + process.env.QA_ZXING_JAR,
      "Qr",
      ...(mode === "encode" ? [input] : []),
    ],
    { input: mode === "decode" ? input : undefined, encoding: "utf8" },
  );
}
async function play(browser, slug) {
  const meta = catalog[slug],
    record = {
      slug,
      started: new Date().toISOString(),
      status: "testing",
      host: meta.package,
      signedApkSha256: require("./signed-assets.json")[slug].apkSha256,
      assertions: [],
      sourceCommit: meta.sourceCommit,
      errors: [],
    };
  let room, context, padContext, secondPadContext, phone, game, touch;
  if (process.env.QA_COMPACT) {
    const receipt = require("./compact/signed-assets.json")[slug];
    record.sourceCommit = slug === "tank"
      ? "940490d703ee8b55c1df8dc3e6bb8796aeb262a3"
      : "89527853fc9c81b344b797e957c73dbe35fde67c";
    record.signedApkSha256 = receipt.apkSha256;
  }
  const file = path.join(results, slug + ".json");
  const flush = () =>
    fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
  const pass = (name, details) => {
    record.assertions.push({ name, ...(details || {}) });
    flush();
  };
  const kit = kitGames.includes(slug);
  const boot = process.env.QA_2D ? views[0] : { width: 640, height: 360 };
  record.gameplayViewport = boot;
  const read = () => game.evaluate(() => window.PureTVQA?.snapshot?.());
  const point = async (key) => {
    let id = kit
      ? { start: "start", a: "a", b: "b", stick: "stick-zone" }[key]
      : {
          start: "button-start",
          a: "button-a",
          b: "button-b",
          stick: "joystick-zone",
        }[key];
    const e = phone.locator("#" + id),
      r = await e.boundingBox({ timeout: 90000 });
    assert.ok(r, "phone button visible " + key);
    return [r.x + r.width * 0.45, r.y + r.height * 0.5];
  };
  const down = async (key) => {
    const [x, y] = await point(
      ["right", "reverse"].includes(key) ? "stick" : key,
    );
    if (touch) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      if (key === "right" || key === "reverse")
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            {
              x: x + (key === "right" ? 80 : 0),
              y: y + (key === "reverse" ? 65 : 0),
            },
          ],
        });
    } else {
      await phone.mouse.move(x, y);
      await phone.mouse.down();
      if (key === "right" || key === "reverse")
        await phone.mouse.move(
          x + (key === "right" ? 80 : 0),
          y + (key === "reverse" ? 65 : 0),
          { steps: 4 },
        );
    }
  };
  const release = async () => {
    if (touch)
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    else await phone.mouse.up();
    await wait(180);
  };
  const size = async (page, v) => {
    const changed = await page.evaluate(({ width, height }) => {
      if (innerWidth === width && innerHeight === height) return false;
      window.__phoneQAViewportSettled = false;
      function seen() {
        if (innerWidth !== width || innerHeight !== height) return;
        window.removeEventListener("resize", seen);
        window.__phoneQAViewportSettled = true;
      }
      window.addEventListener("resize", seen);
      return true;
    }, v);
    await page.setViewportSize(v);
    if (changed)
      await until(
        () => page.evaluate(() => window.__phoneQAViewportSettled === true),
        (yes) => yes,
        "real resize delivered at " + v.width,
        90000,
      );
  };
  const measure = async (key) => {
    let xs = [];
    for (const v of views) {
      await size(game, v);
      xs.push({ viewport: v, ...(await game.evaluate(helpers.getRects)) });
    }
    record[key] = xs;
    flush();
    await size(game, boot);
    return xs;
  };
  const overlap = (a, b) =>
    a &&
    b &&
    Math.min(a[0] + a[2], b[0] + b[2]) > Math.max(a[0], b[0]) + 1 &&
    Math.min(a[1] + a[3], b[1] + b[3]) > Math.max(a[1], b[1]) + 1;
  try {
    room = spawn("java", [
      "-XX:ActiveProcessorCount=2",
      "-cp",
      cp,
      "ActualPhoneRoom",
      meta.package,
      path.join(base, "assets", slug),
      path.join(base, "empty-overlay"),
    ]);
    let javaError = "";
    room.stderr.on("data", (b) => (javaError += b));
    const line = await Promise.race([
      once(room.stdout, "data").then((x) => x[0].toString()),
      once(room, "exit").then(() => {
        throw Error(javaError);
      }),
    ]);
    const [url, tv] = line.trim().split(" ");
    const dataURI = qr("encode", url);
    context = await browser.newContext({
      viewport: boot,
      locale: "en-US",
      deviceScaleFactor: process.env.QA_MESA ? 0.5 : 1,
    });
    record.deviceScaleFactor = process.env.QA_MESA ? 0.5 : 1;
    game = await context.newPage();
    game.on("pageerror", (e) => record.errors.push("tv " + e.message));
    await game.addInitScript(
      ({ url, qr, phoneOnly }) => {
        const info = {
          url,
          qr,
          language: "en",
          addresses: ["127.0.0.1"],
          wifiController: {
            state: "available",
            port: 63485,
            addresses: ["127.0.0.1"],
            inputActive: true,
          },
        };
        if (phoneOnly) delete info.wifiController;
        const bridge = {
          getInfo: () => JSON.stringify(info),
          snapshot() {
            const r = new XMLHttpRequest();
            r.open("GET", "/__snapshot", false);
            r.send();
            return r.responseText;
          },
          publish(s) {
            fetch("/__publish", { method: "POST", body: s }).catch(() => {});
          },
          setLanguage() {},
          exit() {},
        };
        for (const h of [
          "PureGameHost",
          "MarioHost",
          "BombJackHost",
          "AdventureHost",
          "TetrisHost",
          "JewelHost",
          "JackalHost",
          "TankHost",
          "CoastKartHost",
          "AlienShooterHost",
          "UsedCarHost",
        ])
          window[h] = bridge;
      },
      { url, qr: dataURI, phoneOnly: !!process.env.QA_COMPACT },
    );
    await game.goto(tv, { waitUntil: "commit", timeout: 120000 });
    await until(
      read,
      (s) => s.phase && s.phase !== "loading",
      "original game ready",
      180000,
    );
    const initial = (await read()).phase;
    pass("original game ready", { phase: initial });
    if (!process.env.QA_2D) {
      record.renderer = await game.evaluate(() => {
        for (const canvas of document.querySelectorAll("canvas")) {
          const gl =
            window.CoastKartTV?.renderer?.scene3d?.renderer?.getContext() ||
            canvas.getContext("webgl2") ||
            canvas.getContext("webgl");
          if (gl) {
            const ext = gl.getExtension("WEBGL_debug_renderer_info");
            return {
              version: gl.getParameter(gl.VERSION),
              renderer: ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
            };
          }
        }
        return null;
      });
    }
    if (process.env.QA_QR_PANEL) {
      await size(game, views[1]);
      const toggle = game.locator("#rush-phone-button");
      const img = game.locator("#qr");
      await toggle.waitFor({ state: "attached", timeout: 90000 });
      assert.equal(
        await toggle.isVisible(),
        false,
        "original Android menu manages the QR automatically",
      );
      await img.waitFor({ state: "visible", timeout: 90000 });
      const box = await img.boundingBox();
      const crop = await img.screenshot({ timeout: 90000 });
      const decoded = qr("decode", crop.toString("base64"));
      assert.equal(decoded, url);
      const probe = await browser.newPage();
      try {
        const response = await probe.goto(decoded, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        assert.equal(response.status(), 200);
        await until(
          () =>
            probe.evaluate(() => !document.querySelector("#start")?.disabled),
          (v) => v,
          "actual phone joined",
          90000,
        );
        pass(
          "Android menu automatically shows QR; visible TV crop decodes to live room",
          {
            viewport: views[1],
            cropBox: box,
            screenshotSha256: require("node:crypto")
              .createHash("sha256")
              .update(crop)
              .digest("hex"),
            phonePageEnabled: true,
          },
        );
        await probe.locator("#start").click({ timeout: 90000 });
        await until(
          read,
          (s) => s.phase === "playing",
          "original phone START begins race",
          90000,
        );
        await img.waitFor({ state: "hidden", timeout: 90000 });
        pass("original phone START hides QR for active Android gameplay");
      } finally {
        await probe.close();
      }
      record.status = "passed";
      return;
    }
    const baseline = await measure("beforeJoin");
    const img = game.locator("#room-qr,#qr").first();
    await img.waitFor({ state: "attached", timeout: 120000 });
    await game.waitForFunction(
      () => {
        const img = document.querySelector("#room-qr,#qr");
        return img?.complete && img.naturalWidth > 0;
      },
      null,
      { timeout: 90000, polling: 250 },
    );
    const pixels = await img.evaluate((e) => {
      const c = document.createElement("canvas");
      c.width = e.naturalWidth;
      c.height = e.naturalHeight;
      c.getContext("2d").drawImage(e, 0, 0);
      return c.toDataURL().split(",")[1];
    });
    const decoded = qr("decode", pixels);
    assert.equal(decoded, url);
    pass("TV QR pixels decode to the original Java room URL");
    padContext = await browser.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
    });
    phone = await padContext.newPage();
    if (process.env.QA_TOUCH || !process.env.QA_2D)
      touch = await padContext.newCDPSession(phone);
    record.inputContact = touch
      ? "Chromium mobile touch pointer"
      : "Chromium mobile viewport mouse pointer";
    phone.on("pageerror", (e) => record.errors.push("phone " + e.message));
    await phone.goto(decoded, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await until(
      () =>
        phone.evaluate(() => {
          const button = document.querySelector("#start,#button-start");
          return !!button && !button.disabled;
        }),
      (s) => s,
      "actual room enables phone controls",
      90000,
    );
    pass("original phone page enabled by room welcome");
    // The menu can deliberately put details behind a panel. Inspect its real DOM content, including a collapsed panel.
    await until(
      () => game.locator("[data-puretv-phone]").count(),
      (n) => n > 0,
      "occupied phone seat reached TV UI",
      90000,
    );
    const card = await game
      .locator("[data-puretv-phone]")
      .first()
      .evaluate((e) => ({
        text: e.textContent,
        seat: e.getAttribute("data-player-id"),
        privateIdentityVisible: !!e.querySelector(
          "[data-puretv-controller-id-text]",
        ),
      }));
    assert.equal(card.seat, "1");
    assert.equal(card.privateIdentityVisible, false);
    pass("phone occupies real first seat", { card });
    if (process.env.QA_COMPACT) {
      secondPadContext = await browser.newContext({
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
      });
      const peer = await secondPadContext.newPage();
      await peer.goto(decoded, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await until(
        () =>
          peer.evaluate(
            () => !document.querySelector("#button-start")?.disabled,
          ),
        (v) => v,
        "second original phone enabled",
        90000,
      );
      await until(
        () => game.locator("[data-puretv-phone]").count(),
        (n) => n === 2,
        "second original phone seat visible",
        90000,
      );
      pass(
        "two real phone seats are connected with no TCP service announcement",
      );
    }
    const joined = await measure("connectedSamePhase");
    for (let i = 0; i < joined.length; i++) {
      if (process.env.QA_COMPACT) {
        const g = joined[i],
          rail = g.sidebar,
          qr = g.qr;
        assert.ok(rail[1] >= 0 && rail[1] + rail[3] <= g.viewport.height + 0.5);
        assert.ok(qr && qr[1] >= 0 && qr[1] + qr[3] <= g.viewport.height + 0.5);
        assert.equal(g.phoneRows.length, 2);
        assert.deepEqual(
          g.phoneRows.map((r) => r.seat),
          ["1", "2"],
        );
        for (const row of g.phoneRows)
          assert.ok(
            row.box[1] >= 0 &&
              row.box[1] + row.box[3] <= g.viewport.height + 0.5,
          );
      }
      assert.equal(joined[i].canvas?.name, baseline[i].canvas?.name);
      assert.deepEqual(joined[i].canvas?.box, baseline[i].canvas?.box);
    }
    pass("joining preserves canvas rectangles at all measured sizes");
    await size(game, boot);
    await down("start");
    await until(
      read,
      (s) => s.phase !== initial,
      "ordinary START changes phase",
      75000,
    );
    await release();
    let started = await read();
    if (slug === "tank" && !active(started)) {
      await down("start");
      await until(read, active, "second START begins battle", 22000);
      await release();
    }
    started = await until(read, active, "real game enters play", 30000);
    if (kit)
      await until(
        read,
        (s) =>
          s.model?.inputArmed !== false &&
          s.model?.cancelledLast !== true &&
          s.model?.inputState?.quarantined !== true,
        "neutral input armed",
      );
    pass("phone START enters original game", {
      before: initial,
      after: started.phase,
    });
    let key = "right",
      label = "player moved right",
      value = (s) => player(s)?.x,
      predicate = (a, b) => a > b;
    if (["jewel", "tetris"].includes(slug)) {
      label = "active piece moved right";
      value = (s) => (player(s)?.piece || player(s)?.active)?.x;
    }
    if (slug === "tower-overlap") {
      await until(
        read,
        (s) => {
          const m = s.model,
            b = m.floors?.at(-1),
            v = m.slab;
          return (
            m.mode === "moving" &&
            v &&
            b &&
            Math.min(b.x + b.width, v.x + v.width) - Math.max(b.x, v.x) >
              b.width * 0.65
          );
        },
        "original slab over tower",
      );
      key = "a";
      label = "slab drop";
      value = (s) => s.model.drops;
    }
    if (slug === "tank")
      await until(
        read,
        (s) => player(s)?.alive && !player(s)?.spawnFrames,
        "tank original spawn animation",
        40000,
      );
    if (slug === "alien-shooter") {
      key = "b";
      label = "grenade consumed";
      value = (s) => player(s)?.grenades;
      predicate = (a, b) => a < b;
    }
    if (slug === "neon-rush") {
      await until(
        read,
        (s) => s.model.countdown <= 0 && player(s).speed > 5,
        "original race countdown",
        80000,
      );
      key = "b";
      label = "nitro used";
      value = (s) => s.model.stats.nitros;
    }
    if (slug === "coast-kart") {
      let lastSample = 0;
      record.countdownSamples = [];
      await until(
        read,
        (s) => {
          if (Date.now() - lastSample > 10000) {
            lastSample = Date.now();
            record.countdownSamples.push({
              at: new Date().toISOString(),
              phase: s.phase,
              paused: s.paused,
              countdown: s.model.countdown,
              speed: player(s)?.speed,
              clock: s.model.clock,
              renderedPlayers: s.renderedPlayers?.length,
            });
            flush();
          }
          return s.phase === "playing" && !s.paused && player(s)?.speed > 15;
        },
        "ordinary race speed",
        300000,
      );
      key = "reverse";
      label = "held brake reversed kart";
      value = (s) => player(s)?.speed;
      predicate = (a, b) => b > 15 && a < 0;
    }
    if (slug === "used-car-racing") {
      key = "a";
      label = "throttle accelerated car";
      value = (s) => player(s)?.speed;
      await until(
        read,
        (s) => s.phase === "race" || s.phase === "playing",
        "countdown to real race",
        80000,
      );
    }
    const before = await read(),
      v = value(before);
    if (before.camera)
      record.originalCamera = {
        projectionElements: before.camera.projection?.length,
        viewElements: before.camera.view?.length,
        renderedPlayers: before.renderedPlayers?.length,
      };
    assert.equal(typeof v, "number", label + " diagnostic");
    await down(key);
    const after = await until(
      read,
      (s) => predicate(value(s), v),
      label,
      75000,
    );
    await release();
    pass("phone ordinary gameplay input", {
      action: label,
      input: key,
      before: v,
      after: value(after),
      phase: after.phase,
    });
    const activeViews = await measure("playing");
    for (const o of activeViews) {
      assert.ok(
        o.canvas?.box?.[2] > 60 && o.canvas?.box?.[3] > 50,
        "visible gameplay canvas",
      );
      for (const row of o.phoneRows)
        assert.equal(
          overlap(row.box, o.canvas.box),
          false,
          "active phone card/game canvas overlap",
        );
    }
    pass("connected phone cards clear of gameplay at every measured size");
    if (secondPadContext) {
      await secondPadContext.close();
      secondPadContext = null;
      await until(
        () => game.locator("[data-puretv-phone]").count(),
        (n) => n === 1,
        "second disconnect preserves first seat",
        90000,
      );
    }
    await phone.close();
    await until(
      () => game.evaluate(() => !document.querySelector("[data-puretv-phone]")),
      (v) => v,
      "disconnected seat cleared",
      60000,
    );
    pass("room disconnect clears original seat");
    assert.deepEqual(record.errors, []);
    record.status = "passed";
  } catch (e) {
    record.status = "failed";
    record.failure = String(e);
    if (phone) {
      try {
        record.phoneAtFailure = await phone.evaluate(() => ({
          startDisabled: document.querySelector("#button-start,#start")
            ?.disabled,
          connection: document.querySelector("#connection-text,#status")
            ?.textContent,
        }));
      } catch {}
    }
    if (game) {
      try {
        const s = await read();
        record.last = {
          phase: s?.phase,
          player: player(s || {})?.x,
          speed: player(s || {})?.speed,
          countdown: s?.model?.countdown,
          paused: s?.paused,
          clock: s?.model?.clock,
          modelMode: s?.model?.mode,
          rows: await game.locator("[data-puretv-phone]").count(),
        };
      } catch {}
    }
  } finally {
    record.finished = new Date().toISOString();
    flush();
    console.log(slug, record.status, record.failure || "");
    if (secondPadContext) await secondPadContext.close().catch(() => {});
    if (padContext) await padContext.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (room) room.stdin.end("\n");
  }
}
(async () => {
  fs.mkdirSync(results, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.QA_CHROMIUM,
    args: [
      "--no-sandbox",
      ...(process.env.QA_2D ? ["--disable-gpu"] : []),
      "--enable-unsafe-swiftshader",
      ...(process.env.QA_MESA
        ? ["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist"]
        : ["--use-angle=swiftshader"]),
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    for (const slug of process.argv.slice(2)) await play(browser, slug);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
