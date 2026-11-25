// GLUP — nivel 1.
'use strict';
(() => {
  const { screen, join, G3 } = NIVEL;
  // ---------------------------------------------------------------- 1 · El embarcadero
  // El tutorial: saltar, sorber y escupir contra la roca rajada, la madriguera agachada, la caja para
  // subir, la diana, la placa con la caja encima y, a mitad, Ruca da el soplido (vilano) para los dos
  // molinillos: el de su compuerta y el de la carrera sobre los nenúfares.
  // Secretos (para volver): la tabla alta de la salida (aleteo), la chimenea de raíces que cuelga sobre
  // la madriguera (ventosa), el anzuelo sobre los nenúfares (mordisco) y la cueva tapiada (guindilla).
  // Faroles (guardado): antes de los primeros nenúfares, junto a Ruca y justo al salir de la carrera; el que
  // había al lado de la barca no guardaba nada y ahora está tras la compuerta de la carrera.
  const embarcadero = join(
    // 0 · el embarcadero: Ruca, un escalón para saltar y, arriba, una cría en una tabla a la que aún no se llega.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....*...............',
      '...===..............',
      '....................',
      '................*...',
      '...............###..',
      '.@....N..,.....###,.',
      '========############',
      '~~~~~~~~############',
      '~~~~~~~~############'),
    // 1 · sorber y escupir: la piedra contra la roca rajada; el caracol también vale.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '..............x.....',
      '..............x.....',
      '..............x.....',
      '..............x.....',
      '..?.r.....s...x..*..', ...G3),
    // 2 · la madriguera (agachada) y, al salir, raíces que cuelgan con una cría en lo alto (ventosa).
    screen(
      '...............#####',
      '...............M...M',
      '...............M.*.M',
      '...............M==.M',
      '...............M...M',
      '...###########.M...M',
      '...###########.M...M',
      '...###########.M...M',
      '...###########......',
      '...###########......',
      '.?......*...........', ...G3),
    // 3 · la caja: súbete a ella para llegar al saliente de cuatro.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '................*...',
      '.............#######',
      '.............#######',
      '.............#######',
      '...c..?......#######', ...G3),
    // 4 · la diana: algo escupido contra ella abre la compuerta para siempre.
    screen(
      '...............###..',
      '...............###..',
      '...............###..',
      '................G...',
      '................G...',
      '................G...',
      '................G...',
      '#####...........G...',
      '#####...........G...',
      '#####...........G...',
      '#####...f.r..?.TG...', ...G3),
    // 5 · farol y nenúfares; un anzuelo cuelga sobre el agua hacia una tabla alta (mordisco).
    screen(
      '....................',
      '....................',
      '..............*.....',
      '............====....',
      '..........O.........',
      '....................',
      '.....m..............',
      '........*...........',
      '....................',
      '....................',
      '.L..................',
      '###~~w~~w~~w~~w~~###',
      '###~~~~~~~~~~~~~~###',
      '####################'),
    // 6 · la placa: la compuerta sólo está abierta mientras algo pese encima. La caja se queda; Nila no.
    screen(
      '..............###...',
      '..............###...',
      '..............###...',
      '...............G....',
      '...............G....',
      '...............G....',
      '...............G....',
      '...............G....',
      '...............G....',
      '...............G....',
      '..c..?...P.....G..*.', ...G3),
    // 7 · Ruca enseña el soplido: el molinillo abre su compuerta mientras gira.
    screen(
      '...............###..',
      '...............###..',
      '...............###..',
      '................G...',
      '................G...',
      '................G...',
      '................G...',
      '................G...',
      '................G...',
      '................G...',
      '.L...Q.....V....G.*.', ...G3),
    // 8 · la carrera: sopla al molinillo y cruza los nenúfares antes de que se pare. Un mosquito estorba.
    //     Tras la compuerta, el farol: la carrera ya no se repite.
    screen(
      '................###.',
      '................###.',
      '................###.',
      '.................G..',
      '.................G..',
      '.................G..',
      '.................G..',
      '..........m......G..',
      '.................G..',
      '.................G..',
      '.?.V.............G.L',
      '####~~w~~w~~w~~w~###',
      '####~~~~~~~~~~~~~###',
      '####################'),
    // 9 · el montículo con una cueva tapiada de piedra reforzada (guindilla).
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '........*...........',
      '....................',
      '......####....######',
      '......####....X....#',
      '...f..####.Hr.X..*.#', ...G3),
    // 10 · los saltos sobre el agua.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...........*........',
      '....................',
      '....................',
      '####................',
      '####...###......f...',
      '####...###..........',
      '####~~~###~~~#######',
      '####~~~###~~~#######',
      '####################'),
    // 11 · la barca.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '..,.........E.......',
      '##########~~~~~~~~~~',
      '##########~~~~~~~~~~',
      '####################'));
  NIVEL.registrar({ id: 'embarcadero', name: 'El embarcadero', theme: 'dusk', music: 'marsh', par: 200, rows: embarcadero,
    intro: 'La Garza voló río arriba con las crías en el buche.',
    ruca: ['¡Nila! La Garza se ha llevado a las crías del pantano y sólo queda Bigotes. Síguela: {move} para andar, {jump} para saltar. ¿Ves esa cría en la tabla alta? Hoy no llegas; ya volverás cuando Bigotes sepa volar.'],
    signs: [
      'Mantén {fish}: Bigotes sorbe lo que tenga delante. Con la boca llena, pulsa {fish} y lo escupe. Prueba contra la roca rajada.',
      'Por la madriguera se pasa agachada: mantén {down} y anda.',
      'Sorbe la caja y escúpela junto al saliente, o suéltala a tus pies con {down} y {fish}. Luego, súbete a ella.',
      'Escupe algo contra la diana: la compuerta se abrirá para siempre. Las ranas también valen.',
      'La placa abre la compuerta mientras algo pese encima. Deja la caja sobre ella con {down} y {fish}.',
      'Sopla al molinillo con {puff} y corre: los nenúfares no esperan. Un soplido también aparta a los mosquitos.'],
    maestro: { quien: 'ruca', poder: 'soplido',
      dialogo: ['¡Uf, qué carrera! Por mis atajos se llega antes, pero se aprende poco.',
        'Ese molinillo abre la compuerta mientras gira. Y para que gire hace falta viento.',
        'Toma, Bigotes: un vilano de diente de león. Trágatelo y sopla con ganas.'],
      despedida: 'Sopla al molinillo con {puff} y cruza antes de que pare. Y mira hacia arriba de vez en cuando: el pantano esconde crías donde hoy no llegas.' },
    secretos: [{ poder: 'aleteo', crias: 1 }, { poder: 'ventosa', crias: 1 }, { poder: 'mordisco', crias: 1 }, { poder: 'guindilla', crias: 1 }] });
})();
