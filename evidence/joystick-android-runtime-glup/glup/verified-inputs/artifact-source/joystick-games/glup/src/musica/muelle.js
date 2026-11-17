// GLUP — «El muelle del pescador». Nivel 5: el muelle viejo de Don Anselmo, pipa en la boca, al
// atardecer. Swing de café con aire de saloma, sol mayor, 116 negras, corcheas en swing, en forma
// de canción (AABA). Intro: la guitarra en pompe, el contrabajo y Don Anselmo que silba para
// calentar; A (16) con el acordeón y el clarinete que le contesta en los huecos; B (puente) con la
// armónica y sus bends; A2 con el clarinete; un «chorus» en el que el silbido cita el tema de Nila
// y el banjo contesta de cuatro en cuatro sobre el bajo caminando y el ride; B2 con el clarinete y
// el acordeón a contratiempo, que acaba con el motivo de la Garza en el grave (la vio pasar esta
// mañana); A3 con todo y el silbido doblando; una cola de café que vuelve a A. 80 compases, ~2:46.
Sound.cancion('muelle', {
  titulo: 'El muelle del pescador', tempo: 116, compas: '4/4', swing: .3, swingEn: 'e', tono: 'G mayor', vol: 1.3,
  eco: { tiempo: 'q', fb: .18, tono: 2400 },
  pistas: {
    acordeon: { inst: 'acordeon', vol: .5, pan: -.04, rev: .26 },
    fuelle:   { inst: 'acordeon', vol: .22, pan: .3, rev: .3, rango: 'G3-E5', voces: 3 },
    clar:     { inst: 'clarinete', vol: .55, pan: .16, rev: .3 },
    armonica: { inst: 'armonica', vol: .54, pan: -.1, rev: .3, eco: .08 },
    silbido:  { inst: 'silbido', vol: .6, pan: .06, rev: .34, eco: .12 },
    banjo:    { inst: 'banjo', vol: 1.1, pan: .36, rev: .2 },
    guitarra: { inst: 'guitarra', vol: .3, pan: -.4, rev: .18, rango: 'G3-D5', voces: 4, rasgueo: .012 },
    bajo:     { inst: 'contrabajo', vol: .92, rev: .07 },
    perc:     { inst: 'bateria', vol: .55, rev: .14 } },
  temas: {
    // The tune: a jaunty turn around the G chord that hops to a cheeky G#, and in the second half
    // the flat seventh, the minor iv (Cm6) of a sigh, and home.
    melA1: `mf D5q B4e G4e A4e B4e D5q | E5q. D5e G#4h | A4e B4e C5e E5e G5q E5q | F#5q. E5e D5h |
            D5q B4e G4e A4e B4e D5q | G5q. F#5e E5e D5e B4q | C#5q E5q G5q. F#5e | E5q. C5e A4q rq`,
    melA2: `D5q B4e G4e A4e B4e D5q | F5q. E5e D5h | E5e F5e G5e A5e G5q E5q | Eb5q. D5e C5h |
            B4q D5q G5q. E5e | D5q B4q G#4h | A4e B4e C5e E5e D5e C5e A4e F#4e | G4h. rq`,
    melA1var: `mf D5q {C5}B4e G4e A4e B4e D5q | E5q. D5e G#4q B4q | A4e B4e C5e E5e A5q G5q | F#5e G5e F#5e E5e D5h |
               D5q {C5}B4e G4e A4e B4e D5q | G5q. F#5e E5e F#5e G5e B5e | A5q G5q E5q. C#5e | E5q. C5e A4q rq`,
    melA2var: `D5q B4e G4e A4e B4e D5q | F5q. E5e D5h | E5e F5e G5e A5e G5q E5q | Eb5q. D5e C5h |
               B4e C5e D5e E5e G5q. E5e | D5q B4q G#4h | A4e B4e C5e E5e D5e C5e A4e F#4e | G4q' rq G5q'! rq`,
    // The clarinet answers in the holes of the tune.
    cnt1: `R | rh B4e D5e F5e E5e | R | rh A4e C5e F#5e A5e | R | R | R | rh rq C5e B4e`,
    cnt2: `R | rh B4e A4e G4e F4e | R | rh A4e G4e Eb4e C4e | R | rh B3e D4e E4e D4e | R | rh D4e E4e F4e F#4e`,
    pompeA1: `(G6)q' (G6)q'! (G6)q' (G6)q'! | (E7)q' (E7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (Am7)q' (Am7)q'! | (D7)q' (D7)q'! (D7)q' (D7)q'! |
              (G6)q' (G6)q'! (G6)q' (G6)q'! | (Em7)q' (Em7)q'! (Em7)q' (Em7)q'! | (A7)q' (A7)q'! (A7)q' (A7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'!`,
    pompeA2: `(G6)q' (G6)q'! (G6)q' (G6)q'! | (G7)q' (G7)q'! (G7)q' (G7)q'! | (C6)q' (C6)q'! (C6)q' (C6)q'! | (Cm6)q' (Cm6)q'! (Cm6)q' (Cm6)q'! |
              (G6/D)q' (G6/D)q'! (G6/D)q' (G6/D)q'! | (E7)q' (E7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'! | (G6)q' (G6)q'! (G6)q' (G6)q'!`,
    acA1: `(G6)w | (E7)w | (Am7)w | (D7)w | (G6)w | (Em7)w | (A7)w | (Am7)h (D7)h`,
    acA2: `(G6)w | (G7)w | (C6)w | (Cm6)w | (G6/D)w | (E7)w | (Am7)h (D7)h | (G6)w`,
    bajoA1: `mf G2h D2h | E2h B1h | A2h E2h | D2h A1h | G2h D2h | E2h B1h | A2h E2h | A2h D2h`,
    bajoA2: `G2h D2h | G2h F2h | C2h G1h | C2h Eb2h | D2h A1h | E2h B1h | A2h D2h | G2h D2q D#2q`,
    // Walking (the chorus and A3).
    walk1: `mf G2q B2q D3q E3q | E2q G2q A2q E2q | C2q E2q E2q G2q | A1q C2q D2q F#2q |
            G2q B2q D3q D#3q | E3q D3q B2q G#2q | A2q C3q E2q G2q | D2q F#2q A2q F#2q`,
    walk2: `G2q B2q D3q B2q | G2q F2q D2q B1q | C2q E2q G2q A2q | C3q A2q G2q Eb2q |
            D2q B1q E2q G#2q | A2q C3q D3q F#2q | G2q B2q E2q G#2q | A2q E2q D2q F#2q`,
    walkA1: `mf G2q B2q D3q E3q | E2q G#2q B2q D3q | A2q C3q E2q G2q | D2q F#2q A2q C3q |
             G2q B2q D3q B2q | E2q G2q B2q D3q | A2q C#3q E2q G2q | A2q C3q D2q F#2q`,
    walkA2: `G2q B2q D3q B2q | G2q F2q D2q B1q | C2q E2q G2q A2q | C3q A2q G2q Eb2q |
             D2q B1q A1q B1q | E2q D2q B1q G#1q | A1q C2q D2q F#2q | G2q D2q G1q rq`,
    percA: `
      barrido   x....... | x....... | x....... | x.......
      escobilla ..x...x. | ..x...x. | ..x...x. | ..x..ox.
      hat       ..x...x.
      bombo     x...o... | x....... | x...o... | x.....x.`,
    percS: `
      ride      x.xxx.xx | x.xxx.xx | x.xxx.xx | x.xxx.x3
      hat       ..x...x.
      escobilla ..o...x. | ..o...x3 | ..o...x. | ..o.x.xo
      bombo     x....... | ....o... | x....... | ......x.`,
    // Bridge: B7 → E7... the harmonica leans on the thirds with bends.
    acB: `(B7)w | (B7)w | (Em7)w | (Em7)w | (A7)w | (A7)w | (Am7)w | (D7)w`,
    pompeB6: `(B7)q' (B7)q'! (B7)q' (B7)q'! | (B7)q' (B7)q'! (B7)q' (B7)q'! | (Em7)q' (Em7)q'! (Em7)q' (Em7)q'! | (Em7)q' (Em7)q'! (Em7)q' (Em7)q'! |
             (A7)q' (A7)q'! (A7)q' (A7)q'! | (A7)q' (A7)q'! (A7)q' (A7)q'!`,
    armB: `mf rq D#5e F#5e A5q. F#5e | B5q^ A5e F#5e D#5h | rq B4e D5e E5q. G5e | F#5q E5e D5e B4h |
           rq C#5e E5e G5q. E5e | A5q^ G5e E5e C#5h | C5q E5q G5q A5q | F#5q. E5e D5q C5q`,
    bajoB: `mf B1h F#2h | B1q D#2q F#2q A2q | E2h B1h | E2q G2q B2q D3q | A1h E2h | A1q C#2q E2q G2q | A2h E2h | D2q F#2q A2q C3q`,
    // Chorus: Don Anselmo whistles Nila's theme; the banjo answers.
    acS: `(G6)w | (Em7)h (A7sus4)h | (Cmaj7)h (Em7)h | (Am7)h (D7)h | (G6)w | (E7)w | (Am7)w | (D7)w |
          (G6)w | (G7)w | (C6)w | (Cm6)w | (Bm7)h (E7)h | (Am7)h (D7)h | (G6)h (E7)h | (Am7)h (D7)h`,
    pompeS: `(G6)q' (G6)q'! (G6)q' (G6)q'! | (Em7)q' (Em7)q'! (A7sus4)q' (A7sus4)q'! | (Cmaj7)q' (Cmaj7)q'! (Em7)q' (Em7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'! |
             (G6)q' (G6)q'! (G6)q' (G6)q'! | (E7)q' (E7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (Am7)q' (Am7)q'! | (D7)q' (D7)q'! (D7)q' (D7)q'! |
             (G6)q' (G6)q'! (G6)q' (G6)q'! | (G7)q' (G7)q'! (G7)q' (G7)q'! | (C6)q' (C6)q'! (C6)q' (C6)q'! | (Cm6)q' (Cm6)q'! (Cm6)q' (Cm6)q'! |
             (Bm7)q' (Bm7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'! | (G6)q' (G6)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'!`,
    silS: `mf D6q B5e D6e E6q. D6e | B5q G5q A5h | B5q D6q G6q. F#6e | E6h. rq | R | R | R | R |
           G5q B5q D6q. B5e | F6q. E6e D6h | E6e F6e G6e A6e G6q E6q | Eb6q. D6e C6h | R | R | R | R`,
    banS: `R | R | R | R | mf rq B4e D5e G5e' D5e' B4e' G4e' | G#4e B4e D5e E5e' rq F5e E5e | A4e C5e E5e G5e' rq E5q' | F#5e' E5e' D5e' C5e' A4q' rq |
           R | R | R | R | B4e D5e F#5e' A5e' G#5e E5e D5e B4e | C5e E5e G5e' A5e' F#5e D5e C5e A4e | B4e D5e G5e' B5e' G#5q' rq | A5e' G5e' E5e' C5e' D5q' rq`,
    // B2: the clarinet takes the bridge; at the end, low, the Heron's motif (she flew by this morning).
    clarB2: `mf rq D#5e F#5e A5q. F#5e | B5q A5e F#5e D#5h | rq B4e D5e E5q. G5e | F#5q E5e D5e B4h |
             rq C#5e E5e G5q. E5e | A5q G5e E5e C#5h | mp D4e C#4e D4q G#3h | A3q. F3e E3h`,
    vampB2: `re (B7)e' re (B7)e' re (B7)e' re (B7)e' | re (B7)e' re (B7)e' re (B7)e' re (B7)e' | re (Em7)e' re (Em7)e' re (Em7)e' re (Em7)e' | re (Em7)e' re (Em7)e' re (Em7)e' re (Em7)e' |
             re (A7)e' re (A7)e' re (A7)e' re (A7)e' | re (A7)e' re (A7)e' re (A7)e' re (A7)e' | (E7b9)w | (D7#9)w`,
    bajoB2: `mf B1q D#2q F#2q A2q | B2q A2q F#2q D#2q | E2q G2q B2q D3q | E3q D3q B2q G2q | A1q C#2q E2q G2q | A2q G2q E2q C#2q | p E2w | D2w` },
  secciones: {
    intro: { compases: 4,
      guitarra: `(G6)q' (G6)q'! (G6)q' (G6)q'! | (E7)q' (E7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (Am7)q' (Am7)q'! | (D7)q' (D7)q'! (D7)q' (D7)q'!`,
      bajo: 'R | mp E2h B1h | A2h E2h | D2h A1q C2q',
      silbido: 'R | R | mp rh rq D6e_ E6e | F#6q. E6e D6q C6q',
      perc: `
        tacoBajo  .x.x.... | ........ | ........ | ........
        escobilla ........ | ..o...o. | ..x...x. | ..x.xox.
        barrido   ........ | ........ | x....... | x.......` },
    A: { compases: 16,
      acordeon: ['$melA1 | $melA2', '$melA1var | $melA2'], clar: '$cnt1 | $cnt2',
      guitarra: '$pompeA1 | $pompeA2', bajo: '$bajoA1 | $bajoA2',
      perc: '$percA' },
    B: { compases: 8,
      armonica: '$armB', guitarra: `$pompeB6 | (Am7)q' (Am7)q'! (Am7)q' (Am7)q'! | (D7)q' (D7)q'! (D7)q' (D7)q'!`, bajo: '$bajoB', fuelle: { p: 'pp $acB', vol: .9 },
      perc: `
        barrido   x....... | x....... | x....... | x.......
        escobilla ..x...x. | ..x...x. | ..x...x. | ..x.xxx.
        hat       ..x...x.
        bombo     x...o... | x....... | x...o... | x.......
        triangulo x....... | ........ | ........ | ........ | ........ | ........ | ........ | ........` },
    A2: { compases: 8,
      clar: ['$melA2', '$melA2var'], acordeon: { p: '$cnt2', vol: .8 },
      guitarra: '$pompeA2', bajo: '$bajoA2', fuelle: { p: 'pp $acA2', vol: .8 },
      perc: `
        pandereta ..x...x. | ..x...x. | ..x...x. | ..x.x.xX
        $percA` },
    solo: { compases: 16,
      silbido: '$silS', banjo: '$banS', guitarra: '$pompeS', bajo: '$walk1 | $walk2',
      fuelle: { p: 'pp $acS', vol: 1 },
      perc: `
        platillo  x....... | ........ | ........ | ........ | ........ | ........ | ........ | ........
        $percS` },
    B2: { compases: 8,
      clar: '$clarB2', fuelle: { p: 'mp $vampB2', vol: 1.3 }, guitarra: { p: `$pompeB6 | (E7b9)q'! rq rh | (D7#9)q'! rq rh`, vol: .8 }, bajo: '$bajoB2',
      banjo: 'R | R | R | R | R | R | R | rh rq pp D5e\' D5e\'',
      perc: `
        escobilla ..x...x. | ..x...x. | ..x...x. | ..x...x. | ..x...x. | ..x.x.x. | ........ | ........
        barrido   x....... | ........ | x....... | ........ | x....... | ........ | x....... | ........
        hat       ..x...x. | ..x...x. | ..x...x. | ..x...x. | ..x...x. | ..x...x. | ........ | ........
        tomBajo   ........ | ........ | ........ | ........ | ........ | ........ | x....... | ........
        rana      ........ | ........ | ........ | ........ | ........ | ........ | ........ | ....x...
        taco      ........ | ........ | ........ | ........ | ........ | ........ | ........ | ......xX` },
    A3: { compases: 16,
      acordeon: ['$melA1var | $melA2var', '$melA1 | $melA2var'], clar: '$cnt1 | $cnt2',
      silbido: { p: 'R | R | R | R | R | R | R | R | $melA2var', oct: 1, vol: .8 },
      banjo: { p: '$pompeA1 | $pompeA2', rango: 'G4-D5', voces: 3, vol: .3, rasgueo: .01 },
      guitarra: '$pompeA1 | $pompeA2', bajo: '$walkA1 | $walkA2',
      perc: `
        platillo  x....... | ........ | ........ | ........
        pandereta ..x...x. | ..x...x. | ..x...x. | ..x.x.xX
        $percA` },
    cola: { compases: 4,
      acordeon: 'mp B4q. A4e G4q E4q | G#4q B4q D5q. C5e | A4e C5e E5e G5e F#5q D5q | G5h D5h',
      fuelle: { p: 'p (G6)w | (E7)w | (Am7)h (D7)h | (G6)h (D7)h', vol: 1.2 },
      guitarra: `(G6)q' (G6)q'! (G6)q' (G6)q'! | (E7)q' (E7)q'! (E7)q' (E7)q'! | (Am7)q' (Am7)q'! (D7)q' (D7)q'! | (G6)q' (G6)q'! (D7)q' (D7)q'!`,
      bajo: 'mp G2h D2h | E2h B1h | A2h D2h | G2h D2q C2q',
      perc: `
        escobilla ..x...x. | ..x...x. | ..x...x. | ..x.xox.
        tacoBajo  ........ | ........ | ........ | ....x.x.
        barrido   x....... | ........ | x....... | ........` } },
  forma: ['intro', 'A', 'B', 'A2', 'solo', 'B2', 'A3', 'cola'], vuelta: 'A' });
