import TelegramBot from 'node-telegram-bot-api';
import { getPrisma } from '../lib/prisma.js';

let bot = null;

export async function initBot() {
  try {
    const prisma = getPrisma();
    const tokenSetting = await prisma.setting.findUnique({ where: { key: 'telegram_token' } });
    const token = tokenSetting?.value?.token || tokenSetting?.value || null;
    if (!token) {
      console.log('Telegram Bot Token topilmadi, bot ishga tushmadi.');
      return;
    }

    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram Bot muvaffaqiyatli ishga tushdi.');

    bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const code = match[1].toUpperCase().trim();

      try {
        const { resolveTelegramLinkCode } = await import('../controllers/authController.js');
        const resolved = resolveTelegramLinkCode(code);
        if (!resolved) {
          bot.sendMessage(chatId, 'Kod topilmadi yoki muddati tugagan. Platformadan yangi kod oling.');
          return;
        }

        const user = await prisma.user.findUnique({ where: { id: resolved.userId } });
        if (!user) {
          bot.sendMessage(chatId, 'Xatolik: Foydalanuvchi topilmadi.');
          return;
        }

        // Bu telegramId boshqaga tegishli bo'lsa unlink
        const existing = await prisma.user.findFirst({
          where: { telegramId: String(chatId), NOT: { id: resolved.userId } },
        });
        if (existing) {
          await prisma.user.update({ where: { id: existing.id }, data: { telegramId: null } });
        }

        await prisma.user.update({ where: { id: user.id }, data: { telegramId: String(chatId) } });
        bot.sendMessage(chatId, `Assalomu alaykum, ${user.name}! Hisobingiz muvaffaqiyatli bog'landi.`);
      } catch (err) {
        bot.sendMessage(chatId, 'Xatolik yuz berdi. Qayta urinib ko\'ring.');
      }
    });

    bot.on('message', (msg) => {
      if (msg.text === '/start') {
        bot.sendMessage(msg.chat.id, 'Assalomu alaykum! Hisobingizni bog\'lash uchun saytdagi maxsus havoladan foydalaning.');
      }
    });

    // NOTE: Interactive notification confirmation is disabled in Postgres migration for now.

  } catch (err) {
    console.error('Botni ishga tushirishda xato:', err.message);
  }
}

export async function stopBot() {
  if (bot) {
    await bot.stopPolling();
    bot = null;
    console.log('Telegram Bot to\'xtatildi.');
  }
}

export async function reinitBot() {
  await stopBot();
  await initBot();
}

export async function sendNotification(telegramId, message) {
  if (!bot || !telegramId) return;
  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Xabar yuborishda xato:', err.message);
  }
}

export async function checkSubscription(chatId) {
  if (!bot) return true;
  try {
    const prisma = getPrisma();
    const channelIdSetting = await prisma.setting.findUnique({ where: { key: 'telegram_channel_id' } });
    const channelId = channelIdSetting?.value?.channelId || channelIdSetting?.value || null;
    if (!channelId) return true;

    const member = await bot.getChatMember(channelId, chatId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (err) {
    console.error('Obunani tekshirishda xato:', err.message);
    return false;
  }
}

export async function broadcast(role, message) {
  if (!bot) return 0;
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: role === 'all' ? { telegramId: { not: null } } : { role, telegramId: { not: null } },
      select: { id: true, telegramId: true },
    });

    let count = 0;
    for (const u of users) {
      await sendNotification(u.telegramId, message);
      count++;
    }
    return count;
  } catch (err) {
    console.error('Broadcast xatosi:', err.message);
    throw err;
  }
}

export async function sendInteractiveNotification(recipientId, text, type = 'broadcast', relatedId = null) {
  // disabled
  return null;
}
