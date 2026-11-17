#!/bin/sh
# Renderiza una canción o un ambiente sin pantalla y da números (ver tools/musica.js).
#   tools/musica.sh marsh [segundos]   ·   tools/musica.sh amb:noche 30   ·   tools/musica.sh --todas
cd "$(dirname "$0")/.." || exit 1
exec node tools/musica.js "$@"
