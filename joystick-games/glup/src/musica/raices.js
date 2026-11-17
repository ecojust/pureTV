// GLUP — «El bosque de raíces». Nivel 3: trepar por las raíces de los cipreses, de pared en pared,
// donde gruñe la Tía Lapa. Sol mayor saltarín, 112 negras con semicorcheas en swing. Intro de
// marimba sola y un pájaro carpintero de madera; A (16 compases) con la zampoña sobre la marimba,
// el koto a contratiempo, el bajo sin trastes funky y los bongós en martillo, el xilófono doblando
// la segunda frase; B de la Tía Lapa (mi menor: clarinete gruñón, pizzicato de puntillas y el
// tic-tac de las cajas chinas, que se ablanda al final); C en do con la zampoña citando el tema de
// Nila y el xilófono contestando; un puente que trepa por la escala (mi, fa#, sol... mi) con todo
// creciendo; A3 un tono más arriba (la mayor) con todo; una cola que vuelve a sol. 64 compases, ~2:17.
Sound.cancion('raices', {
  titulo: 'El bosque de raíces', tempo: 112, compas: '4/4', swing: .14, tono: 'G mayor',
  eco: { tiempo: 'e.', fb: .26, tono: 2600 },
  pistas: {
    zampona: { inst: 'flautaPan', vol: .6, pan: -.06, rev: .3, eco: .12 },
    xilo:    { inst: 'xilofono', vol: .72, pan: -.3, rev: .26, eco: .1 },
    marimba: { inst: 'marimba', vol: .46, pan: .28, rev: .2, rango: 'G3-D5', voces: 4, arp: '1 4 3 1 4 3 2 4', arpPaso: 's' },
    koto:    { inst: 'koto', vol: .34, pan: -.42, rev: .22, rango: 'D4-D5', voces: 3, rasgueo: .01 },
    clar:    { inst: 'clarinete', vol: .56, pan: .06, rev: .28 },
    pizz:    { inst: 'pizzicato', vol: .85, pan: .32, rev: .24, rango: 'E3-E4', voces: 4, arp: '1 3 2 4', arpPaso: 'q' },
    cuerdas: { inst: 'cuerdas', vol: .24, rev: .45, rango: 'E3-B4', voces: 4, abierto: true },
    bajo:    { inst: 'fretless', vol: .58, rev: .05 },
    perc:    { inst: 'bateria', vol: .58, rev: .13 } },
  temas: {
    // The tune: a hop up the G chord, a bounce down, then a climb that lands on a bluesy G#;
    // the second half reaches E6, turns to C minor for a moment (iv) and ends on B7#9.
    mela: `mf re D5e G5e A5e B5q' A5e G5e | E5q G5e E5e D5q. B4e | C5e D5e E5q D5e C5e A4q | B4q. D5e G5q' G#5q |
           A5q. G5e E5e D5e C5e B4e | A4e C5e B4e A4e F#4q. A4e | B4q D5q G5e F#5e E5e D5e | E5q. D5e C5q A4q`,
    melaVar: `mf re D5e G5e A5e B5e' D6e' B5e G5e | E5q G5e E5e D5e. E5s D5e B4e | C5e D5e E5e G5e A5e G5e E5q | B4e D5e' rs D5s' F#5e G5e' F5e G#5q |
              A5q. {B5}A5e G5e E5e D5e C5e | A4e C5e D5e' C5e' A4e F#4e' A4q | B4e C5e D5e G5e' rs G5s F#5e E5e D5e | E5q. D5e C5e B4e A4q`,
    melb: `re D5e G5e A5e B5q' A5e G5e | E5q G5e A5e B5q. D6e | f E6q. D6e C6e A5e D6e' C6e | B5q. A5e G5q G#5q |
           mf A5q. G5e E5e G5e B5q | A5q. G5e Eb5q C5q | D5e F#5e A5e D6e' rq F5q`,
    melbFin: `E5q C5q B4e' D5e' D#5q`,
    melbFin3: `G5q F5e D5e C5q Bb4q`,
    acA1: `(G6)w | (Cmaj9)w | (Am9)h (D9)h | (Bm7)h (E7#9)h | (Am9)w | (D13)w | (Gmaj9)h (Em9)h | (Am9)h (D7sus4)h`,
    acA2: `(G6)w | (Cmaj9)w | (Am9)h (D9)h | (Bm7)h (E7#9)h | (Cmaj9)w | (Cm6)w | (Bm7)h (E7b9)h`,
    // The koto skanks on the off-beats.
    kotoA1: `rq (G6)e' re rq (G6)e' (G6)e' | rq (Cmaj9)e' re rq (Cmaj9)e' (Cmaj9)e' | rq (Am9)e' re rq (D9)e' (D9)e' | rq (Bm7)e' re rq (E7#9)e' (E7#9)e' |
             rq (Am9)e' re rq (Am9)e' (Am9)e' | rq (D13)e' re rq (D13)e' (D13)e' | rq (Gmaj9)e' re rq (Em9)e' (Em9)e' | rq (Am9)e' re rq (D7sus4)e' (D7sus4)e'`,
    kotoA2: `rq (G6)e' re rq (G6)e' (G6)e' | rq (Cmaj9)e' re rq (Cmaj9)e' (Cmaj9)e' | rq (Am9)e' re rq (D9)e' (D9)e' | rq (Bm7)e' re rq (E7#9)e' (E7#9)e' |
             rq (Cmaj9)e' re rq (Cmaj9)e' (Cmaj9)e' | rq (Cm6)e' re rq (Cm6)e' (Cm6)e' | rq (Bm7)e' re rq (E7b9)e' (E7b9)e'`,
    bajoA1: `mf G2e. G2s' D3e G2e' rs G2s' A2e B2e D3e | C3e. C3s' G2e C2e' rs C2s' D2e E2e G2e | A2e. A2s' E2e A2e' D2e. D2s' F#2e A2e | B2e. B2s' F#2e B2e' E2e. E2s' G#2e B2e |
             A2e. A2s' E3e A2e' rs A2s' G2e E2e C2e | D2e. D2s' A2e D3e' rs D2s' C3e B2e A2e | G2e. G2s' D3e G2e' E2e. E2s' B2e E3e | A2e. A2s' E2e A2e' D2e. D2s' C3e_ D3e`,
    bajoA2: `G2e. G2s' D3e G2e' rs G2s' A2e B2e D3e | C3e. C3s' G2e C2e' rs C2s' D2e E2e G2e | A2e. A2s' E2e A2e' D2e. D2s' F#2e A2e | B2e. B2s' F#2e B2e' E2e. E2s' G#2e B2e |
             C3e. C3s' G2e C3e' rs C3s' B2e A2e G2e | C3e. C3s' G2e Eb2e' rs C2s' Eb2e G2e A2e | B2e. B2s' F#2e B2e' E2e. E2s' G#2e B2e`,
    percA: `
      bombo     x... ..x. ..x. .... | x... ..x. ..x. .... | x... ..x. ..x. .... | x... ..x. x.x. ....
      tacoBajo  .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
      claves    x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. ....
      bongo     x.o. x.o. x.o. xoo. | x.o. x.o. x.o. xoo3 | x.o. x.o. x.o. xoo. | x.o. x.xo xxo. XXX.
      bongoBajo .... ..x. .... ..x. | .... ..x. .... ..x. | .... ..x. .... ..x. | ..x. .... ..x. ...X
      shaker    ..x. ..x. ..x. ..xo
      taco      .... .... .... .... | .... .... ..3. .... | .... .... .... .... | .... .... .... ....`,
    // Tía Lapa: E minor, grumbling staccato that softens (C lydian) and climbs to G7.
    acB: `(Em7)w | (Em7)w | (Am7)w | (B7#9)w | (Em7)w | (Cmaj7#11)w | (F#m7b5)h (B7b9)h | (Em7)h (G7)h`,
    clarB: `mf E4e' rs G4s' B4e' rs A4s G4e' F#4e' E4q | D4e. E4s G4e' E4e' B3h | A4e' rs C5s' E5e' rs D5s C5e' B4e' A4q | G4e. A4s B4e' D5e' D#4h^ |
            f E5q'! D5e' B4e' rq E5q'! | mp G5q. F#5e E5e D5e B4q | A4q. C5e B4e A4e G4e F#4e | E4q. rs E4s' G4e B4e D5e F5e`,
    bajoB: `mf E2q' rq B1q' rq | E2q' rq B1q' G1q' | A1q' rq E2q' rq | B1q' rq F#2q' D#2q' | E2q' rq B1q' rq | C2q' rq G2q' rq | F#2q' rq B1q' rq | E2q' rq G2q' G1q'`,
    // C: Nila's theme on the pan flute, the xylophone answering.
    acC: `(Cmaj9)w | (Em7)h (A7sus4)h | (Am9)w | (D9)w | (Cmaj9)w | (Am9)h (Bm7)h | (Cmaj9)h (Cm6)h | (D7sus4)h (D7b9)h`,
    zamC: `mf D5q B4e D5e E5q. D5e | B4q G4q A4h | R | R | B4q D5q G5q. F#5e | E5h. rq | R | R`,
    xiloC: `R | R | mf re A5e C6e E6e' D6e C6e A5q | F#5e A5e C6e E6e' D6q' rq | R | R | G5e B5e D6e E6e' Eb6e C6e A5q | A5e' C6e' D6e' G6e' F#6q! Eb6q`,
    kotoC: `(Cmaj9)q. (Cmaj9)e' rq (Cmaj9)e (Cmaj9)e' | (Em7)q. (Em7)e' (A7sus4)q (A7sus4)e (A7sus4)e' | (Am9)q. (Am9)e' rq (Am9)e (Am9)e' | (D9)q. (D9)e' rq (D9)e (D9)e' |
            (Cmaj9)q. (Cmaj9)e' rq (Cmaj9)e (Cmaj9)e' | (Am9)q. (Am9)e' (Bm7)q (Bm7)e (Bm7)e' | (Cmaj9)q. (Cmaj9)e' (Cm6)q (Cm6)e (Cm6)e' | (D7sus4)q. (D7sus4)e' (D7b9)q (D7b9)e (D7b9)e'`,
    bajoC: `mf C2q. G2e C3q B2q | E2q. B2e A2q. E2e | A2q. E2e A2q G2q | D2q. A2e D3q C3q | C2q. G2e C3q B2q | A2q. E2e B2q. F#2e | C2q. G2e C2q. Eb2e | D2q. A2e D2q D#2q`,
    // The climb: one step up the scale every bar, E to E.
    acP: `(Em7)w | (F#m7)w | (Gmaj7)w | (A7sus4)w | (Bm7)w | (Cmaj7#11)w | (D7sus4)w | (E7sus4)h (E7#9)h`,
    bajoP: `mp E2e' E2e' E3e' E2e' E2e' E2e' E3e' E2e' | F#2e' F#2e' F#3e' F#2e' F#2e' F#2e' F#3e' F#2e' | G2e' G2e' G3e' G2e' G2e' G2e' G3e' G2e' | A2e' A2e' A3e' A2e' A2e' A2e' A3e' A2e' |
            mf B1e' B1e' B2e' B1e' B1e' B1e' B2e' B1e' | C2e' C2e' C3e' C2e' C2e' C2e' C3e' C2e' | D2e' D2e' D3e' D2e' D2e' D2e' D3e' D2e' | f E2e' E2e' E3e' E2e' E2q'! E2q'!` },
  secciones: {
    intro: { compases: 4,
      marimba: 'p < (G6)w | (Cmaj9)w | (Am9)w | (D7sus4)h (D7)h mf',
      bajo: 'R | R | mp A2q. E2e A2q G2q | D2q. A2e D2q C3e_ D3e',
      koto: 'R | R | R | rq (D7sus4)e\' re rq (D7)e\' (D7)e\'',
      perc: `
        taco      .... .... .... .... | .... .... R... .... | .... .... .... .... | .... .... .... ....
        tacoBajo  .... .... .... .... | .... .... .... .... | .... x... .... x... | .... x... .... ....
        shaker    .... .... .... .... | .... .... .... .... | ..x. ..x. ..x. ..x. | ..x. ..x. ..xo xoxX
        bongo     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... xxo. XXX.` },
    A: { compases: 16,
      zampona: { p: ['$mela | $melb | $melbFin', '$melaVar | $melb | $melbFin'] },
      xilo: { p: 'R | R | R | R | R | R | R | R | $melb | $melbFin', oct: 1, vol: .5 },
      marimba: '$acA1 | $acA2 | (Am9)h (B7#9)h',
      koto: '$kotoA1 | $kotoA2 | rq (Am9)e\' re rq (B7#9)e\' (B7#9)e\'',
      bajo: '$bajoA1 | $bajoA2 | A2e. A2s\' E2e A2e\' B1e. B1s\' D#2e F#2e',
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        $percA` },
    B: { compases: 8,
      clar: '$clarB', pizz: 'mp $acB',
      cuerdas: 'R | R | R | R | pp < (Em7)w | (Cmaj7#11)w | (F#m7b5)h (B7b9)h | (Em7)h (G7)h mp',
      bajo: '$bajoB',
      perc: `
        taco      x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x... ..x.
        tacoBajo  .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x...
        bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x... ....
        rana      .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... ....
        guiro     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... x... ....` },
    C: { compases: 8,
      zampona: '$zamC', xilo: '$xiloC', koto: '$kotoC',
      marimba: { p: 'p $acC', arp: '1 2 3 4 3 2 1 3' },
      bajo: '$bajoC',
      perc: `
        bongo     x.o. x.o. x.o. xoo. | x.o. x.o. x.o. x.o. | x.o. x.o. x.o. xoo. | x.o. x.o. xxo. XXX.
        bongoBajo .... ..x. .... ..x. | .... ..x. .... ..x. | .... ..x. .... ..x. | .... ..x. .... ..xX
        shaker    xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxX
        tacoBajo  .... x... .... x...
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
    puente: { compases: 8,
      marimba: 'mp < $acP f', bajo: '$bajoP',
      koto: { p: 'R | R | R | R | mp (Bm7)w | (Cmaj7#11)w | (D7sus4)w | (E7sus4)h (E7#9)h', arp: '1 2 3 4 3 4 2 3', arpPaso: 'e' },
      cuerdas: 'R | R | pp < (Gmaj7)w | (A7sus4)w | (Bm7)w | (Cmaj7#11)w | (D7sus4)w | (E7sus4)h (E7#9)h f',
      zampona: 'R | R | R | R | p < B5w | C6w | D6w | E6h. rq f',
      xilo: 'R | R | R | mf rh G5s A5s B5s D6s E6s F#6s A6s B6s | R | R | R | rh E6s F#6s G#6s B6s D7q\'!',
      perc: `
        claves    x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. x... | x..x ..x. ..x. ....
        taco      x... x... x... x... | x... x... x... x... | x.x. x.x. x.x. x.x. | x.x. x.x. x.x. xxxx | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        bombo     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... x... x... x... | x... x... x... x... | x... x... x... x... | x... x... x.x. x...
        bongo     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x.o. x.o. x.o. xoo. | x.o. x.o. x.o. xoo. | xoxo xoxo xoxo xoxo | xxxx XXXX .... ....
        shaker    .... .... .... .... | .... .... .... .... | ..x. ..x. ..x. ..x. | ..x. ..x. ..x. ..x. | xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxo | xoxo xoxo xoxo xoxo | XoXo XoXo .... ....
        tom       .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... xxx. ....
        tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ...x X...` },
    A3: { compases: 16, trans: 2,
      zampona: '$melaVar | $melb | $melbFin3',
      xilo: { p: '$melaVar | $melb | $melbFin3', oct: 1, vol: .5 },
      marimba: '$acA1 | $acA2 | (C7sus4)h (C7)h',
      koto: '$kotoA1 | $kotoA2 | rq (C7sus4)e\' re rq (C7)e\' (C7)e\'',
      cuerdas: { p: '$acA1 | $acA2 | (C7sus4)h (C7)h', din: 'pp' },
      bajo: '$bajoA1 | $bajoA2 | A2e. A2s\' E2e A2e\' C2e. C2s\' G2e Bb2e',
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... xxxX
        $percA` },
    cola: { compases: 4,
      marimba: 'mf (Gmaj9)w | (Em9)w | (Am9)w | > (D7sus4)h (D7b9)h mp',
      clar: 'R | mp E4e\' rs G4s\' B4e\' rs A4s G4e\' F#4e\' E4q | R | R',
      xilo: 'R | R | mp re A5e C6e E6e\' D6e C6e A5q | R',
      bajo: 'mf G2q. D2e G2q rq | E2q. B1e E2q rq | A2q. E2e A2q rq | D2q. A2e D2q C3e_ D3e',
      perc: `
        tacoBajo  .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
        shaker    ..x. ..x. ..x. ..x. | ..x. ..x. ..x. ..x. | ..x. ..x. ..x. ..xo | xoxo xoxo xoxo xoxX
        taco      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... R... ....
        bongo     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... xxo. XXX.` } },
  forma: ['intro', 'A', 'B', 'C', 'puente', 'A3', 'cola'], vuelta: 'A' });
