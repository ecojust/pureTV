// GLUP — «Nila y Bigotes», el tema del juego. Suena en el título y al final de la intro («Vamos a
// buscarlas, Bigotes» y la carrera). Fa mayor, 112 negras. Intro que se enciende poco a poco mientras
// caen las letras (arpa, kalimba, colchón, trompa); A con el tema en la zampoña sobre la marimba, el
// bajo sin trastes y las congas, y la flauta contestando; A2 con la flauta arriba, guitarra y la
// zampoña en contracanto; B (la segunda frase del tema) lírico con cuerdas, arpa y trompa; un puente
// en re bemol de pregunta y respuesta (marimba contra zampoña, bongós, güiro) que vuelve por Do7; A3
// con todo el conjunto; una cola que respira y enlaza con A. 48 compases, ~1:43.
Sound.cancion('march', {
  titulo: 'Nila y Bigotes', tempo: 112, compas: '4/4', swing: .08, tono: 'F mayor',
  eco: { tiempo: 'e.', fb: .28, tono: 2600 },
  pistas: {
    zampona: { inst: 'flautaPan', vol: .6, pan: -.06, rev: .32, eco: .14 },
    flauta:  { inst: 'flauta', vol: .48, pan: .14, rev: .38, eco: .12 },
    trompa:  { inst: 'trompa', vol: .34, pan: -.18, rev: .44, rango: 'F3-C5', voces: 3 },
    kalimba: { inst: 'kalimba', vol: .42, pan: -.3, rev: .34, eco: .3 },
    marimba: { inst: 'marimba', vol: .46, pan: .3, rev: .2 },
    glock:   { inst: 'glock', vol: .18, pan: .45, rev: .42, eco: .2 },
    arpa:    { inst: 'arpa', vol: .38, pan: -.36, rev: .38, rango: 'F3-C5', voces: 4, arp: 'up', arpPaso: 's', arpOct: 2 },
    guitarra:{ inst: 'guitarra', vol: .32, pan: -.42, rev: .2, rango: 'E3-E5', voces: 4, rasgueo: .014 },
    cuerdas: { inst: 'cuerdas', vol: .28, pan: .06, rev: .46, rango: 'F3-D5', voces: 4, abierto: true },
    colchon: { inst: 'pad', vol: .24, rev: .45, rango: 'A3-E5', voces: 4 },
    timbal:  { inst: 'timbal', vol: .42, rev: .3 },
    bajo:    { inst: 'fretless', vol: .72, rev: .06 },
    perc:    { inst: 'bateria', vol: .6, rev: .14 } },
  temas: {
    // The main theme (Nila & Bigotes), as written for every composer: 4 + 4 bars.
    tema: `mf C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
           Bb4q. A4e G4q A4e Bb4e | C5q A4q F4h | G4e A4e Bb4q D5q C5q | F4w`,
    // The same tune sung more freely: runs, a higher peak, a sus4 that falls into F.
    temaVar: `mf C5q A4e C5e D5q. E5e | F5e E5e C5e A4e G4h | A4q C5q F5q. G5e | {G5}A5e G5e F5e D5e C5h |
              Bb4q. A4e G4q A4e Bb4e | C5q {D5}C5e A4e F4q. G4e | A4e Bb4e C5e D5e F5q E5q | F5w`,
    // Its second phrase (the B): the lydian #11 on B♭, the borrowed E♭, a climb through A7 to Dm and the B♭m6 sigh.
    temaB: `mf F5q. E5e D5q C5q | Bb4q. C5e D5h | Eb5q. D5e C5q Bb4q | A4h. C5q |
            D5q. C5e Bb4q A4q | G4q A4e Bb4e C#5q E5q | F5q D5q Db5q. C5e | Bb4q. A4e G4h`,
    acA7: `(Fmaj9)h (Dm9)h | (Gm9)h (C9)h | (Am7)h (Dm9)h | (Bbmaj9)h (C9sus4)h | (Bbmaj7)h (Gm9)h | (Am7)h (Dm9)h | (Gm9)h (C13)h`,
    acA: `$acA7 | (Fmaj9)h (C7sus4)h`,
    acA2: `$acA7 | (Fmaj9)h (F7)h`,
    acB: `(Bbmaj7)w | (Gm9)w | (Ebmaj7#11)w | (D7sus4)h (D7b9)h | (Gm9)w | (Em7b5)h (A7b9)h | (Dm9)h (Bbm6)h | (Gm9)h (C7b9)h`,
    acP: `(Dbmaj7)w | (Ebm9)h (Ab13)h | (Dbmaj7)w | (Bbm9)h (Eb9)h | (Gbmaj7#11)w | (Fm9)h (Bbm9)h | (Ebm9)h (Dbmaj7#11)h | (C7sus4)h (C7b9)h`,
    // The marimba engine: broken chords in eighths, accented 3+3+2 against the half-bar changes.
    mar7: `mp F3e! C4e G4e A4e! D3e A3e F4e! E4e | G3e! D4e A4e Bb4e! C3e G3e E4e! Bb3e | A3e! E4e G4e C5e! D3e A3e F4e! E4e |
           Bb2e! F3e C4e D4e! C3e G3e F4e! D4e | Bb2e! F3e A3e D4e! G3e D4e A4e! Bb3e | A3e! E4e C5e G4e! D3e A3e E4e! F4e |
           G3e! D4e Bb4e A4e! C3e Bb3e E4e! A4e`,
    mar: `$mar7 | F3e! C4e E4e G4e! C3e G3e Bb3e! F4e`,
    mar2: `$mar7 | F3e! C4e E4e A4e! F3e A3e Eb4e! C4e`,
    bajo7: `mf F2q. C3e D2q. A1e | G1q. D2e C2q G1e E2e | A1q. E2e D2q. C2e | Bb1q. F2e C2q. A1e |
            Bb1q. F2e G1q. D2e | A1q. E2e D2q A1e C2e | G1q. D2e C2q G1e E2e`,
    bajoA: `$bajo7 | F2q. C2e C2q G1e C2e`,
    bajoA2: `$bajo7 | F2q. C3e A2e F2e Eb2e C2e`,
    guit7: `(Fmaj9)q. (Fmaj9)e' (Dm9)q. (Dm9)e' | (Gm9)q. (Gm9)e' (C9)q. (C9)e' | (Am7)q. (Am7)e' (Dm9)q. (Dm9)e' | (Bbmaj9)q. (Bbmaj9)e' (C9sus4)q. (C9sus4)e' |
            (Bbmaj7)q. (Bbmaj7)e' (Gm9)q. (Gm9)e' | (Am7)q. (Am7)e' (Dm9)q. (Dm9)e' | (Gm9)q. (Gm9)e' (C13)q. (C13)e'`,
    // The zampoña's counter-line under the flute in A2 (thirds and guide tones, moving when the tune holds).
    contra: `mp rq F4e G4e A4h | Bb4q. A4e G4h | C5h. D5e C5e | D5h C5e Bb4e A4e G4e |
             F4q G4e A4e Bb4h | A4h. F4q | G4q Bb4q A4q G4q | A4h G4h`,
    percA: `
      bombo     x... ..x. x... .... | x... ..x. x... .... | x... ..x. x... .... | x... ..x. x.x. ..x.
      congaMute o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ....
      congaSlap .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
      conga     .... .... .... ..xx | .... .... ..x. ...3 | .... .... .... ..xx | .... .... xxX. xX..
      congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..xX
      shaker    Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxX
      taco      .... .... .... .... | .... .... ...3 .... | .... .... .... .... | .... .... .... ....`,
    percB: `
      bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. ....
      shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo | x.x. x.x. x.x. x.x. | x.x. x.xo x.xo xoxX
      triangulo x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
      congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..xx` },
  secciones: {
    // The letters fall: harp and kalimba alone, then the pad, bass and hands wake up; a horn swell into A.
    intro: { compases: 4,
      arpa: { p: 'p (Fmaj9)h (Bbmaj9)h | (Fmaj9)h (Bbmaj9)h | mp (Gm9)h (Am7)h | (Bbmaj9)h (C9sus4)h', arp: 'up', arpPaso: 's', arpOct: 2 },
      kalimba: 'p rh C6e A5e F5e C5e | rh D6e A5e F5e D5e | mp rh C6e Bb5e G5e D5e | rh D6e C6e Bb5e G5e',
      colchon: 'pp < (Fmaj9)w | (Bbmaj9)w | (Gm9)h (Am7)h | mp (Bbmaj9)h (C9sus4)h',
      trompa: 'R | R | p < C4w | F4h. mf E4q',
      bajo: 'R | R | mp G1h. A1q | Bb1h C2q. C2e',
      marimba: 'R | R | p G3e! D4e A4e Bb4e! A3e E4e G4e! C5e | Bb2e! F3e C4e D4e! C3e G3e F4e! D4e',
      timbal: 'R | R | R | rh pp < C3q% C3q% mf',
      perc: `
        lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        triangulo .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... ....
        shaker    .... .... .... .... | .... .... .... .... | x.x. x.x. x.x. x.xo | x.xo x.xo xoxo xxxX
        congaMute .... .... .... .... | .... .... .... .... | .... .... o... ..o. | o... ..o. o... ....
        conga     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..xx xX..` },
    A: { compases: 8,
      zampona: ['$tema', '$temaVar'],
      flauta: 'R | R | R | mp rh F5e G5e F5e D5e | R | R | R | rq C5e D5e F5e G5e A5e C6e',
      marimba: '$mar', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        $percA` },
    A2: { compases: 8,
      flauta: { p: ['$temaVar', '$tema'], oct: 1, vol: .95 },
      zampona: { p: '$contra', vol: .72 },
      guitarra: '$guit7 | (Fmaj9)q. (Fmaj9)e\' (F7)q. (F7)e\'',
      marimba: { p: '$mar2', vol: .8 }, bajo: '$bajoA2',
      trompa: 'R | R | R | p < D4h. C4q mf | R | R | R | p < A3h. mf Eb4q',
      perc: '$percA' },
    B: { compases: 8,
      flauta: '$temaB',
      trompa: 'p < D4w | D4w mf | D4h. Bb3q | C4w | Bb3w | Bb3h A3h | A3h F3h | Bb3h Bb3h',
      cuerdas: 'p < $acB mf', arpa: { p: 'mp $acB', arp: 'updown', arpPaso: 'e' },
      glock: 'R | rh. D6q | R | rh. C6q | R | rh. E6q | R | R',
      bajo: 'mf Bb1h. F2q | G1h. D2e F2e | Eb2h. Bb1q | D2h A1q F#2q | G1h. D2q | E2q. Bb1e A1q C#2q | D2h Bb1h | G1q. D2e C2q E2q',
      perc: '$percB' },
    // Question and answer in D♭ (the ♭VI): the marimba asks with the theme's head, the zampoña answers.
    puente: { compases: 8,
      marimba: 'mf Ab4q F4e Ab4e Bb4q. Ab4e | R | F4q Ab4q Db5q. C5e | R | Bb4q Gb4e Bb4e C5q. Db5e | R | Eb5q Db5e Bb4e Ab4q. G4e | R',
      zampona: 'R | mf rq F5e Eb5e Db5e Eb5e C5q | R | rq Db5e C5e Bb4q G4q | R | rq Ab5e G5e F5e Eb5e Db5e C5e | R | rq G5e F5e E5q. Bb4e',
      colchon: 'pp < $acP mp',
      kalimba: 'p rh Db6e Ab5e F5q | R | rh C6e Ab5e F5q | R | rh Bb5e F5e Db5q | R | rh G5e F5e Db5q | R',
      bajo: 'mp Db2h. Ab1q | Eb2h Ab1h | Db2h. F2q | Bb1h Eb2h | Gb1h. Db2q | F2h Bb1h | Eb2h Db2h | C2h. C2e G1e',
      timbal: 'R | R | R | R | R | R | R | pp < C3h% G2q% C3q% f',
      perc: `
        bongo     .... ..x. .... x... | ..x. .... ..o. x.x. | .... ..x. .... x... | ..x. .... ..o. x.x.
        bongoBajo x... .... ..x. .... | x... ..x. .... .... | x... .... ..x. .... | x... ..x. .... ....
        guiro     .... .... .... .... | .... .... x... .... | .... .... .... .... | .... .... x... ....
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo
        rana      .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... ....` },
    A3: { compases: 8,
      zampona: ['$temaVar', '$tema'], flauta: { p: ['$temaVar', '$tema'], oct: 1, vol: .7 },
      trompa: { p: '$acA', din: 'mp' }, cuerdas: { p: '$acA', din: 'p' },
      glock: 'R | rh. G6q | R | rh. D6q | R | rh. F6q | R | C6h. rq',
      marimba: '$mar', bajo: '$bajoA',
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... xxxX
        $percA` },
    // The tune's first bar echoes on the kalimba over a slower harmonic rhythm, then the pickup into A.
    cola: { compases: 4,
      kalimba: 'mp C5q A4e C5e D5q. C5e | A4h. rq | rh D5q. C5e | Bb4h. rq',
      arpa: { p: 'p (Fmaj9)w | (Bbmaj9)w | (Gm9)w | (C9sus4)h (C7b9)h', arp: 'updown', arpPaso: 'e', arpOct: 2 },
      colchon: 'p (Fmaj9)w | (Bbmaj9)w | (Gm9)w | (C9sus4)h (C7b9)h',
      zampona: 'R | rh mp F5e G5e A5q | R | rh G5q. E5e',
      bajo: 'p F2w | Bb1w | G1h. D2q | C2h. C2e G1e',
      perc: `
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo | x.x. x.x. x.xo x.xo | x.xo xoxo xxxx xxxX
        congaMute .... .... .... .... | .... .... .... .... | o... ..o. o... ..o. | o... ..o. o... ....
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` } },
  forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
