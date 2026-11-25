// GLUP — «La Garza III: la furia». Fase III, el último empujón: ojos rojos, sube el agua, doble picado.
// Re menor, 152 negras y todo a doble tiempo (pizzicato en semicorcheas 3+3+2, caja, bajo en octavas).
// Aquí el motivo de la Garza (re–do#–re–sol# | la–fa–mi) se pelea con el tema de Nila:
//   A  la furia: el motivo de la fase I a doble tiempo, con gritos de violín en cada nota larga.
//   B  Nila resiste: la cabeza de su tema en la trompa, en menor, y debajo el motivo de la Garza en el
//      chelo, a la vez (encajan: Dm B♭7 | B♭maj7 A7); su respuesta termina en la dominante.
//   A2 la furia con coro.
//   C  contraataque: el motivo sube por tonos (re, mi, fa#) y en cada tono la cabeza de Nila le contesta;
//      do#7 → do7: la puerta a fa mayor.
//   D  Nila gana terreno: su tema entero en fa mayor (el relativo mayor), de héroe; fa → si7 (la tritona).
//   E  último asalto, un tono arriba (mi menor): el motivo disminuido en remolino contra la cabeza de
//      Nila en el coro, y una subida ♭VI–♭VII hacia...
//   F  el triunfo: el tema de Nila en RE MAYOR, y el motivo de la Garza vuelto lidio (el sol# ya no
//      asusta, brilla) en los metales graves; campanas.
//   cola: el grito otra vez, y vuelta a la furia (la pelea sigue hasta que caiga). 62 compases, 1:38.
(() => {
  const oct = n => n.replace(/(-?\d)$/, d => +d + 1);
  // Half a bar of sixteenths in 3+3+2 on a chord given as 'root fifth top'.
  const S = c => { const [r, f, o] = c.split(' '); return `${r}s! ${f}s ${o}s ${r}s! ${f}s ${o}s ${r}s! ${f}s`; };
  const SS = (a, b) => S(a) + ' ' + S(b || a);
  // Half a bar of octave eighths in the bass.
  const B = r => `${r}e ${oct(r)}e ${r}e ${oct(r)}e`;
  const BB = (a, b) => B(a) + ' ' + B(b || a);

  const ch = {
    Dm: 'D3 A3 D4', Bb7: 'Bb2 F3 Ab3', Bbmaj7: 'Bb2 F3 A3', A7: 'A2 E3 G3', Gm: 'G2 D3 G3', Eb7: 'Eb3 Bb3 Db4', Ebmaj7: 'Eb3 Bb3 D4',
    D7: 'D3 A3 C4', DmF: 'F3 A3 D4', G7B: 'B2 F3 G3', Am: 'A2 E3 A3', E7G: 'G#2 E3 D4', Gm7: 'G2 D3 F3', A7s: 'A2 E3 D4', A7b9: 'A2 G3 Bb3',
    Em: 'E3 B3 E4', C7: 'C3 G3 Bb3', Cmaj7: 'C3 G3 B3', B7: 'B2 F#3 A3', Fsm: 'F#3 C#4 F#4', Dmaj7: 'D3 A3 C#4', Cs7: 'C#3 G#3 B3', C7s: 'C3 G3 F4',
    F: 'F2 C3 F3', Dm7: 'D3 A3 C4', FA: 'A2 F3 C4', Bb: 'Bb2 F3 D4', Am7: 'A2 E3 G3', EbD: 'D3 G3 Bb3', Bb7D: 'D3 Ab3 E4', CBb: 'Bb2 E3 G3', Ab: 'Ab2 Eb3 C4',
    D: 'D3 A3 D4', Bm7: 'B2 F#3 A3', Gmaj7: 'G2 D3 F#3', DFs: 'F#2 D3 A3', Em7: 'E3 B3 D4', Fsm7: 'F#2 C#3 E3' };

  Sound.cancion('heron3', {
    titulo: 'La Garza III: la furia', tempo: 152, compas: '4/4', swing: 0, tono: 'D menor', vol: .84,
    pistas: {
      trompa:  { inst: 'trompa', vol: .58, pan: -.06, rev: .32 },
      coro:    { inst: 'coro', vol: .32, pan: .02, rev: .5, rango: 'A3-E5', voces: 4, abierto: true },
      canto:   { inst: 'coro', vol: .34, pan: -.02, rev: .48 },
      violin:  { inst: 'violin', vol: .42, pan: .16, rev: .32 },
      flauta:  { inst: 'flauta', vol: .42, pan: .2, rev: .38 },
      chelo:   { inst: 'chelo', vol: .46, pan: -.22, rev: .26 },
      pizz:    { inst: 'pizzicato', vol: .42, pan: -.3, rev: .18 },
      marimba: { inst: 'marimba', vol: .32, pan: .34, rev: .18, oct: 1 },
      metales: { inst: 'metales', vol: .38, pan: .18, rev: .28, rango: 'F3-C5', voces: 4 },
      graves:  { inst: 'metales', vol: .4, pan: -.1, rev: .26 },
      cuerdas: { inst: 'cuerdas', vol: .26, rev: .45, rango: 'F3-D5', voces: 4, abierto: true },
      arpa:    { inst: 'arpa', vol: .34, pan: -.38, rev: .4, rango: 'D3-A4', voces: 4, arp: 'up', arpPaso: 's', arpOct: 2 },
      campana: { inst: 'campana', vol: .24, pan: .3, rev: .55 },
      glock:   { inst: 'glock', vol: .18, pan: .42, rev: .42 },
      golpe:   { inst: 'golpe', vol: .32, rev: .42, rango: 'D3-A4', voces: 4 },
      bajo:    { inst: 'fretless', vol: .56, rev: .05 },
      timbal:  { inst: 'timbal', vol: .48, pan: .08, rev: .3 },
      perc:    { inst: 'bateria', vol: .6, rev: .15 } },
    temas: {
      melA: `mf D4e C#4e D4q G#3h | A3q. F3e E3h | G4e F#4e G4q C#4h | D4q. Bb3e A3h |
             F4e E4e F4q B3h | C4q. A3e G#3h | A3e Bb3e C4e D4e E4q D4q | f C#4h. rq`,
      acA: `(Dm)h (Bb7)h | (Bbmaj7)h (A7)h | (Gm)h (Eb7)h | (Ebmaj7)h (D7)h | (Dm/F)h (G7/B)h | (Am)h (E7/G#)h | (Gm7)h (A7sus4)h | (A7)h (A7b9)h`,
      ostA: [SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7), SS(ch.Gm, ch.Eb7), SS(ch.Ebmaj7, ch.D7), SS(ch.DmF, ch.G7B), SS(ch.Am, ch.E7G), SS(ch.Gm7, ch.A7s), SS(ch.A7, ch.A7b9)].join(' | '),
      bajoA: [BB('D2', 'Bb1'), BB('Bb1', 'A1'), BB('G1', 'Eb2'), BB('Eb2', 'D2'), BB('F2', 'B1'), BB('A1', 'G#1'), BB('G1', 'A1'), 'A1e A2e A1e A2e A1s A1s A1s A1s A2q'].join(' | '),
      // Screams: the violin fills every long note of the theme with a run on the chord.
      gritos: `rh Ab5s Bb5s C6s D6s F6s D6s C6s Bb5s | rh E5s F5s G5s A5s C#6s A5s G5s E5s | rh Db6s Eb6s F6s G6s Bb6s G6s F6s Eb6s | rh D6s C6s A5s F#5s D5s F#5s A5s C6s |
               rh B5s D6s F6s D6s B5s G5s F5s D5s | rh G#5s B5s D6s E6s D6s B5s G#5s E5s | rh A5s D6s E6s G6s E6s D6s A5s G5s | rh E5s G5s Bb5s C#6s E6s G6s Bb6s C#7s`,
      percF: `
        tambor    x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x.x. xxxx
        caja      .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | .oo. x.oo .oo. x.o. | .oo. x.oo oooo xxxX
        shaker    xoxo xoxo xoxo xoxo`,
      // Nila's theme and its answer.
      nila: `mf C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
             Bb4q. A4e G4q A4e Bb4e | C5q A4q F4h | G4e A4e Bb4q D5q C5q | F4w`,
      // In minor it bends: F# for F in the answer, and it stops on the dominant.
      nilaMenor: `mf C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
                  Bb4q. A4e G4q A4e Bb4e | C5q A4q F#4h | G4e A4e Bb4q D5q C5q | F4h E4h`,
      garza2: `D3e C#3e D3q G#2h | A2q. F2e E2h`,
      percN: `
        tambor    x... ..x. .... x... | x... ..x. .... x... | x... ..x. .... x... | x... ..x. x.x. x...
        caja      .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .o.o xxxX
        shaker    x.o. x.o. x.o. x.o.`,
      percM: `
        tambor    x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. x.x.
        caja      x.xx x.x. x.xx x.x. | x.xx x.x. x.xx x.x. | x.xx x.x. x.xx x.x. | x.xx x.xx xxxx xxxX
        pandereta .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x...
        shaker    xoxo xoxo xoxo xoxo`,
      nilaRe: `f A4q F#4e A4e B4q. A4e | F#4q D4q E4h | F#4q A4q D5q. C#5e | B4h. rq |
               G4q. F#4e E4q F#4e G4e | A4q F#4q D4h | E4e F#4e G4q B4q A4q | D4w` },
    secciones: {
      // Rage: the scream chord (the tritone D–G#), timpani, and the sixteenths start.
      intro: { compases: 4,
        golpe:  'ff (Bb7#11)q rq rh | R | R | R',
        coro:   'f > (Bb7#11)w | (Bb7#11)h. mp rq | R | R',
        timbal: 'R | pp < D2w% f | D2e! D2e D2e A2e! D2e D2e A2e! D2e | D2e D2e A2e A2e D2s% D2s% D2s% D2s% A2q!',
        pizz:   `R | R | mp < ${SS(ch.Dm, ch.Dm)} | ${SS(ch.Bb7D, ch.A7)} f`,
        bajo:   'Bb1q rq rh | R | D2e D2e D2e D2e D2e D2e D2e D2e | Bb1e Bb1e Bb1e Bb1e A1e A1e A1e A1e',
        perc: `
          tambor    X... .... .... .... | .... .... .... .... | x... ..x. x... ..x. | x..x ..x. x.x. xxxx
          caja      .... .... .... .... | .... .... .... .... | .... .... oooo oooo | xxxx xxxx xxxx xxxX` },
      A: { compases: 8,
        trompa: '$melA', metales: { p: '$melA', vol: .8 }, violin: '$gritos',
        coro: 'mp < $acA f', pizz: '$ostA', bajo: '$bajoA',
        timbal: 'D2q! rq Bb2q! rq | Bb2q! rq A2q! rq | G2q! rq Eb2q! rq | Eb2q! rq D2q! rq | F2q! rq B2q! rq | A2q! rq G#2q! rq | G2q! rq A2q! rq | A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2q! A2q!',
        perc: `
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percF` },
      // Nila holds on: her theme in minor on the horn, the heron's motif under it on the cello.
      B: { compases: 8,
        trompa: '$nilaMenor',
        chelo:  { p: '$garza2 | $garza2 | G3e F#3e G3q C#3h | D3q. Bb2e A2h | $garza2', din: 'mf' },
        cuerdas: 'p (Dm)h (Bb7)h | (Bbmaj7)h (A7)h | (Dm)h (Bb7)h | (Bbmaj7)h (A7sus4)h | (Gm)h (Eb7)h | (Ebmaj7)h (D7)h | (Dm)h (Bb7)h | (Bbmaj7)h (A7)h',
        pizz:   [SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7), SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7s), SS(ch.Gm, ch.Eb7), SS(ch.Ebmaj7, ch.D7), SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7)].join(' | '),
        bajo:   [BB('D2', 'Bb1'), BB('Bb1', 'A1'), BB('D2', 'Bb1'), BB('Bb1', 'A1'), BB('G1', 'Eb2'), BB('Eb2', 'D2'), BB('D2', 'Bb1'), BB('Bb1', 'A1')].join(' | '),
        flauta: ['R | R | R | R | R | R | R | R', 'R | R | R | rh. mp F5e G5e | A5w | Bb5h. A5q | G5h F5h | E5w'],
        perc: `
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percN` },
      A2: { compases: 8,
        trompa: '$melA', canto: { p: '$melA', oct: 1 }, violin: '$gritos', metales: { p: '$acA', din: 'mf' },
        pizz: '$ostA', marimba: { p: '$ostA', din: 'p' }, bajo: '$bajoA', cuerdas: { p: '$acA', din: 'mp' },
        timbal: 'D2q! rq Bb2q! rq | Bb2q! rq A2q! rq | G2q! rq Eb2q! rq | Eb2q! rq D2q! rq | F2q! rq B2q! rq | A2q! rq G#2q! rq | G2q! rq A2q! rq | A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2q! A2q!',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percF` },
      // The heron strikes back, a tone higher each time (D, E, F#); each time Nila's head answers.
      C: { compases: 8,
        trompa: 'f D4e C#4e D4q G#3h | A3q. F3e E3h | E4e D#4e E4q A#3h | B3q. G3e F#3h | F#4e F4e F#4q C4h | C#4q. A3e G#3h | ff C4w | C4q.! C4q.! C4q!',
        canto:  'R | R | R | R | R | R | f G4e A4e Bb4e C5e D5e E5e F5e G5e | Bb5q.! Bb5q.! Bb5q!',
        violin: 'f C6q A5e C6e D6q. C6e | A5q F5q G5h | D6q B5e D6e E6q. D6e | B5q G5q A5h | E6q C#6e E6e F#6q. E6e | C#6q A5q B5h | ff G5s A5s Bb5s C6s D6s E6s F6s G6s A6s Bb6s C7s Bb6s A6s G6s F6s E6s | Bb6q.! Bb6q.! Bb6q!',
        metales: 'mf (Dm)h (Bb7)h | (Bbmaj7)h (A7)h | (Em)h (C7)h | (Cmaj7)h (B7)h | (F#m)h (D7)h | (Dmaj7)h (C#7)h | f (C7sus4)w | (C7)q.! (C7)q.! (C7)q!',
        pizz:   [SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7), SS(ch.Em, ch.C7), SS(ch.Cmaj7, ch.B7), SS(ch.Fsm, ch.D7), SS(ch.Dmaj7, ch.Cs7), SS(ch.C7s, ch.C7s), SS(ch.C7, ch.C7)].join(' | '),
        bajo:   [BB('D2', 'Bb1'), BB('Bb1', 'A1'), BB('E2', 'C2'), BB('C2', 'B1'), BB('F#2', 'D2'), BB('D2', 'C#2'), BB('C2', 'C2'), 'C2q. C2q. C2q'].join(' | '),
        timbal: 'D2q! rq Bb2q! rq | Bb2q! rq A2q! rq | E2q! rq C3q! rq | C3q! rq B2q! rq | F#2q! rq D2q! rq | D2q! rq C#3q! rq | C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% C3s% | C3q.! C3q.! C3q!',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... ....
          tambor    x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x... x... x... x... | X... ..X. .... X...
          caja      .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | oooo oooo xxxx xxxx | .... .... .... ....
          shaker    xoxo xoxo xoxo xoxo` },
      // Nila gains ground: her whole theme in F major, heroic.
      D: { compases: 8,
        trompa: '$nila', violin: { p: '$nila', oct: 1 },
        coro:   'mf (F)h (Dm7)h | (Bbmaj7)h (C7)h | (F/A)h (Bb)h | (Gm7)h (C7)h | (Gm7)h (C7)h | (Am7)h (Dm7)h | (Gm7)h (C7)h | f (F)h (B7)h',
        chelo:  'mf A3h C4h | D4h Bb3h | C4h D4h | F4h E4h | D4h Bb3h | C4h A3h | Bb3h E4h | F4h D#4h',
        pizz:   [SS(ch.F, ch.Dm7), SS(ch.Bbmaj7, ch.C7), SS(ch.FA, ch.Bb), SS(ch.Gm7, ch.C7), SS(ch.Gm7, ch.C7), SS(ch.Am7, ch.Dm7), SS(ch.Gm7, ch.C7), SS(ch.F, ch.B7)].join(' | '),
        bajo:   [BB('F1', 'D2'), BB('Bb1', 'C2'), BB('A1', 'Bb1'), BB('G1', 'C2'), BB('G1', 'C2'), BB('A1', 'D2'), BB('G1', 'C2'), BB('F1', 'B1')].join(' | '),
        glock:  'R | R | rh. F6q | R | R | rh. F6q | R | C6h rh',
        golpe:  'R | R | R | R | R | R | R | rh ff (B7)q! (B7)q!',
        perc: `
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percM` },
      // The last assault, a tone up (E minor): the motif shrunk to a whirl against Nila's head in the
      // choir, then the motif itself, then ♭VI–♭VII (C, D) climbing into D major.
      E: { compases: 8, trans: 2,
        violin: `mf ${'D5s C#5s D5s G#4s A4s F4s E4s rs '.repeat(2)} | ${'D5s C#5s D5s G#4s A4s F4s E4s rs '.repeat(2)} | ${'D5s C#5s D5s G#4s A4s F4s E4s rs '.repeat(2)} | ${'D5s C#5s D5s G#4s A4s F4s E4s rs '.repeat(2)} |
                 f ${'D6s C#6s D6s G#5s '.repeat(2)} ${'D6s C6s Ab5s F5s '.repeat(2)} | ${'Bb5s A5s F5s D5s '.repeat(2)} ${'C#6s A5s G5s E5s '.repeat(2)} | ff Bb4e C5e D5e F5e E5e F5e G5e A5e | C6h D6h`,
        canto:  'f C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq | D5e C#5e D5q G#4h | A4q. F4e E4h | ff D5q. Bb4e E5q. C5e | Eb5h F5h',
        trompa: 'mf C4q A3e C4e D4q. C4e | A3q F3q G3h | A3q C4q F4q. E4e | D4h. rq | f D4e C#4e D4q G#3h | A3q. F3e E3h | ff F3q. D3e G3q. E3e | Ab3h Bb3h',
        cuerdas: 'mp (Dm)w | (Eb/D)w | (Dm)w | (Bb7#11/D)w | f (Dm)h (Bb7)h | (Bbmaj7)h (A7)h | ff (Bb)h (C/Bb)h | (Ab)h (Bb)h',
        pizz:   [SS(ch.Dm), SS(ch.EbD), SS(ch.Dm), SS(ch.Bb7D), SS(ch.Dm, ch.Bb7), SS(ch.Bbmaj7, ch.A7), SS(ch.Bb, ch.CBb), SS(ch.Ab, ch.Bb)].join(' | '),
        bajo:   [BB('D2'), BB('D2'), BB('D2'), BB('D2'), BB('D2', 'Bb1'), BB('Bb1', 'A1'), BB('Bb1', 'Bb1'), BB('Ab1', 'Bb1')].join(' | '),
        timbal: 'D2e D2e D2e D2e D2e D2e D2e D2e | % | % | D2s% D2s% D2s% D2s% D2s% D2s% D2s% D2s% D2e D2e A2e A2e | D2q! rq Bb2q! rq | Bb2q! rq A2q! rq | Bb2q! rq C3q! rq | Ab2q! Ab2q! Bb2s% Bb2s% Bb2s% Bb2s% Bb2s% Bb2s% Bb2s% Bb2s%',
        perc: `
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | x... .... x... .... | .... .... .... ....
          tambor    x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | x..x ..x. x.x. xxxx | x..x ..x. x..x ..x. | x..x ..x. x..x ..x. | X... ..X. X... ..X. | X... X... XxXx XXXX
          caja      .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | .oo. x.oo .oo. x.o. | .oo. x.oo oooo xxxX | .oo. x.oo .oo. x.o. | .oo. x.oo .oo. x.oo | x.x. x.x. x.x. x.x. | xxxx xxxx xxxx xxxX
          shaker    xoxo xoxo xoxo xoxo
          platillo  .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
      // Triumph: Nila's theme in D major; the heron's motif turned Lydian (G# is now bright) in the low brass.
      F: { compases: 8,
        trompa: '$nilaRe', violin: { p: '$nilaRe', oct: 1 }, canto: { p: 'R | R | R | R | $nilaRe', oct: 1, din: 'f' },
        graves: 'f D3e C#3e D3q G#2h | A2q. F#2e E2h | D3e C#3e D3q G#2h | A2q. F#2e E2h | R | R | R | R',
        coro:   'mf (D)h (Bm7)h | (Gmaj7)h (A7)h | (D/F#)h (E7/G#)h | (Em7)h (A7)h | f (Em7)h (A7)h | (F#m7)h (Bm7)h | (Em7)h (A7)h | ff (D)w',
        arpa:   'mf (D)h (Bm7)h | (Gmaj7)h (A7)h | (D/F#)h (E7/G#)h | (Em7)h (A7)h | (Em7)h (A7)h | (F#m7)h (Bm7)h | (Em7)h (A7)h | (Dmaj9)w',
        pizz:   [SS(ch.D, ch.Bm7), SS(ch.Gmaj7, ch.A7), SS(ch.DFs, ch.E7G), SS(ch.Em7, ch.A7), SS(ch.Em7, ch.A7), SS(ch.Fsm7, ch.Bm7), SS(ch.Em7, ch.A7), SS(ch.D, ch.D)].join(' | '),
        bajo:   [BB('D2', 'B1'), BB('G1', 'A1'), BB('F#1', 'G#1'), BB('E2', 'A1'), BB('E2', 'A1'), BB('F#1', 'B1'), BB('E2', 'A1'), 'D2q. D2e D2q D2q'].join(' | '),
        campana: 'mf D5h rh | R | R | R | A4h rh | R | R | f D5w',
        glock:  'R | rh. A6q | R | rh B6h | R | rh. A6q | R | D7h rh',
        timbal: 'D2q! rq A2q! rq | D2q! rq A2q! rq | D2q! rq G#2q! rq | E2q! rq A2q! rq | E2q! rq A2q! rq | F#2q! rq B2q! rq | E2q! rq A2e A2e A2e A2e | D2w%',
        perc: `
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... ....
          $percM` },
      // She is not done: the scream chord again, and back to the rage.
      cola: { compases: 2,
        golpe:  'ff (Bb7#11)q rq rh | R',
        coro:   'f > (Bb7#11)w | (A7b9)h. mp rq',
        bajo:   'Bb1q rq rh | A1e A1e A1e A1e A1e A1e A1e A1e',
        timbal: 'R | p < A2w% f',
        perc: `
          tambor    X... .... .... .... | x..x ..x. x.x. xxxx
          caja      .... .... .... .... | oooo oooo xxxx xxxX` } },
    forma: ['intro', 'A', 'B', 'A2', 'C', 'D', 'E', 'F', 'cola'], vuelta: 'A' });
})();
