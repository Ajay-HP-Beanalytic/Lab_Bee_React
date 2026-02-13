# Deployment Runbook (Frontend + Backend + Nginx)

## What was changed
- Frontend API base URL is now environment-driven in `frontend/src/Pages/APIPage.js`.
- Backend runtime env selection is based on `NODE_ENV` in `Backend/index.js`:
  - `production` -> `Backend/.env.production`
  - otherwise -> `Backend/.env.development`
- PM2 production config added in `Backend/ecosystem.config.js`.
- Nginx site config template added in `nginx/nginx.conf`:
  - Serves React build directly from Nginx
  - Proxies `/api/` to backend on `127.0.0.1:4002`
  - Proxies `/socket.io/` with websocket upgrade headers

## Why this was changed
- Remove manual code toggling between development and production.
- Avoid unstable production use of `serve -s build`.
- Prevent repeated websocket/proxy failures due to missing `/socket.io/` proxy block.
- Keep backend process stable with PM2 and explicit production env.

## Production source of truth
- Frontend env: `frontend/.env.production`
- Backend env: `Backend/.env.production`
- PM2 app: `labbee` via `Backend/ecosystem.config.js`
- Nginx site file on server:
  - `/etc/nginx/sites-available/labbee.beanlytic.com`
  - symlinked to `/etc/nginx/sites-enabled/labbee.beanlytic.com`

## Important rules
- Do not run backend with `npm run start` in production (this is nodemon/dev flow).
- Do not use `serve -s build` in production after Nginx static hosting is enabled.
- Use `KEY=VALUE` format in env files (no spaces around `=`).

## Standard production deploy flow
1. Pull latest code
```bash
cd ~/Lab_Bee_React
git pull
```

2. Build frontend
```bash
cd ~/Lab_Bee_React/frontend
npm install
npm run build
```

3. Restart backend (PM2)
```bash
cd ~/Lab_Bee_React/Backend
npm install
pm2 restart labbee --update-env
pm2 save
```

4. Reload Nginx (only if Nginx config changed)
```bash
sudo cp ~/Lab_Bee_React/nginx/nginx.conf /etc/nginx/sites-available/labbee.beanlytic.com
sudo ln -sf /etc/nginx/sites-available/labbee.beanlytic.com /etc/nginx/sites-enabled/labbee.beanlytic.com
sudo nginx -t
sudo systemctl reload nginx
```

## First-time PM2 setup (one-time)
```bash
cd ~/Lab_Bee_React/Backend
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Validation checks
```bash
pm2 list
pm2 logs labbee --lines 50
curl -I http://127.0.0.1:4002/api/testing
sudo nginx -t
sudo systemctl status nginx --no-pager
```

Expected:
- PM2 app `labbee` is `online`
- Backend log includes `Server is running on port 4002`
- API testing endpoint returns HTTP 200
- Nginx config test passes

## Troubleshooting

### 1) `502 Bad Gateway`
Meaning: Nginx could not reach upstream.
Checks:
- Backend running on `4002` (`pm2 list`, `pm2 logs`)
- Nginx proxy targets correct ports
- Nginx config valid (`sudo nginx -t`)

### 2) WebSocket failures (`/socket.io/... failed`)
Meaning: websocket upgrade path is not proxied correctly.
Fix:
- Ensure Nginx has `location /socket.io/` block with:
  - `proxy_http_version 1.1`
  - `Upgrade` and `Connection "upgrade"` headers
  - proxy to `http://127.0.0.1:4002/socket.io/`

### 3) `EMFILE: too many open files` from `serve -s build`
Meaning: frontend Node static server hit file descriptor limit.
Fix:
- Stop using `serve -s build` in production.
- Serve frontend static files via Nginx.

### 4) Backend starts on `4001` in production
Meaning: dev env loaded.
Fix:
- Start/restart PM2 with production env:
```bash
pm2 start ecosystem.config.js --env production
pm2 restart labbee --update-env
```

### 5) DB/session errors in logs
- `ER_DUP_ENTRY ... uq_session_id`:
  - Session insert was updated to upsert in `Backend/UsersData.js`.
- `ETIMEDOUT` DB:
  - Check MySQL health/network:
```bash
sudo systemctl status mysql --no-pager
sudo journalctl -u mysql -n 100 --no-pager
```

## Env file checklist

### `frontend/.env.production`
```env
REACT_APP_SERVER_BASE_ADDRESS=https://labbee.beanalytic.com
```

### `Backend/.env.production` (example keys)
```env
PORT=4002
USE_HTTPS=false
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_DATABASE=labbee
ADMIN_NAME=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_DEPARTMENT=...
ADMIN_ROLE=...
ADMIN_STATUS=Enable
```

## SSH host key warning note
If you see `REMOTE HOST IDENTIFICATION HAS CHANGED`:
- Verify new fingerprint in provider console.
- Remove old key locally:
```bash
ssh-keygen -R 62.72.59.80
```
- Reconnect and accept only if fingerprint matches.
