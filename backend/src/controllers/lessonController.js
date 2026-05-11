import { getPrisma } from '../lib/prisma.js';

export async function getLessonsByCourse(req, res) {
  try {
    const prisma = getPrisma();
    const lessons = await prisma.lesson.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createLesson(req, res) {
  try {
    const { courseId, title, videoUrl, liveLink, date, type } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ message: 'courseId va title talab qilinadi' });
    }
    const prisma = getPrisma();
    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        videoUrl: videoUrl || '',
        liveLink: liveLink || '',
        type: type || 'video',
      },
    });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
