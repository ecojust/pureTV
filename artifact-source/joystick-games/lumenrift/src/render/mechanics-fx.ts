// Visuals for the seasonal campaigns' mechanics: whips, relayed beams, harpoon ropes, potions, hazards on the
// ground, allies, lures, frozen/hexed structures, the Great Sun Mirror's sweep, avalanches and spell effects.
import type { Building, Game, GameEvent, Hazard, Projectile } from '../game/game';
import { Particles, PK } from './particles';
import { REALM_ART } from './sprites/realm-art';
import { FLY_HEIGHT } from './sprites/enemies';

const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;

interface Line {
  pts: { x: number; y: number }[];
  t: number;
  max: number;
  color: string;
  core: string;
  width: number;
  /** Sag/curl of whips and ropes. */
  bend: number;
}
interface Ring {
  x: number;
  y: number;
  r: number;
  t: number;
  max: number;
  color: string;
  kind: 'clock' | 'noon' | 'plain';
}

function h(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class MechFx {
  private lines: Line[] = [];
  private rings: Ring[] = [];
  /** Screen tint pulse for the Midnight Clock. */
  timeStop = 0;

  reset() {
    this.lines = [];
    this.rings = [];
    this.timeStop = 0;
  }

  private line(pts: { x: number; y: number }[], color: string, core: string, width: number, life: number, bend = 0) {
    if (this.lines.length > 80) this.lines.shift();
    this.lines.push({ pts, t: life, max: life, color, core, width, bend });
  }

  onEvent(ev: GameEvent, P: Particles, light: (x: number, y: number, r: number, a: number, t: number) => void, shake: (a: number) => void) {
    if (ev.type !== 'fx') return;
    const { x, y } = ev;
    switch (ev.kind) {
      case 'devour':
        if (ev.r === 0) P.burst(x, y, 5, { kind: PK.Spark, color: '#ff8a8a', speed: 2.5, life: 0.25, size: 0.05 });
        else {
          P.burst(x, y, 14, { kind: PK.Shard, color: '#9ae06a', speed: 3, life: 0.5, size: 0.08, grav: 3 });
          P.add({ kind: PK.Ring, x, y, size: 0.2, grow: 2, life: 0.3, color: '#e0505a' });
        }
        break;
      case 'lash':
        for (const p of ev.pts ?? []) {
          this.line([{ x, y: y - 0.55 }, p], '#5a8a3a', '#c8f09a', 0.08, 0.28, 0.6);
          P.burst(p.x, p.y, 4, { kind: PK.Shard, color: '#8ad06a', speed: 2.5, life: 0.35, size: 0.06 });
        }
        break;
      case 'beam':
        this.line(ev.pts ?? [], '#ffb030', '#fffbe0', 0.12, 0.22);
        for (const p of (ev.pts ?? []).slice(1, -1)) P.add({ kind: PK.Glow, x: p.x, y: p.y, size: 0.7, life: 0.2, color: '#ffe9a0' });
        {
          const e = ev.pts?.[ev.pts.length - 1];
          if (e) P.burst(e.x, e.y, 6, { kind: PK.Spark, color: '#fff2b0', speed: 3, life: 0.25, size: 0.05 });
        }
        break;
      case 'noon':
        this.rings.push({ x, y, r: ev.r ?? 3, t: 0.9, max: 0.9, color: '#ffd24a', kind: 'noon' });
        light(x, y, (ev.r ?? 3) * 1.4, 0.9, 0.6);
        break;
      case 'whirl': {
        const x2 = ev.x2 ?? x,
          y2 = ev.y2 ?? y;
        for (let i = 0; i < 18; i++) {
          const f = i / 18;
          const a = f * TAU * 2;
          P.add({ kind: PK.Glow, x: x + (x2 - x) * f + Math.cos(a) * 0.3, y: y + (y2 - y) * f + Math.sin(a) * 0.3 - Math.sin(f * Math.PI) * 1.2, size: 0.25, life: 0.3 + f * 0.4, color: '#7ae0d8' });
        }
        P.burst(x2, y2, 10, { kind: PK.Smoke, color: '#c8b080', speed: 1.5, life: 0.7, size: 0.2, grow: 0.4 });
        break;
      }
      case 'potion': {
        const x2 = ev.x2 ?? x,
          y2 = ev.y2 ?? y;
        for (let i = 0; i < 8; i++) {
          const f = i / 8;
          P.add({ kind: PK.Glow, x: x2 + (x - x2) * f, y: y2 + (y - y2) * f - Math.sin(f * Math.PI) * 1.4, size: 0.18, life: 0.15 + f * 0.25, color: ev.color ?? '#7aff5a' });
        }
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: (ev.r ?? 1) * 3, life: 0.4, color: ev.color ?? '#7aff5a' });
        P.burst(x, y, 14, { kind: PK.Ember, color: ev.color ?? '#7aff5a', speed: 2.5, life: 0.7, size: 0.06, grav: -1 });
        break;
      }
      case 'reap':
        this.line(
          Array.from({ length: 9 }, (_, i) => {
            const a = -2.2 + (i / 8) * 2.6;
            return { x: x + Math.cos(a) * 0.55, y: y + Math.sin(a) * 0.4 };
          }),
          '#8a90c8',
          '#f0f4ff',
          0.07,
          0.3,
        );
        P.burst(x, y, 10, { kind: PK.Shard, color: '#c0c8ff', speed: 3, life: 0.4, size: 0.07 });
        break;
      case 'timestop':
        this.rings.push({ x, y, r: ev.r ?? 6, t: 1.2, max: 1.2, color: '#ffe8a0', kind: 'clock' });
        this.timeStop = 1;
        light(x, y, (ev.r ?? 6) * 1.2, 1, 0.8);
        shake(0.3);
        break;
      case 'harpoon': {
        const p = ev.pts?.[0];
        this.line([{ x, y: y - 0.3 }, { x: ev.x2 ?? x, y: ev.y2 ?? y }], '#6a5a4a', '#d8c8a8', 0.04, 0.4, 0.25);
        if (p) this.line([{ x: ev.x2 ?? x, y: ev.y2 ?? y }, p], '#9ab8d0', '#ffffff', 0.05, 0.3);
        P.burst(ev.x2 ?? x, ev.y2 ?? y, 6, { kind: PK.Spark, color: '#d8e8f8', speed: 3, life: 0.25, size: 0.05 });
        break;
      }
      case 'avalanche': {
        const r = ev.r ?? 1.8;
        P.burst(x, y, 40, { kind: PK.Smoke, color: '#eef4fc', speed: 3.5, life: 1.2, size: 0.35, grow: 0.6 });
        P.burst(x, y, 30, { kind: PK.Shard, color: '#ffffff', speed: 5, life: 0.8, size: 0.1, grav: 4 });
        P.add({ kind: PK.Ring, x, y, size: 0.3, grow: r * 5, life: 0.6, color: '#e8f4ff' });
        if (ev.x2 !== undefined)
          for (let i = 0; i < 14; i++) {
            const f = i / 14;
            P.add({ kind: PK.Smoke, x: ev.x2 + (x - ev.x2) * f, y: ev.y2! + (y - ev.y2!) * f, size: 0.3, grow: 0.5, life: 0.5 + f * 0.6, color: '#f4f8ff' });
          }
        shake(0.6);
        break;
      }
      case 'shatter':
        P.burst(x, y, 16, { kind: PK.Shard, color: '#bff6ff', speed: 4.5, life: 0.6, size: 0.09, grav: 3 });
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: 2.5, life: 0.35, color: '#7affd0' });
        light(x, y, 1.5, 0.8, 0.3);
        break;
      case 'freezepulse':
        this.rings.push({ x, y, r: ev.r ?? 6, t: 0.8, max: 0.8, color: '#a8f0ff', kind: 'plain' });
        P.burst(x, y, 30, { kind: PK.Shard, color: '#d8faff', speed: (ev.r ?? 6) * 1.6, life: 0.7, size: 0.08, drag: 2 });
        light(x, y, (ev.r ?? 6) * 1.1, 0.9, 0.5);
        shake(0.3);
        break;
      case 'roots':
        this.rings.push({ x, y, r: ev.r ?? 6, t: 0.7, max: 0.7, color: '#c8a060', kind: 'plain' });
        for (const p of ev.pts ?? []) {
          P.burst(p.x, p.y, 6, { kind: PK.Shard, color: '#8a6a3a', speed: 2.5, life: 0.6, size: 0.1, grav: 4, dir: -Math.PI / 2, spread: 1.2 });
          P.burst(p.x, p.y, 3, { kind: PK.Smoke, color: '#6a5034', speed: 0.8, life: 0.7, size: 0.18, grow: 0.3 });
        }
        shake(0.35);
        break;
      case 'vines': {
        const r = ev.r ?? 2;
        P.add({ kind: PK.Ring, x, y, size: 0.3, grow: r * 3, life: 0.5, color: '#9ae06a' });
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU,
            d = Math.random() * r;
          P.add({ kind: PK.Shard, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vy: -2.5, life: 0.8, max: 0.8, size: 0.1, grav: 4, color: i % 2 ? '#5aa03a' : '#8ad06a' });
        }
        shake(0.2);
        break;
      }
      case 'lure':
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: (ev.r ?? 4) * 2.5, life: 0.6, color: '#9fffd8' });
        light(x, y, 3, 0.9, 0.5);
        break;
      case 'hex':
        if (ev.r) this.rings.push({ x, y, r: ev.r, t: 0.6, max: 0.6, color: '#c05aff', kind: 'plain' });
        else {
          P.burst(x, y - 0.3, 10, { kind: PK.Ember, color: '#c05aff', speed: 1.5, life: 0.8, size: 0.06, grav: -1 });
          if (ev.x2 !== undefined) this.line([{ x: ev.x2, y: ev.y2! - 0.3 }, { x, y: y - 0.3 }], '#7a2ab0', '#e0a0ff', 0.05, 0.3, 0.3);
        }
        break;
      case 'freeze':
        if (ev.r) this.rings.push({ x, y, r: ev.r, t: 0.6, max: 0.6, color: '#bff6ff', kind: 'plain' });
        else {
          P.burst(x, y - 0.3, 12, { kind: PK.Shard, color: '#d8faff', speed: 2, life: 0.6, size: 0.07 });
          if (ev.x2 !== undefined) this.line([{ x: ev.x2, y: ev.y2! - 0.3 }, { x, y: y - 0.3 }], '#5a9ad0', '#e8faff', 0.05, 0.3);
        }
        break;
      case 'thaw':
        P.burst(x, y - 0.3, 8, { kind: PK.Smoke, color: '#dfe8f0', speed: 0.8, life: 0.8, size: 0.18, grow: 0.4, dir: -Math.PI / 2, spread: 1 });
        break;
      case 'revive':
        P.burst(x, y, 12, { kind: PK.Ember, color: '#b0ff80', speed: 1.2, life: 0.9, size: 0.05, grav: -1.5 });
        break;
      case 'illusion':
        P.burst(x, y, 10, { kind: PK.Spark, color: '#e0f0ff', speed: 2, life: 0.4, size: 0.05 });
        break;
      case 'burrow':
      case 'surface':
        P.burst(x, y, 10, { kind: PK.Shard, color: '#6a5034', speed: 2.5, life: 0.5, size: 0.08, grav: 5, dir: -Math.PI / 2, spread: 2 });
        P.burst(x, y, 5, { kind: PK.Smoke, color: '#5a4632', speed: 0.8, life: 0.6, size: 0.2, grow: 0.3 });
        break;
      case 'bomb':
        P.burst(x, y, 20, { kind: PK.Ember, color: '#ffb030', speed: 4, life: 0.7, size: 0.07, grav: -1 });
        shake(0.25);
        break;
      case 'swallow':
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          P.add({ kind: PK.Shard, x: x + Math.cos(a) * 0.5, y: y + Math.sin(a) * 0.5, vx: -Math.cos(a) * 1.2, vy: -Math.sin(a) * 1.2, life: 0.45, max: 0.45, size: 0.06, color: '#d8b070' });
        }
        break;
      case 'raise':
        P.burst(x, y, 16, { kind: PK.Ember, color: '#7affc0', speed: 1.4, life: 1, size: 0.06, grav: -2 });
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: 2, life: 0.5, color: '#7affc0' });
        break;
      case 'mammoth':
        P.burst(x, y, 12, { kind: PK.Smoke, color: '#e8eef6', speed: 1.5, life: 0.8, size: 0.22, grow: 0.4 });
        break;
      case 'sting':
        this.line([{ x: ev.x2 ?? x, y: (ev.y2 ?? y) - 0.3 }, { x, y }], ev.color ?? '#c89a20', ev.color ? '#6a5a8a' : '#ffe066', 0.03, 0.15, 0.4);
        break;
      case 'puff':
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: (ev.r ?? 1) * 3, life: 0.45, color: ev.color ?? '#ffe066' });
        P.burst(x, y, 16, { kind: PK.Glow, color: ev.color ?? '#ffe066', speed: (ev.r ?? 1) * 1.6, life: 0.7, size: 0.25, drag: 3 });
        break;
      case 'shell':
        P.add({ kind: PK.Ring, x, y, size: 0.2, grow: 1.2, life: 0.3, color: '#e0d0a0' });
        break;
      case 'cast':
        P.add({ kind: PK.Ring, x, y, size: 0.1, grow: (ev.r ?? 2) * 2.4, life: 0.35, color: '#ffffff' });
        break;
    }
  }

  update(g: Game, dt: number, P: Particles) {
    for (const l of this.lines) l.t -= dt;
    this.lines = this.lines.filter((l) => l.t > 0);
    for (const r of this.rings) r.t -= dt;
    this.rings = this.rings.filter((r) => r.t > 0);
    this.timeStop = Math.max(0, this.timeStop - dt * 1.2);
    if (dt <= 0) return;
    // embers over burning oil, pollen over brambles, bubbles in poison
    for (const hz of g.hazards) {
      if (hz.kind === 'slime' || Math.random() > dt * 6) continue;
      const a = Math.random() * TAU,
        d = Math.random() * hz.r;
      const col = hz.kind === 'fire' || hz.kind === 'warm' ? '#ffb347' : hz.kind === 'poison' ? '#9aff6a' : '#c8a070';
      P.add({ kind: PK.Ember, x: hz.x + Math.cos(a) * d, y: hz.y + Math.sin(a) * d, vy: -1, life: 0.6, max: 0.6, size: 0.05, color: col });
    }
    for (const l of g.lures)
      if (Math.random() < dt * 20) {
        const a = Math.random() * TAU;
        P.add({ kind: PK.Ember, x: l.x + Math.cos(a) * 0.3, y: l.y - 0.4 + Math.sin(a) * 0.3, vy: -0.6, life: 0.6, max: 0.6, size: 0.05, color: '#9fffd8' });
      }
    for (const b of g.buildings) {
      if (b.def.id === 'sandblaster' && b.firing > 0 && Math.random() < dt * 30) {
        const a = b.angle + (Math.random() - 0.5) * 0.9;
        const sp = 5 + Math.random() * 3;
        P.add({ kind: PK.Smoke, x: b.x + 0.5 + Math.cos(b.angle) * 0.35, y: b.y + 0.4 + Math.sin(b.angle) * 0.35, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, max: 0.45, size: 0.1, grow: 0.5, drag: 2, color: '#d8c090' });
      }
    }
  }

  /** Ground layer: hazards. */
  drawGround(ctx: C, g: Game, t: number) {
    for (let i = 0; i < g.hazards.length; i++) drawHazard(ctx, g.hazards[i], t, i);
  }

  /** Structure overlays: frozen in ice, hexed, an avalanche ready to go. */
  drawOverlay(ctx: C, b: Building, t: number) {
    const x = b.x,
      y = b.y;
    if (b.disabledT && b.disabledT > 0) {
      const k = Math.min(1, b.disabledT * 2);
      ctx.save();
      ctx.globalAlpha = k;
      if (b.disabledKind === 'freeze') {
        ctx.fillStyle = 'rgba(190,235,255,0.45)';
        ctx.strokeStyle = 'rgba(240,252,255,0.9)';
        ctx.lineWidth = 0.035;
        ctx.beginPath();
        ctx.moveTo(x + 0.08, y + 0.95);
        ctx.lineTo(x + 0.04, y - 0.05);
        ctx.lineTo(x + 0.4, y - 0.3);
        ctx.lineTo(x + 0.92, y - 0.12);
        ctx.lineTo(x + 0.96, y + 0.95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(x + 0.25, y + 0.1);
        ctx.lineTo(x + 0.4, y + 0.5);
        ctx.moveTo(x + 0.7, y);
        ctx.lineTo(x + 0.62, y + 0.35);
        ctx.stroke();
      } else {
        ctx.translate(x + 0.5, y + 0.35);
        ctx.rotate(t * 1.5);
        ctx.strokeStyle = 'rgba(200,110,255,0.9)';
        ctx.lineWidth = 0.04;
        ctx.beginPath();
        ctx.arc(0, 0, 0.42, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * TAU) / 5;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 0.38, Math.sin(a) * 0.38);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (b.def.id === 'avalanche' && (b.prime ?? 0) >= 1) {
      const p = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + p * 0.5})`;
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 0.5, 0.55 + p * 0.08, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 0.42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + 0.5, y - 0.45 - p * 0.05);
      ctx.restore();
    }
  }

  /** Allies and lures, among the units. */
  drawUnits(ctx: C, g: Game, t: number) {
    const art = REALM_ART[g.realm];
    for (const a of g.allies) {
      if (art?.ally) art.ally(ctx, a, t);
      else {
        ctx.fillStyle = a.kind === 'mammoth' ? '#8a6a4a' : '#5a8a5a';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.kind === 'mammoth' ? 0.45 : 0.25, 0, TAU);
        ctx.fill();
      }
      if (a.kind === 'zombie' && a.hp < a.maxHp) {
        ctx.fillStyle = 'rgba(5,5,12,0.75)';
        ctx.fillRect(a.x - 0.25, a.y - 0.5, 0.5, 0.06);
        ctx.fillStyle = '#7affc0';
        ctx.fillRect(a.x - 0.24, a.y - 0.49, 0.48 * Math.max(0, a.hp / a.maxHp), 0.04);
      }
    }
    for (const l of g.lures) {
      const k = Math.min(1, l.t);
      ctx.save();
      ctx.globalAlpha = k * 0.5;
      ctx.strokeStyle = '#9fffd8';
      ctx.lineWidth = 0.03;
      ctx.setLineDash([0.15, 0.15]);
      ctx.lineDashOffset = -t;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Additive pass: beams, whips, rings, the great mirror's sweep, wisps, burning hazards. */
  drawGlow(ctx: C, g: Game, t: number, glow: (c: string) => HTMLCanvasElement) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const l of this.lines) {
      const k = l.t / l.max;
      for (let pass = 0; pass < 2; pass++) {
        ctx.globalAlpha = (pass ? 0.95 : 0.45) * k;
        ctx.strokeStyle = pass ? l.core : l.color;
        ctx.lineWidth = pass ? l.width * 0.4 : l.width;
        ctx.beginPath();
        l.pts.forEach((p, i) => {
          if (!i) return ctx.moveTo(p.x, p.y);
          const q = l.pts[i - 1];
          if (!l.bend) return ctx.lineTo(p.x, p.y);
          const mx = (p.x + q.x) / 2,
            my = (p.y + q.y) / 2;
          const nx = -(p.y - q.y),
            ny = p.x - q.x;
          ctx.quadraticCurveTo(mx + nx * l.bend * 0.3 * Math.sin(t * 20 + i), my + ny * l.bend * 0.3 + Math.abs(ny) * 0.1, p.x, p.y);
        });
        ctx.stroke();
      }
    }
    for (const r of this.rings) {
      const k = 1 - r.t / r.max;
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 0.08 + (1 - k) * 0.1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * (r.kind === 'clock' ? 1 - k * 0.15 : 0.2 + k * 0.8), 0, TAU);
      ctx.stroke();
      if (r.kind === 'clock') {
        // clock hands sweeping round
        ctx.lineWidth = 0.12;
        for (const [len, sp] of [
          [0.75, 4],
          [0.5, 1],
        ]) {
          const a = -Math.PI / 2 + k * TAU * sp;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + Math.cos(a) * r.r * len, r.y + Math.sin(a) * r.r * len);
          ctx.stroke();
        }
      } else if (r.kind === 'noon') {
        ctx.globalAlpha = (1 - k) * 0.25;
        ctx.drawImage(glow(r.color), r.x - r.r, r.y - r.r, r.r * 2, r.r * 2);
      }
    }
    // the Great Sun Mirror's sweeping beam
    for (const b of g.buildings) {
      if (b.def.id !== 'greatmirror' || (b.disabledT ?? 0) > 0) continue;
      const L = b.def.levels[b.level];
      const sx = b.x + 0.5,
        sy = b.y - 0.1;
      const ex = sx + Math.cos(b.spin) * L.range!,
        ey = sy + Math.sin(b.spin) * L.range!;
      const grd = ctx.createLinearGradient(sx, sy, ex, ey);
      grd.addColorStop(0, 'rgba(255,250,220,0.95)');
      grd.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = grd;
      ctx.lineWidth = 0.3 + Math.sin(t * 30) * 0.03;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.lineWidth = 0.08;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (ex - sx) * 0.6, sy + (ey - sy) * 0.6);
      ctx.stroke();
    }
    // aurora ribbons on their target
    for (const b of g.buildings) {
      if (b.def.id !== 'aurora' || b.firing <= 0 || !b.targetUid) continue;
      const e = g.enemyByUidGet(b.targetUid);
      if (!e || e.dead) continue;
      const sx = b.x + 0.5,
        sy = b.y - 0.35;
      const ex = e.x,
        ey = e.y - (e.def.flying ? FLY_HEIGHT : 0);
      const build = Math.min(1, (e.frostBuild ?? 0) / 2);
      for (const [col, w, ph] of [
        ['#7affd0', 0.16, 0],
        ['#b07aff', 0.1, 2],
        ['#e8fff8', 0.04, 4],
      ] as const) {
        ctx.globalAlpha = 0.55 + build * 0.3;
        ctx.strokeStyle = col;
        ctx.lineWidth = w * (1 + build * 0.5);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= 10; i++) {
          const f = i / 10;
          const wob = Math.sin(t * 6 + f * 8 + ph) * 0.12 * Math.sin(f * Math.PI);
          ctx.lineTo(sx + (ex - sx) * f + wob, sy + (ey - sy) * f - wob * 0.5);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.6;
      ctx.drawImage(glow('#7affd0'), ex - 0.5, ey - 0.5, 1, 1);
    }
    // wisps
    for (const l of g.lures) {
      const k = Math.min(1, l.t);
      const bob = Math.sin(t * 4) * 0.08;
      ctx.globalAlpha = k * (0.8 + Math.sin(t * 13) * 0.1);
      ctx.drawImage(glow('#9fffd8'), l.x - 0.7, l.y - 1.1 + bob, 1.4, 1.4);
      ctx.globalAlpha = k;
      ctx.drawImage(glow('#ffffff'), l.x - 0.22, l.y - 0.62 + bob, 0.44, 0.44);
    }
    // burning hazards
    for (const hz of g.hazards) {
      if (hz.kind !== 'fire' && hz.kind !== 'warm') continue;
      ctx.globalAlpha = Math.min(1, hz.t / 1) * 0.45;
      ctx.drawImage(glow(hz.kind === 'warm' ? '#ff9a4a' : '#ff6a20'), hz.x - hz.r * 1.3, hz.y - hz.r * 1.3, hz.r * 2.6, hz.r * 2.6);
    }
    ctx.globalAlpha = 1;
  }

  /** Light holes for the dark campaigns. */
  lights(g: Game, put: (x: number, y: number, r: number, a: number) => void) {
    for (const hz of g.hazards) if (hz.kind === 'fire' || hz.kind === 'warm') put(hz.x, hz.y, hz.r * 1.6, 0.7);
    for (const l of g.lures) put(l.x, l.y - 0.4, 3, 0.9);
    for (const b of g.buildings) if (b.def.id === 'greatmirror') put(b.x + 0.5 + Math.cos(b.spin) * 3, b.y + 0.5 + Math.sin(b.spin) * 3, 3, 0.6);
  }

  /** Screen tint for the Midnight Clock's time-stop. */
  drawScreen(ctx: C, w: number, h: number) {
    if (this.timeStop <= 0.01) return;
    ctx.fillStyle = `rgba(200,190,140,${this.timeStop * 0.12})`;
    ctx.fillRect(0, 0, w, h);
  }

  /** Bodies of the seasonal projectiles. Returns true if it drew the projectile. */
  drawProjectile(ctx: C, p: Projectile, t: number): boolean {
    if (p.kind === 'pellet') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 0.12, 0.06, 0.025, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.07, 0, TAU);
      ctx.fill();
      return true;
    }
    if (p.kind === 'rollball') {
      const size = p.t < 0.35 ? 0.24 : 0.3 + (p.hits?.length ?? 0) * 0.04;
      const lift = p.t < 0.35 ? Math.sin((p.t / 0.35) * Math.PI) * 1.2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + size * 0.6, size, size * 0.4, 0, 0, TAU);
      ctx.fill();
      const grd = ctx.createRadialGradient(p.x - size * 0.3, p.y - lift - size * 0.4, size * 0.1, p.x, p.y - lift, size);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(1, '#b8c8dc');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y - lift, size, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,170,200,0.6)';
      ctx.lineWidth = 0.02;
      ctx.beginPath();
      ctx.arc(p.x, p.y - lift, size * 0.6, t * 6, t * 6 + 2);
      ctx.stroke();
      return true;
    }
    if (p.kind === 'shell' && p.after) {
      const k = Math.min(1, p.t / p.flight);
      const hgt = Math.sin(Math.PI * k) * 1.3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 0.12, 0.06, 0, 0, TAU);
      ctx.fill();
      const col = p.after === 'catapult' ? '#ff8a20' : p.after === 'naphtha' ? '#8a4a2a' : '#6a4a2a';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y - hgt, p.after === 'catapult' ? 0.15 : 0.12, 0, TAU);
      ctx.fill();
      if (p.after === 'bramble') {
        ctx.strokeStyle = '#3a5a2a';
        ctx.lineWidth = 0.025;
        for (let i = 0; i < 6; i++) {
          const a = i + t * 8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - hgt);
          ctx.lineTo(p.x + Math.cos(a) * 0.18, p.y - hgt + Math.sin(a) * 0.18);
          ctx.stroke();
        }
      } else if (p.after === 'catapult') {
        ctx.fillStyle = '#ffe080';
        ctx.fillRect(p.x - 0.06, p.y - hgt - 0.03, 0.04, 0.03);
        ctx.fillRect(p.x + 0.02, p.y - hgt - 0.03, 0.04, 0.03);
      }
      return true;
    }
    return false;
  }
}

/** One lingering ground effect. */
function drawHazard(ctx: C, hz: Hazard, t: number, i: number) {
  const k = Math.min(1, hz.t / 0.8) * Math.min(1, (hz.max - hz.t) * 4 + 0.2);
  ctx.save();
  ctx.globalAlpha = k;
  switch (hz.kind) {
    case 'slime':
      ctx.globalAlpha = k * 0.5;
      ctx.fillStyle = 'rgba(190,230,140,0.55)';
      ctx.beginPath();
      ctx.ellipse(hz.x + (h(i, 1) - 0.5) * 0.2, hz.y, 0.38, 0.2, h(i, 2) * 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(hz.x - 0.08, hz.y - 0.05, 0.12, 0.04, -0.3, 0, TAU);
      ctx.fill();
      break;
    case 'bramble':
      ctx.strokeStyle = '#4a3a22';
      ctx.lineWidth = 0.05;
      for (let n = 0; n < 9; n++) {
        const a = h(i, n) * TAU,
          d = h(i, n + 9) * hz.r * 0.85;
        const cx = hz.x + Math.cos(a) * d,
          cy = hz.y + Math.sin(a) * d * 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, 0.14 + h(i, n + 20) * 0.1, h(i, n + 30) * 3, h(i, n + 30) * 3 + 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#5a7a3a';
      for (let n = 0; n < 8; n++) {
        const a = h(i, n + 40) * TAU,
          d = h(i, n + 50) * hz.r * 0.8;
        ctx.fillRect(hz.x + Math.cos(a) * d, hz.y + Math.sin(a) * d * 0.7, 0.06, 0.04);
      }
      break;
    case 'poison': {
      const g = ctx.createRadialGradient(hz.x, hz.y, 0, hz.x, hz.y, hz.r);
      g.addColorStop(0, 'rgba(110,220,70,0.65)');
      g.addColorStop(0.7, 'rgba(80,170,50,0.45)');
      g.addColorStop(1, 'rgba(60,120,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(hz.x, hz.y, hz.r, hz.r * 0.75, 0, 0, TAU);
      ctx.fill();
      for (let n = 0; n < 4; n++) {
        const ph = (t * 0.8 + n / 4) % 1;
        ctx.strokeStyle = `rgba(200,255,150,${0.7 * (1 - ph)})`;
        ctx.lineWidth = 0.025;
        ctx.beginPath();
        ctx.arc(hz.x + (h(i, n) - 0.5) * hz.r, hz.y + (h(i, n + 5) - 0.5) * hz.r * 0.6, 0.04 + ph * 0.08, 0, TAU);
        ctx.stroke();
      }
      break;
    }
    case 'fire':
    case 'warm': {
      const g = ctx.createRadialGradient(hz.x, hz.y, 0, hz.x, hz.y, hz.r);
      g.addColorStop(0, hz.kind === 'warm' ? 'rgba(255,170,90,0.5)' : 'rgba(40,20,10,0.6)');
      g.addColorStop(1, 'rgba(40,20,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(hz.x, hz.y, hz.r, hz.r * 0.75, 0, 0, TAU);
      ctx.fill();
      for (let n = 0; n < 6; n++) {
        const fx = hz.x + (h(i, n) - 0.5) * hz.r * 1.2,
          fy = hz.y + (h(i, n + 7) - 0.5) * hz.r * 0.8;
        const hgt = (0.25 + h(i, n + 3) * 0.2) * (0.8 + Math.sin(t * 14 + n * 2) * 0.2);
        ctx.fillStyle = n % 2 ? '#ffb030' : '#ff6a1f';
        ctx.beginPath();
        ctx.moveTo(fx - 0.09, fy);
        ctx.quadraticCurveTo(fx - 0.08, fy - hgt * 0.6, fx, fy - hgt);
        ctx.quadraticCurveTo(fx + 0.08, fy - hgt * 0.6, fx + 0.09, fy);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

