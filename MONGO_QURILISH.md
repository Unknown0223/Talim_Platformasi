# MongoDB qurilishi va tez-tez uchraydigan xatolar

## Terminalda ko‘rinadigan xatolar

### 1. `ECONNREFUSED 127.0.0.1:27017` va seed xatosi

**Sabab:** MongoDB kompyuteringizda ishlamayapti (o‘rnatilmagan yoki servis ishga tushmagan).

**Yechim – ikkita yo‘l:**

---

### Yo‘l A: MongoDB Atlas (bepul bulut – tavsiya, o‘rnatish shart emas)

1. **https://www.mongodb.com/cloud/atlas** ga kiring.
2. **Try Free** → hisob yarating (Google bilan ham bo‘ladi).
3. **Build a Database** → **M0 FREE** tanlang → **Create**.
4. **Where would you like to deploy?** – yaqin region (masalan Frankfurt).
5. **Database Access** → **Add New Database User**: username va password yarating (eslab qoling).
6. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) – development uchun.
7. **Database** → **Connect** → **Connect your application** → **Node.js** → connection string nusxalang.  
   Masalan: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
8. Loyihada `backend\.env` faylini oching va `MONGODB_URI` ni shu stringga o‘zgartiring. Database nomini qo‘shing:
   ```env
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/talim?retryWrites=true&w=majority
   ```
   (USER va PASSWORD o‘rniga o‘zingiz qo‘ygan login/parol, `talim` – loyiha DB nomi.)
9. Backend ni qayta ishga tushiring va keyin seed:
   ```powershell
   cd D:\Talim_platformasi\backend
   npm run seed
   ```

---

### Yo‘l B: MongoDB ni kompyuteringizda o‘rnatish

1. **https://www.mongodb.com/try/download/community** dan MongoDB Community Server yuklab oling (Windows).
2. O‘rnating (default port **27017**).
3. **Services** (xizmatlar) da **MongoDB** servisini **Started** qiling, yoki terminalda:
   ```powershell
   mongod
   ```
4. Keyin loyihada:
   ```powershell
   cd D:\Talim_platformasi\backend
   npm run seed
   ```

---

### 2. `EADDRINUSE: address already in use :::5000`

**Sabab:** 5000 portda allaqachon backend (yoki boshqa dastur) ishlayapti.

**Yechim – portni band qilgan jarayonni to‘xtatish (PowerShell Administrator sifatida yoki oddiy):**

```powershell
netstat -ano | findstr :5000
```

Chiqgan jadvalda **oxirgi ustun** – PID (masalan 12345). Keyin:

```powershell
taskkill /PID 12345 /F
```

(PID o‘rniga o‘zingiz ko‘rgan raqamni yozing.) Shundan keyin `npm run dev` qayta ishlaydi.

---

### 3. PowerShell da `&&` xatosi

PowerShell eski versiyalarda `&&` qo‘llab-quvvatlamaydi. O‘rniga **nuqta-vergul** ishlating:

- **Xato:** `cd frontend && npm install`
- **To‘g‘ri:** `cd frontend; npm install`

yoki ikki qator:

```powershell
cd frontend
npm install
```

---

## Ketma-ketlik (MongoDB Atlas tanlangan bo‘lsa)

1. Atlas da cluster, user va 0.0.0.0/0 network access yarating.
2. Connection string ni nusxalab `backend\.env` da `MONGODB_URI` ga yozing.
3. Port 5000 band bo‘lsa: `netstat -ano | findstr :5000` → `taskkill /PID ... /F`.
4. Loyiha ildizida:
   ```powershell
   cd D:\Talim_platformasi
   npm run dev
   ```
5. Yangi terminalda (backend ishlagach):
   ```powershell
   cd D:\Talim_platformasi\backend
   npm run seed
   ```
6. Brauzerda **http://localhost:5173** (yoki 5174) → **Kirish** → `admin@talim.uz` / `password123`.
