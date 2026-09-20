# 🛠️ Implementation Plan: Comprehensive Fixes for YessPOS

Implement all remediation steps for findings documented in [`CODEBASE_DATABASE_REVIEW.md`](file:///home/syed/workspace/YessBangla/yesspos/CODEBASE_DATABASE_REVIEW.md), addressing critical security vulnerabilities, query adapter runtime exceptions, schema-to-UI discrepancies, inventory desynchronization, and repository cleanup in [`yesspos`](file:///home/syed/workspace/YessBangla/yesspos). Reference legacy backup: `/home/syed/workspace/YessBangla_backups/pre_migration_backup/yesspos/`.

---

## User Review Required

> [!IMPORTANT]
> - **Default User Role**: Newly signed-up users on the public storefront (`/signin` or `/auth`) will strictly receive the `"customer"` role. Staff privileges (`cashier`, `manager`, `admin`, `super_admin`) are only provisioned by administrators via [`src/actions/staff.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/staff.ts).
> - **Server Code Decoupling**: Server-side functions ([`notify-dispatch.server.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/notify-dispatch.server.ts), [`care-chat.server.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/care-chat.server.ts), [`insights.functions.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/insights.functions.ts), [`assistant.functions.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/assistant.functions.ts)) will be refactored to query MySQL directly via Drizzle ORM (`@/lib/db`) rather than executing relative HTTP `fetch('/api/db')` calls, which fail in Node.js server environments.
> - **Dead Code Purge**: Leftover TanStack Start / Vite files (`src/server.ts`, `src/start.ts`, `src/router.tsx`, `vite.config.ts`, `src/integrations/supabase/auth-attacher.ts`) will be safely removed.

---

## Proposed Changes

### Phase 1: Security, Authentication & Role Hardening

#### [MODIFY] [`src/lib/use-my-role.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/use-my-role.ts)
* Change fallback role from `"cashier"` to `"customer"`, preventing unauthenticated or newly signed-up shoppers from automatically inheriting cashier privileges in the UI.

#### [MODIFY] [`src/integrations/supabase/auth-middleware.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/integrations/supabase/auth-middleware.ts)
* Replace the dummy `{ server: (fn) => fn }` stub with an authentic session validation check using Auth.js `auth()` from [`src/auth.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/auth.ts) and role verification.

#### [MODIFY] [`src/lib/care-chat.functions.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/care-chat.functions.ts)
* Add server-side in-memory sliding-window IP rate limiting (e.g. 15 requests per 10 minutes per IP) using client headers (`x-forwarded-for` / `x-real-ip`).
* Add honeypot field check to reject automated bot spam and prevent token exhaustion on Lovable AI gateway.

#### [MODIFY] [`src/actions/staff.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/staff.ts) & [`src/routes/auth.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/routes/auth.tsx)
* Replace legacy hardcoded `@sherapos.local` email domain with `@yesspos.local`.

---

### Phase 2: Database Query Adapter (`QueryBuilder`) & API Route Expansion

#### [MODIFY] [`src/integrations/supabase/client.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/integrations/supabase/client.ts)
* Extend [`QueryBuilder`](file:///home/syed/workspace/YessBangla/yesspos/src/integrations/supabase/client.ts#L3):
  * Add `.gte(col, val)`, `.lte(col, val)`, `.gt(col, val)`, `.lt(col, val)`
  * Add `.ilike(col, val)`, `.like(col, val)`
  * Add `.not(col, op, val)` and `.or(expr)`
  * Add `.upsert(data, options)`
* Extend `storage.from(bucket)`:
  * Add `createSignedUrl(path, ttl)` returning `{ data: { signedUrl: \`/uploads/\${path}\` }, error: null }` to fix the customer delivery tracking crash in [`track.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/routes/track.tsx).
* Extend `auth`:
  * Add `signUp({ email, password, options })` wired to [`customerSignUpAction`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/auth.ts#L14) to fix shopper registration on `/signin`.
  * Add `updateUser({ password })` wired to a new `updateMyPasswordAction`.

#### [MODIFY] [`src/app/api/db/route.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/app/api/db/route.ts)
* Update the SQL generator in `POST` to handle operators: `gte`, `lte`, `gt`, `lt`, `like`, `ilike`.
* Implement row aliasing for:
  * **`sales`**: Map `invoice_number` ↔ `invoice_no`, `paid_amount` ↔ `paid`, `due_amount` ↔ `due`, `customer_id` ↔ `contact_id`.
  * **`coupons`**: Map `discount_type` ↔ `type`, `discount_value` ↔ `value`, `min_order_amount` ↔ `min_amount`, `valid_until` ↔ `expires_on`.
  * **`product_stock`**: Map `quantity` ↔ `stock`.
* Update column filter aliases so filtering by `invoice_no`, `created_at`, `status` correctly maps to MySQL table columns.

---

### Phase 3: Server-Side Decoupling & Direct Drizzle Queries

#### [MODIFY] [`src/lib/notify-dispatch.server.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/notify-dispatch.server.ts)
* Replace `supabaseAdmin` calls with direct Drizzle ORM queries using `db` from [`src/lib/db.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/db.ts) on `customerNotifications` and `apiSettings`.
* Eliminates the illegal relative URL `fetch('/api/db')` error in Node.js.

#### [MODIFY] [`src/lib/care-chat.server.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/care-chat.server.ts)
* Replace `supabaseAdmin` calls with direct Drizzle queries for `businessSettings`, `siteContent`, `categories`, `products`, `deliveryZones`, and `coupons`.
* Eliminates relative URL fetches in server contexts.

#### [MODIFY] [`src/lib/insights.functions.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/insights.functions.ts) & [`src/lib/assistant.functions.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/assistant.functions.ts)
* Remove dependency on `context.supabase` (which is `undefined`).
* Query sales, products, expenses, and line items directly using `db` from [`src/lib/db.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/lib/db.ts) or `pool`.

---

### Phase 4: Stock Synchronization & Data Integrity

#### [MODIFY] [`src/actions/pos.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/pos.ts)
* In [`createSaleAction`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/pos.ts#L51):
  * Decrement `products.stock` in addition to `product_stock.quantity` so that public storefront listings and AI bots reflect real stock levels.
  * Ensure `customer_name` and `customer_phone` can be passed and persisted, or fetched from `contacts`.

#### [MODIFY] [`src/actions/accounting.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/accounting.ts)
* In [`createPurchaseAction`](file:///home/syed/workspace/YessBangla/yesspos/src/actions/accounting.ts#L70):
  * Increment `products.stock` in addition to `product_stock.quantity` when goods are received.

#### [MODIFY] [`src/routes/_authenticated/branches.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/routes/_authenticated/branches.tsx)
* Fix line 48 query to select `branch_id, quantity` (or rely on the `stock` alias) so branch stock totals display accurately.

---

### Phase 5: App Router Architecture & Cleanup

#### [MODIFY] [`src/proxy.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/proxy.ts)
* Add `export default proxy;` so both named and default exports are satisfied for Next.js 16 Proxy / Middleware detection.

#### [MODIFY] [`src/app/category/[slug]/page.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/app/category/[slug]/page.tsx) & [`src/app/product/[id]/page.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/app/product/[id]/page.tsx)
* Update page components to handle Next.js 16 async `params` (`const { slug } = await params;`).

#### [DELETE] Dead Files
* [`src/server.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/server.ts) (legacy TanStack server entry)
* [`src/start.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/start.ts) (legacy Vinxi/TanStack entry)
* [`src/router.tsx`](file:///home/syed/workspace/YessBangla/yesspos/src/router.tsx) (dead router setup)
* [`vite.config.ts`](file:///home/syed/workspace/YessBangla/yesspos/vite.config.ts) (obsolete Vite config)
* [`src/integrations/supabase/auth-attacher.ts`](file:///home/syed/workspace/YessBangla/yesspos/src/integrations/supabase/auth-attacher.ts) (unused TanStack middleware)

---

## Verification Plan

### Automated Build & Compiler Verification
1. **TypeScript Typecheck**:
   ```bash
   cd /home/syed/workspace/YessBangla/yesspos
   npx tsc --noEmit
   ```
   *Verify that previously detected errors (missing methods, non-existent modules) are resolved.*
2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Verify Turbopack compiles cleanly and standalone assets are generated.*
3. **cPanel Packaging**:
   ```bash
   npm run build:cpanel
   ```
   *Verify `.next/standalone` contains `server.js`, `public`, and `.next/static`.*

### Functional Verification
1. **POS Sales Counter**: Open `/pos`, verify "Today's sales" header loads without `.gte()` errors, apply a coupon to verify `.ilike()` works, and complete a test sale.
2. **Dashboard & Reports**: Verify `/dashboard` and `/reports` load without date-filtering crashes.
3. **Customer Registration & Tracking**: Test sign-up on `/signin`, and open `/track` with a proof of delivery photo to ensure `createSignedUrl` does not crash.
4. **AI Assistant & Support Chat**: Test `/assistant` and the storefront Care Chat to ensure live queries succeed without relative fetch errors.
