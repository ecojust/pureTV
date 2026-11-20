// GLUP — «El río subterráneo». Nivel 8: el agua corre a oscuras hacia el ciprés muerto; es el último
// tramo antes del nido. Re mayor con el sol# lidio, 12/8 de barcarola (negra con puntillo = 84). Intro
// de arpa y coro «ooh»; A con la flauta sobre el arpa que corre, bajo sin trastes y percusión que
// arrastra los pies; A2 con la zampoña del pantano, el vibráfono en semicorcheas y un chelo que
// contesta; B, la decisión: la trompa canta el tema de Nila y Bigotes y el último re se tiñe de si♭;
// un puente en re menor donde el sol# lidio se vuelve el tritono de la Garza (su motivo en el chelo
// grave, timbal y tambor lejos) mientras el arpa sigue corriendo; A3 un tono arriba, en mi mayor,
// con flauta, violín, coro y trompa; cola que baja otra vez a re y vuelve a A. 48 compases, ~2:17.
{
  const compases = s => s.split('|').map(b => b.trim().split(/\s+/));
  const acordes = s => compases(s).map(([a, b]) => b ? `(${a})h. (${b})h.` : `(${a})w.`).join(' | ');
  const A = 'Dmaj9 | Dmaj7#11 | Bm9 | Gmaj9 | Em9 | F#m7 B7b9 | Gmaj9 Gm6 | A7sus4 A7';
  const B = 'D69 | Bm9 | Gmaj9 | Em9 | Em9 | Dmaj9 | Em9 A13 | Bbmaj7#11';
  const P = 'Dm G#dim7 | Bbmaj7#11 A7b9 | Em A#dim7 | Cmaj7#11 B7 | Dm G#dim7 | Bbmaj7#11 A7b9 | Gmaj9 Cmaj7 | B7sus4 B7b9';

  Sound.cancion('rio', {
    titulo: 'El río subterráneo', tempo: 126, compas: '12/8', tono: 'D lidio',
    eco: { tiempo: 'q', fb: .32, tono: 2800 },
    pistas: {
      flauta:  { inst: 'flauta', vol: .56, pan: -.06, rev: .38, eco: .12 },
      zampona: { inst: 'flautaPan', vol: .6, pan: -.1, rev: .36, eco: .16 },
      violin:  { inst: 'violin', vol: .4, pan: .16, rev: .4 },
      trompa:  { inst: 'trompa', vol: .46, pan: .14, rev: .4 },
      chelo:   { inst: 'chelo', vol: .42, pan: .22, rev: .4 },
      arpa:    { inst: 'arpa', vol: .44, pan: -.34, rev: .38, rango: 'D3-A4', voces: 4, arp: 'updown', arpPaso: 'e', arpOct: 2 },
      vibra:   { inst: 'vibrafono', vol: .3, pan: .32, rev: .42, eco: .24, rango: 'D4-A5', voces: 4, arp: 'up', arpPaso: 's', arpOct: 1 },
      glock:   { inst: 'glock', vol: .18, pan: .45, rev: .45, eco: .22 },
      cuerdas: { inst: 'cuerdas', vol: .28, rev: .48, rango: 'F#3-D5', voces: 4, abierto: true },
      tremolo: { inst: 'tremolo', vol: .26, rev: .5, rango: 'D3-A4', voces: 3 },
      coro:    { inst: 'coroU', vol: .3, rev: .52, rango: 'D4-E5', voces: 3 },
      timbal:  { inst: 'timbal', vol: .42, rev: .4 },
      bajo:    { inst: 'fretless', vol: .7, rev: .07 },
      perc:    { inst: 'bateria', vol: .56, rev: .16 } },
    temas: {
      // The tune: three steps and a leap that floats (the river's lilt), the lydian G♯, a borrowed
      // G minor sixth for the ache, and a half cadence that keeps the boat moving.
      melA: `mf F#5q. E5q D5e A5h. | G#5q. A5q G#5e E5h. | D5q. C#5q B4e F#5h. | E5q. F#5q A5e B5q. A5q. |
             G5q. F#5q E5e B4q. D5q E5e | F#5q. E5q C#5e D#5q. C5q. | B4q. D5q F#5e E5h. | D5q. E5q D5e C#5h.`,
      melAvar: `mf F#5q. E5q D5e A5q. B5q A5e | G#5q. A5q B5e E5h. | D5q. C#5q B4e F#5q. E5q D5e | E5q. F#5q A5e f D6h. |
                mf C#6q. B5q A5e G5q. F#5q E5e | F#5q. E5q C#5e D#5q. F#5q. | G5q. F#5q D5e E5h. | E5h. C#5h.`,
      contra: `mp A3h. F#3h. | G#3h. E3h. | F#3h. A3h. | B3h. A3h. | G3h. B3h. | A3h. D#3h. | D3h. E3h. | D3h. C#3h.`,
      bajoA: `D2q. A2q. D3q. A2q. | D2q. A2q. E3q. C#3q. | B1q. F#2q. B2q. A2q. | G1q. D2q. A2q. B2q. |
              E2q. B2q. D3q. B2q. | F#2q. C#3q. B1q. D#2q. | G1q. D2q. G1q. E2q. | A1q. E2q. A2q. C#2q.`,
      acA: acordes(A), acB: acordes(B), acP: acordes(P),
      // Brushes and shaker that shuffle in threes, congas that push the last eighth of a beat.
      percA: `
        bombo     x.. ... x.. ... | x.. ... x.. ..x | x.. ... x.. ... | x.. ..x x.. x.x
        shaker    xoo Xoo xoo Xoo | xoo Xoo xoo Xoo | xoo Xoo xoo Xoo | xoo Xoo xoX XoX
        escobilla ... x.. ... x.. | ... x.. ... x.. | ... x.. ... x.. | ... x.. ... ...
        conga     ... ..x ... ..x | ... ... ... .x3 | ... ..x ... ..x | ... .x. .xx xX.
        congaBaja ... x.. ... ... | ... x.. ... ... | ... x.. ... ... | ... x.. ..x ..X
        congaMute ..o ... ..o ... | ..o ... ..o ... | ..o ... ..o ... | ..o ... ... ...
        triangulo x.. ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ...` },
    secciones: {
      intro: { compases: 4,
        arpa: { p: 'p < (Dmaj9)w. | (Dmaj7#11)w. | (Bm9)w. | mf (A7sus4)w.' },
        coro: 'pp < (Dmaj9)w. | (Dmaj7#11)w. | (Bm9)w. | mp (A7sus4)h. (A7)h.',
        vibra: { p: 'R | rh. rq. pp G#5q. | R | rh. rq. C#6q.', arp: null },
        bajo: 'R | R | p B1w. | A1h. A1q. C#2q.',
        perc: `
          gota      ... ..x ... ... | ... ... x.. ... | ..x ... ... ... | ... ... ... ...
          shaker    ... ... ... ... | ... ... ... ... | x.. x.. x.. x.. | xoo xoo xoo XoX` },
      A: { compases: 8,
        flauta: ['$melA', '$melAvar'],
        arpa: '$acA', bajo: '$bajoA', coro: { p: '$acA', din: 'pp' },
        glock: 'R | rh. rq. pp G#6q. | R | rh. rq. B6q. | R | R | R | rh. rq. C#7q.',
        perc: `
          platillo  x.. ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ...
          $percA` },
      A2: { compases: 8,
        zampona: '$melAvar', chelo: '$contra',
        arpa: { p: '$acA', din: 'mp' }, vibra: { p: '$acA', din: 'pp' }, bajo: '$bajoA', cuerdas: { p: '$acA', din: 'pp' },
        perc: `
          pandereta ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... x.X
          $percA` },
      // Resolve: the horn sings Nila and Bigotes' theme (in D, in the lilt of the river); the flute
      // floats above; on the last bar the home D turns into the #11 of B♭, and the shadow comes in.
      B: { compases: 8,
        trompa: `mf A4q. F#4q A4e B4q.~ B4q A4e | F#4q. D4q. E4h. | F#4q. A4q. D5q.~ D5q C#5e | B4h. rh. |
                 G4q. F#4q E4e F#4q. G4q. | A4q. F#4q. D4h. | E4q F#4e G4q. B4q. A4q. | p D4w.`,
        flauta: `R | mp F#5h. C#6h. | B5h. A5h. | G5q. F#5q. E5h. | B5h. rh. | A5h. F#5h. | G5h. F#5h. | p E5w.`,
        cuerdas: 'p < $acB mf', arpa: '$acB',
        bajo: `D2q. A2q. D3q. A2q. | B1q. F#2q. B2q. F#2q. | G1q. D2q. A2q. B2q. | E2q. B2q. G2q. B2q. |
               E2q. B2q. E3q. B2q. | D2q. A2q. F#2q. A2q. | E2q. B2q. A1q. C#2q. | Bb1w.`,
        perc: `
          bombo     x.. ..x x.. ... | x.. ..x x.. ... | x.. ..x x.. ... | x.. ..x x.x x.x | x.. ..x x.. ... | x.. ..x x.. ... | x.. ..x x.. x.. | x.. ... ... ...
          shaker    xoo Xoo xoo Xoo | xoo Xoo xoo Xoo | xoo Xoo xoo Xoo | xoo Xoo xoo XoX | xoo Xoo xoo Xoo | xoo Xoo xoo Xoo | xoo Xoo xoX XoX | x.. ... ... ...
          pandereta ... x.. ... x.. | ... x.. ... x.. | ... x.. ... x.. | ... x.. ... xxX | ... x.. ... x.. | ... x.. ... x.. | ... x.. ... x.x | ... ... ... ...
          congaBaja ... ... ... ..x | ... ... ... ..x | ... ... ... ..x | ... ... .xx xxX | ... ... ... ..x | ... ... ... ..x | ... ... ..x xxX | ... ... ... ...` },
      // The heron's shadow: D minor, her motif (D C♯ D G♯ · A F E) low in the cello, the river still running.
      puente: { compases: 8,
        chelo: `mf D3q C#3e D3q. G#2h. | A2q.~ A2q F2e E2h. | E3q D#3e E3q. A#2h. | B2q.~ B2q G2e F#2h. | R | R | R | R`,
        trompa: 'R | R | R | R | p D3q C#3e D3q. G#2h. | A2q.~ A2q F2e E2h. | R | R',
        tremolo: 'pp $acP',
        arpa: { p: 'p $acP', vol: .8 },
        flauta: 'R | R | R | R | R | R | p < B4q. D5q. G5q. B5q. | A5h. mf B5h.',
        bajo: `p D2w. | Bb1h. A1h. | E2w. | C2h. B1h. | D2w. | Bb1h. A1h. | G1h. C2h. | B1h. B1h.`,
        timbal: 'pp D2w.% | R | pp E2w.% | R | p D2h. rh. | A2h.% rh. | R | p < F#2h.% B2h.% mf',
        perc: `
          tambor    x.. ... ... ... | ... ... ... ... | x.. ... ... ... | ... ... ... ... | x.. ... ... ... | ... ... x.. ... | ... ... ... ... | ... ... ... ...
          gota      ... ..x ... ... | ... ... ... x.. | ... ... ..x ... | ... ... ... ... | ... ..x ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ...
          shaker    ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | x.. x.. x.. x.. | xoo xoo xoo XoX
          congaBaja ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ... | ... ... .xx xxX` },
      // A step higher, in E: everyone, the tune in flute and violin, the horn underneath.
      A3: { compases: 8, trans: 2,
        flauta: '$melA', violin: { p: '$melA', oct: -1 },
        trompa: { p: '$contra', oct: 1, vol: .8 },
        arpa: '$acA', cuerdas: { p: '$acA', din: 'p' }, coro: { p: '$acA', din: 'p' }, bajo: '$bajoA',
        glock: 'R | rh. rq. p G#6q. | R | rh. rq. B6q. | R | R | R | rh. rq. C#7q.',
        perc: `
          platillo  x.. ... ... ... | ... ... ... ... | ... ... ... ... | ... ... ... ...
          pandereta ... x.. ... x.. | ... x.. ... x.. | ... x.. ... x.. | ... x.. ... xxX
          $percA` },
      // Back down to D, the harp alone with the river.
      cola: { compases: 4,
        arpa: 'mp (Dmaj9)w. | (Gmaj9)w. | (Em9)w. | p (A7sus4)h. (A7)h.',
        coro: 'p (Dmaj9)w. | (Gmaj9)w. | (Em9)w. | (A7sus4)h. (A7)h.',
        flauta: 'p F#5q. E5q D5e A5h. | R | pp G5q. F#5q E5e B4h. | R',
        bajo: 'p D2w. | G1w. | E2w. | A1h. A1q. C#2q.',
        perc: `
          shaker    xoo xoo xoo xoo | xoo xoo xoo xoo | x.. x.. x.. x.. | xoo xoo xoo XoX
          gota      ... ..x ... ... | ... ... x.. ... | ... ... ... ... | ... ... ... ...` } },
    forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
}
