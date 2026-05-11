import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, updateMe, changePassword, generateTelegramLinkCode } from '../controllers/authController.js';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import { initBot } from '../services/telegramBot.js';
import { getPrisma } from '../lib/prisma.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 5, // 5 urinish
  message: 'Juda ko\'p urinish. Iltimos, 15 daqiqadan so\'ng qayta urinib ko\'ring.',
  standardHeaders: true,
  legacyHeaders: false,
});

const linkCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 3, // 3 urinish
  message: 'Juda ko\'p urinish. 1 soatdan so\'ng qayta urinib ko\'ring.',
  standardHeaders: true,
  legacyHeaders: false,
});

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
router.post('/register', isProd ? loginLimiter : (req, _res, next) => next(), register);
router.post('/login', isProd ? loginLimiter : (req, _res, next) => next(), login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.put('/me/password', authMiddleware, changePassword);

// Telegram link code generatsiyasi
router.post('/telegram/link', authMiddleware, linkCodeLimiter, async (req, res) => {
  try {
    const code = generateTelegramLinkCode(req.user.id);
    if (!code) return res.status(400).json({ message: 'Kod generatsiyalab bo\'lmadi' });
    res.json({ code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Telegram bot /start kod bilan kelganda ishlaydi
router.post('/telegram/webhook/bind', async (req, res) => {
  try {
    const { code, chatId, username } = req.body;
    if (!code || !chatId) {
      return res.status(400).json({ message: 'Kod va chatId talab qilinadi' });
    }

    // Telegram bot serverda kod orqali tekshirish
    const { resolveTelegramLinkCode } = await import('../controllers/authController.js');
    const resolved = resolveTelegramLinkCode(code, chatId);
    if (!resolved) return res.status(404).json({ message: 'Kod topilmadi yoki muddati tugagan' });

    // Bu foydalanuvchini topib telegramId ni bog'lash
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: resolved.userId } });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    // Tekshirish: bu telegramId boshqa foydalanuvchiga tegishlimi
    const existing = await prisma.user.findFirst({
      where: { telegramId: String(chatId), NOT: { id: resolved.userId } },
    });
    if (existing) {
      // Avvalgi foydalanuvchidan unlink qilish
      await prisma.user.update({ where: { id: existing.id }, data: { telegramId: null } });
    }

    await prisma.user.update({ where: { id: user.id }, data: { telegramId: String(chatId) } });

    // Botga bildirishnoma yuborish
    try {
      const { sendNotification } = await import('../services/telegramBot.js');
      await sendNotification(String(chatId), `Hisobingiz <b>${user.name}</b> sifatida muvaffaqiyatli bog'landi!`);
    } catch (_) {}

    res.json({ message: 'Hisob muvaffaqiyatli bog\'landi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bot init qilish (admin boshqaruvi uchun)
router.post('/admin/telegram/init', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await initBot();
    res.json({ message: 'Telegram bot qayta ishga tushirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
