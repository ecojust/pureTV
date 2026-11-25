// GLUP — «La Garza I: el vuelo». Fase I del jefe (planea, suelta piedras, se lanza en picado) y el
// picado de la intro. Re menor, 132 negras. Un ostinato de pizzicato en 3+3+2 que dibuja los acordes,
// bajo sin trastes con latido de puntillo, tambores grandes y el motivo de la Garza en la trompa:
//   re–do#–re–sol# (la tritona, sobre un B♭7) | la–fa–mi (B♭maj7 → A7)
// A lo expone y lo secuencia una cuarta arriba; A2 lo varía en el violín con el chelo en notas guía y
// golpes de metal; B es el picado (el motivo disminuido en remolino de semicorcheas sube por semitonos
// y cae en arpegios, con el motivo en la dominante); C planea: el chelo canta el motivo lento y la
// flauta responde con la cabeza del tema de Nila; D cerca: el motivo aumentado baja mientras el bajo
// sube (re–mi–fa–sol#–la–si♭–do#); A3 lo da todo con coro; la cola golpea en 3+3+2. 56 compases, 1:42.
(() => {
  // One bar of the 3+3+2 ostinato: four eighths on the first chord, four on the second, accents on 1, 4 and 7.
  const O = (a, b) => { const [r, f, o] = a.split(' '), [r2, f2, o2] = (b || a).split(' ');
    return `${r}e! ${f}e ${o}e ${f}e! ${r2}e ${f2}e ${o2}e! ${f2}e`; };
  // Brass stabs on the ostinato's accents ('and' of 2, beat 4).
  const G = (a, b) => `rq re (${a})e! rq (${b || a})e! re`;
  // The heartbeat bass: dotted quarter + eighth, twice.
  const L = (a, b) => `${a}q. ${a}e ${b || a}q. ${b || a}e`;

  Sound.cancion('heron', {
    titulo: 'La Garza I: el vuelo', tempo: 132, compas: '4/4', swing: 0, tono: 'D menor', vol: .92,
    pistas: {
      trompa:  { inst: 'trompa', vol: .56, pan: -.06, rev: .34 },
      coro:    { inst: 'coro', vol: .3, pan: .04, rev: .5 },
      violin:  { inst: 'violin', vol: .44, pan: .14, rev: .34 },
      flauta:  { inst: 'flauta', vol: .46, pan: .16, rev: .42 },
      chelo:   { inst: 'chelo', vol: .44, pan: -.22, rev: .3 },
      pizz:    { inst: 'pizzicato', vol: .48, pan: -.3, rev: .2 },
      marimba: { inst: 'marimba', vol: .34, pan: .34, rev: .18, oct: 1 },
      metales: { inst: 'metales', vol: .34, pan: .2, rev: .3, rango: 'F3-C5', voces: 4 },
      cuerdas: { inst: 'cuerdas', vol: .27, rev: .45, rango: 'F3-D5', voces: 4, abierto: true },
      trem:    { inst: 'tremolo', vol: .24, pan: .26, rev: .42 },
      arpa:    { inst: 'arpa', vol: .36, pan: -.38, rev: .42, rango: 'D3-A4', voces: 4, arp: 'updown', arpPaso: 'e', arpOct: 2 },
      bajo:    { inst: 'fretless', vol: .6, rev: .05 },
      timbal:  { inst: 'timbal', vol: .48, pan: .08, rev: .3 },
      golpe:   { inst: 'golpe', vol: .3, rev: .42, rango: 'D3-A4', voces: 4 },
      perc:    { inst: 'bateria', vol: .62, rev: .16 } },
    temas: {
      // The theme: the motif, its sequence a fourth up, then on F (the tritone now B–F over G7) and a
      // climb to the leading tone.
      melA: `mf D4e C#4e D4q G#3h | A3q. F3e E3h | G4e F#4e G4q C#4h | D4q. Bb3e A3h |
             F4e E4e F4q B3h | C4q. A3e G#3h | A3e Bb3e C4e D4e E4q D4q | f C#4h. rq`,
      melAvar: `mf D5e C#5e D5e F5e G#4h | A4e Bb4e C5e A4e E4h | G5e F#5e G5e Bb5e C#5h | D5e E5e F5e D5e A4h |
                F5e E5e F5e A5e B4h | C5e D5e E5e C5e G#4h | A4e Bb4e C5e D5e E5e F5e G5e F5e | f E5q! D5q C#5h`,
      acA: `(Dm)h (Bb7)h | (Bbmaj7)h (A7)h | (Gm)h (Eb7)h | (Ebmaj7)h (D7)h | (Dm/F)h (G7/B)h | (Am)h (E7/G#)h | (Gm7)h (A7sus4)h | (A7)h (A7b9)h`,
      // The cello walks the guide tones (thirds and sevenths) under it.
      guia: `mp F3h Ab3h | A3h G3h | Bb3h Db4h | D4h C4h | A3h B3h | C4h D4h | D4h E4h | C#4h G4h`,
      ostA: `${O('D3 A3 D4', 'Bb2 F3 Ab3')} | ${O('Bb2 F3 A3', 'A2 E3 G3')} | ${O('G2 D3 G3', 'Eb3 Bb3 Db4')} | ${O('Eb3 Bb3 D4', 'D3 A3 C4')} |
             ${O('F3 A3 D4', 'B2 F3 G3')} | ${O('A2 E3 A3', 'G#2 E3 D4')} | ${O('G2 D3 F3', 'A2 E3 D4')} | ${O('A2 E3 C#4', 'A2 G3 Bb3')}`,
      bajoA: `${L('D2', 'Bb1')} | ${L('Bb1', 'A1')} | ${L('G1', 'Eb2')} | ${L('Eb2', 'D2')} | ${L('F2', 'B1')} | ${L('A1', 'G#1')} | ${L('G1', 'A1')} | A1q. A1e A1q C#2e_ A1e`,
      golpesA: `${G('Dm', 'Bb7')} | ${G('Bbmaj7', 'A7')} | ${G('Gm', 'Eb7')} | ${G('Ebmaj7', 'D7')} | ${G('Dm/F', 'G7/B')} | ${G('Am', 'E7/G#')} | ${G('Gm7', 'A7sus4')} | (A7)q! (A7)q! (A7b9)q! rq`,
      golpesD: `${G('Am')} | ${G('Bb')} | ${G('A7/C#')} | (A7)q! (A7)q! (A7)q! rq`,
      timbA: `D2q! rq rq D2q | Bb2q! rq A2q rq | G2q! rq rq Eb2q | Eb2q! rq D2q rq | F2q! rq rq B2q | A2q! rq rq G#2q | G2q! rq A2q rq | A2e A2e A2q A2s% A2s% A2s% A2s% A2q!`,
      // Taiko on the 3+3+2 accents, fills every fourth bar.
      percA: `
        tambor    x... ..x. .... x... | x... ..x. .... x... | x... ..x. .... x... | x... ..x. .... ....
        tom       .... .... .... .... | .... .... .... ...3 | .... .... .... .... | .... .... x.x. ....
        tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... x.xX
        shaker    x.o. x.o. x.o. x.o.
        caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..oo oo..`,
      percFull: `
        tambor    X... ..x. .... x... | x... ..x. .... x... | x... ..x. .... x... | X... ..x. .... ....
        bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... .... ....
        tom       .... .... ..3. .... | .... .... .... ..x. | .... .... ..3. .... | .... .... x.x. x...
        tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .x.. x.xX
        shaker    x.o. x.o. x.o. x.oo
        caja      .... x... .... x... | .... x... .... x..o | .... x... .... x... | .... x... oooo xxxX
        plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
    secciones: {
      // The shriek, a hit, and the ostinato creeping in.
      intro: { compases: 4,
        golpe:  'ff (Dm)q rq rh | R | R | R',
        pizz:   `R | p < ${O('D3 A3 D4', 'D3 A3 C#4')} | ${O('Bb2 F3 D4', 'Bb2 F3 Ab3')} | ${O('A2 E3 C#4', 'A2 E3 G3')} mf`,
        bajo:   `D1q rq rh | ${L('D2')} | ${L('Bb1')} | ${L('A1')}`,
        trem:   'R | pp < [D4 A4]w | [D4 Bb4]w | [C#4 E4 A4]h [C#4 G4 A4]h mf',
        timbal: 'R | R | R | p < A2w% f',
        perc: `
          tambor    .... .... .... .... | x... .... .... .... | x... ..x. .... .... | x... ..x. .... x...
          caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ooox xxxX
          platillo  .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
      A: { compases: 8,
        trompa: '$melA', violin: { p: '$melA', oct: 1, vol: .6 }, pizz: '$ostA', bajo: '$bajoA',
        cuerdas: { p: '$acA', din: 'pp' },
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percA` },
      A2: { compases: 8,
        violin: ['$melAvar', { p: '$melA', oct: 1 }], chelo: '$guia',
        trompa: 'R | rh. mp A3e B3e | R | rh. D4e E4e | R | rh. C4e B3e | R | rh A3h',
        pizz: '$ostA', marimba: { p: '$ostA', din: 'p' }, bajo: '$bajoA', metales: { p: '$golpesA', din: 'mp' },
        cuerdas: { p: '$acA', din: 'pp' },
        perc: '$percA' },
      // The dive: the motif shrunk to a whirl of sixteenths climbs by semitones (D, E♭, E, F), then
      // everything falls in arpeggios while horns and choir cry the motif on the dominant and home.
      B: { compases: 8,
        violin: `mf ${'D5s C#5s D5s G#4s '.repeat(4)} | ${'Eb5s D5s Eb5s A4s '.repeat(4)} | ${'E5s D#5s E5s A#4s '.repeat(4)} | f ${'F5s E5s F5s B4s '.repeat(4)} |
                 ff A5h! Eb6s C6s A5s F5s Eb5s C5s A4s F4s | E5h! D6s B5s G#5s E5s D5s B4s G#4s E4s | D5h! Ab5s F5s D5s Bb4s Ab4s F4s D4s Bb3s | A4h. rq`,
        trem:   'p < (Dmadd9)w | (Ebmaj7#11)w | (E7#11)w | (Fmaj7#11)w f | R | R | R | R',
        trompa: 'p < A3w | Bb3w | B3w | C4w f | ff A4e G#4e A4q D#4h | E4q. C4e B3h | D4e C#4e D4q G#3h | A3q. F3e E3h',
        coro:   'R | R | pp < E4w | F4w mf | f A4e G#4e A4q D#4h | E4q. C4e B3h | D4e C#4e D4q G#3h | A3q. F3e E3h',
        golpe:  'R | R | R | R | ff (Am)q rq rh | R | (Dm)q rq rh | R',
        pizz:   `R | R | R | R | ${O('A2 E3 A3', 'F2 C3 Eb3')} | ${O('F2 C3 E3', 'E2 B2 D3')} | ${O('D3 A3 D4', 'Bb2 F3 Ab3')} | ${O('Bb2 F3 A3', 'A2 E3 G3')}`,
        bajo:   `${L('D2')} | ${L('Eb2')} | ${L('E2')} | ${L('F2')} | ${L('A1', 'F1')} | ${L('F1', 'E1')} | ${L('D2', 'Bb1')} | ${L('Bb1', 'A1')}`,
        timbal: 'R | R | R | mf < F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% F2s% ff | R | R | R | A2q! A2q! A2q! rq',
        perc: `
          tambor    x... x... x... x... | x... x... x... x.x. | x.x. x.x. x.x. x.x. | xxxx xxxx xxxx xxxX | X... ..x. .... x... | x... ..x. .... x... | X... ..x. .... x... | x... ..x. x.x. xxxx
          caja      .... .... .... .... | .... .... .... .... | o.o. o.o. o.o. o.o. | oooo oooo xxxx xxxX | .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
          shaker    .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x.o. x.o. x.o. x.o. | x.o. x.o. x.o. x.o. | x.o. x.o. x.o. x.o. | x.o. x.o. x.o. x.o.
          platillo  .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
      // She glides: the cello sings the motif slowly and the flute answers with the head of Nila's theme.
      C: { compases: 8,
        chelo:  ['mp D4q. C#4e D4h | G#3h A3h | Bb3q. A3e G3q F3q | E3w | R | R | R | R', 'mp D4q. C#4e D4h | G#3h A3h | Bb3q. A3e G3q F3q | E3h. F3e G3e | A3w | Bb3h C4h | A3h D4h | D4h C#4h'],
        flauta: ['R | R | R | rh. mp A4q | C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h C#5h',
                 'R | R | R | rh. mp A4q | C5q A4e C5e D5q. {E5}C5e | A4q F4q G4q. A4e | Bb4q C5q F5q. E5e | D5h C#5h'],
        arpa:   'mp (Dmadd9)w | (Bb7#11)h (Bbmaj7)h | (Gm9)w | (A7sus4)h (A7)h | (Dm7)w | (Bbmaj7)h (C)h | (F/A)h (Dm7)h | (Gm7)h (A7b9)h',
        cuerdas: 'pp (Dmadd9)w | (Bb7#11)h (Bbmaj7)h | (Gm9)w | (A7sus4)h (A7)h | (Dm7)w | (Bbmaj7)h (C)h | (F/A)h (Dm7)h | (Gm7)h (A7b9)h',
        bajo:   'mp D2w | Bb1w | G1w | A1w | D2w | Bb1h C2h | A1h D2h | G1h A1h',
        timbal: 'pp D2q. D2e rh | R | pp D2q. D2e rh | R | pp D2q. D2e rh | R | pp D2q. D2e rh | p A2q. A2e rh',
        perc: `
          tambor    o... .... .... .... | .... .... .... .... | o... .... .... .... | .... .... .... .... | o... .... .... .... | .... .... .... .... | o... .... .... .... | .... .... o... o...
          shaker    .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x.o. | .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... x.o. x.oo` },
      // Closing in: the motif augmented falls from the top while the bass climbs to meet it.
      D: { compases: 8,
        coro:    'p < D5w | C#5w | D5w | G#4w | mf A4w | F4w | E4w | f E4w',
        violin:  'R | R | R | R | mf < A5w | Bb5w | A5h C#6h | f A4s B4s C#5s D5s E5s F5s G5s A5s Bb5s C#6s D6s E6s F6s G6s A6s rs',
        cuerdas: 'p < (Dm)w | (A/E)w | (Dm/F)w | (E7/G#)w | (Am)w | (Bb)w | (A7/C#)w | (A7)w f',
        trompa:  'rh mp D4e C#4e D4q | rh E4e D#4e E4q | rh F4e E4e F4q | rh G#4e G4e G#4q | mf rh A4e G#4e A4q | rh Bb4e A4e Bb4q | f rh E4e D#4e E4q | A4q! A4q! A4q! rq',
        pizz:    `${O('D3 A3 D4')} | ${O('E3 A3 C#4')} | ${O('F3 A3 D4')} | ${O('G#2 E3 B3')} | ${O('A2 E3 C4')} | ${O('Bb2 F3 D4')} | ${O('C#3 A3 E4')} | ${O('A2 E3 C#4', 'A2 E3 G3')}`,
        marimba: { p: `${O('D3 A3 D4')} | ${O('E3 A3 C#4')} | ${O('F3 A3 D4')} | ${O('G#2 E3 B3')} | ${O('A2 E3 C4')} | ${O('Bb2 F3 D4')} | ${O('C#3 A3 E4')} | ${O('A2 E3 C#4', 'A2 E3 G3')}`, din: 'p' },
        metales: 'R | R | R | R | mp $golpesD',
        bajo:    `${L('D2')} | ${L('E2')} | ${L('F2')} | ${L('G#1')} | ${L('A1')} | ${L('Bb1')} | ${L('C#2')} | A1q. A1e A1q. A1e`,
        timbal:  'p < D2q D2q D2q D2e D2e | E2q E2q E2q E2e E2e | F2q F2q F2q F2e F2e | G#2q G#2q G#2q G#2e G#2e | A2q A2q A2q A2e A2e | Bb2q Bb2q Bb2q Bb2e Bb2e | C#3q C#3q C#3q C#3e C#3e | A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2q! ff',
        perc: `
          tambor    x... ..x. .... x... | x... ..x. .... x... | x... ..x. .... x... | x... ..x. .... x.x. | x... ..x. x... x... | x... ..x. x... x.x. | x.x. x.x. x.x. x.x. | x... .... .... ....
          caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | o.o. o.o. oooo oooo | xxxx xxxx xxxx xxxX
          tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..x. x.x.` },
      A3: { compases: 8,
        trompa: ['$melA', '$melA'], coro: { p: '$melA', oct: 1 }, chelo: '$guia',
        violin: ['R | R | R | R | mf D6h. C#6q | C6h. B5q | C6h B5h | A5h. rq', '$melAvar'],
        pizz: '$ostA', marimba: '$ostA', bajo: '$bajoA', metales: '$golpesA', timbal: '$timbA',
        cuerdas: { p: '$acA', din: 'p' },
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percFull` },
      // Hits in 3+3+2 and the timpani alone, back to A.
      cola: { compases: 4,
        golpe:  'f (Dm)q.! (Dm)q.! (Dm)q! | (Bb7)q.! (Bb7)q.! (A7)q! | R | R',
        bajo:   'D2q. D2q. D2q | Bb1q. Bb1q. A1q | R | rh. A1q',
        timbal: 'R | R | f D2e D2e A2e D2e D2e A2e D2e A2e | D2e D2e A2e D2e A2s% A2s% A2s% A2s% A2q!',
        pizz:   `R | R | mp ${O('D3 A3 D4', 'D3 A3 C#4')} | < ${O('D3 G#3 D4', 'A2 E3 C#4')} f`,
        perc: `
          tambor    X... ..X. .... X... | X... ..X. .... X... | x... .... x... .... | x... ..x. .... ....
          caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | ..oo ooxx xxxx xxxX
          tomBajo   .... .... .... .... | .... .... .... .... | .... ..x. .... ..x. | .... .... x.x. ....` } },
    forma: ['intro', 'A', 'A2', 'B', 'C', 'D', 'A3', 'cola'], vuelta: 'A' });
})();
