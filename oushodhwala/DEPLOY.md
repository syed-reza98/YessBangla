# Oushodhwala — cPanel + Passenger deploy

## Local verify

```bash
cd oushodhwala
# Apply schema gaps (XAMPP):
/opt/lampp/bin/mysql -u root < scripts/migrate-remaining.sql
npm run build
npm run build:cpanel
```

Standalone output: `.next/standalone/server.js`  
Uploads: ensure `public/uploads` is writable.

## cPanel

1. Create MySQL DB/user `oushodhwala_db` (utf8mb4); do not share credentials with other apps.
2. Set env in cPanel Node app (never commit):
   - `DATABASE_URL=mysql://USER:PASS@localhost:3306/oushodhwala_db`
   - `AUTH_SECRET=…` (≥32 chars)
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
   - `LOVABLE_API_KEY=…` (optional, AskChat)
3. Point document root / Passenger startup to standalone `server.js`; set `PORT`.
4. `.htaccess` proxy to Passenger port; rewrite `/uploads/*` to disk if needed.

## Smoke

- Staff login → `/admin`
- Customer catalog → checkout (`placeOrderAction`)
- Rx upload under `public/uploads`
- Guest AskChat rate-limited (+ honeypot field `website`)

## Apache

Copy `public/.htaccess` to the domain docroot; replace `PASSENGER_PORT` with the Node app PORT. Env vars stay in cPanel only (never commit `.env`).

## Standalone smoke

```bash
npm run build
PORT=3001 node .next/standalone/server.js
```
