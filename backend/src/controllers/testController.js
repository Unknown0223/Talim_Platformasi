import { getPrisma } from '../lib/prisma.js';
import xlsx from 'xlsx';

function sendWorkbook(res, workbook, filename) {
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

async function assertTeacherCourse(prisma, req, courseId) {
  if (!courseId) return null;
  const course = await prisma.course.findUnique({
    where: { id: String(courseId) },
    select: { id: true, subjectId: true, teacherId: true },
  });
  if (!course) {
    const err = new Error('Kurs topilmadi');
    err.status = 404;
    throw err;
  }
  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    const err = new Error('Faqat o‘z kursingiz savollarini boshqarishingiz mumkin');
    err.status = 403;
    throw err;
  }
  return course;
}

function normalizeQuestionRow(row, fallback = {}) {
  const options = [row.optionA, row.optionB, row.optionC, row.optionD].map((v) => String(v || '').trim()).filter(Boolean);
  const correctOption = String(row.correctOption || '').trim().toUpperCase();
  const correctByLetter = { A: options[0], B: options[1], C: options[2], D: options[3] }[correctOption];
  const correctAnswer = String(row.correctAnswer || correctByLetter || '').trim();
  return {
    subjectId: String(row.subjectId || fallback.subjectId || ''),
    courseId: row.courseId || fallback.courseId || null,
    teacherId: fallback.teacherId || null,
    question: String(row.question || '').trim(),
    options,
    correctAnswer,
    level: String(row.level || 'Beginner'),
  };
}

const LEVEL_THRESHOLDS = { Beginner: [0, 40], Intermediate: [41, 70], Advanced: [71, 100] };
function getLevel(percent) {
  if (percent <= 40) return 'Beginner';
  if (percent <= 70) return 'Intermediate';
  return 'Advanced';
}

export async function getTestsBySubject(req, res) {
  try {
    const { subjectId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30;
    const prisma = getPrisma();
    const tests = await prisma.test.findMany({
      where: { subjectId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitTest(req, res) {
  try {
    const userId = req.user.id;
    const { subjectId, answers } = req.body;
    if (!subjectId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'subjectId va answers talab qilinadi' });
    }
    const prisma = getPrisma();
    const questions = await prisma.test.findMany({ where: { subjectId }, orderBy: { createdAt: 'asc' } });
    let correct = 0;
    const total = questions.length;
    for (let i = 0; i < total; i++) {
      const q = questions[i];
      const userAnswer = answers[i];
      if (q.correctAnswer === userAnswer) correct++;
    }
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const level = getLevel(percent);
    await prisma.testResult.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      create: { userId, subjectId, score: percent, totalQuestions: total, level },
      update: { score: percent, totalQuestions: total, level },
    });
    const xpGain = Math.min(50, Math.floor(percent / 2));
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpGain } } });

    // Adaptive Learning: Tavsiyalar tayyorlash

    // Fan bo'yicha darajaga mos darslarni qidirish
    const courses = await prisma.course.findMany({
      where: { subjectId },
      select: { id: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    const courseIds = courses.map((c) => c.id);
    const recommendations = courseIds.length
      ? await prisma.lesson.findMany({
          where: { courseId: { in: courseIds } },
          select: { id: true, title: true, courseId: true },
          take: 3,
          orderBy: { createdAt: 'asc' },
        })
      : [];

    // Ota-onaga bildirishnoma
    const { sendNotification } = await import('../services/telegramBot.js');
    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: userId },
      include: { parent: { select: { telegramId: true } } },
    });
    for (const link of parentLinks) {
      const telegramId = link.parent?.telegramId;
      if (telegramId) {
        const studentName = req.user.name;
        sendNotification(telegramId, `📊 <b>Yangi test natijasi!</b>\nFarzandingiz <b>${studentName}</b> test topshirdi.\nNatija: <b>${percent}%</b> (${level})`);
      }
    }

    res.json({ 
      score: percent, 
      correct, 
      total, 
      level, 
      xpGained: xpGain,
      recommendations 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Guest Functions (DB’ga yozmasdan)

export async function getGuestRandomTests(req, res) {
  try {
    const prisma = getPrisma();
    const tests = await prisma.test.findMany({
      take: 30,
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getGuestSubjectTests(req, res) {
  try {
    const { subjectId } = req.params;
    const requestedCount = Math.min(60, Math.max(10, parseInt(req.query.count, 10) || 30));
    const prisma = getPrisma();
    const [beginners, intermediate, advanced] = await Promise.all([
      prisma.test.findMany({ where: { subjectId, level: 'Beginner' }, take: Math.ceil(requestedCount / 3), orderBy: { createdAt: 'desc' } }),
      prisma.test.findMany({ where: { subjectId, level: 'Intermediate' }, take: Math.ceil(requestedCount / 3), orderBy: { createdAt: 'desc' } }),
      prisma.test.findMany({ where: { subjectId, level: 'Advanced' }, take: Math.ceil(requestedCount / 3), orderBy: { createdAt: 'desc' } }),
    ]);
    let combined = [...beginners, ...intermediate, ...advanced];

    // Top up to requested count if some levels are missing
    if (combined.length < requestedCount) {
      const existingIds = combined.map((q) => q.id);
      const needed = requestedCount - combined.length;
      const extras = await prisma.test.findMany({
        where: { subjectId, id: { notIn: existingIds } },
        take: needed,
        orderBy: { createdAt: 'desc' },
      });
      combined = [...combined, ...extras];
    }
    res.json(pickEvenly(combined, requestedCount));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitGuestTest(req, res) {
  try {
    const { testType, subjectId, questionIds, answers } = req.body;
    
    if (!testType || !Array.isArray(questionIds) || !Array.isArray(answers) || questionIds.length !== answers.length) {
      return res.status(400).json({ message: "Note'g'ri ma'lumot formati" });
    }

    const prisma = getPrisma();
    const questions = await prisma.test.findMany({
      where: { id: { in: questionIds } },
      include: { subject: { select: { id: true, name: true } } },
    });
    let correct = 0;
    const total = questionIds.length;
    let unknownCount = 0;
    const weakMap = {};

    // Map questions by ID for faster lookup
    const qMap = {};
    questions.forEach(q => { qMap[q.id] = q; });

    for (let i = 0; i < total; i++) {
      const qId = questionIds[i];
      const userAnswer = answers[i];
      const q = qMap[qId];
      if (String(userAnswer || '').toLowerCase().includes('bilmayman')) unknownCount++;
      if (q && q.correctAnswer === userAnswer) {
        correct++;
      } else if (q) {
        const key = `${q.subject?.name || 'Fan'} · ${q.level || 'Mavzu'}`;
        weakMap[key] = (weakMap[key] || 0) + 1;
      }
    }

    const percent = total ? Math.round((correct / total) * 100) : 0;
    const level = getLevel(percent);
    const guestName = `Guest`;
    const recommendedCourses = subjectId
      ? await prisma.course.findMany({
          where: { subjectId },
          include: {
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, avatar: true, teacherReviews: { select: { rating: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        })
      : [];
    const recommendedTeachers = recommendedCourses
      .map((c) => {
        const t = c.teacher;
        const reviews = t?.teacherReviews || [];
        const rating = reviews.length ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length : 0;
        return t ? { id: t.id, name: t.name, avatar: t.avatar, rating: Number(rating.toFixed(1)), reviewsCount: reviews.length } : null;
      })
      .filter(Boolean);
    const recommendedTopics = Object.entries(weakMap)
      .map(([topic, count]) => ({ topic, missed: count }))
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 5);

    res.json({ 
      guestName,
      score: percent, 
      correct, 
      total, 
      level,
      unknownCount,
      recommendedCourses,
      recommendedTeachers,
      recommendedTopics,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function pickEvenly(items, n) {
  if (n <= 0) return [];
  if (items.length <= n) return items.slice(0, n);
  // quick shuffle
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

// Placement (diagnostic) — aralash savollar va tavsiyalar (Guest)
export async function getGuestPlacementQuestions(req, res) {
  try {
    const prisma = getPrisma();
    const subjectIdsRaw = String(req.query.subjectIds || '').trim();
    const subjectIds = subjectIdsRaw ? subjectIdsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const requestedCount = Math.min(60, Math.max(10, parseInt(req.query.count, 10) || 20));

    const subjects = await prisma.subject.findMany({
      where: subjectIds.length ? { id: { in: subjectIds } } : {},
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 12,
    });

    if (!subjects.length) return res.json([]);

    const picked = [];
    const perSubject = Math.max(1, Math.ceil(requestedCount / subjects.length));
    const perLevel = Math.max(1, Math.ceil(perSubject / 3));

    for (const s of subjects) {
      const [b, m, a] = await Promise.all([
        prisma.test.findMany({
          where: { subjectId: s.id, level: 'Beginner' },
          take: perLevel,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.test.findMany({
          where: { subjectId: s.id, level: 'Intermediate' },
          take: perLevel,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.test.findMany({
          where: { subjectId: s.id, level: 'Advanced' },
          take: perLevel,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      let combined = [...b, ...m, ...a];

      // If some levels are missing, top-up from any available questions in this subject.
      if (combined.length < perSubject) {
        const existingIds = combined.map((q) => q.id);
        const extras = await prisma.test.findMany({
          where: { subjectId: s.id, id: { notIn: existingIds } },
          take: perSubject - combined.length,
          orderBy: { createdAt: 'desc' },
        });
        combined = [...combined, ...extras];
      }

      // Still not enough? Just take what exists.
      combined = pickEvenly(combined, perSubject);
      combined.forEach((q) => picked.push({ ...q, subject: s }));
    }

    res.json(pickEvenly(picked, requestedCount));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function submitGuestPlacement(req, res) {
  try {
    const { questionIds, answers } = req.body;
    if (!Array.isArray(questionIds) || !Array.isArray(answers) || questionIds.length !== answers.length) {
      return res.status(400).json({ message: "Note'g'ri ma'lumot formati" });
    }
    const prisma = getPrisma();
    const questions = await prisma.test.findMany({
      where: { id: { in: questionIds } },
      include: { subject: { select: { id: true, name: true } } },
    });
    const qMap = {};
    questions.forEach((q) => { qMap[q.id] = q; });

    let correct = 0;
    const bySubject = {};
    let unknownCount = 0;
    const weakMap = {};

    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const q = qMap[qId];
      if (!q) continue;
      const sId = String(q.subjectId);
      if (!bySubject[sId]) bySubject[sId] = { subject: q.subject, correct: 0, total: 0 };
      bySubject[sId].total += 1;
      if (String(answers[i] || '').toLowerCase().includes('bilmayman')) unknownCount++;
      if (q.correctAnswer === answers[i]) {
        correct += 1;
        bySubject[sId].correct += 1;
      } else {
        const key = `${q.subject?.name || 'Fan'} · ${q.level || 'Mavzu'}`;
        weakMap[key] = (weakMap[key] || 0) + 1;
      }
    }

    const total = questionIds.length;
    const score = total ? Math.round((correct / total) * 100) : 0;
    const level = getLevel(score);

    const subjects = Object.values(bySubject).map((x) => ({
      subject: x.subject,
      score: x.total ? Math.round((x.correct / x.total) * 100) : 0,
      correct: x.correct,
      total: x.total,
    })).sort((a, b) => b.score - a.score);

    const best = subjects[0] || null;
    const bestSubjectId = best?.subject?.id || null;

    let recommendedCourses = [];
    let recommendedTeachers = [];
    if (bestSubjectId) {
      // courses by subject + level first, then fallback
      recommendedCourses = await prisma.course.findMany({
        where: { subjectId: bestSubjectId, level },
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      if (!recommendedCourses.length) {
        recommendedCourses = await prisma.course.findMany({
          where: { subjectId: bestSubjectId },
          include: {
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });
      }

      const teacherIds = Array.from(new Set(recommendedCourses.map((c) => c.teacherId).filter(Boolean)));
      if (teacherIds.length) {
        const teachers = await prisma.user.findMany({
          where: { id: { in: teacherIds }, role: 'teacher' },
          select: { id: true, name: true, avatar: true, teacherReviews: { select: { rating: true } } },
        });
        recommendedTeachers = teachers
          .map((t) => {
            const total = t.teacherReviews.length;
            const avg = total ? t.teacherReviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
            return { id: t.id, name: t.name, avatar: t.avatar, rating: Number(avg.toFixed(1)), reviewsCount: total };
          })
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
      }
    }
    const recommendedTopics = Object.entries(weakMap)
      .map(([topic, missed]) => ({ topic, missed }))
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 6);

    res.json({
      score,
      correct,
      total,
      level,
      unknownCount,
      subjects,
      recommendedSubject: best?.subject || null,
      recommendedCourses,
      recommendedTeachers,
      recommendedTopics,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createTest(req, res) {
  try {
    const prisma = getPrisma();
    const course = await assertTeacherCourse(prisma, req, req.body.courseId);
    const subjectId = req.body.subjectId || course?.subjectId;
    const options = Array.isArray(req.body.options) ? req.body.options.map(String).filter(Boolean) : [];
    if (!subjectId || !req.body.question || options.length < 2 || !options.includes(req.body.correctAnswer)) {
      return res.status(400).json({ message: 'subjectId, question, options va correctAnswer noto‘g‘ri' });
    }
    const test = await prisma.test.create({
      data: {
        subjectId,
        courseId: req.body.courseId || null,
        teacherId: req.user.role === 'teacher' ? req.user.id : req.body.teacherId || course?.teacherId || null,
        question: req.body.question,
        options,
        correctAnswer: req.body.correctAnswer,
        level: req.body.level || 'Beginner',
      },
    });
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateTest(req, res) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    const existing = await prisma.test.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Test topilmadi' });
    await assertTeacherCourse(prisma, req, existing.courseId);
    const nextOptions = req.body.options ? req.body.options.map(String).filter(Boolean) : existing.options;
    const nextCorrect = req.body.correctAnswer || existing.correctAnswer;
    if (!nextOptions.includes(nextCorrect)) return res.status(400).json({ message: 'To‘g‘ri javob variantlar ichida bo‘lishi kerak' });
    const test = await prisma.test.update({
      where: { id },
      data: {
        ...(req.body.question ? { question: req.body.question } : {}),
        ...(req.body.options ? { options: req.body.options } : {}),
        ...(req.body.correctAnswer ? { correctAnswer: req.body.correctAnswer } : {}),
        ...(req.body.level ? { level: req.body.level } : {}),
      },
    });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteTest(req, res) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    const existing = await prisma.test.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Test topilmadi' });
    await assertTeacherCourse(prisma, req, existing.courseId);
    await prisma.test.delete({ where: { id } });
    res.json({ message: 'Test muvaffaqiyatli o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listTeacherQuestions(req, res) {
  try {
    const prisma = getPrisma();
    const { courseId } = req.query;
    if (courseId) await assertTeacherCourse(prisma, req, courseId);
    const where = {
      ...(courseId ? { courseId: String(courseId) } : req.user.role === 'teacher' ? { teacherId: req.user.id } : {}),
    };
    const rows = await prisma.test.findMany({
      where,
      include: { course: { select: { id: true, title: true } }, subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(rows);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function downloadTestTemplate(_req, res) {
  const wb = xlsx.utils.book_new();
  const rows = [
    {
      courseId: 'COURSE_ID',
      subjectId: 'SUBJECT_ID',
      level: 'Beginner',
      question: 'Savol matni',
      optionA: 'A varianti',
      optionB: 'B varianti',
      optionC: 'C varianti',
      optionD: 'D varianti',
      correctOption: 'A',
      correctAnswer: '',
    },
  ];
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), 'questions_template');
  sendWorkbook(res, wb, 'test-question-template.xlsx');
}

export async function importTests(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Excel fayl talab qilinadi' });
    const prisma = getPrisma();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const fallbackCourse = req.body.courseId ? await assertTeacherCourse(prisma, req, req.body.courseId) : null;
    let count = 0;
    const errors = [];
    for (const [index, row] of rows.entries()) {
      try {
        const normalized = normalizeQuestionRow(row, {
          courseId: req.body.courseId || row.courseId,
          subjectId: req.body.subjectId || fallbackCourse?.subjectId,
          teacherId: req.user.role === 'teacher' ? req.user.id : null,
        });
        const course = normalized.courseId ? await assertTeacherCourse(prisma, req, normalized.courseId) : null;
        if (course && normalized.subjectId !== course.subjectId) normalized.subjectId = course.subjectId;
        if (!normalized.subjectId || !normalized.question || normalized.options.length < 2 || !normalized.options.includes(normalized.correctAnswer)) {
          throw new Error('Majburiy maydonlar yoki correctAnswer noto‘g‘ri');
        }
        await prisma.test.upsert({
          where: { subjectId_question: { subjectId: normalized.subjectId, question: normalized.question } },
          create: normalized,
          update: {
            courseId: normalized.courseId,
            teacherId: normalized.teacherId,
            options: normalized.options,
            correctAnswer: normalized.correctAnswer,
            level: normalized.level,
          },
        });
        count++;
      } catch (err) {
        errors.push({ row: index + 2, error: err.message });
      }
    }
    res.json({ count, errorCount: errors.length, errors });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function exportTests(req, res) {
  try {
    const prisma = getPrisma();
    const { courseId } = req.query;
    if (courseId) await assertTeacherCourse(prisma, req, courseId);
    const rows = await prisma.test.findMany({
      where: {
        ...(courseId ? { courseId: String(courseId) } : req.user.role === 'teacher' ? { teacherId: req.user.id } : {}),
      },
      include: { course: { select: { title: true } }, subject: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const data = rows.map((q) => ({
      courseId: q.courseId || '',
      course: q.course?.title || '',
      subjectId: q.subjectId,
      subject: q.subject?.name || '',
      level: q.level,
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      correctAnswer: q.correctAnswer,
    }));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), 'questions');
    sendWorkbook(res, wb, 'questions.xlsx');
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}
