#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.next-app"
STANDALONE_DIR="$BUILD_DIR/standalone"
DIST_DIR="$ROOT_DIR/dist"
DEPLOY_DIR="$DIST_DIR/deploy"
ZIP_PATH="$DIST_DIR/bolao-copa-standalone.zip"

cd "$ROOT_DIR"

echo "Gerando build standalone..."
npm run build

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "Build standalone nao encontrado em $STANDALONE_DIR. Confira next.config.mjs."
  exit 1
fi

rm -rf "$DEPLOY_DIR" "$ZIP_PATH"
mkdir -p "$DEPLOY_DIR"

echo "Copiando runtime standalone..."
cp -a "$STANDALONE_DIR/." "$DEPLOY_DIR/"

echo "Copiando build do Next.js..."
mkdir -p "$DEPLOY_DIR/.next-app"
find "$BUILD_DIR" -mindepth 1 -maxdepth 1 \
  ! -name cache \
  ! -name standalone \
  -exec cp -a {} "$DEPLOY_DIR/.next-app/" \;

if [ -d "$ROOT_DIR/public" ]; then
  echo "Copiando public..."
  cp -a "$ROOT_DIR/public" "$DEPLOY_DIR/public"
fi

echo "Copiando Prisma e arquivos de referencia..."
cp -a "$ROOT_DIR/prisma" "$DEPLOY_DIR/prisma"
cp "$ROOT_DIR/.env.example" "$DEPLOY_DIR/.env.example"
cp "$ROOT_DIR/README.md" "$DEPLOY_DIR/README.md"

echo "Validando conteudo do pacote..."
test -f "$DEPLOY_DIR/server.js"
test -f "$DEPLOY_DIR/.next-app/BUILD_ID"

echo "Compactando pacote..."
(
  cd "$DEPLOY_DIR"
  zip -qr "$ZIP_PATH" .
)

echo ""
echo "Pacote pronto:"
echo "$ZIP_PATH"
