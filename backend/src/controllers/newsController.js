import { getPrisma } from '../lib/prisma.js';

function decorate(item, userId) {
  const participants = Array.isArray(item.participants) ? item.participants : [];
  const participantsCount = participants.length;
  const isJoined = userId ? participants.some((p) => p.userId === userId) : false;
  const limitReached = item.maxParticipants ? participantsCount >= item.maxParticipants : false;
  const expired = item.endsAt ? new Date(item.endsAt).getTime() <= Date.now() : false;
  const recent = participants
    .slice()
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      userId: p.userId,
      joinedAt: p.joinedAt,
      isWinner: !!p.isWinner,
      user: p.user
        ? { id: p.user.id, name: p.user.name, avatar: p.user.avatar }
        : null,
    }));
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    type: item.type,
    icon: item.icon,
    color: item.color,
    imageUrl: item.imageUrl,
    ctaLabel: item.ctaLabel,
    ctaUrl: item.ctaUrl,
    audienceRoles: item.audienceRoles,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    priority: item.priority,
    isPublished: item.isPublished,
    requiresParticipation: !!item.requiresParticipation,
    maxParticipants: item.maxParticipants,
    prize: item.prize,
    participantsCount,
    isJoined,
    limitReached,
    expired,
    recentParticipants: recent,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function fetchAndDecorate(prisma, where, userId, take) {
  const items = await prisma.newsItem.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take,
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
      },
    },
  });
  return items.map((item) => decorate(item, userId));
}

export async function getActiveNews(req, res) {
  try {
    const role = req.user?.role || 'guest';
    const userId = req.user?.id || null;
    const now = new Date();
    const prisma = getPrisma();
    const items = await fetchAndDecorate(
      prisma,
      {
        isPublished: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      userId,
      12,
    );
    res.json(items.filter((item) => item.audienceRoles.length === 0 || item.audienceRoles.includes(role)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listAllNews(req, res) {
  try {
    const userId = req.user?.id || null;
    const prisma = getPrisma();
    const items = await fetchAndDecorate(prisma, {}, userId, 200);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createNews(req, res) {
  try {
    const prisma = getPrisma();
    const {
      title,
      body,
      type,
      icon,
      color,
      imageUrl,
      ctaLabel,
      ctaUrl,
      audienceRoles,
      startsAt,
      endsAt,
      priority,
      isPublished,
      requiresParticipation,
      maxParticipants,
      prize,
    } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ message: 'Sarlavha va matn majburiy' });
    }

    const created = await prisma.newsItem.create({
      data: {
        title: String(title).trim(),
        body: String(body).trim(),
        type: type ? String(type).trim() : 'news',
        icon: icon || null,
        color: color || null,
        imageUrl: imageUrl || null,
        ctaLabel: ctaLabel || null,
        ctaUrl: ctaUrl || null,
        audienceRoles: Array.isArray(audienceRoles) ? audienceRoles.map(String) : [],
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        priority: Number(priority) || 0,
        isPublished: isPublished !== undefined ? !!isPublished : true,
        requiresParticipation: !!requiresParticipation,
        maxParticipants: maxParticipants ? Math.max(1, Math.floor(Number(maxParticipants))) : null,
        prize: prize ? String(prize).trim() : null,
      },
    });
    res.status(201).json(decorate({ ...created, participants: [] }, req.user?.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateNews(req, res) {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const data = {};
    const fields = [
      'title',
      'body',
      'type',
      'icon',
      'color',
      'imageUrl',
      'ctaLabel',
      'ctaUrl',
      'prize',
    ];
    fields.forEach((f) => {
      if (req.body?.[f] !== undefined) data[f] = req.body[f];
    });
    if (req.body?.audienceRoles !== undefined) {
      data.audienceRoles = Array.isArray(req.body.audienceRoles) ? req.body.audienceRoles.map(String) : [];
    }
    if (req.body?.startsAt !== undefined) data.startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    if (req.body?.endsAt !== undefined) data.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (req.body?.priority !== undefined) data.priority = Number(req.body.priority) || 0;
    if (req.body?.isPublished !== undefined) data.isPublished = !!req.body.isPublished;
    if (req.body?.requiresParticipation !== undefined) data.requiresParticipation = !!req.body.requiresParticipation;
    if (req.body?.maxParticipants !== undefined) {
      data.maxParticipants = req.body.maxParticipants
        ? Math.max(1, Math.floor(Number(req.body.maxParticipants)))
        : null;
    }
    const updated = await prisma.newsItem.update({
      where: { id },
      data,
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
        },
      },
    });
    res.json(decorate(updated, req.user?.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteNews(req, res) {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    await prisma.newsItem.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function joinNews(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Avtorizatsiya talab' });
    const { id } = req.params;

    const role = req.user?.role || 'guest';
    // Faqat talabalar (student) tadbirlarda qatnasha oladi
    if (role !== 'student') {
      return res.status(403).json({
        message: "Chegirmalar, imtihonlar va sovrinli tadbirlarda faqat talabalar qatnasha oladi.",
      });
    }

    const item = await prisma.newsItem.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!item) return res.status(404).json({ message: 'Tadbir topilmadi' });
    if (!item.isPublished) return res.status(400).json({ message: 'Tadbir faol emas' });
    if (item.endsAt && new Date(item.endsAt).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Tadbir muddati tugagan' });
    }
    if (item.audienceRoles.length > 0 && !item.audienceRoles.includes(role)) {
      return res.status(403).json({ message: 'Bu tadbirda qatnashish mumkin emas' });
    }
    const already = item.participants.find((p) => p.userId === userId);
    if (already) {
      return res.status(409).json({ message: 'Siz allaqachon qatnashgansiz' });
    }
    if (item.maxParticipants && item.participants.length >= item.maxParticipants) {
      return res.status(409).json({ message: 'Qatnashuvchilar limiti tugagan' });
    }

    await prisma.newsParticipant.create({
      data: { newsId: id, userId },
    });

    const refreshed = await prisma.newsItem.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
        },
      },
    });
    res.json(decorate(refreshed, userId));
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ message: 'Siz allaqachon qatnashgansiz' });
    }
    res.status(500).json({ message: err.message });
  }
}

export async function leaveNews(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Avtorizatsiya talab' });
    const { id } = req.params;
    await prisma.newsParticipant.deleteMany({ where: { newsId: id, userId } });
    const refreshed = await prisma.newsItem.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
        },
      },
    });
    if (!refreshed) return res.json({ ok: true });
    res.json(decorate(refreshed, userId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listParticipants(req, res) {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const participants = await prisma.newsParticipant.findMany({
      where: { newsId: id },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, name: true, avatar: true, email: true, nameEmoji: true, nameEmojiAnim: true } } },
    });
    res.json(
      participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        joinedAt: p.joinedAt,
        isWinner: !!p.isWinner,
        user: p.user,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function pickWinners(req, res) {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const count = Math.max(1, Math.floor(Number(req.body?.count) || 1));
    const participants = await prisma.newsParticipant.findMany({ where: { newsId: id } });
    if (participants.length === 0) {
      return res.status(400).json({ message: 'Qatnashuvchilar yo‘q' });
    }
    const shuffled = participants
      .map((p) => ({ p, key: Math.random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ p }) => p);
    const winners = shuffled.slice(0, Math.min(count, shuffled.length));
    await prisma.$transaction([
      prisma.newsParticipant.updateMany({ where: { newsId: id }, data: { isWinner: false } }),
      ...winners.map((w) =>
        prisma.newsParticipant.update({ where: { id: w.id }, data: { isWinner: true } }),
      ),
    ]);
    const refreshed = await prisma.newsItem.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
        },
      },
    });
    if (!refreshed) return res.json({ ok: true });
    res.json(decorate(refreshed, req.user?.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
