import { getPrisma } from '../lib/prisma.js';

const VALID_TYPES = ['suggestion', 'complaint', 'question', 'praise'];
const VALID_CATEGORIES = ['general', 'teacher', 'course', 'center', 'system', 'payment'];
const VALID_STATUSES = ['new', 'in_review', 'resolved', 'rejected'];
const VALID_PRIORITIES = ['low', 'normal', 'high'];

function clampString(value, max = 5000) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function feedbackInclude() {
  return {
    user: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
    targetUser: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
    targetCourse: { select: { id: true, title: true } },
    respondedBy: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
  };
}

function maskAnonymous(item) {
  if (!item?.isAnonymous) return item;
  return {
    ...item,
    user: item.user
      ? { id: item.user.id, name: 'Anonim foydalanuvchi', email: null, role: item.user.role, avatar: null }
      : null,
  };
}

export async function createFeedback(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    const { type, category, subject, body, isAnonymous, targetUserId, targetCourseId, priority } = req.body || {};

    const safeSubject = clampString(subject, 200);
    const safeBody = clampString(body, 5000);

    if (!safeSubject) return res.status(400).json({ message: 'Mavzu (subject) talab qilinadi' });
    if (!safeBody) return res.status(400).json({ message: 'Matn (body) talab qilinadi' });

    const safeType = VALID_TYPES.includes(type) ? type : 'suggestion';
    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'general';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'normal';

    const prisma = getPrisma();

    if (targetUserId) {
      const target = await prisma.user.findUnique({ where: { id: String(targetUserId) }, select: { id: true } });
      if (!target) return res.status(400).json({ message: "Belgilangan foydalanuvchi topilmadi" });
    }
    if (targetCourseId) {
      const course = await prisma.course.findUnique({ where: { id: String(targetCourseId) }, select: { id: true } });
      if (!course) return res.status(400).json({ message: 'Belgilangan kurs topilmadi' });
    }

    const created = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        type: safeType,
        category: safeCategory,
        subject: safeSubject,
        body: safeBody,
        priority: safePriority,
        isAnonymous: Boolean(isAnonymous),
        targetUserId: targetUserId ? String(targetUserId) : null,
        targetCourseId: targetCourseId ? String(targetCourseId) : null,
      },
      include: feedbackInclude(),
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Saqlab bo\'lmadi' });
  }
}

export async function listMyFeedback(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    const prisma = getPrisma();
    const items = await prisma.feedback.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: feedbackInclude(),
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Yuklab bo\'lmadi' });
  }
}

export async function listAllFeedback(req, res) {
  try {
    const { status, type, category, q } = req.query || {};
    const where = {};
    if (status && VALID_STATUSES.includes(String(status))) where.status = String(status);
    if (type && VALID_TYPES.includes(String(type))) where.type = String(type);
    if (category && VALID_CATEGORIES.includes(String(category))) where.category = String(category);
    if (q) {
      const term = String(q).trim();
      if (term) {
        where.OR = [
          { subject: { contains: term, mode: 'insensitive' } },
          { body: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const prisma = getPrisma();
    const items = await prisma.feedback.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: feedbackInclude(),
    });

    const masked = items.map(maskAnonymous);
    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Yuklab bo\'lmadi' });
  }
}

export async function feedbackStats(req, res) {
  try {
    const prisma = getPrisma();
    const [total, byStatus, byType] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['type'], _count: { _all: true } }),
    ]);
    const statusMap = Object.fromEntries(byStatus.map((g) => [g.status, g._count._all]));
    const typeMap = Object.fromEntries(byType.map((g) => [g.type, g._count._all]));
    res.json({
      total,
      newCount: statusMap.new || 0,
      inReviewCount: statusMap.in_review || 0,
      resolvedCount: statusMap.resolved || 0,
      rejectedCount: statusMap.rejected || 0,
      byType: typeMap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Statistikani olishda xato' });
  }
}

export async function updateFeedback(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    const { id } = req.params;
    const { status, adminResponse, priority } = req.body || {};

    const prisma = getPrisma();
    const existing = await prisma.feedback.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: 'Topilmadi' });

    const data = {};
    if (status && VALID_STATUSES.includes(String(status))) data.status = String(status);
    if (priority && VALID_PRIORITIES.includes(String(priority))) data.priority = String(priority);
    if (typeof adminResponse === 'string') {
      const trimmed = clampString(adminResponse, 5000);
      data.adminResponse = trimmed || null;
      if (trimmed) {
        data.respondedById = req.user.id;
        data.respondedAt = new Date();
        if (!data.status) data.status = 'in_review';
      }
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data,
      include: feedbackInclude(),
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Yangilab bo\'lmadi' });
  }
}

export async function deleteFeedback(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    const { id } = req.params;
    const prisma = getPrisma();
    const existing = await prisma.feedback.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!existing) return res.status(404).json({ message: 'Topilmadi' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = existing.userId === req.user.id;
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Bu amal uchun ruxsat yo\'q' });

    await prisma.feedback.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message || 'O\'chirib bo\'lmadi' });
  }
}
