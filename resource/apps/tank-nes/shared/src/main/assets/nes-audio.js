/* Buffered stereo output. The emulator generates the original APU samples. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  class StereoRing {
    constructor(capacity = 8192) {
      this.capacity = capacity;
      this.left = new Float32Array(capacity);
      this.right = new Float32Array(capacity);
      this.read = 0;
      this.write = 0;
      this.count = 0;
    }
    push(l, r) {
      if (this.count === this.capacity) {
        this.read = (this.read + 1) % this.capacity;
        this.count--;
      }
      this.left[this.write] = Number.isFinite(l) ? l : 0;
      this.right[this.write] = Number.isFinite(r) ? r : 0;
      this.write = (this.write + 1) % this.capacity;
      this.count++;
    }
    fill(left, right) {
      for (let i = 0; i < left.length; i++) {
        if (this.count) {
          left[i] = this.left[this.read];
          right[i] = this.right[this.read];
          this.read = (this.read + 1) % this.capacity;
          this.count--;
        } else {
          left[i] = 0;
          right[i] = 0;
        }
      }
    }
    clear() {
      this.read = this.write = this.count = 0;
    }
  }
  class NesAudio {
    constructor(host = globalThis) {
      this.context = null;
      this.node = null;
      this.gain = null;
      this.closed = false;
      this.paused = true;
      this.ring = new StereoRing();
      this.error = "";
      this.sampleRate = 48000;
      const Context = host.AudioContext || host.webkitAudioContext;
      if (!Context) {
        this.error = "Web Audio is unavailable";
        return;
      }
      try {
        try {
          this.context = new Context({
            sampleRate: 48000,
            latencyHint: "interactive",
          });
        } catch (_) {
          this.context = new Context();
        }
        this.sampleRate = this.context.sampleRate;
        this.node = this.context.createScriptProcessor(1024, 0, 2);
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.85;
        this.node.onaudioprocess = (event) => {
          const left = event.outputBuffer.getChannelData(0),
            right = event.outputBuffer.getChannelData(1);
          if (this.paused || this.closed) {
            left.fill(0);
            right.fill(0);
          } else this.ring.fill(left, right);
        };
        this.node.connect(this.gain);
        this.gain.connect(this.context.destination);
        if (this.context.state === "running")
          this.context.suspend().catch(() => {});
      } catch (error) {
        this.error = String(error.message || error);
        this.dispose();
      }
    }
    sample(l, r) {
      if (!this.paused && !this.closed) this.ring.push(l, r);
    }
    unlock() {
      if (
        !this.closed &&
        this.context &&
        !this.paused &&
        this.context.state === "suspended"
      )
        return this.context.resume().catch(() => {});
      return Promise.resolve();
    }
    pause(value) {
      if (this.closed || value === this.paused) return;
      this.paused = !!value;
      this.ring.clear();
      if (this.context) {
        if (this.paused) this.context.suspend().catch(() => {});
        else this.unlock();
      }
    }
    dispose() {
      if (this.closed) return;
      this.closed = true;
      this.paused = true;
      this.ring.clear();
      if (this.node) {
        this.node.onaudioprocess = null;
        this.node.disconnect();
      }
      if (this.gain) this.gain.disconnect();
      if (this.context && this.context.state !== "closed")
        this.context.close().catch(() => {});
    }
  }
  return { StereoRing, NesAudio };
});
