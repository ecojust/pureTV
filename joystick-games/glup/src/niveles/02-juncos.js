// GLUP — nivel 2.
'use strict';
(() => {
  const { screen, join, G3 } = NIVEL;
  // ---------------------------------------------------------------- 2 · Los juncos
  // De noche. Cangrejos que se voltean de una pedrada, dianas, la balsa a soplidos y el escupitajo hacia
  // arriba. Lumi, la luciérnaga de los farolillos, da el aleteo cuando los tres faroles del camino están
  // encendidos (el tercero, bajo una trampilla que abre una diana en el techo). Con el aleteo: el muro de
  // cinco, el foso de zarzas con un cangrejo y una diana en lo alto, y los pilotes sobre el agua.
  // Secretos: la chimenea de raíces de la salida (ventosa), la bodega de piedra rajada junto a Ruca
  // (panzazo), la cueva de la hoguera tras los pilotes (chorro) y el túnel del molinillo bajo la orilla
  // (resbalón).
  // Faroles: los tres de Lumi (la orilla, el suyo y el de la bodega) y el de la compuerta, antes de los
  // pilotes. El de junto a la barca sobraba: tras él no quedaba nada que guardar.
  const juncos = join(
    // 0 · la salida: una chimenea de raíces a la espalda y piedra rajada en el suelo.
    screen(
      '#####...............',
      'M...M...............',
      'M.*.M...............',
      'M==.M...............',
      'M...M...............',
      'M...M...............',
      'M...M...............',
      'M...M.........*.....',
      'M...M........===....',
      'M...................',
      'M.....@.N,.......s..',
      '########xx##########',
      '#######....*########',
      '####################'),
    // 1 · el cangrejo y la diana: voltéalo de una pedrada, sórbelo y escúpelo contra la diana.
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
      '.?...r....K...TG..*.', ...G3),
    // 2 · la balsa: mira atrás y sopla. Hay crías en lo alto… y un mosquito.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '.......*.....*......',
      '....................',
      '..........m.........',
      '....................',
      '.?..R...............',
      '##~~~~~~~~~~~~~~~~##',
      '##~~~~~~~~~~~~~~~~##',
      '####################'),
    // 3 · primer farol; el cangrejo de la tabla se voltea desde abajo, escupiendo hacia arriba.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '............*.......',
      '...........====.....',
      '....................',
      '......K.............',
      '....====............',
      '....................',
      '.L.r...?............', ...G3),
    // 4 · Lumi, su farolillo y la trampilla de la bodega (la diana cuelga del saliente). El muro de cinco.
    screen(
      '....................',
      '....................',
      '......#####.........',
      '......#####.........',
      '........T...........',
      '..............######',
      '..............######',
      '..............######',
      '..............######',
      '.Lr.Q.........######',
      '########GG##########',
      '####..........######',
      '####L.......*.######',
      '####################'),
    // 5 · el foso de zarzas: tablas separadas por seis; sólo se cruzan aleteando.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....*...............',
      '###.................',
      '###.................',
      '###.................',
      '###...====......====',
      '###.................',
      '###.................',
      '###^^^^^^^^^^^^^^^^^',
      '####################',
      '####################'),
    // 6 · el cangrejo de la tabla (piedra, soplido o salto a tiempo) y la diana en lo alto del poste.
    screen(
      '...................#',
      '...................#',
      '...................#',
      '...................#',
      '...................T',
      '....................',
      '.............m......',
      '.......r.K..........',
      '......======......==',
      '....................',
      '....................',
      '^^^^^^^^^^^^^^^^^^^^',
      '####################',
      '####################'),
    // 7 · la compuerta, un farol y los pilotes sobre el agua (el segundo, de cuatro: aleteo).
    screen(
      '..###...............',
      '..###...............',
      '..###...............',
      '...G..............*.',
      '...G..............##',
      '...G..............##',
      '...G..............##',
      'r..G..............##',
      '==.G........##....##',
      '...G........##....##',
      '...G..L.....##....##',
      '#########~~~##~~~~##',
      '#########~~~##~~~~##',
      '####################'),
    // 8 · el último pilote, la orilla y la cueva de la hoguera (chorro): agua del charco, al fuego.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '..m.................',
      '..............*.....',
      '....##..............',
      '....##.....######...',
      '....##.....F...*#...',
      '....##.....F....#...',
      '~~~~##~#############',
      '~~~~##~#############',
      '####################'),
    // 9 · el hoyo del molinillo y, bajo la orilla, un túnel largo y bajo (resbalón). Ruca espera.
    screen(
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '............*.......',
      '...........===......',
      '....................',
      '.......?.N.....H....',
      '....################',
      'V...................',
      '####################'),
    // 10 · la barca; al final del túnel, tras su compuerta, una cría.
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
      '...........E........',
      '#######==#~~~~~~~~~~',
      '......G.*#~~~~~~~~~~',
      '####################'));
  NIVEL.registrar({ id: 'juncos', name: 'Los juncos', theme: 'night', music: 'juncos', par: 230, rows: juncos,
    intro: 'Entre los juncos, de noche, mandan los cangrejos.',
    ruca: ['¿Que cómo llegué antes? Atajos de tortuga. Ojo: los cangrejos no se dejan sorber hasta que los volteas de una pedrada. Y esa piedra rajada del suelo… ésa no se rompe escupiendo de lado: habría que caerle encima con muchas ganas.',
      'La Garza se posó en el bosque de raíces. Por ese hoyo del molinillo se va a un túnel muy largo y muy bajo: agachada no llegas a tiempo. Toma la barca; yo voy por mis atajos.'],
    signs: [
      'Dale a la diana con algo escupido y la compuerta se abrirá para siempre. Al cangrejo, voltéalo antes con la piedra.',
      'Súbete a la balsa, mira hacia atrás y sopla con {puff}: Bigotes la empuja.',
      'Mantén {up} al escupir y Bigotes lanza hacia arriba. Los cangrejos también se voltean desde abajo.',
      'Sopla al molinillo del hoyo y corre por el túnel antes de que se cierre la compuerta.'],
    maestro: { quien: 'lumi', poder: 'aleteo',
      dialogo: ['Bzzz... ¿Quién anda por mis juncos a estas horas? ¡Ah, una niña con un pez!',
        'Soy Lumi. Llevo cien veranos encendiendo los farolillos de los juncos.',
        'Tu pez tiene buenas aletas. Con un poco de luz dentro, volaría... un poquito.'],
      encargo: { tipo: 'faroles', n: 3,
        pide: 'Pero esta noche mis farolillos están apagados y yo ya no vuelo tan lejos. Enciende los tres: uno en la orilla, éste de aquí… y el de la bodega, bajo la trampilla. La trampilla se abre con la diana del saliente: escupe hacia arriba.',
        hecho: '¡Tres luces! Así se ven los juncos. Toma, Bigotes: una luciérnaga dorada. Que te dé alas.' },
      despedida: 'Salta y, en el aire, salta otra vez: Bigotes aletea. El muro, el foso, los pilotes… ¡arriba, arriba!' },
    secretos: [{ poder: 'ventosa', crias: 1 }, { poder: 'panzazo', crias: 1 }, { poder: 'chorro', crias: 1 }, { poder: 'resbalon', crias: 1 }] });
})();
