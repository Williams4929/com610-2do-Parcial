#!/usr/bin/env bash
# Despliegue seguro de la API de libros en EC2 (lo ejecuta GitHub Actions por SSH).
#
# Uso: IMAGE=usuario/api-libros:<sha> bash deploy.sh
#
# 1. Descarga la imagen nueva y la prueba en un puerto temporal (3001).
# 2. Si /health y /libros responden, reemplaza al contenedor activo (puerto 3000).
# 3. Verifica de nuevo; si falla, restaura la imagen anterior y termina con error.
#
# La configuracion de RDS vive solo en EC2 (ENV_FILE) y nunca en el repositorio
# ni en la imagen. Los puertos se publican solo en 127.0.0.1: Nginx es la unica
# entrada desde Internet.

set -euo pipefail

IMAGE="${IMAGE:?Falta la variable IMAGE}"
APP="api-libros"
CANDIDATE="${APP}-candidato"
ENV_FILE="${ENV_FILE:-$HOME/api-libros.env}"
CA_FILE="${CA_FILE:-$HOME/certs/global-bundle.pem}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no existe $ENV_FILE con la configuracion de RDS"
  exit 1
fi

run_container() {
  # $1 = nombre, $2 = puerto local, $3 = imagen
  docker run -d \
    --name "$1" \
    --restart unless-stopped \
    --env-file "$ENV_FILE" \
    -e DB_SSL_CA=/certs/global-bundle.pem \
    -v "$CA_FILE":/certs/global-bundle.pem:ro \
    -p "127.0.0.1:$2:3000" \
    "$3" >/dev/null
}

check() {
  # $1 = puerto. Reintenta hasta 10 veces /health y /libros.
  for i in $(seq 1 10); do
    if curl -fs "http://127.0.0.1:$1/health" >/dev/null &&
       curl -fs "http://127.0.0.1:$1/libros" >/dev/null; then
      echo "Comprobacion OK en el puerto $1 (intento $i)"
      curl -fsS "http://127.0.0.1:$1/health"; echo
      return 0
    fi
    sleep 3
  done
  return 1
}

echo ">> Imagen a desplegar: $IMAGE"
docker pull "$IMAGE"

# Imagen que esta en produccion ahora (para poder restaurarla)
PREVIOUS_IMAGE="$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null || true)"
echo ">> Version anterior: ${PREVIOUS_IMAGE:-ninguna}"

# 1. Probar la nueva version en un puerto temporal
docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
run_container "$CANDIDATE" 3001 "$IMAGE"

if ! check 3001; then
  echo "ERROR: la nueva version no supero la comprobacion. Se conserva la version anterior."
  docker logs --tail 30 "$CANDIDATE" || true
  docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
  exit 1
fi
docker rm -f "$CANDIDATE" >/dev/null

# 2. Reemplazar el contenedor activo
docker rm -f "$APP" >/dev/null 2>&1 || true
run_container "$APP" 3000 "$IMAGE"

# 3. Verificacion final; si falla, restaurar la version anterior
if ! check 3000; then
  echo "ERROR: fallo la verificacion final."
  docker logs --tail 30 "$APP" || true
  docker rm -f "$APP" >/dev/null 2>&1 || true
  if [ -n "$PREVIOUS_IMAGE" ]; then
    echo ">> Restaurando la version anterior: $PREVIOUS_IMAGE"
    run_container "$APP" 3000 "$PREVIOUS_IMAGE"
    check 3000 || echo "ADVERTENCIA: la version anterior tampoco responde"
  fi
  exit 1
fi

echo ">> Despliegue exitoso de $IMAGE"
docker image prune -f >/dev/null || true
