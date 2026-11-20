// GLUP — «El presagio». El nido de la Garza y la sombra que cruza la luna en la intro: re menor, 60
// negras, casi quieta. Un pedal de re en los graves (cuerdas y colchón como viento), timbales lejanos y
// el motivo de la Garza (re–do#–re–sol#, la tritona | la–fa–mi) contado a trozos: primero aumentado en
// el violonchelo, luego una trompa lejana; en B sube por terceras menores (re, fa, la bemol) hasta un
// clímax y se corta; C es la sombra sobre la luna (trémolo agudo en tritono, coro, arpa grave); la cola
// vuelve al pedal. Deja arriba el hueco para el viento del ambiente 'nido'. 30 compases, 2:00.
Sound.cancion('omen', {
  titulo: 'El presagio', tempo: 60, compas: '4/4', swing: 0, tono: 'D menor', vol: 1.25,
  pistas: {
    chelo:   { inst: 'chelo', vol: .5, pan: -.12, rev: .42 },
    trompa:  { inst: 'trompa', vol: .4, pan: .14, rev: .6 },
    flauta:  { inst: 'flauta', vol: .34, pan: .22, rev: .55 },
    viento:  { inst: 'pad', vol: .26, rev: .55, rango: 'D3-A4', voces: 4 },
    cuerdas: { inst: 'cuerdas', vol: .3, rev: .5, rango: 'F3-D5', voces: 4, abierto: true },
    grave:   { inst: 'cuerdas', vol: .34, rev: .35 },
    trem:    { inst: 'tremolo', vol: .2, pan: .25, rev: .55 },
    coro:    { inst: 'coro', vol: .24, rev: .62, rango: 'A3-D5', voces: 3 },
    arpa:    { inst: 'arpa', vol: .34, pan: -.35, rev: .5 },
    campana: { inst: 'campana', vol: .2, pan: .3, rev: .65 },
    timbal:  { inst: 'timbal', vol: .5, pan: .06, rev: .42 },
    perc:    { inst: 'bateria', vol: .5, rev: .4 } },
  temas: {
    // The heron's motif in augmentation (each value doubled), and the harmony under it: the G# of the
    // tritone sits on a B♭7(#11) (A♭ = G#), then melts into B♭maj7 and falls to the dominant.
    motA:  `mp D3q_ C#3q D3h | G#2w | A2h. F2q | E2w`,
    motA2: `mp D3q_ C#3q D3h | G#2h A2h | F2h. D2q | E2w`,
    acA:   `(Dmadd9)w | (Bb7#11)w | (Bbmaj7)w | (A7sus4)h (A7)h | (Dmadd9)w | (Bb7#11)h (Bbmaj7)h | (Gm9)w | (Em7b5)h (A7b9)h`,
    // B: the motif climbs by minor thirds (D, F, A♭) and comes back to D for the climax.
    acB:   `(Dm)h (Bb7)h | (Bbmaj7)h (A7)h | (Fm)h (Db7)h | (Dbmaj7)h (C7)h | (Abm)h (E7)h | (Emaj7)h (Eb7)h | (Dm)h (Bb7#11)h | (Bbmaj7)h (A7b9)h`,
    motB:  `mp D4e C#4e D4q G#3h | A3q. F3e E3h | F4e E4e F4q B3h | C4q. Ab3e G3h |
            mf Ab4e G4e Ab4q D4h | Eb4q. B3e Bb3h | f D5e C#5e D5q G#4h | A4q. F4e E4h`,
    acC:   `(Bbmaj7#11)w | (Dm/A)w | (Bbmaj7#11)w | (Gm6/Bb)w | (Bb7#11)w | (A7sus4)h (A7)h`,
    // The long "lub-dub" of a far drum: the timpani's heartbeat.
    lat:   `p D2q. D2e rh` },
  secciones: {
    intro: { compases: 4,
      grave:  'pp < [D2 A2]w~ | [D2 A2]w | [D2 A2]w~ | [D2 A2]w p',
      viento: 'pp < (Dm9)w | (Dm9)w | (Gm9/D)w | p (Dm9)w',
      trem:   'R | R | ppp < [A4 E5]w | [A4 E5]w pp',
      campana: 'R | pp D4h rh | R | R',
      timbal: 'R | R | R | ppp < D2w% pp',
      perc: `
        tambor    .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....` },
    A: { compases: 8,
      chelo:  ['$motA | rh D3q E3q | F3h. E3q | D3h C3h | Bb2h A2h', '$motA2 | rh F3q G3q | A3h. G3q | F3h E3h | D3h C#3h'],
      trompa: 'R | R | R | R | p D4e C#4e D4q G#3h | A3q. F3e E3h | R | R',
      viento: { p: '$acA', din: 'pp' },
      grave:  'pp D2w~ | D2w | D2w~ | D2h A2h | D2w~ | D2w | G2w | A2w',
      arpa:   'R | rh. G#3q | R | rh. E3q | R | rh. G#3q | R | rh E3q A2q',
      timbal: 'R | R | R | $lat | R | R | R | $lat',
      perc: `
        tambor    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....` },
    B: { compases: 8,
      trompa: ['$motB', { p: '$motB', vol: 1.1 }],
      chelo:  'mp D3h Bb2h | Bb2h A2h | F2h Db3h | Db3h C3h | Ab2h E2h | E2h Eb2h | f D2h Bb2h | Bb2h A2h',
      cuerdas: 'pp < $acB f',
      coro:   'R | R | R | R | pp < (Abm)h (E7)h | (Emaj7)h (Eb7)h | mf (Dm)h (Bb7#11)h | f (Bbmaj7)h (A7b9)h',
      flauta: ['R | R | R | R | R | R | R | R', 'R | R | R | R | p Ab5w | Bb5w | mp A5w | G5h E5h'],
      timbal: 'pp D2q. D2e rh | % | p F2q. F2e rh | % | mp Ab2q. Ab2e rh | % | mf D2q. D2e D2q D2q | f A2w%',
      grave:  'p D2w | D2h A2h | F2w | Db2h C2h | Ab2w | E2h Eb2h | D2w | Bb1h A2h',
      perc: `
        tambor    .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | x... .... x... .... | .... .... .... .... | x... .... x... x... | X... .... x.x. XxXx
        tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..x. | .... ..x. .... ..x. | .... ..x. .... ....
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... x... ....` },
    C: { compases: 6,
      trem:   'pp < [D5 G#5]w | [D5 A5]w | [D5 G#5]w | [D5 G5]w | pp [D5 G#5]w | [C#5 E5]h [C#5 G5]h pp',
      coro:   ['p E4w | F4h A4h | G#4w | A4h. rq | G#4w | E4h. rq', 'p A4w | F4h D4h | G#4w | Bb4h. rq | Ab4w | G4h E4h'],
      viento: { p: '$acC', din: 'p' },
      grave:  'pp Bb1w | A2w | Bb1w | Bb1w | Bb1w | A2w',
      arpa:   'p D3q A3q E4q rq | rh. A2q | D3q A3q G#4q rq | R | D3q Ab3q E4q rq | rh A2q rq',
      campana: 'R | R | pp D4h rh | R | R | R',
      perc: `
        tambor    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... ....
        lluvia    .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... ....` },
    cola: { compases: 4,
      chelo:  'p D3e C#3e D3q rh | rh G#2h | A2h. F2q | E2w',
      grave:  'pp D2w~ | D2w | D2w~ | D2h A2h',
      viento: 'pp (Dm9)w | (Bb7#11)w | (Bbmaj7)w | ppp (A7sus4)w',
      trem:   'R | R | ppp [A4 E5]w | [A4 E5]w',
      timbal: 'R | R | R | pp < A2w% p' } },
  forma: ['intro', 'A', 'B', 'C', 'cola'], vuelta: 'A' });
