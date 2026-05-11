import { getPrisma } from '../lib/prisma.js';

// Ota-onaning barcha farzandlarini ro'yxatini olish
export async function getChildren(req, res) {
  try {
    const prisma = getPrisma();
    const parentId = req.user.id;
    const links = await prisma.parentChild.findMany({
      where: { parentId },
      include: { child: { select: { id: true, name: true, xp: true, rank: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
    });
    res.json(links.map((l) => l.child));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Tanlangan farzandning statistikasini olish
export async function getChildStats(req, res) {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const prisma = getPrisma();
    const link = await prisma.parentChild.findUnique({ where: { parentId_childId: { parentId, childId } } });
    if (!link && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu talaba ma\'lumotlariga ruxsat yo\'q' });
    }

    const child = await prisma.user.findUnique({
      where: { id: childId },
      select: { id: true, name: true, xp: true, rank: true, avatar: true, nameEmoji: true, nameEmojiAnim: true, studentId: true },
    });
    if (!child) return res.status(404).json({ message: 'Talaba topilmadi' });

    const testResults = await prisma.testResult.findMany({
      where: { userId: childId },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: childId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      child,
      testResults,
      enrollments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Tanlangan farzandning davomatini olish
export async function getChildAttendance(req, res) {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const prisma = getPrisma();
    const link = await prisma.parentChild.findUnique({ where: { parentId_childId: { parentId, childId } } });
    if (!link && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }

    const attendance = await prisma.attendance.findMany({
      where: { userId: childId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
