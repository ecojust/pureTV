// GLUP — niveles: la leyenda, las herramientas para montarlos y el registro ordenado.
// Cada nivel vive en su archivo `niveles/NN-nombre.js` y se apunta con NIVEL.registrar({...}).
// Se compone de pantallas de 20×14 tiles que se pegan de izquierda a derecha; las filas que
// faltan arriba se rellenan de aire.
// Leyenda:
//   #  barro sólido        =  tablón o rama (se atraviesa desde abajo)   w  nenúfar (igual, flota)
//   ~  agua (te hundes)    ^  espinas            F  hoguera (se apaga con agua)
//   x  piedra agrietada (una pedrada o un panzazo rompe todo el bloque)   X  piedra reforzada (sólo el escupitajo picante)
//   G  compuerta   T  diana (la abre para siempre)   P  placa (la abre mientras algo pese)   V  molinillo (la abre mientras gira con el soplido)
//   O  anzuelo con su sedal: sorbe hacia él (arriba o de frente), Bigotes pica y el sedal iza a Nila      R  balsa: sopla hacia atrás para impulsarla
//   M  muro de raíces: Nila resbala por él y puede saltar de pared en pared
//   Q  el maestro del nivel (quién es, qué truco da y qué dice van en `maestro`; ver maestros.js)
//   %  seta saltarina      c  caja               r  piedra
//   s  caracol   f  rana   m  mosquito   K  cangrejo   B  la Garza
//   *  cría de pez gato en su burbuja    H  corazón   L  farol (punto de control)   E  barca (salida)   @  Nila
//   ?  cartel (los textos van en `signs`)   N  Ruca, la tortuga (sus frases van en `ruca`)   , "  decoración (mata, seta)
//   !  (ya no se usa: los trucos los dan los maestros; se ignora)
// Medidas (tools/bot.js las comprueba): Nila salta tres celdas de alto y tres de hueco; con el aleteo, cinco de alto
// y seis de hueco; subida a una caja y aleteando, seis. Más arriba sólo llegan los aros, las raíces y las setas.
// Las dianas, placas y molinillos se emparejan con las compuertas por orden de izquierda a derecha.
//
// Campos de un nivel (NIVEL.registrar):
//   id        cadena estable (se usa en las partidas guardadas; no cambiarla nunca)
//   name, theme ('dusk' 'night' 'storm' 'cave' 'nest'), music, rows (de join(screen(...), ...)), intro, par (segundos)
//   ambiente  el paisaje sonoro (Sound.ambiente); si falta, el del theme (ver musica/LEEME.md)
//   ruca: [...] frases de Ruca por orden de aparición de las N;  signs: [...] textos de los carteles ?
//   maestro: { quien, poder, bocado?, dialogo: [...], despedida, encargo? }   (ver maestros.js)
//   secretos: [{ poder, crias }]   crías escondidas que piden un truco que aún no se tiene al pasar (para el mapa)
//   requiere: { crias: N }         no se entra sin N crías rescatadas en total (el nido)
//   boss: true                     la pelea de garza.js
'use strict';
// Crías que tienen que cantar juntas para abrir el muro de zarzas del nido. Un único número para afinar.
const CRIAS_PARA_EL_NIDO = 88;   // first pass reaches ~81 of 109: going back is a must
const LEVELS = [];
const NIVEL = (() => {
  const H = 14;
  function screen(...rows) { while (rows.length < H) rows.unshift('....................'); return rows.map(r => r.padEnd(20, '.').slice(0, 20)); }
  function join(...screens) {
    const rows = []; for (let y = 0; y < H; y++) rows.push(screens.map(s => s[y]).join(''));
    return rows;
  }
  const G3 = ['####################', '####################', '####################'];
  // El orden del río: del embarcadero al nido. Cada archivo de niveles/ se coloca en su sitio por su id.
  const ORDEN = ['embarcadero', 'juncos', 'raices', 'molino', 'muelle', 'turbera', 'cueva', 'rio', 'nido'];
  function registrar(def) {
    const i = ORDEN.indexOf(def.id);
    if (i < 0) throw new Error('GLUP: nivel sin sitio en el orden: ' + def.id);
    def.signs = def.signs || []; def.ruca = def.ruca || []; def.secretos = def.secretos || [];
    LEVELS[i] = def; return def;
  }
  // The tile keys ('x,y') of the crías in a level's layout, in reading order.
  const criaCache = new Map();
  function criasDe(def) {
    if (criaCache.has(def)) return criaCache.get(def);
    const out = []; def.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '*') out.push(x + ',' + y); });
    criaCache.set(def, out); return out;
  }
  // The trick each level's teacher gives, and the ones Bigotes has on arriving at level i (all the teachers before it).
  const poderDe = def => def && def.maestro ? def.maestro.poder : null;
  function poderesAntes(i) { return LEVELS.slice(0, i).map(poderDe).filter(Boolean); }
  const index = id => LEVELS.findIndex(d => d && d.id === id);
  return { H, screen, join, G3, ORDEN, registrar, criasDe, poderDe, poderesAntes, index };
})();
