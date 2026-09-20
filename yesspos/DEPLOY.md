# YessPOS — cPanel + Passenger deploy

## Local verify

```bash
cd yesspos
# Apply schema gaps (XAMPP):
/opt/lampp/bin/mysql -u root yesspos_db < scripts/migrate-remaining.sql
npm run build
npm run build:cpanel
```

Standalone output: `.next/standalone/server.js`  
Uploads / proofs: ensure `public/uploads` is writable.

## cPanel

1. Create MySQL DB/user `yesspos_db` (utf8mb4); do not share credentials with other apps.
2. Set env in cPanel Node app (never commit):
   - `DATABASE_URL=mysql://USER:PASS@localhost:3306/yesspos_db`
   - `AUTH_SECRET=…` (≥32 chars)
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
   - `AUTH_URL` / `NEXTAUTH_URL` = same public origin if required by host
3. Point document root / Passenger startup to standalone `server.js`; set `PORT`.
4. `.htaccess` proxy to Passenger port; rewrite `/uploads/*` to disk if needed.

## Smoke

- Staff login → `/pos` → sale (stock decrement) → receipt print (58mm / 80mm / A4)
- Barcode labels → `/labels` (CODE128 from sku/barcode)
- Storefront cart → checkout (`placeDeliveryOrderAction`) → `/track` + `/my-orders`
- Delivery staff → `/delivery-orders` / `/riders` / `/delivery-zones` + proof upload
- Media → `/media` writes under `public/uploads`
