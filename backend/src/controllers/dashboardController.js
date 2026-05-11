import { getPrisma } from '../lib/prisma.js';

export async function studentDashboard(req, res) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: { in: ['active', 'completed'] } },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
            subject: { select: { id: true, name: true } },
            lessons: { orderBy: { createdAt: 'asc' }, take: 80 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const testResults = await prisma.testResult.findMany({
      where: { userId },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const attendanceRows = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const presentLike = new Set(['present', '+', 'keldi']);
    const present = attendanceRows.filter((a) => presentLike.has(String(a.status).toLowerCase())).length;
    const attendanceTotal = attendanceRows.length;
    const attendanceRatePct = attendanceTotal ? Math.round((present / attendanceTotal) * 100) : null;

    res.json({
      enrollments,
      testResults,
      attendance: {
        total: attendanceTotal,
        present,
        ratePct: attendanceRatePct,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function teacherDashboard(req, res) {
  try {
    const teacherId = req.user.id;
    const prisma = getPrisma();
    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { balance: true } });
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const courseIds = courses.map((c) => c.id);
    const enrollments = courseIds.length
      ? await prisma.enrollment.findMany({ where: { courseId: { in: courseIds } }, select: { userId: true } })
      : [];
    const studentCount = new Set(enrollments.map((e) => e.userId)).size;

    const lessons = courseIds.length
      ? await prisma.lesson.findMany({ where: { courseId: { in: courseIds } }, orderBy: { createdAt: 'desc' }, take: 20 })
      : [];

    let coursesOut = courses;
    if (courseIds.length) {
      const grouped = await prisma.enrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      });
      const countByCourse = Object.fromEntries(grouped.map((g) => [g.courseId, g._count._all]));
      coursesOut = courses.map((c) => ({ ...c, enrollmentCount: countByCourse[c.id] || 0 }));
    }

    const ratingAgg = await prisma.teacherReview.aggregate({
      where: { teacherId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avgRating = ratingAgg?._avg?.rating != null ? Number(ratingAgg._avg.rating) : 0;
    const reviewsCount = Number(ratingAgg?._count?._all || 0);

    res.json({
      courses: coursesOut,
      lessons,
      teacher: {
        balance: teacher?.balance || 0,
        studentCount,
        averageRating: Number(avgRating.toFixed(1)),
        reviewsCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
