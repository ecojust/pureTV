/* Independent browser/room adapter for the JSNES emulator. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const MAPPERS = Object.freeze([
    0, 1, 2, 3, 4, 5, 7, 9, 11, 34, 38, 66, 71, 79, 94, 118, 119, 140, 180, 240,
    241,
  ]);
  const FPS = 60.0988;
  function invalid(code, detail) {
    const error = new Error(detail || code);
    error.code = code;
    throw error;
  }
  function inspectRom(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    if (bytes.byteLength < 16 || bytes.byteLength > 16 * 1024 * 1024)
      invalid("size", "ROM must be between 16 bytes and 16 MiB.");
    if (
      bytes[0] !== 0x4e ||
      bytes[1] !== 0x45 ||
      bytes[2] !== 0x53 ||
      bytes[3] !== 0x1a
    )
      invalid("header", "Choose an uncompressed .nes ROM with an iNES header.");
    if (bytes[6] & 4)
      invalid("trainer", "ROM trainer data is not supported by this preview.");
    if (bytes[7] & 3)
      invalid("console", "This ROM requires unsupported console hardware.");
    const nes2 = (bytes[7] & 12) === 8;
    if (!nes2 && bytes[7] & 12)
      invalid("header", "Unrecognized iNES header format.");
    let prg = bytes[4],
      chr = bytes[5];
    let mapper = (bytes[6] >> 4) | (bytes[7] & 0xf0);
    if (nes2) {
      mapper |= (bytes[8] & 15) << 8;
      if (bytes[8] >> 4)
        invalid("submapper", "This ROM uses an unsupported NES 2.0 submapper.");
      if ((bytes[9] & 15) === 15 || bytes[9] >> 4 === 15)
        invalid("size", "Exponent encoded ROM sizes are not supported.");
      prg |= (bytes[9] & 15) << 8;
      chr |= (bytes[9] >> 4) << 8;
      if ((bytes[12] & 3) === 1 || (bytes[12] & 3) === 3)
        invalid(
          "region",
          "This preview supports NTSC timing, not PAL or Dendy.",
        );
      if (bytes[13] || bytes[14] || bytes[15] > 1)
        invalid(
          "hardware",
          "This ROM requires unsupported expansion hardware.",
        );
    } else {
      if (bytes[9] & 1)
        invalid("region", "This preview supports NTSC timing, not PAL.");
      if (bytes.slice(10, 16).some(Boolean))
        invalid("header", "The iNES header contains unsupported legacy data.");
    }
    if (!MAPPERS.includes(mapper))
      invalid("mapper", "Unsupported mapper: " + mapper);
    const expected = 16 + (bytes[6] & 4 ? 512 : 0) + prg * 16384 + chr * 8192;
    if (!prg || expected !== bytes.byteLength)
      invalid("length", "ROM length does not match its header.");
    // JSNES treats nonzero legacy bytes 8–15 as a dirty header and drops the
    // upper mapper nibble. Normalize supported iNES1 RAM/region hints after
    // validating them, so the core receives exactly the mapper we inspected.
    const normalized = bytes.slice();
    if (!nes2) normalized.fill(0, 8, 16);
    return {
      bytes: normalized,
      mapper,
      format: nes2 ? "NES 2.0" : "iNES",
      prgBytes: prg * 16384,
      chrBytes: chr * 8192,
      size: expected,
    };
  }
  class NesAdapter {
    constructor(options) {
      this.core = options.core;
      this.onFrame = options.onFrame || function () {};
      this.onAudioSample = options.onAudioSample || function () {};
      this.sampleRate = options.sampleRate || 48000;
      this.nes = null;
      this.loaded = false;
      this.frameCount = 0;
      this.buttons = [new Set(), new Set()];
      this.info = null;
    }
    load(data) {
      const info = inspectRom(data);
      const nes = new this.core.NES({
        onFrame: (frame) => this.onFrame(frame),
        onAudioSample: (left, right) => this.onAudioSample(left, right),
        sampleRate: this.sampleRate,
        emulateSound: true,
      });
      nes.loadROM(info.bytes);
      this.releaseAll();
      this.nes = nes;
      this.loaded = true;
      this.info = info;
      this.frameCount = 0;
      this.buttons = [new Set(), new Set()];
      return { mapper: info.mapper, format: info.format, size: info.size };
    }
    setPlayers(players) {
      if (!this.nes) return;
      const C = this.core.Controller;
      for (let id = 1; id <= 2; id++) {
        const input = players.find(
          (p) => p && Number(p.id) === id && p.connected,
        );
        const next = new Set();
        if (input) {
          if (input.a) next.add(C.BUTTON_A);
          if (input.b) next.add(C.BUTTON_B);
          if (input.start) next.add(C.BUTTON_START);
          if (input.select) next.add(C.BUTTON_SELECT);
          if (Number(input.x) < -0.25) next.add(C.BUTTON_LEFT);
          if (Number(input.x) > 0.25) next.add(C.BUTTON_RIGHT);
          if (Number(input.y) < -0.25) next.add(C.BUTTON_UP);
          if (Number(input.y) > 0.25) next.add(C.BUTTON_DOWN);
        }
        const before = this.buttons[id - 1];
        for (const button of before)
          if (!next.has(button)) this.nes.buttonUp(id, button);
        for (const button of next)
          if (!before.has(button)) this.nes.buttonDown(id, button);
        this.buttons[id - 1] = next;
      }
    }
    releaseAll() {
      if (this.nes)
        for (let id = 1; id <= 2; id++)
          for (let button = 0; button < 8; button++)
            this.nes.buttonUp(id, button);
      this.buttons = [new Set(), new Set()];
    }
    step() {
      if (this.loaded && this.nes) {
        this.nes.frame();
        this.frameCount++;
      }
    }
    reset() {
      if (this.nes && this.info) {
        this.releaseAll();
        this.nes.loadROM(this.info.bytes);
        this.frameCount = 0;
      }
    }
    dispose() {
      this.releaseAll();
      this.loaded = false;
      this.nes = null;
      this.info = null;
    }
  }
  return { NesAdapter, inspectRom, NES_MAPPERS: MAPPERS, NES_FPS: FPS };
});
