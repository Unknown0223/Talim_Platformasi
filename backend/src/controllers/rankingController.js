import { getPrisma } from '../lib/prisma.js';

// Kurs bo'yicha o'quvchilar reytingi
export async function getCourseLeaderboard(req, res) {
  try {
    const { courseId } = req.params;
    const prisma = getPrisma();

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'active' },
      include: {
        user: { select: { id: true, name: true, avatar: true, studentId: true, xp: true, rank: true, nameEmoji: true, nameEmojiAnim: true } },
        course: { select: { subjectId: true } },
      },
    });

    const leaderboard = await Promise.all(
      enrollments.map(async (en) => {
        const student = en.user;
        if (!student) return null;

        const testResults = await prisma.testResult.findMany({ where: { userId: student.id } });
        const avgScore =
          testResults.length > 0 ? testResults.reduce((acc, r) => acc + r.score, 0) / testResults.length : 0;

        // Attendance is stored per schedule/user. For course leaderboard we approximate by schedules for the course.
        const courseSchedules = await prisma.schedule.findMany({ where: { courseId }, select: { id: true } });
        const scheduleIds = courseSchedules.map((s) => s.id);
        const attendances = scheduleIds.length
          ? await prisma.attendance.findMany({ where: { userId: student.id, scheduleId: { in: scheduleIds } } })
          : [];
        const presentCount = attendances.filter((a) => a.status === '+' || a.status === 'present').length;
        const attRate = attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0;

        const finalRankScore = avgScore * 0.7 + attRate * 0.3;

        return {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          studentId: student.studentId,
          avgScore: Math.round(avgScore),
          attendanceRate: Math.round(attRate),
          rankScore: Math.round(finalRankScore),
          xp: student.xp,
          rank: student.rank,
        };
      }),
    );

    const results = leaderboard.filter(Boolean).sort((a, b) => b.rankScore - a.rankScore);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Ustozlar reytingi (o'quvchilar muvaffaqiyati asosida)
export async function getTeacherRanking(req, res) {
  try {
    const prisma = getPrisma();
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
        avatar: true,
        nameEmoji: true,
        nameEmojiAnim: true,
        teacherDetails: true,
        teacherReviews: { select: { rating: true } },
      },
    });

    const ranking = teachers
      .map((t) => {
        const total = t.teacherReviews.length;
        const avg = total ? t.teacherReviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
        return { ...t, rating: Number(avg.toFixed(2)) };
      })
      .sort((a, b) => b.rating - a.rating);

    res.json(ranking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Umumiy talabalar reytingi (guest ham ko'ra oladi)
export async function getStudentRanking(req, res) {
  try {
    const prisma = getPrisma();
    const limit = Math.max(5, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const subjectId = req.query.subjectId ? String(req.query.subjectId) : null;

    // First: take top xp students as candidate pool for ranking (fast + good enough)
    const candidates = await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, name: true, avatar: true, studentId: true, xp: true, rank: true, nameEmoji: true, nameEmojiAnim: true },
      orderBy: { xp: 'desc' },
      take: Math.max(50, limit * 5),
    });

    const presentLike = new Set(['present', '+', 'keldi']);

    const computed = await Promise.all(
      candidates.map(async (s) => {
        const results = await prisma.testResult.findMany({
          where: { userId: s.id, ...(subjectId ? { subjectId } : {}) },
          select: { score: true },
          take: 50,
          orderBy: { updatedAt: 'desc' },
        });
        const avgScore = results.length ? results.reduce((acc, r) => acc + Number(r.score || 0), 0) / results.length : 0;

        const attendances = await prisma.attendance.findMany({
          where: { userId: s.id },
          select: { status: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        });
        const totalAtt = attendances.length;
        const present = attendances.filter((a) => presentLike.has(String(a.status).toLowerCase())).length;
        const attendanceRate = totalAtt ? (present / totalAtt) * 100 : 0;

        // Main score: learning result + discipline; xp breaks ties
        const rankScore = Math.round(avgScore * 0.7 + attendanceRate * 0.3);

        return {
          id: s.id,
          name: s.name,
          avatar: s.avatar,
          studentId: s.studentId,
          avgScore: Math.round(avgScore),
          attendanceRate: Math.round(attendanceRate),
          rankScore,
          xp: s.xp,
          rank: s.rank,
        };
      }),
    );

    const ranking = computed
      .sort((a, b) => (b.rankScore - a.rankScore) || (b.xp - a.xp))
      .slice(0, limit);

    res.json(ranking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
