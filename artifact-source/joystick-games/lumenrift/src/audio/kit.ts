// Shared types + the small primitive toolkit the engine lends to the seasonal score / SFX modules.

export interface Voice {
  out: GainNode; // voice output (goes through panner)
  send: GainNode; // reverb send
  t: number;
}

export interface MoodSpec {
  bpm: number;
  prog: number[][];
  stepsPerChord: number;
  pad: number;
  arp: number;
  bass: number;
  drums: number;
  arpProb: number;
}

/** The engine's synthesis primitives (bound methods) plus a few shared nodes. */
export interface Kit {
  ctx: AudioContext;
  noiseBuf: AudioBuffer;
  reverbIn: GainNode;
  musicBus: GainNode;
  tone(
    dest: AudioNode,
    type: OscillatorType,
    f0: number,
    f1: number | null,
    t: number,
    dur: number,
    peak: number,
    attack?: number,
    filterFreq?: number,
    detune?: number,
  ): void;
  noise(
    dest: AudioNode,
    t: number,
    dur: number,
    peak: number,
    ftype: BiquadFilterType,
    f0: number,
    f1?: number | null,
    q?: number,
    attack?: number,
  ): void;
  bell(dest: AudioNode, f: number, t: number, dur: number, peak: number): void;
  windSwell(dest: AudioNode, t: number, dur: number, peak: number, f0: number, f1: number, f2: number, q: number): void;
  newVoice(pan: number, vol: number, reverb: number): Voice;
}

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Oscillator wired to dest, started at t and stopped at stop. */
export function osc(
  k: Kit,
  dest: AudioNode | AudioParam,
  type: OscillatorType,
  f: number,
  t: number,
  stop: number,
  gain = 1,
  detune = 0,
): OscillatorNode {
  const o = k.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (detune) o.detune.value = detune;
  let src: AudioNode = o;
  if (gain !== 1) {
    const g = k.ctx.createGain();
    g.gain.value = gain;
    o.connect(g);
    src = g;
  }
  if (dest instanceof AudioParam) src.connect(dest);
  else src.connect(dest);
  o.start(t);
  o.stop(stop + 0.05);
  return o;
}

/** Percussive envelope gain: fast attack to peak, exponential decay over dur. */
export function envGain(k: Kit, dest: AudioNode, t: number, peak: number, dur: number, attack = 0.004): GainNode {
  const g = k.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  return g;
}

/** Sustained envelope: attack, hold, release (linear), for pads. */
export function padGainEnv(k: Kit, dest: AudioNode, t: number, peak: number, len: number, attack: number, release: number): GainNode {
  const g = k.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + Math.max(attack, len - 0.2));
  g.gain.linearRampToValueAtTime(0.0001, t + len + release);
  g.connect(dest);
  return g;
}

export function lowpass(k: Kit, dest: AudioNode, f: number, q = 0.7): BiquadFilterNode {
  const f0 = k.ctx.createBiquadFilter();
  f0.type = 'lowpass';
  f0.frequency.value = f;
  f0.Q.value = q;
  f0.connect(dest);
  return f0;
}
