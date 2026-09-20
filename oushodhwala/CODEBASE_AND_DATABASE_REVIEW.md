# 🏥 Oushodhwala (ঔষধওয়ালা) — Comprehensive Codebase & Database Review

**Audit Date**: September 21, 2026  
**Target Repository**: `/home/syed/workspace/YessBangla/oushodhwala`  
**Target Database**: Local XAMPP MySQL (`oushodhwala_db` on `127.0.0.1:3306`)  
**Stack Architecture**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Auth.js v5 + Drizzle ORM (MySQL)  

---

## 1. Executive Summary & Health Matrix

This document provides an exhaustive, deep-dive architectural, security, and database audit of **`oushodhwala`**, the e-pharmacy, clinical services, and healthcare ERP platform of the YessBangla ecosystem.

Although previous documentation ([`REMAINING_WORK.md`](../REMAINING_WORK.md)) marked `oushodhwala` as **"~100%" complete**, this audit reveals that the application is operating on top of **temporary compatibility shims** that mask fatal runtime errors:
1. `npm run build` succeeds only because `typescript.ignoreBuildErrors: true` in [`next.config.ts`](./next.config.ts) suppresses **330 TypeScript errors across 79 files**, and root dynamic rendering prevents pre-rendering evaluation.
2. In the local XAMPP MySQL database, **27 required tables are completely missing**, causing immediate `ERROR 1146 (Table doesn't exist)` when accessed.
3. The custom `supabase` compatibility shim lacks essential query methods (`.upsert()`, `.or()`, `.ilike()`, `.lte()`, `.gte()`, `.channel()`, `.download()`), causing runtime `TypeError` crashes during product search, catalog filtering, and order tracking.
4. **34 dead `supabase.rpc(...)` calls** return inert `{ data: null, error: null }` mocks, rendering critical back-office operations (order status updating, stock count application, inventory adjustments, purchase orders) completely non-functional while misleading administrators with false "success" toasts.
5. A **critical security vulnerability in `/api/db`** allows any authenticated user (including regular customer accounts) to dump the entire database, including bcrypt password hashes and private patient prescription records.

### Health Matrix

| Dimension | Audit Status | Severity | Summary Finding |
| :--- | :--- | :--- | :--- |
| **Authentication & Authorization** | 🟡 Partial | 🚨 Critical | Role checking exists, but `/api/db` route exposes full database dump to any logged-in user. |
| **Payment Gateway** | 🔴 Simulated | 🚨 Critical | Users can type arbitrary text to auto-approve payments as `"paid"`. |
| **Database Structure** | 🔴 Incomplete | 🔴 High | 27 queried tables missing; 0 foreign keys; missing composite search indexes. |
| **Schema Alignment** | 🔴 Incompatible | 🔴 High | Queries expect legacy Supabase column names (`active`, `price`, `rx`, `reviews`) instead of MySQL columns. |
| **Runtime Reliability** | 🔴 Broken | 🔴 High | Missing QueryBuilder methods (`.or()`, `.upsert()`) crash search and product editing. |
| **Back-Office ERP Functions**| 🔴 Non-Functional| 🔴 High | 34 `supabase.rpc` calls silently do nothing; order status changes and stock adjustments fail. |
| **Admin UI Decomposition** | 🟡 Fragmented | 🟡 Medium | Monolith split left variables misplaced (`emptyProduct`, `emptyDoctor`, `STATUS`), crashing tabs. |
| **TypeScript Strictness** | 🔴 Suppressed | 🟡 Medium | 330 compile errors masked by `ignoreBuildErrors: true`. |
| **Tooling & CI/CD** | 🔴 Broken | 🔵 Low | `eslint.config.js` crashes; CI uses invalid `bunx tsgo`; dead TanStack/Vite artifacts remain. |

---

## 2. 🚨 Critical Security Vulnerabilities

### 2.1 Full Database Extraction via Unprotected Select in `/api/db`
* **File**: [`src/app/api/db/route.ts:33-53`](./src/app/api/db/route.ts#L33-L53)
* **Vulnerability Analysis**:
  ```typescript
  async function assertAccess(action: string, table: string) {
    if (action === "select" && PUBLIC_SELECT.has(table)) return;
    if (action === "insert" && PUBLIC_INSERT.has(table)) return;

    const session = await auth();
    if (!session?.user) {
      throw Object.assign(new Error("Authentication required"), { status: 401 });
    }

    if (action === "select") return; // <--- CRITICAL SECURITY HOLE
  ```
* **Impact**: Once a user is authenticated (even with the default customer role `customer`), the function returns early without checking table sensitivity or row ownership. Any authenticated client can execute:
  ```json
  POST /api/db
  { "action": "select", "table": "users" }
  ```
  This immediately dumps the entire `users` table, exposing **bcrypt password hashes**, or dumps `prescriptions` (exposing confidential medical diagnoses and prescription photos), `orders`, and `chart_accounts`.
* **Remediation**: Completely eliminate `/api/db` as planned in Phase B, or restrict `action === "select"` strictly to `STAFF_ROLES` with user-specific row filtering.

### 2.2 Unverified Simulated Payment Auto-Approval
* **Files**: [`src/routes/checkout.tsx:348`](./src/routes/checkout.tsx#L348), [`src/actions/orders.ts:92-94`](./src/actions/orders.ts#L92-L94)
* **Vulnerability Analysis**:
  In `checkout.tsx`, selecting mobile banking (bKash, Nagad) or Card displays a placeholder text box for an arbitrary transaction ID. In `placeOrderAction`:
  ```typescript
  paymentStatus: input.paymentMethod && input.paymentMethod !== "cod" ? "paid" : "unpaid"
  ```
* **Impact**: Any user can select "bKash", enter `"123456"`, and submit. The order is recorded with `paymentStatus = 'paid'` without verifying transaction existence, amount, or recipient with a merchant gateway.
* **Remediation**: Keep mobile banking payments in `unpaid` or `verifying` status until verified via bKash Merchant API / SSLCommerz IPN webhook or manual admin review.

### 2.3 Client-Side Auth Rate Limiting Bypass
* **File**: [`src/lib/auth-rate-limit.ts:40`](./src/lib/auth-rate-limit.ts#L40)
* **Vulnerability Analysis**: OTP request and password reset attempt rate limiting is stored in `localStorage` under `ow-auth-rate-v1`.
* **Impact**: Automated scrapers or credential stuffers can clear `localStorage` or send raw HTTP requests to bypass rate limiting completely. Rate limits must be enforced on the server.

---

## 3. 🗄️ Local XAMPP MySQL Database Review (`oushodhwala_db`)

### 3.1 Database Environment Status
* **Host**: `127.0.0.1:3306` (Local XAMPP MariaDB/MySQL)
* **Database**: `oushodhwala_db`
* **Default Charset**: `utf8mb4`
* **Default Collation**: `utf8mb4_unicode_ci` (Bilingual English/Bangla text verified)
* **Total Tables in DB**: **41 tables**
* **Total Tables Queried by Codebase**: **56 tables**

### 3.2 The 27 Missing Tables
A programmatic audit of all `.from("<table_name>")` call sites against `oushodhwala_db` reveals that **27 required tables do not exist in the database**:

```
 1. api_endpoints               10. doctor_blackouts           19. prescription_audit
 2. api_integrations            11. doctor_reviews             20. product_image_audit
 3. api_test_logs               12. error_logs                 21. product_reviews
 4. consultation_media          13. image_audit_log            22. riders
 5. consultation_messages       14. image_import_failures      23. stock_adjustments
 6. consultation_prescriptions  15. image_import_runs          24. stock_count_items
 7. delivery_events             16. image_revisions            25. stock_counts
 8. delivery_notifications      17. medicine_directory         26. stock_movements
 9. delivery_zones              18. order_returns              27. stock_transfer_items
```

#### Impact of Missing Tables:
* **`medicine_directory`**: Visiting `/medicines` triggers a database error, rendering the public directory broken.
* **`riders` & `delivery_events`**: The delivery panel (`/delivery`) and tracking tokens (`/t/[token]`, `/track/[no]`) fail when fetching rider status or delivery milestones.
* **`stock_adjustments` & `stock_counts`**: `StockOpsAdmin.tsx` fails to list or record inventory counts and discrepancy adjustments.
* **`order_returns`**: When a customer clicks "Return Order" on [`src/routes/orders.tsx:83`](./src/routes/orders.tsx#L83), the insert fails with `Table 'oushodhwala_db.order_returns' doesn't exist`.
* **`consultation_messages` & `consultation_media`**: Real-time telemedicine chat and consultation file sharing fail completely.

### 3.3 Column Name Mismatches & Verified MySQL Errors
The database tables created in XAMPP adhere to clean snake_case conventions, but legacy components query old Supabase column names.

#### Verified MySQL Execution Failures:
1. **Catalog Query Failure**:
   ```sql
   -- Codebase executes (via QueryBuilder/catalog.functions.ts):
   SELECT * FROM products WHERE active = 1 ORDER BY reviews DESC;
   -- MySQL Error:
   ERROR 1054 (42S22): Unknown column 'active' in 'where clause'
   ```
2. **Catalog Sort Failure**:
   ```sql
   -- Correcting active -> is_active:
   SELECT * FROM products WHERE is_active = 1 ORDER BY reviews DESC;
   -- MySQL Error:
   ERROR 1054 (42S22): Unknown column 'reviews' in 'order clause'
   ```

#### Summary of Column Discrepancies:
| Table | Real MySQL Column | Queried by Application Code | Resulting Defect |
| :--- | :--- | :--- | :--- |
| `products` | `is_active` | `active` | `ERROR 1054: Unknown column 'active'` |
| `products` | `unit_price` | `price` | Price filter and sorting throw SQL error |
| `products` | `requires_prescription` | `rx` | Prescription filter `eq("rx", true)` fails |
| `products` | `category_id` | `category` | Category filter fails |
| `products` | *(None)* | `reviews`, `rating` | Sort by popularity/rating fails |
| `products` | *(None)* | `en`, `brand` | Search keyword expansion crashes |
| `orders` | `order_number` | `order_no` | Admin UI renders `#{o.order_no}` as `#undefined` |
| `orders` | `customer_phone` | `phone` | Admin UI customer phone renders as `undefined` |
| `orders` | `delivery_address`| `address` | Admin UI address renders as `undefined` |
| `categories` | `is_active` | `active` | Toggling category status fails |
| `categories` | `name` | `bn`, `en` | Admin edit modal displays blank fields |
| `categories` | *(None)* | `emoji`, `home_delivery`, `service_route` | Category form fields discarded |

### 3.4 Zero Foreign Keys & Referential Integrity
A query against `information_schema.KEY_COLUMN_USAGE` confirms **zero foreign keys exist in `oushodhwala_db`**:
* `order_items.order_id` has no foreign key to `orders.id`.
* `pos_sale_items.sale_id` has no foreign key to `pos_sales.id`.
* `prescription_shares.prescription_id` has no foreign key to `prescriptions.id`.
* `loyalty_transactions.account_id` has no foreign key to `loyalty_accounts.id`.
* `appointments.doctor_id` has no foreign key to `doctors.id`.

> **Risk**: Cascade deletions do not occur, orphan records accumulate, and foreign key integrity is not guaranteed at the storage engine level.

### 3.5 Missing Secondary Indexes (Full Table Scans)
Only primary keys and unique columns are indexed. High-frequency filter columns lack indexes:
* **`products`**: No indexes on `name`, `generic_name`, `category_id`, or `is_active`. Every medicine search or category filter forces a full table scan.
* **`orders`**: No indexes on `customer_id`, `status`, or `created_at`.
* **`order_items`**: No indexes on `order_id` or `product_id`.
* **`pos_sale_items`**: No indexes on `sale_id` or `product_id`.
* **`prescriptions`**: No indexes on `user_id` or `status`.

### 3.6 Seed Script Defect: Duplicate Roles
* **File**: [`scripts/seed.sql:25-29`](./scripts/seed.sql#L25-L29)
* **Defect**: The seed script inserts rows into `user_roles` using `UUID()` as the primary key:
  ```sql
  INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (UUID(), '...', 'super_admin');
  ```
  Because `id` is dynamically generated and there is no `UNIQUE KEY (user_id, role)` constraint, `INSERT IGNORE` never detects a duplicate. Re-running the seed script created duplicate roles for all four seeded users.
* **Current DB State**: Each seeded user currently has two identical role entries in `user_roles`.

---

## 4. 💥 Compatibility Shim & Runtime Failures

### 4.1 34 Dead `supabase.rpc(...)` Calls
In [`src/integrations/supabase/client.ts:176`](./src/integrations/supabase/client.ts#L176):
```typescript
async rpc(_name: string, _params?: any) {
  return { data: null, error: null };
}
```
All RPC calls return empty mocks without executing database operations. This breaks 34 operational functions:

1. **Admin Order Status Updates** ([`tabs/Orders.tsx:22`](./src/components/admin/tabs/Orders.tsx#L22)): Admins click to update an order status, the toast announces "Order updated & notification sent", but `admin_set_order_status` does nothing. The database status never changes.
2. **Diagnostic Bookings** ([`DiagnosticsAdmin.tsx:62, 82`](./src/components/DiagnosticsAdmin.tsx#L62)): `admin_set_diagnostic_status` fails to update booking statuses.
3. **Branch Stock Transfers** ([`BranchesAdmin.tsx:153`](./src/components/BranchesAdmin.tsx#L153)): `transfer_set_status` does not update transfer statuses.
4. **Procurement Operations** ([`ProcurementAdmin.tsx`](./src/components/ProcurementAdmin.tsx)):
   * `admin_create_purchase_order` (PO creation fails silently)
   * `admin_receive_purchase_order` (Stock receiving fails silently)
   * `admin_adjust_stock` (Stock adjustments fail silently)
   * `admin_expiring_batches` (Returns empty array)
5. **Stock Ops** ([`StockOpsAdmin.tsx:68, 244`](./src/components/StockOpsAdmin.tsx#L68)): `apply_stock_adjustment` and `apply_stock_count` do not update inventory.
6. **Order GPS Geolocation** ([`checkout.tsx:159`](./src/routes/checkout.tsx#L159)): `save_order_location` fails silently, dropping customer latitude, longitude, and thana.
7. **Medicine Directory Filters** ([`medicine-directory.functions.ts:105`](./src/lib/medicine-directory.functions.ts#L105)): `medicine_directory_facets` returns `[]`, leaving company and group filters permanently empty.
8. **Admin Initialization** ([`admin.tsx:214, 247`](./src/routes/admin.tsx#L214)): `admin_exists` and `claim_first_admin` fail.

### 4.2 Missing QueryBuilder Methods (Runtime TypeErrors)
In [`src/integrations/supabase/client.ts`](./src/integrations/supabase/client.ts), `QueryBuilder` lacks standard methods used across the codebase:
* **Missing `.or()`**: Called in [`SearchBox.tsx:5`](./src/components/SearchBox.tsx), [`catalog.functions.ts:47`](./src/lib/catalog.functions.ts#L47), [`medicine-directory.functions.ts:47`](./src/lib/medicine-directory.functions.ts#L47), [`PosTerminal.tsx:104`](./src/components/PosTerminal.tsx#L104), [`AdminGlobalSearch.tsx:56`](./src/components/AdminGlobalSearch.tsx#L56), [`StockOpsAdmin.tsx:36`](./src/components/StockOpsAdmin.tsx#L36), and [`ProcurementAdmin.tsx:171`](./src/components/ProcurementAdmin.tsx#L171). Calling product search throws `TypeError: query.or is not a function`.
* **Missing `.upsert()`**: Called in [`tabs/Products.tsx:28`](./src/components/admin/tabs/Products.tsx#L28), [`tabs/Categories.tsx:46`](./src/components/admin/tabs/Categories.tsx#L46), [`tabs/Offers.tsx:40`](./src/components/admin/tabs/Offers.tsx#L40), and [`tabs/LabTests.tsx:32`](./src/components/admin/tabs/LabTests.tsx#L32). Adding or editing any product, category, offer, or lab test throws `TypeError: supabase.from(...).upsert is not a function`.
* **Missing `.ilike()`, `.gte()`, `.lte()`**: Called in [`ReportsAdmin.tsx:51`](./src/components/ReportsAdmin.tsx#L51), [`AccountsAdmin.tsx:47`](./src/components/AccountsAdmin.tsx#L47), and [`media.ts:33`](./src/lib/media.ts#L33).

### 4.3 Broken Realtime Tracking Subscriptions
* **Files**: [`src/routes/t.$token.tsx:82`](./src/routes/t.$token.tsx#L82), [`src/routes/track.$no.tsx:89`](./src/routes/track.$no.tsx#L89), [`src/routes/delivery.tsx:134`](./src/routes/delivery.tsx#L134)
* **Defect**: Components call:
  ```typescript
  const ch = supabase.channel(`public-track-${token}`).on(...).subscribe();
  ```
  Neither `channel` nor `removeChannel` exists on the mock `supabase` object. Accessing the customer tracking URL crashes the entire React tree with `TypeError: supabase.channel is not a function`.

### 4.4 Broken Prescription OCR Reader & Storage
* **File**: [`src/lib/rx-read.functions.ts:204, 413`](./src/lib/rx-read.functions.ts#L204)
* **Defect**: Calls `supabase.storage.from("prescriptions").download(path)` (no `.download()` method exists on mock storage) and calls `performRead(context.supabase, ...)` where `context.supabase` is undefined in [`start-compat.ts:20`](./src/lib/start-compat.ts#L20). The prescription reader crashes immediately.

### 4.5 Broken Authorization in Server Functions (`@/lib/authz`)
* **Files**: [`campaigns.functions.ts`](./src/lib/campaigns.functions.ts), [`revisions.functions.ts`](./src/lib/revisions.functions.ts), [`ops-log.functions.ts`](./src/lib/ops-log.functions.ts), [`integrations.functions.ts`](./src/lib/integrations.functions.ts), [`images.functions.ts`](./src/lib/images.functions.ts), [`api-hub.functions.ts`](./src/lib/api-hub.functions.ts)
* **Defect**: All these modules call `adminClient(context)`, `staffClient(context)`, or `requireUser(context)` from [`src/lib/authz.ts:48`](./src/lib/authz.ts#L48). Because `start-compat.ts` passes `context: {}`, `context.userId` and `context.supabase` are `undefined`, throwing `unauthorized()` 401 on every invocation.

---

## 5. 🧩 Monolith Decomposition & Admin Tab Runtime Errors

When the 1,787-line `admin.tsx` was sliced into separate files in `src/components/admin/tabs/`, constants and data models were cut into adjacent files without exports or imports:

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     tabs/Inventory.tsx    │         │     tabs/Products.tsx     │
│  [Defines emptyProduct] ──┼─MISSING─┼─▶ [Uses emptyProduct]     │
└───────────────────────────┘         └───────────────────────────┘
┌───────────────────────────┐         ┌───────────────────────────┐
│     tabs/LabTests.tsx     │         │      tabs/Doctors.tsx     │
│  [Defines emptyDoctor]  ──┼─MISSING─┼─▶ [Uses emptyDoctor]      │
└───────────────────────────┘         └───────────────────────────┘
┌───────────────────────────┐         ┌───────────────────────────┐
│      tabs/Offers.tsx      │         │     tabs/LabTests.tsx     │
│  [Defines emptyLab]     ──┼─MISSING─┼─▶ [Uses emptyLab]         │
└───────────────────────────┘         └───────────────────────────┘
┌───────────────────────────┐         ┌───────────────────────────┐
│      routes/admin.tsx     │         │      tabs/Orders.tsx      │
│  [Defines const STATUS] ──┼─MISSING─┼─▶ [Uses STATUS]           │
└───────────────────────────┘         └───────────────────────────┘
```

#### Consequences:
* **`tabs/Products.tsx:198`**: Clicking "Add Product" throws `ReferenceError: emptyProduct is not defined`.
* **`tabs/Doctors.tsx:23`**: Opening the Doctors tab throws `ReferenceError: emptyDoctor is not defined`.
* **`tabs/LabTests.tsx:23`**: Opening the Lab Tests tab throws `ReferenceError: emptyLab is not defined`.
* **`tabs/Orders.tsx:43`**: Opening the Orders tab throws `ReferenceError: STATUS is not defined`.
* **`tabs/Orders.tsx:72`**: The query requests `select("*, order_items(*)")`. Since `/api/db` does not perform PostgREST joins, `o.order_items` is `undefined`. Line 72 calls `o.order_items.map(...)`, crashing the Orders tab with `TypeError: Cannot read properties of undefined (reading 'map')`.
* **Pseudo-Routing**: Sub-routes like `/admin/inventory` simply mount `<Admin initialTab="inventory" />`, loading all 45+ management tabs in one bundle and using `window.history.replaceState` instead of Next.js navigation.

---

## 6. 🛠️ Build, Lint, CI/CD & Hygiene Issues

### 6.1 330 TypeScript Typecheck Errors
* Running `npx tsc --noEmit` produces **330 errors in 79 files**.
* Errors include missing module declarations (`@playwright/test`, `@tanstack/react-start/server-entry`), missing properties on mock clients (`channel`, `removeChannel`, `updateUser`), and implicit `any` parameters in strict mode.
* Masked in `next.config.ts` by:
  ```typescript
  typescript: {
    ignoreBuildErrors: true,
  }
  ```

### 6.2 Broken ESLint Configuration
* Running `npm run lint` fails with:
  ```
  Invalid project directory provided, no such directory: /home/syed/workspace/YessBangla/oushodhwala/lint
  ```
* Running `npx eslint .` crashes immediately with:
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'eslint-plugin-prettier'
  ```
* [`eslint.config.js`](./eslint.config.js) still contains TanStack Start rules that explicitly ban Next.js `server-only`.

### 6.3 Broken GitHub Actions CI Pipeline
* File: [`.github/workflows/ci.yml:16`](./.github/workflows/ci.yml#L16)
* The workflow runs:
  ```yaml
  - run: bun install
  - name: Typecheck
    run: bunx tsgo
  ```
* `tsgo` is not a valid TypeScript compiler (should be `npm run build` or `npx tsc --noEmit`). Furthermore, `bun.lock` was deleted and replaced by `package-lock.json`, causing the CI pipeline to fail.

### 6.4 Dead Leftover Files
The project root and source tree retain unused artifacts from the pre-migration TanStack Start stack:
* `vite.config.ts`
* `bunfig.toml`
* `src/server.ts`
* `src/start.ts`
* `src/router.tsx`
* `src/routeTree.gen.ts`
* `.env` (staged for deletion in Git, but still on disk containing Supabase keys)

### 6.5 Missing Apache `.htaccess` for cPanel Deployment
* [`implementation_plan.md:247-255`](../implementation_plan.md#L247-L255) and [`DEPLOY.md:25`](./DEPLOY.md#L25) specify that cPanel deployments require an `.htaccess` reverse proxy rewrite to Phusion Passenger.
* No `.htaccess` file exists in the repository or is generated by [`scripts/package-cpanel.mjs`](./scripts/package-cpanel.mjs).

---

## 7. 🗺️ Actionable Remediation Roadmap

### Phase 1: Immediate Critical Fixes (Day 1)
1. **Secure `/api/db`**:
   Restrict `assertAccess` in [`src/app/api/db/route.ts`](./src/app/api/db/route.ts) so that only `STAFF_ROLES` can select from non-public tables, and completely disallow access to `users` and `user_roles`.
2. **Fix Admin Tab Constants**:
   Create `src/components/admin/admin-constants.ts` exporting `emptyProduct`, `emptyDoctor`, `emptyLab`, and `STATUS`. Import them properly across `Inventory.tsx`, `Products.tsx`, `LabTests.tsx`, `Doctors.tsx`, `Offers.tsx`, and `Orders.tsx`.
3. **Fix Orders Tab Crash**:
   In `tabs/Orders.tsx`, safeguard `(o.order_items ?? []).map(...)` and query `order_items` properly.
4. **Fix Unique Roles in DB**:
   Execute on `oushodhwala_db`:
   ```sql
   DELETE FROM user_roles WHERE id NOT IN (
     SELECT min_id FROM (SELECT MIN(id) AS min_id FROM user_roles GROUP BY user_id, role) t
   );
   ALTER TABLE user_roles ADD CONSTRAINT uq_user_role UNIQUE (user_id, role);
   ```

### Phase 2: Database Alignment & Missing Tables (Days 2–3)
1. **Apply Missing Tables Migration**:
   Create a SQL script defining the 27 missing tables (`medicine_directory`, `riders`, `delivery_events`, `stock_adjustments`, `stock_counts`, `order_returns`, etc.) and apply it to XAMPP MySQL.
2. **Add Missing Composite Indexes & Foreign Keys**:
   Add foreign keys (`ON DELETE CASCADE`) for `order_items`, `pos_sale_items`, `prescription_shares`, and `loyalty_transactions`.
   Add performance indexes on `products(is_active, category_id, name)` and `orders(customer_id, created_at)`.
3. **Align Column Names**:
   Update `catalog.functions.ts` and `medicine-directory.functions.ts` to query `is_active`, `unit_price`, and `requires_prescription` instead of legacy column names.

### Phase 3: Replace Dead RPCs with Typed Server Actions (Days 4–5)
1. **Order Status**: Replace `admin_set_order_status` RPC with an `updateOrderStatusAction` Server Action updating `orders.status` in Drizzle.
2. **Stock Adjustments & Transfers**: Replace `apply_stock_adjustment` and `transfer_set_status` with atomic Drizzle transactions.
3. **GPS Tracking**: Update `save_order_location` to write to `orders.deliveryAddress` or a new geolocation column.
4. **Medicine Directory Facets**: Implement `getMedicineFacets` using Drizzle SQL `COUNT(*)` aggregations over categories and manufacturers.

### Phase 4: Compatibility Shim Elimination & Clean Build (Days 6–7)
1. **Replace `@/integrations/supabase`**:
   Replace all remaining calls to `supabase.from(...)` with direct Drizzle queries in Server Actions or route handlers.
2. **Delete Dead TanStack Leftovers**:
   Remove `vite.config.ts`, `bunfig.toml`, `src/server.ts`, `src/start.ts`, `src/router.tsx`, and `src/routeTree.gen.ts`.
3. **Fix Tooling & CI**:
   Fix `eslint.config.js` to use `@next/eslint-plugin-next`, fix `ci.yml` to use `npm ci` and `npx tsc --noEmit`.
4. **Generate cPanel `.htaccess`**:
   Add `.htaccess` generation into `scripts/package-cpanel.mjs`.
5. **Turn off `ignoreBuildErrors`**:
   Set `typescript.ignoreBuildErrors: false` in `next.config.ts` and resolve any remaining type errors.
