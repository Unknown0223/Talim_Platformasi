# Talim platformasi – ishga tushirish

## 1. PostgreSQL (majburiy — Prisma)

Backend **PostgreSQL** ga ulanadi. Loyiha ildizidagi `docker-compose.yml` **5433** portida konteynerni ko‘taradi.

**Docker Desktop** o‘rnatilgan bo‘lishi kerak. Keyin:

```powershell
cd E:\Talim_platformasi
npm run db:up
cd backend
npx prisma migrate deploy
```

`backend/.env` da `DATABASE_URL` quyidagiga o‘xshashi kerak (namuna `backend/.env.example` da):

`postgresql://talim:0223@localhost:5433/talim?schema=public`

Agar Postgres boshqa joyda bo‘lsa, `DATABASE_URL` ni o‘zgartiring.

## 2. Eski MongoDB eslatmasi (agar kodda qolgan bo‘lsa)

Ba’zi qismlar tarixan MongoDB haqida yozilgan bo‘lishi mumkin; asosiy ma’lumotlar bazasi hozir **PostgreSQL + Prisma**.

## 3. Bitta buyruq bilan ishga tushirish (tavsiya)

Loyiha **ildizida** (`E:\Talim_platformasi`):

```powershell
cd E:\Talim_platformasi
npm run db:up
npm start
```

yoki (development):

```powershell
npm run dev
```

Bitta buyruq **backend** (port **5001**) va **frontend** (port **5173**) ni bir vaqtda ishga tushiradi. Bitta terminalda ikkala server ishlaydi.

**Birinchi marta** (yoki yangi clone qilganda) barcha kutubxonalarni o‘rnatish:

```powershell
cd E:\Talim_platformasi
npm run install:all
```

Keyin har safar ishga tushirish uchun: avval `npm run db:up`, keyin `npm start` yoki `npm run dev`.

To‘xtatish: `Ctrl+C` (bir marta bosish ikkalasini ham to‘xtatadi).

## 4. Alohida terminallarda (ixtiyoriy)

Agar alohida ishga tushirmoqchi bo‘lsangiz:

```bash
# Terminal 1 – backend
cd backend
npm start

# Terminal 2 – frontend
cd frontend
npm run dev
```

## 5. Ma’lumotlarni yuklash (bir marta)

PostgreSQL ishlayotgan bo‘lishi kerak (`npm run db:up`). Keyin:

```bash
npm run seed
```

yoki `cd backend` qilib `npm run seed`.

## 6. Brauzerda ochish

**http://localhost:5173**

## 7. Test hisoblar (seed dan keyin)

| Rol       | Email             | Parol       |
|----------|-------------------|-------------|
| Admin    | admin@talim.uz    | password123 |
| O‘qituvchi | teacher@talim.uz | password123 |
| O‘quvchi | student@talim.uz | password123 |

## 8. Qanday ishlatish

1. **http://localhost:5173** – bosh sahifa.
2. **Kirish** – Login (yuqoridagi email/parol).
3. **Kurslar** – ro‘yxat, filter (fan, daraja, online/offline).
4. **Test** – bosh sahifada fan tanlang (masalan Matematika) → test 30 savol, tugagach ball va daraja (Beginner/Intermediate/Advanced).
5. **Kursga yozilish** – kurs sahifasida “Kursga yozilish” (o‘quvchi hisobi bilan).
6. **Dashboard** – o‘quvchi: kurslar va test natijalari; o‘qituvchi: kurslar va darslar.
7. **Admin** – admin hisobi bilan `/admin`: foydalanuvchilar va statistika.
