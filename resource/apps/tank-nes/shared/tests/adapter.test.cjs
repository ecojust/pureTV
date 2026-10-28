const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const core = require("../src/main/assets/vendor/jsnes.min.js");
const {
  NesAdapter,
  inspectRom,
  NES_FPS,
  NES_MAPPERS,
} = require("../src/main/assets/nes-adapter.js");
const { StereoRing, NesAudio } = require("../src/main/assets/nes-audio.js");
const { controllerRom, mapper2Rom } = require("./fixtures/controller-rom.cjs");
function makeAdapter(options = {}) {
  return new NesAdapter({ core, ...options });
}
function bytes(rom = controllerRom()) {
  return new Uint8Array(rom);
}
function rejects(rom, code) {
  assert.throws(
    () => inspectRom(rom),
    (error) => error.code === code,
  );
}

test("NROM CPU, PPU and APU execute an authored diagnostic cartridge", () => {
  let frames = 0,
    samples = 0,
    colors = new Set();
  const adapter = makeAdapter({
    onFrame(frame) {
      frames++;
      colors = new Set(frame);
      assert.equal(frame.length, 256 * 240);
    },
    onAudioSample(l, r) {
      assert.ok(Number.isFinite(l) && Number.isFinite(r));
      if (l || r) samples++;
    },
  });
  const info = adapter.load(controllerRom());
  assert.equal(info.mapper, 0);
  for (let i = 0; i < 20; i++) adapter.step();
  assert.equal(frames, 20);
  assert.equal(adapter.frameCount, 20);
  assert.ok(
    colors.size >= 3,
    "PPU draws multiple authored test pattern colors",
  );
  assert.ok(samples > 1000, "APU produces pulse samples");
  assert.ok(adapter.nes.cpu.mem[0] > 0, "NMI executes cartridge code");
});

test("P1/P2 joystick, A/B, START and SELECT reach actual CPU controller reads", () => {
  const adapter = makeAdapter();
  adapter.load(controllerRom());
  adapter.setPlayers([
    { id: 1, connected: true, a: true, start: true, x: 1, y: -1 },
    { id: 2, connected: true, b: true, select: true },
  ]);
  for (let i = 0; i < 8; i++) adapter.step();
  assert.equal(adapter.nes.cpu.mem[0x10], 0x99);
  assert.equal(adapter.nes.cpu.mem[0x11], 0x60);
  adapter.setPlayers([{ id: 1, connected: false, a: true, x: 1 }]);
  adapter.step();
  assert.equal(adapter.nes.cpu.mem[0x10], 0);
  assert.equal(adapter.nes.cpu.mem[0x11], 0);
});

test("digital directions use a dead zone and preserve diagonals", () => {
  const adapter = makeAdapter();
  adapter.load(controllerRom());
  adapter.setPlayers([{ id: 1, connected: true, x: 0.2, y: -0.2 }]);
  for (let i = 0; i < 8; i++) adapter.step();
  assert.equal(adapter.nes.cpu.mem[0x10], 0);
  adapter.setPlayers([{ id: 1, connected: true, x: -0.8, y: 0.8 }]);
  adapter.step();
  assert.equal(adapter.nes.cpu.mem[0x10], 0x06);
});

test("UxROM mapper 2 executes real bank writes and keeps fixed code visible", () => {
  const adapter = makeAdapter();
  assert.equal(adapter.load(mapper2Rom()).mapper, 2);
  for (let i = 0; i < 5; i++) adapter.step();
  assert.deepEqual(
    Array.from(adapter.nes.cpu.mem.slice(0x20, 0x23)),
    [0x11, 0x22, 0x33],
  );
  assert.ok(
    adapter.nes.cpu.mem[0x23] > 0,
    "fixed-bank loop continues after bank switches",
  );
});

test("reset releases held buttons and restarts cartridge; disposal stops execution", () => {
  const adapter = makeAdapter();
  adapter.load(controllerRom());
  adapter.setPlayers([{ id: 1, connected: true, a: true }]);
  adapter.step();
  adapter.step();
  adapter.reset();
  assert.equal(adapter.frameCount, 0);
  assert.equal(adapter.nes.controllers[1].state[0], 0x40);
  adapter.step();
  adapter.dispose();
  const frames = adapter.frameCount;
  adapter.step();
  assert.equal(adapter.frameCount, frames);
  assert.equal(adapter.loaded, false);
  assert.equal(adapter.nes, null);
});

test("invalid replacement preserves the currently loaded cartridge", () => {
  const adapter = makeAdapter();
  adapter.load(controllerRom());
  const previous = adapter.nes;
  assert.throws(() => adapter.load(new Uint8Array(128)));
  assert.equal(adapter.nes, previous);
  assert.equal(adapter.loaded, true);
  adapter.step();
});

test("header validation rejects truncation, trailing bytes, ZIP, zero PRG and excessive size", () => {
  rejects(bytes().slice(0, 15), "size");
  rejects(bytes().slice(0, -1), "length");
  const longer = new Uint8Array(bytes().length + 1);
  longer.set(bytes());
  rejects(longer, "length");
  const zip = bytes();
  zip.set([0x50, 0x4b, 3, 4]);
  rejects(zip, "header");
  const empty = bytes();
  empty[4] = 0;
  rejects(empty, "length");
  rejects(new Uint8Array(16 * 1024 * 1024 + 1), "size");
});

test("region, trainer, console, dirty headers and unsupported mappers fail explicitly", () => {
  const pal = bytes();
  pal[9] = 1;
  rejects(pal, "region");
  const trainer = bytes();
  trainer[6] |= 4;
  rejects(trainer, "trainer");
  const vs = bytes();
  vs[7] |= 1;
  rejects(vs, "console");
  const dirty = bytes();
  dirty[12] = 65;
  rejects(dirty, "header");
  const mapper = bytes();
  mapper[6] = 0xf0;
  mapper[7] = 0xf0;
  rejects(mapper, "mapper");
});

test("standard NTSC NES 2.0 header is checked while special hardware is rejected", () => {
  const rom = bytes();
  rom[7] = 8;
  assert.equal(inspectRom(rom).format, "NES 2.0");
  const multi = rom.slice();
  multi[12] = 2;
  assert.equal(inspectRom(multi).mapper, 0);
  const pal = rom.slice();
  pal[12] = 1;
  rejects(pal, "region");
  const dendy = rom.slice();
  dendy[12] = 3;
  rejects(dendy, "region");
  const sub = rom.slice();
  sub[8] = 16;
  rejects(sub, "submapper");
  const exp = rom.slice();
  exp[9] = 15;
  rejects(exp, "size");
  const misc = rom.slice();
  misc[14] = 1;
  rejects(misc, "hardware");
  const device = rom.slice();
  device[15] = 2;
  rejects(device, "hardware");
});

test("legacy RAM hints cannot silently change inspected mapper in JSNES", () => {
  const rom = bytes();
  rom[8] = 1;
  const parsed = inspectRom(rom);
  assert.equal(parsed.bytes[8], 0);
  assert.equal(rom[8], 1);
  assert.ok(NES_MAPPERS.includes(0) && NES_MAPPERS.includes(2));
  assert.ok(NES_FPS > 60 && NES_FPS < 60.2);
});

test("audio ring preserves stereo order, bounds latency, and fills underrun with silence", () => {
  const ring = new StereoRing(3);
  ring.push(0.1, 0.2);
  ring.push(0.3, 0.4);
  ring.push(0.5, 0.6);
  ring.push(0.7, 0.8);
  assert.equal(ring.count, 3);
  const l = new Float32Array(4),
    r = new Float32Array(4);
  ring.fill(l, r);
  assert.ok(Math.abs(l[0] - 0.3) < 0.00001);
  assert.ok(Math.abs(r[2] - 0.8) < 0.00001);
  assert.equal(l[3], 0);
  assert.equal(r[3], 0);
  assert.equal(ring.count, 0);
  ring.push(NaN, Infinity);
  ring.clear();
  assert.equal(ring.count, 0);
});

test("audio pause clears queued sound and dispose closes the context and disconnects nodes", async () => {
  const nodes = [];
  class Context {
    constructor() {
      this.state = "running";
      this.sampleRate = 48000;
      this.destination = {};
    }
    node() {
      const value = {
        gain: { value: 1 },
        connected: false,
        connect() {
          this.connected = true;
        },
        disconnect() {
          this.connected = false;
        },
      };
      nodes.push(value);
      return value;
    }
    createScriptProcessor() {
      return this.node();
    }
    createGain() {
      return this.node();
    }
    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    }
    resume() {
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      return Promise.resolve();
    }
  }
  const audio = new NesAudio({ AudioContext: Context });
  assert.equal(audio.context.state, "suspended");
  audio.pause(false);
  await audio.unlock();
  audio.sample(0.5, 0.6);
  assert.equal(audio.ring.count, 1);
  audio.pause(true);
  assert.equal(audio.ring.count, 0);
  assert.equal(audio.context.state, "suspended");
  audio.dispose();
  assert.equal(audio.closed, true);
  assert.equal(audio.context.state, "closed");
  assert.ok(nodes.every((n) => !n.connected));
  assert.equal(audio.node.onaudioprocess, null);
  audio.sample(1, 1);
  assert.equal(audio.ring.count, 0);
});

test("vendored core boots with an Android-era globalThis alias", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../src/main/assets/vendor/jsnes.min.js"),
    "utf8",
  );
  const sandbox = { globalThis: undefined };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof sandbox.jsnes.NES, "function");
  assert.equal(typeof sandbox.jsnes.Controller, "function");
});
