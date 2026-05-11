import { getPrisma } from '../lib/prisma.js';

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Rasm yuklanmadi' });
    
    const avatarPath = `/uploads/${req.file.filename}`;
    const prisma = getPrisma();
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatarPath } });
    
    res.json({ avatar: avatarPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function uploadBrandingAsset(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Rasm yuklanmadi' });
    
    const assetPath = `/uploads/${req.file.filename}`;
    // Key-ni query orqali olamiz (logo, hero1, etc.)
    const { key } = req.query;
    if (key) {
      const prisma = getPrisma();
      await prisma.setting.upsert({
        where: { key: String(key) },
        create: { key: String(key), value: assetPath },
        update: { value: assetPath },
      });
    }
    
    res.json({ path: assetPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Ustoz profil cover rasm (YouTube uslubida)
export async function uploadTeacherCover(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Rasm yuklanmadi' });
    const coverPath = `/uploads/${req.file.filename}`;
    const prisma = getPrisma();
    // any logged-in user can set their own cover; UI will show for teachers primarily
    await prisma.user.update({ where: { id: req.user.id }, data: { coverImage: coverPath } });
    res.json({ coverImage: coverPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
