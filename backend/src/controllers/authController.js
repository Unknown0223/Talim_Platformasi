import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../lib/prisma.js';
import { effectivePermissionsForUser, getRolePermissionPresets } from '../lib/permissions.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const LINK_CODE_EXPIRE = 10 * 60 * 1000; // 10 daqiqa

let telegramLinkCodes = new Map();

// Generirlash funksiyasini auth export qilish uchun
export function generateTelegramLinkCode(userId) {
  if (!userId) return null;
  let code;
  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
  } while (telegramLinkCodes.has(code));
  telegramLinkCodes.set(code, { userId, createdAt: Date.now() });
  return code;
}

// Telegram bot uchun tekshirish eksporti
export function resolveTelegramLinkCode(code, chatId) {
  const entry = telegramLinkCodes.get(code);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > LINK_CODE_EXPIRE) {
    telegramLinkCodes.delete(code);
    return null;
  }
  telegramLinkCodes.delete(code);
  return { userId: entry.userId };
}

export async function register(req, res) {
  try {
    const { firstName, lastName, birthDate, email, password, referralCode, role: requestedRole } = req.body;
    // Faqat ochiq ro'yxatdan o'tishi mumkin bo'lgan rollar
    const allowedSelfRoles = new Set(['student', 'teacher', 'parent']);
    const role = allowedSelfRoles.has(String(requestedRole)) ? String(requestedRole) : 'student';
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email va password talab qilinadi' });
    }
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ message: 'Bu email allaqachon ro‘yxatdan o‘tgan' });
    }
    
    // Name field as fallback for internal logic
    const name = `${firstName || ''} ${lastName || ''}`.trim() || 'Foydalanuvchi';
    
    // Gamification & Referral
    let referredById = null;
    let starterCoins = 0;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
      if (referrer) {
        referredById = referrer.id;
        await prisma.user.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 }, coins: { increment: 50 } },
        });
        starterCoins = 10; // Bonus for being referred
      }
    }
    const newReferralCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Talaba va ota-ona avtomatik tasdiqlanadi; ustozlar admin tasdig'ini kutadi
    const isApproved = role === 'student' || role === 'parent';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        name,
        email: cleanEmail,
        passwordHash,
        role,
        isApproved,
        referralCode: newReferralCode,
        referredById,
        coins: starterCoins,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        role: true,
        birthDate: true,
        coins: true,
        referralCode: true,
      },
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Ro‘yxatdan o‘tishda xato' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email va password talab qilinadi' });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        badges: true,
        rank: true,
        coins: true,
        referralCode: true,
        permissions: true,
        permissionsOverride: true,
        passwordHash: true,
      },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email yoki parol noto‘g‘ri' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const presets = await getRolePermissionPresets(prisma);
    const hydratedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xp: user.xp,
      badges: user.badges,
      rank: user.rank,
      coins: user.coins,
      referralCode: user.referralCode,
      permissions: user.permissions || [],
      permissionsOverride: user.permissionsOverride || false,
      rolePermissions: presets[user.role] || [],
    };
    res.json({
      user: {
        ...hydratedUser,
        effectivePermissions: effectivePermissionsForUser(hydratedUser),
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login xatosi' });
  }
}

export async function getMe(req, res) {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    const presets = await getRolePermissionPresets(prisma);
    const hydratedUser = { ...user, rolePermissions: presets[user.role] || [] };
    res.json({ ...hydratedUser, effectivePermissions: effectivePermissionsForUser(hydratedUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const { firstName, lastName, name, birthDate, nameEmoji, nameEmojiAnim, avatar } = req.body;
    const prisma = getPrisma();
    const data = {};
    if (firstName !== undefined) data.firstName = firstName || null;
    if (lastName !== undefined) data.lastName = lastName || null;
    if (name !== undefined) data.name = String(name).trim() || undefined;
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
    if (avatar !== undefined) data.avatar = avatar || null;
    if (nameEmoji !== undefined) {
      const trimmed = nameEmoji ? String(nameEmoji).slice(0, 12) : null;
      data.nameEmoji = trimmed;
    }
    if (nameEmojiAnim !== undefined) {
      const allowed = new Set([
        'pulse',
        'bounce',
        'spin',
        'wave',
        'float',
        'glow',
        'shake',
        'flip',
        'heartbeat',
        'rainbow',
        'none',
      ]);
      const v = nameEmojiAnim ? String(nameEmojiAnim) : 'pulse';
      data.nameEmojiAnim = allowed.has(v) ? v : 'pulse';
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Joriy va yangi parol kiritilishi shart' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Yangi parol joriy paroldan farq qilishi kerak' });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Joriy parol noto'g'ri" });
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    res.status(500).json({ message: err.message || "Parolni yangilab bo'lmadi" });
  }
}
