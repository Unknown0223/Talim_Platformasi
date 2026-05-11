import { getPrisma } from '../lib/prisma.js';

export async function getRandomQuestion(req, res) {
  try {
    const subjectId = req.query.subjectId;
    const prisma = getPrisma();
    const list = await prisma.test.findMany({
      where: subjectId ? { subjectId: String(subjectId) } : {},
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    if (!list.length) return res.status(404).json({ message: 'Savol topilmadi' });
    const question = list[Math.floor(Math.random() * list.length)];
    const { correctAnswer, ...sent } = question;
    return res.json({ question: sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server xatosi' });
  }
}

export async function submitAnswer(req, res) {
  try {
    const { userId, questionId, chosen, timeTakenSec } = req.body;
    const prisma = getPrisma();
    const question = await prisma.test.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ message: 'Savol topilmadi' });
    const correct = question.correctAnswer === chosen;
    const score = correct ? 1 : 0;
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: userId || req.user?.id,
        mode: "quiz",
        score,
        meta: {
          questionId,
          question: question.question,
          chosen: chosen || null,
          correctAnswer: question.correctAnswer,
          timeTakenSec: timeTakenSec || 0,
        },
      },
    });
    return res.json({ ok: true, correct, score, attemptId: attempt.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server xatosi' });
  }
}
