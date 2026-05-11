import { getPrisma } from '../lib/prisma.js';

/**
 * GET /api/monitoring/active-classes
 * Bugungi barcha darslar + har biri uchun o'qituvchi va o'quvchilar soni
 */
export async function getActiveClasses(req, res) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Bugungi jadvallar
    const prisma = getPrisma();
    const schedules = await prisma.schedule.findMany({
      where: { date: { gte: startOfDay, lt: endOfDay } },
      include: {
        teacher: { select: { id: true, name: true, avatar: true, role: true, nameEmoji: true, nameEmojiAnim: true } },
        course: { select: { id: true, title: true, subjectId: true, type: true } },
        location: { select: { id: true, name: true, address: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Har bir jadval uchun o'quvchilar davomati
    const result = await Promise.all(
      schedules.map(async (sch) => {
        const courseId = sch.course?.id;

        // Bugun kelgan o'quvchilar
        const presentAttendance = await prisma.attendance.findMany({
          where: { scheduleId: sch.id },
          include: { user: { select: { id: true, name: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
        });
        const presentStudents = presentAttendance
          .filter((a) => a.status === '+' || a.status === 'present')
          .map((a) => a.user);

        // Kurs umumiy o'quvchilar soni
        const totalEnrolled = courseId
          ? await prisma.enrollment.count({ where: { courseId, status: 'active' } })
          : 0;

        // O'qituvchi bugun kelganmi?
        const teacherStatus = 'not_marked';

        return {
          schedule: sch,
          teacherStatus,
          presentCount: presentStudents.length,
          totalEnrolled,
          presentStudents,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/monitoring/online
 * Hozir tizimda kim bor (so'nggi 5 daqiqada active bo'lganlar) - simple check via lastSeen
 */
export async function getOnlineUsers(req, res) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: { lastSeen: { gte: fiveMinutesAgo } },
      select: { id: true, name: true, role: true, avatar: true, lastSeen: true, nameEmoji: true, nameEmojiAnim: true },
      orderBy: { lastSeen: 'desc' },
      take: 200,
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
