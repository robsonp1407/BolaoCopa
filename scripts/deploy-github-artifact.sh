#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bolao-copa}"
RELEASES_DIR="${RELEASES_DIR:-$APP_DIR/releases}"
SHARED_DIR="${SHARED_DIR:-$APP_DIR/shared}"
ARTIFACT_PATH="${ARTIFACT_PATH:-/tmp/bolao-copa-standalone.zip}"
PM2_NAME="${PM2_NAME:-bolao-copa}"
PORT="${PORT:-3000}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:$PORT}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "[deploy] artefato nao encontrado em $ARTIFACT_PATH"
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "[deploy] unzip nao encontrado"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] pm2 nao encontrado"
  exit 1
fi

RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
ENV_FILE="$SHARED_DIR/.env"

echo "[deploy] preparando diretorios em $APP_DIR"
mkdir -p "$RELEASES_DIR" "$SHARED_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "[deploy] crie o arquivo $ENV_FILE antes do primeiro deploy"
  exit 1
fi

echo "[deploy] descompactando release $RELEASE_ID"
mkdir -p "$RELEASE_DIR"
unzip -q "$ARTIFACT_PATH" -d "$RELEASE_DIR"
ln -sfn "$ENV_FILE" "$RELEASE_DIR/.env"

if [ ! -f "$RELEASE_DIR/server.js" ]; then
  echo "[deploy] server.js nao encontrado no pacote"
  exit 1
fi

echo "[deploy] ativando release atual"
ln -sfn "$RELEASE_DIR" "$APP_DIR/current"
cd "$APP_DIR/current"

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "[deploy] aplicando migrations Prisma"
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
  npx -y prisma@5.22.0 migrate deploy
fi

echo "[deploy] iniciando PM2: $PM2_NAME"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 delete "$PM2_NAME"
fi
PORT="$PORT" NODE_ENV=production pm2 start server.js --name "$PM2_NAME" --update-env

pm2 save

echo "[deploy] validando aplicacao local em $HEALTHCHECK_URL"
for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTHCHECK_URL" >/dev/null; then
    echo "[deploy] aplicacao local respondeu"
    break
  fi

  if [ "$attempt" = "30" ]; then
    echo "[deploy] aplicacao local nao respondeu apos $attempt tentativas"
    pm2 logs "$PM2_NAME" --lines 80 --nostream
    exit 1
  fi

  sleep 2
done

if [ "$BASE_URL" != "$HEALTHCHECK_URL" ]; then
  echo "[deploy] aviso: validacao publica configurada em $BASE_URL"
  if ! curl -fsS "$BASE_URL" >/dev/null; then
    echo "[deploy] aviso: URL publica ainda nao respondeu. Verifique Nginx/SSL separadamente."
  fi
fi

echo "[deploy] concluido"
