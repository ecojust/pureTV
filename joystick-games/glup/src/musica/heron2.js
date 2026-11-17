// GLUP — «La Garza II: el barro». Fase II: el nido roto, la Garza en el suelo (picotazos que se clavan
// en el barro, abanicos de plumas, rachas de viento). Re menor con giros frigios, 138 negras, más grave
// y más rítmica que la I. El motor es un riff de dos compases en 3+3+3+3+2+2 corcheas
//   re re re | mi♭ re re | fa re re | sol# re re | la sol# | fa mi
// en bajo, chelo y timbales, con golpes de metal en los acentos (Dm, E♭, Dm/F | E7, A7♭9, Dm): el
// motivo de la Garza escondido en el propio riff. A: el riff y el motivo en los metales graves; B, el
// picotazo: silencio tenso, un cromatismo que sube y un golpe a contratiempo, tres veces; C, las plumas:
// el motivo baja por quintas (sol, do, fa) sobre una lluvia de marimba y congas; D, la racha: el motivo
// invertido (re–mi♭–re–la♭ | sol–si–do) con escalas de violín como viento; E, atascada: a medio tiempo,
// el motivo aumentado sobre un pedal pegajoso de contrabajo, y el tirón para salir; A2 con coro;
// cola. 54 compases, 1:34.
(() => {
  const riff = `D2e! D2e D2e Eb2e! D2e D2e F2e! D2e | D2e G#2e! D2e D2e A2e! G#2e F2e! E2e`;
  const riffT = `D2e! rq Eb2e! rq F2e! re | re G#2e! rq A2e! re F2e! E2e`;
  const riffG = `(Dm)e! rq (Eb)e! rq (Dm/F)e! re | re (E7/G#)e! rq (A7b9)e! re (Dm/F)e! re`;
  // A bar that walks up in chromatic eighths from `n` (MIDI names given as a list).
  const up = notes => notes.split(' ').map(n => n + 'e').join(' ');

  Sound.cancion('heron2', {
    titulo: 'La Garza II: el barro', tempo: 138, compas: '4/4', swing: 0, tono: 'D frigio', vol: .8,
    pistas: {
      trompa:   { inst: 'trompa', vol: .56, pan: -.08, rev: .32 },
      coro:     { inst: 'coro', vol: .3, pan: .04, rev: .5 },
      violin:   { inst: 'violin', vol: .42, pan: .16, rev: .34 },
      flauta:   { inst: 'flauta', vol: .4, pan: .2, rev: .4 },
      chelo:    { inst: 'chelo', vol: .46, pan: -.2, rev: .26 },
      clarinete:{ inst: 'clarinete', vol: .36, pan: .28, rev: .3 },
      xilo:     { inst: 'xilofono', vol: .3, pan: .38, rev: .3 },
      marimba:  { inst: 'marimba', vol: .34, pan: .3, rev: .2 },
      metales:  { inst: 'metales', vol: .36, pan: .16, rev: .28, rango: 'D3-Bb4', voces: 4 },
      cuerdas:  { inst: 'cuerdas', vol: .27, rev: .45, rango: 'F3-D5', voces: 4, abierto: true },
      trem:     { inst: 'tremolo', vol: .24, pan: .24, rev: .42, rango: 'A3-F5', voces: 4 },
      golpe:    { inst: 'golpe', vol: .32, rev: .42, rango: 'D3-A4', voces: 4 },
      bajo:     { inst: 'fretless', vol: .58, rev: .05 },
      contrabajo: { inst: 'contrabajo', vol: .62, rev: .08 },
      timbal:   { inst: 'timbal', vol: .5, pan: .08, rev: .3 },
      perc:     { inst: 'bateria', vol: .62, rev: .16 } },
    temas: {
      riff, riffT, riffG,
      // Heavy groove: taiko on the riff's accents, a backbeat on the snare, a fill every fourth bar.
      percR: `
        tambor    x... ..x. .... x... | ..x. .... x... x... | x... ..x. .... x... | ..x. .... x.x. xxxx
        caja      .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... oooo ooxX
        tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..x. x...
        shaker    x.o. x.o. x.o. x.o.`,
      // The motif on the riff: on D, then on F (the tritone B–F), in the low brass.
      motR: `mf D3e C#3e D3q G#2h | A2q. F2e E2h | F3e E3e F3q B2h | C3q. A2e G#2h`,
      // D, the gust: the motif inverted, twice (D and E), with its harmony.
      inv:  `f D4e Eb4e D4q Ab3h | G3q. B3e C4h | E4e F4e E4q Bb3h | A3q. C#4e D4h`,
      acInv: `(Dm)h (Abmaj7)h | (G7)h (Cm)h | (Em7b5)h (Bb)h | (A7)h (Dm)h`,
      runs: `D4s E4s F4s G4s A4s Bb4s C5s D5s Eb5s C5s Ab4s G4s Eb4s C4s Ab3s G3s |
             G3s B3s D4s F4s G4s B4s D5s F5s G5s Eb5s C5s G4s Eb4s C4s Bb3s G3s |
             E4s G4s Bb4s D5s E5s G5s Bb5s D6s F6s D6s Bb5s F5s D5s Bb4s F4s D4s |
             A3s C#4s E4s G4s A4s C#5s E5s G5s A5s F5s D5s A4s F4s E4s D4s A3s`,
      // C, the feathers: the motif falls by fifths (G minor, C minor, F minor) and lands on A.
      pluma: `mf G5e F#5e G5q C#5h | D5q. Bb4e A4q rq | C5e B4e C5q F#4h | G4q. Eb4e D4q rq |
              F5e E5e F5q B4h | C5q. Ab4e G4q rq | Bb4e A4e Bb4e C#5e D5e E5e F5e G5e | f A5q! G5q! F5q! E5q!`,
      acP: `(Gm)h (Eb7)h | (Ebmaj7)h (D7)h | (Cm)h (Ab7)h | (Abmaj7)h (G7)h | (Fm)h (Db7)h | (Dbmaj7)h (C7)h | (Bb7#11)h (Bbmaj7)h | (A7)h (A7b9)h`,
      lluviaP: `D6s Bb5s G5s D5s D6s Bb5s G5s D5s Db6s Bb5s G5s Eb5s Db6s Bb5s G5s Eb5s | D6s Bb5s G5s Eb5s D6s Bb5s G5s Eb5s C6s A5s F#5s D5s C6s A5s F#5s D5s |
                C6s G5s Eb5s C5s C6s G5s Eb5s C5s C6s Gb5s Eb5s C5s C6s Gb5s Eb5s C5s | C6s G5s Eb5s Ab4s C6s G5s Eb5s Ab4s B5s G5s F5s D5s B5s G5s F5s D5s |
                C6s Ab5s F5s C5s C6s Ab5s F5s C5s Cb6s Ab5s F5s Db5s Cb6s Ab5s F5s Db5s | C6s Ab5s F5s Db5s C6s Ab5s F5s Db5s Bb5s G5s E5s C5s Bb5s G5s E5s C5s |
                Ab5s F5s D5s Bb4s Ab5s F5s D5s Bb4s A5s F5s D5s Bb4s A5s F5s D5s Bb4s | A5s G5s E5s C#5s A5s G5s E5s C#5s Bb5s G5s E5s C#5s Bb5s G5s E5s C#5s`,
      bajoP: `G1e G2e G1e G2e Eb2e Eb3e Eb2e Db3e | Eb2e Eb3e Eb2e Eb3e D2e D3e D2e C3e | C2e C3e C2e C3e Ab1e Ab2e Ab1e Gb2e | Ab1e Ab2e Ab1e Ab2e G1e G2e G1e F2e |
              F1e F2e F1e F2e Db2e Db3e Db2e B2e | Db2e Db3e Db2e Db3e C2e C3e C2e Bb2e | Bb1e Bb2e Bb1e Ab2e Bb1e Bb2e Bb1e A2e | A1e A2e A1e A2e A1e A2e G2e E2e` },
    secciones: {
      // ¡CRAC! The nest breaks: a hit, and the riff alone on the timpani.
      intro: { compases: 2,
        golpe:  'ff (Bb7#11)q rq rh | R',
        trem:   'rq f > (Bb7#11)h. pp | R',
        timbal: 'R | f D2e! D2e D2e Eb2e! D2e D2e F2e! A2e!',
        bajo:   'Bb1q rq rh | R',
        perc: `
          tambor    X... .... .... .... | x... ..x. .... x.x.
          caja      .... .... .... .... | .... .... oooo xxxX` },
      A: { compases: 8,
        bajo: '$riff', timbal: '$riffT',
        chelo: { p: '$riff | $riff | $motR', oct: 1 },
        metales: ['R | R | $riffG | $riffG | $riffG', 'mp $riffG | $riffG | $riffG | $riffG'],
        trompa: 'R | R | R | R | $motR',
        trem:   'R | R | R | R | pp < (Dm)w | (A7b9)w | (Dm/F)w | (E7/G#)h (A7)h mf',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percR` },
      // The stab: a held breath (tremolo, a chromatic climb, beak pecks on the xylophone) and a hit off the beat.
      B: { compases: 8,
        trem:    'pp < (Dm)w mf | (Dm)h rh | pp < (Ebmaj7#11)w mf | (Ebmaj7#11)h rh | pp < (Em7b5)w mf | (Em7b5)h rh | R | R',
        chelo:   `p < ${up('D3 Eb3 E3 F3 F#3 G3 G#3 A3')} mf | Bb3h rh | p < ${up('Eb3 E3 F3 F#3 G3 G#3 A3 Bb3')} mf | B3h rh | p < ${up('E3 F3 F#3 G3 G#3 A3 Bb3 B3')} mf | C4h rh | R | R`,
        xilo:    'rh mp D6s C#6s D6e\' rq | R | rh Eb6s D6s Eb6e\' rq | R | rh E6s D#6s E6e\' rq | R | R | R',
        golpe:   'R | f rh re (Dm)e! rq | R | rh re (Eb)e! rq | R | rh re (Em7b5)e! re (Em7b5)e! | (Bb7#11)q.! (Bb7#11)q.! (A7b9)q! | (A7b9)q.! (A7b9)q.! (A7)q!',
        timbal:  'pp < D2w% mf | R | pp < Eb2w% mf | R | pp < E2w% mf | R | R | R',
        bajo:    'p D2w | D2h re D2e! rq | Eb2w | Eb2h re Eb2e! rq | E2w | E2h re E2e! re E2e! | Bb1q.! Bb1q.! A1q! | A1q.! A1q.! A1q!',
        trompa:  'R | R | R | R | R | R | f Bb3q.! Bb3q.! A3q! | A3q.! A3q.! C#4q!',
        perc: `
          taco      x... x... x... x... | x... .... .... .... | x... x... x... x... | x... .... .... .... | x... x... x... x... | x... .... .... .... | .... .... .... .... | .... .... .... ....
          tambor    .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... ..x. ..x. | x... ..x. .... x... | x... ..x. .... x...
          platillo  .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... .... ....
          caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... x... .... x... | .... x... ooox xxxX` },
      // The feathers: a rain of marimba, congas, the motif falling through G, C and F minor on violin and flute.
      C: { compases: 8,
        violin: '$pluma', flauta: ['R | R | R | R | $pluma', '$pluma'],
        marimba: { p: '$lluviaP', din: 'mp' },
        cuerdas: { p: '$acP', din: 'p' },
        bajo: '$bajoP',
        metales: 'R | R | R | R | R | R | mf rq re (Bb7#11)e! rq (Bbmaj7)e! re | (A7)q! (A7)q! (A7b9)q! rq',
        perc: `
          tambor    x... .... .... .... | x... .... ..x. .... | x... .... .... .... | x... .... ..x. .x.x
          congaMute o.o. ..o. o.o. ..o.
          conga     .... x... .... x.x. | .... x... ..x. x... | .... x... .... x.x. | .... x... ..x. xxX.
          congaBaja x... ..x. .... .... | x... ..x. .... .... | x... ..x. .... .... | x... ..x. .... ..xX
          shaker    xoxo xoxo xoxo xoxo
          plato     x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
      // The gust: the motif upside down on the horns, violin scales blowing up and down, cymbal swells.
      D: { compases: 8,
        trompa: ['$inv | $inv', '$inv | $inv'], coro: 'R | R | R | R | mf D4e Eb4e D4q Ab3h | G3q. B3e C4h | E4e F4e E4q Bb3h | A3q. C#4e D4h',
        violin: 'mf $runs | f $runs',
        cuerdas: 'p < $acInv | mf $acInv f',
        bajo: 'D2h Ab1h | G1h C2h | E2h Bb1h | A1h D2h | D2h Ab1h | G1h C2h | E2h Bb1h | A1h D2h',
        timbal: 'D2q! rq Ab2q! rq | G2q! rq C3q! rq | E2q! rq Bb2q! rq | A2q! rq D2q! rq | D2q! rq Ab2q! rq | G2q! rq C3q! rq | E2q! rq Bb2q! rq | A2q! A2q! D2q! D2s% D2s% D2s% D2s%',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
          barrido   .... .... x... .... | .... .... x... .... | .... .... x... .... | .... .... x... ....
          tambor    x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. x.x.
          caja      .... x... .... x... | .... x... .... x..o | .... x... .... x... | .... x... .... xxxX
          shaker    x.o. x.o. x.o. x.o.` },
      // Stuck in the mud: half time, a sticky double bass on the pedal, the motif augmented, then the pull.
      E: { compases: 8,
        chelo:  'mf D3q C#3q D3h | G#2w | A2h. F2q | E2w | R | R | R | R',
        trompa: 'mp D3q C#3q D3h | G#2w | A2h. F2q | E2w | mf D4e C#4e D4q rh | Eb4e D4e Eb4q rh | E4e D#4e E4q rh | f F4e E4e F4q G#4q A4q',
        contrabajo: 'mf D2q._ Eb2e_ D2h | D2q._ Eb2e_ D2q C#2q_ | D2q._ Eb2e_ D2h | A1q._ Bb1e_ A1h | D2q D2q Eb2q Eb2q | E2q E2q F2q F2q | F#2q F#2q G2q G2q | G#2q G#2q A2q A2q',
        clarinete: 'p D3e\' re rq Eb3e\' re rq | re D3e\' rq rh | p D3e\' re rq Eb3e\' re rq | re A3e\' rq rh | R | R | R | R',
        cuerdas: 'pp (Dm)w | (Bb7#11)w | (Bbmaj7)w | (A7sus4)h (A7)h | p < (Dm)w | (Eb)w | (Em7b5)w | (A7b9)w f',
        timbal: 'D2q! rq rh | rh D2q! rq | D2q! rq rh | rh A2q! rq | D2q D2q Eb2q Eb2q | E2q E2q F2q F2q | F#2q F#2q G2q G2q | G#2e G#2e G#2e G#2e A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s%',
        perc: `
          tambor    X... .... .... .... | .... .... X... .... | X... .... .... .... | .... .... X... .... | x... .... x... .... | x... .... x... .... | x... x... x... x... | x.x. x.x. xxxx xxxX
          gota      .... .... ..3. .... | .... .3.. .... .... | .... ..3. .... .... | .... .... .... .3.. | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          rana      .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... ..x. .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          caja      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | o.o. o.o. o.o. o.o. | oooo oooo oooo oooo | xxxx xxxx xxxx xxxX
          platillo  .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
      A2: { compases: 8,
        bajo: '$riff', timbal: '$riffT', chelo: { p: '$riff', oct: 1 }, metales: '$riffG',
        trompa: 'f D3q C#3q D3h | G#2w | A2h. F2q | E2w | $motR',
        coro:   'mf D4q C#4q D4h | G#3w | A3h. F3q | E3w | f D5e C#5e D5q G#4h | A4q. F4e E4h | F5e E5e F5q B4h | C5q. A4e G#4h',
        trem: 'mp [D5 A5]w | [D5 G#5]w | [C5 A5]w | [B4 G#5]w | R | R | R | R',
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          plato     .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percR` },
      cola: { compases: 4,
        bajo: '$riff | D2q. D2q. D2q | A1q. A1q. A1q', timbal: '$riffT | D2q.! D2q.! D2q! | A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2s% A2q!',
        chelo: { p: '$riff', oct: 1 }, metales: '$riffG',
        golpe: 'R | R | f (Dm)q.! (Dm)q.! (Bb7#11)q! | (A7b9)q.! (A7b9)q.! (A7)q!',
        perc: `
          tambor    x... ..x. .... x... | ..x. .... x... x... | x... ..x. .... x... | x... ..x. .... ....
          caja      .... x... .... x... | .... x... .... x... | .... .... .... .... | .... .... oooo xxxX` } },
    forma: ['intro', 'A', 'B', 'C', 'D', 'E', 'A2', 'cola'], vuelta: 'A' });
})();
