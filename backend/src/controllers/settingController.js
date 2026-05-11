import { getPrisma } from '../lib/prisma.js';

export async function getSettings(req, res) {
  try {
    const prisma = getPrisma();
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getPublicSettings(_req, res) {
  try {
    const prisma = getPrisma();
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['site_name', 'brand_settings'] } },
    });
    const data = Object.fromEntries(rows.map((s) => [s.key, s.value]));
    res.json({
      siteName: data.site_name || 'Talim',
      brand: data.brand_settings || {
        name: data.site_name || 'Talim',
        subtitle: 'Learn Platform',
        logoText: 'T',
        primaryColor: '#5a8aff',
        accentColor: '#8b5cf6',
        textStyle: 'normal',
        animationEffect: 'none',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;
    const prisma = getPrisma();
    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value: value ?? null },
      update: { value: value ?? null },
    });
    if (key === 'telegram_token') {
      import('../services/telegramBot.js').then(({ reinitBot }) => reinitBot());
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getSettingByKey(req, res) {
  try {
    const prisma = getPrisma();
    const setting = await prisma.setting.findUnique({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ message: 'Sozlama topilmadi' });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
