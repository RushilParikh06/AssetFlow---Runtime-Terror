# AssetFlow 🚀
### Enterprise Asset & Resource Management System

AssetFlow is a centralized ERP platform designed to track, allocate, schedule, and maintain physical assets and shared resources across organizations. It streamlines operations by eliminating manual spreadsheet tracking and providing role-based workflows for employees, department heads, auditors, and asset managers.

---

## 📊 Project Progress Tracker

Here is the status of the development modules for the project:

### Phase 1: Database & Core Infrastructure — **100% Completed**
*   [x] Local PostgreSQL database & Redis caching services initialized.
*   [x] Relational database schema defined in Prisma (`prisma/schema.prisma`).
*   [x] Database migrations executed and applied to PostgreSQL.
*   [x] Database Client instance singleton pattern created.
*   [x] Seed script written (`prisma/seed.ts`) and database fully populated with mock assets, categories, employees, and departments.

### Phase 2: Security & Authentication — **100% Completed**
*   [x] Auth.js v5 (NextAuth) integrated with custom Credentials provider.
*   [x] Secure password hashing using `bcryptjs` on signup.
*   [x] JWT-based session management carrying user roles and employee credentials.
*   [x] Next.js middleware routing security checking and page protection.
*   [x] API Route Role-Based Access Control (RBAC) helper utility (`checkRole`) with type narrowing.

### Phase 3: Core Business Logic (Service Layer) — **100% Completed**
*   [x] **`DepartmentService`:** CRUD, parent-child hierarchies, and department head assignments.
*   [x] **`EmployeeService`:** Directory query filters, profile updates, and administrator promotion.
*   [x] **`AssetService`:** Sequenced asset tag generation (e.g., `AF-0001`), location tracking, and status timelines.
*   [x] **`AllocationService`:** Double-allocation prevention, return condition logs, and transfer routing.
*   [x] **`BookingService`:** Scheduler reservation slots with strict overlap checking.
*   [x] **`MaintenanceService`:** Request logs, manager approvals, technician assignment, and cost resolution.
*   [x] **`AuditService`:** Verification cycles, auditor status logs, and confimed missing assets auto-marked as `LOST`.
*   [x] **`NotificationService`:** User in-app notifications and system activity log audit trails.

### Phase 4: API Endpoint Integration — **100% Completed**
*   [x] `/api/auth/signup` & `/api/auth/login` (Auth endpoints)
*   [x] `/api/departments` & `/api/departments/[id]` (Department APIs)
*   [x] `/api/categories` & `/api/categories/[id]` (Asset Category schemas)
*   [x] `/api/employees`, `/api/employees/[id]` & `/api/employees/[id]/promote` (Directory APIs)
*   [x] `/api/assets`, `/api/assets/[id]` & `/api/assets/[id]/history` (Lifecycle APIs)
*   [x] `/api/allocations`, `/api/allocations/[id]/return` & `/api/allocations/transfer` (Allocation flows)
*   [x] `/api/bookings` & `/api/bookings/[id]` (Resource schedules)
*   [x] `/api/maintenance`, `/api/maintenance/[id]` & `/api/maintenance/[id]/status` (Repairs workflow)
*   [x] `/api/audits`, `/api/audits/[id]`, `/api/audits/[id]/verify` & `/api/audits/[id]/close` (Asset audit cycles)
*   [x] `/api/notifications` (Alerts)
*   [x] `/api/dashboard` (Odoo-like KPI aggregations & chart datasets)
*   [x] `/api/reports` (Exportable CSV files for Assets, Allocations, Maintenance, Bookings, and Lost items)

### Phase 5: Frontend UI & Components — **0% Completed (Ready for Development)**
*   [ ] Register shadcn/ui components.
*   [ ] Design the Home Dashboard.
*   [ ] Build Organization Setup screens (Departments, Categories, Directory).
*   [ ] Implement Asset Directory & Timeline layouts.
*   [ ] Implement Allocation & Return logs.
*   [ ] Integrate FullCalendar for Resource Booking.
*   [ ] Build Maintenance Request logs & approval dashboards.
*   [ ] Design Audit cycle checklists.
*   [ ] Set up Recharts graphics for dashboards and reports.

---

## 🛠️ Technology Stack
*   **Frontend Framework:** Next.js 15 (App Router) + React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn/UI
*   **Database:** PostgreSQL (via Prisma ORM v6)
*   **Authentication:** Auth.js v5 (NextAuth.js)
*   **Cache & Queue:** Redis (via BullMQ & ioredis)
*   **Realtime Communication:** Socket.io
*   **Validation:** Zod + React Hook Form

---

## 📂 Project Structure

```text
src/
├── lib/
│   ├── db.ts               # Prisma Client singleton
│   ├── auth.ts             # Auth.js NextAuth configuration
│   ├── rbac.ts             # Gating middleware role checks
│   └── validators/         # Zod schemas for forms/API validation
├── services/               # DB query & transactional logic layer
│   ├── department.service.ts
│   ├── employee.service.ts
│   ├── asset.service.ts
│   ├── allocation.service.ts
│   ├── booking.service.ts
│   ├── maintenance.service.ts
│   ├── audit.service.ts
│   └── notification.service.ts
└── app/
    ├── api/                # API Route Handlers (JSON endpoints)
    │   ├── auth/           # Login / Signup / Logout
    │   ├── departments/    # Department CRUD
    │   ├── categories/     # Asset categories
    │   ├── employees/      # Employee Directory & Promotions
    │   ├── assets/         # Asset CRUD & history logs
    │   ├── allocations/    # Allocations, Returns & Transfers
    │   ├── bookings/       # Overlap-free room/vehicle reservations
    │   ├── maintenance/    # Repair pipeline status updates
    │   ├── audits/         # Verification checks & cycle closures
    │   ├── notifications/  # User in-app alerts
    │   ├── reports/        # Export CSV downloads
    │   └── dashboard/      # KPI values & charts aggregation
    ├── middleware.ts        # Next.js route protection & page RBAC
    ├── layout.tsx
    └── page.tsx            # Landing page
```

---

## 🚀 Local Development Setup

To run this backend system locally on your macOS system:

### 1. Prerequisite background services (PostgreSQL & Redis)
Ensure you start PostgreSQL and Redis via Homebrew:
```bash
brew services start postgresql@16
brew services start redis
```

### 2. Configure Environment Variables
Copy and rename the `.env.example` template:
```bash
cp .env.example .env
```
Ensure the `DATABASE_URL` is pointing to your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://panavpatel@localhost:5432/assetflow?schema=public"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="e4ba73297d9bfed4ed0dd413b47a6dd5779af18a90203fabcc26c42ff856656d"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Create the Database & Apply Migrations
```bash
# Initialize and sync DB tables
npx prisma migrate dev --name init
```

### 4. Seed the Database
Populate your database with mock users, assets, categories, and allocations:
```bash
npx tsx prisma/seed.ts
```

### 5. Start the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`. You can query the REST endpoints via HTTP requests (e.g. `GET /api/assets`).

---

## 🔑 Test Accounts
The database is seeded with these pre-configured user credentials (all passwords have the suffix `123!`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@assetflow.com` | `Admin123!` |
| **Asset Manager** | `manager@assetflow.com` | `Manager123!` |
| **Department Head** | `head@assetflow.com` | `Head123!` |
| **Employee** | `employee@assetflow.com` | `Employee123!` |
| **Auditor** | `auditor@assetflow.com` | `Auditor123!` |
