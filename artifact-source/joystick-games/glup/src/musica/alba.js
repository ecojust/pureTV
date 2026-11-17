// GLUP — «El primer amanecer». El final: la Garza se ha ido y, por primera vez, amanece en el
// pantano. 72 negras. Empieza en mi bemol (escrito en fa, −2): colchón, arpa y una campana; A con
// el tema en la zampoña, suave, sobre cuerdas y arpa con colores lidios (el mi natural sobre si
// bemol); por un Do7 sube a fa mayor, la casa del tema, y llega A2, la forma más grande del tema:
// violín y flauta a la octava, coro "aah", trompa en notas guía, timbal y platillo; B, la segunda
// frase del tema en la flauta, con coro "ooh" y arpa; una cola que vuelve a mi bemol, deja la
// cabeza del tema en el aire y enlaza con A. 30 compases, ~1:40.
Sound.cancion('alba', {
  titulo: 'El primer amanecer', tempo: 72, compas: '4/4', swing: 0, tono: 'F mayor', trans: -2,
  eco: { tiempo: 'q', fb: .3, tono: 2200 },
  pistas: {
    zampona: { inst: 'flautaPan', vol: .56, pan: -.06, rev: .4, eco: .14 },
    violin:  { inst: 'violin', vol: .44, pan: -.1, rev: .44 },
    flauta:  { inst: 'flauta', vol: .42, pan: .12, rev: .44, eco: .1 },
    trompa:  { inst: 'trompa', vol: .3, pan: -.22, rev: .5 },
    cuerdas: { inst: 'cuerdas', vol: .3, pan: .04, rev: .5, rango: 'F3-D5', voces: 4, abierto: true },
    coro:    { inst: 'coro', vol: .24, pan: .1, rev: .6, rango: 'F3-D5', voces: 4, abierto: true },
    coroU:   { inst: 'coroU', vol: .26, rev: .6, rango: 'F3-D5', voces: 4 },
    colchon: { inst: 'pad', vol: .22, rev: .55, rango: 'A3-E5', voces: 4 },
    arpa:    { inst: 'arpa', vol: .4, pan: -.34, rev: .45, rango: 'F3-C5', voces: 4, arp: 'up', arpPaso: 's', arpOct: 2 },
    campana: { inst: 'campana', vol: .22, pan: .3, rev: .6 },
    glock:   { inst: 'glock', vol: .16, pan: .42, rev: .5, eco: .2 },
    chelo:   { inst: 'chelo', vol: .38, pan: .2, rev: .45 },
    timbal:  { inst: 'timbal', vol: .36, rev: .4 },
    bajo:    { inst: 'fretless', vol: .6, rev: .1 },
    perc:    { inst: 'bateria', vol: .45, rev: .25 } },
  temas: {
    tema: `mp C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. rq |
           Bb4q. A4e G4q A4e Bb4e | C5q A4q F4h | G4e A4e Bb4q D5q C5q | F4w`,
    // Its fullest form: a pickup into the second phrase, the leap to the high F and a soft landing on A.
    temaGrande: `f C5q A4e C5e D5q. C5e | A4q F4q G4h | A4q C5q F5q. E5e | D5h. C5e D5e |
                 Bb4q. A4e G4q A4e Bb4e | C5q A4q F5h | G5e F5e E5e D5e C5q Bb4q | A4h. rq`,
    temaB: `mp F5q. E5e D5q C5q | Bb4q. C5e D5h | Eb5q. D5e C5q Bb4q | A4h. C5q |
            D5q. C5e Bb4q A4q | G4q A4e Bb4e C#5q E5q | F5q D5q Db5q. C5e | Bb4q. A4e G4h`,
    // Luminous: F(add9), the lydian E over B♭maj7#11, long bass notes.
    acAl7: `(Fadd9)h (Bbmaj9)h | (Dm9)h (C9sus4)h | (Am7)h (Bbmaj7#11)h | (Gm9)h (C9sus4)h | (Bbmaj9)h (Gm9)h | (Am7)h (Dm9)h | (Gm11)h (C13)h`,
    acAl: `$acAl7 | (Fmaj9)h (D7sus4)h`,
    acGr: `$acAl7 | (Fmaj9)h (F7)h`,
    acB: `(Bbmaj7)w | (Gm9)w | (Ebmaj7#11)w | (D7sus4)h (D7b9)h | (Gm9)w | (Em7b5)h (A7b9)h | (Dm9)h (Bbm6)h | (Gm9)h (C9sus4)h`,
    bajoAl7: `F2h Bb1h | D2h C2h | A1h Bb1h | G1h C2h | Bb1h G1h | A1h D2h | G1h C2h`,
    guia: `A3w | A3h G3h | C4h D4h | Bb3h Bb3h | D4w | C4h A3h | Bb3h Bb3h | A3h. rq` },
  secciones: {
    intro: { compases: 2,
      colchon: 'p < (Fmaj9)w | (Bbmaj9)h (C9sus4)h mp',
      coroU: 'pp < (Fmaj9)w | (Bbmaj9)h (C9sus4)h p',
      arpa: { p: 'mp (Fmaj9)w | (Bbmaj9)h (C9sus4)h', arp: 'updown', arpPaso: 'e', arpOct: 2 },
      campana: 'mf F5w | rh. C5q',
      perc: `
        lluvia    x... .... .... .... | .... .... .... ....
        gota      .... .... .... ..x. | .... .... ..x. ....` },
    A: { compases: 8,
      zampona: '$tema',
      cuerdas: 'pp < $acAl7 | p (Fmaj9)h mp (D7sus4)h',
      arpa: { p: 'p $acAl', arp: 'updown', arpPaso: 'e', arpOct: 2 },
      bajo: 'p $bajoAl7 | F2h D2h',
      chelo: 'R | R | R | R | mp D4h. C4q | C4h A3h | Bb3h. C4q | A3h A3h',
      glock: 'R | rh. C6q | R | rh. E6q | R | R | R | R',
      timbal: 'R | R | R | R | R | R | R | pp < D3w% mp',
      perc: `
        triangulo x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        gota      .... .... ..3. .... | .... .... .... .... | .... ...3 .... .... | .... .... .... ....` },
    // The sun is up: F major, the theme on violin and flute an octave apart, choir and horn.
    A2: { compases: 8, trans: 2,
      violin: '$temaGrande', flauta: { p: '$temaGrande', oct: 1, vol: .85 },
      coro: 'p < $acGr mf', cuerdas: 'mf $acGr',
      trompa: 'mp < $guia mf',
      arpa: { p: 'mf $acGr', arp: 'up', arpPaso: 's', arpOct: 2 },
      bajo: 'mf $bajoAl7 | F2h Eb2h',
      glock: 'R | rh. G6q | R | rh. D6q | R | rh. F6q | R | rq C6h.',
      campana: 'mf F5w | R | R | R | Bb4w | R | R | R',
      timbal: 'mf F2q! rh. | R | R | rh pp < C3h% mp | R | R | R | pp < C3w% mp',
      perc: `
        platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
        triangulo .... .... .... .... | .... .... x... .... | .... .... .... .... | .... .... x... ....` },
    B: { compases: 8, trans: 2,
      flauta: '$temaB',
      coroU: 'pp < $acB p', cuerdas: { p: '$acB', din: 'pp' },
      arpa: { p: 'mp $acB', arp: 'updown', arpPaso: 'e', arpOct: 2 },
      chelo: 'p D4w | D4w | D4h. Bb3q | C4w | Bb3w | Bb3h A3h | A3h F3h | Bb3h Bb3h',
      bajo: 'p Bb1w | G1w | Eb2w | D2w | G1w | E2h A1h | D2h Bb1h | G1h C2h',
      glock: 'R | R | R | rh. C6q | R | R | R | R' },
    // Back to E♭: the theme's first bar floats over the harp and the bell, then A comes again.
    cola: { compases: 4,
      zampona: 'p rh C5q A4e C5e | D5w | rh A4q C5q | D5h. rq',
      colchon: 'pp (Fmaj9)w | (Bbmaj9)w | (Gm9)w | (C9sus4)h (C7sus4)h',
      arpa: { p: 'p (Fmaj9)w | (Bbmaj9)w | (Gm9)w | (C9sus4)h (C7sus4)h', arp: 'updown', arpPaso: 'e', arpOct: 2 },
      campana: 'mp F5w | R | D5w | R',
      bajo: 'pp F2w | Bb1w | G1w | C2w' } },
  forma: ['intro', 'A', 'A2', 'B', 'cola'], vuelta: 'A' });
