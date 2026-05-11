# Deployment – Talim platformasi

## Frontend (Vercel)

1. GitHub repositoriyani Vercel ga ulang.
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment variable: `VITE_API_URL` = backend ning to'liq URLi (masalan `https://your-app.railway.app`)

Vercel avtomatik Vite ni aniqlaydi. Build va deploy tugagach, sayt ishlaydi.

## Backend (Railway yoki Render)

### Railway

1. [railway.app](https://railway.app) da yangi loyiha yarating.
2. "Deploy from GitHub repo" – `Talim_platformasi` repo, root: `backend` (yoki backend papkani tanlang).
3. Environment variables:
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – kuchli tasodifiy kalit
   - `FRONTEND_URL` – Vercel da chiqqan frontend URL (CORS uchun)
   - `PORT` – Railway o'zi beradi, qo'lda bermasangiz ham bo'ladi
4. Build: `npm install`
5. Start: `npm start` (yoki `node src/index.js`)

### Render

1. [render.com](https://render.com) da New → Web Service.
2. Repo va root: `backend`.
3. Build: `npm install`
4. Start: `npm start`
5. Env: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`.

## Ma'lumotlar bazasi

MongoDB Atlas da cluster yarating, Connection string oling va uni backend ning `MONGODB_URI` o'zgaruvchisi sifatida qo'ying. Network Access da 0.0.0.0/0 qo'shing (yoki faqat Railway/Render IP lari).

## Ketma-ketlik

1. MongoDB Atlas da DB yarating, connection string oling.
2. Backend ni Railway/Render da deploy qiling, env larni kiriting.
3. Backend ning public URL ini oling (masalan `https://talim-api.railway.app`).
4. Frontend da `VITE_API_URL` ni shu URL ga qo'ying.
5. Frontend ni Vercel da deploy qiling.
6. Backend da `FRONTEND_URL` ni Vercel domeniga qo'ying (CORS).
