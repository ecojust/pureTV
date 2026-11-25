// GLUP — «La cueva de barro». Nivel 7: a oscuras bajo el cerro, gotas que suenan afinadas y, al
// fondo, la cocina de Don Pinzas. Fa# dórico, 96 negras. Intro de gotas (kalimba y glockenspiel con
// eco, un coro que zumba); A con la ocarina sobre la marimba en grupos de tres contra cuatro (las
// gotas), bajo sin trastes y bloques de madera; A2 con el koto que contesta en los huecos; B, el
// tango-cha del cangrejo cocinero en la mayor (acordeón, pizzicato, claves, «clac clac»), dos veces:
// la segunda la canta el xilófono y el acordeón acompaña; un puente hondo en re lidio (vibráfono,
// coro y ecos); A3 con flauta y ocarina a la octava; cola de gotas que vuelve a A. 56 compases, ~2:20.
{
  const compases = s => s.split('|').map(b => b.trim().split(/\s+/));
  // Three-note cells in sixteenths against the 4/4: the drips. Each chord has its cell.
  const CELDA = { 'F#m9': 'A3 E4 G#4', B13: 'A3 D#4 G#4', 'Dmaj7#11': 'A3 C#4 G#4', 'C#m7': 'G#3 B3 E4', Bm9: 'D4 A3 C#4', E13: 'G#3 D4 C#4',
    'C#7sus4': 'B3 F#4 G#4', 'C#7b9': 'F4 B3 D4', 'Cmaj7#11': 'G3 B3 F#4', Gmaj7: 'B3 F#4 D4' };
  const goteo = s => compases(s).map(ch => {
    const out = []; for (let i = 0; i < 16; i++) { const c = CELDA[ch[Math.floor(i * ch.length / 16)]].split(' '), k = i % 3; out.push(c[k] + 's' + (k === 0 ? (i === 0 ? '!' : '') : '?')); }
    return out.join(' ');
  }).join(' | ');
  const colchon = s => compases(s).map(([a, b]) => b ? `(${a})h (${b})h` : `(${a})w`).join(' | ');
  // The crab's habanera: chords on the 'and' of 1, on 2, on the 'and' of 3 and on 4.
  const habanera = s => compases(s).map(([a, b = a]) => `re (${a})e' (${a})e'? re re (${b})e' (${b})e'? re`).join(' | ');
  const A = 'F#m9 | B13 | F#m9 | B13 | Dmaj7#11 | C#m7 | Bm9 E13 | C#7sus4 C#7b9';
  const B = 'Amaj7 | Bm7 E7 | Amaj7 | C#7 | F#m7 | B9 | Dmaj7 E7 | C#7sus4 C#7';
  const P = 'Dmaj7#11 | Dmaj7#11 | Cmaj7#11 | Cmaj7#11 | Bm9 | Bm9 | Gmaj7 | C#7sus4 C#7b9';

  Sound.cancion('cueva', {
    titulo: 'La cueva de barro', tempo: 96, compas: '4/4', swing: .1, tono: 'F# dorico',
    eco: { tiempo: 'e.', fb: .38, tono: 2600 },
    pistas: {
      ocarina: { inst: 'ocarina', vol: .58, pan: -.06, rev: .38, eco: .2 },
      flauta:  { inst: 'flauta', vol: .46, pan: .1, rev: .38, eco: .12 },
      acordeon:{ inst: 'acordeon', vol: .5, pan: -.08, rev: .26, rango: 'A3-E5', voces: 4 },
      xilo:    { inst: 'xilofono', vol: .34, pan: .3, rev: .3, eco: .18 },
      koto:    { inst: 'koto', vol: .4, pan: -.38, rev: .3, eco: .2 },
      kalimba: { inst: 'kalimba', vol: .46, pan: -.3, rev: .38, eco: .34 },
      glock:   { inst: 'glock', vol: .2, pan: .45, rev: .45, eco: .3 },
      marimba: { inst: 'marimba', vol: .42, pan: .28, rev: .22, eco: .1 },
      vibra:   { inst: 'vibrafono', vol: .42, pan: .15, rev: .42, eco: .25 },
      pizz:    { inst: 'pizzicato', vol: .36, pan: .3, rev: .24, rango: 'A3-E5', voces: 3 },
      colchon: { inst: 'pad', vol: .25, rev: .5, rango: 'A3-E5', voces: 4 },
      coro:    { inst: 'coro', vol: .24, rev: .55, rango: 'C#4-E5', voces: 3, abierto: true },
      bajo:    { inst: 'fretless', vol: .7, rev: .07 },
      perc:    { inst: 'bateria', vol: .58, rev: .18 } },
    temas: {
      // The tune: up the minor third to the dorian colours and down to D♯ (the major sixth), then
      // higher, a lydian climb over D and a sigh on C♯7 that asks to begin again.
      melA: `mf re C#5e F#5e G#5e A5q. G#5e | F#5e E5e D#5e C#5e D#5h | re C#5e F#5e G#5e A5q. B5e | C#6q. B5e A5e G#5e F#5q |
             E5q. F#5e G#5q A5q | G#5h. rq | F#5e E5e D5e C#5e B4q D5e E5e | F#5q. G#5e F5h`,
      melAvar: `mf re C#5e F#5e G#5e A5e B5e C#6q | B5e A5e G#5e F#5e D#5h | re C#5e F#5e G#5e A5q. C#6e | f D#6q. C#6e B5e A5e F#5q |
                mf E5e F#5e G#5e A5e B5q. C#6e | G#5h rq {A5}G#5e E5e | F#5e E5e D5e C#5e B4e D5e F#5e E5e | C#5h. rq`,
      // The composed echo: the xylophone repeats the tail of each phrase, softer and higher.
      ecoA: `R | rh pp G#6e A6e G#6q | R | R | R | rh. pp E6e F#6e | R | rh pp G#6e F6e rq`,
      kotoA: `R | rh mp C#5s D#5s F#5s G#5s F#5e' D#5e' | R | rh. rs A4s B4s C#5s | R | rh B4s C#5s E5s F#5s G#5e' E5e' | R | rh G#4s B4s D5s F5s G#5q'`,
      bajoA: `F#1q. C#2e F#2q E2e C#2e | B1q. F#2e B2q A2e F#2e | F#1q. C#2e F#2q A2e G#2e | B1q. D#2e F#2e A2e B2e_ C#3e |
              D2q. A2e D3q C#3e A2e | C#2q. G#2e C#3q B2e G#2e | B1q. F#2e E2q. G#2e | C#2q. G#1e C#2q. G#1e`,
      marA: goteo(A), acA: colchon(A), acP: colchon(P),
      // The chef's tune: a habanera strut, a question on C♯7, sideways steps like a crab.
      melB: `mf E5e. C#5s A4e C#5e E5e. F#5s E5e C#5e | D5q' B4e' D5e' {E5}F#5q' E5e' D5e' | C#5e. A4s E4e A4e C#5e. E5s A5e G#5e | G#5q. F5e G#5e B5e G#5e F5e |
             A5q' F#5e' A5e' C#6q' A5e' F#5e' | D#5q' C#5e' D#5e' F#5q' E5e' D#5e' | C#5e. D5s F#5e A5e G#5e. F#5s E5e D5e | C#5q' rq {D5}C#5e' G#4e' F4q'`,
      bajoB: `A1e. A1s' C#2e E2e A1e. A1s' E2e C#2e | B1e. B1s' D2e F#2e E2e. E2s' G#2e B1e | A1e. A1s' C#2e E2e A1e. A1s' E2e A2e | C#2e. C#2s' E#2e G#2e C#2e. C#2s' G#1e B1e |
              F#1e. F#1s' A1e C#2e F#2e. F#2s' C#2e A1e | B1e. B1s' D#2e F#2e B1e. B1s' A1e F#1e | D2e. D2s' F#2e A2e E2e. E2s' G#2e B1e | C#2e. C#2s' G#1e C#2e C#2q' G#1e G#1e`,
      percA: `
        bombo     x... .... ..x. .... | x... .... ..x. .... | x... .... ..x. .... | x... ..x. x... ....
        taco      ..x. .... .... x... | ..x. ...o .... x... | ..x. .... .... x... | ..x. .x.. x.x. xx..
        tacoBajo  .... ..x. x... ..x. | .... ..x. x... .... | .... ..x. x... ..x. | .... x... .... ..xX
        shaker    xoxo Xoxo xoxo Xoxo | xoxo Xoxo xoxo Xoxo | xoxo Xoxo xoxo Xoxo | xoxo Xoxo xoxo XoxX
        congaMute .... o... .... o... | .... o... .... o... | .... o... .... o... | .... o... ..o. ....
        gota      .... .... .... ...3 | .... ..3. .... .... | ...3 .... .... .... | .... .... ..3. ....
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....`,
      percB: `
        bombo     x... ..x. x... .... | x... ..x. x... .... | x... ..x. x... .... | x... ..x. x.x. x...
        claves    x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x...
        congaMute o... .... o... .... | o... .... o... .... | o... .... o... .... | o... .... .... ....
        congaSlap .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
        conga     .... .... ...x .x.. | .... .... ...x .xx. | .... .... ...x .x.. | .... .... xx.x xX..
        shaker    x.xo x.xo x.xo x.xo
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x.xX
        taco      .... .... .... .... | .... .... .... ..xx | .... .... .... .... | .... .... xx.x x...` },
    secciones: {
      // Drips in the dark: tuned water, a hum, a first shape of the tune in the kalimba.
      intro: { compases: 4,
        coro: 'p < (F#m9)w | (F#m9)w | (Dmaj7#11)w | mf (C#7sus4)h (C#7b9)h',
        kalimba: { azar: ['mp rq C#6e\' rq. G#5e re | rh. E5q | rq F#5e rq. C#6e re | rh G#5e A5e C#6e F5e',
                          'mp rh. C#6e G#5e | rq. E5e rh | rq A5e rq. F#5e re | rh G#5e A5e C#6e F5e'] },
        glock: 'R | rh. p G#6e\' re | rq C#7e\' re rh | R',
        bajo: 'R | rh. p F#1q | D2w | C#2h C#2h',
        perc: `
          gota      ..x. .... ...x .... | .... x... .... ..x. | ...x .... .x.. .... | .... ..x. .... x...
          tacoBajo  .... .... .... .... | .... .... .... .... | .... .... x... .... | .... .... x... x.x.
          shaker    .... .... .... .... | .... .... .... .... | .... .... .... .... | x.x. x.x. xoxo xxxX` },
      A: { compases: 8,
        ocarina: ['$melA', '$melAvar'], xilo: { p: '$ecoA', vol: .8 },
        marimba: '$marA', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percA` },
      A2: { compases: 8,
        ocarina: '$melAvar', koto: '$kotoA',
        marimba: { p: '$marA', din: 'p' }, bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
        kalimba: 'R | R | R | R | R | rh. p C#6e G#5e | R | R',
        perc: `
          bongo     ..x. .... ..x. .x.. | ..x. .... ..x. .... | ..x. .... ..x. .x.. | ..x. ..x. .xx. x...
          bongoBajo x... .... x... .... | x... .... x... ..x. | x... .... x... .... | x... x... .... ..xX
          $percA` },
      // The chef's kitchen, twice: accordion first, xylophone second with the accordion strutting chords.
      B: { compases: 8,
        acordeon: ['$melB', { p: habanera(B), din: 'mp', vol: .8 }],
        xilo: [{ p: 'R | R | R | R | p A6q\' F#6e\' A6e\' C#7q\' A6e\' F#6e\' | D#6q\' C#6e\' D#6e\' F#6q\' E6e\' D#6e\' | R | R' }, { p: '$melB', oct: 1, vol: 1.3 }],
        pizz: [habanera(B), { p: 'R | R | R | R | ' + habanera('F#m7 | B9 | Dmaj7 E7 | C#7sus4 C#7'), vol: .8 }],
        flauta: [null, 'R | R | R | R | mp A4h C#5h | D#5h F#5h | F#5h E5h | E#5h. rq'],
        bajo: '$bajoB',
        perc: '$percB' },
      // Deeper in: D lydian, the vibraphone's slow tune, the choir, echoes answered by the kalimba.
      puente: { compases: 8,
        vibra: 'mp rq A5q G#5q E5q | F#5h. rq | rq G5q F#5q D5q | E5h. rq | F#5q. E5e D5q C#5q | D5q. C#5e B4q A4q | B4h. D5q | C#5h F5h',
        kalimba: 'R | rh. p E6e C#6e | R | rh. D6e B5e | R | rh. C#6e A5e | R | rh G#5e F5e rq',
        coro: 'pp < $acP mp',
        bajo: 'p D2w | D2w | C2w | C2w | B1w | A1w | G1w | C#2h C#2h',
        perc: `
          gota      .... ..x. .... .... | .... .... ...x .... | ..x. .... .... .... | .... .... .... ..x.
          tacoBajo  x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
          triangulo .... .... x... .... | .... .... .... .... | .... .... x... .... | .... .... .... ....
          lluvia    .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
          congaMute .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | o... o... o... o... | o.o. o.o. oooo oooo
          conga     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..x. xxxX` },
      A3: { compases: 8,
        flauta: '$melA', ocarina: { p: '$melA', oct: -1, vol: .75 },
        koto: '$kotoA', marimba: '$marA', bajo: '$bajoA', colchon: { p: '$acA', din: 'p' },
        glock: 'R | rh. pp D#6q | R | rh. F#6q | R | rh. G#6q | R | rh F6h',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... xxxX
          $percA` },
      cola: { compases: 4,
        kalimba: 'p re C#5e F#5e G#5e A5q. G#5e | F#5e E5e D#5e C#5e D#5h | pp rq C#6e\' rq. G#5e re | rh G#5e A5e C#6e F5e',
        coro: 'pp (F#m9)w | (B13)w | (Dmaj7#11)w | (C#7sus4)h (C#7b9)h',
        bajo: 'p F#1w | B1w | D2w | C#2h C#2h',
        perc: `
          gota      ..x. .... ...x .... | .... x... .... ..x. | ...x .... .x.. .... | .... ..x. .... x...
          shaker    .... .... .... .... | .... .... .... .... | x.x. x.x. x.x. x.x. | x.x. x.x. xoxo xxxX
          tacoBajo  x... .... .... .... | x... .... .... .... | x... .... x... .... | x... .... x... x.x.` } },
    forma: ['intro', 'A', 'A2', 'B', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
}
