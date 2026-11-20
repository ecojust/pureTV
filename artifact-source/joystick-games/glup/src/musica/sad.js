// GLUP — «Se las llevó». La pena de la intro: «La Garza se las llevó a todas». El tema de Nila y
// Bigotes en menor (escrito en fa menor, suena en re menor), 63 negras. A: el violonchelo canta el
// tema roto sobre el piano arpegiado y un coro "ooh" que entra desde la nada; B: el clarinete llora
// una frase nueva y, debajo, el motivo de la Garza (re–do#–re–sol#) pasa como una sombra en los
// graves, con coro "aah" y trémolo; A2: el piano solo canta el tema más arriba, el arpa lo mece y el
// chelo va en notas guía, y acaba en el dominante para volver a empezar. 24 compases, ~1:31.
Sound.cancion('sad', {
  titulo: 'Se las llevó', tempo: 63, compas: '4/4', swing: 0, tono: 'F menor', trans: -3, vol: 1.5,
  pistas: {
    chelo:     { inst: 'chelo', vol: .58, pan: -.12, rev: .4 },
    clarinete: { inst: 'clarinete', vol: .5, pan: .1, rev: .42 },
    pianoMel:  { inst: 'piano', vol: .5, pan: .06, rev: .44 },
    piano:     { inst: 'piano', vol: .38, pan: .14, rev: .42, rango: 'F3-C5', voces: 4, bajo: true, arp: '1 3 4 5 4 3', arpPaso: 'e' },
    arpa:      { inst: 'arpa', vol: .34, pan: -.34, rev: .45, rango: 'F3-C5', voces: 4, arp: 'updown', arpPaso: 'e', arpOct: 2 },
    coro:      { inst: 'coroU', vol: .26, rev: .55, rango: 'F3-C5', voces: 4, abierto: true },
    coroA:     { inst: 'coro', vol: .2, pan: -.1, rev: .6, rango: 'F3-Db5', voces: 3 },
    temblor:   { inst: 'tremolo', vol: .16, pan: .2, rev: .5, rango: 'C3-C4', voces: 3 },
    sombra:    { inst: 'chelo', vol: .5, pan: .22, rev: .45 },
    cuerdas:   { inst: 'cuerdas', vol: .22, rev: .5, rango: 'C3-Ab4', voces: 4, abierto: true },
    timbal:    { inst: 'timbal', vol: .3, rev: .45 },
    perc:      { inst: 'bateria', vol: .45, rev: .3 } },
  temas: {
    // The main theme in the minor: D♭ (the ♭6) where the D was, a falling A♭ where the A was.
    temaM: `mp C5q Ab4e C5e Db5q. C5e | Ab4q F4q G4h | Ab4q C5q F5q. Eb5e | Db5h. rq |
            Bb4q. Ab4e G4q Ab4e Bb4e | C5q Ab4q F4h | G4e Ab4e Bb4q Db5q C5q | F4w`,
    // The piano's version: it reaches up to A♭5 before sinking.
    temaM2: `mp C5q Ab4e C5e Db5q. C5e | Ab4q F4q G4h | Ab4q C5q F5q. G5e | Ab5h. G5e F5e |
             Eb5q. Db5e C5q Bb4e Ab4e | G4q Ab4q F4h | G4e Ab4e Bb4q Db5q C5q | F4h. rq`,
    acM7: `(Fm9)h (Dbmaj7)h | (Bbm9)h (Eb13)h | (Abmaj7)h (Fm9)h | (Dbmaj9)h (Gm7b5)h | (Bbm9)h (Bbm6)h | (Abmaj7)h (Dbmaj9)h | (Gm7b5)h (C7b9)h`,
    acM: `$acM7 | (Fm9)h (Fmmaj7)h`,
    acM2: `$acM7 | (Fm9)h (C7b9)h`,
    acS: `(Dbmaj7)w | (Bbm9)w | (Fmmaj7)w | (Gm7b5)h (C7b9)h | (Dbmaj7#11)w | (Bbm9)h (Eb7b9)h | (Fmmaj7)w | (Gm7b5)h (C7b9)h`,
    // The cello's guide tones under the piano in A2.
    guia: `mp Ab3h F3h | Db4h G3h | C4h Ab3h | F3h Bb3h | Db4h G3h | Eb4h F4h | Db4h E3h | F3h E3h` },
  secciones: {
    A: { compases: 8,
      chelo: { p: ['$temaM', '$temaM2'], oct: -1 },
      piano: ['p $acM', 'pp $acM'],
      coro: 'ppp < $acM7 | p (Fm9)h (Fmmaj7)h',
      perc: `
        lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
    // The Heron's shadow: its motif crawls under the clarinet's lament, twice.
    B: { compases: 8,
      clarinete: 'mp Ab4h. C5q | Db5q. C5e Bb4q Ab4q | G4w | Bb4h Db5q C5q | F5q. Eb5e Db5q C5q | Bb4q. C5e Db5h | C5w | Bb4h. G4q',
      sombra: 'R | R | p F3e E3e F3q B2h | C3q. Ab2e G2h | R | R | mp F3e E3e F3q B2h | C3q. Ab2e G2h',
      cuerdas: 'pp $acS', coroA: 'R | R | pp < (Fmmaj7)w | mp (Gm7b5)h (C7b9)h | R | R | pp < (Fmmaj7)w | mp (Gm7b5)h (C7b9)h',
      temblor: 'R | R | ppp < (Fmmaj7)w | p (Gm7b5)h (C7b9)h | R | R | ppp < (Fmmaj7)w | p (Gm7b5)h (C7b9)h',
      arpa: { p: 'p (Dbmaj7)w | (Bbm9)w | R | R | (Dbmaj7#11)w | (Bbm9)h (Eb7b9)h | R | R', arp: 'up', arpPaso: 's' },
      timbal: 'R | R | R | pp < C3h% C3h% p | R | R | R | pp < C3h% C3h% p' },
    A2: { compases: 8,
      pianoMel: '$temaM2', chelo: '$guia',
      arpa: 'p $acM2', coro: 'pp $acM2',
      sombra: 'R | R | R | R | R | R | R | ppp rh F3e E3e F3q' } },
  forma: ['A', 'B', 'A2'], vuelta: 'A' });
