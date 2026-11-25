// GLUP — «El embarcadero». La canción de referencia del formato (ver musica/LEEME.md): el pantano
// al atardecer, re dórico, 92 negras. Intro de colchón y kalimba; A con la zampoña sobre el
// ostinato de marimba, bajo sin trastes y congas; A2 con guitarra y ocarina a dos voces; B lírico
// con flauta, cuerdas y arpa; un puente de luciérnagas (vibráfono, coro, ranas de madera); A3 con
// todo y la melodía variada; una cola que vuelve a la kalimba y enlaza con A. 48 compases, ~2:05.
Sound.cancion('marsh', {
  titulo: 'El embarcadero', tempo: 92, compas: '4/4', swing: .12, tono: 'D dorico',
  eco: { tiempo: 'e.', fb: .3, tono: 2400 },
  pistas: {
    zampona: { inst: 'flautaPan', vol: .62, pan: -.08, rev: .34, eco: .16 },
    flauta:  { inst: 'flauta', vol: .55, pan: .12, rev: .38, eco: .12 },
    ocarina: { inst: 'ocarina', vol: .42, pan: .24, rev: .34 },
    kalimba: { inst: 'kalimba', vol: .5, pan: -.32, rev: .34, eco: .3 },
    marimba: { inst: 'marimba', vol: .5, pan: .28, rev: .2 },
    vibra:   { inst: 'vibrafono', vol: .42, pan: .15, rev: .4, eco: .22 },
    glock:   { inst: 'glock', vol: .2, pan: .45, rev: .42, eco: .2 },
    arpa:    { inst: 'arpa', vol: .42, pan: -.36, rev: .36, rango: 'D3-A4', voces: 4, arp: 'updown', arpPaso: 's', arpOct: 2 },
    guitarra:{ inst: 'guitarra', vol: .36, pan: -.42, rev: .2, rango: 'D3-D5', voces: 4, rasgueo: .016 },
    cuerdas: { inst: 'cuerdas', vol: .3, rev: .45, rango: 'F3-C5', voces: 4, abierto: true },
    colchon: { inst: 'pad', vol: .26, rev: .45, rango: 'A3-E5', voces: 4 },
    coro:    { inst: 'coroU', vol: .3, rev: .5, rango: 'D4-D5', voces: 3 },
    bajo:    { inst: 'fretless', vol: .72, rev: .06 },
    perc:    { inst: 'bateria', vol: .62, rev: .14 } },
  temas: {
    // The tune: two four-bar phrases, the second climbing to A over B♭maj7 and falling home.
    melA: `mf re A4e D5e E5e F5q. E5e | D5e {D5}C5e A4h. | re G4e B4e D5e F5q E5e D5e | E5q. D5e E5h^ |
           F5q A5q G5e F5e E5e D5e | E5q. D5e C#5q A4q | D5q F5e E5e D5e C5e A4q | D5h E5e D5e C#5q`,
    melAvar: `mf re A4e D5e E5e F5e G5e A5q | G5e F5e E5e D5e C5h | re B4e D5e F5e A5q G5e F5e | E5h. rq |
              f F5q A5q C6q. A5e | G5e F5e E5e D5e C#5q A4q | mf D5q F5e G5e A5e G5e F5e E5e | D5h. rq`,
    acA: `(Dm9)w | (Dm9)w | (G9)w | (G13)w | (Bbmaj7)w | (A7sus4)h (A7)h | (Dm9)h (Gm9)h | (Em7b5)h (A7b9)h`,
    acB: `(Bbmaj7)w | (C6)w | (Am7)w | (Dm9)w | (Gm9)w | (C9)w | (Fmaj7)w | (A7sus4)h (A7)h`,
    acP: `(Ebmaj7#11)w | (Dm9)w | (Ebmaj7#11)w | (Dm9)w | (Cm9)w | (F13)w | (Bbmaj9)w | (A7sus4)h (A7b9)h`,
    // The marimba's ostinato: broken chords in eighths, accented 3+3+2.
    mar: `mp D3e! A3e F4e A3e! E4e A3e F4e! C4e | D3e! A3e F4e A3e! E4e A3e F4e! C4e |
          G3e! D4e F4e D4e! A4e D4e B3e! D4e | G3e! D4e F4e D4e! E4e D4e B3e! F4e |
          Bb2e! F3e A3e F3e! D4e F3e A3e! C4e | A2e! E3e G3e D4e! A3e C#4e E4e! G4e |
          D3e! A3e F4e C4e! G3e D4e Bb3e! F4e | E3e! Bb3e D4e G3e! A2e E3e G3e! C#4e`,
    bajoA: `D2q. D2e A2q C3e_ D3e | D2q. D2e A2q G2e F2e | G2q. G2e D3q B2e A2e | G2q. D3e E3q F3e A2e_ |
            Bb2q. F2e Bb2q A2e F2e | A2q. E2e A2q G2e C#3e | D3q. A2e G2q. D2e | E2q. G2e A2q. C#3e`,
    kal: `p D5e A4e C5e D5e F5e D5e C5e A4e | D5e A4e C5e D5e F5e D5e C5e A4e | G4e B4e D5e E5e F5e E5e D5e B4e | E5e C#5e A4e G4e A4q rq`,
    guit: `(Dm9)q. (Dm9)e' rq (Dm9)e (Dm9)e' | (Dm9)q. (Dm9)e' rq (Dm9)e (Dm9)e' | (G9)q. (G9)e' rq (G9)e (G9)e' | (G13)q. (G13)e' rq (G13)e (G13)e' |
           (Bbmaj7)q. (Bbmaj7)e' rq (Bbmaj7)e (Bbmaj7)e' | (A7sus4)q. (A7sus4)e' (A7)q (A7)e (A7)e' | (Dm9)q. (Dm9)e' (Gm9)q (Gm9)e (Gm9)e' | (Em7b5)q. (Em7b5)e' (A7b9)q (A7b9)e (A7b9)e'`,
    // A light tumbao: heel on 1 and 3, slap on 2 and 4, open tones on the 'and' of 4; a fill every fourth bar.
    percA: `
      bombo     x... ..x. x... .... | x... ..x. x... .... | x... ..x. x... .... | x... ..x. x.x. ....
      congaMute o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ..o. | o... ..o. o... ....
      congaSlap .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
      conga     .... .... .... ..xx | .... .... .... ..x3 | .... .... .... ..xx | .... .... ..x. xX..
      congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..xX
      shaker    Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxo | Xoxo xoxo Xoxo xoxX
      taco      .... .... .... .... | .... .... ...3 .... | .... .... .... .... | .... .... .... ....` },
  secciones: {
    intro: { compases: 4,
      colchon: 'pp < (Dm9)w | (Dm9)w | (G9)w | mp (G13)h (A7sus4)h',
      kalimba: '$kal',
      bajo: 'R | R | p G2h. D3q | A2h. E2e_ A2e',
      arpa: { p: 'R | R | R | rh [D4 E4 F4 A4 C5 D5 E5 F5]h', arp: 'up', arpPaso: 's' },
      perc: `
        lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        triangulo .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
        shaker    .... .... .... .... | .... .... .... .... | x.x. x.x. x.x. x.xo | x.xo x.xo xoxo xxxX` },
    A: { compases: 8,
      zampona: ['$melA', '$melAvar'],
      marimba: '$mar', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp' },
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        $percA` },
    A2: { compases: 8,
      zampona: '$melA',
      ocarina: 'R | R | R | R | mp D5q F5q E5e D5e C5e Bb4e | C#5q. B4e A4q E4q | A4q D5e C5e Bb4e A4e F4q | A4h C5e Bb4e A4q',
      guitarra: '$guit', marimba: '$mar', bajo: '$bajoA', perc: '$percA' },
    B: { compases: 8,
      flauta: 'mf F5q. E5e D5h | E5q. D5e C5h | C5q. D5e E5q G5q | F5h E5h | D5q. F5e A5h | G5q. F5e E5q D5q | E5h C5q A4q | D5h C#5h',
      cuerdas: 'p < $acB mf', arpa: 'mp $acB',
      bajo: 'mf Bb1h. F2q | C2h. G2q | A1h. E2q | D2h. A2q | G1h. D2q | C2h. G2q | F2h. C3q | A1h. A2e_ C#3e',
      perc: `
        bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. ....
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo | x.x. x.x. x.x. x.x. | x.x. x.xo x.xo xoxX
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..xx` },
    puente: { compases: 8,
      vibra: 'mp rq Bb5q A5q D5q | F5h. rq | rq Bb5q A5q G5q | E5h. rq | Eb5q. D5e C5q G4q | A4h. C5q | D5q. F5e A5q G5q | E5h C#5h',
      coro: 'pp < $acP mp',
      kalimba: 'p R | rh D6e A5e F5q | R | rh E6e C6e A5q | R | rh C6e A5e F5q | R | rh E6e C#6e A5q',
      bajo: 'mp Eb2w | D2w | Eb2w | D2w | C2w | F2h. C2q | Bb1w | A1h A1h',
      perc: `
        lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        guiro     .... .... .... .... | .... .... x... .... | .... .... .... .... | .... .... x... ....
        rana      .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
        bongo     .... ..x. .... x... | ..x. .... ..o. x.x.
        bongoBajo x... .... ..x. .... | x... ..x. .... ....
        taco      .... .... .... ..x. | .... .... .... .... | .... .... .... ..o. | .... .... .... ....` },
    A3: { compases: 8,
      zampona: ['$melAvar', '$melA'], ocarina: { p: ['$melAvar', '$melA'], oct: -1, vol: .7 },
      cuerdas: { p: '$acA', din: 'p' }, glock: 'R | rh. A6q | R | rh. E6q | R | rh. C#6q | R | rh D6h',
      marimba: '$mar', bajo: '$bajoA',
      perc: `
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... xxxX
        $percA` },
    cola: { compases: 4,
      kalimba: '$kal', colchon: 'p (Dm9)w | (Dm9)w | (G9)w | (A7sus4)h (A7)h', bajo: 'p D2w | D2w | G2w | A1h A2h',
      arpa: { p: 'R | R | R | rh [D4 E4 F4 A4 C5 D5 E5 F5]h', arp: 'up', arpPaso: 's' },
      perc: `
        shaker    x.x. x.x. x.x. x.x. | x.x. x.x. x.x. x.xo | x.x. x.x. x.xo x.xo | x.xo xoxo xxxx xxxX
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` } },
  forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
