import bcrypt from 'bcryptjs';
import { getPrisma } from '../lib/prisma.js';
import xlsx from 'xlsx';

export const importData = async (req, res) => {
  try {
    const type = req.params.type || req.body.type;
    if (!req.file) return res.status(400).json({ message: 'Fayl yuklanmadi' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let count = 0;
    const errors = [];
    const prisma = getPrisma();

    for (const item of data) {
      try {
        switch (type) {
          case 'student':
          case 'teacher':
            await prisma.user.create({
              data: {
                name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'User',
                email: item.email,
                passwordHash: await bcrypt.hash(item.password || 'password123', 12),
                role: type,
                firstName: item.firstName || null,
                lastName: item.lastName || null,
                studentId: item.studentId || null,
              },
            });
            break;
          case 'subject':
            await prisma.subject.create({ data: { name: item.name, description: item.description || null } });
            break;
          case 'course':
            await prisma.course.create({
              data: {
                title: item.title,
                subjectId: item.subjectId,
                teacherId: item.teacherId,
                level: item.level || 'Beginner',
                type: item.type || 'online',
                price: Number(item.price || 0),
                description: item.description || '',
              },
            });
            break;
          case 'book':
            await prisma.book.create({
              data: {
                title: item.title,
                author: item.author || null,
                description: item.description || null,
                category: item.category || null,
                fileUrl: item.fileUrl || null,
              },
            });
            break;
          default:
            throw new Error('Noma\'lum tur');
        }
        count++;
      } catch (err) {
        errors.push({ item: item.name || item.title || 'Noma\'lum', error: err.message });
      }
    }

    res.json({ message: `${count} ta ma'lumot muvaffaqiyatli yuklandi`, errorCount: errors.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function sendWorkbook(res, rows, filename, sheet = 'data') {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rows), sheet);
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function exportData(req, res) {
  try {
    const { type } = req.params;
    const prisma = getPrisma();
    let rows = [];
    switch (type) {
      case 'students':
        rows = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true, name: true, email: true, studentId: true, createdAt: true } });
        break;
      case 'teachers':
        rows = await prisma.user.findMany({ where: { role: 'teacher' }, select: { id: true, name: true, email: true, balance: true, isApproved: true, createdAt: true } });
        break;
      case 'courses':
        rows = (await prisma.course.findMany({ include: { subject: true, teacher: { select: { name: true, email: true } } } })).map((c) => ({
          id: c.id,
          title: c.title,
          subject: c.subject?.name,
          teacher: c.teacher?.name,
          teacherEmail: c.teacher?.email,
          level: c.level,
          type: c.type,
          price: c.price,
        }));
        break;
      case 'payments':
        rows = (await prisma.payment.findMany({ include: { user: true, course: true }, orderBy: { createdAt: 'desc' } })).map((p) => ({
          id: p.id,
          student: p.user?.name,
          email: p.user?.email,
          course: p.course?.title,
          amount: p.amount,
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
        }));
        break;
      case 'enrollments':
        rows = (await prisma.enrollment.findMany({ include: { user: true, course: true }, orderBy: { createdAt: 'desc' } })).map((e) => ({
          id: e.id,
          student: e.user?.name,
          email: e.user?.email,
          course: e.course?.title,
          status: e.status,
          createdAt: e.createdAt,
        }));
        break;
      case 'questions':
        rows = (await prisma.test.findMany({ include: { subject: true, course: true }, orderBy: { createdAt: 'desc' } })).map((q) => ({
          id: q.id,
          course: q.course?.title,
          subject: q.subject?.name,
          level: q.level,
          question: q.question,
          correctAnswer: q.correctAnswer,
        }));
        break;
      case 'battle-results':
        rows = (await prisma.battle.findMany({ include: { course: true, teacher: true }, orderBy: { createdAt: 'desc' } })).flatMap((b) => {
          const players = Array.isArray(b.meta?.players) ? b.meta.players : [];
          return players.map((p) => ({
            roomCode: b.meta?.roomCode,
            title: b.title,
            course: b.course?.title,
            teacher: b.teacher?.name,
            student: p.name,
            score: p.score,
            submittedAt: p.submittedAt,
          }));
        });
        break;
      default:
        return res.status(400).json({ message: 'Noma’lum export turi' });
    }
    sendWorkbook(res, rows, `${type}.xlsx`, type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
