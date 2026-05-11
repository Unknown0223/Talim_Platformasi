import crypto from 'crypto';
import { getPrisma } from '../lib/prisma.js';

function makeRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export async function createBattle(req, res) {
  try {
    const { courseId, subjectId: bodySubjectId, title, questionCount = 10, durationMinutes = 20 } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId talab qilinadi' });
    const prisma = getPrisma();
    const course = await prisma.course.findUnique({
      where: { id: String(courseId) },
      select: { id: true, title: true, subjectId: true, teacherId: true },
    });
    if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Faqat o‘z kursingiz uchun battle ochishingiz mumkin' });
    }
    const subjectId = bodySubjectId || course.subjectId;
    const questions = await prisma.test.findMany({
      where: {
        subjectId,
        OR: [{ courseId: course.id }, { courseId: null }],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(questionCount) || 10, 30),
    });
    if (questions.length === 0) return res.status(400).json({ message: 'Bu kurs uchun savollar topilmadi' });
    const roomCode = makeRoomCode();
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + (Number(durationMinutes) || 20) * 60_000);
    const room = await prisma.battle.create({
      data: {
        teacherId: course.teacherId,
        courseId: course.id,
        subjectId,
        title: title || `${course.title} Battle`,
        status: 'open',
        startsAt,
        endsAt,
        mode: 'battle',
        meta: {
          roomCode,
          subjectId,
          courseId: course.id,
          questionIds: questions.map((q) => q.id),
          durationMinutes: Number(durationMinutes) || 20,
          players: [{ userId: req.user.id, name: req.user.name, score: null, submittedAt: null }],
        },
      },
    });
    res.status(201).json({ roomCode, subjectId, courseId: course.id, battleId: room.id, title: room.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function joinBattle(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'code talab qilinadi' });
    const prisma = getPrisma();
    const roomCode = String(code).toUpperCase().trim();
    const room = await prisma.battle.findFirst({ where: { meta: { path: ['roomCode'], equals: roomCode } } });
    if (!room) return res.status(404).json({ message: 'Xona topilmadi' });

    const meta = room.meta || {};
    if (room.courseId && req.user.role === 'student') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId: room.courseId } },
      });
      if (!enrollment || enrollment.status !== 'active') {
        return res.status(403).json({ message: 'Bu battle faqat shu kurs talabalari uchun' });
      }
    }
    const players = Array.isArray(meta.players) ? meta.players : [];
    if (players.length >= 10) return res.status(400).json({ message: 'Xona to\'ldi' });
    const already = players.some((p) => p?.userId === req.user.id);
    const nextPlayers = already
      ? players
      : [...players, { userId: req.user.id, name: req.user.name, score: null, submittedAt: null }];

    await prisma.battle.update({ where: { id: room.id }, data: { meta: { ...meta, players: nextPlayers } } });
    res.json({ roomCode, subjectId: meta.subjectId, courseId: room.courseId, battleId: room.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getBattle(req, res) {
  try {
    const prisma = getPrisma();
    const roomCode = req.params.code.toUpperCase();
    const room = await prisma.battle.findFirst({ where: { meta: { path: ['roomCode'], equals: roomCode } } });
    if (!room) return res.status(404).json({ message: 'Xona topilmadi' });

    const meta = room.meta || {};
    const players = Array.isArray(meta.players) ? meta.players : [];
    const leaderboard = players
      .filter((p) => p && p.score != null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));

    const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds : [];
    const questions = questionIds.length
      ? await prisma.test.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, question: true, options: true, level: true },
        })
      : [];
    res.json({ roomCode, subjectId: meta.subjectId, courseId: room.courseId, title: room.title, players, leaderboard, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitBattle(req, res) {
  try {
    const prisma = getPrisma();
    const roomCode = req.params.code.toUpperCase();
    const room = await prisma.battle.findFirst({ where: { meta: { path: ['roomCode'], equals: roomCode } } });
    if (!room) return res.status(404).json({ message: 'Xona topilmadi' });
    const { score, answers = [] } = req.body;
    const meta = room.meta || {};
    const players = Array.isArray(meta.players) ? meta.players : [];
    const idx = players.findIndex((p) => p?.userId === req.user.id);
    if (idx === -1) return res.status(400).json({ message: 'Siz ushbu xonada emassiz' });
    let finalScore = Number(score || 0);
    const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds : [];
    if (Array.isArray(answers) && answers.length && questionIds.length) {
      const questions = await prisma.test.findMany({ where: { id: { in: questionIds } }, select: { id: true, correctAnswer: true } });
      const byId = Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer]));
      const correct = answers.filter((a) => byId[a.questionId] && byId[a.questionId] === a.answer).length;
      finalScore = Math.round((correct / questionIds.length) * 100);
    }
    const nextPlayers = [...players];
    nextPlayers[idx] = { ...nextPlayers[idx], score: finalScore, submittedAt: new Date().toISOString(), name: req.user.name };
    await prisma.battle.update({ where: { id: room.id }, data: { meta: { ...meta, players: nextPlayers } } });
    const leaderboard = nextPlayers
      .filter((p) => p && p.score != null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
