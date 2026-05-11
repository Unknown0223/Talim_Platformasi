import { getPrisma } from '../lib/prisma.js';

export async function enrollCourse(req, res) {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId talab qilinadi' });
    const prisma = getPrisma();
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing) {
      return res.status(400).json({ message: 'Siz allaqachon shu kursga yozilgansiz' });
    }
    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId, status: 'active' },
      include: { course: true, user: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
    });
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyEnrollments(req, res) {
  try {
    const prisma = getPrisma();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: { course: { include: { teacher: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
