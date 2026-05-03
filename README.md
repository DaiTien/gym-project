# Gym Tracker — Dad Bod AB Shred

Web app theo dõi chương trình tập luyện 4 tuần. Hỗ trợ PWA (cài được lên mobile).

---

## Deployed Services

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | https://gym-project-plum-zeta.vercel.app |
| **Backend** | Render | https://gym-project-backend-yek1.onrender.com |
| **Database** | Supabase (PostgreSQL) | https://supabase.com/dashboard/project/kttdftlvhzsbyenspmwz |

> Backend trên Render free tier sẽ **sleep sau 15 phút** không có request — lần đầu gọi API sẽ chờ ~30 giây để wake up.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State | Zustand (auth) + TanStack Query (server state) |
| Charts | Recharts |
| PWA | vite-plugin-pwa + Workbox |
| Backend | Fastify + TypeScript |
| ORM | Prisma 7 + pg adapter |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (30 ngày) |

---

## Local Development

### Yêu cầu
- Node.js 18+
- npm

### 1. Clone & cài dependencies

```bash
git clone https://github.com/DaiTien/gym-project.git
cd gym-project

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Cấu hình backend

Tạo file `backend/.env` (copy từ `.env.example`):

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.kttdftlvhzsbyenspmwz.supabase.co:5432/postgres"
JWT_SECRET="any-random-string-min-32-chars"
PORT=3001
NODE_ENV=development
```

> Lấy `DATABASE_URL` tại: Supabase Dashboard → Connect → Direct → URI

### 3. Setup database

```bash
cd backend

# Push schema lên DB + generate Prisma client
npm run db:push

# Nhập dữ liệu chương trình (chỉ cần chạy 1 lần)
npm run db:seed
```

### 4. Chạy local

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Mở trình duyệt: http://localhost:5173

---

## Database Commands

```bash
cd backend

npm run db:push      # Sync schema → DB (thay cho migrate ở dev)
npm run db:generate  # Regenerate Prisma client sau khi đổi schema
npm run db:seed      # Seed dữ liệu chương trình + bài tập
npm run db:studio    # Mở Prisma Studio (GUI xem DB)
```

---

## Deploy

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

**Environment Variables trên Render:**

```
DATABASE_URL   = <Supabase Transaction Pooler URL — port 6543>
JWT_SECRET     = <random string>
FRONTEND_URL   = https://gym-project-plum-zeta.vercel.app
NODE_ENV       = production
```

> ⚠️ Dùng **Transaction Pooler URL** (port 6543) từ Supabase, không phải Direct URL (port 5432) — tránh lỗi IPv6 trên Render free tier.
>
> Lấy tại: Supabase → Connect → Direct → kéo xuống "Connection pooling" → Transaction pooler

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite |

**Environment Variables trên Vercel:**

```
VITE_API_URL = https://gym-project-backend-yek1.onrender.com
```

---

## Project Structure

```
gym-project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   └── seed.ts            # Seed chương trình + bài tập
│   ├── scripts/
│   │   └── db-push.ts         # Helper push schema (load .env)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts      # Prisma client singleton (pg adapter)
│   │   │   └── env.ts         # Env validation (fail fast)
│   │   ├── modules/
│   │   │   ├── auth/          # Register, login, /me
│   │   │   ├── programs/      # Program list, user-programs (chu kỳ)
│   │   │   ├── sessions/      # Workout session + set logging
│   │   │   ├── progress/      # Cân nặng, biểu đồ tạ
│   │   │   └── lifestyle/     # Bước chân, ngủ, calo
│   │   ├── types/
│   │   │   └── fastify.d.ts   # Type augmentation cho authenticate decorator
│   │   └── app.ts             # Fastify app entry point
│   ├── .env                   # Không commit — xem .env.example
│   └── prisma.config.ts       # Prisma 7 config (pg adapter + env)
│
└── frontend/
    ├── src/
    │   ├── api/               # Fetch wrappers (client.ts, programs, sessions, progress)
    │   ├── components/        # BottomNav, Toast
    │   ├── pages/             # Dashboard, WorkoutSession, Progress, Lifestyle, Login
    │   ├── store/             # Zustand: authStore (persist token)
    │   └── App.tsx            # Router + PrivateRoute guard
    ├── public/icon.svg        # PWA icon
    ├── vite.config.ts         # Vite + PWA plugin config
    └── vercel.json            # SPA rewrite rules
```

---

## Prisma 7 — Lưu ý quan trọng

Prisma 7 không đọc `url` từ `schema.prisma` nữa. Connection URL được config qua:

- **CLI** (`db:push`, `db:generate`): `prisma.config.ts` + `scripts/db-push.ts`
- **Runtime** (`PrismaClient`): `src/lib/prisma.ts` khởi tạo với `PrismaPg` adapter

Khi thay đổi schema, chạy theo thứ tự:
```bash
npm run db:push      # 1. sync DB
npm run db:generate  # 2. update client (đã gộp vào db:push)
```

---

## PWA — Cài lên mobile

**Android (Chrome):** Menu ⋮ → "Thêm vào màn hình chính"

**iOS (Safari):** Share button → "Add to Home Screen"

App tự update ngầm khi có version mới — user không cần làm gì.