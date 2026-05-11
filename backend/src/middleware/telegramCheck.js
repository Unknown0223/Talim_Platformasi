import { checkSubscription } from '../services/telegramBot.js';
import { getPrisma } from '../lib/prisma.js';

export const requireTelegramSubscription = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { telegramId: true } });

    if (!user.telegramId) {
      return res.status(403).json({
        message: 'Telegram botni bog\'lash majburiy. Iltimos, dashboard sahifasida botni bog\'lang.',
        errorCode: 'TELEGRAM_NOT_LINKED'
      });
    }

    const isSubscribed = await checkSubscription(user.telegramId);
    if (!isSubscribed) {
      return res.status(403).json({
        message: 'Rasmiy telegram kanalimizga obuna bo\'lishingiz shart. Iltimos, obuna bo\'ling va qayta urinib ko\'ring.',
        errorCode: 'TELEGRAM_NOT_SUBSCRIBED'
      });
    }

    next();
  } catch (err) {
    console.error('Telegram check error:', err);
    return res.status(503).json({
      message: 'Telegram xizmatiga ulanishda xatolik. Iltimos, keyinroq qayta urinib ko\'ring.',
      errorCode: 'TELEGRAM_CHECK_ERROR'
    });
  }
};
