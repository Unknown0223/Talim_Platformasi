import { getPrisma } from '../lib/prisma.js';

export async function connectDB() {
  try {
    const prisma = getPrisma();
    await prisma.$connect();
    console.log('Postgres ulandi (Prisma)');
  } catch (err) {
    console.error('Postgres ulanish xatosi:', err.message);
    console.error('Server yopilmaydi – DB ulanganda API ishlaydi.');
  }
}
