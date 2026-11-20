# La música de GLUP — guía para componer

Todo el sonido de GLUP se sintetiza en `audio.js` con WebAudio: no hay muestras ni archivos de
audio. Cada canción es un archivo `musica/<nombre>.js` que se apunta sola con
`Sound.cancion('<nombre>', {...})`. El modelo a imitar es la banda sonora de **Rayman 1** (Rémi
Gazel): orgánica y acústica (flautas, zampoña, marimba, kalimba, arpa, guitarra, bajo sin trastes,
cuerdas y coros suaves, campanas, congas, shakers, escobillas, maderas), acordes con color de jazz,
melodías que se silban, piezas largas con secciones que cambian y mucha reverb. Nada de chiptune.

La canción de referencia es **`musica/marsh.js` («El embarcadero»)**: léela entera antes de escribir.

---------------------------------------------------------------------------------------------------

## 1. Una canción

```js
// GLUP — «Título». Una línea que diga qué es y dónde suena.
Sound.cancion('nombre', {
  titulo: 'El embarcadero',      // lo muestra la gramola
  tempo: 92,                     // negras por minuto
  compas: '4/4',                 // '3/4', '6/8', '5/4', '7/8'... (6/8 = 3 negras por compás)
  swing: .12,                    // 0..0.5: retrasa las semicorcheas de contratiempo (swingEn: 'e' para corcheas)
  tono: 'D dorico',              // para los trinos (*): mayor menor dorico frigio lidio mixolidio locrio armonica melodica pentatonica pentaMenor
  trans: 0,                      // transporta toda la canción (semitonos)
  vol: 1,                        // volumen de la canción entera
  eco: { tiempo: 'e.', fb: .3, tono: 2400 },   // eco estéreo a tempo (opcional); las pistas le mandan con `eco:`
  pistas: {                      // cada pista: un instrumento y su mezcla
    zampona: { inst: 'flautaPan', vol: .62, pan: -.08, rev: .34, eco: .16 },
    bajo:    { inst: 'fretless', vol: .72, rev: .06 },
    perc:    { inst: 'bateria', vol: .62, rev: .14 } },
  temas: {                       // compases con nombre, para reutilizar: $melA, $melA*2
    melA: `mf re A4e D5e E5e F5q. E5e | D5e {D5}C5e A4h. | ...` },
  secciones: {                   // qué toca cada pista en cada sección
    intro: { compases: 4, zampona: null, bajo: 'R | R | p G2h. D3q | A2h. E2e_ A2e' },
    A:     { compases: 8, zampona: ['$melA', '$melAvar'], bajo: '$bajoA', perc: '$percA' } },
  forma: ['intro', 'A', 'A2', 'B', 'puente', 'A3', 'cola'],   // el orden
  vuelta: 'A',                   // al acabar la forma, vuelve aquí (nombre o índice). bucle: false = no repite
});
```

- **Secciones**: cada una dice cuántos `compases` dura (si falta, el patrón más largo). Una pista que
  no aparece en la sección (o vale `null`) calla. Si su patrón tiene menos compases que la sección, se
  repite dentro de ella (un compás de bombo sirve para ocho).
- **Variaciones por vuelta**: si una pista vale una lista, cada vez que la sección suena toma el
  siguiente elemento: `zampona: ['$melA', '$melAvar']` → la 1.ª vez melA, la 2.ª melAvar, la 3.ª melA...
  (las veces se cuentan también al dar la vuelta a la forma). `{ azar: ['$a', '$b'] }` elige al azar.
- **Ajustes por sección**: una pista puede valer un objeto `{ p: patrón, ...ajustes }` que pisa los
  de la pista solo en esa sección: `{ p: '$acA', din: 'pp' }`, `{ p: ['$m1', '$m2'], oct: -1, vol: .7 }`
  (`vol` aquí **multiplica** el volumen de la pista), `{ p: '...', arp: 'up', arpPaso: 's' }`.
- Ajustes de sección: `tempo` (otro tempo), `trans` (modular: +2 sube un tono todo lo afinado).
- **Duración**: apunta a 1:30–3:00 antes de repetir (`tools/musica.sh nombre` lo dice). Las piezas
  cortas de ambiente (presagio, tristeza) pueden durar menos pero con variaciones. Las fanfarrias y
  los finales usan `bucle: false`.
- Carga: añade el archivo a la lista `musica` de `index.html` y a `SHELL` de `sw.js` (sin cambiar la
  versión de CACHE). `tools/sim.js` los encuentra solo.

## 2. Notas (pistas melódicas)

Un patrón es un texto; `|` separa compases. Cada nota es **altura + duración + marcas**, pegadas:

| escribes | significa |
|---|---|
| `D4` `F#3` `Bb5` | altura (do central = C4). |
| `w h q e s x` | redonda, blanca, negra, corchea, semicorchea, fusa |
| `q.` `q..` `et` `qt` | con puntillo, doble puntillo, tresillo (3 `et` = una negra) |
| `h+e` | duraciones sumadas (una blanca y una corchea) |
| *(nada)* | la misma duración que la nota anterior: `D4e F4 A4 D5` son cuatro corcheas |
| `rq` `re.` `r` | silencio (con duración) |
| `R` | silencio hasta el final del compás. Un compás `R` calla entero |
| `%` | (compás entero) repite el compás anterior |
| `[D3 F3 A3]h` | notas a la vez |
| `(Dm9)w` `(Bbmaj7/F)h` | acorde cifrado: se reparte en voces (ver §4) |
| `{C5}D5e` `{C5 E5}D5q` | apoyaturas (notas de adorno justo antes) |

Marcas, al final de la nota (se pueden juntar: `A4q!'`):

| marca | efecto |
|---|---|
| `!` `!!` | acento (más fuerte y brillante) |
| `?` `??` | nota fantasma, suave |
| `'` | staccato (corta; en instrumentos que resuenan, la apaga) |
| `~` | ligadura: se une a la siguiente si es la misma nota (`A4h~ \| A4q`) |
| `_` | legato: en vientos, violín, bajos y armónica **desliza** a la siguiente nota (portamento); en los demás, solapa un poco |
| `^` | entra desde abajo (scoop / bend de armónica / slide de bajo) |
| `*` | trino con la nota de arriba de la escala (`tono`) |
| `%` | trémolo/redoble: cuerdas en trémolo; láminas, timbal y demás en golpes rápidos |

**Dinámica**: `ppp pp p mp mf f ff fff` sueltas en el patrón cambian la fuerza de lo que sigue
(por defecto `mf`, o el `din:` de la pista). `<` o `>` antes de una dinámica hacen un crescendo o
diminuendo de nota en nota hasta ella: `p < D4q E4 F4 G4 | A4w f`.

Cada compás debe sumar lo que marca el compás (4 negras en 4/4, 3 en 6/8); si no, `tools/musica.sh`
avisa. La humanización (±8 ms, ±7 % de fuerza) es automática: `humano: ms` y `humanoVel` por pista.

## 3. Percusión (pista `inst: 'bateria'`)

Una línea por instrumento: el nombre y su rejilla. Los espacios no cuentan; `|` separa compases. El
número de pasos del compás decide la resolución: 16 en 4/4 = semicorcheas, 12 = tresillos de corchea,
8 = corcheas; en 6/8, 12 = semicorcheas.

```
perc: `
  bombo     x... ..x. x... .... | x... ..x. x.x. ....
  congaMute o... ..o. o... ..o.
  congaSlap .... x... .... x...
  conga     .... .... .... ..xx | .... .... ..x. xX..
  shaker    Xoxo xoxo Xoxo xoxo
  platillo  x... .... .... ....`
```

| carácter | golpe |
|---|---|
| `x` `X` `o` | normal, acentuado, fantasma |
| `.` `-` | nada |
| `1`…`9` | golpe con probabilidad 10 %…90 % (variación viva: cada vuelta suena distinto) |
| `f` | flam (dos golpes casi juntos) |
| `R` | redoble dentro del paso |

Cada línea repite sus compases por su cuenta (una de 1 compás y otra de 4 conviven). Pon el relleno
en el cuarto compás de un patrón de cuatro. `platillo` es un platillo que **crece** y culmina justo en
el golpe escrito (empieza 1.6 s antes): escríbelo en el tiempo fuerte al que lleva.

Percusión disponible (nombre — carácter):

| nombre | | nombre | |
|---|---|---|---|
| `bombo` | bombo suave, de fieltro | `conga` `congaBaja` | congas abiertas (agudo / tumbadora) |
| `caja` | caja suave con bordonero | `congaSlap` `congaMute` | slap seco / nota apagada |
| `escobilla` | golpe de escobillas | `bongo` `bongoBajo` | bongós |
| `barrido` | barrido de escobillas (swish) | `taco` `tacoBajo` | caja china / bloque de madera |
| `aro` | golpe de aro (rim) | `claves` | claves |
| `hat` `hatAbierto` | charles cerrado / abierto | `triangulo` `trianguloMute` | triángulo libre / apagado |
| `ride` | ride de jazz | `lluvia` | palo de lluvia (2.5 s) |
| `plato` | platillo crash suave | `guiro` `rana` | güiro / rana de madera (raspado) |
| `platillo` | platillo que crece hasta el golpe | `chasquido` `palmas` | chasquido de dedos, palmas |
| `shaker` | shaker / maraca | `gota` | gota de agua afinada |
| `pandereta` | pandereta | `tom` `tomBajo` `tambor` | toms y tambor grande (la Garza) |

(Alias en inglés: kick snare brush swish rim openhat crash swell tambourine slap mute woodblock
triangle rainstick frog snap clap drip taiko maraca.)

## 4. Acordes cifrados

`(Dm9)w` se convierte en notas según la pista:

- `rango: 'F3-C5'` — dónde van las voces (por defecto G3-D5).
- `voces: 4` — cuántas; se quedan las más características (3.ª, 7.ª, tensiones, luego raíz y 5.ª).
- Encadenado: cada acorde elige la inversión **más cercana al anterior** (conducción de voces suave).
- `abierto: true` — voicing drop-2, más ancho (cuerdas, coro).
- `bajo: true` — añade la raíz (o la nota tras `/`) una octava por debajo del rango.
- `rasgueo: .016` — segundos entre cuerda y cuerda (guitarra, arpa, banjo).
- `arp: 'up' | 'down' | 'updown' | 'random' | '1 3 2 4 3 2'` con `arpPaso: 's'` y `arpOct: 2` — arpegia
  el acorde durante su duración (los números son voces de abajo arriba; pasado el total, octava arriba).

Cifrados: `C Cm C5 C6 Cm6 C69 C7 Cmaj7 CM7 CΔ Cm7 CmMaj7 C9 Cmaj9 Cm9 Cadd9 Cmadd9 C11 Cm11 C13
Cmaj13 Cm13 Csus2 Csus4 C7sus4 C9sus4 Cdim C° Cdim7 C°7 Cm7b5 Cø Caug C+ C7b9 C7#9 C7#11 Cmaj7#11
C7b13 C7#5`, con cualquier raíz (`F#m7`, `Bbmaj7`) y bajo (`/E`). Ojo: `[..]` son notas escritas a
mano (`[D3 A3 F4]h`); los cifrados van siempre entre paréntesis.

Un truco: escribe la armonía una vez como tema (`acA: '(Dm9)w | (G9)w | ...'`) y úsala en varias
pistas con ajustes distintos: el colchón con `voces: 4`, el arpa con `arp: 'updown'`, la guitarra con
`rasgueo` (y su propio ritmo: `(Dm9)q. (Dm9)e' rq (Dm9)e (Dm9)e'`).

## 5. Instrumentos

Rango recomendado (fuera, `tools/musica.sh` avisa), carácter y uso. Todos responden a la fuerza:
más fuerte = más brillante. Los de **resonancia libre** (arpa, láminas, kalimba, campana, timbal)
suenan hasta apagarse aunque la nota escrita sea corta; un `'` los apaga.

**Cuerdas pulsadas** (Karplus–Strong: cuerdas de verdad simuladas)

| inst | rango | carácter y uso |
|---|---|---|
| `arpa` | C2–G6 | arpa de concierto; arpegios (`arp`), glissandos, brillo en B y finales |
| `guitarra` | E2–B5 | nailon cálida; acompañamiento con `rasgueo`, bossa, punteos |
| `koto` | D3–D6 | cítara brillante; pentatónicas, cueva, misterio amable |
| `banjo` | C3–D6 | seco y alegre; el pescador, persecuciones cómicas |
| `pizzicato` | C2–C6 | cuerdas pellizcadas; sigilo, pasos, humor |
| `contrabajo` | E1–G3 | bajo pulsado redondo; walking de jazz; `_` desliza |

**Láminas y campanas**

| inst | rango | carácter y uso |
|---|---|---|
| `marimba` | A2–C7 | madera cálida; ostinatos y acordes rotos (el motor de Rayman) |
| `xilofono` | F4–C8 | seco, brillante; travesuras, dobla melodías rápidas |
| `vibrafono` | F3–F6 | metal con motor (trémolo); jazz nocturno, puentes, luciérnagas |
| `glock` | G5–C8 | glockenspiel; destellos, doblar notas clave arriba |
| `cajita` | C5–C8 | caja de música; nanas, recuerdos, créditos |
| `kalimba` | C4–E6 | sanza; motivos cíclicos, íntima, mágica (usa `eco`) |
| `campana` | C4–C7 | campana tubular; amanecer, finales solemnes |
| `timbal` | D2–C4 | timbales afinados; redobles `%`, la Garza, golpes |

**Teclados**: `epiano` (E2–C7, Rhodes: acordes de jazz, colchón cálido) · `piano` (A1–C8, suave:
acordes, melodías tiernas o tristes).

**Vientos** (monofónicos; con `_` ligan deslizando; el vibrato llega tarde en notas largas)

| inst | rango | carácter y uso |
|---|---|---|
| `flautaPan` | G3–G6 | zampoña: soplo y "chiff"; **la voz del pantano** |
| `flauta` | C4–C7 | travesera; líneas líricas, B, contracantos |
| `ocarina` | A3–F6 | redonda y pura; nostalgia, segundas voces |
| `silbido` | C5–C7 | silbido humano con portamento; el pescador, alegría |
| `clarinete` | D3–G6 | grave cálido; jazz, humor, noche |
| `armonica` | C4–C7 | armónica; blues de muelle (`^` para bends) |
| `acordeon` | F2–A6 | musette; vals del pescador, acordes |

**Cuerdas frotadas, colchones y voces** (polifónicos, ataque lento)

| inst | rango | carácter y uso |
|---|---|---|
| `cuerdas` | C2–C7 | sección de cuerdas; colchones, acordes, crescendos (`%` = trémolo) |
| `tremolo` | C2–C7 | cuerdas en trémolo; tensión, peligro, la Garza |
| `violin` | G3–E7 | violín solista; melodías expresivas con `_` |
| `chelo` | C2–A5 | violonchelo; contracantos graves, tristeza |
| `pad` | C2–C6 | colchón cálido de sintetizador; intros, niebla, fondo |
| `coro` | C3–C6 | coro "aah"; majestuoso, la Garza, misterio |
| `coroU` | C3–C6 | coro "ooh"; suave, nocturno, nana |

**Metales**: `trompa` (F2–F5; llamadas heroicas, crecidas) · `metales` (E2–C6; golpes, fanfarrias) ·
`golpe` (C3–C6; golpe orquestal: metales + cuerdas + timbal + platillo en la primera nota).

**Bajos**: `fretless` (B0–G3; sin trastes, redondo, "mwah", el bajo por defecto) · `contrabajo`
(arriba) · `bajo` (B0–G3; sintetizador suave, para pulsos sencillos).

Alias en inglés: harp guitar pizz upright bass xylophone glockenspiel musicbox vibraphone bell timpani
flute panflute whistle clarinet strings cello choir choirOoh accordion harmonica horn brass hit drums.

Prueba cualquiera: `tools/musica.sh inst:kalimba` (escala, notas largas, staccato, acorde, ligado) o
la pestaña *Instrumentos* de la gramola.

## 6. Mezcla

- **Volumen de pista** (`vol`): melodía .5–.65, contracantos .35–.45, ostinatos .4–.5, colchones
  .25–.35, bajo .65–.75, percusión .5–.65 (dentro, cada golpe ya está equilibrado: shaker y hat bajos,
  bombo y congas presentes). La fuerza de las notas (`mf`, `!`) hace el resto: escribe dinámica.
- **Panorama** (`pan`, −1..1): melodía casi al centro (±.1), bajo y bombo al centro, el resto
  repartido (marimba .3, arpa −.35, guitarra −.4, glock .45). Cada percusión trae su panorama.
- **Reverb** (`rev`, envío a la sala compartida de 2.7 s): bajo .05, percusión .12–.15, marimba .2,
  guitarra .2, melodías .3–.38, colchones y coros .4–.5. Si no lo pones, cada instrumento trae uno.
- **Eco** (`eco`, envío al eco de la canción, que va a tempo): kalimba .3, vibráfono .2, zampona .15.
- Deja sitio: pocas pistas a la vez (6–9), registros separados (bajo abajo, ostinato en medio,
  melodía arriba), secciones que respiran (quita la percusión en un puente, deja sola la kalimba).
- La música suena sobre un **ambiente** (§7) que ya pone grillos, ranas y agua: no hace falta
  imitarlo, pero sí dejarle hueco (intros y colas tranquilas).
- Loudness: `tools/musica.sh` da el RMS por sección. Apunta a −16…−19 dBFS en las secciones llenas,
  −22…−26 en intros y puentes, pico por debajo de −1 dBFS y 0 recortes.

## 7. Ambientes

`Sound.ambiente(nombre, { vol })` pone el paisaje sonoro de un lugar, con fundido; `null` lo quita.
Suenan aparte de la música (bus propio) y nunca se repiten: cada grillo, rana o pájaro sale con
tiempo, tono, panorama y distancia al azar.

| nombre (alias) | qué suena |
|---|---|
| `atardecer` (dusk) | pantano al atardecer: agua que chapotea, grillos, ranas que se contestan, algún pez que salta, un pájaro lejos |
| `noche` (night) | juncos de noche: viento en los juncos, insectos, ranitas, un búho, hojas |
| `raices` (roots) | bosque de raíces: madera que cruje, hojas, pájaro carpintero, cigarras, pájaros |
| `tormenta` (storm) | lluvia, rachas de viento, truenos lejanos, goteras, ranas toro |
| `cueva` (cave) | gotas con eco, zumbido grave, un hilo de agua, burbujas, piedrecitas |
| `rio` (river) | río subterráneo: agua que corre, burbujas, gotas, zumbido |
| `nido` (nest) | viento en lo alto (silba), ramas que crujen, la garza a lo lejos |
| `alba` (dawn) | amanecer: pájaros cantores, una tórtola, agua tranquila |

El juego los pone solo: cada nivel suena con `ambiente` de su definición o, si no tiene, con su
`theme` (dusk, night, storm, cave, nest); el título y el mapa con `atardecer`; las cinemáticas por
plano (`amb:` en `cine.js` y `final.js`). `Sound.rain(true)` añade lluvia encima de cualquiera.

## 8. Herramientas

```
tools/musica.sh marsh               # renderiza la primera vuelta + 10 s → artifacts/musica/marsh.wav y .png
tools/musica.sh marsh 60            # 60 segundos
tools/musica.sh marsh 60 --amb=atardecer   # con el ambiente debajo
tools/musica.sh amb:noche 30        # un ambiente solo
tools/musica.sh inst:vibrafono      # un instrumento solo
tools/musica.sh --todas             # resumen de todas: duración, compases distintos, avisos
tools/musica.sh marsh 12 --vivo     # el motor en vivo (AudioContext real): errores y CPU del planificador
tools/musica.sh marsh 60 --perf     # coste de síntesis (porcentaje de tiempo real en un núcleo)
tools/musica.sh --calibrar          # sonoridad de cada instrumento, lado a lado
tools/musica.sh sfx:glup:1.5        # un efecto de Sound.play (con su argumento) → WAV, PNG, pico y sonoridad
tools/musica.sh --sfx               # todos los efectos → artifacts/musica/sfx/ y una tabla de sonoridad
tools/musica.sh --sfxcoste          # cuánto tarda en renderizarse cada efecto
```

El informe da: pico y RMS, **RMS por sección**, recortes, huecos de silencio, notas por pista,
**compases distintos** de la primera vuelta (si salen pocos, la canción es repetitiva), cuánto dura
antes de volver y los **AVISOS** (compases que no suman, notas fuera de rango, cifrados o nombres
desconocidos). El PNG tiene la forma de onda arriba (rojo = recorte), el espectrograma y una franja
de color por sección (con marca blanca si es una repetición). Míralo: una canción viva tiene
secciones con densidades distintas.

Para escuchar: `index.html?gramola=1` abre la **gramola** (canciones, ambientes, instrumentos y efectos;
en el móvil, tocar). Enseña la sección y el compás que suenan.

Desde el código del juego: `Sound.playMusic(nombre)` (fundido cruzado de ~1.3 s), `stopMusic()`,
`ambiente(nombre)`, `duck(true)` (baja música y ambiente en pausas y diálogos), `play(efecto, arg, { x | pan })`
(x: posición en el mundo, se convierte en panorama),
`tocar(inst, nota, dur, fuerza, { pan, rev, en })` (una nota suelta fuera de canción, para efectos),
`estado()`, `info(nombre)`, `validar(nombre)`.

## 9. Consejos de estilo (Rayman 1)

- Una melodía que se pueda tararear, en frases de 4+4 compases, con una nota larga que respire y un
  punto alto en la segunda frase. Después, **varíala** (ornamentos, octava, otra voz, otro final).
- Armonía con color: acordes de 7.ª y 9.ª, dórico, préstamos (♭VI, ♭VII, IV menor), dominantes
  secundarias; un puente que se vaya a otro sitio (♭II lidio, relativo mayor) y vuelva.
- Un motor rítmico acústico (marimba, kalimba, guitarra) y un bajo que cante, con deslizamientos.
- Percusión de mano, ligera, con swing; rellenos cada 4 compases; percusión que entra y sale.
- Forma larga: intro → A → A' → B → puente → A'' → cola, y `vuelta` a A (no a la intro).
- Menos es más: silencios, secciones desnudas, dinámica. Deja que la reverb y el ambiente respiren.
