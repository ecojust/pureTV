// GLUP — «Los juncos». Nivel 2: de noche entre juncos altos, donde Lumi, la luciérnaga vieja,
// enciende los farolillos. Vals de jazz nocturno en mi bemol (con el #11 lidio que brilla como un
// farol), 112 negras a 3/4 con corcheas en swing. Intro de colchón y luciérnagas (kalimba, glock y
// tres notas de vibráfono que se encienden como farolillos); A con la ocarina sobre el vibráfono y
// el contrabajo a dos; A2 con la flauta y la ocarina a dos voces sobre el arpa; B lírico del
// clarinete en la bemol lidio, con el coro «uu» y el vibráfono que le contesta citando el tema de
// Nila; un puente de farolillos (sol bemol lidio, kalimba sola con eco); A3 con todo, la melodía
// variada y el bajo caminando; una cola que se apaga y vuelve a A. 88 compases, ~2:21.
Sound.cancion('juncos', {
  titulo: 'Los juncos', tempo: 112, compas: '3/4', swing: .22, swingEn: 'e', tono: 'Eb mayor', vol: 1.15,
  eco: { tiempo: 'q.', fb: .34, tono: 2200 },
  pistas: {
    ocarina: { inst: 'ocarina', vol: .68, pan: -.06, rev: .36, eco: .12 },
    flauta:  { inst: 'flauta', vol: .5, pan: .1, rev: .4, eco: .12 },
    clar:    { inst: 'clarinete', vol: .56, pan: -.08, rev: .34, eco: .08 },
    vibra:   { inst: 'vibrafono', vol: .2, pan: .24, rev: .42, eco: .18, rango: 'Bb3-D5', voces: 4 },
    kalimba: { inst: 'kalimba', vol: .4, pan: -.34, rev: .36, eco: .32 },
    glock:   { inst: 'glock', vol: .17, pan: .46, rev: .45, eco: .24 },
    arpa:    { inst: 'arpa', vol: .36, pan: -.38, rev: .38, rango: 'Bb2-C5', voces: 4, arp: '1 2 3 4 3 2', arpPaso: 'e' },
    coro:    { inst: 'coroU', vol: .27, rev: .52, rango: 'Bb3-C5', voces: 4, abierto: true },
    colchon: { inst: 'pad', vol: .22, rev: .5, rango: 'G3-D5', voces: 4 },
    bajo:    { inst: 'contrabajo', vol: .9, rev: .07 },
    perc:    { inst: 'bateria', vol: .55, rev: .16 } },
  temas: {
    // The tune: 5-1-2-3 climbing like a firefly, a held #11 over A♭ (the lantern), then a
    // falling answer; the second half reaches B♭5–C6 and settles on a half cadence.
    melA: `mp Bb4q Eb5q F5q | G5h F5e Eb5e | D5q. C5e Eb5q | D5h. | Bb4q D5q F5q | E5q. Db5e Bb4q | Ab4q C5q G5q | F5h rq |
           mf Bb4q Eb5q F5q | G5h Bb5q | C6q. Bb5e G5q | Ab5q F5q Eb5q | G5q F5q D5q | Eb5q. D5e Bb4q | mp C5q Eb5q G5q | F5h. `,
    melAvar: `mp Bb4e C5e Eb5q F5q | G5q. {A5}G5e F5e Eb5e | D5q C5e D5e Eb5q | D5h {Eb5}D5e C5e | Bb4q D5q F5q | A5q. G5e E5q | F5q. Eb5e C5q | D5h rq |
              mf Bb4q Eb5q F5q | G5q Bb5q f Eb6q | D6h C6e Bb5e | Ab5q. F5e Eb5q | mf D5q F5q Bb5q | G5q. F5e Eb5q | mp C5q Eb5q Ab5q | G5h F5q`,
    // A second voice under the tune (ocarina in A2, flute an octave up in A3).
    cntA: `R | p Bb4h. | Ab4h. | G4h F4q | F4h. | G4h. | Eb4h. | D4h. | R | Bb4h D5q | Eb5h. | F5h. | D5h. | G4h. | Ab4h.~ | Ab4h.`,
    acA: `(Ebmaj9)h. | (Ebmaj9)h. | (Abmaj7#11)h. | (Abmaj7#11)h. | (Gm7)h. | (C7b9)h. | (Fm9)h. | (Bb13)h. |
          (Ebmaj9)h. | (Ebmaj9)h. | (Abmaj7#11)h. | (Db9)h. | (Gm7)h. | (Cm9)h. | (Fm9)h. | (Bb7sus4)h (Bb7b9)q`,
    // Jazz-waltz comping: rest on one, chords on two and three (the second one damped or ringing).
    compA: `rq (Ebmaj9)q (Ebmaj9)q' | rq (Ebmaj9)h | rq (Abmaj7#11)q (Abmaj7#11)q' | rq (Abmaj7#11)h | rq (Gm7)q (Gm7)q' | rq (C7b9)h | rq (Fm9)q (Fm9)q' | rq (Bb13)h |
            rq (Ebmaj9)q (Ebmaj9)q' | rq (Ebmaj9)h | rq (Abmaj7#11)q (Abmaj7#11)q' | rq (Db9)h | rq (Gm7)q (Gm7)q' | rq (Cm9)h | rq (Fm9)q (Fm9)q' | rq (Bb7sus4)q (Bb7b9)q`,
    bajoA: `mf Eb2h. | Eb2h Bb1q | Ab1h. | Ab1h Eb2q | G1h. | C2h Bb1q | F1h. | Bb1h D2q |
            Eb2h. | Eb2h G2q | Ab1h. | Db2h Ab1q | G1h D2q | C2h G1q | F1h C2q | Bb1h Bb1q`,
    // Walking in three for A3.
    bajoW: `mf Eb2q G2q Bb2q | C3q Bb2q A2q | Ab2q C3q Eb3q | D3q C3q A2q | G2q Bb2q D3q | C2q E2q Gb2q | F2q Ab2q C3q | Bb2q D2q E2q |
            Eb2q G2q Bb2q | D3q C3q Bb2q | Ab2q C3q Eb3q | Db3q Ab2q A2q | G2q Bb2q D3q | C3q Bb2q G2q | F2q Ab2q C3q | Bb2q F2q D2q`,
    glockA: `R | R | R | rq pp Bb6e G6e D6q | R | R | R | rq F6q D6q | R | R | R | rq Ab6e F6e Eb6q | R | R | R | rq Eb6e C6e Bb5q`,
    acB: `(Abmaj7#11)h. | (Abmaj7#11)h. | (Gm7)h. | (Cm9)h. | (Fm9)h. | (Bb13)h. | (Ebmaj9)h. | (C7b9)h. |
          (Fm9)h. | (Fm9/Eb)h. | (Dbmaj7#11)h. | (Dbmaj7#11)h. | (Cm9)h. | (Fm9)h. | (Abm6)h. | (Bb7sus4)h (Bb7b9)q`,
    // Lumi sings (clarinet); the vibraphone answers with Nila's theme, the last note bent to E.
    clarB: `mp C5q. Bb4e G4q | D5h. | R | R | Ab4q C5q Eb5q | G5h F5q | R | R |
            mf Ab4q. C5e Eb5q | G5h F5q | F5q. Eb5e C5q | G5h. | mp Eb5q. D5e C5q | Ab4h C5q | F5h Eb5q | D5h. `,
    vibB: `R | R | mp Bb5q G5e Bb5e C6q | Bb5e G5e Eb5q F5q | R | R | G5q Eb5q F5q | E5h. |
           R | R | R | rq pp F6e C6e G5q | R | R | R | rq Ab5q B5q`,
    bajoB: `mf Ab1h. | Ab1h Eb2q | G1h. | C2h G1q | F1h. | Bb1h F1q | Eb2h. | C2h. |
            F1h. | Eb2h. | Db2h. | Db2h Ab1q | C2h. | F1h C2q | Ab1h. | Bb1h Bb1q`,
    // The lanterns: G♭ lydian and back, the kalimba lighting them one by one.
    acP: `(Gbmaj7#11)h. | (Gbmaj7#11)h. | (Ebmaj9)h. | (Ebmaj9)h. | (Gbmaj7#11)h. | (Fm9)h. | (Abm6)h. | (Bb7sus4)h (Bb7)q`,
    kalP: `p Bb5e Db6e F5e C6e Bb5e F5e | Bb5e Db6e F5e C6e Bb5e Db5e | Bb5e Eb6e G5e D6e Bb5e G5e | Bb5e Eb6e G5e D6e Bb5e Eb5e |
           Bb5e Db6e F5e C6e Bb5e F5e | Ab5e C6e Eb5e G5e Ab5e C5e | Ab5e B5e Eb5e F5e Ab5e Eb5e | Bb5e Eb5e F5e Ab5e rq`,
    // Fireflies: a few notes of the tune's head, high and far.
    kalFire: `p rq Bb5e G5e rq | D6q rh | rh C6e Bb5e | R`,
    percA: `
      barrido   x..... | ...... | x..... | ......
      escobilla o.xxx. | o.xxx. | o.xxx. | o.xox3
      hat       ..x.x. | ..x.x. | ..x.x. | ..x.x.
      bombo     x..... | ...... | x..... | ....x.
      triangulo x..... | ...... | ...... | ...... | ...... | ...... | ...... | ......`,
    percW: `
      barrido   x..... | ...... | x..... | ......
      escobilla x.xxx. | o.xxx. | x.xxx. | o.xoxx
      hat       ..x.x. | ..x.x. | ..x.x. | ..x.x.
      bombo     x...3. | ....3. | x..... | ..x.x.
      chasquido ..x.x. | ..x.x. | ..x.x. | ..x...
      triangulo x..... | ...... | ...... | ...... | ...... | ...... | ...... | ......` },
  secciones: {
    intro: { compases: 8,
      colchon: { p: 'pp < (Ebmaj9)h. | (Ebmaj9)h. | (Abmaj7#11)h. | (Abmaj7#11)h. | (Ebmaj9)h. | (Ebmaj9)h. | (Abmaj7#11)h. | mp (Bb7sus4)h.', vol: 1.5 },
      kalimba: { p: '$kalFire', vol: 1.5 },
      vibra: { p: 'R | R | p Bb4q Eb5q G5q | R | R | R | Bb4q Eb5q G5q | rh D5q', vol: 1.8 },
      glock: 'R | R | R | rh pp D7q | R | R | R | R',
      bajo: 'R | R | R | R | p Eb2h. | Eb2h. | Ab1h. | Bb1h. ',
      arpa: { p: 'R | R | R | R | R | R | R | rq [Bb3 D4 Eb4 F4 Ab4 Bb4 C5 Eb5]h', arp: 'up', arpPaso: 's' },
      perc: `
        triangulo x..... | ...... | ...... | ...... | x..... | ...... | ...... | ......
        barrido   ...... | ...... | ...... | ...... | ...... | ...... | x..... | x.....
        escobilla ...... | ...... | ...... | ...... | ...... | ...... | ..o.o. | ..x.xx` },
    A: { compases: 16,
      ocarina: ['$melA', '$melAvar'],
      vibra: '$compA', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp', vol: .8 }, glock: '$glockA',
      perc: '$percA' },
    A2: { compases: 16,
      flauta: ['$melA', '$melAvar'], ocarina: { p: '$cntA', vol: .75 },
      arpa: 'mp $acA', vibra: { p: '$compA', vol: .7 }, bajo: '$bajoA',
      kalimba: 'R | R | R | rq p D6e Bb5e G5q | R | R | R | R | R | R | R | rq Eb6e Db6e Ab5q | R | R | R | R',
      perc: '$percA' },
    B: { compases: 16,
      clar: '$clarB', vibra: { p: '$vibB', vol: 1.9 },
      coro: 'pp < $acB mp', arpa: { p: 'p $acB', arp: 'up' }, bajo: '$bajoB',
      perc: `
        barrido   x..... | ...... | ...... | ......
        escobilla o.o.o. | o.o.o. | o.o.o. | o.o.xo
        bombo     x..... | ...... | ...... | ......
        triangulo x..... | ...... | ...... | ...... | ...... | ...... | ...... | ......` },
    puente: { compases: 8,
      kalimba: '$kalP', coro: 'pp $acP',
      flauta: 'p rq Bb4q Db5q | F5h. | rq Bb4q Eb5q | G5h. | rq C5q F5q | Ab5h. | F5q. Eb5e B4q | Eb5h D5q',
      bajo: 'p Gb1h. | Gb1h. | Eb2h. | Eb2h. | Gb1h. | F1h. | Ab1h. | Bb1h. ',
      glock: 'R | rh pp C7q | R | rh D7q | R | rh C7q | R | R',
      perc: `
        triangulo x..... | ...... | ...... | ...... | x..... | ...... | ...... | ......
        rana      ...... | ...... | x..... | ...... | ...... | ...... | ...... | ......
        guiro     ...... | ...... | ...... | ...... | ...... | ..x... | ...... | ......
        taco      ...... | ...... | ...... | ....o. | ...... | ...... | ...... | ..o.x.` },
    A3: { compases: 16,
      ocarina: ['$melAvar', '$melA'], flauta: { p: '$cntA', oct: 1, vol: .7 },
      vibra: '$compA', arpa: { p: 'p $acA', vol: .8 }, coro: { p: '$acA', din: 'ppp', vol: .8 },
      bajo: '$bajoW', glock: '$glockA',
      perc: `
        platillo  x..... | ...... | ...... | ......
        $percW` },
    cola: { compases: 8,
      colchon: { p: 'p (Ebmaj9)h. | (Ebmaj9)h. | (Abmaj7#11)h. | (Abmaj7#11)h. | (Ebmaj9)h. | (Abm6)h. | (Ebmaj9)h. | pp (Bb7sus4)h.', vol: 1.5 },
      kalimba: { p: '$kalFire', vol: 1.5 },
      vibra: { p: 'R | R | p Bb4q Eb5q G5q | R | R | R | Bb4q Eb5q F5q | G5h. ', vol: 1.8 },
      bajo: 'p Eb2h. | Eb2h. | Ab1h. | Ab1h. | Eb2h. | Ab1h. | Eb2h. | Bb1h. ',
      arpa: { p: 'R | R | R | R | R | R | R | rq [Bb3 D4 Eb4 F4 Ab4 Bb4 C5 Eb5]h', arp: 'up', arpPaso: 's' },
      perc: `
        escobilla o.o.o. | o.o.o. | o...o. | o.....
        triangulo x..... | ...... | ...... | ...... | ...... | ...... | x..... | ......` } },
  forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
