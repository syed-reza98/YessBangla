# yessbgd — cPanel + Passenger deploy

## Local verify

```bash
cd yessbgd
/opt/lampp/bin/mysql -u root < scripts/migrate-remaining.sql
npm run build
npm run build:cpanel
```

Standalone: `.next/standalone/server.js`  
Uploads: `public/uploads` (media + resumes) must be writable.

## cPanel

1. MySQL DB/user `yessbgd_db` (utf8mb4) — dedicated credentials.
2. Env (cPanel Node app only):
   - `DATABASE_URL=mysql://USER:PASS@localhost:3306/yessbgd_db`
   - `AUTH_SECRET=…` (≥32 chars)
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
3. Passenger startup → standalone `server.js`; set `PORT`.
4. `.htaccess` proxy to Passenger; rewrite `/uploads/*` to disk.

## Smoke

- Public home / ventures / contact / careers apply (resume on disk)
- Admin login → CMS edit, messages, applications
- Application status lookup
