# yessbgd — cPanel + Passenger deploy

## Local verify

```bash
cd yessbgd
/opt/lampp/bin/mysql -u root yessbgd_db < scripts/migrate-remaining.sql
npm run build
npm run build:cpanel
# Smoke standalone (replace DATABASE_URL for local smoke if needed):
PORT=3001 node .next/standalone/server.js
```

Standalone: `.next/standalone/server.js`  
Uploads: `public/uploads` (media + resumes) must be writable.
Apache: copy `public/.htaccess` to the domain docroot and set `PASSENGER_PORT` to the Node app PORT.

## cPanel

1. MySQL DB/user `yessbgd_db` (utf8mb4) — dedicated credentials.
2. Env (cPanel Node app only — never commit `.env` / `.env.local`):
   - `DATABASE_URL=mysql://USER:PASS@localhost:3306/yessbgd_db`
   - `AUTH_SECRET=…` (≥32 chars)
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
3. Passenger startup → standalone `server.js`; set `PORT`.
4. `.htaccess` (see `public/.htaccess`) proxies to Passenger; `/uploads/*` served from disk when the file exists.

## Smoke

- Public home / ventures / contact / careers apply (resume on disk)
- Admin login → CMS edit, messages, applications
- Application status lookup
