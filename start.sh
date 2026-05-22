#!/bin/bash
# Arranca un servidor local y abre el simulador USICAMM en el navegador.
# Uso: ./start.sh         (puerto 8000)
#      ./start.sh 8080    (puerto custom)

set -e
cd "$(dirname "$0")"

PORT="${1:-8000}"

# Buscar un puerto libre si el solicitado está ocupado
while lsof -i :"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; do
  echo "Puerto $PORT ocupado, probando $((PORT+1))…"
  PORT=$((PORT+1))
done

URL="http://localhost:$PORT/"

echo "▶ Servidor en $URL"
echo "  Carpeta: $(pwd)"
echo "  Detener: Ctrl+C"
echo ""

# Abrir navegador después de 1 segundo (le da tiempo al server)
( sleep 1 && open "$URL" ) &

# Limpiar el proceso de open al terminar
trap 'echo ""; echo "▣ Servidor detenido."; exit 0' INT

# Arrancar el server (Python 3 trae http.server)
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m SimpleHTTPServer "$PORT"
else
  echo "✗ No se encontró Python. Instálalo o usa otro servidor estático."
  exit 1
fi
