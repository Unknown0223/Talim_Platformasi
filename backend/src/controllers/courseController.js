import { getPrisma } from '../lib/prisma.js';
import { userHasPermission } from '../lib/permissions.js';

function normalizeVariantPart(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function variantGroupKey(course, includePrice = true) {
  return [
    normalizeVariantPart(course.title),
    String(course.subjectId || course.subject?.id || ''),
    String(course.level || ''),
    String(course.type || ''),
    normalizeVariantPart(course.description),
    includePrice ? Number(course.price || 0) : '',
  ].join('|');
}

function serializeCourse(course) {
  const reviews = course.teacher?.teacherReviews || [];
  const rating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1))
    : 0;
  const { teacherReviews, ...teacher } = course.teacher || {};
  return {
    ...course,
    teacher,
    lessonCount: course._count?.lessons || 0,
    studentCount: course._count?.enrollments || 0,
    rating,
    reviewsCount: reviews.length,
    variantGroupKey: variantGroupKey(course, true),
    courseFamilyKey: variantGroupKey(course, false),
  };
}

export async function getCourses(req, res) {
  try {
    const { subjectId, level, type } = req.query;
    const prisma = getPrisma();
    const courses = await prisma.course.findMany({
      where: {
        ...(subjectId ? { subjectId: String(subjectId) } : {}),
        ...(level ? { level: String(level) } : {}),
        ...(type ? { type: String(type) } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            nameEmoji: true,
            nameEmojiAnim: true,
            teacherReviews: { select: { rating: true } },
          },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = courses.map(serializeCourse);
    const groups = new Map();
    for (const row of rows) {
      const list = groups.get(row.variantGroupKey) || [];
      list.push(row);
      groups.set(row.variantGroupKey, list);
    }
    res.json(rows.map((row) => {
      const variants = groups.get(row.variantGroupKey) || [row];
      const prices = variants.map((v) => Number(v.price || 0));
      return {
        ...row,
        variantCount: variants.length,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        teachers: variants.map((v) => ({
          courseId: v.id,
          id: v.teacher?.id,
          name: v.teacher?.name,
          email: v.teacher?.email,
          rating: v.rating,
          reviewsCount: v.reviewsCount,
          price: Number(v.price || 0),
          studentCount: v.studentCount,
          lessonCount: v.lessonCount,
        })),
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCourseById(req, res) {
  try {
    const prisma = getPrisma();
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        subject: { select: { id: true, name: true, description: true } },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            nameEmoji: true,
            nameEmojiAnim: true,
            teacherReviews: { select: { rating: true } },
          },
        },
        lessons: { orderBy: { createdAt: 'asc' } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
    const variants = await prisma.course.findMany({
      where: {
        title: course.title,
        subjectId: course.subjectId,
        level: course.level,
        type: course.type,
        description: course.description,
        price: course.price,
      },
      include: {
        subject: { select: { id: true, name: true, description: true } },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            nameEmoji: true,
            nameEmojiAnim: true,
            teacherReviews: { select: { rating: true } },
          },
        },
        lessons: { orderBy: { createdAt: 'asc' } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const serialized = serializeCourse(course);
    const serializedVariants = variants.map(serializeCourse);
    res.json({
      ...serialized,
      variants: serializedVariants,
      variantCount: serializedVariants.length,
      teachers: serializedVariants.map((v) => ({
        courseId: v.id,
        id: v.teacher?.id,
        name: v.teacher?.name,
        email: v.teacher?.email,
        rating: v.rating,
        reviewsCount: v.reviewsCount,
        price: Number(v.price || 0),
        studentCount: v.studentCount,
        lessonCount: v.lessonCount,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCourseStudents(req, res) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id, status: 'active' },
      include: { user: { select: { id: true, name: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    res.json(enrollments.map((e) => e.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCourseStats(req, res) {
  try {
    if (!userHasPermission(req.user, 'course.stats.view')) {
      return res.status(403).json({ message: 'Kurs statistikalarini ko‘rish uchun ruxsat yo‘q' });
    }
    const { id } = req.params;
    const prisma = getPrisma();
    const [course, enrollmentCount, confirmedPayments, pendingPayments] = await Promise.all([
      prisma.course.findUnique({
        where: { id },
        include: {
          teacher: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
          subject: { select: { id: true, name: true } },
        },
      }),
      prisma.enrollment.count({ where: { courseId: id, status: 'active' } }),
      prisma.payment.aggregate({ where: { courseId: id, status: 'confirmed' }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.payment.aggregate({ where: { courseId: id, status: 'pending' }, _sum: { amount: true }, _count: { _all: true } }),
    ]);
    if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
    res.json({
      course,
      enrollmentCount,
      payments: {
        confirmedCount: confirmedPayments._count._all,
        confirmedRevenue: Number(confirmedPayments._sum.amount || 0),
        pendingCount: pendingPayments._count._all,
        pendingRevenue: Number(pendingPayments._sum.amount || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateCoursePrice(req, res) {
  try {
    if (!userHasPermission(req.user, 'course.edit_price')) {
      return res.status(403).json({ message: 'Kurs narxini o‘zgartirish uchun ruxsat yo‘q' });
    }
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: 'Narx noto‘g‘ri' });
    }
    const prisma = getPrisma();
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { price },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
    });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createCourse(req, res) {
  try {
    const { title, subjectId, level, type, price, description, teacherId: bodyTeacherId, icon, imageUrl, color } = req.body;
    const teacherId = (req.user.role === 'admin' && bodyTeacherId) ? bodyTeacherId : req.user.id;
    if (!title || !subjectId || !type) {
      return res.status(400).json({ message: 'Title, subjectId va type talab qilinadi' });
    }
    const prisma = getPrisma();
    const created = await prisma.course.create({
      data: {
        title,
        subjectId,
        teacherId,
        level: level || 'Beginner',
        type,
        price: Number(price || 0),
        description: description || '',
        icon: icon || null,
        imageUrl: imageUrl || null,
        color: color || null,
      },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const priceOnly = Object.keys(req.body || {}).every((key) => ['price'].includes(key));
    const needsPricePermission = req.body.price != null;
    const needsEditPermission = !priceOnly;
    if (needsPricePermission && !userHasPermission(req.user, 'course.edit_price')) {
      return res.status(403).json({ message: 'Kurs narxini o‘zgartirish uchun ruxsat yo‘q' });
    }
    if (needsEditPermission && !userHasPermission(req.user, 'course.edit')) {
      return res.status(403).json({ message: 'Kursni tahrirlash uchun ruxsat yo‘q' });
    }
    const prisma = getPrisma();
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(req.body.title ? { title: req.body.title } : {}),
        ...(req.body.subjectId ? { subjectId: req.body.subjectId } : {}),
        ...(req.body.teacherId ? { teacherId: req.body.teacherId } : {}),
        ...(req.body.level ? { level: req.body.level } : {}),
        ...(req.body.type ? { type: req.body.type } : {}),
        ...(req.body.price != null ? { price: Number(req.body.price) } : {}),
        ...(req.body.description != null ? { description: req.body.description } : {}),
        ...(req.body.icon !== undefined ? { icon: req.body.icon || null } : {}),
        ...(req.body.imageUrl !== undefined ? { imageUrl: req.body.imageUrl || null } : {}),
        ...(req.body.color !== undefined ? { color: req.body.color || null } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
    });
    if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Kurs va uning darslari muvaffaqiyatli o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
