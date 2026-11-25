import { createRenderHost } from '../../src/render/renderHost.js';
import { attachPBR } from '../../src/render/pbr/pbrHost.js';
import { createRaceController } from '../../src/render/raceController.js';
import { createMinimap } from '../../src/render/minimap.js';
import { drawPortrait } from '../../src/render/portraits.js';
import { createCarPreview } from '../../src/render/carPreview.js';
import { buildTrack } from '../../src/core/trackModel.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { DRIVERS } from '../../src/data/drivers.js';

const $ = (id) => document.getElementById(id);
const host = createRenderHost($('c'));
const preview = createCarPreview($('pv'));
preview.show({ carId: 'hammer', color: 8, upgrades: { armor: 1, engine: 1 } });
for (const d of DRIVERS) { const c = document.createElement('canvas'); c.width = c.height = 192; drawPortrait(c, d); $('pt').appendChild(c); }
TRACKS.forEach((t, i) => { const o = document.createElement('option'); o.value = i; o.textContent = t.id; $('tr').appendChild(o); });
let ctrl, track, mm, tick = 0, t = 0;
const specs = [['wasp', 8, 10], ['hammer', 12, 7], ['bulwark', 4, 14], ['hammer', 2, 8], ['wasp', 9, 10]];
function load(i) {
  if (ctrl) ctrl.dispose();
  track = buildTrack(TRACKS[i]);
  ctrl = createRaceController(host, track, { player: { carId: 'wasp' }, rivals: DRIVERS.map((d) => ({ driverId: d.id })) });
  mm = createMinimap($('mm'), track); t = 0;
}
function snapshot(time) {
  const events = [];
  const cars = specs.map((s, i) => {
    const sPos = (time * (45 - i * 2) + (4 - i) * -12 + track.length * 5) % track.length;
    const p = track.pointAt(sPos);
    const drift = (Math.sin(time * 0.7 + i) > 0.8) ? 6 : 0;
    const vx = Math.cos(p.heading) * 40 - Math.sin(p.heading) * drift, vy = Math.sin(p.heading) * 40 + Math.cos(p.heading) * drift;
    if (Math.floor(time * 12) !== Math.floor((time - 1 / 60) * 12) && i === 0) events.push({ type: 'shot', carId: 0, weaponId: 'machinegun' });
    return { id: i, driverId: i ? DRIVERS[(i - 1) % 4].id : null, isPlayer: i === 0, x: p.x, y: p.y, heading: p.heading, vx, vy, speed: 40, steer: Math.sin(time + i) * 0.3, yawRate: 0.2,
      armor: 50, armorMax: 60, wrecked: i === 4 && time > 8, smoke: i === 2, burning: i === 3, tyresPopped: false, color: s[1], helmetColor: s[2], lap: 1, s: sPos };
  });
  if (Math.floor(time * 0.5) !== Math.floor((time - 1 / 60) * 0.5)) { const c = cars[1]; events.push({ type: 'explosion', x: c.x + 15 * Math.cos(c.heading), y: c.y + 15 * Math.sin(c.heading), radius: 7 }); }
  const c0 = cars[0], pr = { id: 1, type: 'rocket', x: c0.x + 12 * Math.cos(c0.heading) + (time * 90 % 60) * Math.cos(c0.heading), y: c0.y + 12 * Math.sin(c0.heading) + (time * 90 % 60) * Math.sin(c0.heading), heading: c0.heading, ownerId: 0 };
  return { t: time, tick: tick++, phase: 'racing', countdown: 0, lapsTotal: 3, cars, projectiles: [pr], hazards: [{ id: 5, type: 'caltrops', ...track.pointAt(120) }], pickups: track.pickups.map((p) => ({ ...p, active: true })), events };
}
$('tr').onchange = () => load(+$('tr').value);
$('cam').onclick = () => ctrl.cycleCamera();
let pbrCtl = null;
$('pbr').onclick = () => { if (!pbrCtl) { pbrCtl = attachPBR(host, { quality: 'med' }); host.pbr = pbrCtl; load(+$('tr').value || 0); } };   // reload the race so lights/shadows are rebuilt with PBR present
if (/pbr=1/.test(location.search)) { pbrCtl = attachPBR(host, { quality: new URLSearchParams(location.search).get('q') || 'med' }); host.pbr = pbrCtl; }
window.__h = { host, get ctrl() { return ctrl; }, get t() { return t; }, set t(v) { t = v; } };
load(0);
let prev = snapshot(0), last = performance.now(), frames = 0, fpsT = last;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  host.resize($('c').clientWidth, $('c').clientHeight);
  t += dt; const cur = snapshot(t);
  ctrl.update(prev, cur, 1, dt); prev = cur;
  host.render(); mm.draw(cur);
  frames++; if (now - fpsT > 1000) { $('info').textContent = `${frames} fps, calls ${host.renderer.info.render.calls}, tris ${host.renderer.info.render.triangles}`; frames = 0; fpsT = now; }
}
requestAnimationFrame(frame);
