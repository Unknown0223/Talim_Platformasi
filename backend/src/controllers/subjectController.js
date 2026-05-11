import { getPrisma } from '../lib/prisma.js';

export async function getSubjects(req, res) {
  try {
    const prisma = getPrisma();
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
