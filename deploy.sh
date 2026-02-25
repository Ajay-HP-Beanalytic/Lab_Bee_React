#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Lab_Bee_React}"
FRONTEND_DIR="$REPO_DIR/frontend"
BACKEND_DIR="$REPO_DIR/Backend"
WEB_ROOT="${WEB_ROOT:-/var/www/labbee}"
NGINX_SRC="$REPO_DIR/nginx/nginx.conf"
NGINX_DST="/etc/nginx/sites-available/labbee.beanlytic.com"
NGINX_LINK="/etc/nginx/sites-enabled/labbee.beanlytic.com"
BACKEND_APP_NAME="${BACKEND_APP_NAME:-labbee}"

echo "==> Deploy started"

echo "==> Pulling latest code"
cd "$REPO_DIR"
git pull

echo "==> Building frontend"
cd "$FRONTEND_DIR"
npm install
npm run build

echo "==> Publishing frontend to $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "$FRONTEND_DIR/build/" "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

echo "==> Updating backend dependencies"
cd "$BACKEND_DIR"
npm install

if pm2 describe "$BACKEND_APP_NAME" >/dev/null 2>&1; then
  echo "==> Restarting backend app: $BACKEND_APP_NAME"
  pm2 restart "$BACKEND_APP_NAME" --update-env
else
  echo "==> PM2 app not found, starting first-time app: $BACKEND_APP_NAME"
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo "==> Updating nginx config"
sudo cp "$NGINX_SRC" "$NGINX_DST"
sudo ln -sf "$NGINX_DST" "$NGINX_LINK"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Health checks"
curl -fsSI http://127.0.0.1:4002/api/testing >/dev/null
curl -fsSI https://labbee.beanalytic.com >/dev/null

echo "==> Deploy completed successfully"
