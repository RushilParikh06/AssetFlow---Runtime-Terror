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
