import { getPrisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { PERMISSIONS, effectivePermissionsForUser, getRolePermissionPresets, normalizePermissions, SYSTEM_ROLES, ROLE_PERMISSION_SETTING_KEY } from '../lib/permissions.js';

const allowedNotificationRoles = ['admin', 'teacher', 'cashier', 'receptionist'];
const blockedWords = [
  'ahmoq', 'tentak', 'jinni', 'haqorat', 'so‘kin', 'sokin', 'fuck', 'shit', 'idiot', 'дурак',
];

function hasBlockedContent(text = '') {
  const lower = String(text).toLowerCase();
  return blockedWords.find((word) => lower.includes(word));
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, role talab qilinadi' });
    }
    const prisma = getPrisma();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Bu email allaqachon mavjud' });
    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email).toLowerCase(),
        passwordHash,
        role: String(role),
        isApproved: true,
        permissions: permissions ? normalizePermissions(permissions) : [],
        permissionsOverride: permissions != null,
      },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getUsers(req, res) {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getStats(req, res) {
  try {
    const prisma = getPrisma();
    const [
      userCount,
      courseCount,
      enrollmentCount,
      testCount,
      paymentCount,
      confirmedRevenue,
      pendingPaymentCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.testResult.count(),
      prisma.payment.count(),
      prisma.payment
        .aggregate({ where: { status: 'confirmed' }, _sum: { amount: true } })
        .then((r) => Number(r?._sum?.amount || 0)),
      prisma.payment.count({ where: { status: 'pending' } }),
    ]);

    // Keep both old and UI-friendly keys for backwards compatibility
    res.json({
      // legacy keys
      userCount,
      courseCount,
      enrollmentCount,
      testCount,
      guestCount: 0,

      // UI keys (used by frontend Admin.tsx)
      users: userCount,
      courses: courseCount,
      payments: paymentCount,
      testResults: testCount,

      // extra useful metrics
      revenueConfirmed: confirmedRevenue,
      paymentsPending: pendingPaymentCount,
      enrollments: enrollmentCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getPaymentAnalytics(req, res) {
  try {
    const prisma = getPrisma();
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const [payments, users, enrollments] = await Promise.all([
      prisma.payment.findMany({
        where: { createdAt: { gte: start } },
        include: { course: { select: { id: true, title: true, teacherId: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      prisma.enrollment.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    ]);

    const dayKey = (date) => date.toISOString().slice(0, 10);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return dayKey(d);
    });

    const trend = days.map((day) => {
      const dayPayments = payments.filter((p) => dayKey(p.createdAt) === day);
      return {
        day,
        confirmedRevenue: dayPayments
          .filter((p) => p.status === 'confirmed')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        pendingRevenue: dayPayments
          .filter((p) => p.status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        users: users.filter((u) => dayKey(u.createdAt) === day).length,
        enrollments: enrollments.filter((e) => dayKey(e.createdAt) === day).length,
      };
    });

    const byStatus = payments.reduce((acc, p) => {
      const key = p.status || 'unknown';
      acc[key] ||= { count: 0, amount: 0 };
      acc[key].count += 1;
      acc[key].amount += Number(p.amount || 0);
      return acc;
    }, {});

    const byCourseMap = new Map();
    payments
      .filter((p) => p.status === 'confirmed')
      .forEach((p) => {
        const id = p.courseId || 'unknown';
        const current = byCourseMap.get(id) || {
          courseId: id,
          title: p.course?.title || 'Kurs',
          revenue: 0,
          count: 0,
        };
        current.revenue += Number(p.amount || 0);
        current.count += 1;
        byCourseMap.set(id, current);
      });
    const byCourse = Array.from(byCourseMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const confirmedRevenue = payments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    res.json({
      range: { from: dayKey(start), to: dayKey(now) },
      trend,
      byStatus,
      byCourse,
      totals: {
        confirmedRevenue,
        teacherShare: Math.floor(confirmedRevenue * 0.7),
        platformShare: Math.ceil(confirmedRevenue * 0.3),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createSubject(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Fan nomi talab qilinadi' });
    const prisma = getPrisma();
    const subject = await prisma.subject.create({ data: { name: name.trim(), description: description || null } });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createLocation(req, res) {
  try {
    const { name, address, lat, lng } = req.body;
    if (!name || !address || lat == null || lng == null) return res.status(400).json({ message: 'name, address, lat, lng talab qilinadi' });
    const prisma = getPrisma();
    const location = await prisma.location.create({ data: { name, address, lat: Number(lat), lng: Number(lng) } });
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getReviews(req, res) {
  try {
    const prisma = getPrisma();
    const reviews = await prisma.teacherReview.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
        student: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, isApproved, permissions, permissionsOverride } = req.body;
    const prisma = getPrisma();
    const oldUser = await prisma.user.findUnique({ where: { id }, select: { isApproved: true, telegramId: true, role: true } });
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(isApproved != null ? { isApproved: !!isApproved } : {}),
        ...(permissions != null ? { permissions: normalizePermissions(permissions), permissionsOverride: true } : {}),
        ...(permissionsOverride === false ? { permissions: [], permissionsOverride: false } : {}),
      },
    });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    // Agar tasdiqlansa, xabar yuborish
    if (isApproved && oldUser?.isApproved === false && user.telegramId) {
      import('../services/telegramBot.js').then(({ sendNotification }) => {
        sendNotification(user.telegramId, `✅ <b>Tabriklaymiz!</b>\nSizning <b>${user.role}</b> sifatidagi hisobingiz admin tomonidan tasdiqlandi. Endi tizimning barcha imkoniyatlaridan foydalanishingiz mumkin.`);
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getPermissionDefinitions(_req, res) {
  try {
    const prisma = getPrisma();
    const presets = await getRolePermissionPresets(prisma);
    res.json({
      permissions: PERMISSIONS,
      presets,
      roles: SYSTEM_ROLES,
      mode: 'role-base-with-user-additions',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateRolePermissions(req, res) {
  try {
    const role = String(req.params.role || '');
    if (!SYSTEM_ROLES.includes(role)) return res.status(400).json({ message: 'Rol noto‘g‘ri' });
    if (role === 'admin') return res.status(400).json({ message: 'Admin roli barcha dostupga ega' });
    const prisma = getPrisma();
    const current = await getRolePermissionPresets(prisma);
    const next = { ...current, [role]: normalizePermissions(req.body.permissions || []) };
    await prisma.setting.upsert({
      where: { key: ROLE_PERMISSION_SETTING_KEY },
      create: { key: ROLE_PERMISSION_SETTING_KEY, value: next },
      update: { value: next },
    });
    res.json({ role, permissions: next[role], presets: next });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateUserPermissions(req, res) {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { permissions: normalizePermissions(req.body.permissions || []), permissionsOverride: true },
    });
    const presets = await getRolePermissionPresets(prisma);
    const hydrated = { ...user, rolePermissions: presets[user.role] || [] };
    res.json({ ...hydrated, effectivePermissions: effectivePermissionsForUser(hydrated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function resetUserPermissions(req, res) {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { permissions: [], permissionsOverride: false },
    });
    const presets = await getRolePermissionPresets(prisma);
    const hydrated = { ...user, rolePermissions: presets[user.role] || [] };
    res.json({ ...hydrated, effectivePermissions: effectivePermissionsForUser(hydrated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
export async function deleteUser(req, res) {
  try {
    const prisma = getPrisma();
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Parent ↔ Child link CRUD
export async function listParentLinks(req, res) {
  try {
    const prisma = getPrisma();
    const { parentId, childId } = req.query;
    const where = {};
    if (parentId) where.parentId = String(parentId);
    if (childId) where.childId = String(childId);
    const links = await prisma.parentChild.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
        child: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true, studentId: true } },
      },
    });
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function linkParentChild(req, res) {
  try {
    const { parentId, childId } = req.body;
    if (!parentId || !childId) {
      return res.status(400).json({ message: 'parentId va childId talab qilinadi' });
    }
    if (parentId === childId) {
      return res.status(400).json({ message: 'Foydalanuvchi o\'z-o\'ziga bog\'lanmaydi' });
    }
    const prisma = getPrisma();
    const [parent, child] = await Promise.all([
      prisma.user.findUnique({ where: { id: String(parentId) } }),
      prisma.user.findUnique({ where: { id: String(childId) } }),
    ]);
    if (!parent || parent.role !== 'parent') {
      return res.status(400).json({ message: 'Tanlangan foydalanuvchi ota-ona emas' });
    }
    if (!child || child.role !== 'student') {
      return res.status(400).json({ message: 'Bola talaba bo\'lishi kerak' });
    }
    const link = await prisma.parentChild.upsert({
      where: { parentId_childId: { parentId, childId } },
      update: {},
      create: { parentId, childId },
      include: {
        parent: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
        child: { select: { id: true, name: true, email: true, avatar: true, nameEmoji: true, nameEmojiAnim: true, studentId: true } },
      },
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function unlinkParentChild(req, res) {
  try {
    const { parentId, childId } = req.params;
    const prisma = getPrisma();
    await prisma.parentChild.delete({
      where: { parentId_childId: { parentId, childId } },
    });
    res.json({ message: 'Bog\'lanish olib tashlandi' });
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ message: 'Bog\'lanish topilmadi' });
    }
    res.status(500).json({ message: err.message });
  }
}
export async function sendBroadcast(req, res) {
  try {
    const { role, message } = req.body;
    if (!message) return res.status(400).json({ message: 'Xabar matni talab qilinadi' });
    
    const { broadcast } = await import('../services/telegramBot.js');
    const count = await broadcast(role || 'all', message);
    
    res.json({ message: `Xabar ${count} ta foydalanuvchiga yuborildi`, count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getNotificationStats(req, res) {
  try {
    const roles = ['student', 'teacher', 'admin', 'cashier', 'receptionist', 'parent'];
    const prisma = getPrisma();
    const stats = await Promise.all(roles.map(async (role) => {
      const count = await prisma.user.count({ where: { role, telegramId: { not: null } } });
      return { role, count };
    }));
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateSubject(req, res) {
  try {
    const prisma = getPrisma();
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name ? { name: req.body.name } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      },
    });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
export async function deleteSubject(req, res) {
  try {
    const prisma = getPrisma();
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Fan o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateLocation(req, res) {
  try {
    const prisma = getPrisma();
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name ? { name: req.body.name } : {}),
        ...(req.body.address ? { address: req.body.address } : {}),
        ...(req.body.lat != null ? { lat: Number(req.body.lat) } : {}),
        ...(req.body.lng != null ? { lng: Number(req.body.lng) } : {}),
      },
    });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
export async function deleteLocation(req, res) {
  try {
    const prisma = getPrisma();
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ message: 'Joy o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAllSettings(req, res) {
  try {
    const prisma = getPrisma();
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
export async function updateSetting(req, res) {
  try {
    const { key, value, group } = req.body;
    const prisma = getPrisma();
    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value: value ?? null },
      update: { value: value ?? null },
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateBrand(req, res) {
  try {
    const prisma = getPrisma();
    const brand = {
      name: String(req.body.name || 'Talim').slice(0, 40),
      subtitle: String(req.body.subtitle || 'Learn Platform').slice(0, 80),
      logoText: String(req.body.logoText || 'T').slice(0, 4),
      primaryColor: String(req.body.primaryColor || '#5a8aff'),
      accentColor: String(req.body.accentColor || '#8b5cf6'),
      textStyle: String(req.body.textStyle || 'normal'),
      animationEffect: String(req.body.animationEffect || 'none'),
    };
    const setting = await prisma.setting.upsert({
      where: { key: 'brand_settings' },
      create: { key: 'brand_settings', value: brand },
      update: { value: brand },
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listNews(req, res) {
  try {
    const prisma = getPrisma();
    const items = await prisma.newsItem.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createNews(req, res) {
  try {
    const prisma = getPrisma();
    const item = await prisma.newsItem.create({
      data: {
        title: String(req.body.title || '').trim(),
        body: String(req.body.body || '').trim(),
        type: req.body.type || 'news',
        icon: req.body.icon || null,
        color: req.body.color || null,
        imageUrl: req.body.imageUrl || null,
        ctaLabel: req.body.ctaLabel || null,
        ctaUrl: req.body.ctaUrl || null,
        audienceRoles: Array.isArray(req.body.audienceRoles) ? req.body.audienceRoles.map(String) : [],
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
        priority: Number(req.body.priority || 0),
        isPublished: req.body.isPublished !== false,
        requiresParticipation: !!req.body.requiresParticipation,
        maxParticipants: req.body.maxParticipants
          ? Math.max(1, Math.floor(Number(req.body.maxParticipants)))
          : null,
        prize: req.body.prize ? String(req.body.prize).trim() : null,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateNews(req, res) {
  try {
    const prisma = getPrisma();
    const item = await prisma.newsItem.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title != null ? { title: String(req.body.title).trim() } : {}),
        ...(req.body.body != null ? { body: String(req.body.body).trim() } : {}),
        ...(req.body.type != null ? { type: String(req.body.type) } : {}),
        ...(req.body.icon !== undefined ? { icon: req.body.icon || null } : {}),
        ...(req.body.color !== undefined ? { color: req.body.color || null } : {}),
        ...(req.body.imageUrl !== undefined ? { imageUrl: req.body.imageUrl || null } : {}),
        ...(req.body.ctaLabel !== undefined ? { ctaLabel: req.body.ctaLabel || null } : {}),
        ...(req.body.ctaUrl !== undefined ? { ctaUrl: req.body.ctaUrl || null } : {}),
        ...(req.body.audienceRoles != null ? { audienceRoles: Array.isArray(req.body.audienceRoles) ? req.body.audienceRoles.map(String) : [] } : {}),
        ...(req.body.startsAt !== undefined ? { startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null } : {}),
        ...(req.body.endsAt !== undefined ? { endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null } : {}),
        ...(req.body.priority != null ? { priority: Number(req.body.priority) } : {}),
        ...(req.body.isPublished != null ? { isPublished: !!req.body.isPublished } : {}),
        ...(req.body.requiresParticipation !== undefined ? { requiresParticipation: !!req.body.requiresParticipation } : {}),
        ...(req.body.maxParticipants !== undefined
          ? { maxParticipants: req.body.maxParticipants ? Math.max(1, Math.floor(Number(req.body.maxParticipants))) : null }
          : {}),
        ...(req.body.prize !== undefined ? { prize: req.body.prize ? String(req.body.prize).trim() : null } : {}),
      },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteNews(req, res) {
  try {
    const prisma = getPrisma();
    await prisma.newsItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Yangilik o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function sendInAppNotification(req, res) {
  try {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    const targetRoles = (Array.isArray(req.body.roles) ? req.body.roles : []).map(String).filter((r) => allowedNotificationRoles.includes(r));
    if (!title || !body) return res.status(400).json({ message: 'Mavzu va matn talab qilinadi' });
    if (targetRoles.length === 0) return res.status(400).json({ message: 'Kamida bitta rol tanlang' });
    const blocked = hasBlockedContent(`${title} ${body}`);
    if (blocked) return res.status(400).json({ message: `Xabar odob qoidalariga mos emas: "${blocked}" so‘zi topildi` });

    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: { role: { in: targetRoles } },
      select: { id: true },
    });
    if (users.length === 0) return res.json({ count: 0, message: 'Mos foydalanuvchi topilmadi' });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        senderId: req.user.id,
        title,
        body,
        category: req.body.category || 'admin',
        targetRoles,
      })),
    });
    for (const u of users) {
      globalThis.__talimIo?.to(`user:${u.id}`).emit('notification:new', { title, body });
    }
    res.status(201).json({ count: users.length, message: `${users.length} ta foydalanuvchiga yuborildi` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
