import { getPrisma } from '../lib/prisma.js';

export async function getTeachersList(req, res) {
  try {
    const prisma = getPrisma();
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        coverImage: true,
        lastSeen: true,
        nameEmoji: true,
        nameEmojiAnim: true,
        teacherDetails: true,
        taughtCourses: { select: { id: true } },
        teacherReviews: { select: { rating: true } },
      },
      orderBy: { name: 'asc' },
    });

    const teachersWithRatings = teachers.map((t) => {
      const totalReviews = t.teacherReviews.length;
      const avgRating =
        totalReviews > 0
          ? t.teacherReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
          : 0;
      const ratingPoints = t.teacherReviews.reduce((acc, r) => acc + r.rating, 0); // 1..5 yig'indisi
      const ratingScore = Number((avgRating * 20 + Math.min(100, totalReviews * 2)).toFixed(0)); // 0..200 atrofida
      return {
        ...t,
        avgRating: Number(avgRating.toFixed(1)),
        ratingPoints,
        ratingScore,
        reviewsCount: totalReviews,
        coursesCount: t.taughtCourses.length,
      };
    });

    res.json(teachersWithRatings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTeacherDetail(req, res) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    const teacher = await prisma.user.findFirst({
      where: { id, role: 'teacher' },
      include: {
        teacherDetails: true,
      },
    });
    
    if (!teacher) {
      return res.status(404).json({ message: "O'qituvchi topilmadi" });
    }

    const coursesRaw = await prisma.course.findMany({
      where: { teacherId: id },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const courseIds = coursesRaw.map((c) => c.id);
    const activeEnrollCounts = courseIds.length
      ? await prisma.enrollment.groupBy({
          by: ['courseId'],
          where: { courseId: { in: courseIds }, status: 'active' },
          _count: { _all: true },
        })
      : [];
    const activeByCourse = Object.fromEntries(activeEnrollCounts.map((g) => [g.courseId, g._count._all]));

    const courses = coursesRaw.map((c) => ({
      ...c,
      lessonCount: c?._count?.lessons || 0,
      studentCount: activeByCourse[c.id] || 0,
    }));
    
    const reviews = await prisma.teacherReview.findMany({
      where: { teacherId: id },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
      
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, c) => acc + c.rating, 0) / reviews.length).toFixed(1)
      : 0;
    const ratingPoints = reviews.reduce((acc, r) => acc + r.rating, 0);
    const ratingScore = Number((Number(avgRating) * 20 + Math.min(100, reviews.length * 2)).toFixed(0));

    const totalLessons = courses.reduce((n, c) => n + (c.lessonCount || 0), 0);
    const totalStudents = courses.reduce((n, c) => n + (c.studentCount || 0), 0);

    const funFacts = [
      { title: 'Jami o‘quvchi', value: totalStudents, hint: "Faol enroll'lar yig‘indisi" },
      { title: 'Jami dars', value: totalLessons, hint: 'Kurslardagi materiallar soni' },
      { title: 'Sharhlar', value: reviews.length, hint: 'Talabalar feedbacki' },
    ];

    res.json({
      teacher,
      courses,
      reviews,
      recentReviews: reviews.slice(0, 5),
      stats: {
        rating: Number(avgRating),
        reviewsCount: reviews.length,
        coursesCount: courses.length,
        totalLessons,
        totalStudents,
        ratingPoints,
        ratingScore,
      },
      funFacts,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addReview(req, res) {
  try {
    const { teacherId } = req.params;
    const studentId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Note'g'ri baho berdingiz (1-5 oralig'ida bo'lishi kerak)" });
    }

    const prisma = getPrisma();
    const existingReview = await prisma.teacherReview.findFirst({ where: { teacherId, studentId } });
    if (existingReview) {
      return res.status(400).json({ message: "Siz avval bu ustozga baho bergansiz" });
    }

    const review = await prisma.teacherReview.create({
      data: {
        teacherId,
        studentId,
        rating: Number(rating),
        comment: comment || null,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
