# Talim platformasi – ishga tushirish

## 1. MongoDB kerak (ixtiyoriy – server MongoDB siz ham ishga tushadi)

To‘liq ishlashi uchun MongoDB kerak.

- **Variant A – Lokal:** [MongoDB Community](https://www.mongodb.com/try/download/community) o‘rnating (port 27017).
- **Variant B – Bulut:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) da bepul cluster, connection string ni `backend/.env` da `MONGODB_URI` ga yozing.

## 2. Bitta buyruq bilan ishga tushirish (tavsiya)

Loyiha **ildizida** (`D:\Talim_platformasi` – backend va frontend papkalari ichida joylashgan papka):

```powershell
cd D:\Talim_platformasi
npm start
```

yoki:

```powershell
npm run dev
```

Bitta buyruq **backend** (port 5000) va **frontend** (port 5173) ni bir vaqtda ishga tushiradi. Bitta terminalda ikkala server ishlaydi.

**Birinchi marta** (yoki yangi clone qilganda) barcha kutubxonalarni o‘rnatish:

```powershell
cd D:\Talim_platformasi
npm run install:all
```

Keyin har safar ishga tushirish uchun: `npm start`.

To‘xtatish: `Ctrl+C` (bir marta bosish ikkalasini ham to‘xtatadi).

## 3. Alohida terminallarda (ixtiyoriy)

Agar alohida ishga tushirmoqchi bo‘lsangiz:

```bash
# Terminal 1 – backend
cd backend
npm start

# Terminal 2 – frontend
cd frontend
npm run dev
```

## 4. Ma’lumotlarni yuklash (bir marta)

Test hisoblar va matematika savollari uchun (MongoDB ishlayotgan bo‘lishi kerak):

```bash
npm run seed
```

yoki `cd backend` qilib `npm run seed`.

## 5. Brauzerda ochish

**http://localhost:5173**

## 6. Test hisoblar (seed dan keyin)

| Rol       | Email             | Parol       |
|----------|-------------------|-------------|
| Admin    | admin@talim.uz    | password123 |
| O‘qituvchi | teacher@talim.uz | password123 |
| O‘quvchi | student@talim.uz | password123 |

## 7. Qanday ishlatish

1. **http://localhost:5173** – bosh sahifa.
2. **Kirish** – Login (yuqoridagi email/parol).
3. **Kurslar** – ro‘yxat, filter (fan, daraja, online/offline).
4. **Test** – bosh sahifada fan tanlang (masalan Matematika) → test 30 savol, tugagach ball va daraja (Beginner/Intermediate/Advanced).
5. **Kursga yozilish** – kurs sahifasida “Kursga yozilish” (o‘quvchi hisobi bilan).
6. **Dashboard** – o‘quvchi: kurslar va test natijalari; o‘qituvchi: kurslar va darslar.
7. **Admin** – admin hisobi bilan `/admin`: foydalanuvchilar va statistika.
