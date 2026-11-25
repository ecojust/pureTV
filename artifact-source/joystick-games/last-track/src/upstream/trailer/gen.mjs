// Generates index.html from game data + assets/music/trailer.json. Run: node gen.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { PALETTE } from '../src/data/palette.js';
import { CARS } from '../src/data/cars.js';
import { DRIVERS } from '../src/data/drivers.js';
import { TRACKS } from '../src/data/tracks/index.js';
const J = JSON.parse(readFileSync('assets/music/trailer.json', 'utf8'));
const P = Object.fromEntries(Object.entries({ black: 0, navy: 1, plum: 2, green: 3, rust: 4, dgrey: 5, lgrey: 6, white: 7, red: 8, orange: 9, yellow: 10, lime: 11, sky: 12, lav: 13, pink: 14, sand: 15 }).map(([k, v]) => [k, PALETTE[v]]));
const BEAT = 0.6, BAR = 2.4;
const f = (n) => +n.toFixed(3);
let html = '', vhtml = '', js = '';
const T = (s) => js += s + '\n';
// scene helper: returns section open/close with absolute times
const scene = (id, a, b, inner, cls = '') => { inner = inner.replace(/<video[\s\S]*?<\/video>/g, (m) => { vhtml += m.replace('class="vid', 'class="clip vid') + '\n'; return ''; }); html += `<section id="${id}" class="clip scene ${cls}" data-start="${f(a)}" data-duration="${f(b - a)}" data-track-index="1">${inner}</section>\n`; };

// ---------- S1 0–9.6 : the premise ----------
scene('s1', 0, 9.6, `
 <video id="v-c0" class="vid dim" src="assets/clips/c0.mp4" muted playsinline data-start="2.4" data-duration="4" data-track-index="2"></video>
 <div class="card" id="c1a"><span class="kicker">TRANSMISSION · 20XX</span><h1>IN THE FUTURE…</h1></div>
 <div class="card" id="c1b"><h1>RACES ARE HELD<br>ACROSS <em class="y">AMERICA</em>.</h1></div>
 <div class="card" id="c1c"><h1>DRIVERS RACE FOR <em class="g">MONEY</em></h1><div class="cash mono" id="cash1">$0</div></div>
 <div class="card" id="c1d"><h1>…AND THEIR <em class="r">LIVES</em>.</h1></div>`);
// ---------- S2 9.6–24 : the rookie ----------
scene('s2a', 9.6, 12.0, `
 <video id="v-c2" class="vid" src="assets/clips/c2.mp4" muted playsinline data-start="9.6" data-duration="2.4" data-track-index="2"></video>
 <div class="shade"></div>
 <div class="card left" id="c2a"><h1 class="huge">YOU ARE<br><em class="y">THE ROOKIE.</em></h1><div class="bar r"></div></div>`);
const carSpecs = CARS.map((c) => ({ ...c, kph: Math.round(c.base.maxSpeed * 3.6) }));
carSpecs.forEach((c, i) => {
  const a = 12 + i * BAR;
  const col = [P.red, P.orange, P.green][i];
  scene(`s2c${i}`, a, a + BAR, `
   <div class="stripes" style="--c:${col}"></div>
   <div class="tag mono" id="ct${i}">0${i + 1} / 03 — CHOOSE YOUR RIDE</div>
   <img class="carimg" id="ci${i}" src="assets/cars/${c.id}.png" alt="${c.name}">
   <div class="carname" id="cn${i}"><h2>${c.name.toUpperCase()}</h2><p class="mono">${c.blurb}</p>
    <div class="stats mono"><span>TOP SPEED <b>${c.kph} KPH</b></span><span>ARMOR <b>${c.base.armor}</b></span><span>WEAPON SLOTS <b>${c.base.slots}</b></span></div></div>`);
});
const drv = DRIVERS;
scene('s2d', 19.2, 24, `
 <div class="tag mono" id="rt">THE FIELD — ${drv.length} DRIVERS. NO MERCY.</div>
 <div class="grid" id="rgrid">${drv.map((d, i) => `<figure class="rv" id="rv${i}"><img src="assets/portraits/${d.id}.png" alt="${d.name}"><figcaption><b>${d.name.toUpperCase()}</b><span class="mono">“${d.nickname}”</span></figcaption></figure>`).join('')}</div>`);
// ---------- S3 24–38.4 : the arsenal ----------
const W = [
  ['MACHINE GUNS', 'Rapid-fire. Never enough.', P.yellow, 'mg'],
  ['ROCKETS', 'Fire and forget. Or don’t.', P.orange, 'rk'],
  ['CALTROPS', 'Pop their tyres. Leave them behind.', P.sky, 'ct'],
  ['TERMINATORS', 'Homing. Heavy. Final.', P.red, 'tm'],
  ['MINES', 'Drop the surprise.', P.pink, 'mn'],
];
const icon = (k, col) => ({
  mg: `<svg viewBox="0 0 200 120"><g fill="${col}">${[0, 1, 2, 3, 4].map((i) => `<rect x="${10 + i * 34}" y="${52 - (i % 2) * 14}" width="26" height="10"/>`).join('')}<rect x="150" y="30" width="40" height="60" opacity=".35"/></g></svg>`,
  rk: `<svg viewBox="0 0 200 120"><g fill="${col}"><polygon points="20,60 60,40 160,40 190,60 160,80 60,80"/><polygon points="10,60 40,45 40,75" fill="${P.red}"/></g></svg>`,
  ct: `<svg viewBox="0 0 200 120"><g fill="${col}">${[[40, 80], [100, 50], [150, 85], [75, 30]].map(([x, y]) => `<polygon points="${x},${y - 18} ${x + 8},${y} ${x + 18},${y} ${x + 10},${y + 8} ${x + 14},${y + 20} ${x},${y + 12} ${x - 14},${y + 20} ${x - 10},${y + 8} ${x - 18},${y} ${x - 8},${y}"/>`).join('')}</g></svg>`,
  tm: `<svg viewBox="0 0 200 120"><g fill="none" stroke="${col}" stroke-width="6"><circle cx="100" cy="60" r="44"/><circle cx="100" cy="60" r="20"/><path d="M100 4v30M100 86v30M44 60H14M186 60h-30"/></g><polygon points="60,60 140,60 160,60 140,70 60,70" fill="${P.white}" opacity=".0"/></svg>`,
  mn: `<svg viewBox="0 0 200 120"><g fill="${col}"><ellipse cx="100" cy="76" rx="62" ry="22"/><rect x="92" y="38" width="16" height="30"/></g><circle id="mnl" cx="100" cy="34" r="8" fill="${P.red}"/></svg>`,
}[k]);
const bg = ['c1', 'c3', 'c4'];
[[24, 28, 'c1'], [28, 32, 'c3'], [32, 36, 'c4']].forEach(([a, b, c], i) => {
  scene(`s3v${i}`, a, b, `<video id="v-${c}" class="vid" src="assets/clips/${c}.mp4" muted playsinline data-start="${a}" data-duration="4" data-track-index="2"></video><div class="shade light"></div>`);
});
W.forEach((w, i) => {
  const a = 24 + i * BAR;
  scene(`s3w${i}`, a, a + BAR, `<div class="wcard" id="wc${i}" style="--c:${w[2]}"><div class="wicon">${icon(w[3], w[2])}</div><div class="wtxt"><span class="mono">ARM — ${i + 1} / 5</span><h2>${w[0]}</h2><p class="mono">${w[1]}</p></div></div>`, 'overlay');
});
scene('s3u', 36, 38.4, `
 <div class="tag mono">UPGRADE OR DIE</div><div class="shop">${['ARMOR', 'ENGINE', 'TYRES'].map((n, i) => `<div class="up" id="up${i}"><span class="mono">${n}</span><div class="pips">${[0, 1, 2].map((k) => `<i id="pip${i}${k}"></i>`).join('')}</div></div>`).join('')}</div>
 <div class="cash mono big" id="cash2">$5,000</div>`);
// ---------- S4 38.4–50.4 : the circuit ----------
const stillDur = BEAT;
TRACKS.forEach((t, i) => {
  const a = 38.4 + i * stillDur;
  scene(`s4t${i}`, a, a + stillDur, `<img class="shot" data-layout-allow-overflow id="sh${i}" src="assets/shots/t_${t.id}.jpg" alt="${t.name}"><div class="shade bottom"></div><div class="tlabel"><span class="mono">${String(i + 1).padStart(2, '0')} / 10 · ${t.city.toUpperCase()}</span><h2>${t.name.toUpperCase()}</h2><span class="mono prize">PURSE $${t.prize.toLocaleString('en-US')}</span></div>`);
});
scene('s4a', 44.4, 47.4, `<video id="v-c3b" class="vid" src="assets/clips/c3.mp4" muted playsinline data-start="44.4" data-duration="3" data-track-index="2"></video><div class="shade light"></div><div class="card left" id="c4a"><h1 class="huge">RACE FOR <em class="g">MONEY.</em></h1></div>`);
scene('s4b', 47.4, 50.4, `<video id="v-c4b" class="vid" src="assets/clips/c4.mp4" muted playsinline data-start="47.4" data-duration="3" data-track-index="2"></video><div class="shade light"></div><div class="card left" id="c4b"><h1 class="huge">RACE FOR <em class="r">YOUR LIFE.</em></h1></div>`);
// ---------- S5 50.4–60 : title ----------
scene('s5a', 50.4, 52.8, `<div class="card" id="c5a"><span class="kicker">YOU ARE THE ROOKIE</span><h1>WELCOME TO</h1></div>`);
scene('s5b', 52.8, 60, `<div class="title" id="title"><h1 class="logo" id="logo"><span class="l1">LAST</span><span class="l2">TRACK</span></h1><p class="tag2" id="tag2">RACE FOR MONEY. RACE FOR YOUR LIFE.</p><p class="mono sub" id="sub">VEHICULAR COMBAT RACING · 16 COLOURS · NO MERCY</p></div>`);

// ---------- timeline ----------
T(`const tl = gsap.timeline({ paused: true });`);
T(`const set = (s, v) => tl.set(s, v, 0);`);
// generic entrance helpers
T(`const inOut = (sel, a, b, o = {}) => { tl.fromTo(sel, { opacity: 0, y: o.y ?? 30, scale: o.s ?? 1 }, { opacity: 1, y: 0, scale: 1, duration: o.d ?? 0.35, ease: 'power3.out' }, a); tl.to(sel, { opacity: 0, duration: 0.2, ease: 'power1.in' }, b - 0.2); };`);
T(`const shake = (sel, t, amp = 14) => { for (let k = 0; k < 6; k++) tl.to(sel, { x: (k % 2 ? 1 : -1) * amp * (1 - k / 6), y: (k % 3 - 1) * amp * 0.5 * (1 - k / 6), duration: 0.04 }, t + k * 0.04); tl.to(sel, { x: 0, y: 0, duration: 0.05 }, t + 0.26); };`);
// S1
T(`inOut('#c1a', 0.4, 2.4, { y: 0 }); tl.fromTo('#c1a h1', { scale: 1.12 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0.4);`);
T(`inOut('#c1b', 2.4, 4.8); inOut('#c1c', 4.8, 7.2); inOut('#c1d', 7.2, 9.55, { s: 1.12, d: 0.15 });`);
T(`tl.fromTo('#v-c0', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 2.4); tl.to('#v-c0', { opacity: 0, duration: 0.4 }, 6.0);`);
T(`const cashObj = { v: 0 }; tl.to(cashObj, { v: 250000, duration: 2.2, ease: 'power2.in', onUpdate: () => { document.getElementById('cash1').textContent = '$' + Math.round(cashObj.v).toLocaleString('en-US'); } }, 4.9);`);
T(`tl.to('#c1d em', { x: 6, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }, 8.4); tl.to('#c1d em', { x: 0, duration: 0.03 }, 8.85);`);
// S2
T(`tl.fromTo('#c2a h1', { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'expo.out' }, 9.6); shake('#c2a', 9.6, 18); tl.fromTo('#c2a .bar', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power4.out', transformOrigin: 'left center' }, 9.8);`);
T(`tl.fromTo('#v-c2', { scale: 1.12 }, { scale: 1, duration: 2.4, ease: 'none' }, 9.6);`);
for (let i = 0; i < 3; i++) { const a = 12 + i * BAR; T(`tl.fromTo('#ci${i}', { x: 220, opacity: 0, scale: .92 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power4.out' }, ${a}); tl.to('#ci${i}', { x: -40, scale: 1.04, duration: ${BAR - 0.5}, ease: 'none' }, ${f(a + 0.5)});
 tl.fromTo('#cn${i} h2', { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power4.out' }, ${f(a + 0.05)}); tl.fromTo('#cn${i} p, #cn${i} .stats', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12 }, ${f(a + 0.3)});
 tl.fromTo('#s2c${i} .stripes', { xPercent: -12 }, { xPercent: 0, duration: ${BAR}, ease: 'none' }, ${a}); shake('#cn${i}', ${a}, 6);`); }
T(`tl.from('#rt', { opacity: 0, x: -40, duration: 0.3 }, 19.2); drv.forEach?.(()=>{});`.replace('drv.forEach?.(()=>{});', ''));
drv.forEach((d, i) => { const a = i < 4 ? 19.2 + i * 0.18 : 21.6 + (i - 4) * 0.18; T(`tl.fromTo('#rv${i}', { opacity: 0, y: 60, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, ${f(a)});`); });
T(`shake('#rgrid', 19.2, 8); shake('#rgrid', 21.6, 8);`);
// S3
for (let i = 0; i < 3; i++) T(`tl.fromTo('#v-${bg[i]}', { scale: 1.1 }, { scale: 1, duration: 4, ease: 'none' }, ${24 + i * 4});`);
W.forEach((w, i) => { const a = 24 + i * BAR; T(`tl.fromTo('#wc${i}', { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'expo.out' }, ${a}); tl.fromTo('#wc${i} .wicon', { scale: 1.8, rotation: -8 }, { scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(2)' }, ${a}); tl.to('#wc${i}', { x: 160, opacity: 0, duration: 0.18, ease: 'power2.in' }, ${f(a + BAR - 0.2)}); shake('#wc${i}', ${a}, 10);`); });
T(`tl.to('#mnl', { opacity: 0.2, duration: 0.15, repeat: 7, yoyo: true, ease: 'none' }, 33.65);`);
T(`tl.from('#s3u .tag', { opacity: 0, duration: .3 }, 36); const lvl = [[0,0.6],[1,1.2],[2,1.8]]; lvl.forEach(([i, o]) => { for (let k = 0; k < 3; k++) tl.fromTo('#pip' + i + k, { scale: 0, opacity: 0.2 }, { scale: 1, opacity: 1, duration: 0.18, ease: 'back.out(3)' }, 36.0 + (i * 3 + k) * 0.22 + 0.2); });
 tl.from('.up', { x: -200, opacity: 0, stagger: 0.12, duration: 0.3, ease: 'power3.out' }, 36);
 const cash2 = { v: 5000 }; tl.to(cash2, { v: 0, duration: 1.8, ease: 'none', onUpdate: () => { document.getElementById('cash2').textContent = '$' + Math.round(cash2.v).toLocaleString('en-US'); } }, 36.1);`);
// S4
TRACKS.forEach((t, i) => { const a = 38.4 + i * BEAT; T(`tl.fromTo('#sh${i}', { scale: 1.0 }, { scale: ${i % 2 ? 1.09 : 1.15}, duration: ${BEAT}, ease: 'none' }, ${f(a)}); tl.fromTo('#s4t${i} .tlabel', { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: 'power3.out' }, ${f(a)});`); });
T(`tl.fromTo('#v-c3b', { scale: 1.1 }, { scale: 1, duration: 3, ease: 'none' }, 44.4); tl.fromTo('#v-c4b', { scale: 1.1 }, { scale: 1, duration: 3, ease: 'none' }, 47.4);`);
T(`tl.fromTo('#c4a h1', { opacity: 0, x: -200 }, { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out' }, 44.4); shake('#c4a', 44.4, 14); tl.fromTo('#c4b h1', { opacity: 0, x: 200, scale: 1.2 }, { opacity: 1, x: 0, scale: 1, duration: 0.25, ease: 'expo.out' }, 47.4); shake('#c4b', 47.4, 22);`);
// beat ticks: flash on every hit
J.hits.forEach((h) => { const big = h.kind === 'impact'; T(`tl.fromTo('#flash', { opacity: ${big ? 0.85 : f(h.strength * 0.28)} }, { opacity: 0, duration: ${big ? 0.45 : 0.18}, ease: 'power2.out' }, ${h.t});`); });
// S5
T(`tl.fromTo('#c5a h1', { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'power2.out' }, 50.4); tl.fromTo('#c5a .kicker', { opacity: 0 }, { opacity: 1, duration: .5 }, 50.6);
 tl.to('#c5a', { opacity: 0.1, duration: 0.05, repeat: 5, yoyo: true }, 51.8); tl.set('#c5a', { opacity: 0 }, 52.2);`);
T(`tl.fromTo('#logo', { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'expo.out' }, 52.8); shake('#title', 52.8, 30);
 tl.fromTo('#logo .l1', { x: -30 }, { x: 0, duration: 1.2, ease: 'power3.out' }, 52.8); tl.fromTo('#logo .l2', { x: 30 }, { x: 0, duration: 1.2, ease: 'power3.out' }, 52.8);
 tl.fromTo('#tag2', { opacity: 0, y: 20, scale: 1.08 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power2.out' }, 54.6);
 tl.fromTo('#sub', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 56.2);
 tl.to('#logo', { textShadow: '8px 0 ${P.red}, -8px 0 ${P.sky}', duration: 0.06, repeat: 3, yoyo: true }, 55.2);
 tl.to('#fade', { opacity: 1, duration: 1.8, ease: 'power1.in' }, 58.2);`);
T(`window.__timelines['main'] = tl;`);

const css = `
:root{${Object.entries(P).map(([k, v]) => `--${k}:${v}`).join(';')}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:var(--black)}
body{font-family:'League Gothic',sans-serif;color:var(--white)}
.mono{font-family:'Space Mono',monospace;letter-spacing:.04em}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:var(--black)}
.scene{position:absolute;inset:0;overflow:hidden}
.vid,.shot{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
.vid.dim{filter:brightness(.45) saturate(.8)}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,20,.86),rgba(11,11,20,.25) 70%,rgba(11,11,20,.0))}
.shade.light{background:linear-gradient(90deg,rgba(11,11,20,.7),rgba(11,11,20,.1) 60%)}
.shade.bottom{background:linear-gradient(0deg,rgba(11,11,20,.92),rgba(11,11,20,0) 55%)}
.card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 160px}
.card.left{align-items:flex-start;text-align:left;padding-left:140px}
.card h1{font-size:200px;line-height:.95;font-weight:400;letter-spacing:.04em;text-shadow:0 6px 0 rgba(0,0,0,.6)}
.card h1.huge{font-size:300px;line-height:.9}
.kicker{font-family:'Space Mono',monospace;font-size:34px;letter-spacing:.3em;color:var(--lgrey);margin-bottom:26px}
em{font-style:normal}.y{color:var(--yellow)}.g{color:var(--lime)}.r{color:var(--red)}
.cash{font-size:84px;color:var(--lime);margin-top:30px}.cash.big{position:absolute;right:120px;bottom:90px;font-size:110px;color:var(--yellow)}
.bar{height:18px;width:760px;margin-top:28px;background:var(--red)}
.tag{position:absolute;left:120px;top:90px;font-size:36px;color:var(--lgrey);letter-spacing:.22em}
.stripes{position:absolute;inset:-100px;background:repeating-linear-gradient(115deg,var(--navy) 0 90px,#16204a 90px 180px);opacity:.9}
.stripes::after{content:'';position:absolute;left:0;right:0;bottom:200px;height:30px;background:var(--c)}
.carimg{position:absolute;right:20px;top:120px;width:1260px;height:auto}
.carname{position:absolute;left:120px;bottom:150px;width:820px}
.carname h2{font-size:300px;line-height:.85;font-weight:400;text-shadow:0 8px 0 rgba(0,0,0,.6)}
.carname p{font-size:30px;color:var(--sand);margin:18px 0 22px;max-width:760px}
.stats{display:flex;gap:34px;font-size:28px;color:var(--lgrey)}.stats b{color:var(--yellow);display:block;font-size:34px}
.grid{position:absolute;left:120px;right:120px;top:190px;bottom:60px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);gap:34px 40px}
.rv{position:relative;background:var(--navy);border:6px solid var(--lav);overflow:hidden}
.rv img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated;display:block}
.rv figcaption{position:absolute;left:0;right:0;bottom:0;padding:10px 16px;background:rgba(11,11,20,.88);display:flex;flex-direction:column}
.rv b{font-weight:400;font-size:44px;letter-spacing:.05em;line-height:1}.rv span{font-size:20px;color:var(--orange)}
.overlay{pointer-events:none}
.wcard{position:absolute;left:100px;bottom:110px;display:flex;align-items:center;gap:50px;background:rgba(11,11,20,.88);border-left:22px solid var(--c);padding:34px 60px 34px 40px}
.wicon{width:330px}.wicon svg{width:100%;display:block}
.wtxt span{font-size:30px;color:var(--lgrey)}.wtxt h2{font-size:190px;font-weight:400;line-height:.95;color:var(--c)}
.wtxt p{font-size:32px;color:var(--white);margin-top:6px}
#s3u{background:var(--navy)}
.shop{position:absolute;left:120px;top:230px;display:flex;flex-direction:column;gap:46px}
.up{display:flex;align-items:center;gap:50px}.up>span{font-size:54px;width:330px}
.pips{display:flex;gap:22px}.pips i{display:block;width:150px;height:62px;background:var(--lime);box-shadow:inset 0 -10px 0 rgba(0,0,0,.25)}
.tlabel{position:absolute;left:100px;bottom:80px;display:flex;flex-direction:column;gap:2px}
.tlabel h2{font-size:190px;font-weight:400;line-height:.95;text-shadow:0 6px 0 rgba(0,0,0,.7)}
.tlabel span{font-size:36px;color:var(--yellow)}.tlabel .prize{color:var(--lime)}
.title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.logo{font-weight:400;display:flex;flex-direction:column;align-items:center;line-height:.8;font-size:430px;letter-spacing:.03em;text-shadow:10px 10px 0 var(--plum),0 0 40px rgba(255,0,77,.35)}
.logo .l1{color:var(--white)}.logo .l2{color:var(--red)}
.tag2{font-family:'Space Mono',monospace;font-weight:700;font-size:44px;letter-spacing:.14em;color:var(--yellow);margin-top:40px}
.sub{font-size:30px;color:var(--lgrey);margin-top:20px}
#flash{position:absolute;inset:0;background:var(--white);opacity:0;z-index:50;pointer-events:none}
#crt{position:absolute;inset:0;z-index:60;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.26) 0 2px,transparent 2px 4px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.72) 100%);mix-blend-mode:multiply}
#fade{position:absolute;inset:0;background:#000;opacity:0;z-index:70;pointer-events:none}
`;
const grain = readFileSync('compositions/components/grain-overlay.html', 'utf8').replace(/<!--[\s\S]*?-->/, '');
const out = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920, height=1080"><title>Last Track — Trailer</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>${css}</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="60" data-width="1920" data-height="1080">
${vhtml}${html}
<audio id="score" src="assets/music/trailer.mp3" data-start="0" data-duration="60" data-track-index="9" data-volume="1"></audio>
<div id="flash" data-layout-allow-occlusion></div><div id="crt" data-layout-allow-occlusion></div>
${grain}
<div id="fade"></div>
</div>
<script>
${js}
</script></body></html>`;
writeFileSync('index.html', out);
console.log('index.html', out.length, 'bytes');
