## 📁 Project Structure

```text
assetflow/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── README.md
├── prisma/
|    ├── schema.prisma
│    ├── seed.ts
│    └── migrations/
|
├── public/
|    ├── images/
│    └── icons/
├── src/
│   ├── app/                             # Next.js App Router (pages + API)
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # redirects to /login or /dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                      # Screen 1 — public routes
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (dashboard)/                 # authenticated route group
│   │   │   ├── layout.tsx               # sidebar + topbar shell, role-aware nav
│   │   │   ├── dashboard/page.tsx       # Screen 2 — KPI cards, overdue, quick actions
│   │   │   │
│   │   │   ├── organization/            # Screen 3 — Admin only
│   │   │   │   ├── layout.tsx           # 3-tab shell
│   │   │   │   ├── departments/page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   └── employees/page.tsx
│   │   │   │
│   │   │   ├── assets/                  # Screen 4
│   │   │   │   ├── page.tsx             # directory + search/filter
│   │   │   │   ├── new/page.tsx         # register asset
│   │   │   │   └── [assetId]/page.tsx   # detail: allocation + maintenance history
│   │   │   │
│   │   │   ├── allocations/page.tsx     # Screen 5 — allocate/transfer/return
│   │   │   ├── bookings/page.tsx        # Screen 6 — calendar + slot booking
│   │   │   ├── maintenance/page.tsx     # Screen 7 — request workflow
│   │   │   │
│   │   │   ├── audits/                  # Screen 8
│   │   │   │   ├── page.tsx             # audit cycle list
│   │   │   │   └── [auditId]/page.tsx   # verify assets, discrepancy report
│   │   │   │
│   │   │   ├── reports/page.tsx         # Screen 9
│   │   │   └── notifications/page.tsx   # Screen 10
│   │   │
│   │   └── api/                         # backend — mirrors feature modules
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── signup/route.ts      # always creates Employee role only
│   │       │   └── logout/route.ts
│   │       ├── departments/
│   │       │   ├── route.ts             # GET (list), POST (create)
│   │       │   └── [id]/route.ts        # GET, PATCH, DELETE
│   │       ├── categories/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── employees/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── promote/route.ts # Admin-only role promotion
│   │       ├── assets/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── history/route.ts
│   │       ├── allocations/
│   │       │   ├── route.ts             # allocate (runs conflict check)
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts
│   │       │   │   └── return/route.ts
│   │       │   └── transfer/route.ts    # request → approve → re-allocate
│   │       ├── bookings/
│   │       │   ├── route.ts             # create (runs overlap check)
│   │       │   └── [id]/route.ts        # cancel/reschedule
│   │       ├── maintenance/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── status/route.ts  # approve/reject/assign/resolve
│   │       ├── audits/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── verify/route.ts  # per-asset verify/missing/damaged
│   │       │       └── close/route.ts
│   │       ├── notifications/route.ts
│   │       └── reports/route.ts
│   │
└── tests/
```
