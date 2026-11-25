// GLUP — las rutas del bot, una por nivel (tools/rutas/NN.js, cada una con el `id` de su nivel).
// Este índice las junta por id: { embarcadero: { steps }, juncos: { steps }, … }.
// Una ruta puede fijar `powers` para empezar con otros trucos; si no, empieza con los de los
// maestros de los niveles anteriores (NIVEL.poderesAntes).
'use strict';
const fs = require('fs'), path = require('path');
const ROUTES = {};
for (const f of fs.readdirSync(__dirname).filter(f => /^\d+\.js$/.test(f)).sort()) {
  const r = require(path.join(__dirname, f));
  if (!r.id) throw new Error('la ruta ' + f + ' no dice de qué nivel es (id)');
  ROUTES[r.id] = r;
}
module.exports = ROUTES;
