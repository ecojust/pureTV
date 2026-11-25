// GLUP — «El molino anegado». Nivel 4: el molino de Olga, la nutria molinera, en plena tormenta;
// la Garza ha dormido aquí. Re menor en 12/8 que rueda como la rueda del molino (arpa en corcheas
// que suben y bajan, el pizzicato como los cangilones), 108 negras (72 la negra con puntillo).
// Intro: la rueda arranca sola. A con el clarinete; A2 con el violín y el clarinete debajo; B en fa
// mayor, la esperanza: la flauta canta el tema de Nila en 12/8 con el chelo y la trompa; puente de
// la Garza: la rueda se para, trémolo, timbales y el motivo del tritono en chelo y trompa, hasta
// que la trompa contesta con la cabeza del tema del molino y la rueda vuelve a girar; A3 con todo
// (violín y flauta a la octava); una cola que deja sola la rueda y vuelve a A. 46 compases, ~2:33.
Sound.cancion('molino', {
  titulo: 'El molino anegado', tempo: 108, compas: '12/8', tono: 'D menor', vol: 1.1,
  eco: { tiempo: 'q.', fb: .24, tono: 2000 },
  pistas: {
    clar:    { inst: 'clarinete', vol: .7, pan: -.06, rev: .34 },
    violin:  { inst: 'violin', vol: .7, pan: .08, rev: .38 },
    flauta:  { inst: 'flauta', vol: .5, pan: .14, rev: .38, eco: .08 },
    trompa:  { inst: 'trompa', vol: .38, pan: -.2, rev: .42 },
    chelo:   { inst: 'chelo', vol: .46, pan: -.26, rev: .36 },
    arpa:    { inst: 'arpa', vol: .42, pan: -.36, rev: .34, rango: 'D3-A4', voces: 4, arp: '1 2 3 4 3 2', arpPaso: 'e' },
    pizz:    { inst: 'pizzicato', vol: .36, pan: .34, rev: .26, rango: 'A3-A4', voces: 3 },
    cuerdas: { inst: 'cuerdas', vol: .27, rev: .46, rango: 'F3-C5', voces: 4, abierto: true },
    tremolo: { inst: 'tremolo', vol: .26, rev: .44, rango: 'D3-D5', voces: 4, abierto: true },
    coro:    { inst: 'coro', vol: .24, rev: .52, rango: 'D4-D5', voces: 3 },
    timbal:  { inst: 'timbal', vol: .44, rev: .3 },
    bajo:    { inst: 'fretless', vol: .45, rev: .06 },
    perc:    { inst: 'bateria', vol: .56, rev: .16 } },
  temas: {
    // The tune: a long-short climb (A–D–E–F) like a bucket rising on the wheel, and a falling
    // answer that rhymes (D–C–B♭–A); the second half climbs to C6 and settles on the dominant.
    melA: `mp A4q. D5q E5e F5q. E5e D5e C5e | D5q. C5q Bb4e A4h. | G4q A4e Bb4q C5e D5q. F5q. | E5q. D5q E5e C#5h. |
           mf A4q. D5q E5e F5q. G5q A5e | C6q. A5q G5e F5q. E5q F5e | G5q. F5q E5e D5h. | mp D5q. C5q Bb4e A4h.`,
    melAvar: `mp A4q. D5q E5e F5q. {G5}F5e E5e D5e | D5q._ C5q Bb4e A4q. A4e Bb4e C5e | G4q A4e Bb4q C5e D5q. {E5}F5q. | E5q. D5q E5e C#5q. rq. |
              mf A4q. D5q E5e F5q. G5q A5e | f C6q._ A5q G5e F5q. E5q F5e | G5q. A5q Bb5e A5h. | mp G5q. E5q D5e C#5h.`,
    cntA: `p D4h. F4h. | F4h. E4h. | D4h. G4h. | A4h. G4h. | F4h. A4h. | A4h. C5h. | D5h. Bb4h. | Bb4h. A4h.`,
    acA: `(Dm9)w+h | (Bbmaj7)w+h | (Gm9)w+h | (A7sus4)h. (A7b9)h. | (Dm9)w+h | (F/C)w+h | (Bbmaj7#11)w+h | (Em7b5)h. (A7b9)h.`,
    // The buckets: a pizzicato chord on the second eighth of each group.
    pizzA: `rq. (Dm9)e' re (Dm9)e' rq. (Dm9)e' (Dm9)e' re | rq. (Bbmaj7)e' re (Bbmaj7)e' rq. (Bbmaj7)e' (Bbmaj7)e' re |
            rq. (Gm9)e' re (Gm9)e' rq. (Gm9)e' (Gm9)e' re | rq. (A7sus4)e' re (A7sus4)e' rq. (A7b9)e' (A7b9)e' re |
            rq. (Dm9)e' re (Dm9)e' rq. (Dm9)e' (Dm9)e' re | rq. (F/C)e' re (F/C)e' rq. (F/C)e' (F/C)e' re |
            rq. (Bbmaj7#11)e' re (Bbmaj7#11)e' rq. (Bbmaj7#11)e' (Bbmaj7#11)e' re | rq. (Em7b5)e' re (Em7b5)e' rq. (A7b9)e' (A7b9)e' re`,
    bajoA: `mf D2q. D2q A2e D3q. A2q. | Bb1q. Bb1q F2e Bb2q. A2q. | G1q. G1q D2e G2q. F2q. | A1q. A1q E2e A2q. C#2q. |
            D2q. D2q A2e D3q. C3q. | C2q. C2q G2e C3q. Bb2q. | Bb1q. Bb1q F2e Bb2q. F2q. | E2q. E2q Bb1e A1q. E2q.`,
    timbA: `R | R | R | rh. p A2h.% | R | R | R | rh. mp A2q. D2q.'`,
    percA: `
      bombo     x..... x..... | x..... x..... | x..... x..... | x..... x..x.x
      shaker    Xox Xox Xox Xox
      congaBaja ...... ...x.. | ...... ...x.. | ...... ...x.. | ...... ...xxX
      congaMute ..o..o ..o..o
      triangulo x..... ...... | ...... ...... | ...... ...... | ...... ......`,
    // B: hope in F major — Nila's theme, rocked into 12/8, never quite coming home.
    acB: `(Fmaj9)w+h | (Dm9)h. (C/E)h. | (Bbmaj9)w+h | (C9sus4)h. (C7)h. | (Gm9)w+h | (Dm9)w+h | (Bbmaj7)w+h | (C7sus4)h. (C7b9)h.`,
    fluB: `mf C5q A4e C5q D5e C5h. | A4q. F4q. G4h. | A4q C5e F5q. E5q D5e C5q. | D5h. C5q. rq. |
           Bb4q. A4q G4e A4q Bb4e C5q. | C5q. A4q. F4h. | G4q A4e Bb4q. D5q. C5q. | f F5h. E5q. rq.`,
    cheB: `mp A3q. C4q. F4h. | F4q. D4q. E4h. | D4q. F4q. A4h. | G4h. E4h. | R | R | R | R`,
    tromB: `R | R | R | R | mp D4h. Bb3h. | A3h. F3h. | D4h. F4h. | C4h. Bb3h.`,
    bajoB: `mf F2q. F2q C3e F2q. E2q. | D2q. D2q A2e E2q. C2q. | Bb1q. Bb1q F2e Bb2q. A2q. | C2q. C2q G2e C2q. E2q. |
            G1q. G1q D2e G2q. F2q. | D2q. D2q A2e D3q. C3q. | Bb1q. Bb1q F2e Bb2q. B1q. | C2q. C2q G2e C2q. C#2q.`,
    // The Heron: the wheel stops; her tritone motif in cello and horn, then a sequence a third up.
    acP: `(E7b9)w+h | (Dm/A)h. (A7b9)h. | (G7b9)w+h | (Fm/C)h. (C7b9)h. | (Bbmaj7#11)w+h | (A7sus4)h. (A7b9)h.`,
    garza: `mf D4e C#4e D4q G#3h. rq | A3q. F3e E3h. rq | F4e E4e F4q B3h. rq | C4q. Ab3e G3h. rq`,
    cola: `(Dm9)w+h | (Bbmaj7)w+h | (Gm9)w+h | (A7sus4)h. (A7b9)h.` },
  secciones: {
    intro: { compases: 4,
      arpa: { p: 'p < $cola mf', vol: 1.4 },
      pizz: { p: 'R | rq. (Dm9)e\' re (Dm9)e\' rq. (Dm9)e\' (Dm9)e\' re | rq. (Bbmaj7)e\' re (Bbmaj7)e\' rq. (Bbmaj7)e\' (Bbmaj7)e\' re | rq. (A7sus4)e\' re (A7sus4)e\' rq. (A7b9)e\' (A7b9)e\' re', din: 'p' },
      cuerdas: 'R | R | pp < (Gm9)w+h | (A7sus4)h. (A7b9)h. mp',
      chelo: 'R | R | p D3h. G3h. | A2h. E3q. C#3q.',
      bajo: 'R | R | R | p A1h. A1h. ',
      timbal: 'R | R | R | rh. pp A2h.%',
      perc: `
        lluvia    x..... ...... | ...... ...... | ...... ...... | ...... ......
        shaker    ...... ...... | ...... ...... | x..x.. x..x.. | x.xx.x xoxXox` },
    A: { compases: 8,
      clar: ['$melA', '$melAvar'],
      arpa: '$acA', pizz: '$pizzA', bajo: '$bajoA', cuerdas: { p: '$acA', din: 'pp' }, timbal: '$timbA',
      perc: `
        platillo  x..... ...... | ...... ...... | ...... ...... | ...... ......
        $percA` },
    A2: { compases: 8,
      violin: ['$melAvar', '$melA'], clar: { p: '$cntA', vol: .75 },
      arpa: '$acA', pizz: '$pizzA', bajo: '$bajoA', chelo: { p: '$acA', rango: 'D3-A3', voces: 1, vol: .6, din: 'p' },
      timbal: '$timbA',
      perc: `
        bombo     x..... x..... | x..... x..x.. | x..... x..... | x..... x..x.x
        shaker    Xox Xox Xox Xox
        congaBaja ...... ...x.. | ...... ...x.x | ...... ...x.. | ...... .x.xxX
        conga     ...... ....x. | ...... ...... | ...... ....x. | ...... ......
        congaMute ..o..o ..o..o
        pandereta ...x.. ...x.. | ...x.. ...x.. | ...x.. ...x.. | ...x.. ..xxX.` },
    B: { compases: 8,
      flauta: '$fluB', chelo: '$cheB', trompa: '$tromB',
      arpa: { p: 'mp $acB', arp: '1 2 3 4 5 4', arpOct: 2 }, cuerdas: 'pp < $acB mp', bajo: '$bajoB',
      perc: `
        bombo     x..... ...... | x..... ...... | x..... ...... | x..... ...x..
        shaker    x.x x.x x.x x.x | x.x x.x x.x x.x | x.x x.x x.x x.x | x.x x.x xox xoX
        triangulo x..... ...... | ...... ...... | ...... ...... | ...... ......` },
    puente: { compases: 6,
      chelo: '$garza | R | R', trompa: { p: '$garza | mf A3q. D4q E4e F4h. | f E4q. D4q E4e C#4h.', vol: 1.4 },
      tremolo: 'p < $acP f', coro: 'R | R | pp < (G7b9)w+h | (Fm/C)h. (C7b9)h. | (Bbmaj7#11)w+h | (A7sus4)h. (A7b9)h. mf',
      timbal: { vol: .7, p: 'mf D2q.% rq. rh. | A2q.% rq. rh. | F2q.% rq. rh. | C3q.% rq. rh. | Bb2h.% Bb2h.% | A2h.% A2q.! A2q.!' },
      arpa: 'R | R | R | R | mp (Bbmaj7#11)w+h | (A7sus4)h. (A7b9)h.',
      bajo: 'mf D2w+h | A1w+h | G1w+h | C2w+h | Bb1w+h | A1h. A1h. ',
      perc: `
        tambor    x..... ...... | x..... ...... | x..... ...... | x..... ...... | x..... ...... | x..... x..x.x
        platillo  ...... ...... | ...... ...... | ...... ...... | ...... ...... | x..... ...... | ...... ......
        shaker    ...... ...... | ...... ...... | ...... ...... | ...... ...... | Xox Xox Xox Xox | Xox Xox XxX XxX
        tomBajo   ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... ..xxXX` },
    A3: { compases: 8,
      violin: ['$melA', '$melAvar'], flauta: { p: ['$melA', '$melAvar'], oct: 1, vol: .8 },
      trompa: { p: '$cntA', vol: .9 }, arpa: '$acA', pizz: '$pizzA', bajo: '$bajoA',
      cuerdas: { p: '$acA', din: 'p' }, timbal: '$timbA',
      perc: `
        platillo  x..... ...... | ...... ...... | ...... ...... | ...... ......
        bombo     x..... x..... | x..... x..x.. | x..... x..... | x..... x..x.x
        shaker    Xox Xox Xox Xox
        congaBaja ...... ...x.. | ...... ...x.x | ...... ...x.. | ...... .x.xxX
        conga     ...... ....x. | ...... ...... | ...... ....x. | ...... ......
        congaMute ..o..o ..o..o
        pandereta ...x.. ...x.. | ...x.. ...x.. | ...x.. ...x.. | ...x.. ..xxX.
        tom       ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... ...... | ...... .xxx..` },
    cola: { compases: 4,
      arpa: '$cola', pizz: { p: 'R | R | rq. (Gm9)e\' re (Gm9)e\' rq. (Gm9)e\' (Gm9)e\' re | rq. (A7sus4)e\' re (A7sus4)e\' rq. (A7b9)e\' (A7b9)e\' re', din: 'p' },
      clar: 'p A4q. D5q E5e F5h. | R | pp G4q A4e Bb4q C5e D5h. | R',
      cuerdas: 'pp $cola', bajo: 'p D2w+h | Bb1w+h | G1w+h | A1h. A1h. ',
      timbal: 'R | R | R | rh. pp A2h.%',
      perc: `
        shaker    x..x.. x..x.. | x..x.. x..x.. | x..x.. x..x.. | x.xx.x xoxXox` } },
  forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
