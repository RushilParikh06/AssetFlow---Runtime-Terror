# AssetFlow

> **Enterprise Asset & Resource Management System**

AssetFlow is a modern ERP platform for managing the complete lifecycle of organizational assets—from procurement and allocation to maintenance, audits, bookings, reporting, and organization-wide visibility.

---

## ✨ Features

- 🔐 Role-Based Authentication (Auth.js)
- 📦 Asset Registration & Tracking
- 🔄 Asset Allocation, Transfer & Return
- 🏢 Department & Employee Management
- 📅 Resource Booking
- 🔧 Maintenance Workflow
- 📋 Audit Management
- 📊 Reports & Analytics
- 🔔 Notifications & Activity Logs
- 📱 Responsive Dashboard

---

## 🛠 Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Recharts
- FullCalendar

### Backend
- Next.js Route Handlers
- Prisma ORM
- PostgreSQL

### Authentication
- Auth.js v5
- JWT Sessions
- RBAC

### Realtime & Infrastructure
- Socket.IO
- Redis
- BullMQ
- Supabase Storage

---

## 📂 Project Structure

```text
AssetFlow/
├── prisma/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── lib/
│   ├── types/
│   └── utils/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/RushilParikh06/AssetFlow---Runtime-Terror.git
cd AssetFlow---Runtime-Terror
```

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file.

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=

REDIS_URL=
```

### Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 👥 User Roles

- Admin
- Asset Manager
- Department Head
- Employee
- Auditor

---

## 📦 Core Modules

- Dashboard
- Authentication
- Organization
- Departments
- Employees
- Asset Categories
- Asset Registry
- Asset Allocation
- Resource Booking
- Maintenance
- Audits
- Reports
- Notifications
- Activity Logs

---

## 🔄 Asset Lifecycle

```text
Purchase
   ↓
Registration
   ↓
Available
   ↓
Allocated
   ↓
Transfer
   ↓
Returned
   ↓
Inspection
   ↓
Maintenance
   ↓
Available
   ↓
Retired
```

---

## 📊 Reports

- Asset Utilization
- Asset Distribution
- Maintenance Analytics
- Booking Analytics
- Department-wise Assets
- Idle Assets
- Audit Reports

---

## Security

- JWT Authentication
- Role-Based Access Control
- Password Hashing
- Input Validation
- Protected Routes

---

## Deployment

Supported platforms:

- Vercel
- Railway

---

## Future Enhancements

- AI-powered maintenance prediction
- Barcode & QR scanning
- Mobile application
- Email notifications
- Asset depreciation tracking
- Approval workflows

---

## 🤝 Contributing

```bash
git checkout -b feature-name
git commit -m "Add feature"
git push origin feature-name
```

Create a Pull Request.

---

## 👨‍💻 Team Runtime Terror

- Rushil Parikh
- Shlok Shah
- Aaryan Gajjar
- Panav Patel

---

## 📄 License

Licensed under the MIT License.

---

<div align="center">

### AssetFlow

**Track Smarter. Manage Better.**

Built with ❤️ by **Team Runtime Terror**

</div>
