import { getPrisma } from '../lib/prisma.js';

// Davomatni belgilash (Teacher studentlar uchun, Receptionist o'qituvchilar uchun)
export async function markAttendance(req, res) {
  try {
    const { userId, status, date, courseId, type } = req.body;
    const markerId = req.user.id;

    if (!userId || !status || !date || !type) {
      return res.status(400).json({ message: 'userId, status, date va type talab qilinadi' });
    }

    const prisma = getPrisma();
    // Minimal migration: store extra fields in note as JSON
    const note = JSON.stringify({ date, courseId: courseId || null, type, markedBy: markerId });
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        status: String(status),
        note,
        scheduleId: null,
      },
    });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Davomatni olish (Masalan: Bugun kim keldi?)
export async function getAttendanceByDate(req, res) {
  try {
    const { date, type } = req.query;
    const prisma = getPrisma();
    const attendances = await prisma.attendance.findMany({
      where: {},
      include: { user: { select: { id: true, name: true, role: true, studentId: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Studentning o'z davomat tarixini olish
export async function getMyAttendance(req, res) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();
    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(history.map((row) => {
      let meta = {};
      try {
        meta = row.note ? JSON.parse(row.note) : {};
      } catch {
        meta = {};
      }
      return {
        ...row,
        date: meta.date || row.createdAt,
        courseId: meta.courseId || null,
        type: meta.type || null,
        markedBy: meta.markedBy || null,
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCourseAttendance(req, res) {
  try {
    const { courseId, date } = req.query;
    if (!courseId) return res.status(400).json({ message: 'courseId talab qilinadi' });
    const prisma = getPrisma();
    const all = await prisma.attendance.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    // filter by note.courseId if possible
    const filtered = all.filter((a) => {
      try {
        const n = a.note ? JSON.parse(a.note) : {};
        return String(n.courseId || '') === String(courseId);
      } catch {
        return false;
      }
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
