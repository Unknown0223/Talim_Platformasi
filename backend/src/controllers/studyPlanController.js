import { getPrisma } from '../lib/prisma.js';

export async function getStudyPlan(req, res) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();
    const results = await prisma.testResult.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
    const bySubject = {};
    results.forEach((r) => {
      const id = r.subjectId?.toString?.() || r.subject?.id;
      if (!id) return;
      if (!bySubject[id] || r.createdAt > bySubject[id].createdAt) {
        bySubject[id] = { subjectId: r.subject, level: r.level, score: r.score, createdAt: r.createdAt };
      }
    });
    const subjectIds = Object.keys(bySubject);
    const courses = await prisma.course.findMany({
      where: { subjectId: { in: subjectIds }, type: 'online' },
      include: { subject: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
      take: 20,
    });
    const weekPlan = [];
    const days = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    subjectIds.slice(0, 6).forEach((sid, i) => {
      const info = bySubject[sid];
      const recs = courses.filter((c) => c.subjectId === sid || c.subject?.id === sid);
      const nextLevel = info.level === 'Beginner' ? 'Intermediate' : info.level === 'Intermediate' ? 'Advanced' : 'Advanced';
      weekPlan.push({
        day: days[i % days.length],
        subject: info.subjectId?.name,
        currentLevel: info.level,
        recommendation: recs.length ? `"${recs[0].title}" kursini ko'ring` : 'Kurslarni ko\'rib chiqing',
        tasks: [
          `Test natijangiz: ${info.score}%. Daraja: ${info.level}`,
          nextLevel !== info.level ? `${nextLevel} darajadagi kursni boshlang` : 'Mashq va videolar bilan mustahkamlang',
        ],
      });
    });
    if (weekPlan.length === 0 && results.length === 0) {
      weekPlan.push(
        { day: 'Dushanba', subject: '—', recommendation: 'Bosh sahifadan test topshiring', tasks: ['Fan tanlang va test bering', 'Natijangizga qarab reja tuzamiz'] },
        { day: 'Seshanba', subject: '—', recommendation: 'Kurslar bo\'limini ko\'ring', tasks: ['O\'zingizga yoqqan kursni tanlang'] },
      );
    }
    res.json({ weekPlan, testSummary: Object.values(bySubject) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
