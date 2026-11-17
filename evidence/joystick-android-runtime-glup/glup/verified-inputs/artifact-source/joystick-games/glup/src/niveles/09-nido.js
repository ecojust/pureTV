// GLUP — nivel 9.
'use strict';
(() => {
  const { screen, join, G3 } = NIVEL;
  // ---------------------------------------------------------------- 9 · El nido de la Garza
  // La orilla, un paso por debajo del tronco (la compuerta de la izquierda del ruedo cae al entrar) y el ruedo:
  // dos ramas, el nido arriba (se rompe en la fase II y cae como un montón de palos) y zarzas al fondo.
  // La pelea la monta garza.js sobre las 24 últimas columnas.
  const nido = join(
    screen(
      '....................',
      '........*...........',
      '.......===..........',
      '..@..N.......L....H.', ...G3),
    screen(
      '..............##....',
      '..............##....',
      '..............##....',
      '..............##....',
      '....................',
      '....................',
      '....................',
      '.......*............',
      '......===..........=',
      '....................',
      '..................,.', ...G3),
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '.....======.........',
      '....................',
      '....................',
      '....................',
      '===..........====...',
      '....................',
      '.......B.r........^^', ...G3));
  NIVEL.registrar({ id: 'nido', name: 'El nido de la Garza', theme: 'nest', music: 'omen', par: 150, rows: nido, boss: true,
    requiere: { crias: CRIAS_PARA_EL_NIDO },
    intro: 'En lo alto del ciprés muerto, la Garza espera.',
    ruca: ['Las crías han cantado y el muro se ha abierto. La Garza tiene a las últimas en el buche. Devuélvele sus piedras hacia arriba. Si clava el pico en el barro, ¡dale fuerte! Y si bate las alas, sóplale tú con {puff}.'],
    signs: [] });
})();
