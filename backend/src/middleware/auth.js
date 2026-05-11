import jwt from 'jsonwebtoken';
import { getPrisma } from '../lib/prisma.js';
import { getRolePermissionPresets, userHasPermission } from '../lib/permissions.js';

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return req.query.token || null;
}

export async function authMiddleware(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Token talab qilinadi' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        studentId: true,
        xp: true,
        badges: true,
        rank: true,
        coins: true,
        referralCode: true,
        referralCount: true,
        birthDate: true,
        telegramId: true,
        avatar: true,
        isApproved: true,
        permissions: true,
        permissionsOverride: true,
        balance: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
    }
    const presets = await getRolePermissionPresets(prisma);
    req.user = { ...user, rolePermissions: presets[user.role] || [] };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token noto‘g‘ri yoki muddati tugagan' });
  }
}

export function roleCheck(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu amal uchun ruxsat yo‘q' });
    }
    next();
  };
}

export function hasPermission(user, permission) {
  return userHasPermission(user, permission);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    if (!userHasPermission(req.user, permission)) {
      return res.status(403).json({ message: `Bu amal uchun ruxsat yo‘q: ${permission}` });
    }
    next();
  };
}
