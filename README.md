# Talim platformasi

Zamonaviy, interaktiv ta'lim platformasi – 3 rol (O'quvchi, O'qituvchi, Admin), online/offline kurslar, testlar, reyting va sertifikatlar.

## Loyiha tuzilishi

- **backend/** – Node.js + Express + MongoDB (Mongoose). API: auth, subjects, courses, tests, enroll, dashboard, lessons, schedule, locations, certificates, admin.
- **frontend/** – React (Vite) + Tailwind CSS + Framer Motion. Sahifalar: Home, Courses, Teachers, Online, Offline, Locations, Dashboard, Admin, Login, Register, Test.
- **docs/** – Arxitektura (rollar, user flow), deployment, AI integratsiya.

## Bitta buyruq bilan ishga tushirish (tavsiya)

Loyiha **ildizida** (`D:\Talim_platformasi`):

```powershell
npm run install:all   # birinchi marta
npm start             # backend + frontend birga
```

Backend: http://localhost:5000 | Frontend: http://localhost:5173 (yoki 5174)

Boshlang'ich ma'lumotlar: `npm run seed` (backend ishlaganda, bitta marta).

## Alohida ishga tushirish

### Backend

```bash
cd backend
cp .env.example .env
# .env da MONGODB_URI va JWT_SECRET ni to'ldiring
npm install
npm run seed   # ixtiyoriy: test ma'lumotlar
npm run dev
```

Server: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Brauzer: http://localhost:5173 (API proxy backend ga yo'naltirilgan).

### Test hisoblar (seed dan keyin)

- Admin: admin@talim.uz / password123
- O'qituvchi: teacher@talim.uz / password123
- O'quvchi: student@talim.uz / password123

## API asosiy endpointlar

| Endpoint | Method | Tavsif |
|----------|--------|--------|
| /api/auth/register | POST | Ro'yxatdan o'tish |
| /api/auth/login | POST | Login |
| /api/subjects | GET | Fanlar |
| /api/courses | GET | Kurslar (filter: subjectId, level, type) |
| /api/courses/:id | GET | Kurs tafsiloti |
| /api/tests/:subjectId | GET | Test savollari |
| /api/tests/submit | POST | Test natijasi |
| /api/enroll | POST | Kursga yozilish |
| /api/dashboard/student | GET | O'quvchi dashboard |
| /api/dashboard/teacher | GET | O'qituvchi dashboard |
| /api/admin/users, /api/admin/stats | GET | Admin |
| /api/certificates/complete | POST | Kursni tugatish |
| /api/certificates/my | GET | Sertifikatlar |
| /api/certificates/:id/download | GET | PDF yuklab olish |

## Deployment

- Frontend: Vercel (docs/deployment.md).
- Backend: Railway yoki Render (docs/deployment.md).
- DB: MongoDB Atlas.
