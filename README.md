# 🇧🇩 YessBangla Monorepo

Welcome to the **YessBangla Ecosystem** repository. This monorepo consolidates the complete software suite powering **Yess Bangladesh**, encompassing our enterprise corporate portal, cloud point-of-sale (POS) and inventory platform, and digital pharmacy/healthcare management system.

---

## 🏛️ Ecosystem Overview

| Project | Subdirectory | Purpose & Description | Primary Stack | Default Port |
| :--- | :--- | :--- | :--- | :--- |
| **YessBD Portal** | [`yessbgd`](./yessbgd) | Official corporate portal, showcasing 13+ ventures, dynamic CMS, team directory, and document generation (PDF/Word). | Next.js 16 (App Router), React 19, Tailwind CSS v4, Auth.js v5, MySQL | `3000` |
| **YessPOS** | [`yesspos`](./yesspos) | Cloud retail POS & ERP (Bazar Bari), barcode scanning, thermal printing (ESC/POS 58/80mm), offline-first capability, and double-entry accounting. | Next.js 16 (App Router), React 19, Tailwind CSS v4, Auth.js v5, MySQL | `3002` |
| **Oushodhwala** | [`oushodhwala`](./oushodhwala) | Digital pharmacy (ঔষধওয়ালা), prescription OCR upload, telemedicine, multi-branch ERP, and patient home diagnostic services. | Next.js 16 (App Router), React 19, Tailwind CSS v4, Auth.js v5, MySQL | `3001` |

---

## 🏗️ Architecture & Technology Stack

The entire suite has been unified under a modern, robust, and scalable full-stack architecture:

- **Framework & Runtime**: [Next.js 16](https://nextjs.org/) App Router with [React 19](https://react.dev/).
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) paired with [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/) component primitives and [Lucide Icons](https://lucide.dev/).
- **Authentication & Security**: [Auth.js v5](https://authjs.dev/) (`next-auth@5`) with JWT session strategy, role-based access control (RBAC), and Next.js 16 request routing (`proxy.ts`).
- **Database Layer**: **MySQL 8.0+ / MariaDB** using **Drizzle ORM** with independent isolated databases per subproject (`yessbgd_db`, `yesspos_db`, `oushodhwala_db`).
- **Deployment Target**: **cPanel + Phusion Passenger** utilizing standalone builds (`output: "standalone"`).

---

## 📁 Repository Structure

```text
YessBangla/
├── oushodhwala/             # Digital Pharmacy & Healthcare ERP
│   ├── src/                 # App Router (src/app), UI components, actions, lib
│   ├── scripts/             # MySQL schema migrations & seed data
│   ├── public/uploads/      # Stored prescription uploads & media
│   └── DEPLOY.md            # Dedicated cPanel deployment guide
├── yessbgd/                 # Official Corporate Portal & Dynamic CMS
│   ├── src/                 # App Router (src/app), venture showcases, document engines
│   ├── scripts/             # MySQL schema & initial seed scripts
│   ├── public/uploads/      # Stored careers resumes & media files
│   └── DEPLOY.md            # Dedicated cPanel deployment guide
├── yesspos/                 # Retail POS, Inventory & Accounting System
│   ├── src/                 # App Router (src/app), POS terminals, hardware drivers
│   ├── scripts/             # MySQL schema & seed scripts
│   └── DEPLOY.md            # Dedicated cPanel deployment guide
├── COMPREHENSIVE_CODEBASE_REVIEW.md  # Deep architectural audit & security review
├── REMAINING_WORK.md        # Technical migration checklist & roadmap
├── implementation_plan.md   # Architectural design specifications
└── .gitignore               # Root ignore rules (node_modules, .env, archives)
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v20+ or v22+ LTS
- **Package Manager**: `npm` (v10+)
- **Local MySQL Server**: [XAMPP](https://www.apachefriends.org/) (`127.0.0.1:3306`) or standalone MySQL 8+

### 1. Database Setup (Local XAMPP)
Start MySQL and create the three distinct databases in `utf8mb4`:

```sql
CREATE DATABASE yessbgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE yesspos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE oushodhwala_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run the respective migration/seed scripts located in each project's `scripts/` directory:
```bash
# Example for XAMPP
/opt/lampp/bin/mysql -u root yessbgd_db < yessbgd/scripts/seed.sql
/opt/lampp/bin/mysql -u root yesspos_db < yesspos/scripts/seed.sql
/opt/lampp/bin/mysql -u root oushodhwala_db < oushodhwala/scripts/seed.sql
```

### 2. Environment Configuration
Copy the `.env.example` file to `.env.local` inside each subproject directory and configure your credentials:

```bash
# In yessbgd, yesspos, and oushodhwala:
cp .env.example .env.local
```

Key environment variables:
- `DATABASE_URL`: `mysql://root:@127.0.0.1:3306/<db_name>`
- `AUTH_SECRET`: Generate a secure string (`openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL`: Local URL (e.g., `http://localhost:3000`)

### 3. Running Applications

Each project can be run independently from its subdirectory:

#### YessBD Corporate Portal
```bash
cd yessbgd
npm install
npm run dev
# Running on http://localhost:3000
```

#### Oushodhwala (Pharmacy)
```bash
cd oushodhwala
npm install
npm run dev
# Running on http://localhost:3001
```

#### YessPOS (Point of Sale)
```bash
cd yesspos
npm install
npm run dev
# Running on http://localhost:3002
```

---

## 🌐 Production Deployment (cPanel + Phusion Passenger)

Each project is configured for standalone deployment to standard cPanel shared/VPS hosting using Node.js / Phusion Passenger:

1. **Build Standalone Artifacts**:
   ```bash
   cd <project_dir>
   npm run build
   # Generates standalone server inside .next/standalone
   ```
2. **Setup cPanel Node.js Application**:
   - Application root: `yessbgd` (or corresponding project directory)
   - Application startup file: `.next/standalone/server.js`
   - Node.js Version: 20.x or 22.x
3. **Environment Variables**:
   Set `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` directly within the cPanel Node.js Application dashboard.
4. **Apache Reverse Proxy**:
   Deploy the project's `.htaccess` file to your domain's document root to proxy traffic to the assigned Passenger port and serve static uploads.

For detailed, step-by-step instructions, see:
- [`yessbgd/DEPLOY.md`](./yessbgd/DEPLOY.md)
- [`oushodhwala/DEPLOY.md`](./oushodhwala/DEPLOY.md)
- [`yesspos/DEPLOY.md`](./yesspos/DEPLOY.md)

---

## 🛡️ Documentation & Audit Index

- [Comprehensive Architectural & Codebase Review](file:///home/syed/workspace/YessBangla/COMPREHENSIVE_CODEBASE_REVIEW.md): Detailed audit detailing data integrity, security considerations, and component analysis.
- [Remaining Work & Migration Checklist](file:///home/syed/workspace/YessBangla/REMAINING_WORK.md): Roadmap and checklist tracking migration progress across all three applications.
- [Implementation Plan](file:///home/syed/workspace/YessBangla/implementation_plan.md): Architectural design decisions for framework and database unification.

---

## 📄 License & Ownership

© 2026 **Yess Bangladesh**. All rights reserved. Maintained by [@syed-reza98](https://github.com/syed-reza98).
