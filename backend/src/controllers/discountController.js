import { getPrisma } from '../lib/prisma.js';
import { userHasPermission } from '../lib/permissions.js';

function asDate(value) {
  return value ? new Date(value) : null;
}

function isActiveCampaign(campaign) {
  const now = new Date();
  if (campaign.status !== 'active') return false;
  if (campaign.startsAt && campaign.startsAt > now) return false;
  if (campaign.endsAt && campaign.endsAt < now) return false;
  return true;
}

function calcDiscount(campaign, course) {
  const price = Number(course?.price || 0);
  if (campaign.type === 'fixed') return Math.min(price, Math.max(0, Number(campaign.value || 0)));
  return Math.min(price, Math.round((price * Math.max(0, Number(campaign.value || 0))) / 100));
}

async function buildEligibleAwards(prisma, campaign) {
  const rules = campaign.rules && typeof campaign.rules === 'object' ? campaign.rules : {};
  const where = {
    status: 'active',
    ...(campaign.courseId ? { courseId: campaign.courseId } : {}),
    ...(campaign.subjectId ? { course: { subjectId: campaign.subjectId } } : {}),
  };
  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      course: { select: { id: true, title: true, price: true, subjectId: true } },
    },
  });

  const rows = [];
  for (const enrollment of enrollments) {
    const [testRows, attendanceRows, battles] = await Promise.all([
      prisma.testResult.findMany({
        where: { userId: enrollment.userId, ...(campaign.subjectId ? { subjectId: campaign.subjectId } : {}) },
        select: { score: true },
      }),
      prisma.attendance.findMany({ where: { userId: enrollment.userId }, select: { status: true } }),
      prisma.battle.findMany({
        where: { ...(campaign.courseId ? { courseId: campaign.courseId } : {}), ...(campaign.subjectId ? { subjectId: campaign.subjectId } : {}) },
        select: { meta: true },
      }),
    ]);
    const testScore = testRows.length ? Math.max(...testRows.map((t) => Number(t.score || 0))) : 0;
    const battleScore = battles.reduce((best, b) => {
      const players = Array.isArray(b.meta?.players) ? b.meta.players : [];
      const mine = players.find((p) => p.userId === enrollment.userId);
      return Math.max(best, Number(mine?.score || 0));
    }, 0);
    const attendanceTotal = attendanceRows.length;
    const attendancePresent = attendanceRows.filter((a) => ['present', '+', 'keldi'].includes(String(a.status).toLowerCase())).length;
    const attendanceRate = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
    const score = Math.max(testScore, battleScore);
    if (rules.minScore != null && score < Number(rules.minScore)) continue;
    if (rules.minAttendancePct != null && attendanceRate < Number(rules.minAttendancePct)) continue;
    rows.push({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      score,
      discountAmount: calcDiscount(campaign, enrollment.course),
      reason: `Score ${score}, davomat ${attendanceRate}%`,
    });
  }
  rows.sort((a, b) => b.score - a.score);
  return campaign.maxWinners ? rows.slice(0, Number(campaign.maxWinners)) : rows;
}

export async function listDiscountCampaigns(_req, res) {
  try {
    const prisma = getPrisma();
    const campaigns = await prisma.discountCampaign.findMany({
      include: {
        course: { select: { id: true, title: true, price: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { awards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createDiscountCampaign(req, res) {
  try {
    if (!userHasPermission(req.user, 'discount.manage')) return res.status(403).json({ message: 'Ruxsat berilmagan' });
    const { title, description, courseId, subjectId, type = 'percent', value, maxWinners, rules, status = 'active', startsAt, endsAt } = req.body;
    if (!title || value == null) return res.status(400).json({ message: 'title va value talab qilinadi' });
    const prisma = getPrisma();
    const campaign = await prisma.discountCampaign.create({
      data: {
        title,
        description: description || null,
        courseId: courseId || null,
        subjectId: subjectId || null,
        type,
        value: Number(value),
        maxWinners: maxWinners ? Number(maxWinners) : null,
        rules: rules || {},
        status,
        startsAt: asDate(startsAt),
        endsAt: asDate(endsAt),
        createdById: req.user.id,
      },
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function refreshDiscountAwards(req, res) {
  try {
    if (!userHasPermission(req.user, 'discount.manage')) return res.status(403).json({ message: 'Ruxsat berilmagan' });
    const prisma = getPrisma();
    const campaign = await prisma.discountCampaign.findUnique({ where: { id: req.params.id }, include: { course: true } });
    if (!campaign) return res.status(404).json({ message: 'Kampaniya topilmadi' });
    const rows = await buildEligibleAwards(prisma, campaign);
    for (const row of rows) {
      await prisma.discountAward.upsert({
        where: { campaignId_userId_courseId: { campaignId: campaign.id, userId: row.userId, courseId: row.courseId } },
        create: { campaignId: campaign.id, status: 'eligible', source: 'auto', ...row },
        update: { status: 'eligible', source: 'auto', score: row.score, reason: row.reason, discountAmount: row.discountAmount },
      });
    }
    res.json({ count: rows.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listDiscountAwards(req, res) {
  try {
    const prisma = getPrisma();
    const where = {
      ...(req.params.id ? { campaignId: req.params.id } : {}),
      ...(req.query.userId ? { userId: String(req.query.userId) } : {}),
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(req.user.role === 'student' ? { userId: req.user.id } : {}),
    };
    const awards = await prisma.discountAward.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
        course: { select: { id: true, title: true, price: true } },
        campaign: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    res.json(awards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function upsertManualAward(req, res) {
  try {
    if (!userHasPermission(req.user, 'discount.override')) return res.status(403).json({ message: 'Ruxsat berilmagan' });
    const { userId, courseId, status = 'eligible', reason } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId talab qilinadi' });
    const prisma = getPrisma();
    const campaign = await prisma.discountCampaign.findUnique({ where: { id: req.params.id }, include: { course: true } });
    if (!campaign) return res.status(404).json({ message: 'Kampaniya topilmadi' });
    const finalCourseId = courseId || campaign.courseId;
    if (!finalCourseId) return res.status(400).json({ message: 'courseId talab qilinadi' });
    const course = finalCourseId ? await prisma.course.findUnique({ where: { id: finalCourseId } }) : campaign.course;
    const award = await prisma.discountAward.upsert({
      where: { campaignId_userId_courseId: { campaignId: campaign.id, userId, courseId: finalCourseId } },
      create: {
        campaignId: campaign.id,
        userId,
        courseId: finalCourseId,
        status,
        source: 'manual',
        reason: reason || 'Admin qo‘lda kiritdi',
        discountAmount: calcDiscount(campaign, course),
      },
      update: { status, source: 'manual', reason: reason || 'Admin qo‘lda yangiladi' },
    });
    res.json(award);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function availableDiscountForPayment(req, res) {
  try {
    if (!userHasPermission(req.user, 'discount.apply') && req.user.role !== 'student') return res.status(403).json({ message: 'Ruxsat berilmagan' });
    const { userId, courseId } = req.query;
    if (!userId || !courseId) return res.status(400).json({ message: 'userId va courseId talab qilinadi' });
    const prisma = getPrisma();
    const awards = await prisma.discountAward.findMany({
      where: { userId: String(userId), courseId: String(courseId), status: { in: ['eligible', 'approved'] } },
      include: { campaign: true, course: true },
      orderBy: { discountAmount: 'desc' },
    });
    const award = awards.find((a) => isActiveCampaign(a.campaign));
    res.json({ award: award || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
