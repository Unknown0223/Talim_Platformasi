import { getPrisma } from '../lib/prisma.js';

export async function listMyNotifications(req, res) {
  try {
    const prisma = getPrisma();
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unreadCount = notifications.filter((n) => !n.readAt).length;
    res.json({ unreadCount, notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const prisma = getPrisma();
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true, count: notification.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const prisma = getPrisma();
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true, count: result.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
