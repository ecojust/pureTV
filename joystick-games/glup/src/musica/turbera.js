// GLUP — «La turbera». Nivel 6: barro hasta las rodillas, lluvia y el topo Canto con sus gafas.
// Mi dórico, 88 negras con las corcheas arrastradas: un blues de pantano que pisa fuerte. Intro de
// lluvia con el bajo que chapotea solo; A con el clarinete grave sobre el riff del bajo sin trastes,
// congas, güiro y golpes de metales; A2 con la melodía arriba, la trompa en notas guía y la guitarra
// que rasca a contratiempo; B en sol mayor, cómico: la trompa canta el tema de Nila y Bigotes con
// pizzicato de chunda-chunda y el clarinete le contesta; un puente bajo la costra (el bajo canta
// solo sobre la marimba y un coro de galería); A3 con todo, palmas y la melodía a la octava; cola
// de lluvia que vuelve a A. 48 compases, ~2:11.
{
  const compases = s => s.split('|').map(b => b.trim().split(/\s+/));
  // The guitar's chank on 2 and 4 (and a ghost after 4), and the pizzicato's oom-pah offbeats.
  const rasca = s => compases(s).map(([a, b = a]) => `rq (${a})e'! re rq (${b})e'! (${b})s'? rs`).join(' | ');
  const chunda = s => compases(s).map(([a, b = a]) => `re (${a})e' re (${a})e' re (${b})e' re (${b})e'`).join(' | ');
  const colchon = s => compases(s).map(([a, b]) => b ? `(${a})h (${b})h` : `(${a})w`).join(' | ');
  const A = 'Em9 | Em9 | A13 | A13 | Cmaj7 | B7#9 | Em9 A13 | F#m7b5 B7b9';
  const B = 'G6 | Cmaj7 D7sus4 | Gmaj7 Bm7 | C69 D7sus4 | Am9 | Bm7 Em9 | Am7 D9 | Gmaj7 B7b13';
  const P = 'Cmaj7#11 | Cmaj7#11 | Bm11 | Bm11 | Am9 | D13 | Cmaj7 Bm7 | B7sus4 B7b9';

  Sound.cancion('turbera', {
    titulo: 'La turbera', tempo: 88, compas: '4/4', swing: .14, swingEn: 'e', tono: 'E dorico',
    eco: { tiempo: 'e.', fb: .24, tono: 2000 },
    pistas: {
      clarinete: { inst: 'clarinete', vol: .6, pan: -.06, rev: .3, eco: .1 },
      trompa:  { inst: 'trompa', vol: .44, pan: .14, rev: .36 },
      metales: { inst: 'metales', vol: .3, pan: .22, rev: .22, rango: 'G3-D5', voces: 3 },
      guitarra:{ inst: 'guitarra', vol: .3, pan: -.4, rev: .18, rango: 'E3-E5', voces: 4, rasgueo: .012 },
      pizz:    { inst: 'pizzicato', vol: .36, pan: -.28, rev: .24, rango: 'G3-D5', voces: 3 },
      marimba: { inst: 'marimba', vol: .44, pan: .3, rev: .24 },
      xilo:    { inst: 'xilofono', vol: .26, pan: .42, rev: .3 },
      colchon: { inst: 'pad', vol: .24, rev: .5, rango: 'B3-E5', voces: 4 },
      coro:    { inst: 'coroU', vol: .26, rev: .52, rango: 'E4-E5', voces: 3 },
      bajo:    { inst: 'fretless', vol: .72, rev: .06 },
      perc:    { inst: 'bateria', vol: .6, rev: .14 } },
    temas: {
      // The tune, low in the clarinet: a stomp up to the fifth, a blue B♭ falling back, the same
      // shape on A13, then a climb over C to the #9 of B7 and home by the leading tone.
      melA: `mf re B3e E4e G4e A4q.! G4e | {A4}Bb4e_ A4e G4e E4e D4e E4q. | re C#4e E4e F#4e G4q.! F#4e | E4e F#4e E4e C#4e A3h |
             rq G4e A4e B4q. D5e | D5e! C5e B4e A4e F#4q D#4q | E4e G4e B4e D5e C#5q. B4e | A4e G4e F#4e E4e D#4h`,
      melAvar: `mf re B4e E5e G5e A5q.! G5e | {A5}Bb5e_ A5e G5e E5e D5e E5q. | re C#5e E5e F#5e G5q.! F#5e | E5e F#5e E5e C#5e A4q rq |
                f rq G5e A5e B5q. D6e | D6e! C6e B5e A5e F#5e D#5e B4q | mf E5e G5e B5e D6e C#6q. B5e | A5e G5e F#5e D#5e E5h`,
      // Guide tones for the horn under the second pass: thirds and sevenths that step.
      guia: `p G3w | F#3w | G3w | F#3h E3h | E3w | D#3h F#3h | G3h G3h | A3h F#3h`,
      // The riff: a stomp on the low E, then a chromatic crawl through the blue note.
      rE: `E1q E2e. E2s G2e A2e Bb2e B2e`,
      rA: `A1q A2e. A2s C3e C#3e E3e G2e`,
      bajoA: `$rE | E2q. B1e D2e E2e G2e_ E2e | $rA | A1q. E2e F#2e G2e A2e_ B2e |
              C2q C3e. C2s E2e G2e B2e C3e | B1q B2e. B1s D#2e F#2e A2e F#2e | E2q. B1e A1q. C#2e | F#2q. C3e B1q. D#2e`,
      bajoA3: `$rE | E2q. B1e D2e E2e G2e_ E2e | $rA | A1q. E2e F#2e G2e A2e_ B2e |
               C2q C3e. C2s E2e G2e B2e C3e | B1q B2e. B1s D#2e F#2e A2e B2e | E2e E2e' B1e B1e' A1e A1e' C#2e C#2e' | F#2e. F#2s' C3e C3e' B1e B1e' D#2e_ F#2e`,
      stab: `(Em9)e'! re rh. | R | (A13)e'! re rh. | rh. re (A13)e'! | (Cmaj7)e'! re rh. | re (B7#9)e'! re (B7#9)e'! rh | R | rh re (B7b9)e'! rq`,
      gA: rasca(A), gB: rasca(B), acA: colchon(A), acP: colchon(P),
      // Swamp shuffle: heel on 1, a push on the 'and' of 2, the slap on 2 and 4, the guiro's rasp, a fill every fourth bar.
      percA: `
        bombo     x... ..x. x..o .... | x... ..x. x... .... | x... ..x. x..o .... | x... ..x. x.x. x...
        congaMute ..o. .... ..o. .o.. | ..o. .... ..o. .... | ..o. .... ..o. .o.. | ..o. .... .... ....
        congaSlap .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... ....
        conga     .... ...3 .... ..x. | .... .... .... .x.x | .... ...3 .... ..x. | .... .... xx.x xX..
        congaBaja x... .... ..x. .... | x... .... ..x. .... | x... .... ..x. .... | x... .... .... ..xX
        guiro     .... x... .... .... | .... x... .... .... | .... x... .... .... | .... .... .... ....
        hat       ..x. ..x. ..x. ..x7 | ..x. ..x. ..x. ..x. | ..x. ..x. ..x. ..x7 | ..x. ..x. .... ....` },
    secciones: {
      intro: { compases: 4,
        colchon: 'pp < (Em9)w | (Em9)w | (A13)w | mp (B7#9)w',
        clarinete: 'R | p rh re E3e_ G3e_ A3e | Bb3q_ A3q. G3e E3q | R',
        bajo: 'R | R | mf $rE | B1q. F#2e A2q_ B2q',
        perc: `
          lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          tomBajo   .... .... .... .... | .... .... .... .... | x... .... x... .... | x... .... x... ....
          guiro     .... .... .... .... | .... .... .... .... | .... x... .... .... | .... x... .... ....
          congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..x. xxxX` },
      A: { compases: 8,
        clarinete: ['$melA', '$melAvar'],
        bajo: '$bajoA', metales: 'mf $stab', colchon: { p: '$acA', din: 'pp' },
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          $percA` },
      A2: { compases: 8,
        clarinete: '$melAvar', trompa: '$guia',
        guitarra: '$gA', bajo: '$bajoA', colchon: { p: '$acA', din: 'pp', vol: .8 },
        perc: `
          shaker    x.x. x.x. x.x. x.x.
          $percA` },
      B: { compases: 8,
        trompa: 'mf D4q B3e D4e E4q. D4e | B3q G3q A3h | B3q D4q G4q. F#4e | E4h. rq | mp A3w | B3h G3h | C4h F#3h | B3h D#4h',
        clarinete: ['mp R | rh re A5e\' G5e\' E5e\' | R | rh {D5}E5e\' G5e\' A5e\' B5e\' | mf C5q. B4e A4q B4e C5e | D5q B4q G4h | A4e B4e C5q E5q D5q | G4h rh',
                    'mp R | rh re D5e\' B4e\' G4e\' | R | rh {D5}E5e\' D5e\' B4e\' A4e\' | mf C5q. B4e A4q B4e C5e | D5q B4q G4q. A4e | B4e C5e D5q G5q F#5q | G5h rh'],
        pizz: chunda(B),
        xilo: 'R | R | R | rh. p D6e\' B5e\' | R | R | R | rh mp G5s A5s B5s D6s G6q\'',
        bajo: `G1q. D2e G2q D2q | C2q. G2e D2q. A1e | G1q. D2e B1q. F#2e | C2q. G2e D2q. A1e |
               A1q. E2e A2q E2q | B1q. F#2e E2q. B1e | A1q. E2e D2q. A1e | G1q. D2e B1q_ D#2q`,
        perc: `
          bombo     x... .... x... .... | x... .... x... .... | x... .... x... .... | x... .... x.x. ....
          aro       .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x.x.
          taco      ..x. .... ..x. ..3. | ..x. .... ..x. .... | ..x. .... ..x. ..3. | ..x. ..x. x... ....
          tacoBajo  .... .... .... .... | .... .... .... ..x. | .... .... .... .... | .... .... ..x. x...
          shaker    x.x. x.x. x.x. x.x.
          rana      .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ..x.` },
      puente: { compases: 8,
        bajo: `mp C2q. G2e B2e C3e D3e E3e | F#3q._ E3e D3q B2q | B1q. F#2e A2e B2e D3e E3e | F#3h_ E3e D3e B2q |
               A1q. E2e G2e A2e B2e C3e | D3q. C3e A2q F#2q | G2e A2e B2e C3e_ D3q B2q | E2q F#2q B1q A2e_ D#2e`,
        marimba: `p C4e G4e B4e C4e G4e B4e F#4e G4e | % | B3e F#4e A4e B3e F#4e A4e E4e F#4e | % |
                  A3e E4e G4e A3e E4e G4e B4e E4e | D4e A4e C5e D4e A4e C5e B4e F#4e | C4e G4e B4e C4e B3e F#4e A4e D4e | B3e E4e F#4e A4e B3e D#4e F#4e A4e`,
        coro: 'pp < $acP mp',
        clarinete: 'R | R | R | R | p E4w | F#4h D4h | E4q. D4e B3h | < A3h B3h mf',
        perc: `
          lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          congaMute o... ..o. .... ..o. | o... ..o. .... ..o. | o... ..o. .... ..o. | o... ..o. .... ..o. | o... ..o. .... ..o. | o... ..o. .... ..o. | o... ..o. ..o. ..o. | o.o. o.o. .... ....
          congaBaja .... .... x... .... | .... .... x... .... | .... .... x... .... | .... .... x... ..x. | .... .... x... .... | .... .... x... .... | x... .... x... .... | x... x... ..x. x...
          gota      .... ..x. .... .... | .... .... ...x .... | ..x. .... .... .... | .... .... .... ..x. | .... ..x. .... .... | .... .... ...x .... | .... .... .... .... | .... .... .... ....
          tomBajo   .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... R.R. RRRX` },
      A3: { compases: 8,
        clarinete: { p: '$melA', oct: 1 }, trompa: { p: '$melA', vol: .9 },
        metales: 'f $stab', guitarra: '$gA', bajo: '$bajoA3', colchon: { p: '$acA', din: 'p' },
        perc: `
          platillo  x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          palmas    .... x... .... x... | .... x... .... x... | .... x... .... x... | .... x... .... x.xX
          $percA` },
      cola: { compases: 4,
        clarinete: 'mp rq G4e E4e D4e B3e A3q | p E3h. rq | R | R',
        guitarra: { p: rasca('Em9 | Em9 | A13 | B7#9'), din: 'p' },
        colchon: 'p (Em9)w | (Em9)w | (A13)w | (B7#9)w',
        bajo: 'mp $rE | E2q. B1e D2e E2e G2e_ E2e | $rA | B1q B2e. B1s D#2e F#2e A2e_ B2e',
        perc: `
          lluvia    x... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... .... ....
          bombo     o... ..o. .... .... | o... ..o. .... .... | o... ..o. .... .... | x... ..x. x.x. ....
          guiro     .... x... .... .... | .... x... .... .... | .... x... .... .... | .... .... .... ....
          congaBaja .... .... .... .... | .... .... .... .... | .... .... .... .... | .... .... ..x. xxxX` } },
    forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'], vuelta: 'A' });
}
