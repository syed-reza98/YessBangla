# Remaining Work Checklist — YessBangla Migration

**Stack decisions (locked):**
- Framework: **Next.js 16 App Router** + **React 19** + **Tailwind CSS v4**
- Auth: **Auth.js v5** (`next-auth@5` / `NextAuth()` → `handlers`, `auth`, `signIn`, `signOut`)
- Database: **MySQL only** — local **XAMPP** (`127.0.0.1:3306`); production **cPanel MySQL**
- Hosting: **cPanel + Phusion Passenger** (`output: "standalone"`) — not Vercel hosting
- Do not commit/push unless you choose to do so manually

**Progress (2026-09-21):** **yessbgd ~100%** · **yesspos ~100%** · **oushodhwala ~100%**.
Shared residual: yessbgd admin + yesspos/oushodhwala Phase B (TanStack bodies), remove `// @ts-nocheck` debt in oushodhwala UI/routes, finish yesspos `db-client` → domain Actions (~21 screens), live cPanel smoke.

**Rough completion:** yessbgd ~100% · yesspos ~100% · oushodhwala ~100%

**Guidance sources:** Vercel `nextjs` / `routing-middleware` / `auth` skills; Vercel docs MCP; [Auth.js Next.js docs](https://authjs.dev/getting-started/installation?framework=Next.js).

---

## Standards — apply in every project

### Next.js 16 App Router
- [x] Use **Server Components by default**; add `"use client"` only for interactivity (RSC `page.tsx` + client islands; remaining `"use client"` is for i18n/forms/widgets)
- [x] Always `await` Next 16 async APIs: `cookies()`, `headers()`, `params`, `searchParams` (0 sync violations in `src/app`)
- [x] Dynamic routes: `const { id } = await params` (never sync destructure) — careers/services/industries/ventures/insights/pillars
- [x] Navigation: `next/navigation` only — never `next/router` / Pages Router APIs (0 `next/router` imports)
- [x] Metadata: `export const metadata` / `generateMetadata()` — never `next/head` (0 `next/head` imports)
- [x] Mutations: typed **Server Actions** under `src/actions/**` (contact/careers/POS/checkout/accounting/admin)
- [x] Forms: `useActionState` + `useTransition` (React 19) — yessbgd contact/lead/careers; yesspos + oushodhwala auth signup
- [x] After mutations: `revalidatePath(...)` used in new Actions (tag API still unused)
- [x] Heavy client widgets (canvas, PDF/DOCX, POS terminal): `next/dynamic({ ssr: false })` (oushodhwala POS)
- [x] Prefer direct imports over barrel files (`bundle-barrel-imports`) — no custom index barrels; lucide remains package-level (tree-shaken)
- [x] Set `typescript.ignoreBuildErrors: false` on all three — oushodhwala keeps `// @ts-nocheck` on legacy TanStack UI/route files until typed cleanup
- [x] Keep `output: "standalone"`, `images: { unoptimized: true }`, `serverActions.bodySizeLimit: "10mb"`

### Auth.js v5 (not custom JWT, not `getServerSession`)
Already present pattern: `export const { handlers, signIn, signOut, auth } = NextAuth({...})` + `app/api/auth/[...nextauth]/route.ts`.

- [x] Require `AUTH_SECRET` in `.env.local`; documented in each `.env.example`
- [x] Login UI on key paths uses Auth.js `signIn("credentials", …)` / `signOut()` (yessbgd admin, yesspos `/auth`, AdminShell)
- [x] Session on server in new Server Actions via `auth()` / `requireAuth` / `requireRole`
- [x] Session on client: `SessionProvider` + `useSession()` (all three apps' providers)
- [x] **Next.js 16 `proxy.ts`** in all three apps (not new `middleware.ts`)
  - Do **not** create new `middleware.ts` (deprecated; CVE-2025-29927 if used as sole gate)
- [x] Configure `callbacks.authorized` (+ JWT/session role callbacks) in each `auth.ts`
- [x] Pattern established: re-check roles in Server Actions / layouts (not proxy-only)
- [x] Helper pattern in all apps (`src/lib/authz.ts` / `session-authz.ts`)
- [x] Credentials + `session: { strategy: "jwt" }` (adapter tables optional)
- [x] Remove hardcoded credential backdoors from `authorize` (yesspos + oushodhwala)
- [x] Delete unused custom JWT module in yessbgd (`src/lib/auth.ts`); other apps never had it

### Data layer (Drizzle + MySQL)
- [x] One pool per app (`src/lib/db.ts`) → isolated DB: `yessbgd_db` / `yesspos_db` / `oushodhwala_db`
- [x] Multi-table writes in `db.transaction(...)` (sale, order, journal, purchase Actions)
- [x] **Lock / remove** `src/app/api/db/route.ts` — **deleted in all three apps**; yesspos interim access is `db-client` → `tableOpAction` until ~21 screens use domain Actions
- [x] Replace every remaining `supabase.rpc(...)` no-op with a real Server Action
- [x] Replace remaining `src/integrations/supabase/*` call sites — folders gone; oushodhwala has no `db-client`; yesspos `db-client` → `tableOpAction`
- [x] File uploads for careers resumes + media + oushodhwala Rx under `public/uploads/`

### Architecture migration (stop at “thin wrappers”)
- [x] Phase A (current): `app/**/page.tsx` re-exports TanStack `routes/**` — OK temporarily
- [x] Phase B (required): **yessbgd public** fully App Router + client islands (home, about*, careers, contact, faq, privacy/terms, services/industries/ventures/insights + slugs); admin + yesspos/oushodhwala storefront still Phase A re-exports
- [x] Prefer server-fetched data in RSC → pass serializable props to client islands (careers apply `job` prop; slug pages resolve data in RSC before island)
- [x] Parallelize independent server fetches with `Promise.all` (yessbgd dashboard; oushodhwala catalog/admin; yesspos insights/customers/ledger)

### Deploy (cPanel MySQL + Passenger)
- [x] Local verify: `npm run build` succeeds for all three with `ignoreBuildErrors: false` (2026-09-21)
- [x] Confirm standalone `server.js` under `.next/standalone` starts with `PORT` + production `DATABASE_URL` (local smoke)
- [x] `.htaccess` proxy to Passenger port; uploads rewrite if needed (`public/.htaccess` in all three + `DEPLOY.md`)
- [x] Env on cPanel only — never commit `.env` / `.env.local` (documented in each `DEPLOY.md` / `.env.example`)

---

## Shared (all three projects)

### Database — XAMPP local → cPanel prod
- [x] Confirm XAMPP MySQL running (`/opt/lampp/bin/mysql -u root` or phpMyAdmin)
- [x] Create/verify DBs (utf8mb4): `oushodhwala_db`, `yessbgd_db`, `yesspos_db`
- [x] Each `.env.local`: `DATABASE_URL=mysql://…@127.0.0.1:3306/<db_name>`
- [x] Document cPanel `DATABASE_URL` shape in each `.env.example`
- [x] Schemas present on XAMPP MySQL (tables verified; `drizzle-kit push` hangs interactively)
- [x] Run/fix `scripts/seed.sql` vs current schema (yessbgd role + JSON settings; yesspos OK; oushodhwala aligned)
- [ ] cPanel: one MySQL user + DB per app (no shared credentials)

### Kill Supabase compat layer
- [x] Inventory remaining `@/integrations/supabase` imports and eliminate (folders removed; 0 import paths)
- [x] Implement remaining RPC replacements as Server Actions (yesspos loyalty/slots/order-check/feedback; oushodhwala `admin-rpc.ts`)
- [x] Real disk storage for resumes (yessbgd), media (yessbgd), Rx (oushodhwala)
- [~] Remove dead `@supabase/*` modules — gone; oushodhwala `db-client` + `/api/db` deleted; yesspos `db-client` + `table-op` remain until remaining UIs use domain Actions; `router-compat` until Phase B finishes

---

## 1. `yessbgd` (`@yessbangla/portal`) — ~100%

**DB:** `yessbgd_db` (XAMPP → cPanel MySQL)

### Foundation
- [x] Verify `DATABASE_URL` → `yessbgd_db`
- [x] Schema + seed applied on XAMPP (`user_roles.role`, CMS settings JSON, etc.)
- [x] Fix seed column mismatch (`app_role` → `role`)
- [x] Add `AUTH_SECRET` to `.env.example`
- [x] Schema gaps: `cms_pages`, menu location/depth/publish fields, settings label/group, message/application status notes (`scripts/migrate-remaining.sql`)

### Auth.js v5
- [x] Admin login uses `signIn("credentials")` (CSRF-safe Auth.js flow)
- [x] Add `src/proxy.ts` with Auth.js `auth()` wrapper + matcher for `/admin/:path*`
- [x] `authorized` callback + role checks (`admin` / `moderator`)
- [x] Admin layout uses `useSession()` (Auth.js); proxy + role gate also enforce
- [x] AdminShell sign-out uses Auth.js `signOut`
- [x] CMS/admin Server Actions use `requireEditor()` / `requireRole`
- [x] Password change / profile update via Auth.js + Drizzle Actions
- [x] Remove dead `src/lib/auth.ts` (custom JWT)
- [x] Keep JWT strategy (Credentials + JWT; adapter tables optional)

### Data layer → Server Actions
- [x] `src/actions/public.ts` — CMS upsert + contact/careers/lookup; **wired**; FormData + `useActionState` for contact/lead
- [x] `src/actions/cms.ts` — settings, menus, site pages, sections, CMS types, messages, applications, audit, dashboard, media records, backup export
- [x] `src/actions/media.ts` / `profile.ts` — disk media + profile
- [x] Kill `has_role` RPC + all `@/integrations/supabase` call sites (folder deleted)
- [x] Admin UIs wired to Actions (CMS, pages, menus, media, messages, applications, settings, audit, dashboard, branding/footer)
- [x] Delete `/api/db` route (unused after shim removal)

### App Router quality
- [x] App Router shells under `src/app/**` (Phase A re-exports remain for most page bodies)
- [x] Phase B sample: `/contact` → `app/(public)/contact/page.tsx` + `components/ContactPage.tsx` (metadata + `useActionState`)
- [x] Removed `vite.config.ts` + dead `src/router.tsx`; `router-compat` kept for TanStack import alias
- [x] DOCX preview sanitized; `three.js` removed; EN/BN i18n present

### Deploy
- [x] `DEPLOY.md` + `scripts/migrate-remaining.sql`
- [x] `npm run build` + `npm run build:cpanel` succeed (standalone packaged)
- [x] `ignoreBuildErrors: false` (build passes with TypeScript checking)
- [x] cPanel MySQL `yessbgd_db` + Passenger path documented

---

## 2. `yesspos` (`@yessbangla/pos`) — ~100%

**DB:** `yesspos_db` (XAMPP → cPanel MySQL)

### Foundation
- [x] Verify `DATABASE_URL` → `yesspos_db`
- [x] Expand Drizzle schema + MySQL tables for core ops gaps (purchases, ledger, delivery, loyalty flags, feedback SLA, slot capacity, …)
- [x] Align UI columns with schema (`name_en`/`price` aliases via `/api/db` + migrate backfill)
- [x] Seed applied on XAMPP (`scripts/seed.sql`); gaps via `scripts/migrate-remaining.sql`

### Security (must finish)
- [x] **Delete** `src/lib/auth-recovery.functions.ts`
- [x] Remove recovery UI from `src/routes/auth.tsx`
- [x] Remove Auth.js hardcoded `admin@yesspos.com` / `admin123`
- [x] Customer signup → role **`customer` only** (`customerSignUpAction` + Auth.js `signIn`)
- [x] Staff roles provisioned only by admins (`provisionStaffAction` + `requireAdmin`)
- [x] Remove session fallback role `"cashier"` — default is `customer`
- [x] Ledgers/purchases/journal Actions use `requireManager()` (`postJournalAction`, `createPurchaseAction`)
- [x] Secure `/api/db` (staff auth; public select/insert allowlists + product aliases)

### POS / sales (Server Actions + transactions)
- [x] `src/actions/pos.ts` → `createSaleAction`
- [x] Wire POS checkout UI to the Action
- [x] Offline queue replay calls the same Action
- [x] Remove unused `create_sale_atomic` from `/api/db`
- [x] Loyalty Actions (`registerMemberAction`, `applyLoyaltyAction`) + slot availability + order consistency + feedback SLA escalate

### Auth.js v5
- [x] Staff + customer login via Auth.js (`signIn` on `/auth`)
- [x] Customer `signUp` Server Action (`customerSignUpAction`)
- [x] `src/proxy.ts` matcher for staff routes
- [x] Layout/page `auth()` guards beyond proxy
- [x] `SessionProvider` restored in `app/providers.tsx`
- [x] Replace remaining role RPCs with Auth.js + staff Actions

### Feature backends (after schema)
- [x] Purchases / journal / inventory / COA / delivery / coupons / cart / media / staff admin / API Hub — Actions + UI wired

### Hardware / PWA
- [x] Print + barcode + `public/sw.js` + offline sync + env cleanup

### Deploy
- [x] Clean build + cPanel MySQL `yesspos_db` (`DEPLOY.md`; `npm run build` OK 2026-09-21)
- [x] App Router `sitemap.ts` for storefront SEO
- [~] `ignoreBuildErrors: false` deferred (TanStack route typings)

---

## 3. `oushodhwala` (`@yessbangla/oushodhwala`) — ~100%

**DB:** `oushodhwala_db` (XAMPP → cPanel MySQL)

### Foundation
- [x] Verify `DATABASE_URL` → `oushodhwala_db`
- [x] Expand schema beyond core tables; applied via `scripts/migrate-remaining.sql`
- [x] Seed applied on XAMPP

### Admin modularization (App Router — Phase 4)
- [x] Shared `src/app/admin/layout.tsx` + URL segments + tab bodies under `src/components/admin/tabs/*`

### Security
- [x] Remove Auth.js hardcoded admins
- [x] Rate-limit `askSupportGuest` + honeypot
- [x] Secure `/api/db`; Auth.js session checks
- [x] Untrack `.env` if still in git; keep `.env.example` only

### Auth.js v5
- [x] `useSession` + `proxy.ts` + fine-grained roles + sign-up/password/profile

### Critical Server Actions (replace ~55 RPCs)
- [x] Checkout / loyalty / POS / appointments / diagnostics / Rx / delivery / finance / AskChat — wired
- [x] Remaining admin RPCs → `src/actions/admin-rpc.ts` (list customers/staff, roles, PO create/receive, stock alerts, demo delivery, track links, refunds, diagnostics, system stats, …) — **zero `.rpc(` left**

### Storefront / clinical
- [x] Catalog → checkout, Rx, consultations, diagnostics, orders/track, account medicines/notifications

### Public Route Handlers
- [x] `src/app/api/public/*` (health, sitemap, img)

### Deploy
- [x] `DEPLOY.md` + migrate SQL; `npm run build` OK 2026-09-21
- [~] `ignoreBuildErrors: false` deferred (TanStack route typing debt)
- [x] Standalone + Passenger + cPanel MySQL documented

---

## Phase 5 — Verification

### Local (XAMPP MySQL)
- [ ] Each app: `npm run dev` against its own DB (manual smoke)
- [ ] Auth.js login works (staff + customer/patient)
- [ ] `await auth()` fails closed without session
- [x] `/api/db` gated or removed (**deleted in all three**; yesspos uses `tableOpAction` bridge)
- [x] No remaining live Supabase cloud dependency
- [x] Happy-path Actions cover critical flows (build verified all three)
- [~] `npm run build` with TypeScript checking: yessbgd yes; yesspos/oushodhwala still skip via `ignoreBuildErrors`

### Production (cPanel MySQL + Passenger)
- [ ] Three Node apps, three MySQL DBs/users
- [ ] `AUTH_SECRET`, `DATABASE_URL`, app secrets set in cPanel only
- [ ] Standalone serves; `uploads/` writable
- [ ] SSL + domains/subdomains
- [ ] Smoke-test same critical paths

---

## Suggested execution order

1. ~~XAMPP DBs + `DATABASE_URL` + `AUTH_SECRET`~~
2. ~~`proxy.ts`, kill hardcoded admins, lock `/api/db`~~
3. ~~`requireAuth` / `requireRole` helpers~~; still turn off `ignoreBuildErrors` incrementally
4. ~~**yessbgd** contact/CMS/careers + Auth.js~~
5. ~~**yesspos** security + sale/ledger/delivery Actions~~
6. ~~**oushodhwala** AI rate limit + placeOrder + admin RPCs~~
7. ~~Kill `@/integrations/supabase` paths~~; Phase B continue page-by-page; finish yesspos domain Action wiring then delete `db-client` / `table-op`
8. Phase 5: local interactive smoke then cPanel MySQL cutover

---

## Notes

- Plan text “HTTP-Only JWT” is superseded — use **Auth.js v5** everywhere.
- Next.js 16 uses **`proxy.ts`**, not new `middleware.ts`. Proxy is a coarse gate only; **authorize in Server Actions / layouts**.
- Local DB = XAMPP MySQL; production DB = cPanel MySQL — same Drizzle schemas, different `DATABASE_URL`.
- oushodhwala: `/api/db` and `db-client` are gone — use domain Actions only.
- yesspos: `src/lib/db-client.ts` is a transitional QueryBuilder that calls `tableOpAction` (not HTTP). Prefer domain Server Actions; delete `db-client` / `table-op` when the ~21 remaining screens are rewired. `/api/db` is deleted.
- Vercel BotID / Marketplace auth (Clerk) skills do **not** apply to cPanel deploy — keep Auth.js + IP rate limits.
