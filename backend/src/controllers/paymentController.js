import { getPrisma } from '../lib/prisma.js';
import { userHasPermission } from '../lib/permissions.js';

function isPaymentStaff(user) {
  return userHasPermission(user, 'payment.view') || userHasPermission(user, 'payment.confirm');
}

function paymentInclude() {
  return {
    user: { select: { id: true, name: true, email: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
    course: { select: { id: true, title: true, price: true, teacherId: true, teacher: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } } },
    discountAward: { include: { campaign: { select: { id: true, title: true, type: true, value: true } } } },
  };
}

export async function listStudentsForPayment(req, res) {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, name: true, email: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true },
      orderBy: { name: 'asc' },
      take: 500,
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Student to'lov haqida xabar yuborishi (Pending statusda)
export async function createPayment(req, res) {
  try {
    const { courseId, amount, transactionId, userId: bodyUserId, method, discountAwardId } = req.body;
    let userId = req.user.id;

    if (isPaymentStaff(req.user) && bodyUserId) {
      userId = String(bodyUserId);
    } else if (bodyUserId && !isPaymentStaff(req.user)) {
      return res.status(403).json({ message: "Boshqa foydalanuvchi uchun to'lov yaratish mumkin emas" });
    }

    if (!courseId || amount == null || amount === '') {
      return res.status(400).json({ message: 'courseId va amount talab qilinadi' });
    }

    const prisma = getPrisma();
    const originalAmount = Number(amount);
    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      return res.status(400).json({ message: 'To‘lov summasi noto‘g‘ri' });
    }

    const course = await prisma.course.findUnique({ where: { id: String(courseId) }, select: { id: true, title: true, price: true } });
    if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
    let discountAmount = 0;
    let finalDiscountAwardId = null;
    if (discountAwardId) {
      if (!userHasPermission(req.user, 'discount.apply')) {
        return res.status(403).json({ message: 'Chegirmani qo‘llash uchun ruxsat yo‘q' });
      }
      const award = await prisma.discountAward.findUnique({
        where: { id: String(discountAwardId) },
        include: { campaign: true },
      });
      const now = new Date();
      const active = award?.campaign?.status === 'active'
        && (!award.campaign.startsAt || award.campaign.startsAt <= now)
        && (!award.campaign.endsAt || award.campaign.endsAt >= now);
      if (!award || award.userId !== userId || award.courseId !== String(courseId) || !['eligible', 'approved'].includes(award.status) || !active) {
        return res.status(400).json({ message: 'Chegirma bu talaba/kurs uchun mos emas' });
      }
      discountAmount = Number(award.discountAmount || 0);
      finalDiscountAwardId = award.id;
    }
    const numericAmount = Math.max(0, originalAmount - discountAmount);

    if (bodyUserId && isPaymentStaff(req.user)) {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!target || target.role !== 'student') {
        return res.status(400).json({ message: 'Talaba topilmadi yoki rol noto‘g‘ri' });
      }
    }

    const existing = await prisma.payment.findFirst({
      where: {
        userId,
        courseId: String(courseId),
        status: { in: ['pending', 'confirmed'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.status === 'pending') {
      return res.status(409).json({ message: 'Bu kurs uchun to‘lov allaqachon kutilmoqda' });
    }
    if (existing?.status === 'confirmed') {
      return res.status(409).json({ message: 'Bu kurs allaqachon ochilgan' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId: String(courseId),
        amount: numericAmount,
        originalAmount,
        discountAmount,
        discountAwardId: finalDiscountAwardId,
        method: method ? String(method) : transactionId ? 'transaction' : null,
        status: 'pending',
      },
      include: paymentInclude(),
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Kassir to'lovni tasdiqlashi
export async function confirmPayment(req, res) {
  try {
    if (!userHasPermission(req.user, 'payment.confirm')) {
      return res.status(403).json({ message: 'Ruxsat berilmagan' });
    }

    const { paymentId } = req.params;
    const prisma = getPrisma();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: paymentInclude() });

    if (!payment) {
      return res.status(404).json({ message: 'To\'lov topilmadi' });
    }

    if (payment.status === 'confirmed') {
      return res.status(400).json({ message: 'Bu to\'lov allaqachon tasdiqlangan' });
    }

    if ((payment.discountAwardId || Number(payment.discountAmount || 0) > 0) && !userHasPermission(req.user, 'payment.discounted_confirm')) {
      return res.status(403).json({ message: 'Chegirmali to‘lovni tasdiqlash uchun ruxsat yo‘q' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'confirmed' },
        include: paymentInclude(),
      });

      let enrollment = null;
      if (payment.userId && payment.courseId) {
        enrollment = await tx.enrollment.upsert({
          where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
          create: { userId: payment.userId, courseId: payment.courseId, status: 'active' },
          update: { status: 'active' },
        });
      }

      const teacherShare = Math.floor(Number(payment.amount || 0) * 0.7);
      if (payment.course?.teacherId && teacherShare > 0) {
        await tx.user.update({
          where: { id: payment.course.teacherId },
          data: { balance: { increment: teacherShare } },
        });
      }
      if (payment.discountAwardId) {
        await tx.discountAward.update({
          where: { id: payment.discountAwardId },
          data: { status: 'used' },
        });
      }

      return { payment: updated, enrollment, teacherShare };
    });

    const [teacher, student] = await Promise.all([
      payment.course?.teacherId
        ? prisma.user.findUnique({ where: { id: payment.course.teacherId }, select: { telegramId: true } })
        : null,
      payment.userId ? prisma.user.findUnique({ where: { id: payment.userId }, select: { telegramId: true } }) : null,
    ]);

    if (teacher?.telegramId) {
      import('../services/telegramBot.js').then(({ sendNotification }) => {
        sendNotification(teacher.telegramId, `💰 <b>Yangi to'lov!</b>\n"${payment.course?.title || 'Kurs'}" kursi uchun ${payment.amount.toLocaleString()} so'm to'landi. Sizning ulushingiz: ${result.teacherShare.toLocaleString()} so'm.`);
      });
    }
    if (student?.telegramId) {
      import('../services/telegramBot.js').then(({ sendNotification }) => {
        sendNotification(student.telegramId, `✅ <b>To'lov tasdiqlandi!</b>\n"${payment.course?.title || 'Kurs'}" kursi endi siz uchun ochiq. O'qishda muvaffaqiyatlar!`);
      });
    }

    res.json({ message: 'To\'lov tasdiqlandi va kurs ochildi', ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Kassir uchun barcha pending to'lovlar
export async function getPendingPayments(req, res) {
  try {
    if (!userHasPermission(req.user, 'payment.view')) {
      return res.status(403).json({ message: 'Ruxsat berilmagan' });
    }
    const prisma = getPrisma();
    const payments = await prisma.payment.findMany({
      where: { status: 'pending' },
      include: paymentInclude(),
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Student ID bo'yicha to'lovlar tarixini olish
export async function getPaymentsByStudentId(req, res) {
  try {
    const { studentId } = req.params;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return res.status(404).json({ message: 'Student topilmadi' });
    if (!userHasPermission(req.user, 'payment.view') && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Ruxsat berilmagan' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      include: paymentInclude(),
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyPayments(req, res) {
  try {
    const prisma = getPrisma();
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: paymentInclude(),
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listPayments(req, res) {
  try {
    if (!userHasPermission(req.user, 'payment.view')) {
      return res.status(403).json({ message: 'Ruxsat berilmagan' });
    }
    const { status, q, method, take = 100 } = req.query;
    const cleanStatus = status && status !== 'all' ? String(status) : undefined;
    const prisma = getPrisma();
    const payments = await prisma.payment.findMany({
      where: {
        ...(cleanStatus ? { status: cleanStatus } : {}),
        ...(method && method !== 'all' ? { method: String(method) } : {}),
        ...(q
          ? {
              OR: [
                { user: { name: { contains: String(q), mode: 'insensitive' } } },
                { user: { email: { contains: String(q), mode: 'insensitive' } } },
                { course: { title: { contains: String(q), mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: paymentInclude(),
      orderBy: { updatedAt: 'desc' },
      take: Math.min(Number(take) || 100, 500),
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Kassir/Admin uchun qisqa summary (dashboard cards)
export async function getPaymentSummary(req, res) {
  try {
    if (!userHasPermission(req.user, 'payment.analytics')) {
      return res.status(403).json({ message: 'Ruxsat berilmagan' });
    }

    const prisma = getPrisma();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingCount, confirmedCount, confirmedToday, confirmedMonth, discountedPendingCount, discountedConfirmedCount, discountTotal] = await Promise.all([
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.payment.count({ where: { status: 'confirmed' } }),
      prisma.payment
        .aggregate({
          where: { status: 'confirmed', createdAt: { gte: startOfDay } },
          _sum: { amount: true },
        })
        .then((r) => Number(r?._sum?.amount || 0)),
      prisma.payment
        .aggregate({
          where: { status: 'confirmed', createdAt: { gte: startOfMonth } },
          _sum: { amount: true },
        })
        .then((r) => Number(r?._sum?.amount || 0)),
      prisma.payment.count({ where: { status: 'pending', discountAmount: { gt: 0 } } }),
      prisma.payment.count({ where: { status: 'confirmed', discountAmount: { gt: 0 } } }),
      prisma.payment
        .aggregate({ where: { discountAmount: { gt: 0 } }, _sum: { discountAmount: true } })
        .then((r) => Number(r?._sum?.discountAmount || 0)),
    ]);

    res.json({
      pendingCount,
      confirmedCount,
      confirmedToday,
      confirmedMonth,
      discountedPendingCount,
      discountedConfirmedCount,
      discountTotal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
