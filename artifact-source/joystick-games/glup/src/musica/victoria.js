// GLUP — «¡Nivel superado!». Suena al pasar un nivel: una fanfarria de tres compases con todo el
// conjunto (la cabeza del tema de Nila y Bigotes, golpe orquestal, trompas, redoble y platillo) y,
// debajo del recuento de puntos, un bucle saltarín: la zampoña juega con el ritmo del tema sobre
// pizzicato en contratiempo, marimba, bajo que rebota y congas con claves; luego pregunta y
// respuesta entre zampoña y marimba. Sol mayor (escrito en fa, +2), 132 negras. La vuelta va al
// bucle, nunca a la fanfarria. 3 + 16 compases.
Sound.cancion('victoria', {
  titulo: '¡Nivel superado!', tempo: 132, compas: '4/4', swing: .1, tono: 'F mayor', trans: 2,
  eco: { tiempo: 'e', fb: .22, tono: 2800 },
  pistas: {
    zampona:  { inst: 'flautaPan', vol: .56, pan: -.06, rev: .3, eco: .1 },
    flauta:   { inst: 'flauta', vol: .44, pan: .12, rev: .34 },
    xilo:     { inst: 'xilofono', vol: .3, pan: .3, rev: .26 },
    trompa:   { inst: 'trompa', vol: .38, pan: -.2, rev: .4 },
    metales:  { inst: 'metales', vol: .24, pan: .16, rev: .32, rango: 'F3-C5', voces: 4 },
    golpe:    { inst: 'golpe', vol: .18, rev: .4 },
    cuerdas:  { inst: 'cuerdas', vol: .28, rev: .45, rango: 'F3-D5', voces: 4, abierto: true },
    arpa:     { inst: 'arpa', vol: .36, pan: -.36, rev: .4, rango: 'F3-C5', voces: 4, arp: 'up', arpPaso: 's', arpOct: 2 },
    glock:    { inst: 'glock', vol: .2, pan: .45, rev: .4, eco: .15 },
    pizz:     { inst: 'pizzicato', vol: .36, pan: .34, rev: .24, rango: 'A3-D5', voces: 3 },
    marimba:  { inst: 'marimba', vol: .46, pan: .28, rev: .2 },
    timbal:   { inst: 'timbal', vol: .38, rev: .3 },
    bajo:     { inst: 'fretless', vol: .7, rev: .06 },
    perc:     { inst: 'bateria', vol: .58, rev: .14 } },
  temas: {
    // The tally tune: the theme's head, bounced and staccato.
    jig: `mf C5e' A4e' C5e' D5q' C5e' A4e' F4e' | G4e' A4e' Bb4e' C5e' D5q' C5q' | A4e' F4e' A4e' C5e' F5q' E5e' D5e' | C5q'! rq rh |
          D5e' Bb4e' D5e' F5e' A5q' G5e' F5e' | E5e' C5e' A4e' C5e' F#5q' D5q' | G5e' F5e' E5e' D5e' C5e' Bb4e' A4e' G4e' | F4q' A4e' C5e' F5q'! rq`,
    jigVar: `mf C5e' A4e' C5e' {C5}D5q' C5e' A4e' F4e' | G4e' A4e' Bb4e' C5e' {C5}D5e' E5e' F5q' | A5e' F5e' A5e' C6e' F5q' E5e' D5e' | C5q'! rq rh |
             D5e' Bb4e' D5e' F5e' A5q' G5e' F5e' | E5e' C5e' A4e' C5e' F#5q' A5q' | G5e' F5e' E5e' D5e' C5e' Bb4e' A4e' G4e' | F4q' A4e' C5e' F5q'! rq`,
    acJ: `(Fmaj7)h (Dm7)h | (Gm7)h (C9)h | (Fmaj7)h (Dm9)h | (Gm7)h (C7)h | (Bbmaj7)h (Bbm6)h | (F/C)h (D7)h | (Gm7)h (C7)h | (F6)h (C7)h`,
    acQ: `(Bbmaj7)h (C9)h | (Am7)h (Dm7)h | (Gm7)h (C7)h | (Fmaj7)h (D7)h | (Gm9)w | (Am7)h (D7b9)h | (Gm7)h (C7)h | (F6)h (C7sus4)h`,
    // Off-beat pizzicato chords: the bounce under everything.
    skJ: `re (Fmaj7)e' re (Fmaj7)e' re (Dm7)e' re (Dm7)e' | re (Gm7)e' re (Gm7)e' re (C9)e' re (C9)e' | re (Fmaj7)e' re (Fmaj7)e' re (Dm9)e' re (Dm9)e' | re (Gm7)e' re (Gm7)e' re (C7)e' re (C7)e' |
          re (Bbmaj7)e' re (Bbmaj7)e' re (Bbm6)e' re (Bbm6)e' | re (F/C)e' re (F/C)e' re (D7)e' re (D7)e' | re (Gm7)e' re (Gm7)e' re (C7)e' re (C7)e' | re (F6)e' re (F6)e' re (C7)e' re (C7)e'`,
    skQ: `re (Bbmaj7)e' re (Bbmaj7)e' re (C9)e' re (C9)e' | re (Am7)e' re (Am7)e' re (Dm7)e' re (Dm7)e' | re (Gm7)e' re (Gm7)e' re (C7)e' re (C7)e' | re (Fmaj7)e' re (Fmaj7)e' re (D7)e' re (D7)e' |
          re (Gm9)e' re (Gm9)e' re (Gm9)e' re (Gm9)e' | re (Am7)e' re (Am7)e' re (D7b9)e' re (D7b9)e' | re (Gm7)e' re (Gm7)e' re (C7)e' re (C7)e' | re (F6)e' re (F6)e' re (C7sus4)e' re (C7sus4)e'`,
    bajoJ: `mf F2q' C2e' F2e' D2q' A1e' D2e' | G1q' D2e' G1e' C2q' G1e' C2e' | F2q' C2e' F2e' D2q' A1e' D2e' | G1q' D2e' G1e' C2q' E2e' C2e' |
            Bb1q' F2e' Bb1e' Bb1q' Db2e' Bb1e' | C2q' G1e' C2e' D2q' F#2e' D2e' | G1q' D2e' G1e' C2q' G1e' E2e' | F2q' C2e' F2e' C2q' Bb1e' C2e'`,
    bajoQ: `mf Bb1q' F2e' Bb1e' C2q' G1e' C2e' | A1q' E2e' A1e' D2q' A1e' D2e' | G1q' D2e' G1e' C2q' G1e' C2e' | F2q' C2e' F2e' D2q' A1e' F#1e' |
            G1q' D2e' G1e' Bb1q' D2e' Bb1e' | A1q' E2e' A1e' D2q' A1e' D2e' | G1q' D2e' G1e' C2q' G1e' E2e' | F2q' C2e' F2e' C2q' G1e' C2e'`,
    percJ: `
      bombo     x... ..x. x... .... | x... ..x. x... ..x.
      congaMute o... ..o. o... ..o.
      congaSlap .... x... .... x...
      conga     .... .... ..x. .x.x | .... .... ..xx .xX.
      shaker    xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxX
      claves    x..x ..x. ..x. x... | .... x... x... ....
      pandereta .... x... .... x... | .... x... .... x.xx` },
  secciones: {
    // The stinger: the theme's head in unison, brass stabs, a run up and a held, trilled top C over F.
    fanfarria: { compases: 3,
      zampona: { p: 'mf C5q! A4e C5e D5q.! C5e | F5q! A5e G5e F5e G5e A5e C6e | f C6h.! rq', vol: .66 },
      flauta: { p: 'mf C5q! A4e C5e D5q.! C5e | F5q! A5e G5e F5e G5e A5e C6e | f C6h.* rq', vol: .66 },
      trompa: { p: 'mf A4q A4e A4e Bb4q. A4e | A4q C5e Bb4e A4e Bb4e C5e E5e | f [C4 F4 A4]h. rq', vol: .66 },
      metales: { p: 'mf (Fmaj9)q! re (Fmaj9)e (Bbmaj9)q.! re | (Gm9)q! re (Gm9)e (C13)q.! (C13)e | f (Fmaj9)h.! rq', vol: .66 },
      golpe: { p: 'mf [F3 C4 A4]q rh. | R | f [F3 C4 A4 F5]q rh.', vol: .66 },
      cuerdas: { p: 'mf (Fmaj9)h (Bbmaj9)h | (Gm9)h (C13)h | f (Fmaj9)w', vol: .66 },
      arpa: { p: 'R | rh mf [C4 D4 F4 G4 A4 C5 D5 F5]h | (Fmaj9)w', vol: .66 },
      glock: { p: 'R | rh. C7q | F6h. rq', vol: .66 },
      timbal: { p: 'mf F2q! rh. | G2q rq pp < C3h% mf | f F2q! rh.', vol: .66 },
      bajo: { p: 'mf F2q! re F2e Bb1q.! re | G1q! re G1e C2q.! C2e | f F1h.! rq', vol: .66 },
      perc: { vol: .7, p: `
        plato     x... .... .... .... | .... .... .... .... | .... .... .... ....
        platillo  .... .... .... .... | .... .... .... .... | x... .... .... ....
        caja      .... .... .... .... | ..x. ..x. RRRR RRRR | X... .... .... ....
        bombo     x... .... x... .... | x... .... .... .... | x... .... .... ....` } },
    bucle: { compases: 8,
      zampona: ['$jig', '$jigVar'], xilo: { p: ['R', '$jig'], oct: 1 },
      pizz: '$skJ', bajo: '$bajoJ',
      marimba: 'R | R | R | rh mp G4e F4e E4e C4e | R | R | R | rh. C5e Bb4e',
      cuerdas: { p: ['R', '$acJ'], din: 'pp' },
      perc: '$percJ' },
    // Question and answer: the zampoña asks, the marimba answers.
    bucle2: { compases: 8,
      zampona: `mf D5e' F5e' A5e' G5e~ G5q C5q | R | Bb4e' D5e' G5e' F5e~ F5q Bb4q | R | D5e' F5e' Bb5e' A5e~ A5q G5q | R | Bb4e' A4e' G4e' A4e' Bb4q C5q! | R`,
      marimba: `R | mf rq A4e' C5e' E5e' D5e' C5e' A4e' | R | rq C5e' A4e' F4e' A4e' F#4e' A4e' | R | rq E5e' C5e' A4e' C5e' Eb5e' C5e' | R | rq F5e' D5e' C5e' A4e' Bb4e' G4e'`,
      pizz: '$skQ', bajo: '$bajoQ', glock: 'R | R | R | rh. D6q | R | R | R | rh. C6q',
      arpa: { p: 'R | R | R | R | p (Gm9)w | R | R | R', arp: 'updown', arpPaso: 'e' },
      perc: `
        bombo     x... ..x. x... .... | x... ..x. x... ..x.
        congaMute o... ..o. o... ..o.
        congaSlap .... x... .... x...
        bongo     .... ..x. .... x.x. | ..x. .... ..x. x.xX
        shaker    xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxX
        guiro     .... .... x... .... | .... .... .... ....
        triangulo .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... x...` } },
  forma: ['fanfarria', 'bucle', 'bucle2'], vuelta: 'bucle' });
