// Ruta del bot · 9 · El nido de la Garza (con todos los trucos): la pelea la juega HERON fotograma a fotograma.
'use strict';
const { R, HERON } = require('./comun');
module.exports = { id: 'nido', steps: [
  R(8, 9), R(18, 11), R(27, 8), R(39, 11), HERON, R(57, 12, { tol: 3 }), { wait: 60 }] };
