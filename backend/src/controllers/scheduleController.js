import { getPrisma } from '../lib/prisma.js';

export async function getSchedules(req, res) {
  try {
    const { courseId, locationId } = req.query;
    const prisma = getPrisma();
    const schedules = await prisma.schedule.findMany({
      where: {
        ...(courseId ? { courseId: String(courseId) } : {}),
        ...(locationId ? { locationId: String(locationId) } : {}),
      },
      include: {
        course: true,
        location: true,
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createSchedule(req, res) {
  try {
    const { courseId, locationId, date, time, topic } = req.body;
    const teacherId = req.user.id;
    if (!courseId || !locationId || !date || !time) {
      return res.status(400).json({ message: 'courseId, locationId, date, time talab qilinadi' });
    }
    const prisma = getPrisma();
    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        locationId,
        teacherId,
        date: new Date(date),
        time,
        topic: topic || null,
      },
      include: {
        course: true,
        location: true,
        teacher: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
