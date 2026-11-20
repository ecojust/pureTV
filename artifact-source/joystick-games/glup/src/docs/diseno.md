# GLUP — diseño del pantano (versión 2)

Documento de trabajo para ampliar el juego: más niveles, niveles más difíciles, vuelta atrás
(backtracking) con sentido y trucos que enseñan personajes del pantano.

## La historia que lo sostiene

La Garza se tragó a las crías de pez gato y huyó río arriba hasta el ciprés muerto. Nila y Bigotes
la siguen. Por el camino, cada cría rescatada vuelve nadando a casa… pero no todas se pueden alcanzar
a la primera: muchas están en rincones a los que sólo se llega con trucos que Bigotes aprende más
adelante.

**Por qué volver atrás:** el ciprés de la Garza está rodeado por un **muro de zarzas encantado**. Sólo
se abre cuando suficientes crías cantan juntas (la canción de las crías): hacen falta **N crías
rescatadas en total**. Con lo que se puede recoger en una sola pasada no llega: hay que volver a
niveles anteriores con los trucos nuevos para rescatar las crías escondidas. Ruca lo explica cuando
Nila llega al muro por primera vez, y el mapa muestra en cada lugar cuántas crías faltan y qué truco
hace falta para las que aún no se pueden alcanzar (con el icono del bocado).

N se fija al final para que obligue a volver al menos a 2–3 niveles: aproximadamente
`(crías alcanzables en una pasada) + 6`.

## Los maestros

Ningún truco se coge del suelo. Cada uno lo da un personaje del pantano que ofrece a Bigotes un
bocado; al comerlo, Bigotes aprende el truco (la ceremonia de `aprende.js`). Cada maestro vive en un
nivel, tiene su dibujo, su animación, su carácter y su diálogo (letra a letra, como Ruca), y a veces
un pequeño encargo antes de dar el bocado.

| Nivel | Maestro | Bocado | Truco |
|---|---|---|---|
| 1 El embarcadero | **Ruca**, la tortuga vieja | vilano de diente de león | Soplido |
| 2 Los juncos | **Lumi**, luciérnaga anciana, farolillo de los juncos | luciérnaga dorada | Aleteo |
| 3 El bosque de raíces (nuevo) | **Tía Lapa**, una lapa gruñona pegada a una roca | lapa del pantano | Ventosa |
| 4 El molino anegado | **Olga**, la nutria molinera | nenúfar azul | Trago de agua (chorro) |
| 5 El muelle del pescador (nuevo) | **Don Anselmo**, el viejo pescador | anzuelo viejo | Mordisco |
| 6 La turbera (nuevo) | **Canto**, el topo | canto de río | Panzazo |
| 7 La cueva de barro | **Don Pinzas**, el cangrejo cocinero | guindilla del pantano | Escupitajo picante |
| 8 El río subterráneo (nuevo) | **Alga**, la anguila | alga resbaladiza | Resbalón |
| 9 El nido de la Garza | (jefa) | — | — |

Encargos posibles (uno o dos niveles, no todos): Don Anselmo pide que le devuelvas su caja de
aparejos (llevar una caja hasta él); Don Pinzas necesita que le apagues el fogón que se le ha
descontrolado (agua); Olga quiere que empujes su balsa hasta el molino (soplido); Lumi sólo te da la
luciérnaga cuando enciendes los tres faroles del nivel.

## Reglas para diseñar niveles

- Pantallas de 20×14 celdas, mismas medidas y leyenda que ahora (ver cabecera de `levels.js`).
  Medidas de salto: 3 celdas de alto y 3 de hueco a pie; con aleteo 5 de alto y 6 de hueco; con caja
  y aleteo 6. Más arriba sólo anzuelos, muros de raíces y setas.
- **Un camino principal** que se puede terminar con los trucos que el jugador tiene al llegar al
  nivel más el que aprende en él (el maestro está a mitad del nivel, y la segunda mitad usa el truco
  nuevo a fondo).
- **Rincones secretos** con crías que exigen trucos de niveles **posteriores** (anotar cuáles en el
  nivel con `secretos: [{ poder, crias }]` para el mapa). Cada nivel 1–8 tiene al menos 2 rincones
  así.
- **Más difícil**: combinaciones de trucos, enemigos colocados con intención, zarzas y agua como
  castigo, tramos de habilidad con faroles (puntos de control) bien repartidos. Nunca injusto: todo
  salto se ve antes de hacerlo y hay farol antes de cada tramo duro.
- Entre 10 y 14 crías por nivel; los niveles nuevos, 12–18 pantallas de ancho (y alguno vertical).
- Cada nivel tiene su tema visual (`dusk`, `night`, `storm`, `cave`, `nest`; se pueden añadir) y su
  música.
- El bot (`tools/bot.js` + las rutas) tiene que poder terminar el camino principal de cada nivel con
  los trucos que se tienen en ese punto. Las rutas de los rincones secretos son opcionales.
