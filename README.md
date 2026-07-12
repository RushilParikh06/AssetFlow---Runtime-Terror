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
│   ├── app/                            
│   │   ├── layout.tsx
│   │   ├── page.tsx                     
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                      
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (dashboard)/                 
│   │   │   ├── layout.tsx               
│   │   │   ├── dashboard/page.tsx       
│   │   │   │
│   │   │   ├── organization/            
│   │   │   │   ├── layout.tsx           
│   │   │   │   ├── departments/page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   └── employees/page.tsx
│   │   │   │
│   │   │   ├── assets/                  
│   │   │   │   ├── page.tsx             
│   │   │   │   ├── new/page.tsx         
│   │   │   │   └── [assetId]/page.tsx   
│   │   │   │
│   │   │   ├── allocations/page.tsx     
│   │   │   ├── bookings/page.tsx        
│   │   │   ├── maintenance/page.tsx     
│   │   │   │
│   │   │   ├── audits/                  
│   │   │   │   ├── page.tsx             
│   │   │   │   └── [auditId]/page.tsx   
│   │   │   │
│   │   │   ├── reports/page.tsx         
│   │   │   └── notifications/page.tsx   
│   │   │
│   │   └── api/                         
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── signup/route.ts      
│   │       │   └── logout/route.ts
│   │       ├── departments/
│   │       │   ├── route.ts             
│   │       │   └── [id]/route.ts        
│   │       ├── categories/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── employees/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── promote/route.ts 
│   │       ├── assets/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── history/route.ts
│   │       ├── allocations/
│   │       │   ├── route.ts             
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts
│   │       │   │   └── return/route.ts
│   │       │   └── transfer/route.ts    
│   │       ├── bookings/
│   │       │   ├── route.ts             
│   │       │   └── [id]/route.ts        
│   │       ├── maintenance/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── status/route.ts  
│   │       ├── audits/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── verify/route.ts  
│   │       │       └── close/route.ts
│   │       ├── notifications/route.ts
│   │       └── reports/route.ts
│   │
│   │
└── tests/
```
