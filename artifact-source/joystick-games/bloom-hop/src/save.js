// Progress and settings in localStorage, versioned, never trusted blindly.
const KEY = 'bloomhop-save';
const fresh = () => ({
  v: 1, cleared: {}, gold: {}, furthest: 1, wildBest: 0, wildNext: 1,
  musicMuted: false, sfxMuted: false, howtoSeen: false, giftSeen: {},
});

const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const num = (v, d) => (Number.isFinite(v) ? v : d);
// Keep only well-formed fields; anything odd falls back to the default.
function clean(d) {
  const f = fresh();
  return {
    ...f,
    cleared: obj(d.cleared), gold: obj(d.gold), giftSeen: obj(d.giftSeen),
    furthest: num(d.furthest, 1), wildBest: num(d.wildBest, 0), wildNext: Math.max(1, num(d.wildNext, 1)),
    musicMuted: !!d.musicMuted, sfxMuted: !!d.sfxMuted, howtoSeen: !!d.howtoSeen, powerUsed: !!d.powerUsed,
  };
}

export class Save {
  constructor() {
    this.data = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === 1) this.data = clean(d);
      }
    } catch { /* private mode or broken save: start fresh */ }
  }
  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
  }
  isUnlocked(n) { return n === 1 || !!this.data.cleared[n - 1]; }
  goldCount() { return Object.keys(this.data.gold).length; }
}
