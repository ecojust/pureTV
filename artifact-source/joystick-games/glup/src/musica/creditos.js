// GLUP — «Créditos». Una suite con los temas del juego para los créditos, 108 negras con swing
// suave. Intro de marimba y arpa; A, el tema de Nila y Bigotes en la zampoña con la banda del
// título; B, su segunda frase en la flauta con cuerdas y trompa; «En casa», la melodía del mapa en
// el acordeón con escobillas y guitarra; un juego de pregunta y respuesta en re menor (clarinete y
// xilófono, pizzicato, bongós) que sube por Re7 a sol mayor; el final con todo el conjunto y el tema
// variado; una cola de despedida (♭VI–♭VII–I) que se posa y enlaza de vuelta con A. 46 compases, ~1:42.
Sound.cancion('creditos', {
  titulo: 'Créditos', tempo: 108, compas: '4/4', swing: .12, tono: 'F mayor',
  eco: { tiempo: 'e.', fb: .26, tono: 2400 },
  pistas: {
    zampona:  { inst: 'flautaPan', vol: .6, pan: -.06, rev: .32, eco: .14 },
    flauta:   { inst: 'flauta', vol: .48, pan: .14, rev: .38, eco: .1 },
    clarinete:{ inst: 'clarinete', vol: .5, pan: -.14, rev: .32 },
    acordeon: { inst: 'acordeon', vol: .44, pan: .2, rev: .28 },
    xilo:     { inst: 'xilofono', vol: .36, pan: .3, rev: .26 },
    trompa:   { inst: 'trompa', vol: .34, pan: -.2, rev: .44, rango: 'F3-C5', voces: 3 },
    marimba:  { inst: 'marimba', vol: .46, pan: .3, rev: .2 },
    guitarra: { inst: 'guitarra', vol: .34, pan: -.4, rev: .22, rango: 'E3-E5', voces: 4, rasgueo: .014 },
    punteo:   { inst: 'guitarra', vol: .42, pan: -.36, rev: .22, rango: 'G3-D5', voces: 3, bajo: true, arp: '1 3 2 4', arpPaso: 'e' },
    pizz:     { inst: 'pizzicato', vol: .34, pan: .34, rev: .24, rango: 'A3-D5', voces: 3 },
    kalimba:  { inst: 'kalimba', vol: .42, pan: -.28, rev: .34, eco: .28 },
    arpa:     { inst: 'arpa', vol: .38, pan: -.36, rev: .4, rango: 'F3-C5', voces: 4, arp: 'up', arpPaso: 's', arpOct: 2 },
    glock:    { inst: 'glock', vol: .18, pan: .45, rev: .42, eco: .2 },
    cuerdas:  { inst: 'cuerdas', vol: .28, rev: .46, rango: 'F3-D5', voces: 4, abierto: true },
    coro:     { inst: 'coroU', vol: .24, rev: .55, rango: 'F3-D5', voces: 4 },
    timbal:   { inst: 'timbal', vol: .4, rev: .3 },
    bajo:     { inst: 'fretless', vol: .72, rev: .06 },
    perc:     { inst: 'bateria', vol: .58, rev: .14 } },
  temas: {
    tema: `mf C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
           Bb4q. A4e G4q A4e Bb4e | C5q A4q F4h | G4e A4e Bb4q D5q C5q | F4w`,
    temaVar: `mf C5q A4e C5e D5q. E5e | F5e E5e C5e A4e G4h | A4q C5q F5q. G5e | {G5}A5e G5e F5e D5e C5h |
              Bb4q. A4e G4q A4e Bb4e | C5q {D5}C5e A4e F4q. G4e | A4e Bb4e C5e D5e F5q E5q | F5w`,
    temaB: `mf F5q. E5e D5q C5q | Bb4q. C5e D5h | Eb5q. D5e C5q Bb4q | A4h. C5q |
            D5q. C5e Bb4q A4q | G4q A4e Bb4e C#5q E5q | F5q D5q Db5q. C5e | Bb4q. A4e G4h`,
    // The home tune from the map («En casa»).
    casa: `mf D5q. C5e A4q F4q | G4q. A4e E4h | F4q G4e A4e Bb4q D5q | C5h Bb4q G4q |
           A4q. F4e D5q. C5e | D5h Db5h | C5q. A4e C5q F#4q | G4h. rq`,
    acA7: `(Fmaj9)h (Dm9)h | (Gm9)h (C9)h | (Am7)h (Dm9)h | (Bbmaj9)h (C9sus4)h | (Bbmaj7)h (Gm9)h | (Am7)h (Dm9)h | (Gm9)h (C13)h`,
    acA: `$acA7 | (Fmaj9)h (F7)h`,
    acF: `$acA7 | (Fmaj9)h (C7sus4)h`,
    acB: `(Bbmaj7)w | (Gm9)w | (Ebmaj7#11)w | (D7sus4)h (D7b9)h | (Gm9)w | (Em7b5)h (A7b9)h | (Dm9)h (Bbm6)h | (Gm9)h (C7b9)h`,
    acC: `(Bbmaj7)w | (Am7)w | (Gm9)w | (C7sus4)h (C7)h | (Dm9)w | (Bbmaj7)h (Bbm6)h | (Am7)h (D7b9)h | (Gm9)h (C7sus4)h`,
    acJ: `(Dm9)h (G13)h | (Dm9)h (G13)h | (Bbmaj7)h (A7b9)h | (Dm9)h (D7b9)h | (Gm9)h (C13)h | (Fmaj7)h (Bb13)h | (Em7b5)h (A7b9)h | (Dm9)h (D7)h`,
    mar7: `mp F3e! C4e G4e A4e! D3e A3e F4e! E4e | G3e! D4e A4e Bb4e! C3e G3e E4e! Bb3e | A3e! E4e G4e C5e! D3e A3e F4e! E4e |
           Bb2e! F3e C4e D4e! C3e G3e F4e! D4e | Bb2e! F3e A3e D4e! G3e D4e A4e! Bb3e | A3e! E4e C5e G4e! D3e A3e E4e! F4e |
           G3e! D4e Bb4e A4e! C3e Bb3e E4e! A4e`,
    bajo7: `mf F2q. C3e D2q. A1e | G1q. D2e C2q G1e E2e | A1q. E2e D2q. C2e | Bb1q. F2e C2q. A1e |
            Bb1q. F2e G1q. D2e | A1q. E2e D2q A1e C2e | G1q. D2e C2q G1e E2e`,
    guit7: `(Fmaj9)q. (Fmaj9)e' (Dm9)q. (Dm9)e' | (Gm9)q. (Gm9)e' (C9)q. (C9)e' | (Am7)q. (Am7)e' (Dm9)q. (Dm9)e' | (Bbmaj9)q. (Bbmaj9)e' (C9sus4)q. (C9sus4)e' |
            (Bbmaj7)q. (Bbmaj7)e' (Gm9)q. (Gm9)e' | (Am7)q. (Am7)e' (Dm9)q. (Dm9)e' | (Gm9)q. (Gm9)e' (C13)q. (C13)e'`,
    skJ: `re (Dm9)e' re (Dm9)e' re (G13)e' re (G13)e' | re (Dm9)e' re (Dm9)e' re (G13)e' re (G13)e' | re (Bbmaj7)e' re (Bbmaj7)e' re (A7b9)e' re (A7b9)e' | re (Dm9)e' re (Dm9)e' re (D7b9)e' re (D7b9)e' |
          re (Gm9)e' re (Gm9)e' re (C13)e' re (C13)e' | re (Fmaj7)e' re (Fmaj7)e' re (Bb13)e' re (Bb13)e' | re (Em7b5)e' re (Em7b5)e' re (A7b9)e' re (A7b9)e' | re (Dm9)e' re (Dm9)e' re (D7)e' re (D7)e'`,
    percA: `
      bombo     x... ..x. x... .... | x... ..x. x... .... | x... ..x. x... .... | x... ..x. x.x. ..x.
      congaMute o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ....
      congaSlap .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
      conga     .... .... .... ..xx | .... .... ..x. ...3 | .... .... .... ..xx | .... .... xxX. xX..
      shaker    Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxX` },
  secciones: {
    intro: { compases: 2,
      marimba: 'mp F3e! C4e G4e A4e! Bb2e F3e D4e! C4e | G3e! D4e A4e Bb4e! C3e G3e F4e! D4e',
      arpa: 'R | rh mp [C4 D4 F4 G4 A4 C5 D5 F5]h',
      bajo: 'R | p G1h C2q. C2e',
      perc: `
        shaker    x.x. x.x. x.x. x.xo | x.xo x.xo xoxo xxxX
        triangulo x... .... .... .... | .... .... .... ....` },
    A: { compases: 8,
      zampona: '$tema',
      flauta: 'R | R | R | mp rh F5e G5e F5e D5e | R | R | R | rq C5e D5e F5e G5e Eb5e C5e',
      marimba: '$mar7 | F3e! C4e E4e A4e! F3e A3e Eb4e! C4e',
      guitarra: "$guit7 | (Fmaj9)q. (Fmaj9)e' (F7)q. (F7)e'",
      bajo: '$bajo7 | F2q. C3e A2e F2e Eb2e C2e', cuerdas: { p: '$acA', din: 'pp' },
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        $percA` },
    B: { compases: 8,
      flauta: '$temaB',
      trompa: 'p < D4w | D4w mf | D4h. Bb3q | C4w | Bb3w | Bb3h A3h | A3h F3h | Bb3h Bb3h',
      cuerdas: 'p < $acB mf', arpa: { p: 'mp $acB', arp: 'updown', arpPaso: 'e' },
      bajo: 'mf Bb1h. F2q | G1h. D2e F2e | Eb2h. Bb1q | D2h A1q F#2q | G1h. D2q | E2q. Bb1e A1q C#2q | D2h Bb1h | G1q. D2e C2q E2q',
      perc: `
        bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. ....
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo | x.x. x.x. x.x. x.x. | x.x. x.xo x.xo xoxX
        triangulo x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....` },
    // A nod to the map: the home tune on the accordion, brushes and picked guitar.
    casa: { compases: 8,
      acordeon: '$casa',
      clarinete: { p: 'R | rh mp rq E4e F4e | G4h. rq | rh E4e F4e G4q | R | F4h. rq | rh. D4e Eb4e | D4h C4h', vol: .8 },
      punteo: 'mf $acC', kalimba: 'R | R | R | rh. p E5e G5e | R | R | R | rh. D5e C5e',
      bajo: `mf Bb1q. F2e Bb1q. D2e | A1q. E2e A1q. C2e | G1q. D2e G1q. Bb1e | C2q. G1e C2q E2q |
             D2q. A1e D2q. F2e | Bb1q. F2e Bb1q. Db2e | A1q. E2e D2q. F#2e | G1q. D2e C2q. G1e`,
      perc: `
        barrido   x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x... ....
        escobilla .... x..o .... x.o. | .... x..o .... x.o. | .... x..o .... x.o. | .... x..o ..o. xoxo
        bombo     x... .... ..x. .... | x... .... ..x. .... | x... .... ..x. .... | x... .... x... ....` },
    // A game of question and answer in D minor: clarinet asks, xylophone answers.
    juego: { compases: 8,
      clarinete: `mf A4e' F4e' A4e' C5e~ C5e B4e' A4q' | R | D5e' Bb4e' F4e' A4e~ A4e G4e' E4q' | R | Bb4e' G4e' D5e' F5e~ F5e E5e' C5q' | R | G4e' Bb4e' D5e' E5e~ E5e C#5e' A4q' | R`,
      xilo: `R | mf rq F5e' E5e' D5e' A4e' B4q' | R | rq F5e' D5e' A4e' D5e' F#5e' A5e' | R | rq A5e' G5e' F5e' C5e' D5e' Ab5e' | R | rq D5e' F5e' A5e' C6e' A5e' F#5e'`,
      pizz: '$skJ',
      bajo: 'mf D2q F2q G1q B1q | D2q A1q G1q B1q | Bb1q D2q A1q C#2q | D2q F2q D2q C2q | G1q Bb1q C2q E2q | F2q A1q Bb1q D2q | E2q G2q A1q C#2q | D2q F2q D2q F#2q',
      perc: `
        bongo     .... ..x. .... x.x. | ..x. .... ..x. x.xX
        bongoBajo x... .... x... .... | x... ..x. x... ....
        shaker    xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxX
        guiro     .... .... x... .... | .... .... .... ....
        claves    x..x ..x. ..x. x... | .... x... x... ....` },
    // The last chorus, a tone higher (G major): everyone plays.
    final: { compases: 8, trans: 2,
      zampona: '$temaVar', flauta: { p: '$temaVar', oct: 1, vol: .7 },
      trompa: { p: '$acF', din: 'mp' }, cuerdas: { p: '$acF', din: 'p' }, coro: { p: '$acF', din: 'pp' },
      marimba: '$mar7 | F3e! C4e E4e G4e! C3e G3e Bb3e! F4e',
      glock: 'R | rh. G6q | R | rh. D6q | R | rh. F6q | R | C6h. rq',
      bajo: '$bajo7 | F2q. C2e C2q G1e C2e',
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... xxxX
        $percA` },
    // Goodbye: the theme's head, ♭VI – ♭VII – I, a held chord, and a soft sus that leads back to A.
    cola: { compases: 4, trans: 2,
      zampona: 'f C5q A4e C5e D5q. C5e | F5h. G5q | A5w | R',
      flauta: { p: 'f C5q A4e C5e D5q. C5e | F5h. G5q | A5w | R', oct: 1, vol: .6 },
      trompa: 'mp (Fmaj9)h (Dm9)h | (Dbmaj7)h (Eb6)h | mf (Fmaj9)w | R',
      cuerdas: 'mp (Fmaj9)h (Dm9)h | (Dbmaj7)h (Eb6)h | mf (Fmaj9)w | p (Fmaj9)h (Bb9sus4)h',
      arpa: 'R | R | mf (Fmaj9)w | p (Fmaj9)h (Bb9sus4)h',
      glock: 'R | R | A6w | R',
      timbal: 'R | rh pp < Eb3h% f | F2q! rh. | R',
      bajo: 'mf F2h D2h | Db2h Eb2h | F2w | p F2h Bb1h',
      perc: `
        platillo  .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. xoxo xxxX | .... .... .... .... | .... .... .... ....
        triangulo .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... ....` } },
  forma: ['intro', 'A', 'B', 'casa', 'juego', 'final', 'cola'], vuelta: 'A' });
