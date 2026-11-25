// GLUP — revisa los niveles: filas de 20, caracteres conocidos, carteles, Ruca, maestro (Q) y su encargo,
// secretos, crías, requisitos y parejas diana/compuerta.
//   node tools/check-levels.js           resumen de todos
//   node tools/check-levels.js 3 --mapa  además, el nivel 3 (o su id) dibujado con reglas de columnas y filas
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const NIVELES = fs.readdirSync(path.join(ROOT, 'niveles')).filter(f => f.endsWith('.js')).sort();
// Re-run the level sources with a screen() that reports bad rows before padding hides them.
let src = fs.readFileSync(path.join(ROOT, 'levels.js'), 'utf8');
src = src.replace('function screen(...rows) {', "function screen(...rows) { rows.forEach(r => { if (r.length !== 20) console.log('  FILA DE', r.length, JSON.stringify(r), 'en', __file); });");
const ctx = vm.createContext({ console, __file: '' });
vm.runInContext(src + ';this.LEVELS = LEVELS; this.NIVEL = NIVEL; this.CRIAS_PARA_EL_NIDO = CRIAS_PARA_EL_NIDO;', ctx);
for (const f of NIVELES) { ctx.__file = f; vm.runInContext(fs.readFileSync(path.join(ROOT, 'niveles', f), 'utf8'), ctx, { filename: f }); }
const { LEVELS, NIVEL } = ctx;
const KNOWN = '.#=w~^FxXGTPVORMQ!%crsfmKB*HLE@?N,"\'';
const POWERS = ['soplido', 'aleteo', 'ventosa', 'chorro', 'mordisco', 'panzazo', 'guindilla', 'resbalon'];
const QUIEN = ['ruca', 'lumi', 'lapa', 'olga', 'anselmo', 'canto', 'pinzas', 'alga'];
const ENCARGOS = { entregar: ['cosa'], faroles: [], apagar: [], dianas: [] };
const BOSS_CRIAS = 10;   // garza.js
let problems = 0, allCrias = 0;
const warn = (...a) => { problems++; console.log('  ¡OJO!', ...a); };
NIVEL.ORDEN.forEach((id, i) => {
  const lv = LEVELS[i];
  if (!lv) { warn('falta el nivel', id); return; }
  const rows = lv.rows, flat = rows.join(''), count = ch => flat.split(ch).length - 1;
  const bad = [...new Set(flat)].filter(c => !KNOWN.includes(c));
  const gates = [], seen = new Set();
  rows.forEach(r => [...r].forEach((c, x) => { if (c === 'G' && !seen.has(x)) { seen.add(x); gates.push(x); } }));
  const trig = []; rows.forEach(r => [...r].forEach((c, x) => { if ('TPV'.includes(c)) trig.push(c + x); }));
  const crias = count('*') + (lv.boss ? BOSS_CRIAS : 0); allCrias += crias;
  const m = lv.maestro, before = NIVEL.poderesAntes(i);
  console.log((i + 1) + ' · ' + lv.id + ' · ' + lv.name + ' · ' + rows[0].length / 20 + ' pantallas' + (rows.length !== 14 ? ' (' + rows.length + ' filas)' : '') + ' · tema ' + lv.theme + ' · par ' + (lv.par || '-'));
  console.log('    crías ' + crias + ' · carteles ' + count('?') + '/' + lv.signs.length + ' · Ruca ' + count('N') + '/' + lv.ruca.length + ' · faroles ' + count('L') + ' · barca ' + count('E') + (gates.length ? ' · compuertas ' + gates.join(',') + ' · gatillos ' + trig.join(',') : ''));
  console.log('    trucos al llegar: ' + (before.join(', ') || 'ninguno'));
  if (m) {
    const q = m.encargo;
    console.log('    maestro: ' + m.quien + ' enseña ' + m.poder + ' (Q ×' + count('Q') + ', ' + (m.dialogo || []).length + ' frases' + (q ? ', encargo ' + q.tipo + (q.cosa ? ' ' + q.cosa : '') + (q.n ? ' ×' + q.n : '') : '') + ')');
    if (!QUIEN.includes(m.quien)) warn('maestro desconocido', m.quien);
    if (!POWERS.includes(m.poder)) warn('truco desconocido', m.poder);
    if (before.includes(m.poder)) warn('enseña un truco que ya se tiene al llegar');
    if (count('Q') !== 1) warn('tiene que haber exactamente una Q');
    if (!m.despedida) warn('al maestro le falta la despedida');
    if (q && !ENCARGOS[q.tipo]) warn('encargo de tipo desconocido', q.tipo);
    if (q && (!q.pide || !q.hecho)) warn('al encargo le faltan `pide` o `hecho`');
    if (q && ENCARGOS[q.tipo]) for (const k of ENCARGOS[q.tipo]) if (!q[k]) warn('al encargo le falta', k);
    if (q && q.tipo === 'faroles' && (q.n || 0) > count('L')) warn('pide más faroles de los que hay');
    if (q && q.tipo === 'apagar' && !count('F')) warn('pide apagar un fuego y no hay F');
  } else if (!lv.boss) warn('nivel sin maestro');
  else if (count('Q')) warn('Q sin `maestro`');
  if ((lv.secretos || []).length) console.log('    secretos: ' + lv.secretos.map(s => s.crias + ' con ' + s.poder + (before.includes(s.poder) || (m && m.poder === s.poder) ? ' (¡ya se tiene aquí!)' : '')).join(' · '));
  for (const s of lv.secretos || []) if (!POWERS.includes(s.poder)) warn('secreto con truco desconocido', s.poder);
  if (lv.requiere) console.log('    requiere: ' + JSON.stringify(lv.requiere));
  if (count('!')) warn(count('!') + ' bocados «!» en el suelo: ya no se usan (los da el maestro)');
  if (count('@') !== 1) warn('tiene que haber exactamente una @');
  if (!lv.boss && !count('E')) warn('sin barca de salida');
  if (count('?') !== lv.signs.length) warn('carteles y textos no cuadran');
  if (count('N') !== lv.ruca.length) warn('Ruca y sus frases no cuadran');
  if (bad.length) warn('caracteres raros', bad.join(''));
});
const nido = LEVELS.find(l => l.requiere);
console.log('\nCrías en total: ' + allCrias + (nido ? ' · el nido pide ' + nido.requiere.crias + ' (CRIAS_PARA_EL_NIDO)' : ''));
if (problems) console.log(problems + ' avisos');

// The map of one level, with rulers.
const want = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : null;
if (want !== null && process.argv.includes('--mapa')) {
  const i = /^\d+$/.test(want) ? +want - 1 : LEVELS.findIndex(l => l.id === want), lv = LEVELS[i];
  if (!lv) { console.log('no hay nivel', want); process.exit(1); }
  const w = lv.rows[0].length; let tens = '    ', ones = '    ';
  for (let x = 0; x < w; x++) { tens += x % 10 === 0 ? String(Math.floor(x / 10) % 10) : x % 20 === 0 ? '|' : ' '; ones += x % 10; }
  console.log('\n' + lv.name + '\n' + tens + '\n' + ones);
  lv.rows.forEach((r, y) => console.log(String(y).padStart(3) + ' ' + r));
}
process.exit(problems ? 1 : 0);
