// GLUP — «En casa». El mapa, los planos tranquilos de la intro (Nila cuidando a las crías desde el
// embarcadero) y la calma después de la Garza. El tema de Nila y Bigotes en voz baja, en re mayor
// (escrito en fa y transportado), 80 negras con corcheas mecidas. Intro de guitarra de nailon
// punteada y kalimba; A con el tema en el clarinete grave; A2 con la kalimba cantándolo y el
// clarinete en notas guía; B con la melodía de la casa en el acordeón (la que citan los créditos);
// un respiro de guitarra y gotas; A3 con la ocarina y todo el grupo pequeño. 40 compases, 2:00.
Sound.cancion('dock', {
  titulo: 'En casa', tempo: 80, compas: '4/4', swing: .14, swingEn: 'e', tono: 'F mayor', trans: -3,
  eco: { tiempo: 'q.', fb: .26, tono: 2000 },
  pistas: {
    clarinete: { inst: 'clarinete', vol: .5, pan: -.08, rev: .34 },
    ocarina:   { inst: 'ocarina', vol: .46, pan: .1, rev: .36, eco: .1 },
    acordeon:  { inst: 'acordeon', vol: .3, pan: .3, rev: .3, rango: 'A3-D5', voces: 3 },
    kalimba:   { inst: 'kalimba', vol: .5, pan: -.26, rev: .34, eco: .28 },
    guitarra:  { inst: 'guitarra', vol: .44, pan: -.36, rev: .22, rango: 'G3-D5', voces: 3, bajo: true, arp: '1 3 2 4', arpPaso: 'e' },
    vibra:     { inst: 'vibrafono', vol: .3, pan: .38, rev: .42, eco: .2 },
    colchon:   { inst: 'pad', vol: .2, rev: .5, rango: 'A3-E5', voces: 4 },
    bajo:      { inst: 'fretless', vol: .66, rev: .06 },
    perc:      { inst: 'bateria', vol: .52, rev: .16 } },
  temas: {
    tema: `mf C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
           Bb4q. A4e G4q A4e Bb4e | C5q A4q F4h | G4e A4e Bb4q D5q C5q | F4w`,
    // Sung softly, with little turns and a lower, homelier ending.
    temaVar: `mf C5q {Bb4}A4e C5e D5q. C5e | A4e G4e F4q G4h | A4q C5q F5q. {F5}E5e | D5h C5e Bb4e A4e C5e |
              Bb4q. A4e G4q A4e Bb4e | C5q A4q F4q. E4e | G4e A4e Bb4q D5e C5e Bb4e G4e | A4h. rq`,
    // The theme reharmonised softly: B♭maj7#11 under the first D, G9 → B♭maj9 (a falling inner B → B♭).
    acA: `(Fmaj9)h (Bbmaj7#11)h | (Dm9)h (G9)h | (Bbmaj9)h (Dm9)h | (Gm11)h (C9sus4)h | (Gm9)w | (Am7)h (Dm9)h | (Gm9)h (C9sus4)h | (Fmaj9)h (C7sus4)h`,
    // The home tune (B): a lilting eight bars over B♭ – Am – Gm, the B♭m6 sigh and D7 back to Gm.
    casa: `mf D5q. C5e A4q F4q | G4q. A4e E4h | F4q G4e A4e Bb4q D5q | C5h Bb4q G4q |
           A4q. F4e D5q. C5e | D5h Db5h | C5q. A4e C5q F#4q | G4h. rq`,
    acC: `(Bbmaj7)w | (Am7)w | (Gm9)w | (C7sus4)h (C7)h | (Dm9)w | (Bbmaj7)h (Bbm6)h | (Am7)h (D7b9)h | (Gm9)h (C7sus4)h`,
    // Guide tones (7ths and 3rds) for the clarinet under the kalimba.
    guia: `mp E4h. D4q | C4h B3e C4e D4e B3e | A3h C4h | Bb3h. A3e Bb3e | A3h Bb3h | C4h. D4e C4e | Bb3h Bb3e C4e Bb3e G3e | A3h Bb3h`,
    bajoA: `mf F2q. C2e Bb1q. F2e | D2q. A1e G1q. D2e | Bb1q. F2e D2q. A1e | G1q. D2e C2q. G1e |
            G1q. D2e G1q Bb1q | A1q. E2e D2q. A1e | G1q. D2e C2q. G1e | F2q. C2e C2q. G1e`,
    bajoC: `mf Bb1q. F2e Bb1q. D2e | A1q. E2e A1q. C2e | G1q. D2e G1q. Bb1e | C2q. G1e C2q E2q |
            D2q. A1e D2q. F2e | Bb1q. F2e Bb1q. Db2e | A1q. E2e D2q. F#2e | G1q. D2e C2q. G1e`,
    brush: `
      barrido   x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x... ....
      escobilla .... x..o .... x.o. | .... x..o .... x.o. | .... x..o .... x.o. | .... x..o ..o. xoxo
      bombo     x... .... ..x. .... | x... .... ..x. .... | x... .... ..x. .... | x... .... x... ....
      gota      .... .... .... .... | .... ..2. .... .... | .... .... .... ..2. | .... .... .... ....` },
  secciones: {
    intro: { compases: 4,
      guitarra: 'mf (Fmaj9)w | (Bbmaj7#11)w | (Gm9)w | (C9sus4)h (C7)h',
      colchon: 'pp (Fmaj9)w | (Bbmaj7#11)w | (Gm9)w | (C9sus4)h (C7)h',
      kalimba: 'p rh C5e A4e F5q | rh D5e C5e A4q | rh Bb4e D5e G5q | rh. G4e C5e',
      bajo: 'R | R | p G1w | C2h. C2e G1e',
      perc: `
        gota      .... ..x. .... .... | .... .... ...x .... | .... .... .... .... | ...x .... .... ....
        triangulo .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....` },
    A: { compases: 8,
      clarinete: ['$tema', '$temaVar'],
      guitarra: '$acA', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
      kalimba: 'R | R | R | rh. p F5e D5e | R | R | R | rh. C5e A4e',
      perc: '$brush' },
    A2: { compases: 8,
      kalimba: { p: ['$temaVar', '$tema'], vol: 1.1 }, clarinete: { p: '$guia', vol: .8 },
      acordeon: { p: '$acA', din: 'pp' },
      guitarra: '$acA', bajo: '$bajoA',
      perc: '$brush' },
    B: { compases: 8,
      acordeon: { p: '$casa', voces: 1, vol: 1.5 },
      clarinete: { p: 'R | rh mp rq E4e F4e | G4h. rq | rh E4e F4e G4q | R | F4h. rq | rh. D4e Eb4e | D4h C4h', vol: .8 },
      vibra: { p: 'pp $acC', voces: 3, rango: 'A3-C5' },
      guitarra: '$acC', bajo: '$bajoC',
      perc: `
        barrido   x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x... ....
        escobilla .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x.xo
        bombo     x... .... .... .... | x... .... .... .... | x... .... .... .... | x... .... x... ....
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
    // A breath: the guitar alone, the kalimba recalling the home tune's first bars, water dripping.
    respiro: { compases: 4,
      guitarra: 'p (Bbmaj7)w | (Am7)w | (Gm9)w | (C9sus4)h (C7)h',
      kalimba: 'mp D5q. C5e A4q F4q | G4q. A4e E4h | rh Bb4e D5e G5q | rh. G4e C5e',
      bajo: 'p Bb1w | A1w | G1w | C2h. G1q',
      perc: `
        gota      .... ..x. .... .... | .... .... ...x .... | .... .x.. .... .... | ...x .... .... ....` },
    A3: { compases: 8,
      ocarina: ['$tema', '$temaVar'], clarinete: { p: '$guia', vol: .75 },
      acordeon: { p: '$acA', din: 'p' }, kalimba: 'R | R | R | rh. mp F5e D5e | R | R | R | rh. C5e A4e',
      guitarra: '$acA', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
      perc: '$brush' } },
  forma: ['intro', 'A', 'A2', 'B', 'respiro', 'A3'], vuelta: 'A' });
