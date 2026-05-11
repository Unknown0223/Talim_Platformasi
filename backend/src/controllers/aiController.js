import { getPrisma } from '../lib/prisma.js';

export async function askReceptionAI(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt talab qilinadi' });

    const lowerPrompt = prompt.toLowerCase();
    let response = "";

    // Ma'lumotlarni yig'ish (AI javob bera olishi uchun)
    const prisma = getPrisma();
    const stats = {
      teachersCount: await prisma.user.count({ where: { role: 'teacher' } }),
      studentsCount: await prisma.user.count({ where: { role: 'student' } }),
      roomsCount: await prisma.room.count(),
      coursesCount: await prisma.course.count(),
      attendanceToday: 0,
    };

    // Oddiy mantiqiy AI (NLP simulyatsiyasi)
    if (lowerPrompt.includes('nechta o\'qituvchi') || lowerPrompt.includes('ustozlar soni')) {
      response = `Hozirda platformada ${stats.teachersCount} ta o'qituvchi faoliyat ko'rsatmoqda.`;
    } else if (lowerPrompt.includes('nechta talaba') || lowerPrompt.includes('o\'quvchilar soni')) {
      response = `Tizimda jami ${stats.studentsCount} ta ro'yxatdan o'tgan talaba mavjud.`;
    } else if (lowerPrompt.includes('xonalar') || lowerPrompt.includes('bo\'sh xona')) {
      response = `Bizda jami ${stats.roomsCount} ta o'quv xonasi mavjud. Hozirda ulardan foydalanish jadvalini "Xonalar" bo'limidan ko'rishingiz mumkin.`;
    } else if (lowerPrompt.includes('bugun kelganlar') || lowerPrompt.includes('davomat')) {
      response = `Bugun tizimda jami ${stats.attendanceToday} ta davomat belgisi "Kelgan" deb qayd etildi.`;
    } else if (lowerPrompt.includes('salom') || lowerPrompt.includes('assalomu alaykum')) {
      response = "Assalomu alaykum! Men Reception uchun AI yordamchiman. Platforma statistikasi yoki foydalanish bo'yicha savollaringizga javob bera olaman.";
    } else {
      response = `Kechirasiz, bu savolga aniq javob bera olmayman. Men hozirda o'qituvchilar (${stats.teachersCount}), talabalar (${stats.studentsCount}) va umumiy kurslar (${stats.coursesCount}) haqida ma'lumot bera olaman.`;
    }

    res.json({ response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
