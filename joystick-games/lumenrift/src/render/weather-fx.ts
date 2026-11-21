// Seasonal weather visuals: falling rain / snow / leaves / petals, fog banks, puddles, wildfires,
// lightning and blizzard whiteouts. Everything here reads the simulation's Weather state.
import { MAP_W } from '../game/config';
import type { Game, GameEvent } from '../game/game';
import type { Camera } from './camera';
import { Particles, PK } from './particles';

const TAU = Math.PI * 2;

const enum FK {
  Rain,
  Snow,
  Leaf,
  Petal,
}
interface Flake {
  k: FK;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  rot: number;
  spin: number;
  size: number;
  color: string;
}
interface BoltFx {
  pts: { x: number; y: number }[];
  x: number;
  y: number;
  t: number;
  rod: boolean;
}

const LEAVES = ['#d9772b', '#c4471f', '#e8a53a', '#a8541c', '#e0c048'];
const PETALS = ['#ffd6e6', '#fff0f5', '#ffc2d9', '#ffffff'];

/** Small deterministic hash for per-tile shapes. */
function h(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class WeatherFx {
  private flakes: Flake[] = [];
  private bolts: BoltFx[] = [];
  private warns: { x: number; y: number; t: number }[] = [];
  private ripples: { x: number; y: number; t: number }[] = [];
  /** Screen flash from lightning. */
  private flash = 0;
  /** Blizzard whiteout, eased in and out. */
  private white = 0;
  /** Storm / rain sky dimming, eased. */
  private gloom = 0;

  reset() {
    this.flakes = [];
    this.bolts = [];
    this.warns = [];
    this.ripples = [];
    this.flash = this.white = this.gloom = 0;
  }

  onEvent(ev: GameEvent, P: Particles, addLight: (x: number, y: number, r: number, a: number, t: number) => void, shake: (a: number) => void) {
    switch (ev.type) {
      case 'boltWarn':
        this.warns.push({ x: ev.x, y: ev.y, t: 1.1 });
        break;
      case 'bolt': {
        const pts = [{ x: ev.x + (Math.random() - 0.5) * 3, y: ev.y - 16 }];
        const n = 12;
        for (let i = 1; i <= n; i++) {
          const f = i / n;
          const jit = i === n ? 0 : 0.7 * (1 - f * 0.6);
          pts.push({ x: pts[0].x + (ev.x - pts[0].x) * f + (Math.random() - 0.5) * jit, y: pts[0].y + (ev.y - (ev.rod ? 0.6 : 0) - pts[0].y) * f });
        }
        this.bolts.push({ pts, x: ev.x, y: ev.y, t: 0.4, rod: ev.rod });
        this.flash = Math.max(this.flash, ev.rod ? 0.5 : 0.8);
        addLight(ev.x, ev.y, ev.rod ? 3 : 4.5, 1, 0.5);
        P.add({ kind: PK.Ring, x: ev.x, y: ev.y, size: 0.3, grow: ev.rod ? 3 : 6, life: 0.45, color: '#bfefff' });
        P.burst(ev.x, ev.y - (ev.rod ? 0.6 : 0), ev.rod ? 18 : 26, { kind: PK.Spark, color: '#d8f6ff', speed: 6, life: 0.35, size: 0.06 });
        if (!ev.rod) P.burst(ev.x, ev.y, 10, { kind: PK.Smoke, color: '#2a2a30', speed: 1.5, life: 1, size: 0.25, grow: 0.4 });
        shake(ev.rod ? 0.15 : 0.4);
        break;
      }
      case 'ignite':
        P.burst(ev.x, ev.y, 6, { kind: PK.Ember, color: '#ffb347', speed: 1.6, life: 0.6, size: 0.06, grav: -2 });
        P.add({ kind: PK.Glow, x: ev.x, y: ev.y, size: 0.8, life: 0.3, color: '#ff7a2a' });
        break;
      case 'weather':
        if (ev.kind === 'sprout') {
          P.add({ kind: PK.Ring, x: ev.x, y: ev.y, size: 0.2, grow: 3, life: 0.8, color: '#bfffe0' });
          P.burst(ev.x, ev.y, 20, { kind: PK.Ember, color: '#e8ffd0', speed: 1.4, life: 1.4, size: 0.06, grav: -1.2 });
        }
        break;
    }
  }

  update(g: Game, dt: number, cam: Camera, P: Particles, lowFx: boolean) {
    const W = g.weather;
    const s = g.season;
    for (const b of this.bolts) b.t -= dt;
    this.bolts = this.bolts.filter((b) => b.t > 0);
    for (const w of this.warns) w.t -= dt;
    this.warns = this.warns.filter((w) => w.t > 0);
    for (const r of this.ripples) r.t -= dt;
    this.ripples = this.ripples.filter((r) => r.t > 0);
    this.flash = Math.max(0, this.flash - dt * 3);
    const ease = (cur: number, want: number, k: number) => cur + (want - cur) * Math.min(1, dt * k);
    this.white = ease(this.white, W.blizzard > 0 ? 1 : 0, 0.8);
    this.gloom = ease(this.gloom, (W.storm && g.phase === 'wave' ? 1 : 0) + (W.raining ? 0.6 : 0), 0.6);
    if (dt <= 0 || !s) return;

    // visible world rect (+ a margin so things drift in from off-screen)
    const x0 = cam.toWorldX(0) - 2,
      x1 = cam.toWorldX(cam.viewW) + 2,
      y0 = cam.toWorldY(0) - 3,
      y1 = cam.toWorldY(cam.viewH) + 1;
    const area = Math.max(1, (x1 - x0) * (y1 - y0));
    const k = lowFx ? 0.4 : 1;
    const windX = s === 'autumn' ? Math.cos(W.windA) * W.windS : 0,
      windY = s === 'autumn' ? Math.sin(W.windA) * W.windS : 0;

    const spawn = (kind: FK, perTile: number, life: number, make: (f: Flake) => void) => {
      const want = area * perTile * k;
      // keep roughly `want` alive: spawn at the rate they expire
      let n = (want / life) * dt;
      const have = this.flakes.length;
      if (have > 1600) return;
      while (n > 0) {
        if (n < 1 && Math.random() > n) break;
        n -= 1;
        const f: Flake = { k: kind, x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0), vx: 0, vy: 0, life, rot: Math.random() * TAU, spin: 0, size: 0.1, color: '#fff' };
        make(f);
        this.flakes.push(f);
      }
    };

    if (s === 'spring') {
      if (W.raining)
        spawn(FK.Rain, 0.28, 0.32, (f) => {
          f.vx = -2.5;
          f.vy = 20;
          f.life = 0.2 + Math.random() * 0.25;
        });
      else
        spawn(FK.Petal, 0.012, 5, (f) => {
          f.vx = 0.4 + Math.random() * 0.4;
          f.vy = 0.35;
          f.spin = (Math.random() - 0.5) * 4;
          f.size = 0.06 + Math.random() * 0.04;
          f.color = PETALS[(Math.random() * PETALS.length) | 0];
        });
      if (W.raining && Math.random() < dt * 14) {
        // ripples on puddles
        const tiles: number[] = [];
        for (let i = 0; i < W.puddle.length; i++) if (W.puddle[i]) tiles.push(i);
        if (tiles.length) {
          const i = tiles[(Math.random() * tiles.length) | 0];
          this.ripples.push({ x: (i % MAP_W) + 0.2 + Math.random() * 0.6, y: ((i / MAP_W) | 0) + 0.25 + Math.random() * 0.5, t: 0.6 });
        }
      }
    } else if (s === 'autumn') {
      spawn(FK.Leaf, 0.02, 6, (f) => {
        f.vx = windX * 2.2 + (Math.random() - 0.5) * 0.4;
        f.vy = windY * 2.2 + 0.4;
        f.spin = (Math.random() - 0.5) * 5;
        f.size = 0.09 + Math.random() * 0.06;
        f.color = LEAVES[(Math.random() * LEAVES.length) | 0];
      });
    } else if (s === 'winter') {
      const bl = this.white;
      spawn(FK.Snow, 0.035 + bl * 0.3, bl > 0.3 ? 1.2 : 5, (f) => {
        f.vx = 0.2 + bl * 9 + (Math.random() - 0.5) * 0.3;
        f.vy = 0.7 + Math.random() * 0.5 + bl * 2;
        f.size = 0.03 + Math.random() * 0.04;
        f.spin = Math.random() * TAU;
      });
    }

    const t = performance.now() / 1000;
    for (const f of this.flakes) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.spin * dt;
      if (f.k === FK.Snow) f.x += Math.sin(t * 1.3 + f.spin * 5) * 0.25 * dt;
      if (f.k === FK.Leaf || f.k === FK.Petal) f.x += Math.sin(t * 2 + f.spin * 3) * 0.3 * dt;
    }
    this.flakes = this.flakes.filter((f) => f.life > 0);

    // fires: embers and smoke
    if (W.fireCount) {
      for (let i = 0; i < W.fire.length; i++) {
        if (W.fire[i] <= 0) continue;
        const x = (i % MAP_W) + 0.5,
          y = ((i / MAP_W) | 0) + 0.5;
        if (Math.random() < dt * 5 * k) P.add({ kind: PK.Ember, x: x + (Math.random() - 0.5) * 0.8, y: y - 0.2, vy: -1.6, vx: (Math.random() - 0.5) * 0.6, life: 0.7, max: 0.7, size: 0.05, color: Math.random() < 0.5 ? '#ffb347' : '#ff7a2a' });
        if (!lowFx && Math.random() < dt * 2.2) P.add({ kind: PK.Smoke, x: x + (Math.random() - 0.5) * 0.6, y: y - 0.4, vy: -0.6, vx: windX * 0.5, life: 1.6, max: 1.6, size: 0.25, grow: 0.6, color: '#2e2622' });
      }
    }
    // overcharged towers crackle
    for (const b of g.buildings) {
      if (!b.charge || b.charge <= 0) continue;
      if (Math.random() < dt * 9 * k) {
        const a = Math.random() * TAU;
        P.add({ kind: PK.Spark, x: b.x + 0.5 + Math.cos(a) * 0.35, y: b.y + 0.3 + Math.sin(a) * 0.35, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1, life: 0.18, max: 0.18, size: 0.04, color: '#bff3ff' });
      }
    }
  }

  /** Flat ground marks: ash, puddles. Drawn right after the ground. */
  drawGround(ctx: CanvasRenderingContext2D, g: Game, t: number) {
    const W = g.weather;
    if (!g.season) return;
    const night = g.realm === 'night';
    if (g.season === 'summer') {
      for (let i = 0; i < W.scorch.length; i++) {
        const a = W.fire[i] > 0 ? 0.55 : Math.min(1, W.scorch[i] / 12) * 0.5;
        if (a <= 0.01) continue;
        const x = (i % MAP_W) + 0.5,
          y = ((i / MAP_W) | 0) + 0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#1e1714';
        ctx.beginPath();
        ctx.ellipse(x + (h(i, 1) - 0.5) * 0.15, y + (h(i, 2) - 0.5) * 0.15, 0.55 + h(i, 3) * 0.12, 0.45 + h(i, 4) * 0.1, h(i, 5) * 3, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = '#3a302a';
        ctx.beginPath();
        ctx.ellipse(x + (h(i, 6) - 0.5) * 0.3, y + (h(i, 7) - 0.5) * 0.3, 0.2, 0.14, h(i, 8) * 3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (g.season === 'spring') {
      for (let i = 0; i < W.puddle.length; i++) {
        if (!W.puddle[i]) continue;
        const x = (i % MAP_W) + 0.5,
          y = ((i / MAP_W) | 0) + 0.5;
        // older puddles shrink as they dry
        const sz = W.puddle[i] >= 2 ? 0.75 : 1;
        ctx.fillStyle = night ? 'rgba(20,34,52,0.55)' : 'rgba(70,90,70,0.35)';
        blob(ctx, i, x, y + 0.04, 0.5 * sz);
        ctx.fillStyle = night ? 'rgba(70,115,160,0.75)' : 'rgba(120,170,215,0.85)';
        blob(ctx, i, x, y, 0.44 * sz);
        ctx.fillStyle = night ? 'rgba(150,190,230,0.25)' : 'rgba(230,245,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(x - 0.1 * sz, y - 0.1 * sz, 0.16 * sz, 0.06 * sz, -0.3, 0, TAU);
        ctx.fill();
      }
      ctx.lineWidth = 0.025;
      for (const r of this.ripples) {
        const k = 1 - r.t / 0.6;
        ctx.strokeStyle = `rgba(220,240,255,${(1 - k) * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 0.04 + k * 0.2, 0.02 + k * 0.1, 0, 0, TAU);
        ctx.stroke();
      }
    }
    void t;
  }

  /** Flame bodies (normal blending; their glow comes in drawGlow). */
  drawFires(ctx: CanvasRenderingContext2D, g: Game, t: number) {
    const W = g.weather;
    if (!W.fireCount) return;
    for (let i = 0; i < W.fire.length; i++) {
      const left = W.fire[i];
      if (left <= 0) continue;
      const x = (i % MAP_W) + 0.5,
        y = ((i / MAP_W) | 0) + 0.5;
      const life = Math.min(1, left / 1.2) * Math.min(1, (5.5 - left) * 3 + 0.3);
      for (let k = 0; k < 4; k++) {
        const fx = x + (h(i, k) - 0.5) * 0.7;
        const fy = y + (h(i, k + 9) - 0.5) * 0.5 + 0.15;
        const hgt = (0.35 + h(i, k + 4) * 0.3) * life * (0.85 + Math.sin(t * 13 + k * 2.1 + i) * 0.15);
        const w = 0.13 + h(i, k + 7) * 0.06;
        flame(ctx, fx, fy, w, hgt, '#ff6a1f');
        flame(ctx, fx, fy, w * 0.6, hgt * 0.65, '#ffc04a');
      }
    }
  }

  /** Mist and falling things, drawn over the units (fog veils foes in it). */
  drawAir(ctx: CanvasRenderingContext2D, g: Game, t: number, glow: (c: string) => HTMLCanvasElement) {
    const W = g.weather;
    const night = g.realm === 'night';
    if (g.season === 'autumn') {
      const spr = glow(night ? '#8f97b0' : '#f2efe6');
      for (let n = 0; n < W.fog.length; n++) {
        const f = W.fog[n];
        if (f.r < 0.2) continue;
        // a bank is a cluster of soft puffs that slowly churn
        for (let k = 0; k < 7; k++) {
          const a = k * 0.9 + n + t * 0.08 * (k % 2 ? 1 : -1);
          const d = k === 0 ? 0 : f.r * 0.45;
          const r = f.r * (k === 0 ? 1.05 : 0.7);
          ctx.globalAlpha = night ? 0.3 : 0.45;
          ctx.drawImage(spr, f.x + Math.cos(a) * d - r, f.y + Math.sin(a) * d * 0.7 - r * 0.8, r * 2, r * 1.6);
        }
      }
      ctx.globalAlpha = 1;
    }
    for (const f of this.flakes) {
      switch (f.k) {
        case FK.Rain:
          ctx.strokeStyle = night ? 'rgba(170,200,240,0.45)' : 'rgba(225,238,255,0.6)';
          ctx.lineWidth = 0.025;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.x - f.vx * 0.03, f.y - f.vy * 0.03);
          ctx.stroke();
          break;
        case FK.Snow:
          ctx.fillStyle = night ? 'rgba(220,232,255,0.8)' : 'rgba(255,255,255,0.95)';
          if (this.white > 0.3) {
            ctx.fillRect(f.x, f.y, f.size * 4, f.size * 0.8);
          } else {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, TAU);
            ctx.fill();
          }
          break;
        case FK.Leaf:
        case FK.Petal:
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rot);
          ctx.scale(1, 0.45 + Math.abs(Math.sin(f.rot * 1.7)) * 0.55);
          ctx.fillStyle = f.color;
          ctx.globalAlpha = night ? 0.75 : 0.95;
          ctx.beginPath();
          ctx.ellipse(0, 0, f.size, f.size * (f.k === FK.Leaf ? 0.55 : 0.7), 0, 0, TAU);
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
      }
    }
  }

  /** Additive pass: firelight, lightning, overcharge auras, strike warnings. */
  drawGlow(ctx: CanvasRenderingContext2D, g: Game, t: number, glow: (c: string) => HTMLCanvasElement) {
    const W = g.weather;
    const day = g.realm === 'day';
    if (W.fireCount) {
      const spr = glow('#ff7a2a');
      for (let i = 0; i < W.fire.length; i++) {
        if (W.fire[i] <= 0) continue;
        const x = (i % MAP_W) + 0.5,
          y = ((i / MAP_W) | 0) + 0.5;
        ctx.globalAlpha = (day ? 0.3 : 0.5) * (0.85 + Math.sin(t * 9 + i) * 0.15);
        ctx.drawImage(spr, x - 1.1, y - 1.2, 2.2, 2.2);
      }
    }
    for (const b of g.buildings) {
      if (!b.charge || b.charge <= 0) continue;
      const k = Math.min(1, b.charge / 1.5);
      ctx.globalAlpha = (0.35 + Math.sin(t * 18 + b.uid) * 0.15) * k;
      ctx.drawImage(glow('#7fdcff'), b.x + 0.5 - 0.9, b.y + 0.4 - 0.9, 1.8, 1.8);
    }
    for (const w of this.warns) {
      const k = 1 - w.t / 1.1;
      ctx.globalAlpha = 0.3 + k * 0.6 * (0.7 + Math.random() * 0.3);
      ctx.strokeStyle = '#bfefff';
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 1.1 * (1.3 - k * 0.3), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = k * 0.5;
      ctx.drawImage(glow('#9fdcff'), w.x - 0.6, w.y - 0.6, 1.2, 1.2);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const b of this.bolts) {
      const k = b.t / 0.4;
      for (let pass = 0; pass < 2; pass++) {
        ctx.globalAlpha = pass ? k : k * 0.5;
        ctx.strokeStyle = pass ? '#ffffff' : '#8fd8ff';
        ctx.lineWidth = pass ? 0.07 : 0.28;
        ctx.beginPath();
        b.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      }
      ctx.globalAlpha = k;
      ctx.drawImage(glow('#cfefff'), b.x - 1.4, b.y - 1.4, 2.8, 2.8);
    }
    ctx.globalAlpha = 1;
  }

  /** Light holes in the night darkness. */
  lights(g: Game, put: (x: number, y: number, r: number, a: number) => void) {
    const W = g.weather;
    if (W.fireCount)
      for (let i = 0; i < W.fire.length; i++) if (W.fire[i] > 0) put((i % MAP_W) + 0.5, ((i / MAP_W) | 0) + 0.5, 1.6, 0.7);
    for (const b of this.bolts) put(b.x, b.y, 4, b.t / 0.4);
    for (const b of g.buildings) if (b.charge && b.charge > 0) put(b.x + 0.5, b.y + 0.5, 1.6, 0.5);
  }

  /** Screen-space tints: storm gloom, blizzard whiteout, lightning flash. */
  drawScreen(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number) {
    const night = g.realm === 'night';
    if (this.gloom > 0.01) {
      ctx.fillStyle = night ? `rgba(10,14,30,${this.gloom * 0.18})` : `rgba(40,50,70,${this.gloom * 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.white > 0.01) {
      const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      const c = night ? '200,214,235' : '240,246,255';
      grd.addColorStop(0, `rgba(${c},${this.white * 0.16})`);
      grd.addColorStop(1, `rgba(${c},${this.white * 0.5})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.flash > 0.01) {
      ctx.fillStyle = `rgba(225,240,255,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

/** An irregular soft blob of overlapping ellipses (stable per tile). */
function blob(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const ox = (h(i, k + 20) - 0.5) * r * 0.5,
      oy = (h(i, k + 30) - 0.5) * r * 0.35;
    ctx.moveTo(x + ox + r * 0.8, y + oy);
    ctx.ellipse(x + ox, y + oy, r * (0.65 + h(i, k + 40) * 0.25), r * (0.4 + h(i, k + 50) * 0.18), 0, 0, TAU);
  }
  ctx.fill();
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, hgt: number, col: string) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 0.9, y - hgt * 0.6, x, y - hgt);
  ctx.quadraticCurveTo(x + w * 0.9, y - hgt * 0.6, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.4, x - w, y);
  ctx.fill();
}
