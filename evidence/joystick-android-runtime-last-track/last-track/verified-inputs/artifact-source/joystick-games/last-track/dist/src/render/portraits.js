// Stylised rival pilot portraits, painted in code: canvas-2D vector busts in a neon-city backdrop. No external assets.
// portraitSpec(driver) is pure and Node-testable (plain JSON: palette, hair, face, expression, accessories). drawPortrait paints it in
// a 256x256 logical space scaled to the target canvas, so it stays crisp from ~96px up to hi-dpi.
// A driver's portrait.look (optional) gives the character: hair style and colour, skin / lip / eye colour, expression, freckles, a mole,
// blush, earrings, a headset, a visor, a scar, a beard, and masc for the broader jaw and brow.
import { mulberry32 } from '../core/mathUtil.js';
import { modernHex, mixHex } from './paletteRef.js';
export { mixHex };

export const PORTRAIT_SIZE = 256;           // logical drawing space (the canvas may be any size)
export const HAIR_STYLES = ['swept', 'mohawk', 'buzz', 'long', 'helmet', 'bob', 'ponytail', 'braid', 'curly'];
export const EXPRESSIONS = ['smirk', 'stern', 'grin', 'wink', 'calm'];
const SEED_STYLES = ['swept', 'mohawk', 'buzz', 'long', 'helmet'];   // what a seed picks when the look does not name a style

// ---------- colour helpers (pure) ----------
const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const c = hexToRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const lum = (h) => { const c = hexToRgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
const sat = (h) => { const c = hexToRgb(h), mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
/** make a colour usable as neon light: dull/dark colours are lifted towards white. */
function neon(h) { let c = h; if (sat(c) < 0.3) c = mixHex(c, '#ffffff', 0.5); if (lum(c) < 0.35) c = mixHex(c, '#ffffff', 0.25); return c; }

/** Seeded freckles: [x, y, r] across the nose and cheeks. */
function freckleList(seed) {
  const r = mulberry32(seed * 977 + 3), out = [];
  for (let i = 0; i < 12; i++) out.push([Math.round((94 + r() * 68) * 10) / 10, Math.round((126 + r() * 26) * 10) / 10, Math.round((0.9 + r() * 0.8) * 10) / 10]);
  return out;
}
function scarOf(seed, r1) { return { side: seed % 3 === 0 ? -1 : 1, tilt: Math.round((r1 * 0.5 + 0.2) * 100) / 100 }; }

/**
 * Pure description of a driver's portrait. Deterministic from driver.portrait {seed, skin, hair, accent, look?} + driver.color / helmet
 * (palette indices resolved through the modern ramp) + driver.skill. Returns a plain JSON-able object.
 */
export function portraitSpec(driver) {
  const por = (driver && driver.portrait) || { seed: 0, skin: 15, hair: 4, accent: 8 };
  const look = por.look || {};
  const seed = por.seed | 0;
  const rng = mulberry32(seed * 7919 + 13);
  const skinIdx = por.skin ?? 15, hairIdx = por.hair ?? 4, accentIdx = por.accent ?? 8;
  const jacketIdx = driver && driver.color != null ? driver.color : accentIdx;
  const helmetIdx = driver && driver.helmet != null ? driver.helmet : 10;
  const masc = !!look.masc;
  const style = HAIR_STYLES.includes(look.hair) ? look.hair : SEED_STYLES[(((seed * 2 + (hairIdx | 0)) % 5) + 5) % 5];
  const accent = neon(modernHex(accentIdx));
  const skin = look.skinHex || mixHex(modernHex(skinIdx), '#c79c7c', 0.45);
  const hair = look.hairHex || modernHex(hairIdx);
  const jacket = modernHex(jacketIdx);
  const helmet = modernHex(helmetIdx);
  const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng();
  const visor = ['none', 'goggles', 'visor'].includes(look.visor) ? look.visor : (style === 'helmet' ? 'visor' : (seed & 1) === 1 ? 'goggles' : r1 < 0.3 ? 'visor' : 'none');
  const cyber = !!(driver && driver.skill >= 0.99);
  const expr = EXPRESSIONS.includes(look.expr) ? look.expr : (r4 < 0.5 ? 'stern' : 'smirk');
  const skinObj = { base: skin, light: mixHex(skin, '#fff2e6', 0.35), shade: mixHex(skin, '#3a1226', 0.5), deep: mixHex(skin, '#1a0a18', 0.72) };
  return {
    seed, style, visor, cyber, masc, expr,
    accent, rim2: '#5ad0ff',
    skin: skinObj,
    hair: { base: hair, light: mixHex(hair, '#ffffff', 0.4), dark: mixHex(hair, '#05060c', 0.55) },
    jacket: { base: mixHex(jacket, '#07080f', 0.5), light: mixHex(jacket, '#07080f', 0.15), dark: mixHex(jacket, '#05060a', 0.8), raw: jacket },
    helmet: { base: helmet, light: mixHex(helmet, '#ffffff', 0.5), dark: mixHex(helmet, '#05060a', 0.6) },
    bg: { top: mixHex('#080a14', accent, 0.08), bottom: mixHex('#161a2e', accent, 0.16) },
    iris: look.eye || mixHex(accent, '#10131c', 0.35),
    shadow: look.shadow || mixHex(accent, '#2a1030', 0.55),
    lip: look.lip || (masc ? mixHex(skin, '#6a3030', 0.35) : mixHex(skin, '#b8476a', 0.62)),
    blush: look.blush ?? !masc,
    lashes: look.lashes ?? !masc,
    freckles: look.freckles ? freckleList(seed) : [],
    mole: !!look.mole,
    earring: 'earring' in look ? look.earring : (masc ? null : seed % 2 === 0 ? 'hoop' : 'stud'),
    headset: !!look.headset,
    beard: look.beard || null,
    jaw: Math.round((r2 * 8 - 3) * 10) / 10,          // chin width tweak
    brow: Math.round((r3 * 0.5 - 0.1) * 100) / 100,   // brow tilt (stern <-> sly)
    mood: expr === 'stern' ? 'stern' : 'smirk',
    scar: look.scar === true ? scarOf(seed, r1) : look.scar === false ? null : (r5 < 0.7 ? scarOf(seed, r1) : null),
  };
}

// ---------- drawing ----------
function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
function rad(ctx, x0, y0, r0, x1, y1, r1, stops) { const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
const qbPt = (p0, p1, p2, t) => { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; };

/** Head outline. Women's faces are a touch narrower at the chin, men's a touch squarer. */
function headPath(ctx, s) {
  const cw = 28 + s.jaw + (s.masc ? 4 : -2);
  ctx.beginPath();
  ctx.moveTo(128, 52);
  ctx.bezierCurveTo(170, 52, 184, 90, 181, 126);
  ctx.bezierCurveTo(178, 160, 158 + (cw - 28) * 0.3, 186, 128, 188);
  ctx.bezierCurveTo(98 - (cw - 28) * 0.3, 186, 78, 160, 75, 126);
  ctx.bezierCurveTo(72, 90, 86, 52, 128, 52);
  ctx.closePath();
}
function glowLine(ctx, color, w, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); fn(); ctx.stroke(); ctx.restore(); }

function drawBackdrop(ctx, s) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, 256, [[0, s.bg.top], [1, s.bg.bottom]]); ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = rad(ctx, 128, 112, 4, 128, 112, 150, [[0, rgba(s.accent, 0.5)], [0.55, rgba(s.accent, 0.14)], [1, rgba(s.accent, 0)]]); ctx.fillRect(0, 0, 256, 256);
  // city bokeh + light bars (seeded)
  const r = mulberry32(s.seed * 31 + 7);
  for (let i = 0; i < 9; i++) {
    const x = r() * 256, y = 20 + r() * 150, rr = 6 + r() * 16, col = r() < 0.5 ? s.accent : s.rim2;
    ctx.fillStyle = rgba(col, 0.05 + r() * 0.1); ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 4; i++) { const x = 14 + r() * 228, h = 40 + r() * 90; ctx.fillStyle = lin(ctx, x, 256 - h, x, 256, [[0, rgba(s.rim2, 0)], [1, rgba(s.rim2, 0.16)]]); ctx.fillRect(x, 256 - h, 2 + r() * 3, h); }
}

function drawJacket(ctx, s) {
  const j = s.jacket;
  ctx.beginPath(); ctx.moveTo(4, 256); ctx.bezierCurveTo(8, 222, 52, 206, 96, 198); ctx.lineTo(160, 198); ctx.bezierCurveTo(204, 206, 248, 222, 252, 256); ctx.closePath();
  ctx.fillStyle = lin(ctx, 40, 196, 216, 256, [[0, j.light], [0.55, j.base], [1, j.dark]]); ctx.fill();
  ctx.save(); ctx.clip();
  // fold shading + right rim light
  ctx.fillStyle = rad(ctx, 70, 205, 4, 70, 205, 110, [[0, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 190, 256, 66);
  ctx.fillStyle = lin(ctx, 256, 0, 190, 0, [[0, rgba(s.accent, 0.55)], [1, rgba(s.accent, 0)]]); ctx.fillRect(190, 190, 66, 66);
  ctx.restore();
  // inner undershirt V + collar flaps
  ctx.beginPath(); ctx.moveTo(100, 198); ctx.lineTo(128, 238); ctx.lineTo(156, 198); ctx.closePath(); ctx.fillStyle = '#0b0d16'; ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(128 + sx * 30, 194); ctx.lineTo(128 + sx * 50, 206); ctx.lineTo(128 + sx * 16, 256); ctx.lineTo(128 + sx * 2, 240); ctx.lineTo(128 + sx * 30, 200); ctx.closePath();
    ctx.fillStyle = lin(ctx, 128, 194, 128 + sx * 40, 256, [[0, mixHex(j.base, '#ffffff', 0.18)], [1, j.dark]]); ctx.fill();
  }
  glowLine(ctx, s.accent, 2, 8, () => { ctx.moveTo(100, 199); ctx.lineTo(128, 238); ctx.lineTo(156, 199); });
  glowLine(ctx, s.accent, 2.4, 8, () => { ctx.moveTo(30, 232); ctx.quadraticCurveTo(54, 214, 86, 207); });
  ctx.fillStyle = rgba(s.accent, 0.9); ctx.beginPath(); ctx.arc(46, 240, 4, 0, Math.PI * 2); ctx.fill();
}

function drawNeck(ctx, s) {
  ctx.beginPath(); ctx.moveTo(104, 160); ctx.lineTo(102, 208); ctx.quadraticCurveTo(128, 222, 154, 208); ctx.lineTo(152, 160); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 160, 0, 214, [[0, s.skin.deep], [0.4, s.skin.shade], [1, s.skin.base]]); ctx.fill();
  ctx.fillStyle = lin(ctx, 150, 0, 120, 0, [[0, rgba(s.accent, 0.35)], [1, rgba(s.accent, 0)]]); ctx.fill();
}

function drawHairBack(ctx, s) {
  const h = s.hair, shade = lin(ctx, 0, 40, 0, 240, [[0, h.light], [0.4, h.base], [1, h.dark]]);
  if (s.style === 'long') {
    ctx.beginPath(); ctx.moveTo(72, 100); ctx.bezierCurveTo(52, 140, 54, 200, 62, 238); ctx.lineTo(194, 238); ctx.bezierCurveTo(204, 200, 204, 140, 184, 100); ctx.bezierCurveTo(170, 40, 86, 40, 72, 100); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
  } else if (s.style === 'bob') {
    ctx.beginPath(); ctx.moveTo(70, 104); ctx.bezierCurveTo(54, 150, 56, 176, 70, 192); ctx.bezierCurveTo(96, 184, 160, 184, 186, 192); ctx.bezierCurveTo(200, 176, 202, 150, 186, 104); ctx.bezierCurveTo(170, 40, 86, 40, 70, 104); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
  } else if (s.style === 'ponytail') {
    ctx.beginPath(); ctx.moveTo(160, 52); ctx.bezierCurveTo(206, 74, 220, 130, 206, 208); ctx.bezierCurveTo(200, 222, 186, 222, 182, 206); ctx.bezierCurveTo(190, 150, 184, 112, 156, 84); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
  } else if (s.style === 'curly') {
    const r = mulberry32(s.seed * 53 + 11);
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (0.95 + (i / 12) * 1.1), x = 128 + Math.cos(a) * 64, y = 96 + Math.sin(a) * 66, rr = 13 + r() * 6;
      ctx.fillStyle = rad(ctx, x - rr * 0.3, y - rr * 0.3, 1, x, y, rr, [[0, h.light], [0.6, h.base], [1, h.dark]]); ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawHead(ctx, s) {
  const sk = s.skin;
  // ears with an inner shade
  for (const sx of [-1, 1]) {
    ctx.fillStyle = sx < 0 ? sk.shade : sk.base; ctx.beginPath(); ctx.ellipse(128 + sx * 53, 130, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(sk.deep, 0.4); ctx.beginPath(); ctx.ellipse(128 + sx * 53 + sx * 1.2, 131, 3.2, 6.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  headPath(ctx, s);
  ctx.fillStyle = rad(ctx, 108, 104, 8, 128, 128, 100, [[0, sk.light], [0.45, sk.base], [1, sk.shade]]); ctx.fill();
  ctx.save(); headPath(ctx, s); ctx.clip();
  ctx.fillStyle = rad(ctx, 128, 196, 6, 128, 190, 52, [[0, rgba(sk.deep, 0.55)], [1, rgba(sk.deep, 0)]]); ctx.fillRect(60, 150, 140, 60);   // under-chin shadow
  ctx.fillStyle = rad(ctx, 92, 136, 2, 92, 136, 26, [[0, rgba(sk.light, 0.38)], [1, rgba(sk.light, 0)]]); ctx.fillRect(60, 110, 60, 50);     // cheekbone light (left)
  ctx.fillStyle = rad(ctx, 164, 136, 2, 164, 136, 26, [[0, rgba(sk.light, 0.38)], [1, rgba(sk.light, 0)]]); ctx.fillRect(136, 110, 60, 50);   // cheekbone light (right)
  if (s.blush) {
    ctx.fillStyle = rad(ctx, 94, 152, 2, 94, 152, 20, [[0, 'rgba(255,110,140,0.26)'], [1, 'rgba(255,110,140,0)']]); ctx.fillRect(66, 130, 56, 44);
    ctx.fillStyle = rad(ctx, 162, 152, 2, 162, 152, 20, [[0, 'rgba(255,110,140,0.26)'], [1, 'rgba(255,110,140,0)']]); ctx.fillRect(134, 130, 56, 44);
  }
  ctx.fillStyle = lin(ctx, 190, 0, 150, 0, [[0, rgba(s.accent, 0.8)], [0.5, rgba(s.accent, 0.2)], [1, rgba(s.accent, 0)]]); ctx.fillRect(140, 40, 60, 170);   // neon rim (right)
  ctx.fillStyle = lin(ctx, 70, 0, 96, 0, [[0, rgba(s.rim2, 0.32)], [1, rgba(s.rim2, 0)]]); ctx.fillRect(60, 40, 50, 170);                               // cool rim (left)
  ctx.restore();
}

function openEye(ctx, s, inner, outer, cx, eyeY, sx) {
  const sk = s.skin, P0 = [inner, eyeY + 0.5], P1 = [cx, eyeY - 9.5], P2 = [outer, eyeY - 0.5];
  const almond = () => { ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); ctx.quadraticCurveTo(cx, eyeY + 7, P0[0], P0[1]); ctx.closePath(); };
  almond(); ctx.fillStyle = lin(ctx, 0, eyeY - 6, 0, eyeY + 6, [[0, '#e6e0e3'], [0.45, '#faf8f8'], [1, '#d6cfd4']]); ctx.fill();
  ctx.save(); almond(); ctx.clip();
  const ix = cx - sx * 0.8, iy = eyeY + 0.4, ir = 5.2;
  ctx.fillStyle = rad(ctx, ix - 1.2, iy - 1.5, 0.5, ix, iy, ir, [[0, mixHex(s.iris, '#ffffff', 0.35)], [0.55, s.iris], [1, mixHex(s.iris, '#05060a', 0.65)]]);
  ctx.beginPath(); ctx.arc(ix, iy, ir, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(ix, iy, 2.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(ix - 1.9, iy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(ix + 2.1, iy + 1.9, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, eyeY - 9, 0, eyeY + 1, [[0, 'rgba(12,6,16,0.55)'], [1, 'rgba(12,6,16,0)']]); ctx.fillRect(cx - 14, eyeY - 10, 28, 12);   // lid shadow
  ctx.restore();
  ctx.save(); ctx.lineCap = 'round';
  // lower lid and the crease above
  ctx.strokeStyle = rgba(sk.deep, 0.45); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(inner + 1, eyeY + 2.2); ctx.quadraticCurveTo(cx, eyeY + 7.5, outer - 1, eyeY + 1.2); ctx.stroke();
  ctx.strokeStyle = rgba(sk.deep, 0.35); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(inner + 2, eyeY - 6); ctx.quadraticCurveTo(cx, eyeY - 16, outer - 1, eyeY - 6.5); ctx.stroke();
  // upper lash line, winged at the outer corner, a few lashes
  ctx.strokeStyle = '#0a0b12'; ctx.lineWidth = s.lashes ? 2.7 : 1.8; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); ctx.stroke();
  if (s.lashes) {
    ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(P2[0], P2[1]); ctx.quadraticCurveTo(P2[0] + sx * 3, P2[1] - 2.2, P2[0] + sx * 5, P2[1] - 5.6); ctx.stroke();
    ctx.lineWidth = 1.1;
    for (const t of [0.3, 0.52, 0.74]) { const [x, y] = qbPt(P0, P1, P2, t); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 1.4, y - 2.6); ctx.stroke(); }
  }
  ctx.restore();
}
/** A closed lid: the arc of the lash line and its flick. */
function winkEye(ctx, s, inner, outer, cx, eyeY, sx) {
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#0a0b12'; ctx.lineWidth = 2.8;
  ctx.beginPath(); ctx.moveTo(inner, eyeY + 0.8); ctx.quadraticCurveTo(cx, eyeY + 7, outer, eyeY - 0.5); ctx.stroke();
  ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(outer, eyeY - 0.5); ctx.quadraticCurveTo(outer + sx * 3, eyeY - 2.2, outer + sx * 5, eyeY - 5.6); ctx.stroke();
  ctx.restore();
}
/** The cybernetic eye: a dark lens with a red ring. */
function cyberEye(ctx, cx, eyeY) {
  ctx.fillStyle = '#12141c'; ctx.beginPath(); ctx.ellipse(cx, eyeY, 10.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  glowLine(ctx, '#ff2d4b', 2, 10, () => { ctx.arc(cx, eyeY, 4.2, 0, Math.PI * 2); });
  ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(cx, eyeY, 1.8, 0, Math.PI * 2); ctx.fill();
}
/** A tapered brow. Stern drops the inner end, the smirk and the wink raise one. */
function drawBrow(ctx, s, cx, sx, eyeY, c) {
  const inner = cx - sx * 11, outer = cx + sx * 13;
  const raise = (s.expr === 'smirk' && sx > 0) || (s.expr === 'wink' && sx < 0) ? 3.2 : 0;
  const drop = s.mood === 'stern' ? 2.6 : 0;
  const arch = s.masc ? 2.6 : 6, thick = s.masc ? 4.4 : 2.9;
  const yi = eyeY - 10.5 + drop, yo = eyeY - 13.5 - raise, top = eyeY - 19 - arch - raise * 0.6 + s.brow * 3;
  ctx.save(); ctx.fillStyle = rgba(c, 0.9);
  ctx.beginPath(); ctx.moveTo(inner, yi); ctx.quadraticCurveTo(cx + sx, top, outer, yo); ctx.quadraticCurveTo(cx + sx * 0.5, top + thick, inner, yi + thick * 0.8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawFace(ctx, s) {
  const eyeY = 124, sk = s.skin, hidden = s.visor !== 'none';
  const browC = s.hair.base === sk.base ? s.hair.dark : s.hair.base;
  // eyeshadow (not for the masc faces), nose, eyes, brows, mouth, freckles, mole, beard, scar
  if (!hidden && !s.masc) for (const sx of [-1, 1]) { const cx = 128 + sx * 26; ctx.fillStyle = rad(ctx, cx, eyeY - 6, 2, cx, eyeY - 6, 24, [[0, rgba(s.shadow, 0.5)], [1, rgba(s.shadow, 0)]]); ctx.fillRect(cx - 26, eyeY - 30, 52, 30); }
  glowLine(ctx, rgba(sk.deep, 0.3), 2.6, 0, () => { ctx.moveTo(131, 128); ctx.quadraticCurveTo(136, 146, 130, 152); });   // nose shade
  glowLine(ctx, rgba(sk.light, 0.5), 1.8, 0, () => { ctx.moveTo(123, 128); ctx.lineTo(122, 146); });                  // bridge light
  ctx.fillStyle = rgba(sk.deep, 0.34); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(128 + sx * 6.5, 153, 3.2, 1.7, sx * 0.25, 0, Math.PI * 2); ctx.fill(); }   // nostrils
  for (const sx of [-1, 1]) {
    const cx = 128 + sx * 26, inner = cx - sx * 10.5, outer = cx + sx * 11.5;
    if (!hidden) {
      if (s.expr === 'wink' && sx < 0) winkEye(ctx, s, inner, outer, cx, eyeY, sx);
      else if (s.cyber && sx > 0) cyberEye(ctx, cx, eyeY);
      else openEye(ctx, s, inner, outer, cx, eyeY, sx);
    }
    drawBrow(ctx, s, cx, sx, eyeY, browC);
  }
  drawMouth(ctx, s);
  for (const [x, y, r] of s.freckles) { ctx.fillStyle = rgba(sk.deep, 0.5); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  if (s.mole) { ctx.fillStyle = 'rgba(40,20,20,0.7)'; ctx.beginPath(); ctx.arc(148, 162, 1.3, 0, Math.PI * 2); ctx.fill(); }
  // beard
  if (s.beard) {
    const lip = s.lip;
    ctx.save(); headPath(ctx, s); ctx.clip();
    ctx.beginPath(); ctx.moveTo(70, 140); ctx.bezierCurveTo(96, 156, 104, 156, 114, 158); ctx.quadraticCurveTo(128, 154, 142, 158); ctx.bezierCurveTo(152, 156, 160, 156, 186, 140); ctx.lineTo(190, 200); ctx.lineTo(66, 200); ctx.closePath();
    ctx.globalAlpha = s.beard === 'full' ? 0.92 : 0.38; ctx.fillStyle = lin(ctx, 0, 140, 0, 196, [[0, s.hair.base], [1, s.hair.dark]]); ctx.fill(); ctx.globalAlpha = 1;
    if (s.beard === 'full') { ctx.strokeStyle = lip; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(116, 168); ctx.quadraticCurveTo(128, 170, 142, 167); ctx.stroke(); }
    ctx.restore();
  }
  // scar
  if (s.scar) {
    const sc = s.scar, x0 = 128 + sc.side * 22, y0 = 96, x1 = x0 + sc.side * (14 + sc.tilt * 10), y1 = 152;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(200,58,85,0.9)'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,222,0.8)'; ctx.lineWidth = 1.4;
    for (let i = 1; i <= 5; i++) { const t = i / 6, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; ctx.beginPath(); ctx.moveTo(px - 4, py - 1.5); ctx.lineTo(px + 4, py + 1.5); ctx.stroke(); }
    ctx.restore();
  }
}

/** The mouth for the expression: corners lifted or dropped, the grin open with teeth, the wink a warm smile. */
function drawMouth(ctx, s) {
  const my = 166, lip = s.lip, open = s.expr === 'grin' ? 1 : 0;
  const c = { stern: [1, 1], smirk: [0, -6], grin: [-3, -4], wink: [-2, -5], calm: [-2, -2] }[s.expr] || [0, 0];
  const L = [112, my + c[0]], R = [145, my + c[1]];
  const upper = () => { ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(120, my - 6, 128, my - 3); ctx.quadraticCurveTo(136, my - 6, R[0], R[1]); };
  ctx.save();
  if (open) {                                                          // cavity with teeth just under the upper lip
    ctx.save(); ctx.beginPath(); upper(); ctx.quadraticCurveTo(128, my + 10 + open * 6, L[0], L[1]); ctx.closePath(); ctx.fillStyle = '#2a0812'; ctx.fill();
    ctx.clip(); ctx.fillStyle = '#f2eee9'; ctx.fillRect(108, my + 0.5, 42, 4); ctx.restore();
  }
  // upper lip (a little darker), then the fuller lower lip
  ctx.beginPath(); upper(); ctx.quadraticCurveTo(128, my + 1, L[0], L[1]); ctx.closePath(); ctx.fillStyle = mixHex(lip, '#1a0410', 0.25); ctx.fill();
  ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(128, my + 9 + open * 6, R[0], R[1]); ctx.quadraticCurveTo(128, my + 1 + open * 6, L[0], L[1]); ctx.closePath();
  ctx.fillStyle = s.masc ? mixHex(lip, '#000000', 0.1) : mixHex(lip, '#ffffff', 0.06); ctx.fill();
  // the seam between the lips, a gloss highlight, soft corners
  ctx.strokeStyle = 'rgba(30,6,16,0.55)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L[0] + 1, L[1]); ctx.quadraticCurveTo(128, my + 1 + open * 3, R[0] - 1, R[1]); ctx.stroke();
  if (!s.masc) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(126, my + 5 + open * 2, 4.2, 1.2, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = rgba(s.skin.deep, 0.35);
  ctx.beginPath(); ctx.arc(L[0] - 1, L[1] + 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(R[0] + 1, R[1] + 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCyberJaw(ctx, s) {
  if (!s.cyber) return;
  ctx.save(); headPath(ctx, s); ctx.clip();
  ctx.beginPath(); ctx.moveTo(126, 150); ctx.bezierCurveTo(146, 138, 172, 138, 186, 124); ctx.lineTo(190, 200); ctx.lineTo(126, 200); ctx.closePath();
  ctx.fillStyle = lin(ctx, 130, 140, 188, 190, [[0, '#e8edf8'], [0.35, '#9aa4ba'], [1, '#3a4258']]); ctx.fill();
  ctx.strokeStyle = 'rgba(12,14,22,0.7)'; ctx.lineWidth = 1.6;
  for (const [a, b, c, d] of [[140, 156, 188, 150], [136, 170, 188, 166], [150, 150, 144, 200]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  ctx.restore();
  glowLine(ctx, s.accent, 2.2, 10, () => { ctx.moveTo(132, 184); ctx.quadraticCurveTo(152, 184, 178, 160); });
  ctx.fillStyle = '#ff2d4b'; ctx.shadowColor = '#ff2d4b'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(168, 152, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
}

function drawHairFront(ctx, s) {
  const h = s.hair, shade = lin(ctx, 80, 28, 180, 110, [[0, h.light], [0.5, h.base], [1, h.dark]]);
  if (s.style === 'swept' || s.style === 'ponytail' || s.style === 'braid') {
    ctx.beginPath(); ctx.moveTo(74, 112); ctx.bezierCurveTo(66, 60, 92, 28, 134, 28); ctx.bezierCurveTo(176, 30, 192, 62, 182, 114); ctx.bezierCurveTo(176, 96, 170, 84, 156, 78); ctx.bezierCurveTo(130, 70, 100, 80, 90, 106); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
    glowLine(ctx, rgba(h.light, 0.7), 2, 0, () => { ctx.moveTo(98, 58); ctx.bezierCurveTo(116, 38, 150, 36, 170, 56); });
    if (s.style === 'ponytail') { ctx.fillStyle = s.accent; ctx.beginPath(); ctx.ellipse(172, 84, 5, 9, 0.5, 0, Math.PI * 2); ctx.fill(); }   // the tie
    if (s.style === 'braid') {                                                                                                                  // braid over the shoulder
      [[88, 116], [76, 140], [70, 164], [72, 188], [78, 210], [80, 228]].forEach(([x, y], i) => {
        const rr = 7.5 - i * 0.35;
        ctx.fillStyle = rad(ctx, x - rr * 0.4, y - rr * 0.4, 0.5, x, y, rr, [[0, h.light], [0.6, h.base], [1, h.dark]]); ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = s.accent; ctx.beginPath(); ctx.arc(80, 232, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (s.style === 'bob') {
    ctx.beginPath(); ctx.moveTo(66, 124); ctx.bezierCurveTo(60, 64, 92, 30, 130, 30); ctx.bezierCurveTo(170, 30, 196, 62, 190, 124); ctx.bezierCurveTo(186, 104, 178, 94, 162, 90); ctx.bezierCurveTo(140, 86, 112, 90, 96, 100); ctx.bezierCurveTo(84, 108, 74, 116, 66, 124); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
    glowLine(ctx, rgba(h.light, 0.6), 1.8, 0, () => { ctx.moveTo(104, 52); ctx.bezierCurveTo(120, 40, 146, 40, 160, 50); ctx.moveTo(84, 92); ctx.bezierCurveTo(96, 74, 110, 66, 126, 62); });
  } else if (s.style === 'curly') {
    const r = mulberry32(s.seed * 61 + 5);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + (i / 8) * 0.9), x = 128 + Math.cos(a) * 46, y = 74 + Math.sin(a) * 40, rr = 11 + r() * 4; ctx.fillStyle = rad(ctx, x - rr * 0.3, y - rr * 0.3, 1, x, y, rr, [[0, h.light], [0.6, h.base], [1, h.dark]]); ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); }
    for (const [x, y, rr] of [[104, 88, 10], [128, 84, 11], [152, 88, 10]]) { ctx.fillStyle = rad(ctx, x - 3, y - 3, 1, x, y, rr, [[0, h.light], [0.6, h.base], [1, h.dark]]); ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); }
  } else if (s.style === 'mohawk') {
    ctx.save(); headPath(ctx, s); ctx.clip(); ctx.fillStyle = rgba(h.base, 0.38); ctx.fillRect(60, 40, 140, 54); ctx.restore();   // shaved sides
    const spikes = [[112, 62, 104, 30], [120, 58, 116, 14], [128, 56, 130, 4], [136, 58, 144, 14], [144, 62, 154, 30]];
    for (const [bx, by, tx, ty] of spikes) {
      ctx.beginPath(); ctx.moveTo(bx - 7, by + 6); ctx.lineTo(tx, ty); ctx.lineTo(bx + 7, by + 6); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, ty, 0, by + 6, [[0, h.light], [1, h.base]]); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(112, 66); ctx.quadraticCurveTo(128, 54, 144, 66); ctx.lineTo(140, 92); ctx.quadraticCurveTo(128, 84, 116, 92); ctx.closePath(); ctx.fillStyle = h.base; ctx.fill();
  } else if (s.style === 'buzz') {
    ctx.save(); headPath(ctx, s); ctx.clip();
    ctx.beginPath(); ctx.moveTo(60, 30); ctx.lineTo(200, 30); ctx.lineTo(200, 104); ctx.bezierCurveTo(176, 88, 152, 82, 128, 82); ctx.bezierCurveTo(104, 82, 80, 88, 60, 104); ctx.closePath();
    ctx.fillStyle = lin(ctx, 90, 40, 170, 100, [[0, mixHex(h.base, s.skin.base, 0.15)], [1, mixHex(h.dark, s.skin.shade, 0.3)]]); ctx.fill();
    ctx.restore();
  } else if (s.style === 'long') {
    ctx.beginPath(); ctx.moveTo(72, 128); ctx.bezierCurveTo(60, 64, 92, 32, 130, 34); ctx.bezierCurveTo(172, 34, 196, 64, 184, 128); ctx.bezierCurveTo(182, 108, 176, 90, 160, 84); ctx.bezierCurveTo(144, 94, 118, 80, 98, 90); ctx.bezierCurveTo(86, 98, 78, 112, 72, 128); ctx.closePath();
    ctx.fillStyle = lin(ctx, 70, 30, 190, 130, [[0, h.light], [0.5, h.base], [1, h.dark]]); ctx.fill();
    glowLine(ctx, rgba(h.light, 0.5), 1.6, 0, () => { ctx.moveTo(96, 62); ctx.bezierCurveTo(112, 48, 140, 46, 162, 60); });
    for (const sx of [-1, 1]) {            // locks over the shoulders
      ctx.beginPath(); ctx.moveTo(128 + sx * 52, 110); ctx.bezierCurveTo(128 + sx * 62, 150, 128 + sx * 66, 190, 128 + sx * 62, 232); ctx.lineTo(128 + sx * 48, 232); ctx.bezierCurveTo(128 + sx * 50, 190, 128 + sx * 46, 150, 128 + sx * 44, 112); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, 110, 0, 232, [[0, h.base], [1, h.dark]]); ctx.fill();
    }
  } else {                                 // helmet
    const m = s.helmet;
    ctx.beginPath(); ctx.moveTo(68, 128); ctx.bezierCurveTo(60, 56, 94, 24, 130, 24); ctx.bezierCurveTo(170, 24, 198, 58, 188, 128); ctx.lineTo(182, 138); ctx.bezierCurveTo(150, 128, 106, 128, 74, 138); ctx.closePath();
    ctx.fillStyle = lin(ctx, 78, 24, 186, 130, [[0, m.light], [0.4, m.base], [1, m.dark]]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = lin(ctx, 190, 0, 150, 0, [[0, rgba(s.accent, 0.6)], [1, rgba(s.accent, 0)]]); ctx.fillRect(140, 20, 60, 120); ctx.restore();
    ctx.fillStyle = rgba('#ffffff', 0.4); ctx.beginPath(); ctx.ellipse(104, 52, 20, 7, -0.6, 0, Math.PI * 2); ctx.fill();   // glossy highlight
    ctx.fillStyle = s.accent; ctx.beginPath(); ctx.moveTo(124, 24); ctx.lineTo(134, 24); ctx.lineTo(138, 100); ctx.lineTo(120, 100); ctx.closePath(); ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;   // centre stripe
    glowLine(ctx, '#0a0b12', 4, 0, () => { ctx.moveTo(76, 134); ctx.quadraticCurveTo(80, 172, 100, 186); });    // chin strap
  }
}

/** Earrings hang from the lobes: neon hoops or a pale stud. */
function drawEarrings(ctx, s) {
  if (!s.earring) return;
  for (const sx of [-1, 1]) {
    const ex = 128 + sx * 53;
    if (s.earring === 'hoop') { ctx.save(); ctx.shadowColor = s.accent; ctx.shadowBlur = 8; ctx.strokeStyle = s.accent; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(ex, 152, 4.2, 6.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    else { ctx.save(); ctx.fillStyle = '#e8f6ff'; ctx.shadowColor = s.accent; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(ex, 143, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }
}

/** A headset: band over the crown, ear cups and a boom mic to the mouth. */
function drawHeadset(ctx, s) {
  if (!s.headset) return;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = '#15161e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(73, 128); ctx.bezierCurveTo(70, 56, 100, 36, 128, 36); ctx.bezierCurveTo(156, 36, 186, 56, 183, 128); ctx.stroke();
  for (const x of [72, 184]) {
    ctx.fillStyle = '#15161e'; ctx.beginPath(); ctx.ellipse(x, 134, 8.5, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = s.accent; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, 134, 5.5, 8.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = '#15161e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(72, 142); ctx.quadraticCurveTo(82, 182, 112, 176); ctx.stroke();
  ctx.fillStyle = '#15161e'; ctx.beginPath(); ctx.arc(114, 176, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawVisor(ctx, s) {
  const a = s.accent;
  if (s.visor === 'visor') {
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
    ctx.save(); ctx.shadowColor = a; ctx.shadowBlur = 16; rr(72, 104, 112, 32, 14); ctx.fillStyle = '#06080f'; ctx.fill(); ctx.restore();
    rr(72, 104, 112, 32, 14); ctx.fillStyle = lin(ctx, 72, 0, 184, 0, [[0, rgba(a, 0.15)], [0.5, rgba(a, 0.55)], [1, rgba(a, 0.9)]]); ctx.fill();
    ctx.save(); rr(72, 104, 112, 32, 14); ctx.clip(); ctx.fillStyle = lin(ctx, 0, 104, 0, 136, [[0, 'rgba(255,255,255,0.28)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(70, 100, 116, 40); ctx.restore();
    glowLine(ctx, '#ffffff', 2, 10, () => { ctx.moveTo(86, 120); ctx.lineTo(170, 120); });
    glowLine(ctx, rgba('#ffffff', 0.55), 1.6, 0, () => { ctx.moveTo(84, 110); ctx.lineTo(112, 108); });
  } else if (s.visor === 'goggles') {
    glowLine(ctx, '#15161e', 11, 0, () => { ctx.moveTo(68, 116); ctx.lineTo(188, 116); });                         // strap
    glowLine(ctx, rgba('#ffffff', 0.12), 1.4, 0, () => { ctx.moveTo(68, 112); ctx.lineTo(188, 112); });
    for (const sx of [-1, 1]) {
      const cx = 128 + sx * 28, cy = 120;
      ctx.save(); ctx.shadowColor = a; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fillStyle = '#07090f'; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fillStyle = rad(ctx, cx - 4, cy - 5, 1, cx, cy, 16, [[0, '#ffffff'], [0.25, a], [1, rgba(mixHex(a, '#05060c', 0.6), 1)]]); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 17.5, 0, Math.PI * 2); ctx.lineWidth = 4.5; ctx.strokeStyle = lin(ctx, cx - 18, cy - 18, cx + 18, cy + 18, [[0, '#d6dcea'], [0.5, '#5b6379'], [1, '#262b3a']]); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(cx - 6, cy - 7, 4.5, 2, -0.7, 0, Math.PI * 2); ctx.fill();
    }
    glowLine(ctx, '#5b6379', 4, 0, () => { ctx.moveTo(123, 120); ctx.lineTo(133, 120); });
  }
}

function drawOverlay(ctx, s) {
  ctx.fillStyle = rad(ctx, 128, 120, 90, 128, 128, 190, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(3,4,10,0.62)']]); ctx.fillRect(0, 0, 256, 256);
  // HUD corner brackets
  ctx.save(); ctx.strokeStyle = rgba(s.accent, 0.7); ctx.lineWidth = 2; ctx.shadowColor = s.accent; ctx.shadowBlur = 6; ctx.lineCap = 'square';
  const b = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x + dx * 16, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * 16); ctx.stroke(); };
  b(10, 10, 1, 1); b(246, 10, -1, 1); b(10, 246, 1, -1); b(246, 246, -1, -1);
  ctx.restore();
}

/** Paints a portraitSpec into the 256x256 logical space of ctx (caller sets the transform). */
export function paintPortrait(ctx, spec) {
  drawBackdrop(ctx, spec);
  drawHairBack(ctx, spec);
  drawJacket(ctx, spec);
  drawNeck(ctx, spec);
  drawHead(ctx, spec);
  drawFace(ctx, spec);
  drawCyberJaw(ctx, spec);
  drawHairFront(ctx, spec);
  drawEarrings(ctx, spec);
  drawHeadset(ctx, spec);
  drawVisor(ctx, spec);
  drawOverlay(ctx, spec);
}

/** drawPortrait(canvasOrCtx, driver): paints the portrait scaled to the canvas size (smooth, any size). */
export function drawPortrait(target, driver) {
  const ctx = target && target.getContext ? target.getContext('2d') : target;
  if (!ctx) return;
  const cv = ctx.canvas;
  const W = (cv && cv.width) || PORTRAIT_SIZE, H = (cv && cv.height) || PORTRAIT_SIZE;
  ctx.save();
  if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
  if ('imageSmoothingEnabled' in ctx) { ctx.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'; }
  ctx.scale(W / PORTRAIT_SIZE, H / PORTRAIT_SIZE);
  ctx.beginPath(); ctx.rect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE); ctx.clip();
  try { paintPortrait(ctx, portraitSpec(driver)); } finally { ctx.restore(); }
}
