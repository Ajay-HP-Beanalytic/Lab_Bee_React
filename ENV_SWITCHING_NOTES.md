# Environment Switching Notes

## Why these changes
- Avoid manual code edits when switching between development and production.
- Keep environment-specific values in env files instead of source files.
- Use Nginx for TLS termination so Node can stay on HTTP behind the proxy.

## Frontend
- `frontend/src/Pages/APIPage.js` now reads the API base URL from
  `REACT_APP_SERVER_BASE_ADDRESS`.
- Environment-specific files:
  - `frontend/.env.development` for local dev.
  - `frontend/.env.production` for production builds.
- CRA behavior:
  - `npm start` uses `.env.development`.
  - `npm run build` uses `.env.production`.

## Backend
- `Backend/index.js` loads env vars with `dotenv`.
- `PORT` is now read from `process.env.PORT` (defaults to `4001`).
- HTTPS is controlled by `USE_HTTPS`.
  - If `USE_HTTPS=true`, Node expects `SSL_KEY_PATH` and `SSL_CERT_PATH`.
  - If `USE_HTTPS=false`, Node serves HTTP only.
- `Backend/.env.production` is the production env file.
  - Because Nginx terminates TLS, `USE_HTTPS=false` in production.
  - Nginx `server` block uses `listen 443 ssl` and proxies to
    `http://127.0.0.1:4002`.

## Nginx (production)
- Nginx owns the TLS certs (`ssl_certificate`, `ssl_certificate_key`).
- Backend runs on HTTP behind the proxy (`127.0.0.1:4002`).

## What to change when deploying
- Update `Backend/.env.production` with correct database credentials.
- Ensure Nginx proxies to the same port as `PORT` in `.env.production`.
