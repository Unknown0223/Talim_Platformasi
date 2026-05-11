# Talim platformasi – qanday kirish va ishlatish

## 1. Loyihani ishga tushirish

### MongoDB kerak

Backend to‘liq ishlashi uchun **MongoDB** ishlashi shart. **MongoDB yo‘q bo‘lsa** `npm run seed` va kurslar ishlamaydi, `ECONNREFUSED 127.0.0.1:27017` xatosi chiqadi.

- **Bulut (tavsiya, o‘rnatish shart emas):** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) – bepul cluster, connection string ni `backend/.env` da `MONGODB_URI` ga yozing. Batafsil: **MONGO_QURILISH.md**.
- **Lokal:** [MongoDB Community](https://www.mongodb.com/try/download/community) o‘rnating va `mongod` ni ishga tushiring (port 27017).

### Backend va frontend

**Bitta terminalda (tavsiya):**

```bash
cd D:\Talim_platformasi
npm install
npm run dev
```

- Backend: **http://localhost:5000**
- Frontend: **http://localhost:5173** (yoki 5174)

### Boshlang‘ich ma’lumotlarni yuklash

Kurslar, fanlar, testlar va test hisoblar yuklanishi uchun **bir marta** seed ishga tushiring:

```bash
cd D:\Talim_platformasi\backend
npm run seed
```

yoki ildizdan:

```bash
npm run seed
```

Ko‘rinishi kerak:  
`Seed tugadi.` va hisoblar ro‘yxati.

---

## 2. Qanday kirish (Login)

### Brauzerda

1. **http://localhost:5173** (yoki 5174) ni oching.
2. Yuqori o‘ngda **«Kirish»** tugmasini bosing.
3. Quyidagi hisoblardan birini kiriting.

### Test hisoblar (seed dan keyin)

| Rol         | Email              | Parol       |
|------------|--------------------|-------------|
| **Admin**  | admin@talim.uz     | password123 |
| **O‘qituvchi 1** | teacher@talim.uz  | password123 |
| **O‘qituvchi 2** | teacher2@talim.uz | password123 |
| **O‘qituvchi 3** | teacher3@talim.uz | password123 |
| **O‘quvchi** | student@talim.uz  | password123 |

4. **«Kirish»** tugmasini bosing.
5. Rol bo‘yicha:
   - **Admin** → avtomatik **Admin panel** (`/admin`) ga yo‘naltiriladi.
   - **O‘qituvchi** → **Dashboard (o‘qituvchi)** (`/dashboard/teacher`).
   - **O‘quvchi** → **Bosh sahifa** yoki oldingi sahifa.

---

## 3. Admin panel

Faqat **admin** hisobi bilan kirilganda mavjud.

### Kirish

1. **admin@talim.uz** / **password123** bilan kiring.
2. Navbardagi **«Admin»** yoki **«Dashboard»** orqali **Admin panel** ga o‘ting (URL: `/admin`).

### Imkoniyatlar

- **Dashboard** – foydalanuvchilar, kurslar, yozilishlar, test topshirishlar soni.
- **Foydalanuvchilar** – barcha userlar ro‘yxati (ism, email, rol).
- **Fanlar** – fanlar ro‘yxati va **«Fan qo‘shish»** (nomi, tavsif).
- **Kurslar** – kurslar ro‘yxati va **«Kurs qo‘shish»** (nomi, fan, o‘qituvchi, daraja, tur, narx).
- **Joylar** – joylar ro‘yxati va **«Joy qo‘shish»** (nomi, manzil, lat, lng).

Yangi fan, kurs yoki joy qo‘shgach, ro‘yxat yangilanadi va saytda (Kurslar, Joylar va h.k.) ko‘rinadi.

---

## 4. Qisqa ishlatish

- **Kurslar** – barcha kurslar, filter (fan, daraja, online/offline).
- **Test** – bosh sahifadan fan tanlang → 30 savol → ball va daraja (Beginner/Intermediate/Advanced).
- **Kursga yozilish** – o‘quvchi hisobi bilan kurs sahifasida **«Kursga yozilish»**.
- **Dashboard** – o‘quvchi: kurslar va test natijalari; o‘qituvchi: o‘z kurslari va darslari.
- **Haftalik reja** – kirilgan o‘quvchi uchun test natijasiga qarab tavsiya.
- **Quiz Battle** – xona yaratish / kod orqali qo‘shilish, test va reyting.

---

## 5. Muammolar

- **`ECONNREFUSED 127.0.0.1:27017`** yoki **seed xato**: MongoDB ishlamayapti. **MONGO_QURILISH.md** faylida MongoDB Atlas (bepul bulut) yoki lokal o‘rnatish bo‘yicha qadamlar bor.
- **`EADDRINUSE :::5000`**: 5000 port band. PowerShell da `netstat -ano | findstr :5000` → `taskkill /PID <raqam> /F` (MONGO_QURILISH.md da batafsil).
- **«Yuklanmoqda...»** uzoq davom etsa: backend ishlayotganini va MongoDB ulanganini tekshiring; keyin `npm run seed` ishga tushiring.
- **«Token talab qilinadi»** / **401**: qayta **Kirish** qiling (parol to‘g‘ri ekanligini tekshiring).
- Admin panel ko‘rinmasa: **admin@talim.uz** bilan kiring (boshqa rollar uchun Admin menyu chiqmaydi).
- **PowerShell** da `&&` ishlamasa: `;` ishlating (masalan `cd frontend; npm install`).
