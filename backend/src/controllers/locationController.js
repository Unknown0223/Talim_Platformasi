import { getPrisma } from '../lib/prisma.js';

export async function getLocations(req, res) {
  try {
    const prisma = getPrisma();
    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createLocation(req, res) {
  try {
    const { name, address, lat, lng } = req.body;
    if (!name || !address || lat == null || lng == null) {
      return res.status(400).json({ message: 'name, address, lat, lng talab qilinadi' });
    }
    const prisma = getPrisma();
    const location = await prisma.location.create({ data: { name, address, lat: Number(lat), lng: Number(lng) } });
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
